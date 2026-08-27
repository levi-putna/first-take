#!/usr/bin/env node
/**
 * Copy the root README and LICENSE into packages/cli so npm shows the
 * project docs on @levi-putna/storyboard. Repo-relative links are rewritten
 * to GitHub URLs so they work on npmjs.com.
 *
 * Called by scripts/publish-packages.mjs before publish. Safe to run alone:
 *
 *   node scripts/stage-cli-docs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const githubBlob = "https://github.com/levi-putna/storyboard/blob/main";
const githubRaw = "https://raw.githubusercontent.com/levi-putna/storyboard/main";

/**
 * Rewrite repo-relative markdown links so they resolve on npmjs.com.
 */
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
  return once.replace(/\]\(([^)]+)\)/g, (match, href) => {
    const next = githubHref({ href, raw: false });
    return next ? `](${next})` : match;
  });
}

/**
 * Write packages/cli/README.md and LICENSE from the repo root.
 */
export function stageCliDocs() {
  const cliDir = path.join(root, "packages", "cli");
  const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
  fs.writeFileSync(
    path.join(cliDir, "README.md"),
    rewriteReadmeForNpm({ markdown: readme }),
  );
  fs.copyFileSync(path.join(root, "LICENSE"), path.join(cliDir, "LICENSE"));
}

const isMain = process.argv[1] === fileURLToPath(import.meta.url);
if (isMain) {
  stageCliDocs();
  console.log("Staged README.md and LICENSE into packages/cli.");
}
