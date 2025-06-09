
//variables
var logo_url = "https://yata-apix-93d012ec-4c75-4f53-98f2-f493481f90de.s3-object.locaweb.com.br/d91dde17b04b4287ab4443e3eee9f856.png";
var site_title = "ABC da Construção";
var hello_message = 'Olá! Tudo bem? Fale com nosso time de consultores via whatsapp e faça seu orçamento.';

function preWhatsappHandler(url) {

    formWpp = document.querySelector('#form-pre-whatsapp');
    dataFormWpp = [];

    if (formWpp) {

        formWppSubmit = formWpp.querySelector('.form-wpp-submit');

        formWppSubmit.addEventListener('click', function(){
            
            formWppName = formWpp.querySelector('.form-wpp-name').value;
            formWppEmail = formWpp.querySelector('.form-wpp-email').value;
            formWppPhone = formWpp.querySelector('.form-wpp-phone').value;
            formWppPhoneEmail = formWppPhone.replace('(', '').replace(')', '').replace(' ', '').replace('-', '');
            formWppPhone = formWpp.querySelector('.form-wpp-phone').value;
            /*if(formWppName != '' && formWppPhone != '' && formWppPhone.length == 15) {*/
            if(formWppName != '' && formWppPhone != '' && formWppPhone.length >= 11) {

                dataFormWpp = {
                    "event_name": "whatsapp_form_send",
                    "event_params": {
                      "name": formWppName,
                      "email": formWppEmail,
                      "phone": formWppPhone,                      
                      "current_url": location.href,
                      "cookies": getCookie("mm_tracker")
                    }
                };

                sendSharpSpring({ 
                    nome: formWppName,
                    email: formWppEmail,
                    telefone: formWppPhone,                      
                    current_url: location.href,
                    cookies: getCookie("mm_tracker"), 
                    telefone: formWppPhone,
                    firstSession: getCookie('FirstSession'), 
                    lastSession: getCookie('LastSession')                    
                }, 'whats_form');

                var dataFormWpp = JSON.stringify(dataFormWpp);

                var response = jQuery.ajax({
                    type: "POST",
                    url: "https://gtm-mplx5hr-ntywn.uc.r.appspot.com",
                    data: dataFormWpp,
                    dataType: "json",
                    async: false,
                    headers: {
                      "X-Gtm-Server-Preview": "ZW52LTV8aG96Yjd6WHAyTTl1VFNZb1dCaUktQXwxOGExOWJlYjBlZjY3MGNiMjU0MjM="
                    }
                }).responseText;
              
                dataLayer.push({
                  event: "whatsapp_form_send"
                });

                window.open(url, '_blank');
                //location.href = url;
                formWpp.style.display = 'none';

            } else {

                formWpp.querySelector('.form-wpp-error').style.display = 'block';
                formWpp.style.height = '500px';

            }

        })


    }

}

  
function mask(o, f) {
  setTimeout(function() {
    var v = mphone(o.value);
    if (v != o.value) {
      o.value = v;
    }
  }, 1);
}

