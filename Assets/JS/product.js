window.addEventListener("load", productLoad, false);
let checkoutUrl = "";
let alertDiv = "";

/**
 * Page load function.
 */
async function productLoad() {
  alertDiv = document.getElementById("add-cart-alert");
  await validateWishlist();
}

/**
 * Validates if product is in the customer wishlist.
 */
async function validateWishlist() {
  const productId = document.getElementById("product-id")?.value;
  if (!productId) return;

  const wishlistButton = document.getElementById("wishlist-button-" + productId);
  if (!wishlistButton) return;

  let user = await client.user.get();
  if (!user) return;

  const isIn = await isInTheWishlist(productId, user.customerAccessToken);
  if (!isIn) return;

  c.className = "btn btn-sm btn-danger";
  wishlistButton.setAttribute('onclick', `wishlistRemoveClick(this, ${productId});`);
}

/**
 * Product attribute selection function.
 * @param {HTMLElement} element - Attribute element from HTML.
 */
async function selectAttribute(element) {
  const attrId = element.getAttribute("attribute-id");
  const productId = element.getAttribute("product-id");
  const attributeDiv = element.closest('.attribute-selections');
  let attributeList = getSelectedAttributes(attributeDiv, attrId, element.value.trim());
  await renderAttributes(attributeList, productId);
}

/**
 * Returns a list of the selected attributes of the page.
 * @param {HTMLElement} attributeDiv - The attribute div from HTML.
 * @param {string} selectedAttributeId - Selected attribute ID.
 * @param {string} selectedAttributeValue - Selected attribute value.
 */
function getSelectedAttributes(attributeDiv, selectedAttributeId, selectedAttributeValue) {
  let attributeList = [];
  if (selectedAttributeId && selectedAttributeValue)
    attributeList.push({
      attributeId: Number(selectedAttributeId),
      value: selectedAttributeValue
    });
  const selectedAttributes = attributeDiv.querySelectorAll(`[id^="hidden-selected-attribute-"]`);
  if (selectedAttributes)
    selectedAttributes.forEach(element => {
      const attributeId = element.id.split("-").at(-1);
      if (attributeId != selectedAttributeId &&
        !(attributeList.some(x => x.attributeId == Number(attributeId))))

        attributeList.push({
          attributeId: Number(attributeId),
          value: element.value
        });
    }
    );

  return attributeList;
}

/**
 * Renders the attributes according to the product and the selected attributes.
 * @param {string} attributeList - List of product selected attributes .
 * @param {string} productId - Product ID.
 */
async function renderAttributes(attributeList, productId) {
  const variables = {
    productId: Number(productId),
    selections: attributeList
  };
  const elementId = `product-view-div-${productId}`;
  const response = await client.snippet.render("product_view_snippet.html", "product.graphql", variables);
  replaceInnerHtml(response, elementId);

  var thumbs = new Swiper('.gallery-thumbs', {
    spaceBetween: 30,
    slidesPerView: 4,
    slidesPerGroup: 4,
    freeMode: true,
    watchSlidesProgress: true,
    navigation: {
      nextEl: '.gallery .swiper-button-next',
      prevEl: '.gallery .swiper-button-prev',
    },
  });

  var slider = new Swiper('.gallery-slider', {
    thumbs: {
      swiper: thumbs,
    },
  });

}

/**
 * Shows an alert message for 2 seconds in a hovering box.
 * @param {string} content - The text to be displayed in a hover alert message
 * @param {bool} error - If it is an error message, displays different color
*/
function showAlert(content, error = false) {
  alertDiv.innerHTML = `<div class="alert alert-${error ? "danger" : "success"} col-2" role="alert" style="position: fixed; bottom:0; text-align: center; margin-bottom: auto; z-index: 1;">${content}</div>`;
  alertDiv.style.visibility = "visible";
  setTimeout(hideAlert, 2000);
}

/**
 * Hides the alert content.
*/
function hideAlert() {
  alertDiv.innerHTML = "";
  alertDiv.style.visibility = "hidden";
}

/**
 * Add to cart button click.
 * @param {string} productVariantId - Product variant ID.
 */
async function addToCartClick(productVariantId) {
  if (productVariantId != "") {
    const input = getAttributeProductAndQuantity(productVariantId);
    const success = await addOrCreateCheckout(input);
    if (success) {
      showAlert('Produto adicionado ao carrinho!');
      await loadMiniCart();
      openOffcanvas("#minicart-offcanvas")
    }
  }
}

/**
 * Buy button click.
 * @param {string} productVariantId - Product variant ID.
 */
