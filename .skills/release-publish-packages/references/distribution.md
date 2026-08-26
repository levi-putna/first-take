# Distribution options

How another **private** project can depend on `@storyboard/*`.

## Why this choice matters

This monorepo publishes **seven** packages (`schema`, `core`, `media`,
`transitions`, `renderer`, `preview`, `cli`). Yarn Classic cannot install a
single workspace subdirectory from a git URL. Consumers need either:

- a package registry, or
- explicit tarball URLs (or equivalent), or
- a renamed scope that matches a GitHub Packages owner.

GitHub Packages requires the npm **scope** to match the GitHub **owner**
(user or org). Packages are named `@storyboard/*`, so Packages under the
personal account `levi-putna` will **reject** publish unless the scope is
renamed. An organisation literally named `storyboard` satisfies the rule
without renaming.

## Option 1 — GitHub organisation + GitHub Packages (recommended)

**When:** You want normal `yarn add @storyboard/cli` semantics and private
packages.

**Setup:**

1. Create a private GitHub org named `storyboard` (or use an existing one
   with that exact login).
2. Host this repository as a private repo under that org.
3. Add `publishConfig.registry` = `https://npm.pkg.github.com` on each
   package.
4. Authenticate with a token that has `write:packages` / `read:packages`.
5. `yarn workspace @storyboard/<pkg> publish --access restricted`.

**Pros:** Semver ranges, lockfiles, CI-friendly, familiar DX.  
**Cons:** Needs an org named `storyboard` (or you rename packages).

## Option 2 — GitHub Releases + `yarn pack` tarballs

**When:** Repo stays under `levi-putna/storyboard` and you refuse renaming
or creating an org for v1.

**Setup:**

1. `yarn build`
2. `yarn pack` each package into `out/release/*.tgz`
3. `gh release create vX.Y.Z` attaching those assets (private repo OK)
4. Consumer installs via release asset URLs (auth required for private repos)

**Pros:** No scope rename, no org, no registry.  
**Cons:** Awkward version bumps, seven URLs, private download auth, no
semver ranges from a registry.

## Option 3 — Rename to `@levi-putna/*` + GitHub Packages

**When:** User explicitly accepts renaming every package and import.

**Pros:** Works with personal GitHub Packages.  
**Cons:** Breaking; updates every package.json, docs, examples, and
consumer imports.

## Rejected / local-only (do not recommend for remote private projects)

| Approach | Why not for v1 remote consume |
|----------|-------------------------------|
| `git+ssh://…#v1.0.0` on the monorepo root | Installs the private root, not workspace packages |
| `file:../storyboard/packages/cli` | Only works when both repos are on the same machine |
| `yalc` / `yarn link` | Local linking; fragile for CI and teammates |

## Decision default

If the user has no preference: **Option 1**. If they want the shortest path
to a first tagged release under `levi-putna` without org setup: **Option 2**.
