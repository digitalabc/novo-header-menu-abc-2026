window.addEventListener("load", buyTogetherSetup, false);

/**
 * The page load event triggers the setup for the buy together component,
 * iterating through each empty row created earlier, making a snippet call
 * to get the buy together row component, an replacing the content of the 
 * div with the snippet result.
 */
async function buyTogetherSetup(){
    const rows = document.querySelectorAll('[id^="buy-together-row-"]');
    if (rows == null || rows.size < 1) return;

    for (let row of rows) {
        const buyTogetherProductId = row.getAttribute("buy-together-product-id");
        const pageProductId = row.getAttribute("page-product-id");

        const response = await client.snippet.render(
            "buy_together_row_snippet.html",
            "SnippetQueries/buy_together.graphql",
            {
                pageProductId: Number(pageProductId),
                buyTogetherProductId: Number(buyTogetherProductId)
            });
        setInnerHtml(response, row);
        await buyTogetherCalculatePrices(row);
        setButtonsEnabledByAvailability(row);
    }
}

/**
/**
 * Reloads the buy list product div the newly selected attribute, and recalculates the price.
 * This page uses contextual searching for information, going up to the closest() div
 * above to get the current buy list product scope.
 * @param {HTMLInputElement} element - The html element originating this call, 
 */
async function buyTogetherSelectAttribute(element){
	const attrId = element.getAttribute("attribute-id");
	const attrValue = element.value;
	const productId = element.getAttribute("product-id");
	const attributeDiv = element.closest('[attribute-selections]');
	const selections = getSelectedAttributes(attributeDiv, attrId, attrValue);
	
    const spotDiv = element.closest('[product-view-div]');
	const rowDiv = element.closest('[buy-together-row-div]');
	
	await buyTogetherRenderAttributes(productId, selections, spotDiv);
    await buyTogetherCalculatePrices(rowDiv);
    setButtonsEnabledByAvailability(rowDiv);
}

/**
 * Makes a snippet call to render the updated product with the given attribute selections
 * @param {string | number} productId - The product id
 * @param {object[]} selections - The list of selected attributes and it's values
 * @param {number} selections[].attributeId
 * @param {string} selections[].value
 * @param {HTMLDivElement} spotDiv - The buy together's single product spot div
 */
async function buyTogetherRenderAttributes(productId, selections, spotDiv){
	const variables = {
		id: Number(productId),
		selections
	};

    const response = await client.snippet.render(
        "buy_together_spot_snippet.html",
        "SnippetQueries/buy_together_spot.graphql",
        variables);
    setInnerHtml(response, spotDiv);
}

/**
 * The add to cart's click event function
 * @param {HTMLInputElement} element - The button originating the operation, for context.
 */
async function buyTogetherAddToCartClick(element){
    const success = await checkoutOperations(element, 'buy-together-row-div');
    if (success){
        showOverlay("Produto adicionado!", "Produtos adicionado ao carrinho!")
        await loadMiniCart();
    } else {
        showOverlay('Não foi possível adicionar o produto(s) ao carrinho', 'Selecione preencher os campos corretamente e tente novamente', true)
    }
}

/**
 * The buy button's click event function
 * @param {HTMLInputElement} element - The button originating the operation, for context.
 */
async function buyTogetherBuyClick(element){
    const success = await checkoutOperations(element, 'buy-together-row-div');
    
    if(!success) {
        showOverlay('Não foi possível adicionar o produto(s) ao carrinho', 'Selecione preencher os campos corretamente e tente novamente', true)
    }

    if (success){
        window.location = checkout_pages.checkout.home;
    }
}

/**
 * The event for a value change in a product quantity input
 * @param {HTMLInputElement} element - The quantity input originating the operation, for context.
 */
async function buyTogetherQuantityOnChange(element){
    const rowDiv = element.closest('[buy-together-row-div]');
    await buyTogetherCalculatePrices(rowDiv);
    setButtonsEnabledByAvailability(rowDiv);
}

/**
 * Recalculates the price for a buy together row product couple
 * @param {HTMLDivElement} rowDiv - The button originating the operation, for context.
 */
async function buyTogetherCalculatePrices(rowDiv){
    const input = [];
    pushProductInput(rowDiv, input);

    const priceDiv = rowDiv.querySelector('[id^="buy-together-price-"]');
    const response = await client.snippet.render(
        "price_snippet.html",
        "SnippetQueries/calculate_prices.graphql",
        { calculatePricesProductsInput: input });
        
    setInnerHtml(response, priceDiv);
}