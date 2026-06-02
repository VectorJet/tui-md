/** Port of TeXicode pipeline.py */

import { lexer } from "./lexer";
import { parse } from "./parser";
import { renderToSketch } from "./renderer";
import * as arts from "./arts";

export interface TeXicodeResult {
  rows: string[];
  error: string | null;
}

export function renderTexRows(tex: string, debug: boolean = false): string[] {
  let lexered;
  try {
    lexered = lexer(tex, debug);
  } catch (e: any) {
    return [`TeXicode: lexerizing error: ${e.message}`];
  }

  let parsed;
  try {
    parsed = parse(lexered, debug);
  } catch (e: any) {
    return [`TeXicode: parsing error: ${e.message}`];
  }

  let rendered;
  try {
    rendered = renderToSketch(parsed, debug);
  } catch (e: any) {
    return [`TeXicode: rendering error: ${e.message}`];
  }

  if (debug) console.log("Rendering done\n");

  const newRendered: string[] = [];
  for (const row of rendered) {
    newRendered.push(row.join(""));
  }

  return newRendered;
}

export function renderTex(tex: string, isNormalFont: boolean = false): TeXicodeResult {
  arts.setFont(isNormalFont ? "normal" : "serif");
  try {
    const rows = renderTexRows(tex, false);
    return { rows, error: null };
  } catch (e: any) {
    return { rows: [tex], error: String(e) };
  }
}
