import React, { useMemo } from "react";
import { parse, parseStreaming } from "./parser";
import type { OpenUrlResult } from "./utils/open";
import { Walk } from "./walk";
import { resolveTheme, defaultTheme, type TuiMdTheme } from "./theme";

export { defaultTheme, parse, parseStreaming, resolveTheme };
export type { TuiMdTheme };

export type TuiMdLinkHandler = (url: string) => void | OpenUrlResult | Promise<void | OpenUrlResult>;

export interface MarkdownProps {
  content: string;
  streaming?: boolean;
  theme?: Partial<TuiMdTheme>;
  width?: number | string;
  onLinkClick?: TuiMdLinkHandler;
}

export function Markdown({ content, streaming = false, theme: themeOverride, width = "100%", onLinkClick }: MarkdownProps) {
  const theme = useMemo(() => resolveTheme(themeOverride), [themeOverride]);

  const ast = useMemo(() => {
    return streaming ? parseStreaming(content) : parse(content);
  }, [content, streaming]);

  return (
    <box flexDirection="column" width={width as any}>
      <Walk ast={ast} theme={theme} onLinkClick={onLinkClick} />
    </box>
  );
}
