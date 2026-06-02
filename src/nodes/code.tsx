import type { TuiMdTheme } from "../theme";
import React from "react";
import type { Code } from "mdast";

interface CodeBlockProps {
  node: Code;
  theme: TuiMdTheme;
}

import { CodeRenderable, SyntaxStyle, RGBA } from "@opentui/core";
import { renderMermaidAscii } from "beautiful-mermaid";

const DEFAULT_SYNTAX_STYLE = SyntaxStyle.fromStyles({
  default: { fg: RGBA.fromHex("#E6EDF3") },
  keyword: { fg: RGBA.fromHex("#FF7B72"), bold: true },
  "keyword.import": { fg: RGBA.fromHex("#FF7B72"), bold: true },
  "keyword.operator": { fg: RGBA.fromHex("#FF7B72") },
  "keyword.function": { fg: RGBA.fromHex("#FF7B72"), bold: true },
  "keyword.control": { fg: RGBA.fromHex("#FF7B72"), bold: true },

  string: { fg: RGBA.fromHex("#A5D6FF") },
  comment: { fg: RGBA.fromHex("#8B949E"), italic: true },
  number: { fg: RGBA.fromHex("#79C0FF") },
  boolean: { fg: RGBA.fromHex("#79C0FF") },
  constant: { fg: RGBA.fromHex("#79C0FF") },

  function: { fg: RGBA.fromHex("#D2A8FF") },
  "function.call": { fg: RGBA.fromHex("#D2A8FF") },
  "function.method.call": { fg: RGBA.fromHex("#D2A8FF") },
  "function.builtin": { fg: RGBA.fromHex("#D2A8FF") },
  type: { fg: RGBA.fromHex("#FFA657") },
  "type.builtin": { fg: RGBA.fromHex("#FFA657") },
  constructor: { fg: RGBA.fromHex("#FFA657") },

  variable: { fg: RGBA.fromHex("#E6EDF3") },
  "variable.member": { fg: RGBA.fromHex("#79C0FF") },
  "variable.builtin": { fg: RGBA.fromHex("#79C0FF") },
  "variable.parameter": { fg: RGBA.fromHex("#FFA657") },
  property: { fg: RGBA.fromHex("#79C0FF") },
  
  punctuation: { fg: RGBA.fromHex("#E6EDF3") },
  "punctuation.bracket": { fg: RGBA.fromHex("#E6EDF3") },
  "punctuation.delimiter": { fg: RGBA.fromHex("#E6EDF3") },
  operator: { fg: RGBA.fromHex("#79C0FF") },
});

export function CodeBlock({ node, theme }: CodeBlockProps) {
  const lang = node.lang ?? "";
  
  if (lang === "mermaid") {
    let output = "";
    try {
      output = renderMermaidAscii(node.value, { colorMode: "none" });
    } catch (e: any) {
      output = `[Mermaid render error]: ${e.message}\n\n${node.value}`;
    }
    
    return (
      <box flexDirection="column" width="100%" marginBottom={1}>
        <text fg={theme.muted}>mermaid</text>
        <box flexDirection="column" width="100%" paddingX={1} paddingY={1} borderStyle="rounded" borderColor={theme.border}>
          {output.split("\n").map((line, i) => (
            <text key={i} fg={theme.text}>{line}</text>
          ))}
        </box>
      </box>
    );
  }

  const isDiff = lang === "diff" || lang === "patch";
  if (isDiff) {
    return (
      <box flexDirection="column" width="100%" marginBottom={1} backgroundColor={theme.codeBg} paddingX={1} paddingY={0}>
        <text fg={theme.muted}>{lang}</text>
        <diff 
          diff={node.value} 
          view="unified" 
          syntaxStyle={DEFAULT_SYNTAX_STYLE}
        />
      </box>
    );
  }

  return (
    <box flexDirection="column" width="100%" marginBottom={1} backgroundColor={theme.codeBg} paddingX={1} paddingY={0}>
      {!!lang && <text fg={theme.muted}>{lang}</text>}
      <code
        content={node.value}
        filetype={lang}
        syntaxStyle={DEFAULT_SYNTAX_STYLE}
        conceal={false}
      />
    </box>
  );
}

function DiffLine({ line, isDiff, theme }: { line: string; isDiff: boolean; theme: TuiMdTheme }) {
  if (!isDiff) return <text fg={theme.code}>{line}</text>;
  if (line.startsWith("+")) return <text fg={theme.diffAdd}>{line}</text>;
  if (line.startsWith("-")) return <text fg={theme.diffDel}>{line}</text>;
  return <text fg={theme.muted}>{line}</text>;
}
