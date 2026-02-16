import { useEffect, useState } from 'react';
import { dataService } from '../db/service';

export function ShoppingListScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [includeSpecials, setIncludeSpecials] = useState(true);
  const [sort, setSort] = useState<'name' | 'store'>('name');

  useEffect(() => { dataService.productsLive().subscribe(setProducts); }, []);
  useEffect(() => {
    dataService.getShoppingCards(products.map((p) => p.product_id), windowDays, includeSpecials).then((r: any) => {
      const sorted = [...r].sort((a, b) => sort === 'name' ? `${a.product.brand} ${a.product.name}`.localeCompare(`${b.product.brand} ${b.product.name}`) : (a.lowest?.store_name ?? 'zzz').localeCompare(b.lowest?.store_name ?? 'zzz'));
      setCards(sorted);
    });
  }, [products, windowDays, includeSpecials, sort]);

  return <div className="space-y-3 pb-24"><div className="card"><h2 className="font-semibold">Shopping List</h2><div className="flex gap-2"><select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value) as 7 | 30 | 90)}><option value={7}>7</option><option value={30}>30</option><option value={90}>90</option></select><label className="flex items-center gap-2"><input type="checkbox" checked={includeSpecials} onChange={(e) => setIncludeSpecials(e.target.checked)} />Include specials</label><select value={sort} onChange={(e) => setSort(e.target.value as any)}><option value="name">Product name</option><option value="store">Cheapest store</option></select></div></div>{cards.map((c) => <div key={c.product.product_id} className="card"><h3 className="font-medium">{c.product.brand} {c.product.name} {c.product.variant ?? ''}</h3><p className="text-sm">Lowest: {c.lowest ? `${c.lowest.store_name} ${c.lowest.total_price_paid.toFixed(2)} (${c.lowest.unit_price.toFixed(3)})` : 'No data in window'}</p><p className="text-sm">Last paid: {c.last ? `${c.last.store_name} ${c.last.total_price_paid.toFixed(2)} (${c.last.unit_price.toFixed(3)})` : 'No history'}</p></div>)}</div>;
}
