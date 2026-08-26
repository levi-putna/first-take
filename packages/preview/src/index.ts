import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";
import type { VideoManifest } from "@storyboard/schema";
import {
  collectComponentPaths,
  resolveComponentPath,
  validateVideoFile,
} from "@storyboard/schema";

export type StartPreviewOptions = {
  manifestPath: string;
  manifest: VideoManifest;
  port?: number;
  /** Open the system browser (default true). Set false for embedded hosts. */
  open?: boolean;
};

export type PreviewServerHandle = {
  url: string;
  close: () => Promise<void>;
};

/**
 * Start the Storyboard preview studio for a video.json project.
 *
 * Regenerates the Vite `project.ts` module when `video.json` or overlay
 * sources change so First Take / other hosts can live-reload after edits.
 */
export async function startPreview({
  manifestPath,
  manifest,
  port = 3333,
  open = true,
}: StartPreviewOptions): Promise<PreviewServerHandle> {
  const thisDir = path.dirname(fileURLToPath(import.meta.url));
  const previewPkgRoot = path.resolve(thisDir, "..");
  const appRoot = path.join(previewPkgRoot, "app");
  const packagesRoot = path.resolve(previewPkgRoot, "..");
  const repoRoot = path.resolve(packagesRoot, "..");

  const resolvedManifestPath = path.resolve(manifestPath);
  const projectDir = path.dirname(resolvedManifestPath);

  // Monorepo: storyboard/node_modules. Consumer file: installs: <project>/node_modules.
  const depSearchRoots = [
    repoRoot,
    path.dirname(packagesRoot),
    projectDir,
    process.cwd(),
  ];
  const reactDir = resolveDepPackage({ name: "react", searchRoots: depSearchRoots });
  const reactDomDir = resolveDepPackage({
    name: "react-dom",
    searchRoots: depSearchRoots,
  });
  const generatedDir = path.join(appRoot, ".generated");
  fs.mkdirSync(generatedDir, { recursive: true });

  let currentManifest = manifest;

  const writeGeneratedModules = (next: VideoManifest) => {
    currentManifest = next;
    const assetsRoot = path.resolve(projectDir, next.assetsRoot ?? ".");
    const componentPaths = collectComponentPaths(next);
    const importLines = componentPaths
      .map((rel, i) => {
        const abs = resolveComponentPath({
          manifestPath: resolvedManifestPath,
          componentPath: rel,
        });
        if (!fs.existsSync(abs)) {
          throw new Error(`Component not found: ${rel}`);
        }
        return `import Comp${i} from ${JSON.stringify(abs)};`;
      })
      .join("\n");
    const mapEntries = componentPaths
      .map((rel, i) => `  ${JSON.stringify(rel)}: Comp${i}`)
      .join(",\n");

    fs.writeFileSync(
      path.join(generatedDir, "project.ts"),
      `import type { VideoManifest } from "@storyboard/schema";
${importLines}

export const manifest = ${JSON.stringify(next, null, 2)} as VideoManifest;
export const components = {
${mapEntries}
};
export const manifestPath = ${JSON.stringify(resolvedManifestPath)};
export const playgroundModules = import.meta.glob(${JSON.stringify(
        path.join(projectDir, "src/**/*.{tsx,ts}").replace(/\\/g, "/"),
      )}, { eager: true });
`,
      "utf8",
    );

    const playgroundPath = path.join(projectDir, "playground.ts");
    const hasPlayground = fs.existsSync(playgroundPath);
    fs.writeFileSync(
      path.join(generatedDir, "playground-entry.ts"),
      hasPlayground
        ? `export { playground } from ${JSON.stringify(playgroundPath)};\n`
        : `export const playground: Array<{ id: string; component: React.ComponentType<any>; defaultProps: Record<string, unknown>; durationInFrames: number }> = [];\n`,
      "utf8",
    );

    return assetsRoot;
  };

  let assetsRoot = writeGeneratedModules(manifest);

  const server = await createServer({
    configFile: false,
    root: appRoot,
    publicDir: assetsRoot,
    // file: installs copy package tsconfigs that extend the monorepo base — force
    // automatic JSX so consumer previews do not fall back to classic React.createElement.
    esbuild: {
      jsx: "automatic",
    },
    server: {
      port,
      host: "127.0.0.1",
      open,
      strictPort: false,
    },
    define: {
      "window.__STORYBOARD_ASSET_BASE__": JSON.stringify("/"),
    },
    resolve: {
      alias: {
        "@storyboard/core": path.join(packagesRoot, "core/src/index.ts"),
        "@storyboard/media": path.join(packagesRoot, "media/src/index.ts"),
        "@storyboard/schema": path.join(packagesRoot, "schema/src/browser.ts"),
        "@storyboard/transitions": path.join(
          packagesRoot,
          "transitions/src/index.ts",
        ),
        "react/jsx-runtime": path.join(reactDir, "jsx-runtime.js"),
        "react/jsx-dev-runtime": path.join(reactDir, "jsx-dev-runtime.js"),
        react: reactDir,
        "react-dom": reactDomDir,
      },
    },
  });

  const reloadFromDisk = () => {
    try {
      const result = validateVideoFile({
        manifestPath: resolvedManifestPath,
        checkAssets: false,
      });
      if (!result.ok) {
        console.warn(
          "[storyboard preview] video.json invalid after change; keeping last good manifest",
        );
        return;
      }
      const nextAssets = writeGeneratedModules(result.manifest);
      if (nextAssets !== assetsRoot) {
        console.warn(
          "[storyboard preview] assetsRoot changed — restart preview to apply",
        );
      }
      // Touch so Vite invalidates the module graph for HMR clients.
      const projectModule = path.join(generatedDir, "project.ts");
      const now = new Date();
      fs.utimesSync(projectModule, now, now);
    } catch (err) {
      console.warn(
        "[storyboard preview] failed to reload manifest:",
        err instanceof Error ? err.message : err,
      );
    }
  };

  let reloadTimer: NodeJS.Timeout | null = null;
  const scheduleReload = () => {
    if (reloadTimer) clearTimeout(reloadTimer);
    reloadTimer = setTimeout(reloadFromDisk, 200);
  };

  const watchers: fs.FSWatcher[] = [];
  try {
    watchers.push(fs.watch(resolvedManifestPath, scheduleReload));
  } catch {
    // ignore missing watch support
  }
  const overlaysDir = path.join(projectDir, "overlays");
  if (fs.existsSync(overlaysDir)) {
    try {
      watchers.push(fs.watch(overlaysDir, { recursive: true }, scheduleReload));
    } catch {
      try {
        watchers.push(fs.watch(overlaysDir, scheduleReload));
      } catch {
        // ignore
      }
    }
  }

  await server.listen();
  const info = server.resolvedUrls;
  const url = info?.local?.[0] ?? `http://127.0.0.1:${port}`;
  console.log(`Storyboard preview: ${url}`);

  // Keep a reference so unused-var lint stays quiet when callers only need URL.
  void currentManifest;

  return {
    url,
    close: async () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      for (const watcher of watchers) watcher.close();
      await server.close();
    },
  };
}

/**
 * Resolve a dependency package directory for Vite aliases.
 * Supports the Storyboard monorepo and consumer projects that install via `file:`.
 */
function resolveDepPackage({
  name,
  searchRoots,
}: {
  name: string;
  searchRoots: string[];
}): string {
  const candidates = searchRoots.flatMap((root) => [
    path.join(root, "node_modules", name),
    path.join(root, name),
  ]);
  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, "package.json"))) {
      return candidate;
    }
  }
  throw new Error(
    `Could not resolve package "${name}". Searched:\n${candidates.join("\n")}`,
  );
}
