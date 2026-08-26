import { describe, expect, it, afterEach } from "vitest";
import { staticFile } from "./staticFile.js";

describe("staticFile", () => {
  const original = (globalThis as { window?: Window }).window;

  afterEach(() => {
    if (original === undefined) {
      // jsdom always has window; restore asset base
      delete (window as unknown as { __STORYBOARD_ASSET_BASE__?: string })
        .__STORYBOARD_ASSET_BASE__;
    }
  });

  it("strips a leading slash and prefixes the asset base", () => {
    (
      window as unknown as { __STORYBOARD_ASSET_BASE__?: string }
    ).__STORYBOARD_ASSET_BASE__ = "/assets/";
    expect(staticFile("/audio/a.mp3")).toBe("/assets/audio/a.mp3");
  });

  it("adds a trailing slash to the base when missing", () => {
    (
      window as unknown as { __STORYBOARD_ASSET_BASE__?: string }
    ).__STORYBOARD_ASSET_BASE__ = "/public";
    expect(staticFile("img.png")).toBe("/public/img.png");
  });

  it("defaults to root base", () => {
    delete (window as unknown as { __STORYBOARD_ASSET_BASE__?: string })
      .__STORYBOARD_ASSET_BASE__;
    expect(staticFile("x.png")).toBe("/x.png");
  });
});
