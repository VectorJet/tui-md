import React, { useState } from "react";
import { TextAttributes } from "@opentui/core";
import type { TuiMdTheme } from "../theme";
import type { TuiMdLinkHandler, CodeOptions } from "../index";
import { InlineNode } from "./inline";
import { baseAttrs } from "../utils/attrs";

interface DetailsProps {
  node: {
    tag: "details";
    summaryText?: string;
    children: any[];
  };
  theme: TuiMdTheme;
  depth: number;
  onLinkClick?: TuiMdLinkHandler;
  streaming?: boolean | import("../index").MarkdownStreamingOptions;
  codeOptions?: CodeOptions;
}

export function DetailsBlock({ node, theme, depth, onLinkClick, streaming, codeOptions }: DetailsProps) {
  const [open, setOpen] = useState(false);

  const summaryNode = node.children.find((c: any) => c.tag === "summary" || c.type === "summary");
  const bodyChildren = summaryNode
    ? node.children.filter((c: any) => c !== summaryNode)
    : node.children;

  const arrow = open ? "\u25be " : "\u25b8 ";

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      <text
        fg={theme.accent}
        attributes={TextAttributes.BOLD}
        onMouseDown={(e: any) => {
          e?.stopPropagation?.();
          setOpen((v) => !v);
        }}
      >
        <span fg={theme.muted}>{arrow}</span>
        {node.summaryText
          ? <span>{node.summaryText}</span>
          : summaryNode
            ? summaryNode.children.map((c: any, i: number) => (
                <InlineNode key={i} node={c} attrs={baseAttrs()} theme={theme} />
              ))
            : <span fg={theme.muted}>Details</span>
        }
      </text>

      {open && (
        <box flexDirection="column" paddingLeft={2}>
          {bodyChildren.map((child: any, i: number) => {
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
