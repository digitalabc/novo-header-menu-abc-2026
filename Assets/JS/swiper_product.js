
var thumbs = new Swiper('.gallery-thumbs', {
  spaceBetween: 30,
  slidesPerView: 4,
  slidesPerGroup: 4,
  freeMode: true,
  watchSlidesProgress: true,
  navigation: {
    nextEl: '.gallery .swiper-button-next',
    prevEl: '.gallery .swiper-button-prev',
  },
});

var slider = new Swiper('.gallery-slider', {
  thumbs: {
    swiper: thumbs,
  },
  noSwiping: true
});
