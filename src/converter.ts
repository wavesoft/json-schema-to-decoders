import type {
  AllOfLikeSchema,
  AnyOfLikeSchema,
  AnySchema,
  ArrayLike,
  BooleanSchema,
  ConstSchema,
  EnumSchema,
  NullSchema,
  NumericSchema,
  ObjectSchema,
  OneOfLikeSchema,
  RefSchema,
  Schema,
  SchemaDef,
  StringSchema,
  StringSchemaDef,
} from "./types";
import type * as LibDecoders from "./decoders";
import deepMerge from "ts-deepmerge";
import { UnsupportedError, RequiredConfigurationError } from "./errors";

export interface ConverterOptions {
  /**
   * An optional namespace where to look for decoder functions into
   */
  nsPrefix?: string;

  /**
   * An optional namespace where to look for extra decoder library functions
   * exposed by the `json-schema-to-decoders` package.
   *
   * If not specified, all of the avanced decoders would be disabled
   */
  nsLib?: string;

  /**
   * An optional function to call when a $ref is encountered.
   * The returned value will replace the contents of that ref.
   */
  resolveRefPointer?: (name: string) => string;

  /**
   * An optional function to call when a $ref is encountered
   * and the schema of it is required.
   */
  resolveRefSchema?: (name: string) => Schema;
}

/**
 * The run-time context throughout the conversion process
 */
interface ConvertContext {
  /**
   * The options given
   */
  options: ConverterOptions;

  /**
   * Library functions that were consumed
   */
  libUsage: Record<keyof typeof LibDecoders, number>;

  /**
   * The current path in the schema
   */
  path: string[];
}

const isValidName = (str: string) => /^(?!\d)[\w$]+$/.test(str);

function escapeName(str: string) {
  if (!isValidName(str)) return `"${str.replace(/"/g, '\\"')}"`;
  return str;
}

function indentLines(lines: string[], indent: number): string[] {
  const prefix = Array(indent).fill(" ").join("");
  return lines.map((l) => prefix + l);
}

function wrapLines(
  prefix: string,
  lines: string[],
  suffix: string,
  linePrefix: string = ""
): string[] {
  if (lines.length === 1) {
    return [prefix + lines[0] + suffix];
  } else {
    const ret = [prefix + lines[0]];
    for (let i = 1; i < lines.length; i++) {
      const lineSuffix = i === lines.length - 1 ? suffix : "";
      ret.push(linePrefix + lines[i] + lineSuffix);
    }
    return ret;
  }
}

function getSchemaComment(schema: Schema): string[] {
  if (typeof schema !== "object") return [];
  const lines: string[] = [];
  if ("title" in schema && schema.title) {
    lines.push(`[${schema.title}]`);
  }
  if ("description" in schema && schema.description) {
    const desc = `Description: ${schema.description}`;
    lines.push(...desc.split("\n"));
  }
  if ("example" in schema && schema.example) {
    lines.push(`Example: ${schema.example}`);
  }
  if ("examples" in schema && schema.examples) {
    for (const example of schema.examples ?? []) {
      lines.push(`Example: ${example}`);
    }
  }
  if (!lines.length) return [];
  return wrapLines("/* ", lines, " */", "   ");
}

