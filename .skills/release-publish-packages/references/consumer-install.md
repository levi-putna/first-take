# Consumer install

Snippets for installing Storyboard from another private project after a
release. Replace `1.0.0` / owner / URLs with the actual release.

Consumers need: **Node 22+**, **Yarn 1.x** (or compatible), **FFmpeg**, and
Chromium via Playwright for renders.

## Option 1 — GitHub Packages

In the consumer repo, add `.npmrc` (do not commit a raw token; use env):

```ini
@storyboard:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

`GITHUB_TOKEN` (or a classic PAT) needs `read:packages` and access to the
private packages / org.

Install what the consumer needs (typical authoring + render set):

```bash
yarn add @storyboard/cli@1.0.0 @storyboard/core@1.0.0 @storyboard/schema@1.0.0 @storyboard/media@1.0.0 @storyboard/transitions@1.0.0 @storyboard/renderer@1.0.0 @storyboard/preview@1.0.0
```

Or a minimal CLI-driven workflow:

```bash
yarn add @storyboard/cli@1.0.0
```

Peer / runtime follow-ups:

```bash
# React peers if authoring scenes in the consumer app
yarn add react@^19 react-dom@^19

# Chromium for @storyboard/renderer
yarn exec playwright install chromium
# or, depending on layout:
# yarn workspace @storyboard/renderer exec playwright install chromium
```

Ensure `ffmpeg` / `ffprobe` are on `PATH`.

## Option 2 — Release tarballs

After `gh release create` attached `out/release/*.tgz` assets, install by
URL. For a **private** repo, use authenticated URLs (GitHub API / `gh`
download) or a machine-user token — raw anonymous HTTPS URLs will 404.

Example once you have downloadable HTTPS URLs (public release or tokenised):

```bash
yarn add \
  https://github.com/OWNER/storyboard/releases/download/v1.0.0/storyboard-schema-1.0.0.tgz \
  https://github.com/OWNER/storyboard/releases/download/v1.0.0/storyboard-core-1.0.0.tgz \
  https://github.com/OWNER/storyboard/releases/download/v1.0.0/storyboard-media-1.0.0.tgz \
  https://github.com/OWNER/storyboard/releases/download/v1.0.0/storyboard-transitions-1.0.0.tgz \
  https://github.com/OWNER/storyboard/releases/download/v1.0.0/storyboard-renderer-1.0.0.tgz \
  https://github.com/OWNER/storyboard/releases/download/v1.0.0/storyboard-preview-1.0.0.tgz \
  https://github.com/OWNER/storyboard/releases/download/v1.0.0/storyboard-cli-1.0.0.tgz
```

Install **all** interdependent tarballs in one command so Yarn can resolve
`@storyboard/*` dependencies against the packed versions.

Helper for private assets:

```bash
gh release download v1.0.0 --repo OWNER/storyboard --dir ./vendor/storyboard
yarn add ./vendor/storyboard/*.tgz
```

## Option 3 — Renamed `@levi-putna/*` scope

Same as Option 1, but `.npmrc` uses `@levi-putna:registry=…` and package
names match the renamed scope.

## Sanity check

```bash
yarn storyboard --help
# or
npx storyboard --help
```

Then validate a sample `video.json` from the consumer project.
