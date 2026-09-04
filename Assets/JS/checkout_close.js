window.addEventListener("load", closeSetup, false);

// As duas variavies servem salvar o tipo de tentiva e o dado em caso que o login simples não é aceito
let returnLoginConcluded = "";
let dataLoginConcluded = "";

// Associa usuario com carrinho
// Caso usuario não exista abre um formulario com email/cpf preenchido para ser criado
async function closeSetup() {
  const token = client.cookie.get("sf_customer_access_token");
  if (!token) {
    return;
  }

  const response = await client.customer.accessTokenDetails(token);
  const details = response.data;

  if (details.type === "NEW") {
    const identifier = details.identifier;

    if (isValidCpf(identifier)) {
      const cpfInput = document.querySelector('[id="cpf"]');
      cpfInput.value = identifier;
      cpfInput.setAttribute("disabled", "disabled");
    } else {
      const emailInput = document.querySelector('[id="email"]');
      emailInput.value = identifier;
      emailInput.setAttribute("disabled", "disabled");
    }
    return;
  }
  const renderPayment = document.querySelector("[data-render-payment]");

  if (renderPayment) {
    renderOptionsPayment();
  }
}

/**
 * Formulario para criar novo cliente apartir de carrinho
 * Associa usuario com carrinho,
 * Busca formulario com id 'accountCreateCloseForm'
 *
 * @param {CustomerCreateInput} input
 */
const accountCreateCloseSubmit = async (e) => {
  e.preventDefault();

  document.getElementById("text").classList.add("hidden");
  document.getElementById("loading").classList.remove("hidden");

  const cpfInput = document.querySelector('[id="cpf"]');
  const emailInput = document.querySelector('[id="email"]');
  const birthdateElement = document.querySelector('[id="birthDate"]');
  const birthdateValue = birthdateElement?.value;

  const input = convertFormInObject(e.target);

  input.fullName = fullName.value;
  input.cpf = cpfInput.value;
  input.email = emailInput.value;
  input.birthDate = birthdateValue ? birthdateValue : null;
  input.isStateRegistrationExempt = document.getElementById(
    "exemptStateRegistrationFree"
  ).checked;

  if (
    (!input.fullName ||
      !input.cpf ||
      !input.primaryPhoneAreaCode ||
      !input.primaryPhoneNumber) &&
    !input.cnpj
  ) {
    if (!input.fullName) {
      document.getElementById("fullName").classList.add("border-red-600");
      document.getElementById("error-fullName").classList.remove("hidden");
    }
    if (!input.cpf) {
      document.getElementById("cpf").classList.add("border-red-600");
      document.getElementById("error-cpf").classList.remove("hidden");
    }
    if (!input.primaryPhoneAreaCode) {
      document
        .getElementById("primaryPhoneAreaCode")
        .classList.add("border-red-600");
    }
    if (!input.primaryPhoneAreaCode) {
      document
        .getElementById("primaryPhoneNumber")
        .classList.add("border-red-600");
      document
        .getElementById("error-primaryPhoneNumber")
        .classList.remove("hidden");
    }
    document.getElementById("text").classList.remove("hidden");
    document.getElementById("loading").classList.add("hidden");
    return false;
  } else {
    document.getElementById("fullName").classList.remove("border-red-600");
    document.getElementById("cpf").classList.remove("border-red-600");
    document
      .getElementById("primaryPhoneAreaCode")
      .classList.remove("border-red-600");
    document
      .getElementById("primaryPhoneNumber")
      .classList.remove("border-red-600");
    document.getElementById("error-fullName").classList.add("hidden");
    document.getElementById("error-cpf").classList.add("hidden");
    document.getElementById("error-primaryPhoneNumber").classList.add("hidden");
  }

  const token = client.cookie.get("sf_customer_access_token");
  const createResponse = await client.customer.completeRegistration(
    input,
    token
  );

  if (createResponse.errors) {
    showOverlay("Erro no formulário", createResponse.errors[0].message, true);
  } else {
    await renderUser();
  }

  document.getElementById("text").classList.remove("hidden");
  document.getElementById("loading").classList.add("hidden");
};

