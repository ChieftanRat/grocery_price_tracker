import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: 'Add' },
  { to: '/shopping', label: 'Shopping List' },
  { to: '/more', label: 'More' }
];

export function BottomTabs() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t bg-white p-2">
      <ul className="mx-auto flex max-w-md justify-around">
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => `px-3 py-2 text-sm ${isActive ? 'text-green-700 font-semibold' : 'text-slate-600'}`}
            >
              {tab.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
