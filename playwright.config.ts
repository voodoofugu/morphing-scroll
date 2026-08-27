import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: "http://localhost:5199",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /touch\.spec\.ts/,
    },
    {
      // touch physics — inertia and the gesture handoff — needs a device with
      // a coarse pointer, which is what the library branches on
      name: "mobile",
      use: { ...devices["Pixel 5"] },
      testMatch: /touch\.spec\.ts/,
    },
  ],
  webServer: {
    command: "vite --config vite.e2e.config.ts",
    url: "http://localhost:5199",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
