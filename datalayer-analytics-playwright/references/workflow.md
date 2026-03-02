# Detailed Workflow — Agent Instructions

This is the full step-by-step implementation guide. Read this when creating, executing, or debugging analytics tests.

---

## Setup (first-time only)

If the project doesn't already have the analytics testing utilities, create them from the `assets/` folder.

**Both modes (shared utilities):**
1. Copy `assets/datalayer-util.ts` → `{test-root}/utils/datalayer-util.ts`
2. Copy `assets/analytics-logger.ts` → `{test-root}/utils/analytics-logger.ts`
3. Install: `npm install -D allure-js-commons allure-playwright`

**Standard mode — additionally:**
4. Copy `assets/analytics-helpers.ts` → `{test-root}/utils/analytics-helpers.ts`
5. Copy `assets/analytics.standard.config.ts` → `{project-root}/analytics.playwright.config.ts`

**BDD mode — additionally:**
4. Copy `assets/analytics-common-step.ts` → `{test-root}/analytics/analytics-common-step.ts`
5. Copy `assets/analytics.playwright.config.ts` → `{project-root}/analytics.playwright.config.ts`
6. Install: `npm install -D playwright-bdd`

Adjust paths in the config and imports to match your project structure. The shared utilities are **infrastructure** — NEVER modify them per component.

---

## Step 1: Get the Tracking Spec

**Option A — Tracking spec URL** (preferred, most token-efficient):

If the spec lives in a wiki or doc platform, fetch it via the most efficient method available:
- **Confluence + MCP**: `conf_get path="/wiki/rest/api/content/{pageId}" queryParams={"expand": "body.storage"} jq="body.storage.value"` — use `body.storage` format (~55% smaller than rendered HTML)
- **Confluence + REST**: `curl -s "https://{domain}/wiki/rest/api/content/{pageId}?expand=body.storage" -H "Authorization: Bearer {token}"` — pipe through `jq '.body.storage.value'`
- **Any URL**: Fetch the page and extract event names, parameter tables, code blocks

Extract page ID from URL (numeric segment after `/pages/`). Extract ONLY: event names, parameter tables, code blocks, notes about excluded events.

**Option B — Manual**: User provides event names + parameters in chat.

**Option C — Discovery (no spec)**:
Infer events from the component's interactive elements:
- CTA/link → likely `cta_click` or `select_content`
- Visible on load → likely `element_visibility` or custom viewport event
- Interactive controls → likely `form_interaction` or `select_item`
- Form submission → likely `form_submit` or `generate_lead`

Create files with skeleton JSON payloads, run → extract → compare → fill.

---

## Step 2: Get Locators

**Optional:** If the project already has functional component tests or page objects (e.g., from Cypress, Playwright, Selenium, or any other framework), you can inspect those to reuse their CSS selectors.

Otherwise, inspect the live page DOM by navigating to the test URL and using `page.evaluate()` to extract interactive elements and their selectors.

**Locator priority** (pick first available):
1. CSS class + attribute: `button.ui-tabs__link#tab-tab2`
2. Unique CSS class: `a.ui-text-nav-link--with-underline`
3. data-testid + class: `.ui-checkbox-input[data-testid="checkbox-test"]`
4. Stable ID + class: `.ui-radio-input#radio-1`
5. Text (LAST RESORT): `a:has-text("Submit")`

**BANNED**: `getByRole()`, `getByText()`, `getByLabel()`, `.nth()`, `.first()`, `.last()`, bare tag selectors, guessed attributes without DOM inspection.

For DOM inspection when locators are unknown, see `locator-rules.md`.

---

## Step 3: Create the Component Files

All files go in: `{test-root}/analytics/{component}/`

**VALIDATION RULES** (enforced by shared infrastructure):

Before creating files, ensure all names follow these patterns:
- **Component names** (folder and file prefix): kebab-case alphanumeric only: `[a-z0-9-]+`
  - Valid: `button`, `hero-section`, `checkout-flow`
  - Invalid: `Button`, `hero_section`, `../../../evil`, `button$(whoami)`
- **Event names** (JSON keys, feature file references): snake_case alphanumeric: `[a-z_][a-z0-9_]*`
  - Valid: `element_visibility`, `cta_click`, `form_submit`
  - Invalid: `ElementVisibility`, `cta-click`, `cta_click();`, `__proto__`
- **Variant/URL keys** (JSON keys for multi-variant): kebab-case alphanumeric (same as component names)
  - Valid: `default`, `secondary`, `mobile-view`
  - Invalid: `Default`, `mobile_view`, `../other`

The shared test infrastructure (`analytics-common-step.ts` and validation utilities) validates these patterns at runtime and rejects any inputs that don't conform.

### 3a. JSON — `{component}.json` (both modes — identical)

```json
{
  "{urlKey}": "/path/to/component/page",
  "element_visibility": {
    "event": "element_visibility",
    "component_name": "{Component Name}",
    "component_type": "{Type}",
    "page_location": "/path/to/component/page"
  },
  "cta_click": {
    "event": "cta_click",
    "click_text": "{CTA text}",
    "click_url": "{href}",
    "component_name": "{Component Name}",
    "link_type": "{internal|external|download}"
  }
}
```