/**
 * Formulario para criar novo endereço apartir de carrinho.
 * Apos endereço ser criado, função selectAddress é assionado.
 * Busca formulario com id 'addressCreateCloseForm'
 *
 * @param {CreateCustomerAddressInput} input
 */
const addressCreateCloseSubmit = async (e) => {
  e.preventDefault();
  const input = convertFormInObject(e.target);

  document.getElementById("text").classList.add("hidden");
  document.getElementById("loading").classList.remove("hidden");

  input.addressDetails = document.getElementById("addressDetails")?.value;
  input.address = document.getElementById("address")?.value;
  input.addressNumber = document.getElementById("addressNumber")?.value;
  input.state = document.getElementById("state")?.value;
  input.neighborhood = document.getElementById("neighborhood")?.value;
  input.city = document.getElementById("city")?.value;
  input.country = "BR";
  input.referencePoint =
    input.referencePoint === "" ? null : input.referencePoint;
  delete input.addressComplement;

  if (!input.addressNumber) {
    !input.addressNumber &&
      document.getElementById("error-number").classList.remove("hidden");
    !input.addressNumber &&
      document.getElementById("addressNumber").classList.add("border-red-600");
    document.getElementById("text").classList.remove("hidden");
    document.getElementById("loading").classList.add("hidden");
    return false;
  }

  const createResponse = await client.customer.createAddress(input);

  if (createResponse.errors) {
    showOverlay("Erro no formulário", createResponse.errors[0].message, true);
  } else {
    var id = createResponse.data.id;
    await selectAddress(id);
  }

  document.getElementById("text").classList.remove("hidden");
  document.getElementById("loading").classList.add("hidden");
};

/**
 * Formulario para editar endereço apartir de carrinho.
 * Apos endereço editado, função selectAddress é assionado.
 * Busca formulario com id 'addressUpdateCloseForm'
 *
 * @param {UpdateCustomerAddressInput} input
 */
const addressUpdateCloseSubmit = async (e) => {
  e.preventDefault();
  const input = convertFormInObject(e.target);

  if (!input.addressId) {
    if (!input.cep) {
      document.getElementById("cep-error-message")?.classList.remove("hidden");
      document
        .getElementById("zipcode")
        ?.classList.remove("border-secondary-300");
      document.getElementById("zipcode")?.classList.add("border-red-600");
      return;
    }

    document.getElementById("text")?.classList.add("hidden");
    document.getElementById("loading")?.classList.remove("hidden");
  }

  var id = input.addressId;
  input.referencePoint =
    input.referencePoint === "" ? null : input.referencePoint;
  delete input.addressId;

  const editResponse = await client.customer.editAddress(id, input);

  if (editResponse.errors) {
    showOverlay("Erro no formulário", editResponse.errors[0].message, true);
  } else {
    var id = editResponse.data.id;
    await selectAddress(id);
  }

  document.getElementById("text")?.classList.remove("hidden");
  document.getElementById("loading")?.classList.add("hidden");
};

/**
 * Criar Endereço.
 * Reendereiza formulario para parar criar endereço.
 *
 */
const createAddress = async () => {
  const token = client.cookie.get("sf_customer_access_token");
  const response = await client.customer.accessTokenDetails(token);
  if (response.data.type === "SIMPLE") {
    returnLoginConcluded = "ADDRESS_CREATE";
    showModalLogin("modal-autenticate");
  } else await renderCreateAddress();
};

/**
 * Editar Endereço.
 * Reendereiza formulario para parar editar endereço.
 *
 * @param {String} id - id de endereço
 */
const updateAddress = async (id) => {
  const token = client.cookie.get("sf_customer_access_token");
  const response = await client.customer.accessTokenDetails(token);
  if (response.data.type === "SIMPLE") {
    returnLoginConcluded = "ADDRESS_UPDATE";
    dataLoginConcluded = id;
    showModalLogin("modal-autenticate");
  } else await renderUpdateAddress(id);
};

