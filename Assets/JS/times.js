function cidades() {
  fetch(`https://blog.abcdaconstrucao.com.br/atendimento/ajax/sac.ajax.php`, {
    method: "POST",
    cache: "no-cache",
    body: "c=lojasTray&tipo=regiao&estado=MG",
  }).then(function (data) {
    const cidade = document.querySelector(".section-duvidas .duvida:last-child > span")
    cidade.innerHTML = response;
  }).catch(function (error) {
    console.warn(error);
  })
}

function abcEnvia_contato(endpoint) {

  let countErrors = 0;
  let nome = document.querySelector('input[placeholder="Nome"]');
  let email = document.querySelector('input[placeholder="E-mail"]');
  let celular = document.querySelector('input[placeholder="Celular"]');

  if (nome.value == '') {
    nome.classList.add('error-formulario');
    countErrors++;
  }

  if (email.value == '') {
    email.classList.add('error-formulario');
    countErrors++;
  }

  if (celular.value == '') {
    celular.classList.add('error-formulario');
    countErrors++;
  }

  if (countErrors == 0) {

    let campos = {
      'nome': nome.value,
      'email': email.value,
      'celular': celular.value
    };

    $.ajax({
      url: `https://app-3QNTA3QZ8S.marketingautomation.services/webforms/receivePostback/MzawMLE0tjQ0AwA/${endpoint}/jsonp/`,
      dataType: 'jsonp',
      type: "POST",
      data: campos,
      jsonp: 'false',
      jsonpCallback: 'shspCallback'
    }).always(() => {
      var formulario = document.querySelector(".formulario");
      formulario.parentNode.removeChild(formulario);

      if (__ss_noform) {
        var p = document.createElement('p');
        p.innerHTML = `<span class="msg-formulario"><p>Cadastro feito com sucesso!</p></span>`;
        document.querySelector(".texto").append(p.cloneNode(true));

        document.querySelector('input[placeholder="Nome"]').classList.remove('error-formulario');
        document.querySelector('input[placeholder="E-mail"]').classList.remove('error-formulario');
        document.querySelector('input[placeholder="Celular"]').classList.remove('error-formulario');
        __ss_noform = [];

      } else {
        var p = document.createElement('p');
        p.innerHTML = `<span class="msg-formulario"><p>Ocorreu um problema no envio. Por favor,tente mais tarde.</p></span>`;
        document.querySelector(".texto").append(p.cloneNode(true));
      }
    }
    );

  } else {
    document.querySelector('.times-modal-text').innerHTML = 'Todos os campos são obrigátorios.';
    document.querySelector('.times-modal-btn').style.backgroundColor = '#e31837';
    toggle(document.getElementById("times-modal"))
  }
};

/* MÁSCARA */

var element = document.getElementById('inp-telefone')
var maskOptions = {
  mask: '(00) 00000-0000'
};
var mask = IMask(element, maskOptions);

document.addEventListener('DOMContentLoaded', function () {
  cidades();

  document.querySelector('.times-modal-close').addEventListener("click", function () {
    toggle(document.getElementById("times-modal"))
  });
  document.querySelector('.times-modal-btn').addEventListener("click", function () {
    toggle(document.getElementById("times-modal"))
  });

  // document.querySelector('.formulario > button').addEventListener("click", function (e) {
  //   e.preventDefault();
  //   abcEnvia_contato();
  // });

});

document.addEventListener('DOMContentLoaded', function () {
  setTimeout(() => {
    document.querySelector('#popconvert-iframe-pcw-container .pcwbtn').addEventListener("click", function () {
      let pcwNome = document.querySelector('input[placeholder="Seu nome"]').value;
      let pcwCelular = document.querySelector('input[placeholder="Seu celular"]').value;
      localStorage.setItem('abc_pcw_temp', JSON.stringify({ pcwNome, pcwCelular }));
    });

    $('#popconvert-iframe-pcw-container').on('click', '.the-button', () => {
      let pcwCampanhaABC = JSON.parse(localStorage.getItem('pcwApp_www.abcdaconstrucao.com.br_1591'));
      let pcwABCTemp = JSON.parse(localStorage.getItem('abc_pcw_temp'));
      let sharpDados = {
        email: pcwCampanhaABC.userAlreadyJoined,
        coupon: pcwCampanhaABC.prizeForWinner.data.coupon,
        nome: pcwABCTemp.pcwNome,
        celular: pcwABCTemp.pcwCelular
      };

      __ss_noform = [];

      sendSharpSpring(sharpDados, "time")
    });
  }, 8000);
});
