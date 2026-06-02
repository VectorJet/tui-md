import { parse } from "./src/parser.ts";

const md = `---
title: Test
---

> [!NOTE]
> This is a note.
`;
const ast = parse(md);
console.log(JSON.stringify(ast, null, 2));
