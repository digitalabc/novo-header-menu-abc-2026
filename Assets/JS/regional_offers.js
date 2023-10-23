window.addEventListener("load", validateRegionalOffers, false);
const dialogInputCep = document.getElementById('dialog_input_cep');

/**
 * Opens the input cep modal.
 */
function openInputCepModal(showModal) {
  if (showModal) {
    document.getElementById('dialog_input_cep').classList.remove('hidden')
    document.getElementById('regional_offers_overlay').classList.remove('hidden')
    document.querySelector('body').style.overflow = "hidden"
    setTimeout(() => {
      document.getElementById('dialog_input_cep').classList.add('open')
      document.getElementById('regional_offers_overlay').classList.add('open')
    }, 200);
  } else {
    document.getElementById('dialog_input_cep').classList.remove('open')
    document.getElementById('regional_offers_overlay').classList.remove('open')
    document.querySelector('body').style.overflow = null
    setTimeout(() => {
      document.getElementById('dialog_input_cep').classList.add('hidden')
      document.getElementById('regional_offers_overlay').classList.add('hidden')
    }, 200);
  }
}

/**
 * Input zipcode mask and validate button
 */
const handleZipCode = (event) => {
  let input = event.target
  input.value = zipCodeMask(input.value)

  if (input.value.length === 9) {
    document.getElementById('submit-region-form').disabled = false
  } else {
    document.getElementById('submit-region-form').disabled = true
  }
}

/**
* Zipcode mask
*/
const zipCodeMask = (value) => {
  if (!value) return ""
  value = value.replace(/\D/g, '')
  value = value.replace(/(\d{5})(\d)/, '$1-$2')
  return value
}

/**
 * Validates if it contains and set regional offers.
 */
async function setRegionalOffers() {
  const cep = document.getElementById('cep_input')?.value;
  if (!cep) return;

  const checkout = await client.checkout.get();

  if (checkout && checkout.data.checkoutId) {
    const hasPartnerByRegion = client.partner.hasPartnerByRegion();

    if (hasPartnerByRegion) {
      await checkoutPartnerDisassociate(checkout.data.checkoutId);
    }

    const ok = await client.partner.setPartnerByRegion(cep);

    if (ok) {
      await checkoutPartnerAssociate(checkout.data.checkoutId);
    }
  }

  location.reload();
}

/**
 * Validates if it contains and change regional offers.
 */
async function changeRegionalOffers(cep) {
  if (!cep) return;

  const checkout = await client.checkout.get();

  if (checkout && checkout.data.checkoutId) {
    const hasPartnerByRegion = client.partner.hasPartnerByRegion();

    if (hasPartnerByRegion) {
      await checkoutPartnerDisassociate(checkout.data.checkoutId);
    }

    const ok = await client.partner.setPartnerByRegion(cep);

    if (ok) {
      await checkoutPartnerAssociate(checkout.data.checkoutId);
    }
  }

  location.reload();
}

/**
 * Validates if it contains regional offers.
 */
function validateRegionalOffers() {
  const cep = client.partner.getCep();
  if (cep) {
    setCepText(cep)
  } else {
    openInputCepModal(true)
  }
}

/**
 * Zipcore state check - Using open API VIACEP (only for city and uf info)
 * @param {integer} zipcode
 */

async function checkZipAddress(cep) {
  try {
    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    if (!response.ok) {
      throw new Error('Erro na consulta à API');
    }

    const texts = document.querySelectorAll('#regional_offers > p');
    const data = await response.json();
    console.log(data);
    if (texts) {
      texts.forEach(element => {
        element.innerHTML = `
        ${data.localidade} - ${data.uf}
        <span class="tooltip__text">${data.cep}</span>`;
      });
    }
    return true;
  } catch (error) {
    console.error('Erro na consulta: ' + error);
  }
  return false;
}

/**
 * Set the cep message.
 * @param {string} cep - The searched cep.
 */
function setCepText(cep) {
  let zipCode = parseInt(cep.replace("-", ""));
  checkZipAddress(zipCode);
  openInputCepModal(false)
}