/**
 * math.tsx — LaTeX rendering for tui-md via TeXicode
 *
 * TeXicode (refs/TeXicode) is a Python CLI (`txc`) that converts LaTeX math
 * expressions into genuine multi-line Unicode art — real fraction bars,
 * vertical integral signs, positioned superscripts/subscripts, proper √ glyphs.
 *
 * This is far superior to flattening MathML text nodes: fractions render as
 * actual stacked numerator/denominator, summation limits are vertically placed,
 * and scripts use Unicode super/subscript positioning when possible.
 *
 * We call `txc` as a subprocess (Bun.spawn), cache results, then render each
 * output row as a <text> line inside an OpenTUI <box>.
 */

import React, { useMemo } from "react";
import type { TuiMdTheme } from "../theme";
import { renderTex, type TeXicodeResult } from "../texicode/pipeline";

// ---------------------------------------------------------------------------
// TeXicode local TS port renderer
// ---------------------------------------------------------------------------

const renderCache = new Map<string, TeXicodeResult>();

/**
 * Call the local TS port of TeXicode.
 * Results are cached by the LaTeX source string.
 */
function renderWithTeXicode(latex: string): TeXicodeResult {
  const cached = renderCache.get(latex);
  if (cached !== undefined) return cached;

  const result = renderTex(latex, false); // use serif font
  // If it returned errors in rows array (pipeline returns error messages in the rows), 
  // we check if it starts with "TeXicode:"
  if (result.rows.length === 1 && result.rows[0].startsWith("TeXicode:")) {
    const errResult: TeXicodeResult = {
      rows: [latex],
      error: result.rows[0],
    };
    renderCache.set(latex, errResult);
    return errResult;
  }

  renderCache.set(latex, result);
  return result;
}

// ---------------------------------------------------------------------------
// React components
// ---------------------------------------------------------------------------

interface MathProps {
  value: string;
  theme: TuiMdTheme;
}

/**
 * Block (display) math: $$...$$
 */
export function MathBlock({ value, theme }: MathProps) {
  const result = useMemo(() => renderWithTeXicode(value), [value]);

  if (result.error && result.rows[0] === value) {
    return (
      <box flexDirection="column" width="100%" marginBottom={1}>
        <text fg={theme.math}>{value}</text>
        <text fg={theme.muted}>{"  (" + result.error + ")"}</text>
      </box>
    );
  }

  return (
    <box flexDirection="column" width="100%" marginBottom={1} alignItems="center">
      {result.rows.map((row, i) => (
        <text key={i} fg={theme.math}>
          {row}
        </text>
      ))}
    </box>
  );
}

/**
 * Inline math: $...$
 *
 * For inline math, we cannot render a `<box>` because this component is often
 * rendered inside a `<text>` or `<span>` context, and OpenTUI strictly forbids
 * `<box>` inside `<text>`. We join multi-line arrays with `\n` and let the parent
 * text node handle the layout.
 */
export function MathInline({ value, theme }: MathProps) {
  const result = useMemo(() => renderWithTeXicode(value), [value]);
  const textContent = result.rows.join("\n");
  
  return <span fg={theme.math}>{textContent}</span>;
}
