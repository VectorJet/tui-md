/** Port of TeXicode renderer.py */

import * as arts from "./arts";
import { symbols } from "./symbols_art";
import { typeInfoDict } from "./node_data";
import type { NodeTuple } from "./parser";
import type { Token, NodeType } from "./node_data";

function utilRevertFont(char: string): string {
  if (char.charCodeAt(0) < 128) return char;
  for (const alphaKey of Object.keys(arts.alphabets)) {
    const alphabet = arts.alphabets[alphaKey];
    if (!alphabet.includes(char)) continue;
    for (let alphaId = 0; alphaId < 26 * 2; alphaId++) {
      // In JS, string indexing by char code offset is safe here because our alphabets use full unicode chars properly or surrogate pairs.
      // We will use Array.from to correctly index surrogate pairs.
      const alphabetArr = Array.from(alphabet);
      const normalArr = Array.from(arts.alphabets.normal);
      if (alphabetArr[alphaId] === char) {
        return normalArr[alphaId];
      }
    }
  }
  return char;
}

function utilFont(fontVal: arts.FontName, children: arts.SketchTuple[]): arts.SketchTuple {
  const [sketch, horizon] = children[0];
  const newSketch: arts.Sketch = [];
  for (const row of sketch) {
    const newRow: string[] = [];
    for (let char of row) {
      char = utilRevertFont(char);
      const normalArr = Array.from(arts.alphabets.normal);
      const fontArr = Array.from(arts.font[fontVal]);
      const idx = normalArr.indexOf(char);
      if (idx === -1) {
        newRow.push(char);
      } else {
        newRow.push(fontArr[idx]);
      }
    }
    newSketch.push(newRow);
  }
  return [newSketch, horizon, []];
}

function utilUnshrink(smallChar: string): string {
  for (const [char, scripts] of Object.entries(arts.unicodeScripts)) {
    if (scripts.includes(smallChar)) return char;
  }
  return smallChar;
}

function utilConcat(children: arts.SketchTuple[], concatLine: boolean, alignAmp: boolean): arts.SketchTuple {
  if (children.length === 0) return [[[]], 0, []];

  const concatedSketch: arts.Sketch = [];
  let maxhSky = 0;
  let maxhOcn = 0;
  let containAmp = false;
  const concatedAmps: number[] = [];

  for (const [sketch, horizon, amps] of children) {
    if (amps.length > 0) {
      if (!alignAmp) throw new Error(`Unexpected & at positions ${amps}`);
      containAmp = true;
      continue;
    }
    const hSky = horizon;
    const hOcn = sketch.length - hSky - 1;
    maxhSky = Math.max(maxhSky, hSky);
    maxhOcn = Math.max(maxhOcn, hOcn);
  }

  let concatedHorizon = maxhSky;
  for (let i = 0; i < maxhSky + 1 + maxhOcn; i++) {
    concatedSketch.push([]);
  }

  for (const [sketch, horizon, amps] of children) {
    if (amps.length > 0) {
      concatedAmps.push(concatedSketch[0].length);
      continue;
    }
    const hSky = horizon;
    const hOcn = sketch.length - hSky - 1;
    const topPadLen = maxhSky - hSky;
    const btmPadLen = maxhOcn - hOcn;

    const width = sketch[0] ? sketch[0].length : 0;
    const topPad: string[][] = Array.from({length: topPadLen}, () => Array(width).fill(arts.BG));
    const btmPad: string[][] = Array.from({length: btmPadLen}, () => Array(width).fill(arts.BG));

    const paddedSketch = [...topPad, ...sketch, ...btmPad];
    for (let i = 0; i < concatedSketch.length; i++) {
      concatedSketch[i] = concatedSketch[i].concat(paddedSketch[i]);
    }
  }

  if (concatLine && !containAmp) {
    // TeXicode seems to use this logic for align spacing, we keep it as is
    concatedHorizon = concatedSketch[0].length; 
  }

  return [concatedSketch, concatedHorizon, concatedAmps];
}

