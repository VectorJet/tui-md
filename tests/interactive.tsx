import { createCliRenderer } from "@opentui/core";
import { createRoot, useKeyboard, useRenderer, useTerminalDimensions } from "@opentui/react";
import { readFileSync } from "fs";
import { join } from "path";
import { useState, useEffect, useCallback } from "react";
import { Markdown } from "../src/index";

const ASSET = join(import.meta.dir, "../assets/markdown-test.md");
const FULL_CONTENT = readFileSync(ASSET, "utf-8");

const CHUNK = 12;
const TICK_MS = 30;

function App() {
  const { width, height } = useTerminalDimensions();
  const [mode, setMode] = useState<"static" | "streaming">("static");
  const [streamPos, setStreamPos] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (mode !== "streaming" || !running) return;
    if (streamPos >= FULL_CONTENT.length) { setRunning(false); return; }
    const t = setTimeout(
      () => setStreamPos((pos: number) => Math.min(pos + CHUNK, FULL_CONTENT.length)),
      TICK_MS
    );
    return () => clearTimeout(t);
  }, [mode, running, streamPos]);

  const startStream = useCallback(() => {
    setMode("streaming");
    setStreamPos(0);
    setRunning(true);
  }, []);

  const resetStatic = useCallback(() => {
    setMode("static");
    setRunning(false);
    setStreamPos(0);
  }, []);

  // useRenderer() gives us the live CliRenderer instance from context —
  // calling destroy() on it lets OpenTUI send the proper disable-mouse-tracking
  // escape sequences before exiting, fixing the "terminal still receives mouse
  // input after quit" bug.
  const renderer = useRenderer();

  useKeyboard((key) => {
    if (key.name === "q") renderer.destroy();
    if (key.name === "s") startStream();
    if (key.name === "r") resetStatic();
  });

  const content = mode === "streaming" ? FULL_CONTENT.slice(0, streamPos) : FULL_CONTENT;
  const isStreaming = mode === "streaming" && running;
  const progress = mode === "streaming" ? Math.round((streamPos / FULL_CONTENT.length) * 100) : 100;
  const statusText = mode === "streaming"
    ? isStreaming ? `streaming ${progress}%` : "stream done"
    : "static";

  return (
    <box flexDirection="column" width={width} height={height}>
      {/* header */}
      <box width="100%" flexShrink={0} flexDirection="row" backgroundColor="#1e1e1e" paddingX={1}>
        <text fg="#569cd6">tui-md</text>
        <text fg="#3c3c3c"> │ </text>
        <text fg={mode === "streaming" ? "#4ec9b0" : "#6b6b6b"}>{statusText}</text>
        <text fg="#3c3c3c"> │ </text>
        <text fg="#6b6b6b">[s] stream  [r] reset  [scroll] mouse wheel  [q] quit</text>
      </box>

      {/* scrollable content */}
      <scrollbox flexGrow={1} flexShrink={1} width="100%" scrollY={true} stickyScroll={false}>
        <box flexDirection="column" width={Math.min(width - 4, 100)} paddingX={2} paddingY={1}>
          {content.length === 0
            ? <text fg="#6b6b6b">press [s] to start streaming simulation...</text>
            : <Markdown content={content} streaming={isStreaming} />
          }
        </box>
      </scrollbox>
    </box>
  );
}

// exitOnCtrlC: true (default) means Ctrl+C also routes through renderer.destroy(),
// so both quit paths properly disable mouse tracking before the process exits.
const renderer = await createCliRenderer({ exitOnCtrlC: true });
renderer.setTerminalTitle("tui-md interactive test");
createRoot(renderer).render(<App />);
