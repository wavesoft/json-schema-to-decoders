/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["json-schema-to-decoder"] = factory();
	else
		root["json-schema-to-decoder"] = factory();
})(this, () => {
return /******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/converter.ts":
/*!**************************!*\
  !*** ./src/converter.ts ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"convert\": () => (/* binding */ convert),\n/* harmony export */   \"convertContents\": () => (/* binding */ convertContents),\n/* harmony export */   \"convertFile\": () => (/* binding */ convertFile),\n/* harmony export */   \"convertSchema\": () => (/* binding */ convertSchema)\n/* harmony export */ });\nvar __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {\n    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }\n    return new (P || (P = Promise))(function (resolve, reject) {\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\n        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\n    });\n};\nconst isValidName = (str) => /^(?!\\d)[\\w$]+$/.test(str);\nfunction escapeName(str) {\n    if (!isValidName(str))\n        return `\"${str.replace(/\"/g, '\\\\\"')}\"`;\n    return str;\n}\nfunction indentLines(lines, indent) {\n    const prefix = Array(indent).fill(\" \").join(\"\");\n    return lines.map((l) => prefix + l);\n}\nfunction wrapLines(prefix, lines, suffix, linePrefix = \"\") {\n    if (lines.length === 1) {\n        return [prefix + lines[0] + suffix];\n    }\n    else {\n        const ret = [prefix + lines[0]];\n        for (let i = 1; i < lines.length; i++) {\n            const lineSuffix = i === lines.length - 1 ? suffix : \"\";\n            ret.push(linePrefix + lines[i] + lineSuffix);\n        }\n        return ret;\n    }\n}\nfunction getSchemaComment(schema) {\n    var _a;\n    if (typeof schema !== \"object\")\n        return [];\n    const lines = [];\n    if (\"title\" in schema && schema.title) {\n        lines.push(`[${schema.title}]`);\n    }\n    if (\"description\" in schema && schema.description) {\n        const desc = `Description: ${schema.description}`;\n        lines.push(...desc.split(\"\\n\"));\n    }\n    if (\"example\" in schema && schema.example) {\n        lines.push(`Example: ${schema.example}`);\n    }\n    if (\"examples\" in schema && schema.examples) {\n        for (const example of (_a = schema.examples) !== null && _a !== void 0 ? _a : []) {\n            lines.push(`Example: ${example}`);\n        }\n    }\n    if (!lines.length)\n        return [];\n    return wrapLines(\"/* \", lines, \" */\", \"   \");\n}\nfunction convertObject(obj, opt) {\n    var _a, _b, _c, _d;\n    const { nsPrefix } = opt;\n    // There are two cases where we can do partial matching\n    const inexact = typeof obj === \"string\" || // Plain 'object' types imply loosely matched objects\n        (typeof obj !== \"string\" && obj.additionalProperties === true); // Objects with additional properties\n    // Prepare the return lines\n    let ret = [`${nsPrefix}${inexact ? \"inexact\" : \"object\"}({`];\n    if (typeof obj !== \"string\") {\n        const required = (_a = obj.required) !== null && _a !== void 0 ? _a : [];\n        const propLines = [];\n        const schemaLines = [];\n        const props = (_b = obj.properties) !== null && _b !== void 0 ? _b : {};\n        const keys = Object.keys(props);\n        keys.sort();\n        // Process well-known properties\n        for (const name of keys) {\n            const schema = props[name];\n            propLines.push(...getSchemaComment(schema));\n            if (required.includes(name)) {\n                propLines.push(...wrapLines(`${escapeName(name)}: `, convertUnknown(schema, opt), \",\"));\n            }\n            else {\n                propLines.push(...wrapLines(`${escapeName(name)}: ${nsPrefix}optional(`, convertUnknown(schema, opt), \"),\"));\n            }\n        }\n        // If the additional properties is a schema, create a decoder for that schema\n        if (\"additionalProperties\" in obj && typeof obj.additionalProperties === \"object\") {\n            const schema = convertUnknown(obj.additionalProperties, opt);\n            schemaLines.push(...wrapLines(`${nsPrefix}mapping(`, schema, `)`));\n        }\n        if (schemaLines.length && propLines.length) {\n            // If we have both schema and well-defined props, create a blend\n            ret.push(...indentLines(propLines, 2));\n            ret.push(\"})\");\n            // We must use the union decoder for this\n            const union = (_c = opt.lib) === null || _c === void 0 ? void 0 : _c.union;\n            if (!union) {\n                return [`/* Requires 'union' decoder to work */`];\n            }\n            return wrapLines(`${union}(`, [\n                // Include the explicit properties\n                ...wrapLines(\"\", indentLines(ret, 2), \",\"),\n                // Include the mapping properties\n                ...indentLines(schemaLines, 2),\n            ], `)`);\n        }\n        else if (schemaLines.length) {\n            // If we have only schema, use only the mapping decoder\n            return schemaLines;\n        }\n        else {\n            // If we have only properties, include them in the result\n            ret.push(...indentLines(propLines, 2));\n        }\n    }\n    ret.push(\"})\");\n    // If thre is an `allOf` property, convert the object into a union,\n    // including the additional props from the allOf\n    if (typeof obj === \"object\" && obj.allOf) {\n        const union = (_d = opt.lib) === null || _d === void 0 ? void 0 : _d.union;\n        if (!union) {\n            return [`/* Requires 'union' decoder to work */`];\n        }\n        // Wrap object definition and include additional schemas\n        ret = [`${union}(`, ...wrapLines(\"\", ret, \",\")];\n        const schemaLines = [];\n        for (const schema of obj.allOf) {\n            schemaLines.push(...wrapLines(\"\", convertUnknown(schema, opt), \",\"));\n        }\n        ret.push(...indentLines(schemaLines, 2));\n        ret.push(\")\");\n    }\n    return ret;\n}\nfunction convertArray(obj, opt) {\n    var _a;\n    const { nsPrefix } = opt;\n    const schema = typeof obj === \"string\" ? \"any\" : (_a = obj.items) !== null && _a !== void 0 ? _a : \"any\";\n    return wrapLines(`${nsPrefix}array(`, convertUnknown(schema, opt), \")\");\n}\nfunction convertString(obj, opt) {\n    const { nsPrefix } = opt;\n    const def = typeof obj === \"string\" ? { type: \"string\" } : obj;\n    if (def.pattern) {\n        return [`${nsPrefix}regex(/${def.pattern}/)`];\n    }\n    if (def.format) {\n        switch (def.format) {\n            case \"date-time\":\n                return [`${nsPrefix}iso8601`];\n            case \"email\":\n                return [`${nsPrefix}email`];\n            case \"uri\":\n                return [`${nsPrefix}url`];\n            case \"uuid\":\n                return [`${nsPrefix}uuid`];\n        }\n    }\n    if (def.minLength && def.minLength > 0) {\n        return [`${nsPrefix}nonEmptyString`];\n    }\n    return [`${nsPrefix}string`];\n}\nfunction convertAnyOf(obj, opt) {\n    var _a;\n    const { nsPrefix } = opt;\n    const ret = [`${nsPrefix}either(`];\n    const schemaLines = [];\n    const types = Array.isArray(obj)\n        ? obj\n        : \"type\" in obj\n            ? obj.type\n            : \"anyOf\" in obj\n                ? obj.anyOf\n                : (_a = obj.oneOf) !== null && _a !== void 0 ? _a : [];\n    for (const schema of types) {\n        schemaLines.push(...wrapLines(\"\", convertUnknown(schema, opt), \",\"));\n    }\n    ret.push(...indentLines(schemaLines, 2));\n    ret.push(\")\");\n    return ret;\n}\nfunction convertAllOf(obj, opt) {\n    var _a;\n    const { nsPrefix } = opt;\n    const ret = [];\n    if (\"discriminator\" in obj) {\n        // NOTE: Normally we should use `taggedUnion` however it's not possible\n        //       to know the values for the discriminator. So instead we are\n        //       using the fallback to the next best thing: `either`\n        ret.push(`${nsPrefix}either(`);\n    }\n    else {\n        const union = (_a = opt.lib) === null || _a === void 0 ? void 0 : _a.union;\n        if (!union) {\n            return [`/* Requires 'union' decoder to work */`];\n        }\n        ret.push(`${union}(`);\n    }\n    const schemaLines = [];\n    for (const schema of obj.allOf) {\n        schemaLines.push(...wrapLines(\"\", convertUnknown(schema, opt), \",\"));\n    }\n    ret.push(...indentLines(schemaLines, 2));\n    ret.push(\")\");\n    return ret;\n}\nfunction convertNumber(obj, opt) {\n    const { nsPrefix } = opt;\n    if ((typeof obj === \"string\" && obj === \"integer\") ||\n        (typeof obj === \"object\" && obj.type === \"integer\")) {\n        return [`${nsPrefix}integer`];\n    }\n    return [`${nsPrefix}number`];\n}\nfunction convertBoolean(obj, opt) {\n    const { nsPrefix } = opt;\n    return [`${nsPrefix}boolean`];\n}\nfunction convertNull(obj, opt) {\n    const { nsPrefix } = opt;\n    return [`${nsPrefix}null_`];\n}\nfunction covnertEnum(obj, opt) {\n    var _a;\n    const { nsPrefix } = opt;\n    const options = (_a = obj.enum) !== null && _a !== void 0 ? _a : [];\n    if (options.length < 3) {\n        return [`${nsPrefix}oneOf(${JSON.stringify(obj.enum)})`];\n    }\n    else {\n        const lines = options.map((o) => JSON.stringify(o) + \",\");\n        return [`${nsPrefix}oneOf([`, ...indentLines(lines, 2), `])`];\n    }\n}\nfunction isObject(type) {\n    if (typeof type === \"string\")\n        return type === \"object\";\n    if (!(\"type\" in type))\n        return false;\n    return type.type === \"object\";\n}\nfunction isArray(type) {\n    if (typeof type === \"string\")\n        return type === \"array\";\n    if (!(\"type\" in type))\n        return false;\n    return type.type === \"array\";\n}\nfunction isString(type) {\n    if (typeof type === \"string\")\n        return type === \"string\";\n    if (!(\"type\" in type))\n        return false;\n    return type.type === \"string\";\n}\nfunction isNumeric(type) {\n    if (typeof type === \"string\")\n        return type === \"integer\" || type === \"number\";\n    if (!(\"type\" in type))\n        return false;\n    return type.type === \"integer\" || type.type === \"number\";\n}\nfunction isBoolean(type) {\n    if (typeof type === \"string\")\n        return type === \"boolean\";\n    if (!(\"type\" in type))\n        return false;\n    return type.type === \"boolean\";\n}\nfunction isNull(type) {\n    if (typeof type === \"string\")\n        return type === \"null\";\n    if (!(\"type\" in type))\n        return false;\n    return type.type === \"null\";\n}\nfunction isAny(type) {\n    return typeof type === \"string\" && type === \"any\";\n}\nfunction isRef(type) {\n    return typeof type === \"object\" && \"$ref\" in type;\n}\nfunction isAnyOf(type) {\n    if (typeof type !== \"object\")\n        return false;\n    if (Array.isArray(type))\n        return true;\n    if (\"type\" in type && Array.isArray(type.type))\n        return true;\n    return \"anyOf\" in type || \"oneOf\" in type;\n}\nfunction isEnum(type) {\n    if (typeof type !== \"object\")\n        return false;\n    return \"enum\" in type && type.enum != null;\n}\nfunction isAllOf(type) {\n    if (typeof type !== \"object\")\n        return false;\n    if (\"allOf\" in type && Array.isArray(type.allOf))\n        return true;\n    return false;\n}\nfunction convertUnknown(type, opt) {\n    const { nsPrefix, resolveRef } = opt;\n    if (isEnum(type)) {\n        return covnertEnum(type, opt);\n    }\n    if (isObject(type)) {\n        return convertObject(type, opt);\n    }\n    else if (isArray(type)) {\n        return convertArray(type, opt);\n    }\n    else if (isString(type)) {\n        return convertString(type, opt);\n    }\n    else if (isNumeric(type)) {\n        return convertNumber(type, opt);\n    }\n    else if (isAnyOf(type)) {\n        return convertAnyOf(type, opt);\n    }\n    else if (isAllOf(type)) {\n        return convertAllOf(type, opt);\n    }\n    else if (isBoolean(type)) {\n        return convertBoolean(type, opt);\n    }\n    else if (isNull(type)) {\n        return convertNull(type, opt);\n    }\n    else if (isAny(type)) {\n        return [`${nsPrefix}unknown`];\n    }\n    else if (isRef(type)) {\n        if (resolveRef) {\n            return [resolveRef(type.$ref)];\n        }\n        else {\n            return [`/* Unknown reference \"${type.$ref}\" */`];\n        }\n    }\n    return [\"/* Unknown type */\"];\n}\nfunction convertSchema(schema, options) {\n    var _a, _b;\n    return __awaiter(this, void 0, void 0, function* () {\n        const opt = {\n            nsPrefix: (_a = options === null || options === void 0 ? void 0 : options.nsPrefix) !== null && _a !== void 0 ? _a : \"\",\n            resolveRef: options === null || options === void 0 ? void 0 : options.resolveRef,\n            lib: (_b = options === null || options === void 0 ? void 0 : options.lib) !== null && _b !== void 0 ? _b : {},\n        };\n        const lines = convertUnknown(schema, opt);\n        return lines.join(\"\\n\");\n    });\n}\nfunction convertContents(buffer, options) {\n    return __awaiter(this, void 0, void 0, function* () {\n        if (!buffer)\n            return \"\";\n        const content = JSON.parse(buffer);\n        return convertSchema(content, options);\n    });\n}\nfunction convertFile(file, options) {\n    return __awaiter(this, void 0, void 0, function* () {\n        // If we have some file path, try to use filesystem (node) to load the contents\n        const fs = __webpack_require__(/*! fs */ \"fs\");\n        if (fs == null) {\n            throw new TypeError(\"Filesystem is only available on node\");\n        }\n        const bufer = fs.readFileSync(file, \"utf8\");\n        const content = JSON.parse(bufer.toString());\n        return convertSchema(content, options);\n    });\n}\nfunction convert(url, options) {\n    return __awaiter(this, void 0, void 0, function* () {\n        // If we were given an object, use directly the converter\n        if (typeof url !== \"string\") {\n            return convertSchema(url, options);\n        }\n        // Otherwise try to load the contents\n        const filePath = url.startsWith(\"file:\") ? url.substring(5) : url.includes(\":\") ? null : url;\n        let json;\n        // If this was a path to file, check if we are in node context to load it from the filesystem\n        // otherwise assume it's a URL and load it from the network\n        if (filePath) {\n            return convertFile(filePath, options);\n        }\n        else {\n            // Otherwise use fetch API to load the contents\n            const resp = yield fetch(url);\n            json = yield resp.json();\n        }\n        // Convert contents\n        return convertSchema(json, options);\n    });\n}\n\n\n//# sourceURL=webpack://json-schema-to-decoder/./src/converter.ts?");

/***/ }),

/***/ "./src/index.ts":
/*!**********************!*\
  !*** ./src/index.ts ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   \"convert\": () => (/* reexport safe */ _converter__WEBPACK_IMPORTED_MODULE_0__.convert),\n/* harmony export */   \"convertContents\": () => (/* reexport safe */ _converter__WEBPACK_IMPORTED_MODULE_0__.convertContents),\n/* harmony export */   \"convertFile\": () => (/* reexport safe */ _converter__WEBPACK_IMPORTED_MODULE_0__.convertFile),\n/* harmony export */   \"convertSchema\": () => (/* reexport safe */ _converter__WEBPACK_IMPORTED_MODULE_0__.convertSchema)\n/* harmony export */ });\n/* harmony import */ var _converter__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./converter */ \"./src/converter.ts\");\n\n\n\n//# sourceURL=webpack://json-schema-to-decoder/./src/index.ts?");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

module.exports = require("fs");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module can't be inlined because the eval devtool is used.
/******/ 	var __webpack_exports__ = __webpack_require__("./src/index.ts");
/******/ 	
/******/ 	return __webpack_exports__;
/******/ })()
;
});