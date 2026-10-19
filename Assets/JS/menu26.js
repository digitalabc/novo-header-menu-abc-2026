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
  const hoverDelays = {
    nav: 110,
    department: 200,
    environment: 180
  };
  let openTimer = 0;
  let closeTimer = 0;
  let drawerCloseTimer = 0;

  const all = (selector, scope) => Array.from((scope || root).querySelectorAll(selector));

  // ---------------------------------------------------------------------------------------- abrir / fechar
  function closeNav() {
    all('.desktop-nav .m26-peer:checked').forEach(input => { input.checked = false; });
  }

  function closeDrawer(animated) {
    const drawer = document.getElementById('m26-drawer');
    const layer = root.querySelector('.drawer-layer');
    if (!drawer || !drawer.checked) return;
    clearTimeout(drawerCloseTimer);
    if (!animated || !layer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      drawer.checked = false;
      if (layer) layer.classList.remove('is-closing');
      return;
    }
    layer.classList.add('is-closing');
    drawerCloseTimer = window.setTimeout(() => {
      drawer.checked = false;
      layer.classList.remove('is-closing');
    }, 280);
  }

  function closeAll() {
    closeNav();
    closeDrawer(true);
    toggleIds.filter(id => id !== 'm26-drawer').forEach(id => {
      const input = document.getElementById(id);
      if (input) input.checked = false;
    });
  }

  function syncAccordionStates() {
    all('[data-m26-acc]').forEach(trigger => {
      const input = trigger.control;
      const expanded = Boolean(input && input.checked);
      trigger.setAttribute('aria-expanded', String(expanded));
      const accordion = trigger.closest('.drawer-accordion');
      if (accordion) accordion.classList.toggle('is-expanded', expanded);
    });
  }

  function hoverDelay(label) {
    if (label.classList.contains('department-link')) return hoverDelays.department;
    if (label.classList.contains('environment-link')) return hoverDelays.environment;
    return hoverDelays.nav;
  }

  function openOnHover(event) {
    if (!desktopQuery.matches || !hoverQuery.matches) return;
    const label = event.target.closest('[data-m26-hover]');
    if (!label || !label.control) {
      // passou por um item sem painel (ex.: link direto): fecha o que estiver aberto
      if (event.target.closest('.nav-li') && !event.target.closest('.mega-menu')) scheduleClose();
      return;
    }
    if (label.contains(event.relatedTarget) || label.control.checked) return;
    clearTimeout(closeTimer);
    clearTimeout(openTimer);
    const input = label.control;
    // Um pequeno hover intent evita trocas acidentais ao atravessar o trilho rumo ao painel.
    openTimer = setTimeout(() => {
      openTimer = 0;
      if (!input.checked && label.matches(':hover')) input.checked = true;
    }, hoverDelay(label));
  }

  function cancelHoverOpen(event) {
    const label = event.target.closest('[data-m26-hover]');
    if (!label || label.contains(event.relatedTarget)) return;
    clearTimeout(openTimer);
    openTimer = 0;
  }

  function scheduleClose() {
    clearTimeout(openTimer);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(closeNav, 200);
  }

  function bindOpening() {
    root.addEventListener('mouseover', openOnHover);
    root.addEventListener('mouseout', cancelHoverOpen);
    root.addEventListener('change', event => {
      if (event.target.matches('.drawer-accordion > .m26-peer')) syncAccordionStates();
    });
    const nav = root.querySelector('.desktop-nav');
    if (nav) {
      nav.addEventListener('mouseenter', () => clearTimeout(closeTimer));
      nav.addEventListener('mouseleave', () => { if (desktopQuery.matches && hoverQuery.matches) scheduleClose(); });
    }

    root.addEventListener('click', event => {
      const drawerToggle = event.target.closest('label[for="m26-drawer"]');
      const drawer = document.getElementById('m26-drawer');
      if (drawerToggle && drawer?.checked) {
        event.preventDefault();
        closeDrawer(true);
        return;
      }
      if (event.target.closest('label[for="m26-drawer"], .drawer-menu-section')) {
        closeSearchExperience(true);
      }
      if (event.target.closest('.search-toggle, .search__toggle')) {
        document.body.classList.remove('m26-floating-search-open');
      }
      // acordeão do drawer: clicar no aberto recolhe
      const trigger = event.target.closest('[data-m26-acc]');
      if (trigger && trigger.control && trigger.control.checked) {
        event.preventDefault();
        trigger.control.checked = false;
        syncAccordionStates();
      }
    });

    // rótulos com role="button" também respondem a Enter/Espaço
    root.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const label = event.target.closest('label[role="button"]');
      if (label && label === event.target) {
        event.preventDefault();
        label.click();
          label.focus({ preventScroll: true });
      }
    });

    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeAll(); });
    document.addEventListener('click', event => {
      if (!event.target.closest('.desktop-nav')) closeNav();
    });

    // trocar de breakpoint com o drawer aberto não deixa a página travada
    const onChange = () => {
      const drawer = document.getElementById('m26-drawer');
      const layer = root.querySelector('.drawer-layer');
      clearTimeout(drawerCloseTimer);
      if (drawer) drawer.checked = false;
      if (layer) layer.classList.remove('is-closing');
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onChange);
    else if (desktopQuery.addListener) desktopQuery.addListener(onChange);

    // voltar do histórico não pode reabrir painéis/gaveta
    window.addEventListener('pageshow', event => {
      if (event.persisted) {
        all('.m26-peer:checked').forEach(input => { input.checked = false; });
        syncAccordionStates();
      }
    });

    syncAccordionStates();
  }

  function bindDrawerSticky() {
    const body = root.querySelector('.drawer-body');
    const panel = body && body.querySelector('.drawer-panel--current');
    const sticky = root.querySelector('.drawer-sticky-category');
    if (!body || !panel || !sticky) return;

    const stickyButton = sticky.querySelector('[data-collapse-visible-category]');
    const stickyIcon = sticky.querySelector('[data-sticky-category-icon]');
    const stickyFallback = sticky.querySelector('[data-sticky-category-fallback-icon]');
    const stickyEnvironment = sticky.querySelector('.drawer-sticky-environment');
    const stickyEnvironmentImage = sticky.querySelector('[data-sticky-environment-image]');
    const stickyEnvironmentLabel = sticky.querySelector('[data-sticky-environment-label]');
    let collapseTrigger = null;
    let frame = 0;

    const nextContentAnchor = element => {
      let cursor = element;
      while (cursor && cursor !== panel) {
        if (cursor.nextElementSibling) return cursor.nextElementSibling;
        cursor = cursor.parentElement;
      }
      return null;
    };

    const resetEnvironment = () => {
      stickyEnvironment.hidden = true;
      panel.querySelectorAll('.drawer-accordion--environment.is-sticky-cloned').forEach(accordion => {
        accordion.classList.remove('is-sticky-cloned');
      });
    };

    const update = () => {
      frame = 0;
      const edge = body.getBoundingClientRect().top;
      let activeTrigger = null;

      // Ao sair completamente de um ambiente aberto, recolhe sem deslocar o conteúdo
      // que o cliente já está visualizando abaixo dele.
      panel.querySelectorAll('.drawer-accordion--environment.is-expanded').forEach(accordion => {
        if (accordion.getBoundingClientRect().bottom > edge + 1) return;
        const input = accordion.querySelector(':scope > .m26-peer');
        if (!input?.checked) return;
        const anchor = nextContentAnchor(accordion);
        const anchorTop = anchor?.getBoundingClientRect().top;
        accordion.classList.add('is-auto-collapsing');
        input.checked = false;
        syncAccordionStates();
        if (anchor && Number.isFinite(anchorTop)) {
          body.scrollTop += anchor.getBoundingClientRect().top - anchorTop;
        }
        requestAnimationFrame(() => accordion.classList.remove('is-auto-collapsing'));
      });

      panel.querySelectorAll('.drawer-accordion.is-expanded').forEach(accordion => {
        const trigger = accordion.querySelector(':scope > .drawer-accordion__trigger');
        if (!trigger || trigger.classList.contains('drawer-accordion__trigger--environment')) return;
        const triggerRect = trigger.getBoundingClientRect();
        const accordionRect = accordion.getBoundingClientRect();
        if (triggerRect.bottom <= edge + 1 && accordionRect.bottom > edge + 72) activeTrigger = trigger;
      });

      sticky.hidden = !activeTrigger;
      if (!activeTrigger) {
        collapseTrigger = null;
        resetEnvironment();
        return;
      }

      collapseTrigger = activeTrigger;
      const label = activeTrigger.querySelector(':scope > span:not(.nav-chevron):not(.drawer-accordion__collapse):not(.menu-hamburger)')?.textContent?.trim() || 'Categoria';
      const icon = activeTrigger.querySelector(':scope > img');
      const iconSource = icon?.currentSrc || icon?.getAttribute('src') || '';
      sticky.querySelector('[data-sticky-category-label]').textContent = label;
      stickyButton.setAttribute('aria-label', 'Recolher ' + label);
      stickyIcon.hidden = !iconSource;
      if (iconSource) stickyIcon.src = iconSource;
      else stickyIcon.removeAttribute('src');
      stickyFallback.hidden = Boolean(iconSource) || !activeTrigger.querySelector(':scope > .menu-hamburger');

      const categoryAccordion = activeTrigger.closest('.drawer-accordion');
      const environmentTrigger = Array.from(categoryAccordion.querySelectorAll('.drawer-accordion--environment.is-expanded > .drawer-accordion__trigger--environment')).find(trigger => {
        const section = trigger.closest('.drawer-accordion--environment');
        const photoHeight = parseFloat(getComputedStyle(stickyEnvironment).height) || 160;
        return trigger.getBoundingClientRect().top <= edge + 73 && section.getBoundingClientRect().bottom > edge + 72 + photoHeight;
      });

      resetEnvironment();
      if (!environmentTrigger) return;
      const environmentAccordion = environmentTrigger.closest('.drawer-accordion--environment');
      const environmentCard = environmentTrigger.querySelector('.drawer-environment-card');
      const environmentImage = environmentCard && environmentCard.querySelector('img');
      const environmentLabel = environmentCard && environmentCard.querySelector('strong');
      const environmentSource = environmentImage?.currentSrc || environmentImage?.getAttribute('src') || '';
      environmentAccordion.classList.add('is-sticky-cloned');
      stickyEnvironmentImage.src = environmentSource;
      stickyEnvironmentImage.style.objectPosition = environmentImage ? getComputedStyle(environmentImage).objectPosition : '50% 50%';
      stickyEnvironmentLabel.textContent = environmentLabel?.textContent?.trim() || '';
      stickyEnvironment.hidden = false;
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(update);
    };

    body.addEventListener('scroll', schedule, { passive: true });
    root.addEventListener('change', event => {
      if (!event.target.matches('.drawer-accordion > .m26-peer')) return;
      schedule();
      window.setTimeout(schedule, 480);
    });
    stickyButton.addEventListener('click', () => {
      if (!collapseTrigger?.isConnected) return;
      const collapseTop = Math.max(0, body.scrollTop + collapseTrigger.getBoundingClientRect().top - body.getBoundingClientRect().top - 2);
      sticky.hidden = true;
      resetEnvironment();
      collapseTrigger.click();
      window.setTimeout(() => {
        body.scrollTo({
          top: collapseTop,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
        });
      }, 460);
    });
    schedule();
  }

  // ---------------------------------------------------------------------------------------- busca
  function closeSearchExperience(blurField) {
    document.body.classList.remove('m26-floating-search-open');
    ['m26-dsearch', 'm26-msearch'].forEach(id => {
      const toggle = document.getElementById(id);
      if (toggle) toggle.checked = false;
    });
    all('[data-ac-list]').forEach(list => {
      list.innerHTML = '';
      list.hidden = true;
    });
    if (blurField && root.contains(document.activeElement) && document.activeElement.matches('[data-search-input]')) {
      document.activeElement.blur();
    }
  }

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
        else if (pair[0] === 'm26-msearch') document.body.classList.remove('m26-floating-search-open');
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

  function setToggle(id, checked) {
    const toggle = document.getElementById(id);
    if (!toggle || toggle.checked === checked) return toggle;
    toggle.checked = checked;
    toggle.dispatchEvent(new Event('change', { bubbles: true }));
    return toggle;
  }

  function bindFloatingNavbar() {
    const navbar = document.querySelector('.floating-navbar');
    if (!navbar) return;

    navbar.addEventListener('click', event => {
      const trigger = event.target.closest('[data-m26-floating]');
      if (!trigger) return;
      event.preventDefault();

      const action = trigger.getAttribute('data-m26-floating');
      if (action === 'menu') {
        closeSearchExperience(true);
        setToggle('m26-account', false);
        const layer = root.querySelector('.drawer-layer');
        if (layer) layer.classList.remove('is-closing');
        setToggle('m26-drawer', true);
        return;
      }

      if (action === 'account') {
        closeSearchExperience(true);
        closeDrawer(false);
        setToggle('m26-account', true);
        return;
      }

      if (action === 'search') {
        const searchToggle = document.getElementById('m26-msearch');
        const isOpen = Boolean(searchToggle?.checked && document.body.classList.contains('m26-floating-search-open'));
        if (isOpen) {
          closeSearchExperience(true);
          return;
        }
        closeDrawer(false);
        setToggle('m26-account', false);
        document.body.classList.add('m26-floating-search-open');
        setToggle('m26-msearch', true);
        window.setTimeout(() => document.getElementById('m26-search-mobile')?.focus(), 90);
        return;
      }

      if (action === 'cart') {
        closeSearchExperience(true);
        closeDrawer(false);
        setToggle('m26-account', false);
        if (typeof openOffcanvas === 'function' && document.getElementById('minicart-offcanvas')) {
          openOffcanvas('#minicart-offcanvas');
        } else {
          window.location.href = '/checkout';
        }
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
    document.querySelectorAll('[data-m26-floating-account-label]').forEach(element => {
      element.textContent = user ? (first ? first : 'Conta') : 'Entrar';
    });
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
    window.addEventListener('userChecked', syncUser);
    syncUser();
  }

  if (root) {
    bindOpening();
    bindDrawerSticky();
    all('[data-search-form]').forEach(bindSearchForm);
    bindSearchToggles();
    bindFloatingNavbar();
    bindStore();
  }
})();
