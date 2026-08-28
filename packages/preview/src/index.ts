import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { createServer, type ViteDevServer } from "vite";
import type { VideoManifest } from "@levi-putna/storyboard-schema";
import {
  collectComponentPaths,
  resolveComponentPath,
  resolveReactPackageRoot,
  resolveStoryboardPackageRoot,
  storyboardViteAliases,
  validateVideoFile,
} from "@levi-putna/storyboard-schema";
import {
  discoverPreviewProjects,
  isAllowedPreviewProject,
  sameManifestPath,
} from "./discover-projects.js";
import { previewApiPlugin } from "./preview-api.js";

export type StartPreviewOptions = {
  manifestPath: string;
  manifest: VideoManifest;
  port?: number;
  /** Open the system browser (default true). Set false for embedded hosts. */
  open?: boolean;
  /** Directory used when scanning for neighbouring videos (default process.cwd()). */
  cwd?: string;
};

export type PreviewServerHandle = {
  url: string;
  close: () => Promise<void>;
};

/**
 * Start the First Take preview studio for a video.json project.
 *
 * Regenerates the Vite `project.ts` module when `video.json` or overlay
 * sources change so First Take / other hosts can live-reload after edits.
 */
export async function startPreview({
  manifestPath,
  manifest,
  port = 3333,
  open = true,
  cwd = process.cwd(),
}: StartPreviewOptions): Promise<PreviewServerHandle> {
  const here = import.meta.url;
  const previewPkgRoot = resolveStoryboardPackageRoot({
    pkg: "preview",
    from: here,
  });
  const appRoot = path.join(previewPkgRoot, "app");

  let resolvedManifestPath = path.resolve(manifestPath);
  let projectDir = path.dirname(resolvedManifestPath);
  const resolvedCwd = path.resolve(cwd);

  const reactDir = resolveReactPackageRoot({ name: "react", from: here });
  const reactDomDir = resolveReactPackageRoot({
    name: "react-dom",
    from: here,
  });
  const require = createRequire(import.meta.url);
  let lucideEntry = "lucide-react";
  try {
    lucideEntry = require.resolve("lucide-react");
  } catch {
    // Fall through to Vite default resolution.
  }
  const storyboardAliases = storyboardViteAliases({ from: here });
  const generatedDir = path.join(appRoot, ".generated");
  fs.mkdirSync(generatedDir, { recursive: true });

  let currentManifest = manifest;

  /**
   * Write Vite modules for the open video (manifest and component map).
   */
  const writeGeneratedModules = ({
    next,
    manifestFile,
    videoDir,
  }: {
    next: VideoManifest;
    manifestFile: string;
    videoDir: string;
  }) => {
    currentManifest = next;
    const nextAssetsRoot = path.resolve(videoDir, next.assetsRoot ?? ".");
    const componentPaths = collectComponentPaths(next);
    const importLines = componentPaths
      .map((rel, i) => {
        const abs = resolveComponentPath({
          manifestPath: manifestFile,
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
      `import type { VideoManifest } from "first-take/schema";
${importLines}

export const manifest = ${JSON.stringify(next, null, 2)} as VideoManifest;
export const components = {
${mapEntries}
};
export const manifestPath = ${JSON.stringify(manifestFile)};
`,
      "utf8",
    );

    return nextAssetsRoot;
  };

  let assetsRoot = writeGeneratedModules({
    next: manifest,
    manifestFile: resolvedManifestPath,
    videoDir: projectDir,
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
      assetsRoot = writeGeneratedModules({
        next: result.manifest,
        manifestFile: resolvedManifestPath,
        videoDir: projectDir,
      });
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

  /**
   * Watch the open video.json (and overlays/) so disk edits hot-reload.
   */
  const attachWatchers = () => {
    for (const watcher of watchers) watcher.close();
    watchers.length = 0;
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
  };

  attachWatchers();

  let viteServer: ViteDevServer | undefined;

  const server = await createServer({
    configFile: false,
    root: appRoot,
    publicDir: false,
    plugins: [
      previewApiPlugin({
        session: {
          getManifestPath: () => resolvedManifestPath,
          getAssetsRoot: () => assetsRoot,
          listProjects: () =>
            discoverPreviewProjects({
              manifestPath: resolvedManifestPath,
              cwd: resolvedCwd,
            }),
          openProject: ({ manifestPath: nextPath }) => {
            const resolved = path.resolve(nextPath);
            if (
              !isAllowedPreviewProject({
                candidatePath: resolved,
                currentManifestPath: resolvedManifestPath,
                cwd: resolvedCwd,
              })
            ) {
              return {
                ok: false,
                errors: ["That video is not in the current workspace"],
              };
            }
            if (
              sameManifestPath({
                left: resolved,
                right: resolvedManifestPath,
              })
            ) {
              return { ok: true };
            }
            const result = validateVideoFile({
              manifestPath: resolved,
              checkAssets: false,
            });
            if (!result.ok) return result;

            const previousPath = resolvedManifestPath;
            const previousDir = projectDir;
            const previousAssets = assetsRoot;
            const previousManifest = currentManifest;
            try {
              const nextDir = path.dirname(resolved);
              const nextAssets = writeGeneratedModules({
                next: result.manifest,
                manifestFile: resolved,
                videoDir: nextDir,
              });
              resolvedManifestPath = resolved;
              projectDir = nextDir;
              assetsRoot = nextAssets;
              attachWatchers();
              viteServer?.moduleGraph.invalidateAll();
              return { ok: true };
            } catch (err) {
              resolvedManifestPath = previousPath;
              projectDir = previousDir;
              assetsRoot = previousAssets;
              try {
                writeGeneratedModules({
                  next: previousManifest,
                  manifestFile: previousPath,
                  videoDir: previousDir,
                });
              } catch {
                // Keep the rolled-back paths even if rewrite fails.
              }
              attachWatchers();
              return {
                ok: false,
                errors: [
                  err instanceof Error ? err.message : String(err),
                ],
              };
            }
          },
        },
      }),
    ],
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
        ...storyboardAliases,
        "react/jsx-runtime": path.join(reactDir, "jsx-runtime.js"),
        "react/jsx-dev-runtime": path.join(reactDir, "jsx-dev-runtime.js"),
        react: reactDir,
        "react-dom": reactDomDir,
        "lucide-react": lucideEntry,
      },
    },
    optimizeDeps: {
      include: ["lucide-react"],
    },
  });

  viteServer = server;

  await server.listen();
  const info = server.resolvedUrls;
  const url = info?.local?.[0] ?? `http://127.0.0.1:${port}`;
  console.log(`First Take preview: ${url}`);

  return {
    url,
    close: async () => {
      if (reloadTimer) clearTimeout(reloadTimer);
      for (const watcher of watchers) watcher.close();
      await server.close();
    },
  };
}