async function buyClick(productVariantId) {
  if (productVariantId != "") {
    const input = getAttributeProductAndQuantity(productVariantId);
    const success = await addOrCreateCheckout(input);
    if (success && checkoutUrl != "") {
      window.location = checkoutUrl;
    }
  }
}

/**
 * Subscription button click.
 * @param {string} productVariantId - Product variant ID.
 */
async function subscriptionClick(productVariantId) {
  if (productVariantId != "") {
    const subscriptionRecurringType = document.getElementById("subscription-recurring-type");
    const subscriptionGroupId = subscriptionRecurringType.options[subscriptionRecurringType.selectedIndex].getAttribute("subscription-group-id");

    const input = getAttributeProductAndQuantity(productVariantId);
    input[0].subscription = {
      subscriptionGroupId: Number(subscriptionGroupId),
      recurringTypeId: Number(subscriptionRecurringType.value)
    };

    const success = await addOrCreateCheckout(input);
    if (success && checkoutUrl != "") {
      window.location = checkoutUrl;
    }
  }
}

/**
 * Calls the getQuantity and getCustomizations functions and return the input object to add to checkout.
 * @param {string} variantId - Product variant ID.
 */
function getAttributeProductAndQuantity(variantId) {
  let input = null;
  const quantity = getQuantity();
  const customization = getCustomizations();

  let products = [];
  products.push({
    productVariantId: Number(variantId),
    quantity: quantity,
    customization: customization
  });
  input = products;

  return input;
}

/**
 * Gets the product quantity from page.
 */
function getQuantity() {
  const selectedQuantity = document.getElementById("selected-quantity");

  if (!selectedQuantity) return 1;

  const quantityValue = selectedQuantity.value;
  const maxValue = selectedQuantity.getAttribute("max");
  const quantity = Number(quantityValue);
  const max = Number(maxValue);

  if (quantity < 1) return 1;
  if (quantity > max) return max;
  return quantity;
}

/**
 * Validates if need to create a checkout and add products.
 * @param {object[]} input - Product and quantities input to add to checkout.
 */
async function addOrCreateCheckout(input) {
  try {
    const checkout = await client.checkout.get();
    let checkoutId = null;

    if (checkout && checkout.data.checkoutId) {
      const checkoutResponse = await client.checkout.add(input);
      if (checkoutUrl == "") {
        checkoutUrl = checkoutResponse.data.url;
      }

      checkoutId = checkoutResponse.data.checkoutId;
    }
    else {
      const checkoutResponse = await client.checkout.create(input);
      checkoutUrl = checkoutResponse.data.url;
      checkoutId = checkoutResponse.data.checkoutId;
    }

    await checkoutPartnerAssociate(checkoutId);

    return true;
  } catch (error) {
    showAlert('Erro ao adicionar produto ao carrinho.', true);
    return false;
  }
}

/**
 * Matrix add to cart button click.
 */
async function addToCartMatrixClick(element) {
  const success = await checkoutOperations(element, 'product-view-div');
  if (success) {
    showAlert('Produto(s) adicionado(s) ao carrinho!');
    await loadMiniCart();
  }
}

/**
 * Matrix buy button click.
 */
async function buyMatrixClick(element) {
  const success = await checkoutOperations(element, 'product-view-div');
  if (success && checkoutUrl != "") {
    window.location = checkoutUrl;
  }
}

/**
 * Applies the wholesale price to the product.
 * @param {string} quantity - Wholesale quantity.
 */
async function applyWholesalePrice(quantity) {
  if (!quantity) { return false; }

  const selectedQuantity = document.getElementById("selected-quantity");
  selectedQuantity.value = quantity;

  let prodVar = Number(document.getElementById('product-variant-id').value)
  quantity = Number(quantity);

  let response = await client.snippet.render("wholesale_price_snippet.html", "SnippetQueries/wholesale.graphql", { prodVar, quantity });
  response = processWholesaleResponse(response, quantity);

  replaceInnerHtml(response, "wholesale-div");
}

/**
 * Process the wholesale HTML content.
 * @param {string} html - String HTML content.
 * @param {string} quantity - Wholesale quantity.
 */
function processWholesaleResponse(html, quantity) {
  const calculatedDiscount = calculateWholesaleDiscount(html, quantity);
  return html
    .replace("{price}", calculatedDiscount.price.toLocaleString('pt-BR'))
    .replace("{percent}", calculatedDiscount.percent.toLocaleString('pt-BR', { style: "percent" }));
}

/**
 * Calculates the wholesale discount.
 * @param {string} html - String HTML content.
 * @param {string} quantity - Wholesale quantity.
 */
