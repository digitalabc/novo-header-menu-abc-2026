/*
 * Shared presentation behavior for campaign landing pages.
 * Each page supplies its own selectors through window.LandingPageConfig before
 * this file is loaded; this module never imports another LP's script.
 */
const landingPageConfig = window.LandingPageConfig || {};
const stockBadgeSelector = landingPageConfig.stockBadgeSelector || ".showcase-oferta-relampago .oferta-relampago__sold, .section-super-chance-unica__featured .oferta-relampago__sold";
const discountSelector = landingPageConfig.discountSelector || ".lp-ofertas-mensais .spot-price .discount, .semana-do-consumidor .spot-price .discount, .section-super-chance-unica__featured .spot-price .discount";
const promotionSpotSelector = landingPageConfig.promotionSpotSelector || ".showcase-oferta-relampago .spot, .section-super-chance-unica__featured .spot";
const featuredCarouselSelector = landingPageConfig.featuredCarouselSelector || null;
const featuredSlidesPerView = Object.assign({
  768: 2,
  992: 2,
  1090: 2,
  1200: 2,
}, landingPageConfig.featuredSlidesPerView);
const carouselSelectors = landingPageConfig.carouselSelectors || [];

function resolveCountdownTarget(rawDate) {
  const parsedDate = rawDate ? new Date(rawDate) : null;

  if (parsedDate && !Number.isNaN(parsedDate.getTime())) {
    return parsedDate;
  }

  return new Date();
}

function resolveDailySpotTarget() {
  const targetDate = new Date();
  targetDate.setHours(23, 59, 59, 999);
  return targetDate;
}

function resolveSpotCountdownTarget(countdownRoot, campaignTargetDate) {
  const spotTargetMode = countdownRoot.getAttribute("data-spot-countdown-target");

  if (spotTargetMode === "campaign") {
    return campaignTargetDate;
  }

  return resolveDailySpotTarget();
}

function getCountdownParts(targetDate) {
  const distance = Math.max(targetDate.getTime() - Date.now(), 0);
  const totalSeconds = Math.floor(distance / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    distance,
    days,
    hours,
    minutes,
    seconds,
  };
}

function formatUnit(value) {
  return String(value).padStart(2, "0");
}

function renderCountdownNode(node, countdownParts) {
  const days = node.querySelector(".cronometro__days");
  const hours = node.querySelector(".cronometro__hours");
  const minutes = node.querySelector(".cronometro__minutes");
  const seconds = node.querySelector(".cronometro__seconds");

  if (days) days.textContent = formatUnit(countdownParts.days);
  if (hours) hours.textContent = formatUnit(countdownParts.hours);
  if (minutes) minutes.textContent = formatUnit(countdownParts.minutes);
  if (seconds) seconds.textContent = formatUnit(countdownParts.seconds);
}

function renderStickyCampaignCountdown(root, countdownParts) {
  const hours = root.querySelector("[data-sticky-campaign-hours]");
  const minutes = root.querySelector("[data-sticky-campaign-minutes]");
  const seconds = root.querySelector("[data-sticky-campaign-seconds]");

  if (!hours || !minutes || !seconds) {
    return;
  }

  const totalHours = Math.floor(countdownParts.distance / 3600000);

  hours.textContent = String(totalHours).padStart(2, "0");
  minutes.textContent = formatUnit(countdownParts.minutes);
  seconds.textContent = formatUnit(countdownParts.seconds);
}

function getStockBadgeState(stock, available) {
  const getStockProgress = function (value) {
    if (!available || value <= 0) {
      return 0;
    }

    return Math.max(12, Math.min(100, Math.round((Math.min(value, 30) * 100) / 30)));
  };

  if (!available || stock <= 0) {
    return {
      label: "Estoque indisponível",
      progress: 0,
      tone: "is-unavailable",
      animated: false,
    };
  }

  if (stock <= 4) {
    return {
      label: `Últimas ${stock} unidades`,
      progress: getStockProgress(stock),
      tone: "is-critical",
      animated: true,
      prefix: "Últimas ",
      suffix: stock === 1 ? " unidade" : " unidades",
      count: stock,
    };
  }

  if (stock <= 10) {
    return {
      label: `Estoque baixo: ${stock} un.`,
      progress: getStockProgress(stock),
      tone: "is-low",
      animated: true,
      prefix: "Estoque baixo: ",
      suffix: " un.",
      count: stock,
    };
  }

  if (stock <= 20) {
    return {
      label: "Disponibilidade limitada",
      progress: getStockProgress(stock),
      tone: "is-limited",
      animated: false,
    };
  }

  return {
    label: "Estoque disponível",
    progress: getStockProgress(stock),
    tone: "is-available",
    animated: false,
  };
}

