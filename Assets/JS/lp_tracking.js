(function () {
  var LP_CONFIG = {
    "/semana-do-consumidor": { name: "Semana do Consumidor" },
    "/semana-do-cliente": { name: "Semana do Cliente" },
    "/super-chance-unica": { name: "Super Chance Única" },
    "/chance-unica": { name: "Super Chance Única" },
    "/lancamentos-2026": { name: "Lançamentos 2026" },
    "/ofertas-mensais": { name: "Ofertas Mensais" },
  };

  function getLpContext() {
    var path = (window.location.pathname || "/").replace(/\/$/, "") || "/";
    var lpKey = Object.keys(LP_CONFIG).find(function (k) {
      return path === k || path.indexOf(k + "/") === 0;
    });
    if (!lpKey) return null;
    return {
      lp_path: lpKey,
      lp_name: LP_CONFIG[lpKey].name,
    };
  }

  function getOfferDayKey() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function getDeviceType() {
    return window.innerWidth <= 767 ? "mobile" : "desktop";
  }

  function getBaseParams(ctx) {
    return {
      lp_name: ctx.lp_name,
      lp_path: ctx.lp_path,
      offer_day_key: getOfferDayKey(),
      offer_cycle: "daily_refresh_2359",
      device_type: getDeviceType(),
    };
  }

  function pushEvent(eventName, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: eventName,
      ...params,
    });
  }

  function getSpotProductData(spotEl) {
    if (!spotEl) return null;
    var section = spotEl.closest("[data-showcase]");
    var listName = section ? section.getAttribute("data-showcase") || "unknown" : "unknown";
    return {
      product_id: spotEl.getAttribute("data-product-id") || "",
      product_name: (spotEl.getAttribute("data-product-name") || "").replace(/"/g, "'"),
      product_position: parseInt(spotEl.getAttribute("data-product-position"), 10) || 0,
      list_name: listName,
      stock_status: spotEl.getAttribute("data-product-available") === "true" ? "available" : "unavailable",
      discount_percentage: parseInt(spotEl.getAttribute("data-discount-percentage"), 10) || 0,
    };
  }

  function buildEcommerceItem(productData) {
    if (!productData) return null;
    return {
      item_id: productData.product_id,
      item_name: productData.product_name,
      item_list_name: productData.list_name,
      index: productData.product_position,
      discount: productData.discount_percentage,
    };
  }

  // ── Showcase impression tracking (IntersectionObserver) ──────────
  function initShowcaseImpressions(ctx) {
    var sections = document.querySelectorAll("[data-showcase]");
    if (!sections.length) return;

    var observed = {};

    if (!("IntersectionObserver" in window)) {
      sections.forEach(function (section) {
        var name = section.getAttribute("data-showcase");
        if (name && !observed[name]) {
          observed[name] = true;
          pushEvent("lp_showcase_view", {
            ...getBaseParams(ctx),
            showcase_name: name,
          });
        }
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var name = entry.target.getAttribute("data-showcase");
          if (!name || observed[name]) return;
          observed[name] = true;

          var spots = entry.target.querySelectorAll(".spot");
          var items = [];
          spots.forEach(function (spot, i) {
            var data = getSpotProductData(spot);
            if (data) {
              var item = buildEcommerceItem(data);
              if (item) {
                item.index = i;
                items.push(item);
              }
            }
          });

          pushEvent("lp_showcase_view", {
            ...getBaseParams(ctx),
            showcase_name: name,
            ecommerce: {
              item_list_name: name,
              items: items,
            },
          });

          observer.unobserve(entry.target);
        });
      },
      { rootMargin: "0px", threshold: 0.25 }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  // ── "Ver mais ofertas" link tracking ─────────────────────────────
  function initShowcaseLinkTracking(ctx) {
    document.querySelectorAll(".showcase__link").forEach(function (link) {
      link.addEventListener("click", function () {
        var section = link.closest("[data-showcase]");
        var showcaseName = section ? section.getAttribute("data-showcase") || "unknown" : "unknown";
        var linkText = (link.textContent || "").trim();
        var linkUrl = link.getAttribute("href") || "";

        pushEvent("lp_showcase_link_click", {
          ...getBaseParams(ctx),
          showcase_name: showcaseName,
          link_text: linkText,
          link_url: linkUrl,
        });
      });
    });
  }

  // ── Banner impression & click tracking ───────────────────────────
  function initBannerTracking(ctx) {
    var bannerSections = document.querySelectorAll(".fullbanner");
    if (!bannerSections.length) return;

    bannerSections.forEach(function (section) {
      var variant = section.classList.contains("mobile") ? "mobile" : "desktop";

      // Impression
      if ("IntersectionObserver" in window) {
        var obs = new IntersectionObserver(
          function (entries) {
            entries.forEach(function (entry) {
              if (!entry.isIntersecting) return;

              pushEvent("lp_banner_view", {
                ...getBaseParams(ctx),
                banner_variant: variant,
                banner_position: "topo",
              });

              obs.unobserve(entry.target);
            });
          },
          { threshold: 0.5 }
        );
        obs.observe(section);
      }

      // Click
      section.addEventListener("click", function (e) {
        var anchor = e.target.closest("a");
        if (!anchor) return;

        pushEvent("lp_banner_click", {
          ...getBaseParams(ctx),
          banner_variant: variant,
          banner_position: "topo",
          banner_url: anchor.getAttribute("href") || "",
        });
      });
    });
  }

  // ── FAQ tracking ─────────────────────────────────────────────────
  function initFaqTracking(ctx) {
    document.querySelectorAll(".seo-content__faq-item").forEach(function (details) {
      details.addEventListener("toggle", function () {
        if (!details.open) return;
        var summary = details.querySelector("summary");
        var question = summary ? (summary.textContent || "").trim() : "";

        pushEvent("lp_faq_open", {
          ...getBaseParams(ctx),
          faq_question: question,
        });
      });
    });
  }

  // ── Countdown expiry tracking ────────────────────────────────────
  function initCountdownExpiryTracking(ctx) {
    var countdownRoot = document.getElementById("cronometro") || document.querySelector("[data-sticky-campaign-countdown]");
    if (!countdownRoot) return;

    var rawDate = countdownRoot.getAttribute("data-promotion");
    var target = rawDate ? new Date(rawDate) : null;
    if (!target || isNaN(target.getTime())) return;

    var remaining = target.getTime() - Date.now();
    if (remaining <= 0 || remaining > 86400000) return;

    setTimeout(function () {
      pushEvent("lp_countdown_expired", {
        ...getBaseParams(ctx),
        countdown_target: rawDate,
      });
    }, remaining);
  }

  // ── Main init ────────────────────────────────────────────────────
  function initLPTracking() {
    var ctx = getLpContext();
    if (!ctx) return;

    var container = document.querySelector(".lp-ofertas-mensais, .semana-do-consumidor");
    if (!container) return;

    // Page view
    pushEvent("lp_view", getBaseParams(ctx));

    // Product click & add-to-cart (with ecommerce)
    container.addEventListener(
      "click",
      function (e) {
        var target = e.target;
        var spot = target.closest(".spot");
        if (!spot) return;

        var productData = getSpotProductData(spot);
        var baseParams = getBaseParams(ctx);
        var ecommerceItem = buildEcommerceItem(productData);
        var productParams = productData
          ? {
              product_id: productData.product_id,
              product_name: productData.product_name,
              product_position: productData.product_position,
              list_name: productData.list_name,
              stock_status: productData.stock_status,
              discount_percentage: productData.discount_percentage,
            }
          : {};
        var ecommercePayload = ecommerceItem
          ? { ecommerce: { items: [ecommerceItem] } }
          : {};

        if (target.closest("button.add-to-cart-button")) {
          pushEvent("lp_add_to_cart", { ...baseParams, ...productParams, ...ecommercePayload });
        } else {
          pushEvent("lp_product_click", { ...baseParams, ...productParams, ...ecommercePayload });
        }
      },
      true
    );

    // WhatsApp CTA
    document.querySelectorAll(".showcase__hero-whatsapp").forEach(function (btn) {
      btn.addEventListener("click", function () {
        pushEvent("lp_whatsapp_click", getBaseParams(ctx));
      });
    });

    // Showcase impressions (scroll-based)
    initShowcaseImpressions(ctx);

    // "Ver mais ofertas" links
    initShowcaseLinkTracking(ctx);

    // Banner impressions & clicks
    initBannerTracking(ctx);

    // FAQ open tracking
    initFaqTracking(ctx);

    // Countdown expiry
    initCountdownExpiryTracking(ctx);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLPTracking);
  } else {
    initLPTracking();
  }
})();
