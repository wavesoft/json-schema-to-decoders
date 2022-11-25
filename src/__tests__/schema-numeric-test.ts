// Covers all the test cases from
// https://json-schema.org/understanding-json-schema/reference/numeric.html

import { createValidator } from "./util/generator";

describe("JSON Schema (Numeric)", () => {
  test("Integer Checks", () => {
    // https://json-schema.org/understanding-json-schema/reference/numeric.html#integer
    const dec1 = createValidator({ type: "integer" });
    const dec2 = createValidator("integer");

    for (const dec of [dec1, dec2]) {
      expect(dec.decode(42).ok).toBeTruthy();
      expect(dec.decode(-1).ok).toBeTruthy();
      expect(dec.decode(1.0).ok).toBeTruthy();
      expect(dec.decode(3.1415926).ok).toBeFalsy();
      expect(dec.decode("42").ok).toBeFalsy();
    }
  });

  test("Number Checks", () => {
    // https://json-schema.org/understanding-json-schema/reference/numeric.html#number
    const dec1 = createValidator({ type: "number" });
    const dec2 = createValidator("number");

    for (const dec of [dec1, dec2]) {
      expect(dec.decode(42).ok).toBeTruthy();
      expect(dec.decode(-1).ok).toBeTruthy();
      expect(dec.decode(5.0).ok).toBeTruthy();
      expect(dec.decode(2.99792458e8).ok).toBeTruthy();
      expect(dec.decode("42").ok).toBeFalsy();
    }
  });

  test("Multiples", () => {
    // https://json-schema.org/understanding-json-schema/reference/numeric.html#multiples
    const dec1 = createValidator({
      type: "number",
      multipleOf: 10,
    });

    expect(dec1.decode(0).ok).toBeTruthy();
    expect(dec1.decode(10).ok).toBeTruthy();
    expect(dec1.decode(20).ok).toBeTruthy();
    expect(dec1.decode(23).ok).toBeFalsy();
  });

  test("Range", () => {
    // https://json-schema.org/understanding-json-schema/reference/numeric.html#range
    const dec1 = createValidator({
      type: "number",
      minimum: 0,
      exclusiveMaximum: 100,
    });

    expect(dec1.decode(-1).ok).toBeFalsy();
    expect(dec1.decode(0).ok).toBeTruthy();
    expect(dec1.decode(10).ok).toBeTruthy();
    expect(dec1.decode(99).ok).toBeTruthy();
    expect(dec1.decode(100).ok).toBeFalsy();
    expect(dec1.decode(101).ok).toBeFalsy();

    const dec2 = createValidator({
      type: "number",
      exclusiveMinimum: 0,
      maximum: 100,
    });

    expect(dec2.decode(-1).ok).toBeFalsy();
    expect(dec2.decode(0).ok).toBeFalsy();
    expect(dec2.decode(10).ok).toBeTruthy();
    expect(dec2.decode(99).ok).toBeTruthy();
    expect(dec2.decode(100).ok).toBeTruthy();
    expect(dec2.decode(101).ok).toBeFalsy();
  });
});
