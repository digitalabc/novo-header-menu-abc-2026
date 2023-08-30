var swiper = new Swiper(".subcategories .swiper", {
  navigation: {
    nextEl: '.subcategories .swiper-button-next',
    prevEl: '.subcategories .swiper-button-prev'
  },
  spaceBetween: 15,
  slidesPerView: 'auto',
  breakpoints: {
    991: {
      spaceBetween: 20,
      slidesPerView: 11
    }
  }
});

