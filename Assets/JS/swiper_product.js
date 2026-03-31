function initializeProductGallerySwipers() {
  if (window.productGallerySwiper && !window.productGallerySwiper.destroyed) {
    window.productGallerySwiper.destroy(true, true);
  }

  if (window.productGalleryThumbs && !window.productGalleryThumbs.destroyed) {
    window.productGalleryThumbs.destroy(true, true);
  }

  var thumbs = new Swiper('.gallery-thumbs', {
    spaceBetween: 30,
    slidesPerView: 4,
    slidesPerGroup: 1,
    freeMode: true,
    watchSlidesProgress: true,
    slideToClickedSlide: true,
  });

  var slider = new Swiper('.gallery-slider', {
    thumbs: {
      swiper: thumbs,
    },
    navigation: {
      nextEl: '.gallery .swiper-button-next',
      prevEl: '.gallery .swiper-button-prev',
    },
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    allowTouchMove: true,
    preventClicks: true,
    preventClicksPropagation: true,
    threshold: 6,
    touchRatio: 1,
    resistanceRatio: 0.72,
    simulateTouch: true,
    touchStartPreventDefault: false,
    touchReleaseOnEdges: true,
    watchOverflow: true,
    rewind: true,
  });

  window.productGalleryThumbs = thumbs;
  window.productGallerySwiper = slider;
  window.initializeProductGalleryZoom?.();
}

initializeProductGallerySwipers();

function open3d(index) {
  window.scrollTo(0, 0);
  window.productGallerySwiper?.slideTo(Number(index), 0, false);
}
