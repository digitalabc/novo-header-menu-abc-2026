window.addEventListener("load", validateRegionalOffers, false);
const dialogInputCep = document.getElementById('dialog_input_cep');

/**
 * Opens the input cep modal.
 */
function openInputCepModal(showModal) {
  if (showModal) {
    document.getElementById('dialog_input_cep').classList.remove('hidden')
    document.getElementById('regional_offers_overlay').classList.remove('hidden')
    setTimeout(() => {
      document.getElementById('dialog_input_cep').classList.add('open')
      document.getElementById('regional_offers_overlay').classList.add('open')
    }, 200);
  } else {
    document.getElementById('dialog_input_cep').classList.remove('open')
    document.getElementById('regional_offers_overlay').classList.remove('open')
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
 * Zipcore state check
 * @param {integer} zipcode
 */

function checkZipAddress(zipcode) {
  let address;

  if (zipcode > 999999 && zipcode < 100000000) {
    if (zipcode < 20000000) {
      address = "São Paulo"
    } else if (zipcode < 29000000) {
      address = "Rio de Janeiro"
    } else if (zipcode < 30000000) {
      address = "Espirito Santo"
    } else if (zipcode < 40000000) {
      address = "Minas Gerais"
    } else if (zipcode < 49000000) {
      address = "Bahia"
    } else if (zipcode < 50000000) {
      address = "Sergipe"
    } else if (zipcode < 57000000) {
      address = "Pernambuco"
    } else if (zipcode < 58000000) {
      address = "Alagoas"
    } else if (zipcode < 59000000) {
      address = "Paraiba"
    } else if (zipcode < 60000000) {
      address = "Rio Grande do Norte"
    } else if (zipcode < 64000000) {
      address = "Ceará"
    } else if (zipcode < 65000000) {
      address = "Piauí"
    } else if (zipcode < 66000000) {
      address = "Maranhão"
    } else if (zipcode < 68900000) {
      address = "Pará"
    } else if (zipcode < 69000000) {
      address = "Amapá"
    } else if (zipcode < 69300000) {
      address = "Amazonas"
    } else if (zipcode < 69900000) {
      address = "Roraima"
    } else if (zipcode < 70000000) {
      address = "Acre"
    } else if (zipcode < 72800000) {
      address = "Distrito Federal"
    } else if (zipcode < 77000000) {
      address = "Goiás"
    } else if (zipcode < 78000000) {
      address = "Tocantins"
    } else if (zipcode < 78900000) {
      address = "Mato Grosso"
    } else if (zipcode < 79000000) {
      address = "Rondônia"
    } else if (zipcode < 80000000) {
      address = "Mato Grosso do Sul"
    } else if (zipcode < 88000000) {
      address = "Paraná"
    } else if (zipcode < 90000000) {
      address = "Santa Catarina"
    }
    else {
      address = "Rio Grande do Sul"
    }
  } else {
    window.alert("Região inválida")
  }
  return address
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
 * Validates if it contains regional offers.
 */
function validateRegionalOffers() {
  const cep = client.partner.getCep();
  if (cep) setCepText(cep);
}

/**
 * Set the cep message.
 * @param {string} cep - The searched cep.
 */
function setCepText(cep) {
  const texts = document.querySelectorAll('#regional_offers > p');
  let zipCode = parseInt(cep.replace("-", ""));
  let address = checkZipAddress(zipCode);

  if (texts) {
    texts.forEach(element => {
      element.innerText = `Visualizando ofertas de ${address}`;
    });
  }

  openInputCepModal(false)
}