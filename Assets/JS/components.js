/**
 * Global variable to simplify the manipulation of query string parameters
 */
const queryStringParams = new URLSearchParams(window.location.search);

/**
 * Replaces the content of a given element with the passed html parameter.
 * @param {string} html - The content that will replace the element's inner html
 * @param {string} id - The id used to search for the element in the document
 */
function replaceInnerHtml(html, id) {
  const div = document.getElementById(id);
  if (div && html !== undefined) div.innerHTML = html;
}

/**
 * Global variable for media matches
 */
const MOBILE = window.matchMedia("(min-width: 0px) and (max-width: 991px)");
const DESKTOP = window.matchMedia("(min-width: 992px)");

/**
 * Defer background images
 */
function parseReais(text) {
  const clean = text
    .trim()
    .replace(/R\$\s*/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
}

const EMPIRIA_SPOT_B_CLASS = "empiria-ab-spot-b";

function isEmpiriaSpotB() {
  return document.documentElement.classList.contains(EMPIRIA_SPOT_B_CLASS);
}

function logEmpiriaSpotVariant() {
  try {
    if (!isEmpiriaSpotB() || window.__empiriaSpotBLogged) return;
    window.__empiriaSpotBLogged = true;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "empiria_ab_view",
      empiria_experiment: "spot_plp_vitrine",
      empiria_variant: "B",
    });
  } catch (e) {}
}

function initEmpiriaSpotAb() {
  try {
    logEmpiriaSpotVariant();
    const observer = new MutationObserver(() => logEmpiriaSpotVariant());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  } catch (e) {}
}

function processSpotPrice(spotPrice) {
  if (spotPrice.closest(".spot-ab")) return;

  const spotContent = spotPrice.closest(".spot__content");
  const platformDiscount = spotContent?.querySelector(":scope > .discount");
  if (platformDiscount) platformDiscount.remove();

  if (spotPrice.querySelector(".discount")) return;

  const precoDeEl = spotPrice.querySelector(".precoDe s");
  const precoPorEl = spotPrice.querySelector(".precoPor > span");
  if (!precoDeEl || !precoPorEl) return;

  const listPrice = parseReais(precoDeEl.textContent);
  const currentPrice = parseReais(precoPorEl.textContent);
  if (listPrice === null || currentPrice === null || listPrice <= currentPrice)
    return;

  const savings = (listPrice - currentPrice).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const discountEl = document.createElement("div");
  discountEl.className = "discount";
  discountEl.innerHTML = `Economize: <span class="discount__value">${savings}</span>`;
  spotPrice.insertBefore(discountEl, spotPrice.firstChild);
}

function moveSpotDiscounts() {
  document.querySelectorAll(".spot .spot-price").forEach(processSpotPrice);
}

function formatCountdownNumber(value) {
  return String(value).padStart(2, "0");
}

function getEndOfCurrentDay(now) {
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
    999,
  );
}

const HOME_WEEKLY_OFFERS_CYCLE_DAYS = 7;
const HOME_WEEKLY_OFFERS_CYCLE_MS =
  HOME_WEEKLY_OFFERS_CYCLE_DAYS * 24 * 60 * 60 * 1000;
const HOME_INFO_ROTATOR_INTERVAL_MS = 2800;
const HOME_INFO_ROTATOR_TRANSITION_MS = 650;
// Ajuste esta ancora caso o reset semanal precise acontecer em outro dia/hora.
const HOME_WEEKLY_OFFERS_ANCHOR = new Date(2026, 6, 27, 0, 0, 0, 0);

let dailyHomeOffersCountdownTimerId = null;
let weeklyHomeOffersCountdownTimerId = null;

function runWhenBrowserIsIdle(callback, timeout = 1200) {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(callback, { timeout });
    return;
  }

  window.setTimeout(callback, 250);
}

function getNextWeeklyOffersReset(now) {
  const anchorTime = HOME_WEEKLY_OFFERS_ANCHOR.getTime();
  const nowTime = now.getTime();

  if (nowTime < anchorTime) {
    return new Date(anchorTime);
  }

  const cyclesElapsed = Math.floor(
    (nowTime - anchorTime) / HOME_WEEKLY_OFFERS_CYCLE_MS,
  );

  return new Date(
    anchorTime + (cyclesElapsed + 1) * HOME_WEEKLY_OFFERS_CYCLE_MS,
  );
}

function renderDailyHomeOffersCountdown(root, now) {
  if (!root) return;
  const hours = root.querySelector("[data-home-daily-offers-hours]");
  const minutes = root.querySelector("[data-home-daily-offers-minutes]");
  const seconds = root.querySelector("[data-home-daily-offers-seconds]");
  if (!hours || !minutes || !seconds) return;

  const target = getEndOfCurrentDay(now);
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const countdownHours = Math.floor(totalSeconds / 3600);
  const countdownMinutes = Math.floor((totalSeconds % 3600) / 60);
  const countdownSeconds = totalSeconds % 60;

  hours.textContent = formatCountdownNumber(countdownHours);
  minutes.textContent = formatCountdownNumber(countdownMinutes);
  seconds.textContent = formatCountdownNumber(countdownSeconds);
}

function updateDailyHomeOffersCountdowns() {
  const countdownRoots = document.querySelectorAll(
    ".home-offers-banner:not([hidden]) [data-home-daily-offers-countdown]",
  );
  if (!countdownRoots.length) return;

  const now = new Date();
  countdownRoots.forEach((countdownRoot) =>
    renderDailyHomeOffersCountdown(countdownRoot, now),
  );
}

