import { renderTexRows } from "./src/texicode/pipeline.ts";
console.log(renderTexRows("\\textstyle \\frac{1}{2}", true).join("\n"));
console.log("---");
console.log(renderTexRows("\\textstyle \\sqrt{b^2-4ac}", true).join("\n"));
