import fs from "fs";
import path from "path";
import opentype from "opentype.js";

// Paths
const refsDir = "/home/tammy/.claude-gateway/workspaces/default/dev/tui-md/refs";
const fontPath = "/home/tammy/.claude-gateway/workspaces/default/dev/tui-md/assets/fonts/JetBrainsMono-Regular.ttf";
const outputPath = "/home/tammy/.claude-gateway/workspaces/default/dev/tui-md/src/texicode/jetbrains_mono_art.ts";

interface UnicodeChar {
  codePoint: string;
  char: string;
  name: string;
}

interface Candidate {
  char: string;
  bitmap: number[][]; // 4x4
}

// Load scraped characters
function loadCandidates(): Candidate[] {
  const candidates: Candidate[] = [];

  // Add standard space
  candidates.push({
    char: " ",
    bitmap: Array.from({ length: 4 }, () => Array(4).fill(0))
  });

  const files = ["U+2500.json", "U+2580.json", "U+25A0.json"];
  for (const file of files) {
    const filePath = path.join(refsDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`Warning: file ${filePath} not found. Skipping.`);
      continue;
    }
    const data: UnicodeChar[] = JSON.parse(fs.readFileSync(filePath, "utf8"));
    for (const item of data) {
      let bitmap: number[][] | null = null;
      if (file === "U+2500.json") {
        bitmap = getBoxDrawingBitmap(item.name);
      } else if (file === "U+2580.json") {
        bitmap = getBlockElementBitmap(item.name);
      } else if (file === "U+25A0.json") {
        bitmap = getGeometricShapeBitmap(item.name);
      }

      if (bitmap) {
        candidates.push({ char: item.char, bitmap });
      }
    }
  }

  return candidates;
}

// Procedural bitmap generators
function getBoxDrawingBitmap(name: string): number[][] {
  const grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  const isHeavy = name.includes("Heavy");
  const isDouble = name.includes("Double");
  
  // Directions:
  const hasLeft = name.includes("Left") || name.includes("Horizontal") || name.includes("Cross");
  const hasRight = name.includes("Right") || name.includes("Horizontal") || name.includes("Cross");
  const hasUp = name.includes("Up") || name.includes("Vertical") || name.includes("Cross");
  const hasDown = name.includes("Down") || name.includes("Vertical") || name.includes("Cross");
  
  // Diagonals
  if (name.includes("Diagonal")) {
    if (name.includes("Upper Right to Lower Left")) {
      grid[0][3] = grid[1][2] = grid[2][1] = grid[3][0] = 1;
    }
    if (name.includes("Upper Left to Lower Right")) {
      grid[0][0] = grid[1][1] = grid[2][2] = grid[3][3] = 1;
    }
    if (name.includes("Cross")) {
      grid[0][3] = grid[1][2] = grid[2][1] = grid[3][0] = 1;
      grid[0][0] = grid[1][1] = grid[2][2] = grid[3][3] = 1;
    }
    return grid;
  }

  // Draw lines
  if (hasLeft) {
    if (isHeavy || isDouble) {
      grid[1][0] = grid[1][1] = grid[2][0] = grid[2][1] = 1;
    } else {
      grid[1][0] = grid[1][1] = 1;
    }
  }
  if (hasRight) {
    if (isHeavy || isDouble) {
      grid[1][2] = grid[1][3] = grid[2][2] = grid[2][3] = 1;
    } else {
      grid[1][2] = grid[1][3] = 1;
    }
  }
  if (hasUp) {
    if (isHeavy || isDouble) {
      grid[0][1] = grid[1][1] = grid[0][2] = grid[1][2] = 1;
    } else {
      grid[0][1] = grid[1][1] = 1;
    }
  }
  if (hasDown) {
    if (isHeavy || isDouble) {
      grid[2][1] = grid[3][1] = grid[2][2] = grid[3][2] = 1;
    } else {
      grid[2][2] = grid[3][2] = 1;
    }
  }

  // Fill center intersection
  if ((hasLeft || hasRight) && (hasUp || hasDown)) {
    grid[1][1] = grid[1][2] = grid[2][1] = grid[2][2] = 1;
  }

  return grid;
}

