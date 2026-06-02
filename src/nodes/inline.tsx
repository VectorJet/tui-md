import type { TuiMdTheme } from "../theme";
import React from "react";
import type { PhrasingContent, HTML } from "mdast";
import { toTextAttributes, mergeAttrs, type InlineAttrs } from "../utils/attrs";
import { toSuperscript, toSubscript } from "../utils/unicode";
import { MathInline } from "./math";

interface InlineProps {
  node: PhrasingContent | HTML | HtmlInlineNode;
  attrs: InlineAttrs;
  theme: TuiMdTheme;
}

/** Custom node produced by remarkMergeInlineHtml. */
interface HtmlInlineNode {
  type: "htmlInline";
  tag: string;
  attrStr?: string;
  children: any[];
}

function LinkNode({ node, attrs, theme }: InlineProps) {
  const Link = "a" as any;
  const linkAttrs = mergeAttrs(attrs, { underline: true, fg: theme.link });

  return (
    <Link
      href={(node as any).url}
      attributes={toTextAttributes(linkAttrs)}
      fg={theme.link}
    >
      {(node as any).children.map((c: any, i: number) => (
        <InlineNode key={i} node={c} attrs={linkAttrs} theme={theme} />
      ))}
    </Link>
  );
}

export function InlineNode({ node, attrs, theme }: InlineProps): React.ReactNode {
  switch (node.type) {
    case "text":
      return (
        <span
          attributes={toTextAttributes(attrs)}
          fg={attrs.code ? theme.code : attrs.fg ?? theme.text}
          bg={attrs.bg}
        >
          {(node as any).value}
        </span>
      );

    case "strong": {
      const next = mergeAttrs(attrs, { bold: true });
      return <>{(node as any).children.map((c: any, i: number) => <InlineNode key={i} node={c} attrs={next} theme={theme} />)}</>;
    }

    case "emphasis": {
      const next = mergeAttrs(attrs, { italic: true });
      return <>{(node as any).children.map((c: any, i: number) => <InlineNode key={i} node={c} attrs={next} theme={theme} />)}</>;
    }

    case "delete": {
      // GFM strikethrough: ~~text~~
      const next = mergeAttrs(attrs, { strikethrough: true });
      return <>{(node as any).children.map((c: any, i: number) => <InlineNode key={i} node={c} attrs={next} theme={theme} />)}</>;
    }

    case "inlineCode":
      return (
        <span
          attributes={toTextAttributes(mergeAttrs(attrs, { code: true }))}
          fg={theme.code}
          bg={theme.codeBg}
        >
          {` ${(node as any).value} `}
        </span>
      );

    case "link":
      return <LinkNode node={node} attrs={attrs} theme={theme} />;

    case "image":
      return (
        <span fg={theme.link} attributes={toTextAttributes(mergeAttrs(attrs, { underline: true }))}>
          {`[image: ${(node as any).alt ?? (node as any).url}]`}
        </span>
      );

    case "break":
      return <br />;

    case "html":
      // Unmerged stray html tokens (open without close, comments, etc.) — drop
      return null;

    case "htmlInline" as any:
      return <HtmlInline node={node as HtmlInlineNode} attrs={attrs} theme={theme} />;

    // math inline (remark-math) — render via KaTeX MathML→Unicode
    case "inlineMath":
      return <MathInline value={(node as any).value} theme={theme} />;

    default:
      return null;
  }
}

