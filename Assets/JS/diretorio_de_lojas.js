/*Função para a formatação de textos*/
if (!String.prototype.slugify) {
  String.prototype.slugify = function () {

    return this.toString().toLowerCase()
      .replace(/[àÀáÁâÂãäÄÅåª]+/g, 'a')       // Special Characters #1
      .replace(/[èÈéÉêÊëË]+/g, 'e')       	// Special Characters #2
      .replace(/[ìÌíÍîÎïÏ]+/g, 'i')       	// Special Characters #3
      .replace(/[òÒóÓôÔõÕöÖº]+/g, 'o')       	// Special Characters #4
      .replace(/[ùÙúÚûÛüÜ]+/g, 'u')       	// Special Characters #5
      .replace(/[ýÝÿŸ]+/g, 'y')       		// Special Characters #6
      .replace(/[ñÑ]+/g, 'n')       			// Special Characters #7
      .replace(/[çÇ]+/g, 'c')       			// Special Characters #8
      .replace(/[ß]+/g, 'ss')       			// Special Characters #9
      .replace(/[Ææ]+/g, 'ae')       			// Special Characters #10
      .replace(/[Øøœ]+/g, 'oe')       		// Special Characters #11
      .replace(/[%]+/g, 'pct')       			// Special Characters #12
      .replace(/\s+/g, '-')           		// Replace spaces with -
      .replace(/[^\w\-]+/g, '')       		// Remove all non-word chars
      .replace(/\-\-+/g, '-')         		// Replace multiple - with single -
      .replace(/^-+/, '')             		// Trim - from start of text
      .replace(/-+$/, '');            		// Trim - from end of text

  };
}

var swiper = new Swiper(".brands .swiper", {
  spaceBetween: 10,
  slidesPerView: 2,
  loop: true,
  autoplay: {
    delay: 3000,
  },
  breakpoints: {
    991: {
      spaceBetween: 25,
      slidesPerView: 6
    }
  }
});

/*Método esconde e mostra texto - Página diretorio de lojas*/
const btnMostrarMais_lojas = document.querySelector(".lojas__top--button");

if (btnMostrarMais_lojas) {
  btnMostrarMais_lojas.addEventListener("click", () => {
    let areaText = document.querySelector(".lojas__top--text")
    areaText.classList.toggle("show-text")
    let iconLojas = document.querySelector(".lojas__top--button")
    iconLojas.classList.toggle("rotate")
  })
}

/*Método esconde e mostra texto - Página de loja*/
const btnMostrarMais_loja = document.querySelector(".cidade__sobre-nos--button");

if (btnMostrarMais_loja) {
  btnMostrarMais_loja.addEventListener("click", () => {
    let areaText = document.querySelector(".cidade__sobre-nos--text")
    areaText.classList.toggle("show-text")
    let iconLojas = document.querySelector(".cidade__sobre-nos--button")
    iconLojas.classList.toggle("rotate")
  })
}

/*Método para os inputs da Página de Diretório de Lojas*/

function renderizarConteudo() {
  fetch("https://recursos.abcdaconstrucao.com.br/c/auaha/db_lojas.json?v=1")
    .then(response => response.json())
    .then(data => {
      criarOptions(data.estados);
      criarListaDeCidades(data.estados);
    })
};

let criarOptions = (estadosData) => {
  const listaEstados = document.querySelector(".lojas__form--select")
  if (listaEstados) {
    let listaOptionsString = `<option value="" default="true" selected>Selecione seu estado</option>`
    estadosData.forEach((estado) => {
      let stringEstado = estado.estado
      listaOptionsString += `<option value="${stringEstado}">${stringEstado}</option> `
    })
    listaEstados.innerHTML = listaOptionsString;
  }
}

renderizarConteudo();

// /*Renderizaçao de todos os estados e cidade em tela*/

