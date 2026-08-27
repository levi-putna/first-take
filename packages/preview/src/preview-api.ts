import fs from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import {
  formatSchema,
  validateUniqueSceneIds,
  validateVideoFile,
  videoManifestSchema,
  type Scene,
  type VideoManifest,
} from "@levi-putna/storyboard-schema";
import { sameManifestPath, type PreviewProject } from "./discover-projects.js";
import { listSceneAudioSources } from "./scene-audio.js";
import { tryServeAsset } from "./serve-assets.js";

/**
 * Mutable preview process: the open video, its assets, and neighbour list.
 */
export type PreviewSession = {
  getManifestPath: () => string;
  getAssetsRoot: () => string;
  listProjects: () => PreviewProject[];
  openProject: (params: { manifestPath: string }) =>
    | { ok: true }
    | { ok: false; errors: string[] };
};

/**
 * Read a JSON request body from a Node IncomingMessage.
 */
async function readJsonBody({
  req,
}: {
  req: IncomingMessage;
}): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) return {};
  return JSON.parse(raw) as unknown;
}

/**
 * Write a JSON HTTP response.
 */
function sendJson({
  res,
  status,
  body,
}: {
  res: ServerResponse;
  status: number;
  body: unknown;
}): void {
  const payload = JSON.stringify(body);
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(payload);
}

/**
 * Append a format to video.json without rewriting Zod defaults onto disk.
 */
