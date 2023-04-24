
/**
 * SharpSpring function to send data
 */

var __ss_noform = __ss_noform || [];

function sendSharpSpring(campos, componente) {
  let formSharp = '';

  switch (componente) {
      case 'newsletter':
          formSharp = '4b33d785-88f6-4006-a90a-12fc47e7dc50';
          break;
      case 'aviseme':
          formSharp = 'f6cd0f91-1758-4a18-9dc5-f4082862ca4c';
          break;

          default:
          break;
  }
  fetch(`https://app-3QNTA3QZ8S.marketingautomation.services/webforms/receivePostback/MzawMLE0tjQ0AwA/${formSharp}/jsonp/`, {
    method: "POST",
    mode: "no-cors", 
    headers: {
      "Content-Type": "application/json",
    },
    body: campos, 
    }).then(function (data) {
      console.log(data);
    }).catch(function (error) {
      console.warn(error);
    }).finally(function() { 
      if (__ss_noform) {
        console.log('ShpSp...');
        if (componente === 'newsletter') {
          dataLayer.push({ 'event': 'formClubeABC' });        
        }
      }
    });
}
