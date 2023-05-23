
const regiao_1 = ['MG']
const regiao_2 = ['SP']
const regiao_3 = ['RJ']

document.addEventListener('DOMContentLoaded', function () {
  var element = document.querySelector('input[name=\"zipcode\"]');
  var maskOptions = {
    mask: '00000-000'
  };
  var mask = IMask(element, maskOptions);

  document.getElementById("teste").setAttribute("disabled", true).style.display = "none";

  document.querySelector('input[name="zipcode"]').addEventListener("keyup", function () {
    let cepCodigo = this.value
    if (cepCodigo.length === 9) {
      const request = new Request('https://viacep.com.br/ws/' + this.value + '/json/');

      fetch(request)
        .then(response => {
          if (response.status === 200) {
            return response.json();
          } else {
            throw new Error('cep errado');
          }
        })
        .then(data => {
          if (data['erro'])
            alert("Formato de CEP inválido.");
          else {
            document.getElementById("stateForm").value = data['uf'];
            var event = new Event('change');
            document.getElementById("stateForm").dispatchEvent(event);

            localStorage.setItem("Estado", data['uf']);
            localStorage.setItem("ultima_atualizacao", Date.now().toString());
            console.log(cepCodigo[0], 'posicao');
          }
        });
    }
  });
  $('select#stateForm').on('change', function () {
    if ($('select#stateForm').val() == '') {
      $('#teste').hide()
    } else {
      $('#teste').show()
    }
  })

  $('#page-location .btn-sucess').click(function (e) {
    e.preventDefault();
    checa_regiao($('select#stateForm').val());
    localStorage.setItem("Estado", $('select#stateForm').val());
    localStorage.setItem("ultima_atualizacao", Date.now().toString());
  })
});


function checa_regiao(estado) {

  if (regiao_1.includes(estado)) {

    console.log('regiao 1')
    Fbits.Parceiro.Set('regiao_1')
    window.location.href = "/parceiros/regiao_1";


  } else if (regiao_3.includes(estado)) {
    Fbits.Parceiro.Set('regiao_3')
    console.log('regiao 3')
    window.location.href = "/parceiros/regiao_3";

  } else {
    Fbits.Parceiro.Set('regiao_2')
    console.log('regiao 2')
    window.location.href = "/parceiros/regiao_2";
  }

}