function scheduleDailyHomeOffersCountdownTick() {
  updateDailyHomeOffersCountdowns();
  const delay = 1000 - (Date.now() % 1000);
  dailyHomeOffersCountdownTimerId = window.setTimeout(
    scheduleDailyHomeOffersCountdownTick,
    delay,
  );
}

function initDailyHomeOffersCountdown() {
  if (dailyHomeOffersCountdownTimerId !== null) return;
  if (
    !document.querySelector(
      ".home-offers-banner:not([hidden]) [data-home-daily-offers-countdown]",
    )
  ) {
    return;
  }
  scheduleDailyHomeOffersCountdownTick();
}

function syncDailyHomeOffersLayout() {
  const section = document.querySelector(".home-offers-banner:not([hidden])");
  const wrapper = section?.querySelector(
    ".home-offers-banner__carousel .swiper-wrapper",
  );
  if (!section || !wrapper) return;

  const productCount = Array.from(wrapper.children).filter((slide) =>
    slide.classList.contains("swiper-slide"),
  ).length;

  if (!productCount) {
    delete section.dataset.homeOffersVisible;
    return;
  }

  section.dataset.homeOffersVisible = String(Math.min(productCount, 3));
}

function renderWeeklyHomeOffersCountdown(root, now) {
  if (!root) return;
  const days = root.querySelector("[data-home-weekly-days]");
  const hours = root.querySelector("[data-home-weekly-hours]");
  const minutes = root.querySelector("[data-home-weekly-minutes]");
  const seconds = root.querySelector("[data-home-weekly-seconds]");
  if (!days || !hours || !minutes || !seconds) return;

  const target = getNextWeeklyOffersReset(now);
  const diffMs = Math.max(0, target.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const countdownDays = Math.floor(totalSeconds / 86400);
  const countdownHours = Math.floor((totalSeconds % 86400) / 3600);
  const countdownMinutes = Math.floor((totalSeconds % 3600) / 60);
  const countdownSeconds = totalSeconds % 60;

  days.textContent = `${countdownDays}D`;
  hours.textContent = formatCountdownNumber(countdownHours);
  minutes.textContent = formatCountdownNumber(countdownMinutes);
  seconds.textContent = formatCountdownNumber(countdownSeconds);
}

function updateWeeklyHomeOffersCountdowns() {
  const countdownRoots = document.querySelectorAll("[data-home-weekly-countdown]");
  if (!countdownRoots.length) return;

  const now = new Date();
  countdownRoots.forEach((countdownRoot) =>
    renderWeeklyHomeOffersCountdown(countdownRoot, now),
  );
}

function scheduleWeeklyHomeOffersCountdownTick() {
  updateWeeklyHomeOffersCountdowns();
  const delay = 1000 - (Date.now() % 1000);
  weeklyHomeOffersCountdownTimerId = window.setTimeout(
    scheduleWeeklyHomeOffersCountdownTick,
    delay,
  );
}

function initWeeklyHomeOffersCountdown() {
  if (weeklyHomeOffersCountdownTimerId !== null) return;
  if (!document.querySelector("[data-home-weekly-countdown]")) return;
  scheduleWeeklyHomeOffersCountdownTick();
}

function syncHomeInfoRotatorHeight(rotator) {
  const track = rotator?.querySelector("[data-home-info-track]");
  const currentIndex = Number(rotator?.dataset.currentIndex || 0);
  const currentItem =
    track?.children[Math.max(currentIndex, 0)] ||
    track?.querySelector("[data-home-info-item]");
  if (!currentItem) return;

  const itemHeight = currentItem.offsetHeight;
  rotator.style.setProperty("--home-info-bar-item-height", `${itemHeight}px`);
}

function initHomeInfoRotator() {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  document.querySelectorAll("[data-home-info-rotator]").forEach((rotator) => {
    const track = rotator.querySelector("[data-home-info-track]");
    const items = Array.from(
      track?.querySelectorAll("[data-home-info-item]") || [],
    );

    if (!track || !items.length) return;

    if (rotator.dataset.rotatorInitialized === "true") {
      syncHomeInfoRotatorHeight(rotator);
      return;
    }

    rotator.dataset.rotatorInitialized = "true";
    rotator.dataset.currentIndex = "0";
    syncHomeInfoRotatorHeight(rotator);

    const applyTransform = (index, instant = false) => {
      const itemHeight =
        items[Math.min(index, items.length - 1)]?.offsetHeight ||
        items[0].offsetHeight;

      rotator.style.setProperty(
        "--home-info-bar-item-height",
        `${itemHeight}px`,
      );
      track.style.transition = instant
        ? "none"
        : `transform ${HOME_INFO_ROTATOR_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      track.style.transform = `translate3d(0, -${index * itemHeight}px, 0)`;
      rotator.dataset.currentIndex = String(index);

      if (instant) {
        track.offsetHeight;
      }
    };

    const handleResize = () => {
      const currentIndex = Number(rotator.dataset.currentIndex || 0);
      applyTransform(currentIndex, true);
      if (rotator.dataset.rotatorStatic !== "true") {
        track.style.transition = `transform ${HOME_INFO_ROTATOR_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
      }
    };

    window.addEventListener("resize", handleResize);

    if (items.length <= 1 || prefersReducedMotion) {
      rotator.dataset.rotatorStatic = "true";
      rotator.classList.add("home-info-bar__rotator--static");
      return;
    }

    const firstItemClone = items[0].cloneNode(true);
    firstItemClone.classList.add("home-info-bar__item--clone");
    firstItemClone.setAttribute("aria-hidden", "true");
    track.appendChild(firstItemClone);

    let currentIndex = 0;

    const scheduleNextStep = () => {
      const timerId = window.setTimeout(() => {
        currentIndex += 1;
        applyTransform(currentIndex);

        if (currentIndex === items.length) {
          window.setTimeout(() => {
            currentIndex = 0;
            applyTransform(currentIndex, true);
            track.style.transition = `transform ${HOME_INFO_ROTATOR_TRANSITION_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          }, HOME_INFO_ROTATOR_TRANSITION_MS + 30);
        }

        scheduleNextStep();
      }, HOME_INFO_ROTATOR_INTERVAL_MS);

      rotator.dataset.rotatorTimerId = String(timerId);
    };

    scheduleNextStep();
  });
}

function initHomeInfoBarSticky() {
  const body = document.body;
  const infoBar = body.classList.contains("home")
    ? document.querySelector(".home .home-info-bar")
    : null;

  if (!infoBar || infoBar.dataset.stickyInitialized === "true") {
    return;
  }

  infoBar.dataset.stickyInitialized = "true";

  const header = document.querySelector("body.home > header");

  if (!header) {
    return;
  }

  let rafId = null;

  const updateStickyState = () => {
    const headerRect = header.getBoundingClientRect();
    const headerBottom = Math.max(0, Math.round(headerRect.bottom));
    const infoBarRect = infoBar.getBoundingClientRect();
    const isSticky =
      infoBarRect.top <= headerBottom + 1 && infoBarRect.bottom > headerBottom;

    body.style.setProperty(
      "--home-info-bar-sticky-offset",
      `${headerBottom}px`,
    );
    body.classList.toggle("home-info-bar-is-sticky", isSticky);
  };

  const scheduleStickyStateUpdate = () => {
    if (rafId !== null) {
      return;
    }

    rafId = window.requestAnimationFrame(() => {
      rafId = null;
      updateStickyState();
    });
  };

  updateStickyState();

  window.addEventListener("scroll", scheduleStickyStateUpdate, {
    passive: true,
  });
  window.addEventListener("resize", scheduleStickyStateUpdate);

  if (typeof ResizeObserver !== "undefined") {
    const stickyResizeObserver = new ResizeObserver(scheduleStickyStateUpdate);
    stickyResizeObserver.observe(header);
    stickyResizeObserver.observe(infoBar);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const noBgImg = document.getElementById("no-bg-img");
  if (noBgImg) noBgImg.remove();
  initEmpiriaSpotAb();
  moveSpotDiscounts();
  initHomeInfoRotator();
  const observer = new MutationObserver(() => moveSpotDiscounts());
  observer.observe(document.body, { childList: true, subtree: true });
});

/**
 * Change header class on scroll
 */
const body = document.body;
const footer = document.querySelector("footer");

function setScroll(scrollTop, lastScrollTop) {
  if (scrollTop <= 0) {
    body.classList.add("scroll-up");
    body.classList.remove("scroll-down");
    body.classList.add("on-top");
  } else {
    if (body.classList.contains("on-top")) {
      body.classList.remove("on-top");
    }
    if (scrollTop > lastScrollTop) {
      body.classList.add("scroll-down");
      body.classList.remove("scroll-up");
    } else {
      body.classList.add("scroll-up");
      body.classList.remove("scroll-down");
    }
  }
}

function setFloatingNavMobile(
  scrollTop,
  offsetToShowMobileNav,
  offsetToHideMobileNav,
) {
  if (scrollTop > offsetToShowMobileNav) {
    body.classList.add("show-mobile-nav");
  } else {
    body.classList.remove("show-mobile-nav");
  }
}

window.addEventListener("load", () => {
  var lastScrollTop = -1;

  const offsetToShowMobileNav = 200;
  const offsetBottom = 200;

  window.addEventListener("scroll", function () {
    const newSt = window.pageYOffset;

    setScroll(newSt, lastScrollTop);

    if (MOBILE.matches) {
      setFloatingNavMobile(newSt, offsetToShowMobileNav, offsetBottom);
    }

    lastScrollTop = newSt;
  });
});

function toggleSlide(elem) {
  if (!elem.style.height) {
    elem.style.height = `${elem.scrollHeight}px`;
  } else {
    elem.style.height = ``;
  }
}

function toggleNextSibling(button) {
  var optionListEl = button.nextElementSibling;
  toggleSlide(optionListEl);
  button.classList.toggle("open");
}

var toggle = function (elem) {
  // If the element is visible, hide it
  if (window.getComputedStyle(elem).display === "block") {
    elem.style.display = "none";
    return;
  }
  // Otherwise, show it
  elem.style.display = "block";
};

/**
 * Floating Whatsapp
 */

document.getElementById("whatsapp")?.addEventListener("click", function () {
  setTimeout(function () {
    dataLayer.push({
      event: "whatsapp",
    });
    // fbq('track', 'Contact');

    const url =
      "https://api.whatsapp.com/send?phone=553192490299&text=%5BABCZAP%5D%20Ol%C3%A1!%20Acessei%20o%20site%20da%20ABC%20da%20Constru%C3%A7%C3%A3o%20e%20gostaria%20de%20informa%C3%A7%C3%B5es";

    if (DESKTOP.matches) {
      window.open(url, "_blank");
    } else {
      window.location.href = url;
    }
  }, 500);
});

function scrollElement(target, button) {
  window.scrollTo(0, Position(target));
  togglePickUp(button);
}

function Position(obj) {
  var currenttop = 0;
  if (obj.offsetParent) {
    do {
      currenttop += obj.offsetTop - 144;
    } while ((obj = obj.offsetParent));
    return [currenttop];
  }
}

function jump(id) {
  var headerHeight = document
    .querySelector("header")
    .getBoundingClientRect().height;
  var top = document.getElementById(id).offsetTop;
  window.scrollTo(0, top - headerHeight);
}

function accordion(button) {
  event.preventDefault();
  button.classList.toggle("active");
  var panel = button.nextElementSibling;
  if (panel.style.maxHeight) {
    panel.style.maxHeight = null;
  } else {
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
}
// temporario pra garantir nao usar "regional_offers"
(() => {
  if (getCookie("sf_regional_cep")) {
    document.cookie =
      "sf_regional_cep=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const isDesktop = window.matchMedia("(min-width: 768px)").matches;
  const isMobile = window.matchMedia("(max-width: 767px)").matches;

  if (isMobile) {
    const fullbannerDesktop = document.querySelector(".fullbanner.desktop");
    const navbarCollapse = document.querySelector(".navbar__collapse.desktop");
    if (fullbannerDesktop) {
      fullbannerDesktop.remove();
    }
    if (navbarCollapse) {
      navbarCollapse.remove();
    }
  }

  let deferredDynamicSectionsScheduled = false;

  const initCriticalDynamicSections = () => {
    initSwipers();
    initHomeInfoRotator();
    initHomeInfoBarSticky();
    initDailyHomeOffersCountdown();
    initWeeklyHomeOffersCountdown();
    syncDailyHomeOffersLayout();
  };

  const runDeferredDynamicSections = () => {
    ensureNativeCarouselObserver();
    initCarrosselArrastoNativo();
    reorderHomepageSections();
    replaceRulerIcons();
    updateRulerTexts();
  };

  const scheduleDeferredDynamicSections = () => {
    if (deferredDynamicSectionsScheduled) {
      return;
    }

    deferredDynamicSectionsScheduled = true;
    runWhenBrowserIsIdle(() => {
      deferredDynamicSectionsScheduled = false;
      runDeferredDynamicSections();
    }, 1500);
  };

  const refreshDynamicSections = ({ deferNonCritical = true } = {}) => {
    initCriticalDynamicSections();

    if (deferNonCritical) {
      scheduleDeferredDynamicSections();
      return;
    }

    runDeferredDynamicSections();
  };

  function hydrateLazyElement(element) {
    if (!element || element.dataset.lazyHydrated === "true") {
      return;
    }

    const noscriptTag = element.querySelector("noscript");

    if (noscriptTag) {
      element.innerHTML = noscriptTag.innerHTML;
    }

    element.dataset.lazyHydrated = "true";
    refreshDynamicSections();
    window.dispatchEvent(
      new CustomEvent("lazyContentHydrated", {
        detail: { element },
      }),
    );
  }

  function observeLazySections() {
    const eagerElements = Array.from(
      document.querySelectorAll("[data-lazy='false']"),
    ).filter((element) => element.dataset.lazyHydrated !== "true");

    eagerElements.forEach(hydrateLazyElement);

    const lazyElements = Array.from(
      document.querySelectorAll("[data-lazy='true']"),
    ).filter((element) => element.dataset.lazyHydrated !== "true");

    if (!lazyElements.length) {
      return;
    }

    if (!("IntersectionObserver" in window)) {
      lazyElements.forEach(hydrateLazyElement);
      return;
    }

    const lazyObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          hydrateLazyElement(entry.target);
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: isDesktop ? "280px 0px" : "160px 0px",
        // ponytail: threshold 0 — secao com todo o conteudo dentro de <noscript>
        // tem altura 0 e o Chrome reporta intersectionRatio 0, entao 0.01 nunca hidrata
        threshold: 0,
      },
    );

    lazyElements.forEach((element) => lazyObserver.observe(element));
  }

  function replaceRulerItemIcon({
    itemSelector,
    imageSrc,
    imageAlt,
    imageWidth,
    imageHeight,
    imageClass,
    wrapperClass,
  }) {
    const rulerItem = document.querySelector(itemSelector);
    const iconWrapper = rulerItem?.querySelector(".ruler__text-wrapper");
    const svgIcon = iconWrapper?.querySelector("svg");
    if (!iconWrapper || !svgIcon) return;

    const iconImage = document.createElement("img");
    iconImage.src = imageSrc;
    iconImage.alt = imageAlt;
    if (Number.isFinite(imageWidth)) {
      iconImage.width = imageWidth;
    }
    if (Number.isFinite(imageHeight)) {
      iconImage.height = imageHeight;
    }
    iconImage.loading = "lazy";
    iconImage.decoding = "async";
    iconImage.className = imageClass;

    iconWrapper.classList.add(wrapperClass);
    svgIcon.replaceWith(iconImage);
  }

  function updateRulerItemText(itemSelector, text) {
    const rulerItem = document.querySelector(itemSelector);
    const textElement = rulerItem?.querySelector(".ruler__text");
    if (!textElement) return;

    const textAnchor = textElement.querySelector("a");
    if (textAnchor) {
      textAnchor.textContent = text;
      return;
    }

    textElement.textContent = text;
  }

  function updateRulerItemHtml(itemSelector, htmlContent) {
    const rulerItem = document.querySelector(itemSelector);
    const textElement = rulerItem?.querySelector(".ruler__text");
    if (!textElement) return;

    const textAnchor = textElement.querySelector("a");
    if (textAnchor) {
      textAnchor.innerHTML = htmlContent;
      return;
    }

    textElement.innerHTML = htmlContent;
  }

  function replaceRulerIcons() {
    replaceRulerItemIcon({
      itemSelector: ".ruler__list .ruler__item:nth-child(4)",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/sf/img/svg/wpp-abc.svg?theme=main&v=202603120832",
      imageAlt: "Whatsapp",
      imageWidth: 24,
      imageHeight: 24,
      imageClass: "ruler__icon-whatsapp",
      wrapperClass: "ruler__text-wrapper--icon-replaced",
    });

    replaceRulerItemIcon({
      itemSelector: ".ruler__list .ruler__item:nth-child(5)",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/media/encarte-forms.png?v=202603112016",
      imageAlt: "Ofertas lojas físicas",
      imageHeight: 40,
      imageClass: "ruler__icon-store-offers",
      wrapperClass: "ruler__text-wrapper--store-offers-icon-replaced",
    });

    replaceRulerItemIcon({
      itemSelector: ".ruler__list .ruler__item:nth-child(6)",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/media/mini-franquia-abc.png?v=202603112009",
      imageAlt: "Compre online",
      imageHeight: 40,
      imageClass: "ruler__icon-online",
      wrapperClass: "ruler__text-wrapper--online-icon-replaced",
    });

    replaceRulerItemIcon({
      itemSelector: ".ruler__list .ruler__item:nth-child(7)",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/media/payment-pix.png?v=202603112019",
      imageAlt: "Pix",
      imageHeight: 24,
      imageClass: "ruler__icon-pix",
      wrapperClass: "ruler__text-wrapper--pix-icon-replaced",
    });
  }

  function updateRulerTexts() {
    updateRulerItemHtml(
      ".ruler__list .ruler__item:nth-child(5)",
      '<strong>Ofertas Lojas Físicas</strong><span class="ruler__subtitle">mais perto de você</span>',
    );
  }

  function reorderHomepageSections() {
    if (!document.body.classList.contains("home")) return;

    const topContainer = document.querySelector("body.home > .container");
    const opportunitiesSection = topContainer?.querySelector(
      ".banner-oportunidades",
    );
    if (!topContainer || !opportunitiesSection) return;

    const normalizeText = (value) =>
      (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const desktopEnvironments = document.querySelector(
      ".gray-bg.desktop .container > .environments",
    );
    const mobileEnvironments = document.querySelector(
      ".gray-bg.mobile .container > .environments",
    );

    if (mobileEnvironments) {
      mobileEnvironments.classList.add("mobile");
      opportunitiesSection.insertAdjacentElement(
        "afterend",
        mobileEnvironments,
      );
    }

    if (desktopEnvironments) {
      desktopEnvironments.classList.add("desktop");
      opportunitiesSection.insertAdjacentElement(
        "afterend",
        desktopEnvironments,
      );
    }

    const hasTitle = (section, title) =>
      normalizeText(section?.textContent).includes(normalizeText(title));

    const allSections = Array.from(
      document.querySelectorAll("body.home section"),
    );
    const exclusiveSections = allSections.filter((section) =>
      hasTitle(section, "Ofertas exclusivas para voce"),
    );

    const moveAfterEnvironment = (environmentSection, deviceClass) => {
      if (!environmentSection) return;

      const targetSection = exclusiveSections.find((section) =>
        section.classList.contains(deviceClass),
      );
      const fallbackSection = exclusiveSections.find(
        (section) =>
          !section.classList.contains("mobile") &&
          !section.classList.contains("desktop"),
      );

      const sectionToMove = targetSection || fallbackSection;
      if (sectionToMove) {
        environmentSection.insertAdjacentElement("afterend", sectionToMove);
      }
    };

    moveAfterEnvironment(mobileEnvironments, "mobile");
    moveAfterEnvironment(desktopEnvironments, "desktop");
  }

  function initSwiperInstance(swiperElement, options) {
    if (!swiperElement || swiperElement.dataset.swiperInitialized === "true") {
      return;
    }

    new Swiper(swiperElement, options);
    swiperElement.dataset.swiperInitialized = "true";
  }

  function initSwipers() {
    const fullbannerDesktop = document.querySelector(
      ".fullbanner.desktop .swiper",
    );
    if (fullbannerDesktop) {
      const section = fullbannerDesktop.closest(".fullbanner.desktop");
      initSwiperInstance(fullbannerDesktop, {
        loop: true,
        navigation: {
          nextEl: section?.querySelector(".swiper-button-next"),
          prevEl: section?.querySelector(".swiper-button-prev"),
        },
        autoplay: {
          delay: 5000,
        },
      });
    }

    const fullbannerMobile = document.querySelector(
      ".fullbanner.mobile .swiper",
    );
    initSwiperInstance(fullbannerMobile, {
      loop: true,
      autoplay: {
        delay: 5000,
      },
    });

    const opportunitiesMobile = document.querySelector(
      ".banner-oportunidades .mobile .swiper:first-child",
    );
    initSwiperInstance(opportunitiesMobile, {
      spaceBetween: 10,
      slidesPerView: 2.1,
    });

    const bannerGridPrimary = document.querySelector(
      ".banner-grid .swiper:first-child",
    );
    initSwiperInstance(bannerGridPrimary, {
      spaceBetween: 20,
      slidesPerView: 1.2,
      breakpoints: {
        991: {
          slidesPerView: 3,
        },
      },
    });

    const bannerGridSecondary = document.querySelector(
      ".banner-grid div:nth-child(2)",
    );
    initSwiperInstance(bannerGridSecondary, {
      spaceBetween: 20,
      slidesPerView: "auto",
      breakpoints: {
        991: {
          slidesPerView: 2,
        },
      },
    });

    // Variante B do teste A/B dos spots: o Figma pede card de 212px com gap 12.
    // O .swiper tem padding lateral de 15px (bleed), entao a area util num
    // aparelho de 390 e 330. Swiper: slide = (size - gap * (spv - 1)) / spv,
    // logo spv = (330 + 12) / (212 + 12) = 1.527. Sem a classe os carrosseis
    // ficam exatamente como na variante A.
    const spotMobile = document.documentElement.classList.contains(
      "empiria-ab-spot-b",
    )
      ? { slidesPerView: 1.527, spaceBetween: 12 }
      : { slidesPerView: 2.1, spaceBetween: 5 };

    document.querySelectorAll(".showcase-1 .swiper").forEach((showcaseOne) => {
      const section = showcaseOne.closest(".showcase-1");
      initSwiperInstance(showcaseOne, {
        navigation: {
          nextEl: section?.querySelector(".swiper-button-next"),
          prevEl: section?.querySelector(".swiper-button-prev"),
        },
        ...spotMobile,
        breakpoints: {
          768: {
            slidesPerView: 3.1,
            spaceBetween: 5,
          },
          1090: {
            slidesPerView: 6,
            spaceBetween: 16,
          },
        },
      });
    });

    document.querySelectorAll(".showcase-2 .swiper").forEach((showcaseTwo) => {
      const section = showcaseTwo.closest(".showcase-2");
      initSwiperInstance(showcaseTwo, {
        navigation: {
          nextEl: section?.querySelector(".swiper-button-next"),
          prevEl: section?.querySelector(".swiper-button-prev"),
        },
        ...spotMobile,
        breakpoints: {
          768: {
            slidesPerView: 3.1,
          },
          991: {
            slidesPerView: 4,
            spaceBetween: 20,
          },
          1090: {
            slidesPerView: 6,
            spaceBetween: 16,
          },
        },
      });
    });

    const homeOffersSection = document.querySelector(
      ".home-offers-banner:not([hidden])",
    );
    const homeOffersSwiper = homeOffersSection?.querySelector(
      ".home-offers-banner__carousel .swiper",
    );
    if (homeOffersSwiper) {
      const section = homeOffersSwiper.closest(".home-offers-banner__carousel");
      initSwiperInstance(homeOffersSwiper, {
        navigation: {
          nextEl: section?.querySelector(".swiper-button-next"),
          prevEl: section?.querySelector(".swiper-button-prev"),
        },
        ...spotMobile,
        watchOverflow: true,
        breakpoints: {
          768: {
            slidesPerView: 3.1,
            spaceBetween: 5,
          },
          980: {
            slidesPerView: "auto",
            spaceBetween: 16,
          },
        },
      });
    }

    const bannerCentroDesktop = document.querySelector(
      ".banner-centro.desktop .swiper",
    );
    initSwiperInstance(bannerCentroDesktop, {
      spaceBetween: 20,
      slidesPerView: 3,
    });

    const brandsSwiper = document.querySelector(".brands .swiper");
    if (brandsSwiper) {
      const section = brandsSwiper.closest(".brands");
      initSwiperInstance(brandsSwiper, {
        slidesPerView: 2,
        navigation: {
          nextEl: section?.querySelector(".swiper-button-next"),
          prevEl: section?.querySelector(".swiper-button-prev"),
        },
        autoplay: {
          delay: 3000,
        },
        breakpoints: {
          991: {
            spaceBetween: 20,
            slidesPerView: 7,
          },
        },
      });
    }

    document.querySelectorAll(".stores .swiper").forEach((storesSwiper) => {
      const section = storesSwiper.closest(".stores");
      initSwiperInstance(storesSwiper, {
        navigation: {
          nextEl: section?.querySelector(".swiper-button-next"),
          prevEl: section?.querySelector(".swiper-button-prev"),
        },
        spaceBetween: 10,
        slidesPerView: "auto",
        speed: 450,
        grabCursor: true,
        watchOverflow: true,
        resistanceRatio: 0.65,
        breakpoints: {
          991: {
            spaceBetween: 20,
            slidesPerView: 6.2,
          },
        },
      });
    });

    if (MOBILE.matches) {
      const blogSwiper = document.querySelector(".blog .swiper");
      initSwiperInstance(blogSwiper, {
        slidesPerView: "auto",
        spaceBetween: 20,
      });
    }

    const instagramSwiper = document.querySelector(".banner-instagram .swiper");
    initSwiperInstance(instagramSwiper, {
      spaceBetween: 10,
      slidesPerView: "auto",
      breakpoints: {
        991: {
          spaceBetween: 25,
          slidesPerView: 5,
        },
      },
    });

    const relatedProductsSwiper = document.querySelector(
      ".related-products .swiper",
    );
    if (relatedProductsSwiper) {
      const section = relatedProductsSwiper.closest(".related-products");
      initSwiperInstance(relatedProductsSwiper, {
        navigation: {
          nextEl: section?.querySelector(".swiper-button-next"),
          prevEl: section?.querySelector(".swiper-button-prev"),
        },
        ...spotMobile,
        breakpoints: {
          768: {
            slidesPerView: 3.1,
          },
          991: {
            spaceBetween: 20,
            slidesPerView: 4,
          },
          1090: {
            spaceBetween: 16,
            slidesPerView: 6,
          },
        },
      });
    }
  }

  function injetarSetasCarrosselCatalogo(hostNav, viewport) {
    if (!hostNav || !viewport) return;
    if (!hostNav.querySelector(".swiper-button-prev")) {
      var btnPrev = document.createElement("button");
      btnPrev.type = "button";
      btnPrev.className = "swiper-button-prev carrossel-seta-nativa";
      btnPrev.setAttribute("aria-label", "Anterior");
      hostNav.appendChild(btnPrev);
    }
    if (!hostNav.querySelector(".swiper-button-next")) {
      var btnNext = document.createElement("button");
      btnNext.type = "button";
      btnNext.className = "swiper-button-next carrossel-seta-nativa";
      btnNext.setAttribute("aria-label", "Próximo");
      hostNav.appendChild(btnNext);
    }
    [".swiper-button-prev", ".swiper-button-next"].forEach(function (sel) {
      var b = hostNav.querySelector(sel);
      if (!b) return;
      b.classList.add("carrossel-seta-nativa");
      while (b.firstChild) {
        b.removeChild(b.firstChild);
      }
    });
  }

  function alinharSetasCarrosselAoCentroImagem(
    hostNav,
    viewport,
    prevBtn,
    nextBtn,
  ) {
    if (!hostNav || !viewport || !prevBtn || !nextBtn) return;
    if (!window.matchMedia("(min-width: 992px)").matches) {
      prevBtn.style.removeProperty("top");
      nextBtn.style.removeProperty("top");
      return;
    }
    var slide = viewport.querySelector(".swiper-slide");
    if (!slide) return;
    var alvo =
      slide.querySelector(
        ".subcategories__img, .subTopo__img, .environments__img, .departments__icon",
      ) ||
      slide.querySelector("img") ||
      slide;
    var navRect = hostNav.getBoundingClientRect();
    var alvoRect = alvo.getBoundingClientRect();
    if (navRect.height < 1) return;
    var centroY = alvoRect.top + alvoRect.height / 2 - navRect.top;
    if (!isFinite(centroY)) return;
    prevBtn.style.top = centroY + "px";
    nextBtn.style.top = centroY + "px";
  }

  function initCarrosselArrastoNativo() {
    if (!initCarrosselArrastoNativo._resizeNav) {
      initCarrosselArrastoNativo._resizeNav = true;
      var carrosselResizeNavT;
      window.addEventListener("resize", function () {
        clearTimeout(carrosselResizeNavT);
        carrosselResizeNavT = setTimeout(function () {
          document
            .querySelectorAll("[data-carrossel-arrasto='1']")
            .forEach(function (vp) {
              if (typeof vp._carrosselNavAtualizar === "function") {
                vp._carrosselNavAtualizar();
              }
            });
        }, 120);
      });
    }
    var seletores = [
      ".departments .swiper",
      ".environments .swiper",
      ".subcategories .swiper",
      ".subTopo .swiper",
      ".swiper:has(.swiper-slide.subcategories__item)",
      ".swiper:has(.swiper-slide.subTopo__item)",
    ];
    seletores.forEach(function (sel) {
      var nodes;
      try {
        nodes = document.querySelectorAll(sel);
      } catch (errSel) {
        return;
      }
      nodes.forEach(function (viewport) {
        if (!viewport || viewport.dataset.carrosselArrasto === "1") return;
        var wrapper = viewport.querySelector(".swiper-wrapper");
        if (!wrapper) return;
        viewport.dataset.carrosselArrasto = "1";
        viewport.classList.add("swiper-initialized");
        var hostNav =
          viewport.closest(".swiper-container") || viewport.parentElement;
        injetarSetasCarrosselCatalogo(hostNav, viewport);
        var prevBtn = hostNav.querySelector(".swiper-button-prev");
        var nextBtn = hostNav.querySelector(".swiper-button-next");
        var navRoot = hostNav;
        function atualizarSetasOverflowNav() {
          var mqDesk = window.matchMedia("(min-width: 992px)");
          var isHomeSubcategories =
            document.body.classList.contains("home") &&
            !!viewport.closest(".subcategories, .subTopo");
          if (!navRoot) return;
          if (!mqDesk.matches) {
            navRoot.classList.remove("carrossel-arrasto-nativo--overflow");
            navRoot.classList.remove("carrossel-arrasto-nativo--centered");
            wrapper.style.marginLeft = "0";
            wrapper.style.marginRight = "0";
            if (prevBtn) prevBtn.style.removeProperty("top");
            if (nextBtn) nextBtn.style.removeProperty("top");
            return;
          }
          var tol = 3;
          var precisa = viewport.scrollWidth > viewport.clientWidth + tol;
          navRoot.classList.toggle(
            "carrossel-arrasto-nativo--overflow",
            precisa,
          );
          navRoot.classList.toggle(
            "carrossel-arrasto-nativo--centered",
            isHomeSubcategories && !precisa,
          );
          if (isHomeSubcategories && !precisa) {
            wrapper.style.marginLeft = "auto";
            wrapper.style.marginRight = "auto";
            viewport.scrollLeft = 0;
          } else {
            wrapper.style.marginLeft = "0";
            wrapper.style.marginRight = "0";
          }
          alinharSetasCarrosselAoCentroImagem(
            hostNav,
            viewport,
            prevBtn,
            nextBtn,
          );
        }
        if (navRoot) {
          navRoot.classList.add("carrossel-arrasto-nativo");
        }
        viewport._carrosselNavAtualizar = atualizarSetasOverflowNav;
        atualizarSetasOverflowNav();
        requestAnimationFrame(function () {
          requestAnimationFrame(atualizarSetasOverflowNav);
        });
        if (typeof ResizeObserver !== "undefined") {
          var roNav = new ResizeObserver(function () {
            atualizarSetasOverflowNav();
          });
          roNav.observe(viewport);
          roNav.observe(wrapper);
          roNav.observe(hostNav);
        }
        wrapper.querySelectorAll("img").forEach(function (imagem) {
          imagem.draggable = false;
          if (!imagem.complete) {
            imagem.addEventListener("load", atualizarSetasOverflowNav, {
              once: true,
            });
          }
        });
        Object.assign(wrapper.style, {
          display: "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          gap: "16px",
          width: "max-content",
          margin: "0",
          padding: "0",
          transform: "none",
          transition: "none",
        });
        wrapper.querySelectorAll(".swiper-slide").forEach(function (slide) {
          slide.style.flexShrink = "0";
          slide.style.marginLeft = "0";
          slide.style.marginRight = "0";
        });
        var dragging = false;
        var pointerId = null;
        var lastX = 0;
        var totalMove = 0;
        var dragThreshold = 8;
        var blockLinkClick = false;
        var hasPointerCapture = false;
        function onPointerDown(e) {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          var t = e.target;
          if (t.closest(".swiper-button-prev, .swiper-button-next")) return;
          if (t.closest("button, input, select, textarea, [role='button']"))
            return;
          pointerId = e.pointerId;
          lastX = e.clientX;
          totalMove = 0;
          dragging = false;
          blockLinkClick = false;
          hasPointerCapture = false;
        }
        function onPointerMove(e) {
          if (pointerId === null || e.pointerId !== pointerId) return;
          var dx = e.clientX - lastX;
          lastX = e.clientX;
          totalMove += Math.abs(dx);
          if (!dragging && totalMove >= dragThreshold) {
            dragging = true;
            blockLinkClick = true;
            if (!hasPointerCapture) {
              try {
                viewport.setPointerCapture(e.pointerId);
                hasPointerCapture = true;
              } catch (err) {}
            }
          }
          if (!dragging) return;
          e.preventDefault();
          viewport.scrollLeft -= dx;
        }
        function endDrag(e) {
          if (pointerId === null) return;
          if (pointerId !== null && e.pointerId !== pointerId) return;
          var pid = pointerId;
          dragging = false;
          pointerId = null;
          if (pid !== null && hasPointerCapture) {
            try {
              viewport.releasePointerCapture(pid);
            } catch (err2) {}
          }
          hasPointerCapture = false;
        }
        viewport.addEventListener("pointerdown", onPointerDown);
        viewport.addEventListener("pointermove", onPointerMove, {
          passive: false,
        });
        viewport.addEventListener("pointerup", endDrag);
        viewport.addEventListener("pointercancel", endDrag);
        viewport.addEventListener("pointerleave", function (e) {
          if (e.pointerType === "mouse") endDrag(e);
        });
        viewport.addEventListener(
          "click",
          function (e) {
            if (!blockLinkClick) return;
            var link = e.target.closest("a, button");
            if (link) {
              e.preventDefault();
              e.stopPropagation();
            }
            blockLinkClick = false;
          },
          true,
        );
        function scrollStep(dir) {
          var amount = Math.max(120, viewport.clientWidth * 0.72) * dir;
          viewport.scrollBy({ left: amount, behavior: "smooth" });
        }
        if (prevBtn) {
          prevBtn.addEventListener("click", function (ev) {
            ev.preventDefault();
            scrollStep(-1);
          });
        }
        if (nextBtn) {
          nextBtn.addEventListener("click", function (ev) {
            ev.preventDefault();
            scrollStep(1);
          });
        }
        viewport.addEventListener(
          "wheel",
          function (ev) {
            var dx = ev.deltaX;
            var dy = ev.deltaY;
            if (Math.abs(dy) > Math.abs(dx) && !ev.shiftKey) return;
            var delta = dx !== 0 ? dx : ev.shiftKey ? dy : 0;
            if (delta === 0) return;
            viewport.scrollLeft += delta;
            ev.preventDefault();
          },
          { passive: false },
        );
      });
    });
  }

  function ensureNativeCarouselObserver() {
    if (ensureNativeCarouselObserver._initialized) {
      return;
    }

    ensureNativeCarouselObserver._initialized = true;

    var carrosselArrastoMoTimer;
    var carrosselArrastoMo = new MutationObserver(function () {
      clearTimeout(carrosselArrastoMoTimer);
      carrosselArrastoMoTimer = setTimeout(function () {
        initCarrosselArrastoNativo();
        document
          .querySelectorAll("[data-carrossel-arrasto='1']")
          .forEach(function (vp) {
            if (typeof vp._carrosselNavAtualizar === "function") {
              vp._carrosselNavAtualizar();
            }
          });
      }, 120);
    });

    carrosselArrastoMo.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  refreshDynamicSections({ deferNonCritical: true });
  observeLazySections();
});

/**
 * Popup functions for Guide Shop information
 */
function openPopUp() {
  document.querySelector(".guide-popUp-info").classList.add("active");
  document.querySelector(".overlay").classList.add("active");
}

function closePopUp() {
  document.querySelector(".guide-popUp-info").classList.remove("active");
  document.querySelector(".overlay").classList.remove("active");
}
