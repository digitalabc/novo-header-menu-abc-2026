
/**
 * SharpSpring function to send data
 */

var __ss_noform = __ss_noform || [];

function sendSharpSpring(campos, componente) {
  let formSharp = '';

  switch (componente) {
    case 'newsletter':
      formSharp = 'c799f48e-eebe-4c61-8862-d489d4aeddc9';
      break;

    case 'primeira-compra':
      formSharp = '4b33d785-88f6-4006-a90a-12fc47e7dc50';
      break;

    case 'aviseme':
      formSharp = 'f6cd0f91-1758-4a18-9dc5-f4082862ca4c';
      break;

    case 'time':
      formSharp = '82ea5d1e-63c5-4cc3-bca0-e6ece0a1e475';
      break;

    case 'franquia':
      formSharp = 'db4e4d50-3ad5-47ed-b624-b1a2fa2ed8a9';
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

        case 'time':
          console.log("TORCEDOR")
          break;

        case 'franquia':
          document.querySelector(".cidade__fale-conosco__button").value = "ENVIADO!"
          document.querySelector(".cidade__fale-conosco__button").setAttribute("disabled", true)
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
}
