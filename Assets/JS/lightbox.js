const STORE_TOKEN = "abc"
const LIGHTBOX_EXPIRATION_DAYS = 3

if(DESKTOP.matches){
  window.addEventListener("load", lightboxLoad, false)
}

function lightboxLoad() {
  var newsletterLightboxId = "newsletter-lightbox"
  var exitIntentLightboxId = "exit-intent-lightbox"

  // Show Newsletter lightbox
  // setTimeout(() => {
  //   if (!getLocalStorageWithExpiration(`${STORE_TOKEN}-${newsletterLightboxId}`)) {
  //     showLightbox(newsletterLightboxId)
  //   }
  // }, 500);

  // Show Exit Intent Lightbox
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
  }, 3000);
  

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
    const body = document.body
    setLocalStorageWithExpiration(`${STORE_TOKEN}-${lightboxId}`, LIGHTBOX_EXPIRATION_DAYS)
    body.classList.remove(`show-${lightboxId}`)
  }
}

function showLightbox(lightboxId) {
  if (document.getElementById(lightboxId)) {
    const body = document.body
    body.classList.add(`show-${lightboxId}`)
  }
}

var swiper = new Swiper(".showcase-lightbox .swiper", {
  navigation: {
    nextEl: '.showcase-lightbox .swiper-button-next',
    prevEl: '.showcase-lightbox .swiper-button-prev'
  },
  slidesPerView: 3,
  spaceBetween: 20,
});