#!/usr/bin/env node
/**
 * Copy private workspace dists into packages/cli so npm publishes one
 * `first-take` tarball. Rewrites `@levi-putna/storyboard-*` specifiers in the
 * copied JS/DTS to `first-take` subpaths.
 *
 *   node scripts/assemble-first-take.mjs
 *
 * Requires `pnpm -r --filter "./packages/**" run build` first (CLI last is
 * fine; this copies sibling dists after CLI has written dist/cli.js).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cliDir = path.join(root, "packages", "cli");
const cliDist = path.join(cliDir, "dist");

/** Longest-first so `/client` and `/browser` win over the package root. */
const SPECIFIER_REWRITES = [
  ["@levi-putna/storyboard-renderer/client", "first-take/renderer/client"],
  ["@levi-putna/storyboard-schema/browser", "first-take/schema/browser"],
  ["@levi-putna/storyboard-transitions", "first-take/transitions"],
  ["@levi-putna/storyboard-renderer", "first-take/renderer"],
  ["@levi-putna/storyboard-preview", "first-take/preview"],
  ["@levi-putna/storyboard-schema", "first-take/schema"],
  ["@levi-putna/storyboard-media", "first-take/media"],
  ["@levi-putna/storyboard-core", "first-take"],
];

/**
 * Rewrite workspace package names to first-take subpaths in import/export/require
 * positions only. Object keys and string values (Vite aliases, STORYBOARD_PACKAGES)
 * stay on the private workspace names so the preview app and package-resolve
 * fallback still work after assemble.
 */
export function rewriteWorkspaceSpecifiers({ source }) {
  return source.replace(
    /(\b(?:from|import|export|require)\b[^"'`]*?)(["'])(@levi-putna\/storyboard[^"'`]*)\2/g,
    (match, prefix, quote, spec) => {
      for (const [from, to] of SPECIFIER_REWRITES) {
        if (spec === from) return `${prefix}${quote}${to}${quote}`;
      }
      return match;
    },
  );
}

/**
 * Recursively copy a directory, optionally skipping path segments.
 */
function copyDir({ from, to, skipSegment }) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skipSegment && entry.name === skipSegment) continue;
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) {
      copyDir({ from: src, to: dest, skipSegment });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

/**
 * Rewrite specifiers in every .js / .d.ts / .mts / .cts file under dir.
 */
function rewriteTree({ dir }) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      rewriteTree({ dir: full });
      continue;
    }
    if (!/\.(js|d\.ts|mjs|cjs|mts|cts)$/.test(entry.name)) continue;
    const before = fs.readFileSync(full, "utf8");
    const after = rewriteWorkspaceSpecifiers({ source: before });
    if (after !== before) fs.writeFileSync(full, after);
  }
}

/**
 * Copy sibling package dists (and the preview studio) into packages/cli.
 */
export function assembleFirstTake() {
  const copies = [
    ["core", path.join(root, "packages/core/dist"), path.join(cliDist, "core")],
    ["media", path.join(root, "packages/media/dist"), path.join(cliDist, "media")],
    [
      "schema",
      path.join(root, "packages/schema/dist"),
      path.join(cliDist, "schema"),
    ],
    [
      "transitions",
      path.join(root, "packages/transitions/dist"),
      path.join(cliDist, "transitions"),
    ],
    [
      "renderer",
      path.join(root, "packages/renderer/dist"),
      path.join(cliDist, "renderer"),
    ],
    [
      "preview",
      path.join(root, "packages/preview/dist"),
      path.join(cliDist, "preview"),
    ],
  ];

  if (!fs.existsSync(path.join(cliDist, "cli.js"))) {
    throw new Error(
      "packages/cli/dist/cli.js is missing. Run the package builds before assemble.",
    );
  }

  for (const [id, from, to] of copies) {
    if (!fs.existsSync(from)) {
      throw new Error(
        `packages/${id}/dist is missing. Run pnpm build before assemble.`,
      );
    }
    fs.rmSync(to, { recursive: true, force: true });
    copyDir({ from, to });
  }

  const appFrom = path.join(root, "packages/preview/app");
  const appTo = path.join(cliDir, "app");
  if (!fs.existsSync(path.join(appFrom, "index.html"))) {
    throw new Error("packages/preview/app/index.html is missing.");
  }
  fs.rmSync(appTo, { recursive: true, force: true });
  copyDir({ from: appFrom, to: appTo, skipSegment: ".generated" });

  rewriteTree({ dir: cliDist });

  const required = [
    path.join(cliDist, "cli.js"),
    path.join(cliDist, "core/index.js"),
    path.join(cliDist, "media/index.js"),
    path.join(cliDist, "schema/index.js"),
    path.join(cliDist, "schema/browser.js"),
    path.join(cliDist, "transitions/index.js"),
    path.join(cliDist, "renderer/index.js"),
    path.join(cliDist, "renderer/client.js"),
    path.join(cliDist, "preview/index.js"),
    path.join(cliDir, "app/index.html"),
  ];
  for (const filePath of required) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Assemble did not produce ${path.relative(root, filePath)}`);
    }
  }
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  assembleFirstTake();
  console.log("Assembled first-take dist (core, media, schema, transitions, renderer, preview) and app/.");
}
