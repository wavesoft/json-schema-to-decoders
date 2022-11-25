import * as D from "decoders";
import * as L from "../../decoders";
import { Schema } from "../../types";
import { convertSchema } from "../../converter";

export function createValidator(schema: Schema): D.Decoder<unknown> {
  const script = convertSchema(schema, {
    nsPrefix: "this.D.",
    nsLib: "this.L.",
  });
  const decoder: D.Decoder<unknown> = new Function(`"use strict"; return ${script}`).bind({
    D,
    L,
  })();
  return decoder;
}
