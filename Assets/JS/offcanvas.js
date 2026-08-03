const offcanvasCloseTimers = new WeakMap();

function getOffcanvas(offcanvasId) {
  if (!offcanvasId || offcanvasId === "user-page") return null;

  try {
    return document.querySelector(offcanvasId);
  } catch (err) {
    return null;
  }
}

function closestElement(target, selector) {
  if (!target) return null;

  const element = target.nodeType === 1 ? target : target.parentElement;
  return element ? element.closest(selector) : null;
}

function bindOffcanvasClickHandler(offcanvasId, offcanvas) {
  if (!offcanvas || offcanvas.dataset.ahCanvasReady === "true") return;

  offcanvas.dataset.ahCanvasReady = "true";
  offcanvas.addEventListener("click", (evt) => handleCanvasClick(offcanvasId, evt));
}

function initOffcanvasToggles() {
  const openCanvasButtons = document.querySelectorAll("[ah-toggle]");

  openCanvasButtons.forEach((element) => {
    if (element.dataset.ahToggleReady === "true") return;

    const offcanvasId = element.getAttribute("ah-toggle");
    const offcanvas = getOffcanvas(offcanvasId);

    element.dataset.ahToggleReady = "true";
    element.addEventListener("click", (evt) => {
      evt.preventDefault();
      openOffcanvas(offcanvasId);
    });

    bindOffcanvasClickHandler(offcanvasId, offcanvas);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initOffcanvasToggles, { once: true });
} else {
  initOffcanvasToggles();
}

function openOffcanvas(offcanvasId){
  if (offcanvasId === "user-page") {
    handleCanvasUserPage();
    return;
  }

  const offcanvas = getOffcanvas(offcanvasId);
  if (offcanvas) {
    const body = document.body;
    const closeTimer = offcanvasCloseTimers.get(offcanvas);

    bindOffcanvasClickHandler(offcanvasId, offcanvas);

    if (closeTimer) {
      clearTimeout(closeTimer);
      offcanvasCloseTimers.delete(offcanvas);
    }

    body.classList.add("ah-offcanvas-container")
    offcanvas.style.display = "block";
    window.dispatchEvent(new CustomEvent("cartViewed"))
    const scheduleOpen = window.requestAnimationFrame || ((callback) => setTimeout(callback, 10));

    scheduleOpen(() => {
      offcanvas.classList.add("ah-offcanvas-open")
    });
  }
}

function handleCanvasClick(offcanvasId, evt){
  const closeButton = closestElement(evt.target, ".ah-close");

  if (evt.target == evt.currentTarget || closeButton) {
    evt.preventDefault();
    closeOffcanvas(offcanvasId)
  }
}

function closeOffcanvas(offcanvasId){
  const offcanvas = getOffcanvas(offcanvasId)
  if (!offcanvas) return;

  offcanvas.classList.remove("ah-offcanvas-open")

  const closeTimer = setTimeout(() => {
    if (!offcanvas.classList.contains("ah-offcanvas-open")) {
      offcanvas.style.display = "none";
      document.body.classList.remove("ah-offcanvas-container")
    }
    offcanvasCloseTimers.delete(offcanvas);
  }, 250);
  offcanvasCloseTimers.set(offcanvas, closeTimer);
}
// pde-477
function handleCanvasUserPage() {
  const authenticatedLinks = document.querySelector(".user__links.authenticated");
  const hasCustomerToken = document.cookie.includes("sf_customer_access_token=");
  const isAuthenticated =
    hasCustomerToken ||
    (authenticatedLinks && window.getComputedStyle(authenticatedLinks).display !== "none");

  let url = `/login/authenticate?returnUrl=${encodeURIComponent(window.location.pathname)}`;
  if (isAuthenticated) {
    url = "/account/my-data";
  }

  window.location.href = url;
}
