/**
 * Unicode superscript / subscript character maps.
 *
 * Terminals have no native ANSI for these, so we remap chars to the unicode
 * equivalents in the Latin-1 Supplement / Phonetic Extensions / Superscripts
 * and Subscripts blocks. Coverage is uneven (subscript letters are sparse,
 * superscript has no `q`, no uppercase `Q/S/X/Y/Z`), so when any char in the
 * input can't be remapped we fall back to a `^(text)` / `_(text)` notation
 * for the whole string — this makes `H2O` render as `H₂O` and `e2` as `e²`
 * while `[1]` cleanly falls back to `^([1])` instead of partial garbage.
 */

const SUPERSCRIPT_MAP: Record<string, string> = {
  // digits
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
  "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  // lowercase letters (no q)
  "a": "ᵃ", "b": "ᵇ", "c": "ᶜ", "d": "ᵈ", "e": "ᵉ",
  "f": "ᶠ", "g": "ᵍ", "h": "ʰ", "i": "ⁱ", "j": "ʲ",
  "k": "ᵏ", "l": "ˡ", "m": "ᵐ", "n": "ⁿ", "o": "ᵒ",
  "p": "ᵖ", "r": "ʳ", "s": "ˢ", "t": "ᵗ", "u": "ᵘ",
  "v": "ᵛ", "w": "ʷ", "x": "ˣ", "y": "ʸ", "z": "ᶻ",
  // uppercase letters (no Q/S/X/Y/Z)
  "A": "ᴬ", "B": "ᴮ", "D": "ᴰ", "E": "ᴱ", "G": "ᴳ",
  "H": "ᴴ", "I": "ᴵ", "J": "ᴶ", "K": "ᴷ", "L": "ᴸ",
  "M": "ᴹ", "N": "ᴺ", "O": "ᴼ", "P": "ᴾ", "R": "ᴿ",
  "T": "ᵀ", "U": "ᵁ", "V": "ⱽ", "W": "ᵂ",
  // symbols / punctuation
  "+": "⁺", "-": "⁻", "=": "⁼", "(": "⁽", ")": "⁾",
  " ": " ",
};

const SUBSCRIPT_MAP: Record<string, string> = {
  // digits
  "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
  "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉",
  // sparse letter set — Unicode subscripts only cover these
  "a": "ₐ", "e": "ₑ", "h": "ₕ", "i": "ᵢ", "j": "ⱼ",
  "k": "ₖ", "l": "ₗ", "m": "ₘ", "n": "ₙ", "o": "ₒ",
  "p": "ₚ", "r": "ᵣ", "s": "ₛ", "t": "ₜ", "u": "ᵤ",
  "v": "ᵥ", "x": "ₓ",
  // symbols
  "+": "₊", "-": "₋", "=": "₌", "(": "₍", ")": "₎",
  " ": " ",
};

/**
 * Try to remap every char in `text` using `map`. Falls back to case-insensitive
 * lookup before giving up. Returns null if any char can't be mapped.
 */
function tryRemap(text: string, map: Record<string, string>): string | null {
  let out = "";
  for (const c of text) {
    const hit = map[c] ?? map[c.toLowerCase()];
    if (!hit) return null;
    out += hit;
  }
  return out;
}

export function toSuperscript(text: string): string {
  return tryRemap(text, SUPERSCRIPT_MAP) ?? `^(${text})`;
}

export function toSubscript(text: string): string {
  return tryRemap(text, SUBSCRIPT_MAP) ?? `_(${text})`;
}
