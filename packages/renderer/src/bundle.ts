import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build as viteBuild } from "vite";
import type { VideoManifest } from "@levi-putna/storyboard-schema";
import {
  collectComponentPaths,
  resolveComponentPath,
  resolveReactPackageRoot,
  storyboardViteAliases,
} from "@levi-putna/storyboard-schema";

/**
 * Bundle the composition with Vite into an output directory.
 * Builds a JS entry (no HTML plugin) then writes a static index.html.
 */
export async function bundleComposition({
  manifest,
  manifestPath,
  formatId,
  outDir,
}: {
  manifest: VideoManifest;
  manifestPath: string;
  formatId: string;
  outDir: string;
}): Promise<{ outDir: string }> {
  fs.mkdirSync(outDir, { recursive: true });
  const distDir = path.join(outDir, "dist");
  fs.mkdirSync(distDir, { recursive: true });

  const componentPaths = collectComponentPaths(manifest);
  const absComponents = componentPaths.map((rel) => ({
    rel,
    abs: resolveComponentPath({ manifestPath, componentPath: rel }),
  }));

  for (const c of absComponents) {
    if (!fs.existsSync(c.abs)) {
      throw new Error(`Component not found: ${c.rel} (${c.abs})`);
    }
  }

  const entryFile = path.join(outDir, "_entry.tsx");
  const importLines = absComponents
    .map(
      (c, i) =>
        `import Comp${i} from ${JSON.stringify(pathToFileURL(c.abs).href)};`,
    )
    .join("\n");
  const mapEntries = absComponents
    .map((c, i) => `  ${JSON.stringify(c.rel)}: Comp${i}`)
    .join(",\n");

  const manifestJson = JSON.stringify(manifest);
  const entrySource = `
import { mountStoryboard } from "@levi-putna/storyboard-renderer/client";
${importLines}

const manifest = ${manifestJson} as const;
const components = {
${mapEntries}
};

mountStoryboard({
  manifest: manifest as any,
  components,
  formatId: ${JSON.stringify(formatId)},
});
`;

  fs.writeFileSync(entryFile, entrySource, "utf8");

  const assetsRoot = path.resolve(
    path.dirname(manifestPath),
    manifest.assetsRoot ?? ".",
  );

  const here = import.meta.url;
  const reactDir = resolveReactPackageRoot({ name: "react", from: here });
  const reactDomDir = resolveReactPackageRoot({
    name: "react-dom",
    from: here,
  });
  const storyboardAliases = storyboardViteAliases({ from: here });

  await viteBuild({
    configFile: false,
    publicDir: false,
    // file: installs copy package tsconfigs that extend the monorepo base — force
    // automatic JSX so consumer bundles do not fall back to classic React.createElement.
    esbuild: {
      jsx: "automatic",
    },
    build: {
      outDir: distDir,
      emptyOutDir: true,
      assetsInlineLimit: 0,
      cssCodeSplit: false,
      rollupOptions: {
        input: entryFile,
        output: {
          format: "es",
          entryFileNames: "entry.js",
          chunkFileNames: "chunks/[name]-[hash].js",
          assetFileNames: "assets/[name][extname]",
        },
      },
    },
    resolve: {
      alias: {
        ...storyboardAliases,
        "react/jsx-runtime": path.join(reactDir, "jsx-runtime.js"),
        "react/jsx-dev-runtime": path.join(reactDir, "jsx-dev-runtime.js"),
        react: reactDir,
        "react-dom": reactDomDir,
      },
    },
    logLevel: "warn",
  });

  // Copy static assets into dist so sirv can serve them at /
  if (fs.existsSync(assetsRoot)) {
    copyDir(assetsRoot, distDir);
  }

  fs.writeFileSync(
    path.join(distDir, "index.html"),
    `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      html, body { margin: 0; padding: 0; background: #000; overflow: hidden; }
      #root { display: inline-block; }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./entry.js"></script>
  </body>
</html>`,
    "utf8",
  );

  return { outDir: distDir };
}

function copyDir(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    // Skip overwriting built JS
    if (entry.name === "entry.js" || entry.name === "index.html") continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

