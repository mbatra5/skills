import * as allure from "allure-js-commons";

/**
 * Logs dataLayer events to console (human-readable) and Allure (JSON attachment).
 * Console format is parsed by the extraction workflow — do not change delimiters.
 *
 * NEVER MODIFY THIS FILE.
 */
export class AnalyticsLogger {
  static async logDataLayerEvent(
    eventType: string,
    actual: any,
    expected: any,
  ): Promise<void> {
    const status = actual ? "✅ Found" : "❌ Not Found";

    console.log(`\n${"=".repeat(60)}`);
    console.log(`  DATALAYER EVENT: ${eventType}`);
    console.log(`${"=".repeat(60)}`);
    console.log(`  Status: ${status}`);
    console.log(`  Event Name: ${expected?.event || "N/A"}`);
    console.log(`\n  Expected:`);
    console.log(JSON.stringify(expected, null, 2));
    console.log(`\n  Actual:`);
    console.log(JSON.stringify(actual, null, 2));
    console.log(`${"=".repeat(60)}\n`);

    const logContent = {
      eventType,
      status: actual ? "Found" : "Not Found",
      expected,
      actual,
      timestamp: new Date().toISOString(),
    };

    await allure.attachment(
      `DataLayer: ${eventType}`,
      JSON.stringify(logContent, null, 2),
      "application/json",
    );
  }
}