function utilVertPile(top: arts.Sketch, ctr: arts.Sketch, ctrHorizon: number, btm: arts.Sketch, align: "left"|"right"|"center"): arts.SketchTuple {
  let piledSketch: arts.Sketch = [];
  let piledHorizon = top.length + ctrHorizon;

  if (top.length === 1 && top[0].length === 0) piledHorizon -= 1;
  if (ctr.length === 1 && ctr[0].length === 0) piledHorizon -= 1;

  if (piledHorizon < 0) piledHorizon = 0;

  const lenTop = top[0] ? top[0].length : 0;
  const lenCtr = ctr[0] ? ctr[0].length : 0;
  const lenBtm = btm[0] ? btm[0].length : 0;
  const maxLen = Math.max(lenTop, lenCtr, lenBtm);

  for (const sketch of [top, ctr, btm]) {
    if (sketch.length === 1 && sketch[0].length === 0) continue;
    
    const sketchLen = sketch[0].length;
    let leftPadLen = 0;
    let rightPadLen = 0;

    if (align === "left") rightPadLen = maxLen - sketchLen;
    else if (align === "right") leftPadLen = maxLen - sketchLen;
    else if (align === "center") {
      leftPadLen = Math.floor((maxLen - sketchLen) / 2);
      rightPadLen = maxLen - sketchLen - leftPadLen;
    }

    const leftPad = Array(leftPadLen).fill(arts.BG);
    const rightPad = Array(rightPadLen).fill(arts.BG);

    for (const row of sketch) {
      piledSketch.push([...leftPad, ...row, ...rightPad]);
    }
  }

  if (piledSketch.length === 0) piledSketch = [[]];

  return [piledSketch, piledHorizon, []];
}

function utilShrink(sketch: arts.Sketch, scriptTypeId: number, smart: boolean, switchFlag: boolean): arts.Sketch {
  const invertScriptTypeId = 1 - scriptTypeId;
  if (sketch.length !== 1) return [];

  const art = arts.unicodeScripts;
  const shrunkRow: string[] = [];

  for (let char of sketch[0]) {
    char = utilRevertFont(char);
    const unshrunkChar = utilUnshrink(char);

    if (!(unshrunkChar in art)) return [];

    if (art[unshrunkChar][scriptTypeId] === char) return [];

    if (art[unshrunkChar][invertScriptTypeId] === char) {
      if (smart) {
        shrunkRow.push(char);
        continue;
      }
      if (switchFlag) {
        shrunkRow.push(art[unshrunkChar][scriptTypeId]);
        continue;
      }
      return [];
    }

    const shrunkChar = art[unshrunkChar][scriptTypeId];
    if (shrunkChar !== " " || char === " ") {
      shrunkRow.push(shrunkChar);
      continue;
    }
    return [];
  }
  return [shrunkRow];
}

function utilScript(children: arts.SketchTuple[], scriptTypeId: number): arts.SketchTuple {
  let [sketch, horizon] = children[0];
  const shrunk = utilShrink(sketch, scriptTypeId, false, false);
  if (shrunk.length !== 0) return [shrunk, 0, []];

  const smartShrunk = utilShrink(sketch, 1 - scriptTypeId, true, false);
  if (smartShrunk.length !== 0) {
    sketch = smartShrunk;
  }

  let top: arts.Sketch = [[]];
  let btm: arts.Sketch = [[]];

  if (scriptTypeId === 0) top = sketch;
  else if (scriptTypeId === 1) btm = sketch;

  return utilVertPile(top, [[arts.BG]], 0, btm, "left");
}

