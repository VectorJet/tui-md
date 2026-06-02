import React from "react";
import type { Root, Content } from "mdast";
import { BlockNode } from "./nodes/blocks";
import { CodeBlock } from "./nodes/code";
import { TableBlock } from "./nodes/table";
import { MathBlock } from "./nodes/math";
import type { TuiMdTheme } from "./theme";

interface WalkProps {
  ast: Root;
  theme: TuiMdTheme;
}

export function Walk({ ast, theme }: WalkProps) {
  return (
    <box flexDirection="column" width="100%">
      {ast.children.map((node, i) => (
        <Node key={i} node={node} theme={theme} />
      ))}
    </box>
  );
}

function Node({ node, theme }: { node: Content; theme: TuiMdTheme }) {
  switch (node.type) {
    case "code":
      return <CodeBlock node={node} theme={theme} />;
    case "table":
      return <TableBlock node={node} theme={theme} />;
    case "math":
      // remark-math block: $$...$$
      return <MathBlock value={(node as any).value} theme={theme} />;
    // All block-level nodes handled in blocks.tsx
    default:
      return <BlockNode node={node as any} theme={theme} />;
  }
}
