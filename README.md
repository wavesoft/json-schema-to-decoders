# json-schema-to-decoders

A handy utility for converting JSON schema definition to [decoders](https://decoders.cc) javascript code.

## Installation

To use the CLI you can install the package globally:

```
npm install -g json-schema-to-decoders
```

## Usage

To convert a JSON definition file to decoders, use the following command CLI:

```
json-schema-to-decoders <schema.json>
```

Alternatively you can use it as a library:

```ts
import Converter from "json-schema-to-decoders";

console.log(await Converter.convertFile("path/to/schema.json"));
```

## Support Matrix

The following table summarizes the supported conversion between JSON Schema types and decoders.

| Type                | Validation / Keyword     | Status |
| :------------------ | :----------------------- | :----- |
| _All Types_         | `enum`                   | ✅     |
|                     | `const`                  | ✅     |
| References          | _Basic Support_          | ✅ [1] |
| `any`               | _Basic Support_          | ✅     |
| `string`            | _Basic Support_          | ✅     |
|                     | `minLength`              | ✅     |
|                     | `maxLength`              | ✅     |
|                     | `pattern`                | ✅     |
|                     | `format: "date-time`     | ✅     |
|                     | `format: "time`          | -      |
|                     | `format: "date`          | -      |
|                     | `format: "duration`      | -      |
|                     | `format: "email`         | ✅     |
|                     | `format: "idn-email`     | -      |
|                     | `format: "hostname`      | ✅     |
|                     | `format: "idn-hostname`  | -      |
|                     | `format: "ipv4`          | -      |
|                     | `format: "ipv6`          | -      |
|                     | `format: "uuid`          | ✅     |
|                     | `format: "uri`           | ✅     |
|                     | `format: "uri-reference` | -      |
|                     | `format: "iri`           | -      |
|                     | `format: "iri-reference` | -      |
| `integer`           | _Basic Support_          | ✅     |
| `number`            | _Basic Support_          | ✅     |
|                     | `multipleOf`             | ✅     |
|                     | `minimum`                | ✅     |
|                     | `maximum`                | ✅     |
|                     | `exclusiveMinimum`       | ✅     |
|                     | `exclusiveMaximum`       | ✅     |
| `boolean`           | _Basic Support_          | ✅     |
| `null`              | _Basic Support_          | ✅     |
| `array`             | _Basic Support_          | ✅     |
|                     | Unevaluated Items        | -      |
|                     | `items`                  | ✅     |
|                     | `prefixItems`            | 🟨 [2] |
|                     | `contains`               | -      |
|                     | `minContains`            | -      |
|                     | `maxContains`            | -      |
|                     | `minItems`               | ✅     |
|                     | `maxItems`               | ✅     |
|                     | `uniqueItems`            | ✅     |
| `object`            | _Basic Support_          | ✅ [3] |
|                     | Unevaluated Properties   | -      |
|                     | Extending Closed Schemas | -      |
|                     | `properties`             | ✅     |
|                     | `additionalProperties`   | ✅     |
|                     | `required`               | ✅     |
|                     | `patternProperties`      | ✅     |
|                     | `propertyNames`          | ✅     |
|                     | `minProperties`          | ✅     |
|                     | `maxProperties`          | ✅     |
| Schema Composition  | `allOf`                  | ✅     |
|                     | `oneOf`                  | 🟨 [4] |
|                     | `anyOf`                  | ✅     |
|                     | `discriminator`          | ✅     |
| Conditional Schemas | `dependentRequired`      | -      |
|                     | `dependentSchemas`       | -      |
|                     | `if`                     | -      |
|                     | `then`                   | -      |
|                     | `else`                   | -      |

Remarks:

> [1] Implemented through a user-provided reference resolution function that returns the variable name of a previously defined decoder.

> [2] Currently `prefixItems` cannot be used together with `items`. This means that declaring additional items for arrays is not supported.

> [3] Note that while for `type: "object"` the JSON Schema spec indicates that "Using non-strings as keys is invalid JSON", the javascript implementation implicitly converts all properties to strings, so the decoders will always validate even numbers in the object keys.

> [4] The `oneOf` is currently polyfilled with the `anyOf` behaviour. This means that the "exactly one" validation is not respected.
