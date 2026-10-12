import { defineConfig, devices } from "@playwright/test";

const PORT = 4329;
const baseURL = `http://localhost:${PORT}/rules/`;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    // Tests use paths without a leading slash (`games/`) so they stay under /rules/.
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    // Mimics GitHub Pages; run `npm run build` first.
    command: `node scripts/serve-dist.mjs ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
});
