window.addEventListener("load", loadMiniCart, false);

function generateCartShareLink(checkout) {
  const whatsAppButton = document.getElementById("whatsAppShare");
  if (!whatsAppButton) return null;

  if (
    !checkout ||
    !checkout.products ||
    !Array.isArray(checkout.products) ||
    checkout.products.length === 0
  ) {
    whatsAppButton.style.display = "none";
    return null;
  }

  const canonicalBase = `${window.location.origin}/checkout`;
  const cartItems = checkout.products.map((product) => ({
    id: product.productVariantId,
    quantity: product.quantity,
  }));

  const param = encodeURIComponent(btoa(JSON.stringify(cartItems)));

  const title = "*ABC: Dá uma olhadinha nisso!*";
  const body = "Pra não perder tempo: já deixei tudo separadinho na ABC da Construção. É só conferir.";
  const shareLink = `${canonicalBase}?shared_checkout=${param}`;
  const composed = encodeURIComponent(`${title}\n\n${body}\n\n_${shareLink}_`);
  whatsAppButton.setAttribute("href", `https://wa.me/?text=${composed}`);

  if (!whatsAppButton.dataset.shareHandler) {
    whatsAppButton.addEventListener("click", async (e) => {
      e.preventDefault();
      try {
        const carrinhoId = await client.cookie.get("carrinho-id");
        const checkoutNow = await client.checkout.get(carrinhoId);
        const productsNow = checkoutNow?.data?.products || [];
        if (!productsNow.length) return;
        const itemsNow = productsNow.map((p) => ({ id: p.productVariantId, quantity: p.quantity }));
        const encodedNow = encodeURIComponent(btoa(JSON.stringify(itemsNow)));
        const linkNow = `${canonicalBase}?shared_checkout=${encodedNow}`;
        const textNow = encodeURIComponent(`${title}\n\n${body}\n\n_${linkNow}_`);
        const urlNow = `https://wa.me/?text=${textNow}`;
        window.open(urlNow, "_blank", "noopener,noreferrer");
      } catch (_) {}
    });
    whatsAppButton.dataset.shareHandler = "1";
  }

  whatsAppButton.style.display = "flex";

  return shareLink;
}

/**
 * Loads the minicart component via snippet call, replacing the placeholder's div content with the snippet response.
 */
async function loadMiniCart(shouldOpenCart = false) {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedCart = urlParams.get("shared_cart");

  if (sharedCart) {
    try {
      const decoded = atob(decodeURIComponent(sharedCart));
      const cartItems = JSON.parse(decoded); // [{ id, quantity }]

      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        console.warn("Carrinho compartilhado vazio ou inválido.");
        return;
      }

      const input = cartItems.map((item) => ({
        productVariantId: Number(item.id),
        quantity: Number(item.quantity),
      }));

      const success = await addOrCreateCheckout(input);

      if (success) {
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        // Aqui passamos true para abrir o minicart
        return loadMiniCart(true);
      }
    } catch (err) {
      console.error("Erro ao montar carrinho compartilhado:", err);
    }
  }
  try {
    const carrinhoId = await client.cookie.get("carrinho-id")
    const checkout = await client.checkout.get(carrinhoId);

    let variables = {
      checkoutId: carrinhoId,
      hasCheckout: false,
    };

    if (checkout && checkout.data.checkoutId != "") {
      variables.checkoutId = checkout.data.checkoutId;
      variables.hasCheckout = true;
    }

    const response = await client.snippet.render(
      "mini_cart_core.html",
      "SnippetQueries/mini_cart.graphql",
      variables
    );

    const response_count = await client.snippet.render(
      "mini_cart_count.html",
      "SnippetQueries/mini_cart_count.graphql",
      variables
    );

    document.getElementById("mini-cart-core").innerHTML = response;

    const cartCount = response_count != null && response_count !== "" && response_count !== "undefined" 
      ? parseInt(response_count) || 0 
      : 0;

    document.querySelectorAll(".label-cart-count").forEach((div) => {
      div.innerHTML = cartCount;
    });

    let response_count_formatted;

    if (cartCount == 0) {
      response_count_formatted = "00 itens";
    } else if (cartCount == 1) {
      response_count_formatted = "01 item";
    } else if (cartCount < 10) {
      response_count_formatted = "0" + cartCount + " itens";
    } else {
      response_count_formatted = cartCount + " itens";
    }

    document.querySelectorAll(".label-cart-count-formatted").forEach((div) => {
      div.innerHTML = response_count_formatted;
    });

    if (variables.hasCheckout) {
      await addUtmMetadata(variables.checkoutId);
      generateCartShareLink(checkout.data);
    }

    if (shouldOpenCart) {
      const offcanvas = document.querySelector(".ah-offcanvas");
      if (offcanvas) {
        offcanvas.classList.add("ah-offcanvas-open");
      }
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Associates the current checkout with a partner access
 * @param {string} checkoutUrl - The checkout url the will be broken down to get the checkoutId
 */

async function miniCartPartnerAssociate(checkoutUrl) {
  if (!checkoutUrl) return;
  var checkoutId = checkoutUrl.split("/").at(-1);
  if (checkoutId) await checkoutPartnerAssociate(checkoutId);
}

async function checkoutRemoveProduct(id, qty) {
  try {
    const carrinhoId = await client.cookie.get("carrinho-id")
    const rcheckout = await client.checkout.get(carrinhoId);

    let rvariables = {
      checkoutId: carrinhoId,
      hasCheckout: true,
    };

    const input = [
      {
        productVariantId: Number(id),
        quantity: Number(qty),
      },
    ];

    if (rcheckout && rcheckout.data.checkoutId != "") {
      rvariables.id = rcheckout.data.checkoutId;
      console.warn(rcheckout.data.checkoutId);
    }

    const checkoutData = await client.checkout.remove(input, rvariables.id);

    window.dispatchEvent(new CustomEvent("productRemovedFromCart", {
      detail: {
        cart: checkoutData.data,
        items: input
      }
    }));

    loadMiniCart();
  } catch (error) {
    console.error(error);
  }
}

// funcionalidade para promocoes - utm
async function addUtmMetadata(checkoutId) {
  var metadataValues = [];
  let utmSource = queryStringParams.get("utm_source");
  let utmMedium = queryStringParams.get("utm_medium");
  let utmCampaign = queryStringParams.get("utm_campaign");
  let utmTerm = queryStringParams.get("utm_term");
  let utmContent = queryStringParams.get("utm_content");

  if (utmSource) {
    metadataValues.push({ key: "utmSource", value: utmSource });
  }
  if (utmMedium) {
    metadataValues.push({ key: "utmMedium", value: utmMedium });
  }
  if (utmCampaign) {
    metadataValues.push({ key: "utmCampaign", value: utmCampaign });
  }
  if (utmTerm) {
    metadataValues.push({ key: "utmTerm", value: utmTerm });
  }
  if (utmContent) {
    metadataValues.push({ key: "utmContent", value: utmContent });
  }

  if (metadataValues.length > 0) {
    await client.checkout.addCheckoutMetadata(metadataValues, checkoutId);
  }
}
