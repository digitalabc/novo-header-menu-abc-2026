// Dependency-free checks for the static preview's data and local asset registry.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const script of ['category-icons.js', 'menu-data.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', script), 'utf8'), context);
}
const data = context.window.Menu2026Data;
let assets = 0, branches = 0, leaves = 0;
for (const group of Object.values(data.assetRegistry)) {
  for (const file of Object.values(group)) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing asset: ${file}`);
    assets++;
  }
}
const walk = nodes => {
  for (const node of nodes) {
    if (typeof node === 'string') { assert.ok(node.trim()); leaves++; continue; }
    assert.ok(node.label.trim());
    assert.ok(Array.isArray(node.children));
    if (node.children.length) { branches++; walk(node.children); }
    else leaves++;
  }
};
for (const department of [data.principal, ...data.departments]) {
  walk(department.children || []);
  for (const brandId of department.brandIds || []) assert.ok(data.assetRegistry.brand[brandId], `Missing brand: ${brandId}`);
  for (const [, iconId] of department.featured || []) assert.ok(data.assetRegistry.icon[iconId], `Missing icon: ${iconId}`);
}
const metals = data.departments.find(item => item.id === 'metais');
assert.ok(metals.children.find(node => node.label === 'Metais para Banheiro').children.length > 0);
const ceramics = data.departments.find(item => item.id === 'loucas-inox');
const ceramicIcons = ceramics.featured.slice(0, 3).map(([, id]) => id);
assert.equal(new Set(ceramicIcons).size, 3, 'Bathroom basin families must have distinct artwork');
assert.equal(data.navigation.find(item => item.id === 'cupons').menu, 'link');
console.log(`OK: ${assets} local assets, ${branches} branches and ${leaves} leaves; brands, distinct basin artwork and Cupons link validated.`);
