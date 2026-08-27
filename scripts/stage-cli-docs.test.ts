import { describe, expect, it } from "vitest";
import {
  insertDocsBanner,
  NPM_DOCS_BANNER,
  parseNpmJson,
  rewriteReadmeForNpm,
} from "./stage-cli-docs.mjs";

describe("rewriteReadmeForNpm", () => {
  it("rewrites repo-relative links to GitHub blob URLs", () => {
    const out = rewriteReadmeForNpm({
      markdown: "See [schema](.doc/06-video-json-schema.md) and [playbook](./AGENT-README.md).",
    });
    expect(out).toContain(
      "https://github.com/levi-putna/storyboard/blob/main/.doc/06-video-json-schema.md",
    );
    expect(out).toContain(
      "https://github.com/levi-putna/storyboard/blob/main/AGENT-README.md",
    );
    expect(out).not.toMatch(/\]\(\.\/AGENT-README/);
  });

  it("rewrites images to GitHub raw URLs", () => {
    const out = rewriteReadmeForNpm({
      markdown: "![studio](./img/preview-studio.png)",
    });
    expect(out).toBe(
      "![studio](https://raw.githubusercontent.com/levi-putna/storyboard/main/img/preview-studio.png)",
    );
  });

  it("leaves already-absolute and fragment links alone", () => {
    const markdown =
      "[npm](https://www.npmjs.com/package/@levi-putna/storyboard) and [preview](#preview)";
    expect(rewriteReadmeForNpm({ markdown })).toBe(markdown);
  });
});

describe("insertDocsBanner", () => {
  it("inserts the GitHub docs banner under the H1", () => {
    const out = insertDocsBanner({
      markdown: "# Storyboard\n\nFrame-deterministic engine.\n",
    });
    expect(out.startsWith("# Storyboard\n")).toBe(true);
    expect(out).toContain(NPM_DOCS_BANNER.trim());
    expect(out).toContain("https://github.com/levi-putna/storyboard");
  });

  it("does not duplicate the banner", () => {
    const once = insertDocsBanner({ markdown: "# Storyboard\n\nBody.\n" });
    const twice = insertDocsBanner({ markdown: once });
    expect(twice).toBe(once);
  });
});

describe("parseNpmJson", () => {
  it("parses JSON after npm log lines", () => {
    const parsed = parseNpmJson({
      stdout: 'npm notice\n{"error":{"code":"EOTP","authUrl":"https://www.npmjs.com/auth/cli/abc","doneUrl":"https://www.npmjs.com/auth/cli/abc/done"}}\n',
      stderr: "",
    });
    expect(parsed.error.code).toBe("EOTP");
    expect(parsed.error.authUrl).toContain("npmjs.com");
  });
});
