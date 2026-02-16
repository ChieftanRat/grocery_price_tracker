import fs from 'node:fs';

const files = [
  'src/screens/AddPurchaseScreen.tsx',
  'src/screens/ShoppingListScreen.tsx',
  'src/db/service.ts'
];

for (const f of files) {
  if (!fs.existsSync(f)) throw new Error(`Missing ${f}`);
}

const add = fs.readFileSync('src/screens/AddPurchaseScreen.tsx', 'utf8');
const shopping = fs.readFileSync('src/screens/ShoppingListScreen.tsx', 'utf8');
if (!add.includes('Save') || !shopping.includes('Shopping List')) {
  throw new Error('Smoke content checks failed.');
}
console.log('Smoke checks passed for Add -> Save -> Shopping List wiring.');
