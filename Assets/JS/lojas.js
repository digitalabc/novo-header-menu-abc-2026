; 
var map;
var lojas = [];
var marcadores = [];
var geocoder;
var directionsService;
var directionsDisplay;
var enderecosPesquisados = [];
var cidade = "";
var estado = "";
var pickupStore = false;
var destino;
var bounds;
var busca;

document.getElementById("pickupStore").addEventListener("click", function(){
  pickupStore = document.querySelector("#pickupStore:checked") ? true : false;
  getLojas();
});

document.getElementById("voltar-lojas").addEventListener("click", function(){
  document.getElementById("rota").style.display = "none"
  document.getElementById("busca").style.display = "block"
});

document.body.addEventListener('click', function(e) {
  if(e.target.id.includes('como-chegar-')) {
    var lojaId = $(this).attr("id").replace("como-chegar-", "");
    var latitude = parseFloat($("#latitude-" + lojaId).val().replace(",", "."));
    var longitude = parseFloat($("#longitude-" + lojaId).val().replace(",", "."));
    destino = new google.maps.LatLng(latitude, longitude);
    document.getElementById("rota").style.display = "block"
    document.getElementById("busca").style.display = "none"
    calcularRota(directionsService, directionsDisplay);
  }
});

function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        center: {
            lat: -23.6821604,
            lng: -46.8754997
        },
        zoom: 15
    });
    bounds = new google.maps.LatLngBounds();
    geocoder = new google.maps.Geocoder;
    directionsService = new google.maps.DirectionsService;
    directionsDisplay = new google.maps.DirectionsRenderer;
    directionsDisplay.setPanel(document.getElementById("resultado-navegacao"));
    directionsDisplay.setMap(map);
    getLojas();
}

function Deg2Rad(deg) {
    return deg * Math.PI / 180;
  }

  //Calcula a distancia das lojas
  function PythagorasEquirectangular(lat1, lon1, lat2, lon2) {
    lat1 = Deg2Rad(lat1);
    lat2 = Deg2Rad(lat2);
    lon1 = Deg2Rad(lon1);
    lon2 = Deg2Rad(lon2);
    var R = 6371; // km
    var x = (lon2 - lon1) * Math.cos((lat1 + lat2) / 2);
    var y = (lat2 - lat1);
    var d = Math.sqrt(x * x + y * y) * R;
    return d;
  }
    
function SortByName(a, b){
    var aName = a.dif;
    var bName = b.dif; 
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
}
    

function getLojas() {
    lojas = [];
    $.ajax({
        type: "POST",
        url: "https://www.abcdaconstrucao.com.br/Lojas/GetLojas",
        data: {
            somenteRetiradaNaLoja: pickupStore,
            cidade: cidade,
            estado: estado
        },
        success: function(data) {
            if (data) {            

                for (i = 0; i < data.Lojas.length; i++) {
                    if(busca){
                        var dif = PythagorasEquirectangular(busca.geometry.location.lat(), busca.geometry.location.lng(), data.Lojas[i].Latitude, data.Lojas[i].Longitude);
                        data.Lojas[i].dif = dif;
                        
                    }
                    lojas.push(data.Lojas[i]);
                }

                lojas.sort(SortByName); //Organiza os itens do array
                
                /*Monta o html com as lojas proximas */
                var lojasHtml = "";
                for(i = 0; i < lojas.length; i++)
                {
                    
                    lojasHtml += "<div id='loja-" + lojas[i].LojaId + "' class='loja'>";
                    lojasHtml += "<div class='nome'>" + lojas[i].Nome + "</div>";
                    lojasHtml += "<div class='endereco'>" + lojas[i].Logradouro + ", " + lojas[i].Numero + " - " + lojas[i].Bairro + "</div>";
                    lojasHtml += "<div class='cidade'>" + lojas[i].Cidade + " " + lojas[i].Estado.Sigla + "</div>";
                    lojasHtml += "<div class='telefone'>(" + lojas[i].Ddd + ") " + lojas[i].Telefone + "</div>";
                    lojasHtml += "<div class='texto'>" + lojas[i].TextoComplementar + "</div>";
                    lojasHtml += "<div class='como-chegar-" + lojas[i].LojaId + "'>";
                    lojasHtml += "<input type='hidden' id='latitude-" + lojas[i].LojaId + "' value='" + lojas[i].Latitude + "'/>";
                    lojasHtml += "<input type='hidden' id='longitude-" + lojas[i].LojaId + "' value='" + lojas[i].Longitude + "' />";
                    lojasHtml += "<span id='como-chegar-" + lojas[i].LojaId + "' class='como-chegar'>Como Chegar</span>";
                    lojasHtml += "</div>";
                    lojasHtml += "</div>";
                }


                $("#lojas").html(lojasHtml);
                $("#resultado-busca").show();
                removeMarcadores();
                exibirLojas();

                if(busca)
                {
                    map.setCenter(busca.geometry.location);
                    map.setZoom(10);       
                }               


            } else {
                alert("Erro ao tentar recuperar as lojas");
            }
        }
    });
}

