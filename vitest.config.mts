import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    // Integration tests are a separate tier with their own config and an
    // isolated DATABASE_PATH (`npm run test:integration`). Without this exclude
    // they also ran here, where no isolated path is set — so `npm test` wrote
    // fixture rows straight into the developer's `local.db`. e2e is Playwright's.
    exclude: ["**/node_modules/**", "**/e2e/**", "**/*.integration.test.ts"],
  },
})