function calculateWholesaleDiscount(html, quantity) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const originalPriceMultiplied = Number(doc.getElementById('original-price-value').innerHTML) * quantity;
  const wholesalePrice = Number(doc.getElementById('wholesale-price-value').innerHTML);
  return {
    price: originalPriceMultiplied - wholesalePrice,
    percent: 1 - (wholesalePrice / originalPriceMultiplied)
  };
}

/**
 * Gets the product customizations.
 */
function getCustomizations() {
  let customizations = [];
  const inputs = document.querySelectorAll("[id^=customization-]");
  for (const input of inputs) {
    if (input.value)
      customizations.push({
        customizationId: Number(input.getAttribute("customization-id")),
        value: input.value
      })

  }
  return customizations;
}

/**
 * Builds the object for adding the product to the cart.
 * @param {HTMLElement} rowDiv - HTML row div element.
 * @param {object[]} input - Object to add the product to the cart.
 */
function pushProductInput(rowDiv, input) {
  const elements = rowDiv.querySelectorAll('input[product-variant-id][type=number]');
  if (elements) {
    for (const element of elements) {
      const variantId = element.getAttribute("product-variant-id");
      const quantity = element.value;
      if (quantity > 0 && variantId > 0)
        input.push({
          productVariantId: Number(variantId),
          quantity: Number(quantity)
        })
    }
  }
}

/**
 * Calls the quantity validation function and and calls the function that enables or disables the buy and add to cart buttons.
 * @param {HTMLElement} rowDiv - HTML row div element.
 */
function setButtonsEnabledByAvailability(rowDiv) {
  const available = validateAvailability(rowDiv);
  setDisabledBuyButtons(rowDiv, !available);
}

/**
 * Validates that the selected quantity of the product is sufficient to enable the buy and add to cart buttons.
 * @param {HTMLElement} rowDiv - HTML row div element.
 */
function validateAvailability(rowDiv) {
  const productDivs = rowDiv.querySelectorAll('.product-view-div');
  return Array.from(productDivs).every(div => {
    const elements = div.querySelectorAll('.product-available');
    if (elements.length > 0)
      return Array.from(elements).every(x => x.value == 'true');
    const quantityInputs = rowDiv.querySelectorAll('.matrix-input-quantity');
    const nonEmpty = Array.from(quantityInputs).filter(x => x.value != "");
    return Array.from(nonEmpty).some(x => Number(x.value) > 0);
  });
}

/**
 * Enable or disable buy and add to cart buttons.
 * @param {HTMLElement} rowDiv - HTML row div element.
 * @param {bool} disabled - True to disable and false to enable.
 */
function setDisabledBuyButtons(rowDiv, disabled) {
  rowDiv.querySelector('.add-to-cart-button').disabled = disabled;
  rowDiv.querySelector('.buy-button').disabled = disabled;
}

/**
 * Function for when quantity is changed in matrix attributes.
 * @param {HTMLElement} element - Input type number from matrix.
 */
function productMatrixOnChange(element) {
  const row = element.closest('.product-view-row');
  setButtonsEnabledByAvailability(row);
}

/**
 * Gets the current buy together row and adds it to a checkout.
 * the operation uses scope context to search only in the contained div
 * for ids and attributes, since there can be repetition of names and
 * classes in the page, we avoid using getElementById.
 * @param {HTMLInputElement} element - The button originating the operation, for context.
 * @param {string} className - Name of the class to fetch the div.
 */
async function checkoutOperations(element, className) {
  const input = [];
  const div = element.closest('.' + className);
  pushProductInput(div, input);

  const success = await addOrCreateCheckout(input);
  return success;
}

/**
 * Event for the 'back in stock' component, when the product is out of stock
 * and the user wants to sign up for an email notification
 * @param {Event} e - The form event, so we can cancel the POST, avoiding a page reload
 */
async function backInStockOnClick(e) {
  if (e) e.preventDefault();
  const productViewDiv = document.querySelector(".product__view")
  const productVariantId = Number(document.getElementById("product-variant-id").value);
  // const name = document.getElementById("bis-name").value;
  const email = productViewDiv.querySelector(".bis-email").value;
  const alert = productViewDiv.querySelector(".bis-alert");
  const bisInput = {
    email: email,
    // name: name,
    partnerAccessToken: null,
    productVariantId: productVariantId,
  }
  const success = await client.product.createRestockAlert(bisInput);
  if (success) {
    sendSharpSpring({ email: email, productVariantId }, 'aviseme');
    alert.innerHTML = 'Email cadastrado com sucesso!';
    setTimeout(function () {
      alert.innerHTML = '';
    }, 2000);
  }
  else {
    alert.innerHTML = 'Falha ao cadastrar email';
    setTimeout(function () {
      alert.innerHTML = '';
    }, 2000);
  }
}

