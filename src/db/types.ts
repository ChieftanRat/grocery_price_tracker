export type BaseUnitType = 'weight' | 'volume' | 'count';
export type CanonicalUnit = 'g' | 'ml' | 'each';
export type SizeUnit = 'g' | 'kg' | 'ml' | 'L' | 'each';

export interface Store { store_id: string; name: string; location_label?: string; created_at: string; }
export interface Product {
  product_id: string; name: string; brand: string; variant?: string; search_key?: string;
  base_unit_type: BaseUnitType; canonical_unit: CanonicalUnit; created_at: string;
}
export interface Pack {
  pack_id: string; product_id: string; size_value: number; size_unit: SizeUnit;
  pack_descriptor?: string; canonical_size: number; created_at: string;
}
export interface Purchase {
  purchase_id: string; date_time: string; store_id: string; pack_id: string;
  quantity: number; total_price_paid: number; was_on_special: 0 | 1; notes?: string; created_at: string;
}

export interface PurchaseView extends Purchase {
  store_name: string;
  product_id: string;
  brand: string;
  name: string;
  variant?: string;
  pack_descriptor?: string;
  size_value: number;
  size_unit: SizeUnit;
  unit_price: number;
}
