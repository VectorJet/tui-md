import type { TuiMdTheme } from "../theme";
import React from "react";
import type { Code } from "mdast";

interface CodeBlockProps {
  node: Code;
  theme: TuiMdTheme;
  streaming?: boolean | import("../index").MarkdownStreamingOptions;
}

import { CodeRenderable, SyntaxStyle, RGBA } from "@opentui/core";
import type { MouseEvent, ScrollBoxRenderable } from "@opentui/core";
import { renderMermaidAscii } from "beautiful-mermaid";
import { truncateDiffByHunk } from "../utils/diff-truncate";
import { getBlockMetrics, clamp } from "../utils/block-metrics";

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


function ScrollableBlock({ contentWidth, height, scrollX, scrollY, children }: {
  contentWidth?: number;
  height: number;
  scrollX: boolean;
  scrollY: boolean;
  children: React.ReactNode;
}) {
  const scrollRef = React.useRef<ScrollBoxRenderable>(null);
  const dragStartRef = React.useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null);

  if (!scrollX && !scrollY) {
    return (
      <box flexDirection="column" width={contentWidth}>
        {children}
      </box>
    );
  }

  return (
    <scrollbox
      ref={scrollRef}
      width="100%"
      height={height}
      scrollX={scrollX}
      scrollY={scrollY}
      focusable={true}
      viewportCulling={true}
      verticalScrollbarOptions={{ visible: false }}
      onMouseDown={(event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        const scrollbox = scrollRef.current;
        if (!scrollbox) return;
        dragStartRef.current = {
          x: event.x,
          y: event.y,
          scrollLeft: scrollbox.scrollLeft,
          scrollTop: scrollbox.scrollTop,
        };
      }}
      onMouseDrag={(event: MouseEvent) => {
        event.stopPropagation();
        event.preventDefault();
        const dragStart = dragStartRef.current;
        const scrollbox = scrollRef.current;
        if (!dragStart || !scrollbox) return;

        scrollbox.scrollTo({
          x: dragStart.scrollLeft + dragStart.x - event.x,
          y: dragStart.scrollTop + dragStart.y - event.y,
        });
      }}
      onMouseUp={(event: MouseEvent) => {
        event.stopPropagation();
        dragStartRef.current = null;
      }}
      onMouseDragEnd={(event: MouseEvent) => {
        event.stopPropagation();
        dragStartRef.current = null;
      }}
      onMouseScroll={(event: MouseEvent) => {
        const scrollbox = scrollRef.current;
        if (!scrollbox || !event.scroll) return;

        const delta = event.scroll.delta || 1;
        const maxScrollLeft = Math.max(0, scrollbox.scrollWidth - scrollbox.viewport.width);
        const maxScrollTop = Math.max(0, scrollbox.scrollHeight - scrollbox.viewport.height);
        let nextScrollLeft = scrollbox.scrollLeft;
        let nextScrollTop = scrollbox.scrollTop;

        if (event.scroll.direction === "left") nextScrollLeft = clamp(scrollbox.scrollLeft - delta, 0, maxScrollLeft);
        if (event.scroll.direction === "right") nextScrollLeft = clamp(scrollbox.scrollLeft + delta, 0, maxScrollLeft);
        if (event.scroll.direction === "up") nextScrollTop = clamp(scrollbox.scrollTop - delta, 0, maxScrollTop);
        if (event.scroll.direction === "down") nextScrollTop = clamp(scrollbox.scrollTop + delta, 0, maxScrollTop);

        if (nextScrollLeft === scrollbox.scrollLeft && nextScrollTop === scrollbox.scrollTop) {
          return;
        }

        event.stopPropagation();
        event.preventDefault();
        scrollbox.scrollTo({ x: nextScrollLeft, y: nextScrollTop });
      }}
    >
      <box flexDirection="column" width={contentWidth}>
        {children}
      </box>
    </scrollbox>
  );
}

import { refractor } from "refractor";

function getColorForClass(className: string, theme: TuiMdTheme): string {
  const cn = className.replace(/^token\s+/, "");
  // Use hardcoded colors matching the original OpenTUI syntax style
  if (cn.includes("keyword")) return "#FF7B72";
  if (cn.includes("string")) return "#A5D6FF";
  if (cn.includes("comment")) return "#8B949E";
  if (cn.includes("number") || cn.includes("boolean")) return "#79C0FF";
  if (cn.includes("function")) return "#D2A8FF";
  if (cn.includes("class-name") || cn.includes("type")) return "#FFA657";
  if (cn.includes("property")) return "#79C0FF";
  if (cn.includes("operator")) return "#79C0FF";
  if (cn.includes("punctuation")) return "#E6EDF3";
  if (cn.includes("variable")) return "#E6EDF3";
  if (cn.includes("builtin")) return "#D2A8FF";
  if (cn.includes("constant")) return "#79C0FF";
  return theme.code ?? "#E6EDF3";
}

type Token = { text: string; color: string };

