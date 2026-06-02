import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer } from "@opentui/react";
import React, { useState } from "react";

function App() {
  const [clicked, setClicked] = useState(false);
  const renderer = useRenderer();

  useKeyboard((key) => {
    if (key.name === "q") renderer.destroy();
  });

  return (
    <box flexDirection="column" width={40} height={10}>
      <box padding={1} backgroundColor={clicked ? "green" : "red"} onMouseDown={() => setClicked(!clicked)}>
        <text>Click me! {clicked ? "ON" : "OFF"}</text>
      </box>
      <text>Press 'q' to quit</text>
    </box>
  );
}

const renderer = await createCliRenderer({ exitOnCtrlC: true });
createRoot(renderer).render(<App />);
