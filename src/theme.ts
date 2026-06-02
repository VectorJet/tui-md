/**
 * Default theme token map. All values are hex colors.
 * Pass a partial override to <Markdown theme={...} /> to customize.
 */
export interface TuiMdTheme  {
  text: string;
  muted: string;
  accent: string;
  border: string;
  link: string;
  code: string;
  codeBg: string;
  math: string;
  list: string;
  kbd: string;
  kbdBg: string;
  highlightFg: string;
  highlightBg: string;
  diffAdd: string;
  diffDel: string;
  // heading colors
  h1: string;
  h2: string;
  h3: string;
  h4: string;
  h5: string;
  h6: string;
}

export const defaultTheme = {
  text:        "#d4d4d4",
  muted:       "#6b6b6b",
  accent:      "#569cd6",
  border:      "#3c3c3c",
  link:        "#4ec9b0",
  code:        "#ce9178",
  codeBg:      "#1e1e1e",
  math:        "#dcdcaa",
  list:        "#569cd6",
  kbd:         "#d4d4d4",
  kbdBg:       "#3c3c3c",
  highlightFg: "#000000",
  highlightBg: "#ffff00",
  diffAdd:     "#4ec9b0",
  diffDel:     "#f44747",
  h1:          "#4ec9b0",
  h2:          "#569cd6",
  h3:          "#c586c0",
  h4:          "#dcdcaa",
  h5:          "#ce9178",
  h6:          "#6b6b6b",
};

export function resolveTheme(override?: Partial<TuiMdTheme>): TuiMdTheme {
  return { ...defaultTheme, ...override } as TuiMdTheme;
}
