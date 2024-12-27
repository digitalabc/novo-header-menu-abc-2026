/**
 * Loads the modal window based on the productId passed to a snippet call
 * @param {string | number} id - The product id
 */
async function showModalSpot(id){    
    const input = { 
        productId: Number(id),
        partnerAccessToken: null,
        selections: null
    };

    const response = await client.snippet.render("modal_spot.html", "SnippetQueries/cart_from_spot.graphql", input);
    setInnerHtmlById(response, "modal-content");

    showModal('modal-spot');
}

const closeSpotModal = () => {
    closeModal('modal-spot');
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