let criarListaDeCidades = (estadosData) => {
  const listaFinal = $(".lojas__bottom--container")
  listaFinal.append('<div class="col col1"></div>')
  listaFinal.append('<div class="col col2"></div>')
  if (DESKTOP.matches) {
    listaFinal.append('<div class="col col3"></div>')
    listaFinal.append('<div class="col col4"></div>')
  }
  if (listaFinal) {
    estadosData.forEach((estado) => {
      let ulCompleta = criaLis(estado.cidades, estado)
      if (DESKTOP.matches) {
        listaFinal.find(`.col${estado.coluna}`).append(ulCompleta)
      }
      else {
        listaFinal.find(`.col${estado.coluna_mobile}`).append(ulCompleta)
      }
    })
  }
}

let criaLis = (listaCidades, estado) => {
  const ul = document.createElement("ul")
  const titleList = document.createElement("h3")
  ul.dataset.estado = estado.estado
  titleList.innerText = estado.estado
  let urlEstado = estado.estado.slugify();

  ul.appendChild(titleList)

  listaCidades.forEach((cidade) => {
    let li = document.createElement("li")
    let a = document.createElement('a')
    let urlCidade = cidade.slugify();
    a.setAttribute("href", `https://www.abcdaconstrucao.com.br/diretorio-de-lojas/${urlEstado}/${urlCidade}`)
    a.innerText = cidade
    li.appendChild(a)
    ul.appendChild(li)
  })
  // console.log(ul)
  return ul
}

$(".lojas__form--select").on("change", function () {
  $(".lojas__form--input").val("")
  $(".lojas__bottom--container li").show()
  if ($(this).val() != '') {
    $(".lojas__bottom--container .col").css("display", "contents")
    $(".lojas__bottom--container ul").hide()
    $(`.lojas__bottom--container ul[data-estado*="${$(this).val()}"]`).show()
  }
  else {
    $(".lojas__bottom--container .col").css("display", "flex")
    $(".lojas__bottom--container ul").show()
  }
})

$(".lojas__form--button").on("click", function () {
  let stateQuery = $(".lojas__form--select").val();
  let cityQuery = $(".lojas__form--input").val().slugify();

  console.log(stateQuery)
  console.log(cityQuery)

  if (cityQuery != '') {
    if (stateQuery == "") {
      $(".lojas__bottom--container ul").hide()
    }

    $(".lojas__bottom--container li").hide()
    $(`.lojas__bottom--container li a`).each(function () {
      let cityName = $(this).text().slugify();
      if (cityName.includes(cityQuery)) {
        $(this).parent().show()
        if (stateQuery == "") {
          $(this).parent().parent().show()
        }
      }
    })
  }
  else {
    $(".lojas__bottom--container li").show()
  }
})

function isStoreOpen(currentHour, currentMinutes, openingTime, closingTime) {

  let openingHour = openingTime.split(":")[0]
  let openingMinutes = openingTime.split(":")[1]
  let closingHour = closingTime.split(":")[0]
  let closingMinutes = closingTime.split(":")[1]

  // console.log(openingHour, openingMinutes, closingHour, closingMinutes)

  let isOpen = false
  // console.log((currentMinutes >= openingMinutes))
  if ((currentHour == openingHour) && (currentMinutes >= openingMinutes)) {
    isOpen = true
  }
  else if (currentHour > openingHour) {
    isOpen = true
  }
  if ((currentHour == closingHour) && (currentMinutes > closingMinutes)) {
    isOpen = false
  }
  else if (currentHour > closingHour) {
    isOpen = false
  }
  return isOpen
}