/**
 * Event for the 'back in stock' component, when the product is out of stock
 * and the user wants to sign up for an email notification
 * @param {Event} e - The form event, so we can cancel the POST, avoiding a page reload
 */
async function spotBackInStockOnClick(e) {
  if (e) e.preventDefault();
  const bis = e.target.closest(".bis")
  const productVariantId = Number(bis.querySelector(".product-variant-id").value);
  // const name = document.getElementById("bis-name").value;
  const email = bis.querySelector(".bis-email").value;
  const alert = bis.querySelector(".bis-alert");
  const bisInput = {
    email: email,
    // name: name,
    partnerAccessToken: null,
    productVariantId: productVariantId,
  }
  const success = await client.product.createRestockAlert(bisInput);
  if (success) {
    sendSharpSpring({ email: email, productVariantId }, 'aviseme');
    alert.innerHTML = 'Email cadastrado com sucesso!';
    setTimeout(function () {
      alert.innerHTML = '';
    }, 2000);
  }
  else {
    alert.innerHTML = 'Falha ao cadastrar email';
    setTimeout(function () {
      alert.innerHTML = '';
    }, 2000);
  }
}

function togglePayment(button) {
  button.parentElement.classList.toggle("open")
}

function createWarning(div) {
  let warning = document.createElement("div")
  warning.innerHTML = "Quantidade indisponível."
  warning.classList.add("warning")

  if (!(document.querySelector(".warning"))) {
    document.querySelector(div).append(warning)
    setTimeout(() => {
      document.querySelector(".warning").remove()
    }, 2000);
  }
}

function quantityChange(inputId, action) {
  const input = document.querySelector(inputId),
    val = Number(input.value),
    min = Number(input.getAttribute("min")),
    max = Number(input.getAttribute("max"))

  if (action == "decrease" && val > min) {
    input.value--;
    input.onchange();
  } else if (action == "increase" && val < max) {
    input.value++;
    input.onchange();
  }
}

function verifyQuantity(input, warningQuery) {
  const val = Number(input.value),
    min = Number(input.getAttribute("min")),
    max = Number(input.getAttribute("max"))

  val < min ? input.value = min : null
  val > max ? input.value = max : null

  if (val < min || val > max) {
    createWarning(warningQuery)
  }
}

function updateFakeQuantity(input, fakeQuantityId, type) {
  const quant = Number(input.value),
    fakeQuantityInput = document.getElementById(fakeQuantityId)
  if (fakeQuantityInput) {
    const boxPrice = fakeQuantityInput.dataset.boxprice
    if (type == "m²") {
      fakeQuantityInput.value = `${(quant == 1 ? '1 caixa' : quant + ' caixas')} = ${(boxPrice * quant).toFixed(2).replace(',', '.')} ${type}`;
    } else if (type == "pç.") {
      fakeQuantityInput.value = `${(quant == 1 ? '1 caixa' : quant + ' caixas')} = ${(boxPrice * quant)} ${type}`;
    }
  }
}

let getSiblings = function (e, tagName) {
  // for collecting siblings
  let siblings = [];
  // if no parent, return no sibling
  if (!e.parentNode) {
    return siblings;
  }
  // first child of the parent node
  let sibling = e.parentNode.firstChild;

  // collecting siblings
  while (sibling) {
    if (sibling.nodeType === 1 && sibling.tagName == tagName && sibling !== e) {
      siblings.push(sibling);
    }
    sibling = sibling.nextSibling;
  }
  return siblings;
};

function toggleInformation(title) {
  const modal = title.nextElementSibling

  if (DESKTOP.matches) {
    othertitles = getSiblings(title, "H2");
    othermodals = getSiblings(modal, "DIV");
    for (const othertitle of othertitles) {
      othertitle.classList.remove("active")
    }
    for (const othermodal of othermodals) {
      othermodal.classList.remove("show")
    }
  }

  title.classList.toggle("active")
  modal.classList.toggle("show")
}

var swiper = new Swiper(".related-products .swiper", {
  navigation: {
    nextEl: '.related-products .swiper-button-next',
    prevEl: '.related-products .swiper-button-prev'
  },
  spaceBetween: 5,
  slidesPerView: 2.1,
  breakpoints: {
    768: {
      slidesPerView: 3.1
    },
    991: {
      spaceBetween: 20,
      slidesPerView: 4
    },
    1090: {
      spaceBetween: 20,
      slidesPerView: 5
    }
  }
});

window.visible_id = 'product-shipping';