function animateAvailableStockCounter(counterNode, finalValue, available) {
  if (!counterNode) {
    return;
  }

  const badgeState = getStockBadgeState(finalValue, available);

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !badgeState.animated) {
    counterNode.textContent = badgeState.label;
    return;
  }

  const duration = 550;
  const startTime = performance.now();

  const step = function (currentTime) {
    const elapsed = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    const currentValue = Math.max(1, Math.round(badgeState.count * eased));

    counterNode.textContent = `${badgeState.prefix}${currentValue}${badgeState.suffix}`;

    if (elapsed < 1) {
      window.requestAnimationFrame(step);
      return;
    }

    counterNode.textContent = badgeState.label;
  };

  window.requestAnimationFrame(step);
}

function getCompactStockLabel(tone) {
  switch (tone) {
    case "is-critical":
      return "Últimas";
    case "is-low":
      return "Baixo";
    case "is-limited":
      return "Limitado";
    case "is-available":
      return "Disponível";
    default:
      return "Indisponível";
  }
}

function syncMobileStockBadgeLabels() {
  const isMobile = window.innerWidth <= 767;

  document.querySelectorAll(stockBadgeSelector).forEach(function (badgeNode) {
    const textNode = badgeNode.querySelector(".oferta-relampago__sold-text");

    if (!textNode) {
      return;
    }

    if (!textNode.dataset.fullLabel) {
      textNode.dataset.fullLabel = textNode.textContent.trim();
    }

    if (!textNode.dataset.mobileLabel) {
      const toneClass = Array.from(badgeNode.classList).find(function (className) {
        return className.indexOf("is-") === 0;
      });

      textNode.dataset.mobileLabel = getCompactStockLabel(toneClass);
    }

    textNode.textContent = isMobile ? textNode.dataset.mobileLabel : textNode.dataset.fullLabel;
  });
}

function normalizeSavingsLabels() {
  document.querySelectorAll(discountSelector).forEach(function (discountNode) {
    const valueNode = discountNode.querySelector(".discount__value");

    if (!valueNode) {
      return;
    }

    discountNode.innerHTML = `Economize: <span class="discount__value">${valueNode.textContent}</span>`;
  });
}

function buildSpotCountdownMarkup() {
  return `
    <div class="cronometro cronometro--spot oferta-relampago__spot-countdown">
      <span class="cronometro__label">Desconto termina em</span>
      <div class="cron">
        <div class="cron__item">
          <span class="cronometro__days">00</span>
          <small>D</small>
        </div>
        <div class="cron__item">
          <span class="cronometro__hours">00</span>
          <small>H</small>
        </div>
        <div class="cron__item">
          <span class="cronometro__minutes">00</span>
          <small>M</small>
        </div>
        <div class="cron__item">
          <span class="cronometro__seconds">00</span>
          <small>S</small>
        </div>
      </div>
    </div>
  `;
}

function buildRotatingBadgeMarkup() {
  return `
    <div class="oferta-relampago__badge-rotativo" aria-live="polite">
      <span class="oferta-relampago__badge-rotativo-text">Oferta em destaque hoje</span>
    </div>
  `;
}

function startRotatingBadges() {
  const messages = [
    "Oferta em destaque hoje",
    "Condição especial da campanha",
    "Oportunidade por tempo limitado",
    "Seleção da Semana do Consumidor",
  ];
  const badges = Array.from(document.querySelectorAll(".oferta-relampago__badge-rotativo"));

  if (!badges.length) {
    return;
  }

  badges.forEach(function (badge, index) {
    const textNode = badge.querySelector(".oferta-relampago__badge-rotativo-text");

    if (!textNode) {
      return;
    }

    const currentIndex = index % messages.length;
    badge.dataset.messageIndex = String(currentIndex);
    textNode.textContent = messages[currentIndex];
  });

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  window.setInterval(function () {
    if (document.hidden) {
      return;
    }

    badges.forEach(function (badge) {
      const textNode = badge.querySelector(".oferta-relampago__badge-rotativo-text");

      if (!textNode) {
        return;
      }

      const currentIndex = Number(badge.dataset.messageIndex || 0);
      const nextIndex = (currentIndex + 1) % messages.length;

      badge.dataset.messageIndex = String(nextIndex);
      badge.classList.remove("is-entering");
      void badge.offsetWidth;
      textNode.textContent = messages[nextIndex];
      badge.classList.add("is-entering");
    });
  }, 3200);
}

