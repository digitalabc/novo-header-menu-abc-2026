
/**
 * SharpSpring function to send data
 */

var __ss_noform = __ss_noform || [];

function sendSharpSpring(campos, componente) {
  let formSharp = '';

  switch (componente) {
    case 'newsletter':
      formSharp = 'c799f48e-eebe-4c61-8862-d489d4aeddc9';
      campos.canal = 'Site Newsletter';
      break;

    case 'primeira-compra':
      formSharp = '4b33d785-88f6-4006-a90a-12fc47e7dc50';
      campos.canal = 'Site Primeira Compra';
      break;

    case 'aviseme':
      formSharp = 'f6cd0f91-1758-4a18-9dc5-f4082862ca4c';
      campos.canal = 'Site Avise me disponível'
      break;    

    case 'franquia':
      formSharp = 'db4e4d50-3ad5-47ed-b624-b1a2fa2ed8a9';
      campos.canal = 'Site Diretório de Lojas';
      break;
    
    case 'whats_form':
      formSharp = '954c7b40-8da6-436f-a98f-e8114cb417d6';
      campos.canal = 'Site WhatsApp';
      break;

    default:
      break;
  }

  $.ajax({
    url: `https://app-3QNTA3QZ8S.marketingautomation.services/webforms/receivePostback/MzawMLE0tjQ0AwA/${formSharp}/jsonp/`,
    dataType: 'jsonp',
    type: "POST",
    data: campos,
    jsonp: 'false',
    jsonpCallback: 'shspCallback'
  }).always(() => {
    if (__ss_noform) {
      if (componente === 'newsletter') {
        dataLayer.push({ 'event': 'formClubeABC' });
      }
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
      __ss_noform = [];
    } else {
      if (componente == "franquia") {
        document.querySelector(".cidade__fale-conosco__button").value = "ERRO AO ENVIAR"
        document.querySelector(".cidade__fale-conosco__button").setAttribute("disabled", false)
      }
      console.warn("SharpSpring error")
    }
  }
  );

  fetch('https://leadwake.br-s1.cloudhub.io/api/lead', {
      method: 'POST',
      headers: {
        client_id: 'e401c05d6f09493aa2b87b44fe57d26f',
        client_secret: '302c3BFffa284A78b192Ebc48a47461c',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "name": "PauloRodaABC Primeira Compra Teste",
        "email": "paulo.junior@abcdaconstrucao.com.br",
        "aceito": "Não",
        "canal": "Site Primeira Compra"
    })
  })
    .then(response => response.json())
    .then(response => {
      console.log('response lead', response);
      // if (response.successful) {
      //   switch (componente) {
      //     case 'newsletter':
      //       dataLayer.push({ 'event': 'formClubeABC' });
      //       break;

      //     case 'franquia':
      //       document.querySelector(".cidade__fale-conosco__button").value = "ENVIADO!"
      //       document.querySelector(".cidade__fale-conosco__button").setAttribute("disabled", true)
      //       $("#especialista_name").val("")
      //       $("#especialista_email").val("")
      //       $("#especialista_phone").val("")
      //       $("#especialista_stage").val("")
      //       document.getElementById("acceptTerms_politica").checked = false
      //       document.getElementById("acceptTerms_catalogo").checked = false
      //       document.getElementById("acceptTerms_obra").checked = false
      //       break;

      //     default:
      //       break;
      //   }
      // } else {
      //   if (componente == "franquia") {
      //     document.querySelector(".cidade__fale-conosco__button").value = "ERRO AO ENVIAR"
      //     document.querySelector(".cidade__fale-conosco__button").setAttribute("disabled", false)
      //   }
      // }
    })
    .catch((err) => { console.error(err); });

}