function getBlockElementBitmap(name: string): number[][] {
  const grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("full block")) {
    return Array.from({ length: 4 }, () => Array(4).fill(1));
  }
  
  if (lowerName.includes("upper half")) {
    for (let r = 0; r < 2; r++) grid[r].fill(1);
    return grid;
  }
  if (lowerName.includes("lower half")) {
    for (let r = 2; r < 4; r++) grid[r].fill(1);
    return grid;
  }
  if (lowerName.includes("left half")) {
    for (let r = 0; r < 4; r++) {
      grid[r][0] = grid[r][1] = 1;
    }
    return grid;
  }
  if (lowerName.includes("right half")) {
    for (let r = 0; r < 4; r++) {
      grid[r][2] = grid[r][3] = 1;
    }
    return grid;
  }

  // Fractional blocks
  if (lowerName.includes("lower one eighth") || lowerName.includes("lower one quarter")) {
    grid[3].fill(1);
    return grid;
  }
  if (lowerName.includes("lower three eighths") || lowerName.includes("lower half")) {
    grid[2].fill(1); grid[3].fill(1);
    return grid;
  }
  if (lowerName.includes("lower five eighths") || lowerName.includes("lower three quarters") || lowerName.includes("lower seven eighths")) {
    grid[1].fill(1); grid[2].fill(1); grid[3].fill(1);
    return grid;
  }

  if (lowerName.includes("left one eighth") || lowerName.includes("left one quarter")) {
    for (let r = 0; r < 4; r++) grid[r][0] = 1;
    return grid;
  }
  if (lowerName.includes("left three eighths") || lowerName.includes("left half")) {
    for (let r = 0; r < 4; r++) grid[r][0] = grid[r][1] = 1;
    return grid;
  }
  if (lowerName.includes("left five eighths") || lowerName.includes("left three quarters") || lowerName.includes("left seven eighths")) {
    for (let r = 0; r < 4; r++) grid[r][0] = grid[r][1] = grid[r][2] = 1;
    return grid;
  }
  
  if (lowerName.includes("upper one eighth")) {
    grid[0].fill(1);
    return grid;
  }
  if (lowerName.includes("right one eighth")) {
    for (let r = 0; r < 4; r++) grid[r][3] = 1;
    return grid;
  }

  // Quadrants
  const hasUL = lowerName.includes("upper left");
  const hasUR = lowerName.includes("upper right");
  const hasLL = lowerName.includes("lower left");
  const hasLR = lowerName.includes("lower right");

  if (hasUL) {
    grid[0][0] = grid[0][1] = grid[1][0] = grid[1][1] = 1;
  }
  if (hasUR) {
    grid[0][2] = grid[0][3] = grid[1][2] = grid[1][3] = 1;
  }
  if (hasLL) {
    grid[2][0] = grid[2][1] = grid[3][0] = grid[3][1] = 1;
  }
  if (hasLR) {
    grid[2][2] = grid[2][3] = grid[3][2] = grid[3][3] = 1;
  }

  return grid;
}

function getGeometricShapeBitmap(name: string): number[][] {
  const grid = Array.from({ length: 4 }, () => Array(4).fill(0));
  const lowerName = name.toLowerCase();

  if (lowerName.includes("black square") || lowerName.includes("solid square")) {
    return Array.from({ length: 4 }, () => Array(4).fill(1));
  }
  if (lowerName.includes("white square")) {
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (r === 0 || r === 3 || c === 0 || c === 3) grid[r][c] = 1;
      }
    }
    return grid;
  }
  if (lowerName.includes("up-pointing triangle")) {
    grid[0][1] = grid[0][2] = 1;
    grid[1][1] = grid[1][2] = 1;
    grid[2].fill(1);
    grid[3].fill(1);
    return grid;
  }
  if (lowerName.includes("down-pointing triangle")) {
    grid[0].fill(1);
    grid[1].fill(1);
    grid[2][1] = grid[2][2] = 1;
    grid[3][1] = grid[3][2] = 1;
    return grid;
  }
  if (lowerName.includes("left-pointing triangle")) {
    grid[0][0] = grid[1][0] = grid[2][0] = grid[3][0] = 1;
    grid[1][1] = grid[2][1] = 1;
    grid[1][2] = grid[2][2] = 1;
    return grid;
  }
  if (lowerName.includes("right-pointing triangle")) {
    grid[0][3] = grid[1][3] = grid[2][3] = grid[3][3] = 1;
    grid[1][1] = grid[2][1] = 1;
    grid[1][2] = grid[2][2] = 1;
    return grid;
  }
  if (lowerName.includes("circle")) {
    grid[0][1] = grid[0][2] = 1;
    grid[1][0] = grid[1][1] = grid[1][2] = grid[1][3] = 1;
    grid[2][0] = grid[2][1] = grid[2][2] = grid[2][3] = 1;
    grid[3][1] = grid[3][2] = 1;
    return grid;
  }
  if (lowerName.includes("diamond")) {
    grid[0][1] = grid[0][2] = 1;
    grid[1].fill(1);
    grid[2].fill(1);
    grid[3][1] = grid[3][2] = 1;
    return grid;
  }
  if (lowerName.includes("small square")) {
    grid[1][1] = grid[1][2] = 1;
    grid[2][1] = grid[2][2] = 1;
    return grid;
  }
  
  if (lowerName.includes("black") || lowerName.includes("filled")) {
    return Array.from({ length: 4 }, () => Array(4).fill(1));
  }
  return grid;
}

