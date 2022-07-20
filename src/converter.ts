import fs from "fs";
import util from "util";
import type {
  AnyOfSchema,
  AnySchema,
  ArraySchema,
  BooleanSchema,
  EnumSchema,
  NullSchema,
  NumericSchema,
  ObjectSchema,
  Schema,
  StringSchema,
  StringSchemaDef,
} from "./types";

const readFile = util.promisify(fs.readFile);

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
    lines.push(schema.title);
  }
  if ("description" in schema && schema.description) {
    if (lines.length > 1) lines.push("");
    const desc = `(${schema.description})`;
    lines.push(...desc.split("\n"));
  }
  if ("example" in schema && schema.example) {
    if (lines.length > 1) lines.push("");
    lines.push(`Example: ${schema.example}`);
  }
  if (!lines.length) return [];
  return wrapLines("/* ", lines, " */", "   ");
}

function convertObject(obj: ObjectSchema, nsPrefix: string): string[] {
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
        propLines.push(...wrapLines(`${name}: `, convertUnknown(schema, nsPrefix), ","));
      } else {
        propLines.push(
          ...wrapLines(`${name}: ${nsPrefix}optional(`, convertUnknown(schema, nsPrefix), "),")
        );
      }
    }
    ret.push(...indentLines(propLines, 2));
  }
  ret.push("})");
  return ret;
}

function convertArray(obj: ArraySchema, nsPrefix: string): string[] {
  const schema = typeof obj === "string" ? "any" : obj.items ?? "any";
  return wrapLines(`${nsPrefix}array(`, convertUnknown(schema, nsPrefix), ")");
}

function convertString(obj: StringSchema, nsPrefix: string): string[] {
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

function convertAnyOf(obj: AnyOfSchema, nsPrefix: string): string[] {
  const ret: string[] = [`${nsPrefix}either(`];
  const schemaLines: string[] = [];
  const types = Array.isArray(obj) ? obj : "type" in obj ? obj.type : obj.anyOf ?? [];
  for (const schema of types) {
    schemaLines.push(...wrapLines("", convertUnknown(schema, nsPrefix), ","));
  }
  ret.push(...indentLines(schemaLines, 2));
  ret.push(")");
  return ret;
}

function convertNumber(obj: NumericSchema, nsPrefix: string): string[] {
  if (
    (typeof obj === "string" && obj === "integer") ||
    (typeof obj === "object" && obj.type === "integer")
  ) {
    return [`${nsPrefix}integer`];
  }
  return [`${nsPrefix}number`];
}

function convertBoolean(obj: BooleanSchema, nsPrefix: string): string[] {
  return [`${nsPrefix}boolean`];
}

function convertNull(obj: NullSchema, nsPrefix: string): string[] {
  return [`${nsPrefix}null_`];
}

function covnertEnum(obj: EnumSchema, nsPrefix: string): string[] {
  const options = obj.enum ?? [];
  if (options.length < 3) {
    return [`${nsPrefix}oneOf([${JSON.stringify(obj.enum)}])`];
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

function isAnyOf(type: Schema): type is AnyOfSchema {
  if (typeof type !== "object") return false;
  if (Array.isArray(type)) return true;
  if ("type" in type && Array.isArray(type.type)) return true;
  return "anyOf" in type;
}

function isEnum(type: Schema): type is EnumSchema {
  if (typeof type !== "object") return false;
  return "enum" in type && type.enum != null;
}

function convertUnknown(type: Schema, nsPrefix: string): string[] {
  if (isEnum(type)) {
    return covnertEnum(type, nsPrefix);
  }

  if (isObject(type)) {
    return convertObject(type, nsPrefix);
  } else if (isArray(type)) {
    return convertArray(type, nsPrefix);
  } else if (isString(type)) {
    return convertString(type, nsPrefix);
  } else if (isNumeric(type)) {
    return convertNumber(type, nsPrefix);
  } else if (isAnyOf(type)) {
    return convertAnyOf(type, nsPrefix);
  } else if (isBoolean(type)) {
    return convertBoolean(type, nsPrefix);
  } else if (isNull(type)) {
    return convertNull(type, nsPrefix);
  } else if (isAny(type)) {
    return [`${nsPrefix}unknown()`];
  }
  return ["/* Unknown type */"];
}

export async function convertSchema(schema: Schema, nsPrefix: string = "") {
  const lines = convertUnknown(schema, nsPrefix);
  return lines.join("\n");
}

export async function convertFile(filename: string, nsPrefix: string = "") {
  const contents = await readFile(filename);
  const schema = JSON.parse(contents.toString());
  return convertSchema(schema, nsPrefix);
}
