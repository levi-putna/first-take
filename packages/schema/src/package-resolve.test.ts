import { describe, expect, it } from "vitest";
import {
  STORYBOARD_PACKAGES,
  resolveStoryboardPackageRoot,
} from "./package-resolve.js";

describe("package-resolve", () => {
  it("resolves workspace package roots from this module", () => {
    const from = import.meta.url;
    expect(
      resolveStoryboardPackageRoot({ pkg: "schema", from }).endsWith(
        "packages/schema",
      ),
    ).toBe(true);
    expect(
      resolveStoryboardPackageRoot({ pkg: "cli", from }).endsWith(
        "packages/cli",
      ),
    ).toBe(true);
  });

  it("names the CLI @levi-putna/storyboard", () => {
    expect(STORYBOARD_PACKAGES.cli).toBe("@levi-putna/storyboard");
    expect(STORYBOARD_PACKAGES.core).toBe("@levi-putna/storyboard-core");
  });
});
