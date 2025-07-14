
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
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  noSwiping: true
});


function open3d(index) {
  window.scrollTo(0, 0)
  slider.slideTo(Number(index), 0, false)
}