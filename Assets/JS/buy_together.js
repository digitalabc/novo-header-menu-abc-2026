window.addEventListener("load", buyTogetherSetup, false);

/**
 * Replaces the content of a given element with the passed html parameter.
 * @param {string} html - The content that will replace the element's inner html
 * @param {string} id - The id used to search for the element in the document
 */
function replaceInnerHtml2(html, id) {
    const div = document.getElementById(id);
    if (div && html !== undefined) div.innerHTML = html;
}
/**
 * The page load event triggers the setup for the buy together component,
 * iterating through each empty row created earlier, making a snippet call
 * to get the buy together row component, an replacing the content of the 
 * div with the snippet result.
 */
async function buyTogetherSetup() {
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

        replaceInnerHtml2(response, row.id);
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
async function buyTogetherSelectAttribute(element) {
    const attrId = element.getAttribute("attribute-id");
    const attrValue = element.value;
    const productId = element.getAttribute("product-id");
    const attributeDiv = element.closest('.attribute-selections');
    const selections = getSelectedAttributes(attributeDiv, attrId, attrValue);

    const spotDiv = element.closest('.product-view-div');
    const rowDiv = element.closest('.buy-together-row-div');

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
async function buyTogetherRenderAttributes(productId, selections, spotDiv) {
    const variables = {
        id: Number(productId),
        selections
    };

    const response = await client.snippet.render(
        "buy_together_spot_snippet.html",
        "SnippetQueries/buy_together_spot.graphql",
        variables);
    spotDiv.innerHTML = response;
}

/**
 * The add to cart's click event function
 * @param {HTMLInputElement} element - The button originating the operation, for context.
 */
async function buyTogetherAddToCartClick(element) {
    const success = await checkoutOperations(element, 'buy-together-row-div');
    if (success) {
        // showAlert("Produtos adicionado ao carrinho!");
        await loadMiniCart();
        openOffcanvas("#minicart-offcanvas")
    }
}

/**
 * The buy button's click event function
 * @param {HTMLInputElement} element - The button originating the operation, for context.
 */
async function buyTogetherBuyClick(element) {
    const success = await checkoutOperations(element, 'buy-together-row-div');
    if (success && checkoutUrl != "") {
        window.location = checkoutUrl;
    }
}

/**
 * The event for a value change in a product quantity input
 * @param {HTMLInputElement} element - The quantity input originating the operation, for context.
 */
async function buyTogetherQuantityButtonAdd(element) {
    const input = element.closest('.wrapper').querySelector(".buy-together-quantity");

    const max = +input.getAttribute("max")
    const value = +input.value + 1

    console.log(value > max, value)

    if (value > max) {
        input.value = max
    } else {
        input.value = value
    }

    const rowDiv = element.closest('.buy-together-row-div');
    await buyTogetherCalculatePrices(rowDiv);
    setButtonsEnabledByAvailability(rowDiv);
}

/**
 * The event for a value change in a product quantity input
 * @param {HTMLInputElement} element - The quantity input originating the operation, for context.
 */
async function buyTogetherQuantityButtonRemove(element) {
    const input = element.closest('.wrapper').querySelector(".buy-together-quantity");

    const min = +input.getAttribute("min")
    const value = +input.value - 1

    console.log(value > min, value)

    if (value < min) {
        input.value = max
    } else {
        input.value = value
    }

    const rowDiv = element.closest('.buy-together-row-div');
    await buyTogetherCalculatePrices(rowDiv);
    setButtonsEnabledByAvailability(rowDiv);
}

/**
 * The event for a value change in a product quantity input
 * @param {HTMLInputElement} element - The quantity input originating the operation, for context.
 */
async function buyTogetherQuantityOnChange(element) {
    const max = +element.getAttribute("max")
    const value = +element.value

    console.log(value > max)

    if (value > max) {
        element.value = max
    }

    const rowDiv = element.closest('.buy-together-row-div');
    await buyTogetherCalculatePrices(rowDiv);
    setButtonsEnabledByAvailability(rowDiv);
}

async function getPricesBuyTogether(data, priceEl, list_priceEl, textPix = "") {
    const raw = await client.snippet.render(
        "buy_together_price_data.html",
        "SnippetQueries/calculate_prices.graphql",
        { calculatePricesProductsInput: data }
    );

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = raw;

    const scriptTag = tempDiv.querySelector("#price-data");
    let rawData = scriptTag?.textContent?.trim();

    if (!rawData) {
        console.error("Dados não encontrados no snippet.");
        return;
    }

    rawData = rawData.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');

    let json;

    try {
        json = JSON.parse(rawData);
    } catch (err) {
        console.error("Erro ao parsear JSON corrigido:", err, rawData);
        return;
    }

    const totalQuantity = data[0] ? data[0].quantity : 0 + data[1] ? data[1].quantity : 0

    const calculatePrices = json.find(entry => entry.key === "calculate_prices")?.value || [];
    const price = calculatePrices.find(entry => entry.key === "price")?.value;

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price - (totalQuantity / 100));

    if (priceEl) {
        priceEl.innerHTML = `<span class="value">${formattedPrice}</span> ${textPix}`;
    }

    const list_calculatePrices = json.find(entry => entry.key === "calculate_prices")?.value || [];
    const list_price = list_calculatePrices.find(entry => entry.key === "list_price")?.value;

    const list_formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(list_price - (totalQuantity / 100));

    const discount = ((list_price - price) / list_price) * 100;
    const discountPercentage = Math.round(discount);
    if (list_priceEl) {
        list_priceEl.innerHTML = `<span class="value">${list_formattedPrice}</span><span class="badge">${discountPercentage}%</span>`;
    }

    return
}

/**
 * Recalculates the price for a buy together row product couple
 * @param {HTMLDivElement} rowDiv - The button originating the operation, for context.
 */
async function buyTogetherCalculatePrices(rowDiv) {
    const input = [];
    console.log("Calculating prices for row", rowDiv);

    pushProductInput(rowDiv, input);

    
    const priceDiv = rowDiv.querySelector('[id^="buy-together-price-"]');
    const price1 = rowDiv.querySelector('.product-buy-together-div-1 .buy-together__price');
    const price2 = rowDiv.querySelector('.product-buy-together-div-2 .buy-together__price');
    
    const list_price1 = rowDiv.querySelector('.product-buy-together-div-1 .buy-together__list_price');
    const list_price2 = rowDiv.querySelector('.product-buy-together-div-2 .buy-together__list_price');
    
    console.log("Input for price calculation:", input);

    Promise.all([
        await getPricesBuyTogether(input, priceDiv, null, 'à vista no PIX'),
        await getPricesBuyTogether([input[0]], price1, list_price1, 'no pix'),
        await getPricesBuyTogether([input[1]], price2, list_price2, 'no pix'),
    ])
}


async function buy_together_add_product_view(element) {
    const input = [];
    
    const div = element.closest('.buy-together__data').querySelector('.buy-together-quantity');
    if (!div) {
        console.error("Buy together quantity input not found.");
        return;
    }

    await input.push({
        productVariantId: +div.getAttribute("product-variant-id"),
        quantity: +div.value
    });

    const success = await addOrCreateCheckout(input);

    if (success) {
        await loadMiniCart();
        openOffcanvas("#minicart-offcanvas")
        div.value = 1; // Reset quantity input after adding to cart
        console.log("Product added to cart successfully.");
    }
}
