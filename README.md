# tui-md

Markdown rendering components for OpenTUI React.

## Install

```bash
bun add tui-md @opentui/core @opentui/react react
```

## Usage

```tsx
import { render } from "@opentui/react";
import { Markdown } from "tui-md";

render(<Markdown content={"# Hello\n\nThis is **markdown**."} />);
```

## Development

```bash
bun install
bun run test
npm pack --dry-run
```
