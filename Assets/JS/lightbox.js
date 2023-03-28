const STORE_TOKEN = "abc"
const LIGHTBOX_EXPIRATION_DAYS = 3

window.addEventListener("load", lightboxLoad, false)

function lightboxLoad() {
  var newsletterLightboxId = "newsletter-lightbox"
  var exitIntentLightboxId = "exit-intent-lightbox"

  if (!getLocalStorageWithExpiration(`${STORE_TOKEN}-${newsletterLightboxId}`)) {
    showLightbox(newsletterLightboxId)
  }
  
  const exitEvent = e => {
    if (!e.toElement && !e.relatedTarget && e.clientY < 5) {
      document.removeEventListener("mouseout", exitEvent);
      showLightbox(exitIntentLightboxId)
    } 
  };

  setTimeout(() => {
    if (!getLocalStorageWithExpiration(`${STORE_TOKEN}-${exitIntentLightboxId}`)) {
      document.addEventListener("mouseout", exitEvent);
    }
  }, 5000);

}

function setLocalStorageWithExpiration(key, expirationDays) {
  const now = new Date()

  const expiration = now.getTime() + expirationDays*1000*60*60*24;

  localStorage.setItem(key, expiration)
}

function getLocalStorageWithExpiration(key) {
  const expiration = localStorage.getItem(key)
  const now = new Date()

  if (!expiration) {
    return false
  }

  if (now.getTime() > expiration) {
    localStorage.removeItem(key)
    return false
  }

  return true
}

function closeLightbox(lightboxId) {
  if (event.target == event.currentTarget) {
    const lightbox = document.getElementById(lightboxId)
    setLocalStorageWithExpiration(`${STORE_TOKEN}-${lightboxId}`, LIGHTBOX_EXPIRATION_DAYS)
    lightbox.style.display = "none"
  }
}

function showLightbox(lightboxId) {
  const lightbox = document.getElementById(lightboxId)
  lightbox.style.display = "flex"
}
