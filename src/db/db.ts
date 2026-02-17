import Dexie, { type Table } from 'dexie';
import type { Pack, Product, Purchase, Store } from './types';

export class GroceryDB extends Dexie {
  stores!: Table<Store, string>;
  products!: Table<Product, string>;
  packs!: Table<Pack, string>;
  purchases!: Table<Purchase, string>;
  meta!: Table<{ key: string; value: string }, string>;

  constructor() {
    super('grocery_price_tracker');
    this.version(1).stores({
      stores: '&store_id, name',
      products: '&product_id, [brand+name+variant], search_key',
      packs: '&pack_id, product_id',
      purchases: '&purchase_id, date_time, [pack_id+date_time], store_id',
      meta: '&key'
    });
  }
}

export const db = new GroceryDB();
