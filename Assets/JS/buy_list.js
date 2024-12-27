window.addEventListener("load", buyListSetup, false);
window.addEventListener("dataLayerConfigured", handleBuyListPageView, false);

let buyListProductsInfo = [];
let buyListSetupCompleted = false;
let buyListSetupPromise = null;
let includeSameParentDict = {};

/**
 * Iterates over the buy list hidden input's productId array, loading the product information in a snippet
 * and assigning the resulting row to the respective product div
 */
async function buyListSetup() {
    const rows = document.querySelectorAll('[id^="buy-list-product-div-"]');
    if (rows == null || rows.size < 1) return;

    buyListSetupPromise = new Promise(async (resolve) => {
        const isKit = document.getElementById('is_kit')?.value === "true";

        for (const row of rows) {
            const id = Number(row.getAttribute('product-id'));
            const includeSameParent = row.getAttribute('include-same-parent') === "true";
            const snippet = isKit ? "kit_product_snippet.html" : "buy_list_product_snippet.html";

            includeSameParentDict[id] = includeSameParent;

            const response = await client.snippet.detailed(
                snippet,
                "SnippetQueries/buy_list_product.graphql",
                { id, includeParentIdVariants: includeSameParent }
            );
            setInnerHtml(response.html, row);
            buyListProductsInfo.push(response.queryResponse.data.product);
        }

        if (!isKit)
            await buyListCalculatePrices();

        buyListSetupCompleted = true;
        resolve();
    });
}

async function handleBuyListPageView() {
    if (!buyListSetupCompleted) {
        await buyListSetupPromise;
    }
    window.dispatchEvent(
        new CustomEvent('buyListPageViewed', {
            detail: {
                products: buyListProductsInfo
            }
        })
    );
}

/**
* Iterates the page's buy list product divs, evaluating if each product should be added to the list (based
* on the product availability, quantity selected, and if it is selected on the checkbox).
*/
function buyListGetProductsAndQuantities() {
    const rows = document.querySelectorAll('[id^="buy-list-product-div-"]');
    if (rows == null || rows.size < 1) return;
    
    let input = [];
    for (const row of rows)
        buyListPushProductInput(row.getAttribute('product-id'), input);
    
    return input;
}

/**
* Recalculates the total value of the buy list by processing each product row
* to validate if it should the considered in the total price, if positive
* the product gets added to the price input, then we calculate it and replace.
* Additional parameter passing means that the method was called by a buy list
* product change, then we reload the price in that product's div as well.
* @param {string | null} productId - The id of the product that thriggered this call (optional)
*/
async function buyListCalculatePrices(productId = null) {
    let input = buyListGetProductsAndQuantities();
    if (input == null) return;
    await buyListRenderAndReplacePrice(input, "product-prices-div");
    
    if (productId) {
        input = [];
        buyListPushProductInput(productId, input);
        await buyListRenderAndReplacePrice(
            input,
            "buy-list-product-price-" + productId
        );
    }
}

/**
* Avaliates if the product is selected in the checkbox, then proceeds to validate
* on it's more generic case, adding it to the given input list.
* @param {string} productId - The product Id
* @param {object[]} input - The input list we are populating
* @param {number} input[].productVariantId - The variant id of the product
* @param {number} input[].quantity - How many units of this item is the selection
*/
function buyListPushProductInput(productId, input) {
    const isProductSelected = document.getElementById(
        "buy-list-product-checked-" + productId
    )?.checked;
    
    if (isProductSelected) {
        const productDiv = document.getElementById(
            "buy-list-product-div-" + productId
        );
        pushProductInput(productDiv, input);
    }
}

/**
* Renders the price snippet using an array of product ids and quantities for the query,
* and replaces the content of the div with the result
* @param {object[]} input - The query input object, a list of objects containing productVariantId and quantity
* @param {number} input[].productVariantId - The variant id of the product
* @param {number} input[].quantity - How many units of this item is the selection
* @param {string} priceDivId - The div's id that should be replaced
*/
async function buyListRenderAndReplacePrice(input, priceDivId) {
    const response = await client.snippet.render(
        "price_snippet.html",
        "SnippetQueries/calculate_prices.graphql",
        { calculatePricesProductsInput: input }
    );
    setInnerHtmlById(response, priceDivId);
}

/**
* Reloads the buy list product div the newly selected attribute, and recalculates the price.
* This page uses contextual searching for information, going up to the closest() div
* above to get the current buy list product scope.
* @param {HTMLInputElement} element - The html element originating this call, 
*/
async function buyListSelectAttribute(element) {
    const attrId = element.getAttribute("attribute-id");
    const attrValue = element.value;
    const productId = element.getAttribute("product-id");
    const attributeDiv = element.closest("[attribute-selections]");
    const selections = getSelectedAttributes(attributeDiv, attrId, attrValue);
    
    await buyListRenderAttributes(element, productId, selections);
    await buyListCalculatePrices(productId);
}

/**
* Reloads the kit product div the newly selected attribute.
* This page uses contextual searching for information, going up to the closest() div
* above to get the current buy list product scope.
* @param {HTMLInputElement} element - The html element originating this call, 
*/
async function kitSelectAttribute(element) {
    const attrId = element.getAttribute("attribute-id");
    const attrValue = element.value;
    const productId = element.getAttribute("product-id");
    const attributeDiv = element.closest("[attribute-selections]");
    const selections = getSelectedAttributes(attributeDiv, attrId, attrValue);
    
    await buyListRenderAttributes(element, productId, selections, true);
}

