/**
 * Playwright config template for analytics dataLayer testing.
 * Adjust paths and settings to match your project structure.
 */
import { defineConfig } from "@playwright/test";
import { defineBddConfig } from "playwright-bdd";
import * as os from "node:os";

const testDir = defineBddConfig({
  features: ["./test/analytics/**/*.feature"], // ← adjust path
  steps: ["./test/analytics/**/*.ts", "./config/fixture.ts"], // ← adjust path
  featuresRoot: "./test/analytics/",
});

export default defineConfig({
  testDir,
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
