//Update snippets
const updateCheckout = async () => {
  const checkoutId = await client.cookie.get("carrinho-id");
  let variables = {
    checkoutId: checkoutId,
    hasCheckout: false,
  };

  const snippets = await client.snippet.multi(
    [
      "checkout_products_snippet.html",
      "wake_checkout_subtotal_snippet.html",
      "wake_checkout_total_snippet.html",
      "checkout_coupon_snippet.html",
    ],
    "SnippetQueries/wake_checkout.graphql",
    variables
  );

  const [product, total, subtotal, coupon] = [
    { name: "checkout_products_snippet.html", el: "checkout_product_snippet" },
    { name: "wake_checkout_total_snippet.html", el: "checkout_total_snippet" },
    {
      name: "wake_checkout_subtotal_snippet.html",
      el: "checkout_subtotal_snippet",
    },
    { name: "checkout_coupon_snippet.html", el: "checkout_coupon_snippet" },
  ].map(({ name, el }) => ({
    res: snippets.find((s) => s.name === name)?.result || "",
    el,
  }));

  const elements = [product, total, subtotal, coupon];

  elements.forEach((el) => {
    setInnerHtmlById(el.res, el.el);
  });

  // Força ocultação do span de desconto após atualizar
  setTimeout(() => {
    if (typeof forceHideDiscountSpan === "function") {
      forceHideDiscountSpan();
    }
  }, 100);

  try {
    const checkout = await client.checkout.get();

    if (
      !checkout ||
      !checkout?.data?.products ||
      !checkout?.data?.products.length
    ) {
      console.warn("Carrinho vazio ou estrutura inválida.");
      return null;
    }

    const products = checkout?.data?.products || [];

    const sharedCheckoutItems = products.map((product) => ({
      id: product.productVariantId,
      quantity: product.quantity,
    }));

    const jsonString = JSON.stringify(sharedCheckoutItems);
    const encoded = encodeURIComponent(btoa(jsonString));
    const baseUrl = window.location.origin + window.location.pathname;

    const shareButton = document.getElementById("whatsAppShare");
    if (shareButton) {
      shareButton.setAttribute(
        "href",
        `https://api.whatsapp.com/send?text=${baseUrl}?shared_checkout=${encoded}`
      );

      shareButton.style.display = "flex";
    }
  } catch (error) {
    console.error("Erro ao gerar URL de compartilhamento do carrinho:", error);
  }
};

function getCartAddOrSubtractInput(
  productVariantId,
  quantity,
  customizationId
) {
  const input = [
    {
      productVariantId: Number(productVariantId),
      quantity,
    },
  ];

  if (customizationId) {
    input[0].customizationId = customizationId;
  }

  return input;
}

const cartAddQuantity = async (productVariantId, customizationId) => {
  const input = getCartAddOrSubtractInput(productVariantId, 1, customizationId);
  await client.checkout.add(input);
  updateCheckout();
};

const cartSubtractQuantity = async (productVariantId, customizationId) => {
  const input = getCartAddOrSubtractInput(productVariantId, 1, customizationId);
  await client.checkout.remove(input);
  updateCheckout();
};

const subscribeProduct = (productVariantId) => {
  document
    .getElementById("product-subscribe-button-" + productVariantId)
    .classList.add("hidden");
  document
    .getElementById("product-subscriptions-" + productVariantId)
    .classList.remove("hidden");
};

const selectSubscription = async (productVariantId) => {
  const selectElement = document.getElementById(
    "product-subscriptions-" + productVariantId
  );
  const selectedOptionElement =
    selectElement.options[selectElement.selectedIndex];

  const subscriptionId = selectedOptionElement.value;
  const subscriptionGroupId = selectedOptionElement.getAttribute(
    "subscription-group-id"
  );

  const checkoutId = await client.cookie.get("carrinho-id");

  if (checkoutId && subscriptionId) {
    const input = {
      id: checkoutId,
      product: {
        productVariantId: Number(productVariantId),
        subscription: {
          recurringTypeId: Number(subscriptionId),
          subscriptionGroupId: Number(subscriptionGroupId),
        },
      },
    };

    const result = await client.checkout.updateProduct(input);
    updateCheckout();
  }
};

async function removeProductFromCart(id, qty, customizationId) {
  try {
    const input = getCartAddOrSubtractInput(id, Number(qty), customizationId);
    await client.checkout.remove(input);

    showOverlay("Produto removido!", "Produto removido do carrinho");
    hideConfirmationModal();
    updateCheckout();
  } catch (error) {
    console.error(error);
    showOverlay(
      "Ocorreu um erro!",
      "Erro ao remover o produto do carrinho",
      true
    );
    hideConfirmationModal();
  }
}

