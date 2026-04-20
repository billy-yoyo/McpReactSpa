#!/usr/bin/env node
// Copy the UI's single-file HTML bundle next to the compiled server, so the
// server is self-contained at runtime and can be shipped inside a .mcpb.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const mcpRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(mcpRoot, "..", "..");

const src = path.join(repoRoot, "packages", "ui", "dist", "index.html");
const dst = path.join(mcpRoot, "dist", "ui.html");

if (!fs.existsSync(src)) {
  console.error(
    `UI bundle not found at ${src}. Run \`pnpm run build:ui\` first.`,
  );
  process.exit(1);
}

fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.copyFileSync(src, dst);
console.log(`Copied UI bundle → ${path.relative(repoRoot, dst)}`);
