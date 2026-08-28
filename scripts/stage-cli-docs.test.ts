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
      "https://github.com/levi-putna/first-take/blob/main/.doc/06-video-json-schema.md",
    );
    expect(out).toContain(
      "https://github.com/levi-putna/first-take/blob/main/AGENT-README.md",
    );
    expect(out).not.toMatch(/\]\(\.\/AGENT-README/);
  });

  it("rewrites images to GitHub raw URLs", () => {
    const out = rewriteReadmeForNpm({
      markdown: "![studio](./img/preview-studio.png)",
    });
    expect(out).toBe(
      "![studio](https://raw.githubusercontent.com/levi-putna/first-take/main/img/preview-studio.png)",
    );
  });

  it("rewrites HTML src and href attributes to GitHub URLs", () => {
    const out = rewriteReadmeForNpm({
      markdown:
        '<img src="./img/logo-icon.svg" alt="First Take">\n<a href="./LICENSE">licence</a>',
    });
    expect(out).toContain(
      'src="https://raw.githubusercontent.com/levi-putna/first-take/main/img/logo-icon.svg"',
    );
    expect(out).toContain(
      'href="https://github.com/levi-putna/first-take/blob/main/LICENSE"',
    );
  });

  it("leaves already-absolute and fragment links alone", () => {
    const markdown =
      "[npm](https://www.npmjs.com/package/first-take) and [preview](#preview)";
    expect(rewriteReadmeForNpm({ markdown })).toBe(markdown);
  });
});

describe("insertDocsBanner", () => {
  it("inserts the GitHub docs banner under the H1", () => {
    const out = insertDocsBanner({
      markdown: "# First Take\n\nFrame-deterministic engine.\n",
    });
    expect(out.startsWith("# First Take\n")).toBe(true);
    expect(out).toContain(NPM_DOCS_BANNER.trim());
    expect(out).toContain("https://github.com/levi-putna/first-take");
  });

  it("does not duplicate the banner", () => {
    const once = insertDocsBanner({ markdown: "# First Take\n\nBody.\n" });
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
