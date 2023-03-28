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
            "mini_cart_core.html",
            "SnippetQueries/mini_cart.graphql",
            variables
        );
        
        const response_count = await client.snippet.render(
            "mini_cart_count.html",
            "SnippetQueries/mini_cart_count.graphql",
            variables
        );

        document.getElementById("mini-cart-core").innerHTML = response;

        document.querySelectorAll(".label-cart-count").forEach(div => {
          div.innerHTML = response_count;
        });

        let response_count_formatted

        if (response_count == 0 ) {
          response_count_formatted = "00 itens"
        }
        else if (response_count == 1 ) {
          response_count_formatted = "01 item"
        }
        else if (response_count < 10) {
          response_count_formatted = "0" + response_count.trim() + " itens"
        }
        else{
          response_count_formatted = response_count.trim() + " itens" 
        }

        document.querySelectorAll(".label-cart-count-formatted").forEach(div => {
          div.innerHTML = response_count_formatted;
        });
        

    } catch (error) {
        console.error(error);
    }
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