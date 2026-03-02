import { expect, Page } from "@playwright/test";
import { DataLayerUtils } from "./datalayer-util"; // ← adjust path
import { AnalyticsLogger } from "./analytics-logger"; // ← adjust path

/**
 * Helper functions for standard Playwright tests (non-BDD).
 * Wraps DataLayerUtils + AnalyticsLogger into simple assertion calls.
 *
 * NEVER MODIFY THIS FILE — fix mismatches by updating component JSON only.
 */

let dlUtils: DataLayerUtils;

export function initDataLayer(page: Page) {
  dlUtils = new DataLayerUtils(page);
}

/**
 * Assert first-match event and clear dataLayer.
 * Use for most cases (one event per name).
 */
export async function expectEvent(
  testData: Record<string, any>,
  eventKey: string,
) {
  const expected = testData[eventKey];
  const actual = await dlUtils.findDataLayerEvent(expected.event);

  await AnalyticsLogger.logDataLayerEvent(eventKey, actual, expected);

  expect(actual, `Event "${expected.event}" not found in dataLayer`).toBeDefined();
  expect(actual).toMatchObject(expected);

  await dlUtils.clearDataLayer();
}

/**
 * Assert deep partial match without clearing.
 * Use when same event name fires multiple times with different nested props.
 */
export async function expectMatchingEvent(
  testData: Record<string, any>,
  eventKey: string,
) {
  const expected = testData[eventKey];
  const actual = await dlUtils.findDataLayerEventMatching(expected);

  await AnalyticsLogger.logDataLayerEvent(eventKey, actual, expected);

  expect(
    actual,
    `No "${expected.event}" event matching expected payload found in dataLayer`,
  ).toBeDefined();
  expect(actual).toMatchObject(expected);
}

/**
 * Assert deep partial match AND clear dataLayer.
 * Use for interaction events on live pages with multiple components.
 */
export async function expectMatchingEventAndClear(
  testData: Record<string, any>,
  eventKey: string,
) {
  const expected = testData[eventKey];
  const actual = await dlUtils.findDataLayerEventMatching(expected);

  await AnalyticsLogger.logDataLayerEvent(eventKey, actual, expected);

  expect(
    actual,
    `No "${expected.event}" event matching expected payload found in dataLayer`,
  ).toBeDefined();
  expect(actual).toMatchObject(expected);

  await dlUtils.clearDataLayer();
}

export async function preventCtaNavigation(selector: string) {
  await dlUtils.preventCtaNavigation(selector);
}

export async function clearDataLayer() {
  await dlUtils.clearDataLayer();
}