function processTextNode(value: string, currentColor: string, lines: Token[][]) {
  const parts = value.split("\n");
  for (let i = 0; i < parts.length; i++) {
    if (i > 0) {
      lines.push([]); // new line
    }
    if (parts[i]) {
      lines[lines.length - 1].push({ text: parts[i], color: currentColor });
    }
  }
}

function flattenAST(nodes: any[], currentColor: string, lines: Token[][], theme: TuiMdTheme) {
  for (const node of nodes) {
    if (node.type === "text") {
      processTextNode(node.value, currentColor, lines);
    } else if (node.type === "element") {
      const classNames = (node.properties?.className || []) as string[];
      let nextColor = currentColor;
      if (classNames.length > 0) {
        nextColor = getColorForClass(classNames[classNames.length - 1], theme);
      }
      flattenAST(node.children || [], nextColor, lines, theme);
    }
  }
}

export function CodeBlock({ node, theme, streaming }: CodeBlockProps) {
  const lang = node.lang ?? "";
  
  if (lang === "mermaid") {
    let output = "";
    try {
      output = renderMermaidAscii(node.value, { colorMode: "none" });
    } catch (e: any) {
      output = `[Mermaid render error]: ${e.message}\n\n${node.value}`;
    }
    const metrics = getBlockMetrics(output);
    
    return (
      <box flexDirection="column" width="100%" marginBottom={1}>
        <text fg={theme.muted}>mermaid</text>
        <box flexDirection="column" width="100%" paddingX={1} paddingY={1} borderStyle="rounded" borderColor={theme.border}>
          <ScrollableBlock {...metrics}>
            {output.split("\n").map((line, i) => (
              <text key={i} fg={theme.text} flexShrink={0}>{line}</text>
            ))}
          </ScrollableBlock>
        </box>
      </box>
    );
  }

  const isDiff = lang === "diff" || lang === "patch";
  if (isDiff) {
    let diffStr = node.value;
    let hiddenLinesText = "";

    const streamOpts = typeof streaming === "object" ? streaming : (streaming ? { tailPinDiffs: true, maxDiffLines: 40, maxDiffHunks: 8 } : null);
    
    if (streamOpts?.tailPinDiffs) {
      const { text, hiddenLines, hiddenHunks } = truncateDiffByHunk(diffStr, streamOpts.maxDiffHunks ?? 8, streamOpts.maxDiffLines ?? 40, { fromTail: true });
      diffStr = text;
      if (hiddenHunks > 0 || hiddenLines > 0) {
        hiddenLinesText = `... (${hiddenLines} more lines, ${hiddenHunks} more hunks hidden above)`;
      }
    }
    const metrics = getBlockMetrics(diffStr, hiddenLinesText ? 1 : 0);

    return (
      <box flexDirection="column" width="100%" marginBottom={1} backgroundColor={theme.codeBg} paddingX={1} paddingY={0}>
        <text fg={theme.muted}>{lang}</text>
        {hiddenLinesText && <text fg={theme.muted}>{hiddenLinesText}</text>}
        <ScrollableBlock {...metrics}>
          <diff
            diff={diffStr}
            view="unified"
            syntaxStyle={DEFAULT_SYNTAX_STYLE}
          />
        </ScrollableBlock>
      </box>
    );
  }

  let lines: Token[][] = [[]];
  const defaultColor = theme.code ?? "#E6EDF3";

  if (lang && refractor.registered(lang)) {
    try {
      const ast = refractor.highlight(node.value, lang);
      flattenAST(ast.children, defaultColor, lines, theme);
    } catch (e) {
      flattenAST([{ type: "text", value: node.value }], defaultColor, lines, theme);
    }
  } else {
    flattenAST([{ type: "text", value: node.value }], defaultColor, lines, theme);
  }

  return (
    <box flexDirection="column" width="100%" marginBottom={1} backgroundColor={theme.codeBg} paddingX={1} paddingY={0}>
      {!!lang && <text fg={theme.muted}>{lang}</text>}
      <ScrollableBlock {...getBlockMetrics(node.value)}>
        <box flexDirection="column">
          {lines.map((line, i) => (
            <box key={i} flexDirection="row" flexShrink={0}>
              {line.length === 0 ? (
                <text fg={defaultColor}>{" "}</text>
              ) : (
                line.map((token, j) => (
                  <text key={j} fg={token.color}>{token.text}</text>
                ))
              )}
            </box>
          ))}
        </box>
      </ScrollableBlock>
    </box>
  );
}

function DiffLine({ line, isDiff, theme }: { line: string; isDiff: boolean; theme: TuiMdTheme }) {
  if (!isDiff) return <text fg={theme.code}>{line}</text>;
  if (line.startsWith("+")) return <text fg={theme.diffAdd}>{line}</text>;
  if (line.startsWith("-")) return <text fg={theme.diffDel}>{line}</text>;
  return <text fg={theme.muted}>{line}</text>;
}
