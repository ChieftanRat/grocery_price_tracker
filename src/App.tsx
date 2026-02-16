import { Link, Route, Routes } from 'react-router-dom';
import { BottomTabs } from './components/BottomTabs';
import { AddPurchaseScreen } from './screens/AddPurchaseScreen';
import { ShoppingListScreen } from './screens/ShoppingListScreen';
import { MoreScreen } from './screens/MoreScreen';

export default function App() {
  return (
    <main className="mx-auto min-h-screen max-w-md p-3">
      <header className="mb-3 flex items-center justify-between"><h1 className="text-lg font-bold text-green-800">Grocery Price Tracker</h1><Link to="/">Home</Link></header>
      <Routes>
        <Route path="/" element={<AddPurchaseScreen />} />
        <Route path="/shopping" element={<ShoppingListScreen />} />
        <Route path="/more/*" element={<MoreScreen />} />
      </Routes>
      <BottomTabs />
    </main>
  );
}
