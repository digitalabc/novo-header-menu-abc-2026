var swiper = new Swiper(".subcategories .swiper", {
  navigation: {
    nextEl: '.subcategories .swiper-button-next',
    prevEl: '.subcategories .swiper-button-prev'
  },
  spaceBetween: 20,
  slidesPerView: 2.5,
  breakpoints: {
    991: {
      slidesPerView: 11
    }
  }
});
