window.addEventListener("load", setupZone, false)

const zone = document.getElementById("zone");
const zone_popup = document.getElementById("zone-popup");
let zone_name = document.getElementById("zone-name");

function setupZone() {
  if (localStorage.getItem("zone")) {
    console.log("zona selecionada: ", localStorage.getItem("zone"))
    zone_name.innerHTML = localStorage.getItem("zone");
    zone_popup.style.display = "block"
  }
}

function closeZone() {
  zone_popup.style.display = "none"
}

function submitZonePopup() {
  let zoneCep = document.getElementById("zone-cep")
  if (zoneCep.value != "") {
    localStorage.setItem("zone", zoneCep.value)
    setupZone()
    closeZone()
  }
}