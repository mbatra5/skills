import { Locator, Page } from "@playwright/test";

class ButtonAnalytics {
  page: Page;
  primaryButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.primaryButton = page.locator("button.btn-primary");
  }
}

export default ButtonAnalytics;
