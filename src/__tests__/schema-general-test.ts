// Covers all the test cases from
// https://json-schema.org/understanding-json-schema/reference/array.html

import { createValidator } from "./util/generator";

describe("JSON Schema (All Types)", () => {
  test("Enums", () => {
    // https://json-schema.org/understanding-json-schema/reference/generic.html#enumerated-values
    const dec1 = createValidator({
      enum: ["red", "amber", "green"],
    });

    expect(dec1.decode("red").ok).toBeTruthy();
    expect(dec1.decode("amber").ok).toBeTruthy();
    expect(dec1.decode("green").ok).toBeTruthy();
    expect(dec1.decode("blue").ok).toBeFalsy();

    // Different types
    const dec2 = createValidator({
      enum: ["red", "amber", "green", null, 42],
    });

    expect(dec2.decode("red").ok).toBeTruthy();
    expect(dec2.decode("amber").ok).toBeTruthy();
    expect(dec2.decode("green").ok).toBeTruthy();
    expect(dec2.decode(null).ok).toBeTruthy();
    expect(dec2.decode(42).ok).toBeTruthy();
    expect(dec2.decode("blue").ok).toBeFalsy();
  });

  test("Const", () => {
    // https://json-schema.org/understanding-json-schema/reference/generic.html#constant-values
    const dec1 = createValidator({
      properties: {
        country: {
          const: "United States of America",
        },
      },
    });

    expect(dec1.decode({ country: "United States of America" }).ok).toBeTruthy();
    expect(dec1.decode({ country: "Canada" }).ok).toBeFalsy();
  });
});
