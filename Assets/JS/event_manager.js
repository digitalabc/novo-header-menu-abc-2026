//#region SETUP

// Method initialization for firing data layer events
window.dataLayer = window.dataLayer || [];
const dpush = function () { dataLayer.push(arguments); }

// User information (id and email if logged in)
let dataLayerUserData;

// Event dispatched in user_login.js
window.addEventListener("userChecked", configureDataLayerHandlers, false);

// Event dispatched in data_layer_config.html
window.addEventListener("dataLayerConfigured", triggerPageViewEvent, false);

// Event dispatched in buy_list.js
window.addEventListener("buyListPageViewed", buyListEvent, false);

// Events dispatched in mini_cart.js
window.addEventListener("cartViewed", viewCartEvent, false);
window.addEventListener("productRemovedFromCart", removeFromCartEvent, false);

// Event dispatched in wishlist.js
window.addEventListener("productAddedToWishlist", addToWishlistEvent, false);
window.addEventListener("productRemovedFromWishlist", removeFromWishlistEvent, false);

window.addEventListener("checkoutPurchaseEvent", checkoutPurchaseEvent, false);

/**
 * Configures data layer handlers to set user ID after a delay 
 * or on specific events, for pagespeed purposes.
 * @param {Event} eventInput - The event containing user data.
 */
function configureDataLayerHandlers(eventInput) {
    dataLayerUserData = eventInput?.detail;
    setTimeout(() => setUserIdDataLayer(eventInput), 5000);

    const scrollListener = () => setUserIdDataLayer();
    const mousemoveListener = () => setUserIdDataLayer();
    const touchstartListener = () => setUserIdDataLayer();

    window.addEventListener('scroll', scrollListener);
    window.addEventListener('mousemove', mousemoveListener);
    window.addEventListener('touchstart', touchstartListener);

    function setUserIdDataLayer() {
        dataLayerSetup(dataLayerUserData?.email);

        window.removeEventListener('scroll', scrollListener);
        window.removeEventListener('mousemove', mousemoveListener);
        window.removeEventListener('touchstart', touchstartListener);
    }
}

/**
 * Handles the data layer event by retrieving user information and dispatching a custom event.
 */
async function handleUserCheckDataLayerEvent() {
    let userId = '';
    let user = null;
    const customerAccessToken = client.cookie.get('sf_customer_access_token');
    const visitorCookieName = 'data-layer-visitor-id';
    
    if (customerAccessToken) {
        // If a customer access token exists, get customer details
        const customerDetailsResult = await client.customer.accessTokenDetails(customerAccessToken);
        const customerId = customerDetailsResult?.data?.customerId;

        if (customerId) {
            user = typeof pageUser == "undefined" ? await client.customer.get() : pageUser;
            userId = `CLIENT-${customerId}`;
        }
    } else {
        // Otherwise, check for an existing visitor ID or create a new one
        let visitorId = client.cookie.get(visitorCookieName);
        if (!visitorId) {
            visitorId = `VISIT-${visitorUuid}`;
            setCookie(visitorCookieName, visitorId, 168); // Set cookie with 168 hours expiry (1 week)
        }
        userId = visitorId;
    }

    // Dispatch custom event with user details
    window.dispatchEvent(new CustomEvent("userChecked", {
        detail: {
            email: user?.email ?? user?.data?.email ?? '',
            name: user?.name ?? user?.data?.customerName ?? '',
            phoneNumber: user?.phoneNumber ?? user?.data?.phoneNumber ?? '',
            userId
        }
    }));
}
//#endregion

//#region DATA LAYER TRIGGERING EVENTS

/**
 * This function is responsible for triggering view events on the site.
 * It analyzes the page type (hotsite, product page, etc.) and registers 
 * the corresponding event to be captured in the event_manager file.
 */
