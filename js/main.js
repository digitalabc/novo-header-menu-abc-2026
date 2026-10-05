(function () {
  'use strict';

  const data = window.Menu2026Data;
  const header = document.getElementById('site-header');
  const menuRoot = document.getElementById('menu-root');
  const regionalizationRoot = document.getElementById('regionalization-root');
  const accountRoot = document.getElementById('account-root');
  const desktopQuery = window.matchMedia('(min-width: 900px)');
  const state = { desktopMenu: null, desktopSelection: 'principais-categorias', desktopAnimation: 'open', environment: 'banheiro', desktopSearchOpen: false, desktopSearchValue: '', searchOpen: false, searchDropdown: false, drawerOpen: false, drawerLevel: 'root', drawerId: null, drawerCategory: null, drawerHistory: [], drawerPreviousHtml: '', drawerPreviousScroll: 0, drawerDirection: 'forward', principalExpanded: true, drawerExpanded: new Map(), drawerBusy: false, loggedIn: true, regionalized: false, regionalizationOpen: true, regionalizationValue: '', regionalizationError: '', regionalizationOpener: null, delivery: { cep: '32604-540', city: 'Betim' }, opener: null };
  let desktopOpenTimer;
  let desktopCloseTimer;
  let desktopExitTimer;
  let desktopInteraction = 'pointer';
  let drawerAnimationTimer;
  let drawerScrollSequence = 0;
  let scrollFadeObserver;
  let regionalizationViewportBound = false;
  let regionalizationBaselineHeight = 0;
  let searchTimer;
  let searchOpenedAt = 0;
  let searchEngaged = false;
  let searchBaselineHeight = 0;
  let mobileSearchValue = '';
  let accountOpener = null;
  let accountOpen = false;
  let accountCloseTimer;
  let drawerAutoPauseUntil = 0;
  let manuallyClosedEnvironment = null;
  let communicationTimer;
  let communicationIndex = 0;
  let mobileHeaderCompact = false;
  let mobileTopbarIndex = 0;
  let headerTouchY = null;
  let headerTouchX = null;

  const catalogIconIds = new Set([...data.catalogIconIds, 'cuba-embutir', 'lavatorio-suspenso', 'cuba-inox-dupla']);
  const categoryIconRules = data.categoryIconRules.map(rule => ({ iconId: rule.iconId, pattern: new RegExp(rule.pattern) }));
  const icon = (id, className = '', categoryId = '') => {
    // Destaques editoriais podem escolher outro produto que o ícone do ramo.
    const categoryFile = data.assetHierarchy.iconeIds[categoryId] === id ? data.assetHierarchy.arquivos[categoryId] : null;
    const src = categoryFile || data.assetHierarchy.departamentos[categoryId] || data.assetRegistry.icon[id] || data.assetRegistry.icon.generic;
    return `<img class="${className}${catalogIconIds.has(id) ? ' category-image--catalog' : ''}" src="${src}" alt="" decoding="async" loading="${className.includes('header-action') ? 'eager' : 'lazy'}" width="80" height="80">`;
  };
  const chevron = (direction = 'right') => `<span class="chevron chevron--${direction}" aria-hidden="true"></span>`;
  const navChevron = () => '<span class="nav-chevron" aria-hidden="true"><svg viewBox="0 0 16 16"><path d="M6 4l4 4-4 4"/></svg></span>';
  const safeId = value => String(value).replace(/[^a-z0-9-]/gi, '-').toLowerCase();
  const cepCities = { '32604540': 'Betim', '30130010': 'Belo Horizonte', '01001000': 'São Paulo', '20040002': 'Rio de Janeiro' };

  function render() {
    regionalizationRoot.innerHTML = renderRegionalization();
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
        ${renderCommunications()}
        <div class="topbar__group topbar__group--end"><a class="chip chip--stores" href="#">${assetImg('icon','nossas-lojas')}Nossas Lojas</a><a class="chip chip--franchise" href="#">Seja um Franqueado</a></div>
      </div></div>
      <div class="desktop-main"><div class="container desktop-main__content">
        <a class="abc-logo" href="#" aria-label="ABC da Construção — início">${assetImg('logo','abc')}</a>
        <div class="desktop-actions desktop-actions--left">
          <div class="account-identity">${renderAccountIdentity()}</div>
        </div>
        <div class="desktop-actions desktop-actions--right">
          ${renderSearch('desktop')}
          <button class="action-item action-item--location" type="button" data-open-regionalization aria-label="${state.regionalized ? 'Alterar local de entrega' : 'Informar CEP'}">${icon('regionalizacao', 'header-action-icon')}${desktopLocationMarkup()}${chevron('down')}</button>
          <button class="action-item action-item--cart" type="button" aria-label="Meu carrinho, zero itens"><span class="cart-icon">${icon('carrinho-mao', 'header-action-icon')}<b>0</b></span><span><strong>Meu carrinho</strong><small>00 itens</small></span></button>
        </div>
      </div></div>
      <nav class="desktop-nav" aria-label="Navegação principal"><div class="container desktop-nav__list">
        ${data.navigation.map(item => item.menu === 'link' ? `<a class="nav-item" href="#" data-pending-link>${icon(item.iconId)}<span>${item.label}</span></a>` : `<button class="nav-item ${state.desktopMenu && activeNav(item) ? 'is-active' : ''}" type="button" data-menu-action="${item.menu}" data-menu-id="${item.departmentId || item.id}" aria-expanded="${state.desktopMenu && activeNav(item) ? 'true' : 'false'}" aria-controls="desktop-mega-menu">${icon(item.iconId)}<span>${item.label}</span>${navChevron()}</button>`).join('')}
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
    clearTimeout(searchTimer);
    if (open) {
      searchOpenedAt = Date.now();
      searchEngaged = false;
      searchTimer = setTimeout(() => { if (!searchEngaged) setDesktopSearchOpen(false); }, 3000);
    }
  }

  function bindDesktopSearchEvents() {
    const search = header.querySelector('[data-desktop-search]');
    if (!search) return;
    const input = search.querySelector('input');
    input.value = state.desktopSearchValue;
    search.querySelector('[data-expand-desktop-search]').addEventListener('click', () => setDesktopSearchOpen(!state.desktopSearchOpen, state.desktopSearchOpen));
    input.addEventListener('pointerdown', engageSearch);
    input.addEventListener('focus', engageSearch);
    input.addEventListener('input', () => { engageSearch(); state.desktopSearchValue = input.value; });
    search.addEventListener('focusout', event => {
      if (state.desktopSearchOpen && !search.contains(event.relatedTarget)) scheduleSearchClose();
    });
  }

  function renderCommunications() {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return `<div class="topbar-communications" role="region" aria-label="Condições de compra" aria-roledescription="carrossel"><div class="topbar-communications__messages" aria-live="off">${data.communications.map((item, index) => `<div class="topbar-communications__message ${index === communicationIndex ? 'is-visible' : ''}" aria-hidden="${!reducedMotion && index !== communicationIndex}" data-communication><span class="topbar-communications__symbol ${item.iconId === 'caminhao' ? 'topbar-communications__symbol--truck' : ''}" aria-hidden="true">${item.iconId ? icon(item.iconId) : '10x'}</span><span>${item.text}</span></div>`).join('')}</div></div>`;
  }

  function bindCommunications() {
    clearInterval(communicationTimer);
    const regions = [...header.querySelectorAll('.topbar-communications')];
    if (!regions.length) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const advance = () => {
      if (document.hidden || state.regionalizationOpen || accountOpen || state.drawerOpen || state.searchOpen || !regions.some(region => region.isConnected && !region.closest('[inert]'))) return;
      const previousIndex = communicationIndex;
      communicationIndex = (communicationIndex + 1) % data.communications.length;
      regions.forEach(region => region.querySelectorAll('[data-communication]').forEach((message, index) => {
        message.classList.toggle('is-visible', index === communicationIndex);
        message.classList.toggle('is-leaving', index === previousIndex);
        message.setAttribute('aria-hidden', String(index !== communicationIndex));
      }));
    };
    // Respeite movimento reduzido sem impedir a leitura das duas mensagens.
    if (reducedMotion.matches) regions.forEach(region => region.classList.add('is-static'));
    else communicationTimer = setInterval(advance, 2500);
  }

  function renderMobileTopbar() {
    return `<div class="mobile-topbar" role="region" aria-label="Destaques da ABC" aria-roledescription="carrossel">
      <button class="mobile-topbar__arrow" type="button" data-topbar-step="-1" aria-label="Opção anterior da topbar" aria-controls="mobile-topbar-slides" aria-disabled="${mobileTopbarIndex === 0}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 7-5 5 5 5"/></svg></button>
      <div class="mobile-topbar__viewport"><div id="mobile-topbar-slides" class="mobile-topbar__track" style="--topbar-index:${mobileTopbarIndex}">${data.mobileTopbarItems.map((item, index) => {
        const content = item.type === 'communications' ? renderCommunications() : item.type === 'logo' ? `<a class="mobile-topbar__prime" href="${item.url}" aria-label="${item.label}">${assetImg('logo', item.logoId)}</a>` : `<a class="${item.className}" href="${item.url}">${assetImg('icon', item.iconId)}${item.label}</a>`;
        return `<div class="mobile-topbar__slide" role="group" aria-roledescription="slide" aria-label="${item.label}, ${index + 1} de ${data.mobileTopbarItems.length}" aria-hidden="${index !== mobileTopbarIndex}" ${index !== mobileTopbarIndex ? 'inert' : ''}>${content}</div>`;
      }).join('')}</div></div>
      <button class="mobile-topbar__arrow" type="button" data-topbar-step="1" aria-label="Próxima opção da topbar" aria-controls="mobile-topbar-slides" aria-disabled="${mobileTopbarIndex === data.mobileTopbarItems.length - 1}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 7 5 5-5 5"/></svg></button>
      <span class="sr-only" data-topbar-status aria-live="polite" aria-atomic="true"></span>
    </div>`;
  }

  function bindMobileTopbar() {
    const topbar = header.querySelector('.mobile-topbar');
    if (!topbar) return;
    const move = step => {
      const slides = [...topbar.querySelectorAll('.mobile-topbar__slide')];
      const next = Math.max(0, Math.min(slides.length - 1, mobileTopbarIndex + step));
      if (next === mobileTopbarIndex) return;
      mobileTopbarIndex = next;
      if (document.activeElement?.closest('.mobile-topbar__slide')) topbar.querySelector(`[data-topbar-step="${step < 0 ? -1 : 1}"]`).focus({ preventScroll: true });
      topbar.querySelector('.mobile-topbar__track').style.setProperty('--topbar-index', mobileTopbarIndex);
      slides.forEach((slide, index) => {
        slide.inert = index !== mobileTopbarIndex;
        slide.setAttribute('aria-hidden', String(index !== mobileTopbarIndex));
      });
      topbar.querySelector('[data-topbar-step="-1"]').setAttribute('aria-disabled', String(mobileTopbarIndex === 0));
      topbar.querySelector('[data-topbar-step="1"]').setAttribute('aria-disabled', String(mobileTopbarIndex === slides.length - 1));
      topbar.querySelector('[data-topbar-status]').textContent = `${data.mobileTopbarItems[mobileTopbarIndex].label}, ${mobileTopbarIndex + 1} de ${slides.length}`;
      // Give the newly selected communication its full reading interval.
      bindCommunications();
    };
    topbar.querySelectorAll('[data-topbar-step]').forEach(button => button.addEventListener('click', () => move(Number(button.dataset.topbarStep))));
    topbar.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    });
    let start = null;
    topbar.addEventListener('touchstart', event => { start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null; }, { passive: true });
    topbar.addEventListener('touchend', event => {
      if (!start || !event.changedTouches.length) return;
      const dx = start.x - event.changedTouches[0].clientX;
      const dy = start.y - event.changedTouches[0].clientY;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.5) move(dx > 0 ? 1 : -1);
      start = null;
    }, { passive: true });
    topbar.addEventListener('touchcancel', () => { start = null; }, { passive: true });
  }

  function syncMobileHeader() {
    const shell = header.querySelector('.mobile-header');
    if (!shell) return;
    const compact = mobileHeaderCompact && !state.searchOpen;
    shell.classList.toggle('is-compact', compact);
    const topbar = shell.querySelector('.mobile-topbar');
    const strip = shell.querySelector('.mobile-communications');
    topbar.inert = compact;
    topbar.setAttribute('aria-hidden', String(compact));
    strip.inert = !compact;
    strip.setAttribute('aria-hidden', String(!compact));
  }

  function canMoveMobileHeader() {
    return !desktopQuery.matches && !state.drawerOpen && !state.regionalizationOpen && !accountOpen && !state.searchOpen;
  }

  function setMobileHeaderCompact(compact) {
    if (!canMoveMobileHeader() || compact === mobileHeaderCompact) return;
    // Keep focus on a visible header control when the topbar leaves the screen.
    if (compact && document.activeElement?.closest('.mobile-topbar')) {
      header.querySelector('[data-open-drawer]')?.focus({ preventScroll: true });
    }
    mobileHeaderCompact = compact;
    syncMobileHeader();
  }

  function moveMobileHeader(delta) {
    if (delta > 12) setMobileHeaderCompact(true);
    else if (delta < -12 && window.scrollY < 24) setMobileHeaderCompact(false);
  }

  // Passive gestures also work in this header-only preview, without adding fake page content.
  window.addEventListener('wheel', event => {
    if (!event.ctrlKey && Math.abs(event.deltaY) > Math.abs(event.deltaX)) {
      moveMobileHeader(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1));
    }
  }, { passive: true });
  window.addEventListener('touchstart', event => {
    headerTouchY = event.touches.length === 1 ? event.touches[0].clientY : null;
    headerTouchX = event.touches.length === 1 ? event.touches[0].clientX : null;
  }, { passive: true });
  window.addEventListener('touchmove', event => {
    if (headerTouchY === null || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const delta = headerTouchY - touch.clientY;
    if (Math.abs(delta) > 12 && Math.abs(delta) > Math.abs(headerTouchX - touch.clientX)) {
      moveMobileHeader(delta);
      headerTouchY = touch.clientY;
      headerTouchX = touch.clientX;
    }
  }, { passive: true });
  window.addEventListener('touchend', () => { headerTouchY = headerTouchX = null; }, { passive: true });
  window.addEventListener('touchcancel', () => { headerTouchY = headerTouchX = null; }, { passive: true });
  window.addEventListener('scroll', () => {
    if (window.scrollY > 24) setMobileHeaderCompact(true);
    else if (window.scrollY <= 0) setMobileHeaderCompact(false);
  }, { passive: true });

  function engageSearch() { searchEngaged = true; clearTimeout(searchTimer); }

  function scheduleSearchClose() {
    clearTimeout(searchTimer);
    const delay = desktopQuery.matches ? Math.max(0, 3000 - (Date.now() - searchOpenedAt)) : 0;
    searchTimer = setTimeout(() => {
      if (desktopQuery.matches) setDesktopSearchOpen(false);
      else closeMobileSearch();
    }, delay);
  }

  function closeMobileSearch() {
    clearTimeout(searchTimer);
    state.searchOpen = false;
    state.searchDropdown = false;
    syncMobileHeader();
    header.querySelector('.mobile-header')?.classList.remove('is-search-keyboard');
    header.querySelector('.mobile-search-row')?.remove();
    header.querySelector('.search-dropdown')?.remove();
    const toggle = header.querySelector('[data-toggle-search]');
    toggle?.setAttribute('aria-expanded', 'false');
    toggle?.setAttribute('aria-label', 'Abrir busca');
  }

  function syncSearchViewport() {
    const mobileHeader = header.querySelector('.mobile-header');
    const viewport = window.visualViewport;
    mobileHeader?.classList.toggle('is-search-keyboard', state.searchOpen && Boolean(searchBaselineHeight) && (viewport?.height || window.innerHeight) < searchBaselineHeight - 120);
    const dropdown = header.querySelector('.search-dropdown');
    if (!dropdown || desktopQuery.matches) return;
    const bottom = (viewport?.offsetTop || 0) + (viewport?.height || window.innerHeight);
    dropdown.style.setProperty('--search-results-height', `${Math.max(80, bottom - dropdown.getBoundingClientRect().top - 12)}px`);
  }

  function updateMobileAutocomplete(input) {
    mobileSearchValue = input.value;
    state.searchDropdown = Boolean(input.value.trim());
    header.querySelector('.search-dropdown')?.remove();
    if (state.searchDropdown) header.querySelector('.mobile-header').insertAdjacentHTML('beforeend', renderSearchDropdown());
    syncSearchViewport();
  }

  function accountTitle() { return state.loggedIn ? `Olá, ${data.account.name}` : 'Entrar'; }

  function renderAccountIdentity() {
    return `<button class="account-state-toggle" type="button" data-toggle-login-state aria-label="Simular usuário ${state.loggedIn ? 'deslogado' : 'logado'}" title="Alternar estado de login no preview">${icon('conta', 'header-action-icon')}</button><button class="account-menu-trigger" type="button" data-open-account aria-haspopup="dialog" aria-expanded="${accountOpen}"><span><strong data-account-title>${accountTitle()}</strong><small>Minha conta</small></span>${chevron('down')}</button>`;
  }

  function renderAccountDialog() {
    const options = state.loggedIn
      ? `<nav class="account-options" aria-label="Opções da minha conta">${data.account.options.map(item => `<a href="${item.url || '#'}" ${item.url ? '' : 'data-pending-link'}>${icon(item.iconId)}<span>${item.label}</span></a>`).join('')}</nav><button class="account-signout" type="button" data-account-session>Sair da conta</button>`
      : '<p class="account-description">Entre para acompanhar seus pedidos e cuidar dos detalhes da sua obra.</p><button class="account-signin" type="button" data-account-session>Entrar</button><a class="account-register" href="#" data-pending-link>Criar conta</a>';
    return `<div class="account-layer" data-account-layer><div class="account-backdrop" data-close-account></div><section class="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title" tabindex="-1"><button class="account-close" type="button" data-close-account aria-label="Fechar Minha conta">×</button><div class="account-avatar">${icon('conta')}</div><p class="account-greeting">${state.loggedIn ? accountTitle() : 'Que bom ter você por aqui!'}</p><h2 id="account-title">${state.loggedIn ? 'Minha conta' : 'Entre na sua conta'}</h2>${options}<small class="account-preview-note">Preview: login e destinos de conta são demonstrativos.</small><p class="account-feedback" role="status"></p></section></div>`;
  }

  function updateAccountIdentity() {
    document.querySelectorAll('[data-account-title]').forEach(title => { title.textContent = accountTitle(); });
    document.querySelectorAll('[data-toggle-login-state]').forEach(button => button.setAttribute('aria-label', `Simular usuário ${state.loggedIn ? 'deslogado' : 'logado'}`));
  }

  function bindAccountDialog() {
    accountRoot.querySelectorAll('[data-close-account]').forEach(button => button.addEventListener('click', closeAccount));
    accountRoot.querySelector('[data-account-session]')?.addEventListener('click', () => {
      state.loggedIn = !state.loggedIn;
      updateAccountIdentity();
      accountRoot.innerHTML = renderAccountDialog();
      bindAccountDialog();
      accountRoot.querySelector('.account-dialog')?.focus({ preventScroll: true });
    });
    accountRoot.querySelectorAll('[data-pending-link]').forEach(link => link.addEventListener('click', () => {
      accountRoot.querySelector('.account-feedback').textContent = 'Este destino será conectado na integração da sua conta.';
    }));
  }

  function openAccount(opener) {
    clearTimeout(accountCloseTimer);
    accountOpener = opener;
    accountOpen = true;
    accountRoot.innerHTML = renderAccountDialog();
    bindAccountDialog();
    document.querySelectorAll('[data-open-account]').forEach(button => button.setAttribute('aria-expanded', 'true'));
    syncDocumentLock();
    accountRoot.querySelector('.account-dialog')?.focus({ preventScroll: true });
  }

  function closeAccount() {
    const layer = accountRoot.querySelector('[data-account-layer]');
    if (!layer || layer.classList.contains('is-closing')) return;
    const finish = () => {
      accountOpen = false;
      accountRoot.innerHTML = '';
      document.querySelectorAll('[data-open-account]').forEach(button => button.setAttribute('aria-expanded', 'false'));
      syncDocumentLock();
      const focusTarget = accountOpener?.isConnected ? accountOpener : header.querySelector('[data-open-account], [data-toggle-login-state]');
      focusTarget?.focus({ preventScroll: true });
    };
    layer.classList.add('is-closing');
    accountCloseTimer = setTimeout(finish, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200);
  }

  function bindLoginEvents(scope = document) {
    scope.querySelectorAll('[data-open-account], [data-toggle-login-state]').forEach(button => {
      if (button.dataset.accountBound) return;
      button.dataset.accountBound = 'true';
      button.addEventListener('click', () => {
        if (button.hasAttribute('data-toggle-login-state')) { state.loggedIn = !state.loggedIn; updateAccountIdentity(); }
        openAccount(button);
      });
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
      <div class="mega-content ${item === data.principal ? 'mega-content--principal' : ''}"><h2>Categorias em destaque</h2><div class="category-scroll"><div class="category-grid">${featured.map(([label, iconId]) => categoryCard(label, iconId, item === data.principal, window.Menu2026Tree.resolve(label, item.id)?.id)).join('')}</div></div>${moreLink(item)}</div>
      <aside class="brand-panel"><h2>Buscar por marcas</h2><div class="brand-grid ${item === data.principal && !item.bannerIds?.length ? 'brand-grid--wide' : ''}">${brands.map(brandCard).join('')}</div></aside></div>`;
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

  function categoryCard(label, iconId, large, categoryId) {
    return `<a class="category-card ${large ? 'category-card--large' : ''}" href="#">${icon(iconId || 'generic', '', categoryId)}<span>${label}</span><span class="category-card__arrow">${chevron('right')}</span></a>`;
  }

  function brandCard(id) {
    const src = data.assetRegistry.brand[id];
    return `<a class="brand-card" href="#" data-pending-link aria-label="${capitalize(id)}"><img src="${src}" alt="${capitalize(id)}" loading="lazy" decoding="async" width="100" height="60"></a>`;
  }

  function promoBanner(id) {
    return `<a class="promo-banner" href="#"><img src="${data.assetRegistry.banner[id]}" alt="Promoção: ${id.split('-').join(' ')}" loading="lazy" decoding="async"></a>`;
  }

  function renderEnvironmentMenu() {
    const active = data.environments.find(item => item.id === state.environment) || data.environments[0];
    return `<aside class="environment-rail" aria-label="Escolha um ambiente"><div class="environment-rail__list"><div class="environment-rail__grid">${data.environments.map(item => `<button type="button" class="environment-link ${item.id === active.id ? 'is-active' : ''}" style="--environment-position:${item.imagePosition || '50% 50%'}" data-environment-id="${item.id}" aria-current="${item.id === active.id ? 'true' : 'false'}" aria-expanded="${item.id === active.id ? 'true' : 'false'}" aria-controls="environment-detail"><img class="environment-link__image" src="${data.assetRegistry.environmentFeature[item.imageId]}" alt="" width="480" height="640" decoding="async" loading="lazy"><span class="environment-link__caption"><span class="environment-feature__label">Ambiente</span><span class="environment-link__name">${item.label}</span></span><span class="environment-link__arrow">${chevron('right')}</span></button>`).join('')}</div></div></aside>
      <div id="environment-detail" class="mega-panel mega-panel--environment"><div class="environment-content"><div class="environment-categories"><div class="environment-category-heading"><h2>${active.label}</h2><p>${active.heading}</p></div><div class="environment-scroll"><div class="environment-grid">${active.categories.map(label => categoryCard(label, categoryIcon(label))).join('')}</div></div>${moreLink(active)}</div></div></div>`;
  }

  function environmentImage(item) {
    return `<figure class="drawer-environment-card" style="--environment-position:${item.imagePosition || '50% 50%'}"><img src="${data.assetRegistry.environmentFeature[item.imageId]}" alt="" width="480" height="640" decoding="async" loading="lazy"><figcaption><strong>${item.label}</strong></figcaption></figure>`;
  }

  function environmentFeature(item, headingTag = 'h2') {
    return `<figure class="environment-feature"><img class="environment-feature__image" src="${data.assetRegistry.environmentFeature[item.imageId]}" alt="" width="480" height="640" decoding="async" loading="lazy"><figcaption class="environment-feature__caption"><span class="environment-feature__label">Ambiente</span><${headingTag}>${item.label}</${headingTag}><p class="environment-feature__description">${item.heading}</p></figcaption></figure>`;
  }

  function categoryIcon(label) {
    const value = label.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return categoryIconRules.find(rule => rule.pattern.test(value))?.iconId || 'generic';
  }

  function renderMobileHeader() {
    const location = mobileLocationMarkup();
    return `<div class="mobile-header">
      ${renderMobileTopbar()}
      <div class="mobile-main"><div class="mobile-main__left"><button class="icon-button hamburger" type="button" data-open-drawer aria-label="Abrir menu" aria-expanded="false" aria-controls="mobile-drawer"><span></span><span></span><span></span></button><button class="icon-button mobile-account" type="button" data-toggle-login-state aria-label="Simular usuário ${state.loggedIn ? 'deslogado' : 'logado'}" title="Alternar estado de login no preview">${icon('conta', 'header-action-icon')}</button></div>
      <a class="abc-logo" href="#" aria-label="ABC da Construção — início">${assetImg('logo','abc')}</a>
      <div class="mobile-main__right"><button class="icon-button search-toggle" type="button" data-toggle-search aria-label="${state.searchOpen ? 'Fechar busca' : 'Abrir busca'}" aria-expanded="${state.searchOpen}" aria-controls="mobile-search-row"><span class="search__icon"></span></button><button class="icon-button cart-button" type="button" aria-label="Carrinho com zero itens"><span class="cart-icon">${icon('carrinho-mao', 'header-action-icon')}<b>0</b></span></button></div></div>
      <button class="mobile-location" type="button" data-open-regionalization aria-label="${state.regionalized ? 'Alterar local de entrega' : 'Informar CEP'}">${icon('regionalizacao', 'header-action-icon')}${location}${chevron('down')}</button>
      ${state.searchOpen ? `<div id="mobile-search-row" class="mobile-search-row">${renderSearch('mobile')}</div>` : ''}
      ${state.searchDropdown ? renderSearchDropdown() : ''}
      <div class="mobile-communications" aria-hidden="true" inert><div class="mobile-communications__clip">${renderCommunications()}</div></div>
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
    return `<div class="drawer-view-header">${renderDrawerViewHeader()}</div><div class="drawer-body">${renderDrawerTrack()}</div>`;
  }

  function renderDrawerIdentityHeader() {
    const location = mobileLocationMarkup();
    return `<div class="drawer-header"><div class="drawer-user"><div class="account-identity">${renderAccountIdentity()}</div><a class="sac-chip" href="#" data-pending-link>${assetImg('icon','whatsapp')} SAC</a></div><button class="drawer-location" type="button" data-open-regionalization>${icon('regionalizacao', 'header-action-icon')}${location}${chevron('down')}</button></div>`;
  }

  function desktopLocationMarkup() {
    return state.regionalized
      ? `<span><small>Entregar em:</small><strong>${state.delivery.cep} - ${state.delivery.city}</strong></span>`
      : '<span class="location-prompt">Informe seu CEP</span>';
  }

  function mobileLocationMarkup() {
    return state.regionalized
      ? `<span>Entregar em:</span> <strong>${state.delivery.cep} - ${state.delivery.city}</strong>`
      : '<strong>Informe seu CEP</strong>';
  }

  function renderRegionalization() {
    if (!state.regionalizationOpen) return '';
    const valid = isValidCep(state.regionalizationValue);
    return `<div class="regionalization-layer" data-regionalization-layer>
      <div class="regionalization-backdrop" data-close-regionalization></div>
      <section class="regionalization-dialog" role="dialog" aria-modal="true" aria-labelledby="regionalization-title" aria-describedby="regionalization-help" tabindex="-1">
        <div class="regionalization-pin" aria-hidden="true"><svg viewBox="0 0 32 40"><path d="M16 38S3 25.1 3 14.8C3 7.7 8.8 2 16 2s13 5.7 13 12.8C29 25.1 16 38 16 38Z"/><circle cx="16" cy="14.5" r="4"/></svg></div>
        <h2 id="regionalization-title">Seu CEP determina as ofertas e os prazos disponíveis para a sua região.</h2>
        <p id="regionalization-help" class="sr-only">Digite um CEP com oito números para definir sua região.</p>
        <form class="regionalization-form" novalidate>
          <div class="cep-field ${state.regionalizationError ? 'has-error' : ''}">
            <input id="regionalization-cep" type="text" inputmode="numeric" autocomplete="postal-code" maxlength="9" placeholder="Informe seu CEP" value="${state.regionalizationValue}" aria-describedby="cep-error" aria-invalid="${Boolean(state.regionalizationError)}">
            <button class="cep-clear" type="button" data-delete-cep aria-label="Apagar último dígito do CEP" ${state.regionalizationValue ? '' : 'hidden'}><svg viewBox="0 0 24 18" aria-hidden="true"><path d="M8 2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8L2 9l6-7Z"/><path d="m12 6 5 6m0-6-5 6"/></svg></button>
          </div>
          <p id="cep-error" class="cep-error" aria-live="polite">${state.regionalizationError}</p>
          <div class="regionalization-actions">
            <button class="regionalization-close" type="button" data-close-regionalization>Fechar</button>
            <button class="regionalization-submit" type="submit" ${valid ? '' : 'disabled'}>Ver produtos</button>
          </div>
        </form>
      </section>
    </div>`;
  }

  function formatCep(value) {
    const digits = String(value).replace(/\D/g, '').slice(0, 8);
    return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
  }

  function isValidCep(value) {
    const digits = String(value).replace(/\D/g, '');
    return digits.length === 8 && !/^(\d)\1{7}$/.test(digits);
  }

  function openRegionalization(opener) {
    state.regionalizationOpener = opener || document.activeElement;
    state.regionalizationOpen = true;
    state.regionalizationError = '';
    state.regionalizationValue = state.regionalized ? state.delivery.cep : '';
    regionalizationBaselineHeight = window.visualViewport?.height || window.innerHeight;
    regionalizationRoot.innerHTML = renderRegionalization();
    bindRegionalizationEvents();
    syncDocumentLock();
    requestAnimationFrame(focusRegionalization);
  }

  function focusRegionalization() {
    const target = desktopQuery.matches ? document.getElementById('regionalization-cep') : document.querySelector('.regionalization-dialog');
    target?.focus({ preventScroll: true });
  }

  function syncRegionalizationViewport() {
    const layer = document.querySelector('[data-regionalization-layer]');
    if (!layer) return;
    const viewport = window.visualViewport;
    if (viewport && !desktopQuery.matches) {
      if (!regionalizationBaselineHeight) regionalizationBaselineHeight = viewport.height;
      if (document.activeElement?.id !== 'regionalization-cep') regionalizationBaselineHeight = viewport.height;
      layer.style.setProperty('--visible-height', `${viewport.height}px`);
      layer.style.setProperty('--visible-top', `${viewport.offsetTop}px`);
      layer.classList.toggle('is-keyboard-open', document.activeElement?.id === 'regionalization-cep' && viewport.height < regionalizationBaselineHeight - 120);
    } else {
      layer.style.removeProperty('--visible-height');
      layer.style.removeProperty('--visible-top');
      layer.classList.remove('is-keyboard-open');
    }
  }

  function closeRegionalization() {
    const layer = document.querySelector('[data-regionalization-layer]');
    const finish = () => {
      state.regionalizationOpen = false;
      const opener = state.regionalizationOpener;
      state.regionalizationOpener = null;
      regionalizationRoot.innerHTML = '';
      document.querySelectorAll('.drawer-location, .mobile-location, .action-item--location').forEach(button => {
        const desktop = button.classList.contains('action-item--location');
        button.innerHTML = icon('regionalizacao', 'header-action-icon') + (desktop ? desktopLocationMarkup() : mobileLocationMarkup()) + chevron('down');
        button.setAttribute('aria-label', state.regionalized ? 'Alterar local de entrega' : 'Informar CEP');
      });
      syncDocumentLock();
      requestAnimationFrame(() => opener?.isConnected && opener.focus({ preventScroll: true }));
    };
    if (!layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    layer.classList.add('is-closing');
    window.setTimeout(finish, 220);
  }

  function bindRegionalizationEvents() {
    const layer = document.querySelector('[data-regionalization-layer]');
    if (!layer) return;
    if (!regionalizationViewportBound) {
      window.visualViewport?.addEventListener('resize', syncRegionalizationViewport);
      window.visualViewport?.addEventListener('scroll', syncRegionalizationViewport);
      window.addEventListener('resize', syncRegionalizationViewport);
      regionalizationViewportBound = true;
    }
    syncRegionalizationViewport();
    const input = layer.querySelector('#regionalization-cep');
    const submit = layer.querySelector('.regionalization-submit');
    const deleteDigit = layer.querySelector('[data-delete-cep]');
    const error = layer.querySelector('.cep-error');
    input.addEventListener('focus', () => requestAnimationFrame(syncRegionalizationViewport));
    layer.querySelectorAll('[data-close-regionalization]').forEach(button => button.addEventListener('click', closeRegionalization));
    input.addEventListener('input', () => {
      const next = formatCep(input.value);
      input.value = next;
      state.regionalizationValue = next;
      state.regionalizationError = '';
      input.setAttribute('aria-invalid', 'false');
      input.closest('.cep-field').classList.remove('has-error');
      error.textContent = '';
      submit.disabled = !isValidCep(next);
      deleteDigit.hidden = !next;
    });
    deleteDigit.addEventListener('click', () => {
      const digits = input.value.replace(/\D/g, '').slice(0, -1);
      const next = formatCep(digits);
      state.regionalizationValue = next;
      state.regionalizationError = '';
      input.value = next;
      input.setAttribute('aria-invalid', 'false');
      input.closest('.cep-field').classList.remove('has-error');
      error.textContent = '';
      submit.disabled = !isValidCep(next);
      deleteDigit.hidden = !next;
      input.focus();
    });
    layer.querySelector('form').addEventListener('submit', event => {
      event.preventDefault();
      if (!isValidCep(input.value)) {
        state.regionalizationError = 'Digite um CEP válido com 8 números.';
        input.setAttribute('aria-invalid', 'true');
        input.closest('.cep-field').classList.add('has-error');
        error.textContent = state.regionalizationError;
        input.focus();
        return;
      }
      const digits = input.value.replace(/\D/g, '');
      state.delivery = { cep: formatCep(digits), city: cepCities[digits] || 'Sua região' };
      state.regionalized = true;
      closeRegionalization();
    });
  }

  function renderDrawerTrack() {
    const snapshot = state.drawerPreviousHtml.replace(/\s(?:id|aria-controls|aria-labelledby)="[^"]*"/g, '');
    const previous = snapshot ? `<div class="drawer-panel drawer-panel--previous" inert aria-hidden="true" style="--previous-scroll:${state.drawerPreviousScroll}px">${snapshot}</div>` : '';
    const direction = state.drawerPreviousHtml ? ` drawer-track--${state.drawerDirection}` : '';
    return `<div class="drawer-track${direction}">${previous}<div class="drawer-panel drawer-panel--current">${state.drawerLevel === 'root' ? renderDrawerIdentityHeader() : ''}${renderDrawerLevel()}${renderDrawerFooter()}</div></div>`;
  }

  function renderDrawerViewHeader() {
    if (state.drawerLevel === 'root') return `<div class="drawer-sticky-category" hidden>
      <button type="button" data-collapse-visible-category aria-label="Recolher categoria">
        <span class="drawer-sticky-category__identity"><img data-sticky-category-icon alt="" aria-hidden="true"><span data-sticky-category-label></span></span>
        <span class="drawer-sticky-category__control">${navChevron()}<span class="drawer-sticky-category__action">Recolher</span></span>
      </button>
      <figure class="drawer-sticky-environment" hidden><img data-sticky-environment-image alt="" aria-hidden="true"><figcaption><strong data-sticky-environment-label></strong></figcaption></figure>
    </div>`;
    let title = 'Categorias';
    if (state.drawerLevel === 'departments') title = 'Departamentos';
    if (state.drawerLevel === 'environments') title = 'Ambientes';
    if (state.drawerLevel === 'department') title = (state.drawerId === data.principal.id ? data.principal : data.departments.find(item => item.id === state.drawerId))?.label || 'Categorias';
    if (state.drawerLevel === 'environment') title = data.environments.find(item => item.id === state.drawerId)?.label || 'Ambiente';
    if (state.drawerLevel === 'category') title = state.drawerCategory?.label || 'Subcategoria';
    return `<div class="drawer-title"><button type="button" data-drawer-back aria-label="Voltar">${chevron('left')}</button><h2 id="drawer-view-title" tabindex="-1">${title}</h2></div>`;
  }

  function renderDrawerFooter() {
    return `<footer class="drawer-footer"><span class="drawer-footer__eyebrow">Conte com</span><p>ABC da Construção, a maior especialista em acabamentos do Brasil.</p><nav aria-label="Ajuda e serviços">${data.drawerFooter.map(item => `<a href="#" data-pending-link>${icon(item.iconId)}<span>${item.label}</span></a>`).join('')}</nav></footer><footer class="drawer-footer__legal">${assetImg('logo','mysa')}<div><small>MYSA S/A · CNPJ: 38.542.718/0052-22</small><small>Todos os direitos reservados 2026.</small><small>Preços e condições exclusivos para abcdaconstrucao.com.br</small></div></footer>`;
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
    return renderMobileAccordion(data.principal, renderMobileCategoryOptions(data.principal, 'department'), data.principal.id, 'root') +
      data.navigation.map(item => {
        if (item.menu === 'departments') return renderMobileAccordion(item, renderDepartmentOptions(), 'nav-' + item.id, 'root');
        if (item.menu === 'environments') return renderMobileAccordion(item, renderEnvironmentOptions(), 'nav-' + item.id, 'root');
        if (item.menu === 'department') {
          const department = data.departments.find(entry => entry.id === item.departmentId);
          return renderMobileAccordion(item, renderMobileCategoryOptions(department, 'department'), 'nav-' + item.id, 'root');
        }
        return `<a class="drawer-direct-link" href="#" data-pending-link>${icon(item.iconId)}<span>${item.label}</span></a>`;
      }).join('') +
      '<a class="drawer-sale" href="#" data-pending-link><span class="sale-pill">Saldão de Ofertas <span aria-hidden="true">🔥</span></span></a>';
  }

  function renderMobileAccordion(item, content, key = item.id, group = 'root') {
    const isPrincipal = group === 'root' && key === data.principal.id;
    const expanded = isPrincipal ? state.principalExpanded : state.drawerExpanded.get(group) === key;
    const principalClass = item.id === data.principal.id ? ' drawer-accordion__trigger--principal' : '';
    const environmentClass = item.imageId ? ' drawer-accordion__trigger--environment' : '';
    const sectionClass = item.imageId ? ' drawer-accordion--environment' : '';
    const label = item.imageId ? '' : '<span>' + item.label + '</span>';
    const accessibleLabel = item.imageId ? ' aria-label="' + item.label + '"' : '';
    if (!expanded) content = content.replace(/<img([^>]*?)\ssrc=/g, '<img$1 data-src=');
    return '<section class="drawer-accordion' + sectionClass + ' ' + (expanded ? 'is-expanded' : '') + '"><button class="drawer-accordion__trigger' + principalClass + environmentClass + '" type="button"' + accessibleLabel + ' data-drawer-accordion="' + key + '" data-drawer-group="' + group + '" aria-expanded="' + expanded + '" aria-controls="drawer-options-' + safeId(key) + '">' + (item.imageId ? environmentImage(item) : icon(item.iconId || 'departamentos', '', item.id)) + label + navChevron() + '</button><div id="drawer-options-' + safeId(key) + '" class="drawer-accordion__content" ' + (expanded ? '' : 'inert') + '><div><nav class="drawer-option-list" aria-label="' + item.label + '">' + content + '</nav></div></div></section>';
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
    return entries.map(([label, id]) => {
      const node = window.Menu2026Tree.resolve(label, item.id);
      return drawerOption(label, icon(id, '', node?.id), `data-drawer-level="category" data-drawer-id="${node?.departmentId || item.id}" data-category-node="${node?.id || ''}" data-category-scope="${node ? 'department' : scope}" data-category-label="${encodeURIComponent(label)}" data-category-icon="${id}"`);
    }).join('') + renderMobileBrands(item);
  }

  function renderMobileBrands(item) {
    const brands = item.brandIds || [];
    return brands.length ? `<section class="drawer-brands" aria-label="Buscar por marcas de ${item.label}"><h3>Buscar por marcas</h3><div class="brand-grid">${brands.map(brandCard).join('')}</div></section>` : '';
  }

  function renderDrawerDepartments() {
    return data.departments.map(item => renderMobileAccordion({ ...item, iconId: item.iconId || featuredCategories(item)[0]?.[1] }, renderMobileCategoryOptions(item, 'department'), 'department-' + item.id, 'departments')).join('');
  }

  function renderDrawerEnvironments() {
    return data.environments.map(item => renderMobileAccordion({ ...item, iconId: item.iconId }, renderMobileCategoryOptions(item, 'environment'), 'environment-' + item.id, 'environments')).join('');
  }

  function renderDrawerEnvironmentDetail() {
    const item = data.environments.find(entry => entry.id === state.drawerId) || data.environments[0];
    return '<div class="drawer-detail">' + environmentFeature(item, 'h3') + '<div class="drawer-category-list">' + renderMobileCategoryOptions(item, 'environment') + '</div>' + moreLink(item) + '</div>';
  }

  function renderDrawerDepartmentDetail() {
    const item = state.drawerId === data.principal.id ? data.principal : data.departments.find(entry => entry.id === state.drawerId) || data.departments[0];
    return '<div class="drawer-detail">' +
      (item.bannerIds ? '<section><h3>Promoções em destaque</h3><div class="drawer-banners">' + item.bannerIds.map(promoBanner).join('') + '</div></section>' : '') +
      '<section><h3>Categorias em destaque</h3><div class="drawer-category-list">' + renderMobileCategoryOptions(item, 'department') + '</div></section>' +
      moreLink(item) + '</div>';
  }

  function renderDrawerCategoryDetail() {
    const category = state.drawerCategory;
    if (!category) return '';
    const parent = category.scope === 'environment' ? data.environments.find(item => item.id === state.drawerId) : state.drawerId === data.principal.id ? data.principal : data.departments.find(item => item.id === state.drawerId);
    const node = window.Menu2026Tree.resolve(category.label, state.drawerId, category.nodeId);
    const children = node?.children || [];
    return '<div class="drawer-detail drawer-category-detail"><div class="drawer-category-intro">' + icon(category.iconId) + '<span>Encontre o acabamento para a sua obra.</span></div>' +
      (children.length ? '<nav class="drawer-category-list" aria-label="Opções de ' + category.label + '">' + children.map(child => {
        const label = typeof child === 'string' ? child : child.label;
        const artwork = child.iconId || categoryIcon(label);
        return drawerOption(label, icon(artwork, '', child.id), `data-drawer-level="category" data-drawer-id="${node.departmentId}" data-category-node="${child.id}" data-category-scope="department" data-category-label="${encodeURIComponent(label)}" data-category-icon="${artwork}"`);
      }).join('') + '</nav>' : '<p class="drawer-category-note">A seleção de produtos desta categoria será conectada ao catálogo na integração final.</p>') +
      moreLink(parent || {}) + '</div>';
  }

  function bindEvents() {
    bindCommunications();
    bindMobileTopbar();
    syncMobileHeader();
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
    bindLoginEvents();
    bindRegionalizationTriggers();
    bindRegionalizationEvents();
    if (!desktopQuery.matches) bindMobileSearchInput();
    const searchToggle = document.querySelector('[data-toggle-search]');
    if (searchToggle) searchToggle.addEventListener('click', () => {
      if (state.searchOpen) { closeMobileSearch(); return; }
      state.searchOpen = true;
      syncMobileHeader();
      searchBaselineHeight = window.visualViewport?.height || window.innerHeight;
      searchEngaged = false;
      const mobileHeader = header.querySelector('.mobile-header');
      mobileHeader.insertAdjacentHTML('beforeend', `<div id="mobile-search-row" class="mobile-search-row">${renderSearch('mobile')}</div>`);
      searchToggle.setAttribute('aria-expanded', 'true');
      searchToggle.setAttribute('aria-label', 'Fechar busca');
      bindMobileSearchInput();
      // Synchronous focus inside the tap gesture keeps iOS/Android keyboard activation.
      header.querySelector('[data-search-input]')?.focus({ preventScroll: true });
    });
    const openDrawer = document.querySelector('[data-open-drawer]');
    if (openDrawer) openDrawer.addEventListener('click', () => { state.opener = openDrawer; state.drawerOpen = true; state.drawerBusy = false; state.drawerLevel = 'root'; state.drawerId = null; state.drawerCategory = null; state.drawerHistory = []; state.drawerPreviousHtml = ''; render(); requestAnimationFrame(() => document.querySelector('#mobile-drawer')?.focus()); });
    document.querySelectorAll('[data-close-drawer]').forEach(button => button.addEventListener('click', closeDrawer));
    bindDrawerPanelEvents();
  }

  function bindMobileSearchInput() {
    const input = header.querySelector('[data-search-input]');
    if (!input || input.dataset.searchBound) return;
    input.dataset.searchBound = 'true';
    input.value = mobileSearchValue;
    input.addEventListener('input', () => { engageSearch(); updateMobileAutocomplete(input); });
    input.addEventListener('pointerdown', engageSearch);
    input.addEventListener('focus', () => { clearTimeout(searchTimer); if (input.value.trim()) updateMobileAutocomplete(input); });
    syncSearchViewport();
  }

  function bindRegionalizationTriggers(scope = document) {
    scope.querySelectorAll('[data-open-regionalization]').forEach(button => {
      if (button.dataset.regionalizationBound) return;
      button.dataset.regionalizationBound = 'true';
      button.addEventListener('click', () => openRegionalization(button));
    });
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

  function preserveDrawerCategoryPosition(button, sequence) {
    const body = button.closest('.drawer-body');
    if (!body) return;
    const anchorTop = button.getBoundingClientRect().top - body.getBoundingClientRect().top;
    const previousOverflowAnchor = body.style.overflowAnchor;
    body.style.overflowAnchor = 'none';
    let cancelled = false;
    const cancel = () => { cancelled = true; };
    body.addEventListener('touchstart', cancel, { passive: true });
    body.addEventListener('wheel', cancel, { passive: true });
    const started = performance.now();
    const follow = () => {
      if (cancelled || sequence !== drawerScrollSequence || !button.isConnected) {
        finish();
        return;
      }
      const delta = button.getBoundingClientRect().top - body.getBoundingClientRect().top - anchorTop;
      if (Math.abs(delta) > .5) body.scrollTop += delta;
      if (performance.now() - started < 600) requestAnimationFrame(follow);
      else finish();
    };
    const finish = () => {
      body.style.overflowAnchor = previousOverflowAnchor;
      body.removeEventListener('touchstart', cancel);
      body.removeEventListener('wheel', cancel);
      body.onscroll?.();
    };
    requestAnimationFrame(follow);
  }

  function scrollToOpenedDrawerAccordion(button, closingContent, sequence) {
    const body = button.closest('.drawer-body');
    if (!body) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const scroll = () => {
      if (sequence !== drawerScrollSequence || !button.isConnected) return;
      // Environment cards live under the sticky “Ambientes” header. Reserve its
      // exact height so the original card lands in the same visual position as
      // the fixed card, instead of passing underneath it during the opening motion.
      const headerOffset = button.classList.contains('drawer-accordion__trigger--environment') ? 72 : 8;
      const top = body.scrollTop + button.getBoundingClientRect().top - body.getBoundingClientRect().top - headerOffset;
      body.scrollTo({ top: Math.max(0, top), behavior: reducedMotion ? 'instant' : 'smooth' });
    };
    if (!closingContent || reducedMotion) {
      requestAnimationFrame(scroll);
      return;
    }
    let timeout;
    const finish = () => {
      closingContent.removeEventListener('transitionend', onTransitionEnd);
      clearTimeout(timeout);
      scroll();
    };
    const onTransitionEnd = event => {
      if (event.target === closingContent && event.propertyName === 'grid-template-rows') finish();
    };
    closingContent.addEventListener('transitionend', onTransitionEnd);
    timeout = window.setTimeout(finish, 560);
  }

  function bindStickyDrawerCategory(currentPanel) {
    const body = currentPanel?.closest('.drawer-body');
    const sticky = document.querySelector('.drawer-sticky-category');
    if (!body || !sticky) {
      if (body) body.onscroll = null;
      return;
    }
    const stickyButton = sticky.querySelector('[data-collapse-visible-category]');
    const stickyIcon = sticky.querySelector('[data-sticky-category-icon]');
    const stickyEnvironment = sticky.querySelector('.drawer-sticky-environment');
    const stickyEnvironmentImage = sticky.querySelector('[data-sticky-environment-image]');
    const stickyEnvironmentLabel = sticky.querySelector('[data-sticky-environment-label]');
    let activeTrigger = null;
    let collapseTrigger = null;
    let frame = 0;
    let lastScrollTop = body.scrollTop;
    let returningToNavigation = false;
    let pendingEnvironment = null;
    let environmentTimer;
    const rootHeader = currentPanel.querySelector('.drawer-header');
    const pauseForInteraction = () => {
      clearTimeout(environmentTimer);
      pendingEnvironment = null;
      drawerAutoPauseUntil = performance.now() + 650;
    };
    // Scrolling must not change the hit target during a tap or keyboard action.
    currentPanel.addEventListener('pointerdown', pauseForInteraction, { passive: true });
    currentPanel.addEventListener('focusin', pauseForInteraction);
    const environmentCandidate = () => {
      if (!currentPanel.isConnected) return null;
      const rootTrigger = currentPanel.querySelector('[data-drawer-accordion="nav-ambientes"]');
      const rootSection = rootTrigger?.closest('.drawer-accordion');
      if (!rootSection?.classList.contains('is-expanded') || accountOpen || state.regionalizationOpen || state.drawerBusy) return null;
      const line = body.getBoundingClientRect().top + 112;
      return [...rootSection.querySelectorAll('.drawer-accordion__trigger--environment')].find(trigger => {
        const rect = trigger.getBoundingClientRect();
        return !trigger.closest('[inert]') && rect.top <= line && rect.bottom > line;
      }) || null;
    };
    const scheduleEnvironment = () => {
      const candidate = environmentCandidate();
      if (!candidate || candidate.getAttribute('aria-expanded') === 'true' || candidate.dataset.drawerAccordion === manuallyClosedEnvironment || performance.now() < drawerAutoPauseUntil) {
        clearTimeout(environmentTimer);
        pendingEnvironment = null;
        return;
      }
      if (candidate === pendingEnvironment) return;
      clearTimeout(environmentTimer);
      pendingEnvironment = candidate;
      // Dwell avoids opening every card crossed by a quick fling.
      environmentTimer = setTimeout(() => {
        pendingEnvironment = null;
        if (!candidate.isConnected || candidate !== environmentCandidate() || performance.now() < drawerAutoPauseUntil) return;
        manuallyClosedEnvironment = null;
        changeDrawerAccordion(candidate, 'scroll');
        schedule();
      }, 140);
    };
    const update = () => {
      if (!currentPanel.isConnected) return;
      const edge = body.getBoundingClientRect().top;
      const scrollTop = body.scrollTop;
      if (!body.classList.contains('is-auto-switching')) {
        if (scrollTop < lastScrollTop - 2) returningToNavigation = true;
        else if (scrollTop > lastScrollTop + 2) returningToNavigation = false;
      }
      lastScrollTop = scrollTop;
      if (rootHeader) {
        const departments = currentPanel.querySelector('[data-drawer-accordion="nav-departamentos"]');
        const navigationStart = departments ? scrollTop + departments.getBoundingClientRect().top - edge : 120;
        const showHeader = scrollTop < 12 || returningToNavigation && scrollTop <= navigationStart + 72;
        rootHeader.classList.toggle('is-away', !showHeader);
        rootHeader.toggleAttribute('inert', !showHeader);
      }
      scheduleEnvironment();
      activeTrigger = null;
      currentPanel.querySelectorAll('.drawer-accordion.is-expanded').forEach(accordion => {
        const trigger = accordion.querySelector(':scope > .drawer-accordion__trigger');
        // Photo cards are handled inside their parent menu's bounds below.
        // Never infer the sticky position from a hidden or collapsed descendant.
        if (!trigger || trigger.classList.contains('drawer-accordion__trigger--environment') || trigger.closest('[inert]')) return;
        if (trigger.getBoundingClientRect().bottom <= edge + 1 && accordion.getBoundingClientRect().bottom > edge + 72) activeTrigger = trigger;
      });
      if (rootHeader && !rootHeader.classList.contains('is-away')) activeTrigger = null;
      sticky.hidden = !activeTrigger;
      if (!activeTrigger) {
        stickyEnvironment.hidden = true;
        currentPanel.querySelectorAll('.drawer-accordion--environment.is-sticky-cloned').forEach(accordion => accordion.classList.remove('is-sticky-cloned'));
        collapseTrigger = null;
        return;
      }
      const isEnvironment = activeTrigger.classList.contains('drawer-accordion__trigger--environment');
      const environmentAccordion = isEnvironment ? activeTrigger.closest('.drawer-accordion--environment') : null;
      const rootAccordion = environmentAccordion?.parentElement?.closest('.drawer-accordion__content')?.closest('.drawer-accordion');
      const categoryTrigger = rootAccordion?.querySelector(':scope > .drawer-accordion__trigger') || activeTrigger;
      collapseTrigger = categoryTrigger;
      const label = categoryTrigger.querySelector(':scope > span:not(.nav-chevron)')?.textContent?.trim() || categoryTrigger.querySelector('figcaption strong')?.textContent?.trim() || 'Categoria';
      sticky.querySelector('[data-sticky-category-label]').textContent = label;
      const categoryIcon = categoryTrigger.querySelector(':scope > img');
      stickyIcon.src = categoryIcon?.currentSrc || categoryIcon?.src || '';
      stickyIcon.hidden = !stickyIcon.src;
      stickyButton.setAttribute('aria-label', `Recolher ${label}`);
      // As soon as the Ambientes header is sticky, keep the chosen photo card with it.
      // This prevents the original card from passing underneath the fixed header midway.
      const categoryAccordion = categoryTrigger.closest('.drawer-accordion');
      const environmentTrigger = [...categoryAccordion.querySelectorAll('.drawer-accordion--environment.is-expanded > .drawer-accordion__trigger--environment')].find(trigger => {
        const section = trigger.closest('.drawer-accordion--environment');
        const rect = trigger.getBoundingClientRect();
        const photoHeight = parseFloat(getComputedStyle(stickyEnvironment).height) || 160;
        return !trigger.closest('[inert]') && rect.top <= edge + 73 && section.getBoundingClientRect().bottom > edge + 72 + photoHeight;
      });
      stickyEnvironment.hidden = !environmentTrigger;
      const environmentAccordionToClone = environmentTrigger?.closest('.drawer-accordion--environment');
      currentPanel.querySelectorAll('.drawer-accordion--environment.is-sticky-cloned').forEach(accordion => {
        accordion.classList.toggle('is-sticky-cloned', accordion === environmentAccordionToClone);
      });
      if (environmentAccordionToClone && !environmentAccordionToClone.classList.contains('is-sticky-cloned')) environmentAccordionToClone.classList.add('is-sticky-cloned');
      if (environmentTrigger) {
        const environmentImage = environmentTrigger.querySelector('.drawer-environment-card > img');
        const environmentLabel = environmentTrigger.querySelector('.drawer-environment-card figcaption strong')?.textContent?.trim() || '';
        stickyEnvironmentImage.src = environmentImage?.currentSrc || environmentImage?.src || '';
        stickyEnvironmentImage.style.objectPosition = environmentImage ? getComputedStyle(environmentImage).objectPosition : '';
        stickyEnvironmentLabel.textContent = environmentLabel;
      }
    };
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => { frame = 0; update(); });
    };
    body.onscroll = schedule;
    stickyButton.addEventListener('click', () => {
      if (!collapseTrigger?.isConnected) return;
      const collapseTop = Math.max(0, body.scrollTop + collapseTrigger.getBoundingClientRect().top - body.getBoundingClientRect().top - 2);
      sticky.hidden = true;
      stickyEnvironment.hidden = true;
      collapseTrigger.click();
      // The section is often much taller than the viewport. Once it closes, bring
      // its original trigger back into view instead of leaving the customer at the footer.
      window.setTimeout(() => body.scrollTo({ top: collapseTop, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }), 460);
    });
    schedule();
  }

  function bindDrawerPanelEvents() {
    const currentPanel = document.querySelector('.drawer-panel--current');
    hydrateDrawerImages(currentPanel);
    bindLoginEvents(currentPanel || document);
    bindRegionalizationTriggers(currentPanel || document);
    bindStickyDrawerCategory(currentPanel);
    currentPanel?.querySelectorAll('[data-drawer-level]').forEach(button => button.addEventListener('click', () => {
      if (button.dataset.drawerLevel === 'link') return;
      const category = button.dataset.categoryLabel ? { label: decodeURIComponent(button.dataset.categoryLabel), scope: button.dataset.categoryScope, iconId: button.dataset.categoryIcon, nodeId: button.dataset.categoryNode } : null;
      animateChevronAndNavigate(button, () => navigateDrawer(button.dataset.drawerLevel, button.dataset.drawerId, category));
    }));
    const back = document.querySelector('.drawer-view-header [data-drawer-back]');
    if (back) back.addEventListener('click', () => animateBackAndNavigate(back));
    currentPanel?.querySelectorAll('[data-drawer-accordion]').forEach(button => button.addEventListener('click', () => changeDrawerAccordion(button)));
    clearDrawerAnimationArtifacts();
  }

  function changeDrawerAccordion(button, source = 'pointer') {
    if (state.drawerBusy) return;
    const currentPanel = button.closest('.drawer-panel--current');
    const body = currentPanel?.closest('.drawer-body');
    if (!currentPanel || !body) return;
    const automatic = source === 'scroll';
    drawerAutoPauseUntil = performance.now() + (automatic ? 450 : 650);
    const anchorTop = automatic ? button.getBoundingClientRect().top : null;
    if (automatic) body.classList.add('is-auto-switching');
    const id = button.dataset.drawerAccordion;
    const group = button.dataset.drawerGroup;
    const isPrincipal = group === 'root' && id === data.principal.id;
    const accordion = button.closest('.drawer-accordion');
    const content = accordion.querySelector(':scope > .drawer-accordion__content');
    const sequence = ++drawerScrollSequence;
    if (isPrincipal) {
      state.principalExpanded = !state.principalExpanded;
      accordion.classList.toggle('is-expanded', state.principalExpanded);
      button.setAttribute('aria-expanded', String(state.principalExpanded));
      content.toggleAttribute('inert', !state.principalExpanded);
      hydrateDrawerImages(currentPanel);
      if (state.principalExpanded) scrollToOpenedDrawerAccordion(button, null, sequence);
      window.setTimeout(() => currentPanel?.closest('.drawer-body')?.onscroll?.(), 500);
      return;
    }
    const expanded = automatic || state.drawerExpanded.get(group) !== id;
    if (!automatic && button.classList.contains('drawer-accordion__trigger--environment')) manuallyClosedEnvironment = expanded ? null : id;
    const switchingEnvironment = expanded && button.classList.contains('drawer-accordion__trigger--environment') && Boolean(state.drawerExpanded.get(group));
    if (switchingEnvironment && !automatic) preserveDrawerCategoryPosition(button, sequence);
    let closingContent = null;
    // Principal Categories opens and closes independently of the other menu groups.
    if (expanded) {
      [...currentPanel.querySelectorAll('[data-drawer-accordion]')].filter(peer => peer !== button && peer.dataset.drawerGroup === group && peer.dataset.drawerAccordion !== data.principal.id).forEach(peer => {
        const openAccordion = peer.closest('.drawer-accordion');
        if (!openAccordion.classList.contains('is-expanded')) return;
        closingContent ||= openAccordion.querySelector(':scope > .drawer-accordion__content');
        openAccordion.querySelectorAll('[data-drawer-accordion]').forEach(descendantTrigger => {
          state.drawerExpanded.delete(descendantTrigger.dataset.drawerGroup);
          descendantTrigger.setAttribute('aria-expanded', 'false');
        });
        openAccordion.classList.remove('is-expanded');
        openAccordion.querySelectorAll('.drawer-accordion').forEach(descendant => descendant.classList.remove('is-expanded'));
        openAccordion.querySelectorAll('.drawer-accordion__content').forEach(content => content.setAttribute('inert', ''));
      });
    }
    expanded ? state.drawerExpanded.set(group, id) : state.drawerExpanded.delete(group);
    accordion.classList.toggle('is-expanded', expanded);
    button.setAttribute('aria-expanded', String(expanded));
    content.toggleAttribute('inert', !expanded);
    if (expanded) hydrateDrawerImages(currentPanel);
    if (!expanded) {
      // A closed parent must never retain an expanded child. Besides avoiding an
      // unexpected reopen, this keeps the sticky category bar tied to visible content.
      accordion.querySelectorAll('[data-drawer-accordion]').forEach(descendantTrigger => {
        if (descendantTrigger === button) return;
        state.drawerExpanded.delete(descendantTrigger.dataset.drawerGroup);
        descendantTrigger.setAttribute('aria-expanded', 'false');
      });
      accordion.querySelectorAll('.drawer-accordion').forEach(descendant => {
        if (descendant !== accordion) descendant.classList.remove('is-expanded');
      });
      accordion.querySelectorAll('.drawer-accordion__content').forEach(descendantContent => {
        if (descendantContent !== content) descendantContent.setAttribute('inert', '');
      });
    }
    if (automatic) {
      // Change heights atomically, compensate layout before paint, then fade
      // the new options. Do not chase or reset the customer's ongoing scroll.
      body.scrollTop += button.getBoundingClientRect().top - anchorTop;
      setTimeout(() => { body.classList.remove('is-auto-switching'); body.onscroll?.(); }, 360);
    } else if (expanded && !switchingEnvironment) scrollToOpenedDrawerAccordion(button, closingContent, sequence);
    window.setTimeout(() => currentPanel?.closest('.drawer-body')?.onscroll?.(), 500);
    if (expanded && group === 'root') window.setTimeout(() => body.onscroll?.(), 700);
  }

  function hydrateDrawerImages(panel) {
    panel?.querySelectorAll('img[data-src]').forEach(image => {
      if (image.closest('[inert]')) return;
      image.src = image.dataset.src;
      image.removeAttribute('data-src');
    });
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
    drawerAutoPauseUntil = performance.now() + 650;
    const body = document.querySelector('.drawer-body');
    state.drawerPreviousHtml = snapshotDrawerPanel();
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
    drawerAutoPauseUntil = performance.now() + 650;
    const previous = state.drawerHistory.pop() || { level: 'root', id: null };
    state.drawerPreviousHtml = snapshotDrawerPanel();
    state.drawerPreviousScroll = (document.querySelector('.drawer-body')?.scrollTop || 0) - (previous.scrollTop || 0);
    state.drawerDirection = 'back';
    state.drawerLevel = previous.level;
    state.drawerId = previous.id;
    state.drawerCategory = previous.category || null;
    render();
    document.querySelector('.drawer-body').scrollTop = previous.scrollTop || 0;
    (document.getElementById('drawer-view-title') || document.getElementById('mobile-drawer'))?.focus({ preventScroll: true });
  }

  function animateChevronAndNavigate(button, callback) {
    if (state.drawerBusy || button.classList.contains('is-navigating')) return;
    state.drawerBusy = true;
    button.classList.add('is-navigating');
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 150;
    window.setTimeout(() => { if (state.drawerOpen) callback(); }, delay);
  }

  function animateBackAndNavigate(button) {
    if (state.drawerBusy) return;
    state.drawerBusy = true;
    button.classList.add('is-tap-feedback');
    // A neutral touch highlight belongs to the whole target, never to a
    // rotating back arrow. Keep its leftward direction completely stable.
    setTimeout(() => { if (state.drawerOpen) navigateDrawerBack(); }, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 130);
  }

  function snapshotDrawerPanel() {
    const snapshot = document.querySelector('.drawer-panel--current').cloneNode(true);
    // Hidden descendants are irrelevant to an exit animation. Do not duplicate
    // hundreds of offscreen options/images into another composited layer.
    snapshot.querySelectorAll('[inert], .drawer-sticky-category').forEach(element => element.remove());
    return snapshot.innerHTML;
  }

  function clearDrawerAnimationArtifacts() {
    clearTimeout(drawerAnimationTimer);
    if (!state.drawerPreviousHtml) return;
    const panel = document.querySelector('.drawer-panel--current');
    const finish = () => {
      clearTimeout(drawerAnimationTimer);
      panel?.removeEventListener('animationend', onAnimationEnd);
      state.drawerPreviousHtml = '';
      document.querySelector('.drawer-panel--previous')?.remove();
      document.querySelector('.drawer-track')?.classList.remove('drawer-track--forward', 'drawer-track--back');
      state.drawerBusy = false;
    };
    const onAnimationEnd = event => {
      if (event.target === panel) finish();
    };
    panel?.addEventListener('animationend', onAnimationEnd);
    // Release navigation as soon as the slide ends, with a fallback for a
    // cancelled animation or browsers using reduced motion.
    drawerAnimationTimer = setTimeout(finish, window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450);
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
    document.body.classList.toggle('is-locked', state.drawerOpen || state.regionalizationOpen || accountOpen);
    const main = document.getElementById('conteudo');
    const siteHeader = document.getElementById('site-header');
    const pageBlocked = state.drawerOpen || state.regionalizationOpen || accountOpen;
    if ('inert' in main) {
      main.inert = pageBlocked;
      siteHeader.inert = pageBlocked;
      menuRoot.inert = state.regionalizationOpen || accountOpen;
      regionalizationRoot.inert = accountOpen;
      accountRoot.inert = state.regionalizationOpen;
    }
  }

  function assetImg(group, id) { return `<img src="${data.assetRegistry[group][id]}" alt="">`; }
  function capitalize(value) { return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-pending-link]')) event.preventDefault();
  });

  document.addEventListener('keydown', event => {
    if (accountOpen) {
      const dialog = accountRoot.querySelector('.account-dialog');
      if (event.key === 'Escape') { event.preventDefault(); closeAccount(); return; }
      if (event.key === 'Tab' && dialog) {
        const focusable = [...dialog.querySelectorAll('button, a[href]')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first?.focus(); }
      }
      return;
    }
    if (state.regionalizationOpen) {
      const dialog = document.querySelector('.regionalization-dialog');
      if (event.key === 'Escape') { event.preventDefault(); closeRegionalization(); return; }
      if (event.key === 'Tab' && dialog) {
        const focusable = [...dialog.querySelectorAll('button:not([disabled]):not([hidden]), input, [href], [tabindex="0"]')].filter(element => element.getClientRects().length);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      return;
    }
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
    if ((state.desktopSearchOpen || state.searchOpen) && !event.target.closest('[data-desktop-search], .mobile-search-row, .search-dropdown, [data-toggle-search]')) scheduleSearchClose();
    if (desktopQuery.matches && state.desktopMenu && !event.target.closest('.desktop-nav, [data-desktop-menu-surface]')) closeDesktopMenu();
  });
  desktopQuery.addEventListener('change', () => { clearTimeout(desktopOpenTimer); cancelDesktopClose(); state.desktopMenu = null; state.drawerOpen = false; state.desktopSearchOpen = false; state.searchOpen = false; state.searchDropdown = false; render(); });
  window.visualViewport?.addEventListener('resize', syncSearchViewport);
  window.visualViewport?.addEventListener('scroll', syncSearchViewport);
  window.addEventListener('resize', syncSearchViewport);

  const params = new URLSearchParams(location.search);
  state.loggedIn = params.get('logged') !== '0';
  state.regionalized = params.get('regionalized') === '1';
  state.regionalizationOpen = params.get('regionalization') !== 'closed';
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
  if (state.regionalizationOpen) requestAnimationFrame(focusRegionalization);
})();
