#!/usr/bin/env node
// Reads or bumps the version of a BitFinance app.
//
//   node scripts/bump-version.mjs <app>                 prints the current version
//   node scripts/bump-version.mjs <app> <bump|version>  writes the new version and prints it
//
// <app> is backend, frontend or mcp-server. <bump> is patch, minor or major;
// an exact version such as 1.2.3 or 1.3.0-beta.1 is also accepted.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const csprojVersion = /<Version>([^<]+)<\/Version>/;

const apps = {
  backend: csproj("apps/backend/src/BitFinance.API/BitFinance.API.csproj"),
  "mcp-server": csproj("apps/mcp-server/src/BitFinance.MCP.csproj"),
  frontend: packageJson("apps/frontend/package.json"),
};

const semver = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/;

const [appName, requested] = process.argv.slice(2);
const app = apps[appName];

if (!app) {
  fail(`Usage: bump-version.mjs <${Object.keys(apps).join("|")}> [patch|minor|major|x.y.z]`);
}

const current = app.read();
if (!semver.test(current)) {
  fail(`${app.file} has an invalid version: '${current}'.`);
}

if (!requested) {
  console.log(current);
  process.exit(0);
}

const next = nextVersion(current, requested);
app.write(next);
console.log(next);

function nextVersion(version, bump) {
  if (semver.test(bump)) {
    return bump;
  }

  const [, majorText, minorText, patchText, prerelease] = version.match(semver);
  const [major, minor, patch] = [majorText, minorText, patchText].map(Number);

  switch (bump) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
      // A prerelease such as 1.3.0-beta.1 is released as 1.3.0, matching `npm version patch`.
      return prerelease === undefined ? `${major}.${minor}.${patch + 1}` : `${major}.${minor}.${patch}`;
    default:
      fail(`Invalid version '${bump}'. Use patch, minor, major or an exact semver such as 1.2.3.`);
  }
}

function csproj(file) {
  const path = resolve(root, file);
  return {
    file,
    read() {
      const match = readFileSync(path, "utf8").match(csprojVersion);
      if (!match) {
        fail(`${file} must define a <Version> value.`);
      }
      return match[1].trim();
    },
    write(version) {
      const content = readFileSync(path, "utf8");
      writeFileSync(path, content.replace(csprojVersion, `<Version>${version}</Version>`));
    },
  };
}

function packageJson(file) {
  const path = resolve(root, file);
  return {
    file,
    read() {
      return JSON.parse(readFileSync(path, "utf8")).version ?? "";
    },
    write(version) {
      // Replace in place so the file keeps its formatting and key order.
      const content = readFileSync(path, "utf8");
      writeFileSync(path, content.replace(/("version"\s*:\s*")[^"]*(")/, `$1${version}$2`));
    },
  };
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
