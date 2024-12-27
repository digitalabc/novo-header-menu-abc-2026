/**
 * Fetches and renders shipping quotes when the form is submitted.
 * @param {Event} e - The event.
 * @param {string} productVariantId - The product variant ID to be quoted.
 * @param {string} checkoutId - Checkout number ID.
*/
async function ShippingQuoteSubmit(e, productVariantId) {
    e.preventDefault();
    try {
        const cep = document.getElementById('shipping-quote-cep').value;

        let variables = {
            cep,
            productVariantId: Number(productVariantId)
        }

        let snippetResponse = await client.snippet.render("product_shipping_quotes_snippet.html",
            "SnippetQueries/shipping_quotes.graphql", variables);

        snippetResponse ??= '<span style="font-size:15px">CEP inválido!</span>';
        const div = "shipping-quotes-snippet-div-" + productVariantId;
        setInnerHtmlById(snippetResponse, div);
    }
    catch (error) {
        console.log(error);
    }
}