function triggerPageViewEvent() {
    const productIdDiv = document.getElementById("product-id");
    const buylistIdDiv = document.getElementById("buy-list-id")

    // Trigger the appropriate event based on the page type
    if (productIdDiv) {
        const eventInput = {detail: { type: "product", productId: productIdDiv.value }};
        productPageEvent(eventInput);
    }
    else if (buylistIdDiv) {
        return;
    }
    else if (window.location.pathname.endsWith("/busca")) {
        const term = queryStringParams.get("busca") ?? "";
        const eventInput = { detail: { term }};
        searchPageEvent(eventInput);
    }
    else if (window.location.href.startsWith(checkout_pages.checkout.confirmation)) {
        const eventInput = { detail: { page_name: "confirmation" }};
        checkoutConfirmationPageEvent(eventInput);
    }
    else if (window.location.href.startsWith(checkout_pages.checkout.complete)) {
        const eventInput = { detail: { page_name: "complete" }};
        checkoutCompleteEvent(eventInput);
    }
    else if (window.location.href.startsWith(checkout_pages.checkout.home)) {
        const eventInput = { detail: { page_name: "checkout" }};
        checkoutPageEvent(eventInput);
    }
    else {
        const alias = window.location.pathname != "/" ? window.location.pathname.slice(1) : "home"
        const eventInput = { detail: { hotsite: alias }};
        hotsitePageEvent(eventInput);
    }
}

async function viewCartEvent() {
    const data_layer_cart_details_element = document.getElementById('data_layer_cart_details');
    if(data_layer_cart_details_element) {
        const data_layer_cart_details = JSON.parse(data_layer_cart_details_element.value);
        const pageType = getDataLayerPageType()
        mapDataLayerUserAndUrlToModel(data_layer_cart_details, pageType);
        dpush("event", "view_cart", data_layer_cart_details);
    }
}

function addToCartEvent(eventInput) {
    const dataLayerCartObj = convertProductDataToDataLayerItems(eventInput.detail.products);
    mapDataLayerUserAndUrlToModel(dataLayerCartObj);
    dpush("event", "add_to_cart", dataLayerCartObj);

    const dataLayerProductsObj = convertProductDataToDataLayerItems(eventInput.detail.cart);
    mapDataLayerUserAndUrlToModel(dataLayerProductsObj);
    dpush("event", "view_item_list", getCartData(dataLayerProductsObj));
}

function removeFromCartEvent(eventInput) {
    const dataLayerCartObj = convertProductDataToDataLayerItems(eventInput.detail.products);
    mapDataLayerUserAndUrlToModel(dataLayerCartObj);
    dpush("event", "remove_from_cart", dataLayerCartObj);

    const dataLayerProductsObj = convertProductDataToDataLayerItems(eventInput.detail.cart.products);
    mapDataLayerUserAndUrlToModel(dataLayerProductsObj);
    dpush("event", "view_item_list", getCartData(dataLayerProductsObj));
}

function searchPageEvent(eventInput) {
    const pageType = getDataLayerPageType()
    mapDataLayerUserAndUrlToModel(data_layer_search_details, pageType);

    dpush("event", "search", { search_term: eventInput.detail.term });
    dpush("event", "view_item_list", data_layer_search_details);
}

function hotsitePageEvent(eventInput) {
    const pageType = getDataLayerPageType()
    mapDataLayerUserAndUrlToModel(data_layer_hotsite_details, pageType);

    dpush("event", "page_view", data_layer_hotsite_details);
}

function checkoutPageEvent() {
    const pageType = "Carrinho"
    mapDataLayerUserAndUrlToModel(data_layer_checkout_details, pageType);

    dpush("event", "view_cart", data_layer_checkout_details);
}

function checkoutCompleteEvent() {
    const pageType = "Fechamento"
    mapDataLayerUserAndUrlToModel(data_layer_checkout_complete_details, pageType);

    dpush("event", "begin_checkout", data_layer_checkout_complete_details);
}

function checkoutConfirmationPageEvent() {
    const pageType = "Confirmaçao"
    mapDataLayerUserAndUrlToModel(data_layer_confirmation_details, pageType);

    dpush("event", "page_view", data_layer_confirmation_details);
}