/** Render a merged inline-html element with its children. */
function HtmlInline({ node, attrs, theme }: { node: HtmlInlineNode; attrs: InlineAttrs; theme: TuiMdTheme }) {
  const tag = node.tag.toLowerCase();
  const renderChildren = (next: InlineAttrs) =>
    node.children.map((c, i) => <InlineNode key={i} node={c} attrs={next} theme={theme} />);

  switch (tag) {
    case "sub":
      // Unicode subscript chars are visually distinct; fallback `_(text)` is self-evident.
      return (
        <span fg={attrs.fg ?? theme.text} attributes={toTextAttributes(attrs)}>
          {toSubscript(extractText(node.children))}
        </span>
      );

    case "sup":
      return (
        <span fg={attrs.fg ?? theme.text} attributes={toTextAttributes(attrs)}>
          {toSuperscript(extractText(node.children))}
        </span>
      );

    case "kbd": {
      // Render as a "key cap": bracketed, bg-tinted, key-by-key separated by gray '+'.
      const text = extractText(node.children);
      const keys = text.split(/\s*\+\s*/);
      return (
        <>
          {keys.map((k, i) => (
            <React.Fragment key={i}>
              {i > 0 ? <span fg={theme.muted} attributes={toTextAttributes(attrs)}>{" + "}</span> : null}
              <span fg={theme.muted} attributes={toTextAttributes(attrs)}>{"["}</span>
              <span fg={theme.kbd} bg={theme.kbdBg} attributes={toTextAttributes(mergeAttrs(attrs, { bold: true }))}>
                {` ${k} `}
              </span>
              <span fg={theme.muted} attributes={toTextAttributes(attrs)}>{"]"}</span>
            </React.Fragment>
          ))}
        </>
      );
    }

    case "mark":
      return (
        <span fg={theme.highlightFg} bg={theme.highlightBg} attributes={toTextAttributes(attrs)}>
          {renderChildren(mergeAttrs(attrs, { fg: theme.highlightFg, bg: theme.highlightBg }))}
        </span>
      );

    case "u":
      return <>{renderChildren(mergeAttrs(attrs, { underline: true }))}</>;

    case "ins":
      // Treat <ins> as an additive diff: underline + green accent.
      return (
        <span fg={theme.diffAdd} attributes={toTextAttributes(mergeAttrs(attrs, { underline: true }))}>
          {renderChildren(mergeAttrs(attrs, { underline: true, fg: theme.diffAdd }))}
        </span>
      );

    case "del":
      // Treat <del> as a removal diff: strikethrough + red/muted.
      return (
        <span fg={theme.diffDel} attributes={toTextAttributes(mergeAttrs(attrs, { strikethrough: true }))}>
          {renderChildren(mergeAttrs(attrs, { strikethrough: true, fg: theme.diffDel }))}
        </span>
      );

    case "s":
    case "strike":
      return <>{renderChildren(mergeAttrs(attrs, { strikethrough: true }))}</>;

    case "small":
      return (
        <span fg={theme.muted} attributes={toTextAttributes(attrs)}>
          {renderChildren(mergeAttrs(attrs, { fg: theme.muted }))}
        </span>
      );

    case "b":
    case "strong":
      return <>{renderChildren(mergeAttrs(attrs, { bold: true }))}</>;

    case "i":
    case "em":
    case "cite":
    case "dfn":
    case "var":
      return <>{renderChildren(mergeAttrs(attrs, { italic: true }))}</>;

    case "code":
    case "samp":
    case "tt":
      return (
        <span fg={theme.code} bg={theme.codeBg} attributes={toTextAttributes(mergeAttrs(attrs, { code: true }))}>
          {` ${extractText(node.children)} `}
        </span>
      );

    case "abbr":
      // Underline; ignore title attribute (no hover in TUI).
      return <>{renderChildren(mergeAttrs(attrs, { underline: true }))}</>;

    case "br":
      return <br />;

    default:
      // Unknown inline tag: render children with current attrs (acts as passthrough).
      return <>{renderChildren(attrs)}</>;
  }
}

/** Flatten an inline subtree to plain text. Used by sub/sup/kbd which need raw chars. */
function extractText(children: any[]): string {
  let out = "";
  for (const c of children) {
    if (!c) continue;
    if (c.type === "text" || c.type === "inlineCode") out += c.value ?? "";
    else if (Array.isArray(c.children)) out += extractText(c.children);
  }
  return out;
}
