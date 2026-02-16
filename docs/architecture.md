# Architecture & Product Direction

## 1) Product direction

- **App type:** Offline-first PWA.
- **User model:** Exactly one local user.
- **Network dependency:** None required for core operation.
- **Primary objective:** Fast entry of purchases and reliable best recent unit-price lookup for exact products.

## 2) Recommended implementation stack

- **Frontend:** React + TypeScript.
- **State/data access:** TanStack Query + local data service abstraction.
- **Persistence options:**
  - Preferred: SQLite compiled to WASM.
  - Alternative: IndexedDB via Dexie if SQLite-WASM is not available.
- **Styling:** Tailwind CSS with mobile-first component patterns.

## 3) Domain principles

1. **Exact product identity only**
   - Product comparison scope is strictly `product_id`.
   - No brand substitution or “similar item” inference.

2. **Unit-price-first logic**
   - A purchase is normalized via pack canonical size.
   - Unit price = total paid / total units.

3. **Local data isolation**
   - All “best price” results are derived from local historical purchases.
   - No marketplace scrape, no API augmentations.

## 4) Navigation (v1)

Bottom tab navigation:

1. **Add** (default landing)
2. **Shopping List**
3. **More**
   - Products
   - Stores
   - Merge Tool

## 5) Performance expectations

- Debounced product search (~120 ms).
- Caching for recent products and last-used store.
- Indexed query paths for purchase history and comparison reads.
- Rapid “Repeat last purchase” prefill path.

## 6) Reliability expectations

- Constraints enforced in DB and mirrored in UI validation.
- Canonical conversion performed at pack save time.
- Merge operation is atomic via single transaction.
