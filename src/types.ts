interface BaseSchema {
  example?: string;
  examples?: string[];
  description?: string;
  title?: string;

  allOf?: Partial<Schema>[];
  anyOf?: Partial<Schema>[];
  oneOf?: Partial<Schema>[];
}

export interface EnumSchema extends BaseSchema {
  enum: Array<string | number | null>;
}

export interface ConstSchema extends BaseSchema {
  const: string | number | null;
}

// Object

interface ImplicitObjectSchemaDef extends BaseSchema {
  additionalProperties?: boolean | Schema;
  maxProperties?: number;
  minProperties?: number;
  patternProperties?: Record<string, Schema>;
  properties?: Record<string, Schema>;
  propertyNames?: { pattern: string };
  required?: Array<string>;
}

interface ObjectSchemaDef extends ImplicitObjectSchemaDef {
  type: "object";
}

export type ObjectSchema = ImplicitObjectSchemaDef | ObjectSchemaDef;
export type ObjectLike = ObjectSchema | "object";

// Numeric Types

export interface IntegerSchemaDef extends BaseSchema {
  type: "integer";
  multipleOf?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
}

export interface NumberSchemaDef extends BaseSchema {
  type: "number";
  multipleOf?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: number;
  exclusiveMaximum?: number;
}

export type NumericSchema = IntegerSchemaDef | NumberSchemaDef;
export type NumericLike = NumericSchema | "integer" | "number";

// Array

interface ArraySchemaDef extends BaseSchema {
  type: "array";
  items?: Schema;
  maxItems?: number;
  minItems?: number;
  prefixItems?: Schema[];
  uniqueItems?: boolean;
}

export type ArraySchema = ArraySchemaDef;
export type ArrayLike = ArraySchema | "array";

// String

export interface StringSchemaDef extends BaseSchema {
  type: "string";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

export type StringSchema = StringSchemaDef;
export type StringLike = StringSchema | "string";

// Boolean

export interface BooleanSchemaDef extends BaseSchema {
  type: "boolean";
}

export type BooleanSchema = BooleanSchemaDef;
export type BooleanLike = StringSchema | "boolean";

// Null

export interface NullSchemaDef extends BaseSchema {
  type: "null";
}

export type NullSchema = NullSchemaDef;
export type NullLike = NullSchema | "null";

// Any shcema

export interface AnySchemaDef extends BaseSchema {
  type: "any";
}

export type AnySchema = AnySchemaDef;
export type AnyLike = AnySchema | "any";

// Schema compositions

export type AllOfLikeSchema = Omit<SchemaDef, "allOf"> & {
  allOf: Partial<Schema>[];
};

export type OneOfLikeSchema = Omit<SchemaDef, "oneOf"> & {
  oneOf: Partial<Schema>[];
};

export type AnyOfShorthandDef = Schema[];
export type AnyOfLikeSchema =
  | AnyOfShorthandDef
  | (Omit<SchemaDef, "anyOf"> & {
      anyOf: Partial<Schema>[];
    });

// Ref schema

export type RefSchema = { $ref: string };

// Type union

// Definition shorthands (strings)
export type SchemaStr =
  | "object"
  | "array"
  | "integer"
  | "number"
  | "string"
  | "boolean"
  | "null"
  | "any";

// Structured definitions (Objects)
export type SchemaDef =
  | ObjectSchema
  | ArraySchema
  | StringSchema
  | NumericSchema
  | AnySchema
  | BooleanSchema
  | NullSchema
  | EnumSchema
  | ConstSchema;

// The union of all possible schema types
export type Schema = SchemaDef | AnyOfShorthandDef | SchemaStr | RefSchema;
