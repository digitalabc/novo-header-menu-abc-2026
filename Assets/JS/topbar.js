
if (MOBILE.matches && document.querySelector(".swiper.topbar__container")) {
  var topbarSwiper = new Swiper(".swiper.topbar__container", {
    loop: true,
    autoplay: {
      delay: 3000,
    },
  });
}
