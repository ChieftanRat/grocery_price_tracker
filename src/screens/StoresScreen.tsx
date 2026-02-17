import { useEffect, useState } from 'react';
import { dataService } from '../db/service';

export function StoresScreen() {
  const [stores, setStores] = useState<any[]>([]);
  const [selected, setSelected] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [windowDays, setWindowDays] = useState<7 | 30 | 90>(30);
  const [includeSpecials, setIncludeSpecials] = useState(true);

  useEffect(() => { dataService.storesLive().subscribe(setStores); }, []);
  useEffect(() => { if (selected) dataService.getStorePurchases(selected, windowDays, includeSpecials).then(setRows); }, [selected, windowDays, includeSpecials]);

  return <div className="space-y-3"><h2 className="font-semibold">Stores</h2><div className="card space-y-2"><select value={selected} onChange={(e) => setSelected(e.target.value)}><option value="">Select store</option>{stores.map((s) => <option key={s.store_id} value={s.store_id}>{s.name} {s.location_label ? `- ${s.location_label}` : ''}</option>)}</select><div className="flex gap-2"><select value={windowDays} onChange={(e) => setWindowDays(Number(e.target.value) as any)}><option value={7}>7</option><option value={30}>30</option><option value={90}>90</option></select><label className="flex items-center gap-1"><input type="checkbox" checked={includeSpecials} onChange={(e) => setIncludeSpecials(e.target.checked)} />specials</label></div></div>{rows.map((r) => <div key={r.purchase_id} className="card text-sm">{r.date_time.slice(0,10)} • {r.brand} {r.name} • {r.total_price_paid.toFixed(2)} • {r.unit_price.toFixed(3)}</div>)}</div>;
}
