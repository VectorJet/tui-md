import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import React from "react";

function App() {
  const renderer = useRenderer();
  useKeyboard((key) => {
    if (key.name === "q") renderer.destroy();
  });

  const colWidths = [18, 18];
  
  const renderBorder = (left: string, mid: string, right: string, cross: string) => {
    let str = "";
    for (let i = 0; i < colWidths.length; i++) {
      const isLast = i === colWidths.length - 1;
      const w = colWidths[i];
      const startChar = i === 0 ? left : cross;
      const repeats = w - (isLast ? 2 : 1);
      str += startChar + mid.repeat(Math.max(0, repeats));
    }
    str += right;
    return <text>{str}</text>;
  };

  return (
    <box flexDirection="column" width={80} padding={2}>
      {renderBorder("┌", "─", "┐", "┬")}
      <box flexDirection="row">
        <box border={["left"]} width={colWidths[0]} paddingX={1} borderStyle="single">
          <text>Cell 1 with long wrapping text to see height</text>
        </box>
        <box border={["left", "right"]} width={colWidths[1]} paddingX={1} borderStyle="single">
          <text>Cell 2</text>
        </box>
      </box>
      {renderBorder("└", "─", "┘", "┴")}
      <text>Press Q to exit</text>
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
createRoot(renderer).render(<App />);
