#!/usr/bin/env bun
/**
 * Syncs Figma MCP skills from github.com/figma/mcp-server-guide into .agents/skills/.
 *
 * Steps:
 *   1. Clone the repo with sparse-checkout (skills/ only, blobless filter) into a temp dir.
 *   2. Copy skill folders into <workspace-root>/.agents/skills/, skipping any in BLACKLIST.
 *   3. Remove the temp dir (cleanup).
 *
 * Usage: bun scripts/skills-sync.ts
 */

import { execSync } from "child_process";
import { readdirSync } from "fs";
import { cpSync, rmSync, existsSync, mkdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";

const REPO_URL = "https://github.com/figma/mcp-server-guide.git";

/**
 * Skill folder names to exclude from the sync.
 * Add or remove entries here to control which skills are copied.
 */
const BLACKLIST: string[] = [
  "figma-use-slides",
  "figma-swiftui",
  "figma-use-figjam",
];
const SKILLS_SUBDIR = "skills";

// Resolve workspace root: this script lives at app/scripts/
const WORKSPACE_ROOT = resolve(import.meta.dir, "../..");
const DEST_DIR = join(WORKSPACE_ROOT, ".agents", "skills");

const tmpDir = join(tmpdir(), `figma-mcp-${randomUUID()}`);

function log(msg: string) {
  console.log(`[skills-sync] ${msg}`);
}

function run(cmd: string, cwd?: string) {
  execSync(cmd, { stdio: "inherit", cwd });
}

// ── 1. Clone ─────────────────────────────────────────────────────────────────
log(`Cloning ${REPO_URL} (sparse, skills/ only) → ${tmpDir}`);
run(`git clone --filter=blob:none --sparse --depth=1 ${REPO_URL} "${tmpDir}"`);
run(`git sparse-checkout set ${SKILLS_SUBDIR}`, tmpDir);

const srcDir = join(tmpDir, SKILLS_SUBDIR);
if (!existsSync(srcDir)) {
  console.error(`[skills-sync] ERROR: '${SKILLS_SUBDIR}/' not found after sparse checkout.`);
  rmSync(tmpDir, { recursive: true, force: true });
  process.exit(1);
}

// ── 2. Copy (excluding blacklisted skill folders) ────────────────────────────
log(`Copying ${SKILLS_SUBDIR}/ → ${DEST_DIR} (blacklist: ${BLACKLIST.join(", ")})`);
if (!existsSync(DEST_DIR)) {
  mkdirSync(DEST_DIR, { recursive: true });
}

const entries = readdirSync(srcDir);
let copied = 0;
let skipped = 0;
for (const entry of entries) {
  const entryPath = join(srcDir, entry);
  if (!statSync(entryPath).isDirectory()) continue; // only process skill folders

  if (BLACKLIST.includes(entry)) {
    log(`  ↷ skipping  ${entry}`);
    skipped++;
    continue;
  }

  log(`  ✓ copying   ${entry}`);
  cpSync(entryPath, join(DEST_DIR, entry), { recursive: true, force: true });
  copied++;
}
log(`Copied ${copied} skill(s), skipped ${skipped} blacklisted.`);

// ── 3. Cleanup ────────────────────────────────────────────────────────────────
log(`Cleaning up temp dir: ${tmpDir}`);
rmSync(tmpDir, { recursive: true, force: true });

log("Done ✓  Skills synced successfully.");