function utilGetPileCenter(baseHeight: number, baseHorizon: number): arts.SketchTuple {
  if (baseHeight === 2) {
    if (baseHorizon === 0) return [[[]], 0, []];
    if (baseHorizon === 1) return [[[]], 1, []];
  }
  if (baseHeight === 1) return [[[]], 0, []];

  const pileCenterSketch: arts.Sketch = [];
  for (let i = 0; i < baseHeight - 2; i++) {
    pileCenterSketch.push([arts.BG]);
  }
  return [pileCenterSketch, baseHorizon - 1, []];
}

function utilDelimiter(delimType: string, height: number, horizon: number): arts.SketchTuple {
  if (delimType === ".") return [[[]], 0, []];

  const sglStr = Array.from(arts.delimiter.sgl);
  const delimChar = Array.from(delimType)[0];
  const artCol = sglStr.indexOf(delimChar);
  if (artCol === -1) throw new Error(`Invalid delimiter type ${delimType}`);

  const delimArt: Record<string, string> = {};
  for (const [pos, art] of Object.entries(arts.delimiter)) {
    delimArt[pos] = Array.from(art)[artCol];
  }

  if (height === 1) return [[[delimType]], 0, []];

  if (height === 2 && (delimType === "{" || delimType === "}")) {
    height = 3;
    if (horizon === 0) horizon = 1;
  }

  let center = horizon;
  if (center === 0) center = 1;
  if (center === height - 1) center = height - 2;

  const sketch: arts.Sketch = [];
  for (let i = 0; i < height; i++) {
    sketch.push([delimArt.fil]);
  }

  sketch[center] = [delimArt.ctr];
  sketch[0] = [delimArt.top];
  sketch[height - 1] = [delimArt.btm];

  return [sketch, horizon, []];
}

function utilAddAmpersandPadding(children: arts.SketchTuple[]): arts.SketchTuple[] {
  let maxAmp = 0;
  for (const [sketch, horizon, amps] of children) {
    if (amps.length > 0) maxAmp = Math.max(maxAmp, amps[0]);
  }

  const paddedChildren: arts.SketchTuple[] = [];
  for (const [sketch, horizon, amps] of children) {
    const newAmps = amps.length ? amps : [-1];
    const padLen = maxAmp - newAmps[0];
    const padding = Array(padLen).fill(arts.BG);

    const paddedSketch: arts.Sketch = [];
    for (const row of sketch) {
      paddedSketch.push([...padding, ...row]);
    }
    paddedChildren.push([paddedSketch, horizon, amps]);
  }

  return paddedChildren;
}

function utilVertConcat(children: arts.SketchTuple[], sep: arts.Sketch, align: "left"|"center"|"right"): arts.SketchTuple {
  let processedChildren = children;
  if (processedChildren[0][2].length > 0 && processedChildren[0][2][0] !== -1) {
    processedChildren = utilAddAmpersandPadding(processedChildren);
  }

  let sketch = processedChildren[0][0];
  let horizon = 0;

  for (let i = 1; i < processedChildren.length; i++) {
    const top = sketch;
    const btm = processedChildren[i][0];
    const piled = utilVertPile(top, sep, 0, btm, align);
    sketch = piled[0];
    horizon = piled[1];
  }

  return [sketch, horizon, []];
}

function renderFont(token: Token, children: arts.SketchTuple[]): arts.SketchTuple {
  return utilFont(token[1] as arts.FontName, children);
}

function renderTextInfo(token: Token, children: arts.SketchTuple[]): arts.SketchTuple {
  return [[[token[1]]], 0, []];
}

function renderText(token: Token, children: arts.SketchTuple[]): arts.SketchTuple {
  return utilFont(token[1] as arts.FontName, children);
}

