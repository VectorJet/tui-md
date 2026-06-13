import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import React from "react";
import fs from "fs";
import { Markdown } from "./src/index.js";

const md = fs.readFileSync("./assets/markdown-test.md", "utf-8");

const renderer = await createCliRenderer();
createRoot(renderer).render(
  <scrollbox
    width={process.stdout.columns}
    height={process.stdout.rows}
    scrollbarY={true}
  >
    <Markdown content={md} codeOptions={{ lineNumbers: true }} />
  </scrollbox>
);
