import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";

/**
 * Workspace npm names (private except `cli` / `first-take`).
 * After assemble, the published tarball is only `first-take`.
 */
export const STORYBOARD_PACKAGES = {
  schema: "@levi-putna/storyboard-schema",
  core: "@levi-putna/storyboard-core",
  media: "@levi-putna/storyboard-media",
  transitions: "@levi-putna/storyboard-transitions",
  renderer: "@levi-putna/storyboard-renderer",
  preview: "@levi-putna/storyboard-preview",
  cli: "first-take",
} as const;

export type StoryboardPackageId = keyof typeof STORYBOARD_PACKAGES;

/**
 * Dist folder under a published `first-take` install (preview app lives at the package root).
 */
const PUBLISHED_DIST: Record<StoryboardPackageId, string | null> = {
  schema: "schema",
  core: "core",
  media: "media",
  transitions: "transitions",
  renderer: "renderer",
  preview: null,
  cli: null,
};

/**
 * Resolve the on-disk root of a First Take package.
 * In this monorepo that is `packages/<id>`. After `npx first-take`, everything
 * lives inside the `first-take` package (`dist/<id>` or the package root for preview/cli).
 */
export function resolveStoryboardPackageRoot({
  pkg,
  from,
}: {
  pkg: StoryboardPackageId;
  /** `import.meta.url` of the calling module, so Node walks the right node_modules tree. */
  from: string;
}): string {
  const req = createRequire(from);
  const workspaceName = STORYBOARD_PACKAGES[pkg];
  try {
    return path.dirname(req.resolve(`${workspaceName}/package.json`));
  } catch {
    // Published single package: no `@levi-putna/storyboard-*` installs.
  }

  let cliRoot: string;
  try {
    cliRoot = path.dirname(req.resolve("first-take/package.json"));
  } catch {
    throw new Error(
      `Could not resolve ${workspaceName} or first-take. Install first-take (or this monorepo) first.`,
    );
  }

  const distName = PUBLISHED_DIST[pkg];
  if (distName === null) return cliRoot;
  return path.join(cliRoot, "dist", distName);
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
 * Vite aliases for authoring imports (`first-take`, `@storyboard/*`, and the
 * private workspace names still used by preview/app and engine packages).
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
    distFile: "index.js",
  });
  const media = resolveStoryboardAliasTarget({
    pkg: "media",
    from,
    srcFile: "src/index.ts",
    distFile: "index.js",
  });
  const schema = resolveStoryboardAliasTarget({
    pkg: "schema",
    from,
    srcFile: "src/browser.ts",
    distFile: "browser.js",
  });
  const transitions = resolveStoryboardAliasTarget({
    pkg: "transitions",
    from,
    srcFile: "src/index.ts",
    distFile: "index.js",
  });
  const rendererClient = resolveStoryboardAliasTarget({
    pkg: "renderer",
    from,
    srcFile: "src/client.tsx",
    distFile: "client.js",
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
    "first-take/media": media,
    "first-take/schema/browser": schema,
    "first-take/schema": schema,
    "first-take/transitions": transitions,
    "first-take/renderer/client": rendererClient,
    "first-take": core,
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
      `Could not resolve "${name}". Install it in this project, or use npx first-take which depends on React.`,
    );
  }
}
