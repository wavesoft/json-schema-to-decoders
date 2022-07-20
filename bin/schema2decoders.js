#!/usr/bin/env node
const converter = require("json-schema-to-decoders");
if (process.argv.length < 2) {
  console.error("Please specify the filename to convert");
  process.exit(1);
}

(async () => {
  console.log(await converter.convertFile(process.argv));
})();
