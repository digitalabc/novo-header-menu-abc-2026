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
        InitializeJpCardLibrary();
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

  document.getElementById("checkout-payment-options").style.display = "none";

  setTimeout(() => {
    ensureCardElementsVisibility();
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
