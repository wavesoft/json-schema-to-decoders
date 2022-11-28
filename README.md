# json-schema-to-decoders ![ci](https://github.com/wavesoft/json-schema-to-decoders/actions/workflows/ci-testing.yml/badge.svg) [![try-it](https://img.shields.io/badge/Try%20it-Live-blue)](https://wavesoft.github.io/json-schema-to-decoders/) [![npm](https://img.shields.io/npm/v/json-schema-to-decoders)](https://www.npmjs.com/package/json-schema-to-decoders)

> Generates Typescript/Javascript [decoders](https://decoders.cc) source code expressions from JSON schema specifications.

You can also [try it in your browser](https://wavesoft.github.io/json-schema-to-decoders/) with any JSON schema.

## Description

This package aims to provide the best possible conversion of a JSON Schema type into it's equivalent decoder function.

It has a wide support of different features from different JSON Schema drafts, check the [Support Matrix](#support-matrix) for more details.

## Installation

To use the CLI you can install the package globally:

```sh
npm install -g json-schema-to-decoders
```

To use it as a library in your package, install it locally:

```sh
npm install --dev json-schema-to-decoders
# or
yarn add -D json-schema-to-decoders
```

## Usage

To convert a JSON definition file to decoders, use the following command CLI:

```
json-schema-to-decoders <schema.json>
```

The package also exports an API that be used for more elaborate integrations:

```ts
import Converter from "json-schema-to-decoders";

console.log(await Converter.convertFile("path/to/schema.json"));
```

## API Reference

There are a few functios you can use for invoking the converter:

```ts
// Synchronous variations
convertSchema(schema: Schema, options?: ConverterOptions): string;
convertContents(buffer: string, options?: ConverterOptions): string;

// Asynchronous variations
convertFile(file: string, options?: ConverterOptions): Promise<string>;
convert(url: string | Schema, options?: ConverterOptions): Promise<string>;
```

The `ConverterOptions` have the following properties:

- `nsPrefix`: An optional namespace where to look for decoder functions into.

  For example, if you are importing the decoders like so:

  ```ts
  import * as D from "decoders";
  ```

  Then you can use:

  ```ts
  const code = convertSchema(schema, {
    nsPrefix: "D.",
  });
  ```

- `nsLib`: An optional namespace where to look for extra decoder library functions exposed by the `json-schema-to-decoders` package.

  If not specified, all of the avanced decoders would be disabled.

  For example, if you can import the utility library like so:

  ```ts
  import * as L from "json-schema-to-decoders/decoders";
  ```

  Then you can use:

  ```ts
  const code = convertSchema(schema, {
    nsLib: "L.",
  });
  ```

- `resolveRefPointer` : An optional function to call when a $ref is encountered. The returned value will replace the contents of that ref.

  For example, given the following logic:

  ```ts
  const schema = {
    type: "array",
    items: {
      $ref: "#/components/schema/Item",
    },
  };
  const code = convertSchema(schema, {
    resolveRefPointer: (expr) => {
      return expr.split("/").pop();
    },
  });
  ```

  Will produce the following code:

  ```ts
  array(Item);
  ```

- `resolveRefSchema` : An optional function to call when a $ref is encountered and the schema of it is required.

  In contrast to `resolveRefPointer`, where a variable reference is emitted, this function expects the value of the referred schema to be returned.

  If missing, `resolveRefPointer` would be used when possible, and if not, an exception would be thrown.

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
