# DataLayer Validation — Agent Skill

Automated `window.dataLayer` event validation using Playwright. An AI agent skill that creates, executes, and maintains analytics tracking tests — so you never ship broken tracking again. Works with both standard Playwright tests and BDD (playwright-bdd).

## The Problem

Analytics tracking breaks silently. A developer refactors a component, a GTM container gets updated, or a new page template launches — and nobody notices until weeks later when the marketing team asks "why did conversions drop to zero?"

Manual QA can't keep up. Checking `window.dataLayer` in the browser console for every component, every variant, every event type isn't scalable.

## The Solution

This skill teaches your AI agent to **create, run, and maintain automated dataLayer validation tests**. Tell your agent what component to test, and it:

1. Creates a complete test suite (3 files standard, 4 files BDD — auto-detected)
2. Runs the test against your live or staging URL
3. Extracts actual event payloads from `window.dataLayer`
4. Shows you a structured Expected vs Actual comparison
5. Updates the test data only when you approve

No tracking implementation code is modified. No dataLayer logic changes. Just validation.

---

## Install

```bash
npx skills add mbatra5/skills --skill datalayer-analytics-playwright
```

Works with **44+ agents** including: Cursor, Claude Code, GitHub Copilot, Cline, Windsurf, OpenAI Codex, Gemini CLI, Goose, Roo Code, and any agent supporting the [Agent Skills standard](https://agentskills.io/specification).

Or use SkillKit to install and auto-translate for your agent:
```bash
npx skillkit install mbatra5/skills
```

---

## Usage Guide — What to Say to Your Agent

### Create tests from a Confluence tracking spec

> "Create dataLayer tests for the hero component using this Confluence spec: https://wiki.example.com/pages/12345"

The agent fetches the spec (token-efficiently via `body.storage` format), extracts event names and parameter tables, reads your existing component tests for locators, and creates a complete test suite. Then it runs the test, extracts actuals, and shows you the comparison.

### Create tests without a spec (discovery mode)

> "Create analytics tests for the newsletter signup component — no spec, discover the events from the live page"

The agent infers likely events from the component's interactive elements (CTA → `cta_click`, form submit → `form_submit`, visibility → `element_visibility`, etc.), creates skeleton test files, runs against the live URL, captures actual dataLayer payloads, and presents them for your review.

### Create tests from a manual spec

> "Create dataLayer tests for the checkout button. It fires cta_click with click_text='Buy Now', click_url='/checkout', component_name='Checkout CTA', link_type='internal'"

The agent creates the test files directly from your description.

### Create tests now, run later (deferred)

> "Create analytics test files for the product carousel from this spec: [URL]. Don't run them yet — the component isn't deployed."

The agent creates the test files with spec values and placeholder locators. You run them later when the URL goes live.

### Run existing tests and debug

> "Run the analytics tests for the button component and show me what's different"

The agent runs the existing test, extracts actuals from the terminal output, and presents a per-event comparison:

```
element_visibility:
  ✅ Match — Expected and Actual align

cta_click:
  ⚠️  Mismatch — 2 differences:
    click_text:  Expected "Learn More" → Actual "Read More"
    click_url:   Expected "/products" → Actual "/products/overview"

form_submit:
  ❌ Not Found — No matching event in dataLayer
```

It stops here and waits for your decision — it never auto-updates.

### Update test data (JSON) after reviewing comparison

> "The cta.text and cta.url changes look correct — update the JSON with those actuals"

The agent updates only the events you approve. Or update everything:

> "Update all events with the actuals"

Or don't update at all:

> "Don't update — the actual looks wrong, this might be a tracking bug"

### Update specific JSON fields

> "Update the cta_click URL in the button JSON to /products/new-page"

The agent reads the component JSON and updates the specific field.

### Change the test page URL

> "Change the button test URL to /components/button?variant=secondary"

The agent updates the URL key in the JSON file.

### Add a new event to an existing component

> "Add an element_visibility event to the button component tests"

The agent adds the event payload to the JSON and a new test/scenario to the test file.

### Add a new variant to an existing component

> "Add a 'secondary' variant for the button component with URL /components/button/secondary"

The agent adds the variant URL to the JSON and creates tests/scenarios for the variant.

### Inspect the live DOM for locators

> "The button test is failing because the locator changed — inspect the live DOM and update the page object"

The agent runs a DOM inspection snippet, identifies the correct CSS selectors, and updates the page object.

### Full dataLayer dump for debugging

> "Show me everything in the dataLayer on the checkout page"

The agent navigates to the page and dumps all `window.dataLayer` events for inspection.

---

## Supported Events

| Event | Fires When | Key Parameters |
|-------|-----------|----------------|
| `element_visibility` | Component scrolls into view | `component_name`, `component_type`, `page_location` |
| `cta_click` | User clicks a CTA/button/link | `click_text`, `click_url`, `link_type`, `component_name` |
| `form_interaction` | User interacts with form fields | `field_name`, `field_type`, `interaction_type` |
| `form_submit` | Form is submitted | `form_name`, `form_type`, `status` |
| `generate_lead` | Lead generation conversion | `currency`, `value` (GA4 recommended) |
| `select_content` | User selects content | `content_type`, `item_id` (GA4 recommended) |
| `add_to_cart` | Item added to cart | `ecommerce.items[]` (GA4 ecommerce) |
| `purchase` | Transaction completed | `ecommerce.transaction_id`, `ecommerce.value` |
| **Any custom event** | Your tracking fires it | Your parameter structure |

The framework is not limited to these standard types — it works with any event name and payload structure.

---

## How It Works

### Two Test Modes

The skill auto-detects which mode to use based on your project setup:

**Standard Playwright (default) — 3 files per component:**
```
button/
  button.json                  ← URLs + expected event payloads (the source of truth)
  button-analytics.spec.ts     ← Playwright test with assertions
  button-pageobject.ts         ← CSS selectors for UI elements
```

**BDD (playwright-bdd) — 4 files per component:**
```
button/
  button.json                  ← URLs + expected event payloads (the source of truth)
  button-analytics.feature     ← BDD scenarios in Gherkin (readable by non-engineers)
  button-analytics-step.ts     ← Component-specific interactions (When steps)
  button-pageobject.ts         ← CSS selectors for UI elements
```

Both modes share the same JSON format, page objects, and DataLayer utilities. The only difference is how tests are orchestrated — `test()` blocks vs Gherkin steps.

**Why this separation?** Change a URL → edit JSON only. Change a locator → edit page object only. Add a test → edit spec/feature file only. The assertion logic is shared and never modified.

### The Extract → Compare → Update Workflow

Instead of the agent reading hundreds of lines of raw test output (expensive in tokens), it uses a **shell extraction command** that parses terminal output into structured JSON in one step. This reduces token consumption by ~75-85%.

The update step is **always user-gated** because:
- Tracking specs may have errors (the expected is wrong, not the actual)
- The actual may reveal a tracking bug (don't mask it by updating the test)
- You may want to update only specific events

### Dual Assertion Strategy

| Mode | When to Use | Clears dataLayer? |
|------|-------------|-------------------|
| **First-match with clear** | Default — one event per name | Yes |
| **Deep partial match** | Same event name, different nested props | No |

### Locator Best Practices

The skill enforces a strict CSS selector priority:
1. CSS class + attribute (best)
2. Unique CSS class
3. data-testid + class
4. Stable ID + class
5. Text content (last resort)

Banned: `getByRole()`, `getByText()`, `.nth()`, `.first()`, bare tag selectors.

---

## Workflow Modes at a Glance

| Mode | Trigger | What Happens |
|------|---------|--------------|
| **Full** | "Create tests for X using this spec" | Create files → run → extract → compare → wait for approval → update → verify |
| **Discovery** | "Create tests for X — no spec" | Infer events → skeleton JSON → run → extract → compare → wait → fill |
| **Deferred** | "Create test files for X — don't run" | Create files from spec only. Execute later. |
| **Debug** | "Run the tests for X and show me diffs" | Run → extract → compare. No update unless asked. |

---

## Spec Sources

### Wiki / Document URL (recommended)

The agent fetches tracking specs from Confluence, Notion, Google Docs, or any accessible URL. For Confluence, it uses the REST API `body.storage` format (~55% smaller than rendered HTML). For other platforms, it fetches and parses the page content. The agent extracts event names, parameter tables, and code blocks — ignoring images and page chrome.

Works with any agent that can fetch URLs or call APIs (MCP, REST, curl, web fetch).

### Manual

Provide event names and parameters directly in chat. The agent builds the JSON from your description.

### Discovery (no spec needed)

The agent infers likely events from component interactions, creates skeleton tests, runs them, and captures whatever the dataLayer actually contains. You review and approve.

---

## Architecture

### Project Structure

```
datalayer-analytics-playwright/
├── SKILL.md                              ← Agent instructions (what the AI reads)
├── references/
│   ├── assertion-strategy.md             ← First-match vs deep-partial-match
│   ├── locator-rules.md                  ← CSS locator best practices + DOM inspection
│   ├── event-patterns.md                 ← Standard dataLayer event structures
│   └── extraction-workflow.md            ← Extract → Compare → Update pattern
├── assets/
│   ├── datalayer-util.ts                 ← DataLayer utility class (get, find, match, clear)
│   ├── analytics-logger.ts              ← Console + Allure dual logger
│   ├── analytics-helpers.ts             ← Standard mode: assertion helper functions
│   ├── analytics.standard.config.ts     ← Standard mode: Playwright config template
│   ├── analytics-common-step.ts         ← BDD mode: shared Given/Then BDD steps
│   └── analytics.playwright.config.ts   ← BDD mode: Playwright + BDD config template
└── examples/
    ├── button/                           ← BDD example
    │   ├── button.json
    │   ├── button-analytics.feature
    │   ├── button-analytics-step.ts
    │   └── button-pageobject.ts
    └── button-standard/                  ← Standard Playwright example
        ├── button.json
        ├── button-analytics.spec.ts
        └── button-pageobject.ts
```

### Shared Utilities (copy from `assets/` on first setup)

| File | Mode | Purpose |
|------|------|---------|
| `datalayer-util.ts` | Both | Access `window.dataLayer`, find events by name or deep match, prevent CTA navigation, clear between assertions |
| `analytics-logger.ts` | Both | Log Expected vs Actual to console and Allure reports |
| `analytics-helpers.ts` | Standard | `expectEvent()`, `expectMatchingEvent()`, `expectMatchingEventAndClear()` assertion functions |
| `analytics.standard.config.ts` | Standard | Playwright config with timeouts, reporters, browser settings |
| `analytics-common-step.ts` | BDD | Generic Given (navigate) and Then (assert) BDD steps |
| `analytics.playwright.config.ts` | BDD | Playwright + BDD config with `defineBddConfig()` |

These files are **never modified per component** — they're shared infrastructure.

---

## Requirements

- Node.js 18+
- Playwright
- allure-js-commons + allure-playwright (for Allure reporting)
- playwright-bdd (BDD mode only — not required for standard mode)

## License

Apache-2.0