function convertObject(obj: ObjectSchema, opt: ConvertContext): string[] {
  const { nsPrefix, nsLib } = opt.options;
  const chain: string[][] = [];

  // Non-structured objects require string properties but don't validate the values
  if (typeof obj === "string") {
    return [`${nsPrefix}dict(${nsPrefix}unknown)`];
  }

  // Check if we should perform exact matching
  const exactProps = obj.additionalProperties === false && !obj.patternProperties;

  // Create the base decoder for validating either well-known properties or a gneric
  // dict type, either strictly or loosely. We will then follow-up chaining additional
  // validators.
  const required = obj.required ?? [];
  const props = obj.properties ?? {};
  const keys = Object.keys(props);
  keys.sort();
  if (keys.length) {
    const propLines: string[] = [];
    for (const name of keys) {
      const schema = props[name]!;
      const propOpt = {
        ...opt,
        path: opt.path.concat(name),
      };
      propLines.push(...getSchemaComment(schema));
      if (required.includes(name)) {
        propLines.push(...wrapLines(`${escapeName(name)}: `, convertUnknown(schema, propOpt), ","));
      } else {
        propLines.push(
          ...wrapLines(
            `${escapeName(name)}: ${nsPrefix}optional(`,
            convertUnknown(schema, propOpt),
            "),"
          )
        );
      }
    }
    chain.push([
      `${nsPrefix}${exactProps ? "exact" : "inexact"}({`,
      ...indentLines(propLines, 2),
      `})`,
    ]);
  } else {
    // If there are no validation cases included, return the default validation
    chain.push([`${nsPrefix}dict(${nsPrefix}unknown)`]);
  }

  // If we have pattern properties, add a custom rejection function for that
  if (obj.patternProperties != null && Object.keys(obj.patternProperties).length > 0) {
    const rejectFn: string[] = [];
    // First generate the decoders that can match the individual patterns
    Object.entries(obj.patternProperties).forEach(([key, dec], idx) => {
      const schemaLines = convertUnknown(dec, {
        ...opt,
        path: opt.path.concat("#patternProperties", key),
      });
      rejectFn.push(...wrapLines(`const dec_${idx} = `, indentLines(schemaLines, 2), `;`));
    });

    // Then generate the property checkers using regexp
    rejectFn.push(`for (const key in obj) {`);
    Object.keys(obj.patternProperties).forEach((key, idx) => {
      const prefix = idx > 0 ? `} else if ` : `if `;
      rejectFn.push(
        `  ${prefix} (new RegExp(${JSON.stringify(key)}).exec(key)) {`,
        `    if (!dec_${idx}.decode(obj[key]).ok) {`,
        `      return \`Invalid property "\${key}"\`;`,
        `    }`
      );
    });
    rejectFn.push(`  }`);
    rejectFn.push(`}`);
    rejectFn.push(`return null;`);

    // Include the function
    chain.push([`reject((obj) => {`, ...indentLines(rejectFn, 2), `})`]);
  }

  // If we have additional properties specified, chain with additional validator
  if (obj.additionalProperties != null && typeof obj.additionalProperties === "object") {
    const schemaLines = convertUnknown(obj.additionalProperties, {
      ...opt,
      path: opt.path.concat("#additionalProperties"),
    });
    const rejectFn: string[] = [];
    rejectFn.push(...wrapLines(`const dec = `, indentLines(schemaLines, 2), `;`));
    rejectFn.push(`const known = ${JSON.stringify(keys)};`);
    rejectFn.push(
      `for (const key in obj) {`,
      `  if (!known.includes(key)) {`,
      `    if (!dec.decode(obj[key]).ok) {`,
      `      return \`Invalid property "\${key}"\`;`,
      `    }`,
      `  }`,
      `}`,
      `return null;`
    );

    // Include the function
    chain.push([`reject((obj) => {`, ...indentLines(rejectFn, 2), `})`]);
  }

  // Add propertyNames validator
  if (obj.propertyNames != null) {
    const rejectFn: string[] = [];
    rejectFn.push(
      `const match = new RegExp(${JSON.stringify(obj.propertyNames.pattern)});`,
      `for (const key in obj) {`,
      `  if (!match.exec(key)) {`,
      `    return \`Invalid property name "\${key}"\`;`,
      `  }`,
      `}`,
      `return null;`
    );

    // Include the function
    chain.push([`reject((obj) => {`, ...indentLines(rejectFn, 2), `})`]);
  }

  // Apply optional property validators
  if (obj.minProperties != null) {
    chain.push([
      `refine((n) => Object.keys(n).length >= ${obj.minProperties}, "Must contain at least ${obj.minProperties} items")`,
    ]);
  }
  if (obj.maxProperties != null) {
    chain.push([
      `refine((n) => Object.keys(n).length <= ${obj.maxProperties}, "Must contain at most ${obj.maxProperties} items")`,
    ]);
  }

  return ([] as string[]).concat(
    ...chain.map((c, i) => (i > 0 ? indentLines(wrapLines(".", c, ""), 2) : c))
  );
}

