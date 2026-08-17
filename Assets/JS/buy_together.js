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
    if (rows == null || rows.length < 1) return;

    for (const row of rows) {
        const products = row.querySelectorAll('.product-buy-together-div-complementary[buy-together-product-id]');
        for (const product of products) {
            const buyTogetherProductId = product.getAttribute("buy-together-product-id");
            if (!buyTogetherProductId) continue;

            const response = await client.snippet.render(
                "buy_together_selectable_spot_snippet.html",
                "SnippetQueries/buy_together_spot.graphql",
                {
                    id: Number(buyTogetherProductId)
                });

            replaceInnerHtml2(response, product.id);
        }

        buyTogetherSyncSelectionState(row);
        await buyTogetherCalculatePrices(row);
        buyTogetherSetButtonsEnabledByAvailability(row);
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
    buyTogetherSetButtonsEnabledByAvailability(rowDiv);
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
    const snippet = spotDiv.classList.contains('is-main')
        ? "buy_together_main_spot_snippet.html"
        : spotDiv.classList.contains('is-selectable')
        ? "buy_together_selectable_spot_snippet.html"
        : "buy_together_spot_snippet.html";

    const response = await client.snippet.render(
        snippet,
        "SnippetQueries/buy_together_spot.graphql",
        variables);
    spotDiv.innerHTML = response;
}

/**
 * The add to cart's click event function
 * @param {HTMLInputElement} element - The button originating the operation, for context.
 */
async function buyTogetherAddToCartClick(element) {
    const rowDiv = element.closest('.buy-together-row-div');
    const input = buyTogetherGetProductsAndQuantities(rowDiv);
    console.log('[buyTogether] click add to cart, input:', input);

    const success = input.length > 0 && await addOrCreateCheckout(input);
    console.log('[buyTogether] success:', success);

    if (success) {
        await loadMiniCart();
        openOffcanvas("#minicart-offcanvas")
    }
}

/**
 * The buy button's click event function
 * @param {HTMLInputElement} element - The button originating the operation, for context.
 */
async function buyTogetherBuyClick(element) {
    const input = buyTogetherGetProductsAndQuantities(element.closest('.buy-together-row-div'));
    const success = input.length > 0 && await addOrCreateCheckout(input);
    if (success && checkoutUrl != "") {
        window.location = checkoutUrl;
    }
}

async function buyTogetherSelectionOnChange(element) {
    const rowDiv = element.closest('.buy-together-row-div');
    buyTogetherSyncSelectionState(rowDiv);
    await buyTogetherCalculatePrices(rowDiv);
    buyTogetherSetButtonsEnabledByAvailability(rowDiv);
}

/**
 * The event for a value change in a product quantity input
 * @param {HTMLInputElement} element - The quantity input originating the operation, for context.
 */
async function buyTogetherQuantityButtonAdd(element) {
    const input = element.closest('.wrapper').querySelector(".buy-together-quantity");

    const max = +input.getAttribute("max")
    const value = +input.value + 1

    if (value > max) {
        input.value = max
    } else {
        input.value = value
    }

    const rowDiv = element.closest('.buy-together-row-div');
    await buyTogetherCalculatePrices(rowDiv);
    buyTogetherSetButtonsEnabledByAvailability(rowDiv);
}

/**
 * The event for a value change in a product quantity input
 * @param {HTMLInputElement} element - The quantity input originating the operation, for context.
 */
async function buyTogetherQuantityButtonRemove(element) {
    const input = element.closest('.wrapper').querySelector(".buy-together-quantity");

    const min = +input.getAttribute("min")
    const value = +input.value - 1

    if (value < min) {
        input.value = min
    } else {
        input.value = value
    }

    const rowDiv = element.closest('.buy-together-row-div');
    await buyTogetherCalculatePrices(rowDiv);
    buyTogetherSetButtonsEnabledByAvailability(rowDiv);
}

/**
 * The event for a value change in a product quantity input
 * @param {HTMLInputElement} element - The quantity input originating the operation, for context.
 */
async function buyTogetherQuantityOnChange(element) {
    const max = +element.getAttribute("max")
    const min = +element.getAttribute("min")
    const value = +element.value

    if (value > max) {
        element.value = max
    }
    if (value < min) {
        element.value = min
    }

    const rowDiv = element.closest('.buy-together-row-div');
    await buyTogetherCalculatePrices(rowDiv);
    buyTogetherSetButtonsEnabledByAvailability(rowDiv);
}

