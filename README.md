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

## Extra Decoders

The converter supports more elaborate schema cases, such as `anyOf`, but they require some non-standard decoders to be available.

### `union` Decoder

```ts
type UtoI<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

const union = <T extends ReadonlyArray<D.Decoder<any>>>(...decoders: T) =>
  D.define<UtoI<D.DecoderType<T[number]>>>((blob, ok, err) => {
    const results: D.DecoderType<T[number]>[] = [];
    for (const dec of decoders) {
      const v = dec.decode(blob);
      if (!v.ok) {
        return err(v.error);
      } else {
        results.push(v.value);
      }
    }
    return ok(
      results.reduce((obj, ret) => ({ ...obj, ...ret }), {} as UtoI<D.DecodeResult<T[number]>>)
    );
  });
```
