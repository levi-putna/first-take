---
name: release-publish-packages
id: fbed8c4c-c30f-413a-ad23-bf828479e12d
version: 1.0.0
author: Levi Putna
repo: https://github.com/levi-putna/storyboard
description: >-
  Cut a Storyboard monorepo release (v1 or later) and make @storyboard/*
  packages installable from another private project. Use when asked to
  release, ship v1, publish packages, bump version, tag a release, set up
  private package consumption, or prepare Storyboard for use in another repo.
dependencies:
  - type: cli
    name: gh
    required: true
    description: GitHub CLI for creating the private repo, tags, and releases.
    instructions: Install via `brew install gh`, then run `gh auth login`.
  - type: cli
    name: yarn
    required: true
    description: Yarn 1.x — this repo uses workspaces and yarn scripts.
    instructions: Install Yarn Classic (`npm i -g yarn@1`) or use the repo packageManager.
  - type: cli
    name: ffmpeg
    required: false
    description: Needed only when running render/smoke tests before release.
    instructions: Install via `brew install ffmpeg` on macOS.
---

# Release Storyboard packages

Agent procedure for cutting a versioned release of this Yarn workspaces monorepo
and making `@storyboard/*` consumable from another **private** project.

Read [`references/distribution.md`](references/distribution.md) before choosing
how packages are published. Read
[`references/consumer-install.md`](references/consumer-install.md) when writing
or updating consumer docs.

## Naming

| Field | Value |
|-------|--------|
| Skill | `release-publish-packages` |
| Packages | `@storyboard/schema`, `core`, `media`, `transitions`, `renderer`, `preview`, `cli` |
| Root package | `storyboard` — always `"private": true`; never publish the root |

## Hard rules

- Use **yarn**, not npm, for install/build/test/publish scripts in this repo.
- Never publish the root workspace (`"private": true`).
- Never commit secrets (`.npmrc` with tokens, `.env`). Prefer env vars.
- Do **not** create a git commit or push unless the user explicitly asks.
- Do **not** run `yarn publish` / `gh release create` until the user confirms
  the version, distribution method, and that quality gates passed.
- Keep package versions **in lockstep** across all seven `@storyboard/*`
  packages and the root `version` field (even though root is private).
- Inter-package dependencies must use the **same exact version** string as the
  release (e.g. `"1.0.0"`), not `workspace:*` (Yarn 1 does not rewrite those
  on publish).

---

## Phase 0 — Confirm distribution (stop if unclear)

Ask the user which path to use if they have not already chosen. Summarise the
trade-offs from `references/distribution.md`.

**Recommended for private → private with `@storyboard` scope:**

1. **GitHub org + GitHub Packages** (preferred long-term)  
   Create/use a GitHub organisation named `storyboard`, host the private repo
   there, publish `@storyboard/*` to `https://npm.pkg.github.com`.

2. **GitHub Releases + packed tarballs** (fastest without renaming)  
   Keep the repo under `levi-putna/storyboard`. Build, `yarn pack` each
   package, attach `.tgz` files to a GitHub Release. Consumer installs by URL.

3. **Rename scope to `@levi-putna/*`** (only if user accepts breaking renames)  
   Required if publishing to GitHub Packages under the personal account
   without an org named `storyboard`.

Do not invent a fourth path unless the user asks. Record the choice and continue.

---

## Phase 1 — Repository readiness

Storyboard may not be a git repo yet. Ensure:

1. `git status` works (run `git init` only if the user wants you to initialise).
2. A **private** GitHub remote exists (create with `gh repo create` only when
   asked). Default name suggestion: `storyboard`. Owner: `storyboard` org
   (Packages path) or `levi-putna` (tarball path).
3. Working tree is clean enough to release (no surprise uncommitted release
   blockers). Warn about dirty files; do not discard user work.
4. `.gitignore` excludes `node_modules/`, `dist/`, `out/`, `.env*`, coverage.
5. Root `package.json` remains `"private": true`.

### First-time Packages setup (only for distribution option 1)

For each package under `packages/*/package.json`, ensure:

```json
"publishConfig": {
  "registry": "https://npm.pkg.github.com"
}
```

Repo-root `.npmrc` for **publish** (token via env — do not commit a real token):

```ini
@storyboard:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

The token needs `write:packages` (and `read:packages` for consumers). `gh`
auth with `repo` alone is not enough for Packages publish — warn the user.

---

## Phase 2 — Pre-release quality gates

Run from the repo root, in order. Fix failures before bumping versions.

```bash
yarn install
yarn build
yarn typecheck
yarn lint
yarn test
```

Optional but recommended for a **first v1**:

```bash
yarn test:render
yarn test:smoke
```

