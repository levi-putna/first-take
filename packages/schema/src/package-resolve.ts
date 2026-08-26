import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

/**
 * Published npm names for the Storyboard workspace packages.
 * The CLI is `@levi-putna/storyboard`; libraries are `@levi-putna/storyboard-<id>`.
 */
export const STORYBOARD_PACKAGES = {
  schema: "@levi-putna/storyboard-schema",
  core: "@levi-putna/storyboard-core",
  media: "@levi-putna/storyboard-media",
  transitions: "@levi-putna/storyboard-transitions",
  renderer: "@levi-putna/storyboard-renderer",
  preview: "@levi-putna/storyboard-preview",
  cli: "@levi-putna/storyboard",
} as const;

export type StoryboardPackageId = keyof typeof STORYBOARD_PACKAGES;

/**
 * Resolve the on-disk root of a Storyboard package.
 * Works in this Yarn workspace and after `npx @levi-putna/storyboard`.
 */
export function resolveStoryboardPackageRoot({
  pkg,
  from,
}: {
  pkg: StoryboardPackageId;
  /** `import.meta.url` of the calling module, so Node walks the right node_modules tree. */
  from: string;
}): string {
  const name = STORYBOARD_PACKAGES[pkg];
  const req = createRequire(from);
  try {
    return path.dirname(req.resolve(`${name}/package.json`));
  } catch {
    throw new Error(
      `Could not resolve ${name}. Install @levi-putna/storyboard (or this monorepo) first.`,
    );
  }
}

/**
 * Vite alias target: TypeScript source in the monorepo, otherwise the published dist file.
 */
export function resolveStoryboardAliasTarget({
  pkg,
  from,
  srcFile,
  distFile,
}: {
  pkg: StoryboardPackageId;
  from: string;
  srcFile: string;
  distFile: string;
}): string {
  const root = resolveStoryboardPackageRoot({ pkg, from });
  const fromSrc = path.join(root, srcFile);
  if (fs.existsSync(fromSrc)) return fromSrc;
  return path.join(root, distFile);
}

/**
 * Vite aliases for authoring imports (`@storyboard/*`) and published names.
 */
export function storyboardViteAliases({
  from,
}: {
  from: string;
}): Record<string, string> {
  const core = resolveStoryboardAliasTarget({
    pkg: "core",
    from,
    srcFile: "src/index.ts",
    distFile: "dist/index.js",
  });
  const media = resolveStoryboardAliasTarget({
    pkg: "media",
    from,
    srcFile: "src/index.ts",
    distFile: "dist/index.js",
  });
  const schema = resolveStoryboardAliasTarget({
    pkg: "schema",
    from,
    srcFile: "src/browser.ts",
    distFile: "dist/browser.js",
  });
  const transitions = resolveStoryboardAliasTarget({
    pkg: "transitions",
    from,
    srcFile: "src/index.ts",
    distFile: "dist/index.js",
  });
  const rendererClient = resolveStoryboardAliasTarget({
    pkg: "renderer",
    from,
    srcFile: "src/client.tsx",
    distFile: "dist/client.js",
  });

  return {
    "@storyboard/core": core,
    "@storyboard/media": media,
    "@storyboard/schema": schema,
    "@storyboard/transitions": transitions,
    "@storyboard/renderer/client": rendererClient,
    "@levi-putna/storyboard-core": core,
    "@levi-putna/storyboard-media": media,
    "@levi-putna/storyboard-schema": schema,
    "@levi-putna/storyboard-transitions": transitions,
    "@levi-putna/storyboard-renderer/client": rendererClient,
  };
}

/**
 * Resolve `react` or `react-dom` from the caller's module graph (monorepo or npx cache).
 */
export function resolveReactPackageRoot({
  name,
  from,
}: {
  name: "react" | "react-dom";
  from: string;
}): string {
  const req = createRequire(from);
  try {
    return path.dirname(req.resolve(`${name}/package.json`));
  } catch {
    throw new Error(
      `Could not resolve "${name}". Install it in this project, or use npx @levi-putna/storyboard which depends on React.`,
    );
  }
}
