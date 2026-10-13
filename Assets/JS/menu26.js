/**
 * Menu 2026 (Components/navbar.html).
 * O menu já vem pronto no HTML e abre/fecha em CSS puro (<input class="m26-peer"> + irmãos, ver
 * Assets/CSS/menu26_theme.css). Este arquivo só ajuda a ABRIR o menu (hover, Esc, clique fora, teclado)
 * e liga o que é da loja: busca com sugestões, carrinho, login e pop-up de CEP.
 */
// O bundle da Wake concatena os arquivos só com quebra de linha: esta instrução evita que
// "})()" + "(function" vire uma chamada encadeada.
window.Menu2026Boot = window.Menu2026Boot || {};
(function () {
  'use strict';

  const root = document.querySelector('[data-m26]');
  const desktopQuery = window.matchMedia('(min-width: 900px)');
  const hoverQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const toggleIds = ['m26-drawer', 'm26-account', 'm26-dsearch', 'm26-msearch'];
  let openTimer = 0;
  let closeTimer = 0;

  const all = (selector, scope) => Array.from((scope || root).querySelectorAll(selector));

  // ---------------------------------------------------------------------------------------- abrir / fechar
  function closeNav() {
    all('.desktop-nav .m26-peer:checked').forEach(input => { input.checked = false; });
  }

  function closeAll() {
    closeNav();
    toggleIds.forEach(id => {
      const input = document.getElementById(id);
      if (input) input.checked = false;
    });
  }

  function openOnHover(event) {
    if (!desktopQuery.matches || !hoverQuery.matches) return;
    const label = event.target.closest('[data-m26-hover]');
    if (!label || !label.control) {
      // passou por um item sem painel (ex.: link direto): fecha o que estiver aberto
      if (event.target.closest('.nav-li') && !event.target.closest('.mega-menu')) scheduleClose();
      return;
    }
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    const input = label.control;
    // itens da barra esperam um instante (evita abrir ao passar de raspão); o trilho troca na hora
    const delay = label.classList.contains('nav-item') ? 90 : 0;
    openTimer = setTimeout(() => { if (!input.checked) input.checked = true; }, delay);
  }

  function scheduleClose() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeNav, 200);
  }

  function bindOpening() {
    root.addEventListener('mouseover', openOnHover);
    const nav = root.querySelector('.desktop-nav');
    if (nav) {
      nav.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      nav.addEventListener('mouseleave', () => { if (desktopQuery.matches && hoverQuery.matches) scheduleClose(); });
    }

    root.addEventListener('click', event => {
      // acordeão do drawer: clicar no aberto recolhe
      const trigger = event.target.closest('[data-m26-acc]');
      if (trigger && trigger.control && trigger.control.checked) {
        event.preventDefault();
        trigger.control.checked = false;
      }
    });

    // rótulos com role="button" também respondem a Enter/Espaço
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const label = event.target.closest('label[role="button"]');
      if (label && label === event.target) {
        event.preventDefault();
        label.click();
      }
    });

    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAll(); });
    document.addEventListener('click', event => {
      if (!event.target.closest('.desktop-nav')) closeNav();
    });

    // trocar de breakpoint com o drawer aberto não deixa a página travada
    const onChange = () => { const drawer = document.getElementById('m26-drawer'); if (drawer) drawer.checked = false; };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onChange);
    else if (desktopQuery.addListener) desktopQuery.addListener(onChange);

    // voltar do histórico não pode reabrir painéis/gaveta
    window.addEventListener('pageshow', event => {
      if (event.persisted) all('.m26-peer:checked').forEach(input => { input.checked = false; });
    });
  }

  // ---------------------------------------------------------------------------------------- busca
  function goSearch(term) {
    const value = String(term || '').trim();
    if (value) window.location.href = '/busca?busca=' + encodeURIComponent(value);
  }

  function bindSearchForm(form) {
    const wrap = form.closest('[data-search-wrap]');
    const list = wrap ? wrap.querySelector('[data-ac-list]') : root.querySelector('.search-dropdown[data-ac-list]');
    const input = form.querySelector('[data-search-input]');
    if (!list || !input) return;
    let timer = 0;
    let sequence = 0;
    const clear = () => { list.innerHTML = ''; list.hidden = true; };
    const items = () => Array.from(list.querySelectorAll(':scope > div, :scope > a'));
    const setActive = index => {
      const rows = items();
      rows.forEach(row => row.classList.remove('autocomplete-active'));
      if (!rows.length) return;
      const next = (index + rows.length) % rows.length;
      rows[next].classList.add('autocomplete-active');
      rows[next].scrollIntoView({ block: 'nearest' });
    };
    const decorate = () => {
      const suggestion = list.querySelector(':scope > div');
      const product = list.querySelector(':scope > a');
      if (product) product.insertAdjacentHTML('beforebegin', '<h2 class="m26-ac__title">Produtos</h2>');
      if (suggestion) suggestion.insertAdjacentHTML('beforebegin', '<h2 class="m26-ac__title">Sugestões</h2>');
    };
    const fetchSuggestions = async value => {
      const mine = ++sequence;
      if (!value || typeof client === 'undefined' || !client.snippet) { clear(); return; }
      try {
        const html = await client.snippet.render('autocomplete_snippet.html', 'SnippetQueries/autocomplete.graphql', { query: value });
        if (mine !== sequence || input.value.trim() !== value) return;
        list.innerHTML = String(html || '').trim();
        decorate();
        list.hidden = !list.innerHTML.trim();
      } catch (error) { clear(); }
    };
    form.addEventListener('submit', event => {
      event.preventDefault();
      const active = list.querySelector('.autocomplete-active');
      if (active) active.click();
      else goSearch(input.value);
    });
    input.addEventListener('input', () => {
      clearTimeout(timer);
      const value = input.value.trim();
      if (!value) { sequence++; clear(); return; }
      timer = setTimeout(() => fetchSuggestions(value), 400);
    });
    input.addEventListener('keydown', event => {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const current = items().findIndex(row => row.classList.contains('autocomplete-active'));
        setActive(current + (event.key === 'ArrowDown' ? 1 : -1));
      } else if (event.key === 'Escape' && !list.hidden) {
        clear();
      }
    });
    document.addEventListener('click', event => {
      if (!form.contains(event.target) && !list.contains(event.target)) clear();
    });
  }

  function bindSearchToggles() {
    [['m26-dsearch', 'm26-search-desktop'], ['m26-msearch', 'm26-search-mobile']].forEach(pair => {
      const toggle = document.getElementById(pair[0]);
      const field = document.getElementById(pair[1]);
      if (!toggle || !field) return;
      toggle.addEventListener('change', () => {
        if (toggle.checked) setTimeout(() => field.focus(), 80);
      });
      // busca desktop vazia e sem foco volta a ser só a lupa
      if (pair[0] === 'm26-dsearch') {
        field.addEventListener('blur', () => {
          setTimeout(() => {
            const wrap = field.closest('[data-search-wrap]');
            if (toggle.checked && !field.value.trim() && !(wrap && wrap.contains(document.activeElement))) toggle.checked = false;
          }, 200);
        });
      }
    });
  }

  // ---------------------------------------------------------------------------------------- loja
  function currentReturnUrl() { return encodeURIComponent(window.location.pathname + window.location.search); }

  function syncUser() {
    const user = typeof pageUser !== 'undefined' ? pageUser : null;
    const first = user && user.customerName ? String(user.customerName).trim().split(/\s+/)[0] : '';
    root.setAttribute('data-user', user ? 'in' : 'out');
    const title = user ? (first ? 'Olá, ' + first : 'Olá') : 'Entrar';
    all('[data-account-title]').forEach(element => { element.textContent = title; });
    all('[data-mobile-account-label]').forEach(element => { element.textContent = user ? (first ? 'Olá, ' + first : 'Minha conta') : 'Entrar'; });
    all('.mobile-account').forEach(element => { element.classList.toggle('is-connected', Boolean(user)); });
  }

  function openRegionalization(opener) {
    try {
      const hasModal = document.getElementById('cep-modal') || document.getElementById('dialog_input_cep');
      if (hasModal && typeof window.openInputCepModal === 'function') window.openInputCepModal(true);
      else if (hasModal && window.abcRegionalModal && typeof window.abcRegionalModal.open === 'function') window.abcRegionalModal.open();
      opener.dispatchEvent(new CustomEvent('abc:open-regionalization', { bubbles: true }));
    } catch (error) {
      console.error('[menu26] não foi possível abrir o pop-up de CEP', error);
    }
  }

  function bindStore() {
    all('[data-return-link]').forEach(link => {
      link.setAttribute('href', link.getAttribute('href').replace(/returnUrl=.*$/, 'returnUrl=' + currentReturnUrl()));
    });
    root.addEventListener('click', event => {
      const cart = event.target.closest('[data-open-cart]');
      if (cart && typeof openOffcanvas === 'function' && document.getElementById('minicart-offcanvas')) {
        event.preventDefault();
        openOffcanvas('#minicart-offcanvas');
        return;
      }
      const cep = event.target.closest('[data-open-regionalization]');
      if (cep) { openRegionalization(cep); return; }
      if (event.target.closest('[data-account-signout]')) {
        if (typeof logout === 'function') logout();
        else window.location.href = '/';
      }
    });
    // estado de login: user_login.js (checkUserLogin) preenche `pageUser` e dispara "userChecked"
    document.addEventListener('userChecked', syncUser);
    if (/(?:^|;\s*)sf_customer_access_token=/.test(document.cookie)) root.setAttribute('data-user', 'in');
    else syncUser();
  }

  if (root) {
    bindOpening();
    all('[data-search-form]').forEach(bindSearchForm);
    bindSearchToggles();
    bindStore();
  }
})();
