/**
 * Vitest globalSetup for the integration test tier. Prepares an isolated
 * SQLite file (never `local.db`) before the suite runs.
 *
 * It deliberately does NOT unlink the database. Deleting the file on both
 * setup and teardown meant two overlapping runs removed it out from under
 * each other's open connection, which surfaced as an unrelated-looking crash
 * inside `sqlite.pragma(...)`. Clearing the rows in place gives each run the
 * same clean slate without ever invalidating a live handle.
 */
import { execSync } from "node:child_process"

import Database from "better-sqlite3"

import { getDatabasePath } from "../src/db/path"

export default function setup() {
  const databasePath = getDatabasePath()

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
