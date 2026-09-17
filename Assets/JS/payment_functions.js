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

async function setName(el, name) {
  document.querySelector(el).name = name;
}

// Detecta se o método de pagamento selecionado é o Pix do PagBank (gateway
// "Custom", sem SDK do MercadoPago/PagSeguro cartão) — assinatura observada:
// html contém "Pix" e os scripts carregados são só do Custom/custom.js.
// Usado para setar o cookie "isPBPix" no momento de finalizar a compra,
// permitindo à página de confirmação saber se deve buscar o QR Code do PagBank.
function isPagBankPixSelection(selectedPaymentMethod) {
  if (!selectedPaymentMethod) return false;
  const html = selectedPaymentMethod.html || "";
  const scripts = selectedPaymentMethod.scripts || [];
  const isPix = /pix/i.test(html);
  const isCustomOnly = scripts.length > 0 && scripts.every((s) => s.includes("/Custom/"));
  return isPix && isCustomOnly;
}

async function newSelectPaymentWhenRendering(checkoutId, paymentId, orderId) {
  const token = client.cookie.get("sf_customer_access_token");

  console.log({
    checkoutId: checkoutId,
    paymentMethodId: paymentId,
    customerAccessToken: token,
    orderId,
  })

  const response = await client.snippet.detailed("payment_selected_snippet.html", "payment_select_mutation.graphql",
    {
      checkoutId: checkoutId,
      paymentMethodId: paymentId,
      customerAccessToken: token,
      orderId
    });


  if (response.queryResponse.errors) {
    console.log(response.queryResponse)
    return { errors: response.queryResponse.errors };
  }

  Fbits.Gateway.ResetPaymentSelection();

  const div = document.querySelector(
    `div[data-payment-wrapper="${paymentId}"]`
  );

  div.innerHTML = response.html;

  if (div && response) {
    const isCardPayment = response.html.includes("paymentCartao");

    if (!isCardPayment) {
      setStyleIfPresent("#finish-order .payment-selected-method", "maxHeight", "");

      const paymentOptionEl = document.getElementById(`paymentOption-${paymentId}`);
      const paymentLabel = paymentOptionEl?.nextElementSibling;
      const paymentImage = paymentLabel?.querySelector("img");
      const paymentDetails = paymentLabel?.querySelector(".payment-details");

      if (paymentImage && paymentDetails) {
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
      }

      const respRight = await client.snippet.render(
        "payment_right_menu_snippet.html",
        "SnippetQueries/wake_checkout_close_summary.graphql",
        {
          checkoutId: checkoutId,
        }
      );

      setInnerHtmlById(respRight, "data-render-right-menu");

      setStyleIfPresent(".checkout-footer-mobile .checkout-whats", "display", "none");
      setStyleIfPresent(".checkout-footer-mobile .footer_mobile_bottom", "display", "none");

      const footerMobile = document.querySelector(".checkout-footer-mobile");
      if (footerMobile) footerMobile.innerHTML += respRight;
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

  const e = response.queryResponse.data?.result?.selectedPaymentMethod
    , u = response.queryResponse.data?.result?.selectedPaymentMethods || (e ? [e] : []);

  // Guarda em variável global (não em cookie ainda): o cookie "isPBPix" só é
  // gravado de fato em closeCheckout() (checkout_close.js), no momento de
  // finalizar a compra — aqui só marcamos qual foi a última seleção de pagamento.
  window.isPBPixSelected = isPagBankPixSelection(e);


  const l = u.reduce((n, t) => {
    const i = t.type;
    return n[i] || (n[i] = []),
      n[i].push(t),
      n
  }
    , {})

  const script = Object.values(l).flatMap(n => {
    const t = n[0]?.scripts;
    if (!t || t.length === 0)
      return [];
    const i = n.map(n => n.id);
    return t.map(n => {
      let t = n;
      return client.cookie.get("wake-scripts-pagamento-hlog") && (t = n.replace("https://pub-gateway.fbits.net/scripts/", "https://static.fbits.net/scripts/checkout/pagamentos/hlog/").replace("/prod/", "/hlog/")),
        loadScript(`${t}?v=${wake_last_modified}&pagamento=${i.join(",")}&isStorefront=true`)
    }
    )
  }
  );
  script.length > 0 && Promise.all(script).then(() => {
    console.log("Todos os scripts foram carregados com sucesso."),
      Fbits.Gateway.ExecuteLoadedCallbacks()
    initAbcCardPreview();
  }
  ).catch(n => {
    console.error("Erro ao carregar os scripts:", n)
  }
  );
  /*
    if (scripts) {
      await Promise.all(
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
          // InitializeJpCardLibrary();
        })
        .catch((error) => {
          console.error("Erro ao carregar os scripts:", error);
        });
      }
      */
  // 
  const clearSaleAppID = $("input[name='clearsale-appid']").val();
  if (clearSaleAppID) {
    NewCarregaClearSaleFP(clearSaleAppID);
  }

  updateCheckout()

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

  // .cardWrapper pode não estar presente no momento exato desta chamada em
  // certos re-renders — guard evita que a função pare no meio, deixando o
  // resto (menu direito, botão "Finalizar compra") sem executar.
  const cardWrapperEl = document.querySelector(".cardWrapper");
  if (cardWrapperEl) {
    cardWrapperEl.style.display = "none";
  }

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

  // Daqui pra baixo os alvos sao condicionais: o rodape mobile so existe em telas
  // pequenas e .footer_mobile_bottom nao existe em markup nenhum do tema (so em
  // querySelector). Sem guarda, o primeiro null lancava TypeError -- e como esta
  // funcao e async, a rejeicao ficava sem tratamento e TUDO abaixo era pulado,
  // inclusive o numero mascarado do cartao no resumo.
  // Mesmo padrao ja usado em Components/checkout/checkout_footer.html:141.
  setStyleIfPresent("#data-render-right-menu", "display", "");
  setStyleIfPresent("#finish-order", "maxWidth", "");
  setStyleIfPresent("#finish-order .payment-selected-method", "maxHeight", "");
  setStyleIfPresent(".checkout-footer-mobile .checkout-whats", "display", "none");
  setStyleIfPresent(".checkout-footer-mobile .footer_mobile_bottom", "display", "none");

  const footerMobile = document.querySelector(".checkout-footer-mobile");
  if (footerMobile) footerMobile.innerHTML += respRight;

  const numberInput = document.querySelector(".wc-card-form input[name=number]");
  const selectedNumber = document.querySelector(
    "#paymentMethodSelected .payment-details span"
  );
  if (numberInput && selectedNumber) {
    selectedNumber.innerHTML = maskNumber(numberInput.value);
  }
}

function setStyleIfPresent(selector, prop, value) {
  const el = document.querySelector(selector);
  if (el) el.style[prop] = value;
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

// Nome proprio de proposito: wake_payment_functions.js tambem define um
// InitializeJpCardLibrary global, apontando para ".fake-form". Como o nosso bundle
// carrega com async, quem ganha o nome e uma corrida -- e quando a versao da Wake
// ganhava, o jp-card nao achava ".fake-form" e o cartao visual nao era montado.
async function initAbcCardPreview() {
  if (!document.querySelector(".card-wrapper")) {
    console.log(".card-wrapper não encontrado");
    return;
  }

  Fbits.Gateway.Framework._card = new Fbits.Gateway.Framework.Identificado({
    form: ".wc-card-form",
    container: ".card-wrapper",
    formatting: true,
    messages: {
      validDate: "expiração\ndata",
      monthYear: "mm/yy",
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

  // A Wake nao nomeia os campos do gateway: quem serializa month/year sao os hidden
  // do proprio formulario (wc-card-form), preenchidos por updateAbcExpiryValue().
  // Nomear os campos [data-checkout] criava month=01,01 / year=2028,28 no payload.
  // A tokenizacao do Mercado Pago le [data-checkout], nao [name] -- nao e afetada.
  // Para reverter: setName('[data-checkout="cardExpirationMonth"]', "month") + idem Year.
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

const selectPaymentPushElement = async (checkoutId, paymentName) => {
  const { data } = await client.checkout.get(checkoutId);
  try {
    const items = await data.products.map((e) => {
      return {
        item_id: e.productId,
        item_name: e.name,
        discount: e.price == 0 ? 0 : e.listPrice - e.price,
        price: e.price == 0 ? e.price : e.price,
        quantity: e.quantity
      }
    })

    window.dataLayer.push({
      event: "add_payment_info",
      ecommerce: {
        payment_type: paymentName,
        currency: "BRL",
        value: data.total,
        items
      }
    })
  } catch {
    console.log("Ocorreu um erro na montagem do evento de 'add_payment_info'")
  }

}

let selectPaymentInProgress = false;

const selectPayment = async (paymentId, paymentName) => {
  // Guard contra chamadas duplicadas (ex: clique duplo, ou disparo repetido do
  // evento) — sem isso, newSelectPaymentWhenRendering() pode rodar mais de uma
  // vez para a mesma seleção, fazendo o script do gateway (ex: custom.js) ser
  // carregado e registrar seu callback de validação duas vezes.
  if (selectPaymentInProgress) {
    return;
  }
  selectPaymentInProgress = true;

  try {
    const loading = document.getElementById('payment-loading');
    loading.classList.remove('hidden');
    loading.classList.add('flex');

    const wrappers = document.querySelectorAll('div[data-payment-wrapper]');
    wrappers.forEach((element) => element.innerHTML = '');

    const checkoutId = await client.cookie.get("carrinho-id");

    const result = await newSelectPaymentWhenRendering(checkoutId, paymentId);

    await selectPaymentPushElement(checkoutId, paymentName)

    const finishOrder = document.getElementById('finish-order');

    finishOrder.style.display = 'flex';

    document.getElementById('checkout-payment-options').style.display = 'none';

    await renderSummary();

    if (result.errors) {
      showOverlay("Erro ao selecionar o pagamento", result.errors[0].message, true);
    } else {
      loading.classList.add('hidden');
      loading.classList.remove('flex');
    }
  } finally {
    selectPaymentInProgress = false;
  }
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
  setStyleIfPresent("#data-render-right-menu", "display", "");
  setStyleIfPresent(".checkout-footer", "marginTop", "");

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

  // Espelho do nextCardScreen: mesmos alvos condicionais, mesma guarda.
  setStyleIfPresent(".checkout-footer-mobile .checkout-whats", "display", "");
  setStyleIfPresent(".checkout-footer-mobile .footer_mobile_bottom", "display", "");
  setStyleIfPresent("#finish-order", "maxWidth", "");
  setStyleIfPresent("#finish-order .payment-selected-method", "maxHeight", "");
}

function validaCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, "");
  
  if (cnpj.length !== 14) return false;
  
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  let tamanho = cnpj.length - 2;
  let numeros = cnpj.substring(0, tamanho);
  let digitos = cnpj.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(0)) return false;
  
  tamanho = tamanho + 1;
  numeros = cnpj.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;
  
  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado != digitos.charAt(1)) return false;
  
  return true;
}

function formCpfMask(input) {
  let value = input.value.replace(/\D/g, "");

  if (value.length <= 11) {
    if (value.length > 11) value = value.slice(0, 11);
    input.value = value
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
  } else {
    if (value.length > 14) value = value.slice(0, 14);
    input.value = value
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3/$4")
      .replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, "$1.$2.$3/$4-$5");
  }
}

function updateInputValue(name, str) {
  // #form-pagar-mp só existe na estrutura do gateway MercadoPago. Em outros
  // gateways (ex: PagSeguro/Custom), esses campos não existem no DOM —
  // sem este guard, o querySelector abaixo retorna null e o .dispatchEvent
  // seguinte lança TypeError, interrompendo o .map() de formComplete() antes
  // de chegar em "button.disabled = ...".
  const form = document.querySelector('#form-pagar-mp');
  if (!form) return;

  switch (name) {
    case "number": {
      const el = form.querySelector('[data-checkout="cardNumber"]');
      if (!el) return;
      $(el).val(str).trigger('change');
      el.dispatchEvent(new Event('input'));
      break;
    }
    case "expiryDate": {
      const data = str.split('/');
      const monthEl = form.querySelector('[data-checkout="cardExpirationMonth"]');
      const yearEl = form.querySelector('[data-checkout="cardExpirationYear"]');
      if (monthEl) {
        $(monthEl).val(data[0] || "").trigger('change');
        monthEl.dispatchEvent(new Event('input'));
      }
      if (yearEl) {
        $(yearEl).val(data[1] ? data[1] : "").trigger('change');
        yearEl.dispatchEvent(new Event('input'));
      }
      break;
    }
    case "cvc": {
      const el = form.querySelector('[data-checkout="securityCode"]');
      if (!el) return;
      $(el).val(str).trigger('change');
      el.dispatchEvent(new Event('input'));
      break;
    }
    case "name": {
      const el = form.querySelector('[data-checkout="cardholderName"]');
      if (!el) return;
      $(el).val(str).trigger('change');
      el.dispatchEvent(new Event('input'));
      break;
    }
    case "cpf": {
      const el = form.querySelector('[data-checkout="docNumber"]');
      if (!el) return;
      $(el).val(str).trigger('change');
      el.dispatchEvent(new Event('input'));
      break;
    }
  }
}

function formComplete(form) {
  let button = document.getElementById("finish-card-form-button");

  let allFilled = [...form.elements]
    .map((el) => {
      updateInputValue(el.name, el.value);
      return el
    })
    .filter((el) => el.hasAttribute("required"))
    .every((el) => el.value.trim() !== "" && el.className.indexOf("jp-card-invalid") === -1)

  let docValue = document.querySelector(".wc-card-form input[name=cpf]").value.replace(/\D/g, "");
  let docValid = false;
  
  if (docValue.length === 11) {
    docValid = Fbits.Util.ValidaCPF(docValue);
  } else if (docValue.length === 14) {
    docValid = validaCNPJ(docValue);
  }

  button.disabled = !allFilled || !docValid;
}

function validateCpf(input) {
  let value = input.value.replace(/\D/g, "");
  let isValid = false;
  
  if (value.length === 11) {
    isValid = Fbits.Util.ValidaCPF(value);
  } else if (value.length === 14) {
    isValid = validaCNPJ(value);
  }

  if (!isValid) {
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

// Nome proprio: wake_payment_functions.js tambem define updateExpiryValue -- usar
// esse nome evitaria colisao mesmo que a dela vencesse a sobrescrita. Os hidden
// year/month mantem o id (#month, #year) porque o gateway PagBank/Custom le por id.
function updateAbcExpiryValue() {
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