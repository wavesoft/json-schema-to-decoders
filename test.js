const decoder = require("./dist");

(async () => {
  console.log(await decoder.convertFile("test.json", "D."));
})();
