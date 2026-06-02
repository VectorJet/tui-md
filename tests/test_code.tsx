import { createCliRenderer, SyntaxStyle, RGBA } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import React from "react";

const DEFAULT_SYNTAX_STYLE = SyntaxStyle.fromStyles({
  keyword: { fg: RGBA.fromHex("#FF7B72"), bold: true },
  string: { fg: RGBA.fromHex("#A5D6FF") },
});

function App() {
  const renderer = useRenderer();
  useKeyboard((key) => {
    if (key.name === "q") renderer.destroy();
  });

  return (
    <box flexDirection="column" width={80}>
      <text>Below is the code block:</text>
      <code
        content="function test() { return 'hello'; }"
        filetype="javascript"
        syntaxStyle={DEFAULT_SYNTAX_STYLE}
      />
      <text>Press Q to exit</text>
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
createRoot(renderer).render(<App />);
