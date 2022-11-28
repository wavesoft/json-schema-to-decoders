import * as D from "decoders";
import * as L from "../../decoders";
import { Schema } from "../../types";
import { ConverterOptions, convertSchema } from "../../converter";

type ValidatorArgs = {
  globals?: any;
} & Omit<ConverterOptions, "nsPrefix" | "nsLib">;

export function createValidator(schema: Schema, args?: ValidatorArgs): D.Decoder<unknown> {
  const script = convertSchema(schema, {
    nsPrefix: "this.D.",
    nsLib: "this.L.",
    resolveRefPointer: args?.resolveRefPointer,
    resolveRefSchema: args?.resolveRefSchema,
  });
  const decoder: D.Decoder<unknown> = new Function(`"use strict"; return ${script}`).bind({
    D,
    L,
    ...args?.globals,
  })();
  return decoder;
}
