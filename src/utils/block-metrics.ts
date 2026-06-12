export const MAX_CODE_BLOCK_HEIGHT = 18;

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function getBlockMetrics(content: string, extraLines = 0, maxHeight = MAX_CODE_BLOCK_HEIGHT) {
  const lines = content.split("\n");
  const lineCount = Math.max(1, lines.length + extraLines);
  const maxLineWidth = Math.max(1, ...lines.map(line => line.length));
  const viewportWidth = Math.max(1, (process.stdout.columns || 80) - 6);

  return {
    height: Math.min(maxHeight, lineCount),
    contentWidth: maxLineWidth,
    scrollX: maxLineWidth > viewportWidth,
    scrollY: lineCount > maxHeight,
  };
}
