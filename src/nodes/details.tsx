import React, { useState } from "react";
import { TextAttributes } from "@opentui/core";
import type { TuiMdTheme } from "../theme";
import type { TuiMdLinkHandler } from "../index";
import { InlineNode } from "./inline";
import { baseAttrs } from "../utils/attrs";

interface DetailsProps {
  node: {
    tag: "details";
    children: any[];
  };
  theme: TuiMdTheme;
  depth: number;
  onLinkClick?: TuiMdLinkHandler;
  streaming?: boolean | import("../index").MarkdownStreamingOptions;
  codeOptions?: import("../index").CodeOptions;
}

export function DetailsBlock({ node, theme, depth, onLinkClick, streaming, codeOptions }: DetailsProps) {
  const [open, setOpen] = useState(false);

  // Split children into <summary> and the rest
  const summaryNode = node.children.find((c: any) => c.tag === "summary" || c.type === "summary");
  const bodyChildren = node.children.filter((c: any) => c !== summaryNode);

  // Extract summary text from its children, falling back to "Details"
  const summaryChildren: any[] = summaryNode?.children ?? [];
  const hasSummary = summaryChildren.length > 0;

  const arrow = open ? "▾ " : "▸ ";

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      {/* Summary / toggle row */}
      <text
        fg={theme.accent}
        attributes={TextAttributes.BOLD}
        onMouseDown={(e: any) => {
          e?.stopPropagation?.();
          setOpen((v) => !v);
        }}
      >
        <span fg={theme.muted}>{arrow}</span>
        {hasSummary
          ? summaryChildren.map((c: any, i: number) => (
              <InlineNode key={i} node={c} attrs={baseAttrs()} theme={theme} />
            ))
          : <span fg={theme.muted}>Details</span>
        }
      </text>

      {/* Body — only when open */}
      {open && (
        <box flexDirection="column" paddingLeft={2}>
          {bodyChildren.map((child: any, i: number) => {
            // Lazy import to avoid circular dep — BlockNode is in blocks.tsx
            const { BlockNode } = require("./blocks");
            return (
              <BlockNode
                key={i}
                node={child}
                theme={theme}
                depth={depth + 1}
                onLinkClick={onLinkClick}
                streaming={streaming}
                codeOptions={codeOptions}
              />
            );
          })}
        </box>
      )}
    </box>
  );
}
