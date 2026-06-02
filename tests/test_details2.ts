import { parse } from "./src/parser.ts";

const md = `<details>

<summary>Click me</summary>

This is inside the details block.

</details>`;
const ast = parse(md);
console.log(JSON.stringify(ast, null, 2));
