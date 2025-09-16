/**
 * Iterates the page's buy list product divs, evaluating if each product should be added to the list (based
 * on the product availability, quantity selected, and if it is selected on the checkbox).
 */
 function buyBoxGetProductsAndQuantities(button) {
    const variantId = button.value;
    const offerDiv = button.closest("[div-buy-box]");
    const quantity = offerDiv.querySelector('[product-quantity]').value

    let input = [];
    input.push({
        productVariantId: Number(variantId),
        quantity: Number(quantity)
    })

    return input;
}

/**
 * The buy button's click event function
 */
async function buyBoxBuyClick(button) {
    const input = buyBoxGetProductsAndQuantities(button);
    const success = await addOrCreateCheckout(input);
    if (success) {
        await addUtmMetadataIfExists(); // mini_cart.js
        window.location = checkout_pages.checkout.home;
    }
}
