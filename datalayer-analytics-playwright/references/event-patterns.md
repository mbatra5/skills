# DataLayer Event Patterns

## Standard Event Types

### element_visibility
Fires when a component scrolls into view. Common for tracking impressions.

```json
{
  "event": "element_visibility",
  "component_name": "Product Card",
  "component_type": "Card",
  "component_variant": "Featured",
  "page_location": "/products/overview"
}
```

**Common properties:**
| Property | Description | Example |
|----------|-------------|---------|
| `component_name` | Component display name | "Product Card", "Newsletter Banner", "Search Bar" |
| `component_type` | Component category | "Card", "Banner", "Form", "Navigation" |
| `component_variant` | Visual/functional variant | "Featured", "Compact", "Sticky" |
| `page_location` | Page URL path | "/products/overview" |

### cta_click
Fires when user clicks a CTA button or link.

```json
{
  "event": "cta_click",
  "click_text": "Shop Now",
  "click_url": "/products/sale",
  "component_name": "Product Card",
  "link_type": "internal"
}
```

**Common properties:**
| Property | Values | Notes |
|----------|--------|-------|
| `click_text` | Button/link visible text | "Shop Now", "Learn More", "Download PDF" |
| `click_url` | Target URL or href | "/products/sale", "https://external.com" |
| `component_name` | Parent component name | Where the CTA lives |
| `link_type` | internal, external, download | Destination classification |

### form_interaction
Fires on form field interactions (focus, input, selection).

```json
{
  "event": "form_interaction",
  "form_name": "Contact Us",
  "field_name": "email",
  "field_type": "input",
  "interaction_type": "focus"
}
```

**`interaction_type` values:**
| Type | Use case |
|------|----------|
| focus | User clicks/tabs into a field |
| value_changed | User changes the field value |
| select | User picks from dropdown/radio/checkbox |
| toggle | User toggles a switch/checkbox |

### form_submit
Fires after a form is submitted.

```json
{
  "event": "form_submit",
  "form_name": "Contact Us",
  "form_type": "Lead Generation",
  "submission_status": "success"
}
```

### generate_lead (GA4 recommended)
Fires on lead generation conversions.

```json
{
  "event": "generate_lead",
  "currency": "USD",
  "value": 50.00
}
```

### select_content (GA4 recommended)
Fires when user selects content (tabs, accordions, carousels).

```json
{
  "event": "select_content",
  "content_type": "tab",
  "item_id": "pricing-tab"
}
```

### add_to_cart (GA4 ecommerce)
Fires when an item is added to cart.

```json
{
  "event": "add_to_cart",
  "ecommerce": {
    "currency": "USD",
    "value": 29.99,
    "items": [
      {
        "item_id": "SKU-12345",
        "item_name": "Running Shoes",
        "price": 29.99,
        "quantity": 1
      }
    ]
  }
}
```

### purchase (GA4 ecommerce)
Fires when a transaction completes.

```json
{
  "event": "purchase",
  "ecommerce": {
    "transaction_id": "T-98765",
    "currency": "USD",
    "value": 59.98,
    "items": [
      {
        "item_id": "SKU-12345",
        "item_name": "Running Shoes",
        "price": 29.99,
        "quantity": 2
      }
    ]
  }
}
```

## JSON Structure Pattern

Every component JSON follows this pattern:

```json
{
  "{urlKey}": "/path/to/test/page",
  "{anotherUrlKey}": "/path/to/variant/page",

  "validEmail": "test@example.com",

  "{eventKey}": {
    "event": "{eventName}",
    ...properties
  }
}
```

- **URL keys**: Map scenario names to page paths (relative)
- **Event keys**: Map to expected event payloads (used by Given/Then steps)
- **Data keys**: Additional test data (emails, inputs, etc.)

The event key in JSON can differ from the `event` property inside the payload. This allows multiple entries for the same event name with different nested properties (e.g. `form_interaction_focus` and `form_interaction_value_changed` both having `"event": "form_interaction"`).

## Parameter Mapping from Tracking Specs

Tracking specs (Confluence, Google Sheets, etc.) typically use dot notation or flat tables. Map to the JSON structure your `window.dataLayer.push()` actually uses:

```
component.name    → component_name
click.text        → click_text
click.url         → click_url
form.name         → form_name
field.type        → field_type
item.id           → ecommerce.items[0].item_id  (GA4 ecommerce)
```

The exact nesting depends on your GTM implementation. Always validate against the actual `window.dataLayer` output rather than guessing the structure.

## Custom Events

The framework supports any custom event name. Just follow the same JSON structure:

```json
{
  "my_custom_event": {
    "event": "my_custom_event",
    "custom_property_1": "value1",
    "custom_property_2": "value2",
    "nested": {
      "deep_property": "value3"
    }
  }
}
```

The assertion steps work with any event name — they're not hardcoded to standard types.
