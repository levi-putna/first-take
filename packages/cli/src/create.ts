import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/**
 * Read this CLI package's version (`first-take` on npm).
 */
export function cliPackageVersion(): string {
  return (require("../package.json") as { version: string }).version;
}

/**
 * True when cwd is the First Take pnpm workspaces repo (not a consumer project).
 */
export function isStoryboardMonorepo({
  cwd = process.cwd(),
}: {
  cwd?: string;
} = {}): boolean {
  const pkgPath = path.join(cwd, "package.json");
  if (!fs.existsSync(pkgPath)) return false;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as {
      name?: string;
      workspaces?: unknown;
    };
    const hasPnpmWorkspace = fs.existsSync(
      path.join(cwd, "pnpm-workspace.yaml"),
    );
    return (
      pkg.name === "storyboard" &&
      (Boolean(pkg.workspaces) || hasPnpmWorkspace)
    );
  } catch {
    return false;
  }
}

/**
 * Command prefix for follow-up docs: local pnpm script vs npx.
 */
export function storyboardCliCommand({
  cwd = process.cwd(),
}: {
  cwd?: string;
} = {}): string {
  return isStoryboardMonorepo({ cwd })
    ? "pnpm first-take"
    : "npx first-take";
}

export type CreateVideoOptions = {
  /** Project slug (folder name and video.json slug). */
  slug: string;
  /** Absolute output directory for the new project. */
  outDir: string;
  /** Human-readable title. */
  title: string;
  /** Include a looping bed track with in-scene Audio. */
  withAudio: boolean;
  /** Overwrite an existing non-empty directory. */
  force: boolean;
};

/**
 * Convert a slug into a package name safe for pnpm workspaces.
 */
export function packageNameFromSlug({ slug }: { slug: string }): string {
  const cleaned = slug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!cleaned) {
    throw new Error("Slug must contain at least one letter or number");
  }
  return `@storyboard/${cleaned}`;
}

/**
 * Resolve the default output directory for a new video project.
 * Prefers `examples/<slug>` when an `examples` folder exists in cwd.
 */
export function resolveDefaultOutDir({
  slug,
  cwd = process.cwd(),
}: {
  slug: string;
  cwd?: string;
}): string {
  const examplesDir = path.join(cwd, "examples");
  if (fs.existsSync(examplesDir) && fs.statSync(examplesDir).isDirectory()) {
    return path.join(examplesDir, slug);
  }
  return path.join(cwd, slug);
}

/**
 * Title-case a slug for display titles.
 */
export function titleFromSlug({ slug }: { slug: string }): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function writeFile({
  filePath,
  contents,
}: {
  filePath: string;
  contents: string;
}): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, contents, "utf8");
}

/**
 * Walk up from a directory looking for tsconfig.base.json.
 */
