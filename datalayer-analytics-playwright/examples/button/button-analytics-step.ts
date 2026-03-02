import { When, Before } from "../../../../config/fixture"; // ← adjust path
import ButtonAnalytics from "./button-pageobject.js";

let buttonPage: ButtonAnalytics;

Before(async function () {
  buttonPage = new ButtonAnalytics(this.page);
});

When("I click the primary button", async function () {
  await buttonPage.primaryButton.click();
  await this.page.waitForTimeout(500);
});