/**
 * Endereço selecionado.
 * Associa endereço com carrinho.
 * Reendereiza opções de entrega.
 *
 * @param {String} id
 */
const selectAddress = async (id) => {
  showLoading("loading-address", true);
  const checkoutId = client.cookie.get("carrinho-id");
  const token = client.cookie.get("sf_customer_access_token");
  var result = await client.checkout.addressAssociate(id, checkoutId, token);

  if (result.errors) {
    showOverlay("Erro no formulário", result.errors[0].message, true);
    return;
  }

  let variables = {
    checkoutId: checkoutId,
    checkoutUuid: checkoutId,
    customerAccessToken: token,
  };

  let snippetsHtml = [
    {
      html: "wake_checkout_close_address_selected_snippet.html",
      id: "data_address",
    },
    {
      html: "wake_checkout_close_shipping_choice_snippet.html",
      id: "data_shipping",
    },
    { html: "wake_payment_methods_list.html", id: "data_payment" },
  ];

  const snippets = await client.snippet.multi(
    snippetsHtml.map(({ html, _ }) => html),
    "SnippetQueries/wake_checkout_close_address_selected.graphql",
    variables
  );

  snippetsHtml.map(({ html, id }) => {
    setInnerHtmlById(snippets.find((s) => s.name === html)?.result || "", id);
  });

  showLoading("loading-address", false);
};

const newSelectAddress = async (id) => {
  showLoading("address-loading", true);

  const checkoutId = client.cookie.get("carrinho-id");
  const token = client.cookie.get("sf_customer_access_token");
  await client.checkout.addressAssociate(id, checkoutId, token);

  window.location = `/checkout/shipping`;
};

const removeSelectAddress = async (id) => {
  const adressItem = document.querySelectorAll('.checkout-address-item')
  
  if (adressItem.length <= 1) {
    showOverlay(
      "Erro ao remover endereço",
      "Você deve ter pelo menos um endereço cadastrado para prosseguir com a compra.",
      true
    );
    return;
  }

  const token = client.cookie.get("sf_customer_access_token");

  await client.customer.removeAddress(id, token);
  window.location.reload()
};

/**
 * Envio selecionado.
 * Associa forma de envio com carrinho.
 * Reendereiza opções de pagamento.
 *
 * @param {String} id
 */
const selectShipping = async (id) => {
  renderFormPickUpStoreShipping(false);

  document.getElementsByClassName("wake-checkout-wrapper")[0].style.display =
    "block";

  const checkoutId = client.cookie.get("carrinho-id");
  const token = client.cookie.get("sf_customer_access_token");

  let result = await client.checkout.selectShippingQuote(id, checkoutId);

  if (result.errors) {
    showOverlay("Erro no formulário", result.errors[0].message, true);
    return;
  }

  let variables = {
    checkoutId: checkoutId,
    checkoutUuid: checkoutId,
    customerAccessToken: token,
  };

  let snippetsHtml = [
    {
      html: "wake_checkout_close_shipping_selected_snippet.html",
      id: "data_shipping",
    },
    { html: "wake_payment_methods_list.html", id: "data_payment" },
    { html: "wake_checkout_close_summary_snippet.html", id: "data_summary" },
    {
      html: "wake_checkout_close_checking_account_choice_snippet.html",
      id: "data_checking_account",
    },
  ];

  const snippets = await client.snippet.multi(
    snippetsHtml.map(({ html, _ }) => html),
    "SnippetQueries/wake_checkout_close_shipping_selected.graphql",
    variables
  );

  snippetsHtml.map(({ html, id }) => {
    setInnerHtmlById(snippets.find((s) => s.name === html)?.result || "", id);
  });
};

/**
 * Envio como retirada de entrega selecionado.
 * Associa forma de envio com carrinho.
 * Reendereiza opções de pagamento.
 *
 */
const selectPickUpStoreShipping = async (selectElement) => {
  var selectedValue = selectElement.value;
  selectShipping(selectedValue);
};

