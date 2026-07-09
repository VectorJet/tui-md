import React from "react";
import type { Heading } from "mdast";
import { TextAttributes } from "@opentui/core";
import type { TuiMdTheme } from "../theme";
import { alphabets } from "../texicode/arts";

const HEADING_FG_KEYS = ["text", "h1", "h2", "h3", "h4", "h5", "h6"] as const;

// Per-level Unicode font from arts.ts alphabets.
// H1/H2: serif bold — 𝐀𝐁𝐂 — heaviest visual weight
// H3/H4: sans bold  — 𝗔𝗕𝗖
// H5/H6: sans       — 𝖠𝖡𝖢 — still distinct from normal body text
const HEADING_FONT: Record<number, keyof typeof alphabets> = {
  1: "serif_bld",
  2: "serif_bld",
  3: "sans_bld",
  4: "sans_bld",
  5: "sans",
  6: "sans",
};

const NORMAL_CHARS = Array.from(alphabets.normal);

/** Map each character to its Unicode math alphabet equivalent. Non-alpha chars pass through. */
function toUnicodeFont(text: string, fontKey: keyof typeof alphabets): string {
  const fontChars = Array.from(alphabets[fontKey]);
  return Array.from(text)
    .map((ch) => {
      const idx = NORMAL_CHARS.indexOf(ch);
      return idx !== -1 ? fontChars[idx] : ch;
    })
    .join("");
}

/** Recursively extract plain text from mdast inline nodes. */
function extractText(children: any[]): string {
  let out = "";
  for (const c of children) {
    if (!c) continue;
    if (c.type === "text" || c.type === "inlineCode") out += c.value ?? "";
    else if (Array.isArray(c.children)) out += extractText(c.children);
  }
  return out;
}

interface HeadingBlockProps {
  node: Heading;
  theme: TuiMdTheme;
}

export function HeadingBlock({ node, theme }: HeadingBlockProps) {
  const level = Math.min(node.depth, 6) as 1 | 2 | 3 | 4 | 5 | 6;
  const fg = theme[HEADING_FG_KEYS[level]] ?? theme.accent;
  const fontKey = HEADING_FONT[level];
  const plain = extractText(node.children as any[]);
  const rendered = toUnicodeFont(plain, fontKey);

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      <text fg={fg} attributes={TextAttributes.BOLD}>
        {rendered}
      </text>
    </box>
  );
}
