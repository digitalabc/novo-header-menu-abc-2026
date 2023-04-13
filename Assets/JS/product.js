window.addEventListener("load", productLoad, false);
let checkoutUrl = "";
let alertDiv = "";

/**
 * Page load function.
 */
async function productLoad(){
    alertDiv = document.getElementById("add-cart-alert");
    await validateWishlist();
}

/**
 * Validates if product is in the customer wishlist.
 */
async function validateWishlist(){
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
async function selectAttribute(element){
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
function getSelectedAttributes(attributeDiv, selectedAttributeId, selectedAttributeValue){
	let attributeList = [];
    if (selectedAttributeId && selectedAttributeValue)
    attributeList.push({
        attributeId :  Number(selectedAttributeId),
        value : selectedAttributeValue
    });
	const selectedAttributes = attributeDiv.querySelectorAll(`[id^="hidden-selected-attribute-"]`);
	if (selectedAttributes)
		selectedAttributes.forEach(element => {
			const attributeId = element.id.split("-").at(-1);
			if (attributeId != selectedAttributeId && 
                !(attributeList.some(x => x.attributeId == Number(attributeId))))
                
                attributeList.push({
                    attributeId : Number(attributeId),
                    value : element.value
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
async function renderAttributes(attributeList, productId){
    const variables = {
        productId: Number(productId),
        selections: attributeList
    };
    const elementId = `product-view-div-${productId}`;
    const response = await client.snippet.render("product_view_snippet.html", "product.graphql", variables);
    replaceInnerHtml(response, elementId);
    
    var thumbs = new Swiper ('.gallery-thumbs', {
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

    var slider = new Swiper ('.gallery-slider', {
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
function showAlert(content, error = false){
    alertDiv.innerHTML = `<div class="alert alert-${error ? "danger" : "success"} col-2" role="alert" style="position: fixed; bottom:0; text-align: center; margin-bottom: auto; z-index: 1;">${content}</div>`;
    alertDiv.style.visibility = "visible";
    setTimeout(hideAlert, 2000);
}

/**
 * Hides the alert content.
*/
function hideAlert(){
    alertDiv.innerHTML = "";
    alertDiv.style.visibility = "hidden";
}

/**
 * Add to cart button click.
 * @param {string} productVariantId - Product variant ID.
 */
async function addToCartClick(productVariantId){
    if (productVariantId != ""){
        const input = getAttributeProductAndQuantity(productVariantId);
        const success = await addOrCreateCheckout(input);
        if (success){
            // showAlert('Produto adicionado ao carrinho!');
            await loadMiniCart();
            openOffcanvas("#minicart-offcanvas")
        }
    }
}

/**
 * Buy button click.
 * @param {string} productVariantId - Product variant ID.
 */
async function buyClick(productVariantId){
    if (productVariantId != ""){
        const input = getAttributeProductAndQuantity(productVariantId);
        const success = await addOrCreateCheckout(input);
        if (success && checkoutUrl != ""){
            window.location = checkoutUrl;
        }
    }
}

/**
 * Subscription button click.
 * @param {string} productVariantId - Product variant ID.
 */
async function subscriptionClick(productVariantId){
    if (productVariantId != ""){        
        const subscriptionRecurringType = document.getElementById("subscription-recurring-type");
        const subscriptionGroupId = subscriptionRecurringType.options[subscriptionRecurringType.selectedIndex].getAttribute("subscription-group-id");
        
        const input = getAttributeProductAndQuantity(productVariantId);
        input[0].subscription = {
            subscriptionGroupId: Number(subscriptionGroupId),
            recurringTypeId: Number(subscriptionRecurringType.value)
        };

        const success = await addOrCreateCheckout(input);
        if (success && checkoutUrl != ""){
            window.location = checkoutUrl;
        }
    }
}

/**
 * Calls the getQuantity and getCustomizations functions and return the input object to add to checkout.
 * @param {string} variantId - Product variant ID.
 */
function getAttributeProductAndQuantity(variantId){
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
function getQuantity(){
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
async function addOrCreateCheckout(input){
    try{
        const checkout = await client.checkout.get();
        let checkoutId = null;

        if (checkout && checkout.data.checkoutId){
            const checkoutResponse = await client.checkout.add(input);            
            if (checkoutUrl == ""){
                checkoutUrl = checkoutResponse.data.url;
            }

            checkoutId = checkoutResponse.data.checkoutId;
        }
        else{
            const checkoutResponse = await client.checkout.create(input);
            checkoutUrl = checkoutResponse.data.url;
            checkoutId = checkoutResponse.data.checkoutId;
        }

        await checkoutPartnerAssociate(checkoutId);

        return true;
    } catch (error){
        showAlert('Erro ao adicionar produto ao carrinho.', true);
        console.log(error)
        return false;
    }
}

/**
 * Matrix add to cart button click.
 */
async function addToCartMatrixClick(element){
    const success = await checkoutOperations(element, 'product-view-div');
    if (success){
        showAlert('Produto(s) adicionado(s) ao carrinho!');
        await loadMiniCart();
    }
}

/**
 * Matrix buy button click.
 */
async function buyMatrixClick(element){
    const success = await checkoutOperations(element, 'product-view-div');
    if (success && checkoutUrl != ""){
        window.location = checkoutUrl;
    }
}

/**
 * Applies the wholesale price to the product.
 * @param {string} quantity - Wholesale quantity.
 */
async function applyWholesalePrice(quantity){
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
function processWholesaleResponse(html, quantity){
    const calculatedDiscount = calculateWholesaleDiscount(html, quantity);
    return html
    .replace("{price}", calculatedDiscount.price.toLocaleString('pt-BR'))
    .replace("{percent}", calculatedDiscount.percent.toLocaleString('pt-BR', {style: "percent"}));
}

/**
 * Calculates the wholesale discount.
 * @param {string} html - String HTML content.
 * @param {string} quantity - Wholesale quantity.
 */
function calculateWholesaleDiscount(html, quantity){
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const originalPriceMultiplied = Number(doc.getElementById('original-price-value').innerHTML) * quantity;
    const wholesalePrice = Number(doc.getElementById('wholesale-price-value').innerHTML);
    return { 
        price : originalPriceMultiplied - wholesalePrice, 
        percent : 1 - (wholesalePrice / originalPriceMultiplied)
    };
}

/**
 * Gets the product customizations.
 */
function getCustomizations(){
    let customizations = [];
    const inputs = document.querySelectorAll("[id^=customization-]");
    for (const input of inputs){
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
function pushProductInput(rowDiv, input){
    const elements = rowDiv.querySelectorAll('input[product-variant-id][type=number]');
    if ( elements ){
        for(const element of elements){
            const variantId = element.getAttribute("product-variant-id");
            const quantity = element.value;
            if( quantity > 0 && variantId > 0 )
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
function setButtonsEnabledByAvailability(rowDiv){
    const available = validateAvailability(rowDiv);
    setDisabledBuyButtons(rowDiv, !available);
}

/**
 * Validates that the selected quantity of the product is sufficient to enable the buy and add to cart buttons.
 * @param {HTMLElement} rowDiv - HTML row div element.
 */
function validateAvailability(rowDiv){
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
function setDisabledBuyButtons(rowDiv, disabled){
    rowDiv.querySelector('.add-to-cart-button').disabled = disabled;
    rowDiv.querySelector('.buy-button').disabled = disabled;
}

/**
 * Function for when quantity is changed in matrix attributes.
 * @param {HTMLElement} element - Input type number from matrix.
 */
function productMatrixOnChange(element){
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
 async function checkoutOperations(element, className){
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
async function backInStockOnClick(e){
    if (e) e.preventDefault();
    const productVariantId = Number(document.getElementById("product-variant-id").value);
    const name = document.getElementById("bis-name").value;
    const email = document.getElementById("bis-email").value;
    const alert = document.getElementById("bis-alert");
    const bisInput = {
        email: email,
        name: name,
        partnerAccessToken: null,
        productVariantId: productVariantId,
    }
    const success = await client.product.createRestockAlert(bisInput);
    if(success){
      alert.innerHTML = 'Email cadastrado com sucesso!';
      setTimeout(function() {
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
        document.querySelector(".warning").remove() }, 2000);
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

function updateFakeQuantity(input, fakeQuantityId) {
  const quant = Number(input.value),
        fakeQuantityInput = document.getElementById(fakeQuantityId)
  if (fakeQuantityInput) {
    const boxPrice = fakeQuantityInput.dataset.boxprice
    fakeQuantityInput.value = `${(quant == 1 ? '1 caixa' : quant + ' caixas')} = ${(boxPrice * quant).toFixed(2).replace(',', '.')} m²`;
  }
}

let getSiblings = function (e, tagName) {
  // for collecting siblings
  let siblings = []; 
  // if no parent, return no sibling
  if(!e.parentNode) {
      return siblings;
  }
  // first child of the parent node
  let sibling  = e.parentNode.firstChild;
  
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

  if(DESKTOP.matches) {
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
    buyButton.classList.add("hollow")
    button.classList.add("full")
    shippingEl.style.display = 'none'; 
    pickUpEl.style.display = 'block'; 
    top.visible_id = 'product-pick-up';
  } else {
    buyButton.classList.remove("hollow")
    button.classList.remove("full")
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

    var m2PorCaixa = precoM2 / precoProduto;

    m2PorCaixa = m2PorCaixa.toFixed(2);
    calcAmountBoxes = m2 / m2PorCaixa;
    var aux = m2 % m2PorCaixa;
    if (aux = !0) {
        calcAmountBoxes = Math.trunc(calcAmountBoxes) + 1;
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

  document.querySelector(".calculator .uk-close").click()
}

/**
 * Show/hide product floating button
*/
const productButtons = document.querySelector('.product__buttons')

function setProductFloating(scrollTop, offsetToShowProduct, offsetToHideProduct) {

  if (scrollTop > offsetToShowProduct && (window.innerHeight + scrollTop) + offsetToHideProduct <= document.body.offsetHeight) {
    body.classList.add('show-floating');
  }
  else{
    body.classList.remove('show-floating');
  }
  
}

window.addEventListener("load", () => {
  if (productButtons) {
    const scrollTop = window.pageYOffset

    var offsetToShowProduct = productButtons ? productButtons.getBoundingClientRect().top + scrollTop : null
    if(MOBILE.matches){
      offsetToShowProduct += 100
    }
    const offsetBottom = 200

    window.addEventListener('scroll', function () {
      const newSt = window.pageYOffset;
      setProductFloating(newSt, offsetToShowProduct, offsetBottom);
    });
  }
});
