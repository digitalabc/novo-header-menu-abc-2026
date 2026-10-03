// Dependency-free checks for the static preview's data and local asset registry.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const context = vm.createContext({ window: {} });
for (const script of ['category-icons.js', 'menu-data.js', 'category-tree.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, 'js', script), 'utf8'), context);
}
const data = context.window.Menu2026Data;
const tree = context.window.Menu2026Tree;
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
for (const [label] of data.principal.featured) {
  const shortcut = tree.resolve(label, data.principal.id);
  assert.ok(shortcut, `Shortcut must resolve: ${label}`);
  assert.equal(tree.resolve(label, shortcut.departmentId).id, shortcut.id, `Shortcut and department differ: ${label}`);
}
for (const node of tree.byId.values()) {
  assert.equal(tree.resolve(node.label, node.departmentId, node.id), node);
  for (const child of node.children) assert.ok(tree.byId.has(child.id));
}
const normalize = label => label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const iconFor = label => data.categoryIconRules.find(rule => new RegExp(rule.pattern).test(normalize(label)))?.iconId || 'generic';
const porcelain = tree.resolve('Porcelanato', 'pisos-revestimentos');
assert.equal(tree.resolve('Chuveiros', 'banheiro').id, tree.resolve('Chuveiro').id, 'Environment aliases must reach the same shower branch');
assert.equal(new Set(porcelain.children.map(child => iconFor(child.label))).size, 10, 'Each porcelain type needs distinct imagery');
assert.equal(new Set(porcelain.children.map(child => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, data.assetRegistry.icon[iconFor(child.label)]))).digest('hex'))).size, 10, 'Porcelain assets must be genuinely different files');
assert.ok(porcelain.children.some(child => child.children.length), 'Porcelain must reach the catalog format level');
assert.equal(iconFor('Resistência Elétrica'), 'chuveiro-resistencia');
assert.equal(iconFor('Acessórios para Banheiro'), 'acessorios-banheiro');
assert.equal(iconFor('Saboneteiras'), 'saboneteira');
assert.equal(iconFor('Nichos'), 'nicho');
assert.equal(iconFor('Tinta emborrachada para parede'), 'tinta-emborrachada');
for (const [id, asset] of Object.entries(data.assetRegistry.icon)) {
  if (asset.endsWith('.svg')) continue;
  assert.ok(asset.endsWith('.webp'), `Raster icon must use WebP: ${id}`);
  assert.ok(fs.statSync(path.join(root, asset)).size < 15000, `Icon over 15 KB: ${id}`);
}
console.log(`OK: ${assets} local assets, ${branches} branches and ${leaves} leaves; canonical navigation, distinct porcelain/basin artwork, WebP icons < 15 KB, brands and Cupons link validated.`);