const selectPickUpStore = async (value) => {
  const checkoutId = client.cookie.get("carrinho-id");

  let result = await client.checkout.selectShippingQuote(value, checkoutId);

  if (result.errors) {
    showOverlay(
      "Erro ao escolher o método de envio",
      result.errors[0].message,
      true
    );
    return;
  }
};

const selectDeliveryStore = async (value) => {
  const checkoutId = client.cookie.get("carrinho-id");

  let result = await client.checkout.selectShippingQuote(value, checkoutId);

  window.dataLayer.push({
    event: "form_change",
    form_field: "forma-envio",
    form_value: result.data.selectedShipping.name,
  });

  window.dataLayer.push({
    event: "add_shipping_info",
    ecommerce: {
      currency: "BRL",
      shipping_tier: result.data.selectedShipping.name,
    },
  });

  if (result.errors)
    showOverlay(
      "Erro ao escolher o método de envio",
      result.errors[0].message,
      true
    );
  else window.location = "/checkout/payment";
};

/**
 * Conta corrente selecionado.
 * Associa/remove saldo de conta corrente com carrinho.
 *
 * @param {Boolean} checkingAccount - Opção para usar/remover saldo de conta corrente
 */
const selectCheckingAccount = async (checkingAccount) => {
  const token = client.cookie.get("sf_customer_access_token");
  const response = await client.customer.accessTokenDetails(token);

  if (response.data.type === "SIMPLE") {
    returnLoginConcluded = "CHECKING_ACCOUNT";
    dataLoginConcluded = checkingAccount;
    showModalLogin("modal-autenticate");
  } else {
    const checkoutId = client.cookie.get("carrinho-id");
    const response = await client.snippet.render(
      "wake_checkout_close_summary_snippet.html",
      "SnippetQueries/wake_checkout_close_checking_account_selected.graphql",
      {
        checkoutId: checkoutId,
        useBalance: checkingAccount,
        customerAccessToken: token,
      }
    );

    setInnerHtmlById(response, "data_summary");
  }
};

const CHECKOUT_CLOSE_COUPON_PRIORITY_LOCK_KEY = "checkout:coupon-priority-lock";

function checkoutCloseGetSessionStorage() {
  try {
    return window.sessionStorage;
  } catch (_) {
    return null;
  }
}

function checkoutCloseNormalizeCoupon(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function checkoutCloseWriteCouponLock(coupon, checkoutId, source = "manual") {
  const normalizedCoupon = checkoutCloseNormalizeCoupon(coupon);
  if (!normalizedCoupon) return;

  const storage = checkoutCloseGetSessionStorage();
  if (!storage) return;

  storage.setItem(
    CHECKOUT_CLOSE_COUPON_PRIORITY_LOCK_KEY,
    JSON.stringify({
      coupon: normalizedCoupon,
      checkoutId: checkoutId || null,
      source,
      updatedAt: Date.now(),
    })
  );
}

function checkoutCloseClearCouponLock() {
  const storage = checkoutCloseGetSessionStorage();
  if (!storage) return;
  storage.removeItem(CHECKOUT_CLOSE_COUPON_PRIORITY_LOCK_KEY);
}

function checkoutCloseRemoveCouponFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("coupon")) return;
  params.delete("coupon");
  const query = params.toString();
  const nextUrl = query
    ? `${window.location.pathname}?${query}`
    : window.location.pathname;
  window.history.replaceState({}, document.title, nextUrl);
}

