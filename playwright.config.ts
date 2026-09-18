import { defineConfig, devices } from "@playwright/test"

const DATABASE_PATH = "./local.e2e-test.db"
process.env.DATABASE_PATH = DATABASE_PATH

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: true,
  // The suite runs against `next dev`, which compiles each route on demand.
  // With an unbounded worker count a dozen cold navigations arrive at once and
  // hydration can take longer than any reasonable per-test wait — which showed
  // up as a different test failing each run on a still-disabled button. Four
  // keeps the suite parallel without starving the dev server.
  workers: 4,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    env: { DATABASE_PATH },
  },
})