function findTsconfigBase({
  fromDir,
}: {
  fromDir: string;
}): string | null {
  let current = path.resolve(fromDir);
  for (let i = 0; i < 8; i++) {
    const candidate = path.join(current, "tsconfig.base.json");
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return null;
}

/**
 * Scaffold a new First Take video project on disk.
 * @returns list of relative file paths written
 */
export function scaffoldVideoProject({
  slug,
  outDir,
  title,
  withAudio,
  force,
}: CreateVideoOptions): string[] {
  const pkgName = packageNameFromSlug({ slug });
  const engineVersion = cliPackageVersion();
  const cli = storyboardCliCommand();
  const inMonorepo = isStoryboardMonorepo();

  if (fs.existsSync(outDir)) {
    const entries = fs.readdirSync(outDir);
    if (entries.length > 0 && !force) {
      throw new Error(
        `Directory already exists and is not empty: ${outDir} (pass --force to overwrite)`,
      );
    }
  } else {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const written: string[] = [];
  const add = ({ rel, contents }: { rel: string; contents: string }) => {
    writeFile({ filePath: path.join(outDir, rel), contents });
    written.push(rel);
  };

  add({
    rel: "package.json",
    contents: `${JSON.stringify(
      {
        name: pkgName,
        private: true,
        version: "0.1.0",
        type: "module",
        scripts: {
          build: 'echo "example — no build"',
          typecheck: "tsc --noEmit -p tsconfig.json",
        },
        dependencies: {
          "first-take": engineVersion,
        },
        devDependencies: {
          typescript: "^5.8.3",
          react: "^19.1.0",
        },
      },
      null,
      2,
    )}\n`,
  });

  const baseTsconfig = findTsconfigBase({ fromDir: outDir });
  const tsconfig = baseTsconfig
    ? {
        extends: path
          .relative(outDir, baseTsconfig)
          .split(path.sep)
          .join("/"),
        compilerOptions: {
          noEmit: true,
          rootDir: ".",
        },
        include: ["src"],
      }
    : {
        compilerOptions: {
          target: "ES2022",
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          strict: true,
          noEmit: true,
          rootDir: ".",
          skipLibCheck: true,
        },
        include: ["src"],
      };

  add({
    rel: "tsconfig.json",
    contents: `${JSON.stringify(tsconfig, null, 2)}\n`,
  });

  /** Intro 90f; Point overlaps by 15f on a higher track (gap 75). Total 195f. */
  const visualDurationInFrames = 195;

  const visualTrack = {
    id: "visual",
    title: "Visual",
    scenes: [
      {
        id: "01",
        title: "Intro",
        visualType: "component",
        component: "src/scenes/01-Intro.tsx",
        props: {
          headline: "Replace this headline.",
        },
        durationInFrames: 90,
      },
    ],
  };

  const visualOverlayTrack = {
    id: "visual-b",
    title: "Visual B",
    scenes: [
      {
        id: "02",
        title: "Point",
        visualType: "component",
        component: "src/scenes/02-Point.tsx",
        props: {
          headline: "Add your second beat here.",
        },
        durationInFrames: 120,
        gapBeforeFrames: 75,
      },
    ],
  };

  const bedTrack = {
    id: "bed",
    title: "Bed",
    scenes: [
      {
        id: "bed",
        title: "Bed",
        visualType: "component",
        component: "src/scenes/Bed.tsx",
        props: {
          src: "assets/audio/bed-loop.mp3",
        },
        durationInFrames: visualDurationInFrames,
      },
    ],
  };

  const manifest = {
    schemaVersion: 3,
    slug,
    title,
    fps: 30,
    formats: [
      { id: "16x9", aspectRatio: "16:9", width: 1920, height: 1080 },
      { id: "9x16", aspectRatio: "9:16", width: 1080, height: 1920 },
    ],
    assetsRoot: ".",
    tracks: withAudio
      ? [visualTrack, visualOverlayTrack, bedTrack]
      : [visualTrack, visualOverlayTrack],
  };

  add({
    rel: "video.json",
    contents: `${JSON.stringify(manifest, null, 2)}\n`,
  });

  add({
    rel: "src/scenes/01-Intro.tsx",
    contents: `import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "first-take";

/**
 * Opening scene — headline fades in.
 */
export default function IntroScene({
  headline = "Replace this headline.",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const opacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 0.5 * fps], [24, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0e1524",
        alignItems: "center",
        justifyContent: "center",
        padding: width * 0.08,
      }}
    >
      {/* Headline */}
      <div
        style={{
          opacity,
          transform: \`translateY(\${y}px)\`,
          color: "#f2f5fb",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(36, width * 0.045),
          textAlign: "center",
          lineHeight: 1.25,
          maxWidth: "18em",
        }}
      >
        {headline}
      </div>
    </AbsoluteFill>
  );
}
`,
  });

  add({
    rel: "src/scenes/02-Point.tsx",
    contents: `import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "first-take";

/**
 * Second beat — fades in over the intro on a higher track.
 */
export default function PointScene({
  headline = "Add your second beat here.",
}: {
  headline?: string;
}) {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0e1524",
        alignItems: "center",
        justifyContent: "center",
        padding: width * 0.08,
        opacity,
      }}
    >
      {/* Supporting line */}
      <div
        style={{
          color: "#d7deed",
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: Math.max(28, width * 0.035),
          textAlign: "center",
          maxWidth: "16em",
        }}
      >
        {headline}
      </div>
    </AbsoluteFill>
  );
}
`,
  });

  if (withAudio) {
    add({
      rel: "src/scenes/Bed.tsx",
      contents: `import { AbsoluteFill } from "first-take";
import { Audio, staticFile } from "first-take/media";

/**
 * Transparent full-length bed. Duration must match the visual track.
 */
export default function Bed({
  src = "assets/audio/bed-loop.mp3",
}: {
  src?: string;
}) {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Audio src={staticFile(src)} loop />
    </AbsoluteFill>
  );
}
`,
    });
  }

  add({
    rel: "assets/audio/.gitkeep",
    contents: "",
  });

  add({
    rel: "assets/audio/README.md",
    contents: `# Audio assets

Place MP3 (or wav / m4a / aac) files here, then pass the path as a scene prop and play it with \`<Audio src={staticFile(src)} />\`.

| File | Typical role |
|------|----------------|
| \`bed-loop.mp3\` | Looping bed on a full-length audio track |
| \`intro-jingle.mp3\` | Short sting on the opening visual scene |
| \`narration.mp3\` | Voice-over on the audio track (\`startFromFrame\` for delay) |

\`create --with-audio\` already wires \`bed-loop.mp3\` into a transparent bed scene. Until the file exists, validate with:

\`\`\`bash
${cli} validate video.json --no-assets
\`\`\`

Or render silently:

\`\`\`bash
${cli} render video.json --silent
\`\`\`
`,
  });

  add({
    rel: "README.md",
    contents: `# ${title}

Scaffolded First Take video project (\`${slug}\`).

## Next steps

1. Edit \`src/scenes/\`.
2. Adjust tracks, formats, and props in \`video.json\`.
3. ${
      withAudio
        ? "Drop \`bed-loop.mp3\` into \`assets/audio/\` (see that folder's README). Double-click a clip in preview to isolate a scene."
        : "Optional: add audio under \`assets/audio/\` and play it with \`<Audio>\` inside a scene. Double-click a clip in preview to isolate a scene."
    }

## Commands

${
  inMonorepo
    ? "From the monorepo root:"
    : "From this folder (Node 22+):"
}

\`\`\`bash
${cli} validate <this-folder>/video.json${withAudio ? " --no-assets" : ""}
${cli} preview <this-folder>/video.json
${cli} still <this-folder>/video.json --frame=0 --out=out/still.png
${cli} render <this-folder>/video.json${withAudio ? " --silent" : ""}
\`\`\`

${
  withAudio
    ? "Until audio files exist, keep using `--no-assets` / `--silent`.\n\n"
    : ""
}${
  inMonorepo
    ? "See the root [authoring guide](../../.doc/07-authoring-guide.md).\n"
    : ""
}
`,
  });

  return written;
}