async function getPricesBuyTogether(data, priceEl, list_priceEl, textPix = "") {
    if (!data || data.length === 0) {
        if (priceEl) priceEl.innerHTML = "";
        if (list_priceEl) list_priceEl.innerHTML = "";
        return;
    }

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


    const calculatePrices = normalizeBuyTogetherPriceData(json);
    const findValue = (key) => getBuyTogetherPriceValue(calculatePrices, key);
    const price = Number(findValue("price") || 0);
    const list_price = Number(findValue("listPrice") || findValue("list_price") || 0);
    const discountFromPrice = Number(findValue("discountPercentage") || findValue("discount_percentage") || 0);

    const formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(price);

    if (priceEl) {
        const unit = priceEl.getAttribute("data-unit");
        const unitText = unit ? `<span class="unit">${unit}</span>` : "";
        priceEl.innerHTML = `<span class="value">${formattedPrice}</span> ${textPix}`;
    }

    const list_formattedPrice = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(list_price);

    if (list_priceEl) {
        const discount = list_price > price ? ((list_price - price) / list_price) * 100 : 0;
        const discountPercentage = Math.round(discount);
        list_priceEl.innerHTML = list_price > price
            ? `<span class="value">${list_formattedPrice}</span>
            <span class="badge">
             <svg class="badgeArrow" xmlns="http://www.w3.org/2000/svg" width="7" height="10" viewBox="0 0 7 10" fill="none">
             <path d="M0 5.83333L0.845833 5.01667L2.91667 7.0875V0L4.08333 0V7.0875L6.15417 5.01667L7 5.83333L3.5 9.33333L0 5.83333Z" fill="white"/>
             </svg> ${discountPercentage}% OFF
            </span>`
            : "";
    }

    return
}

function buyTogetherGetProductsAndQuantities(rowDiv) {
    const input = [];
    if (!rowDiv) return input;

    const products = rowDiv.querySelectorAll('.product-buy-together-div');
    console.log('[buyTogether] products encontrados:', products.length, products);

    products.forEach(productDiv => {
        const selection = productDiv.querySelector('.buy-together-product-selected');
        if (selection && !selection.checked) return;
        pushProductInput(productDiv, input);
    });

    console.log('[buyTogether] input final:', input);
    return input;
}

function normalizeBuyTogetherPriceData(json) {
    if (Array.isArray(json)) {
        const entry = json.find(item => item.key === "calculate_prices" || item.key === "calculatePrices");
        return entry?.value || json;
    }

    return json?.calculate_prices || json?.calculatePrices || json || {};
}

function getBuyTogetherPriceValue(data, key) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);

    if (Array.isArray(data)) {
        return data.find(entry => entry.key === key || entry.key === snakeKey)?.value;
    }

    return data?.[key] ?? data?.[snakeKey];
}

function buyTogetherGetProductQuantity(productDiv) {
    const input = [];
    if (productDiv) pushProductInput(productDiv, input);
    return input;
}

function buyTogetherSyncSelectionState(rowDiv) {
    rowDiv.querySelectorAll('.product-buy-together-div').forEach(productDiv => {
        const selection = productDiv.querySelector('.buy-together-product-selected');
        productDiv.classList.toggle('is-unselected', Boolean(selection && !selection.checked));
    });
}

function buyTogetherValidateAvailability(rowDiv) {
    if (!rowDiv) return false;

    const selectedProducts = Array.from(rowDiv.querySelectorAll('.product-buy-together-div')).filter(productDiv => {
        const selection = productDiv.querySelector('.buy-together-product-selected');
        return !selection || selection.checked;
    });

    console.log('[buyTogether] selectedProducts:', selectedProducts.length);

    const available = selectedProducts.length > 0 && selectedProducts.every(productDiv => {
        const qty = buyTogetherGetProductQuantity(productDiv);
        console.log('[buyTogether] quantity para produto:', productDiv.id, qty);
        return qty.length > 0;
    });

    console.log('[buyTogether] available:', available);
    return available;
}

function buyTogetherSetButtonsEnabledByAvailability(rowDiv) {
    if (!rowDiv) return;

    const available = buyTogetherValidateAvailability(rowDiv);
    rowDiv.querySelectorAll('.add-to-cart-button, .buy-button').forEach(button => {
        button.disabled = !available;
        if (available) {
            button.removeAttribute('disabled');
        } else {
            button.setAttribute('disabled', 'disabled');
        }
    });
}

/**
 * Recalculates the price for a buy together row product couple
 * @param {HTMLDivElement} rowDiv - The button originating the operation, for context.
 */
async function buyTogetherCalculatePrices(rowDiv) {
    const input = buyTogetherGetProductsAndQuantities(rowDiv);

    
    const priceDiv = rowDiv.querySelector('[id^="buy-together-price-"]');
    const products = rowDiv.querySelectorAll('.product-buy-together-div');
    const pricePromises = Array.from(products).map(product => {
        const price = product.querySelector('.buy-together__price');
        const listPrice = product.querySelector('.buy-together__list_price');
        return getPricesBuyTogether(buyTogetherGetProductQuantity(product), price, listPrice, );
    });
    
    await Promise.all([
        getPricesBuyTogether(input, priceDiv, null, 'à vista no PIX'),
        ...pricePromises,
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