function mountPromotionOverlays() {
  document.querySelectorAll(promotionSpotSelector).forEach(function (spot, index) {
    const stockInput = document.querySelector(`#promotion-stock-${index}`);
    const availableInput = document.querySelector(`#promotion-available-${index}`);
    const spotImage = spot.querySelector(".spot__image");

    if (!spotImage || spot.querySelector(".oferta-relampago__spot-footer")) {
      return;
    }

    const parsedStock = Number(stockInput && stockInput.value);
    const available = !availableInput || availableInput.value !== "false";
    const stock = Number.isFinite(parsedStock) ? Math.max(0, Math.round(parsedStock)) : 0;
    const badgeState = getStockBadgeState(stock, available);
    const overlay = document.createElement("div");

    overlay.className = "oferta-relampago__spot-footer";
    overlay.innerHTML = `
      <div class="oferta-relampago__sold ${badgeState.tone}" aria-hidden="true">
        <span class="oferta-relampago__sold-progress" style="width:${badgeState.progress}%"></span>
        <span class="oferta-relampago__sold-text" data-stock="${stock}" data-full-label="${badgeState.label}" data-mobile-label="${getCompactStockLabel(badgeState.tone)}">${badgeState.animated ? `${badgeState.prefix}0${badgeState.suffix}` : badgeState.label}</span>
      </div>
      ${buildSpotCountdownMarkup()}
    `;

    spot.insertBefore(overlay, spotImage);
    animateAvailableStockCounter(overlay.querySelector(".oferta-relampago__sold-text"), stock, available);
  });

  syncSpotFooterPosition();
  syncMobileStockBadgeLabels();
}

function syncSpotFooterPosition() {
  const isMobile = window.innerWidth <= 767;

  document.querySelectorAll(promotionSpotSelector).forEach(function (spot) {
    const overlay = spot.querySelector(".oferta-relampago__spot-footer");
    const spotImage = spot.querySelector(".spot__image");
    const spotContent = spot.querySelector(".spot__content");
    const spotTitle = spot.querySelector(".spot__content-title");

    if (!overlay || !spotImage || !spotContent || !spotTitle) {
      return;
    }

    if (isMobile) {
      spotContent.insertBefore(overlay, spotTitle.nextSibling);
      return;
    }

    spot.insertBefore(overlay, spotImage);
  });
}

function startCountdown() {
  const countdownRoot = document.getElementById("cronometro");

  if (!countdownRoot) {
    return;
  }

  const campaignTargetDate = resolveCountdownTarget(countdownRoot.getAttribute("data-promotion"));
  const spotTargetDate = resolveSpotCountdownTarget(countdownRoot, campaignTargetDate);
  const note = countdownRoot.querySelector(".cronometro__note");
  const heroSubtitle = document.querySelector(".showcase__subtitle--hero");
  let timerId = null;

  if (heroSubtitle) {
    heroSubtitle.textContent = "Aproveite condições especiais para renovar seus ambientes com mais economia durante a campanha.";
  }

  if (note) {
    note.textContent = "Preços e estoque sujeitos à atualização durante a campanha.";
  }

  const originalNote = note ? note.textContent : "";

  const tick = function () {
    const campaignCountdownParts = getCountdownParts(campaignTargetDate);
    const spotCountdownParts = getCountdownParts(spotTargetDate);
    const spotCountdownNodes = Array.from(document.querySelectorAll(".cronometro--spot"));

    renderCountdownNode(countdownRoot, campaignCountdownParts);

    spotCountdownNodes.forEach(function (node) {
      renderCountdownNode(node, spotCountdownParts);
    });

    if (note) {
      note.textContent = campaignCountdownParts.distance > 0
        ? originalNote
        : "Oferta encerrada. Esta vitrine pode receber novas condições a qualquer momento.";
    }

    if (campaignCountdownParts.distance <= 0 && spotCountdownParts.distance <= 0 && timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = function () {
    if (timerId) {
      return;
    }

    tick();
    timerId = window.setInterval(tick, 1000);
  };

  const stopTimer = function () {
    if (!timerId) {
      return;
    }

    clearInterval(timerId);
    timerId = null;
  };

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopTimer();
      return;
    }

    startTimer();
  });

  startTimer();
}

