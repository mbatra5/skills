# Locator Rules

## Priority Order

Pick the first available strategy from this list:

### 1. CSS class + attribute (best)
```typescript
page.locator("button.ui-tabs__link#tab-tab2")
page.locator("input.ui-input-field[type='email']")
```

### 2. Unique CSS class
```typescript
page.locator("a.ui-text-nav-link--with-underline")
page.locator("button.btn-standard-secondary")
```

### 3. data-testid + class
```typescript
page.locator(".ui-checkbox-input[data-testid='checkbox-test']")
```

### 4. Stable ID + class
```typescript
page.locator(".ui-radio-input#radio-1")
```

### 5. Text (LAST RESORT)
```typescript
page.locator("a:has-text('Submit')")
```

## Banned Selectors

These create brittle, unreliable tests:

| Banned | Why |
|--------|-----|
| `getByRole()` | Fragile — role attributes change |
| `getByText()` | Breaks on text changes, i18n |
| `getByLabel()` | Not all elements have labels |
| `.nth()` | Index-dependent, breaks on reorder |
| `.first()` / `.last()` | Position-dependent |
| Bare tag selectors (`page.locator('a')`) | Matches too many elements |
| Guessed attributes | Always verify against actual DOM |

## DOM Inspection

When locators are unknown, use a targeted `page.evaluate()` to extract interactive elements:

### General inspection (all interactive elements)
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

### Scoped inspection (specific component)
```typescript
const r = await page.evaluate(() => {
  const component = document.querySelector('.ui-hero, .hero-block, [class*=hero]');
  const all = component ? component.querySelectorAll('button, a, [role=button]') : [];
  return Array.from(all).slice(0, 20).map(el => ({
    tag: el.tagName,
    class: el.className.slice(0, 120),
    ariaLabel: el.getAttribute('aria-label') || '',
    text: el.textContent.trim().slice(0, 60),
    href: el.getAttribute('href') || ''
  }));
});
```

Add these temporarily to a When step, run the test, read console output, then remove.

## CTA Navigation Prevention

On live pages, clicking a CTA navigates away — losing the dataLayer event. Use `preventCtaNavigation()` before clicking:

```typescript
await dataLayerUtils.preventCtaNavigation(componentPage.ctaSelector);
await componentPage.primaryCTA.click();
```

This requires exposing the raw CSS selector as an instance property on the page object:

```typescript
class ComponentAnalytics {
  ctaSelector: string;
  primaryCTA: Locator;

  constructor(page: Page) {
    this.ctaSelector = "a.component__cta";
    this.primaryCTA = page.locator(this.ctaSelector).first();
  }
}
```

## Reusing Existing Locators

If the project already has existing component tests or QA automation, read those page objects first:

```
test/components/{component}/{component}-pageobject.ts  → CSS selectors
test/components/{component}/{component}.json           → URLs, test data
```

Copy selectors from existing tests rather than guessing. If an element isn't covered, mark it:
```typescript
this.submitButton = page.locator("TODO_VERIFY_SELECTOR");
```
