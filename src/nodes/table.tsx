import type { TuiMdTheme } from "../theme";
import React from "react";
import type { Table, TableRow, TableCell } from "mdast";
import { InlineNode } from "./inline";
import { baseAttrs, mergeAttrs } from "../utils/attrs";

interface TableProps {
  node: Table;
  theme: TuiMdTheme;
}

const ALIGN_MAP = { left: "flex-start", center: "center", right: "flex-end", null: "flex-start" } as const;

import { useTerminalDimensions } from "@opentui/react";

export function TableBlock({ node, theme }: TableProps) {
  const [header, ...rows] = node.children as TableRow[];
  const align = node.align ?? [];
  const { width: termWidth } = useTerminalDimensions();

  // Calculate column widths by measuring max content per column (rough char count)
  const colCount = header?.children.length ?? 0;
  const colMax: number[] = Array(colCount).fill(3);

  const measureRow = (row: TableRow) => {
    row.children.forEach((cell, ci) => {
      const getRawText = (n: any): string => {
        if (n.type === "text") return n.value || "";
        if (n.type === "inlineCode") return ` ${n.value || ""} `; // Matches {` ${(node as any).value} `}
        if (n.children) return n.children.map(getRawText).join("");
        return "";
      };
      
      const text = (cell as TableCell).children.map(getRawText).join("");
      colMax[ci] = Math.max(colMax[ci], text.length + 2); // +2 for cell padding
    });
  };

  if (header) measureRow(header);
  rows.forEach(measureRow);

  // Responsive distribution
  const sumMax = colMax.reduce((a, b) => a + b, 0);
  const totalBorders = colCount + 1; // 1 left, 1 right, and n-1 between
  
  // Available terminal width for the table (with a small margin of 2)
  const maxAvail = Math.max(10, termWidth - 2); 
  
  let colWidths = [...colMax];
  if (sumMax + totalBorders > maxAvail) {
    const availableContentWidth = maxAvail - totalBorders;
    colWidths = colMax.map(w => Math.max(3, Math.floor((w / sumMax) * availableContentWidth)));
  }

  // We must calculate the actual box widths which include the border!
  // Cell 0 has border=["left"], so it needs width = colWidths[0] + 1 (for the left border)
  // Cell middle has border=["left"], so width = colWidths[i] + 1
  // Cell last has border=["left", "right"], so width = colWidths[n-1] + 2
  const boxWidths = colWidths.map((w, i) => w + (i === colWidths.length - 1 ? 2 : 1));

  const renderBorder = (left: string, mid: string, right: string, cross: string) => {
    let str = "";
    for (let i = 0; i < boxWidths.length; i++) {
      const isLast = i === boxWidths.length - 1;
      const w = boxWidths[i];
      const startChar = i === 0 ? left : cross;
      const repeats = w - (isLast ? 2 : 1);
      str += startChar + mid.repeat(Math.max(0, repeats));
    }
    str += right;
    return <text fg={theme.border}>{str}</text>;
  };

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      {renderBorder("┌", "─", "┐", "┬")}
      {header && <TableRowNode row={header} align={align} boxWidths={boxWidths} isHeader theme={theme} />}
      {header && rows.length > 0 && renderBorder("├", "─", "┤", "┼")}
      {rows.map((row, i) => (
        <React.Fragment key={i}>
          <TableRowNode row={row} align={align} boxWidths={boxWidths} isHeader={false} theme={theme} />
          {i < rows.length - 1 && renderBorder("├", "─", "┤", "┼")}
        </React.Fragment>
      ))}
      {renderBorder("└", "─", "┘", "┴")}
    </box>
  );
}

function TableRowNode({
  row, align, boxWidths, isHeader, theme
}: {
  row: TableRow;
  align: ("left" | "right" | "center" | null)[];
  boxWidths: number[];
  isHeader: boolean;
  theme: TuiMdTheme;
}) {
  return (
    <box flexDirection="row" width="100%">
      {row.children.map((cell, ci) => {
        const a = align[ci] ?? null;
        const isLast = ci === row.children.length - 1;
        return (
          <box
            key={ci}
            width={boxWidths[ci]}
            border={isLast ? ["left", "right"] : ["left"]}
            borderStyle="single"
            borderColor={theme.border}
            flexShrink={0}
            alignItems={ALIGN_MAP[a ?? "null"]}
            paddingX={1}
          >
            <text
              fg={isHeader ? theme.accent : theme.text}
              attributes={isHeader ? 1 : 0}  // TextAttributes.BOLD = 1
            >
              {(cell as TableCell).children.map((c, i) => (
                <InlineNode
                  key={i}
                  node={c as any}
                  attrs={mergeAttrs(baseAttrs(), { bold: isHeader })}
                  theme={theme}
                />
              ))}
            </text>
          </box>
        );
      })}
    </box>
  );
}