const addCoupon = async (e) => {
  const couponInput = e
    .closest("#checkout_coupon_snippet").querySelector("#coupon");
  const coupon = checkoutCloseNormalizeCoupon(couponInput?.value);

  if (couponInput) {
    couponInput.value = coupon;
  }

  if (!coupon) {
    showOverlay(
      "Cupom invalido",
      "Digite um cupom valido antes de aplicar.",
      true
    );
    return;
  }

  const token = client.cookie.get("sf_customer_access_token");
  const checkoutId = client.cookie.get("carrinho-id");

  const couponResponse = await client.checkout.addCoupon(coupon);

  if (couponResponse?.errors?.length > 0) {
    showOverlay(
      "Ocorreu um erro!",
      "Seu cupom pode estar inválido ou inexistente. Por favor, tente novamente.",
      true
    );
  } else {
    showOverlay("Cupom Adicionado", "Cupom adicionado com sucesso!", false);
    checkoutCloseWriteCouponLock(coupon, checkoutId, "manual");
    if (typeof checkoutShareWriteCouponLock === "function") {
      checkoutShareWriteCouponLock(coupon, checkoutId, "manual");
    }

    const variables = {
      checkoutId: checkoutId,
      coupon: coupon,
      customerAccessToken: token,
    };

    const addCouponResp = await client.snippet.render(
      "checkout_coupon_snippet.html",
      "SnippetQueries/checkout.graphql",
      variables
    );

    // Atualiza o componente de cupom padrão
    setAllInnerHtmlById(addCouponResp || "", "checkout_coupon_snippet");

    // Atualiza o componente de cupom mobile
    const mobileContainer = document.getElementById(
      "checkout_coupon_snippet_mobile"
    );
    if (mobileContainer) {
      mobileContainer.innerHTML = addCouponResp || "";
    }
  }
  updateCheckout();
  /*
  if (document.querySelector(".payment-right-menu")) {
    updateRightMenuPayment();
  } else {
  }*/
};

const removeCoupon = async () => {
   const coupon = checkoutCloseNormalizeCoupon(
    document.getElementById("coupon")?.value
  );
  const token = client.cookie.get("sf_customer_access_token");
  const checkoutId = client.cookie.get("carrinho-id");

  await client.checkout.removeCoupon();
  showOverlay("Cupom Removido", "Cupom removido com sucesso!", false);
  checkoutCloseClearCouponLock();
  if (typeof checkoutShareClearCouponLock === "function") {
    checkoutShareClearCouponLock();
  }
  checkoutCloseRemoveCouponFromUrl();

  const variables = {
    checkoutId: checkoutId,
    coupon: coupon,
    customerAccessToken: token,
  };

  let addCouponResp = await client.snippet.render(
    "checkout_coupon_snippet.html",
    "SnippetQueries/checkout.graphql",
    variables
  );

  // Atualiza o componente de cupom padrão
  setAllInnerHtmlById(addCouponResp || "", "checkout_coupon_snippet");

  // Atualiza o componente de cupom mobile
  const mobileContainer = document.getElementById(
    "checkout_coupon_snippet_mobile"
  );
  if (mobileContainer) {
    mobileContainer.innerHTML = addCouponResp || "";
  }

  updateCheckout();
  /*
    if (document.querySelector(".payment-right-menu")) {
      updateRightMenuPayment();
    } else {
    }*/
};

/**
 * Autenticação padrão
 * Busca formulario com id 'authenticateForm'
 *
 * @param {form} login
 * @param {form} senha
 */
const authenticateCompletSubmit = async (e) => {
  e.preventDefault();

  const input = convertFormInObject(e.target);
  const response = await client.customer.authenticate(
    input.email,
    input.password
  );

  if (response?.data?.token) {
    closeModalLogin("modal-autenticate");
    if (returnLoginConcluded == "ADDRESS_CREATE") {
      await renderCreateAddress();
    } else if (returnLoginConcluded == "ADDRESS_UPDATE") {
      await renderUpdateAddress(dataLoginConcluded);
    } else if (returnLoginConcluded == "CHECKING_ACCOUNT") {
      await selectCheckingAccount(dataLoginConcluded);
    }
  } else
    showOverlay(
      "Erro ao autenticar usuário",
      response.errors[0]?.message,
      true
    );
};

