const STORE_TOKEN = "abc"
const LIGHTBOX_EXPIRATION_DAYS = 3

function lightboxLoad() {
  if (window.__abcLightboxInitialized) {
    return;
  }

  window.__abcLightboxInitialized = true;
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

if (DESKTOP.matches) {
  if (document.readyState === "complete") {
    lightboxLoad();
  } else {
    window.addEventListener("load", lightboxLoad, false);
  }
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

function initShowcaseLightboxSwiper() {
  const showcaseSwiper = document.querySelector(".showcase-lightbox .swiper");

  if (!showcaseSwiper || showcaseSwiper.dataset.swiperInitialized === "true") {
    return;
  }

  const section = showcaseSwiper.closest(".showcase-lightbox");

  new Swiper(showcaseSwiper, {
    navigation: {
      nextEl: section?.querySelector(".swiper-button-next"),
      prevEl: section?.querySelector(".swiper-button-prev")
    },
    slidesPerView: 3,
    spaceBetween: 20,
  });

  showcaseSwiper.dataset.swiperInitialized = "true";
}

initShowcaseLightboxSwiper();
window.addEventListener("lazyContentHydrated", initShowcaseLightboxSwiper);