function convertArray(obj: ArrayLike, opt: ConvertContext): string[] {
  const { nsPrefix } = opt.options;
  const chain: string[][] = [];
  if (typeof obj === "string") {
    return wrapLines(`${nsPrefix}array(`, convertUnknown("any", opt), ")");
  }

  // If we have a prefix, we should create a tuple validator
  if (obj.prefixItems != null) {
    const prefixCases: string[][] = [];
    obj.prefixItems.forEach((s, idx) => {
      prefixCases.push(
        wrapLines(
          "",
          convertUnknown(s, {
            ...opt,
            path: opt.path.concat(`#prefixItems[${idx}}`),
          }),
          ","
        )
      );
    });

    // Since the JSONSchema spec supports *UP TO* the given number of items,
    // we cannot implement this as a single tuple. So we must create N tuples,
    // one for each prefix combination and join them with `either`
    const eitherLines: string[] = [];
    for (let i = 0; i <= prefixCases.length; ++i) {
      const tuple = ([] as string[]).concat(...prefixCases.slice(0, i));
      eitherLines.push(`${nsPrefix}tuple(`, ...indentLines(tuple, 2), `),`);
    }

    // TODO: Research how can we combine tuple with array, currently
    //       this is not supported.
    if (obj.items != null) {
      throw new UnsupportedError(
        opt.path.concat("#items"),
        "Combining 'items' with 'prefixItems' is not supported"
      );
    }
    chain.push([`${nsPrefix}either(`, ...indentLines(eitherLines, 2), ")"]);
  } else {
    // Otherwise generate the standard array schema
    const base = wrapLines(`${nsPrefix}array(`, convertUnknown(obj.items ?? "any", opt), ")");
    chain.push(base);
  }

  // Validate length
  if (obj.minItems != null) {
    chain.push([
      `refine((n) => n.length >= ${obj.minItems}, "Must contain at least ${obj.minItems} items")`,
    ]);
  }
  if (obj.maxItems != null) {
    chain.push([
      `refine((n) => n.length <= ${obj.maxItems}, "Must contain at most ${obj.maxItems} items")`,
    ]);
  }

  // Validate uniqueness
  if (obj.uniqueItems != null) {
    chain.push([
      `refine((n) => {`,
      `  const unique = new Set();`,
      `  return n.every((v) => {`,
      `    if (unique.has(v)) return false;`,
      `    unique.add(v);`,
      `    return true;`,
      `  })`,
      `}, "Must only contain unique items")`,
    ]);
  }

  return ([] as string[]).concat(
    ...chain.map((c, i) => (i > 0 ? indentLines(wrapLines(".", c, ""), 2) : c))
  );
}

function convertString(obj: StringSchema, opt: ConvertContext): string[] {
  const { nsPrefix, nsLib } = opt.options;
  const def: StringSchemaDef = typeof obj === "string" ? { type: "string" } : obj;
  if (def.pattern) {
    return [`${nsPrefix}regex(/${def.pattern}/)`];
  }
  if (def.format) {
    switch (def.format) {
      case "date-time":
        return [`${nsPrefix}iso8601`];
      case "hostname":
        // Borrowed from
        // https://github.com/justinrainbow/json-schema/pull/287/files#diff-44020f0c0690a2a4c1c446e97185986c31b19374b4a99f4b0970c5df36279067R176
        return [
          `${nsPrefix}regex(/^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/i)`,
        ];
      case "email":
        return [`${nsPrefix}email`];
      case "uri":
        return [`${nsPrefix}url`];
      case "uuid":
        return [`${nsPrefix}uuid`];
    }
  }

  const chain = [`${nsPrefix}string`];
  if (def.minLength != null) {
    chain.push(
      `refine((n) => n.length >= ${def.minLength}, "Must be longer than ${def.minLength} characters")`
    );
  }
  if (def.maxLength != null) {
    chain.push(
      `refine((n) => n.length <= ${def.maxLength}, "Must be shorter than ${def.maxLength} characters")`
    );
  }
  return [chain.join(".")];
}

