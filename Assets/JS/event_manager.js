// Event dispatched in user_login.js
window.addEventListener("userChecked", (event) => { setTimeout(() => setUserIdGTM(event?.detail?.email), 500); }, false);

// Events dispatched in mini_cart.js
window.addEventListener("cartViewed", viewCartEvent, false);
window.addEventListener("productRemovedFromCart", removeFromCartEvent, false);

// Events dispatched in product.js 
window.addEventListener("searchPageViewed", searchPageEvent, false);
window.addEventListener("hotsitePageViewed", hotsitePageEvent, false);
window.addEventListener("productAddedToCart", addToCartEvent, false);
window.addEventListener("productPageViewed", productPageEvent, false);

// Event dispatched in wishlist.js
window.addEventListener("productAddedToWishlist", addToWishlistEvent, false);
window.addEventListener("productRemovedFromWishlist", removeFromWishlistEvent, false);

// Event dispatched when data layer is ready
window.addEventListener("dataLayerReady", triggerViewEvents, false);
/***********************************************************************/

// Função para enviar eventos para o GTM
function gtmEvent(eventName, eventData) {
    if (window.dataLayer) {
        window.dataLayer.push({
            'event': eventName,
            ...eventData
        });
    }
}

async function triggerViewEvents() {
    const productIdDiv = document.getElementById("product-id");
    const buylistIdDiv = document.getElementById("buy-list-id")
    if (productIdDiv) {
        window.dispatchEvent(new CustomEvent("productPageViewed", {
            detail: { type: "product", productId: productIdDiv.value }
        }));
    }
    else if (buylistIdDiv) {
        window.dispatchEvent(new CustomEvent("productPageViewed", {
            detail: { type: "buylist", buylistId: buylistIdDiv.value }
        }));
    }
    else if (queryStringParams.has("busca")) {
        window.dispatchEvent(new CustomEvent("searchPageViewed", {
            detail: { term: queryStringParams.get("busca") }
        }));
    }
    else {
        const alias = window.location.pathname != "/" ? window.location.pathname.slice(1) : "home"
        window.dispatchEvent(new CustomEvent("hotsitePageViewed", {
            detail: { hotsite: alias }
        }));
    }
}

// Functions called by custom events
function viewCartEvent() {
    if (window.dataLayer_cart_details) {
        gtmEvent("view_cart", window.dataLayer_cart_details);
    }
}

function removeFromCartEvent(eventInput) {
    gtmEvent("remove_from_cart", getProductData(eventInput.detail.products));
    gtmEvent("view_item_list", getCartData(eventInput.detail.cart));
}

function searchPageEvent(eventInput) {
    gtmEvent("search", { search_term: eventInput.detail.term });
    if (window.dataLayer_search_details) {
        gtmEvent("view_item_list", window.dataLayer_search_details);
    }
}

function hotsitePageEvent(eventInput) {
    if (window.dataLayer_hotsite_details) {
        gtmEvent("view_item_list", window.dataLayer_hotsite_details);
    }
}

function addToCartEvent(eventInput) {
    getUserInfo().then((user_info) => {
        let productData = getProductData(eventInput.detail.products);
        let cartData = getCartData(eventInput.detail.cart);
        gtmEvent("add_to_cart", { ...productData, user: user_info });
        gtmEvent("view_item_list", { ...cartData, user: user_info });
    });
}

function productPageEvent(eventInput) {
    if (eventInput.detail.type == "product") {
        getUserInfo().then((user_info) => {
            if (window.dataLayer_product_details) {
                gtmEvent("view_item", { ...window.dataLayer_product_details, user: user_info });
            }
        });
    }
}

function addToWishlistEvent(eventInput) {
    gtmEvent("add_to_wishlist", getProductData(eventInput.detail.products));
}

function removeFromWishlistEvent(eventInput) {
    gtmEvent("remove_from_wishlist", getProductData(eventInput.detail.products));
}

function getProductData(productData) {
    const cartProducts = [];
    for (productToAdd of productData)
        cartProducts.push({
            item_id: productToAdd.productId ?? productToAdd.productVariantId
        });
    return { items: cartProducts };
}

function getCartData(checkoutData) {
    const cartProducts = [];
    for (productToAdd of checkoutData.products)
        cartProducts.push({
            item_id: productToAdd.productId,
            item_name: productToAdd.name,
            discount: productToAdd.price == 0 ? 0 : productToAdd.listPrice - productToAdd.price,
            index: 0,
            price: productToAdd.price == 0 ? productToAdd.price : productToAdd.price,
            quantity: 1
        });
    const formated = {
        item_list_name: "Cart List",
        currency: "BRL",
        price: checkoutData.total,
        items: cartProducts
    };
    return formated;
}

async function getUserInfo() {
    const user = await client.customer.get();
    if (!user) { return []; }
    return user.data;
}