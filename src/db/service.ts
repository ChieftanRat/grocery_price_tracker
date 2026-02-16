import { liveQuery } from 'dexie';
import { db } from './db';
import type { BaseUnitType, Pack, Product, Purchase, PurchaseView, SizeUnit, Store } from './types';

const allowedUnits: Record<BaseUnitType, SizeUnit[]> = {
  weight: ['g', 'kg'],
  volume: ['ml', 'L'],
  count: ['each']
};

const nowIso = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const round = (n: number) => Math.round(n * 100000) / 100000;

export function canonicalize(sizeValue: number, sizeUnit: SizeUnit, base: BaseUnitType) {
  if (!allowedUnits[base].includes(sizeUnit)) throw new Error('Pack unit incompatible with product base unit type.');
  if (sizeValue <= 0) throw new Error('size_value must be > 0.');
  if (sizeUnit === 'kg') return sizeValue * 1000;
  if (sizeUnit === 'L') return sizeValue * 1000;
  return sizeValue;
}

function validatePurchase(payload: { quantity: number; total_price_paid: number; canonical_size: number; }) {
  if (!Number.isInteger(payload.quantity) || payload.quantity <= 0) throw new Error('quantity must be integer > 0.');
  if (payload.total_price_paid < 0) throw new Error('total_price_paid must be >= 0.');
  if (payload.canonical_size * payload.quantity <= 0) throw new Error('total units must be > 0.');
}

