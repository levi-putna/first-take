#!/usr/bin/env node
/**
 * Publish the seven public packages to npm in dependency order.
 *
 * Default path is npm web 2FA: the script opens the default browser
 * (Safari when that is the macOS default) and never asks for a typed OTP.
 *
 *   pnpm publish:npm
 *
 * Escape hatch if the user already has a code:
 *
 *   pnpm publish:npm --otp=<code-from-your-authenticator>
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertCliPackIncludesDocs,
  parseNpmJson,
  stageCliDocs,
} from "./stage-cli-docs.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const order = [
  "@levi-putna/storyboard-schema",
  "@levi-putna/storyboard-core",
  "@levi-putna/storyboard-media",
  "@levi-putna/storyboard-transitions",
  "@levi-putna/storyboard-renderer",
  "@levi-putna/storyboard-preview",
  "first-take",
];

/**
 * Map each public package name to its directory under packages/.
 */
function packageDirectories() {
  const packagesDir = path.join(root, "packages");
  const map = new Map();
  for (const dir of fs.readdirSync(packagesDir)) {
    const pkgPath = path.join(packagesDir, dir, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (typeof pkg.name === "string") {
      map.set(pkg.name, path.join(packagesDir, dir));
    }
  }
  return map;
}

/**
 * True when npm redacted the web-auth URL (non-TTY without --json).
 */
function isRedactedUrl({ url }) {
  return !url || url.includes("***") || url.includes("…");
}

/**
 * Open the URL in the OS default browser (Safari when that is the default).
 */
function openInDefaultBrowser({ url }) {
  const result =
    process.platform === "darwin"
      ? spawnSync("open", [url], { stdio: "ignore" })
      : process.platform === "win32"
        ? spawnSync("cmd", ["/c", "start", "", url], { stdio: "ignore" })
        : spawnSync("xdg-open", [url], { stdio: "ignore" });
  if (result.status !== 0 && process.platform === "darwin") {
    spawnSync("open", ["-a", "Safari", url], { stdio: "ignore" });
  }
}

/**
 * Poll npm's doneUrl until the browser ceremony returns a one-time token.
 */
async function pollDoneUrl({ doneUrl, timeoutMs = 300_000 }) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const response = await fetch(doneUrl, {
      headers: {
        accept: "application/json",
        "npm-auth-type": "web",
      },
    });
    if (response.status === 200) {
      const body = await response.json();
      if (typeof body.token === "string" && body.token.length > 0) {
        return body.token;
      }
    }
    if (response.status !== 200 && response.status !== 202) {
      const detail = await response.text();
      throw new Error(
        `npm doneUrl returned ${response.status}: ${detail.slice(0, 400)}`,
      );
    }
    const retryAfter = Number(response.headers.get("retry-after"));
    const waitMs =
      Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 2000;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
  throw new Error(
    "Timed out waiting for npm browser approval (5 minutes). Complete 2FA in Safari and retry.",
  );
}

/**
 * Run `npm publish <dir>` with web auth, capturing JSON for EOTP handling.
 */
function runNpmPublish({ dir, otp }) {
  const args = [
    "publish",
    dir,
    "--access",
    "public",
    "--auth-type=web",
    "--workspaces=false",
    "--json",
  ];
  if (otp) args.push(`--otp=${otp}`);
  return spawnSync("npm", args, {
    cwd: root,
    encoding: "utf8",
    env: process.env,
  });
}

/**
 * Publish one package, opening the default browser when npm demands web 2FA.
 */
async function publishPackage({ name, dir, otp }) {
  console.log(`\n→ npm publish ${path.relative(root, dir)} --access public --auth-type=web`);
  let currentOtp = otp;

  for (;;) {
    const result = runNpmPublish({ dir, otp: currentOtp });
    if (result.status === 0) {
      console.log(`Published ${name}`);
      return currentOtp;
    }

    const parsed = parseNpmJson({
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
    });
    const err = parsed?.error;
    const code = err?.code;

    if (code === "ENEEDAUTH" || code === "E401") {
      throw new Error(
        `Not logged in to npm (${code}). Run npm login --auth-type=web, complete it in Safari, then retry.`,
      );
    }

    const authUrl = err?.authUrl;
    const doneUrl = err?.doneUrl;
    const canWebAuth =
      code === "EOTP" &&
      authUrl &&
      doneUrl &&
      !isRedactedUrl({ url: authUrl }) &&
      !isRedactedUrl({ url: doneUrl });

    if (canWebAuth) {
      console.log(
        "npm needs web 2FA. Opening the default browser (Safari if that is the default).",
      );
      console.log("Complete the prompt there. Do not type an OTP into the terminal.");
      console.log(authUrl);
      openInDefaultBrowser({ url: authUrl });
      currentOtp = await pollDoneUrl({ doneUrl });
      continue;
    }

    if (code === "EOTP" && currentOtp) {
      console.log("Stored web-auth grant was rejected; requesting a fresh browser 2FA.");
      currentOtp = undefined;
      continue;
    }

    const detail = (result.stderr || result.stdout || "").trim();
    throw new Error(
      `Publish failed for ${name}${code ? ` (${code})` : ""}.\n${detail.slice(0, 2000)}`,
    );
  }
}

/**
 * Stage docs, verify the CLI tarball, then publish every public package.
 */
async function main() {
  const otpArg = process.argv.find((arg) => arg.startsWith("--otp="));
  let otp = otpArg ? otpArg.slice("--otp=".length) : process.env.OTP;

  stageCliDocs();
  console.log("Staged packages/cli README.md and LICENSE from the repo root.");
  const packed = assertCliPackIncludesDocs();
  console.log(
    `CLI tarball includes README.md and LICENSE (${packed.length} files).`,
  );

  const dirs = packageDirectories();
  for (const name of order) {
    const dir = dirs.get(name);
    if (!dir) {
      throw new Error(`No packages/* directory found for ${name}`);
    }
    otp = await publishPackage({ name, dir, otp });
  }

  console.log("\nPublished first-take and @levi-putna/storyboard-* packages.");
  console.log("Verify: npx first-take --help");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
