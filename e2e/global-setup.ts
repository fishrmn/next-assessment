/**
 * Playwright globalSetup — prepares an isolated SQLite file (never `local.db`)
 * for the e2e suite.
 *
 * It deliberately does NOT unlink the database. `playwright.config.ts` sets
 * `reuseExistingServer`, so a dev server left running by a previous run keeps
 * an open handle to this file; deleting it leaves that connection pointing at
 * an unlinked inode and every query then fails with "no such table:
 * blueprints". Clearing the rows in place keeps the inode — and the reused
 * server — valid, which is what makes two consecutive runs work.
 */
import { execSync } from "node:child_process"

import Database from "better-sqlite3"

import { getDatabasePath } from "../src/db/path"

export default function globalSetup() {
  const databasePath = process.env.DATABASE_PATH ?? getDatabasePath()

  execSync("npx drizzle-kit push --force", {
    stdio: "inherit",
    env: { ...process.env, DATABASE_PATH: databasePath },
  })

  const db = new Database(databasePath)
  try {
    db.exec("DELETE FROM blueprints")
  } finally {
    db.close()
  }
}
