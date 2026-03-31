const openCanvasButtons = document.querySelectorAll("[ah-toggle]") 

openCanvasButtons.forEach((element) => {
  const offcanvasId = element.getAttribute("ah-toggle");
  
  if (offcanvasId !== 'user-page') {
    const offcanvas = document.querySelector(offcanvasId)
    element.addEventListener("click", () => openOffcanvas(offcanvasId));
    offcanvas.addEventListener("click", (evt) => handleCanvasClick(offcanvasId, evt));
  } else {
    element.addEventListener("click", () => openOffcanvas(offcanvasId));
  }
});

function openOffcanvas(offcanvasId){
  const offcanvas = document.querySelector(offcanvasId);
  if (offcanvas) {
    body.classList.add("ah-offcanvas-container")
    offcanvas.style.display = "block";
    window.dispatchEvent(new CustomEvent("cartViewed"))
    setTimeout(() => { //Delay class add to prevent visual bug due to display toggle
      offcanvas.classList.add("ah-offcanvas-open")
    }, 10);
  } else {
    handleCanvasUserPage();
  }
}

function handleCanvasClick(offcanvasId, evt){
  if (evt.target == evt.currentTarget || evt.target.classList.contains("ah-close")) {
    closeOffcanvas(offcanvasId)
  }
}

function closeOffcanvas(offcanvasId){
  const offcanvas = document.querySelector(offcanvasId)
  offcanvas.classList.remove("ah-offcanvas-open")
  body.classList.remove("ah-offcanvas-container")
  setTimeout(() => {
    offcanvas.style.display = "none";
  }, 300);
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
