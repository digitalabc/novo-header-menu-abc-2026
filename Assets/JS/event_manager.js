// Event dispatched in user_login.js
window.addEventListener("userChecked",  () => { setTimeout(setUserIdGTM, 2000); }, false);

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

// Event dispatched when gtm is set
window.addEventListener("tagManagerConfigured", triggerViewEvents, false);
/***********************************************************************/

function setUserIdGTM(eventInput){
    gtmSetup(eventInput?.email);
}

async function triggerViewEvents(){
  const productIdDiv = document.getElementById("product-id");
  const buylistIdDiv = document.getElementById("buy-list-id")
  if (productIdDiv) {
      window.dispatchEvent(new CustomEvent("productPageViewed", {
          detail: {type: "product", productId: productIdDiv.value}
      }));
  }
  else if (buylistIdDiv) {
      window.dispatchEvent(new CustomEvent("productPageViewed", {
          detail: {type: "buylist", buylistId: buylistIdDiv.value}
      }));
  }
  else if (queryStringParams.has("busca")) {
      window.dispatchEvent(new CustomEvent("searchPageViewed", {
          detail: {term: queryStringParams.get("busca")}
      }));
  }
  else {
      const alias = window.location.pathname != "/" ? window.location.pathname.slice(1) : "home"
      window.dispatchEvent(new CustomEvent("hotsitePageViewed", {
          detail: {hotsite: alias}
      }));
  }
}

// Functions called by custom events
function viewCartEvent() {
    //gtag("event", "view_cart", gtm_cart_details);
}

function removeFromCartEvent(eventInput) {
    gtag("event", "remove_from_cart", getProductData(eventInput.detail.products));
    gtag("event", "view_item_list", getCartData(eventInput.detail.cart));
}

function searchPageEvent(eventInput) {
    gtag("event", "search", { search_term: eventInput.detail.term });
    gtag("event", "view_item_list", gtm_search_details);
}

function hotsitePageEvent(eventInput) {
    gtag("event", "view_item_list", gtm_hotsite_details);
}

function addToCartEvent(eventInput) {
    getUserInfo().then((user_info) => {
        let productData = getProductData(eventInput.detail.products);
        let cartData = getCartData(eventInput.detail.cart);
        gtag("event", "add_to_cart", {...productData, user: user_info});
        gtag("event", "view_item_list", {...cartData, user: user_info});
    });
}

function productPageEvent(eventInput) {
    if (eventInput.detail.type == "product") {
        getUserInfo().then((user_info) => {
            gtag("event", "view_item", {...gtm_product_details, user: user_info});
        });
    }
}

function addToWishlistEvent(eventInput) {
    gtag("event", "add_to_wishlist", getProductData(eventInput.detail.products));
}

function removeFromWishlistEvent(eventInput) {
    gtag("event", "remove_from_wishlist", getProductData(eventInput.detail.products));
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
    let user = await client.user.get();
    if (!user) { return []; }
    let response = await client.snippet.render(
        "subscription_info_snippet.html",
        "SnippetQueries/subscription_info.graphql",
        { customerAccessToken: user.customerAccessToken }
    );
    response = JSON.parse(response);

    return {
        id: user.id,
        email: user.email,
        user_type: response ? 'assinante' : 'não assinante',
        phoneNumber: user.phoneNumber
    };
}