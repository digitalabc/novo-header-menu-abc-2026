window.addEventListener("load", modalLoad, false);
window.addEventListener("load", startCarousel, false);
window.addEventListener("load", modalClose, false);

/**
 * Setups every carrousel element in the page
 */
function startCarousel(){
    const elementList = document.getElementsByClassName('carousel');
    if(elementList) {
        [].forEach.call(elementList, function (element) {
            // var carousel = bootstrap.Carousel.getOrCreateInstance(element);
            // carousel.cycle();
        });
    }
}

/**
 * Pauses every carrousel element in the page
 */
function pauseCarousel(){
    const elementList = document.getElementsByClassName('carousel');

    [].forEach.call(elementList, function (element) {
        // var carousel = bootstrap.Carousel.getOrCreateInstance(element);
        // carousel.pause();
    });
}

/**
 * Setups the modal load from click event
 */
async function modalLoad(){
    const modalButton = document.getElementById("modal-spot-to-cart-button");
    if (modalButton){
        modalButton.addEventListener("click", await showModal);
        modalButton.addEventListener("click", pauseCarousel)
    }
}

/**
 * Loads the modal window based on the productId passed to a snippet call
 * @param {string | number} id - The product id
 */
async function showModal(id){
    pauseCarousel();
    
    const input = { 
        productId: Number(id),
        partnerAccessToken: null,
        selections: null
    };

    const response = await client.snippet.render("modal_cart_from_spot.html", "SnippetQueries/cart_from_spot.graphql", input);
    replaceInnerHtml(response, `add-to-cart-modal-content-${id}`);
}

/**
 * Closes every modal in the page
 */
function modalClose() {
    const modalList = document.querySelectorAll('[id^="add-to-cart-modal-"]');
    if(modalList) {
        modalList.forEach(element => {
            element.addEventListener('hide.bs.modal', startCarousel) 
        });
    }
}

/**
 * The buy button's click event
 * @param {object[]} productVariantId - The product variant id
 */
async function spotBuyButtonClick(productVariantId){
    await buyClick(productVariantId);
}

/**
 * The add to cart button's click event
 * @param {object[]} productVariantId - The product variant id
 */
async function spotAddToCartButtonClick(productVariantId){
    await addToCartClick(productVariantId);
}