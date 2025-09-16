window.addEventListener("load", renderDeliveryOptions, false);

async function renderDeliveryOptions() {
  const checkoutId = client.cookie.get("carrinho-id");

  const response = await client.snippet.render(
    "checkout_delivery_store.html",
    "SnippetQueries/checkout_close_shipping_choice.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(response, "data-render-delivery");

  const respRight = await client.snippet.render(
    "checkout_right_menu_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(respRight, "data-render-right-menu");
}