const selectGiftAttribute = async (element) => {
  const attrId = element.getAttribute("attribute-id");
  const attributeDiv = element.closest("[attribute-selections]");
  let attributeList = getSelectedAttributes(
    attributeDiv,
    attrId,
    element.value.trim()
  );

  const checkoutId = await client.cookie.get("carrinho-id");
  let variables = {
    checkoutId,
    hasCheckout: false,
    selections: attributeList,
  };

  // Update with the new attribute selection
  await updateCheckoutProducts(variables);

  // If the element is on the page, it means that a new variant has been selected
  const checkoutGiftSelectedVariantIdElement = document.getElementById(
    "checkout-gift-selected-variant-id"
  );
  if (checkoutGiftSelectedVariantIdElement) {
    const response = await client.checkout.selectGiftVariant(
      Number(checkoutGiftSelectedVariantIdElement.value)
    );

    if (response.errors) {
      showOverlay(
        "Erro ao trocar a variação do brinde",
        response.errors[0]?.message,
        true
      );
      return;
    }

    // Update with the newly selected gift
    await updateCheckoutProducts(variables);
  }
};

const updateCheckoutProducts = async (variables) => {
  const response = await client.snippet.render(
    "checkout_products_snippet.html",
    "SnippetQueries/checkout.graphql",
    variables
  );
  setInnerHtmlById(response, "checkout_product_snippet");
};

/**
 * Returns a list of the selected attributes of the page.
 * @param {HTMLElement} attributeDiv - The attribute div from HTML.
 * @param {string} selectedAttributeId - Selected attribute ID.
 * @param {string} selectedAttributeValue - Selected attribute value.
 */
function getSelectedAttributes(
  attributeDiv,
  selectedAttributeId,
  selectedAttributeValue
) {
  let attributeList = [];
  if (selectedAttributeId && selectedAttributeValue)
    attributeList.push({
      attributeId: Number(selectedAttributeId),
      value: selectedAttributeValue,
    });
  const selectedAttributes = attributeDiv.querySelectorAll(
    `[id^="hidden-selected-attribute-"]`
  );
  if (selectedAttributes)
    selectedAttributes.forEach((element) => {
      const attributeId = element.id.split("-").at(-1);
      if (
        attributeId != selectedAttributeId &&
        !attributeList.some((x) => x.attributeId == Number(attributeId))
      )
        attributeList.push({
          attributeId: Number(attributeId),
          value: element.value,
        });
    });

  return attributeList;
}

/**
 * The kit add to cart's click event function
 */
async function cartAddKitQuantity(kitId, kitGroupId) {
  const input = await cartGetKitInput(kitId, kitGroupId, 1);
  const response = await client.checkout.addKit(input);
  if (kitOperationIsSuccess(response)) await updateCheckout();
}

async function cartSubtractKitQuantity(kitId, kitGroupId) {
  const input = await cartGetKitInput(kitId, kitGroupId, 1);
  const response = await client.checkout.removeKit(input);
  if (kitOperationIsSuccess(response)) await updateCheckout();
}

async function removeKitFromCart(kitId, kitGroupId, quantity) {
  const input = await cartGetKitInput(kitId, kitGroupId, Number(quantity));
  const response = await client.checkout.removeKit(input);
  if (kitOperationIsSuccess(response)) await updateCheckout();
  hideConfirmationModal();
}

async function cartGetKitInput(kitId, kitGroupId, quantity) {
  const checkoutId = await client.cookie.get("carrinho-id");

  const input = {
    quantity,
    kitId: Number(kitId),
    kitGroupId,
    id: checkoutId,
  };

  return input;
}

function kitOperationIsSuccess(response) {
  if (response?.errors !== "undefined" && response?.errors?.length > 0) {
    showOverlay("Ocorreu um erro", response.errors[0].message, true);
    return false;
  }

  return true;
}

async function removeProductCustomization(customizationId, productVariantId) {
  const response = await client.checkout.removeProductCustomization(
    customizationId,
    parseInt(productVariantId)
  );

  if (response?.data !== null) {
    showOverlay(
      "Customização de produto",
      "Customização removida com sucesso!"
    );
  } else {
    showOverlay(
      "Customização de produto",
      "Erro ao remover customização",
      true
    );
  }

  updateCheckout();
  hideConfirmationModal();
}

async function showProductCustomizationsModal(productId) {
  let variables = {
    productId: parseInt(productId),
  };

  const response = await client.snippet.render(
    "checkout_product_customizations_snippet.html",
    "SnippetQueries/checkout_product_customizations.graphql",
    variables
  );
  setInnerHtmlById(response, "modal-content");
  showModal("modal-spot");
}