function togglePickUp(button) {
  var buyButton = button.previousElementSibling
  var shippingEl = document.querySelector('.product-shipping');
  var pickUpEl = document.getElementById('product-pick-up');

  if (top.visible_id == 'product-shipping') {
    button.innerText = "Consultar CEP";
    shippingEl.style.display = 'none';
    pickUpEl.style.display = 'block';
    top.visible_id = 'product-pick-up';
  } else {
    button.innerText = "Retire em loja";
    shippingEl.style.display = 'grid';
    pickUpEl.style.display = 'none';
    top.visible_id = 'product-shipping';
  }
}

function choosePickUpState(button) {
  var select = button.previousElementSibling
  var pickUpState = select.value;
  var storesDiv = document.querySelector('.stores');
  var storesLists = document.querySelectorAll('.stores__list');
  var selectedStoresList = document.querySelector(`.stores__list[data-state="${pickUpState}"]`);

  storesLists.forEach(element => {
    element.style.display = 'none';
  });

  storesDiv.style.display = 'block';
  selectedStoresList.style.display = 'block';
}

// Funções da calculadora do layout antigo
function mascara(o, f) {
  v_obj = o;
  v_fun = f;
  setTimeout("execmascara()", 2);
  setTimeout("fMetro2()", 2);
}

function execmascara() {
  v_obj.value = v_fun(v_obj.value);
}

function mascara_metros(v) {
  v = v.replace(/\D/g, "");
  v = v.replace(/(\d*)(\d[0-9]{1})/, "$1.$2");
  v = parseFloat(v);
  v = (v).toFixed(2);
  return v;
}

function fMetro2() {
  var largura = document.getElementById("calculator-width").value;
  var comprimento = document.getElementById("calculator-length").value;
  var metro2 = largura * comprimento;
  metro2 = metro2.toFixed(2);
  m2ParseBox(metro2);
  document.getElementById("squareMeters").innerHTML = metro2 + 'm²';
}

function m2ParseBox(m2) {
  var precoM2 = parseFloat(document.querySelector('#precoCalculado').textContent.trim().split(' ').pop().replaceAll('.', '').replace(',', '.'));

  var precoProduto = parseFloat(document.querySelector('.product__prices .spot-price h3 span').textContent.trim().split(' ').slice(-1)[0].replaceAll('.', '').replace(',', '.'));

  var m2PorCaixa = precoProduto / precoM2;

  m2PorCaixa = m2PorCaixa.toFixed(2);
  calcAmountBoxes = m2 / m2PorCaixa;
  var aux = m2 % m2PorCaixa;

  if (aux = !0) {
    calcAmountBoxes = Math.ceil(calcAmountBoxes);
  }
  document.getElementById("amountBoxes").innerHTML = calcAmountBoxes > 1 ? calcAmountBoxes + ' caixas' : calcAmountBoxes + ' caixa';
}

function calcAtualizar() {
  var precoM2 = parseFloat(document.querySelector('#precoCalculado').textContent.trim().split(' ').pop().replaceAll('.', '').replace(',', '.'));

  var precoProduto = parseFloat(document.querySelector('.product__prices .spot-price h3 span').textContent.trim().split(' ')[1].replaceAll('.', '').replace(',', '.'));
  var m2PorCaixa = precoM2 / precoProduto;
  var quant = parseInt(document.querySelector('#amountBoxes').textContent.split(' ')[0]);
  var m2total = (m2PorCaixa * quant).toFixed(2).replace('.', ',');

  document.querySelector('.fake-quantity').value = `${(quant == 1 ? '1 caixa' : quant + 'caixas')} = ${m2total} m²`;

  document.getElementById('selected-quantity').value = quant

  document.getElementById('selected-quantity').onchange();

  document.querySelector(".calculator .ah-close").click()
}

/**
 * Show/hide product floating button
*/
const productButtons = document.querySelector('.product__buttons')

function setProductFloating(scrollTop, offsetToShowProduct, offsetToHideProduct) {

  if (scrollTop > offsetToShowProduct && (window.innerHeight + scrollTop) + offsetToHideProduct <= document.body.offsetHeight) {
    body.classList.add('show-floating');
  }
  else {
    body.classList.remove('show-floating');
  }

}

/**
 * Show pick up button
 */

