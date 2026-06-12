import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit, SKIP } from "unist-util-visit";
import type { Root } from "mdast";
import { emojiMap } from "./utils/emojiMap";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkFrontmatter from "remark-frontmatter";
import { remarkDefinitionList } from "remark-definition-list";

/**
 * Merges block-level <details>...</details> sequences into a single custom
 * mdast "htmlBlock" node. Remark parses block-level HTML as type-6 HTML blocks
 * ending at blank lines, so <details> and </details> land as separate `html`
 * nodes with the body markdown nodes in between.
 */
function remarkMergeBlockHtml() {
  return (tree: Root) => {
    function processLevel(nodes: any[]): any[] {
      const result: any[] = [];
      let i = 0;

      while (i < nodes.length) {
        const node = nodes[i];

        if (node.type === "html") {
          const value: string = node.value || "";
          const detailsOpen = value.match(/^<details([^>]*)>/im);

          if (detailsOpen) {
            // Extract <summary>...</summary> from the opening html chunk if present
            const summaryMatch = value.match(/<summary>([\s\S]*?)<\/summary>/im);
            const summaryText = summaryMatch ? summaryMatch[1].trim() : "";

            // Scan forward for matching </details>, tracking nesting depth
            let j = i + 1;
            let depth = 1;
            while (j < nodes.length) {
              const c = nodes[j];
              if (c.type === "html") {
                const v = (c.value || "").trim();
                if (/^<details(\s|>)/i.test(v)) depth++;
                else if (/^<\/details>/i.test(v)) {
                  depth--;
                  if (depth === 0) break;
                }
              }
              j++;
            }

            result.push({
              type: "htmlBlock",
              tag: "details",
              attrStr: detailsOpen[1].trim(),
              summaryText,
              children: depth === 0 ? processLevel(nodes.slice(i + 1, j)) : [],
            });
            i = depth === 0 ? j + 1 : i + 1;
            continue;
          }
        }

        // Recurse into container nodes (blockquote, list, listItem, etc.)
        if (node.children && node.type !== "html") {
          node.children = processLevel(node.children);
        }
        result.push(node);
        i++;
      }

      return result;
    }

    (tree as any).children = processLevel((tree as any).children);
  };
}

/**
 * Merges consecutive html open-tag / inner-nodes / html close-tag sequences
 * into a single custom mdast "htmlInline" node so that they can be processed
 * as a group (e.g. for `<kbd>x</kbd>` or `<sub>text</sub>`).
 */
function remarkMergeInlineHtml() {
  return (tree: Root) => {
    visit(tree, (node: any) => {
      if (!Array.isArray(node.children)) return;

      const next: any[] = [];
      let i = 0;

      while (i < node.children.length) {
        const child = node.children[i];

        if (child.type === "html") {
          const openMatch = child.value.trim().match(/^<(\w+)([^>]*)>$/);
          if (openMatch) {
            const [, tag, attrStr] = openMatch;
            const closeRe = new RegExp(`^\\s*<\\/${tag}>\\s*$`, "i");

            // Find the matching close tag, tracking nesting depth
            let j = i + 1;
            let depth = 1;
            while (j < node.children.length) {
              const c = node.children[j];
              if (c.type === "html") {
                const v = c.value.trim();
                if (new RegExp(`^<${tag}(\\s|>)`, "i").test(v)) depth++;
                else if (closeRe.test(v)) {
                  depth--;
                  if (depth === 0) break;
                }
              }
              j++;
            }

            if (depth === 0) {
              next.push({
                type: "htmlInline",
                tag: tag.toLowerCase(),
                attrStr: attrStr.trim(),
                children: node.children.slice(i + 1, j),
              });
              i = j + 1;
              continue;
            }
          }
        }

        next.push(child);
        i++;
      }

      node.children = next;
    });
  };
}

/**
 * Transforms ==text== into { type: 'htmlInline', tag: 'mark', children: [text] }.
 * remark-gfm does not cover this GFM extension.
 */
function remarkMark() {
  return (tree: Root) => {
    const MARK_RE = /==([^=\n]+)==/g;

    visit(tree, "text", (node: any, index: any, parent: any) => {
      if (index == null || !parent) return;
      if (!MARK_RE.test(node.value)) return;
      MARK_RE.lastIndex = 0;

      const parts: any[] = [];
      let last = 0;
      let match: RegExpExecArray | null;

      while ((match = MARK_RE.exec(node.value)) !== null) {
        if (match.index > last) {
          parts.push({ type: "text", value: node.value.slice(last, match.index) });
        }
        parts.push({
          type: "htmlInline",
          tag: "mark",
          attrStr: "",
          children: [{ type: "text", value: match[1] }],
        });
        last = match.index + match[0].length;
      }

      if (last < node.value.length) {
        parts.push({ type: "text", value: node.value.slice(last) });
      }

      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });
  };
}

/**
 * Parses `*[KEY]: definition` lines and wraps every later occurrence of
 * KEY in body text inside an `abbr` mdast node carrying the reference text.
 * The definition lines themselves are stripped from the tree.
 */
