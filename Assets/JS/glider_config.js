let banners_top = document.querySelector('.banners_top');
if(banners_top){
  const glider = new Glider(banners_top.querySelector('.glider_banners_top'), {
    slidesToShow: 1,
    dots: '#dots',
    draggable: true,
    scrollLock: true,
    rewind: true,
    arrows: {
      prev: '.glider-prev',
      next: '.glider-next'
    }
  });
  banners_top.classList.remove("invisible");
  sliderAuto(glider, banners_top, 5000);
}

if(document.querySelector('.new-release')){
  let el = document.querySelector('.new-release');
  const nr_glider = new Glider(document.querySelector('.glider_new-release'), {
    slidesToShow: 2,
    slidesToScroll: 2,
    draggable: true,
    scrollLock: true,
    rewind: true,
    arrows: {
      prev: '.new-release-prev',
      next: '.new-release-next'
    },
    responsive: [{
        breakpoint: 740,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          duration: 0.5
        }
      },{
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4,
          duration: 0.5
        }
      }
    ]
  });
  el.classList.remove('invisible');
  sliderAuto(nr_glider, el, 5000);
}

if(document.querySelector('.best-sellers')){
  let el = document.querySelector('.best-sellers');
  const bs_glider = new Glider(document.querySelector('.glider_best-sellers'), {
    slidesToShow: 2,
    slidesToScroll: 2,
    draggable: true,
    scrollLock: true,
    rewind: true,
    arrows: {
      prev: '.best-sellers-prev',
      next: '.best-sellers-next'
    },
    responsive: [{
        breakpoint: 740,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          duration: 0.5
        }
      },{
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4,
          duration: 0.5
        }
      }
    ]
  });
  el.classList.remove('invisible');
  sliderAuto(bs_glider, el, 5000);
}

if(document.querySelector('.brands')){
  new Glider(document.querySelector('.brands'), {
    slidesToShow: 1,
    draggable: true,
    scrollLock: true,
    rewind: true,
    arrows: {
      prev: '.brand-prev',
      next: '.brand-next'
    },
    responsive: [{
        breakpoint: 740,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          duration: 0.25
        }
      },{
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 1,
          duration: 0.25
        }
      }
    ]
  });  
}

if(document.querySelector('.recommendations')){
  let el = document.querySelector('.recommendations');
  new Glider(document.querySelector('.glider_recommendations'), {
    slidesToShow: 2,
    draggable: true,
    scrollLock: true,
    rewind: true,
    arrows: {
      prev: '.recommendations-prev',
      next: '.recommendations-next'
    },
    responsive: [{
        breakpoint: 740,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 3,
          duration: 0.25
        }
      },{
        breakpoint: 1024,
        settings: {
          slidesToShow: 4,
          slidesToScroll: 4,
          duration: 0.25
        }
      }
    ]
  });
  el.classList.remove('invisible');
}

function sliderAuto(slider, el, miliseconds) {
  let autoplayDelay = miliseconds;

  let timeout = -1;
  let hovering = false;
  function startTimeout() {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      if (!hovering) {
       let slideToGo = (slider.slide + 1) % (slider.slides.length - slider.opt.slidesToShow + 1);
       slider.scrollItem(slideToGo);
      }
    }, autoplayDelay);
  }

  let animID = 0;
  const isAnimating = () => slider.animate_id !== animID;
  el.addEventListener("glider-animated", () => {
    animID = slider.animate_id;
    if (!hovering) startTimeout();
  });

  function stopAnimation() {
    hovering = true;
    clearTimeout(timeout);
  }

  function startAnimation() {
    hovering = false;
    if (!isAnimating()) startTimeout();
  }

  el.addEventListener("mouseover", () => {
    stopAnimation();
  });

  el.addEventListener("touchstart", () => {
    stopAnimation();
  }, {passive: true});

  el.addEventListener("mouseout", () => {
    startAnimation();
  });

  el.addEventListener("touchend", () => {
    startAnimation();
  }, {passive: true});

  startTimeout();
}