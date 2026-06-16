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
window.addEventListener("PurchaseCheckout", purchaseCheckoutEvent, false);
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

            case "/checkout/confirmation":
                parseCustomData(dataElement)
                // parseCustomDataToUA(dataElement)
                break
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
async function viewCartEvent() {
    const checkout = await client.cookie.get("carrinho-id");

    const checkoutData = await client.checkout.get(checkout);

    const items = checkoutData.data.products.map((product)=> {
        return {
            item_id: product.productVariantId,
            item_name: product.name,
            price: product.price,
            quantity: product.quantity,
          }
    })
    getUserInfo().then((user_info) => {
        window.dataLayer.push({ event: "view_cart", ecommerce: { items, cart: checkoutData.data }, user: user_info})
    })
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

function purchaseCheckoutEvent(eventInput) {

    const items = []

    eventInput.detail.checkout.orders.map((e) => {
        return e.products.map(product => {
            return items.push({
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
            event: "purchase", ecommerce: {
                ...eventInput.detail.checkout,
                currency: "BRL",
                value: eventInput.detail.checkout.total,
                items
            }
        })
    }
}

function beginCheckoutEvent(eventInput) {

    const items = []

    eventInput.detail.checkout.orders.map((e) => {
        return e.products.map(product => {
            return items.push({
                item_id: product.productVariantId,
                item_name: product.name,
                price: product.value,
                quantity: product.quantity,
                attributes: product.attributes
            })
        })
    })

    window.dataLayer.push({
        event: "begin_checkout", ecommerce: {
            ...eventInput.detail.checkout,
            currency: "BRL",
            value: eventInput.detail.checkout.total,
            items
        }
    })
    getUserInfo().then((user_info) => {
        window.dataLayer.push({
            event: "checkout", ecommerce: {
                ...eventInput.detail.checkout,
                checkout: {
                    currency: "BRL",
                    value: eventInput.detail.checkout.total,
                    products: items
                },
                user: user_info
            }
        })
    });

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
    getUserInfo().then((user_info) => {
    window.dataLayer.push({ event: "remove_from_cart", ecommerce: { ...eventInput.detail, user: user_info } })
    window.dataLayer.push({ event: "view_item_list", ecommerce: { ...getCartData(eventInput.detail.cart), user: user_info } })
    })
}

function searchPageEvent(eventInput) {
    window.dataLayer.push({ event: "search", ecommerce: { search_term: eventInput.detail.term } })
    window.dataLayer.push({ event: "view_item_list", ecommerce: { ...gtm_search_details } })
}

function hotsitePageEvent(eventInput) {
    window.dataLayer.push({ event: "view_item_list", ecommerce: { ...gtm_hotsite_details } })
}

// function addToCartEvent(eventInput) {
//      console.log("add_to_cart detail:", eventInput.detail); // 👈 adiciona isso
//     getUserInfo().then((user_info) => {
         
//         let cartData = getCartData(eventInput.detail.cart);
//         window.dataLayer.push({ event: "add_to_cart", ecommerce: { ...eventInput.detail, user: user_info } })
//         window.dataLayer.push({ event: "view_item_list", ecommerce: { ...cartData, user: user_info } })
//     });
// }

let previousCartIds = [];

function addToCartEvent(eventInput) {
    getUserInfo().then((user_info) => {
        let cartData = getCartData(eventInput.detail.cart);
        const currentProducts = eventInput.detail.cart.products;

        const newProduct = currentProducts.find(p => !previousCartIds.includes(p.productVariantId))
                        ?? currentProducts[currentProducts.length - 1];

        previousCartIds = currentProducts.map(p => p.productVariantId);

        let addedProduct = getAddedProductData(newProduct);

        window.dataLayer.push({ event: "add_to_cart", ecommerce: { ...addedProduct, user: user_info } })
        window.dataLayer.push({ event: "view_item_list", ecommerce: { ...cartData, user: user_info } })
    });
}

function getAddedProductData(product) {
    return {
        currency: "BRL",
        value: product.price * product.quantity,
        items: [{
            item_id: product.productVariantId ?? product.productId,
            item_name: product.name,
            discount: product.listPrice - product.price,
            price: product.price,
            quantity: product.quantity
        }]
    };
}


function checkoutPageEvent(eventInput) {
    getUserInfo().then((user_info) => {
        window.dataLayer.push({ event: eventInput.detail.page, ecommerce: { ...gtm_cart_details, user: user_info } })
    });
}


function productPageEvent(eventInput) {
    if (eventInput.detail.type == "product") {
        getUserInfo().then((user_info) => {
            window.dataLayer.push({ event: "view_item", ecommerce: { ...window.dataLayer_product_details, user: user_info } })
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
    const cartProducts = checkoutData.products.map((productToAdd, i) => {
        return {
            item_id: productToAdd.productId,
            item_name: productToAdd.name,
            discount: productToAdd.price == 0 ? 0 : productToAdd.listPrice - productToAdd.price,
            index: i,
            price: productToAdd.price == 0 ? productToAdd.price : productToAdd.price,
            quantity: 1
        }
    })
    const formated = {
        item_list_name: "Cart List",
        currency: "BRL",
        price: checkoutData.total,
        items: cartProducts
    };
    return formated;
}

function parseCustomData(data) {
    // helper pra achar valor de uma chave
    function findValue(arr, key) {
        if (!Array.isArray(arr)) return null; // só procura se for array
        const obj = arr.find((i) => i.key === key);
        return obj ? obj.value : null;
    }

    const checkout = findValue(data, "checkout");
    // const customer = findValue(data, "customer");
    
    const orders = findValue(checkout, "orders");
    const firstOrder = orders?.[0] || [];

    const transaction_id = String(findValue(firstOrder, "order_id"));
    const value = findValue(firstOrder, "total_value");
    const shipping = findValue(firstOrder, "shipping_value");
    const discount = findValue(firstOrder, "discount_value");
    // const cep = findValue(checkout, "cep");
    // const nome = findValue(customer, "customer_name"); 

    // Produtos
    const products = findValue(firstOrder, "products") || [];
    const items = products.map((p) => ({
        item_name: findValue(p, "name"),
        item_id: String(findValue(p, "product_variant_id")),
        price: findValue(p, "value"),
        quantity: findValue(p, "quantity"),
    }));
    
    getUserInfo().then((user_info) => { 
        window.dataLayer.push({
            event: "purchase",
            ecommerce: {
                transaction_id,
                value,
                shipping,
                currency: "BRL",
                coupon: discount > 0 ? String(discount) : "",
                items,            
                email: user_info.email,
                phoneNumber: user_info.phoneNumber
            },
        });
    });
}

function parseCustomDataToUA(data) {
    // helper para achar valor de uma chave
    function findValue(arr, key) {
        if (!Array.isArray(arr)) return null; // só procura se for array
        const obj = arr.find((i) => i.key === key);
        return obj ? obj.value : null;
    }

    const checkout = findValue(data, "checkout");
    const customer = findValue(data, "customer");

    const orders = findValue(checkout, "orders");
    const firstOrder = orders?.[0] || [];

    const transaction_id = findValue(firstOrder, "order_id");
    const revenue = findValue(firstOrder, "total_value");
    const shipping = findValue(firstOrder, "shipping_value");
    const discount = findValue(firstOrder, "discount_value");
    const email = findValue(customer, "email");

    // Produtos
    const products = findValue(firstOrder, "products") || [];
    const mappedProducts = products.map((p) => ({
        name: findValue(p, "name"),
        id: String(findValue(p, "product_variant_id")),
        price: findValue(p, "value"),
        brand: findValue(p, "brand") || "", // se existir
        variant: String(findValue(p, "product_variant_id")), // aqui usei variant igual ao id, ajuste se tiver outro campo
        quantity: findValue(p, "quantity"),
    }));

    window.dataLayer.push({
        event: "purchase",
        ecommerce: {
            purchase: {
                actionField: {
                    id: transaction_id,
                    affiliation: "adias", // valor fixo, pode parametrizar
                    revenue: revenue,
                    shipping: shipping,
                    coupon: discount > 0 ? String(discount) : "",
                    action: "purchase",
                },
                products: mappedProducts,
            },
        },
        email,
    });
}

async function getUserInfo() {
    const user = await client.customer.get();
    if (!user) { return []; }
    return user.data;
}