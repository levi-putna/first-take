# Single-package publish (proposal)

**Status:** proposal for review. This is not how npm works today.

Today 0.3.0 ships **seven** public packages. This note describes publishing **one**: `@levi-putna/storyboard`. Git can still have seven folders. npm should not.

## Why one

A Storyboard project always needs both the React APIs and the CLI. Scene files import `useCurrentFrame`; `npx` runs `preview` / `render`. Splitting those across npm names means two installs of one product, seven OTP publishes, and lockstep versioning that is already treated as a single release.

The seven folders are a convenient way to keep frame-clock code away from Playwright. They are not seven products.

## What consumers get

One install, one name, one version.

```bash
pnpm add -D @levi-putna/storyboard
npx @levi-putna/storyboard create my-feature
npx @levi-putna/storyboard preview video.json
npx @levi-putna/storyboard render video.json --format=16x9
```

Scene files import from that same package:

```ts
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "@levi-putna/storyboard";
import { Audio, staticFile, Video } from "@levi-putna/storyboard/media";
```

`npx @levi-putna/storyboard` stays the CLI. That does not change.

### Suggested public exports

| Import | What it is | Today |
|--------|------------|--------|
| `@levi-putna/storyboard` | Frame clock and layout (`useCurrentFrame`, `AbsoluteFill`, `Sequence`, `interpolate`, `spring`, …) | `@levi-putna/storyboard-core` |
| `@levi-putna/storyboard/media` | `Img`, `Audio`, `Video`, `staticFile` | `@levi-putna/storyboard-media` |
| `@levi-putna/storyboard/schema` | `video.json` types and validation | `@levi-putna/storyboard-schema` |
| `@levi-putna/storyboard/transitions` | `CompositionFromManifest`, `TransitionSeries` | `@levi-putna/storyboard-transitions` |
| `bin`: `storyboard` | create / validate / preview / still / render | `@levi-putna/storyboard` (CLI only) |

Renderer and preview stay **inside** the package. The CLI imports them as `./dist/renderer` and `./dist/preview`. They are not extra npm names, and scene authors do not import them.

`package.json` sketch:

```json
{
  "name": "@levi-putna/storyboard",
  "version": "1.0.0",
  "bin": {
    "storyboard": "./dist/cli.js"
  },
  "exports": {
    ".": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js"
    },
    "./media": {
      "types": "./dist/media/index.d.ts",
      "import": "./dist/media/index.js"
    },
    "./schema": {
      "types": "./dist/schema/index.d.ts",
      "import": "./dist/schema/index.js"
    },
    "./schema/browser": {
      "types": "./dist/schema/browser.d.ts",
      "import": "./dist/schema/browser.js"
    },
    "./transitions": {
      "types": "./dist/transitions/index.d.ts",
      "import": "./dist/transitions/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist", "app"],
  "publishConfig": { "access": "public" }
}
```

`app` is the preview studio (today `packages/preview/app`). Peer dependency: `react` / `react-dom` `^19`. Runtime dependencies of the **one** tarball: Zod, Commander, Vite, Playwright, `ffmpeg-static`, `ffprobe-static`, Lucide, and the rest of what renderer/preview already need.

The published package must **not** depend on `@levi-putna/storyboard-core` (or any of the other six names). If it does, npm will still fetch those packages. One name means one tarball that already contains the code.

## What stays in git vs what npm sees

```
git (this repo)                         npm tarball
─────────────────                       ────────────
packages/schema          ─┐
packages/core            │
packages/media           │  yarn build
packages/transitions     ├──────────►   dist/schema, dist/core, …
packages/renderer        │              dist/renderer, dist/preview
packages/preview         │              dist/cli.js
packages/cli             ─┘             app/   (studio)
examples/*               (private)      README.md, LICENSE
package.json root        (private)
```

Keep the folders. They still prevent circular imports and keep tests small. Mark every workspace except the published one `"private": true`. Do not publish `examples/*` or the repo root.

Yarn workspaces remain the local development layout. The change is **registry surface**, not “delete `packages/core`”.

## What the tarball contains

