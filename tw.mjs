import { compile } from "/Users/B/Cortex/dev/studio-anm/node_modules/tailwindcss/dist/lib.mjs";
const css = `@theme dark { --color-x: red; } @theme light { --color-y: blue; }`;
try { const c = await compile(css, {}); console.log(c.build(["bg-x","bg-y"])); } catch (e) { console.log("ERR", e.message); }