async function saveProductCustomization(event, productVariantId) {
  event.preventDefault();
  const checkoutId = await client.cookie.get("carrinho-id");
  const elements = document.querySelectorAll('[id^="customization-"]');
  const informationGroups = [];

  elements.forEach((el) => {
    const informationGroup = {
      customizationId: Number(el.getAttribute("customization-id")),
      value: el.value,
    };

    informationGroups.push(informationGroup);
  });

  const input = {
    id: checkoutId,
    product: {
      productVariantId: Number(productVariantId),
      customization: informationGroups,
    },
  };

  const result = await client.checkout.updateProduct(input);
  updateCheckout();
  closeModal("modal-spot");
}

async function shippingQuoteCheckoutSubmit(e, checkoutId) {
  e.preventDefault();
  try {
    const quotesDiv = document.getElementById(
      "shipping-quotes-snippet-div-" + checkoutId
    );
    const loadingDiv = document.getElementById("shipping-loading");
    const inputCepEl = document.getElementById("shipping-quote-cep");
    const label = document.getElementById("shipping-quote-label-cep");
    const cep = document.getElementById("shipping-quote-cep").value;

    quotesDiv.classList.add("hidden");
    loadingDiv.classList.remove("hidden");

    let variables = {
      cep,
      checkoutId,
    };

    let snippetResponse = await client.snippet.render(
      "wake_checkout_shipping_quotes_snippet.html",
      "SnippetQueries/wake_checkout_shipping_quotes.graphql",
      variables
    );

    loadingDiv.classList.add("hidden");

    setInnerHtml(snippetResponse, quotesDiv);

    if (document.getElementById("validateCep")) {
      quotesDiv.classList.add("hidden");
      inputCepEl.classList.add("border-red-500");
      label.classList.add("text-red-500");
      inputCepEl.classList.remove("border-gray-400");
      document.getElementById("invalidCep").classList.remove("hidden");
      document
        .getElementById("MsgZipCode")
        .classList.remove("text-secondary-500");
      document.getElementById("MsgZipCode").classList.add("text-red-500");
    } else {
      quotesDiv.classList.remove("hidden");
      inputCepEl.classList.remove("border-red-500");
      label.classList.remove("text-red-500");
      inputCepEl.classList.add("border-gray-400");
      document.getElementById("invalidCep").classList.add("hidden");
      document.getElementById("MsgZipCode").classList.remove("text-red-500");
      document.getElementById("MsgZipCode").classList.add("text-secondary-500");
    }
  } catch (error) {
    console.error(error);
  }
}

const initializeCheckoutFromSharedCheckout = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const sharedCheckout = urlParams.get("shared_checkout");

  if (sharedCheckout) {
    try {
      const decoded = JSON.parse(atob(decodeURIComponent(sharedCheckout)));

      const items = decoded.map(({ id, quantity }) => ({
        productVariantId: Number(id),
        quantity: Number(quantity),
      }));

      if (items.length > 0) {
        const response = await client.checkout.add(items);

        if (response) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );

          window.location.reload();
        }
      }
    } catch (error) {
      console.error("Erro ao montar o carrinho compartilhado:", error);
    }
  }

  updateCheckout();
};

// Função para forçar ocultação do span de desconto dinâmico
const forceHideDiscountSpan = () => {
  const hideElement = () => {
    const checkoutTotalSnippet = document.getElementById(
      "checkout_total_snippet"
    );
    if (checkoutTotalSnippet) {
      const spans = checkoutTotalSnippet.querySelectorAll("span");
      spans.forEach((span) => {
        if (span.textContent && span.textContent.trim() === "Desconto:") {
          const parentDiv = span.closest("div");
          if (parentDiv && parentDiv.style.display !== "none") {
            parentDiv.style.display = "none";
            parentDiv.style.visibility = "hidden";
            parentDiv.style.height = "0";
            parentDiv.style.overflow = "hidden";
          }
        }
      });
    }
  };

  // Executa imediatamente
  hideElement();

  // Observer para mudanças no DOM
  const observer = new MutationObserver(() => {
    hideElement();
  });

  // Observa mudanças no checkout_total_snippet
  const targetNode = document.getElementById("checkout_total_snippet");
  if (targetNode) {
    observer.observe(targetNode, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true,
    });
  }

  // Executa periodicamente como backup
  setInterval(hideElement, 500);
};

window.addEventListener("load", () => {
  initializeCheckoutFromSharedCheckout();
  forceHideDiscountSpan();
});

// Executa também quando o DOM estiver pronto
document.addEventListener("DOMContentLoaded", forceHideDiscountSpan);
