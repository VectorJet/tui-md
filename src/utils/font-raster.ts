/**
 * font-raster.ts
 * Rasterizes text to a terminal half-block pixel grid using opentype.js.
 * Each terminal row = 2 pixel rows (▀ ▄ █ space), giving double vertical resolution.
 */

import * as opentype from "opentype.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_PATH = join(__dirname, "../../assets/fonts/JetBrainsMono-Bold.ttf");

// Pixel heights per heading level (H1–H6).
export const HEADING_PIXEL_HEIGHTS: Record<number, number> = {
  1: 18,
  2: 14,
  3: 12,
  4: 10,
  5: 8,
  6: 7,
};

let _font: opentype.Font | null = null;

function getFont(): opentype.Font {
  if (_font) return _font;
  const buf = readFileSync(FONT_PATH);
  _font = opentype.parse(buf.buffer as ArrayBuffer);
  return _font;
}

/** Scan-convert an opentype Path into a boolean pixel grid [y][x]. */
function rasterizePath(
  path: opentype.Path,
  width: number,
  height: number
): boolean[][] {
  const grid: boolean[][] = Array.from({ length: height }, () =>
    new Array(width).fill(false)
  );

  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  let cx = 0, cy = 0, startX = 0, startY = 0;

  for (const cmd of (path as any).commands as opentype.PathCommand[]) {
    switch (cmd.type) {
      case "M":
        cx = cmd.x!; cy = cmd.y!;
        startX = cx; startY = cy;
        break;
      case "L":
        edges.push({ x1: cx, y1: cy, x2: cmd.x!, y2: cmd.y! });
        cx = cmd.x!; cy = cmd.y!;
        break;
      case "C": {
        // Cubic bezier — flatten with ~16 steps.
        const steps = 16;
        let px = cx, py = cy;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps, mt = 1 - t;
          const nx = mt*mt*mt*cx + 3*mt*mt*t*cmd.x1! + 3*mt*t*t*cmd.x2! + t*t*t*cmd.x!;
          const ny = mt*mt*mt*cy + 3*mt*mt*t*cmd.y1! + 3*mt*t*t*cmd.y2! + t*t*t*cmd.y!;
          edges.push({ x1: px, y1: py, x2: nx, y2: ny });
          px = nx; py = ny;
        }
        cx = cmd.x!; cy = cmd.y!;
        break;
      }
      case "Q": {
        // Quadratic bezier — flatten with ~12 steps.
        const steps = 12;
        let px = cx, py = cy;
        for (let i = 1; i <= steps; i++) {
          const t = i / steps, mt = 1 - t;
          const nx = mt*mt*cx + 2*mt*t*cmd.x1! + t*t*cmd.x!;
          const ny = mt*mt*cy + 2*mt*t*cmd.y1! + t*t*cmd.y!;
          edges.push({ x1: px, y1: py, x2: nx, y2: ny });
          px = nx; py = ny;
        }
        cx = cmd.x!; cy = cmd.y!;
        break;
      }
      case "Z":
        edges.push({ x1: cx, y1: cy, x2: startX, y2: startY });
        cx = startX; cy = startY;
        break;
    }
  }

  // Scanline even-odd fill.
  for (let y = 0; y < height; y++) {
    const crossings: number[] = [];
    for (const e of edges) {
      const minY = Math.min(e.y1, e.y2);
      const maxY = Math.max(e.y1, e.y2);
      if (y + 0.5 < minY || y + 0.5 >= maxY) continue;
      const t = (y + 0.5 - e.y1) / (e.y2 - e.y1);
      crossings.push(e.x1 + t * (e.x2 - e.x1));
    }
    crossings.sort((a, b) => a - b);
    for (let i = 0; i + 1 < crossings.length; i += 2) {
      const x0 = Math.max(0, Math.floor(crossings[i]));
      const x1 = Math.min(width - 1, Math.ceil(crossings[i + 1]));
      for (let x = x0; x <= x1; x++) grid[y][x] = true;
    }
  }

  return grid;
}

/**
 * Render `text` at a given pixel height into terminal half-block rows.
 * Returns an array of strings, one per terminal row.
 */
export function rasterizeText(text: string, pixelHeight: number): string[] {
  const font = getFont();
  const scale = pixelHeight / font.unitsPerEm;
  const ascender = Math.round(font.ascender * scale);
  const descender = Math.round(Math.abs(font.descender) * scale);
  const totalHeight = ascender + descender;

  let totalWidth = 0;
  const glyphs: { glyph: opentype.Glyph; advance: number }[] = [];
  for (const char of text) {
    const glyph = font.charToGlyph(char);
    const advance = Math.round((glyph.advanceWidth ?? 0) * scale);
    glyphs.push({ glyph, advance });
    totalWidth += advance;
  }

  if (totalWidth === 0 || totalHeight === 0) return [];

  const grid: boolean[][] = Array.from({ length: totalHeight }, () =>
    new Array(totalWidth).fill(false)
  );

  let xOffset = 0;
  for (const { glyph, advance } of glyphs) {
    const path = glyph.getPath(xOffset, ascender, pixelHeight);
    const glyphGrid = rasterizePath(path, xOffset + advance, totalHeight);
    for (let y = 0; y < totalHeight; y++) {
      for (let x = xOffset; x < xOffset + advance && x < totalWidth; x++) {
        if (glyphGrid[y][x]) grid[y][x] = true;
      }
    }
    xOffset += advance;
  }

  // Convert to half-block terminal rows.
  const rows: string[] = [];
  const termRows = Math.ceil(totalHeight / 2);
  for (let row = 0; row < termRows; row++) {
    const yTop = row * 2;
    const yBot = yTop + 1;
    let line = "";
    for (let x = 0; x < totalWidth; x++) {
      const top = yTop < totalHeight ? grid[yTop][x] : false;
      const bot = yBot < totalHeight ? grid[yBot][x] : false;
      if (top && bot) line += "\u2588";
      else if (top)   line += "\u2580";
      else if (bot)   line += "\u2584";
      else            line += " ";
    }
    rows.push(line.trimEnd());
  }

  // Strip blank leading/trailing rows.
  let start = 0, end = rows.length - 1;
  while (start <= end && rows[start].trim() === "") start++;
  while (end >= start && rows[end].trim() === "") end--;
  return rows.slice(start, end + 1);
}

/** Cache — repeated renders of the same heading text+level are free. */
const _cache = new Map<string, string[]>();

export function renderHeading(text: string, level: number): string[] {
  const key = `${level}:${text}`;
  if (_cache.has(key)) return _cache.get(key)!;
  const pixelH = HEADING_PIXEL_HEIGHTS[level] ?? 8;
  const rows = rasterizeText(text, pixelH);
  _cache.set(key, rows);
  return rows;
}
