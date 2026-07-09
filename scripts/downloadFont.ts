import fs from "fs";
import path from "path";

const fontUrl = "https://raw.githubusercontent.com/JetBrains/JetBrainsMono/master/fonts/ttf/JetBrainsMono-Regular.ttf";
const outputDir = "/home/tammy/.claude-gateway/workspaces/default/dev/tui-md/assets/fonts";
const outputPath = path.join(outputDir, "JetBrainsMono-Regular.ttf");

async function download() {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log(`Downloading font from: ${fontUrl}...`);
  const response = await fetch(fontUrl);
  if (!response.ok) {
    throw new Error(`Failed to download font: ${response.statusText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  fs.writeFileSync(outputPath, Buffer.from(arrayBuffer));
  console.log(`Successfully downloaded font to: ${outputPath}`);
}

download().catch(console.error);