function renderLeaf(token: Token, children: arts.SketchTuple[]): arts.SketchTuple {
  const tokenType = token[0];
  const tokenVal = token[1];
  let sketch: arts.Sketch = [[tokenVal]];
  let horizon = 0;
  let amps: number[] = [];

  if (tokenType === "numb") return [sketch, horizon, amps];
  if (tokenType === "symb") {
    if (tokenVal === "&") amps.push(0);
    else if (tokenVal in arts.specialSymbols) sketch = arts.specialSymbols[tokenVal];
    return [sketch, horizon, amps];
  }
  if (tokenType === "alph") {
    return utilFont("mathnormal", [[sketch, 0, []]]);
  }
  if (tokenType === "cmnd") {
    if (tokenVal in arts.multiLineLeafCommands) {
      const art = arts.multiLineLeafCommands[tokenVal];
      sketch = art[0]; horizon = art[1]; amps = art[2];
    } else if (tokenVal in symbols) {
      sketch = [symbols[tokenVal]];
    } else {
      sketch = [["?"]];
    }
    return [sketch, horizon, amps];
  }
  return [sketch, horizon, amps];
}

function renderConcat(children: arts.SketchTuple[]): arts.SketchTuple {
  return utilConcat(children, false, false);
}

function renderSupScript(children: arts.SketchTuple[]): arts.SketchTuple {
  return utilScript(children, 0);
}

function renderSubScript(children: arts.SketchTuple[]): arts.SketchTuple {
  return utilScript(children, 1);
}

function renderTopScript(children: arts.SketchTuple[]): arts.SketchTuple {
  const shrunk = utilShrink(children[0][0], 1, true, false);
  if (shrunk.length === 0) return children[0];
  return [shrunk, 0, []];
}

function renderBottomScript(children: arts.SketchTuple[]): arts.SketchTuple {
  const shrunk = utilShrink(children[0][0], 0, true, false);
  if (shrunk.length === 0) return children[0];
  return [shrunk, 0, []];
}

function renderApplyScripts(base: arts.SketchTuple, scripts: [NodeType, arts.SketchTuple][]): arts.SketchTuple {
  const [baseSketch, baseHorizon] = base;
  const sortedScripts: [arts.Sketch, arts.Sketch] = [[[]], [[]]];
  let basePosition: "left" | "center" = "left";

  for (const [scriptType, scriptTuple] of scripts) {
    if (scriptType === "top_scrpt" || scriptType === "btm_scrpt") basePosition = "center";
    let scriptPosition = 0;
    if (scriptType === "sub_scrpt" || scriptType === "btm_scrpt") scriptPosition = 1;
    if (sortedScripts[scriptPosition].length > 0 && sortedScripts[scriptPosition][0].length > 0) {
      const typeName = scriptPosition === 0 ? "super" : "sub";
      throw new Error(`Double ${typeName}scripts`);
    }
    sortedScripts[scriptPosition] = scriptTuple[0];
  }

  let [top, btm] = sortedScripts;

  if (basePosition === "center") {
    return utilVertPile(top, baseSketch, baseHorizon, btm, "center");
  }

  let [ctr, ctrHorizon] = utilGetPileCenter(baseSketch.length, baseHorizon);
  if (ctr.length > 0 && ctr[0].length > 0) {
    const piledScripts = utilVertPile(top, ctr, ctrHorizon, btm, "left");
    return utilConcat([base, piledScripts], false, false);
  }

  if (top.length === 1 && top[0].length === 0) {
    return utilConcat([base, [btm, 0, []]], false, false);
  }
  if (btm.length === 1 && btm[0].length === 0) {
    return utilConcat([base, [top, top.length - 1, []]], false, false);
  }

  if (top.length > 1) {
    top.pop();
    ctr = [[]];
    ctrHorizon = 1;
  } else if (btm.length > 1) {
    btm.shift();
    ctr = [[]];
  } else if (top.length === 1 && btm.length === 1) {
    top = utilShrink(top, 1, false, true);
    btm = utilShrink(btm, 0, false, true);
    ctr = [[arts.BG]];
  }

  const piledScripts = utilVertPile(top, ctr, ctrHorizon, btm, "left");
  return utilConcat([base, piledScripts], false, false);
}

