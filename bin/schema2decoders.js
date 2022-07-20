#!/usr/bin/env node
const converter = require("json-schema-to-decoders");
if (process.argv.length < 3) {
  console.error("⚠️  Please specify the filename to convert");
  console.log(`Usage: json-schema-to-decoders <json-schema.json> [namespace prefix]`);
  process.exit(1);
}

(async () => {
  const file = process.argv[2];
  const nsPrefix = process.argv[3] ?? "";
  try {
    console.log(await converter.convertFile(file, nsPrefix));
  } catch (err) {
    console.error(`⚠️  Error in ${file}: ${err.message}`);
    process.exit(1);
  }
})();