// const _listaCategoriaABC = ["BRILHO", "PORC MADEIRA REGUA", "MONOP 30X60 RET BCO/BG", "** AZULEJO   G E R A L **", "FILETES/BORDAS", "PAREDE PASTILHA VIDRO", "AZULEJO DECORADO", "ACRILICA", "MONOP DECORADO/RELEVO", "REVESTIMENTO", "ACESSORIOS/PISCINA", "AZULEJO BCO/BG BOLD", "FORA DO MIX", "FORA DE LINHA", "PASTILHA ESMALTADA", "PASTILHA PIGMENTADA/RESIN", "PASTILHA PEDRA/NATURAL", "ACESSORIOS PISO/PAREDE", "PORC ESM RET 60X60", "RODAPE", "PORC ESM BOLD 60X60", "EXTERNO", "REVESTIMENTO PISO PAREDE", "ACESSORIOS/LAMINADO", "LAMINADO COMERCIAL CLICK", "LAMINADO RESIDENCIAL COLA", "ACESSORIOS/COTTO", "MOSAICOS", "SEM BRILHO", "ACESSORIOS TIJOLO DE VIDR", "TIJOLO DE VIDRO", "PONTAS DE ESTOQUE", "OUTROS/COBERTURA", "ACESSÓRIOS CAIXA/TANQUES", "FIBRA 1500 L", "** TELHAS G E R A L  **", "CANALETA PLASTICA / PVC", "TELHA ECOLOGICA", "TELHA PLASTICA / PVC", "FIBRA 2000 L", "FIBRA 3000 L", "FIBRA 5000 L", "AGUA QUENTE - TUBOS", "ESG NORMAL - TUBO", "ROSCAVEL - TUBOS", "SOLDAVEL - TUBOS", "FECHADURAS", "PORC ESM RET POL GD FORMA", "PORC TEC NAT 60X60", "PORC TEC POL 60X60", "PORC ESM RET POL 60X60", "PORC MADEIRA DECK", "OUTRAS CAIXAS/FIBRA", "IMPERMEABILIZANTES", "ARGAMASSA CERAMICA", "REJUNTE EPOX", "ACESSORIO ATERMICO", "REJUNTE COMUM", "REJUNTE PISCINA", "FORRO PVC", "ACESSÓRIOS FORRO PVC", "FOSSA 600L", "PORTAS/PVC", "ESPACADOR", "ACRILICA SIMPLES", "FIBRA SIMPLES/GEL COAT", "FIBRA DUPLA/GEL COAT", "ACRILICA DUPLA", "SPA", "ARGAMASSA DIVERSAS", "ARGAMASSA PORCELANATO", "PORTAS/ALUMINIO", "ADITIVOS", "RESERVATORIO TERMICO", "PAINEL BANHO ACRILICO", "BIODIGESTOR", "* PORCELANATO GERAL *", "ESG SR - TUBOS", "TELHA AMIANTO", "KIT FIXACAO/VEDAÇÃO", "CUMEEIRA ECOLOGICA", "MONOP 30X60 BOLD BCO/BG", "ARGAMASSA COLA E REJUNTA", "PORCELANATOS", "CERAMICAS", "REJUNTE PARA PORCELANATO", "REJUNTE GERAL", "PORC MADEIRA PARKET", "RUSTICO", "MONOP GD FORMATO BCO / BG", "ELEGANCE PORC/PORC", "PORC TEC POL GD FORMATO", "PORC MADEIRA/PORCELANATO", "VINILFORT - TUBOS", "PAREDE PASTILHA INOX", "CISTERNA VERTICAL", "PORC TEC NAT GD FORMATO", "MONOP PQ FORMATO", "ELEGANCE PAR/PAREDE", "POLIETILENO   310L", "POLIETILENO   500L", "COTTO", "LAMINADO RESIDENCIAL CLIC", "POLIETILENO  0750L", "GRES ACETINADO", "POLIETILENO  1000L", "OFURO", "POLIETILENO  15000L", "POLIETILENO  1500L", "PORC ESM BOLD EXT", "CUMEEIRA AMIANTO", "PORC ESM RET GD FORMATO", "POLIETILENO  150L", "PORC ESM RET 60X120", "PORC MADEIRA REGUA EXT", "DECK MADEIRA SPA/OFURO", "PARAFUSO", "FOSSA 2800L", "FOSSA 5000L", "FOSSA 10000L", "POLIETILENO  2000L", "CISTERNA HORIZONTAL", "MONOP GD FORMATO DECO/REL", "PORC ESM RET EXT GD FORMA", "PORC DECORADO", "POLIETILENO  2500L", "POLIETILENO  3000L", "CIMENTO", "POLIETILENO  5000L", "IMPER PAREDES EXT/FACHADA", "POLIETILENO 10000L", "IMPER P/LAJES E TELHADOS", "VINILICO RESIDENCIAL", "VINILICO COMERCIAL", "ABA SPA/BANHEIRA", "PORC ESM RET POL 60X120", "TAMPAO TERMICO SPA", "GRES EXTERNO", "IMERSÃO", "PORC ESM RET EXT 60X60", "COLETOR PISCINA", "JANELAS", "POLIETILENO 1750L", "POLIETILENO 7500L", "POLIETILENO TANQUE   500L", "PORC ESM RET EXT 60X120", "PAINEL BANHO INOX", "PORC TEC EXT 60X60", "COLETOR BANHO", "REJUNTE ACRILICO", "POLIETILENO TANQUE   750L", "POLIETILENO TANQUE  1000L", "POLIETILENO TANQUE  1500L", "POLIETILENO TANQUE  2000L", "POLIETILENO TANQUE  2500L", "POLIETILENO TANQUE  3000L", "POLIETILENO TANQUE  5000L", "EXTERNO ATERMICO", "PISO", "PAREDE PLACA MADEIRA", "COBOGÓS", "MADEIRA", "PAINEL BANHO ALUMINIO", "PORC ESM FORMATO 30X30", "VINILICO ACESSORIOS", "VINILICO RESIDENCIAL CLIC", "PBA - TUBOS", "PAPEL DE PAREDE", "PORC ESM RET BRI 60X60", "GRES REVESTIMENTO", "ACESSORIOS", "HIDRÁULICO", "AZULEJO RET", "PISO RETIFICADO", "GUARNICAO", "RODAMEIO", "RODATETO", "FIRE - TUBOS", "POLIETILENO TANQUE 10000L", "PORC ESM RET POL S. FORMA", "PAINEL BANHO VIDRO", "PORC TEC EXT GD FORMATO", "VINILICO MANTA COMERCIAL", "PORC ESM RET S. FORMATO", "POLIETILENO TANQUE 15000L", "POLIETILENO TANQUE 20000L", "POLIETILENO TANQUE 6000L", "TAMPAS/FIBRA DE VIDRO", "ADESIVOS E SELANTES", "IMPER FUNDAÇÕES/ALICERCES", "IMPER PAREDES INT/RODAPÉ", "COLETOR A VACUO", "VINILICO COMERCIAL CLIC", "PORC ESM RET EXT S. FORMA", "CUMEEIRA PLASTICA / PVC", "OUTROS/ARGAMASSAS", "BASCULANTE/ALUMINIO", "JANELA/ALUMINIO", "PORC TEC POL", "PASTILHAS AUTOADESIVAS", "RÚSTICO", "TIJOLINHOS", "MADEIRA RÉGUA", "GRES POLIDO", "GRES BRILHANTE", "PISCINA", "PISO VINILICO", "PORCELANATO ESMALTADO", "ACESSORIOS/LOUCA", "OUTROS/LOUCA", "TANQUE LOUCA", "BIDE LOUCA", "MICTORIO LOUCA", "COLUNA LOUÇA", "LAVATORIOS LOUÇA COLUNA", "CUBAS LOUÇA APOIO", "CUBAS LOUÇA EMBUTIR", "LAVATORIOS LOUÇA SUSPENSO", "CUBAS LOUÇA SEMI ENCAIXE", "CUBAS LOUÇA SOBREPOR", "LAVATORIOS LOUÇA DE PISO", "CUBAS LOUÇA OUTROS", "LAVATORIOS LOUÇA OUTROS", "KIT LOUÇAS", "CUBAS INOX/VIDRO", "BANCA VIDRO", "CUBAS VIDRO APOIO", "PRATELEIRA VIDRO", "FOGÃO 2 QUEIMADORES", "BANCA INOX C/ FOGÃO", "FOGÃO 4 QUEIMADORES", "FOGÃO 5 QUEIMADORES", "FOGÃO 6 QUEIMADORES", "GABINETE BANCADA SEM CUBA", "MODULO PORTA", "GABINETE BANCADA MADEIRA", "GABINETE SEM LAVATORIO", "CJ MESA", "MESA", "OUTROS/MOVEIS", "GABINETE DE BANCADA", "GABINETE COM LAVATORIO", "SOFÁ 2 LUGARES", "SOFÁ 3 LUGARES", "GABINETE COM TANQUE ACO", "GABINETE SEM TANQUE ACO", "GABINETE BANCADA COM CUBA", "GABINETE SEM PIA MADEIRA", "MODULO GAVETA/ PORTA", "ROUPEIRO", "ESPELHEIRA SEM ILUMINAÇÃO", "ESPELHO COM ILUMINAÇÃO", "ARMÁRIOS SOBREPOR/EMBUTIR", "ESPELHO SEM ILUMINAÇÃO", "ESPELHEIRA COM ILUMINAÇÃO", "KIT BANHEIRO GAB/LAV/ESP", "GABINETE LAVANDERIA MAD", "GABINETE MAD COM TANQUE", "ESPREGUIÇADEIRA", "OMBRELONE", "CADEIRA", "BANCO JARDIM/PISCINA/CHUR", "MESA JARDIM/PISCINA/CHURR", "SOFÁ/MÓDULO", "CJ MESA JARDIM/PISCINA", "CONJUNTO DE ACO", "GABINETE COM PIA", "KIT COZINHA AÇO", "ARMÁRIO AÉREO", "PANELEIRO", "ARMÁRIO GELADEIRA", "GABINETE AEREO MADEIRA", "PANELEIRO MADEIRA", "GABINETE COM PIA MADEIRA", "GABINETE AEREO", "ARMÁRIO AÉREO MADEIRA", "ARMÁRIO GELADEIRA MADEIRA", "COZINHA COMPLETA MADEIRA", "CONJUNTO DE MADEIRA", "PORTA OBJETOS", "NICHO LAQ", "NICHO MAD", "COZINHA COMPLETA AÇO", "BALCÃO COOKTOP", "ESTOFADO POLTRONA/CHAISE/", "CARRINHO DE SERVIR", "OUTROS MÓVEIS JARDIM", "BAÚ/PORTA OBJETOS", "BALCÃO COOKTOP MAD", "KIT COZINHA MADEIRA", "PAINEL", "PRATELEIRA MADEIRA", "SUPORTE", "MESA MULTIUSO", "BANQUETAS", "DECK", "ESTANTE", "MESA CENTRO", "NICHO", "ARMÁRIO AÇO MULTIUSO SUSP", "BERÇO", "CÔMODA INFANTIL", "ROUPEIRO INFANTIL", "CAMA SOLTEIRO", "CAMA BABÁ", "MÓDULO PORTA", "MÓDULO GAVETA", "ARMARIO AEREO", "BALCÃO", "NICHO MADEIRA", "ACESSÓRIOS", "NICHO SINT.", "RACK", "ESCRIVANINHA", "HOME", "COMODA", "BALCÃO CANTO", "MULTIUSO", "BELICHE", "DORMITÓRIO", "CÔMODA", "POLIETILENO 150L", "POLIETILENO 310L", "POLIETILENO 500L", "POLIETILENO 1000L"];

