#!/usr/bin/env node
// Pack the MCP server (and its UI bundle) into a .mcpb extension file.
//
// Steps:
//   1. Ensure the workspace is built (dist/ for both packages).
//   2. Stage the .mcpb contents:
//        staging/
//          manifest.json
//          server/
//            package.json       (prod deps only)
//            main.js, server.js, ui.html
//            node_modules/      (real files, not pnpm symlinks)
//      We install deps with `npm install --omit=dev` inside server/ rather
//      than `pnpm deploy`, because pnpm's symlinked store doesn't survive
//      the zip step cleanly.
//   3. Invoke `mcpb pack <staging> <out>` to produce the .mcpb zip.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const mcpPkgDir = path.join(repoRoot, "packages", "mcp");
const outDir = path.join(repoRoot, "build");
const stagingDir = path.join(outDir, "mcpb-staging");
const serverDir = path.join(stagingDir, "server");
const outFile = path.join(outDir, "react-mcp-spa.mcpb");

function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: repoRoot,
    shell: false,
    ...opts,
  });
  if (result.status !== 0) {
    throw new Error(`${cmd} ${args.join(" ")} exited with ${result.status}`);
  }
}

function rmrf(p) {
  fs.rmSync(p, { recursive: true, force: true });
}

// 1. Build the workspace so packages/mcp/dist exists (including ui.html).
console.log("→ Building workspace");
run("pnpm", ["run", "build"]);

const builtUi = path.join(mcpPkgDir, "dist", "ui.html");
if (!fs.existsSync(builtUi)) {
  throw new Error(`Expected ${builtUi} after build; did copy-ui run?`);
}

// 2. Stage the bundle.
console.log("→ Staging .mcpb contents");
rmrf(stagingDir);
fs.mkdirSync(serverDir, { recursive: true });

// Manifest lives at the root of the bundle.
fs.copyFileSync(
  path.join(repoRoot, "mcpb", "manifest.json"),
  path.join(stagingDir, "manifest.json"),
);

// Compiled server files (skip source maps to keep the bundle small).
for (const file of fs.readdirSync(path.join(mcpPkgDir, "dist"))) {
  if (file.endsWith(".map")) continue;
  fs.copyFileSync(
    path.join(mcpPkgDir, "dist", file),
    path.join(serverDir, file),
  );
}

// Write a minimal package.json for server/: keeps ESM resolution working and
// lists just the prod deps we actually need at runtime.
const srcPkg = JSON.parse(
  fs.readFileSync(path.join(mcpPkgDir, "package.json"), "utf-8"),
);
const bundlePkg = {
  name: "react-mcp-spa-server",
  version: srcPkg.version,
  private: true,
  type: "module",
  dependencies: srcPkg.dependencies,
};
fs.writeFileSync(
  path.join(serverDir, "package.json"),
  JSON.stringify(bundlePkg, null, 2),
);

// Install prod deps as a real (non-symlinked) tree using npm. This is slower
// than pnpm deploy but produces a node_modules layout that zips cleanly.
console.log("→ Installing prod deps into staging (npm install --omit=dev)");
run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund", "--silent"], {
  cwd: serverDir,
});
// npm writes a package-lock.json we don't want shipped.
rmrf(path.join(serverDir, "package-lock.json"));

// 3. Pack with the official mcpb CLI.
console.log("→ Packing .mcpb");
rmrf(outFile);
run("pnpm", ["exec", "mcpb", "pack", stagingDir, outFile]);

const size = fs.statSync(outFile).size;
console.log(
  `\n.mcpb created: ${path.relative(repoRoot, outFile)}  (${(size / 1024 / 1024).toFixed(2)} MiB)`,
);
