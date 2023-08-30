var swiper = new Swiper(".vr_showcase .swiper", {
  navigation: {
    nextEl: '.vr_showcase .swiper-button-next',
    prevEl: '.vr_showcase .swiper-button-prev'
  },
  spaceBetween: 5,
  slidesPerView: 2.2,
  breakpoints: {
    991: {
      spaceBetween: 20,
      slidesPerView: 5
    }
  }
});

var swiper = new Swiper(".vr-banners .swiper", {
  spaceBetween: 15,
  slidesPerView: 1.2
});
