//Update snippets
const setAllInnerHtmlById = (n, t) => {
  if (!n || !t) return;
  const i = document.querySelectorAll("#" + t);
  const els = [...i]
  if (els.length) els.map((e) => { e.innerHTML = n; });
}

const CHECKOUT_SHARE_QUERY_PARAM = "shared_checkout";
const CHECKOUT_COUPON_QUERY_PARAM = "coupon";
const CHECKOUT_COUPON_PRIORITY_LOCK_KEY = "checkout:coupon-priority-lock";
const CHECKOUT_COUPON_INVALID_LOCK_PREFIX = "checkout:coupon-invalid:";

let checkoutShareIsEnsuringCoupon = false;
let checkoutShareInitializationPromise = null;

function checkoutShareNormalizeCoupon(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function checkoutShareGetParams() {
  return new URLSearchParams(window.location.search);
}

function checkoutShareReplaceUrlWithParams(params) {
  const nextParams = new URLSearchParams(params);
  const nextQuery = nextParams.toString();
  const nextUrl = nextQuery
    ? `${window.location.pathname}?${nextQuery}`
    : window.location.pathname;
  window.history.replaceState({}, document.title, nextUrl);
}

function checkoutShareBuildUtmMetadata() {
  const params = typeof queryStringParams !== "undefined"
    ? queryStringParams
    : new URLSearchParams(window.location.search);

  const mapping = [
    ["utm_source", "utmSource"],
    ["utm_medium", "utmMedium"],
    ["utm_campaign", "utmCampaign"],
    ["utm_term", "utmTerm"],
    ["utm_content", "utmContent"],
  ];

  return mapping.reduce((acc, [paramKey, metadataKey]) => {
    const value = params.get(paramKey);
    if (value) acc.push({ key: metadataKey, value });
    return acc;
  }, []);
}

async function checkoutShareAddUtmMetadata(checkoutId) {
  if (!checkoutId || !client?.checkout?.addCheckoutMetadata) return;
  const metadata = checkoutShareBuildUtmMetadata();
  if (!metadata.length) return;

  try {
    await client.checkout.addCheckoutMetadata(metadata, checkoutId);
  } catch (error) {
    console.error("Erro ao associar metadados UTM ao checkout:", error);
  }
}

function checkoutShareDecodeSharedItems(rawSharedCheckout) {
  if (!rawSharedCheckout) return [];

  const decoded = JSON.parse(atob(decodeURIComponent(rawSharedCheckout)));
  if (!Array.isArray(decoded)) return [];

  return decoded
    .map((item) => ({
      productVariantId: Number(item?.id),
      quantity: Number(item?.quantity),
    }))
    .filter(
      (item) =>
        Number.isFinite(item.productVariantId) &&
        item.productVariantId > 0 &&
        Number.isFinite(item.quantity) &&
        item.quantity > 0
    );
}

function checkoutShareEncodeSharedItems(products) {
  const sharedItems = products.map((product) => ({
    id: product.productVariantId,
    quantity: product.quantity,
  }));

  return encodeURIComponent(btoa(JSON.stringify(sharedItems)));
}

function checkoutShareBuildCartUrl(products, appliedCoupon) {
  const encodedSharedCheckout = checkoutShareEncodeSharedItems(products);
  const checkoutUrl = new URL(`${window.location.origin}/checkout`);
  const currentParams = checkoutShareGetParams();

  currentParams.forEach((value, key) => {
    if (key === CHECKOUT_SHARE_QUERY_PARAM) return;
    checkoutUrl.searchParams.set(key, value);
  });

  checkoutUrl.searchParams.set(CHECKOUT_SHARE_QUERY_PARAM, encodedSharedCheckout);

  const normalizedCoupon = checkoutShareNormalizeCoupon(appliedCoupon);
  if (normalizedCoupon) {
    checkoutUrl.searchParams.set(CHECKOUT_COUPON_QUERY_PARAM, normalizedCoupon);
  } else {
    checkoutUrl.searchParams.delete(CHECKOUT_COUPON_QUERY_PARAM);
  }

  return checkoutUrl.toString();
}

function checkoutShareBuildMessage(cartUrl, coupon) {
  const emojiCart = "\u{1F6D2}";
  const emojiPointer = "\u{1F449}";
  const emojiWink = "\u{1F609}";

  if(coupon.value && coupon.value.trim() !== "") {
  return `${emojiCart} Seu carrinho ABC está pronto!\n\nSeparamos os produtos para você e seu desconto já está aplicado.\nAgora é só conferir e finalizar a compra. ${emojiWink}\n\n${emojiPointer} Acessar meu carrinho\n\n${cartUrl}`;
  } else {
    return `${emojiCart} Seu carrinho ABC está pronto!\n\nJá separamos os produtos para você.\nAgora é só conferir e finalizar a compra. ${emojiWink}\n\n${emojiPointer} Acessar meu carrinho\n\n${cartUrl}`;
  }
}

function checkoutShareBuildWhatsAppUrl(cartUrl, coupon) {
  const message = checkoutShareBuildMessage(cartUrl, coupon);

  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

function checkoutShareSetSessionValue(key, value) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch (_) {}
}

function checkoutShareGetSessionValue(key) {
  try {
    return window.sessionStorage.getItem(key);
  } catch (_) {
    return null;
  }
}

function checkoutShareRemoveSessionValue(key) {
  try {
    window.sessionStorage.removeItem(key);
  } catch (_) {}
}

function checkoutShareReadCouponLock() {
  const serialized = checkoutShareGetSessionValue(
    CHECKOUT_COUPON_PRIORITY_LOCK_KEY
  );
  if (!serialized) return null;

  try {
    const parsed = JSON.parse(serialized);
    const coupon = checkoutShareNormalizeCoupon(parsed?.coupon);
    if (!coupon) return null;
    return {
      coupon,
      checkoutId: parsed?.checkoutId || null,
      source: parsed?.source || "url",
    };
  } catch (_) {
    return null;
  }
}

function checkoutShareWriteCouponLock(coupon, checkoutId, source = "url") {
  const normalizedCoupon = checkoutShareNormalizeCoupon(coupon);
  if (!normalizedCoupon) return;

  checkoutShareSetSessionValue(
    CHECKOUT_COUPON_PRIORITY_LOCK_KEY,
    JSON.stringify({
      coupon: normalizedCoupon,
      checkoutId: checkoutId || null,
      source,
      updatedAt: Date.now(),
    })
  );
}

function checkoutShareClearCouponLock() {
  checkoutShareRemoveSessionValue(CHECKOUT_COUPON_PRIORITY_LOCK_KEY);
}

function checkoutShareGetInvalidCouponKey(coupon, checkoutId) {
  return `${CHECKOUT_COUPON_INVALID_LOCK_PREFIX}${checkoutId || "unknown"}:${coupon}`;
}

function checkoutShareWasInvalidCouponAttempt(coupon, checkoutId) {
  const key = checkoutShareGetInvalidCouponKey(coupon, checkoutId);
  return checkoutShareGetSessionValue(key) === "1";
}

function checkoutShareMarkInvalidCouponAttempt(coupon, checkoutId) {
  const key = checkoutShareGetInvalidCouponKey(coupon, checkoutId);
  checkoutShareSetSessionValue(key, "1");
}

function checkoutShareClearInvalidCouponAttempt(coupon, checkoutId) {
  const key = checkoutShareGetInvalidCouponKey(coupon, checkoutId);
  checkoutShareRemoveSessionValue(key);
}

async function checkoutShareApplyCouponWithPriority(
  couponValue,
  options = {}
) {
  const coupon = checkoutShareNormalizeCoupon(couponValue);
  if (!coupon) return { status: "empty" };

  const checkoutId =
    options.checkoutId || (await client.cookie.get("carrinho-id"));
  if (!checkoutId) return { status: "missing-checkout" };

  const currentCheckout = options.checkoutData?.checkoutId
    ? options.checkoutData
    : (await client.checkout.get(checkoutId))?.data;

  if (!currentCheckout?.checkoutId) return { status: "missing-checkout-data" };

  if (currentCheckout.coupon === coupon) {
    checkoutShareWriteCouponLock(coupon, checkoutId, options.source || "url");
    checkoutShareClearInvalidCouponAttempt(coupon, checkoutId);
    return { status: "already-applied", checkoutData: currentCheckout };
  }

  if (checkoutShareWasInvalidCouponAttempt(coupon, checkoutId)) {
    return { status: "skipped-invalid-cache", checkoutData: currentCheckout };
  }

  const response = await client.checkout.addCoupon(coupon);
  if (response?.errors?.length > 0) {
    checkoutShareMarkInvalidCouponAttempt(coupon, checkoutId);
    if (options.showError !== false) {
      showOverlay(
        "Cupom nao aplicado",
        "Nao foi possivel aplicar o cupom informado.",
        true
      );
    }
    return { status: "invalid", errors: response.errors };
  }

  checkoutShareWriteCouponLock(coupon, checkoutId, options.source || "url");
  checkoutShareClearInvalidCouponAttempt(coupon, checkoutId);
  
  const refreshedCheckout = (await client.checkout.get(checkoutId))?.data;

  return {
    status: "applied",
    checkoutData: {
      ...(refreshedCheckout || currentCheckout),
      coupon: response?.data?.coupon || coupon,
    },
  };
}

async function checkoutShareEnsurePriorityCoupon(checkoutData) {
  const lock = checkoutShareReadCouponLock();
  if (!lock?.coupon || checkoutShareIsEnsuringCoupon) return checkoutData;

  if (
    lock.checkoutId &&
    checkoutData?.checkoutId &&
    lock.checkoutId !== checkoutData.checkoutId
  ) {
    return checkoutData;
  }

  if (checkoutData?.coupon === lock.coupon) {
    if (!lock.checkoutId && checkoutData?.checkoutId) {
      checkoutShareWriteCouponLock(lock.coupon, checkoutData.checkoutId, lock.source);
    }
    return checkoutData;
  }

  checkoutShareIsEnsuringCoupon = true;
  try {
    const result = await checkoutShareApplyCouponWithPriority(lock.coupon, {
      checkoutId: checkoutData?.checkoutId,
      checkoutData,
      source: lock.source || "url",
      showError: false,
    });

    if (result?.checkoutData) {
      return result.checkoutData;
    }
    return checkoutData;
  } finally {
    checkoutShareIsEnsuringCoupon = false;
  }
}

async function checkoutShareSetCheckoutCookie(checkoutId) {
  if (!checkoutId) return;
  const domain = window.location.hostname.replace("www", "");
  await client.cookie.set("carrinho-id", checkoutId, domain);
}

function checkoutShareBuildLinkData(checkoutData) {
  if (!checkoutData?.products?.length) return null;

  const coupon =
    checkoutData?.coupon ||
    checkoutShareReadCouponLock()?.coupon ||
    "";

  const cartUrl = checkoutShareBuildCartUrl(
    checkoutData.products,
    coupon
  );

  return {
    cartUrl,
    whatsappUrl: checkoutShareBuildWhatsAppUrl(cartUrl, coupon),
  };
}

function checkoutShareApplyButtonState(shareButton, shareData) {
  if (!shareButton) return;

  if (!shareData?.whatsappUrl) {
    shareButton.style.display = "none";
    shareButton.removeAttribute("href");
    return;
  }

  shareButton.setAttribute("href", shareData.whatsappUrl);
  shareButton.style.display = "flex";

  if (shareButton.dataset.shareHandler) return;

  shareButton.addEventListener("click", async (event) => {
    event.preventDefault();
    try {
      const checkoutId = await client.cookie.get("carrinho-id");
      const checkout = await client.checkout.get(checkoutId);
      const shareDataFromCheckout = checkoutShareBuildLinkData(checkout?.data);
      if (!shareDataFromCheckout?.whatsappUrl) return;
      window.open(
        shareDataFromCheckout.whatsappUrl,
        "_blank",
        "noopener,noreferrer"
      );
    } catch (error) {
      console.error("Erro ao compartilhar checkout no WhatsApp:", error);
    }
  });

  shareButton.dataset.shareHandler = "1";
}

function checkoutShareGetButtons() {
  const buttons = Array.from(
    document.querySelectorAll("[data-checkout-whatsapp-share]")
  );

  if (!buttons.length) {
    const fallbackButton = document.getElementById("whatsAppShare");
    if (fallbackButton) {
      buttons.push(fallbackButton);
    }
  }

  return buttons;
}

function checkoutShareApplyButtonsState(shareData) {
  checkoutShareGetButtons().forEach((button) =>
    checkoutShareApplyButtonState(button, shareData)
  );
}

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
      "checkout_footer_summary.html",
      "checkout_coupon_snippet.html",
      "checkout_footer_line.html"
    ],
    "SnippetQueries/wake_checkout.graphql",
    variables
  );

  const [product, total, subtotal, coupon, line] = [
    { name: "checkout_products_snippet.html", el: "checkout_product_snippet" },
    { name: "checkout_footer_summary.html", el: "checkout_total_snippet" },
    {
      name: "wake_checkout_subtotal_snippet.html",
      el: "checkout_subtotal_snippet",
    },
    { name: "checkout_coupon_snippet.html", el: "checkout_coupon_snippet" },
    { name: "checkout_footer_line.html", el: "footer_mobile_bottom" },
  ].map(({ name, el }) => ({
    res: snippets.find((s) => s.name === name)?.result || "",
    el,
  }));

  const elements = [product, total, subtotal, coupon, line];

  elements.forEach((el) => setAllInnerHtmlById(el.res, el.el));

  document.dispatchEvent(new CustomEvent("checkout:updated"));

  setTimeout(() => {
    if (typeof forceHideDiscountSpan === "function") {
      forceHideDiscountSpan();
    }
  }, 100);

  try {
    const carrinhoId = await client.cookie.get("carrinho-id");
    const checkout = await client.checkout.get(carrinhoId);
    let checkoutData = checkout?.data || null;

    if (!checkoutData?.products?.length) {
      console.warn("Carrinho vazio ou estrutura invalida.");
      checkoutShareApplyButtonsState(null);
      return null;
    }

    checkoutData = await checkoutShareEnsurePriorityCoupon(checkoutData);
    const shareData = checkoutShareBuildLinkData(checkoutData);
    checkoutShareApplyButtonsState(shareData);
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

const cartChangeQuantity = async (element) => {
  const previousQuantity = element.getAttribute("value");
  const currentQuantity = (element.value).replace(/\D+/g, '');

  // Se não houve alteração, não faz nada
  if (previousQuantity === currentQuantity || currentQuantity === "") {
    updateCheckout()
    return;
  }
  const quantityDifference = Number(currentQuantity) - Number(previousQuantity);
  const productVariantId = Number(element.getAttribute("data-product_variant_id"));

  if (quantityDifference > 0) {
    await client.checkout.add([
      {
        productVariantId,
        quantity: Math.abs(quantityDifference),
      }
    ]);
  } else {
    await client.checkout.remove([
      {
        productVariantId,
        quantity: Math.abs(quantityDifference),
      }
    ]);
  }

  updateCheckout();
};

const cartAddQuantity = async (productVariantId, customizationId) => {
  const input = getCartAddOrSubtractInput(productVariantId, 1, customizationId);
  const checkoutResponse = await client.checkout.add(input);

  const items = []
  checkoutResponse.data.products.map(product => {
    const valid = input.findIndex((e) => e.productVariantId === product.productVariantId)
    if (valid) {
      items.push({
        item_id: product.productVariantId,
        item_name: product.name,
        price: product.price,
        quantity: product.quantity,
      })
    }
  })

  window.dispatchEvent(new CustomEvent("productAddedToCart", {
    detail: {
      cart: checkoutResponse.data,
      items
    }
  }));
  updateCheckout();
};

const cartSubtractQuantity = async (productVariantId, customizationId) => {
  const input = getCartAddOrSubtractInput(productVariantId, 1, customizationId);
  const checkout = await client.cookie.get("carrinho-id")
  const checkoutResponse = await client.checkout.remove(input, checkout);

  window.dispatchEvent(new CustomEvent("productRemovedFromCart", {
    detail: {
      cart: checkoutResponse.data,
      items: input
    }
  }));
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
    const checkout = await client.cookie.get("carrinho-id")

    const checkoutData = await client.checkout.remove(input, checkout);

    showOverlay("Produto removido!", "Produto removido do carrinho");
    window.dispatchEvent(new CustomEvent("productRemovedFromCart", {
      detail: {
        cart: checkoutData.data,
        items: [{
          productVariantId: Number(id),
          quantity: Number(qty)
        }]
      }
    }));
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
  const checkout = await client.cookie.get("carrinho-id")

  const response = await client.checkout.addKit(input, checkout);
  if (kitOperationIsSuccess(response)) await updateCheckout();
}

async function cartSubtractKitQuantity(kitId, kitGroupId) {
  const input = await cartGetKitInput(kitId, kitGroupId, 1);
  const checkout = await client.cookie.get("carrinho-id")
  const response = await client.checkout.removeKit(input, checkout);
  if (kitOperationIsSuccess(response)) await updateCheckout();
}

async function removeKitFromCart(kitId, kitGroupId, quantity) {
  const input = await cartGetKitInput(kitId, kitGroupId, Number(quantity));
  const checkout = await client.cookie.get("carrinho-id")
  const response = await client.checkout.removeKit(input, checkout);
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
  if (checkoutShareInitializationPromise) {
    return checkoutShareInitializationPromise;
  }

  checkoutShareInitializationPromise = (async () => {
    const params = checkoutShareGetParams();
    const sharedCheckoutParam = params.get(CHECKOUT_SHARE_QUERY_PARAM);
    const couponFromUrl = checkoutShareNormalizeCoupon(
      params.get(CHECKOUT_COUPON_QUERY_PARAM)
    );

    let sharedProcessed = false;

    if (sharedCheckoutParam) {
      try {
        const sharedItems = checkoutShareDecodeSharedItems(sharedCheckoutParam);

        if (sharedItems.length) {
          const createResponse = await client.checkout.create(sharedItems);
          const newCheckoutId = createResponse?.data?.checkoutId;

          if (newCheckoutId) {
            await checkoutShareSetCheckoutCookie(newCheckoutId);

            await checkoutShareAddUtmMetadata(newCheckoutId);

            if (typeof checkoutPartnerAssociate === "function") {
              await checkoutPartnerAssociate(newCheckoutId);
            }

            // Garante que o checkout recém-criado esteja disponível
            // antes de renderizar os produtos.
            const newCheckout = await client.checkout.get(newCheckoutId);

            if (newCheckout?.data?.products?.length) {
              await updateCheckout();
            }
          }

          sharedProcessed = true;
        }
      } catch (error) {
        console.error("Erro ao montar carrinho compartilhado:", error);
      }
    }

    if (couponFromUrl) {
      await checkoutShareApplyCouponWithPriority(couponFromUrl, {
        source: sharedCheckoutParam ? "shared_checkout" : "url",
        showError: true,
      });
    }

    await updateCheckout();
  })();

  try {
    await checkoutShareInitializationPromise;
  } finally {
    checkoutShareInitializationPromise = null;
  }
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
