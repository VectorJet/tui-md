import { execFile, spawn } from "child_process";
import { existsSync } from "fs";
import { isAbsolute, resolve } from "path";
import type { CliRenderer } from "@opentui/core";

const GUI_EDITOR_CANDIDATES = ["code", "code-insiders"];
const TERMINAL_EDITOR_CANDIDATES = ["nvim", "vim", "nano", "vi"];
const TERMINAL_CANDIDATES = ["x-terminal-emulator", "gnome-terminal", "konsole", "xfce4-terminal", "alacritty", "kitty", "wezterm"];

export type OpenUrlResult =
  | { ok: true }
  | { ok: false; reason: "file-not-found" | "open-failed"; path?: string; message: string };

export interface OpenUrlOptions {
  renderer?: CliRenderer;
}

function execFileAsync(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    execFile(command, args, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

const commandExistsCache = new Map<string, Promise<boolean>>();

function commandExists(command: string) {
  if (commandExistsCache.has(command)) return commandExistsCache.get(command)!;

  const promise = (async () => {
    const checker = process.platform === "win32" ? "where" : "sh";
    // Use positional parameter to avoid command injection on Unix
    const args = process.platform === "win32" ? [command] : ["-lc", `command -v "$1"`, "--", command];

    try {
      await execFileAsync(checker, args);
      return true;
    } catch {
      return false;
    }
  })();

  commandExistsCache.set(command, promise);
  return promise;
}

async function openExternal(target: string): Promise<OpenUrlResult> {
  const command =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "cmd" :
    "xdg-open";

  const args =
    process.platform === "win32" ? ["/c", "start", "", target] :
    [target];

  try {
    await execFileAsync(command, args);
    return { ok: true };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      reason: "open-failed",
      message: `Failed to open link: ${target}${detail ? ` (${detail})` : ""}`,
    };
  }
}

function normalizeFilePath(url: string) {
  let filePath = decodeURIComponent(url.trim());

  if (/^file:\/\//i.test(filePath)) {
    filePath = filePath.replace(/^file:\/\//i, "");
    if (process.platform !== "win32" && !filePath.startsWith("/")) {
      filePath = resolve(process.cwd(), filePath);
    }
  }

  return isAbsolute(filePath) ? filePath : resolve(process.cwd(), filePath);
}

function spawnDetached(command: string, args: string[]) {
  const child = spawn(command, args, {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
}

function spawnInherited(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with ${signal ?? code}`));
      }
    });
  });
}

async function openWithConfiguredEditor(filePath: string) {
  const configuredEditor = process.env.VISUAL || process.env.EDITOR;
  if (!configuredEditor) return false;

  try {
    const bun = (globalThis as typeof globalThis & { Bun?: { openInEditor?: (path: string) => Promise<unknown> } }).Bun;
    if (bun?.openInEditor) {
      await bun.openInEditor(filePath);
      return true;
    }
  } catch {
    // Fall through to the configured command below.
  }

  const [command, ...args] = configuredEditor.split(/\s+/).filter(Boolean);
  if (!command || !(await commandExists(command))) return false;
  spawnDetached(command, [...args, filePath]);
  return true;
}

async function openWithGuiEditor(filePath: string) {
  const editors = await Promise.all(
    GUI_EDITOR_CANDIDATES.map(async e => ({ name: e, exists: await commandExists(e) }))
  );
  const editor = editors.find(e => e.exists)?.name;
  if (!editor) return false;

  spawnDetached(editor, [filePath]);
  return true;
}

async function openWithTerminalEditor(filePath: string) {
  const [editors, terminals] = await Promise.all([
    Promise.all(TERMINAL_EDITOR_CANDIDATES.map(async e => ({ name: e, exists: await commandExists(e) }))),
    Promise.all(TERMINAL_CANDIDATES.map(async t => ({ name: t, exists: await commandExists(t) })))
  ]);

  const editor = editors.find(e => e.exists)?.name;
  if (!editor) return false;

  const terminal = terminals.find(t => t.exists)?.name;
  if (!terminal) return false;

  // xfce4-terminal uses --command to avoid shell injection; others use -e
  const args =
    terminal === "konsole" ? ["-e", editor, filePath] :
    terminal === "xfce4-terminal" ? ["--command", `${editor} ${JSON.stringify(filePath)}`] :
    terminal === "alacritty" || terminal === "kitty" || terminal === "wezterm" ? ["-e", editor, filePath] :
    ["-e", editor, filePath];

  spawnDetached(terminal, args);
  return true;
}

async function openWithInlineTerminalEditor(filePath: string, renderer?: CliRenderer) {
  if (!renderer) return false;

  const editors = await Promise.all(
    TERMINAL_EDITOR_CANDIDATES.map(async e => ({ name: e, exists: await commandExists(e) }))
  );
  const editor = editors.find(e => e.exists)?.name;
  if (!editor) return false;

  renderer.suspend();
  try {
    await spawnInherited(editor, [filePath]);
  } finally {
    renderer.resume();
  }
  return true;
}

async function openWithSystemFileAssociation(filePath: string) {
  const opener =
    process.platform === "darwin" ? "open" :
    process.platform === "win32" ? "cmd" :
    "xdg-open";
  const openerArgs =
    process.platform === "win32" ? ["/c", "start", "", filePath] :
    [filePath];

  if (await commandExists(opener)) {
    try {
      await execFileAsync(opener, openerArgs);
      return true;
    } catch {
      // Some systems have xdg-open installed but no usable file association.
    }
  }

  return false;
}

async function openFile(filePath: string, options: OpenUrlOptions = {}) {
  if (await openWithConfiguredEditor(filePath)) return;
  if (await openWithGuiEditor(filePath)) return;
  if (await openWithInlineTerminalEditor(filePath, options.renderer)) return;
  if (await openWithTerminalEditor(filePath)) return;
  if (await openWithSystemFileAssociation(filePath)) return;

  throw new Error(`Failed to open file: ${filePath}`);
}

export async function openUrl(url: string, options: OpenUrlOptions = {}): Promise<OpenUrlResult> {
  if (!url) {
    return { ok: false, reason: "open-failed", message: "Empty link" };
  }

  if (/^(https?|mailto):/i.test(url)) {
    return openExternal(url);
  }

  const filePath = normalizeFilePath(url);
  if (!existsSync(filePath)) {
    const message = `File not found: ${filePath}`;
    console.error(message);
    return { ok: false, reason: "file-not-found", path: filePath, message };
  }

  try {
    await openFile(filePath, options);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : `Failed to open file: ${filePath}`;
    console.error(message);
    return { ok: false, reason: "open-failed", path: filePath, message };
  }
}
