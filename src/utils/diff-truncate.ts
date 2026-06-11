export interface DiffStats {
  added: number;
  removed: number;
  hunks: number;
  lines: number;
}

export function getDiffStats(diffText: string): DiffStats {
  const lines = diffText ? diffText.split("\n") : [];
  let added = 0;
  let removed = 0;
  let hunks = 0;
  let inHunk = false;

  for (const line of lines) {
    const isAdded = line.startsWith("+");
    const isRemoved = line.startsWith("-");
    const isChange = isAdded || isRemoved;

    if (isAdded) added++;
    if (isRemoved) removed++;

    if (isChange && !inHunk) {
      hunks++;
      inHunk = true;
    } else if (!isChange) {
      inHunk = false;
    }
  }

  return { added, removed, hunks, lines: lines.length };
}

interface DiffSegment {
  lines: string[];
  isChange: boolean;
  isEllipsis: boolean;
}

function parseDiffSegments(lines: string[]): DiffSegment[] {
  const segments: DiffSegment[] = [];
  let current: DiffSegment | null = null;

  for (const line of lines) {
    const isChange = line.startsWith("+") || line.startsWith("-");
    const isEllipsis = line.trimStart().startsWith("...");

    if (isEllipsis) {
      if (current) segments.push(current);
      segments.push({ lines: [line], isChange: false, isEllipsis: true });
      current = null;
    } else if (!current || current.isChange !== isChange) {
      if (current) segments.push(current);
      current = { lines: [line], isChange, isEllipsis: false };
    } else {
      current.lines.push(line);
    }
  }

  if (current) segments.push(current);
  return segments;
}

function getTruncatedContextLines(
  seg: DiffSegment,
  allowedLines: number,
  isBeforeChange?: boolean,
  isAfterChange?: boolean
): string[] {
  if (isBeforeChange && isAfterChange) {
    const half = Math.ceil(allowedLines / 2);
    if (seg.lines.length > allowedLines) {
      return [
        ...seg.lines.slice(0, half),
        seg.lines[0].replace(/^(\s*\d*\s*).*/, "$1..."),
        ...seg.lines.slice(-half)
      ];
    }
    return [...seg.lines];
  }
  if (isBeforeChange) {
    return [...seg.lines.slice(-allowedLines)];
  }
  if (isAfterChange) {
    return [...seg.lines.slice(0, allowedLines)];
  }
  return [...seg.lines.slice(0, Math.min(allowedLines, 2))];
}

export function truncateDiffByHunk(
  diffText: string,
  maxHunks: number,
  maxLines: number,
  options?: { fromTail?: boolean }
): { text: string; hiddenHunks: number; hiddenLines: number } {
  if (options?.fromTail) {
    const reversed = (diffText ?? "").split("\n").reverse().join("\n");
    const result = truncateDiffByHunk(reversed, maxHunks, maxLines);
    return {
      text: result.text.split("\n").reverse().join("\n"),
      hiddenHunks: result.hiddenHunks,
      hiddenLines: result.hiddenLines,
    };
  }
  const lines = diffText ? diffText.split("\n") : [];
  const totalStats = getDiffStats(diffText);

  if (lines.length <= maxLines && totalStats.hunks <= maxHunks) {
    return { text: diffText, hiddenHunks: 0, hiddenLines: 0 };
  }

  const segments = parseDiffSegments(lines);
  const changeSegments = segments.filter((s) => s.isChange);
  const changeLineCount = changeSegments.reduce((sum, s) => sum + s.lines.length, 0);

  if (changeLineCount > maxLines) {
    const kept: string[] = [];
    let keptHunks = 0;

    for (const seg of segments) {
      if (seg.isChange) {
        keptHunks++;
        if (keptHunks > maxHunks) break;
      }
      kept.push(...seg.lines);
      if (kept.length >= maxLines) break;
    }

    const keptStats = getDiffStats(kept.join("\n"));
    return {
      text: kept.join("\n"),
      hiddenHunks: Math.max(0, totalStats.hunks - keptStats.hunks),
      hiddenLines: Math.max(0, lines.length - kept.length),
    };
  }

  const contextBudget = maxLines - changeLineCount;
  const contextSegments = segments.filter((s) => !s.isChange && !s.isEllipsis);
  const totalContextLines = contextSegments.reduce((sum, s) => sum + s.lines.length, 0);

  const kept: string[] = [];
  let keptHunks = 0;

  if (totalContextLines <= contextBudget) {
    for (const seg of segments) {
      if (seg.isChange) {
        keptHunks++;
        if (keptHunks > maxHunks) break;
      }
      kept.push(...seg.lines);
    }
  } else {
    const contextRatio = contextSegments.length > 0 ? contextBudget / totalContextLines : 0;

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      if (seg.isChange) {
        keptHunks++;
        if (keptHunks > maxHunks) break;
        kept.push(...seg.lines);
      } else if (seg.isEllipsis) {
        kept.push(...seg.lines);
      } else {
        const allowedLines = Math.max(1, Math.floor(seg.lines.length * contextRatio));
        const isBeforeChange = segments[i + 1]?.isChange;
        const isAfterChange = segments[i - 1]?.isChange;

        kept.push(...getTruncatedContextLines(seg, allowedLines, isBeforeChange, isAfterChange));
      }
    }
  }

  const keptStats = getDiffStats(kept.join("\n"));
  return {
    text: kept.join("\n"),
    hiddenHunks: Math.max(0, totalStats.hunks - keptStats.hunks),
    hiddenLines: Math.max(0, lines.length - kept.length),
  };
}
