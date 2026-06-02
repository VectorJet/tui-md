import { renderTex } from "./src/texicode/pipeline.ts";
console.log(renderTex("\\det\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} = ad - bc", false).rows.join("\n"));
console.log(renderTex("\\begin{pmatrix} a_{11} & a_{12} & a_{13} \\\\ a_{21} & a_{22} & a_{23} \\\\ a_{31} & a_{32} & a_{33} \\end{pmatrix}", false).rows.join("\n"));
