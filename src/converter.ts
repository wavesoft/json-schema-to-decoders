import type {
  AnyOfSchema,
  AnySchema,
  ArraySchema,
  BooleanSchema,
  EnumSchema,
  NullSchema,
  NumericSchema,
  ObjectSchema,
  RefSchema,
  Schema,
  StringSchema,
  StringSchemaDef,
} from "./types";

export interface ConverterOptions {
  /**
   * An optional namespace where to look for decoder functions into
   */
  nsPrefix?: string;

  /**
   * An optional function to call when a $ref is encountered.
   * The returned value will replace the contents of that ref.
   */
  resolveRef?: (name: string) => string;
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

function convertObject(obj: ObjectSchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  const ret: string[] = [`${nsPrefix}object({`];
  if (typeof obj !== "string") {
    const required = obj.required ?? [];
    const propLines: string[] = [];
    const props = obj.properties ?? {};
    const keys = Object.keys(props);
    keys.sort();

    for (const name of keys) {
      const schema = props[name]!;
      propLines.push(...getSchemaComment(schema));
      if (required.includes(name)) {
        propLines.push(...wrapLines(`${escapeName(name)}: `, convertUnknown(schema, opt), ","));
      } else {
        propLines.push(
          ...wrapLines(
            `${escapeName(name)}: ${nsPrefix}optional(`,
            convertUnknown(schema, opt),
            "),"
          )
        );
      }
    }
    ret.push(...indentLines(propLines, 2));
  }
  ret.push("})");
  return ret;
}

function convertArray(obj: ArraySchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  const schema = typeof obj === "string" ? "any" : obj.items ?? "any";
  return wrapLines(`${nsPrefix}array(`, convertUnknown(schema, opt), ")");
}

function convertString(obj: StringSchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  const def: StringSchemaDef = typeof obj === "string" ? { type: "string" } : obj;
  if (def.pattern) {
    return [`${nsPrefix}regex(/${def.pattern}/)`];
  }
  if (def.format) {
    switch (def.format) {
      case "date-time":
        return [`${nsPrefix}iso8601`];
      case "email":
        return [`${nsPrefix}email`];
      case "uri":
        return [`${nsPrefix}url`];
      case "uuid":
        return [`${nsPrefix}uuid`];
    }
  }
  if (def.minLength && def.minLength > 0) {
    return [`${nsPrefix}nonEmptyString`];
  }
  return [`${nsPrefix}string`];
}

function convertAnyOf(obj: AnyOfSchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  const ret: string[] = [`${nsPrefix}either(`];
  const schemaLines: string[] = [];
  const types = Array.isArray(obj)
    ? obj
    : "type" in obj
    ? obj.type
    : "anyOf" in obj
    ? obj.anyOf
    : obj.oneOf ?? [];
  for (const schema of types) {
    schemaLines.push(...wrapLines("", convertUnknown(schema, opt), ","));
  }
  ret.push(...indentLines(schemaLines, 2));
  ret.push(")");
  return ret;
}

function convertNumber(obj: NumericSchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  if (
    (typeof obj === "string" && obj === "integer") ||
    (typeof obj === "object" && obj.type === "integer")
  ) {
    return [`${nsPrefix}integer`];
  }
  return [`${nsPrefix}number`];
}

function convertBoolean(obj: BooleanSchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  return [`${nsPrefix}boolean`];
}

function convertNull(obj: NullSchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  return [`${nsPrefix}null_`];
}

function covnertEnum(obj: EnumSchema, opt: ConverterOptions): string[] {
  const { nsPrefix } = opt;
  const options = obj.enum ?? [];
  if (options.length < 3) {
    return [`${nsPrefix}oneOf(${JSON.stringify(obj.enum)})`];
  } else {
    const lines = options.map((o) => JSON.stringify(o) + ",");
    return [`${nsPrefix}oneOf([`, ...indentLines(lines, 2), `])`];
  }
}

function isObject(type: Schema): type is ObjectSchema {
  if (typeof type === "string") return type === "object";
  if (!("type" in type)) return false;
  return type.type === "object";
}

function isArray(type: Schema): type is ArraySchema {
  if (typeof type === "string") return type === "array";
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
  return typeof type === "string" && type === "any";
}

function isRef(type: Schema): type is RefSchema {
  return typeof type === "object" && "$ref" in type;
}

function isAnyOf(type: Schema): type is AnyOfSchema {
  if (typeof type !== "object") return false;
  if (Array.isArray(type)) return true;
  if ("type" in type && Array.isArray(type.type)) return true;
  return "anyOf" in type || "oneOf" in type;
}

function isEnum(type: Schema): type is EnumSchema {
  if (typeof type !== "object") return false;
  return "enum" in type && type.enum != null;
}

function convertUnknown(type: Schema, opt: ConverterOptions): string[] {
  const { nsPrefix, resolveRef } = opt;

  if (isEnum(type)) {
    return covnertEnum(type, opt);
  }

  if (isObject(type)) {
    return convertObject(type, opt);
  } else if (isArray(type)) {
    return convertArray(type, opt);
  } else if (isString(type)) {
    return convertString(type, opt);
  } else if (isNumeric(type)) {
    return convertNumber(type, opt);
  } else if (isAnyOf(type)) {
    return convertAnyOf(type, opt);
  } else if (isBoolean(type)) {
    return convertBoolean(type, opt);
  } else if (isNull(type)) {
    return convertNull(type, opt);
  } else if (isAny(type)) {
    return [`${nsPrefix}unknown`];
  } else if (isRef(type)) {
    if (resolveRef) {
      return [resolveRef(type.$ref)];
    } else {
      return [`/* Unknown reference "${type.$ref}" */`];
    }
  }

  console.log("unknown=", type);
  return ["/* Unknown type */"];
}

export async function convertSchema(schema: Schema, options?: ConverterOptions): Promise<string> {
  const opt: ConverterOptions = {
    nsPrefix: options?.nsPrefix ?? "",
    resolveRef: options?.resolveRef,
  };
  const lines = convertUnknown(schema, opt);
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
