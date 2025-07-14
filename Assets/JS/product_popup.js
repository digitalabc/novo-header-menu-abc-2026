let test;
(() => {
  setTimeout(() => {
      document
          .getElementById("abc-fale-especialista")
          .classList.toggle("abc-fale-especialista-open");
  }, 2000);

  document
      .querySelector(".abc-fale-especialista-whatsapp > a ")
      .addEventListener("click", function () {
          document
              .getElementById("abc-fale-especialista")
              .classList.toggle("abc-fale-especialista-open");
      });
  document
      .querySelector("#abc-fale-especialista")
      .addEventListener("click", function () {
          document
              .getElementById("abc-fale-especialista")
              .classList.toggle("abc-fale-especialista-open");
      });
})();