(function () {
  'use strict';
  const data = window.Menu2026Data;
  const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const slug = value => normalize(value).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const byId = new Map();
  const byLabel = new Map();
  function index(nodes, departmentId, parentId = departmentId) {
    return nodes.map((entry, position) => {
      const source = typeof entry === 'string' ? { label: entry, children: [] } : entry;
      const id = `${parentId}/${slug(source.label)}-${position}`;
      const node = { ...source, id, departmentId, children: index(source.children || [], departmentId, id) };
      byId.set(id, node);
      const label = normalize(node.label);
      if (!byLabel.has(label)) byLabel.set(label, []);
      byLabel.get(label).push(node);
      return node;
    });
  }
  data.departments.forEach(item => index(item.children || [], item.id));
  // Shortcuts always resolve to the same canonical branch, never a copied tree.
  function resolve(label, departmentId, nodeId) {
    if (nodeId) return byId.get(nodeId) || null;
    const normalized = normalize(label);
    const candidates = byLabel.get(data.categoryAliases?.[normalized] || normalized) || [];
    const scoped = candidates.filter(node => node.departmentId === departmentId);
    return (scoped.length ? scoped : candidates).slice().sort((a, b) => b.children.length - a.children.length)[0] || null;
  }
  window.Menu2026Tree = { resolve, byId };
})();
