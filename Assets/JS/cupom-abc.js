const copyPopup = document.querySelector("[data-copy-popup]");
const copyPopupDialog = copyPopup?.querySelector(".cupom-copy-popup__dialog");
const copyPopupCloseButtons = copyPopup
  ? Array.from(copyPopup.querySelectorAll("[data-copy-popup-close]"))
  : [];
const faqCta = document.querySelector(
  '.cupom-abc-hero__cta[href="#cupom-abc-faq"]',
);
const faqItems = Array.from(document.querySelectorAll(".seo-content__faq-item"));
const faqCloseTimers = new WeakMap();
const faqCloseDuration = 280;
const newsletterWidgetOpenButton = document.querySelector(
  ".abc-newsletter-widget-cta-btn[data-widget-open]",
);
const firstPurchaseCupomCard = document.querySelector(
  ".cupom-abc-cupoms > div > .cupom:first-child",
);
const hiddenCupomCodes = new Set(["GERAL10", "METAIS10"]);

let copyPopupTimer = null;

const isCompactViewport = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(max-width: 768px)").matches;

const clearCopyPopupTimer = () => {
  if (copyPopupTimer !== null) {
    window.clearTimeout(copyPopupTimer);
    copyPopupTimer = null;
  }
};

const setCopyPopupLock = (locked) => {
  document.documentElement.classList.toggle("cupom-copy-popup-lock", locked);
  document.body.classList.toggle("cupom-copy-popup-lock", locked);
};

const openNewsletterPopup = () => {
  if (!newsletterWidgetOpenButton) {
    return;
  }

  newsletterWidgetOpenButton.click();
};

const getFaqScrollOffset = () => {
  const header = document.querySelector("header");
  const headerHeight = header ? header.getBoundingClientRect().height : 0;
  const extraOffset = window.matchMedia("(max-width: 767px)").matches ? 14 : 15;

  return headerHeight + extraOffset;
};

const scrollToFaqSection = (event) => {
  event.preventDefault();

  const target =
    document.getElementById("seo-faq-title") ||
    document.getElementById("cupom-abc-faq");

  if (!target) {
    return;
  }

  const top =
    window.pageYOffset +
    target.getBoundingClientRect().top -
    getFaqScrollOffset();
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  if (history.pushState) {
    history.pushState(null, "", "#seo-faq-title");
  }
};

const closeFaqItem = (item) => {
  if (!item || !item.open) {
    return;
  }

  const currentTimer = faqCloseTimers.get(item);
  if (currentTimer) {
    window.clearTimeout(currentTimer);
  }

  item.dataset.closing = "true";

  const timer = window.setTimeout(() => {
    item.open = false;
    item.removeAttribute("data-closing");
    faqCloseTimers.delete(item);
  }, faqCloseDuration);

  faqCloseTimers.set(item, timer);
};

const openFaqItem = (item) => {
  if (!item) {
    return;
  }

  const currentTimer = faqCloseTimers.get(item);
  if (currentTimer) {
    window.clearTimeout(currentTimer);
    faqCloseTimers.delete(item);
  }

  item.removeAttribute("data-closing");
  item.open = true;
};

const closeCopyPopup = () => {
  if (!copyPopup) {
    return;
  }

  clearCopyPopupTimer();
  copyPopup.classList.remove("is-open");
  copyPopup.setAttribute("aria-hidden", "true");
  setCopyPopupLock(false);
};

const openCopyPopup = () => {
  if (!copyPopup) {
    return;
  }

  clearCopyPopupTimer();
  copyPopup.classList.add("is-open");
  copyPopup.setAttribute("aria-hidden", "false");
  setCopyPopupLock(true);

  const duration = isCompactViewport() ? 4200 : 5000;
  copyPopupTimer = window.setTimeout(closeCopyPopup, duration);
};

