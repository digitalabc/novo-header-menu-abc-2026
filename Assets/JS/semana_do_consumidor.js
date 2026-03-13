function resolveCountdownTarget(rawDate) {
  const parsedDate = rawDate ? new Date(rawDate) : null;

  if (parsedDate && !Number.isNaN(parsedDate.getTime()) && parsedDate.getTime() > Date.now()) {
    return parsedDate;
  }

  return new Date(Date.now() + 72 * 60 * 60 * 1000);
}

function resolveDailySpotTarget() {
  const targetDate = new Date();
  targetDate.setHours(23, 59, 59, 999);
  return targetDate;
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

function animateSoldCounter(counterNode, finalValue) {
  if (!counterNode) {
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || finalValue <= 0) {
    counterNode.textContent = `${finalValue} vendidos`;
    return;
  }

  const duration = 900;
  const startTime = performance.now();

  const step = function (currentTime) {
    const elapsed = Math.min((currentTime - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - elapsed, 3);
    const currentValue = Math.round(finalValue * eased);

    counterNode.textContent = `${currentValue} vendidos`;

    if (elapsed < 1) {
      window.requestAnimationFrame(step);
    }
  };

  window.requestAnimationFrame(step);
}

function normalizeSavingsLabels() {
  document.querySelectorAll(".semana-do-consumidor .spot-price .discount").forEach(function (discountNode) {
    const valueNode = discountNode.querySelector(".discount__value");

    if (!valueNode) {
      return;
    }

    discountNode.innerHTML = `Você economiza: <span class="discount__value">${valueNode.textContent}</span>`;
  });
}

function buildSpotCountdownMarkup() {
  return `
    <div class="cronometro cronometro--spot oferta-relampago__spot-countdown">
      <span class="cronometro__label">Termina em</span>
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
  document.querySelectorAll(".showcase-oferta-relampago .spot").forEach(function (spot, index) {
    const soldInput = document.querySelector(`#promotion-sold-${index}`);
    const totalInput = document.querySelector(`#promotion-total-${index}`);
    const spotContent = spot.querySelector(".spot__content");
    const priceContainer = spot.querySelector(".spot__content-price");

    if (!soldInput || !totalInput || !spotContent || !priceContainer || spotContent.querySelector(".oferta-relampago__spot-footer")) {
      return;
    }

    const sold = Number(soldInput.value) || 0;
    const total = Number(totalInput.value) || 0;
    const progress = total > 0 ? Math.min(100, Math.round((sold * 100) / total)) : 0;
    const overlay = document.createElement("div");

    overlay.className = "oferta-relampago__spot-footer";
    overlay.innerHTML = `
      <div class="oferta-relampago__sold" aria-hidden="true">
        <span class="oferta-relampago__sold-progress" style="width:${progress}%"></span>
        <span class="oferta-relampago__sold-text" data-sold="${sold}">0 vendidos</span>
      </div>
      ${buildRotatingBadgeMarkup()}
      ${buildSpotCountdownMarkup()}
    `;

    priceContainer.insertAdjacentElement("afterend", overlay);
    animateSoldCounter(overlay.querySelector(".oferta-relampago__sold-text"), sold);
  });
}

function startCountdown() {
  const countdownRoot = document.getElementById("cronometro");

  if (!countdownRoot) {
    return;
  }

  const campaignTargetDate = resolveCountdownTarget(countdownRoot.getAttribute("data-promotion"));
  const spotTargetDate = resolveDailySpotTarget();
  const note = countdownRoot.querySelector(".cronometro__note");
  const originalNote = note ? note.textContent : "";
  const spotCountdownNodes = Array.from(document.querySelectorAll(".cronometro--spot"));
  let timerId = null;

  const tick = function () {
    const campaignCountdownParts = getCountdownParts(campaignTargetDate);
    const spotCountdownParts = getCountdownParts(spotTargetDate);

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

function initSwiperIfNeeded(selector, options) {
  const swiperElement = document.querySelector(`${selector} .swiper`);

  if (!swiperElement || swiperElement.classList.contains("swiper-initialized")) {
    return null;
  }

  return new Swiper(`${selector} .swiper`, options);
}

function buildCarouselOptions(selector) {
  return {
    navigation: {
      nextEl: `${selector} .swiper-button-next`,
      prevEl: `${selector} .swiper-button-prev`,
    },
    watchOverflow: true,
    slidesPerView: 2.15,
    spaceBetween: 8,
    breakpoints: {
      768: {
        slidesPerView: 3.1,
        spaceBetween: 12,
      },
      992: {
        slidesPerView: 4,
        spaceBetween: 18,
      },
      1200: {
        slidesPerView: 5,
        spaceBetween: 20,
      },
    },
  };
}

function initDeferredSwipers(selectors) {
  const pendingSelectors = selectors.filter(function (selector) {
    const swiperElement = document.querySelector(`${selector} .swiper`);
    return swiperElement && !swiperElement.classList.contains("swiper-initialized");
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
    rootMargin: "300px 0px",
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

  initSwiperIfNeeded(".showcase-oferta-relampago__carousel", buildCarouselOptions(".showcase-oferta-relampago__carousel"));

  initDeferredSwipers([
    ".showcase-frete-gratis__carousel",
    ".showcase-melhores-ofertas__carousel",
    ".showcase-metais__carousel",
    ".showcase-banho-e-aquecimento__carousel",
    ".showcase-moveis__carousel",
    ".showcase-ferramentas__carousel",
    ".showcase-chance-unica__carousel",
  ]);
}

document.addEventListener("DOMContentLoaded", function () {
  mountPromotionOverlays();
  startRotatingBadges();
  startCountdown();
  initLandingSwipers();
  normalizeSavingsLabels();
  window.setTimeout(normalizeSavingsLabels, 120);
});
