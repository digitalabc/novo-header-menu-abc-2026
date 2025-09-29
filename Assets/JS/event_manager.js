// Event dispatched in user_login.js
window.addEventListener("userChecked", setUserIdGTM, false);

// Events dispatched in mini_cart.js
window.addEventListener("cartViewed", viewCartEvent, false);
window.addEventListener("productRemovedFromCart", removeFromCartEvent, false);

// Events dispatched load 
window.addEventListener("searchPageViewed", searchPageEvent, false);
window.addEventListener("checkoutPageViewed", checkoutPageEvent, false);
window.addEventListener("hotsitePageViewed", hotsitePageEvent, false);
// Events dispatched in product.js 
window.addEventListener("productAddedToCart", addToCartEvent, false);
window.addEventListener("productPageViewed", productPageEvent, false);
window.addEventListener("productSelected", selectItemEvent, false);

// Event dispatched in wishlist.js
window.addEventListener("productAddedToWishlist", addToWishlistEvent, false);
window.addEventListener("productRemovedFromWishlist", removeFromWishlistEvent, false);

window.addEventListener("beginCheckout", beginCheckoutEvent, false);
window.addEventListener("purchaseComplete", purchaseEvent, false);
// Event dispatched when gtm is set
window.addEventListener("tagManagerConfigured", triggerViewEvents, false);


/***********************************************************************/
function setUserIdGTM() {
    triggerViewEvents();
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
    else if (location.pathname.indexOf("/checkout") === 0) {
        switch (location.pathname) {
            case "/checkout":
                window.dispatchEvent(new CustomEvent("checkoutPageViewed", {
                    detail: { page: "begin_checkout" }
                }));
                break;

            default:
                break;
        }
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
    window.dataLayer.push({ event: "view_cart", ecommerce: { ...gtm_cart_details } })
}


function selectItemEvent(eventInput) {
    if (eventInput.detail && eventInput.detail.product) {
        window.dataLayer.push({
            event: "select_item", ecommerce: {
                item_list_id: eventInput.detail.listId || "",
                item_list_name: eventInput.detail.listName || "Product List",
                items: [{
                    item_id: eventInput.detail.product.productId || eventInput.detail.product.id,
                    item_name: eventInput.detail.product.name || "",
                    price: eventInput.detail.product.price || 0,
                    item_brand: eventInput.detail.product.brand || "",
                    item_category: eventInput.detail.product.category || "",
                    index: eventInput.detail.index || 0
                }]
            }
        })
    }
}

function beginCheckoutEvent(eventInput) {

    const itens = []

    eventInput.detail.checkout.orders.map((e) => {
        return e.products.map(product => {
            return itens.push({
                item_id: product.productVariantId,
                item_name: product.name,
                price: product.value,
                quantity: product.quantity,
                attributes: product.attributes
            })
        })
    })

    if (eventInput.detail.checkout) {
        window.dataLayer.push({
            event: "begin_checkout", ecommerce: {
                ...eventInput.detail.checkout,
                currency: "BRL",
                value: eventInput.detail.checkout.total,
                itens
            }
        })
    }
}

function purchaseEvent(eventInput) {
    if (eventInput.detail.purchase) {
        window.dataLayer.push({
            event: "purchase", ecommerce: {
                transaction_id: eventInput.detail.purchase.order_id,
                currency: "BRL",
                value: eventInput.detail.purchase.total,
                shipping: eventInput.detail.purchase.shipping || 0,
                items: eventInput.detail.purchase.products.map(product => ({
                    item_id: product.product_id,
                    item_name: product.name,
                    price: product.price,
                    quantity: product.quantity
                }))
            }
        })
    }
}

function removeFromCartEvent(eventInput) {
    window.dataLayer.push({ event: "remove_from_cart", ecommerce: { ...getProductData(eventInput.detail.products) } })
    window.dataLayer.push({ event: "view_item_list", ecommerce: { ...getCartData(eventInput.detail.cart) } })
}

function searchPageEvent(eventInput) {
    window.dataLayer.push({ event: "search", ecommerce: { search_term: eventInput.detail.term } })
    window.dataLayer.push({ event: "view_item_list", ecommerce: { ...gtm_search_details } })
}

function hotsitePageEvent(eventInput) {
    window.dataLayer.push({ event: "view_item_list", ecommerce: { ...gtm_hotsite_details } })
}

function addToCartEvent(eventInput) {
    getUserInfo().then((user_info) => {
        let productData = getProductData(eventInput.detail.products);
        let cartData = getCartData(eventInput.detail.cart);
        window.dataLayer.push({ event: "add_to_cart", ecommerce: { ...productData, user: user_info } })
        window.dataLayer.push({ event: "view_item_list", ecommerce: { ...cartData, user: user_info } })
    });
}


function checkoutPageEvent(eventInput) {
    getUserInfo().then((user_info) => {
        window.dataLayer.push({ event: eventInput.detail.page, ecommerce: { ...gtm_cart_details, user: user_info } })
    });
}


function productPageEvent(eventInput) {
    if (eventInput.detail.type == "product") {
        getUserInfo().then((user_info) => {
            window.dataLayer.push({ event: "view_item", ecommerce: { ...gtm_product_details, user: user_info } })
        });
    }
}

function addToWishlistEvent(eventInput) {
    window.dataLayer.push({ event: "add_to_wishlist", ecommerce: { ...getProductData(eventInput.detail.products) } })
}

function removeFromWishlistEvent(eventInput) {
    window.dataLayer.push({ event: "remove_from_wishlist", ecommerce: { ...getProductData(eventInput.detail.products) } })
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