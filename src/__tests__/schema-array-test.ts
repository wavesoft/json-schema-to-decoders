// Covers all the test cases from
// https://json-schema.org/understanding-json-schema/reference/array.html

import { createValidator } from "./util/generator";

describe("JSON Schema (Arrays)", () => {
  test("Basic Support", () => {
    // https://json-schema.org/understanding-json-schema/reference/array.html
    const dec1 = createValidator({ type: "array" });
    const dec2 = createValidator("array");

    for (const dec of [dec1, dec2]) {
      expect(dec.decode([1, 2, 3, 4, 5]).ok).toBeTruthy();
      expect(dec.decode([3, "different", { types: "of values" }]).ok).toBeTruthy();
      expect(dec.decode({ Not: "an array" }).ok).toBeFalsy();
      expect(dec.decode("string").ok).toBeFalsy();
      expect(dec.decode(0).ok).toBeFalsy();
    }
  });

  test("Items", () => {
    // https://json-schema.org/understanding-json-schema/reference/array.html#items
    const dec1 = createValidator({
      type: "array",
      items: {
        type: "number",
      },
    });
    expect(dec1.decode([1, 2, 3, 4, 5]).ok).toBeTruthy();
    expect(dec1.decode([1, 2, "3", 4, 5]).ok).toBeFalsy();
    expect(dec1.decode([]).ok).toBeTruthy();
  });

  test("Prefix Items", () => {
    // https://json-schema.org/understanding-json-schema/reference/array.html#items
    const dec1 = createValidator({
      type: "array",
      prefixItems: [
        { type: "number" },
        { type: "string" },
        { enum: ["Street", "Avenue", "Boulevard"] },
        { enum: ["NW", "NE", "SW", "SE"] },
      ],
    });
    expect(dec1.decode([1600, "Pennsylvania", "Avenue", "NW"]).ok).toBeTruthy();
    expect(dec1.decode([1600, "Pennsylvania", "Avenue"]).ok).toBeTruthy();
    expect(dec1.decode([1600, "Pennsylvania", "Avenue", "NW", "Washington"]).ok).toBeFalsy();
  });

  test("Length", () => {
    // https://json-schema.org/understanding-json-schema/reference/array.html#length
    const dec1 = createValidator({
      type: "array",
      minItems: 2,
      maxItems: 3,
    });
    expect(dec1.decode([]).ok).toBeFalsy();
    expect(dec1.decode([1]).ok).toBeFalsy();
    expect(dec1.decode([1, 2]).ok).toBeTruthy();
    expect(dec1.decode([1, 2, 3]).ok).toBeTruthy();
    expect(dec1.decode([1, 2, 3, 4]).ok).toBeFalsy();
  });

  test("Uniqueness", () => {
    // https://json-schema.org/understanding-json-schema/reference/array.html#uniqueness
    const dec1 = createValidator({
      type: "array",
      uniqueItems: true,
    });

    expect(dec1.decode([1, 2, 3, 4, 5]).ok).toBeTruthy();
    expect(dec1.decode([1, 3, 3, 4, 5]).ok).toBeFalsy();
    expect(dec1.decode([]).ok).toBeTruthy();
  });
});
