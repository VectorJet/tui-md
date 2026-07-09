import React from "react";
import type { Heading } from "mdast";
import { TextAttributes } from "@opentui/core";
import type { TuiMdTheme } from "../theme";
import { InlineNode } from "./inline";
import { baseAttrs, mergeAttrs } from "../utils/attrs";
import { toUnicodeHeading } from "../utils/unicode-heading";

const HEADING_FG_KEYS = ["text", "h1", "h2", "h3", "h4", "h5", "h6"] as const;

interface HeadingBlockProps {
  node: Heading;
  theme: TuiMdTheme;
}

/**
 * Walk a heading's children and transform any plain text nodes into the
 * Unicode Mathematical font variant for this heading level.
 * Non-text inline nodes (code, emphasis, etc.) pass through untouched.
 */
function transformChildren(children: any[], level: number): any[] {
  return children.map((child) => {
    if (child.type === "text") {
      return { ...child, value: toUnicodeHeading(child.value, level) };
    }
    if (child.children) {
      return { ...child, children: transformChildren(child.children, level) };
    }
    return child;
  });
}

export function HeadingBlock({ node, theme }: HeadingBlockProps) {
  const level = Math.min(node.depth, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const fg = theme[HEADING_FG_KEYS[level]] ?? theme.accent;
  const attrs = mergeAttrs(baseAttrs(), { bold: true, fg });
  const transformedChildren = transformChildren(node.children as any[], level);

  return (
    <box flexDirection="row" width="100%" marginBottom={1}>
      <text fg={fg} attributes={TextAttributes.BOLD}>
        {transformedChildren.map((c, i) => (
          <InlineNode key={i} node={c} attrs={attrs} theme={theme} />
        ))}
      </text>
    </box>
  );
}