function startStickyCampaignCountdown() {
  const stickyCountdownRoot = document.querySelector("[data-sticky-campaign-countdown]");

  if (!stickyCountdownRoot) {
    return;
  }

  const campaignTargetDate = resolveCountdownTarget(stickyCountdownRoot.getAttribute("data-promotion"));
  let timerId = null;

  const tick = function () {
    const countdownParts = getCountdownParts(campaignTargetDate);

    renderStickyCampaignCountdown(stickyCountdownRoot, countdownParts);

    if (countdownParts.distance <= 0 && timerId) {
      clearInterval(timerId);
      timerId = null;
    }
  };

  const startTimer = function () {
    if (timerId) {
      return;
    }

    tick();
    timerId = window.setInterval(tick, 1000);
  };

  const stopTimer = function () {
    if (!timerId) {
      return;
    }

    clearInterval(timerId);
    timerId = null;
  };

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      stopTimer();
      return;
    }

    startTimer();
  });

  startTimer();
}

function initSwiperIfNeeded(selector, options) {
  const swiperElement = document.querySelector(`${selector} .swiper`);

  if (!swiperElement) {
    return null;
  }

  const existingInstance = swiperElement.swiper;

  if (existingInstance && swiperElement.dataset.lpSwiperManaged === "true") {
    syncCenteredCarouselState(existingInstance);
    existingInstance.update();
    return existingInstance;
  }

  if (existingInstance) {
    const nextParams = Object.assign({}, options);
    delete nextParams.on;

    existingInstance.params = Object.assign(existingInstance.params, nextParams);
    existingInstance.originalParams = Object.assign(existingInstance.originalParams || {}, nextParams);

    if (options.navigation) {
      existingInstance.params.navigation = Object.assign(
        {},
        existingInstance.params.navigation || {},
        options.navigation
      );
      existingInstance.originalParams.navigation = Object.assign(
        {},
        existingInstance.originalParams.navigation || {},
        options.navigation
      );
    }

    if (existingInstance.navigation) {
      existingInstance.navigation.destroy();
      existingInstance.navigation.init();
      existingInstance.navigation.update();
    }

    existingInstance.update();
    swiperElement.dataset.lpSwiperManaged = "true";
    syncCenteredCarouselState(existingInstance);
    return existingInstance;
  }

  const instance = new Swiper(swiperElement, options);
  swiperElement.dataset.lpSwiperManaged = "true";
  return instance;
}

function syncCenteredCarouselState(swiper) {
  if (!swiper || !swiper.el) {
    return;
  }

  const slideCount = swiper.slides ? swiper.slides.length : 0;
  const slidesPerView = Number(swiper.params && swiper.params.slidesPerView) || 1;
  const hasManyProducts = slideCount > Math.floor(slidesPerView);
  const shouldCenter = slideCount > 0 && !hasManyProducts;

  swiper.el.classList.toggle("is-centered-products", shouldCenter);
  swiper.el.classList.toggle("has-many-products", hasManyProducts);

  if (shouldCenter) {
    swiper.slideTo(0, 0, false);
    if (swiper.wrapperEl) {
      swiper.wrapperEl.style.transform = "translate3d(0px, 0px, 0px)";
    }
  }
}

function buildCarouselOptions(selector) {
  const isFeaturedCarousel = selector === featuredCarouselSelector;

  return {
    navigation: {
      nextEl: `${selector} .swiper-button-next`,
      prevEl: `${selector} .swiper-button-prev`,
    },
    watchOverflow: true,
    centerInsufficientSlides: true,
    centeredSlides: true,
    centeredSlidesBounds: true,
    slidesPerView: 1.45,
    spaceBetween: 14,
    on: {
      init: syncCenteredCarouselState,
      resize: syncCenteredCarouselState,
      update: syncCenteredCarouselState,
      breakpoint: syncCenteredCarouselState,
    },
    breakpoints: {
      768: {
        centeredSlides: false,
        centeredSlidesBounds: false,
        slidesPerView: isFeaturedCarousel ? featuredSlidesPerView[768] : 3.1,
        spaceBetween: 12,
      },
      992: {
        centeredSlides: false,
        centeredSlidesBounds: false,
        slidesPerView: isFeaturedCarousel ? featuredSlidesPerView[992] : 4,
        spaceBetween: 18,
      },
      1090: {
        centeredSlides: false,
        centeredSlidesBounds: false,
        slidesPerView: isFeaturedCarousel ? featuredSlidesPerView[1090] : 5,
        spaceBetween: 16,
      },
      1200: {
        centeredSlides: false,
        centeredSlidesBounds: false,
        slidesPerView: isFeaturedCarousel ? featuredSlidesPerView[1200] : 5,
        spaceBetween: 20,
      },
    },
  };
}

