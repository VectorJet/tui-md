import React, { useMemo } from "react";
import type { Heading } from "mdast";
import { TextAttributes } from "@opentui/core";
import type { TuiMdTheme } from "../theme";
import { InlineNode } from "./inline";
import { mergeAttrs, baseAttrs } from "../utils/attrs";
import { renderHeading } from "../utils/font-raster";
import { toString as mdastToString } from "hast-util-to-string";

const HEADING_FG_KEYS = ["text", "h1", "h2", "h3", "h4", "h5", "h6"] as const;

interface HeadingBlockProps {
  node: Heading;
  theme: TuiMdTheme;
}

export function HeadingBlock({ node, theme }: HeadingBlockProps) {
  const level = Math.min(node.depth, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const fg = theme[HEADING_FG_KEYS[level]] ?? theme.accent;

  // Extract plain text from heading children for rasterization.
  const plainText = useMemo(() => {
    function extract(nodes: any[]): string {
      return nodes
        .map((n: any) => {
          if (n.type === "text") return n.value ?? "";
          if (n.children) return extract(n.children);
          return "";
        })
        .join("");
    }
    return extract(node.children as any[]);
  }, [node.children]);

  const rows = useMemo(() => renderHeading(plainText, level), [plainText, level]);

  if (rows.length === 0) return null;

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      {rows.map((row, i) => (
        <text key={i} fg={fg}>{row}</text>
      ))}
    </box>
  );
}
