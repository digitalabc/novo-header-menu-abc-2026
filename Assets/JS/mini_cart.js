window.addEventListener("load", loadMiniCart, false);

function generateCartShareLink(checkout) {
  if (
    !checkout ||
    !checkout.products ||
    !Array.isArray(checkout.products) ||
    checkout.products.length === 0
  ) {
    console.warn("Carrinho vazio ou estrutura inválida.");
    return null;
  }

  const baseUrl = window.location.origin + window.location.pathname;
  const cartItems = checkout.products.map((product) => ({
    id: product.productVariantId,
    quantity: product.quantity,
  }));

  const cartParam = encodeURIComponent(btoa(JSON.stringify(cartItems)));

  const whatsAppButton = document.getElementById("whatsAppShare");
  whatsAppButton.setAttribute(
    "href",
    `https://api.whatsapp.com/send?text=${baseUrl}?shared_cart=${cartParam}`
  );
  whatsAppButton.style.display = "flex";

  return `${baseUrl}?shared_cart=${cartParam}`;
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

    document.querySelectorAll(".label-cart-count").forEach((div) => {
      div.innerHTML = response_count;
    });

    let response_count_formatted;

    if (response_count == 0) {
      response_count_formatted = "00 itens";
    } else if (response_count == 1) {
      response_count_formatted = "01 item";
    } else if (response_count < 10) {
      response_count_formatted = "0" + response_count.trim() + " itens";
    } else {
      response_count_formatted = response_count.trim() + " itens";
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
