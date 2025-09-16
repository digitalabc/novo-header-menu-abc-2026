/**
 * Fetches and renders shipping quotes when the form is submitted.
 * @param {Event} e - The event.
 * @param {string} productVariantId - The product variant ID to be quoted.
 */
async function ShippingQuoteSubmit(e, productVariantId = null, checkoutId) {
  e.preventDefault();
  if (productVariantId) {
    document.getElementById(
      "shipping-quotes-snippet-div-" + productVariantId
    ).innerHTML = `<img style="display: block; margin: auto;" src="/localstatic/img/my-loader.svg?theme=local&v=" alt="">`;

    // if (validateShippingAddress()) {
    try {
      const cep = document.getElementById("shipping-quote-cep").value;
      let quantity = document.getElementById("selected-quantity").value;

      let variables = {
        cep,
        productVariantId: Number(productVariantId),
        quantity: Number(quantity),
      };

      let snippetResponse = await client.snippet.render(
        "product_shipping_quotes_snippet.html",
        "SnippetQueries/shipping_quotes.graphql",
        variables
      );

      snippetResponse ??=
        '<span class="product-shipping__error">CEP inválido!</span>';

      document.getElementById(
        "shipping-quotes-snippet-div-" + productVariantId
      ).innerHTML = snippetResponse;
    } catch (error) {
      console.error(error);
    }
    // } else {
    //     openShippingModal()
    // }
  } else {
    document.getElementById(
      "minicart-shipping-quotes-snippet-div"
    ).innerHTML = `<img style="display: block; margin: auto;" src="/localstatic/img/my-loader.svg?theme=local&v=" alt="">`;

    try {
      const cep = document.getElementById("minicart-shipping-quote-cep").value;

      let variables = {
        cep,
        checkoutId,
      };

      let snippetResponse = await client.snippet.render(
        "mini_cart_shipping_quotes_snippet.html",
        "SnippetQueries/shipping_quotes.graphql",
        variables
      );

      snippetResponse ??=
        '<span class="product-shipping__error">CEP inválido!</span>';

      document.getElementById(
        "minicart-shipping-quotes-snippet-div"
      ).innerHTML = snippetResponse;
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * Applies a mask to the CEP field.
 * @param {string} t - CEP input value.
 */
function cepMask(t) {
  const mask = "#####-###";
  let value = t.value;
  let i = value.length;
  let out = mask.substring(1, 0);
  let text = mask.substring(i);

  if (isNaN(event.key)) event.preventDefault();

  if (text.substring(0, 1) != out) t.value += text.substring(0, 1);
}

function validateShippingAddress() {
  const cep = document.getElementById("shipping-quote-cep").value,
    partnerCep = client.partner.getCep();

  if (cep == partnerCep) {
    return true;
  }

  return false;
}

function closeShippingModal(e, element = null) {
  if (e.target == e.currentTarget) {
    document.getElementById("shipping-invalid").classList.remove("visible");
    setTimeout(() => {
      element.style.display = "none";
    }, 200);
  }
}

function openShippingModal() {
  let cep = document.getElementById("shipping-quote-cep").value;
  let partnerCep = client.partner.getCep();

  document.querySelector("[id^='shipping-quotes-snippet-div']").innerHTML = "";

  if (cep == "" || partnerCep == "") return false;

  setTimeout(() => {
    document.getElementById("shipping-invalid").style.display = "block";
  }, 200);
  document.getElementById("shipping-invalid").classList.add("visible");

  document.getElementById(
    "shipping-partner_cep"
  ).innerHTML = `${partnerCep} (${checkZipAddress(
    parseInt(partnerCep.replace("-", ""))
  )})`;
  document.getElementById(
    "shipping-cep"
  ).innerHTML = `${cep} (${checkZipAddress(parseInt(cep.replace("-", "")))})`;
}

function changeParterByRegion() {
  let cep = document.getElementById("shipping-quote-cep").value;

  if (cep) changeRegionalOffers(cep);
}
