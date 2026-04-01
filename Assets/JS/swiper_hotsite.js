function generateRABanner() {
  let link = document.createElement("a"), image = document.createElement("img"), vitrine = document.querySelector(".spots.d-flex.row");

  image.src = "https://abcdaconstrucao.fbitsstatic.net/img/b/898c46b6-5a8b-45ec-9b5d-0d31889a3386.jpg";
  image.alt = "Banner Realidade Aumentada";

  link.href = "/realidade-aumentada";
  link.classList.add("spot-banner");
  link.appendChild(image);

  vitrine.querySelector(".spot:nth-child(4)").after(link);
}