import { render } from "@opentui/react";
import React from "react";
import fs from "fs";
import { Markdown } from "./src/index.js";

const md = fs.readFileSync("./assets/markdown-test.md", "utf-8");

render(
  <box flexDirection="column">
    <Markdown>{md}</Markdown>
  </box>
);
