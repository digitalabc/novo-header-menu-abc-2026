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

    wishlistButton.className = "btn btn-sm btn-danger";
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
}

/**
 * Shows an alert message for 2 seconds in a hovering box.
 * @param {string} content - The text to be displayed in a hover alert message
 * @param {bool} error - If it is an error message, displays different color
*/
function showAlert(content, error = false){
    alertDiv.innerHTML = `<div class="alert alert-${error ? "danger" : "success"} col-2" role="alert" style="position: fixed; text-align: center; margin-bottom: auto; z-index: 1;">${content}</div>`;
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
            showAlert('Produto adicionado ao carrinho!');
            await loadMiniCart();
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
    const bisInput = {
        email: email,
        name: name,
        partnerAccessToken: null,
        productVariantId: productVariantId,
    }
    const success = await client.product.createRestockAlert(bisInput);
    if(success) showAlert('Email cadastrado com sucesso!');
}
