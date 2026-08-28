#!/usr/bin/env node
/**
 * Copy the root README and LICENSE into packages/cli so npm shows the
 * project docs on first-take. Repo-relative links are rewritten
 * to GitHub URLs so they work on npmjs.com, and a banner points back to
 * the git repo for detailed docs and examples.
 *
 * Called by scripts/publish-packages.mjs before publish. Safe to run alone:
 *
 *   node scripts/stage-cli-docs.mjs
 *   node scripts/stage-cli-docs.mjs --check-pack
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const githubBlob = "https://github.com/levi-putna/first-take/blob/main";
const githubRaw = "https://raw.githubusercontent.com/levi-putna/first-take/main";
const githubRepo = "https://github.com/levi-putna/first-take";

/** Banner inserted under the H1 so the npm listing points at git for long docs. */
export const NPM_DOCS_BANNER =
  "> Install and quick start below. Detailed documents, the `video.json` schema, authoring guides, and playable examples live in the [GitHub repository](https://github.com/levi-putna/first-take) — see [`.doc/`](https://github.com/levi-putna/first-take/tree/main/.doc) and [`examples/`](https://github.com/levi-putna/first-take/tree/main/examples).\n";

/**
 * Turn a repo-relative href into a GitHub URL.
 */
function githubHref({ href, raw }) {
  const trimmed = href.trim();
  if (/^(https?:|mailto:|#)/i.test(trimmed) || trimmed.startsWith("//")) {
    return null;
  }
  const hashIndex = trimmed.indexOf("#");
  const filePart = hashIndex === -1 ? trimmed : trimmed.slice(0, hashIndex);
  const suffix = hashIndex === -1 ? "" : trimmed.slice(hashIndex);
  const normalised = filePart.replace(/^\.\//, "");
  const base = raw ? githubRaw : githubBlob;
  return `${base}/${normalised}${suffix}`;
}

/**
 * Rewrite repo-relative markdown links so they resolve on npmjs.com.
 * Nested badge links (`[![alt](cdn)](./LICENSE)`) need a second pass.
 * HTML `src` / `href` attributes (the centred logo) are rewritten too.
 */
export function rewriteReadmeForNpm({ markdown }) {
  const once = markdown.replace(
    /(!?)\[([^\]]*)\]\(([^)]+)\)/g,
    (match, bang, text, href) => {
      const next = githubHref({ href, raw: bang === "!" });
      if (!next) return match;
      return bang === "!" ? `![${text}](${next})` : `[${text}](${next})`;
    },
  );
  const twice = once.replace(/\]\(([^)]+)\)/g, (match, href) => {
    const next = githubHref({ href, raw: false });
    return next ? `](${next})` : match;
  });
  return twice.replace(
    /\b(src|href)="(\.\/[^"]+|\.\.\/[^"]+)"/g,
    (match, attr, href) => {
      const next = githubHref({ href, raw: attr === "src" });
      return next ? `${attr}="${next}"` : match;
    },
  );
}

/**
 * Insert the GitHub docs banner under the first heading, unless it is already there.
 */
export function insertDocsBanner({ markdown }) {
  if (markdown.includes(NPM_DOCS_BANNER.trim())) {
    return markdown;
  }
  const match = markdown.match(/^(# [^\n]+\n+)/);
  if (!match) {
    return `${NPM_DOCS_BANNER}\n${markdown}`;
  }
  return `${match[1]}${NPM_DOCS_BANNER}\n${markdown.slice(match[1].length)}`;
}

/**
 * Parse JSON that npm --json printed, ignoring log lines around it.
 */
export function parseNpmJson({ stdout, stderr }) {
  for (const text of [stdout, stderr]) {
    const trimmed = (text ?? "").trim();
    if (!trimmed) continue;
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through and slice out an object or array
    }
    const objectStart = trimmed.indexOf("{");
    const objectEnd = trimmed.lastIndexOf("}");
    if (objectStart !== -1 && objectEnd > objectStart) {
      try {
        return JSON.parse(trimmed.slice(objectStart, objectEnd + 1));
      } catch {
        // try an array next
      }
    }
    const arrayStart = trimmed.indexOf("[");
    const arrayEnd = trimmed.lastIndexOf("]");
    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      try {
        return JSON.parse(trimmed.slice(arrayStart, arrayEnd + 1));
      } catch {
        // not JSON
      }
    }
  }
  return null;
}

/**
 * File paths listed by `npm pack --dry-run --json`.
 */
function packFilePaths({ parsed }) {
  const record = Array.isArray(parsed) ? parsed[0] : parsed;
  const files = record?.files ?? [];
  return files.map((file) => {
    const value = typeof file === "string" ? file : file.path;
    return String(value).replace(/^\.\//, "");
  });
}

/**
 * Confirm the staged CLI package tarball includes README and LICENSE, and
 * that the README points at GitHub rather than repo-relative paths.
 */
export function assertCliPackIncludesDocs() {
  const cliDir = path.join(root, "packages", "cli");
  const readmePath = path.join(cliDir, "README.md");
  if (!fs.existsSync(readmePath)) {
    throw new Error(
      "packages/cli/README.md is missing. Run staging before --check-pack.",
    );
  }
  const readme = fs.readFileSync(readmePath, "utf8");
  if (!readme.includes(githubRepo)) {
    throw new Error(
      "Staged CLI README does not point at the GitHub repository.",
    );
  }
  if (/\]\(\s*\.\.?\//.test(readme)) {
    throw new Error(
      "Staged CLI README still has repo-relative links; they will break on npmjs.com.",
    );
  }

  const result = spawnSync(
    "npm",
    ["pack", "--dry-run", "--json", "--ignore-scripts", "--workspaces=false"],
    { cwd: cliDir, encoding: "utf8" },
  );
  const parsed = parseNpmJson({
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  });
  if (result.status !== 0 && !parsed) {
    throw new Error(
      `npm pack --dry-run failed in packages/cli:\n${result.stderr || result.stdout}`,
    );
  }
  const paths = packFilePaths({ parsed });
  const hasReadme = paths.some(
    (filePath) => filePath === "README.md" || filePath.endsWith("/README.md"),
  );
  const hasLicense = paths.some((filePath) => /LICENSE/i.test(filePath));
  if (!hasReadme || !hasLicense) {
    throw new Error(
      `CLI tarball is missing ${!hasReadme ? "README.md" : "LICENSE"}. Packed: ${paths.join(", ") || "(none)"}`,
    );
  }
  return paths;
}

/**
 * Write packages/cli/README.md and LICENSE from the repo root.
 */
export function stageCliDocs() {
  const cliDir = path.join(root, "packages", "cli");
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  const rewritten = rewriteReadmeForNpm({ markdown: readme });
  fs.writeFileSync(
    path.join(cliDir, "README.md"),
    insertDocsBanner({ markdown: rewritten }),
  );
  fs.copyFileSync(path.join(root, "LICENSE"), path.join(cliDir, "LICENSE"));
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  const checkPack = process.argv.includes("--check-pack");
  stageCliDocs();
  console.log("Staged README.md and LICENSE into packages/cli.");
  if (checkPack) {
    const paths = assertCliPackIncludesDocs();
    console.log(
      `CLI tarball includes README.md and LICENSE (${paths.length} files).`,
    );
  }
}
