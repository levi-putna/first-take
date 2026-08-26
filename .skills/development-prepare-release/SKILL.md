---
name: development-prepare-release
id: 09440bb4-561c-4c5b-b1d0-29e6a1c813d8
version: 1.0.0
author: Levi Putna
repo: https://github.com/levi-putna/storyboard
description: >-
  Prepare a Storyboard npm release: run the code-review and docs-readiness
  checks, confirm the semver bump and changelog, lockstep-version all
  @levi-putna/storyboard* packages, verify git is shippable, and hand back
  the exact yarn publish:npm --otp= command. Use when asked to cut a
  release, publish to npm, bump version, or get this ready for npx
  @levi-putna/storyboard.
dependencies:
  - type: cli
    name: yarn
    required: true
    description: Yarn 1.x — this repo uses workspaces and yarn scripts.
    instructions: Install Yarn Classic (`npm i -g yarn@1`) or use the repo packageManager.
  - type: cli
    name: npm
    required: true
    description: >-
      Used to check the published version (`npm view @levi-putna/storyboard
      version`) and for the user-run publish command.
    instructions: Install Node.js (bundles npm) from https://nodejs.org.
  - type: cli
    name: gh
    required: false
    description: Used to double-check the GitHub remote and optional tags.
    instructions: Install via `brew install gh`, then run `gh auth login`.
requires:
  - id: 56824965-a4de-4b74-bf8d-5d04b598de77
    name: development-review-code
  - id: 7c6ec2da-59e5-4832-abf4-a8c477b47f84
    name: development-check-release-readiness
---

# Preparing a Storyboard release

Orchestrates the two check skills, decides the version bump, updates the
changelog, locksteps every publishable package, verifies nothing is
stranded locally, and **stops short of the one step that needs a human:
publishing to npm**.

Same shape as `dot-skills` (`development-prepare-release`) and the same
confirm-each-gate style as MarkDoc. The publish target is public npm so
consumers can run `npx @levi-putna/storyboard`.

```
Release progress:
- [ ] 1. Run the two check skills
- [ ] 2. Show current versions
- [ ] 3. Confirm the new version
- [ ] 4. Confirm changelog notes
- [ ] 5. Quality gates
- [ ] 6. Bump lockstep versions
- [ ] 7. Verify git is shippable
- [ ] 8. Hand back the publish command (do not run it)
```

## Naming

| Field | Value |
|-------|--------|
| npx / CLI package | `@levi-putna/storyboard` (`packages/cli`, bin `storyboard`) |
| Libraries | `@levi-putna/storyboard-{schema,core,media,transitions,renderer,preview}` |
| Root | `storyboard` — always `"private": true`; never publish the root or `examples/*` |

## Hard rules

- Use **yarn**, not npm, for install/build/test in this repo.
- **Never** run `yarn publish:npm`, `yarn workspace … publish`, or `npm publish`
  yourself, with or without `--otp`. Never guess or fabricate an OTP.
- **Never** publish the root workspace or any `examples/*` package.
- Do **not** create a git commit or push unless the user explicitly asks.
- Keep package versions **in lockstep**. Use `yarn set-version <ver>` —
  do not hand-edit eight `package.json` files.
- Inter-package dependencies must use the **same exact version** string
  (Yarn 1 does not rewrite `workspace:*` on publish).
- Never skip the version-confirm or changelog-confirm steps.

---

## 1. Run the two check skills first

Run `development-review-code` against everything changed since the last
published version (diff against the last release tag, or against the
version currently on npm if there is no tag).

Run `development-check-release-readiness` the same way.

**Do not proceed if either skill has findings the user has not
dispositioned yet.** Surface them and wait.

## 2. Show current versions

Report both before asking anything:

- **Repo version**: root `package.json` `"version"` (must match every
  `@levi-putna/storyboard*` package).
- **Latest on npm**: `npm view @levi-putna/storyboard version`
  (404 / not found is expected before the first publish — say so).
- **Latest git tag**: `git fetch --tags && git tag --list --sort=-v:refname | head -1`.

If the repo version already matches npm and there is no unpublished work,
say so and ask whether to proceed anyway.

## 3. Confirm the new version

Classify the change since the last published version (or the full history
on a first publish) with semver, favouring the higher tier when ambiguous:

- **MAJOR**: removed/renamed a command or flag, changed `video.json` in a
  breaking way, renamed a public package or authoring import.
- **MINOR**: new backward-compatible command, flag, or authoring API.
- **PATCH**: bug fixes, docs, internal refactors with no user-visible break.

Default for the first npm cut: **`1.0.0`** (or keep `0.1.0` if the user
wants a first public pre-1.0). Propose the exact number and **wait for
confirmation** before changing files.

## 4. Confirm changelog notes

Draft a [Keep a Changelog](https://keepachangelog.com/) entry from
`git log <last-tag>..HEAD` (or full history if there is no tag). Present
it and get confirmation or edits — do not invent features that are not
in the log.

Once confirmed, add the dated section at the top of `CHANGELOG.md`
(below the header), moving items out of `## [Unreleased]` as needed.

## 5. Quality gates

Run from the repo root, in order. Stop and report every failure together
rather than releasing on a red build:

```bash
yarn install
yarn build
yarn typecheck
yarn lint
yarn test
```

Optional but recommended for a first public cut (skip only with an
explicit waiver):

```bash
yarn test:render
yarn test:smoke
```

Also verify each publishable package has:

- `"name"` under `@levi-putna/storyboard` / `@levi-putna/storyboard-*`
- `"publishConfig": { "access": "public" }`
- `"files"` including `"dist"` (`preview` also includes `"app"`)
- `"main"` / `"types"` / `"exports"` pointing at built artefacts
- No `"private": true` (root and examples only)
- CLI has `"bin": { "storyboard": "./dist/cli.js" }`

Confirm `dist/` exists after `yarn build` for every package.

## 6. Bump lockstep versions

After the user confirms the version:

```bash
yarn set-version <ver>
yarn build
```

Check that no `@levi-putna/storyboard*` dependency is still on the old
version. The CLI reads its version from `packages/cli/package.json` at
runtime — do not hardcode it in `cli.ts`.

## 7. Verify git is shippable

- `git status` must be clean enough to ship. If the changelog/version
  bump is still uncommitted, tell the user what needs committing; do not
  commit on their behalf without asking.
- The current branch should be pushed (`git status -sb`). If anything is
  unpushed, say so and ask before pushing.
- Suggested commit message if they ask you to commit: `release: vX.Y.Z`
- Suggested annotated tag (only if they ask): `git tag -a vX.Y.Z -m "vX.Y.Z"`

## 8. Hand back the publish command — do not run it

Once everything above is clean, give the user **exactly**:

```sh
yarn publish:npm --otp=<code-from-your-authenticator>
```

That script publishes the seven packages in dependency order (schema →
core → media → transitions → renderer → preview → CLI). An npm
**Automation** token can omit `--otp`.

After they publish, they should smoke-check:

```bash
npx @levi-putna/storyboard@<ver> --help
```

First-time npm: they must be logged in to an account that can publish
the `@levi-putna` scope (`npm whoami`, `npm login`).

## 9. Summarise

Old version → new version, the changelog entry, git clean/pushed status,
the publish command from step 8, and the npx verify command. Do not open
a PR or create CI unless asked.
