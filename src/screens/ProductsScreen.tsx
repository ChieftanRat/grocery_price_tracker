import { useEffect, useState } from 'react';
import { dataService } from '../db/service';

export function ProductsScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [history, setHistory] = useState<any[]>([]);
  useEffect(() => { dataService.productsLive().subscribe(setProducts); }, []);
  useEffect(() => { if (selected) dataService.getProductHistory(selected).then(setHistory); }, [selected]);

  return <div className="space-y-3"><h2 className="font-semibold">Products</h2><div className="card"><select value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Select product</option>{products.map((p) => <option key={p.product_id} value={p.product_id}>{p.brand} {p.name} {p.variant ?? ''}</option>)}</select></div>{selected && <div className="card space-y-1"><h3 className="font-medium">History</h3>{history.map((h) => <div key={h.purchase_id} className="border-b py-1 text-sm"><div>{h.date_time.slice(0, 10)} - {h.store_name}</div><div>{h.size_value}{h.size_unit} x {h.quantity} | {h.total_price_paid.toFixed(2)} | unit {h.unit_price.toFixed(3)} {h.was_on_special ? '⭐' : ''}</div></div>)}</div>}</div>;
}
