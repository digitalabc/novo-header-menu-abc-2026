if (window.innerWidth < 768) {
    var swiper = new Swiper(".beneficiosPrime__ruler .swiper", {
        slidesPerView: 1.5,

    });
}

var swiper = new Swiper(".beneficiosPrime__benefits .swiper", {
    navigation: {
        nextEl: '.beneficiosPrime__benefits .swiper-button-next',
        prevEl: '.beneficiosPrime__benefits .swiper-button-prev'
    },
    spaceBetween: 12,
    slidesPerView: 1.5,
    breakpoints: {
        991: {
            spaceBetween: 16,
            slidesPerView: 3
        }
    }

});

var swiper = new Swiper(".primeReviews__list .swiper", {
    navigation: {
        nextEl: '.primeReviews__list .swiper-button-next',
        prevEl: '.primeReviews__list .swiper-button-prev'
    },
    spaceBetween: 12,
    slidesPerView: 1.3,
    breakpoints: {
        991: {
            spaceBetween: 16,
            slidesPerView: 4
        },
        768:{
            slidesPerView: 2.5
        }
    }

});

document.addEventListener('DOMContentLoaded', function () {
    var isDesktop = window.matchMedia("(min-width: 768px)").matches;
    var swiperOptions = {
        spaceBetween: 12,
        slidesPerView: 1.5,
        breakpoints: {
            991: {
                spaceBetween: 0,
                slidesPerView: 3
            },
            768: {
                spaceBetween: 12,
                slidesPerView: 3
            }
        }
    };

    if(isDesktop){
        swiperOptions.autoplay = {
            delay: 3000,
        };
    }
    var swiper = new Swiper(".showcasePrime__content .swiper", swiperOptions)
})

document.addEventListener("DOMContentLoaded", function () {
    document.addEventListener("mouseleave", function (e) {
        if (e.clientY < 0) {
            document.getElementById("exitModal").style.display = "block";
            document.body.classList.add("modal-open");
        }
    });
});


function modalClose() {
    document.getElementById("exitModal").style.display = "none";
    document.body.classList.remove("modal-open");
}

window.addEventListener("scroll", (event) => {    
    let scroll = this.scrollY;

    if(scroll > 400) {
        document.querySelector('.beneficiosPrime__ruler').classList.add('floating');
    } else {
        document.querySelector('.beneficiosPrime__ruler').classList.remove('floating');
    }
});