function convertAnyOf(obj: AnyOfLikeSchema, opt: ConvertContext): string[] {
  const { nsPrefix } = opt.options;
  const ret: string[] = [`${nsPrefix}either(`];
  const schemaLines: string[] = [];
  const types: SchemaDef[] = Array.isArray(obj)
    ? obj.map((s) => expandSchema(s, opt))
    : getComposition("anyOf", obj, opt);
  for (const schema of types) {
    schemaLines.push(...wrapLines("", convertUnknown(schema, opt), ","));
  }
  ret.push(...indentLines(schemaLines, 2));
  ret.push(")");
  return ret;
}

function convertOneOf(obj: OneOfLikeSchema, opt: ConvertContext): string[] {
  const { oneOf, ...rest } = obj;

  // TODO: Implement this properly instead of poly-filling this with `anyOf`
  return convertAnyOf(
    {
      anyOf: oneOf,
      ...rest,
    },
    opt
  );
}

/**
 * Expands a generic schema definition (that includes strings or arays in 'type')
 * into an object-only schema definition
 */
function expandSchema(type: Partial<Schema>, opt: ConvertContext): Partial<SchemaDef> {
  if (typeof type === "string") {
    return { type: type };
  } else if (Array.isArray(type)) {
    return {
      oneOf: type as Schema[],
    };
  } else if ("$ref" in type && type.$ref) {
    if (!opt.options.resolveRefSchema) {
      throw new RequiredConfigurationError(opt.path, "resolveRefSchema");
    }
    return expandSchema(opt.options.resolveRefSchema(type.$ref), {
      ...opt,
      path: opt.path.concat("$ref"),
    });
  } else {
    return type as SchemaDef;
  }
}

/**
 * Extracts a schema composition definition, enriching it with the default
 * schema properties of the base type
 */
function getComposition(
  prop: "allOf" | "oneOf" | "anyOf",
  type: SchemaDef,
  opt: ConvertContext
): SchemaDef[] {
  if (prop in type) {
    // Extract the root schema parameters
    let { [prop]: _, ...rest } = type;

    // Extract properties
    return type[prop]!.map((schema) => {
      return deepMerge(rest, expandSchema(schema, opt));
    });
  }

  return [];
}

/**
 * Combines an array of 'allOf' schemas into a single schema that
 * can be uniformly validated.
 */
function combineAllOf(type: AllOfLikeSchema, opt: ConvertContext): SchemaDef {
  const allOf = getComposition("allOf", type, opt);
  let ret: SchemaDef = { type: "object" };
  for (const schema of allOf) {
    ret = deepMerge(ret, schema);
  }
  return ret;
}

function convertAllOf(obj: AllOfLikeSchema, opt: ConvertContext): string[] {
  // Combine all schema properties
  const schema = combineAllOf(obj, {
    ...opt,
    path: opt.path.concat(`#allOf`),
  });

  return convertUnknown(schema, opt);
}