function renderBigDelimiter(token: Token, children: arts.SketchTuple[]): arts.SketchTuple {
  const size = token[1];
  const delimType = children[0][0][0][0];
  const heightDict: Record<string, number> = {
    "big": 1, "bigl": 1, "bigr": 1,
    "Big": 3, "Bigl": 3, "Bigr": 3,
    "bigg": 5, "biggl": 5, "biggr": 5,
    "Bigg": 7, "Biggl": 7, "Biggr": 7
  };
  const height = heightDict[size];
  return utilDelimiter(delimType, height, Math.floor(height / 2));
}

function renderOpenDelimiter(children: arts.SketchTuple[]): arts.SketchTuple {
  const inside = utilConcat(children.slice(1, -1), false, false);
  const leftDelimType = children[0][0][0][0];
  const rightDelimType = children[children.length - 1][0][0][0];
  const height = inside[0].length;
  const horizon = inside[1];
  const left = utilDelimiter(leftDelimType, height, horizon);
  const right = utilDelimiter(rightDelimType, height, horizon);
  return utilConcat([left, inside, right], false, false);
}

function renderCloseDelimiter(children: arts.SketchTuple[]): arts.SketchTuple {
  return children[0];
}

function renderBinomial(children: arts.SketchTuple[]): arts.SketchTuple {
  const n = children[0][0], r = children[1][0];
  const sepSpace = Array(Math.max(n[0].length, r[0].length)).fill(arts.BG);
  const piled = utilVertPile(n, [sepSpace], 0, r, "center");
  return renderOpenDelimiter([ [[[Array.from("(")[0]]], 0, []], piled, [[[Array.from(")")[0]]], 0, []] ]);
}

function renderFraction(children: arts.SketchTuple[]): arts.SketchTuple {
  const numer = children[0][0], denom = children[1][0];
  const art = arts.fraction;
  const fractionLine = Array(Math.max(numer[0] ? numer[0].length : 0, denom[0] ? denom[0].length : 0)).fill(art[1]);
  const fRow = [art[0], ...fractionLine, art[2]];
  return utilVertPile(numer, [fRow], 0, denom, "center");
}

function renderAccents(token: Token, children: arts.SketchTuple[]): arts.SketchTuple {
  const accentVal = token[1];
  const uHex: Record<string, string> = {
    acute: "\u0302", bar: "\u0304", breve: "\u0306", check: "\u030C", ddot: "\u0308",
    dot: "\u0307", grave: "\u0300", hat: "\u0302", mathring: "\u030A", tilde: "\u0303",
    vec: "\u20D7", widehat: "\u0302", widetilde: "\u0360"
  };
  let sketch = children[0][0];
  const firstChar = sketch[0][0] + uHex[accentVal];
  const firstRow = [firstChar, ...sketch[0].slice(1)];
  sketch = [firstRow, ...sketch.slice(1)];
  return [sketch, children[0][1], children[0][2]];
}

function utilOnecharSquareRoot(children: arts.SketchTuple[]): arts.SketchTuple {
  const [radicandSketch, radicandHorizon] = children[children.length - 1];
  const surdArt = symbols["surd"];
  
  let newRadiRow: string[] = surdArt;
  if (radicandSketch.length > 0 && radicandSketch[0].length === 1) {
    newRadiRow = [...surdArt, radicandSketch[0][0] + "\u0305"];
  }
  const newRadi: arts.SketchTuple = [[newRadiRow], radicandHorizon, []];

  if (children.length <= 1) return newRadi;

  const degree = utilScript(children, 0);
  return utilConcat([degree, newRadi], false, false);
}

