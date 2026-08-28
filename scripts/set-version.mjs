#!/usr/bin/env node
/**
 * Set the lockstep version across the root workspace, every packages/*
 * folder (including private engine packages), and `first-take` pins in
 * examples.
 *
 * Usage: node scripts/set-version.mjs 0.2.0
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const version = process.argv[2];

if (!version || !/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error("Usage: node scripts/set-version.mjs <semver>");
  process.exit(1);
}

const prefix = "@levi-putna/storyboard";
const cliName = "first-take";

/**
 * Pin first-take and private @levi-putna/storyboard* workspace deps.
 */
function pinStoryboardDeps({ pkg }) {
  for (const key of ["dependencies", "devDependencies", "peerDependencies"]) {
    const block = pkg[key];
    if (!block) continue;
    for (const name of Object.keys(block)) {
      if (
        name === cliName ||
        name === prefix ||
        name.startsWith(`${prefix}-`)
      ) {
        block[name] = version;
      }
    }
  }
}

const jsonFiles = [
  path.join(root, "package.json"),
  ...fs
    .readdirSync(path.join(root, "packages"))
    .map((dir) => path.join(root, "packages", dir, "package.json")),
  ...fs
    .readdirSync(path.join(root, "examples"))
    .map((dir) => path.join(root, "examples", dir, "package.json")),
];

for (const file of jsonFiles) {
  if (!fs.existsSync(file)) continue;
  const pkg = JSON.parse(fs.readFileSync(file, "utf8"));
  const isCli = pkg.name === cliName;
  const isInner =
    typeof pkg.name === "string" &&
    (pkg.name === prefix || pkg.name.startsWith(`${prefix}-`));
  const isRoot = pkg.name === "storyboard";
  if (isCli || isInner || isRoot) {
    pkg.version = version;
  }
  pinStoryboardDeps({ pkg });
  fs.writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
}

console.log(`Set version ${version} on root, packages, and example pins.`);
