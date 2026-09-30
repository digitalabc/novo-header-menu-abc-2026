showPickUpShippingAsFree();

if (document.readyState === "complete") {
  renderPickUpOptions();
} else {
  window.addEventListener("load", renderPickUpOptions, { once: true });
}

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

  await refreshPickUpSummary();
  showPickUpShippingAsFree();
  await updatePickUpTotal();

  const rightButtons = document.createElement("div");
  rightButtons.className = "right-menu-buttons";
  rightButtons.innerHTML = `
        <button class="checkout-back-button" onClick="renderOptionsShipping()">Voltar</button>
        <a class="checkout-finish-button" href="/checkout/payment">Pagamento</a>
    `;

  document.querySelector(".checkout-footer-mobile").appendChild(rightButtons);
}

async function refreshPickUpSummary() {
  const checkoutId = client.cookie.get("carrinho-id");

  const [rightMenu, footerSummary] = await Promise.allSettled(
    ["checkout_right_menu_snippet.html", "checkout_footer_summary.html"].map(
      (name) => client.snippet.render(
        name,
        "SnippetQueries/wake_checkout_close_summary.graphql",
        { checkoutId: checkoutId }
      )
    )
  );

  if (rightMenu.status === "fulfilled") {
    setInnerHtmlById(rightMenu.value, "data-render-right-menu");
  } else {
    console.error("Erro ao atualizar o resumo lateral da retirada:", rightMenu.reason);
  }

  if (footerSummary.status === "fulfilled") {
    document.querySelectorAll(".checkout-footer-mobile #checkout_total_snippet").forEach((summary) => {
      summary.innerHTML = footerSummary.value;
    });
  } else {
    console.error("Erro ao atualizar o resumo mobile da retirada:", footerSummary.reason);
  }
}

function showPickUpShippingAsFree() {
  const summaries = document.querySelectorAll(
    "#data-render-right-menu #checkout_total_snippet, .checkout-footer-mobile #checkout_total_snippet"
  );

  summaries.forEach((summary) => {
    let shippingLine = Array.from(summary.querySelectorAll(".price-line")).find(
      (line) => line.querySelector("span")?.textContent.trim() === "Frete"
    );

    if (!shippingLine) {
      shippingLine = document.createElement("div");
      shippingLine.className = "price-line free";
      shippingLine.innerHTML =
        '<span>Frete</span><h3 class="flag pickup-free-shipping">Grátis</h3>';
      summary.prepend(shippingLine);
    } else {
      shippingLine.classList.add("free");
      const shippingValue = shippingLine.querySelector("h3");

      if (shippingValue) {
        shippingValue.textContent = "Grátis";
        shippingValue.classList.add("flag", "pickup-free-shipping");
      }
    }
  });
}

async function updatePickUpTotal() {
  const summaries = document.querySelectorAll(
    "#data-render-right-menu #checkout_total_snippet, .checkout-footer-mobile #checkout_total_snippet"
  );

  try {
    const checkoutId = client.cookie.get("carrinho-id");
    const checkout = await client.checkout.get(checkoutId);
    const checkoutData = checkout?.data;
    const total = Number(checkoutData?.total);
    const shippingFee = Number(
      checkoutData?.shippingFee ?? checkoutData?.shipping_fee
    );

    if (!Number.isFinite(total) || !Number.isFinite(shippingFee)) return;

    const totalWithoutShipping = total - shippingFee;
    const formattedTotal = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(totalWithoutShipping);

    summaries.forEach((summary) => {
      const totalLine = summary.querySelector(".total");

      if (totalLine) {
        totalLine.innerHTML = `<span>Valor Total:</span> ${formattedTotal}`;
      }
    });
  } catch (error) {
    console.error("Erro ao atualizar o total da retirada:", error);
  }
}
