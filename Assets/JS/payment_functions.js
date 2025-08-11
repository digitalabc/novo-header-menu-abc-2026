console.log("=== ARQUIVO PAYMENT_FUNCTIONS.JS INICIADO ===");
console.log("Timestamp:", new Date().toISOString());
console.log("Document ready state:", document.readyState);
console.log("Window loaded:", document.readyState === "complete");

(function () {
  console.log("=== FUNÇÃO IMEDIATA EXECUTADA ===");

  setTimeout(() => {
    console.log("=== TIMEOUT 2 SEGUNDOS EXECUTADO ===");
    console.log("DOM atual:", document.readyState);
  }, 2000);
})();

async function newSelectPaymentWhenRendering(checkoutId, paymentId, orderId) {
  const token = client.cookie.get("sf_customer_access_token");

  const response = await client.snippet.detailed(
    "payment_selected_snippet.html",
    "payment_select_mutation.graphql",
    {
      checkoutId: checkoutId,
      paymentMethodId: paymentId,
      customerAccessToken: token,
      orderId,
    }
  );

  if (response.queryResponse.errors) {
    return { errors: response.queryResponse.errors };
  }

  Fbits.Gateway.ResetPaymentSelection();

  const div = document.querySelector(
    `div[data-payment-wrapper="${paymentId}"]`
  );

  if (div && response) {
    div.innerHTML = response.html;

    const isCardPayment = response.html.includes("paymentCartao");

    if (!isCardPayment) {
      document.querySelector(
        "#finish-order .payment-selected-method"
      ).style.maxHeight = "";
      const paymentLabel = document.getElementById(
        `paymentOption-${paymentId}`
      ).nextElementSibling;
      const paymentImage = paymentLabel.querySelector("img");
      const paymentDetails = paymentLabel.querySelector(".payment-details");
      const htmlPaymentSelected = `
                <div class="paymentSelectedWrapper">
                    <img src="${paymentImage.src}" width="40" alt="Método de Pagamento">
                    <div class="payment-details">${paymentDetails.innerHTML}</div>
                    <button class="changePaymentButton" onclick="backPaymentStep()">
                        Trocar 
                        <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1.1123 11.5C0.810176 11.5 0.551541 11.3924 0.336394 11.1773C0.121246 10.9621 0.0136719 10.7035 0.0136719 10.4014V2.71099C0.0136719 2.40886 0.121246 2.15023 0.336394 1.93508C0.551541 1.71993 0.810176 1.61236 1.1123 1.61236H6.01492L4.91629 2.71099H1.1123V10.4014H8.80269V6.58365L9.90131 5.48502V10.4014C9.90131 10.7035 9.79374 10.9621 9.57859 11.1773C9.36344 11.3924 9.10481 11.5 8.80269 11.5H1.1123ZM3.30955 8.20412V5.86954L8.3495 0.829588C8.45936 0.719725 8.58296 0.637328 8.72029 0.582397C8.85762 0.527466 8.99495 0.5 9.13227 0.5C9.27876 0.5 9.41838 0.527466 9.55113 0.582397C9.68388 0.637328 9.80518 0.719725 9.91504 0.829588L10.6841 1.61236C10.7848 1.72222 10.8626 1.84353 10.9175 1.97628C10.9725 2.10903 10.9999 2.24407 10.9999 2.3814C10.9999 2.51873 10.9748 2.65377 10.9244 2.78652C10.8741 2.91927 10.7939 3.04057 10.6841 3.15044L5.64413 8.20412H3.30955ZM4.40818 7.10549H5.17722L8.36323 3.91948L7.97872 3.53496L7.58046 3.15044L4.40818 6.32272V7.10549Z" fill="#2865E8"/>
                        </svg>
                    </button>
                </div>
            `;

      document.getElementById("paymentMethodSelected").innerHTML =
        htmlPaymentSelected;

      const respRight = await client.snippet.render(
        "payment_right_menu_snippet.html",
        "SnippetQueries/wake_checkout_close_summary.graphql",
        {
          checkoutId: checkoutId,
        }
      );

      setInnerHtmlById(respRight, "data-render-right-menu");

      document.querySelector(".checkout-footer").style.marginTop = "320px";

      document.querySelector(
        ".checkout-footer-mobile .checkout-whats"
      ).style.display = "none";
      document.querySelector(
        ".checkout-footer-mobile .footer_mobile_bottom"
      ).style.display = "none";

      document.querySelector(".checkout-footer-mobile").innerHTML += respRight;
    } else {
      const paymentContainer = document.getElementById("payment-container");
      if (paymentContainer) {
        paymentContainer.style.display = "block";
        paymentContainer.style.visibility = "visible";

        paymentContainer.classList.remove("hidden");

        const hiddenSpans = paymentContainer.querySelectorAll("span.hidden");
        hiddenSpans.forEach((span) => span.classList.remove("hidden"));
      }

      const rightMenu = document.getElementById("data-render-right-menu");
      if (rightMenu) {
        rightMenu.style.display = "none";
      }
      document.getElementById("finish-order").style.maxWidth = "1200px";
      document.querySelector(
        "#finish-order .payment-selected-method"
      ).style.maxHeight = "none";
    }
  }

  const scripts =
    response.queryResponse.data?.result?.selectedPaymentMethod?.scripts;

  if (scripts) {
    Promise.all(
      scripts.map((script) =>
        loadScript(script, {
          v: window.store?.last_modified || Date.now(),
          pagamento: paymentId,
          isStorefront: true,
        })
      )
    )
      .then(() => {
        console.log("Todos os scripts foram carregados com sucesso.");
        Fbits.Gateway.ExecuteLoadedCallbacks();
        // InitializeJpCardLibrary(); // Comentado pois não estamos usando cardWrapper
      })
      .catch((error) => {
        console.error("Erro ao carregar os scripts:", error);
      });
  }

  const clearSaleAppID = $("input[name='clearsale-appid']").val();
  if (clearSaleAppID) {
    NewCarregaClearSaleFP(clearSaleAppID);
  }

  return { success: true };
}

