import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
const NO_DB_PORT = 3101;
const env = { SESSION_SECRET: "e2e-secret-e2e-secret-e2e-secret-123456" };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: `http://localhost:${PORT}`, trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], permissions: ["clipboard-read", "clipboard-write"] },
      testIgnore: /no-database/,
    },
    {
      name: "mobile-360",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 360, height: 740 },
        permissions: ["clipboard-read", "clipboard-write"],
      },
      testMatch: /viewer-search|report/,
    },
    {
      name: "no-database",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: `http://localhost:${NO_DB_PORT}`,
        permissions: ["clipboard-read", "clipboard-write"],
      },
      testMatch: /no-database/,
    },
  ],
  webServer: [
    {
      command: `npx next start -p ${PORT}`,
      port: PORT,
      reuseExistingServer: !process.env.CI,
      env: { ...env, DATA_BACKEND: "memory" },
      timeout: 120_000,
    },
    {
      command: `npx next start -p ${NO_DB_PORT}`,
      port: NO_DB_PORT,
      reuseExistingServer: !process.env.CI,
      env: { ...env, DATA_BACKEND: "failing" },
      timeout: 120_000,
    },
  ],
});
