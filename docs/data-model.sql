-- Grocery Price Tracker schema (SQLite dialect)
-- UUIDs stored as TEXT.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS stores (
  store_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location_label TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS products (
  product_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  brand TEXT NOT NULL,
  variant TEXT,
  base_unit_type TEXT NOT NULL CHECK (base_unit_type IN ('weight', 'volume', 'count')),
  canonical_unit TEXT NOT NULL CHECK (canonical_unit IN ('g', 'ml', 'each')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  CHECK (
    (base_unit_type = 'weight' AND canonical_unit = 'g') OR
    (base_unit_type = 'volume' AND canonical_unit = 'ml') OR
    (base_unit_type = 'count'  AND canonical_unit = 'each')
  )
);

CREATE TABLE IF NOT EXISTS packs (
  pack_id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  size_value NUMERIC NOT NULL CHECK (size_value > 0),
  size_unit TEXT NOT NULL CHECK (size_unit IN ('g', 'kg', 'ml', 'L', 'each')),
  pack_descriptor TEXT,
  canonical_size NUMERIC NOT NULL CHECK (canonical_size > 0),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
  purchase_id TEXT PRIMARY KEY,
  date_time TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  store_id TEXT NOT NULL,
  pack_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  total_price_paid NUMERIC NOT NULL CHECK (total_price_paid >= 0),
  was_on_special INTEGER NOT NULL DEFAULT 0 CHECK (was_on_special IN (0, 1)),
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  FOREIGN KEY (store_id) REFERENCES stores(store_id),
  FOREIGN KEY (pack_id) REFERENCES packs(pack_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_purchases_date_time
  ON purchases(date_time);

CREATE INDEX IF NOT EXISTS idx_purchases_pack_date_time
  ON purchases(pack_id, date_time);

CREATE INDEX IF NOT EXISTS idx_packs_product_id
  ON packs(product_id);

CREATE INDEX IF NOT EXISTS idx_products_brand_name_variant
  ON products(brand, name, variant);

-- Optional normalized search key to accelerate autocomplete.
ALTER TABLE products ADD COLUMN search_key TEXT;
CREATE INDEX IF NOT EXISTS idx_products_search_key ON products(search_key);

-- NOTE:
-- Pack unit compatibility with product base_unit_type and canonical_size conversion
-- must be enforced by application logic on save:
-- weight -> allowed units g|kg, canonical in g
-- volume -> allowed units ml|L, canonical in ml
-- count  -> allowed unit each, canonical in each
