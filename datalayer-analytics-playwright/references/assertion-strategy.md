# Assertion Strategy

## Three Assertion Types

Each assertion type is available in both Standard and BDD mode:

### 1. First-Match with Clear (default)

BDD:
```gherkin
Then the dataLayer should contain expected "cta_click" event
```

Standard:
```typescript
await expectEvent(testData, "cta_click");
```

- Finds first event in `window.dataLayer` matching the `event` property name
- Asserts with `toMatchObject()` (expected is a subset of actual)
- **Clears `window.dataLayer` after assertion** — critical for sequential tests
- Use for: most cases (one event per name in the dataLayer)

### 2. Deep Partial Match

BDD:
```gherkin
Then the dataLayer should contain a matching "form_interaction_focus" event
```

Standard:
```typescript
await expectMatchingEvent(testData, "form_interaction_focus");
```

- Iterates all events, does recursive deep-match of every key in expected against actual
- Does NOT clear dataLayer
- Use for: same event name fires multiple times with different nested properties

### 3. Deep Partial Match with Clear

BDD:
```gherkin
Then the dataLayer should contain a matching "cta_click" event and clear
```

Standard:
```typescript
await expectMatchingEventAndClear(testData, "cta_click");
```

- Same as deep partial match, but clears dataLayer after assertion
- Use for: interaction events on live pages with multiple components

## When to Use Which

**Default to first-match with clear** unless you have a specific reason not to.

### Example: Different event names → use first-match

BDD:
```gherkin
When I click submit
Then the dataLayer should contain expected "cta_click" event
Then the dataLayer should contain expected "form_submit" event
```

Standard:
```typescript
await buttonPage.submitButton.click();
await page.waitForTimeout(500);
await expectEvent(testData, "cta_click");
await expectEvent(testData, "form_submit");
```

Each event has a unique name. First-match works. DataLayer clears between assertions.

### Example: Same event name, different props → use deep match

When an input field fires `form_interaction` twice (once for "Focus", once for "Value Changed"):

```json
{
  "form_interaction_focus": {
    "event": "form_interaction",
    "field_name": "email",
    "interaction_type": "focus"
  },
  "form_interaction_value_changed": {
    "event": "form_interaction",
    "field_name": "email",
    "interaction_type": "value_changed",
    "field_value": "user@example.com"
  }
}
```

BDD:
```gherkin
Then the dataLayer should contain a matching "form_interaction_focus" event
And the dataLayer should contain a matching "form_interaction_value_changed" event
```

Standard:
```typescript
await expectMatchingEvent(testData, "form_interaction_focus");
await expectMatchingEvent(testData, "form_interaction_value_changed");
```

The JSON key (`form_interaction_focus`) is the lookup key. The `event` property inside can be the same across multiple entries. Deep matching differentiates them by nested properties.

## Sequential Events (Setup + Target)

For scenarios where you need to perform a setup action before the target action (e.g., click next before clicking previous), assert-and-clear the setup event first:

BDD:
```gherkin
When I click the next button
Then the dataLayer should contain expected "carousel_next" event
When I click the previous button
Then the dataLayer should contain expected "carousel_previous" event
```

Standard:
```typescript
await carouselPage.nextButton.click();
await page.waitForTimeout(500);
await expectEvent(testData, "carousel_next");

await carouselPage.prevButton.click();
await page.waitForTimeout(500);
await expectEvent(testData, "carousel_previous");
```

The first assertion clears the dataLayer, so the second assertion only sees the "previous" event.

## App/Live Page Testing

On live pages, multiple components fire events with the same name (e.g. Breadcrumb + Hero both fire `content_in_viewport`). Use `findMatchingDataLayerEvent(expected)` which filters by `event` name + `parameters.content.name` from the expected JSON, then `toMatchObject` provides clear field-by-field diffs.

| Assertion | BDD Step | Lookup | Clears? |
|-----------|----------|--------|---------|
| Component-aware match | `contain a matching "{key}" event` | `findMatchingDataLayerEvent` (event + component name) | No |
| Component-aware + clear | `contain a matching "{key}" event and clear` | Same | Yes |

**Never use** `findDataLayerEvent` (first-match-by-name — returns wrong component's event) or `findDataLayerEventMatching` directly for app tests. `findMatchingDataLayerEvent` handles multi-candidate cases (e.g. 4 Videos on one page) internally via `deepMatch` with fallback to first candidate for `toMatchObject` diagnostics.

## How Deep Matching Works

The `deepMatch()` function recursively checks that every key in the expected object exists in the actual object with the same value:

```
deepMatch({ a: { b: 1, c: 2, d: 3 } }, { a: { b: 1 } }) → true
deepMatch({ a: { b: 1 } }, { a: { b: 2 } }) → false
deepMatch({ a: 1 }, { a: 1, b: 2 }) → false (extra key in expected)
```

This is why `toMatchObject()` is used — it allows the actual event to have additional properties not in the expected payload.