// Conclusão pedido
// Alinhado com o closeCheckout do wake_checkout_close.js. As diferencas que este
// fork tinha e que foram trazidas de volta:
//   - montagem do payload por wakeGetPaymentDataFromContainers (nao getPaymentData,
//     que esta @deprecated: serializa todo elemento com name, sem filtrar tipo nem disabled);
//   - catch de verdade -- antes so havia try/finally, entao erro nao tratado deixava
//     o cliente sem resposta nenhuma;
//   - verifyCheckoutWasClosed: o pedido pode ter sido criado mesmo com falha no front.
//     Sem essa checagem o cliente ve erro num pedido que de fato entrou;
//   - checkoutData.newCheckout: pagamento recusado recria o checkout, o id antigo morre.
const verifyCheckoutWasClosed = async (originalCheckoutId) => {
  try {
    const query = `
      query CheckoutLite($checkoutId: Uuid!) {
        checkout: checkoutLite(checkoutId: $checkoutId) {
          completed
        }
      }
    `;
    const response = await client.query(query, { checkoutId: originalCheckoutId });
    if (response?.errors?.length > 0) return false;
    return response?.data?.checkout?.completed === true;
  } catch (_) {
    return false;
  }
};

const goToConfirmation = (checkoutId) => {
  window.location = `${checkout_pages.checkout.confirmation}?checkoutId=${checkoutId}`;
};

const closeCheckout = async () => {
  const loading = document.getElementById("finish-loading");
  const button = document.querySelector("#finish-order-button");

  loading.classList.remove("hidden");
  loading.classList.add("flex");
  button.disabled = true;

  let checkoutId;
  let checkoutCompleteStarted = false;

  try {
    const validateResult = await Fbits.Gateway.ExecuteValidateCallbacks();
    const allValid = validateResult.every((item) => item === true);

    if (!allValid) {
      // o proprio gateway ja pode ter mostrado o erro (alert do cartao.js)
      const jaNotificado =
        typeof Fbits.Gateway.IsValidationErrorAlreadyNotified === "function" &&
        Fbits.Gateway.IsValidationErrorAlreadyNotified();

      if (!jaNotificado) {
        showOverlay(
          "Erro ao validar pagamento",
          "Ocorreu um erro ao validar o pagamento, confira os dados de pagamento e tente novamente!",
          true
        );
      }
      return;
    }

    await Fbits.Gateway.ExecutePayCallbacks();

    const token = client.cookie.get("sf_customer_access_token");
    checkoutId = client.cookie.get("carrinho-id");

    const paymentContainers = document.querySelectorAll("[data-payment-transaction-id]");
    const paymentData = wakeGetPaymentDataFromContainers(paymentContainers);

    checkoutCompleteStarted = true;
    const checkoutData = await client.checkout.complete(
      checkoutId,
      "",
      token,
      paymentData
    );

    if (checkoutData?.newCheckout) {
      // Pagamento recusado pelo emissor: a Wake recria o checkout e o id antigo morre,
      // entao o reload e obrigatorio. A Wake mostra o wake_checkout_payment_rejected_modal
      // depois do reload; nosso tema nao tem esse componente, entao avisamos antes.
      showOverlay(
        "Pagamento não autorizado",
        "O pagamento foi recusado. Confira os dados do cartão ou tente outra forma de pagamento.",
        true
      );
      setTimeout(() => window.location.reload(), 4000);
      return;
    }

    if (checkoutData?.completeResponse?.errors) {
      if (await verifyCheckoutWasClosed(checkoutId)) {
        goToConfirmation(checkoutId);
        return;
      }
      showOverlay(
        "Erro ao finalizar o pedido",
        checkoutData.completeResponse.errors[0].message,
        true
      );
      return;
    }

    goToConfirmation(checkoutId);
  } catch (err) {
    console.error("closeCheckout:", err);

    if (checkoutCompleteStarted && checkoutId && (await verifyCheckoutWasClosed(checkoutId))) {
      goToConfirmation(checkoutId);
      return;
    }

    showOverlay(
      "Erro ao finalizar o pedido",
      "Não foi possível concluir o pedido. Confira os dados de pagamento e tente novamente.",
      true
    );
  } finally {
    loading.classList.add("hidden");
    loading.classList.remove("flex");
    button.disabled = false;
  }
};

async function renderUser() {
  const checkoutId = client.cookie.get("carrinho-id");
  const token = client.cookie.get("sf_customer_access_token");

  await client.checkout.customerAssociate(checkoutId, token);

  const response = await client.snippet.render(
    "wake_checkout_close_user_information_snippet.html",
    "SnippetQueries/wake_checkout_close_user_information.graphql",
    {
      customerAccessToken: token,
      hasCustomerAccessToken: true,
    }
  );

  setInnerHtmlById(response, "data_user");
}

