import { exec } from "child_process";

export function openUrl(url: string) {
  if (!url) return;

  // Check if it's an HTTP/HTTPS link
  if (url.startsWith("http://") || url.startsWith("https://")) {
    let command = "";
    if (process.platform === "darwin") {
      command = `open "${url}"`;
    } else if (process.platform === "win32") {
      command = `start "" "${url}"`;
    } else {
      command = `xdg-open "${url}"`;
    }
    
    exec(command, (err) => {
      if (err) {
        console.error(`Failed to open URL: ${url}`, err);
      }
    });
  } else {
    // Treat as a file link and open in text editor
    // Remove file:// prefix if present
    const filePath = url.replace(/^file:\/\//, "");
    try {
      Bun.openInEditor(filePath);
    } catch (err) {
      console.error(`Failed to open file: ${filePath}`, err);
    }
  }
}
