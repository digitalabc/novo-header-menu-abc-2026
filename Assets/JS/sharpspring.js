
function sendSharpSpring(campos, componente) {
  let formSharp = '';

  switch (componente) {
    case 'newsletter':
      campos.canal = 'Site Newsletter';
      break;

    case 'primeira-compra':
      campos.canal = 'Site Primeira Compra';
      break;

    case 'aviseme':
      campos.canal = 'Site Avise me disponível'
      break;    

    case 'franquia':
      campos.canal = 'Site Diretório de Lojas';
      break;
    
    case 'whats_form':
      campos.canal = 'Site WhatsApp';
      break;

    default:
      break;
  }

  if (!campos.hasOwnProperty('telefone')) {
    campos.telefone = '';
  }

  fetch('https://leadwake.br-s1.cloudhub.io/api/lead', {
    method: 'POST',  
    headers: {
      client_id: 'e401c05d6f09493aa2b87b44fe57d26f',
      client_secret: '302c3BFffa284A78b192Ebc48a47461c',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(campos)
  })
    .then(response => response.json())
    .then((response) => {
      if (response.successful) {
        switch (componente) {
          case 'newsletter':
            dataLayer.push({ 'event': 'formClubeABC' });
            break;

          case 'franquia':
            document.querySelector(".cidade__fale-conosco__button").value = "ENVIADO!"
            document.querySelector(".cidade__fale-conosco__button").setAttribute("disabled", true)
            $("#especialista_name").val("")
            $("#especialista_email").val("")
            $("#especialista_phone").val("")
            $("#especialista_stage").val("")
            document.getElementById("acceptTerms_politica").checked = false
            document.getElementById("acceptTerms_catalogo").checked = false
            document.getElementById("acceptTerms_obra").checked = false
            break;

          default:
            break;
        }
      } else {
        if (componente == "franquia") {
          document.querySelector(".cidade__fale-conosco__button").value = "ERRO AO ENVIAR"
          document.querySelector(".cidade__fale-conosco__button").setAttribute("disabled", false)
        }
      }
    })
    .catch(err => console.error(err)); 

}
