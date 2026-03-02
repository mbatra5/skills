import { test } from "@playwright/test";
import {
  initDataLayer,
  expectEvent,
} from "../../../../utils/analytics-helpers"; // ← adjust path
import ButtonAnalytics from "./button-pageobject";
import testData from "./button.json";

const BASE_URL = process.env.BASE_URL || "";

test.describe("Button - DataLayer Analytics", { tag: ["@analytics", "@button"] }, () => {
  let buttonPage: ButtonAnalytics;

  test.beforeEach(async ({ page }) => {
    initDataLayer(page);
    buttonPage = new ButtonAnalytics(page);
    await page.goto(BASE_URL + testData.primaryButton, {
      waitUntil: "networkidle",
    });
    await page.waitForTimeout(1500);
  });

  test("cta_click event on primary button click", { tag: "@ctaClick" }, async () => {
    await buttonPage.primaryButton.click();
    await buttonPage.page.waitForTimeout(500);

    await expectEvent(testData, "cta_click");
  });

  test("select_content event on primary button click", { tag: "@selectContent" }, async () => {
    await buttonPage.primaryButton.click();
    await buttonPage.page.waitForTimeout(500);

    await expectEvent(testData, "select_content");
  });
});
