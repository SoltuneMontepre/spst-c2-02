import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const lockPath = join(process.cwd(), ".next/dev/lock");

interface DevLock {
  pid: number;
  port: number;
  appUrl: string;
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

// Docker app on 3000 breaks local dev (localhost → IPv6 hits container).
try {
  execSync("docker compose stop app", { stdio: "ignore", cwd: process.cwd() });
} catch {
  // docker not running — fine
}

if (!existsSync(lockPath)) {
  process.exit(0);
}

const force = process.argv.includes("--force");

try {
  const lock = JSON.parse(readFileSync(lockPath, "utf8")) as DevLock;
  if (lock.pid && isAlive(lock.pid)) {
    if (!force) {
      console.error(
        `Dev server already running (PID ${lock.pid}, ${lock.appUrl ?? `port ${lock.port}`}). Stop it first, or: bun run dev:unlock -- --force`,
      );
      process.exit(1);
    }
    try {
      process.kill(lock.pid);
      console.log(`Stopped dev server PID ${lock.pid}`);
    } catch {
      // already gone
    }
  }
} catch {
  // unreadable lock — remove below
}

try {
  unlinkSync(lockPath);
  console.log("Removed .next/dev lock");
} catch {
  // no lock left
}
