interface BaseSchema {
  enum?: Array<string | number>;
  example?: string;
  description?: string;
  title?: string;
}

// Object

interface ObjectSchemaDef extends BaseSchema {
  type: "object";
  properties?: Record<string, Schema>;
  additionalProperties?: boolean;
  required?: Array<string>;
  minProperties?: number;
  maxProperties?: number;
}

export type ObjectSchema = ObjectSchemaDef | "object";

// Numeric Types

export interface NumericSchemaInteger extends BaseSchema {
  type: "integer";
}

export interface NumericSchemaNumber extends BaseSchema {
  type: "number";
  multipleOf?: number;
  minimum?: number;
  maximum?: number;
  exclusiveMinimum?: boolean;
  exclusiveMaximum?: boolean;
}

export type NumericSchema = NumericSchemaInteger | "integer" | NumericSchemaNumber | "number";

// Array

interface ArraySchemaDef extends BaseSchema {
  type: "array";
  items?: Schema;
  minItems?: number;
  maxItems?: number;
}

export type ArraySchema = ArraySchemaDef | "array";

// String

export interface StringSchemaDef extends BaseSchema {
  type: "string";
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
}

export type StringSchema = StringSchemaDef | "string";

// Boolean

export interface BooleanSchemaDef extends BaseSchema {
  type: "boolean";
}

export type BooleanSchema = BooleanSchemaDef | "boolean";

// Null

export interface NullSchemaDef extends BaseSchema {
  type: "null";
}

export type NullSchema = NullSchemaDef | "null";

// Any shcema

export type AnySchema = "any";

// AnyOf Schema

type AnyOfSchemaDef = {
  anyOf: Array<Schema>;
};

type AnyOfAsTypeArray = {
  type: Array<Schema>;
};

export type AnyOfSchema = AnyOfSchemaDef | AnyOfAsTypeArray | Schema[];

// Type union

export type Schema =
  | ObjectSchema
  | ArraySchema
  | StringSchema
  | NumericSchema
  | AnySchema
  | AnyOfSchema
  | BooleanSchema
  | NullSchema;
