import React, { useMemo } from "react";
import { parse, parseStreaming } from "./parser";
import type { OpenUrlResult } from "./utils/open";
import { Walk } from "./walk";
import { resolveTheme, defaultTheme, type TuiMdTheme } from "./theme";

export { defaultTheme, parse, parseStreaming, resolveTheme };
export type { TuiMdTheme };

export type TuiMdLinkHandler = (url: string) => void | OpenUrlResult | Promise<void | OpenUrlResult>;

export interface CodeOptions {
  /** Show line numbers on blocks with >= minLines lines (default 6 when true). */
  lineNumbers?: boolean | { minLines?: number };
  /** Override max visible code block height (default 18). */
  maxHeight?: number;
}

export interface MarkdownStreamingOptions {
  tailPinDiffs?: boolean;
  maxDiffLines?: number;
  maxDiffHunks?: number;
}

export interface MarkdownProps {
  content: string;
  streaming?: boolean | MarkdownStreamingOptions;
  theme?: Partial<TuiMdTheme>;
  width?: number | string;
  onLinkClick?: TuiMdLinkHandler;
  codeOptions?: CodeOptions;
}

export function Markdown({ content, streaming = false, theme: themeOverride, width = "100%", onLinkClick, codeOptions }: MarkdownProps) {
  const theme = useMemo(() => resolveTheme(themeOverride), [themeOverride]);

  const ast = useMemo(() => {
    return streaming ? parseStreaming(content) : parse(content);
  }, [content, streaming]);

  return (
    <box flexDirection="column" width={width as any}>
      <Walk ast={ast} theme={theme} onLinkClick={onLinkClick} streaming={streaming} codeOptions={codeOptions} />
    </box>
  );
}
