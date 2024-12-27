window.addEventListener("load", validateRegionalOffers, false);
const dialogInputCep = document.getElementById('dialog_input_cep');

/**
 * Opens the input cep modal.
 */
function openInputCepModal(showModal){
    if(showModal){
        showModal('dialog_input_cep');
    }else{
        closeModal('dialog_input_cep');
    }
}

/**
 * Input zipcode mask and validate button
 */
const handleZipCode = (event) => {
    let input = event.target
    input.value = zipCodeMask(input.value)
  
      if(input.value.length === 9){
          document.getElementById('submit-region-form').classList.remove('bg-gray-400')
          document.getElementById('submit-region-form').disabled = false
          document.getElementById('submit-region-form').classList.add('bg-primary-600')
      }else{
          document.getElementById('submit-region-form').classList.add('bg-gray-400')
          document.getElementById('submit-region-form').disabled = true
          document.getElementById('submit-region-form').classList.remove('bg-primary-600')
      }
  }

/**
 * Validates if it contains and set regional offers.
 */
async function setRegionalOffers(){
    const cep = document.getElementById('cep_input')?.value;
    if (!cep) return;

    const checkoutId = client.cookie.get("carrinho-id");

    if (checkoutId && checkoutId != "") {
        const hasPartnerByRegion = client.partner.hasPartnerByRegion();
        alert('tem parceiro por região:' + hasPartnerByRegion)
        if (hasPartnerByRegion) {
            await checkoutPartnerDisassociate(checkoutId);
            alert('desassociou')
        }

        const ok = await client.partner.setPartnerByRegion(cep);
        alert('setou por região: ' + ok)
        if (ok) {
            await checkoutPartnerAssociate(checkoutId);
            alert('associou')
        }
    }
    
    location.reload();
}

/**
 * Validates if it contains regional offers.
 */
function validateRegionalOffers(){
    const cep = client.partner.getCep();
    if (cep) setCepText(cep);
}

/**
 * Set the cep message.
 * @param {string} cep - The searched cep.
 */
function setCepText(cep){
    const texts = document.querySelectorAll('.regional-offers-text');
    if (texts){
        texts.forEach(element => {
            element.innerText = `Visualizando ofertas do CEP ${cep}`;
        });
    }
}