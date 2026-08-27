import fs from "node:fs";
import path from "node:path";
import type { IncomingMessage, ServerResponse } from "node:http";

const MIME_BY_EXT: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".m4a": "audio/mp4",
  ".aac": "audio/aac",
  ".ogg": "audio/ogg",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
};

const SKIP_SOURCE_EXT = new Set([
  ".ts",
  ".tsx",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
]);

/**
 * Resolve a request URL to a file under assetsRoot, or null when it is unsafe / missing.
 */
export function resolvePublicAssetPath({
  assetsRoot,
  requestUrl,
}: {
  assetsRoot: string;
  requestUrl: string;
}): string | null {
  const root = path.resolve(assetsRoot);
  let pathname = requestUrl.split("?")[0] ?? "";
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (!pathname.startsWith("/") || pathname.includes("\0")) return null;
  if (
    pathname.startsWith("/@") ||
    pathname.startsWith("/node_modules") ||
    pathname.startsWith("/__")
  ) {
    return null;
  }

  const ext = path.extname(pathname).toLowerCase();
  if (SKIP_SOURCE_EXT.has(ext)) return null;

  const relative = pathname.replace(/^\/+/, "");
  if (!relative) return null;
  const absolute = path.resolve(root, relative);
  const rel = path.relative(root, absolute);
  if (rel.startsWith("..") || path.isAbsolute(rel)) return null;
  if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) return null;
  return absolute;
}

/**
 * MIME type for a static preview asset.
 */
export function mimeTypeForAsset({ filePath }: { filePath: string }): string {
  return MIME_BY_EXT[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

/**
 * Parse a `Range: bytes=` header into inclusive start/end indexes.
 */
function parseByteRange({
  header,
  size,
}: {
  header: string;
  size: number;
}): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;
  const startToken = match[1];
  const endToken = match[2];
  if (startToken === "" && endToken === "") return null;
  if (startToken === "") {
    const suffix = Number(endToken);
    if (!Number.isInteger(suffix) || suffix <= 0) return null;
    const start = Math.max(0, size - suffix);
    return { start, end: size - 1 };
  }
  const start = Number(startToken);
  const end = endToken === "" ? size - 1 : Number(endToken);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
  if (start < 0 || end < start || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

/**
 * Serve a file from the current video assets root (including Range for media).
 * @returns true when the response was handled
 */
export function tryServeAsset({
  assetsRoot,
  req,
  res,
}: {
  assetsRoot: string;
  req: IncomingMessage;
  res: ServerResponse;
}): boolean {
  const method = req.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") return false;
  const filePath = resolvePublicAssetPath({
    assetsRoot,
    requestUrl: req.url ?? "",
  });
  if (!filePath) return false;

  const stat = fs.statSync(filePath);
  const mime = mimeTypeForAsset({ filePath });
  const rangeHeader = req.headers.range;
  if (typeof rangeHeader === "string" && rangeHeader) {
    const range = parseByteRange({ header: rangeHeader, size: stat.size });
    if (!range) {
      res.statusCode = 416;
      res.setHeader("Content-Range", `bytes */${stat.size}`);
      res.end();
      return true;
    }
    const length = range.end - range.start + 1;
    res.statusCode = 206;
    res.setHeader("Content-Type", mime);
    res.setHeader("Accept-Ranges", "bytes");
    res.setHeader("Content-Range", `bytes ${range.start}-${range.end}/${stat.size}`);
    res.setHeader("Content-Length", String(length));
    if (method === "HEAD") {
      res.end();
      return true;
    }
    fs.createReadStream(filePath, { start: range.start, end: range.end }).pipe(res);
    return true;
  }

  res.statusCode = 200;
  res.setHeader("Content-Type", mime);
  res.setHeader("Accept-Ranges", "bytes");
  res.setHeader("Content-Length", String(stat.size));
  if (method === "HEAD") {
    res.end();
    return true;
  }
  fs.createReadStream(filePath).pipe(res);
  return true;
}