Include ALL parameters from the spec — never omit fields. Only exclude `gtm.uniqueEventId`.

### 3b. Page Object — `{component}-pageobject.ts` (both modes — identical)

```typescript
import { Locator, Page } from "@playwright/test";

class {ComponentName}Analytics {
  page: Page;
  primaryCTA: Locator;

  constructor(page: Page) {
    this.page = page;
    this.primaryCTA = page.locator("{css-selector}");
  }
}

export default {ComponentName}Analytics;
```

---

### Standard mode: 3c. Test File — `{component}-analytics.spec.ts`

```typescript
import { test } from "@playwright/test";
import { initDataLayer, expectEvent } from "{path-to}/utils/analytics-helpers";
import {ComponentName}Analytics from "./{component}-pageobject";
import testData from "./{component}.json";

const BASE_URL = process.env.BASE_URL || "";

test.describe("{Component Name} - DataLayer Analytics", { tag: ["@analytics", "@{componentTag}"] }, () => {
  let componentPage: {ComponentName}Analytics;

  test.beforeEach(async ({ page }) => {
    initDataLayer(page);
    componentPage = new {ComponentName}Analytics(page);
    await page.goto(BASE_URL + testData.{urlKey}, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
  });

  test("element_visibility event", { tag: "@visibility" }, async () => {
    await expectEvent(testData, "element_visibility");
  });

  test("cta_click event on CTA click", { tag: "@ctaClick" }, async () => {
    await componentPage.primaryCTA.click();
    await componentPage.page.waitForTimeout(500);
    await expectEvent(testData, "cta_click");
  });
});
```

**Standard mode = 3 files:** JSON + page object + spec. See `examples/button-standard/` for a complete working example.

---

### BDD mode: 3c. Feature — `{component}-analytics.feature`

```gherkin
Feature: {Component Name} - DataLayer Analytics

  @analytics @{componentTag} @visibility
  Scenario: Verify element_visibility event
    Given I am on the "{component}" analytics "{urlKey}" page
    Then the dataLayer should contain expected "element_visibility" event

  @analytics @{componentTag} @ctaClick
  Scenario: Verify cta_click event
    Given I am on the "{component}" analytics "{urlKey}" page
    When I click the {component} CTA
    Then the dataLayer should contain expected "cta_click" event
```

### BDD mode: 3d. Step Definitions — `{component}-analytics-step.ts`

The step file uses the shared `analytics-common-step.ts` Given/Then steps. It only defines component-specific `When` steps.

```typescript
import { When, Before } from "{path-to}/config/fixture";
import {ComponentName}Analytics from "./{component}-pageobject.js";

let componentPage: {ComponentName}Analytics;

Before(async function () {
  componentPage = new {ComponentName}Analytics(this.page);
});

When("I click the {component} CTA", async function () {
  await componentPage.primaryCTA.click();
  await this.page.waitForTimeout(500);
});
```

The shared `analytics-common-step.ts` (copied to `{test-root}/analytics/analytics-common-step.ts` during setup) provides the Given/Then steps. When creating the feature file, the Given step template in that file uses hardcoded placeholders:

```typescript
// From analytics-common-step.ts (shared infrastructure):
Given(
  "I am on the {string} analytics {string} page",
  async function (component: string, variant: string) {
    currentTestData = require(`./{component}/{component}.json`);
    // ...
  },
);
```

**When creating your feature file**, use descriptive names in the Given step quotes, and the step's hardcoded path will resolve them correctly:

```gherkin
Given I am on the "button" analytics "urlKey" page
# → The step's hardcoded path becomes: require(`./button/button.json`)
```

**BDD mode = 4 files:** JSON + page object + feature + step defs. See `examples/button/` for a complete working example.

---

## Step 4: Execute, Extract & Compare

For **deferred workflow**, skip Step 4 — user executes later.

**4a. Run the tests:**

Standard mode:
```bash
npx playwright test --config analytics.playwright.config.ts --grep "@{componentTag}"
```

BDD mode:
```bash
npx bddgen --config analytics.playwright.config.ts
npx playwright test --config analytics.playwright.config.ts --grep "@{componentTag}"
```

**4b. Extract actuals from terminal output (do NOT read raw console):**

After the test completes, capture the terminal output and run this extraction command. The test output can come from:
- A **terminal output file** (e.g. Cursor terminals folder, Claude Code session log)
- **Piped stdout** from the test run (redirect with `2>&1 | tee test-output.txt`)
- Any text file containing the Playwright console output

```bash
node -e "
const t = require('fs').readFileSync('OUTPUT_FILE', 'utf-8');
const r = {};
t.split('='.repeat(60)).forEach(b => {
  const ev = b.match(/DATALAYER EVENT:\s*(.+)/);
  const st = b.match(/Status:\s*(.*)/);
  const act = b.match(/Actual:\n([\s\S]*?)$/);
  if (ev && act) {
    const key = ev[1].trim();
    try {
      const j = JSON.parse(act[1].trim());
      delete j['gtm.uniqueEventId'];
      r[key] = { status: (st ? st[1].trim() : 'unknown'), actual: j };
    } catch(e) { r[key] = { status: (st ? st[1].trim() : 'unknown'), actual: null, parseError: true }; }
  }
});
console.log(JSON.stringify(r, null, 2));
"
```

