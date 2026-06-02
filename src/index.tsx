import React, { useMemo } from "react";
import { parse, parseStreaming } from "./parser";
import { Walk } from "./walk";
import { resolveTheme, defaultTheme, type TuiMdTheme } from "./theme";

export { defaultTheme, resolveTheme };
export type { TuiMdTheme };

interface MarkdownProps {
  content: string;
  streaming?: boolean;
  theme?: Partial<TuiMdTheme>;
  width?: number | string;
}

export function Markdown({ content, streaming = false, theme: themeOverride, width = "100%" }: MarkdownProps) {
  const theme = useMemo(() => resolveTheme(themeOverride), [themeOverride]);

  const ast = useMemo(() => {
    return streaming ? parseStreaming(content) : parse(content);
  }, [content, streaming]);

  return (
    <box flexDirection="column" width={width as any}>
      <Walk ast={ast} theme={theme} />
    </box>
  );
}