function mphone(v) {
  var r = v.replace(/\D/g, "");
  r = r.replace(/^0/, "");
  if (r.length > 10) {
    r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (r.length > 5) {
    r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (r.length > 2) {
    r = r.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
  } else {
    r = r.replace(/^(\d*)/, "($1");
  }
  return r;
}

function generateChildInput(parent, type, className, placeholder) {

    var input = document.createElement('input');
    input.setAttribute('type', type);
    input.setAttribute('class', className);
    input.setAttribute('placeholder', placeholder);
    input.style.display = 'flex';
    input.style.backgroundColor = '#e7ffe7';
    input.style.height = '40px';
    input.style.fontSize = '14px';
    input.style.marginBottom = '4px';
    input.style.width = '80%';
    input.style.border = 'unset';
    input.style.borderRadius = '5px';
    input.style.boxShadow = '0px 1px #b1b1b1';

    if (type == 'submit') {

        input.setAttribute('value', 'Iniciar conversa');
        input.style.backgroundColor = '#0b6156';
        input.style.width = '40%';
        input.style.justifyContent = 'center';
        input.style.color = '#fff';

    }

    if (type == 'phone') {

        input.setAttribute('onkeypress', 'mask(this, mphone)');
        input.setAttribute('onkeyup', 'mask(this, mphone)');

    }

    parent.appendChild(input);

}

function showWhatsAppForm() {

    var formBox = document.createElement('div');
    formBox.setAttribute('id', 'form-pre-whatsapp');
    formBox.style.position = 'fixed';
    formBox.style.bottom = '10px';
    formBox.style.right = '10px';
    formBox.style.fontFamily = '"Montserrat", sans-serif';
    formBox.style.width = '370px';
    formBox.style.height = '410px';
    formBox.style.backgroundColor = '#e3d9d9';
    formBox.style.zIndex = '99999';
    formBox.style.maxWidth = '95%';

    var formHeader = document.createElement('div');
    formHeader.style.display = 'flex';
    formHeader.style.backgroundColor = '#0b6156';
    formHeader.style.color = '#fff';
    formHeader.style.padding = '20px';
    formHeader.style.gap = '25px';
    formHeader.style.alignItems = 'center';

    var formHeaderClose = document.createElement('div');
    formHeaderClose.innerHTML = '✖';
    formHeaderClose.style.position = 'absolute';
    formHeaderClose.style.top = '5px';
    formHeaderClose.style.right = '15px';
    formHeaderClose.style.cursor = 'pointer';
    formHeaderClose.addEventListener('click', function(){formBox.style.display = 'none'; document.querySelector('#mm-whatsapp').style.display = 'block';});

    var formHeaderLeft = document.createElement('div');
    formHeaderLeft.style.display = 'flex';
    formHeaderLeft.style.backgroundImage = 'url("'+logo_url+'")';
    formHeaderLeft.style.backgroundSize = 'cover';
    formHeaderLeft.style.width = '60px';
    formHeaderLeft.style.height = '60px';
    formHeaderLeft.style.borderRadius = '36px';

    var formHeaderRight = document.createElement('div');
    formHeaderRight.style.display = 'flex';
    formHeaderRight.style.flexDirection = 'column';
    formHeaderRight.innerHTML = site_title + '<div style="display: flex; font-size: 13px; font-weight: 400">online</div>';
    formHeaderRight.style.fontSize = '18px';
    formHeaderRight.style.fontWeight = 'bolder';

    var formContent = document.createElement('div');
    formContent.style.display = 'flex';
    formContent.style.flexDirection = 'column';
    formContent.style.maxWidth = '370px';
    formContent.style.padding = '0px 10px 0px 0px';

    var formHello = document.createElement('div');
    formHello.style.display = 'flex';
    formHello.innerHTML = hello_message;
    formHello.style.fontSize = '14px';
    formHello.style.fontFamily = '"Montserrat", sans-serif';
    formHello.style.color = 'rgb(74, 74, 74)';
    formHello.style.backgroundColor = '#fff';
    formHello.style.padding = '10px';
    formHello.style.margin = '10px 0px 0px 10px';
    formHello.style.maxWidth = '80%';
    formHello.style.borderRadius = '5px';
    formHello.style.boxShadow = '0px 1px #b1b1b1';

    var form = document.createElement('form');
    form.setAttribute('id', 'form-wpp');
    form.style.display = 'flex';
    form.style.flexDirection = 'column';
    form.style.alignItems = 'flex-end';
    form.style.marginTop = '10px';

    var formError = document.createElement('div');
    formError.setAttribute('class', 'form-wpp-error');
    formError.innerHTML = 'Por favor, precisamos de seu <b>Nome</b>, <b>E-mail</b> e <b>Telefone com DDD</b> para prosseguir. 🙂';
    formError.style.fontSize = '14px';
    formError.style.fontFamily = '"Montserrat", sans-serif';
    formError.style.color = 'rgb(74, 74, 74)';
    formError.style.backgroundColor = '#fff';
    formError.style.padding = '10px';
    formError.style.margin = '10px 0px 0px 10px';
    formError.style.maxWidth = '80%';
    formError.style.borderRadius = '5px';
    formError.style.boxShadow = '0px 1px #b1b1b1';
    formError.style.display = 'none';

    generateChildInput(form, 'text', 'form-wpp-name', 'Seu Nome*');
    generateChildInput(form, 'email', 'form-wpp-email', 'Seu Melhor E-mail*');
    generateChildInput(form, 'phone', 'form-wpp-phone', '   Seu Telefone com DDD*');
    generateChildInput(form, 'submit', 'form-wpp-submit', 'Iniciar Conversa');
    

    formHeader.appendChild(formHeaderLeft);
    formHeader.appendChild(formHeaderRight);
    formHeader.appendChild(formHeaderClose);
    formBox.appendChild(formHeader);
    formBox.appendChild(formContent);
    formContent.appendChild(formHello);
    formContent.appendChild(formError);
    formContent.appendChild(form);

    document.body.appendChild(formBox);

    document.querySelector('#form-wpp > .form-wpp-submit').addEventListener('click', function(e){

        e.preventDefault();

        var name = document.querySelector('#form-wpp > .form-wpp-name').value;
        var email = document.querySelector('#form-wpp > .form-wpp-email').value;
        var phone = document.querySelector('#form-wpp > .form-wpp-phone').value;

    })

}

// replace float icon
var wppIconButtons = document.querySelector('#whatsapp');
var mmWppIcon = wppIconButtons.cloneNode(true);
mmWppIcon.setAttribute('id', 'mm-whatsapp');
mmWppIcon.style.cursor = 'pointer';
mmWppIcon.style.position = 'fixed';
mmWppIcon.style.bottom = '40px';
mmWppIcon.style.right = '10px';
mmWppIcon.style.zIndex = '999999';
mmWppIcon.style.filter = 'drop-shadow(2px 4px 6px #999)';

wppIconButtons.remove();
document.body.appendChild(mmWppIcon);

var wppApiButtons = document.querySelectorAll('a[href*="api.whatsapp"]');
var wameButtons = document.querySelectorAll('a[href*="wa.me"]');
var wppIconButton = document.querySelector('#mm-whatsapp');
var wppButtons = Array.prototype.slice.call(wppApiButtons)
                   .concat(Array.prototype.slice.call(wameButtons))
                   .concat(wppIconButton);

for (var i = 0; i < wppButtons.length; i++) {
    wppButtons[i].addEventListener('click', function(e){

        var wppUrl = this.getAttribute('href');
        var wppDefault = 'https://api.whatsapp.com/send?phone=553191055920&text=%5BABCZAP%5D%20Ol%C3%A1!%20Acessei%20o%20site%20da%20ABC%20da%20Constru%C3%A7%C3%A3o%20e%20gostaria%20de%20informa%C3%A7%C3%B5es';
        e.preventDefault();
        wppIconButton.style.display = 'none';
        showWhatsAppForm();
        
        dataLayer.push({
          event: "whatsapp_form_click"
        });

        if (wppUrl) {

          preWhatsappHandler(wppUrl);

        } else {

          preWhatsappHandler(wppDefault);

        }        

    })

}


