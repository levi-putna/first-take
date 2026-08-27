#!/usr/bin/env node
/**
 * Publish the seven public packages to npm in dependency order.
 *
 * Never run this from an agent session. Hand the command to the user so they
 * can supply a one-time password:
 *
 *   yarn publish:npm --otp=<code-from-your-authenticator>
 *
 * An npm Automation token (2FA bypass) can omit --otp.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stageCliDocs } from "./stage-cli-docs.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

stageCliDocs();
console.log("Staged packages/cli README.md and LICENSE from the repo root.");

const otpArg = process.argv.find((arg) => arg.startsWith("--otp="));
const otp = otpArg ? otpArg.slice("--otp=".length) : process.env.OTP;

const order = [
  "@levi-putna/storyboard-schema",
  "@levi-putna/storyboard-core",
  "@levi-putna/storyboard-media",
  "@levi-putna/storyboard-transitions",
  "@levi-putna/storyboard-renderer",
  "@levi-putna/storyboard-preview",
  "@levi-putna/storyboard",
];

for (const name of order) {
  const args = ["workspace", name, "publish", "--access", "public"];
  if (otp) args.push(`--otp=${otp}`);
  console.log(`\n→ yarn ${args.join(" ")}`);
  const result = spawnSync("yarn", args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`Publish failed for ${name}`);
    process.exit(result.status ?? 1);
  }
}

console.log("\nPublished all @levi-putna/storyboard* packages.");
console.log("Verify: npx @levi-putna/storyboard --help");
