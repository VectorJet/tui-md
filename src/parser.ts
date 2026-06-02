import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { visit, SKIP } from "unist-util-visit";
import type { Root } from "mdast";
import { emojiMap } from "./utils/emojiMap";
import { remarkAlert } from "remark-github-blockquote-alert";
import remarkFrontmatter from "remark-frontmatter";

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

const pipeline = unified()
  .use(remarkParse)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkMergeInlineHtml)
  .use(remarkMark)
  .use(remarkGemoji)
  .use(remarkAlert);

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
