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
  const clean = text.trim().replace(/R\$\s*/g, "").replace(/\./g, "").replace(",", ".");
  const val = parseFloat(clean);
  return isNaN(val) ? null : val;
}

function processSpotPrice(spotPrice) {
  if (spotPrice.querySelector(".discount")) return;

  const precoDeEl = spotPrice.querySelector(".precoDe s");
  const precoPorEl = spotPrice.querySelector(".precoPor > span");
  if (!precoDeEl || !precoPorEl) return;

  const listPrice = parseReais(precoDeEl.textContent);
  const currentPrice = parseReais(precoPorEl.textContent);
  if (listPrice === null || currentPrice === null || listPrice <= currentPrice) return;

  const savings = (listPrice - currentPrice).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const discountEl = document.createElement("div");
  discountEl.className = "discount";
  discountEl.innerHTML = `Você economiza: <span class="discount__value">${savings}</span>`;
  spotPrice.insertBefore(discountEl, spotPrice.firstChild);
}

function moveSpotDiscounts() {
  document.querySelectorAll(".spot .spot-price").forEach(processSpotPrice);
}

window.addEventListener("DOMContentLoaded", function () {
  document.getElementById("no-bg-img").remove();
  moveSpotDiscounts();
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
  offsetToHideMobileNav
) {
  if (
    scrollTop > offsetToShowMobileNav &&
    window.innerHeight + scrollTop + offsetToHideMobileNav <=
      document.body.offsetHeight
  ) {
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
      navbarCollapse.remove();
    }
  }

  function removeNoscript() {
    if (isDesktop) {
      document.querySelectorAll('[data-lazy="true"]').forEach((element) => {
        const noscriptTag = element.querySelector("noscript");
        if (noscriptTag) {
          element.innerHTML = noscriptTag.innerHTML;

          initSwipers();
        }
      });

      window.removeEventListener("scroll", removeNoscript);
    }

    document.querySelectorAll('[data-lazy="false"]').forEach((element) => {
      const noscriptTag = element.querySelector("noscript");
      if (noscriptTag) {
        element.innerHTML = noscriptTag.innerHTML;

        initSwipers();
      }
    });

    reorderHomepageSections();
    replaceRulerIcons();
    updateRulerTexts();
    window.removeEventListener("scroll", removeNoscript);
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
      itemSelector: ".ruler__list .ruler__item:first-child",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/sf/img/svg/wpp-abc.svg?theme=main&v=202603120832",
      imageAlt: "Whatsapp",
      imageWidth: 24,
      imageHeight: 24,
      imageClass: "ruler__icon-whatsapp",
      wrapperClass: "ruler__text-wrapper--icon-replaced",
    });

    replaceRulerItemIcon({
      itemSelector: ".ruler__list .ruler__item:nth-child(2)",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/media/payment-pix.png?v=202603112019",
      imageAlt: "Pix",
      imageHeight: 24,
      imageClass: "ruler__icon-pix",
      wrapperClass: "ruler__text-wrapper--pix-icon-replaced",
    });

    replaceRulerItemIcon({
      itemSelector: ".ruler__list .ruler__item:nth-child(3)",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/media/mini-franquia-abc.png?v=202603112009",
      imageAlt: "Compre online",
      imageHeight: 40,
      imageClass: "ruler__icon-online",
      wrapperClass: "ruler__text-wrapper--online-icon-replaced",
    });

    replaceRulerItemIcon({
      itemSelector: ".ruler__list .ruler__item:nth-child(4)",
      imageSrc:
        "https://abcdaconstrucao.fbitsstatic.net/media/encarte-forms.png?v=202603112016",
      imageAlt: "Ofertas lojas físicas",
      imageHeight: 40,
      imageClass: "ruler__icon-store-offers",
      wrapperClass: "ruler__text-wrapper--store-offers-icon-replaced",
    });
  }

  function updateRulerTexts() {
    updateRulerItemHtml(
      ".ruler__list .ruler__item:nth-child(4)",
      "<strong>Ofertas Lojas Físicas</strong><span class=\"ruler__subtitle\">mais perto de você</span>"
    );
  }

  function reorderHomepageSections() {
    if (!document.body.classList.contains("home")) return;

    const topContainer = document.querySelector("body.home > .container");
    const opportunitiesSection = topContainer?.querySelector(".banner-oportunidades");
    if (!topContainer || !opportunitiesSection) return;

    const normalizeText = (value) =>
      (value || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

    const desktopEnvironments = document.querySelector(
      ".gray-bg.desktop .container > .environments"
    );
    const mobileEnvironments = document.querySelector(
      ".gray-bg.mobile .container > .environments"
    );

    if (mobileEnvironments) {
      mobileEnvironments.classList.add("mobile");
      opportunitiesSection.insertAdjacentElement("afterend", mobileEnvironments);
    }

    if (desktopEnvironments) {
      desktopEnvironments.classList.add("desktop");
      opportunitiesSection.insertAdjacentElement("afterend", desktopEnvironments);
    }

    const hasTitle = (section, title) =>
      normalizeText(section?.textContent).includes(normalizeText(title));

    const allSections = Array.from(document.querySelectorAll("body.home section"));
    const exclusiveSections = allSections.filter((section) =>
      hasTitle(section, "Ofertas exclusivas para voce")
    );

    const moveAfterEnvironment = (environmentSection, deviceClass) => {
      if (!environmentSection) return;

      const targetSection = exclusiveSections.find((section) =>
        section.classList.contains(deviceClass)
      );
      const fallbackSection = exclusiveSections.find(
        (section) =>
          !section.classList.contains("mobile") &&
          !section.classList.contains("desktop")
      );

      const sectionToMove = targetSection || fallbackSection;
      if (sectionToMove) {
        environmentSection.insertAdjacentElement("afterend", sectionToMove);
      }
    };

    moveAfterEnvironment(mobileEnvironments, "mobile");
    moveAfterEnvironment(desktopEnvironments, "desktop");
  }

  function initSwipers() {
    new Swiper(".fullbanner.desktop .swiper", {
      loop: true,
      navigation: {
        nextEl: ".fullbanner.desktop .swiper-button-next",
        prevEl: ".fullbanner.desktop .swiper-button-prev",
      },
      autoplay: {
        delay: 5000,
      },
    });

    new Swiper(".fullbanner.mobile .swiper", {
      loop: true,
      autoplay: {
        delay: 5000,
      },
    });

    new Swiper(".banner-oportunidades .mobile .swiper:first-child", {
      spaceBetween: 10,
      slidesPerView: 2.1,
    });

    new Swiper(".banner-grid .swiper:first-child", {
      spaceBetween: 20,
      slidesPerView: 1.2,
      breakpoints: {
        991: {
          slidesPerView: 3,
        },
      },
    });

    new Swiper(".banner-grid div:nth-child(2)", {
      spaceBetween: 20,
      slidesPerView: "auto",
      breakpoints: {
        991: {
          slidesPerView: 2,
        },
      },
    });

    new Swiper(".departments .swiper", {
      navigation: {
        nextEl: ".departments .swiper-button-next",
        prevEl: ".departments .swiper-button-prev",
      },
      spaceBetween: 10,
      slidesPerView: "auto",
      breakpoints: {
        991: {
          spaceBetween: 20,
          slidesPerView: 8,
        },
      },
    });

    new Swiper(".showcase-1 .swiper", {
      navigation: {
        nextEl: ".showcase-1 .swiper-button-next",
        prevEl: ".showcase-1 .swiper-button-prev",
      },
      slidesPerView: 2.1,
      spaceBetween: 5,
      breakpoints: {
        768: {
          slidesPerView: 3.1,
          spaceBetween: 5,
        },
        1090: {
          slidesPerView: 4,
          spaceBetween: 20,
        },
        1090: {
          slidesPerView: 5,
          spaceBetween: 20,
        },
      },
    });

    new Swiper(".showcase-2 .swiper", {
      navigation: {
        nextEl: ".showcase-2 .swiper-button-next",
        prevEl: ".showcase-2 .swiper-button-prev",
      },
      spaceBetween: 5,
      slidesPerView: 2.1,
      breakpoints: {
        768: {
          slidesPerView: 3.1,
        },
        991: {
          slidesPerView: 4,
          spaceBetween: 20,
        },
        1090: {
          slidesPerView: 5,
          spaceBetween: 20,
        },
      },
    });

    new Swiper(".environments .swiper", {
      navigation: {
        nextEl: ".environments .swiper-button-next",
        prevEl: ".environments .swiper-button-prev",
      },
      spaceBetween: 10,
      slidesPerView: "auto",
      breakpoints: {
        991: {
          spaceBetween: 20,
          slidesPerView: 4,
        },
      },
    });

    new Swiper(".banner-centro.desktop .swiper", {
      spaceBetween: 20,
      slidesPerView: 3,
    });

    new Swiper(".brands .swiper", {
      slidesPerView: 2,
      navigation: {
        nextEl: ".brands .swiper-button-next",
        prevEl: ".brands .swiper-button-prev",
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

    new Swiper(".stores .swiper", {
      navigation: {
        nextEl: ".stores .swiper-button-next",
        prevEl: ".stores .swiper-button-prev",
      },
      spaceBetween: 10,
      slidesPerView: "auto",
      breakpoints: {
        991: {
          spaceBetween: 20,
          slidesPerView: 6.2,
        },
      },
    });

    if (MOBILE.matches) {
      new Swiper(".blog .swiper", {
        slidesPerView: "auto",
        spaceBetween: 20,
      });
    }

    new Swiper(".banner-instagram .swiper", {
      spaceBetween: 10,
      slidesPerView: "auto",
      breakpoints: {
        991: {
          spaceBetween: 25,
          slidesPerView: 5,
        },
      },
    });

    new Swiper(".related-products .swiper", {
      navigation: {
        nextEl: ".related-products .swiper-button-next",
        prevEl: ".related-products .swiper-button-prev",
      },
      spaceBetween: 5,
      slidesPerView: 2.1,
      breakpoints: {
        768: {
          slidesPerView: 3.1,
        },
        991: {
          spaceBetween: 20,
          slidesPerView: 4,
        },
        1090: {
          spaceBetween: 20,
          slidesPerView: 5,
        },
      },
    });
  }

  window.addEventListener("scroll", removeNoscript, { once: true });

  initSwipers();
  reorderHomepageSections();
  replaceRulerIcons();
  updateRulerTexts();
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
