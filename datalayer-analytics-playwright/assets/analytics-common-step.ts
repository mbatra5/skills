/**
 * Shared Given/Then steps for all analytics component tests.
 * Provides generic navigation and dataLayer assertion logic.
 *
 * NEVER MODIFY THIS FILE — fix mismatches by updating component JSON only.
 *
 * Adjust the import paths below to match your project structure.
 */
import { Given, Then, Before } from "../config/fixture"; // ← adjust path
import { DataLayerUtils } from "../utils/datalayer-util"; // ← adjust path
import { AnalyticsLogger } from "../utils/analytics-logger"; // ← adjust path

let dataLayerUtils: DataLayerUtils;
let currentTestData: any;

Before(async function () {
  dataLayerUtils = new DataLayerUtils(this.page);
});

/**
 * Navigate to a component's analytics test page.
 * Loads JSON test data and caches it for Then steps.
 */
Given(
  "I am on the {string} analytics {string} page",
  async function (component: string, variant: string) {
    currentTestData = require(`./{component}/{component}.json`);
    const baseUrl = process.env.BASE_URL || "";
    const url = baseUrl + currentTestData[variant];
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: "networkidle" });
    await this.page.waitForTimeout(1500);
  },
);

/**
 * Navigate to a nested variant page.
 * Resolves JSON from: ./{component}/{subfolder}/{subfolder}.json
 */
Given(
  "I am on the {string} analytics {string} variant {string} page",
  async function (component: string, subfolder: string, variant: string) {
    currentTestData = require(`./{component}/{subfolder}/{subfolder}.json`);
    const baseUrl = process.env.BASE_URL || "";
    const url = baseUrl + currentTestData[variant];
    console.log(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: "networkidle" });
    await this.page.waitForTimeout(1500);
  },
);

/**
 * Assert first-match event and clear dataLayer.
 * Use for most cases (one event per name).
 */
Then(
  "the dataLayer should contain expected {string} event",
  async function (eventType: string) {
    const expected = currentTestData[eventType];
    const actual = await dataLayerUtils.findDataLayerEvent(expected.event);

    await AnalyticsLogger.logDataLayerEvent(eventType, actual, expected);

    this.expect(actual, `Event "${expected.event}" not found`).toBeDefined();
    this.expect(actual).toMatchObject(expected);

    await dataLayerUtils.clearDataLayer();
  },
);

/**
 * Assert deep partial match without clearing.
 * Use when same event name fires multiple times with different nested props.
 */
Then(
  "the dataLayer should contain a matching {string} event",
  async function (eventType: string) {
    const expected = currentTestData[eventType];
    const actual = await dataLayerUtils.findDataLayerEventMatching(expected);

    await AnalyticsLogger.logDataLayerEvent(eventType, actual, expected);

    this.expect(
      actual,
      `No "${expected.event}" event matching expected payload found in dataLayer`,
    ).toBeDefined();
    this.expect(actual).toMatchObject(expected);
  },
);

/**
 * Assert deep partial match AND clear dataLayer.
 * Use for interaction events on live pages with multiple components.
 */
Then(
  "the dataLayer should contain a matching {string} event and clear",
  async function (eventType: string) {
    const expected = currentTestData[eventType];
    const actual = await dataLayerUtils.findDataLayerEventMatching(expected);

    await AnalyticsLogger.logDataLayerEvent(eventType, actual, expected);

    this.expect(
      actual,
      `No "${expected.event}" event matching expected payload found in dataLayer`,
    ).toBeDefined();
    this.expect(actual).toMatchObject(expected);

    await dataLayerUtils.clearDataLayer();
  },
);