Skip optional suites only if the user explicitly accepts shipping without them.
Summarise pass/fail before continuing.

Also verify each publishable package has:

- `"name": "@storyboard/..."`
- `"files"` including `"dist"` (and `preview`'s `"app"` if present)
- `"main"` / `"types"` / `"exports"` pointing at built artefacts
- No `"private": true` on the seven packages (root only)

Confirm `dist/` exists after `yarn build` for every package.

---

## Phase 3 — Version bump

Target version: ask the user. Default for first public-ready cut: **`1.0.0`**.

Update **all** of:

1. Root `package.json` → `"version": "<ver>"`
2. Every `packages/*/package.json` → `"version": "<ver>"`
3. Every `@storyboard/*` dependency / devDependency reference inside those
   package.json files (and root `devDependencies` that pin workspace packages)
   → `"<ver>"`

Do not leave any package at `0.1.0` when releasing `1.0.0`.

Optional: add a short `CHANGELOG.md` entry for the version (Added / Changed /
Fixed). Do not invent a changelog history if none exists — create a minimal
`## 1.0.0` section describing the first stable cut.

---

## Phase 4 — Tag and publish

Rebuild after the version bump so any baked metadata is current:

```bash
yarn build
```

### 4a. Git tag (after user asks to commit / push)

Suggested commit message style:

```text
release: v1.0.0
```

Annotated tag:

```bash
git tag -a v1.0.0 -m "v1.0.0"
git push origin HEAD
git push origin v1.0.0
```

Only run these when the user has approved commit + push.

### 4b. Distribution option 1 — GitHub Packages

Publish each package (order matters for dependency resolution on first install;
schema first, then core, then the rest):

```bash
yarn workspace @storyboard/schema publish --access restricted
yarn workspace @storyboard/core publish --access restricted
yarn workspace @storyboard/media publish --access restricted
yarn workspace @storyboard/transitions publish --access restricted
yarn workspace @storyboard/renderer publish --access restricted
yarn workspace @storyboard/preview publish --access restricted
yarn workspace @storyboard/cli publish --access restricted
```

`--access restricted` keeps packages private on the registry.

If publish fails on auth/scope mismatch, stop and re-read
`references/distribution.md` — do not rename packages without user approval.

### 4c. Distribution option 2 — GitHub Release tarballs

From each package directory after build:

```bash
cd packages/schema && yarn pack --filename ../../out/release/storyboard-schema-1.0.0.tgz
# …repeat for core, media, transitions, renderer, preview, cli
```

Use consistent filenames: `storyboard-<shortname>-<ver>.tgz`.

Create the GitHub Release (user must approve):

```bash
gh release create v1.0.0 \
  out/release/*.tgz \
  --title "v1.0.0" \
  --notes "First stable Storyboard release." \
  --repo OWNER/storyboard
```

Private repo releases require authenticated download URLs for consumers — document
that in `references/consumer-install.md`.

### 4d. Distribution option 3 — renamed scope

Only after explicit user approval: rename every `@storyboard/*` package and
import path / dependency to `@levi-putna/...`, then follow 4b with GitHub
Packages under the personal account. This is a large breaking change; prefer
options 1 or 2.

---

## Phase 5 — Consumer verification

Give the user the install snippet for their chosen distribution (from
`references/consumer-install.md`).

Smoke-check from a throwaway folder only if the user wants you to:

```bash
mkdir -p /tmp/storyboard-consume-check && cd /tmp/storyboard-consume-check
# configure .npmrc or install tarball URLs per distribution
yarn add @storyboard/cli@1.0.0   # or tarball URL
npx storyboard --help            # or yarn storyboard if linked via bin
```

Confirm peer requirements for consumers: Node 22+, FFmpeg, Playwright Chromium
for render (`yarn workspace @storyboard/renderer exec playwright install chromium`
or equivalent after install).

---

## Phase 6 — Post-release checklist

Report back with:

- [ ] Version number released
- [ ] Distribution method used
- [ ] Git tag name (if created)
- [ ] Packages published / assets attached
- [ ] Exact consumer install commands
- [ ] Any follow-ups (CI, changelog, org setup, token scopes)

Do not open a PR or create CI unless asked. Suggest CI as a follow-up only.

---

## Decision cheat sheet

| Situation | Action |
|-----------|--------|
| User says "release v1" with no method | Phase 0 — recommend org + Packages |
| Not a git repo | Phase 1 — init / private `gh repo create` only if asked |
| Tests fail | Stop; fix or get explicit waiver |
| Scope `@storyboard` + personal GitHub Packages | Block; need org or rename or tarballs |
| User says don't push | Stop after local pack/tag prep; no remote publish |
| Patch/minor after v1 | Same skill; bump semver accordingly; skip "first v1" smoke if user wants |
