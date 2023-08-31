window.addEventListener("load", generateRABanner())

var swiper = new Swiper(".subcategories .swiper", {
  navigation: {
    nextEl: '.subcategories .swiper-button-next',
    prevEl: '.subcategories .swiper-button-prev'
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

function generateRABanner() {
  let link = document.createElement("a"), image = document.createElement("img"), vitrine = document.querySelector(".spots.d-flex.row");

  image.src = "https://abcdaconstrucao.fbitsstatic.net/img/b/898c46b6-5a8b-45ec-9b5d-0d31889a3386.jpg";
  image.alt = "Banner Realidade Aumentada";

  link.href = "/realidade-aumentada";
  link.classList.add("spot-banner");
  link.appendChild(image);

  vitrine.querySelector(".spot:nth-child(4)").after(link);
}