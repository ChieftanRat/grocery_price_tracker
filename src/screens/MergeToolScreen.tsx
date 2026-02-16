import { useEffect, useState } from 'react';
import { dataService } from '../db/service';

export function MergeToolScreen() {
  const [products, setProducts] = useState<any[]>([]);
  const [source, setSource] = useState('');
  const [target, setTarget] = useState('');
  const [msg, setMsg] = useState('');
  useEffect(() => { dataService.productsLive().subscribe(setProducts); }, []);
  async function merge() {
    try { await dataService.mergeProducts(source, target); setMsg('Merge complete with transaction safety.'); }
    catch (e: any) { setMsg(`Rollback triggered: ${e.message}`); }
  }
  return <div className="space-y-3"><h2 className="font-semibold">Merge Tool</h2><div className="card space-y-2"><select value={source} onChange={(e) => setSource(e.target.value)}><option value="">Source product</option>{products.map((p) => <option key={p.product_id} value={p.product_id}>{p.brand} {p.name}</option>)}</select><select value={target} onChange={(e) => setTarget(e.target.value)}><option value="">Target product</option>{products.map((p) => <option key={p.product_id} value={p.product_id}>{p.brand} {p.name}</option>)}</select><button disabled={!source || !target || source === target} onClick={merge}>Merge</button>{msg && <p className="text-sm">{msg}</p>}</div></div>;
}
