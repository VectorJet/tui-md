/**
 * unicode-heading.ts
 * Transforms plain ASCII text into Mathematical Unicode font variants,
 * following the same stateless-transform pattern as TeXicode.
 *
 * Each heading level maps to a distinct Unicode Mathematical Alphanumeric
 * Symbols block (U+1D400–U+1D7FF), giving a visually heavier/lighter weight
 * without any layout overhead — the string is still a single line.
 *
 * Coverage: A-Z, a-z, 0-9. Everything else passes through unchanged.
 *
 * H1 — Mathematical Sans-Serif Bold          (𝗛𝗲𝗹𝗹𝗼)
 * H2 — Mathematical Bold Serif               (𝐇𝐞𝐥𝐥𝐨)
 * H3 — Mathematical Bold Italic              (𝑯𝒆𝒍𝒍𝒐)
 * H4 — Mathematical Sans-Serif Bold Italic   (𝙃𝙚𝙡𝙡𝙤)
 * H5 — Mathematical Italic                   (𝐻𝑒𝑙𝑙𝑜)
 * H6 — Mathematical Monospace                (𝙷𝚎𝚕𝚕𝚘)
 */

type HeadingStyle = {
  upper: number;
  lower: number;
  digit: number | null;
  /** Exceptions: some letters aren't in the block, use these overrides */
  exceptions?: Record<string, string>;
};

const STYLES: Record<number, HeadingStyle> = {
  // H1: Mathematical Sans-Serif Bold (U+1D5D4)
  1: { upper: 0x1D5D4, lower: 0x1D5EE, digit: 0x1D7EC },
  // H2: Mathematical Bold Serif (U+1D400)
  2: { upper: 0x1D400, lower: 0x1D41A, digit: 0x1D7CE },
  // H3: Mathematical Bold Italic (U+1D468)
  3: { upper: 0x1D468, lower: 0x1D482, digit: null },
  // H4: Mathematical Sans-Serif Bold Italic (U+1D63C)
  4: { upper: 0x1D63C, lower: 0x1D656, digit: null },
  // H5: Mathematical Italic (U+1D434) — h/italic exceptions apply
  5: {
    upper: 0x1D434,
    lower: 0x1D44E,
    digit: null,
    // U+210E (Planck constant) is the canonical italic h
    exceptions: { h: "\u210E" },
  },
  // H6: Mathematical Monospace (U+1D670)
  6: { upper: 0x1D670, lower: 0x1D68A, digit: 0x1D7F6 },
};

/**
 * Transform `text` into the Unicode Mathematical font for `level` (1–6).
 * Non-ASCII and non-alphanumeric characters pass through as-is.
 */
export function toUnicodeHeading(text: string, level: number): string {
  const style = STYLES[Math.min(Math.max(level, 1), 6)];
  let out = "";
  for (const char of text) {
    if (style.exceptions && char in style.exceptions) {
      out += style.exceptions[char];
      continue;
    }
    const c = char.codePointAt(0)!;
    if (c >= 65 && c <= 90) {
      out += String.fromCodePoint(style.upper + c - 65);
    } else if (c >= 97 && c <= 122) {
      out += String.fromCodePoint(style.lower + c - 97);
    } else if (c >= 48 && c <= 57 && style.digit !== null) {
      out += String.fromCodePoint(style.digit + c - 48);
    } else {
      out += char;
    }
  }
  return out;
}
