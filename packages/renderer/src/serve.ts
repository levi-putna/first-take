import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createRequire } from "node:module";
import sirv from "sirv";

const require = createRequire(import.meta.url);

/**
 * Serve a static directory on an ephemeral port.
 */
export async function serveDirectory({
  dir,
}: {
  dir: string;
}): Promise<{ url: string; close: () => Promise<void> }> {
  const handler = sirv(dir, { single: true, dev: true });
  const server = http.createServer((req, res) => {
    handler(req, res);
  });

  await new Promise<void>((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => resolve());
    server.on("error", reject);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind server");
  }

  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

/**
 * Ensure Playwright Chromium is available (best-effort message).
 */
export function assertChromiumHint(): void {
  try {
    require("playwright");
  } catch {
    throw new Error(
      "playwright is not installed. Run: yarn workspace @storyboard/renderer exec playwright install chromium",
    );
  }
}

/**
 * Ensure a directory exists and is empty-ish for frames.
 */
export function prepareFramesDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
  for (const file of fs.readdirSync(dir)) {
    if (file.startsWith("frame-")) {
      fs.unlinkSync(path.join(dir, file));
    }
  }
}