function convertNumber(obj: NumericSchema, opt: ConvertContext): string[] {
  const { nsPrefix, nsLib } = opt.options;
  const chain: string[] = [];

  // Start the validation chain with the number type (integer or float-point)
  if (
    (typeof obj === "string" && obj === "integer") ||
    (typeof obj === "object" && obj.type === "integer")
  ) {
    chain.push(`${nsPrefix}integer`);
  } else {
    chain.push(`${nsPrefix}number`);
  }

  // In case of full specifications, include additional validators
  if (typeof obj === "object") {
    // Include 'multipleOf' validator
    if (obj.multipleOf != null) {
      chain.push(
        `refine((n) => n % ${obj.multipleOf} === 0, "Must be multiple of ${obj.multipleOf}")`
      );
    }
    // Include 'minimum' validator
    if (obj.exclusiveMinimum != null) {
      chain.push(`refine((n) => n > ${obj.exclusiveMinimum}, "Must be > ${obj.exclusiveMinimum}")`);
    } else if (obj.minimum != null) {
      chain.push(`refine((n) => n >= ${obj.minimum}, "Must be >= ${obj.minimum}")`);
    }
    // Include 'maximum' validator
    if (obj.exclusiveMaximum != null) {
      chain.push(`refine((n) => n < ${obj.exclusiveMaximum}, "Must be < ${obj.exclusiveMaximum}")`);
    } else if (obj.maximum != null) {
      chain.push(`refine((n) => n <= ${obj.maximum}, "Must be <= ${obj.maximum}")`);
    }
  }

  // Create a decoder chain
  return [chain.join(".")];
}

function convertBoolean(obj: BooleanSchema, opt: ConvertContext): string[] {
  const { nsPrefix } = opt.options;
  return [`${nsPrefix}boolean`];
}

function convertNull(obj: NullSchema, opt: ConvertContext): string[] {
  const { nsPrefix } = opt.options;
  return [`${nsPrefix}null_`];
}

function covnertEnum(obj: EnumSchema, opt: ConvertContext): string[] {
  const { nsPrefix } = opt.options;
  const options = obj.enum ?? [];
  if (options.length < 3) {
    return [`${nsPrefix}oneOf(${JSON.stringify(obj.enum)})`];
  } else {
    const lines = options.map((o) => JSON.stringify(o) + ",");
    return [`${nsPrefix}oneOf([`, ...indentLines(lines, 2), `])`];
  }
}

function convertConst(obj: ConstSchema, opt: ConvertContext): string[] {
  const { nsPrefix } = opt.options;
  return [`${nsPrefix}constant(${JSON.stringify(obj.const)})`];
}

function isObject(type: Schema): type is ObjectSchema {
  if (typeof type === "string") return type === "object";
  // The schema is implicitly an object
  if (!("type" in type)) return true;
  return type.type === "object";
}

function isArray(type: Schema): type is ArrayLike {
  if (typeof type === "string") return type === "array";
  if (typeof type === "string") return false;
  if (!("type" in type)) return false;
  return type.type === "array";
}

function isString(type: Schema): type is StringSchema {
  if (typeof type === "string") return type === "string";
  if (!("type" in type)) return false;
  return type.type === "string";
}

function isNumeric(type: Schema): type is NumericSchema {
  if (typeof type === "string") return type === "integer" || type === "number";
  if (!("type" in type)) return false;
  return type.type === "integer" || type.type === "number";
}

function isBoolean(type: Schema): type is BooleanSchema {
  if (typeof type === "string") return type === "boolean";
  if (!("type" in type)) return false;
  return type.type === "boolean";
}

function isNull(type: Schema): type is NullSchema {
  if (typeof type === "string") return type === "null";
  if (!("type" in type)) return false;
  return type.type === "null";
}

function isAny(type: Schema): type is AnySchema {
  if (typeof type === "string" && type === "any") return true;
  if (typeof type === "object" && "type" in type && type.type === "any") return true;
  return false;
}

function isRef(type: Schema): type is RefSchema {
  return typeof type === "object" && "$ref" in type;
}

function isAnyOf(type: Schema): type is AnyOfLikeSchema {
  if (typeof type !== "object") return false;
  if (Array.isArray(type)) return true;
  if ("type" in type && Array.isArray(type.type)) return true;
  return "anyOf" in type || "oneOf" in type;
}

function isEnum(type: Schema): type is EnumSchema {
  if (typeof type !== "object") return false;
  return "enum" in type && type.enum != null;
}

