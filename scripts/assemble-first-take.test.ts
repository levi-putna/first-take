import { describe, expect, it } from "vitest";
import { rewriteWorkspaceSpecifiers } from "./assemble-first-take.mjs";

describe("rewriteWorkspaceSpecifiers", () => {
  it("rewrites library names to first-take subpaths, longest first", () => {
    const source = [
      'from "@levi-putna/storyboard-core"',
      'from "@levi-putna/storyboard-media"',
      'from "@levi-putna/storyboard-schema"',
      'from "@levi-putna/storyboard-schema/browser"',
      'from "@levi-putna/storyboard-renderer"',
      'from "@levi-putna/storyboard-renderer/client"',
      'from "@levi-putna/storyboard-preview"',
      'from "@levi-putna/storyboard-transitions"',
    ].join("\n");
    const out = rewriteWorkspaceSpecifiers({ source });
    expect(out).toContain('from "first-take"');
    expect(out).toContain('from "first-take/media"');
    expect(out).toContain('from "first-take/schema"');
    expect(out).toContain('from "first-take/schema/browser"');
    expect(out).toContain('from "first-take/renderer"');
    expect(out).toContain('from "first-take/renderer/client"');
    expect(out).toContain('from "first-take/preview"');
    expect(out).toContain('from "first-take/transitions"');
    expect(out).not.toContain("@levi-putna/storyboard");
  });

  it("leaves package-name string literals in objects alone", () => {
    const source = [
      'const names = { schema: "@levi-putna/storyboard-schema" };',
      '"@levi-putna/storyboard-core": core,',
    ].join("\n");
    expect(rewriteWorkspaceSpecifiers({ source })).toBe(source);
  });
});
