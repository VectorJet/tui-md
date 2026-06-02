/** Port of TeXicode lexer.py */

import type { Token } from "./node_data";

const specialChars = " ^_{}[]~";
const symbolChars = "`!@#$%&*()+-=|;:'\",.<>/?";
const symbols = specialChars + symbolChars;

function getCharType(char: string): string {
  if (/[a-zA-Z]/.test(char)) return "alph";
  if (/[0-9]/.test(char)) return "numb";
  if (symbols.includes(char)) return "symb";
  if (char === "\\") return "backslash";
  return "symb"; // fallback
}

export function lexer(texStr: string, debug: boolean = false): Token[] {
  const tex = texStr.replace(/\n/g, ' ').replace(/\r/g, ' ');
  if (debug) {
    console.log("Lexerizing\n" + tex);
  }

  const tokens: Token[] = [];
  let tokenType = "";
  let tokenVal = "";

  for (let i = 0; i < tex.length; i++) {
    const char = tex[i];
    const charType = getCharType(char);
    tokenVal += char;
    const isFinalChar = (i === tex.length - 1);

    if (tokenVal.length > 1 && tokenVal[0] === "\\") {
      if (!isFinalChar && charType === getCharType(tex[i + 1]) && charType !== "symb") {
        continue;
      } else {
        tokenVal = tokenVal.slice(1);
      }
    } else if (tokenVal === "\\") {
      tokenType = "cmnd";
      if (isFinalChar) {
        throw new Error(`Unexpected character ${char}`);
      }
      continue;
    } else if (tokenVal === "$") {
      tokenType = "symb";
      if (!isFinalChar && tex[i + 1] === "$") {
        continue;
      }
    } else {
      tokenType = charType;
    }

    if (tokenType === "symb" && tokenVal === " " && (tokenType === "symb" && tokenVal === " ")) {
      // It handles skipping extra spaces or merging logic
      tokenVal = "";
      tokenType = "";
      continue;
    }

    const token: Token = [tokenType, tokenVal];
    tokens.push(token);
    tokenType = "";
    tokenVal = "";
    if (debug && tokens.length > 0) {
      console.log(i, tokens[tokens.length - 1]);
    }
  }

  if (tokens.length === 0) {
    return tokens;
  }

  const firstToken = tokens[0];
  const ftStr = firstToken[0] + "," + firstToken[1];
  if (!["cmnd,[", "cmnd,(", "symb,$", "symb,$$", "cmnd,begin"].includes(ftStr)) {
    tokens.unshift(["meta", "startline"]);
    tokens.push(["meta", "endline"]);
  }

  tokens.unshift(["meta", "start"]);
  tokens.push(["meta", "end"]);

  if (debug) {
    for (let i = 0; i < tokens.length; i++) {
      console.log(i, tokens[i]);
    }
  }

  return tokens;
}