async function renderCreateAddress() {
  var registration = document.getElementById("data_address_registration");
  registration.style.display = "block";

  var information = document.getElementById("data_address_information");
  information.style.display = "none";
}

async function renderFormWithCepAddress() {
  try {
    const variables = {
      cep: document.getElementById("zipcode").value,
    };
    let AddressResponse = await client.snippet.render(
      "wake_checkout_address_snippet.html",
      "SnippetQueries/wake_account_address.graphql",
      variables
    );

    setInnerHtmlById(AddressResponse, "resultGetRenderFormAddress");
    //document.getElementById('InputCep').classList.add('hidden');
  } catch (error) {
    console.log(error);
  }
}

async function renderOptionsAddress() {
  const token = client.cookie.get("sf_customer_access_token");
  const response = await client.snippet.render(
    "wake_checkout_close_address_information_snippet.html",
    "SnippetQueries/wake_checkout_close_address_information.graphql",
    {
      customerAccessToken: token,
      hasCustomerAccessToken: true,
    }
  );
  setInnerHtmlById(response, "data_address");
}

async function renderUpdateAddress(addressId) {
  const response = await client.snippet.render(
    "wake_checkout_close_address_update_snippet.html",
    "SnippetQueries/wake_account_edit_address.graphql",
    {
      customerAccessToken: await client.cookie.get("sf_customer_access_token"),
      hasCustomerAccessToken: true,
      addressId: addressId,
    }
  );

  setInnerHtmlById(response, "data_address");
}

async function renderFormPickUpStoreShipping(pickUpStore) {
  const checkoutId = client.cookie.get("carrinho-id");

  if (pickUpStore) {
    const response = await client.snippet.render(
      "checkout_pickup_store.html",
      "SnippetQueries/checkout_close_shipping_choice.graphql",
      {
        checkoutId: checkoutId,
      }
    );
    document.getElementsByClassName("wake-checkout-wrapper")[0].style.display =
      "none";

    setInnerHtmlById(response, "data-render-pickup");

    const respRight = await client.snippet.render(
      "checkout_right_menu_snippet.html",
      "SnippetQueries/wake_checkout_close_summary.graphql",
      {
        checkoutId: checkoutId,
      }
    );

    setInnerHtmlById(respRight, "data-render-right-menu");
  }
}

async function renderOptionsShipping() {
  window.location = "/checkout/shipping";
}

async function renderOptionsPayment() {
  const checkoutId = client.cookie.get("carrinho-id");
  const token = client.cookie.get("sf_customer_access_token");
  const variables = {
    checkoutId: checkoutId,
    checkoutUuid: checkoutId,
    customerAccessToken: token,
  };

  const response = await client.snippet.render(
    "payment_methods_list.html",
    "SnippetQueries/checkout_close_payment_choice_snippet.graphql",
    variables
  );

  setInnerHtmlById(response, "data_payment");

  const respRight = await client.snippet.render(
    "checkout_right_menu_snippet.html",
    "SnippetQueries/wake_checkout_close_summary.graphql",
    {
      checkoutId: checkoutId,
    }
  );

  setInnerHtmlById(respRight, "data-render-right-menu");
}

const showModalLogin = async (component) => {
  showModal(component);
};

const closeModalLogin = (component) => {
  closeModal(component);
};

const showLoading = (element, action) => {
  if (document.getElementById(element)) {
    if (action) {
      document.getElementById(element).classList.remove("hidden");
      document.getElementById(element).classList.add("flex");
    } else {
      document.getElementById(element).classList.add("hidden");
      document.getElementById(element).classList.remove("flex");
    }
  }
};

function goBack(fallback = "/") {
  if (
    document.referrer &&
    new URL(document.referrer).origin === window.location.origin
  ) {
    window.history.back();
  } else {
    window.location.href = fallback;
  }
}
