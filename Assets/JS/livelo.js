const urlPage = window.location.pathname;
if (urlPage.includes("livelo")) {
  window.addEventListener("load", liveloSetup, false);
}

const links = document.querySelectorAll("header a, footer a");
const popup = document.getElementById("livelo-popup");
const modal = document.getElementById("livelo-modal");

function liveloSetup() {
  links.forEach(link => {
    link.addEventListener("click", liveloClick, false)
  })
}

function liveloClick() {
  event.preventDefault();
  let button = document.getElementById("livelo-leave")
  event.target.href != undefined ? button.setAttribute("href", event.target.href) : button.setAttribute("href", "/");

  liveloPopup();
}

function liveloPopup(show = true) {
  if (show) {
    document.body.style.overflow = "hidden"
    popup.classList.add("visible");
    popup.style.display = "block";

    modal.classList.add("visible");
    modal.style.display = "block";
  } else {
    document.body.style.overflow = null
    popup.classList.remove("visible");
    modal.classList.remove("visible");
    setTimeout(() => {
      popup.style.display = "none"
      modal.style.display = "none"
    }, 200);
  }
}
