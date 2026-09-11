window.LandingPageConfig = {
  stockBadgeSelector: ".showcase-oferta-relampago .oferta-relampago__sold",
  discountSelector: ".spot-price .discount",
  showSpotCountdown: false,
  showPromotionOverlay: false,
  promotionSpotSelector: ".showcase-oferta-relampago .spot",
  featuredCarouselSelector: ".showcase-oferta-relampago__carousel",
  featuredSlidesPerView: {
    768: 3.1,
    992: 4,
    1090: 6,
    1200: 6,
  },
  carouselSelectors: [
    ".showcase-oferta-relampago__carousel",
    ".showcase-frete-gratis__carousel", ".showcase-melhores-ofertas__carousel",
    ".showcase-metais__carousel", ".showcase-banho-e-aquecimento__carousel",
    ".showcase-moveis__carousel", ".showcase-ferramentas__carousel",
    ".showcase-iluminacao__carousel"
  ]
};

function padCountdownUnit(value) {
  return String(Math.max(0, value)).padStart(2, "0");
}

function renderOffersCountdown(root) {
  const hoursNode = root.querySelector("[data-lp-countdown-hours]");
  const minutesNode = root.querySelector("[data-lp-countdown-minutes]");
  const secondsNode = root.querySelector("[data-lp-countdown-seconds]");
  const labelNode = root.querySelector(".lp-offers-countdown__label");

  if (!hoursNode || !minutesNode || !secondsNode) {
    return;
  }

  const endDate = new Date(root.getAttribute("data-end"));

  if (Number.isNaN(endDate.getTime())) {
    return;
  }

  if (root.dataset.lpCountdownMounted === "true") {
    return;
  }

  root.dataset.lpCountdownMounted = "true";

  const tick = function () {
    const now = new Date();
    const diffMs = Math.max(0, endDate.getTime() - now.getTime());
    const totalSeconds = Math.floor(diffMs / 1000);
    const totalHours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (labelNode) {
      labelNode.textContent = "As ofertas terminam em:";
    }

    hoursNode.textContent = padCountdownUnit(totalHours);
    minutesNode.textContent = padCountdownUnit(minutes);
    secondsNode.textContent = padCountdownUnit(seconds);
  };

  const scheduleTick = function () {
    tick();
    const delay = 1000 - (Date.now() % 1000);
    window.setTimeout(scheduleTick, delay);
  };

  scheduleTick();
}

document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll("[data-lp-offers-countdown]").forEach(function (root) {
    renderOffersCountdown(root);
  });
});