function checkoutPurchaseEvent(eventInput) {
    const pageType = "Confirmaçao"
    const checkoutData = eventInput.detail.checkout;
    for(let order of checkoutData.orders){
        const data_layer_confirmation_details = {
            "currency": "BRL",
            checkout_id: checkoutData.checkoutId,
            transaction_id: order.orderId,
            subtotal: checkoutData.subtotal,
            discount: checkoutData.discount,
            shippingFee: checkoutData.shippingFee,
            paymentFees: checkoutData.paymentFees,
            total: checkoutData.total,
            items: structureCheckoutProducts(order.products),
            shipping_value: order.shippingValue,
            total_value: order.totalValue,
        };
    
        mapDataLayerUserAndUrlToModel(data_layer_confirmation_details, pageType);
        dpush("event", "purchase", data_layer_confirmation_details);
    }

    
}

function productPageEvent(eventInput) {
    const pageType = getDataLayerPageType()

    if (!eventInput.detail.adjusted)
        mapDataLayerUserAndUrlToModel(data_layer_product_details, pageType)

    if (eventInput.detail.type == "product")
        dpush("event", "view_item", data_layer_product_details);
}

function addToWishlistEvent(eventInput) {
    dpush("event", "add_to_wishlist", convertProductDataToDataLayerItems(eventInput.detail.products));
}

function removeFromWishlistEvent(eventInput) {
    dpush("event", "remove_from_wishlist", convertProductDataToDataLayerItems(eventInput.detail.products));
}

function buyListEvent(eventInput) {
    dpush("event", "view_item_list", convertBuyListDatatoDataLayerItems(eventInput.detail.products));
}

//#endregion

//#region AUX OBJECT CONVERSION FUNCTIONS

function convertBuyListDatatoDataLayerItems(buyListData) {
    const buyListProducts = [];
    for (productToAdd of buyListData){
        const productObj = {
            item_name: productToAdd.productName || '',
            item_id: productToAdd.productId.toString() || '',
            price: productToAdd.prices.price.toString() || '',
            item_brand: productToAdd.productBrand?.name || '',
            quantity: 1,
        }
        productToAdd.productCategories.forEach((category, index) => {
            const key = index > 0 ? `item_category${index + 1}` : 'item_category';
            productObj[key] = category.name;
        });
        buyListProducts.push(productObj);
    }
    return { items: buyListProducts };
}

function convertProductDataToDataLayerItems(productData) {
    const cartProducts = [];
    for (productToAdd of productData)
        cartProducts.push({
            item_id: productToAdd.productId ?? productToAdd.product_id ?? productToAdd.productVariantId ?? productToAdd.product_variant_id,
            item_name: productToAdd.product_name
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

function structureCheckoutProducts(products, cart) {
    if (!products || !Array.isArray(products)) return []

    return (
        products?.map(product => {
            const {
                productVariantId,
                name,
                quantity
            } = product ?? {}

            return {
                item_name: name,
                item_variant: productVariantId,
                quantity: quantity ?? 1,
            }
        }) ?? []
    )
}

function mapDataLayerUserAndUrlToModel(model, pageType) {
    if (dataLayerUserData){
        model.user = {};
        if (dataLayerUserData.userId) model.user.id = dataLayerUserData.userId
        if (dataLayerUserData.email) model.user.email = dataLayerUserData.email;
        if (dataLayerUserData.name) model.user.name = dataLayerUserData.name;
        if (dataLayerUserData.phoneNumber) model.user.phoneNumber = dataLayerUserData.phoneNumber;
    }

    model.session = {
        isLogged: !!dataLayerUserData && !!dataLayerUserData.email,
        site: {
            siteDomain: document.location.origin,
        }
    };

    if (model.page && pageType)
        model.page.pageType = pageType;
    else
        model.page = model.page ?? {
            pageType: pageType,
            name: window.document.title
        }

    return model;
}

function getDataLayerPageType() {
    const inputElement = document.getElementById("data-layer-page-type");
    return inputElement?.value ?? "HOTSITE";
}

//#endregion