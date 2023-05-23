document.addEventListener('DOMContentLoaded', function () {

  var dataString = 'c=listagemEstados';
  
  fetch(`https://blog.abcdaconstrucao.com.br/atendimento/ajax/sac.ajax.php`, {
    method: "POST",
    cache: "no-cache",
    body: dataString, 
    }).then(function (data) {
      console.log(data);
      const estado = document.getElementById("estado")
      estado.innerHTML = response;
    }).catch(function (error) {
      console.warn(error);
    })

  document.querySelector(".copacabana-modal-close").addEventListener("click", function(){
    toggle(document.getElementById("copacabana-modal"))
  }, false);
  document.querySelector(".copacabana-modal-btn").addEventListener("click", function(){
    toggle(document.getElementById("copacabana-modal"))
  }, false);
}); //fim principal

document.getElementById("estado").addEventListener("change", function(){
  getElementById("cidade").innerHTML("<option>Aguarde...</option>");
  var estado = document.querySelector("#estado option:selected").getAttribute("value");
  var dataString = "c=consultaCidade&estado=" + estado;
  
  fetch(`https://blog.abcdaconstrucao.com.br/atendimento/ajax/sac.ajax.php`, {
    method: "POST",
    cache: "no-cache",
    body: dataString, 
    }).then(function (data) {
      console.log(data);
      const cidade = document.getElementById("cidade")
      cidade.innerHTML = response;
    }).catch(function (error) {
      console.warn(error);
    })

}, false);

document.getElementById("btnFormulario").addEventListener("click", function(){

  var nome = document.getElementById("nome").value.toUpperCase();
  var email = document.getElementById("email").value.toUpperCase();
  var telefone = document.getElementById("telefone").value.toUpperCase();
  
  var cliente_especificador = document.querySelector("input[name=paracliente]:checked").getAttribute("class");

  var cidade = document.querySelector("#cidade option:selected").value;
  var estado = document.querySelector("#estado option:selected").innerHTML;

  //se nao foi escolhido/undefined entao true
  var cliente_especificadorValid = (typeof cliente_especificador == 'undefined') ? false : true;


  if (
    valid(nome, "nome", "Nome completo") ||
    validaEmail(email) ||
    validaTelefone(telefone) ||
    valid(cliente_especificadorValid, "cliente_especificador", "") ||F
    valid(estado, "estado", "Estado") ||
    valid(cidade, "cidade", "Cidade")
  ) {
    console.log('erro');
    document.querySelector('.copacabana-modal-text').innerHTML = 'Todos os campos são obrigátorios.'
    document.querySelector('.copacabana-modal-btn').style.backgroundColor = '#e31837';
    toggle(document.getElementById("copacabana-modal"))
    return false;
  }

  var post = {};
  post["c"] = "formulario";
  post["nome"] = nome;
  post["email"] = email;
  post["telefone"] = telefone;
  post["cliente_especificador"] = cliente_especificador;
  post["cidade"] = cidade;
  post["estado"] = estado;
  post["assunto"] = "LANDINGPAGE BARRA DA TIJUCA";

  toggle(document.getElementById("EnviaFormulario"))
  load("#loadForm", true);

  fetch(`https://blog.abcdaconstrucao.com.br/atendimento/ajax/landingpage.ajax.php`, {
    method: "POST",
    cache: "no-cache",
    body: post, 
    }).then(function (data) {
      console.log(data);
    }).catch(function (error) {
      console.warn(error);
  })
  // $.ajax({
  //     type: "POST",
  //     url:
  //         "https://blog.abcdaconstrucao.com.br/atendimento/ajax/landingpage.ajax.php",
  //     data: post,
  //     cache: false,
  //     success: function (response) {
  //         $("#controleformulario").show("fast");
  //         $("#EnviaFormulario").show("fast");
  //         load("#loadForm", false);

  //         console.log(response);

  //         if (response != "") {

  //           $("#EnviaFormulario").html('<div class="clear"></div><p class="textoObrigado">Obrigado por se cadastrar. Acesse seu e-mail, pegue seu cupom e aproveite!</p>').
  //           show().
  //           css({
  //           "display":"block","overflow":"hidden", "border": "3px solid rgb(255 255 255)","text-align": "center","padding": "30px 15px"
  //           });

  //           $('html, body').animate({scrollTop: $("#formBarradatijuca").offset().top}, 1000);

  //           dito.identify({
  //               id: dito.generateID(email),
  //               name: nome,
  //               email: email,
  //               cliente_especificador: cliente_especificador,
  //               data: {
  //                   telefone: telefone,
  //               },
  //           });

  //           dito.track({
  //               action: "preencheu-formulario-barra-da-tijuca-rj",
  //               data: {
  //                   nome: nome,
  //                   email: email,
  //                   telefone: telefone,
  //                   cliente_especificador: cliente_especificador,
  //                   estado: estado,
  //                   cidade: cidade,
  //               },
  //           });


  //       } else {
  //           $("#EnviaFormulario").show();
    
  //           alert(
  //               "Houve um erro interno, tente novamente mais tarde ou entre em contato conosco pelo telefone."
  //           );
  //       }
  //     },
  // });

}, false);