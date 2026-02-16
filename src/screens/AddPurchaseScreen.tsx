import { useEffect, useMemo, useState } from 'react';
import { dataService } from '../db/service';
import type { BaseUnitType, Product, SizeUnit } from '../db/types';
import { Modal } from '../components/Modal';

const unitOptions: SizeUnit[] = ['g', 'kg', 'ml', 'L', 'each'];

export function AddPurchaseScreen() {
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [query, setQuery] = useState('');
  const [selectedStore, setSelectedStore] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [packs, setPacks] = useState<any[]>([]);
  const [packId, setPackId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [special, setSpecial] = useState(false);
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [showNewPack, setShowNewPack] = useState(false);

  useEffect(() => {
    dataService.storesLive().subscribe(async (s) => {
      setStores(s);
      const last = await dataService.getLastUsedStoreId();
      setSelectedStore(last ?? s[0]?.store_id ?? '');
    });
    dataService.productsLive().subscribe(setProducts);
  }, []);

  useEffect(() => {
    if (!selectedProduct) return;
    dataService.packsForProductLive(selectedProduct).subscribe((p) => {
      setPacks(p);
      setPackId(p[0]?.pack_id ?? '');
    });
    dataService.getLatestPurchaseByProduct(selectedProduct).then((last) => {
      if (!last) return;
      setSelectedStore(last.store_id);
      setQuantity(last.quantity);
      setPackId(last.pack_id);
    });
  }, [selectedProduct]);

  const filtered = useMemo(() => {
    if (!query.trim()) return products.slice(0, 8);
    return products.filter((p) => `${p.brand} ${p.name} ${p.variant ?? ''}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8);
  }, [products, query]);

  const totalUnits = useMemo(() => (packs.find((p) => p.pack_id === packId)?.canonical_size ?? 0) * quantity, [packs, packId, quantity]);
  const canSave = !!(selectedStore && selectedProduct && packId && price !== '' && Number(price) >= 0 && Number.isInteger(quantity) && quantity > 0 && totalUnits > 0);

  async function save() {
    try {
      setError('');
      await dataService.savePurchase({ date_time: `${date}T12:00:00.000Z`, store_id: selectedStore, pack_id: packId, quantity, total_price_paid: Number(price), was_on_special: special ? 1 : 0 });
      setOk('Saved purchase.');
      setPrice('');
    } catch (e: any) { setError(e.message); }
  }

  return (
    <div className="space-y-3 pb-24">
      <div className="card sticky top-0 z-10 space-y-2">
        <h2 className="font-semibold">Add Purchase</h2>
        <select value={selectedStore} onChange={(e) => setSelectedStore(e.target.value)}>{stores.map((s) => <option key={s.store_id} value={s.store_id}>{s.name}</option>)}</select>
        <input placeholder="Search product" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="flex gap-2 overflow-auto pb-1">{filtered.map((p) => <button key={p.product_id} onClick={() => setSelectedProduct(p.product_id)}>{p.brand} {p.name}</button>)}</div>
        <button onClick={() => setShowNewProduct(true)}>+ New product</button>
      </div>

      <div className="card space-y-2">
        <select value={packId} onChange={(e) => setPackId(e.target.value)}>{packs.map((p) => <option key={p.pack_id} value={p.pack_id}>{p.pack_descriptor ?? `${p.size_value}${p.size_unit}`}</option>)}</select>
        <button onClick={() => setShowNewPack(true)} disabled={!selectedProduct}>+ New pack</button>
        <div className="flex items-center gap-2"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>-</button><span>{quantity}</span><button onClick={() => setQuantity((q) => q + 1)}>+</button></div>
        <input type="number" min="0" step="0.01" placeholder="Total price" value={price} onChange={(e) => setPrice(e.target.value)} autoFocus />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={special} onChange={(e) => setSpecial(e.target.checked)} /> On special</label>
      </div>

      {error && <p className="text-red-600">{error}</p>}
      {ok && <p className="text-green-700">{ok}</p>}
      <button className="fixed bottom-16 left-1/2 w-[calc(100%-1rem)] max-w-md -translate-x-1/2 bg-green-700 text-white disabled:bg-slate-300" disabled={!canSave} onClick={save}>Save</button>

      {showNewProduct && <NewProductModal onClose={() => setShowNewProduct(false)} onSaved={(id) => { setSelectedProduct(id); setShowNewProduct(false); }} />}
      {showNewPack && <NewPackModal productId={selectedProduct} onClose={() => setShowNewPack(false)} onSaved={(id) => { setPackId(id); setShowNewPack(false); }} />}
    </div>
  );
}

function NewProductModal({ onClose, onSaved }: { onClose: () => void; onSaved: (id: string) => void; }) {
  const [brand, setBrand] = useState('');
  const [name, setName] = useState('');
  const [variant, setVariant] = useState('');
  const [base, setBase] = useState<BaseUnitType>('weight');
  const [size, setSize] = useState('1');
  const [unit, setUnit] = useState<SizeUnit>('kg');
  const [descriptor, setDescriptor] = useState('');
  const [error, setError] = useState('');

  const preview = useMemo(() => {
    try { return dataService ? `${(dataService as any) && ''}${size} ${unit}` : ''; } catch { return ''; }
  }, [size, unit]);

  async function save() {
    try {
      const { product } = await dataService.addProductWithPack({ brand, name, variant, base_unit_type: base, size_value: Number(size), size_unit: unit, pack_descriptor: descriptor });
      onSaved(product.product_id);
    } catch (e: any) { setError(e.message); }
  }

  return <Modal title="New Product" onClose={onClose}><div className="space-y-2"><input placeholder="Brand" value={brand} onChange={(e) => setBrand(e.target.value)} /><input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} /><input placeholder="Variant" value={variant} onChange={(e) => setVariant(e.target.value)} /><select value={base} onChange={(e) => setBase(e.target.value as BaseUnitType)}><option value="weight">weight</option><option value="volume">volume</option><option value="count">count</option></select><input type="number" min="0.001" step="0.001" value={size} onChange={(e) => setSize(e.target.value)} /><select value={unit} onChange={(e) => setUnit(e.target.value as SizeUnit)}>{unitOptions.map((u) => <option key={u}>{u}</option>)}</select><input placeholder="Descriptor" value={descriptor} onChange={(e) => setDescriptor(e.target.value)} /><p className="text-sm">Canonical preview: {preview}</p>{error && <p className="text-red-600">{error}</p>}<button onClick={save}>Create</button></div></Modal>;
}

function NewPackModal({ productId, onClose, onSaved }: { productId: string; onClose: () => void; onSaved: (id: string) => void; }) {
  const [size, setSize] = useState('1');
  const [unit, setUnit] = useState<SizeUnit>('kg');
  const [descriptor, setDescriptor] = useState('');
  const [preview, setPreview] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      const product = (await dataService.searchProducts('')).find((p) => p.product_id === productId);
      if (!product) return;
      try { setPreview(String((await import('../db/service')).canonicalize(Number(size), unit, product.base_unit_type))); } catch { setPreview('invalid'); }
    })();
  }, [size, unit, productId]);

  async function save() {
    try {
      const pack = await dataService.addPack({ product_id: productId, size_value: Number(size), size_unit: unit, pack_descriptor: descriptor });
      onSaved(pack.pack_id);
    } catch (e: any) { setError(e.message); }
  }

  return <Modal title="New Pack" onClose={onClose}><div className="space-y-2"><input type="number" min="0.001" step="0.001" value={size} onChange={(e) => setSize(e.target.value)} /><select value={unit} onChange={(e) => setUnit(e.target.value as SizeUnit)}>{unitOptions.map((u) => <option key={u}>{u}</option>)}</select><input placeholder="Descriptor" value={descriptor} onChange={(e) => setDescriptor(e.target.value)} /><p className="text-sm">Canonical size preview: {preview}</p>{error && <p className="text-red-600">{error}</p>}<button onClick={save}>Create pack</button></div></Modal>;
}