Replace `OUTPUT_FILE` with the path to whatever file contains the test's console output. To capture output during the test run, pipe it: `npx playwright test ... 2>&1 | tee test-output.txt`

**4c. Present comparison to user — ALWAYS stop here:**

Read the source JSON and extracted actuals. Present per-event comparison:

```
element_visibility:
  Match — Expected and Actual align

cta_click:
  Mismatch — 2 differences:
    click_text:  Expected "Learn More" → Actual "Read More"
    click_url:   Expected "/products" → Actual "/products/overview"

form_submit:
  Not Found — No matching event in dataLayer
```

**STOP after presenting the comparison.** Do NOT update JSON automatically. Wait for user input.

**Why:** Spec values may differ from implementation (spec error), actuals may reveal tracking bugs (don't mask them), or user may want selective updates only.

**4d. Update JSON (ONLY when user explicitly requests):**

Merge approved actuals into source JSON, removing only `gtm.uniqueEventId`. Write as a single file update. Then re-run to verify pass.

**4e. Full dataLayer dump (when event not found):**

Temporarily add to a test or step, run, read output, then remove:
```typescript
const dl = await page.evaluate(() => (window as any).dataLayer || []);
console.log(JSON.stringify(dl, null, 2));
```

---

## Step 5: DOM Inspection (if locators fail)

Temporarily add to a test or step, run, read output, then remove:
```typescript
const _els = await this.page.evaluate(() => {
  const s = 'a, button, input, [role="button"], [data-testid]';
  return Array.from(document.querySelectorAll(s)).map((el) => {
    const e = el as HTMLElement;
    return {
      tag: e.tagName.toLowerCase(),
      class: e.className?.substring(0, 80) || "",
      id: e.id || "",
      href: e.getAttribute("href") || "",
      text: e.textContent?.trim()?.substring(0, 40) || "",
    };
  });
});
console.table(_els);
```

---

## Parameter Mapping (from tracking spec tables)

Tracking specs use dot notation or flat tables. Map to the JSON structure used in your dataLayer:

```
component.name  → component_name  (or ecommerce.component_name)
click.text      → click_text
click.url       → click_url
form.type       → form_type
item.id         → ecommerce.items[0].item_id  (GA4 ecommerce)
```

The exact nesting depends on your tracking implementation — match whatever `window.dataLayer.push()` actually sends.

---

## File Naming Conventions

| File | Standard Mode | BDD Mode |
|------|---------------|----------|
| Folder | `{component}/` (kebab-case) | `{component}/` (kebab-case) |
| JSON | `{component}.json` | `{component}.json` |
| Page object | `{component}-pageobject.ts` | `{component}-pageobject.ts` |
| Test file | `{component}-analytics.spec.ts` | — |
| Feature | — | `{component}-analytics.feature` |
| Step defs | — | `{component}-analytics-step.ts` |
| Class name | `{ComponentName}Analytics` (PascalCase) | `{ComponentName}Analytics` (PascalCase) |
| Tags | `@analytics @{componentTag} @{eventType}` | `@analytics @{componentTag} @{eventType}` |

---

## Nested Components (variants)

For components with multiple variants, use subfolders:

**Standard mode:**
```
{component}/
  {component}-pageobject.ts           ← shared locators
  {variant}/
    {variant}.json                    ← variant-specific URL + events
    {variant}-analytics.spec.ts       ← variant-specific test
```

**BDD mode:**
```
{component}/
  {component}-pageobject.ts           ← shared locators
  {component}-analytics-step.ts       ← shared When steps
  {variant}/
    {variant}.json                    ← variant-specific URL + events
    {variant}-analytics.feature       ← variant-specific scenarios
```

In BDD mode, use the 3-string Given step:
```gherkin
Given I am on the "{component}" analytics "{variant}" variant "{urlKey}" page
```

---

## Quick Reference

### Spec extraction (Confluence / wiki)
Fetch via whichever method is available (MCP, REST API, or URL fetch):
```
conf_get path="/wiki/rest/api/content/{pageId}" queryParams={"expand": "body.storage"} jq="body.storage.value"
curl -s "https://{domain}/wiki/rest/api/content/{pageId}?expand=body.storage" | jq '.body.storage.value'
```

### Run commands
Standard mode:
```bash
npx playwright test --config analytics.playwright.config.ts --grep "@tag"
```

BDD mode:
```bash
npx bddgen --config analytics.playwright.config.ts
npx playwright test --config analytics.playwright.config.ts --grep "@tag"
```

### Debugging
Console shows Expected vs Actual side by side. Common fixes:
1. Casing/field mismatch → update JSON (after user confirms)
2. Event not found → increase wait, check if tracking deployed, verify locator
3. Actual differs from spec → may be tracking bug (don't update — user investigates)
