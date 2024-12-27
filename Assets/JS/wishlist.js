window.addEventListener("userChecked", wishlistLoad, false);
let productsInWishlist = [];

/**
 * Wishlist load function.
 * Executes after the user identification event is dispatched (user_login.js)
 */
async function wishlistLoad(){
    try {
        const wishlistBodyDiv = document.getElementById("wishlist-body");
        
        if (wishlistBodyDiv){
            if (!await validateCustomerAccessToken()){
                setInnerHtml("<h3>Realize login.</h3>", wishlistBodyDiv);
                return;
            }

            const variables = {
                customerAccessToken: pageUser.customerAccessToken
            };
    
            const response = await client.snippet.render("wishlist_snippet.html", "SnippetQueries/wishlist.graphql", variables);
            const content = response ? response : "<h3>Não foi possível buscar a lista de desejos.</h3>";
            
            setInnerHtml(content, wishlistBodyDiv);

        }
        await updateProductsInWishlist();
    } catch(error) {
        console.log(error);
    }
}

/**
 * Gets the IDs of products added in the user's wishlist
 */
async function updateProductsInWishlist() {
    if(pageUser?.customerAccessToken) {
        const query = 
        "query Wishlist($customerAccessToken: String!) {\
            customer(customerAccessToken: $customerAccessToken) {\
                wishlist {\
                    products {\
                        productId\
                    }\
                }\
            }\
        }";
        
        const variables = { customerAccessToken: pageUser.customerAccessToken };
        
        let response = await client.query(query, variables);
        let result = response?.customer?.wishlist?.products;
        
        let ids = result ? result.map(a => a.productId) : [];
        productsInWishlist.splice(0, ids.length, ...ids);

        if (productsInWishlist.length > 0)
            productsInWishlist.forEach(verifyProductsInWishlist);
    }
}

/**
 * Change the wishlist icon if the product is added in the user's wishlist
 */
function verifyProductsInWishlist(productId) {
    let productElement = document.getElementsByClassName(`wishlist-icon-${productId}`);
    let buttonElement = document.getElementsByClassName(`wishlist-button-${productId}`);

    if (buttonElement && productElement) {
        productElement.classList.add("fill-red-300");
        productElement.classList.add("stroke-red-700");
        buttonElement.setAttribute('onclick', `wishlistRemoveClick(this, ${productId})`);
    }
}

/**
 * Add to wishlist button click.
 * @param {HTMLInputElement} button - Button reference from HTML.
 * @param {string} productId - Product ID to add to wishlist.
 */
async function wishlistAddClick(button, productId) {
    const element = document.getElementById(`wishlist-icon-${productId}`);
    const success = await addOrRemoveWishlist(productId, true);

    if (element && success) {
        element.classList.add("fill-red-300");
        element.classList.add("stroke-red-700");
        button.setAttribute("onclick", `wishlistRemoveClick(this, ${productId})`);
    }
    
    window.dispatchEvent(new CustomEvent("productAddedToWishlist", {
        detail: { 
            products : [{
                productId: Number(productId)
            }]
        }
    }));
}

/**
 * Remove from wishlist button click.
 * @param {HTMLInputElement} button - Button reference from HTML.
 * @param {string} productId - Product ID to remove from wishlist.
 */
async function wishlistRemoveClick(button, productId) {
    const element = document.getElementById(`wishlist-icon-${productId}`);
    const success = await addOrRemoveWishlist(productId, false);
    
    if (element && success) {
        element.classList.remove("fill-red-300");
        element.classList.remove("stroke-red-700");
        button.setAttribute("onclick", `wishlistAddClick(this, ${productId})`);
    }
    
    window.dispatchEvent(new CustomEvent("productRemovedFromWishlist", {
        detail: { 
            products : [{
                productId: Number(productId)
            }]
        }
    }));
}

/**
 * Checks 'user' variable value and sets it if an user is logged in.
 */
async function setCustomerAccessToken(){    
    if (pageUser?.customerAccessToken) return;

    const user = await client.user.get();  
    if (user == null) return;

    pageUser = user;
}

/**
 * Validates if customer access token exists.
 */
async function validateCustomerAccessToken(){
    await setCustomerAccessToken();
    return pageUser?.customerAccessToken != null;
}

/**
 * Build wishlist input.
 * @param {string} productId - Product ID to add to wishlist.
 */
function buildWishlistInput(productId){
    return {
        customerAccessToken: pageUser.customerAccessToken,
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
            if (await validateCustomerAccessToken()) {
                const input = buildWishlistInput(productId);
                
                if (add) {
                    await client.wishlist.add(input);
                    await updateProductsInWishlist();
                    showOverlay('Produto adicionado!', 'Produto adicionado à sua lista de desejos');
                    return true;
                }
                else{
                    await client.wishlist.remove(input);
                    await wishlistLoad();
                    showOverlay('Produto removido!', 'Produto removido da sua lista de desejos');
                    return true;
                }
            }
            else {
                showOverlay('Usuário não identificado!', 'Não é possível adicionar produtos à lista de desejos sem login de usuário. Você será redirecionado para a página de login', true);
                redirectToLogin();
                return false;
            }
        }
    } catch(error) {
        console.log(error);
        if (add) {
            showOverlay('Ocorreu um erro!', 'Erro ao adicionar o produto à lista de desejos', true)
            return false;
        }
        else {
            showOverlay('Ocorreu um erro!', 'Erro ao remover o produto da lista de desejos', true)
            return false;
        }
    }
}