import fs from "fs";
import path from "path";

const urls = [
  "https://www.compart.com/en/unicode/block/U+2500",
  "https://www.compart.com/en/unicode/block/U+2580",
  "https://www.compart.com/en/unicode/block/U+25A0"
];

const refsDir = "/home/tammy/.claude-gateway/workspaces/default/dev/tui-md/refs";

interface UnicodeChar {
  codePoint: string;
  char: string;
  name: string;
}

async function scrape() {
  if (!fs.existsSync(refsDir)) {
    fs.mkdirSync(refsDir, { recursive: true });
  }

  for (const url of urls) {
    const blockId = url.split("/").pop()!;
    console.log(`Scraping ${url}...`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Pattern to match:
    // <a href="/en/unicode/U+2500" class="content-item card"><p class="uid">U+2500</p><div class="text">─</div><div class="name"><p>Box Drawings Light Horizontal</p></div></a>
    // We should be careful about whitespace, quotes, and newlines.
    const regex = /class="content-item card"[^>]*>\s*<p class="uid">\s*(U\+[0-9A-F]+)\s*<\/p>\s*<div class="text">\s*([\s\S]*?)\s*<\/div>\s*<div class="name">\s*<p>\s*([\s\S]*?)\s*<\/p>/gi;

    const chars: UnicodeChar[] = [];
    let match;
    while ((match = regex.exec(html)) !== null) {
      const codePoint = match[1].trim();
      const char = match[2].trim();
      const name = match[3].trim();
      chars.push({ codePoint, char, name });
    }

    if (chars.length === 0) {
      console.warn(`Warning: No characters parsed for block ${blockId}. Checking alternative parsing pattern.`);
      // Let's print a small chunk of the html to see if classes differ
      const index = html.indexOf("class=\"content-item card\"");
      if (index !== -1) {
        console.log("Found card class. Snippet:", html.substring(index, index + 300));
      } else {
        console.log("Could not find class='content-item card' in HTML.");
      }
    } else {
      console.log(`Scraped ${chars.length} characters for block ${blockId}`);
      const outputPath = path.join(refsDir, `${blockId}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(chars, null, 2), "utf8");
      console.log(`Saved to ${outputPath}`);
    }
  }
}

scrape().catch(console.error);
