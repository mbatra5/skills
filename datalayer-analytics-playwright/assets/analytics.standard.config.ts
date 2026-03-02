/**
 * Playwright config template for standard (non-BDD) analytics dataLayer testing.
 * Adjust paths and settings to match your project structure.
 */
import { defineConfig } from "@playwright/test";
import * as os from "node:os";

export default defineConfig({
  testDir: "./test/analytics", // ← adjust path
  testMatch: "**/*.spec.ts",
  fullyParallel: true,
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 1,

  reporter: [
    ["list"],
    ["html", { open: "never" }],
    [
      "allure-playwright",
      {
        detail: true,
        suiteTitle: true,
        environmentInfo: {
          os_platform: os.platform(),
          os_release: os.release(),
          node_version: process.version,
          test_type: "Analytics_DataLayer",
        },
        categories: [
          { name: "DataLayer Mismatch", messageRegex: ".*DataLayer.*" },
          { name: "Page NotFound", messageRegex: "Error:.*" },
          { name: "Timeout errors", messageRegex: ".*timeout.*" },
        ],
      },
    ],
  ],

  timeout: 60 * 1000,
  expect: { timeout: 30 * 1000 },

  use: {
    headless: process.env.CI ? true : false,
    screenshot: "only-on-failure",
    video: "off",
    trace: "off",
    actionTimeout: 15 * 1000,
  },

  projects: [
    {
      name: "Analytics_DataLayer",
      use: {
        browserName: "chromium",
        viewport: { width: 1920, height: 1080 },
      },
    },
  ],
});
