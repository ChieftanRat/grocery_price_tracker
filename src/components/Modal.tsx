import type { ReactNode } from 'react';

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode; }) {
  return (
    <div className="fixed inset-0 z-20 bg-black/50 p-4">
      <div className="mx-auto mt-12 max-w-md rounded-xl bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