function initDeferredSwipers(selectors) {
  const pendingSelectors = selectors.filter(function (selector) {
    const swiperElement = document.querySelector(`${selector} .swiper`);
    return swiperElement && swiperElement.dataset.lpSwiperManaged !== "true";
  });

  if (!pendingSelectors.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    pendingSelectors.forEach(function (selector) {
      initSwiperIfNeeded(selector, buildCarouselOptions(selector));
    });
    return;
  }

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) {
        return;
      }

      const selector = entry.target.getAttribute("data-swiper-selector");

      if (selector) {
        initSwiperIfNeeded(selector, buildCarouselOptions(selector));
      }

      observer.unobserve(entry.target);
    });
  }, {
    rootMargin: "900px 0px",
    threshold: 0.01,
  });

  pendingSelectors.forEach(function (selector) {
    const carouselRoot = document.querySelector(selector);

    if (!carouselRoot) {
      return;
    }

    carouselRoot.setAttribute("data-swiper-selector", selector);
    observer.observe(carouselRoot);
  });

}

function initLandingSwipers() {
  if (featuredCarouselSelector) {
    initSwiperIfNeeded(featuredCarouselSelector, buildCarouselOptions(featuredCarouselSelector));
  }
}

function revealFeaturedCarouselWhenStable() {
  if (!featuredCarouselSelector) {
    return;
  }

  const carouselRoot = document.querySelector(featuredCarouselSelector);
  const swiperElement = carouselRoot && carouselRoot.querySelector(".swiper");

  if (!carouselRoot || !swiperElement || carouselRoot.dataset.featuredCarouselReady === "true") {
    return;
  }

  let revealed = false;
  const reveal = function () {
    if (revealed) {
      return;
    }

    revealed = true;
    const swiper = swiperElement.swiper;

    if (swiper) {
      swiper.update();
      syncCenteredCarouselState(swiper);
    }

    carouselRoot.dataset.featuredCarouselReady = "true";
    carouselRoot.classList.add("is-ready");
  };

  const pendingImages = Array.from(swiperElement.querySelectorAll("img")).filter(function (image) {
    return !image.complete;
  });

  if (!pendingImages.length) {
    scheduleAfterPaint(reveal);
    return;
  }

  let loadedImages = 0;
  const handleImage = function () {
    loadedImages += 1;

    if (loadedImages === pendingImages.length) {
      scheduleAfterPaint(reveal);
    }
  };

  pendingImages.forEach(function (image) {
    image.addEventListener("load", handleImage, { once: true });
    image.addEventListener("error", handleImage, { once: true });
  });

  window.setTimeout(reveal, 1800);
}

function initAllShowcaseSwipers() {
  carouselSelectors.forEach(function (selector) {
    initSwiperIfNeeded(selector, buildCarouselOptions(selector));
  });
}

function initBannerSwipers() {
  initSwiperIfNeeded(".fullbanner.desktop", {
    navigation: {
      nextEl: ".fullbanner.desktop .swiper-button-next",
      prevEl: ".fullbanner.desktop .swiper-button-prev",
    },
    loop: true,
    autoplay: {
      delay: 3200,
      disableOnInteraction: false,
    },
  });

  initSwiperIfNeeded(".fullbanner.mobile", {
    loop: true,
    autoplay: {
      delay: 3200,
      disableOnInteraction: false,
    },
  });
}

function scheduleAfterPaint(callback) {
  window.requestAnimationFrame(function () {
    window.requestAnimationFrame(callback);
  });
}

function scheduleWhenIdle(callback, timeout) {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: timeout || 1200 });
    return;
  }

  window.setTimeout(callback, timeout || 180);
}

document.addEventListener("DOMContentLoaded", function () {
  normalizeSavingsLabels();
  mountPromotionOverlays();
  initAllShowcaseSwipers();
  revealFeaturedCarouselWhenStable();
  startCountdown();
  startStickyCampaignCountdown();

  window.requestAnimationFrame(function () {
    normalizeSavingsLabels();
    syncMobileStockBadgeLabels();
  });

  scheduleAfterPaint(function () {
    initBannerSwipers();
  });

  window.addEventListener("resize", function () {
    syncSpotFooterPosition();
    syncMobileStockBadgeLabels();
  }, { passive: true });
});
