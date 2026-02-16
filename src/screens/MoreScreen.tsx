import { Link, Route, Routes } from 'react-router-dom';
import { ProductsScreen } from './ProductsScreen';
import { StoresScreen } from './StoresScreen';
import { MergeToolScreen } from './MergeToolScreen';

function Menu() {
  return <div className="space-y-2"><h2 className="font-semibold">More</h2><div className="card flex flex-col gap-2"><Link to="products">Products</Link><Link to="stores">Stores</Link><Link to="merge">Merge Tool</Link></div></div>;
}

export function MoreScreen() {
  return <Routes><Route path="/" element={<Menu />} /><Route path="products" element={<ProductsScreen />} /><Route path="stores" element={<StoresScreen />} /><Route path="merge" element={<MergeToolScreen />} /></Routes>;
}