interface Segment {
  p0: { x: number; y: number };
  p1: { x: number; y: number };
}

function flattenGlyphPath(commands: opentype.PathCommand[], scale: number, baseline: number): Segment[] {
  const segments: Segment[] = [];
  let currX = 0;
  let currY = 0;
  let startX = 0;
  let startY = 0;

  const toGridX = (x: number) => x * scale;
  const toGridY = (y: number) => baseline - y * scale;

  for (const cmd of commands) {
    switch (cmd.type) {
      case "M":
        if (cmd.x !== undefined && cmd.y !== undefined) {
          currX = toGridX(cmd.x);
          currY = toGridY(cmd.y);
          startX = currX;
          startY = currY;
        }
        break;
      case "L":
        if (cmd.x !== undefined && cmd.y !== undefined) {
          const nextX = toGridX(cmd.x);
          const nextY = toGridY(cmd.y);
          segments.push({ p0: { x: currX, y: currY }, p1: { x: nextX, y: nextY } });
          currX = nextX;
          currY = nextY;
        }
        break;
      case "Q":
        if (cmd.x !== undefined && cmd.y !== undefined && cmd.x1 !== undefined && cmd.y1 !== undefined) {
          const cx = toGridX(cmd.x1);
          const cy = toGridY(cmd.y1);
          const nextX = toGridX(cmd.x);
          const nextY = toGridY(cmd.y);
          const steps = 8;
          let prevX = currX;
          let prevY = currY;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;
            const tx = mt * mt * currX + 2 * mt * t * cx + t * t * nextX;
            const ty = mt * mt * currY + 2 * mt * t * cy + t * t * nextY;
            segments.push({ p0: { x: prevX, y: prevY }, p1: { x: tx, y: ty } });
            prevX = tx;
            prevY = ty;
          }
          currX = nextX;
          currY = nextY;
        }
        break;
      case "C":
        if (cmd.x !== undefined && cmd.y !== undefined && cmd.x1 !== undefined && cmd.y1 !== undefined && cmd.x2 !== undefined && cmd.y2 !== undefined) {
          const c1x = toGridX(cmd.x1);
          const c1y = toGridY(cmd.y1);
          const c2x = toGridX(cmd.x2);
          const c2y = toGridY(cmd.y2);
          const nextX = toGridX(cmd.x);
          const nextY = toGridY(cmd.y);
          const steps = 8;
          let prevX = currX;
          let prevY = currY;
          for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const mt = 1 - t;
            const tx = mt * mt * mt * currX + 3 * mt * mt * t * c1x + 3 * mt * t * t * c2x + t * t * t * nextX;
            const ty = mt * mt * mt * currY + 3 * mt * mt * t * c1y + 3 * mt * t * t * c2y + t * t * t * nextY;
            segments.push({ p0: { x: prevX, y: prevY }, p1: { x: tx, y: ty } });
            prevX = tx;
            prevY = ty;
          }
          currX = nextX;
          currY = nextY;
        }
        break;
      case "Z":
        if (currX !== startX || currY !== startY) {
          segments.push({ p0: { x: currX, y: currY }, p1: { x: startX, y: startY } });
          currX = startX;
          currY = startY;
        }
        break;
    }
  }
  return segments;
}