const setupCupomCards = () => {
  document.querySelectorAll(".cupom").forEach((card) => {
    if (card.dataset.cupomEnhanced === "true") {
      return;
    }

    const isFirstPurchaseCard = card === firstPurchaseCupomCard;

    if (isFirstPurchaseCard) {
      card.classList.add("cupom--first-purchase");
    }

    const directChildren = Array.from(card.children);
    const textBlocks = directChildren.filter((element) => element.tagName === "P");
    const actions = directChildren.filter((element) =>
      element.matches?.("button, a"),
    );

    if (!actions.length) {
      return;
    }

    if (isFirstPurchaseCard) {
      const eyebrowClass = "cupom-first-purchase__eyebrow";
      const valueClass = "cupom-first-purchase__value";
      const subtitleClass = "cupom-first-purchase__subtitle";

      if (!card.querySelector(`.${eyebrowClass}`)) {
        const eyebrowNode = document.createElement("p");
        eyebrowNode.className = eyebrowClass;
        eyebrowNode.textContent = "Quer ganhar";

        if (textBlocks[0]) {
          card.insertBefore(eyebrowNode, textBlocks[0]);
        } else {
          card.insertBefore(eyebrowNode, actions[0] || null);
        }
      }

      if (textBlocks[0]) {
        textBlocks[0].classList.add(valueClass);
      }

      if (textBlocks[1]) {
        textBlocks[1].classList.add(subtitleClass);
        if (textBlocks[1].textContent?.includes("Use o código")) {
          textBlocks[1].textContent = "de desconto?";
        }
      }
    }

    const note = [...directChildren]
      .reverse()
      .find((element) => element.tagName === "P");
    const actionsWrap = document.createElement("div");
    actionsWrap.className = "cupom-actions";

    actions.forEach((action, index) => {
      action.classList.add("cupom-action");
      action.classList.toggle("cupom-action--primary", index === 0);
      action.classList.toggle("cupom-action--secondary", index === 1);

      const originalText = action.textContent.trim().toLowerCase();
      const nextLabel =
        index === 0
          ? "Copiar"
          : index === 1
            ? "Vitrine especial"
            : action.textContent.trim();

      action.textContent =
        actions.length === 1 && originalText.includes("vitrine")
          ? "Vitrine especial"
          : nextLabel;
      actionsWrap.appendChild(action);
    });

    if (isFirstPurchaseCard) {
      const openNewsletterFromCard = (event) => {
        event.preventDefault();
        event.stopImmediatePropagation();
        openNewsletterPopup();
      };

      const primaryAction = actions[0];

      if (primaryAction) {
        primaryAction.addEventListener("click", openNewsletterFromCard, true);
      }
    }

    if (note && note.parentElement === card) {
      card.insertBefore(actionsWrap, note);
      note.classList.add("cupom-footnote");
    } else {
      card.appendChild(actionsWrap);
    }

    card.classList.toggle("cupom--single-action", actions.length === 1);
    card.classList.toggle("cupom--multiple-actions", actions.length > 1);
    card.dataset.cupomEnhanced = "true";
  });
};

const normalizeCupomText = (value) =>
  (value || "")
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");

const extractCupomCode = (card) => {
  const cupomName = card.querySelector(".cupom-name")?.textContent?.trim();
  const normalizedCupomName = normalizeCupomText(cupomName);

  if (normalizedCupomName) {
    return normalizedCupomName;
  }

  const normalizedCardText = normalizeCupomText(card.textContent);

  for (const cupomCode of hiddenCupomCodes) {
    if (normalizedCardText.includes(cupomCode)) {
      return cupomCode;
    }
  }

  return "";
};

const cardHasMultipleActions = (card) => {
  const actionsInsideWrap = card.querySelectorAll(".cupom-actions .cupom-action");

  if (actionsInsideWrap.length) {
    return actionsInsideWrap.length > 1;
  }

  const directActions = Array.from(card.children).filter((element) =>
    element.matches?.("button, a"),
  );

  return directActions.length > 1;
};

