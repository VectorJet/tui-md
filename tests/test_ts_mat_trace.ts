import { renderTexRows } from "./src/texicode/pipeline.ts";
console.log(renderTexRows("\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc", true).join("\n"));