function isConst(type: Schema): type is ConstSchema {
  if (typeof type !== "object") return false;
  return "const" in type;
}

function isAllOf(type: Schema): type is AllOfLikeSchema {
  if (typeof type !== "object") return false;
  if ("allOf" in type && Array.isArray(type.allOf)) return true;
  return false;
}

function isOneOf(type: Schema): type is OneOfLikeSchema {
  if (typeof type !== "object") return false;
  if ("oneOf" in type && Array.isArray(type.oneOf)) return true;
  return false;
}

function convertUnknown(type: Schema, opt: ConvertContext): string[] {
  const { nsPrefix, resolveRefPointer, resolveRefSchema } = opt.options;

  // Process enums/consts in priority
  if (isEnum(type)) {
    return covnertEnum(type, opt);
  } else if (isConst(type)) {
    return convertConst(type, opt);
  }

  // Then process schema composition
  if (isAllOf(type)) {
    return convertAllOf(type, opt);
  } else if (isAnyOf(type)) {
    return convertAnyOf(type, opt);
  } else if (isOneOf(type)) {
    return convertOneOf(type, opt);
  }

  // Finally process types
  if (isObject(type)) {
    return convertObject(type, opt);
  } else if (isArray(type)) {
    return convertArray(type, opt);
  } else if (isString(type)) {
    return convertString(type, opt);
  } else if (isNumeric(type)) {
    return convertNumber(type, opt);
  } else if (isBoolean(type)) {
    return convertBoolean(type, opt);
  } else if (isNull(type)) {
    return convertNull(type, opt);
  } else if (isAny(type)) {
    return [`${nsPrefix}unknown`];
  } else if (isRef(type)) {
    if (resolveRefPointer) {
      return [resolveRefPointer(type.$ref)];
    } else if (resolveRefSchema) {
      return convertUnknown(resolveRefSchema(type.$ref), opt);
    } else {
      throw new RequiredConfigurationError(opt.path, "resolveRefPointer");
    }
  }

  throw new UnsupportedError(opt.path, `Unknown schema: ${JSON.stringify(type)}`);
}

export function convertSchema(schema: Schema, options?: ConverterOptions): string {
  const opt: ConverterOptions = {
    nsLib: options?.nsLib ?? "",
    nsPrefix: options?.nsPrefix ?? "",
    resolveRefPointer: options?.resolveRefPointer,
    resolveRefSchema: options?.resolveRefSchema,
  };
  const ctx: ConvertContext = {
    options: opt,
    path: [],
    libUsage: {
      union: 0,
    },
  };
  const lines = convertUnknown(schema, ctx);
  return lines.join("\n");
}

export async function convertContents(buffer: string, options?: ConverterOptions): Promise<string> {
  if (!buffer) return "";
  const content: Schema = JSON.parse(buffer);
  return convertSchema(content, options);
}

export async function convertFile(file: string, options?: ConverterOptions): Promise<string> {
  // If we have some file path, try to use filesystem (node) to load the contents
  const fs = require("fs");
  if (fs == null) {
    throw new TypeError("Filesystem is only available on node");
  }
  const bufer = fs.readFileSync(file, "utf8");
  const content = JSON.parse(bufer.toString());
  return convertSchema(content, options);
}

export async function convert(url: string | Schema, options?: ConverterOptions): Promise<string> {
  // If we were given an object, use directly the converter
  if (typeof url !== "string") {
    return convertSchema(url, options);
  }

  // Otherwise try to load the contents
  const filePath = url.startsWith("file:") ? url.substring(5) : url.includes(":") ? null : url;
  let json: Schema;

  // If this was a path to file, check if we are in node context to load it from the filesystem
  // otherwise assume it's a URL and load it from the network
  if (filePath) {
    return convertFile(filePath, options);
  } else {
    // Otherwise use fetch API to load the contents
    const resp = await fetch(url);
    json = await resp.json();
  }

  // Convert contents
  return convertSchema(json, options);
}