function utilMulticharSquareRoot(children: arts.SketchTuple[]): arts.SketchTuple {
  const degreeSketch = children[0][0];
  const [radicandSketch, radicandHorizon] = children[children.length - 1];
  const art = arts.squareRoot;

  const topBar = Array(radicandSketch[0].length).fill(art.top_bar[0]);
  const sqrtSketch = [topBar, ...radicandSketch];

  for (let i = 0; i < sqrtSketch.length; i++) {
    sqrtSketch[i] = [...art.left_bar, ...sqrtSketch[i], arts.BG];
  }

  sqrtSketch[0] = [...art.top_angle, ...sqrtSketch[0].slice(2, -1), ...art.top_tail];
  sqrtSketch[sqrtSketch.length - 1] = [...art.btm_angle, ...sqrtSketch[sqrtSketch.length - 1].slice(2)];

  if (children.length === 1 || degreeSketch.length > 1) {
    return [sqrtSketch, radicandHorizon + 1, []];
  }

  let shrinkedDegree = utilShrink(degreeSketch, 1, false, false);
  if (shrinkedDegree.length === 0) shrinkedDegree = degreeSketch;

  if (sqrtSketch[sqrtSketch.length - 2][0] === " ") {
    sqrtSketch[sqrtSketch.length - 2] = [shrinkedDegree[0][shrinkedDegree[0].length - 1], ...sqrtSketch[sqrtSketch.length - 2].slice(1)];
    shrinkedDegree[0] = shrinkedDegree[0].slice(0, -1);
  }

  const leftPad = Array(shrinkedDegree[0].length).fill(arts.BG);

  for (let i = 0; i < sqrtSketch.length; i++) {
    if (i === sqrtSketch.length - 2) {
      sqrtSketch[i] = [...shrinkedDegree[0], ...sqrtSketch[i]];
      continue;
    }
    sqrtSketch[i] = [...leftPad, ...sqrtSketch[i]];
  }

  return [sqrtSketch, radicandHorizon + 1, []];
}

function renderSquareRoot(children: arts.SketchTuple[]): arts.SketchTuple {
  const radicandSketch = children[children.length - 1][0];
  if (radicandSketch[0] && radicandSketch[0].length <= 1 && radicandSketch.length === 1) {
    return utilOnecharSquareRoot(children);
  } else {
    return utilMulticharSquareRoot(children);
  }
}

function renderConcatLineAlignAmp(children: arts.SketchTuple[]): arts.SketchTuple {
  return utilConcat(children, true, true);
}

function renderConcatLineNoAlignAmp(children: arts.SketchTuple[]): arts.SketchTuple {
  const [sketch, horizon] = utilConcat(children, true, false);
  return [sketch, horizon, []];
}

function renderBegin(children: arts.SketchTuple[], childNodeTypes: string[]): arts.SketchTuple {
  const firstChild = children[0][0];
  const env = firstChild.map(r => r.join("")).join("");

  let firstLineChildren: arts.SketchTuple[] = [];
  let otherLines: arts.SketchTuple[] = [];

  for (let i = 1; i < children.length; i++) {
    if (childNodeTypes[i] === "cmd_lbrk") {
      otherLines.push(children[i]);
    } else {
      firstLineChildren.push(children[i]);
    }
  }

  let lines: arts.SketchTuple[] = [];
  if (firstLineChildren.length > 0) {
    lines.push(utilConcat(firstLineChildren, true, true));
  }
  lines = lines.concat(otherLines);

  if (env === "align" || env === "align*") {
    return utilVertConcat(lines, [[]], "center");
  } else if (env === "pmatrix" || env === "bmatrix" || env === "vmatrix" || env === "Vmatrix" || env === "matrix") {
    let [sketch, horizon] = utilVertConcat(lines, [[]], "center");
    
    let leftDelimType = "";
    let rightDelimType = "";
    if (env === "pmatrix") { leftDelimType = "("; rightDelimType = ")"; }
    else if (env === "bmatrix") { leftDelimType = "["; rightDelimType = "]"; }
    else if (env === "vmatrix") { leftDelimType = "|"; rightDelimType = "|"; }
    else if (env === "Vmatrix") { leftDelimType = "‖"; rightDelimType = "‖"; }

    if (leftDelimType) {
        const height = sketch.length;
        const left = utilDelimiter(leftDelimType, height, horizon);
        const right = utilDelimiter(rightDelimType, height, horizon);
        const res = utilConcat([left, [sketch, horizon, []], right], false, false);
        sketch = res[0];
        horizon = res[1];
    }
    return [sketch, horizon, []];
  } else {
    let linesNoAmp: arts.SketchTuple[] = [];
    if (firstLineChildren.length > 0) {
      linesNoAmp.push(utilConcat(firstLineChildren, true, false));
    }
    linesNoAmp = linesNoAmp.concat(otherLines);
    return utilVertConcat(linesNoAmp, [[]], "center");
  }
}

