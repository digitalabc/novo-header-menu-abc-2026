/**
 * Fetches and renders shipping quotes when the form is submitted.
 * @param {Event} e - The event.
 * @param {string} productVariantId - The product variant ID to be quoted.
*/
async function ShippingQuoteSubmit(e, productVariantId) {    
    e.preventDefault();
    try {
        const cep = document.getElementById('shipping-quote-cep').value;

        let variables = {
            cep,
            productVariantId: Number(productVariantId)
        }
        
        let snippetResponse = await client.snippet.render("product_shipping_quotes_snippet.html", "SnippetQueries/shipping_quotes.graphql", variables);

        snippetResponse ??= '<span class="product-shipping__error">CEP inválido!</span>';

        document.getElementById("shipping-quotes-snippet-div-" + productVariantId).innerHTML = snippetResponse;
    }
    catch(error) {
        console.log(error);
    }
}

/**
 * Applies a mask to the CEP field.
 * @param {string} t - CEP input value.
*/
function cepMask(t){

    const mask = "#####-###"
    let value = t.value;
    let i = value.length;
    let out = mask.substring(1,0);
    let text = mask.substring(i)
    
    if (isNaN(event.key))
      event.preventDefault()

    if (text.substring(0,1) != out)
      t.value += text.substring(0,1);
}