function appendFormatToManifestFile({
  manifestPath,
  format,
}: {
  manifestPath: string;
  format: { id: string; aspectRatio: string; width: number; height: number };
}): { ok: true } | { ok: false; errors: string[] } {
  const parsedFormat = formatSchema.safeParse(format);
  if (!parsedFormat.success) {
    return {
      ok: false,
      errors: parsedFormat.error.issues.map(
        (issue) => `${issue.path.join(".") || "format"}: ${issue.message}`,
      ),
    };
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown;
  } catch (err) {
    return {
      ok: false,
      errors: [`Could not read video.json: ${err instanceof Error ? err.message : String(err)}`],
    };
  }

  if (!raw || typeof raw !== "object") {
    return { ok: false, errors: ["video.json must be an object"] };
  }

  const file = raw as { formats?: unknown };
  if (!Array.isArray(file.formats)) {
    return { ok: false, errors: ["video.json is missing a formats array"] };
  }

  const nextFormat = parsedFormat.data;
  const duplicate = file.formats.some(
    (entry) =>
      entry &&
      typeof entry === "object" &&
      "id" in entry &&
      (entry as { id: unknown }).id === nextFormat.id,
  );
  if (duplicate) {
    return { ok: false, errors: [`Format id "${nextFormat.id}" already exists`] };
  }

  const next = {
    ...file,
    formats: [...file.formats, nextFormat],
  };
  const validated = videoManifestSchema.safeParse(next);
  if (!validated.success) {
    return {
      ok: false,
      errors: validated.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { ok: true };
}

/**
 * Return a non-array object, or null when the value is not that shape.
 */
function asPlainObject({
  value,
}: {
  value: unknown;
}): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Clone scene props through JSON so only serialisable values are written.
 */
function cloneJsonProps({
  sceneId,
  props,
}: {
  sceneId: string;
  props: unknown;
}): { ok: true; props: Record<string, unknown> } | { ok: false; error: string } {
  if (!asPlainObject({ value: props })) {
    return {
      ok: false,
      error: `Props for scene "${sceneId}" must be a JSON object`,
    };
  }
  try {
    const cloned = asPlainObject({
      value: JSON.parse(JSON.stringify(props)) as unknown,
    });
    if (!cloned) {
      return {
        ok: false,
        error: `Props for scene "${sceneId}" must be a JSON object`,
      };
    }
    return { ok: true, props: cloned };
  } catch {
    return {
      ok: false,
      error: `Props for scene "${sceneId}" are not JSON-serialisable`,
    };
  }
}

/**
 * Merge a draft scene onto its on-disk object without injecting Zod defaults.
 */
function mergeSceneOnDisk({
  fileScene,
  draftScene,
  propOverride,
}: {
  fileScene: Record<string, unknown>;
  draftScene: Scene;
  propOverride?: Record<string, unknown>;
}): Record<string, unknown> {
  const next: Record<string, unknown> = { ...fileScene };
  next.durationInFrames = draftScene.durationInFrames;

  if (draftScene.title) {
    next.title = draftScene.title;
  }

  const gap = draftScene.gapBeforeFrames ?? 0;
  if (gap > 0) {
    next.gapBeforeFrames = gap;
  } else if ("gapBeforeFrames" in fileScene) {
    delete next.gapBeforeFrames;
  }

  if (propOverride) {
    next.props = propOverride;
  }

  return next;
}

/**
 * Merge a draft track onto disk, rebuilding scene membership and order.
 */
function mergeTrackOnDisk({
  fileTrack,
  draftTrack,
  sceneFiles,
  propOverrides,
}: {
  fileTrack?: Record<string, unknown>;
  draftTrack: VideoManifest["tracks"][number];
  sceneFiles: Map<string, Record<string, unknown>>;
  propOverrides: Map<string, Record<string, unknown>>;
}): Record<string, unknown> {
  const next: Record<string, unknown> = fileTrack
    ? { ...fileTrack }
    : { id: draftTrack.id };

  if (draftTrack.title) {
    next.title = draftTrack.title;
  } else if ("title" in next) {
    delete next.title;
  }

  if (draftTrack.description) {
    next.description = draftTrack.description;
  } else if ("description" in next) {
    delete next.description;
  }

  const scenes = draftTrack.scenes.map((draftScene) => {
    const fileScene = sceneFiles.get(draftScene.id);
    if (!fileScene) {
      throw new Error(`Unknown scene id "${draftScene.id}"`);
    }
    return mergeSceneOnDisk({
      fileScene,
      draftScene,
      propOverride: propOverrides.get(draftScene.id),
    });
  });

  next.scenes = scenes;
  return next;
}

/**
 * Persist timeline structure and optional prop overrides to video.json.
 */
export function saveStudioChangesToManifestFile({
  manifestPath,
  timeline,
  overrides = {},
}: {
  manifestPath: string;
  timeline?: VideoManifest;
  overrides?: Record<string, unknown>;
}): { ok: true } | { ok: false; errors: string[] } {
  const hasOverrides = Object.keys(overrides).length > 0;
  if (!timeline && !hasOverrides) {
    return { ok: false, errors: ["No changes to save"] };
  }

  const propOverrides = new Map<string, Record<string, unknown>>();
  for (const sceneId of Object.keys(overrides)) {
    const cloned = cloneJsonProps({ sceneId, props: overrides[sceneId] });
    if (!cloned.ok) return { ok: false, errors: [cloned.error] };
    propOverrides.set(sceneId, cloned.props);
  }

  if (timeline) {
    const parsed = videoManifestSchema.safeParse(timeline);
    if (!parsed.success) {
      return {
        ok: false,
        errors: parsed.error.issues.map(
          (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
        ),
      };
    }
    const errors = [...validateUniqueSceneIds(parsed.data)];
    if (!parsed.data.tracks.some((track) => track.scenes.length > 0)) {
      errors.push("At least one track must contain a scene");
    }
    if (errors.length > 0) {
      return { ok: false, errors };
    }
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown;
  } catch (err) {
    return {
      ok: false,
      errors: [
        `Could not read video.json: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }

  if (!asPlainObject({ value: raw })) {
    return { ok: false, errors: ["video.json must be an object"] };
  }

  const file = raw as { tracks?: unknown };
  if (!Array.isArray(file.tracks)) {
    return { ok: false, errors: ["video.json is missing a tracks array"] };
  }

  const sceneFiles = new Map<string, Record<string, unknown>>();
  for (const track of file.tracks) {
    const entry = asPlainObject({ value: track });
    if (!entry || !Array.isArray(entry.scenes)) continue;
    for (const scene of entry.scenes) {
      const sceneEntry = asPlainObject({ value: scene });
      if (!sceneEntry || typeof sceneEntry.id !== "string") continue;
      sceneFiles.set(sceneEntry.id, sceneEntry);
    }
  }

  if (!timeline) {
    return saveScenePropsToManifestFile({ manifestPath, overrides });
  }

  const fileTracks = new Map<string, Record<string, unknown>>();
  for (const track of file.tracks) {
    const entry = asPlainObject({ value: track });
    if (!entry || typeof entry.id !== "string") continue;
    fileTracks.set(entry.id, entry);
  }

  try {
    const nextTracks = timeline.tracks.map((draftTrack) =>
      mergeTrackOnDisk({
        fileTrack: fileTracks.get(draftTrack.id),
        draftTrack,
        sceneFiles,
        propOverrides,
      }),
    );

    for (const sceneId of propOverrides.keys()) {
      if (
        !timeline.tracks.some((track) =>
          track.scenes.some((scene) => scene.id === sceneId),
        )
      ) {
        return { ok: false, errors: [`Unknown scene id "${sceneId}"`] };
      }
    }

    const next = {
      ...file,
      tracks: nextTracks,
    };
    const validated = videoManifestSchema.safeParse(next);
    if (!validated.success) {
      return {
        ok: false,
        errors: validated.error.issues.map(
          (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
        ),
      };
    }

    fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
    return { ok: true };
  } catch (err) {
    return {
      ok: false,
      errors: [err instanceof Error ? err.message : String(err)],
    };
  }
}

/**
 * Replace scene props in video.json without rewriting Zod defaults onto disk.
 */
export function saveScenePropsToManifestFile({
  manifestPath,
  overrides,
}: {
  manifestPath: string;
  overrides: Record<string, unknown>;
}): { ok: true } | { ok: false; errors: string[] } {
  const sceneIds = Object.keys(overrides);
  if (sceneIds.length === 0) {
    return { ok: false, errors: ["No prop changes to save"] };
  }

  const nextProps = new Map<string, Record<string, unknown>>();
  for (const sceneId of sceneIds) {
    const cloned = cloneJsonProps({ sceneId, props: overrides[sceneId] });
    if (!cloned.ok) return { ok: false, errors: [cloned.error] };
    nextProps.set(sceneId, cloned.props);
  }

  let raw: unknown;
  try {
    raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown;
  } catch (err) {
    return {
      ok: false,
      errors: [
        `Could not read video.json: ${err instanceof Error ? err.message : String(err)}`,
      ],
    };
  }

  if (!asPlainObject({ value: raw })) {
    return { ok: false, errors: ["video.json must be an object"] };
  }

  const file = raw as { tracks?: unknown };
  if (!Array.isArray(file.tracks)) {
    return { ok: false, errors: ["video.json is missing a tracks array"] };
  }

  const remaining = new Set(sceneIds);
  const nextTracks = file.tracks.map((track: unknown) => {
    const entry = asPlainObject({ value: track });
    if (!entry || !Array.isArray(entry.scenes)) {
      return track;
    }
    const scenes = entry.scenes.map((scene: unknown) => {
      const sceneEntry = asPlainObject({ value: scene });
      if (!sceneEntry || typeof sceneEntry.id !== "string") {
        return scene;
      }
      const props = nextProps.get(sceneEntry.id);
      if (!props) return scene;
      remaining.delete(sceneEntry.id);
      return { ...sceneEntry, props };
    });
    return { ...entry, scenes };
  });

  if (remaining.size > 0) {
    return {
      ok: false,
      errors: [...remaining].map((id) => `Unknown scene id "${id}"`),
    };
  }

  const next = {
    ...file,
    tracks: nextTracks,
  };
  const validated = videoManifestSchema.safeParse(next);
  if (!validated.success) {
    return {
      ok: false,
      errors: validated.error.issues.map(
        (issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`,
      ),
    };
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8");
  return { ok: true };
}

/**
 * Pathname without query string.
 */
function requestPathname({ req }: { req: IncomingMessage }): string {
  const url = req.url ?? "/";
  return url.split("?")[0] ?? "/";
}

/**
 * Vite middleware: studio APIs plus assets from the currently open video.
 */
export function previewApiPlugin({
  session,
}: {
  session: PreviewSession;
}): Plugin {
  return {
    name: "storyboard-preview-api",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = requestPathname({ req });
        const method = req.method ?? "GET";

        if (method === "GET" && pathname === "/__storyboard/scene-audio") {
          const manifestPath = session.getManifestPath();
          const result = validateVideoFile({
            manifestPath,
            checkAssets: false,
          });
          if (!result.ok) {
            sendJson({
              res,
              status: 400,
              body: { ok: false, errors: result.errors },
            });
            return;
          }
          sendJson({
            res,
            status: 200,
            body: {
              scenes: listSceneAudioSources({
                manifest: result.manifest,
                manifestPath,
              }),
            },
          });
          return;
        }

        if (method === "GET" && pathname === "/__storyboard/projects") {
          const current = session.getManifestPath();
          const projects = session.listProjects().map((project) => ({
            ...project,
            current: sameManifestPath({
              left: project.manifestPath,
              right: current,
            }),
          }));
          sendJson({ res, status: 200, body: { projects } });
          return;
        }

        if (method === "POST" && pathname === "/__storyboard/open") {
          void (async () => {
            try {
              const body = (await readJsonBody({ req })) as {
                manifestPath?: unknown;
              };
              if (typeof body.manifestPath !== "string" || !body.manifestPath) {
                sendJson({
                  res,
                  status: 400,
                  body: { ok: false, errors: ["manifestPath is required"] },
                });
                return;
              }
              const result = session.openProject({
                manifestPath: body.manifestPath,
              });
              sendJson({
                res,
                status: result.ok ? 200 : 400,
                body: result,
              });
            } catch (err) {
              sendJson({
                res,
                status: 400,
                body: {
                  ok: false,
                  errors: [err instanceof Error ? err.message : String(err)],
                },
              });
            }
          })();
          return;
        }

        if (method === "POST" && pathname === "/__storyboard/add-format") {
          void (async () => {
            try {
              const body = await readJsonBody({ req });
              const result = appendFormatToManifestFile({
                manifestPath: session.getManifestPath(),
                format: body as {
                  id: string;
                  aspectRatio: string;
                  width: number;
                  height: number;
                },
              });
              if (!result.ok) {
                sendJson({ res, status: 400, body: result });
                return;
              }
              sendJson({ res, status: 200, body: { ok: true } });
            } catch (err) {
              sendJson({
                res,
                status: 400,
                body: {
                  ok: false,
                  errors: [err instanceof Error ? err.message : String(err)],
                },
              });
            }
          })();
          return;
        }

        if (method === "POST" && pathname === "/__storyboard/save-props") {
          void (async () => {
            try {
              const body = (await readJsonBody({ req })) as {
                overrides?: unknown;
                timeline?: unknown;
              };
              const overrides = asPlainObject({ value: body.overrides }) ?? {};
              const timelineParsed = body.timeline
                ? videoManifestSchema.safeParse(body.timeline)
                : null;
              if (body.timeline && timelineParsed && !timelineParsed.success) {
                sendJson({
                  res,
                  status: 400,
                  body: {
                    ok: false,
                    errors: timelineParsed.error.issues.map(
                      (issue) =>
                        `${issue.path.join(".") || "(root)"}: ${issue.message}`,
                    ),
                  },
                });
                return;
              }
              const result = saveStudioChangesToManifestFile({
                manifestPath: session.getManifestPath(),
                timeline: timelineParsed?.success
                  ? timelineParsed.data
                  : undefined,
                overrides,
              });
              sendJson({
                res,
                status: result.ok ? 200 : 400,
                body: result,
              });
            } catch (err) {
              sendJson({
                res,
                status: 400,
                body: {
                  ok: false,
                  errors: [err instanceof Error ? err.message : String(err)],
                },
              });
            }
          })();
          return;
        }

        if (method === "POST" && pathname === "/__storyboard/save-timeline") {
          void (async () => {
            try {
              const body = (await readJsonBody({ req })) as {
                timeline?: unknown;
                overrides?: unknown;
              };
              const timelineParsed = videoManifestSchema.safeParse(body.timeline);
              if (!timelineParsed.success) {
                sendJson({
                  res,
                  status: 400,
                  body: {
                    ok: false,
                    errors: timelineParsed.error.issues.map(
                      (issue) =>
                        `${issue.path.join(".") || "(root)"}: ${issue.message}`,
                    ),
                  },
                });
                return;
              }
              const overrides = asPlainObject({ value: body.overrides }) ?? {};
              const result = saveStudioChangesToManifestFile({
                manifestPath: session.getManifestPath(),
                timeline: timelineParsed.data,
                overrides,
              });
              sendJson({
                res,
                status: result.ok ? 200 : 400,
                body: result,
              });
            } catch (err) {
              sendJson({
                res,
                status: 400,
                body: {
                  ok: false,
                  errors: [err instanceof Error ? err.message : String(err)],
                },
              });
            }
          })();
          return;
        }

        if (
          tryServeAsset({
            assetsRoot: session.getAssetsRoot(),
            req,
            res,
          })
        ) {
          return;
        }

        next();
      });
    },
  };
}
