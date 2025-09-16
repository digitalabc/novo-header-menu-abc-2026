window.addEventListener(
  "load",
  () => {
    shippingMethods();
    renderRightMenu();
  },
  false
);

async function shippingMethods() {
  const renderShippingMethods = document.querySelector(
    "[data-render-shipping-methods]"
  );

  if (renderShippingMethods) {
    const checkoutId = (await client.checkout.get()).data.checkoutId;
    const response = await client.snippet.render(
      "checkout_shipping_methods_snippet.html",
      "SnippetQueries/wake_checkout_close_shipping_choice.graphql",
      {
        checkoutId: checkoutId,
      }
    );

    setInnerHtmlById(response, "data_shipping_methods");
  }
}

async function renderRightMenu() {
  const checkoutId = (await client.checkout.get()).data.checkoutId;
  const respRight = await client.snippet.render(
    "checkout_right_menu_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(respRight, "data-render-right-menu");
}
