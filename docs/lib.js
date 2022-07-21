!function(n,t){"object"==typeof exports&&"object"==typeof module?module.exports=t():"function"==typeof define&&define.amd?define([],t):"object"==typeof exports?exports["json-schema-to-decoder"]=t():n["json-schema-to-decoder"]=t()}(this,(()=>(()=>{"use strict";var n={48:n=>{n.exports=require("fs")}},t={};function e(r){var o=t[r];if(void 0!==o)return o.exports;var i=t[r]={exports:{}};return n[r](i,i.exports,e),i.exports}e.d=(n,t)=>{for(var r in t)e.o(t,r)&&!e.o(n,r)&&Object.defineProperty(n,r,{enumerable:!0,get:t[r]})},e.o=(n,t)=>Object.prototype.hasOwnProperty.call(n,t),e.r=n=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(n,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(n,"__esModule",{value:!0})};var r={};return(()=>{e.r(r),e.d(r,{convert:()=>y,convertContents:()=>f,convertFile:()=>p,convertSchema:()=>c});var n=function(n,t,e,r){return new(e||(e=Promise))((function(o,i){function u(n){try{c(r.next(n))}catch(n){i(n)}}function s(n){try{c(r.throw(n))}catch(n){i(n)}}function c(n){var t;n.done?o(n.value):(t=n.value,t instanceof e?t:new e((function(n){n(t)}))).then(u,s)}c((r=r.apply(n,t||[])).next())}))};function t(n){return(n=>/^(?!\d)[\w$]+$/.test(n))(n)?n:`"${n.replace(/"/g,'\\"')}"`}function o(n,t){const e=Array(t).fill(" ").join("");return n.map((n=>e+n))}function i(n,t,e,r=""){if(1===t.length)return[n+t[0]+e];{const o=[n+t[0]];for(let n=1;n<t.length;n++){const i=n===t.length-1?e:"";o.push(r+t[n]+i)}return o}}function u(n){if("object"!=typeof n)return[];const t=[];if("title"in n&&n.title&&t.push(n.title),"description"in n&&n.description){t.length>1&&t.push("");const e=`(${n.description})`;t.push(...e.split("\n"))}return"example"in n&&n.example&&(t.length>1&&t.push(""),t.push(`Example: ${n.example}`)),t.length?i("/* ",t," */","   "):[]}function s(n,e){return function(n){return"object"==typeof n&&"enum"in n&&null!=n.enum}(n)?function(n,t){var e;const r=null!==(e=n.enum)&&void 0!==e?e:[];return r.length<3?[`${t}oneOf([${JSON.stringify(n.enum)}])`]:[`${t}oneOf([`,...o(r.map((n=>JSON.stringify(n)+",")),2),"])"]}(n,e):function(n){return"string"==typeof n?"object"===n:"type"in n&&"object"===n.type}(n)?function(n,e){var r,c;const f=[`${e}object({`];if("string"!=typeof n){const p=null!==(r=n.required)&&void 0!==r?r:[],y=[],a=null!==(c=n.properties)&&void 0!==c?c:{},l=Object.keys(a);l.sort();for(const n of l){const r=a[n];y.push(...u(r)),p.includes(n)?y.push(...i(`${t(n)}: `,s(r,e),",")):y.push(...i(`${t(n)}: ${e}optional(`,s(r,e),"),"))}f.push(...o(y,2))}return f.push("})"),f}(n,e):function(n){return"string"==typeof n?"array"===n:"type"in n&&"array"===n.type}(n)?function(n,t){var e;return i(`${t}array(`,s("string"==typeof n?"any":null!==(e=n.items)&&void 0!==e?e:"any",t),")")}(n,e):function(n){return"string"==typeof n?"string"===n:"type"in n&&"string"===n.type}(n)?function(n,t){const e="string"==typeof n?{type:"string"}:n;if(e.pattern)return[`${t}regex(/${e.pattern}/)`];if(e.format)switch(e.format){case"date-time":return[`${t}iso8601`];case"email":return[`${t}email`];case"uri":return[`${t}url`];case"uuid":return[`${t}uuid`]}return e.minLength&&e.minLength>0?[`${t}nonEmptyString`]:[`${t}string`]}(n,e):function(n){return"string"==typeof n?"integer"===n||"number"===n:"type"in n&&("integer"===n.type||"number"===n.type)}(n)?function(n,t){return"string"==typeof n&&"integer"===n||"object"==typeof n&&"integer"===n.type?[`${t}integer`]:[`${t}number`]}(n,e):function(n){return"object"==typeof n&&(!!Array.isArray(n)||!(!("type"in n)||!Array.isArray(n.type))||"anyOf"in n)}(n)?function(n,t){var e;const r=[`${t}either(`],u=[],c=Array.isArray(n)?n:"type"in n?n.type:null!==(e=n.anyOf)&&void 0!==e?e:[];for(const n of c)u.push(...i("",s(n,t),","));return r.push(...o(u,2)),r.push(")"),r}(n,e):function(n){return"string"==typeof n?"boolean"===n:"type"in n&&"boolean"===n.type}(n)?function(n,t){return[`${t}boolean`]}(0,e):function(n){return"string"==typeof n?"null"===n:"type"in n&&"null"===n.type}(n)?function(n,t){return[`${t}null_`]}(0,e):function(n){return"string"==typeof n&&"any"===n}(n)?[`${e}unknown`]:["/* Unknown type */"]}function c(t,e=""){return n(this,void 0,void 0,(function*(){return s(t,e).join("\n")}))}function f(t,e=""){return n(this,void 0,void 0,(function*(){return t?c(JSON.parse(t),e):""}))}function p(t,r=""){return n(this,void 0,void 0,(function*(){const n=e(48);if(null==n)throw new TypeError("Filesystem is only available on node");const o=n.readFileSync(t,"utf8");return c(JSON.parse(o.toString()),r)}))}function y(t,e=""){return n(this,void 0,void 0,(function*(){if("string"!=typeof t)return c(t,e);const n=t.startsWith("file:")?t.substring(5):t.includes(":")?null:t;let r;if(n)return p(n,e);{const n=yield fetch(t);r=yield n.json()}return c(r,e)}))}})(),r})()));