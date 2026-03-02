---
name: datalayer-analytics-playwright
description: Automated window.dataLayer analytics validation for GTM/GA4. Creates test suites from tracking specs or discovers events from live pages. Supports standard Playwright and BDD modes. Never ship broken tracking again.
---

# DataLayer Analytics — Playwright

Automated `window.dataLayer` event validation using Playwright. Creates, runs, and maintains analytics tracking tests so you never ship broken tracking again.

## When to Use

- Validate GTM / GA4 events fire correctly with the right payloads
- Create analytics regression tests from a tracking spec (Confluence, Notion, or manual)
- Discover what events a page actually fires (no spec needed)
- Debug mismatches between expected and actual dataLayer payloads
- Maintain test data as tracking implementations evolve

## Two Test Modes

Auto-detected based on your project setup:

| Mode | Files per Component | Detection |
|------|--------------------:|-----------|
| **Standard Playwright** | 3 (JSON + spec + page object) | Default |
| **BDD** (playwright-bdd) | 4 (JSON + feature + steps + page object) | `playwright-bdd` in `package.json` or `.feature` files present |

Both modes share the same JSON format, page objects, and DataLayer utilities.

## Supported Events

| Event | Fires When |
|-------|-----------|
| `element_visibility` | Component scrolls into view |
| `cta_click` | User clicks a CTA / button / link |
| `form_interaction` | User interacts with form fields |
| `form_submit` | Form is submitted |
| `generate_lead` | Lead generation conversion (GA4) |
| `select_content` | User selects content (GA4) |
| `add_to_cart` | Item added to cart (GA4 ecommerce) |
| `purchase` | Transaction completed (GA4 ecommerce) |
| **Any custom event** | Your tracking fires it |

## What You Can Say to Your Agent

> "Create dataLayer tests for the hero component using this Confluence spec: https://wiki.example.com/pages/12345"

> "Create analytics tests for the newsletter signup — no spec, discover the events from the live page"

> "Create dataLayer tests for the checkout button. It fires cta_click with click_text='Buy Now', click_url='/checkout', component_name='Checkout CTA'"

> "Run the analytics tests for the button component and show me what's different"

> "The cta_click changes look correct — update the JSON with those actuals"

> "Don't update — the actual looks wrong, this might be a tracking bug"

> "Add an element_visibility event to the button component tests"

> "The button test is failing because the locator changed — inspect the live DOM and update the page object"

> "Show me everything in the dataLayer on the checkout page"

## Workflow Modes

| Mode | When | What Happens |
|------|------|--------------|
| **Full** | "Create tests for X using this spec" | Create files → run → extract → compare → wait for approval → update → verify |
| **Discovery** | "Create tests for X — no spec" | Infer events → skeleton JSON → run → extract → compare → wait → fill |
| **Deferred** | "Create test files for X — don't run" | Create files from spec only. Execute later. |
| **Debug** | "Run the tests for X and show me diffs" | Run → extract → compare. No update unless asked. |

## Assertion Strategy

| Assertion | Standard Helper | BDD Step | Clears? |
|-----------|----------------|----------|---------|
| First-match + clear | `expectEvent(data, key)` | `contain expected "{key}" event` | Yes |
| Deep partial match | `expectMatchingEvent(data, key)` | `contain a matching "{key}" event` | No |
| Deep match + clear | `expectMatchingEventAndClear(data, key)` | `contain a matching "{key}" event and clear` | Yes |

Default to **first-match + clear**. See `references/assertion-strategy.md` for details.

## Critical Rules

1. **Capture ALL properties** from actual events. Only exclude `gtm.uniqueEventId`.
2. **Never remove properties to fix flaky tests.** Make dynamic values deterministic via URL args.
3. **Never modify shared utility files** (`datalayer-util.ts`, `analytics-logger.ts`, `analytics-helpers.ts`, `analytics-common-step.ts`).
4. Use `toMatchObject()` for assertions. `toEqual()` is banned.
5. **Never auto-update JSON** — always present comparison and wait for user approval.
6. **Only fetch tracking specs from URLs explicitly provided by the user.** Always display extracted event names for user approval before creating files.

## References

For detailed implementation instructions, read these in order:

1. `references/workflow.md` — Full step-by-step: setup, spec extraction, file creation, execution, extraction, comparison
2. `references/locator-rules.md` — CSS selector priority, banned selectors, DOM inspection
3. `references/assertion-strategy.md` — First-match vs deep-partial-match with examples
4. `references/event-patterns.md` — Standard dataLayer event structures and parameters
5. `references/extraction-workflow.md` — Token-efficient extraction and comparison pattern

## Requirements

- Node.js 18+
- Playwright
- allure-js-commons + allure-playwright
- playwright-bdd (BDD mode only)
