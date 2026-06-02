import fs from "fs";

const data = JSON.parse(fs.readFileSync("src/utils/emoji.json", "utf8"));
const map: Record<string, string> = {};

for (const item of data) {
  if (item.emoji && item.aliases) {
    for (const alias of item.aliases) {
      map[alias] = item.emoji;
    }
  }
}

const tsContent = `// Auto-generated from gemoji JSON
export const emojiMap: Record<string, string> = ${JSON.stringify(map, null, 2)};
`;

fs.writeFileSync("src/utils/emojiMap.ts", tsContent, "utf8");
console.log("Created emojiMap.ts with", Object.keys(map).length, "entries");
