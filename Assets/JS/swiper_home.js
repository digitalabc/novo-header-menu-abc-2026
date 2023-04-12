var swiper = new Swiper(".fullbanner .swiper", {
  loop: true,
  autoplay: {
    delay: 3000,
  },
});

var swiper = new Swiper(".banner-oportunidades .mobile .swiper:first-child", {
  spaceBetween: 10,
  slidesPerView: 'auto'
});

var swiper = new Swiper(".banner-grid .swiper:first-child", {
  spaceBetween: 20,
  slidesPerView: 1,
  breakpoints: {
    991: {
      slidesPerView: 3
    }
  }
});

var swiper = new Swiper(".banner-grid div:nth-child(2)", {
  spaceBetween: 20,
  slidesPerView: 1,
  breakpoints: {
    991: {
      slidesPerView: 2
    }
  }
});

var swiper = new Swiper(".departments .swiper", {
  navigation: {
    nextEl: '.departments .swiper-button-next',
    prevEl: '.departments .swiper-button-prev'
  },
  spaceBetween: 10,
  slidesPerView: 'auto',
  breakpoints: {
    991: {
      spaceBetween: 20,
      slidesPerView: 8
    }
  }
});

var swiper = new Swiper(".environments .swiper", {
  navigation: {
    nextEl: '.environments .swiper-button-next',
    prevEl: '.environments .swiper-button-prev'
  },
  spaceBetween: 10,
  slidesPerView: 'auto',
  breakpoints: {
    991: {
      spaceBetween: 20,
      slidesPerView: 4
    }
  }
});

var swiper = new Swiper(".banner-centro.desktop .swiper", {
  spaceBetween: 20,
  slidesPerView: 3
});

var swiper = new Swiper(".brands .swiper", {
  slidesPerView: 2,
  navigation: {
    nextEl: '.brands .swiper-button-next',
    prevEl: '.brands .swiper-button-prev'
  },
  autoplay: {
    delay: 3000,
  },
  breakpoints: {
    991: {
      spaceBetween: 20,
      slidesPerView: 7
    }
  }
});

var swiper = new Swiper(".stores .swiper", {
  navigation: {
    nextEl: '.stores .swiper-button-next',
    prevEl: '.stores .swiper-button-prev'
  },
  spaceBetween: 10,
  slidesPerView: 'auto',
  breakpoints: {
    991: {
      spaceBetween: 20,
      slidesPerView: 6.2
    }
  }
});

if(MOBILE.matches) {
  var swiper = new Swiper(".blog .swiper", {
    slidesPerView: 'auto',
    spaceBetween: 20,
  });
}

var swiper = new Swiper(".banner-instagram .swiper", {
  spaceBetween: 10,
  slidesPerView: 'auto',
  breakpoints: {
    991: {
      spaceBetween: 25,
      slidesPerView: 5
    }
  }
});

var swiper = new Swiper(".showcase-1 .swiper", {
  navigation: {
    nextEl: '.showcase-1 .swiper-button-next',
    prevEl: '.showcase-1 .swiper-button-prev'
  },
  slidesPerView: 2.1,
  spaceBetween: 5,
  breakpoints: {
    768: {
      slidesPerView: 3.1,
      spaceBetween: 5,
    },
    1090: {
      slidesPerView: 4,
      spaceBetween: 20
    },
    1090: {
      slidesPerView: 5,
      spaceBetween: 20
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
      slidesPerView: 4,
      spaceBetween: 20
    },
    1090: {
      slidesPerView: 5,
      spaceBetween: 20
    }
  }
});