function buscarEndereco() {
    var endereco = $("#txtEndereco").val();

    var numberPattern = /\D+/g;
    if (!endereco.match(numberPattern)) {
        if (endereco.length == 8) {
            endereco = endereco.substring(0, 5) + "-" + endereco.substr(5);
        }
    }

    geocoder.geocode({
        address: endereco,
        componentRestrictions: {
            country: "BR"
        }
    }, function(results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
            bounds = new google.maps.LatLngBounds();
            busca = results[0];

            for (var i = 0; i < enderecosPesquisados.length; i++) {
                enderecosPesquisados[i].setMap(null);
            }
            $("#endereco-buscado").text("Lojas próximas à  " + endereco);
            marker = new google.maps.Marker({
                map: map,
                position: results[0].geometry.location,
                animation: google.maps.Animation.DROP
            });

            enderecosPesquisados.push(marker);

            pickupStore = $("#pickupStore:checked").length > 0 ? true : false;

            for (i = 0; i < results[0].address_components.length; i++) {
                var componente = results[0].address_components[i];

                for (j = 0; j < componente.types.length; j++) {
                    if (componente.types[j] == "locality") {
                        cidade = componente.long_name;
                    }
                    if (componente.types[j] == "administrative_area_level_1") {
                        estado = componente.short_name;
                    }
                }
            }
            getLojas();
            if (results[0].address_components.length >1){
                bounds.extend(marker.getPosition());
            }
            map.fitBounds(bounds);
        } else {
            busca = null;
            alert("Ocorreu um erro ao tentar localizar o endereço pesquisado: " + status);
        }
    });
}

function exibirLojas() {
    var possuiMesmaCidade = false;
    var possuiMesmoEstado = false;

    for (i = 0; i < lojas.length; i++) {
        if (lojas[i].Estado.Sigla == estado) {
            possuiMesmoEstado = true;
        }
        if (lojas[i].Cidade == cidade) {
            possuiMesmaCidade = true;
        }
        processaLoja(lojas[i]);
        map.fitBounds(bounds);
    }   
}

function processaLoja(loja) {
    var infoLoja = '<div id="infoLoja" class="infoLoja"><div id="firstHeading" class="firstHeading">' + loja.Nome + '</div><div id="bodyContent" class="bodyContent">' + loja.TextoComplementar + "</div></div>";
    addStoreMarker(loja.Latitude, loja.Longitude, loja.Nome, infoLoja);
}

function addStoreMarker(latitude, longitude, title, info) {
    var infowindow = new google.maps.InfoWindow({
        content: info
    });

    var pos = new google.maps.LatLng(latitude, longitude);
    var image = 'https://recursos.abcdaconstrucao.com.br/i/place.png';
    var marker = new google.maps.Marker({
        position: {
            lat: latitude,
            lng: longitude
        },
        map: map,
        title: title,
        icon: image,
        animation: google.maps.Animation.DROP
    });
    marcadores.push(marker);
    bounds.extend(pos);
    map.fitBounds(bounds);
    marker.addListener("click", function() {
        infowindow.open(map, marker);
    });
}

function removeMarcadores() {
    for (i = 0; i < marcadores.length; i++) {
        marcadores[i].setMap(null);
    }
    marcadores = [];
}

function calcularRota(directionsService, directionsDisplay) {
    directionsService.route({
        origin: {
            lat: enderecosPesquisados[enderecosPesquisados.length - 1].position.lat(),
            lng: enderecosPesquisados[enderecosPesquisados.length - 1].position.lng()
        },
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING
    }, function(response, status) {
        if (status === google.maps.DirectionsStatus.OK) {
            directionsDisplay.setDirections(response);
        } else {
            alert("Ocorreu um problema ao tentar calcular a rota: " + status);
        }
    });
}

$(document).ajaxStart(() => {
  $('.lojas').addClass('spinnerBgLojas').append('<div class="spinnerLojas"></div>');
});

$(document).ajaxComplete(() => {
  $('.lojas').addClass('spinnerBgLojas').append('<div class="spinnerLojas"></div>');

  let listLoja = $('.lojas').children('.loja').get();

  listLoja.sort(function (a, b) {
    var compA = $(a).text().toUpperCase();
    var compB = $(b).text().toUpperCase();
    return (compA < compB) ? -1 : (compA > compB) ? 1 : 0;
  })

  let elemSorted = $.each(listLoja, function (idx, e) { return e; });
  $('.lojas').empty().html(elemSorted);
  $('.lojas').removeClass('spinnerBgLojas');
  $('.spinnerLojas').remove();

});

$(document).ready(() => {
  $('.solucoes .solucoes-slider').slick({
    speed: '600',
    autoplay: true,
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 4,
    arrows: false,
    dots: false,
    lazyLoad: 'ondemand',
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          centerMode: true,
          slidesToShow: 3,
          initialSlide: 2,
          slidesToScroll: 1,
          lazyLoad: 'ondemand'
        }
      },
      {
        breakpoint: 992,
        settings: {
          centerMode: true,
          slidesToShow: 2,
          initialSlide: 1,
          slidesToScroll: 1,
          lazyLoad: 'ondemand'
        }
      },
      {
        breakpoint: 768,
        settings: {
          centerMode: true,
          slidesToShow: 1,
          initialSlide: 0,
          slidesToScroll: 1,
          lazyLoad: 'ondemand'
        }
      }
    ]
  });
  {
    const boxNavigacao = document.querySelector('#navegacao');
    const sectionWrapper = document.querySelector('#wrapper');

    let sectionObOptions = {
      threshold: 0.75,
      rootMargin: "500px 0px -200px 0px"
    };

    if (window.matchMedia("only screen and (min-width: 998px)").matches) {
      sectionObOptions.rootMargin = "-200px 0px 250px 0px";
    }

    const sectionOb = new IntersectionObserver((entries, sectionOb) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          boxNavigacao.classList.add('mostrar')
          boxNavigacao.classList.remove('esconder')
        } else {
          boxNavigacao.classList.remove('mostrar')
          boxNavigacao.classList.add('esconder')
        }
      });
    }, sectionObOptions);

    sectionOb.observe(sectionWrapper);
  }
})

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