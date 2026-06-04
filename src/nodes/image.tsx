import React, { useEffect, useState } from "react";
import terminalImage from "terminal-image";
import supportsTerminalGraphics from "supports-terminal-graphics";
import type { TuiMdTheme } from "../theme";
import { TextAttributes } from "@opentui/core";

export function ImageBlock({ node, theme }: any) {
  const [sixelData, setSixelData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        if (!supportsTerminalGraphics.stdout.kitty && !supportsTerminalGraphics.stdout.iterm2 && !supportsTerminalGraphics.stdout.sixel) {
          throw new Error("not supported");
        }
        const res = await fetch(node.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = await res.arrayBuffer();
        const nodeBuf = Buffer.from(buf);
        const sixel = await terminalImage.buffer(nodeBuf, { width: '50%' });
        if (active) setSixelData(sixel);
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load");
      }
    }
    load();
    return () => { active = false; };
  }, [node.url]);

  if (error) {
    if (error === "not supported") {
      return (
        <box flexDirection="row" width="100%" marginBottom={1} borderStyle="rounded" borderColor={theme.muted}>
          <text fg={theme.muted}>[Image: {node.alt || node.url} - (Not supported on this terminal)]</text>
        </box>
      );
    }
    return (
      <box flexDirection="row" width="100%" marginBottom={1} borderStyle="rounded" borderColor={theme.diffDel || "#ff0000"}>
        <text fg={theme.diffDel || "#ff0000"}>[Image: {node.alt || "Broken"} - {error}]</text>
      </box>
    );
  }

  if (!sixelData) {
    return (
      <box flexDirection="row" width="100%" marginBottom={1} borderStyle="rounded" borderColor={theme.muted}>
        <text fg={theme.muted}>[Loading image: {node.alt || node.url}...]</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      <text>{sixelData}</text>
      {node.alt ? <text fg={theme.muted} attributes={TextAttributes.ITALIC}>{node.alt}</text> : null}
    </box>
  );
}
