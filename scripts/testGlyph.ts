import fs from "fs";
import opentype from "opentype.js";

const fontPath = "/home/tammy/.claude-gateway/workspaces/default/dev/tui-md/assets/fonts/JetBrainsMono-Regular.ttf";
const fontBuffer = fs.readFileSync(fontPath);
const font = opentype.parse(new Uint8Array(fontBuffer).buffer);

console.log("ascender:", font.ascender);
console.log("descender:", font.descender);
console.log("unitsPerEm:", font.unitsPerEm);

const glyph = font.charToGlyph("A");
console.log("A bbox:", glyph.getMetrics());
console.log("A path commands (first 5):", glyph.path.commands.slice(0, 5));
