# Extraction Workflow — Extract → Compare → (optional) Update

## Why This Pattern Exists

When the agent runs a dataLayer test, the console output contains hundreds of lines (Playwright startup, browser logs, assertion results). Parsing this raw output is expensive in tokens and error-prone.

Instead, the agent runs a **shell extraction command** that parses the terminal output into a small structured JSON blob. This reduces token consumption by ~75-85% compared to reading raw console output.

The update step is **always user-gated** because:
- Confluence specs may have errors (wrong casing, missing fields)
- Actuals may reveal tracking bugs (the JSON is correct, the implementation is wrong)
- The user may want to update only specific events, not all

## The Three Steps

### 1. Extract

After the test completes, capture the console output and run this extraction command. The output can come from:
- A **terminal output file** (e.g. Cursor terminals folder, Claude Code session log, VS Code terminal)
- **Piped stdout**: `npx playwright test ... 2>&1 | tee test-output.txt`
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

**Output format:**
```json
{
  "element_visibility": {
    "status": "✅ Found",
    "actual": {
      "event": "element_visibility",
      "component_name": "Product Card",
      "component_type": "Card"
    }
  },
  "cta_click": {
    "status": "❌ Not Found",
    "actual": null
  }
}
```

### 2. Compare

Read the source JSON and the extracted actuals. For each event key, present a per-event comparison:

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

**ALWAYS stop here.** Present the comparison and wait for user input.

### 3. Update (only on user request)

When the user reviews and approves:

- **"Update all"**: Merge each actual into source JSON, removing `gtm.uniqueEventId`
- **"Update X only"**: Update only the specific events the user names
- **"Don't update"**: The actual may be wrong (tracking bug) — user investigates

Write the updated JSON as a single file write (not multiple edits).

## Workflow Triggers

| User says | Flow |
|-----------|------|
| "Create analytics tests for X" | Create files → run → **extract → compare** → wait |
| "Run the analytics test for X" | Run → **extract → compare** → wait |
| "Debug the analytics test for X" | Run → **extract → compare** → wait (likely no update) |
| "Update the JSON with actuals" | **Update** approved events in JSON |

## Token Cost Comparison

For a component with 3 events:

| Step | Without extraction | With extraction |
|------|-------------------|-----------------|
| Read test output | ~2000-4000 tokens | ~0 (skipped) |
| Run extraction | 0 | ~100 tokens |
| Read extracted actuals | 0 | ~200-400 tokens |
| Parse diffs | ~500-1000 tokens | ~0 (structured) |
| **Total** | **~2500-5000** | **~300-500** |

## When Events Are Not Found

If extraction shows `❌ Not Found` for an event:

1. **Increase wait time** — the event may not have fired yet (add `waitForTimeout`)
2. **Check tracking deployment** — is analytics tracking live on the target URL?
3. **Verify the event name** — compare against the full dataLayer dump
4. **Full dataLayer dump** — temporarily add to a When step:

```typescript
const dl = await this.page.evaluate(() => (window as any).dataLayer || []);
console.log(JSON.stringify(dl, null, 2));
```

Search the output for events with known names. Present findings to the user.
