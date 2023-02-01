window.addEventListener("load", loadMiniCart, false);

/**
 * Loads the minicart component via snippet call, replacing the placeholder's div content with the snippet response.
 */
async function loadMiniCart() {
    try {
        const checkout = await client.checkout.get();

        let variables = {
            checkoutId: "",
            hasCheckout: false,
        };

        if (checkout && checkout.data.checkoutId != "") {
            variables.checkoutId = checkout.data.checkoutId;
            variables.hasCheckout = true;
        }

        const response = await client.snippet.render(
            "mini_cart_snippet.html",
            "SnippetQueries/mini_cart.graphql",
            variables
        );
        document.getElementById("mini-cart-div").innerHTML = response;
    } catch (error) {
        console.log(error);
    }
}

/**
 * Shows or hides the cart when the mouse moves over or out
 */
function setCartDivVisibility(visibility) {
    document.getElementById("checkout-list-div").style.visibility = visibility;
}

/**
 * Associates the current checkout with a partner access
 * @param {string} checkoutUrl - The checkout url the will be broken down to get the checkoutId
 */
async function miniCartPartnerAssociate(checkoutUrl) {
    if (!checkoutUrl) return;
    var checkoutId = checkoutUrl.split("/").at(-1);
    if (checkoutId) await checkoutPartnerAssociate(checkoutId);
}