export const dataService = {
  productsLive: () => liveQuery(() => db.products.toArray()),
  storesLive: () => liveQuery(() => db.stores.toArray()),
  packsForProductLive: (productId: string) => liveQuery(() => db.packs.where('product_id').equals(productId).toArray()),

  async getLastUsedStoreId() { return (await db.meta.get('lastStore'))?.value; },
  async setLastUsedStoreId(store_id: string) { await db.meta.put({ key: 'lastStore', value: store_id }); },

  async searchProducts(term: string) {
    const t = term.toLowerCase();
    return db.products.filter((p) => `${p.brand} ${p.name} ${p.variant ?? ''}`.toLowerCase().includes(t)).limit(15).toArray();
  },

  async addProductWithPack(input: {
    brand: string; name: string; variant?: string; base_unit_type: BaseUnitType;
    size_value: number; size_unit: SizeUnit; pack_descriptor?: string;
  }) {
    const canonical_unit = input.base_unit_type === 'weight' ? 'g' : input.base_unit_type === 'volume' ? 'ml' : 'each';
    const product: Product = {
      product_id: id(), brand: input.brand.trim(), name: input.name.trim(), variant: input.variant?.trim(),
      search_key: `${input.brand} ${input.name} ${input.variant ?? ''}`.toLowerCase(),
      base_unit_type: input.base_unit_type, canonical_unit, created_at: nowIso()
    };
    const canonical_size = canonicalize(input.size_value, input.size_unit, input.base_unit_type);
    const pack: Pack = {
      pack_id: id(), product_id: product.product_id, size_value: input.size_value, size_unit: input.size_unit,
      pack_descriptor: input.pack_descriptor?.trim(), canonical_size, created_at: nowIso()
    };
    await db.transaction('rw', db.products, db.packs, async () => {
      await db.products.add(product);
      await db.packs.add(pack);
    });
    return { product, pack };
  },

  async addPack(input: { product_id: string; size_value: number; size_unit: SizeUnit; pack_descriptor?: string; }) {
    const product = await db.products.get(input.product_id);
    if (!product) throw new Error('Product not found.');
    const canonical_size = canonicalize(input.size_value, input.size_unit, product.base_unit_type);
    const pack: Pack = {
      pack_id: id(), product_id: input.product_id, size_value: input.size_value, size_unit: input.size_unit,
      pack_descriptor: input.pack_descriptor?.trim(), canonical_size, created_at: nowIso()
    };
    await db.packs.add(pack);
    return pack;
  },

  async savePurchase(input: Omit<Purchase, 'purchase_id' | 'created_at'>) {
    const pack = await db.packs.get(input.pack_id);
    if (!pack) throw new Error('Pack not found.');
    validatePurchase({ quantity: input.quantity, total_price_paid: input.total_price_paid, canonical_size: pack.canonical_size });
    const purchase: Purchase = { ...input, purchase_id: id(), created_at: nowIso() };
    await db.purchases.add(purchase);
    await dataService.setLastUsedStoreId(input.store_id);
    return purchase;
  },

  async getLatestPurchaseByProduct(product_id: string): Promise<PurchaseView | undefined> {
    const packs = await db.packs.where('product_id').equals(product_id).primaryKeys();
    const purchases = await db.purchases.filter((p) => packs.includes(p.pack_id)).toArray();
    const latest = purchases.sort((a, b) => (a.date_time < b.date_time ? 1 : -1))[0];
    if (!latest) return undefined;
    return this.toView(latest);
  },

  async toView(p: Purchase): Promise<PurchaseView> {
    const [store, pack] = await Promise.all([db.stores.get(p.store_id), db.packs.get(p.pack_id)]);
    if (!store || !pack) throw new Error('Linked records missing.');
    const product = await db.products.get(pack.product_id);
    if (!product) throw new Error('Product missing.');
    return {
      ...p,
      store_name: store.name,
      product_id: product.product_id,
      brand: product.brand,
      name: product.name,
      variant: product.variant,
      pack_descriptor: pack.pack_descriptor,
      size_value: pack.size_value,
      size_unit: pack.size_unit,
      unit_price: round(p.total_price_paid / (pack.canonical_size * p.quantity || 1))
    };
  },

  async getShoppingCards(productIds: string[], windowDays: 7 | 30 | 90, includeSpecials: boolean) {
    const lowerBound = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const cards = await Promise.all(productIds.map(async (pid) => {
      const packs = await db.packs.where('product_id').equals(pid).toArray();
      const packMap = new Map(packs.map((p) => [p.pack_id, p]));
      const all = await db.purchases.filter((p) => packMap.has(p.pack_id)).toArray();
      const filtered = all.filter((p) => new Date(p.date_time).getTime() >= lowerBound && (includeSpecials || p.was_on_special === 0));
      const withUnit = filtered.map((p) => ({ p, unit: p.total_price_paid / ((packMap.get(p.pack_id)?.canonical_size ?? 1) * p.quantity) }))
        .sort((a, b) => a.unit - b.unit || (a.p.date_time < b.p.date_time ? 1 : -1));
      const lowest = withUnit[0] ? await this.toView(withUnit[0].p) : undefined;
      const last = await this.getLatestPurchaseByProduct(pid);
      const product = await db.products.get(pid);
      return product ? { product, lowest, last } : undefined;
    }));
    return cards.filter(Boolean);
  },

  async getProductHistory(product_id: string) {
    const packs = await db.packs.where('product_id').equals(product_id).toArray();
    const packIds = packs.map((p) => p.pack_id);
    const rows = await db.purchases.filter((p) => packIds.includes(p.pack_id)).toArray();
    const views = await Promise.all(rows.map((p) => this.toView(p)));
    return views.sort((a, b) => (a.date_time < b.date_time ? 1 : -1));
  },

  async getStorePurchases(store_id: string, windowDays: 7 | 30 | 90, includeSpecials: boolean) {
    const lowerBound = Date.now() - windowDays * 24 * 60 * 60 * 1000;
    const rows = await db.purchases.where('store_id').equals(store_id).toArray();
    const filtered = rows.filter((p) => new Date(p.date_time).getTime() >= lowerBound && (includeSpecials || p.was_on_special === 0));
    const views = await Promise.all(filtered.map((p) => this.toView(p)));
    return views.sort((a, b) => (a.date_time < b.date_time ? 1 : -1));
  },

  async mergeProducts(sourceId: string, targetId: string) {
    if (sourceId === targetId) throw new Error('source and target must differ.');
    await db.transaction('rw', db.products, db.packs, async () => {
      const source = await db.products.get(sourceId);
      const target = await db.products.get(targetId);
      if (!source || !target) throw new Error('Source/target product missing.');
      const packs = await db.packs.where('product_id').equals(sourceId).toArray();
      await Promise.all(packs.map((p) => db.packs.update(p.pack_id, { product_id: targetId })));
      await db.products.delete(sourceId);
    });
  },

  async seedDemoData() {
    const stores: Store[] = [
      { store_id: id(), name: 'Fresh Mart', location_label: 'Downtown', created_at: nowIso() },
      { store_id: id(), name: 'Budget Foods', location_label: 'North', created_at: nowIso() }
    ];
    await db.stores.bulkPut(stores);
    const milk = await this.addProductWithPack({ brand: 'FarmCo', name: 'Milk', variant: 'Full Cream', base_unit_type: 'volume', size_value: 2, size_unit: 'L', pack_descriptor: '2L bottle' });
    const apples = await this.addProductWithPack({ brand: 'Orchard', name: 'Apples', variant: 'Royal Gala', base_unit_type: 'weight', size_value: 1, size_unit: 'kg', pack_descriptor: '1kg bag' });
    await this.savePurchase({ date_time: nowIso(), store_id: stores[0].store_id, pack_id: milk.pack.pack_id, quantity: 1, total_price_paid: 4.99, was_on_special: 0 });
    await this.savePurchase({ date_time: nowIso(), store_id: stores[1].store_id, pack_id: apples.pack.pack_id, quantity: 2, total_price_paid: 7.5, was_on_special: 1 });
  }
};