Same idea as today’s CLI pack, plus the authoring and engine artefacts that currently live in the other six packages:

- `package.json`, `README.md`, `LICENSE` (README still copied from the repo root and rewritten for GitHub links, as `scripts/stage-cli-docs.mjs` does now)
- `dist/cli.js` (bin)
- `dist/core`, `dist/media`, `dist/schema`, `dist/transitions`
- `dist/renderer` (including the Vite client entry used to mount a composition)
- `dist/preview` plus `app/` (studio UI)
- no `examples/`, no `.doc/`, no tests

`yarn pack` on that package should list those paths and nothing from another `@levi-putna/*` name.

## How a release runs

Today: `yarn set-version`, then `yarn publish:npm`, which publishes seven workspaces in dependency order, each needing OTP under `auth-and-writes`.

Proposed:

1. Quality gates (`yarn build`, `typecheck`, `lint`, `test`) as now.
2. `yarn set-version 1.0.0` pins **this** package and example `package.json` dependencies to `@levi-putna/storyboard@1.0.0` (no more seven inter-package pins).
3. Stage README + LICENSE into the published package directory.
4. **One** publish:

```sh
yarn publish:npm --otp=<code-from-your-authenticator>
```

That script becomes “assemble dist if needed, then `npm publish` / `yarn publish` once”. No loop over seven names.

5. Smoke-check:

```bash
npx @levi-putna/storyboard@1.0.0 --help
npx @levi-putna/storyboard@1.0.0 validate examples/hello-explainer/video.json
```

Confirm the npm listing shows the project README.

Logged in as an account that can publish `@levi-putna` (`npm whoami`). Automation tokens can omit `--otp`.

### Versioning

Treat this as a **major**. Import paths change (`@levi-putna/storyboard-core` → `@levi-putna/storyboard`). Suggested first single-package cut: **1.0.0**. Do not ship it as a silent 0.3.x.

After that, one version number. `set-version` only has to touch the published `package.json`, the private root (for repo bookkeeping), and example dependency strings.

### Old packages on npm

Leave 0.3.0 where it is. Do not unpublish.

Deprecate the six library names so installs print a pointer:

```text
npm deprecate @levi-putna/storyboard-core@ "*" "Use @levi-putna/storyboard (core is the package root export)."
```

Same for `media`, `schema`, `transitions`, `renderer`, `preview`. The CLI name stays `@levi-putna/storyboard`; it just grows the authoring exports.

## What has to change in this repo (when we do it)

Not doing this in 0.3.0. When we cut the major:

- Public `exports` and `files` on the one package, as above.
- Build writes into that package’s `dist/*` (or copies each workspace `dist` there before publish).
- `STORYBOARD_PACKAGES` / Vite aliases in `packages/schema/src/package-resolve.ts` resolve subpaths of `@levi-putna/storyboard`, not seven registry names.
- `create` scaffolds import `@levi-putna/storyboard` and `@levi-putna/storyboard/media`.
- Examples and docs (`README`, `AGENT-README`, `.doc/07`, `.doc/10`) drop the `-core` / `-media` names.
- `scripts/publish-packages.mjs` publishes once.
- `development-prepare-release` stops talking about seven packages and lockstep inter-deps.

First Take’s scene kit would import the same package the CLI ships.

## What does not change

- Node 22+.
- Yarn 1 workspaces in git.
- Frame-deterministic React, `video.json`, the CLI commands.
- 2FA on publish (`auth-and-writes`).
- README staging for npmjs.com.

## Review notes

Things to decide before implementation:

1. **Default export.** Is `@levi-putna/storyboard` core-only (scenes import `/media` separately), or a barrel that also re-exports `Audio` / `staticFile`? Core-only matches today’s split and avoids a kitchen-sink root. A barrel is fewer import lines.
2. **Folder vs flatten.** Recommendation: keep `packages/*` privately, assemble one tarball. Flattening into a single `package.json` is optional later.
3. **Deprecate timing.** Deprecate the six names the day 1.0.0 publishes, not before.

Today (0.3.0) still publishes seven packages. This document is the target for the next major, not a description of the current registry.