function renderRoot(children: arts.SketchTuple[]): arts.SketchTuple {
  return utilVertConcat(children, [[arts.BG]], "left");
}

function renderSubstack(children: arts.SketchTuple[]): arts.SketchTuple {
  return utilVertConcat(children, [[]], "center");
}

function renderEnd(children: arts.SketchTuple[]): arts.SketchTuple {
  return children[0];
}

function renderNode(nodeType: string, token: Token, children: arts.SketchTuple[], childNodeTypes: string[]): arts.SketchTuple {
  if (!(nodeType in typeInfoDict)) {
    throw new Error(`Undefined control sequence ${token[1]}`);
  }

  const renderingInfo = typeInfoDict[nodeType][4];
  const requireToken = renderingInfo[0];
  const functionName = renderingInfo[1];

  const funcs: Record<string, Function> = {
    render_font: renderFont,
    render_text_info: renderTextInfo,
    render_text: renderText,
    render_leaf: renderLeaf,
    render_concat: renderConcat,
    render_sup_script: renderSupScript,
    render_sub_script: renderSubScript,
    render_top_script: renderTopScript,
    render_bottom_script: renderBottomScript,
    render_big_delimiter: renderBigDelimiter,
    render_open_delimiter: renderOpenDelimiter,
    render_close_delimiter: renderCloseDelimiter,
    render_binomial: renderBinomial,
    render_fraction: renderFraction,
    render_accents: renderAccents,
    render_square_root: renderSquareRoot,
    render_concat_line_align_amp: renderConcatLineAlignAmp,
    render_concat_line_no_align_amp: renderConcatLineNoAlignAmp,
    render_begin: renderBegin,
    render_root: renderRoot,
    render_substack: renderSubstack,
    render_end: renderEnd,
  };

  if (!functionName || !(functionName in funcs)) {
    throw new Error(`Unknown Function ${functionName}`);
  }

  const fn = funcs[functionName];

  if (requireToken) {
    return fn(token, children, childNodeTypes);
  } else {
    return fn(children, childNodeTypes);
  }
}

export function render(nodes: NodeTuple[], debug: boolean = false): arts.SketchTuple {
  if (debug) console.log("Rendering");

  const canvas: arts.SketchTuple[] = Array(nodes.length);

  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    const nodeType = node[0];
    const nodeToken = node[1];
    const childrenIds = node[2];
    const scriptsIds = node[3];

    const children = childrenIds.map(id => canvas[id]);
    const childNodeTypes = childrenIds.map(id => nodes[id][0]);
    const scripts: [NodeType, arts.SketchTuple][] = scriptsIds.map(id => [nodes[id][0], canvas[id]]);

    let [sketch, horizon, amps] = renderNode(nodeType, nodeToken, children, childNodeTypes);
    let child: arts.SketchTuple = [sketch, horizon, amps];

    if (scripts.length > 0) {
      child = renderApplyScripts(child, scripts);
    }

    canvas[i] = child;
  }

  if (canvas.length === 0) return [[[]], 0, []];
  return canvas[0];
}

export function renderToSketch(nodes: NodeTuple[], debug: boolean = false): arts.Sketch {
  return render(nodes, debug)[0];
}
