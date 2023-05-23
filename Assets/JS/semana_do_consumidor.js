document.addEventListener('DOMContentLoaded', function () {

  document.querySelectorAll('.showcase[data-showcase="cronometer"] .spot').forEach(function (el, index) {
    if (document.querySelector(`#promotion-sold-${index}`) && document.querySelector(`#promotion-total-${index}`)) {
      let sold = document.querySelector(`#promotion-sold-${index}`).value
      let total = document.querySelector(`#promotion-total-${index}`).value
      let progress = (sold * 100) / total
      
      var p = document.createElement('p');
      p.classList.add('overlay')
      p.innerHTML = `
      <div class="products-sold">
        <span class="products-sold__progress" style="width:${progress}%"></span>
        <span class="products-sold__qtd">${sold} VENDIDOS</span>
      </div>
      <div class="cronometro">
        <span>TERMINA EM</span>
        <span class="cron">
          <span class='days'>
            8D
          </span>
          :
          <span class='hours'>
            24
          </span>
          :
          <span class='minutes'>
            59
          </span>
          :
          <span class='seconds'>
            59
          </span>
        </span>
      </div>
      `;
      el.querySelector(".spot__content-price").append(p.cloneNode(true));

    }
  });

  //cronometro
  let promodate = document.getElementById('cronometro').getAttribute('data-promotion')
  console.log(promodate)
  let count = new Date(promodate).getTime();
  const d = new Date().getTime();

  if(count > d){
      const second = 1000, minute = second * 60, hour = minute * 60, day = hour * 24;

      var data = promodate;
      var falta = (new Date(data).getTime() - new Date().getTime()) / 1000;
      var segundos = Math.round(falta % 60);
      var minutos = Math.round(falta / 60 % 60);
      var horas = Math.round(falta / 60 / 60 % 24);
      var dias = Math.round(falta / 60 / 60 / 24);
      if (segundos == 0) {
          segundos = 60;
          minutos--;
      }
      if (minutos == 0) {
          minutos = 60;
          horas--;
      }
      if (horas == 0) {
          horas = 24;
          dias--;
      }
      segundos--;
      let $days = document.querySelector('.cron .days')
      let $hours = document.querySelector('.cron .hours')
      let $minutes = document.querySelector('.cron .minutes')
      let $seconds = document.querySelector('.cron .seconds')
      $days.innerHTML = dias + 'D';
      $hours.innerHTML = horas < 10 ? '0' + horas : horas ;
      $minutes.innerHTML = minutos < 10 ? '0' + minutos: minutos;
      $seconds.innerHTML = segundos< 10 ? '0' + segundos : segundos;

      document.querySelector('#cronometro .cron').style.opacity = 1

      setInterval(function () {
          if (segundos == 0) {
              segundos = 60;
              minutos--;
          }
          if (minutos == 0) {
              minutos = 60;
              horas--;
          }
          if (horas == 0) {
              horas = 24;
              dias--;
          }
          segundos--;
          $days.innerHTML = dias + 'D';
          $hours.innerHTML = horas < 10 ? '0' + horas : horas ;
          $minutes.innerHTML = minutos < 10 ? '0' + minutos: minutos;
          $seconds.innerHTML = segundos< 10 ? '0' + segundos : segundos;

      }, 1000);
  }


})

var swiper = new Swiper(".fullbanner .swiper", {
  loop: true,
  autoplay: {
    delay: 3000,
  },
});

var swiper = new Swiper(".showcase-cronometer .swiper", {
  navigation: {
    nextEl: '.showcase-cronometer .swiper-button-next',
    prevEl: '.showcase-cronometer .swiper-button-prev'
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
var swiper = new Swiper(".showcase-3 .swiper", {
  navigation: {
    nextEl: '.showcase-3 .swiper-button-next',
    prevEl: '.showcase-3 .swiper-button-prev'
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
var swiper = new Swiper(".showcase-4 .swiper", {
  navigation: {
    nextEl: '.showcase-4 .swiper-button-next',
    prevEl: '.showcase-4 .swiper-button-prev'
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
var swiper = new Swiper(".showcase-5 .swiper", {
  navigation: {
    nextEl: '.showcase-5 .swiper-button-next',
    prevEl: '.showcase-5 .swiper-button-prev'
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
var swiper = new Swiper(".showcase-6 .swiper", {
  navigation: {
    nextEl: '.showcase-6 .swiper-button-next',
    prevEl: '.showcase-6 .swiper-button-prev'
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