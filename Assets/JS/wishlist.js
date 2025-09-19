window.addEventListener("load", wishlistLoad, false);
let customerAccessToken = null;

/**
 * Page load function.
 */
async function wishlistLoad() {
    try {
        const wishlistBodyDiv = document.getElementById("wishlist-body");

        if (wishlistBodyDiv) {
            if (!await validateCustomerAccessToken()) {
                wishlistBodyDiv.innerHTML = "<h3>Realize login.</h3>"
                return;
            }

            const variables = {
                customerAccessToken
            };

            const response = await client.snippet.render("wishlist_snippet.html", "SnippetQueries/wishlist.graphql", variables);
            if (response) {
                wishlistBodyDiv.innerHTML = response;
            }
            else {
                wishlistBodyDiv.innerHTML = "<h3>Não foi possível buscar a lista de desejos.</h3>";
            }
        }
    } catch (error) {
        console.error(error);
    }
}

/**
 * Returns if product is in the customer wishlist.
 * @param {string} productId - Product ID to validate.
 * @param {string} customerAccessToken - The customer access token.
 */
async function isInTheWishlist(productId, customerAccessToken) {
    const query =
        "query Wishlist($customerAccessToken: String!, $productsIds: [Long]) {\
        customer(customerAccessToken: $customerAccessToken) {\
            wishlist (productsIds: $productsIds) {\
                products {\
                    productId\
                }\
            }\
        }\
    }";

    const productsIds = [];
    productsIds.push(Number(productId));

    const variables = {
        customerAccessToken,
        productsIds
    };

    var response = await client.query(query, variables);
    return response?.customer?.wishlist?.products != null;
}

/**
 * Add to wishlist button click.
 * @param {HTMLInputElement} button - Button reference from HTML.
 * @param {string} productId - Product ID to add to wishlist.
 */
async function wishlistAddClick(button, productId) {
    button.classList.remove('btn-outline-danger');
    button.classList.add('btn-danger');
    await addOrRemoveWishlist(productId, true);
    button.setAttribute('onclick', `wishlistRemoveClick(this, ${productId});`);
}

/**
 * Remove from wishlist button click.
 * @param {HTMLInputElement} button - Button reference from HTML.
 * @param {string} productId - Product ID to remove from wishlist.
 */
async function wishlistRemoveClick(button, productId) {
    button.classList.remove('btn-danger');
    button.classList.add('btn-outline-danger');
    await addOrRemoveWishlist(productId, false);
    button.setAttribute('onclick', `wishlistAddClick(this, ${productId});`);
}

/**
 * Sets 'customerAccessToken' variable value if user is logged in.
 */
async function setCustomerAccessToken() {
    if (customerAccessToken) return;

    const user = await client.customer.get();
    if (user == null) return;
    const token = client.cookie.get("sf_customer_access_token");

    customerAccessToken = token;
}

/**
 * Validates if customer token exists.
 */
async function validateCustomerAccessToken() {
    await setCustomerAccessToken();
    return customerAccessToken != null;
}

/**
 * Build wishlist input.
 * @param {string} productId - Product ID to add to wishlist.
 */
function buildWishlistInput(productId) {
    return {
        customerAccessToken,
        productId: Number(productId)
    };
}

/**
 * Add or remove product from wishlist.
 * @param {string} productId - Product ID to add to wishlist.
 * @param {bool} add - True for add and false for remove.
 */
async function addOrRemoveWishlist(productId, add) {
    try {
        if (productId) {
            if (!await validateCustomerAccessToken()) redirectToLogin();

            const input = buildWishlistInput(productId);

            if (add) {
                await client.wishlist.add(input);
            }
            else {
                await client.wishlist.remove(input);
                await wishlistLoad();
            }
        }
    } catch (error) {
        console.error(error);
    }
}