$(".template__card--time").each(function () {
  let $this = $(this)

  $this.find(".template__card--time--header").on("click", function () {
    $this.find(".template__card__dropdown").toggleClass("open")
  })

  let currentTime = new Date()
  let currentDay = currentTime.getDay()
  let currentHour = currentTime.getHours();
  // currentHour = 19
  let currentMinutes = currentTime.getMinutes();
  // currentMinutes = 0

  $this.find(`li[data-week-day="${currentDay}"]`).addClass("today")

  let timeText = $this.find(`li[data-week-day="${currentDay}"] .template__card__range`).text().trim()
  let timeRange = timeText.split(" ")
  let openingTime = timeRange[0]
  let closingTime = timeRange[2]

  $this.find(".template__card--range").html(timeText)

  if (timeText != "Fechado") {
    if (isStoreOpen(currentHour, currentMinutes, openingTime, closingTime)) {
      $this.find(".template__card--status").html('Aberto')
      $this.addClass("active")
    }
    else {
      $(this).find(".template__card--status").addClass("closed").html("Fechado")
      $this.addClass("active")
    }
  }
  else {
    $(this).find(".template__card--status").addClass("closed").html("Fechado")
    $this.addClass("active")
  }
})
if ($(".opening-hours").length) {
  let $this = $(".opening-hours")

  $this.find(".opening-hours__header").on("click", function () {
    $this.find(".opening-hours__dropdown").toggleClass("open")
  })

  let currentTime = new Date()
  let currentDay = currentTime.getDay()
  let currentHour = currentTime.getHours();
  let currentMinutes = currentTime.getMinutes();

  $this.find(`li[data-week-day="${currentDay}"]`).addClass("today")

  let timeText = $this.find(`li[data-week-day="${currentDay}"] .opening-hours__range`).text().trim()
  // timeText = "Fechado"
  let timeRange = $this.find(`li[data-week-day="${currentDay}"] .opening-hours__range`).text().split(" ")
  let openingTime = timeRange[0]
  let closingTime = timeRange[2]


  if (timeText != "Fechado") {
    if (isStoreOpen(currentHour, currentMinutes, openingTime, closingTime)) {
      $this.find(".opening-hours__status").html('<span class="opening-hours__dot"></span>Aberto')
      $this.find(".opening-hours__obs").html(`Fecha às ${closingTime}`)
      $this.find(".opening-hours__header").addClass("active")
    }
    else {
      $this.find(".opening-hours__status").html('<span class="opening-hours__dot red"></span>Fechado').addClass("closed")
      let openingHour = openingTime.split(":")[0]
      if (currentHour > openingHour) {
        let nextTimeRange = $this.find(`li[data-week-day="${currentDay + 1}"] .opening-hours__range`).text().split(" ")
        let nextOpeningTime = nextTimeRange[0]
        $this.find(".opening-hours__obs").html(`Abre às ${nextOpeningTime}`)
      }
      else {
        $this.find(".opening-hours__obs").html(`Abre às ${openingTime}`)
      }
      $this.find(".opening-hours__header").addClass("active")
    }
  }
  else {
    $this.find(".opening-hours__obs").html(`Fechado`)
    $this.find(".opening-hours__status").html('<span class="opening-hours__dot red"></span>Fechado').addClass("closed")
    $this.find(".opening-hours__header").addClass("active")
  }
}

$("#acceptTerms").on("change", function () {
  let submitButton = $(".cidade__fale-conosco__button")
  submitButton.prop('disabled', (i, v) => !v);
})


/**
 * Franquia
 */

$(".cidade__fale-conosco--form input, .cidade__fale-conosco--form select ").on("change", function (e) {
  let name = $("#especialista_name").val()
    , email = $("#especialista_email").val()
    , phone = $("#especialista_phone").val()
    , stage = $("#especialista_stage").val()
    , termsAccept = document.getElementById("acceptTerms_politica").checked

  if (name && email && phone && stage && termsAccept) {
    $(".cidade__fale-conosco__button").removeAttr("disabled")
  } else {
    $(".cidade__fale-conosco__button").attr("disabled", true)
  }
})

$(".cidade__fale-conosco--form").on("submit", function (e) {
  e.preventDefault()

  let name = $("#especialista_name").val()
    , email = $("#especialista_email").val()
    , phone = $("#especialista_phone").val()
    , stage = $("#especialista_stage").val()
    , catalogAccept = document.getElementById("acceptTerms_catalogo").checked
    , visitAccept = document.getElementById("acceptTerms_obra").checked

    , campos = {
      nome: name,
      email: email,
      whatsapp: phone,
      estagio_da_obra: stage,
      receber_catalogo: catalogAccept,
      receber_visita: visitAccept
    }

  sendSharpSpring(campos, "franquia");

})