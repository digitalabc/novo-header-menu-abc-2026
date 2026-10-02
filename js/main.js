(function () {
  'use strict';

  const data = window.Menu2026Data;
  const header = document.getElementById('site-header');
  const menuRoot = document.getElementById('menu-root');
  const desktopQuery = window.matchMedia('(min-width: 900px)');
  const state = { desktopMenu: null, desktopSelection: 'principais-categorias', desktopAnimation: 'open', environment: 'banheiro', desktopSearchOpen: false, desktopSearchValue: '', searchOpen: false, searchDropdown: false, drawerOpen: false, drawerLevel: 'root', drawerId: null, drawerCategory: null, drawerHistory: [], drawerPreviousHtml: '', drawerPreviousScroll: 0, drawerDirection: 'forward', drawerExpanded: new Set(['principais-categorias']), drawerBusy: false, loggedIn: true, regionalized: true, opener: null };
  let desktopOpenTimer;
  let desktopCloseTimer;
  let desktopExitTimer;
  let desktopInteraction = 'pointer';
  let drawerAnimationTimer;
  let scrollFadeObserver;

  const catalogIconIds = new Set(data.catalogIconIds);
  const categoryIconRules = data.categoryIconRules.map(rule => ({ iconId: rule.iconId, pattern: new RegExp(rule.pattern) }));
  const icon = (id, className = '') => `<img class="${className}${catalogIconIds.has(id) ? ' category-image--catalog' : ''}" src="${data.assetRegistry.icon[id] || data.assetRegistry.icon.generic}" alt="" decoding="async">`;
  const chevron = (direction = 'right') => `<span class="chevron chevron--${direction}" aria-hidden="true"></span>`;
  const navChevron = () => '<span class="nav-chevron" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg></span>';
  const safeId = value => String(value).replace(/[^a-z0-9-]/gi, '-').toLowerCase();

  function render() {
    // Preserve the drawer shell so lateral navigation does not replay its entrance.
    const drawer = document.getElementById('mobile-drawer');
    if (!desktopQuery.matches && state.drawerOpen && drawer) {
      drawer.querySelector('.drawer-view-header').innerHTML = renderDrawerViewHeader();
      drawer.querySelector('.drawer-body').innerHTML = renderDrawerTrack();
      bindDrawerPanelEvents();
      syncDocumentLock();
      return;
    }
    header.innerHTML = desktopQuery.matches ? renderDesktopHeader() : renderMobileHeader();
    menuRoot.innerHTML = desktopQuery.matches ? renderDesktopMenu() : renderMobileLayers();
    bindEvents();
    syncDocumentLock();
  }

  function renderDesktopHeader() {
    return `<div class="desktop-header">
      <div class="topbar"><div class="container topbar__content">
        <div class="topbar__group"><a class="chip chip--whatsapp" href="#">${assetImg('icon','whatsapp')}Compre pelo WhatsApp</a><a class="prime" href="#">${assetImg('logo','casaPrime')}</a></div>
        <div class="topbar__group topbar__group--end"><a class="chip chip--stores" href="#"><span aria-hidden="true">▰</span>Nossas Lojas</a><a class="chip chip--franchise" href="#">Seja um Franqueado</a></div>
      </div></div>
      <div class="desktop-main"><div class="container desktop-main__content">
        <a class="abc-logo" href="#" aria-label="ABC da Construção — início">${assetImg('logo','abc')}</a>
        <div class="desktop-actions desktop-actions--left">
          <button class="action-item" type="button" aria-label="Entrar na minha conta">${icon('conta', 'header-action-icon')}<span><strong>Entrar</strong><small>Minha conta</small></span>${chevron('down')}</button>
          <button class="action-item action-item--location" type="button" aria-label="Alterar local de entrega">${icon('regionalizacao', 'header-action-icon')}<span><small>Entregar em:</small><strong>32604-540 - Betim</strong></span>${chevron('down')}</button>
        </div>
        <div class="desktop-actions desktop-actions--right">
          ${renderSearch('desktop')}
          <button class="action-item action-item--cart" type="button" aria-label="Meu carrinho, zero itens"><span class="cart-icon">${icon('carrinho-mao', 'header-action-icon')}<b>0</b></span><span><strong>Meu carrinho</strong><small>00 itens</small></span></button>
        </div>
      </div></div>
      <nav class="desktop-nav" aria-label="Navegação principal"><div class="container desktop-nav__list">
        ${data.navigation.map(item => `<button class="nav-item ${state.desktopMenu && activeNav(item) ? 'is-active' : ''}" type="button" data-menu-action="${item.menu}" data-menu-id="${item.departmentId || item.id}" aria-expanded="${state.desktopMenu && activeNav(item) ? 'true' : 'false'}" aria-controls="desktop-mega-menu">${icon(item.iconId)}<span>${item.label}</span>${navChevron()}</button>`).join('')}
        <a class="sale-pill" href="#">Saldão de Ofertas <span aria-hidden="true">🔥</span></a>
      </div></nav>
    </div>`;
  }

  function activeNav(item) {
    if (state.desktopMenu === 'departments') return item.id === 'departamentos';
    if (state.desktopMenu === 'environments') return item.id === 'ambientes';
    return state.desktopMenu === item.departmentId;
  }

  function renderSearch(scope) {
    if (scope === 'desktop') {
      return `<div class="search search--desktop ${state.desktopSearchOpen ? 'is-expanded' : ''}" data-desktop-search><button class="search__toggle" type="button" data-expand-desktop-search aria-label="${state.desktopSearchOpen ? 'Fechar busca' : 'Abrir busca'}" aria-expanded="${state.desktopSearchOpen}" aria-controls="desktop-search-field"><span class="search__icon" aria-hidden="true"></span></button><div id="desktop-search-field" class="search__field" aria-hidden="${!state.desktopSearchOpen}" ${state.desktopSearchOpen ? '' : 'inert'}><span class="search__divider" aria-hidden="true"></span><input type="search" aria-label="Buscar produtos" placeholder="O que você procura para sua obra e reforma?" tabindex="${state.desktopSearchOpen ? '0' : '-1'}" data-search-input></div></div>`;
    }
    return `<div class="search search--${scope}"><span class="search__icon" aria-hidden="true"></span><span class="search__divider"></span><input type="search" aria-label="Buscar produtos" placeholder="O que você procura para sua obra ou reforma?" data-search-input></div>`;
  }

  function setDesktopSearchOpen(open, restoreFocus = false) {
    const search = header.querySelector('[data-desktop-search]');
    if (!search) return;
    state.desktopSearchOpen = open;
    const toggle = search.querySelector('[data-expand-desktop-search]');
    const field = search.querySelector('.search__field');
    const input = field.querySelector('input');
    // Move focus out before making the closing field inaccessible.
    if (!open && restoreFocus) toggle.focus({ preventScroll: true });
    else if (!open && field.contains(document.activeElement)) document.activeElement.blur();
    search.classList.toggle('is-expanded', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Fechar busca' : 'Abrir busca');
    field.setAttribute('aria-hidden', String(!open));
    field.toggleAttribute('inert', !open);
    input.tabIndex = open ? 0 : -1;
    if (open) requestAnimationFrame(() => { if (state.desktopSearchOpen) input.focus({ preventScroll: true }); });
  }

  function bindDesktopSearchEvents() {
    const search = header.querySelector('[data-desktop-search]');
    if (!search) return;
    const input = search.querySelector('input');
    input.value = state.desktopSearchValue;
    search.querySelector('[data-expand-desktop-search]').addEventListener('click', () => setDesktopSearchOpen(!state.desktopSearchOpen, state.desktopSearchOpen));
    input.addEventListener('input', () => { state.desktopSearchValue = input.value; });
    search.addEventListener('focusout', event => {
      if (state.desktopSearchOpen && !state.desktopSearchValue.trim() && !search.contains(event.relatedTarget)) setDesktopSearchOpen(false);
    });
  }

  function renderDesktopMenu() {
    if (!state.desktopMenu) return '';
    let content;
    if (state.desktopMenu === 'environments') content = renderEnvironmentMenu();
    else {
      const selected = state.desktopSelection === data.principal.id ? data.principal : data.departments.find(item => item.id === state.desktopSelection) || data.principal;
      content = renderDepartmentMega(selected, state.desktopMenu === 'departments');
    }
    const kind = state.desktopMenu === 'departments' ? 'departments' : state.desktopMenu === 'environments' ? 'environments' : 'department';
    return `<section id="desktop-mega-menu" class="mega-menu ${state.desktopAnimation === 'swap' ? 'mega-menu--swap' : ''}" data-desktop-menu-surface data-menu-kind="${kind}" aria-label="Menu expandido"><div class="container mega-menu__inner">${content}</div></section>`;
  }

  function renderDepartmentMega(item, withRail) {
    const featured = featuredCategories(item);
    const brands = item.brandIds || ['docol', 'deca', 'roca', 'celite', 'tramontina', 'lorenzetti'];
    return `${withRail ? renderDepartmentRail(item.id) : ''}
      <div class="mega-panel">
      ${item.bannerIds ? `<div class="mega-promos"><h2>Promoções em Destaque</h2><div>${item.bannerIds.slice(0, 2).map(promoBanner).join('')}</div></div>` : ''}
      <div class="mega-content ${item === data.principal ? 'mega-content--principal' : ''}"><h2>Categorias em destaque</h2><div class="category-scroll"><div class="category-grid">${featured.map(([label, iconId]) => categoryCard(label, iconId, item === data.principal)).join('')}</div></div>${moreLink(item)}</div>
      <aside class="brand-panel"><h2>Marcas relacionadas:</h2><div class="brand-grid ${item === data.principal && !item.bannerIds?.length ? 'brand-grid--wide' : ''}">${brands.map(brandCard).join('')}</div></aside></div>`;
  }

  function featuredCategories(item) {
    return item.featured || item.children.slice().sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')).map(entry => [entry.label, categoryIcon(entry.label)]);
  }

  function moreLink(item) {
    // Strategic destinations will be configured per department/environment later.
    const url = item.moreUrl;
    const href = url ? String(url).replace(/[&"<>]/g, character => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[character]) : '#';
    return `<a class="more-button" href="${href}" ${url ? '' : 'data-pending-link aria-label="Ver mais — hotsite em definição"'}>Ver mais <span aria-hidden="true">→</span></a>`;
  }

  function renderDepartmentRail(activeId) {
    const all = [data.principal, ...data.departments];
    return `<aside class="department-rail"><div class="department-rail__list">${all.map(item => `<button type="button" class="department-link ${item.id === activeId ? 'is-active' : ''}" data-department-id="${item.id}" aria-current="${item.id === activeId ? 'true' : 'false'}"><span>${item.label}</span><span class="department-link__arrow">${chevron('right')}</span></button>`).join('')}</div></aside>`;
  }

  function categoryCard(label, iconId, large) {
    return `<a class="category-card ${large ? 'category-card--large' : ''}" href="#">${icon(iconId || 'generic')}<span>${label}</span><span class="category-card__arrow">${chevron('right')}</span></a>`;
  }

  function brandCard(id) {
    const src = data.assetRegistry.brand[id];
    return `<a class="brand-card" href="#" aria-label="${capitalize(id)}"><img src="${src}" alt="${capitalize(id)}"></a>`;
  }

  function promoBanner(id) {
    return `<a class="promo-banner" href="#"><img src="${data.assetRegistry.banner[id]}" alt="Promoção: ${id.split('-').join(' ')}"></a>`;
  }

  function renderEnvironmentMenu() {
    const active = data.environments.find(item => item.id === state.environment) || data.environments[0];
    return `<aside class="environment-rail"><div class="environment-rail__list">${data.environments.map(item => `<button type="button" class="environment-link ${item.id === active.id ? 'is-active' : ''}" data-environment-id="${item.id}" aria-current="${item.id === active.id ? 'true' : 'false'}">${environmentImage(item)}<span>${item.label}</span>${chevron('right')}</button>`).join('')}</div></aside>
      <div class="mega-panel mega-panel--environment"><div class="environment-content">${environmentFeature(active)}<div class="environment-categories"><div class="environment-scroll"><div class="environment-grid">${active.categories.map(label => categoryCard(label, categoryIcon(label))).join('')}</div></div>${moreLink(active)}</div></div></div>`;
  }

  function environmentImage(item) {
    return `<img class="environment-thumbnail" src="${data.assetRegistry.environment[item.imageId]}" alt="" width="120" height="80" decoding="async">`;
  }

  function environmentFeature(item, headingTag = 'h2') {
    return `<figure class="environment-feature"><img class="environment-feature__image" src="${data.assetRegistry.environmentFeature[item.imageId]}" alt="" width="480" height="640" decoding="async"><figcaption class="environment-feature__caption"><span class="environment-feature__label">Ambiente</span><${headingTag}>${item.label}</${headingTag}><p class="environment-feature__description">${item.heading}</p></figcaption></figure>`;
  }

  function categoryIcon(label) {
    const value = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return categoryIconRules.find(rule => rule.pattern.test(value))?.iconId || 'generic';
  }

  function renderMobileHeader() {
    const userTitle = state.loggedIn ? 'Olá, Phaison' : 'Entrar';
    const location = state.regionalized ? '<span>Entregar em:</span> <strong>32604-540 - Betim</strong>' : '<span>Informe seu</span> <strong>CEP</strong>';
    return `<div class="mobile-header">
      <div class="mobile-topbar"><a class="chip chip--franchise" href="#">Seja um Franqueado</a></div>
      <div class="mobile-main"><div class="mobile-main__left"><button class="icon-button hamburger" type="button" data-open-drawer aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-drawer"><span></span><span></span><span></span></button><button class="icon-button mobile-account" type="button" aria-label="${userTitle} — Minha conta">${icon('conta', 'header-action-icon')}</button></div>
      <a class="abc-logo" href="#" aria-label="ABC da Construção — início">${assetImg('logo','abc')}</a>
      <div class="mobile-main__right"><button class="icon-button search-toggle" type="button" data-toggle-search aria-label="${state.searchOpen ? 'Fechar busca' : 'Abrir busca'}" aria-expanded="${state.searchOpen}" aria-controls="mobile-search-row"><span class="search__icon"></span></button><button class="icon-button cart-button" type="button" aria-label="Carrinho com zero itens"><span class="cart-icon">${icon('carrinho-mao', 'header-action-icon')}<b>0</b></span></button></div></div>
      <button class="mobile-location" type="button" aria-label="Alterar local de entrega">${icon('regionalizacao', 'header-action-icon')}${location}${chevron('down')}</button>
      ${state.searchOpen ? `<div id="mobile-search-row" class="mobile-search-row">${renderSearch('mobile')}</div>` : ''}
      ${state.searchDropdown ? renderSearchDropdown() : ''}
    </div>`;
  }

  function renderSearchDropdown() {
    return `<div class="search-dropdown"><section><h2>Sugestões</h2><ul>${data.search.suggestions.map((item, index) => `<li><a href="#" ${index === 1 ? 'class="is-highlighted"' : ''}>${item}</a></li>`).join('')}</ul></section><section><h2>Produtos</h2><ul class="product-list">${data.search.products.map(product => `<li><a href="#"><img src="${data.assetRegistry.product[product.assetId]}" alt=""><span>${product.name}</span><strong>${product.price}</strong></a></li>`).join('')}</ul></section></div>`;
  }

  function renderMobileLayers() {
    if (!state.drawerOpen) return '';
    return `<div class="drawer-layer"><div class="drawer-overlay" data-close-drawer></div><aside id="mobile-drawer" class="mobile-drawer" role="dialog" aria-modal="true" aria-label="Menu principal" tabindex="-1">${renderDrawer()}</aside><button class="drawer-close" type="button" data-close-drawer aria-label="Fechar menu">×</button></div>`;
  }

  function renderDrawer() {
    const userTitle = state.loggedIn ? 'Olá, Phaison' : 'Entrar';
    const location = state.regionalized ? '<span>Entregar em:</span> <strong>32604-540 - Betim</strong>' : '<span>Informe seu</span> <strong>CEP</strong>';
    return `<div class="drawer-header"><div class="drawer-user">${icon('conta', 'header-action-icon')}<span><strong>${userTitle}</strong><small>Minha conta ${chevron('down')}</small></span><a class="sac-chip" href="#" data-pending-link>${assetImg('icon','whatsapp')} SAC</a></div><button class="drawer-location" type="button">${icon('regionalizacao', 'header-action-icon')}${location}${chevron('down')}</button></div><div class="drawer-view-header">${renderDrawerViewHeader()}</div><div class="drawer-body">${renderDrawerTrack()}</div>`;
  }

  function renderDrawerTrack() {
    const snapshot = state.drawerPreviousHtml.replace(/\s(?:id|aria-controls|aria-labelledby)="[^"]*"/g, '');
    const previous = snapshot ? `<div class="drawer-panel drawer-panel--previous" inert aria-hidden="true" style="--previous-scroll:${state.drawerPreviousScroll}px">${snapshot}</div>` : '';
    const direction = state.drawerPreviousHtml ? ` drawer-track--${state.drawerDirection}` : '';
    return `<div class="drawer-track${direction}">${previous}<div class="drawer-panel drawer-panel--current">${renderDrawerLevel()}${renderDrawerFooter()}</div></div>`;
  }

  function renderDrawerViewHeader() {
    let title = 'Sua obra começa aqui';
    if (state.drawerLevel === 'departments') title = 'Departamentos';
    if (state.drawerLevel === 'environments') title = 'Ambientes';
    if (state.drawerLevel === 'department') title = (state.drawerId === data.principal.id ? data.principal : data.departments.find(item => item.id === state.drawerId))?.label || 'Categorias';
    if (state.drawerLevel === 'environment') title = data.environments.find(item => item.id === state.drawerId)?.label || 'Ambiente';
    if (state.drawerLevel === 'category') title = state.drawerCategory?.label || 'Subcategoria';
    return `<div class="drawer-title">${state.drawerLevel === 'root' ? '' : `<button type="button" data-drawer-back aria-label="Voltar">${chevron('left')}</button>`}<h2 id="drawer-view-title" tabindex="-1">${title}</h2></div>`;
  }

  function renderDrawerFooter() {
    return `<footer class="drawer-footer"><span class="drawer-footer__eyebrow">Conte com a ABC</span><p>Do primeiro passo ao último acabamento.</p><nav aria-label="Ajuda e serviços">${data.drawerFooter.map(item => `<a href="#" data-pending-link>${icon(item.iconId)}<span>${item.label}</span><span class="category-card__arrow">${chevron('right')}</span></a>`).join('')}</nav><div class="drawer-footer__signature">${assetImg('logo','abc')}<span>Mais perto da sua obra.<small>Preview Header / Menu 2026</small></span></div></footer>`;
  }

  function renderDrawerLevel() {
    if (state.drawerLevel === 'root') return renderDrawerRoot();
    if (state.drawerLevel === 'departments') return renderDrawerDepartments();
    if (state.drawerLevel === 'environments') return renderDrawerEnvironments();
    if (state.drawerLevel === 'environment') return renderDrawerEnvironmentDetail();
    if (state.drawerLevel === 'department') return renderDrawerDepartmentDetail();
    if (state.drawerLevel === 'category') return renderDrawerCategoryDetail();
    return renderDrawerRoot();
  }

  function renderDrawerRoot() {
    return renderMobileAccordion(data.principal, renderMobileCategoryOptions(data.principal, 'department')) +
      data.navigation.map(item => {
        if (item.menu === 'departments') return renderMobileAccordion(item, renderDepartmentOptions(), 'nav-' + item.id);
        if (item.menu === 'environments') return renderMobileAccordion(item, renderEnvironmentOptions(), 'nav-' + item.id);
        if (item.menu === 'department') {
          const department = data.departments.find(entry => entry.id === item.departmentId);
          return renderMobileAccordion(item, renderMobileCategoryOptions(department, 'department'), 'nav-' + item.id);
        }
        return renderMobileAccordion(item, '<p class="drawer-accordion__hint">Ofertas para a próxima etapa da sua obra.</p><a class="drawer-option" href="#" data-pending-link>Ver cupons disponíveis<span class="category-card__arrow">' + chevron('right') + '</span></a>');
      }).join('') +
      '<a class="drawer-sale" href="#" data-pending-link><span class="sale-pill">Saldão de Ofertas <span aria-hidden="true">🔥</span></span></a>';
  }

  function renderMobileAccordion(item, content, key = item.id) {
    const expanded = state.drawerExpanded.has(key);
    return '<section class="drawer-accordion ' + (expanded ? 'is-expanded' : '') + '"><button class="drawer-accordion__trigger" type="button" data-drawer-accordion="' + key + '" aria-expanded="' + expanded + '" aria-controls="drawer-options-' + safeId(key) + '">' + (item.imageId ? environmentImage(item) : icon(item.iconId || 'departamentos')) + '<span>' + item.label + '</span>' + navChevron() + '</button><div id="drawer-options-' + safeId(key) + '" class="drawer-accordion__content" ' + (expanded ? '' : 'inert') + '><div><nav class="drawer-option-list" aria-label="' + item.label + '">' + content + '</nav></div></div></section>';
  }

  function drawerOption(label, artwork, attributes) {
    return '<button type="button" class="drawer-option" ' + attributes + '>' + artwork + '<span>' + label + '</span><span class="category-card__arrow">' + chevron('right') + '</span></button>';
  }

  function renderDepartmentOptions() {
    return renderDrawerDepartments();
  }

  function renderEnvironmentOptions() {
    return renderDrawerEnvironments();
  }

  function renderMobileCategoryOptions(item, scope) {
    const entries = scope === 'environment' ? item.categories.map(label => [label, categoryIcon(label)]) : featuredCategories(item);
    return entries.map(([label, id]) => drawerOption(label, icon(id), 'data-drawer-level="category" data-drawer-id="' + item.id + '" data-category-scope="' + scope + '" data-category-label="' + encodeURIComponent(label) + '" data-category-icon="' + id + '"')).join('');
  }

  function renderDrawerDepartments() {
    return data.departments.map(item => renderMobileAccordion({ ...item, iconId: item.iconId || featuredCategories(item)[0]?.[1] }, renderMobileCategoryOptions(item, 'department'), 'department-' + item.id)).join('');
  }

  function renderDrawerEnvironments() {
    return data.environments.map(item => renderMobileAccordion({ ...item, iconId: item.iconId }, renderMobileCategoryOptions(item, 'environment'), 'environment-' + item.id)).join('');
  }

  function renderDrawerEnvironmentDetail() {
    const item = data.environments.find(entry => entry.id === state.drawerId) || data.environments[0];
    return '<div class="drawer-detail">' + environmentFeature(item, 'h3') + '<div class="drawer-category-list">' + renderMobileCategoryOptions(item, 'environment') + '</div>' + moreLink(item) + '</div>';
  }

  function renderDrawerDepartmentDetail() {
    const item = state.drawerId === data.principal.id ? data.principal : data.departments.find(entry => entry.id === state.drawerId) || data.departments[0];
    const brands = item.brandIds || [];
    return '<div class="drawer-detail">' +
      (item.bannerIds ? '<section><h3>Promoções em destaque</h3><div class="drawer-banners">' + item.bannerIds.map(promoBanner).join('') + '</div></section>' : '') +
      '<section><h3>Categorias em destaque</h3><div class="drawer-category-list">' + renderMobileCategoryOptions(item, 'department') + '</div></section>' +
      (brands.length ? '<section><h3>Marcas relacionadas</h3><div class="brand-grid">' + brands.map(brandCard).join('') + '</div></section>' : '') +
      moreLink(item) + '</div>';
  }

  function renderDrawerCategoryDetail() {
    const category = state.drawerCategory;
    if (!category) return '';
    const parent = category.scope === 'environment' ? data.environments.find(item => item.id === state.drawerId) : state.drawerId === data.principal.id ? data.principal : data.departments.find(item => item.id === state.drawerId);
    const children = parent?.children?.find(item => item.label === category.label)?.children || [];
    return '<div class="drawer-detail drawer-category-detail"><div class="drawer-category-intro">' + icon(category.iconId) + '<span>Encontre o acabamento para a sua obra.</span></div>' +
      (children.length ? '<nav class="drawer-category-list" aria-label="Opções de ' + category.label + '">' + children.map(label => categoryCard(label, categoryIcon(label) === 'generic' ? category.iconId : categoryIcon(label))).join('') + '</nav>' : '<p class="drawer-category-note">A seleção de produtos desta categoria será conectada ao catálogo na integração final.</p>') +
      moreLink(parent || {}) + '</div>';
  }

  function bindEvents() {
    document.querySelectorAll('[data-menu-action]').forEach(button => {
      button.addEventListener('click', () => onDesktopNav(button));
      button.addEventListener('mouseenter', () => scheduleDesktopOpen(button));
      button.addEventListener('mouseleave', () => { if (desktopInteraction === 'pointer') clearTimeout(desktopOpenTimer); });
      button.addEventListener('focus', () => scheduleDesktopOpen(button, 140, 'keyboard'));
    });
    document.querySelector('.desktop-nav')?.addEventListener('mouseleave', scheduleDesktopClose);
    document.querySelector('.desktop-nav')?.addEventListener('mouseenter', cancelDesktopClose);
    bindDesktopMenuEvents();
    bindScrollFades();
    bindDesktopSearchEvents();
    document.querySelectorAll('[data-search-input]').forEach(input => { input.addEventListener('input', () => { if (!desktopQuery.matches) { state.searchDropdown = input.value.trim().length > 0; render(); requestAnimationFrame(() => { const next = document.querySelector('[data-search-input]'); if (next) { next.focus(); next.value = input.value; next.setSelectionRange(next.value.length, next.value.length); } }); } }); input.addEventListener('focus', () => { if (!desktopQuery.matches && input.value.trim()) { state.searchDropdown = true; render(); } }); });
    const searchToggle = document.querySelector('[data-toggle-search]');
    if (searchToggle) searchToggle.addEventListener('click', () => { state.searchOpen = !state.searchOpen; state.searchDropdown = false; render(); if (state.searchOpen) requestAnimationFrame(() => document.querySelector('[data-search-input]')?.focus()); });
    const openDrawer = document.querySelector('[data-open-drawer]');
    if (openDrawer) openDrawer.addEventListener('click', () => { state.opener = openDrawer; state.drawerOpen = true; state.drawerBusy = false; state.drawerLevel = 'root'; state.drawerId = null; state.drawerCategory = null; state.drawerHistory = []; state.drawerPreviousHtml = ''; render(); requestAnimationFrame(() => document.querySelector('#mobile-drawer')?.focus()); });
    document.querySelectorAll('[data-close-drawer]').forEach(button => button.addEventListener('click', closeDrawer));
    bindDrawerPanelEvents();
  }

  function bindDesktopMenuEvents() {
    const surface = document.querySelector('[data-desktop-menu-surface]');
    if (!surface || surface.dataset.eventsBound) return;
    surface.dataset.eventsBound = 'true';
    surface.addEventListener('mouseenter', cancelDesktopClose);
    surface.addEventListener('mouseleave', scheduleDesktopClose);
    surface.querySelectorAll('[data-department-id], [data-environment-id]').forEach(button => {
      const type = button.hasAttribute('data-department-id') ? 'department' : 'environment';
      const id = button.dataset.departmentId || button.dataset.environmentId;
      button.addEventListener('click', () => {
        clearTimeout(desktopOpenTimer);
        type === 'department' ? selectDesktopDepartment(id) : selectDesktopEnvironment(id);
      });
      button.addEventListener('mouseenter', () => scheduleDesktopSelection(type, id));
      button.addEventListener('mouseleave', () => { if (desktopInteraction === 'pointer') clearTimeout(desktopOpenTimer); });
      button.addEventListener('focus', () => scheduleDesktopSelection(type, id, 'keyboard'));
    });
  }

  function updateScrollFade(element) {
    // Fade only the edges that hide more content; keep the final row fully legible.
    element.classList.toggle('has-scroll-above', element.scrollTop > 1);
    element.classList.toggle('has-scroll-below', element.scrollTop + element.clientHeight < element.scrollHeight - 1);
  }

  function bindScrollFades() {
    scrollFadeObserver?.disconnect();
    const elements = menuRoot.querySelectorAll('.environment-rail__list, .environment-scroll, .category-scroll');
    if (!elements.length) return;
    if (!scrollFadeObserver && 'ResizeObserver' in window) {
      scrollFadeObserver = new ResizeObserver(() => menuRoot.querySelectorAll('.environment-rail__list, .environment-scroll, .category-scroll').forEach(updateScrollFade));
    }
    elements.forEach(element => {
      updateScrollFade(element);
      if (!element.dataset.fadeBound) {
        element.dataset.fadeBound = 'true';
        element.addEventListener('scroll', () => updateScrollFade(element), { passive: true });
      }
      scrollFadeObserver?.observe(element);
      if (element.firstElementChild) scrollFadeObserver?.observe(element.firstElementChild);
    });
  }

  function bindDrawerPanelEvents() {
    const currentPanel = document.querySelector('.drawer-panel--current');
    currentPanel?.querySelectorAll('[data-drawer-level]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.drawerLevel === 'link') return;
      const category = button.dataset.categoryLabel ? { label: decodeURIComponent(button.dataset.categoryLabel), scope: button.dataset.categoryScope, iconId: button.dataset.categoryIcon } : null;
      animateChevronAndNavigate(button, () => navigateDrawer(button.dataset.drawerLevel, button.dataset.drawerId, category));
    }));
    const back = document.querySelector('.drawer-view-header [data-drawer-back]');
    if (back) back.addEventListener('click', () => animateChevronAndNavigate(back, navigateDrawerBack));
    currentPanel?.querySelectorAll('[data-drawer-accordion]').forEach(button => button.addEventListener('click', () => {
      if (state.drawerBusy) return;
      const id = button.dataset.drawerAccordion;
      const expanded = !state.drawerExpanded.has(id);
      expanded ? state.drawerExpanded.add(id) : state.drawerExpanded.delete(id);
      button.closest('.drawer-accordion').classList.toggle('is-expanded', expanded);
      button.setAttribute('aria-expanded', String(expanded));
      button.closest('.drawer-accordion').querySelector('.drawer-accordion__content').toggleAttribute('inert', !expanded);
    }));
    clearDrawerAnimationArtifacts();
  }

  function scheduleDesktopOpen(button, delay = 140, interaction = 'pointer') {
    desktopInteraction = interaction;
    cancelDesktopClose();
    clearTimeout(desktopOpenTimer);
    if (button.dataset.menuAction === 'link') { scheduleDesktopClose(); return; }
    desktopOpenTimer = setTimeout(() => {
      if (interaction === 'keyboard' && document.activeElement !== button) return;
      openDesktopNav(button);
    }, delay);
  }

  function openDesktopNav(button) {
    cancelDesktopClose();
    const action = button.dataset.menuAction;
    const id = button.dataset.menuId;
    let nextMenu = id;
    if (action === 'departments') nextMenu = 'departments';
    if (action === 'environments') nextMenu = 'environments';
    if (state.desktopMenu === nextMenu && (action !== 'department' || state.desktopSelection === id)) return;
    state.desktopAnimation = state.desktopMenu ? 'swap' : 'open';
    if (action === 'departments' && state.desktopMenu !== 'departments') state.desktopSelection = data.principal.id;
    else if (action === 'department') state.desktopSelection = id;
    state.desktopMenu = nextMenu;
    updateDesktopMenu();
  }

  function updateDesktopNav() {
    header.querySelectorAll('[data-menu-action]').forEach(button => {
      const action = button.dataset.menuAction;
      const active = action !== 'link' && (state.desktopMenu === button.dataset.menuId || state.desktopMenu === action);
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-expanded', String(active));
    });
  }

  function updateDesktopMenu() {
    updateDesktopNav();
    const current = menuRoot.querySelector('[data-desktop-menu-surface]');
    const template = document.createElement('template');
    template.innerHTML = renderDesktopMenu();
    const next = template.content.firstElementChild;
    if (current && next && current.dataset.menuKind === next.dataset.menuKind) {
      // Keep the rail, focus and scroll position while refreshing only the detail columns.
      const inner = current.querySelector('.mega-menu__inner');
      const nextInner = next.querySelector('.mega-menu__inner');
      inner.querySelectorAll(':scope > :not(.department-rail):not(.environment-rail)').forEach(column => column.remove());
      nextInner.querySelectorAll(':scope > :not(.department-rail):not(.environment-rail)').forEach(column => inner.append(column));
      current.classList.add('mega-menu--swap');
      current.querySelectorAll('[data-department-id], [data-environment-id]').forEach(button => {
        const active = button.dataset.departmentId === state.desktopSelection || button.dataset.environmentId === state.environment;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-current', String(active));
      });
    } else {
      menuRoot.replaceChildren(...(next ? [next] : []));
      bindDesktopMenuEvents();
    }
    bindScrollFades();
  }

  function scheduleDesktopClose() {
    const focused = document.activeElement;
    if (desktopInteraction === 'keyboard' && focused?.closest('.desktop-nav, [data-desktop-menu-surface]') && focused.dataset.menuAction !== 'link') return;
    clearTimeout(desktopOpenTimer);
    clearTimeout(desktopCloseTimer);
    desktopCloseTimer = setTimeout(closeDesktopMenu, 240);
  }

  function cancelDesktopClose() {
    clearTimeout(desktopCloseTimer);
    clearTimeout(desktopExitTimer);
    menuRoot.querySelector('.mega-menu')?.classList.remove('is-closing');
  }

  function closeDesktopMenu() {
    clearTimeout(desktopOpenTimer);
    clearTimeout(desktopExitTimer);
    const surface = menuRoot.querySelector('.mega-menu');
    if (!surface) return;
    surface.classList.add('is-closing');
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
    desktopExitTimer = setTimeout(() => {
      state.desktopMenu = null;
      state.desktopAnimation = 'open';
      surface.remove();
      scrollFadeObserver?.disconnect();
      updateDesktopNav();
    }, delay);
  }

  function scheduleDesktopSelection(type, id, interaction = 'pointer') {
    desktopInteraction = interaction;
    cancelDesktopClose();
    clearTimeout(desktopOpenTimer);
    desktopOpenTimer = setTimeout(() => type === 'department' ? selectDesktopDepartment(id) : selectDesktopEnvironment(id), 150);
  }

  function selectDesktopDepartment(id) {
    if (state.desktopSelection === id) return;
    state.desktopSelection = id;
    state.desktopAnimation = 'swap';
    updateDesktopMenu();
  }

  function selectDesktopEnvironment(id) {
    if (state.environment === id) return;
    state.environment = id;
    state.desktopAnimation = 'swap';
    updateDesktopMenu();
  }

  function navigateDrawer(level, id, category = null) {
    const body = document.querySelector('.drawer-body');
    state.drawerPreviousHtml = document.querySelector('.drawer-panel--current').innerHTML;
    state.drawerPreviousScroll = body.scrollTop;
    state.drawerDirection = 'forward';
    state.drawerHistory.push({ level: state.drawerLevel, id: state.drawerId, category: state.drawerCategory, scrollTop: body.scrollTop });
    state.drawerLevel = level;
    state.drawerId = id || null;
    state.drawerCategory = category;
    render();
    body.scrollTop = 0;
    document.querySelector('.drawer-view-header [data-drawer-back]')?.focus({ preventScroll: true });
  }

  function navigateDrawerBack() {
    const previous = state.drawerHistory.pop() || { level: 'root', id: null };
    state.drawerPreviousHtml = document.querySelector('.drawer-panel--current').innerHTML;
    state.drawerPreviousScroll = (document.querySelector('.drawer-body')?.scrollTop || 0) - (previous.scrollTop || 0);
    state.drawerDirection = 'back';
    state.drawerLevel = previous.level;
    state.drawerId = previous.id;
    state.drawerCategory = previous.category || null;
    render();
    document.querySelector('.drawer-body').scrollTop = previous.scrollTop || 0;
    document.getElementById('drawer-view-title')?.focus({ preventScroll: true });
  }

  function animateChevronAndNavigate(button, callback) {
    if (state.drawerBusy || button.classList.contains('is-navigating')) return;
    state.drawerBusy = true;
    button.classList.add('is-navigating');
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;
    window.setTimeout(() => { if (state.drawerOpen) callback(); }, delay);
  }

  function clearDrawerAnimationArtifacts() {
    clearTimeout(drawerAnimationTimer);
    if (!state.drawerPreviousHtml) return;
    drawerAnimationTimer = setTimeout(() => {
      state.drawerPreviousHtml = '';
      document.querySelector('.drawer-panel--previous')?.remove();
      document.querySelector('.drawer-track')?.classList.remove('drawer-track--forward', 'drawer-track--back');
      state.drawerBusy = false;
    }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 600);
  }

  function onDesktopNav(button) {
    desktopInteraction = 'pointer';
    clearTimeout(desktopOpenTimer);
    cancelDesktopClose();
    const action = button.dataset.menuAction;
    if (action === 'link') return;
    const id = button.dataset.menuId;
    const next = action === 'department' ? id : action;
    if (state.desktopMenu === next) closeDesktopMenu();
    else openDesktopNav(button);
  }

  function closeDrawer() {
    const opener = state.opener;
    const layer = document.querySelector('.drawer-layer');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finish = () => {
      state.drawerOpen = false;
      state.drawerLevel = 'root';
      state.drawerId = null;
      state.drawerHistory = [];
      state.drawerCategory = null;
      state.drawerBusy = false;
      state.drawerPreviousHtml = '';
      render();
      requestAnimationFrame(() => document.querySelector('[data-open-drawer]')?.focus() || opener?.focus());
    };
    if (!layer || reducedMotion) { finish(); return; }
    layer.classList.add('is-closing');
    window.setTimeout(finish, 250);
  }

  function syncDocumentLock() {
    document.body.classList.toggle('is-locked', state.drawerOpen);
    const main = document.getElementById('conteudo');
    const siteHeader = document.getElementById('site-header');
    if ('inert' in main) { main.inert = state.drawerOpen; siteHeader.inert = state.drawerOpen; }
  }

  function assetImg(group, id) { return `<img src="${data.assetRegistry[group][id]}" alt="">`; }
  function capitalize(value) { return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-pending-link]')) event.preventDefault();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && state.drawerOpen) {
      const layer = document.querySelector('.drawer-layer');
      const focusable = [...layer.querySelectorAll('button, a[href], input, [tabindex="0"]')].filter(element => !element.closest('[inert]') && element.getClientRects().length);
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === document.getElementById('mobile-drawer'))) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !layer.contains(document.activeElement))) { event.preventDefault(); first?.focus(); }
      return;
    }
    if (event.key !== 'Escape') return;
    if (desktopQuery.matches && state.desktopSearchOpen && document.activeElement?.closest('[data-desktop-search]')) {
      event.preventDefault();
      setDesktopSearchOpen(false, true);
      return;
    }
    if (state.drawerOpen) closeDrawer();
    else if (state.desktopMenu) closeDesktopMenu();
    else if (state.searchOpen) { state.searchOpen = false; state.searchDropdown = false; render(); }
  });
  document.addEventListener('focusin', event => {
    if (desktopQuery.matches && state.desktopMenu && !event.target.closest('.desktop-nav, [data-desktop-menu-surface]')) scheduleDesktopClose();
  });
  document.addEventListener('pointerdown', event => {
    if (desktopQuery.matches && state.desktopSearchOpen && !state.desktopSearchValue.trim() && !event.target.closest('[data-desktop-search]')) setDesktopSearchOpen(false);
    if (desktopQuery.matches && state.desktopMenu && !event.target.closest('.desktop-nav, [data-desktop-menu-surface]')) closeDesktopMenu();
  });
  desktopQuery.addEventListener('change', () => { clearTimeout(desktopOpenTimer); cancelDesktopClose(); state.desktopMenu = null; state.drawerOpen = false; state.desktopSearchOpen = false; state.searchOpen = false; state.searchDropdown = false; render(); });

  const params = new URLSearchParams(location.search);
  state.loggedIn = params.get('logged') !== '0';
  state.regionalized = params.get('regionalized') !== '0';
  if (params.get('search') === 'open') { state.searchOpen = true; state.desktopSearchOpen = true; }
  if (params.get('search') === 'dropdown') { state.searchOpen = true; state.searchDropdown = true; state.desktopSearchOpen = true; }
  if (params.get('menu')) state.desktopMenu = params.get('menu');
  if (params.get('department')) state.desktopSelection = params.get('department');
  if (params.get('environment')) state.environment = params.get('environment');
  if (params.get('drawer')) {
    state.drawerOpen = true;
    const drawer = params.get('drawer');
    if (drawer === 'root') state.drawerLevel = 'root';
    else if (drawer === 'departments' || drawer === 'environments') state.drawerLevel = drawer;
    else { state.drawerLevel = data.environments.some(item => item.id === drawer) ? 'environment' : 'department'; state.drawerId = drawer; }
  }
  render();
})();