const _listaCategoriaABC = [
  "METAIS SANITÁRIOS",
  "ACESSORIOS/ELÉT/SOL/GAS",
  "DUCHAS ELETRICAS"
];

const retiraLojaArr = _listaCategoriaABC.map(categoria => categoria.toLowerCase());
const produtoSKUDiv = document.getElementById("productSku");
const quantidadeInput = document.getElementById("selected-quantity");

if (produtoSKUDiv && quantidadeInput) {
  const produtoSKU = produtoSKUDiv.innerText;
  let quantidade = quantidadeInput.value;
  let pesoTotal = 0;
  let retirarEmLoja = false;
  const pickUpButton = document.querySelectorAll(".pick-up-button")
  const shippingResponse = document.querySelector(".product-shipping__response")
  const otherButtons = document.querySelectorAll(".secondary-button")

  quantidade = quantidade !== "" ? quantidade : 1;
  fetch("https://produtos.abcdaconstrucao.com.br/api/v1/produtos/pesos/referencias/" + produtoSKU, { mode: 'cors', })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {

      let { referencia, peso, departamento, categoria } = data[0];
      if (referencia === produtoSKU) {
        pesoTotal = quantidade * peso;

        if (departamento !== ""
          && typeof retiraLojaArr != "undefined"
          && (retiraLojaArr.includes(departamento.toLowerCase()) || retiraLojaArr.includes(categoria.toLowerCase()))
        ) {
          retirarEmLoja = true;
        };

        if (retirarEmLoja && pesoTotal <= 50) {
          pickUpButton.forEach((btn) => {
            btn.style.display = "flex"
          })
        }
        else {
          shippingResponse.classList.add("hide-pickup")
          otherButtons.forEach(button => {
            button.style.display = "flex"
          });
        }
      }
    })
    .catch(function (error) {
      console.error('Request failed', error)
    });
}

window.addEventListener("load", () => {
  if (productButtons) {
    const scrollTop = window.pageYOffset

    var offsetToShowProduct = productButtons ? productButtons.getBoundingClientRect().top + scrollTop : null
    if (MOBILE.matches) {
      offsetToShowProduct += 100
    }
    const offsetBottom = 200

    window.addEventListener('scroll', function () {
      const newSt = window.pageYOffset;
      setProductFloating(newSt, offsetToShowProduct, offsetBottom);
    });
  }
});