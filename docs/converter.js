(() => {
  const lib = globalThis["json-schema-to-decoder"];
  const nsElm = document.querySelector("#namespace");
  const inputElm = document.querySelector("#doc-input");
  const outputElm = document.querySelector("#doc-output");
  let deboucneTimer;

  ace.config.set("basePath", "https://cdnjs.cloudflare.com/ajax/libs/ace/1.8.0/");

  var inputEditor = ace.edit(inputElm);
  inputEditor.setTheme("ace/theme/textmate");
  inputEditor.session.setMode("ace/mode/json");

  var outputEditor = ace.edit(outputElm);
  outputEditor.setTheme("ace/theme/textmate");
  outputEditor.session.setMode("ace/mode/javascript");
  outputEditor.setReadOnly(true);

  async function convert(text) {
    const ns = String(nsElm.value || "");
    let value = "/* Could not parse your input */";
    try {
      const contents =
        (await lib.convertContents(text, { nsPrefix: ns, lib: { union: "union" } })).trim() ||
        "/* No output */";
      value = `/* Automatically converted from JSON schema */\nconst MyDecoder = ${contents};`;
    } catch (e) {
      value = `/* Error: ${e.message} */`;
    }
    try {
      value = prettier.format(value, { plugins: [prettierPlugins.babel] });
    } catch (e) {}
    outputEditor.setValue(value, -1);
  }

  function handleChange(text) {
    window.clearTimeout(deboucneTimer);
    deboucneTimer = window.setTimeout(() => convert(text), 250);
  }

  inputEditor.on("change", () => {
    handleChange(inputEditor.getValue());
  });
  nsElm.addEventListener("change", () => {
    handleChange(inputEditor.getValue());
  });
})();