const hideSpecificCupoms = () => {
  document.querySelectorAll(".cupom").forEach((card) => {
    const cupomCode = extractCupomCode(card);
    const shouldHide =
      hiddenCupomCodes.has(cupomCode) && cardHasMultipleActions(card);

    if (shouldHide) {
      card.style.display = "none";
      card.dataset.cupomHidden = "true";
      return;
    }

    if (card.dataset.cupomHidden === "true") {
      card.style.removeProperty("display");
      card.removeAttribute("data-cupom-hidden");
    }
  });
};

const refreshCupomCards = () => {
  setupCupomCards();
  hideSpecificCupoms();
};

const setupCupomObserver = () => {
  const cupomContainer =
    document.getElementById("cupom-abc-cupons") ||
    document.querySelector(".cupom-abc-cms-stack");

  if (!cupomContainer || cupomContainer.dataset.cupomObserverReady === "true") {
    return;
  }

  const observer = new MutationObserver((mutations) => {
    const hasNewCupom = mutations.some((mutation) =>
      Array.from(mutation.addedNodes).some((node) => {
        if (!(node instanceof Element)) {
          return false;
        }

        return node.matches(".cupom") || Boolean(node.querySelector(".cupom"));
      }),
    );

    if (hasNewCupom) {
      refreshCupomCards();
    }
  });

  observer.observe(cupomContainer, { childList: true, subtree: true });
  cupomContainer.dataset.cupomObserverReady = "true";
};

if (copyPopup) {
  copyPopup.addEventListener("click", (event) => {
    if (
      event.target === copyPopup ||
      event.target?.hasAttribute?.("data-copy-popup-close")
    ) {
      closeCopyPopup();
    }
  });
}

if (copyPopupDialog) {
  copyPopupDialog.addEventListener("click", (event) => {
    event.stopPropagation();
  });
}

faqCta?.addEventListener("click", scrollToFaqSection);

faqItems.forEach((item) => {
  const summary = item.querySelector("summary");

  if (!summary) {
    return;
  }

  summary.addEventListener("click", (event) => {
    event.preventDefault();

    const isOpen = item.open && item.dataset.closing !== "true";

    if (isOpen) {
      closeFaqItem(item);
      return;
    }

    faqItems.forEach((otherItem) => {
      if (otherItem !== item) {
        closeFaqItem(otherItem);
      }
    });

    openFaqItem(item);
  });
});

copyPopupCloseButtons.forEach((button) => {
  button.addEventListener("click", () => {
    closeCopyPopup();
  });
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && copyPopup?.classList.contains("is-open")) {
    closeCopyPopup();
  }
});

const initializeCupomCards = () => {
  refreshCupomCards();
  setupCupomObserver();
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeCupomCards, {
    once: true,
  });
} else {
  initializeCupomCards();
}

window.addEventListener("load", refreshCupomCards);

function copyCupom(e) {
  e?.preventDefault?.();

  const source = e?.currentTarget || e?.target;
  const cupomNode = source?.closest?.(".cupom");
  const cupomName = cupomNode
    ?.querySelector(".cupom-name")
    ?.textContent?.trim();

  if (!cupomName) {
    return;
  }

  copyCupomText(cupomName);
}

async function copyCupomText(text) {
  if (!text) {
    return;
  }

  if (!navigator.clipboard?.writeText) {
    legacyCupomText(text);
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    openCopyPopup();
  } catch (err) {
    console.error("Failed erro ao copiar:", err);
    legacyCupomText(text);
  }
}

function legacyCupomText(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";

  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    const successful = document.execCommand("copy");

    if (successful) {
      openCopyPopup();
    } else {
      console.warn("Legacy copy returned false");
    }
  } catch (err) {
    console.error("Legacy: erro ao copiar", err);
  } finally {
    document.body.removeChild(textArea);
  }
}