/**
* Reloads the buy list product div with the updated information loaded from the product snippet,
* accounting the change in the product's attribute selection.
* @param {string | number} productId - The product id
* @param {object[]} selections - The list of selected attributes and it's values
* @param {number} selections[].attributeId
* @param {string} selections[].value
*/
async function buyListRenderAttributes(attributeElement, productId, selections, isKit) {
    productId = Number(productId);
    const includeSameParent = includeSameParentDict[productId];
    const snippet = isKit ? "kit_product_snippet.html" : "buy_list_product_snippet.html";
    
    const variables = {
        id: productId,
        selections,
        includeParentIdVariants: includeSameParent
    };
    
    const response = await client.snippet.render(
        snippet,
        "SnippetQueries/buy_list_product.graphql",
        variables
    );
    
    const buyListProductDiv = attributeElement.closest("[buy-list-product-div]");
    setInnerHtmlById(response, buyListProductDiv.id);
}

/**
* The buy button's click event function
*/
async function buyListBuyClick() {
    const input = buyListGetProductsAndQuantities();

    if (input.length == 0) {
        showOverlay('Não foi possivel adicionar ao carrinho!', 'Selecione pelo menos um item da lista', true);
        return;
    }
    
    const success = await addOrCreateCheckout(input);
    if (!success) {
        showOverlay('Ocorreu um erro!', 'Ocorreu um erro, por favor, tente novamente', true);
    }
    
    if (success) {
        window.location = checkout_pages.checkout.home;
    }
}

/**
* The kit buy button's click event function
*/
async function kitBuyClick() {
    const input = await getKitAddToCartInput();
    if (input) {
        if (await addKitToCart(input)) {
            window.location = checkout_pages.checkout.home;
        }
    }
}

/**
* The add to cart's click event function
*/
async function buyListAddToCartClick() {
    const input = buyListGetProductsAndQuantities();

    if (input.length == 0) {
        showOverlay('Não foi possivel adicionar ao carrinho!', 'Selecione pelo menos um item da lista', true);
        return;
    }
    
    const success = await addOrCreateCheckout(input);
    if (success) {
        showOverlay("Produto adicionado!", "Produto(s) adicionado(s) ao carrinho!")
        await loadMiniCart();
    } else {
        showOverlay('Ocorreu um erro!', 'Erro ao adicionar produto(s) ao carrinho.', true)
    }
}

/**
* The kit add to cart's click event function
*/
async function kitAddToCartClick() {
    const input = await getKitAddToCartInput();
    if (input){
        if (await addKitToCart(input))
            await loadMiniCart();
    } 
}

function getKitSelectedVariantsInput(){
    const variantsElements = document.querySelectorAll('[id^="kit-product-selected-variant-"]');
    if (variantsElements == null || variantsElements.size < 1) return;
    
    const productsDict = {};
    
    // Fetches the selected variants
    for (const element of variantsElements) {
        let variantId = element.value;
        if (variantId == null || variantId === "")
            return [];
        
        const productId = Number(element.getAttribute('product-id'));
        variantId = Number(variantId);
        
        if (productsDict[productId]) productsDict[productId].push(variantId)
        else productsDict[productId] = [variantId];
    }
    
    const products = [];
    
    // Processes the variants and builds the product input for adding to the cart
    for (let productId in productsDict) {
        productId = Number(productId);

        const product = {
            productId: productId,
            variants: []
        };
        
        const processed = [];

        for (let productVariantId of productsDict[productId]) {
            productVariantId = Number(productVariantId);

            if (processed.includes(productVariantId)) continue;
            
            processed.push(productVariantId);

            const variant = {
                productVariantId: productVariantId,
                quantity: 0
            };

            for (const item of productsDict[productId]) {
                if (item === productVariantId) variant.quantity++;
            }
            
            product.variants.push(variant);
        }
        
        products.push(product);
    }
    
    return products;
}

function getKitSelectedQuantity(){
    const selectedQuantity = document.getElementById("selected-quantity");    
    if (!selectedQuantity) return 1;
    const quantity = Number(selectedQuantity.value);
    if (quantity < 1) return 1;
    return quantity;
}

async function getKitAddToCartInput(){
    const productsInput = getKitSelectedVariantsInput();
    
    if (productsInput.length == 0) {
        showOverlay('Não foi possivel adicionar ao carrinho!', 'Selecione as variações de todos os produtos do kit', true);
        return;
    }
    
    const quantity = getKitSelectedQuantity();
    const kitId = Number(document.getElementById("buy-list-id")?.value);
    const checkoutId = await client.cookie.get("carrinho-id");

    const input = {
        quantity,
        kitId,
        id: checkoutId,
        products: productsInput
    };

    return input;
}

async function addKitToCart(input){
    const response = await client.checkout.addKit(input);
    let success = true;

    if (response?.errors !== "undefined" && response?.errors?.length > 0)
        success = false;

    if (success) {
        showOverlay("Kit adicionado!", "Kit adicionado ao carrinho!")
    } else {
        showOverlay('Erro ao adicionar kit ao carrinho', response.errors[0].message, true)
    }

    return success;
}
