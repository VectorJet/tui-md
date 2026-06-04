import type { TuiMdTheme } from "../theme";
import React, { useState } from "react";
import type { BlockContent, DefinitionContent, Heading, Blockquote, List, ListItem, Paragraph, FootnoteDefinition } from "mdast";
import { InlineNode } from "./inline";
import { baseAttrs, mergeAttrs, toTextAttributes } from "../utils/attrs";
import { TextAttributes } from "@opentui/core";
import { useRenderer } from "@opentui/react";
import { openUrl } from "../utils/open";
import type { TuiMdLinkHandler } from "../index";
import { ImageBlock } from "./image";

type DefListData = { type: "defList"; children: DefListChild[] };
type DefListChild =
  | { type: "defListTerm"; children: any[] }
  | { type: "defListDescription"; children: any[] };

interface BlockProps {
  node: BlockContent | DefinitionContent;
  theme: TuiMdTheme;
  depth?: number;
  onLinkClick?: TuiMdLinkHandler;
}

const HEADING_FG_KEYS = ["text", "h1", "h2", "h3", "h4", "h5", "h6"] as const;
const HEADING_PREFIXES = ["", "# ", "## ", "### ", "#### ", "##### ", "###### "];

function ClickableLinkText({ node, theme, onLinkClick }: { node: any; theme: TuiMdTheme; onLinkClick?: TuiMdLinkHandler }) {
  const [isHovered, setIsHovered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const renderer = useRenderer();
  const attrs = mergeAttrs(baseAttrs(), {
    underline: isHovered,
    fg: isHovered ? theme.accent : theme.link,
    bg: isHovered ? theme.codeBg : undefined,
  });

  return (
    <text
      flexShrink={1}
      fg={isHovered ? theme.accent : theme.link}
      bg={isHovered ? theme.codeBg : undefined}
      attributes={toTextAttributes(attrs)}
      onMouseOver={() => setIsHovered(true)}
      onMouseOut={() => setIsHovered(false)}
      onMouseDown={async (event: any) => {
        event?.stopPropagation?.();
        setError(null);
        if (!node.url) return;

        const result = onLinkClick ? await onLinkClick(node.url) : await openUrl(node.url, { renderer });
        if (result && !result.ok) {
          setError(result.reason === "file-not-found" ? " file not found" : ` ${result.message || "open failed"}`);
        }
      }}
    >
      {node.children.map((child: any, index: number) => (
        <InlineNode key={index} node={child} attrs={attrs} theme={theme} />
      ))}
      {error ? <span fg={theme.diffDel} attributes={TextAttributes.NONE}>{error}</span> : null}
    </text>
  );
}

export function BlockNode({ node, theme, depth = 0, onLinkClick }: BlockProps): React.ReactNode {
  switch (node.type) {
    case "paragraph": {
      const children = (node as Paragraph).children;
      const groups: React.ReactNode[] = [];
      let currentGroup: any[] = [];
      
      const flush = () => {
        if (currentGroup.length > 0) {
          groups.push(
            <text key={groups.length} flexShrink={1}>
              {currentGroup.map((c, i) => (
                <InlineNode key={i} node={c as any} attrs={baseAttrs()} theme={theme} />
              ))}
            </text>
          );
          currentGroup = [];
        }
      };

      for (const child of children) {
        if (child.type === "inlineMath") {
          flush();
          groups.push(
            <text key={groups.length} flexShrink={0}>
              <InlineNode node={child as any} attrs={baseAttrs()} theme={theme} />
            </text>
          );
        } else if (child.type === "link") {
          flush();
          groups.push(<ClickableLinkText key={groups.length} node={child as any} theme={theme} onLinkClick={onLinkClick} />);
        } else if (child.type === "image") {
          flush();
          groups.push(<ImageBlock key={groups.length} node={child as any} theme={theme} />);
        } else {
          currentGroup.push(child);
        }
      }
      flush();

      return (
        <box flexDirection="row" flexWrap="wrap" width="100%" marginBottom={1} alignItems="center">
          {groups}
        </box>
      );
    }

    case "heading": {
      const h = node as Heading;
      const level = Math.min(h.depth, 6) as 1|2|3|4|5|6;
      const fg = theme[HEADING_FG_KEYS[level]] ?? theme.accent;
      return (
        <box flexDirection="row" width="100%" marginBottom={1}>
          <text fg={fg} attributes={TextAttributes.BOLD}>
            <span fg={theme.muted}>{HEADING_PREFIXES[level]}</span>
            {h.children.map((c, i) => (
              <InlineNode key={i} node={c as any} attrs={mergeAttrs(baseAttrs(), { bold: true, fg })} theme={theme} />
            ))}
          </text>
        </box>
      );
    }

    case "yaml" as any: {
      const yamlStr = (node as any).value || "";
      return (
        <box flexDirection="column" width="100%" marginBottom={1} borderStyle="rounded" borderColor={theme.muted}>
          <text fg={theme.muted} attributes={TextAttributes.BOLD}>{" FRONT MATTER "}</text>
          <text fg={theme.muted}>{yamlStr}</text>
        </box>
      );
    }

    case "blockquote": {
      const bq = node as Blockquote;
      const classes = (bq.data as any)?.hProperties?.className || [];
      const classArray = Array.isArray(classes) ? classes : [classes];
      const isAlert = classArray.includes("markdown-alert");

      if (isAlert) {
        // Find alert type (e.g. markdown-alert-note)
        const alertClass = classArray.find((c: string) => c.startsWith("markdown-alert-")) || "markdown-alert-note";
        const alertType = alertClass.replace("markdown-alert-", "");
        
        // Map alert type to colors/icons
        let alertColor = theme.accent;
        let alertTitle = "Note";
        
        switch (alertType) {
          case "note": alertColor = "#0969da"; alertTitle = "Note"; break;
          case "tip": alertColor = "#1a7f37"; alertTitle = "Tip"; break;
          case "important": alertColor = "#8250df"; alertTitle = "Important"; break;
          case "warning": alertColor = "#bf8700"; alertTitle = "Warning"; break;
          case "caution": alertColor = "#cf222e"; alertTitle = "Caution"; break;
        }

        // The first child is usually the title paragraph with the SVG. We can skip it.
        const contentChildren = bq.children.filter((c: any) => 
          !(c.type === "paragraph" && (c.data?.hProperties as any)?.className === "markdown-alert-title")
        );

        return (
          <box flexDirection="row" width="100%" marginBottom={1}>
            <text fg={alertColor} flexShrink={0}>{"\u258c "}</text>
            <box flexDirection="column" flexGrow={1} flexShrink={1}>
              <box flexDirection="row" marginBottom={0}>
                <text bg={alertColor} fg="#ffffff" attributes={TextAttributes.BOLD}>{` ${alertTitle.toUpperCase()} `}</text>
              </box>
              {contentChildren.map((c, i) => (
                <BlockNode key={i} node={c as any} theme={theme} depth={depth + 1} onLinkClick={onLinkClick} />
              ))}
            </box>
          </box>
        );
      }

      return (
        <box flexDirection="row" width="100%" marginBottom={1}>
          {/* Left gutter — the "border" */}
          <text fg={theme.border} flexShrink={0}>{"\u2502 "}</text>
          <box flexDirection="column" flexGrow={1} flexShrink={1}>
            {bq.children.map((c, i) => (
              <BlockNode key={i} node={c as any} theme={{ ...theme, text: theme.muted }} depth={depth + 1} onLinkClick={onLinkClick} />
            ))}
          </box>
        </box>
      );
    }

    case "list": {
      const list = node as List;
      return (
        <box flexDirection="column" width="100%" marginBottom={1} paddingLeft={depth > 0 ? 2 : 0}>
          {list.children.map((item, i) => (
            <ListItemNode
              key={i}
              node={item}
              index={i}
              ordered={list.ordered ?? false}
              start={list.start ?? 1}
              theme={theme}
              depth={depth}
              onLinkClick={onLinkClick}
            />
          ))}
        </box>
      );
    }

    case "thematicBreak":
      return (
        <box width="100%" marginBottom={1}>
          <text fg={theme.border}>{"─".repeat(40)}</text>
        </box>
      );

    case "footnoteDefinition": {
      const fn = node as FootnoteDefinition;
      return (
        <box flexDirection="row" flexWrap="wrap" width="100%" marginBottom={1}>
          <text fg={theme.muted}>[^{fn.identifier}]: </text>
          <box flexDirection="column" flexGrow={1}>
            {fn.children.map((c, i) => <BlockNode key={i} node={c as any} theme={theme} depth={depth} onLinkClick={onLinkClick} />)}
          </box>
        </box>
      );
    }

    case "defList" as any:
      return <DefListBlock node={node as unknown as DefListData} theme={theme} depth={depth} onLinkClick={onLinkClick} />;

    default:
      return null;
  }
}

interface ListItemProps {
  node: ListItem;
  index: number;
  ordered: boolean;
  start: number;
  theme: TuiMdTheme;
  depth: number;
  onLinkClick?: TuiMdLinkHandler;
}

function ListItemNode({ node, index, ordered, start, theme, depth, onLinkClick }: ListItemProps) {
  const bullet = ordered ? `${start + index}. ` : depth === 0 ? "\u2022 " : depth === 1 ? "\u25e6 " : "\u25aa ";
  const isTask = node.checked !== null && node.checked !== undefined;
  const checkbox = isTask ? (node.checked ? "[x] " : "[ ] ") : "";

  return (
    <box flexDirection="column" width="100%">
      <box flexDirection="row" width="100%">
        <text fg={theme.list} flexShrink={0}>{bullet}{checkbox}</text>
        <box flexDirection="column" flexGrow={1} flexShrink={1}>
          {node.children.map((c, i) => (
            <BlockNode key={i} node={c as any} theme={theme} depth={depth + 1} onLinkClick={onLinkClick} />
          ))}
        </box>
      </box>
    </box>
  );
}

function DefListBlock({ node, theme, depth, onLinkClick }: { node: DefListData; theme: TuiMdTheme; depth: number; onLinkClick?: TuiMdLinkHandler }) {
  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      {node.children.map((child, i) => {
        if (child.type === "defListTerm") {
          return (
            <box key={i} flexDirection="row" width="100%">
              <text fg={theme.accent} attributes={TextAttributes.BOLD}>
                {child.children.map((c: any, j: number) => (
                  <InlineNode key={j} node={c} attrs={mergeAttrs(baseAttrs(), { bold: true, fg: theme.accent })} theme={theme} />
                ))}
              </text>
            </box>
          );
        }
        // defListDescription
        return (
          <box key={i} flexDirection="row" width="100%">
            <text fg={theme.muted} flexShrink={0}>{"  : "}</text>
            <box flexDirection="column" flexGrow={1} flexShrink={1}>
              {child.children.map((c: any, j: number) => (
                <BlockNode key={j} node={c} theme={theme} depth={depth + 1} onLinkClick={onLinkClick} />
              ))}
            </box>
          </box>
        );
      })}
    </box>
  );
}
