var swiper = new Swiper(".subcategories .swiper", {
  navigation: {
    nextEl: '.subcategories .swiper-button-next',
    prevEl: '.subcategories .swiper-button-prev'
  },
  spaceBetween: 20,
  slidesPerView: "auto",
  breakpoints: {
    991: {
      slidesPerView: 6
    }
  }
});

var swiper = new Swiper(".subTopo .swiper", {
  navigation: {
    nextEl: '.subTopo .swiper-button-next',
    prevEl: '.subTopo .swiper-button-prev'
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

var swiper = new Swiper(".showcase-1 .swiper", {
  navigation: {
    nextEl: '.showcase-1 .swiper-button-next',
    prevEl: '.showcase-1 .swiper-button-prev'
  },
  spaceBetween: 5,
  slidesPerView: 2.1,
  breakpoints: {
    768: {
      slidesPerView: 3.1
    },
    991: {
      spaceBetween: 40,
      slidesPerView: 1
    },
    1090: {
      spaceBetween: 40,
      slidesPerView: 2
    }
  }
});

var swiper = new Swiper(".showcase-2 .swiper", {
  navigation: {
    nextEl: '.showcase-2 .swiper-button-next',
    prevEl: '.showcase-2 .swiper-button-prev'
  },
  spaceBetween: 5,
  slidesPerView: 2.1,
  breakpoints: {
    768: {
      slidesPerView: 3.1
    },
    991: {
      spaceBetween: 20,
      slidesPerView: 4
    },
    1090: {
      spaceBetween: 16,
      slidesPerView: 6
    }
  }
});


var swiper = new Swiper(".showcase-3 .swiper", {
  navigation: {
    nextEl: '.showcase-3 .swiper-button-next',
    prevEl: '.showcase-3 .swiper-button-prev'
  },
  spaceBetween: 5,
  slidesPerView: 2.1,
  breakpoints: {
    768: {
      slidesPerView: 3.1
    },
    991: {
      spaceBetween: 20,
      slidesPerView: 4
    },
    1090: {
      spaceBetween: 16,
      slidesPerView: 6
    }
  }
});


var swiper = new Swiper(".brands .swiper", {
  navigation: {
    nextEl: '.brands .swiper-button-next',
    prevEl: '.brands .swiper-button-prev'
  },
  autoplay: {
    delay: 3000,
  },
  spaceBetween: 20,
  slidesPerView: 2,
  breakpoints: {
    991: {
      slidesPerView: 7
    },
  }
});
