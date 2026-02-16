# UI Specification (Mobile-first, Minimal)

## Add Purchase (default screen)

### Goals
- Lowest friction post-shopping entry.
- One-hand/thumb friendly controls.
- Fast repeat logging.

### Layout
- Sticky top section:
  - Store selector (default last-used store)
  - Product search/autocomplete (recent pinned first)
- Mid section:
  - Pack selector
  - Quantity stepper (default 1)
  - Total price numeric input
  - Date picker (default today)
  - Special toggle
- Sticky bottom:
  - Primary Save button

### Inline creation
- “+ New product” modal includes:
  - brand, name, variant, base unit type
  - first pack definition
- “+ New pack” modal includes:
  - size value, size unit, descriptor
  - read-only computed canonical size preview

### Repeat Last Purchase
When product is selected:
1. Query most recent purchase by `product_id`.
2. Prefill store, pack, quantity.
3. Keep focus on total price input for speed.

## Shopping List

### Per product card
- Lowest observed unit price (window + specials filter):
  - store, date/time, pack label, total paid, unit price
- Last paid purchase:
  - store, date/time, pack label, unit price

### Controls
- Window selector: 7 / 30 / 90 (default 30)
- Specials toggle: Include / Exclude specials
- Sorting:
  - Product name
  - Cheapest store (based on current lowest result)

## Product Detail

### Header
- `brand + name + variant`

### Summary block
- Lowest unit price (date/store)
- Lowest unit price excluding specials
- Most recent purchase (date/store/unit)

### History list/table fields
- Date
- Store
- Pack size / descriptor
- Quantity
- Total paid
- Unit price
- Special badge

## Stores

### Store list
- Name + optional location label.

### Store detail
- Recent purchases at store.
- Optional: average unit price per product in selected window and specials mode.

## Validation (UI mirrors DB)

- Pack unit compatibility with product base type:
  - weight => g|kg
  - volume => ml|L
  - count => each
- size_value > 0
- quantity is integer > 0
- total_price_paid >= 0
- disable save when total units <= 0

## Merge Products utility (More -> Merge Tool)

Transaction flow:
1. Validate source product != target product.
2. Reassign packs from source product to target product.
3. Delete source product.
4. Refresh summaries/caches.
5. Commit; rollback on any error.
