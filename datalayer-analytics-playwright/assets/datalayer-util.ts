import { Page } from "@playwright/test";

/**
 * Utility class for window.dataLayer operations in analytics testing.
 * Provides methods to get, find, match, and clear dataLayer events.
 *
 * NEVER MODIFY THIS FILE — fix mismatches by updating component JSON only.
 */
export class DataLayerUtils {
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async getDataLayer(): Promise<any[]> {
    return await this.page.evaluate(() => (window as any).dataLayer || []);
  }

  async findDataLayerEvent(eventName: string): Promise<any | undefined> {
    const dataLayer = await this.getDataLayer();
    return dataLayer.find((e: any) => e.event === eventName);
  }

  async findAllDataLayerEvents(eventName: string): Promise<any[]> {
    const dataLayer = await this.getDataLayer();
    return dataLayer.filter((e: any) => e.event === eventName);
  }

  /**
   * Deep partial match — finds first event where every key in `partial`
   * exists in the actual event with the same value (recursive).
   * Use when multiple events share the same name but differ by nested props.
   */
  async findDataLayerEventMatching(
    partial: Record<string, any>,
  ): Promise<any | undefined> {
    const dataLayer = await this.getDataLayer();
    return dataLayer.find((e: any) => this.deepMatch(e, partial));
  }

  private deepMatch(actual: any, expected: any): boolean {
    if (expected === null || expected === undefined) return actual === expected;
    if (typeof expected !== "object") return actual === expected;
    if (typeof actual !== "object" || actual === null) return false;
    return Object.keys(expected).every((key) =>
      this.deepMatch(actual[key], expected[key]),
    );
  }

  /**
   * Prevents default navigation on a CTA link so the dataLayer event
   * fires but the page stays on the current URL.
   * Call BEFORE clicking the CTA.
   */
  async preventCtaNavigation(selector: string): Promise<void> {
    await this.page.evaluate((sel) => {
      const cta = document.querySelector(sel);
      if (cta) {
        cta.addEventListener("click", (e) => e.preventDefault(), {
          capture: true,
          once: true,
        });
      }
    }, selector);
  }

  async clearDataLayer(): Promise<void> {
    await this.page.evaluate(() => ((window as any).dataLayer = []));
  }
}
