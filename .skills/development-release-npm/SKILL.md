---
name: development-release-npm
id: fb70f4ca-cb58-4149-87d2-de88217ff114
version: 1.0.0
author: Levi Putna
repo: https://github.com/levi-putna/storyboard
description: >-
  Publish the Storyboard packages to npm using browser web 2FA (Safari /
  the default browser), not a typed authenticator OTP. Stages the project
  README onto @levi-putna/storyboard with GitHub links for detailed docs,
  then publishes the seven public packages in dependency order. Use when
  asked to publish to npm, run yarn publish:npm, release this package to
  the registry, or finish a release after development-prepare-release.
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
      Used for whoami, pack --dry-run, and publish. Needs npm 11.9+ so
      EOTP errors include authUrl/doneUrl in --json (browser 2FA).
    instructions: Install Node.js 22+ from https://nodejs.org (bundles npm).
requires:
  - id: 09440bb4-561c-4c5b-b1d0-29e6a1c813d8
    name: development-prepare-release
---

# Releasing Storyboard to npm

This is the publish half of a release. `development-prepare-release` reviews,
versions, and changelogs; **this skill actually publishes**. 2FA happens in
the default browser (Safari on this machine). Never ask the user to type an
OTP, and never invent one.

```
Release to npm:
- [ ] 1. Confirm prepare-release is done
- [ ] 2. Confirm npm login (`npm whoami`)
- [ ] 3. Stage README + LICENSE; dry-run the CLI tarball
- [ ] 4. User confirms “publish vX.Y.Z now”
- [ ] 5. yarn publish:npm (opens Safari for web 2FA)
- [ ] 6. Smoke-check npx and the npm README
```

## Naming

| Field | Value |
|-------|--------|
| npx / CLI package | `@levi-putna/storyboard` (`packages/cli`) |
| Libraries | `@levi-putna/storyboard-{schema,core,media,transitions,renderer,preview}` |
| Root | `storyboard` — `"private": true`; never publish the root or `examples/*` |

Publish order: schema → core → media → transitions → renderer → preview → CLI.

## Hard rules

- Use **yarn** for install/build/test. Use **`yarn publish:npm`** for the
  registry (it drives `npm publish` with web 2FA).
- **Never** pass `--otp=` unless the user explicitly supplied a code. The
  default path is browser auth.
- **Never** guess or fabricate an OTP.
- **Never** publish the root workspace or any `examples/*` package.
- **Do not** create a git commit, tag, or push unless the user explicitly asks.
- Never skip the “publish now?” confirmation.
- Today this still publishes **seven** packages. Do not implement the
  single-tarball plan in `.doc/11-single-package-publish.md` from this skill.

---

## 1. Confirm prepare-release is done

This skill assumes `development-prepare-release` has already:

- Run the two check skills and dispositioned findings
- Confirmed the semver bump and changelog
- Run `yarn set-version` and `yarn build`
- Left git shippable (or the user knows the version bump still needs a commit)

If that has not happened in this session, **run `development-prepare-release`
first** and stop after its summary. Do not publish a version the user has not
confirmed.

Report before continuing:

- Repo version (root `package.json`, must match every `@levi-putna/storyboard*`)
- `npm view @levi-putna/storyboard version` (404 is fine on a first publish)
- Confirm the repo version is **not** already on npm

If npm already has this version, stop.

## 2. Confirm npm login

```bash
npm whoami
```

Must be an account that can publish the `@levi-putna` scope. If it fails, run:

```bash
npm login --auth-type=web
```

If npm does not open a window (non-TTY), extract the login URL from the output
and open it with `open <url>` (macOS default browser). Wait until `npm whoami`
succeeds. Never collect a password in the terminal.

## 3. Stage README and dry-run the tarball

The npm listing for `@levi-putna/storyboard` is `packages/cli/README.md`. It is
gitignored and copied from the repo root at publish time, with relative links
rewritten to GitHub so they work on npmjs.com.

```bash
node scripts/stage-cli-docs.mjs --check-pack
```

That command must succeed. It:

- Copies root `README.md` + `LICENSE` into `packages/cli`
- Inserts a banner pointing at https://github.com/levi-putna/storyboard for
  schema, authoring, examples, and the agent playbook
- Rewrites repo-relative links to GitHub blob/raw URLs
- `npm pack --dry-run` and refuses if `README.md` or `LICENSE` are missing

If it fails, stop and fix staging — do not publish a listing without docs.

Show the user that the staged README points at GitHub for detailed docs. The
six library packages stay description-only; their `homepage` already points at
the repo.

## 4. Confirm before publishing

Ask clearly: publish **vX.Y.Z** of the seven `@levi-putna/storyboard*` packages
to the public npm registry now?

Do not proceed without an explicit yes.

## 5. Publish (browser 2FA, no typed OTP)

```bash
yarn publish:npm
```

`scripts/publish-packages.mjs` stages docs again, re-checks the CLI tarball,
then publishes with `npm publish --auth-type=web`. On EOTP it **opens the
default browser** (`open <authUrl>` on macOS — Safari if that is the default)
and polls npm until you finish 2FA there. The short-lived grant is reused for
the remaining packages. If npm rejects reuse, Safari opens again. You should
not be asked to type a code.

Tell the user to look at Safari and complete npm’s prompt. Stay with the
command until it finishes; do not background it and move on.

If they already passed `--otp=` on purpose, `yarn publish:npm --otp=…` still
works as an escape hatch. Do not offer that as the default.

Stop the whole run if any package fails. Do not skip a package and continue.

## 6. Smoke-check

```bash
npx @levi-putna/storyboard@<ver> --help
```

Then:

```bash
npm view @levi-putna/storyboard@<ver> readme
```

Confirm the README is present and mentions the GitHub repository. Optional:
open https://www.npmjs.com/package/@levi-putna/storyboard in the browser.

## 7. Summarise

- Versions published (old npm → new)
- That Safari/web 2FA was used (no typed OTP)
- That the CLI README is on the npm listing and points at GitHub
- Suggested commit/tag if git still has the version bump uncommitted
  (`release: vX.Y.Z`, `git tag -a vX.Y.Z -m "vX.Y.Z"`) — only if they ask

Do not open a PR or create CI unless asked.
