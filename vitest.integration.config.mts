import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// Set before `defineConfig` evaluates so both globalSetup and every test
// file (via `@/db` -> `src/db/path.ts`) see the isolated path — never the
// dev `local.db`.
//
// A fixed path on purpose: this config is re-evaluated in vitest's worker
// processes, so deriving the name from anything process-local (a pid, a
// timestamp) hands each worker a different database. The setup script makes
// the path safe to share by clearing rows instead of unlinking the file.
process.env.DATABASE_PATH = "./local.integration-test.db"

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    include: ["**/*.integration.test.ts"],
    globalSetup: "./scripts/integration-test-setup.ts",
  },
})