function isPointInGlyph(px: number, py: number, segments: Segment[]): boolean {
  let inside = false;
  for (const seg of segments) {
    const { p0, p1 } = seg;
    const intersects = ((p0.y > py) !== (p1.y > py)) &&
      (px < (p1.x - p0.x) * (py - p0.y) / (p1.y - p0.y) + p0.x);
    if (intersects) {
      inside = !inside;
    }
  }
  return inside;
}

// Find closest character using weighted score
function findBestChar(subgrid: number[][], candidates: Candidate[]): string {
  let bestChar = " ";
  let maxScore = -999;
  
  for (const cand of candidates) {
    let score = 0;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        const valB = subgrid[r][c];
        const valM = cand.bitmap[r][c];
        if (valB === 1 && valM === 1) {
          score += 3;
        } else if (valB === 0 && valM === 0) {
          score += 1;
        } else if (valB === 1 && valM === 0) {
          score -= 2;
        } else {
          score -= 1;
        }
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestChar = cand.char;
    }
  }
  
  return bestChar;
}

async function run() {
  const candidates = loadCandidates();
  console.log(`Loaded ${candidates.length} candidates.`);

  if (!fs.existsSync(fontPath)) {
    throw new Error(`Font file not found at: ${fontPath}`);
  }

  const fontBuffer = fs.readFileSync(fontPath);
  const font = opentype.parse(new Uint8Array(fontBuffer).buffer);
  
  // Font metrics details
  // Cap-height is 730
  const capHeight = 730;

  const sizes = [
    { rows: 2, heightPixels: 8, baselinePixel: 6 },
    { rows: 3, heightPixels: 12, baselinePixel: 9 },
    { rows: 4, heightPixels: 16, baselinePixel: 12 }
  ];

  const targetChars = " !\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";

  const result: Record<number, Record<string, string[]>> = {
    2: {},
    3: {},
    4: {}
  };

  for (const size of sizes) {
    const H = size.heightPixels;
    // Scale is determined by fitting cap-height into baselinePixel height
    const scale = size.baselinePixel / capHeight;
    
    // Width of monospace char is 600, scale it to pixels and round to multiple of 4
    const W_pixels = Math.round((600 * scale) / 4) * 4 || 4;
    const W_cells = W_pixels / 4;

    console.log(`Processing size: ${size.rows} rows (Height: ${H}px, Width: ${W_pixels}px, Cells: ${W_cells}x${size.rows}, Scale: ${scale})`);

    for (const char of targetChars) {
      if (char === " ") {
        result[size.rows][" "] = Array.from({ length: size.rows }, () => " ".repeat(W_cells));
        continue;
      }

      const glyph = font.charToGlyph(char);
      const segments = flattenGlyphPath(glyph.path.commands, scale, size.baselinePixel);

      // Render to pixel grid
      const pixelGrid = Array.from({ length: H }, () => Array(W_pixels).fill(0));
      for (let r = 0; r < H; r++) {
        for (let c = 0; c < W_pixels; c++) {
          const px = c + 0.5;
          const py = r + 0.5;
          if (isPointInGlyph(px, py, segments)) {
            pixelGrid[r][c] = 1;
          }
        }
      }

      // Convert to cell grid
      const cellGrid: string[][] = Array.from({ length: size.rows }, () => Array(W_cells).fill(" "));
      for (let cr = 0; cr < size.rows; cr++) {
        for (let cc = 0; cc < W_cells; cc++) {
          const subgrid = Array.from({ length: 4 }, () => Array(4).fill(0));
          for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
              // Clamp indices just in case
              const pr = Math.min(H - 1, cr * 4 + r);
              const pc = Math.min(W_pixels - 1, cc * 4 + c);
              subgrid[r][c] = pixelGrid[pr][pc];
            }
          }
          cellGrid[cr][cc] = findBestChar(subgrid, candidates);
        }
      }

      result[size.rows][char] = cellGrid.map(row => row.join(""));
    }
  }

  // Generate output TypeScript file
  const tsContent = `// Auto-generated from JetBrainsMono-Regular.ttf and Compart Unicode blocks
// Contains rasterized block art for printable ASCII characters at heights of 2, 3, and 4 terminal rows.

export interface FontArtMap {
  [char: string]: string[];
}

export const jetbrainsMonoArt: Record<2 | 3 | 4, FontArtMap> = ${JSON.stringify(result, null, 2)};
`;

  fs.writeFileSync(outputPath, tsContent, "utf8");
  console.log(`Successfully generated font art at ${outputPath}`);
}

run().catch(console.error);
