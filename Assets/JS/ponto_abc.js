var swiper = new Swiper(".brands .swiper", {
  spaceBetween: 10,
  slidesPerView: 2,
  loop: true,
  autoplay: {
    delay: 3000,
  },
  breakpoints: {
    991: {
      spaceBetween: 25,
      slidesPerView: 6
    }
  }
});