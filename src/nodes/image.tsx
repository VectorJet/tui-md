import React, { useEffect, useState } from "react";
import { spawn } from "node:child_process";
import { imageDimensionsFromData } from "image-dimensions";
import { TextAttributes } from "@opentui/core";
import type { TuiMdTheme } from "../theme";

type StyledSegment = {
  text: string;
  fg?: string;
  bg?: string;
};

type RenderedImage = {
  lines: StyledSegment[][];
};

const FALLBACK_IMAGE_HEIGHT = 12;
const ANSI_SEQUENCE = /\x1b(?:\[([0-?]*)([ -/]*)([@-~])|\][\s\S]*?(?:\x07|\x1b\\)|P[\s\S]*?\x1b\\|[@-Z\\-_])/g;

function getImageSize(buffer: Buffer) {
  const dimensions = imageDimensionsFromData(buffer);
  const terminalColumns = Math.max(1, process.stdout.columns || 80);
  const terminalRows = Math.max(1, process.stdout.rows || 24);
  const width = Math.max(1, Math.floor(terminalColumns * 0.5));

  if (!dimensions?.width || !dimensions?.height) {
    return {
      width,
      height: Math.min(FALLBACK_IMAGE_HEIGHT, terminalRows),
    };
  }

  const height = Math.max(1, Math.ceil((width * dimensions.height) / dimensions.width / 2));
  return {
    width,
    height: Math.min(height, terminalRows),
  };
}

function sgrColor(parts: number[], index: number) {
  if ((parts[index] === 38 || parts[index] === 48) && parts[index + 1] === 2) {
    const r = parts[index + 2] ?? 0;
    const g = parts[index + 3] ?? 0;
    const b = parts[index + 4] ?? 0;
    return {
      color: `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`,
      nextIndex: index + 4,
    };
  }

  return null;
}

function parseAnsiStyledText(input: string): RenderedImage {
  const lines: StyledSegment[][] = [[]];
  let fg: string | undefined;
  let bg: string | undefined;
  let cursor = 0;

  const pushText = (text: string) => {
    if (!text) return;

    for (const [lineIndex, part] of text.split("\n").entries()) {
      if (lineIndex > 0) lines.push([]);
      if (!part) continue;

      const line = lines[lines.length - 1];
      const previous = line[line.length - 1];
      if (previous && previous.fg === fg && previous.bg === bg) {
        previous.text += part;
      } else {
        line.push({ text: part, fg, bg });
      }
    }
  };

  for (const match of input.matchAll(ANSI_SEQUENCE)) {
    pushText(input.slice(cursor, match.index));
    cursor = match.index + match[0].length;

    const isSgr = match[0].startsWith("\x1b[") && match[3] === "m";
    if (!isSgr) continue;

    const parts = (match[1] || "0").split(";").map(part => Number.parseInt(part, 10) || 0);
    for (let i = 0; i < parts.length; i++) {
      const code = parts[i];
      if (code === 0) {
        fg = undefined;
        bg = undefined;
      } else if (code === 39) {
        fg = undefined;
      } else if (code === 49) {
        bg = undefined;
      } else {
        const parsed = sgrColor(parts, i);
        if (parsed) {
          if (code === 38) fg = parsed.color;
          if (code === 48) bg = parsed.color;
          i = parsed.nextIndex;
        }
      }
    }
  }

  pushText(input.slice(cursor));

  return {
    lines: lines.filter(line => line.length > 0),
  };
}

function renderWithChafa(buffer: Buffer, width: number, height: number): Promise<RenderedImage> {
  return new Promise((resolve, reject) => {
    const child = spawn("chafa", [
      "--format=symbols",
      "--colors=full",
      "--animate=off",
      "--margin-bottom=0",
      "--margin-right=0",
      `--size=${width}x${height}`,
      "-",
    ], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", chunk => stdout.push(Buffer.from(chunk)));
    child.stderr.on("data", chunk => stderr.push(Buffer.from(chunk)));
    child.on("error", err => {
      if ((err as NodeJS.ErrnoException).code === "ENOENT") {
        reject(new Error("chafa not found. Install chafa to render images."));
        return;
      }
      reject(err);
    });
    child.on("close", code => {
      if (code === 0) {
        resolve(parseAnsiStyledText(Buffer.concat(stdout).toString("utf8")));
        return;
      }

      reject(new Error(Buffer.concat(stderr).toString("utf8").trim() || `chafa exited ${code}`));
    });

    child.stdin.end(buffer);
  });
}

async function renderImage(buffer: Buffer): Promise<RenderedImage> {
  const size = getImageSize(buffer);
  return renderWithChafa(buffer, size.width, size.height);
}

export function ImageBlock({ node, theme }: any) {
  const [imageData, setImageData] = useState<RenderedImage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setError(null);
        const res = await fetch(node.url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const buf = await res.arrayBuffer();
        const image = await renderImage(Buffer.from(buf));

        if (active) setImageData(image);
      } catch (err: any) {
        if (active) setError(err.message || "Failed to load");
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [node.url]);

  if (error) {
    return (
      <box flexDirection="row" width="100%" marginBottom={1} borderStyle="rounded" borderColor={theme.diffDel || "#ff0000"}>
        <text fg={theme.diffDel || "#ff0000"}>[Image: {node.alt || "Broken"} - {error}]</text>
      </box>
    );
  }

  if (!imageData) {
    return (
      <box flexDirection="row" width="100%" marginBottom={1} borderStyle="rounded" borderColor={theme.muted}>
        <text fg={theme.muted}>[Loading image: {node.alt || node.url}...]</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" width="100%" marginBottom={1}>
      {imageData.lines.map((line, y) => (
        <text key={y} flexShrink={0}>
          {line.map((segment, x) => (
            <span key={x} fg={segment.fg} bg={segment.bg}>{segment.text}</span>
          ))}
        </text>
      ))}
      {node.alt ? <text fg={theme.muted} attributes={TextAttributes.ITALIC}>{node.alt}</text> : null}
    </box>
  );
}
