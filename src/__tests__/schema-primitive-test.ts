import { createValidator } from "./util/generator";

describe("JSON Schema (Primitives)", () => {
  test("Boolean", () => {
    // https://json-schema.org/understanding-json-schema/reference/boolean.html#boolean
    const dec1 = createValidator({ type: "boolean" });
    const dec2 = createValidator("boolean");

    for (const dec of [dec1, dec2]) {
      expect(dec.decode(true).ok).toBeTruthy();
      expect(dec.decode(false).ok).toBeTruthy();
      expect(dec.decode("true").ok).toBeFalsy();
      expect(dec.decode(0).ok).toBeFalsy();
    }
  });

  test("Boolean", () => {
    // https://json-schema.org/understanding-json-schema/reference/null.html#null
    const dec1 = createValidator({ type: "null" });
    const dec2 = createValidator("null");

    for (const dec of [dec1, dec2]) {
      expect(dec.decode(null).ok).toBeTruthy();
      expect(dec.decode(false).ok).toBeFalsy();
      expect(dec.decode(0).ok).toBeFalsy();
      expect(dec.decode(undefined).ok).toBeFalsy();
    }
  });
});
