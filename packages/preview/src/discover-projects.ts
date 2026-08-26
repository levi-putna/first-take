import fs from "node:fs";
import path from "node:path";
import { validateVideoFile } from "@levi-putna/storyboard-schema";

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "dist",
  "out",
  "coverage",
  ".yarn",
  ".next",
]);

export type PreviewProject = {
  manifestPath: string;
  title: string;
  slug: string;
};

/**
 * Normalise two filesystem paths for equality, following symlinks when possible.
 */
export function sameManifestPath({
  left,
  right,
}: {
  left: string;
  right: string;
}): boolean {
  const resolveReal = (value: string) => {
    const resolved = path.resolve(value);
    try {
      return fs.realpathSync(resolved);
    } catch {
      return resolved;
    }
  };
  return resolveReal(left) === resolveReal(right);
}

/**
 * Read a video.json into a preview-project row, or null when it is missing / invalid.
 */
export function readPreviewProject({
  manifestPath,
  allowInvalid = false,
}: {
  manifestPath: string;
  allowInvalid?: boolean;
}): PreviewProject | null {
  const resolved = path.resolve(manifestPath);
  const result = validateVideoFile({
    manifestPath: resolved,
    checkAssets: false,
  });
  if (result.ok) {
    return {
      manifestPath: resolved,
      title: result.manifest.title,
      slug: result.manifest.slug,
    };
  }
  if (!allowInvalid || !fs.existsSync(resolved)) return null;
  return {
    manifestPath: resolved,
    title: path.basename(path.dirname(resolved)),
    slug: path.basename(path.dirname(resolved)),
  };
}

/**
 * Collect each child-folder video.json immediately under a parent directory.
 */
function addSiblingProjects({
  parentDir,
  projects,
}: {
  parentDir: string;
  projects: Map<string, PreviewProject>;
}): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(parentDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory() || SKIP_DIR_NAMES.has(entry.name)) continue;
    addProject({
      manifestPath: path.join(parentDir, entry.name, "video.json"),
      projects,
    });
  }
}

/**
 * Insert a valid manifest into the project map (deduped by resolved path).
 */
function addProject({
  manifestPath,
  projects,
  allowInvalid = false,
}: {
  manifestPath: string;
  projects: Map<string, PreviewProject>;
  allowInvalid?: boolean;
}): void {
  const project = readPreviewProject({ manifestPath, allowInvalid });
  if (!project) return;
  if (projects.has(project.manifestPath)) return;
  projects.set(project.manifestPath, project);
}

/**
 * Find other Storyboard videos near the open manifest (siblings, cwd, examples/).
 */
export function discoverPreviewProjects({
  manifestPath,
  cwd = process.cwd(),
}: {
  manifestPath: string;
  cwd?: string;
}): PreviewProject[] {
  const projects = new Map<string, PreviewProject>();
  const currentPath = path.resolve(manifestPath);
  const projectDir = path.dirname(currentPath);
  const resolvedCwd = path.resolve(cwd);

  addProject({
    manifestPath: currentPath,
    projects,
    allowInvalid: true,
  });
  addSiblingProjects({
    parentDir: path.dirname(projectDir),
    projects,
  });
  addProject({
    manifestPath: path.join(resolvedCwd, "video.json"),
    projects,
  });
  addSiblingProjects({ parentDir: resolvedCwd, projects });
  const examplesDir = path.join(resolvedCwd, "examples");
  if (fs.existsSync(examplesDir)) {
    addSiblingProjects({ parentDir: examplesDir, projects });
  }

  return [...projects.values()].sort((left, right) => {
    const byTitle = left.title.localeCompare(right.title, "en-AU");
    if (byTitle !== 0) return byTitle;
    return left.slug.localeCompare(right.slug, "en-AU");
  });
}

/**
 * True when `candidatePath` is the current video or another discovered neighbour.
 */
export function isAllowedPreviewProject({
  candidatePath,
  currentManifestPath,
  cwd = process.cwd(),
}: {
  candidatePath: string;
  currentManifestPath: string;
  cwd?: string;
}): boolean {
  const projects = discoverPreviewProjects({
    manifestPath: currentManifestPath,
    cwd,
  });
  return projects.some((project) =>
    sameManifestPath({ left: project.manifestPath, right: candidatePath }),
  );
}
