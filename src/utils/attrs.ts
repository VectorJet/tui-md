import { TextAttributes } from "@opentui/core";

export interface InlineAttrs {
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
  code: boolean;
  fg?: string;
  bg?: string;
}

export const baseAttrs = (): InlineAttrs => ({
  bold: false, italic: false, strikethrough: false, underline: false, code: false,
});

export function mergeAttrs(current: InlineAttrs, overrides: Partial<InlineAttrs>): InlineAttrs {
  return { ...current, ...overrides };
}

/** Returns a numeric bitmask compatible with OpenTUI's attributes prop */
export function toTextAttributes(attrs: InlineAttrs): number {
  let flags = TextAttributes.NONE;
  if (attrs.bold)          flags |= TextAttributes.BOLD;
  if (attrs.italic)        flags |= TextAttributes.ITALIC;
  if (attrs.strikethrough) flags |= TextAttributes.STRIKETHROUGH;
  if (attrs.underline)     flags |= TextAttributes.UNDERLINE;
  return flags;
}