function remarkAbbr() {
  return (tree: Root) => {
    const defs = new Map<string, string>();
    const ABBR_DEF_RE = /^\*\[([^\]]+)\]:\s*(.+)$/;

    // Pass 1: collect definitions and prune them
    const children: any[] = (tree as any).children;
    for (let i = children.length - 1; i >= 0; i--) {
      const node = children[i];
      if (node.type !== "paragraph") continue;
      // A defn paragraph contains only text lines matching the pattern.
      const text = (node.children ?? [])
        .map((c: any) => (c.type === "text" ? c.value : ""))
        .join("");
      const lines = text.split(/\r?\n/);
      const matched = lines.map((l: string) => l.match(ABBR_DEF_RE));
      if (matched.every((m: RegExpMatchArray | null) => m)) {
        for (const m of matched) defs.set(m![1], m![2].trim());
        children.splice(i, 1);
      }
    }

    if (defs.size === 0) return;

    // Pass 2: walk text nodes and split on abbreviation occurrences.
    // Build a single regex matching any key on word boundaries.
    const keys = [...defs.keys()].sort((a, b) => b.length - a.length);
    const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const ABBR_RE = new RegExp(`\\b(${keys.map(escape).join("|")})\\b`, "g");

    visit(tree, "text", (node: any, index: any, parent: any) => {
      if (index == null || !parent) return;
      // Don't touch text inside links or code.
      if (parent.type === "link" || parent.type === "inlineCode") return;
      const value: string = node.value;
      ABBR_RE.lastIndex = 0;
      if (!ABBR_RE.test(value)) return;
      ABBR_RE.lastIndex = 0;

      const parts: any[] = [];
      let last = 0;
      let m: RegExpExecArray | null;
      while ((m = ABBR_RE.exec(value)) !== null) {
        if (m.index > last) parts.push({ type: "text", value: value.slice(last, m.index) });
        parts.push({
          type: "abbr",
          abbr: m[1],
          reference: defs.get(m[1])!,
          children: [{ type: "text", value: m[1] }],
        });
        last = m.index + m[0].length;
      }
      if (last < value.length) parts.push({ type: "text", value: value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return [SKIP, index + parts.length];
    });
  };
}

function remarkGemoji() {
  return (tree: Root) => {
    const EMOJI_RE = /:([a-zA-Z0-9_+-]+):/g;

    visit(tree, "text", (node: any, index: any, parent: any) => {
      if (index == null || !parent) return;
      if (!EMOJI_RE.test(node.value)) return;
      EMOJI_RE.lastIndex = 0;

      const parts: any[] = [];
      let last = 0;
      let match: RegExpExecArray | null;

      while ((match = EMOJI_RE.exec(node.value)) !== null) {
        const shortcode = match[1];
        if (emojiMap[shortcode]) {
          if (match.index > last) {
            parts.push({ type: "text", value: node.value.slice(last, match.index) });
          }
          parts.push({ type: "text", value: emojiMap[shortcode] });
          last = match.index + match[0].length;
        }
      }

      if (last > 0) {
        if (last < node.value.length) {
          parts.push({ type: "text", value: node.value.slice(last) });
        }
        parent.children.splice(index, 1, ...parts);
        // The splice modifies the parent. We return the updated index to continue visiting properly.
        return index + parts.length;
      }
    });
  };
}

/**
 * Resolves linkReference and imageReference nodes into standard link and image nodes,
 * using the definition nodes present in the document.
 */
function remarkResolveLinks() {
  return (tree: Root) => {
    const definitions = new Map<string, any>();
    
    visit(tree, 'definition', (node: any, index: any, parent: any) => {
      if (index == null || !parent) return;
      definitions.set((node.identifier || '').toUpperCase(), node);
      // Do not remove the definition so it can be rendered by BlockNode
    });

    visit(tree, ['linkReference', 'imageReference'], (node: any) => {
      const def = definitions.get((node.identifier || '').toUpperCase());
      if (def) {
        if (node.type === 'linkReference') {
          node.type = 'link';
          node.url = def.url;
          node.title = def.title;
        } else if (node.type === 'imageReference') {
          node.type = 'image';
          node.url = def.url;
          node.title = def.title;
        }
      }
    });
  };
}

const pipeline = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkDefinitionList)
  .use(remarkAbbr)
  .use(remarkMergeInlineHtml)
  .use(remarkMergeBlockHtml)
  .use(remarkMark)
  .use(remarkGemoji)
  .use(remarkAlert)
  .use(remarkResolveLinks);

/**
 * Parse a markdown string into an mdast Root node.
 * Safe to call on partial/streaming content.
 *
 * Uses `parse` + `runSync` so the inline-html merger and ==mark==
 * transformers actually run (unified's `.parse` alone skips them).
 */
export function parse(markdown: string): Root {
  const tree = pipeline.parse(markdown);
  return pipeline.runSync(tree) as Root;
}

/**
 * For streaming: parse partial content and inject the
 * block cursor into the last text leaf of the tree.
 */
export function parseStreaming(markdown: string, cursor = "█"): Root {
  const ast = parse(markdown);
  injectCursor(ast, cursor);
  return ast;
}

function injectCursor(node: any, cursor: string): boolean {
  if (!node.children?.length) {
    if (node.type === "text" || node.type === "inlineCode") {
      node.value = (node.value ?? "") + cursor;
      return true;
    }
    return false;
  }
  for (let i = node.children.length - 1; i >= 0; i--) {
    if (injectCursor(node.children[i], cursor)) return true;
  }
  return false;
}
