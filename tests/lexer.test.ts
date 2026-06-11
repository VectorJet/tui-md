import { expect, test } from "bun:test";
import { lexer } from "../src/texicode/lexer.ts";

test("lexer unexpected character", () => {
  expect(() => lexer("\\")).toThrow("Unexpected character \\");
});
