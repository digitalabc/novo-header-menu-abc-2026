const buttons = document.querySelectorAll(".side-filter li")
window.addEventListener("DOMContentLoaded", currentPage(window.location.pathname, buttons))

function currentPage(path, btnList) {
  let pathname = path.replace("/central-de-atendimento/", "")

  btnList.forEach((btn) => {
    if (btn.classList[0] == pathname) {
      btn.classList.add("current")
    }
  })
}

function accordion(button) {
  event.preventDefault()
  button.classList.toggle("active")
  var panel = button.nextElementSibling;
  if (panel.style.maxHeight) {
    panel.style.maxHeight = null;
  } else {
    panel.style.maxHeight = panel.scrollHeight + "px";
  }
}