function maskNumber(number) {
  const numStr = number.toString();
  const lastFour = numStr.replace(/\D/g, "").slice(-4);
  return (
    numStr
      .replace(/\d(?=\d{4})/g, "*")
      .replace(/\d/g, "*")
      .slice(0, -4) + lastFour
  );
}

async function nextCardScreen(paymentId) {
  if ($("[name='cpf']").length > 1) {
    $("[name='cpf']").not("#cardDocument").remove();
  }

  const checkoutId = client.cookie.get("carrinho-id");
  const paymentLabel = document.getElementById(
    `paymentOption-${paymentId}`
  ).nextElementSibling;
  const paymentImage = paymentLabel.querySelector("img");
  const paymentDetails = paymentLabel.querySelector(".payment-details");
  const htmlPaymentSelected = `
        <div class="paymentSelectedWrapper">
            <img src="${paymentImage.src}" width="40" alt="Método de Pagamento">
            <div class="payment-details">${paymentDetails.innerHTML}</div>
            <button class="changePaymentButton" onclick="backPaymentStep()">
                Trocar 
                <svg width="11" height="12" viewBox="0 0 11 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1.1123 11.5C0.810176 11.5 0.551541 11.3924 0.336394 11.1773C0.121246 10.9621 0.0136719 10.7035 0.0136719 10.4014V2.71099C0.0136719 2.40886 0.121246 2.15023 0.336394 1.93508C0.551541 1.71993 0.810176 1.61236 1.1123 1.61236H6.01492L4.91629 2.71099H1.1123V10.4014H8.80269V6.58365L9.90131 5.48502V10.4014C9.90131 10.7035 9.79374 10.9621 9.57859 11.1773C9.36344 11.3924 9.10481 11.5 8.80269 11.5H1.1123ZM3.30955 8.20412V5.86954L8.3495 0.829588C8.45936 0.719725 8.58296 0.637328 8.72029 0.582397C8.85762 0.527466 8.99495 0.5 9.13227 0.5C9.27876 0.5 9.41838 0.527466 9.55113 0.582397C9.68388 0.637328 9.80518 0.719725 9.91504 0.829588L10.6841 1.61236C10.7848 1.72222 10.8626 1.84353 10.9175 1.97628C10.9725 2.10903 10.9999 2.24407 10.9999 2.3814C10.9999 2.51873 10.9748 2.65377 10.9244 2.78652C10.8741 2.91927 10.7939 3.04057 10.6841 3.15044L5.64413 8.20412H3.30955ZM4.40818 7.10549H5.17722L8.36323 3.91948L7.97872 3.53496L7.58046 3.15044L4.40818 6.32272V7.10549Z" fill="#2865E8"/>
                </svg>
            </button>
        </div>
    `;

  document.getElementById("card-finish").classList.remove("hidden");
  document.querySelector(".fake-form").style.display = "none";
  document.getElementById("paymentMethodSelected").innerHTML =
    htmlPaymentSelected;

  const respRight = await client.snippet.render(
    "payment_right_menu_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(respRight, "data-render-right-menu");
  document.getElementById("data-render-right-menu").style.display = "";

  document.getElementById("finish-order").style.maxWidth = "";
  document.querySelector(
    "#finish-order .payment-selected-method"
  ).style.maxHeight = "";

  document.querySelector(".checkout-footer").style.marginTop = "320px";

  document.querySelector(
    ".checkout-footer-mobile .checkout-whats"
  ).style.display = "none";
  document.querySelector(
    ".checkout-footer-mobile .footer_mobile_bottom"
  ).style.display = "none";

  document.querySelector(".checkout-footer-mobile").innerHTML += respRight;

  const cardNumber = maskNumber(
    document.querySelector(".fake-form input[name=number]").value
  );

  document.querySelector(
    "#paymentMethodSelected .payment-details span"
  ).innerHTML = cardNumber;
}

function NewCarregaClearSaleFP(appId) {
  if (typeof window.csdp !== "undefined") {
    return;
  }
  $("<input>")
    .attr({
      type: "hidden",
      id: "fingerPrint_clearSale",
      name: "fingerPrint_clearSale",
    })
    .appendTo("[data-gateway-cartao]");

  (function (a, b, c, d, e, f, g) {
    a["CsdpObject"] = e;
    (a[e] =
      a[e] ||
      function () {
        (a[e].q = a[e].q || []).push(arguments);
      }),
      (a[e].l = 1 * new Date());
    (f = b.createElement(c)), (g = b.getElementsByTagName(c)[0]);
    f.async = 1;
    f.src = d;
    g.parentNode.insertBefore(f, g);
  })(window, document, "script", "//device.clearsale.com.br/p/fp.js", "csdp");

  $(document).ready(function () {
    if (typeof csdp === "function") {
      csdp("app", appId);
      csdp("outputsessionid", "fingerPrint_clearSale");
    } else {
      console.error("csdp function is not defined.");
    }
  });
}

const updateRightMenuPayment = async () => {
  const checkoutId = client.cookie.get("carrinho-id");
  const respRight = await client.snippet.render(
    "payment_right_menu_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(respRight, "data-render-right-menu");
};

function InitializeJpCardLibrary() {
  if (!document.querySelector(".card-wrapper")) {
    console.log(".card-wrapper não encontrado");
    return;
  }

  Fbits.Gateway.Framework._card = new Fbits.Gateway.Framework.Identificado({
    form: ".fake-form",
    container: ".card-wrapper",
    formatting: true,
    messages: {
      validDate: "expiração\ndata",
      monthYear: "mm/yyyy",
    },
    placeholders: {
      number: "xxxx xxxx xxxx xxxx",
      name: "Nome do Titular",
      expiry: "00/00",
      cvc: "xxx",
    },
    masks: {
      cardNumber: "•",
    },
  });
}

function expiryDateMask(input) {
  let value = input.value.replace(/\D/g, "");

  if (value.length > 4) value = value.slice(0, 4);

  if (value.length >= 2) {
    value = value.replace(/^(\d{2})/, "$1/");
  }

  input.value = value;
}

function ensureCardElementsVisibility() {
  const paymentContainer = document.getElementById("payment-container");
  if (paymentContainer) {
    paymentContainer.style.display = "block";
    paymentContainer.style.visibility = "visible";
    paymentContainer.classList.remove("hidden");

    const hiddenElements = paymentContainer.querySelectorAll(".hidden");
    hiddenElements.forEach((element) => {
      if (element.tagName.toLowerCase() === "span") {
        element.classList.remove("hidden");
      }
    });

    const gatewayElements = paymentContainer.querySelectorAll(
      '[class*="fbits-gateway"], [class*="gateway"], [class*="linha"]'
    );
    gatewayElements.forEach((element) => {
      element.style.display = "block";
      element.style.visibility = "visible";

      const forminlines = element.querySelectorAll(".forminline");
      forminlines.forEach((forminline) => {
        forminline.style.display = "flex";
        forminline.style.visibility = "visible";
      });
    });
  }
}

const selectPayment = async (paymentId) => {
  const loading = document.getElementById("payment-loading");
  loading.classList.remove("hidden");
  loading.classList.add("flex");

  const wrappers = document.querySelectorAll("div[data-payment-wrapper]");
  wrappers.forEach((element) => (element.innerHTML = ""));

  const checkoutId = client.cookie.get("carrinho-id");

  const result = await newSelectPaymentWhenRendering(checkoutId, paymentId);

  if (result?.errors) {
    showOverlay(
      "Erro ao selecionar o pagamento",
      result.errors[0].message,
      true
    );
    loading.classList.add("hidden");
    loading.classList.remove("flex");
    return;
  }

  const finishOrder = document.getElementById("finish-order");

  finishOrder.style.display = "flex";
  finishOrder.style.maxWidth = "1200px";

  document.getElementById("checkout-payment-options").style.display = "none";

  setTimeout(() => {
    ensureCardElementsVisibility();

    console.log("Executando funções de reorganização e máscaras...");
    setTimeout(() => {
      reorganizeExpirationInputs();
      applyInputMasks();
    }, 300);
  }, 100);

  await renderSummary();
  loading.classList.add("hidden");
  loading.classList.remove("flex");
};

async function renderSummary() {
  const checkoutId = client.cookie.get("carrinho-id");
  const response = await client.snippet.render(
    "wake_checkout_close_summary_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(response, "data_summary");
}

async function backPaymentStep() {
  Fbits.Gateway.ResetPaymentSelection();
  const checkoutId = client.cookie.get("carrinho-id");
  const wrappers = document.querySelectorAll("div[data-payment-wrapper]");
  wrappers.forEach((element) => (element.innerHTML = ""));

  document.getElementById("finish-order").style.display = "none";

  document.getElementById("checkout-payment-options").style.display = "flex";

  const respRight = await client.snippet.render(
    "checkout_right_menu_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(respRight, "data-render-right-menu");
  document.getElementById("data-render-right-menu").style.display = "";

  document.querySelector(".checkout-footer").style.marginTop = "";

  const checkoutRightMenu = document.querySelector(
    ".checkout-footer-mobile .checkout-right-menu"
  );
  if (checkoutRightMenu) {
    checkoutRightMenu.remove();
  }

  const finishLoading = document.querySelector(
    ".checkout-footer-mobile #finish-loading"
  );
  if (finishLoading) {
    finishLoading.remove();
  }

  document.querySelector(
    ".checkout-footer-mobile .checkout-whats"
  ).style.display = "";
  document.querySelector(
    ".checkout-footer-mobile .footer_mobile_bottom"
  ).style.display = "";
  document.getElementById("finish-order").style.maxWidth = "";

  document.querySelector(
    "#finish-order .payment-selected-method"
  ).style.maxHeight = "";
}

function formCpfMask(input) {
  let value = input.value.replace(/\D/g, "");

  if (value.length > 11) {
    value = value.slice(0, 11);
  }

  input.value = value
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formComplete(form) {
  let button = document.getElementById("finish-card-form-button");

  let allFilled = [...form.elements]
    .filter((el) => el.hasAttribute("required"))
    .every((el) => el.value.trim() !== "");

  let cpfValid = Fbits.Util.ValidaCPF(
    document.querySelector(".fake-form input[name=cpf]").value.trim()
  );

  button.disabled = !allFilled || !cpfValid;
}

function validateCpf(input) {
  let cpfValid = Fbits.Util.ValidaCPF(input.value.replace(/\D/g, ""));

  if (!cpfValid) {
    input.classList.add("invalid");
  } else {
    input.classList.remove("invalid");
  }
}

function cardType(input) {
  document.getElementById("cloned-card-flag")?.remove();
  document.querySelectorAll(".jp-card-front .jp-card-logo").forEach((el) => {
    el.style.opacity = "";
  });

  const cardType = Payment.fns.cardType(input.value);

  const cardFlag = document.querySelector(
    `.jp-card-front .jp-card-${cardType}`
  );

  if (cardFlag) {
    cardFlag.style.opacity = 1;
    const clonedFlag = cardFlag.cloneNode(true);
    clonedFlag.id = "cloned-card-flag";
    document.getElementById("inputCardNumber").appendChild(clonedFlag);
  }
}

function updateExpiryValue() {
  const expiryInputValue = document.querySelector(
    'input[name="expiryDate"]'
  ).value;

  const expiryInput = document.querySelector('input[name="expiry"]');
  const monthInput = document.querySelector('input[name="month"]');
  const yearInput = document.querySelector('input[name="year"]');

  const newDate = expiryInputValue.replace(/\/(\d{2})$/, "/20$1");
  const [newMonth, newYear] = newDate.split("/");

  monthInput.value = newMonth;
  yearInput.value = newYear;
  expiryInput.value = newDate;

  yearInput.dispatchEvent(new Event("change"));
  monthInput.dispatchEvent(new Event("change"));
  expiryInput.dispatchEvent(new Event("change"));
}

function reorganizeExpirationInputs() {
  console.log("Tentando reorganizar inputs de validade...");

  const monthInput = document.querySelector(
    '[data-checkout="cardExpirationMonth"]'
  );
  const yearInput = document.querySelector(
    '[data-checkout="cardExpirationYear"]'
  );
  const cardNumberInput = document.querySelector(
    '[data-checkout="cardNumber"]'
  );

  console.log("Inputs encontrados:", { monthInput, yearInput });

  if (!monthInput || !yearInput) {
    console.log(
      "Reorganização cancelada: inputs não encontrados ou já reorganizados"
    );
    return;
  }

  if (monthInput.closest(".expiration-container")) {
    console.log("Inputs já reorganizados");
    return;
  }

  if (cardNumberInput && !document.querySelector(".card-form-title")) {
    const cardNumberContainer = cardNumberInput.closest(".forminline");
    if (cardNumberContainer) {
      const cardTitle = document.createElement("h3");
      cardTitle.className = "card-form-title";
      cardTitle.textContent = "Cadastrar cartão";
      cardTitle.style.cssText = `
        color: #333;
        font-family: "Satoshi", sans-serif;
        font-size: 28px;
        font-style: normal;
        font-weight: 500;
        line-height: 150%;
        margin-bottom: 24px;
        margin-top: 0;
      `;

      cardNumberContainer.parentNode.insertBefore(
        cardTitle,
        cardNumberContainer
      );
    }
  }

  const parentContainer = monthInput.closest(".forminline");
  if (!parentContainer) {
    console.log("Container pai não encontrado");
    return;
  }

  const validadeLabel = parentContainer.querySelector("label");
  const labels = parentContainer.querySelectorAll("label");
  labels.forEach((label) => {
    if (
      label.textContent.includes("Validade") ||
      label.textContent.includes("validade")
    ) {
      label.remove();
    }
  });

  const expirationContainer = document.createElement("div");
  expirationContainer.className = "expiration-container";
  expirationContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-top: 15px;
    width: 100%;
  `;

  const mainLabel = document.createElement("label");
  mainLabel.textContent = "Validade";
  mainLabel.style.cssText = `
    font-size: 14px;
    font-weight: 500;
    color: #333;
    margin-bottom: 5px;
  `;

  const inputsContainer = document.createElement("div");
  inputsContainer.style.cssText = `
    display: flex;
    gap: 10px;
    align-items: center;
  `;

  const monthContainer = document.createElement("div");
  monthContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    flex: 1;
  `;

  const monthLabel = document.createElement("label");
  monthLabel.textContent = "Mês";
  monthLabel.style.cssText = `
    font-size: 12px;
    color: #666;
    margin-bottom: 3px;
    display: none;
  `;

  const yearContainer = document.createElement("div");
  yearContainer.style.cssText = `
    display: flex;
    flex-direction: column;
    flex: 1;
  `;

  const yearLabel = document.createElement("label");
  yearLabel.textContent = "Ano";
  yearLabel.style.cssText = `
    font-size: 12px;
    color: #666;
    margin-bottom: 3px;
    display: none;
  `;

  const separator = document.createElement("span");
  separator.textContent = "/";
  separator.style.cssText = `
    font-size: 18px;
    color: #999;
    margin: 0 5px;
    align-self: flex-end;
    margin-bottom: 8px;
  `;

  monthInput.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
  `;

  yearInput.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    text-align: center;
  `;

  monthContainer.appendChild(monthLabel);
  monthContainer.appendChild(monthInput);

  yearContainer.appendChild(yearLabel);
  yearContainer.appendChild(yearInput);

  inputsContainer.appendChild(monthContainer);
  inputsContainer.appendChild(separator);
  inputsContainer.appendChild(yearContainer);

  expirationContainer.appendChild(mainLabel);
  expirationContainer.appendChild(inputsContainer);

  parentContainer.appendChild(expirationContainer);

  console.log("Inputs de validade reorganizados com sucesso!");
}

function detectCardBrand(cardNumber) {
  const cardBrands = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
    discover: /^6(?:011|5)/,
    elo: /^(4011|4312|4389|4514|4573|5041|5066|5067|6277|6362|6363|6504|6505|6516)/,
  };

  let detectedBrand = "";
  for (const [brand, pattern] of Object.entries(cardBrands)) {
    if (pattern.test(cardNumber)) {
      detectedBrand = brand;
      break;
    }
  }

  const cardInput = document.querySelector('[data-checkout="cardNumber"]');
  if (cardInput) {
    cardInput.classList.remove("visa", "mastercard", "amex", "discover", "elo");

    if (detectedBrand) {
      cardInput.classList.add(detectedBrand);

      if (!cardInput.parentElement.classList.contains("card-input-wrapper")) {
        const wrapper = document.createElement("div");
        wrapper.className = "card-input-wrapper";
        wrapper.style.cssText = `
          position: relative;
          display: inline-block;
          width: 100%;
        `;

        cardInput.parentNode.insertBefore(wrapper, cardInput);
        wrapper.appendChild(cardInput);
      }

      let brandIcon = cardInput.parentElement.querySelector(".card-brand-icon");
      if (!brandIcon) {
        brandIcon = document.createElement("div");
        brandIcon.className = "card-brand-icon";
        brandIcon.style.cssText = `
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 30px;
          height: 20px;
          background-size: contain;
          background-repeat: no-repeat;
          background-position: center;
          z-index: 10;
        `;
        cardInput.parentElement.appendChild(brandIcon);
      }

      const brandIcons = {
        visa: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzAwNTFBNSIvPgo8cGF0aCBkPSJNMTYuNzUgMTZIMTQuNUwxNi4yNSA4SDE4LjVMMTYuNzUgMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K",
        mastercard:
          "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0VCMDAxQiIvPgo8Y2lyY2xlIGN4PSIxNSIgY3k9IjEyIiByPSI3IiBmaWxsPSIjRkY1RjAwIi8+CjxjaXJjbGUgY3g9IjI1IiBjeT0iMTIiIHI9IjciIGZpbGw9IiNGRkY1RjAiLz4KPC9zdmc+",
        amex: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzAwNkZDRiIvPgo8dGV4dCB4PSIyMCIgeT0iMTUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSI4IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+QU1FWDwvdGV4dD4KPC9zdmc+",
      };

      if (brandIcons[detectedBrand]) {
        brandIcon.style.backgroundImage = `url(${brandIcons[detectedBrand]})`;
      }
    }
  }
}

function applyInputMasks() {
  console.log("Aplicando máscaras aos inputs...");

  const cardNumberInput = document.querySelector(
    '[data-checkout="cardNumber"]'
  );
  if (cardNumberInput) {
    cardNumberInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");
      value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
      if (value.length > 19) value = value.substring(0, 19);
      e.target.value = value;

      detectCardBrand(value.replace(/\s/g, ""));
    });
  }

  const monthInput = document.querySelector(
    '[data-checkout="cardExpirationMonth"]'
  );
  if (monthInput) {
    monthInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 2) value = value.substring(0, 2);
      if (parseInt(value) > 12) value = "12";
      if (parseInt(value) < 1 && value.length === 2) value = "01";
      e.target.value = value;
    });
  }

  const yearInput = document.querySelector(
    '[data-checkout="cardExpirationYear"]'
  );
  if (yearInput) {
    yearInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 2) value = value.substring(0, 2);
      e.target.value = value;
    });
  }

  const cardHolderInput = document.querySelector(
    '[data-checkout="cardholderName"]'
  );
  if (cardHolderInput) {
    cardHolderInput.addEventListener("input", function (e) {
      e.target.value = e.target.value
        .replace(/[^a-zA-ZÀ-ÿ\s]/g, "")
        .toUpperCase();
    });
  }

  const cvvInput = document.querySelector('[data-checkout="securityCode"]');
  if (cvvInput) {
    cvvInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");
      if (value.length > 4) value = value.substring(0, 4);
      e.target.value = value;
    });
  }

  const cpfCnpjInput = document.querySelector(
    'input[name*="cpf"], input[name*="cnpj"], input[placeholder*="CPF"], input[placeholder*="CNPJ"]'
  );
  if (cpfCnpjInput) {
    cpfCnpjInput.addEventListener("input", function (e) {
      let value = e.target.value.replace(/\D/g, "");

      if (value.length <= 11) {
        // CPF: 000.000.000-00
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      } else {
        // CNPJ: 00.000.000/0001-00
        value = value.substring(0, 14);
        value = value.replace(/(\d{2})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1.$2");
        value = value.replace(/(\d{3})(\d)/, "$1/$2");
        value = value.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
      }

      e.target.value = value;
    });
  }
}

