# tui-md

Markdown rendering components for OpenTUI React applications.

`tui-md` is a library, not a standalone CLI. It exports a React component that renders markdown inside an OpenTUI app.

## Install

```bash
bun add tui-md @opentui/core @opentui/react react
```

`@opentui/core`, `@opentui/react`, and `react` are peer dependencies, so your app controls their versions.

## Basic Usage

```tsx
import { render } from "@opentui/react";
import { Markdown } from "tui-md";

render(
  <Markdown
    content={"# Hello\n\nThis is **markdown** rendered in OpenTUI."}
  />
);
```

## API

```tsx
import {
  Markdown,
  defaultTheme,
  parse,
  parseStreaming,
  resolveTheme,
  type MarkdownProps,
  type TuiMdLinkHandler,
  type TuiMdTheme,
} from "tui-md";
```

### `<Markdown />`

```tsx
<Markdown
  content={markdown}
  streaming={false}
  width="100%"
  theme={{ link: "#8be9fd" }}
  onLinkClick={(url) => {
    // Optional: let the host app decide how links should behave.
  }}
/>
```

Props:

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `content` | `string` | required | Markdown source to render. |
| `streaming` | `boolean` | `false` | Appends a cursor to the last text node for streaming output. |
| `width` | `number \| string` | `"100%"` | Width passed to the root OpenTUI box. |
| `theme` | `Partial<TuiMdTheme>` | `{}` | Color overrides merged with `defaultTheme`. |
| `onLinkClick` | `TuiMdLinkHandler` | built-in opener | Optional link click handler. |

## Link Handling

By default, clicked links use the package's built-in opener:

- `http`, `https`, and `mailto` links are opened with the system opener.
- File paths are opened with `$VISUAL`, `$EDITOR`, a GUI editor, terminal editor, or the system file association when available.

Library consumers can override that behavior:

```tsx
<Markdown
  content="[Open docs](https://example.com)"
  onLinkClick={(url) => {
    console.log("link clicked", url);
  }}
/>
```

Return an error-like result to show a small inline failure message:

```tsx
<Markdown
  content="[Missing file](./missing.md)"
  onLinkClick={() => ({
    ok: false,
    reason: "file-not-found",
    message: "File not found",
  })}
/>
```

## Theming

```tsx
import { Markdown, defaultTheme } from "tui-md";

<Markdown
  content={markdown}
  theme={{
    ...defaultTheme,
    text: "#f8f8f2",
    link: "#8be9fd",
    codeBg: "#282a36",
  }}
/>
```

## Supported Markdown

The renderer supports common markdown plus several GitHub-style extensions:

- headings, paragraphs, blockquotes, lists, task lists, links, inline code, and code blocks
- tables, strikethrough, footnotes, front matter, and math
- GitHub alert blockquotes such as `[!NOTE]` and `[!WARNING]`
- definition lists, abbreviations, `==mark==`, gemoji shortcodes, and selected inline HTML tags such as `kbd`, `sub`, and `sup`
- Mermaid code blocks rendered as terminal-friendly ASCII

## Parser Helpers

`parse(content)` and `parseStreaming(content)` are exported for apps that need access to the markdown AST before rendering.

```ts
import { parse } from "tui-md";

const ast = parse("# Title");
```

## Development

```bash
bun install
bun run test
npm pack --dry-run
```

`bun run test` typechecks the library source and builds the publish output. `npm pack --dry-run` shows exactly what would be published to npm.
