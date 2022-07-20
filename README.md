# json-schema-to-decoders

A handy utility for converting JSON schema definition to [decoders](https://decoders.cc) javascript code.

## Installation

To use the CLI you can install the package globally:

```
npm install -g json-schema-to-decoders
```

## Usage

To convert a JSON definition file to decoders, use the following command:

```
json-schema-to-decoders <schema.json>
```

Alternatively you can use it as a library:

```ts
import Converter from "json-schema-to-decoders";

console.log(await Converter.convertFile("path/to/schema.json"));
```
