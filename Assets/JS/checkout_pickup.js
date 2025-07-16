window.addEventListener("load", renderPickUpOptions, false);

async function renderPickUpOptions() {
  const checkoutId = client.cookie.get("carrinho-id");

  const response = await client.snippet.render(
    "checkout_pickup_store.html",
    "SnippetQueries/checkout_close_shipping_choice.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(response, "data-render-pickup");

  const respRight = await client.snippet.render(
    "checkout_right_menu_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(respRight, "data-render-right-menu");

  const rightButtons = document.createElement("div");
  rightButtons.className = "right-menu-buttons";
  rightButtons.innerHTML = `
        <button class="checkout-back-button" onClick="renderOptionsShipping()">Voltar</button>
        <a class="checkout-finish-button" href="/checkout/payment">Pagamento</a>
    `;

  document.querySelector(".checkout-footer-mobile").appendChild(rightButtons);
  document.querySelector(".checkout-footer").style.marginTop = "244px";
}
