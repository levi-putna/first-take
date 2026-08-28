# Single-package publish

**Status:** shipped in `first-take@0.2.0`. Git still has seven folders. npm publishes one tarball.

## Why one

A First Take project always needs both the React APIs and the CLI. Scene files import `useCurrentFrame`; `npx` runs `preview` / `render`. Splitting those across npm names meant two installs of one product, seven OTP publishes, and lockstep versioning that was already treated as a single release.

The seven folders are a convenient way to keep frame-clock code away from Playwright. They are not seven products.

## What consumers get

One install, one name, one version.

```bash
pnpm add -D first-take
npx first-take create my-feature
npx first-take preview video.json
npx first-take render video.json --format=16x9
```

Scene files import from that same package:

```ts
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "first-take";
import { Audio, staticFile, Video } from "first-take/media";
```

The CLI binary is `first-take` (`npx first-take`).

### Public exports

| Import | What it is | Git folder |
|--------|------------|------------|
| `first-take` | Frame clock and layout (`useCurrentFrame`, `AbsoluteFill`, `Sequence`, `interpolate`, `spring`, …) | `packages/core` |
| `first-take/media` | `Img`, `Audio`, `Video`, `staticFile` | `packages/media` |
| `first-take/schema` | `video.json` types and validation | `packages/schema` |
| `first-take/transitions` | `CompositionFromManifest`, `TransitionSeries` | `packages/transitions` |
| `bin`: `first-take` | create / validate / preview / still / render | `packages/cli` |

Renderer and preview stay **inside** the package (`first-take/renderer`, `first-take/preview`, plus `app/` for the studio). Scene authors do not import them.

The published package must **not** depend on `@levi-putna/storyboard-core` (or any of the other old names). If it did, npm would still fetch those packages.

## How a release runs

1. Quality gates (`pnpm build`, `typecheck`, `lint`, `test`).
2. `pnpm set-version 0.2.0` pins `first-take`, the private workspace folders, and example `first-take` dependencies.
3. `pnpm build` compiles each folder, then `scripts/assemble-first-take.mjs` copies engine `dist`s into `packages/cli` and rewrites import specifiers to `first-take` subpaths.
4. `pnpm publish:npm` stages README + LICENSE, pack-checks (`dist/core/index.js` and `app/index.html`), publishes **one** tarball, then deprecates the old names.

## Old packages on npm

Leave previous versions where they are. Do not unpublish.

`scripts/publish-packages.mjs` deprecates:

- `@levi-putna/storyboard`
- `@levi-putna/storyboard-schema`
- `@levi-putna/storyboard-core`
- `@levi-putna/storyboard-media`
- `@levi-putna/storyboard-transitions`
- `@levi-putna/storyboard-renderer`
- `@levi-putna/storyboard-preview`

## What does not change

- Node 22+.
- pnpm workspaces in git.
- Frame-deterministic React, `video.json`, the CLI commands.
- 2FA on publish (browser web auth).
- README staging for npmjs.com.
