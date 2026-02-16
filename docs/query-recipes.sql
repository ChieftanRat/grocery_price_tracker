-- Query recipes for core business logic.

-- Inputs (bind parameters expected by app layer):
-- :product_id TEXT
-- :window_days INTEGER -- 7|30|90 (default 30)
-- :include_specials INTEGER -- 0 or 1

-- Lowest observed unit price per product in a time window.
-- Tie-break: newest date_time wins.
SELECT
  p.purchase_id,
  pr.product_id,
  pr.brand,
  pr.name,
  pr.variant,
  s.name AS store_name,
  p.date_time,
  pk.pack_descriptor,
  pk.size_value,
  pk.size_unit,
  p.quantity,
  p.total_price_paid,
  p.was_on_special,
  (pk.canonical_size * p.quantity) AS total_units,
  CASE
    WHEN (pk.canonical_size * p.quantity) > 0
      THEN (p.total_price_paid * 1.0) / (pk.canonical_size * p.quantity)
    ELSE NULL
  END AS unit_price
FROM purchases p
JOIN packs pk ON pk.pack_id = p.pack_id
JOIN products pr ON pr.product_id = pk.product_id
JOIN stores s ON s.store_id = p.store_id
WHERE pr.product_id = :product_id
  AND p.date_time >= datetime('now', '-' || :window_days || ' days')
  AND (:include_specials = 1 OR p.was_on_special = 0)
ORDER BY unit_price ASC, p.date_time DESC
LIMIT 1;

-- Most recent purchase for product.
SELECT
  p.purchase_id,
  s.name AS store_name,
  p.date_time,
  pk.pack_descriptor,
  pk.size_value,
  pk.size_unit,
  p.quantity,
  p.total_price_paid,
  p.was_on_special,
  CASE
    WHEN (pk.canonical_size * p.quantity) > 0
      THEN (p.total_price_paid * 1.0) / (pk.canonical_size * p.quantity)
    ELSE NULL
  END AS unit_price
FROM purchases p
JOIN packs pk ON pk.pack_id = p.pack_id
JOIN stores s ON s.store_id = p.store_id
WHERE pk.product_id = :product_id
ORDER BY p.date_time DESC
LIMIT 1;

-- Shopping list batch query for selected products.
-- Expected app strategy:
-- 1) For each selected product: fetch lowest and recent in parallel,
--    OR use a window-function based CTE grouped by product.
-- 2) Respect :window_days and :include_specials for lowest.

-- Store drill-down recent purchases in window.
SELECT
  p.purchase_id,
  p.date_time,
  pr.brand,
  pr.name,
  pr.variant,
  pk.pack_descriptor,
  pk.size_value,
  pk.size_unit,
  p.quantity,
  p.total_price_paid,
  p.was_on_special,
  CASE
    WHEN (pk.canonical_size * p.quantity) > 0
      THEN (p.total_price_paid * 1.0) / (pk.canonical_size * p.quantity)
    ELSE NULL
  END AS unit_price
FROM purchases p
JOIN packs pk ON pk.pack_id = p.pack_id
JOIN products pr ON pr.product_id = pk.product_id
WHERE p.store_id = :store_id
  AND p.date_time >= datetime('now', '-' || :window_days || ' days')
  AND (:include_specials = 1 OR p.was_on_special = 0)
ORDER BY p.date_time DESC;

-- Optional average unit price per product at a store.
SELECT
  pr.product_id,
  pr.brand,
  pr.name,
  pr.variant,
  AVG((p.total_price_paid * 1.0) / (pk.canonical_size * p.quantity)) AS avg_unit_price
FROM purchases p
JOIN packs pk ON pk.pack_id = p.pack_id
JOIN products pr ON pr.product_id = pk.product_id
WHERE p.store_id = :store_id
  AND p.date_time >= datetime('now', '-' || :window_days || ' days')
  AND (:include_specials = 1 OR p.was_on_special = 0)
GROUP BY pr.product_id, pr.brand, pr.name, pr.variant
ORDER BY pr.brand, pr.name, pr.variant;
