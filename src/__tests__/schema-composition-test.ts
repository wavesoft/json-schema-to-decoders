// Covers all the test cases from
// https://json-schema.org/understanding-json-schema/reference/combining.html

import { createValidator } from "./util/generator";

describe("JSON Schema Composition", () => {
  test("allOf", () => {
    // https://json-schema.org/understanding-json-schema/reference/combining.html#allof
    const dec1 = createValidator({
      allOf: [{ type: "string" }, { maxLength: 5 }],
    });

    expect(dec1.decode("short").ok).toBeTruthy();
    expect(dec1.decode("too long").ok).toBeFalsy();

    const dec2 = createValidator({
      type: "object",
      required: ["hello", "world"],
      allOf: [
        {
          properties: {
            hello: {
              type: "string",
            },
          },
        },
        {
          properties: {
            world: {
              type: "string",
            },
          },
        },
      ],
    });

    expect(dec2.decode({ hello: "test", world: "test" }).ok).toBeTruthy();
    expect(dec2.decode({ hello: "test" }).ok).toBeFalsy();
  });

  test("anyOf", () => {
    // https://json-schema.org/understanding-json-schema/reference/combining.html#anyof
    const dec1 = createValidator({
      anyOf: [
        { type: "string", maxLength: 5 },
        { type: "number", minimum: 0 },
      ],
    });

    expect(dec1.decode("short").ok).toBeTruthy();
    expect(dec1.decode("too long").ok).toBeFalsy();
    expect(dec1.decode(12).ok).toBeTruthy();
    expect(dec1.decode(-5).ok).toBeFalsy();
  });

  test("oneOf", () => {
    // https://json-schema.org/understanding-json-schema/reference/combining.html#oneOf

    // NOTE: This is implemented as a poly-fill that acts as `anyOf`, so this test
    //       is copy-pasted from above.
    const dec1 = createValidator({
      oneOf: [
        { type: "string", maxLength: 5 },
        { type: "number", minimum: 0 },
      ],
    });

    expect(dec1.decode("short").ok).toBeTruthy();
    expect(dec1.decode("too long").ok).toBeFalsy();
    expect(dec1.decode(12).ok).toBeTruthy();
    expect(dec1.decode(-5).ok).toBeFalsy();
  });
});