function setupPaymentObserver() {
  console.log("Configurando observer para inputs de pagamento...");

  const observer = new MutationObserver(function (mutations) {
    mutations.forEach(function (mutation) {
      if (mutation.type === "childList") {
        const addedNodes = Array.from(mutation.addedNodes);

        const hasCardInputs = addedNodes.some((node) => {
          if (node.nodeType === 1) {
            return (
              node.querySelector &&
              (node.querySelector('[data-checkout="cardNumber"]') ||
                node.querySelector('[data-checkout="cardExpirationMonth"]') ||
                node.querySelector('[data-checkout="cardExpirationYear"]'))
            );
          }
          return false;
        });

        if (hasCardInputs) {
          console.log(
            "Inputs de cartão detectados, aplicando reorganização..."
          );
          setTimeout(() => {
            reorganizeExpirationInputs();
            applyInputMasks();
          }, 100);
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  let attempts = 0;
  const maxAttempts = 60;

  const intervalCheck = setInterval(() => {
    attempts++;

    const monthInput = document.querySelector(
      '[data-checkout="cardExpirationMonth"]'
    );
    const yearInput = document.querySelector(
      '[data-checkout="cardExpirationYear"]'
    );

    if (
      monthInput &&
      yearInput &&
      !monthInput.closest(".expiration-container")
    ) {
      console.log(
        "Inputs encontrados via fallback, aplicando reorganização..."
      );
      setTimeout(() => {
        reorganizeExpirationInputs();
        applyInputMasks();
      }, 500);
      clearInterval(intervalCheck);
    } else if (attempts >= maxAttempts) {
      console.log("Timeout: inputs de cartão não encontrados após 30 segundos");
      clearInterval(intervalCheck);
    }
  }, 500);
}

function initializePaymentFunctions() {
  console.log("=== INICIALIZANDO FUNÇÕES DE PAGAMENTO ===");
  console.log("DOM readyState:", document.readyState);

  try {
    setupPaymentObserver();
    console.log("Observer configurado com sucesso");
  } catch (error) {
    console.error("Erro ao configurar observer:", error);
  }

  setTimeout(() => {
    console.log("Executando timeout de inicialização...");
    try {
      reorganizeExpirationInputs();
      applyInputMasks();
    } catch (error) {
      console.error("Erro na execução das funções:", error);
    }
  }, 500);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializePaymentFunctions);
} else {
  initializePaymentFunctions();
}

window.addEventListener("load", function () {
  console.log("Janela carregada, verificando inputs de pagamento...");
  setTimeout(() => {
    reorganizeExpirationInputs();
    applyInputMasks();
  }, 1000);
});

if (typeof window !== "undefined") {
  console.log("=== SCRIPT PAYMENT_FUNCTIONS.JS CARREGADO ===");

  initializePaymentFunctions();

  setTimeout(() => {
    console.log("=== EXECUÇÃO COM DELAY ===");
    initializePaymentFunctions();
  }, 1000);

  document.addEventListener(
    "click",
    function () {
      console.log("=== CLICK DETECTADO, VERIFICANDO INPUTS ===");
      setTimeout(() => {
        reorganizeExpirationInputs();
        applyInputMasks();
      }, 100);
    },
    { once: false }
  );
}
