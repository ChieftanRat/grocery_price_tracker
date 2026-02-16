# Grocery Price Tracker (Offline-First PWA Design)

This repository contains a concrete, implementation-ready design for a **single-user**, **mobile-first**, offline grocery price tracking app focused on **unit price comparisons for exact products only**.

## What is included

- Product direction and architecture for an offline-first PWA.
- Relational data model and SQL schema with constraints and indexes.
- Canonical unit conversion and derived value rules.
- Core query recipes for best price and recent purchase logic.
- Mobile-first UI behavior specifications for the required screens.
- Validation and merge utility transaction design.

## Key product guarantees

1. No auth, no sync, no sharing, no external price APIs.
2. Comparisons only for exact same `product_id`.
3. Unit price computed from canonical units.
4. Time-window filtering (7/30/90 days, default 30).
5. Optional exclusion of special prices.

See:

- [`docs/architecture.md`](docs/architecture.md)
- [`docs/data-model.sql`](docs/data-model.sql)
- [`docs/query-recipes.sql`](docs/query-recipes.sql)
- [`docs/ui-spec.md`](docs/ui-spec.md)
