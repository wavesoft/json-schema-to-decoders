// Covers all the test cases from
// https://json-schema.org/understanding-json-schema/reference/string.html

import { createValidator } from "./util/generator";

describe("JSON Schema (Strings)", () => {
  test("Default Checks", () => {
    const dec1 = createValidator({ type: "string" });
    const dec2 = createValidator("string");

    for (const dec of [dec1, dec2]) {
      expect(dec.decode("This is a string").ok).toBeTruthy();
      expect(dec.decode("Déjà vu").ok).toBeTruthy();
      expect(dec.decode("").ok).toBeTruthy();
      expect(dec.decode("42").ok).toBeTruthy();
      expect(dec.decode(42).ok).toBeFalsy();
    }
  });

  test("Length", () => {
    // https://json-schema.org/understanding-json-schema/reference/string.html#id5
    const dec1 = createValidator({
      type: "string",
      minLength: 2,
      maxLength: 3,
    });

    expect(dec1.decode("A").ok).toBeFalsy();
    expect(dec1.decode("AB").ok).toBeTruthy();
    expect(dec1.decode("ABC").ok).toBeTruthy();
    expect(dec1.decode("ABCD").ok).toBeFalsy();
  });

  test("Regular Expressions", () => {
    // https://json-schema.org/understanding-json-schema/reference/string.html#regular-expressions
    const dec1 = createValidator({
      type: "string",
      pattern: "^(\\([0-9]{3}\\))?[0-9]{3}-[0-9]{4}$",
    });

    expect(dec1.decode("555-1212").ok).toBeTruthy();
    expect(dec1.decode("(888)555-1212").ok).toBeTruthy();
    expect(dec1.decode("(888)555-1212 ext. 532").ok).toBeFalsy();
    expect(dec1.decode("(800)FLOWERS").ok).toBeFalsy();
  });

  test("Built-In Formatters", () => {
    // https://json-schema.org/understanding-json-schema/reference/string.html#built-in-formats
    const dec_dateTime = createValidator({
      type: "string",
      format: "date-time",
    });
    expect(dec_dateTime.decode("2018-11-13T20:20:39+00:00").ok).toBeTruthy();
    expect(dec_dateTime.decode("20:20:39+00:00").ok).toBeFalsy();
    expect(dec_dateTime.decode("2018-11-13").ok).toBeFalsy();
    expect(dec_dateTime.decode("LOLLIPOP").ok).toBeFalsy();

    const dec_email = createValidator({
      type: "string",
      format: "email",
    });
    expect(dec_email.decode("foo@bar.com").ok).toBeTruthy();
    expect(dec_email.decode("foo@bar").ok).toBeFalsy();
    expect(dec_email.decode("foo_bar.com").ok).toBeFalsy();
    expect(dec_email.decode("@bar.com").ok).toBeFalsy();

    const dec_hostname = createValidator({
      type: "string",
      format: "hostname",
    });
    expect(dec_hostname.decode("bar.com").ok).toBeTruthy();
    expect(dec_hostname.decode("fa.bar.com").ok).toBeTruthy();
    expect(dec_hostname.decode("localhost").ok).toBeTruthy();
    expect(dec_hostname.decode("a-valid-host.com").ok).toBeTruthy();
    expect(dec_hostname.decode("@localhost").ok).toBeFalsy();
    expect(dec_hostname.decode("..nohost").ok).toBeFalsy();

    const dec_uri = createValidator({
      type: "string",
      format: "uri",
    });
    expect(dec_uri.decode("schema://test.com").ok).toBeTruthy();
    expect(dec_uri.decode("schema.example.com").ok).toBeFalsy();
  });
});
