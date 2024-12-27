window.addEventListener("load", loadMiniCart, false);

/**
 * Loads the minicart component via snippet call, replacing the placeholder's div content with the snippet response.
 */
async function loadMiniCart() {
    try {
        let checkoutId = client.cookie.get("carrinho-id");

        let variables = {
            checkoutId: "",
            hasCheckout: false,
        };

        if (checkoutId && checkoutId != "") {
            variables.checkoutId = checkoutId;
            variables.hasCheckout = true;
        }

        const response = await client.snippet.render(
            "mini_cart_snippet.html",
            "SnippetQueries/mini_cart.graphql",
            variables
        );

        const elementId = 'min-cart-items';
        setInnerHtmlById(response, elementId);
        updateCartQtyLabel();

        if (variables.hasCheckout) {
            await addUtmMetadata(variables.checkoutId);
        }

    } catch (error) {
        console.log(error);
    }
}

/**
 * Shows or hides the cart when the mouse moves over or out
 */
function setCartDivVisibility() {
    if(!document.getElementById("side-card-over-list").classList.contains('open')){
        document.getElementById("side-card-over-list").classList.remove('hidden')
        setTimeout(() => {
            document.getElementById("side-card-over-list").classList.remove('opacity-0')        
            document.getElementById("side-card-over-list").classList.add('opacity-100')
            document.getElementById("side-card-over-list").classList.add('open')
            document.getElementById("side-bar-cart").classList.remove('translate-x-full')
            document.getElementById("side-bar-cart").classList.add('translate-x-0') 
        },100)               
        window.dispatchEvent(new Event("cartViewed"));
    }else{
        document.getElementById("side-card-over-list").classList.add('opacity-0')
        document.getElementById("side-card-over-list").classList.remove('opacity-100')
        document.getElementById("side-card-over-list").classList.remove('open')
        document.getElementById("side-bar-cart").classList.add('translate-x-full')
        document.getElementById("side-bar-cart").classList.remove('translate-x-0')
        setTimeout(() => {document.getElementById("side-card-over-list").classList.add('hidden')},200)        
    }
}

/**
 * Associates the current checkout with a partner
 */
async function miniCartPartnerAssociate() {
    let checkoutId = client.cookie.get('carrinho-id');
    if (checkoutId) await checkoutPartnerAssociate(checkoutId);
}

async function removeProductFromCart(id, qty, customizationId) {
    try {
        let checkoutId = client.cookie.get('carrinho-id');
        const input = getMiniCartAddOrSubtractInput(id, Number(qty), customizationId);        
        const checkoutData = await client.checkout.remove(input, checkoutId);
        await loadMiniCart();
        showOverlay('Produto removido!', 'Produto removido do carrinho');

        window.dispatchEvent(new CustomEvent("productRemovedFromCart", {
            detail: { 
                cart: checkoutData.data,
                products : [{
                    productVariantId: Number(id),
                    quantity: Number(qty)
                }]
            }
        }));
    } catch (error) {
        console.log(error);
        showOverlay('Ocorreu um erro!', 'Erro ao remover o produto do carrinho', true);
    }
}

function updateCartQtyLabel(){
    const qtyInput = document.getElementById("cart-products-qty");
    const qtyLabel = document.getElementById("cart-qty-label");
    
    if (qtyInput && qtyLabel){
        qtyLabel.innerHTML = qtyInput.value;
        const qty = parseInt(qtyInput.value);
        if (qty >= 1){
            qtyLabel.classList.add("bg-primary-600");
            qtyLabel.classList.remove("bg-secondary-600");
        }
        if (qty === 0){
            qtyLabel.classList.add("bg-secondary-600");
            qtyLabel.classList.remove("bg-primary-600");
        }
    }
}

function getMiniCartAddOrSubtractInput(productVariantId, quantity, customizationId){
    const input = [
        {
            productVariantId: Number(productVariantId),
            quantity
        }
    ];

    if (customizationId){
        input[0].customizationId = customizationId;
    }

    return input;
}

async function miniCartAddQuantity(productVariantId, customizationId){
    const input = getMiniCartAddOrSubtractInput(productVariantId, 1, customizationId);
    await client.checkout.add(input);
    await loadMiniCart();
}

async function miniCartSubtractQuantity(productVariantId, customizationId){
    const input = getMiniCartAddOrSubtractInput(productVariantId, 1, customizationId);
    await client.checkout.remove(input);
    await loadMiniCart();
}

async function addUtmMetadata(checkoutId) {
    var metadataValues = []
    let utmSource = queryStringParams.get("utm_source");
    let utmMedium = queryStringParams.get("utm_medium");
    let utmCampaign = queryStringParams.get("utm_campaign");
    let utmTerm = queryStringParams.get("utm_term");
    let utmContent = queryStringParams.get("utm_content");

    if (utmSource) {
        metadataValues.push({key: "utmSource", value: utmSource})
    }
    if (utmMedium) {
        metadataValues.push({key: "utmMedium", value: utmMedium})
    }
    if (utmCampaign) {
        metadataValues.push({key: "utmCampaign", value: utmCampaign})
    }
    if (utmTerm) {
        metadataValues.push({key: "utmTerm", value: utmTerm})
    }
    if (utmContent) {
        metadataValues.push({key: "utmContent", value: utmContent})
    }

    if (metadataValues.length > 0) {
        await client.checkout.addCheckoutMetadata(metadataValues, checkoutId);
    }
}

/**
* The kit add to cart's click event function
*/
async function miniCartAddKitQuantity(kitId, kitGroupId) {
    const input = await miniCartGetKitInput(kitId, kitGroupId, 1);
    const response = await client.checkout.addKit(input);
    if (kitOperationIsSuccess(response)) await loadMiniCart();
}

async function miniCartSubtractKitQuantity(kitId, kitGroupId){
    const input = await miniCartGetKitInput(kitId, kitGroupId, 1);
    const response = await client.checkout.removeKit(input);
    if (kitOperationIsSuccess(response)) await loadMiniCart();
}

async function miniCartRemoveKit(kitId, kitGroupId, quantity){
    const input = await miniCartGetKitInput(kitId, kitGroupId, Number(quantity));
    const response = await client.checkout.removeKit(input);
    if (kitOperationIsSuccess(response)) await loadMiniCart();
}

async function miniCartGetKitInput(kitId, kitGroupId, quantity){
    const checkoutId = await client.cookie.get("carrinho-id");

    const input = {
        quantity,
        kitId: Number(kitId),
        kitGroupId,
        id: checkoutId,
    };

    return input;
}

function kitOperationIsSuccess(response){
    if (response?.errors !== "undefined" && response?.errors?.length > 0){
        showOverlay('Ocorreu um erro', response.errors[0].message, true)
        return false;
    }

    return true;
}
