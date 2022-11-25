import * as D from "decoders";

/**
 * Utility for converting a type union (A | B) into a type intersection (A & B)
 * https://stackoverflow.com/a/50375286/2291454)
 */
type UtoI<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

/**
 * The `union` decoder combines multiple object decoders together with a union relationship.
 *
 * @param decoders one or more object decoders to combine
 */
export const union = <T extends ReadonlyArray<D.Decoder<any>>>(...decoders: T) =>
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
