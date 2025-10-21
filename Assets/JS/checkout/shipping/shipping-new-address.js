class ShippingNewAddress {
  constructor({ form }, data, isEdit = false) {
    this.form = form;
    this.data = data || {};
    this.isEdit = isEdit;
    // Bind das funções
    this._checkDependencies = this._checkDependencies.bind(this);
    this._getCheckoutId = this._getCheckoutId.bind(this);
    this._authenticatedUser = this._authenticatedUser.bind(this);
    this._getCustomerAccessToken = this._getCustomerAccessToken.bind(this);
    this.createNewAddress = this.createNewAddress.bind(this);
    this.validateRequired = this.validateRequired.bind(this);
    this.validatePostalCode = this.validatePostalCode.bind(this);
    this.validateNumber = this.validateNumber.bind(this);
    this.validateComplement = this.validateComplement.bind(this);
    this.validateReferencePoint = this.validateReferencePoint.bind(this);
    this.validateReceiverName = this.validateReceiverName.bind(this);
    this.dispatchFormWarning = this.dispatchFormWarning.bind(this);
    this.dispatchInputError = this.dispatchInputError.bind(this);
    this.updateInputRequirement = this.updateInputRequirement.bind(this);
    this.fetchAddressByCEP = this.fetchAddressByCEP.bind(this);
    this.clearAddressFields = this.clearAddressFields.bind(this);
    this.clearAllFields = this.clearAllFields.bind(this);
    this.validateForm = this.validateForm.bind(this);
    this.handleEvents = this.handleEvents.bind(this);
    this.fillFormWithData = this.fillFormWithData.bind(this);
    this.init();
  }

  async init() {
    if (!this._checkDependencies() || !(await this._authenticatedUser()))
      return;
    this.handleEvents();

    Object.keys(this.form.inputs).forEach((key) => {
      const {
        required: required = false,
        formGroup,
        layout: layout = false,
      } = this.form.inputs[key];

      if (formGroup !== "hidden-inputs" && !layout) {
        this.updateInputRequirement(key, required);
      }
    });

    this.fillFormWithData();
  }
  fillFormWithData() {
    if (!this.data || typeof this.data !== "object") return;

    const fieldMapping = {
      cep: "postalCode",
      country: "country",
      state: "state",
      city: "city",
      neighborhood: "neighborhood",
      address: "street",
      address_number: "number",
      address_details: "complement",
      reference_point: "referencePoint",
      name: "receiverName",
    };

    Object.keys(fieldMapping).forEach((key) => {
      const formKey = fieldMapping[key];
      if (this.data[key] === undefined || !this.form.inputs[formKey]?.inputElement) return;
  
      this.form.inputs[formKey].inputElement.value = this.data[key];
  
      const inputEvent = new Event('input', { bubbles: true });
      const changeEvent = new Event('change', { bubbles: true });
      
      this.form.inputs[formKey].inputElement.dispatchEvent(inputEvent);
      this.form.inputs[formKey].inputElement.dispatchEvent(changeEvent);

      if (formKey === 'postalCode') {
        const blurEvent = new Event('blur', { bubbles: true });
        this.form.inputs[formKey].inputElement.dispatchEvent(blurEvent);
      }
    });
  }
  _checkDependencies() {
    if (typeof client?.query !== "function") {
      console.error('Client "query" not found');
      return false;
    }

    return true;
  }
  _getCheckoutId() {
    return (
      document.querySelector('input[name="checkout_id"]').value ??
      "checkout-id-not-found"
    );
  }
  async _authenticatedUser() {
    const result = await client.customer.accessTokenDetails(
      this._getCustomerAccessToken()
    );

    const isAuthenticated = result?.data?.type === "AUTHENTICATED";

    if (!isAuthenticated) {
      window.open(
        `/login/authenticate?returnUrl=${window.location.href}`,
        "_self"
      );
    }

    return isAuthenticated;
  }
  _getCustomerAccessToken() {
    const cookieName = "sf_customer_access_token";
    const cookies = document.cookie;
    const match = cookies.match(new RegExp(`(?:^|; )${cookieName}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : "token-not-found";
  }
  async checkoutAddressAssociate(addressId) {
    const checkoutId = this._getCheckoutId();
    const customerAccessToken = this._getCustomerAccessToken();

    try {
      const result = await client.checkout.addressAssociate(
        addressId,
        checkoutId,
        customerAccessToken
      );

      if (!result?.data?.checkoutId?.length) {
        throw new Error("Erro ao associar endereço ao checkout");
      }

      return true;
    } catch (error) {
      console.error("checkoutAddressAssociate", error);
      return false;
    }
  }
  /**
   * Recebe o objeto com os dados já mapeados para as props de address e realiza a mutation.
   */
  async createNewAddress(addressData) {
    // Exemplo de mutation utilizando variáveis
    const mutation = `
      mutation CreateAddress($address: CreateCustomerAddressInput!, $customerAccessToken: String!) {
        customerAddressCreate(
          address: $address,
          customerAccessToken: $customerAccessToken
        ) {
          addressDetails
          addressNumber
          cep
          city
          country
          email
          id
          receiverName
          name
          phone
          state
          street
          referencePoint
        }
      }
    `;

    const customerAccessToken = this._getCustomerAccessToken();

    const variables = {
      address: addressData,
      customerAccessToken,
    };

      try {
        const result = await client.query(mutation, variables);
        const newAddressId = result?.data?.customerAddressCreate?.id ?? null;

        if (!newAddressId) {
          const apiError = result?.errors?.[0]?.message || "Erro ao criar endereço, tente novamente mais tarde";
          this.dispatchFormWarning(apiError);
          throw new Error(apiError);
        }

      if (!(await this.checkoutAddressAssociate(newAddressId))) {
        this.dispatchFormWarning(
          "Erro ao associar endereço ao checkout, tente novamente mais tarde"
        );
        throw new Error("Erro ao associar endereço ao checkout");
      }

      window.location = '/checkout/shipping/';
    } catch (error) {
      console.error("createNewAddress error:", error);
    }
  }

  async editAddress (addressData) {
    const editResponse = await client.customer.editAddress(this.data.id, addressData);
    if (editResponse.errors) {
      showOverlay("Erro no formulário", editResponse.errors[0].message, true);
    } else {
      var id = editResponse.data.id;
      await newSelectAddress(id);
    }
  }

  // Validação genérica para campos obrigatórios
  validateRequired({ value, customMessage }) {
    if (!value || !value.trim().length) {
      return customMessage;
    }
    return null;
  }

  // Validação do CEP: considera válido se tiver exatamente 8 dígitos (ignorando quaisquer caracteres não numéricos)
  // Verifica se o padrão do CEP é válido (8 dígitos)
  isValidCepPattern(cepDigits) {
    return cepDigits.length === 8;
  }

  validatePostalCode({
    postalCode,
    required: required = false,
    dispatchError: dispatchError = false,
  }) {
    // Se o campo estiver vazio e não for obrigatório, considera válido
    if (!postalCode.trim() && !required) {
      if (dispatchError) {
        this.dispatchInputError({
          inputKey: "postalCode",
          inputErrorMessage: null,
        });
      }
      return true;
    }
    
    const requiredError = required
      ? this.validateRequired({
          value: postalCode,
          customMessage: "CEP é obrigatório",
        })
      : null;
    if (dispatchError && requiredError) {
      this.dispatchInputError({
        inputKey: "postalCode",
        inputErrorMessage: requiredError,
      });
      return false;
    }
    // Remove tudo que não seja dígito
    const digits = postalCode.replace(/\D/g, "");
    if (digits.length !== 8) {
      if (dispatchError) {
        this.dispatchInputError({
          inputKey: "postalCode",
          inputErrorMessage: "CEP inválido",
        });
      }
      return false;
    }

    // CEP válido
    if (dispatchError) {
      this.dispatchInputError({
        inputKey: "postalCode",
        inputErrorMessage: null,
      });
    }
    return true;
  }

  validateNumber({
    number,
    required: required = false,
    dispatchError: dispatchError = false,
  }) {
    // Se o campo estiver vazio e não for obrigatório, considera válido
    if (!number.trim() && !required) {
      if (dispatchError) {
        this.dispatchInputError({
          inputKey: "number",
          inputErrorMessage: null,
        });
      }
      return true;
    }
    
    const requiredError = required
      ? this.validateRequired({
          value: number,
          customMessage: "Campo obrigatório!",
        })
      : null;
    if (requiredError) {
      if (dispatchError) {
        this.dispatchInputError({
          inputKey: "number",
          inputErrorMessage: requiredError,
        });
      }
      return false;
    }

    if (dispatchError) {
      this.dispatchInputError({ inputKey: "number", inputErrorMessage: null });
    }
    return true;
  }

  validateComplement({
    complement,
    required: required = false,
    dispatchError: dispatchError = false,
  }) {
    // Se o campo estiver vazio e não for obrigatório, considera válido
    if (!complement.trim() && !required) {
      if (dispatchError) {
        this.dispatchInputError({
          inputKey: "complement",
          inputErrorMessage: null,
        });
      }
      return true;
    }
    
    const error = required
      ? this.validateRequired({
          value: complement,
          customMessage: "Campo obrigatório!",
        })
      : null;
    if (dispatchError) {
      this.dispatchInputError({
        inputKey: "complement",
        inputErrorMessage: error,
      });
    }
    return !error;
  }
  validateReferencePoint({
    referencePoint,
    required: required = false,
    dispatchError: dispatchError = false,
  }) {
    const error = required
      ? this.validateRequired({
          value: referencePoint,
          customMessage: "Campo obrigatório!",
        })
      : null;
    if (dispatchError) {
      this.dispatchInputError({
        inputKey: "referencePoint",
        inputErrorMessage: error,
      });
    }
    return !error;
  }

  validateReceiverName({
    receiverName,
    required: required = false,
    dispatchError: dispatchError = false,
  }) {
    // Se o campo estiver vazio e não for obrigatório, considera válido
    if (!receiverName.trim() && !required) {
      if (dispatchError) {
        this.dispatchInputError({
          inputKey: "receiverName",
          inputErrorMessage: null,
        });
      }
      return true;
    }
    
    const error = required
      ? this.validateRequired({
          value: receiverName,
          customMessage: "Campo obrigatório!",
        })
      : null;
    if (dispatchError) {
      this.dispatchInputError({
        inputKey: "receiverName",
        inputErrorMessage: error,
      });
    }
    return !error;
  }
  dispatchFormWarning(formErrorMessage) {
    const warningContainerElement = document.querySelector(
      ".checkout-shipping-new-address--custom-warning-container"
    );
    const warningTextElement = document.querySelector(
      ".checkout-shipping-new-address--custom-warning"
    );

    if (!warningContainerElement || !warningTextElement) {
      console.error("Warning container not found");
      return;
    }

    if (formErrorMessage === null) {
      warningContainerElement.setAttribute("style", "display: none");
      warningTextElement.textContent = "";
      return;
    }

    warningContainerElement.setAttribute("style", "display: flex");
    warningTextElement.textContent = formErrorMessage;
  }
  dispatchInputError({ inputKey, inputErrorMessage }) {
    this.form.inputs[inputKey].inputError = inputErrorMessage;

    const { formGroup, inputElement, layout } = {
      formGroup: null,
      inputElement: null,
      layout: false,
      ...this.form.inputs[inputKey],
    };

    if (!formGroup || layout) {
      return;
    }

    if (!inputElement) {
      console.error(`Element not found for ${inputKey}`);
      return;
    }

    const spanErrorElement = document.querySelector(
      `.checkout-shipping-new-address--form-group[data-group="${formGroup}"] span.checkout-shipping-new-address--form-error`
    );

    if (!spanErrorElement) {
      console.error(`Error: span error element not found for ${inputKey}`);
      return;
    }

    if (inputErrorMessage) {
      spanErrorElement.textContent = inputErrorMessage;
      if (!spanErrorElement.classList.contains("is--active")) {
        spanErrorElement.classList.add("is--active");
      }
      return;
    }

    spanErrorElement.textContent = "";
    if (spanErrorElement.classList.contains("is--active")) {
      spanErrorElement.classList.remove("is--active");
    }
  }

  updateInputRequirement(inputKey, requiredValue) {
    const inputConfig = this.form.inputs[inputKey];
    if (inputConfig && inputConfig.inputElement) {
      const inputName = inputConfig.inputElement.getAttribute("name");
      const inputLabelElement = document.querySelector(
        `label[for="${inputName}"]`
      );

      inputConfig.inputElement.required = requiredValue;
      if (inputLabelElement) {
        if (requiredValue) {
          if (inputLabelElement.classList.contains("not--required")) {
            inputLabelElement.classList.remove("not--required");
          }
          if (!inputLabelElement.classList.contains("is--required")) {
            inputLabelElement.classList.add("is--required");
          }
        } else {
          if (inputLabelElement.classList.contains("is--required")) {
            inputLabelElement.classList.remove("is--required");
          }
          if (!inputLabelElement.classList.contains("not--required")) {
            inputLabelElement.classList.add("not--required");
          }
        }
      }
    }

    if (!requiredValue && inputConfig.inputElement.value.trim().length === 0) {
      this.dispatchInputError({ inputKey, inputErrorMessage: null });
    }
  }

  toggleManualAddressFields(show) {
    const manualFieldsGroup = document.querySelector('[data-group="manual-address-fields"]');
    
    if (!manualFieldsGroup) return;
    
    if (show) {
      manualFieldsGroup.style.display = 'block';
      ['state', 'city', 'neighborhood', 'street'].forEach(key => {
        if (this.form.inputs[key]) {
          this.form.inputs[key].manualMode = true;
        }
      });
    } else {
      manualFieldsGroup.style.display = 'none';
      ['state', 'city', 'neighborhood', 'street'].forEach(key => {
        if (this.form.inputs[key]) {
          this.form.inputs[key].manualMode = false;
        }
      });
    }
  }

  // Busca os dados de endereço via ViaCEP e preenche os inputs correspondentes.
  async fetchAddressByCEP(postalCode) {
    const digits = postalCode.replace(/\D/g, "");
    const postalGroup = document.querySelector('[data-group="postalCode"]');
    
    // Limpa os campos e prepara para nova consulta
    this.clearAddressFields();
    
    // Esconde a informação de CEP
    document.querySelector(".postal-code-shipping-info .postal-code-shipping-info--text").textContent = "";
    document.querySelector(".postal-code-shipping-info").style.display = "none";
    
    // Se o CEP estiver vazio, não faz nada
    if (digits.length === 0) {
      this.toggleManualAddressFields(false);
      return;
    }
    
    // Verifica se o CEP tem 8 dígitos antes de prosseguir
    if (digits.length !== 8) {
      // CEP incompleto, não mostra os campos manuais durante a digitação
      // Apenas quando o usuário terminar de digitar (evento blur) ou tentar consultar
      return;
    }
    
    // Mostra o indicador de carregamento
    if (postalGroup) {
      postalGroup.classList.add("is--loading");
    }
    
    // Define um timeout para a requisição
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Tempo esgotado')), 2000);
    });
    
    try {
      // Usa Promise.race para competir entre a requisição e o timeout
      const fetchPromise = fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      const data = await response.json();
      
      if (
        data.erro ||
        !data.uf?.trim().length ||
        !data.localidade?.trim().length ||
        !data.bairro?.trim().length
      ) {
        throw new Error("CEP indisponível");
      }

      // street, neighborhood, city, state, postalCode
      let postalCodeShippingInfo = "";

      // Preenche os inputs
      if (this.form.inputs.street && this.form.inputs.street.inputElement) {
        this.form.inputs.street.inputElement.value = data.logradouro || "";
        postalCodeShippingInfo += data.logradouro || "";
        postalCodeShippingInfo += postalCodeShippingInfo.length ? ", " : "";
      }
      if (
        this.form.inputs.neighborhood &&
        this.form.inputs.neighborhood.inputElement
      ) {
        this.form.inputs.neighborhood.inputElement.value = data.bairro || "";
        postalCodeShippingInfo += data.bairro || "";
        postalCodeShippingInfo += postalCodeShippingInfo.length ? " - " : "";
      }
      if (this.form.inputs.city && this.form.inputs.city.inputElement) {
        this.form.inputs.city.inputElement.value = data.localidade || "";
        postalCodeShippingInfo += data.localidade || "";
        postalCodeShippingInfo += postalCodeShippingInfo.length ? " - " : "";
      }
      if (this.form.inputs.state && this.form.inputs.state.inputElement) {
        // Para o select de estado, seleciona a opção correta
        const stateSelect = this.form.inputs.state.inputElement;
        const uf = data.uf || "";
        
        // Encontra a opção com o valor correspondente ao UF
        for (let i = 0; i < stateSelect.options.length; i++) {
          if (stateSelect.options[i].value === uf) {
            stateSelect.selectedIndex = i;
            break;
          }
        }
        
        postalCodeShippingInfo += data.uf || "";
        postalCodeShippingInfo += postalCodeShippingInfo.length ? " - " : "";
      }
      if (this.form.inputs.country && this.form.inputs.country.inputElement) {
        // ViaCEP não retorna país; assumimos "BR"
        this.form.inputs.country.inputElement.value = "BR";
      }

      postalCodeShippingInfo += `${postalCode}`;

      document.querySelector(
        ".postal-code-shipping-info .postal-code-shipping-info--text"
      ).textContent = postalCodeShippingInfo;

      document.querySelector(".postal-code-shipping-info").style.display =
        "flex";
        
      // Esconde os campos manuais
      this.toggleManualAddressFields(false);

      // Remove erro se houver
      this.dispatchInputError({
        inputKey: "postalCode",
        inputErrorMessage: null,
      });
    } catch (error) {
      // Mostra os campos manuais para preenchimento
      this.toggleManualAddressFields(true);
      
      // Remove erro do CEP para permitir preenchimento manual
      this.dispatchInputError({
        inputKey: "postalCode",
        inputErrorMessage: null,
      });
    } finally {
      if (postalGroup) {
        postalGroup.classList.remove("is--loading");
      }
    }
  }

  // Limpa os inputs de state, city, neighborhood, street e country
  clearAddressFields() {
    ["state", "city", "neighborhood", "street", "country"].forEach((key) => {
      if (this.form.inputs[key] && this.form.inputs[key].inputElement) {
        this.form.inputs[key].inputElement.value = "";
      }
    });
  }
  clearAllFields() {
    for (const [_key, value] of Object.entries(this.form.inputs)) {
      if (value.inputElement) {
        value.inputElement.value = "";
      }
    }
    this.toggleManualAddressFields(false);
  }
  async fetchCustomerAddresses() {
    const query = `
      query ValidateExistingAddress($customerAccessToken: String) {
        customer(customerAccessToken: $customerAccessToken) {
          addresses {
            cep
            addressNumber
            state
            city
            neighborhood
            country
            address
            addressDetails
            referencePoint
            receiverName
          }
        }
      }
    `;

    const customerAccessToken = this._getCustomerAccessToken();

    const variables = {
      customerAccessToken,
    };

    try {
      const result = await client.query(query, variables);

      const addresses = result?.data?.customer?.addresses || [];

      return addresses;
    } catch (error) {
      console.error("Erro ao consultar endereços do usuário", error);
      return [];
    }
  }

  async validateExistingAddress(postalCode) {
    const addresses = await this.fetchCustomerAddresses();
    const existingAddress = addresses.find(
      (address) => address.cep === postalCode
    );

    return !!existingAddress;
  }
  /**
   * Valida todos os campos do formulário.
   * Retorna true se todos os campos obrigatórios estiverem válidos.
   */
  validateForm({ dispatchErrors: dispatchErrors = false }) {
    let isValid = true;
    const inputs = this.form.inputs;
    
    // Verifica se os campos manuais estão visíveis
    const manualFieldsVisible = document.querySelector('[data-group="manual-address-fields"]').style.display !== 'none';

    if (!manualFieldsVisible) {
      if (
        !this.validatePostalCode({
          postalCode: inputs.postalCode.inputElement.value,
          required: inputs.postalCode.required,
        })
      ) {
        isValid = false;
      }
    } else {
      const cepDigits = inputs.postalCode.inputElement.value.replace(/\D/g, "");
      if (cepDigits.length > 0 && cepDigits.length < 8) {
        if (dispatchErrors) {
          this.dispatchInputError({
            inputKey: "postalCode",
            inputErrorMessage: "CEP deve ter 8 dígitos",
          });
        }
        isValid = false;
      } else {
        this.dispatchInputError({
          inputKey: "postalCode",
          inputErrorMessage: null,
        });
      }
    }

    // Validação do número (ou se o checkbox "withoutNumber" estiver ativo, não valida)
    if (!inputs.number.inputElement.disabled) {
      if (
        !this.validateNumber({
          number: inputs.number.inputElement.value,
          required: inputs.number.required,
        })
      ) {
        isValid = false;
      }
    }

    // Validação de campos de endereço (estado, cidade, bairro e país)
    // Se os campos manuais estiverem visíveis, valida esses campos
    if (manualFieldsVisible) {
      // Validação do estado
      if (!inputs.state.inputElement.value.trim().length) {
        if (dispatchErrors) {
          this.dispatchInputError({
            inputKey: "state",
            inputErrorMessage: "Estado é obrigatório",
          });
        }
        isValid = false;
      } else {
        this.dispatchInputError({
          inputKey: "state",
          inputErrorMessage: null,
        });
      }

      // Validação da cidade
      if (!inputs.city.inputElement.value.trim().length) {
        if (dispatchErrors) {
          this.dispatchInputError({
            inputKey: "city",
            inputErrorMessage: "Cidade é obrigatória",
          });
        }
        isValid = false;
      } else {
        this.dispatchInputError({
          inputKey: "city",
          inputErrorMessage: null,
        });
      }

      // Validação do bairro
      if (!inputs.neighborhood.inputElement.value.trim().length) {
        if (dispatchErrors) {
          this.dispatchInputError({
            inputKey: "neighborhood",
            inputErrorMessage: "Bairro é obrigatório",
          });
        }
        isValid = false;
      } else {
        this.dispatchInputError({
          inputKey: "neighborhood",
          inputErrorMessage: null,
        });
      }
    } else {
      // Se os campos manuais não estiverem visíveis, verifica se os campos foram preenchidos pelo CEP
      if (!inputs.state.inputElement.value.trim().length ||
          !inputs.city.inputElement.value.trim().length ||
          !inputs.neighborhood.inputElement.value.trim().length ||
          !inputs.country.inputElement.value.trim().length) {
        isValid = false;
      }
    }

    // Validação dos demais campos
    if (
      !this.validateReferencePoint({
        referencePoint: inputs.referencePoint.inputElement.value,
        required: inputs.referencePoint.required,
      })
    ) {
      isValid = false;
    }
    
    if (
      !this.validateReceiverName({
        receiverName: inputs.receiverName.inputElement.value,
        required: inputs.receiverName.required,
      })
    ) {
      isValid = false;
    }

    // Validação do complemento
    if (
      !this.validateComplement({
        complement: inputs.complement.inputElement.value,
        required: inputs.complement.required,
      })
    ) {
      isValid = false;
    }

    if (!isValid) {
      document
        .querySelector(".checkout-shipping-new-address--form-submit-button")
        .setAttribute("disabled", "disabled");
    } else {
      document
        .querySelector(".checkout-shipping-new-address--form-submit-button")
        .removeAttribute("disabled");
    }

    return isValid;
  }

  handleEvents() {
    // Listener para submissão do formulário
    this.form.formElement.addEventListener("submit", async (event) => {
      event.preventDefault();

      this.dispatchFormWarning(null);
      // Revalida todos os campos
      if (!this.validateForm({ dispatchErrors: true })) {
        return;
      }

      // Captura os dados do formulário (as keys correspondem ao name dos inputs, que são iguais aos ids)
      const formData = new FormData(this.form.formElement);
      const dataObj = Object.fromEntries(formData.entries());

      // Mapeamento dos nomes dos inputs para as props de address da mutation
      const addressMapping = {
        "shipping-new-address--postalCode": "cep",
        "shipping-new-address--number": "addressNumber",
        "shipping-new-address--state": "state",
        "shipping-new-address--city": "city",
        "shipping-new-address--neighborhood": "neighborhood",
        "shipping-new-address--street": "street",
        "shipping-new-address--country": "country",
        "shipping-new-address--complement": "addressDetails",
        "shipping-new-address--referencePoint": "referencePoint",
        "shipping-new-address--receiverName": "receiverName",
        "shipping-new-address--receiverName": "name",
      };

      const addressData = {};
      Object.keys(addressMapping).forEach((key) => {
        if (key === "shipping-new-address--number") {
          addressData["addressNumber"] = dataObj[key] || "SN";
        } else if (dataObj[key]?.trim()?.length !== 0) {
          addressData[addressMapping[key]] = dataObj[key] || "";
        }
      });

      if (addressData.cep) {
        addressData.cep = String(addressData.cep).replace(/\D/g, "");
      }

      const manualFieldsVisible = (document.querySelector('[data-group="manual-address-fields"]').style.display !== 'none');
      if (manualFieldsVisible) {
        const cepDigits = (addressData.cep || "");
        if (cepDigits.length !== 8) {
          delete addressData.cep;
        }
      }
      
      if (!addressData.country) {
        addressData.country = "BR";
      }

      if (await this.validateExistingAddress(addressData.cep) && !this.isEdit) {
        this.dispatchFormWarning("Um endereço com este CEP já foi cadastrado!");
        return;
      }

      // Método para criar o novo endereço com os dados já formatados
      if(this.isEdit) {
        this.editAddress(addressData)
      } else {
        this.createNewAddress(addressData);
      }
    });

    // Listener para o botão de voltar
    const backButton = document.querySelector("button.checkout-shipping-new-address--form-back-button");
    if (backButton) {
      backButton.addEventListener("click", (event) => {
        if(this.isEdit) {
          document.getElementById("editFormAddress").remove()
          document.querySelector('.checkout-address-container').style.display = ""
        } else {
          event.preventDefault();
          window.history.back();
        }
      });
    }

    // Listener para o botão "Limpar Dados"
    const clearDataButton = document.querySelector("button.checkout-shipping-new-address--clear-data-button");
    if (clearDataButton) {
      clearDataButton.addEventListener("click", (event) => {
        event.preventDefault();
        this.clearAllFields();
        
        // Limpa também as informações de CEP
        document.querySelector(".postal-code-shipping-info .postal-code-shipping-info--text").textContent = "";
        document.querySelector(".postal-code-shipping-info").style.display = "none";
        
        // Limpa todos os erros de input
        for (const [key] of Object.entries(this.form.inputs)) {
          this.dispatchInputError({ inputKey: key, inputErrorMessage: null });
        }
        
        // Esconde a mensagem de warning
        this.dispatchFormWarning(null);
        
        // Revalida o formulário
        this.validateForm({ dispatchErrors: false });
      });
    }

    // Configuração dos listeners individuais para cada input
    for (const [key, value] of Object.entries(this.form.inputs)) {
      const { inputElement, listeners, required, layout } = {
        inputElement: null,
        listeners: {},
        required: false,
        layout: false,
        ...value,
      };

      if (!inputElement) {
        console.error(`Element not found for ${key}`);
        continue;
      }

      // Remove listeners previamente adicionados (se houver)
      if (Object.keys(listeners).length) {
        for (const [listenerType, listener] of Object.entries(listeners)) {
          inputElement.removeEventListener(listenerType, listener);
          delete this.form.inputs[key].listeners[listenerType];
        }
      }

      if (key === "postalCode") {
        const postalCodeRegex = /(\d{5})(\d{3})/;
        
        // Variável para controlar o timeout de digitação
        let cepInputTimeout;
        
        this.form.inputs[key].listeners.input = (event) => {
          const target = event.currentTarget;
          const value = target.value
            .slice(0, 9)
            .replace(/\D/g, "")
            .replace(postalCodeRegex, "$1-$2");

          // Aplica máscara para CEP
          target.value = value;
          
          // Limpa o timeout anterior se existir
          if (cepInputTimeout) {
            clearTimeout(cepInputTimeout);
          }
          
          // Se o CEP estiver incompleto
          if (value.length < 9) {
            document.querySelector(
              ".postal-code-shipping-info .postal-code-shipping-info--text"
            ).textContent = "";
            document.querySelector(".postal-code-shipping-info").style.display = "none";
            
            // Não mostra os campos manuais durante a digitação
            // Apenas esconde se o campo estiver vazio
            const digits = value.replace(/\D/g, "");
            if (digits.length === 0) {
              // Se o campo estiver vazio, esconde os campos manuais
              this.toggleManualAddressFields(false);
            }
            return;
          }

          // Se o CEP estiver completo (9 caracteres com hífen), valida imediatamente
          if (value.length === 9) {
            // Limpa o timeout anterior se existir
            if (cepInputTimeout) {
              clearTimeout(cepInputTimeout);
            }
            
            // Valida imediatamente para CEPs completos
            const isValid = this.validatePostalCode({
              postalCode: value,
              required: required ?? false,
              dispatchError: true,
            });
            
            if (isValid) {
              this.fetchAddressByCEP(value);
            } else {
              this.toggleManualAddressFields(true);
            }
            return;
          }

          // Define um pequeno timeout para não disparar a cada tecla digitada
          cepInputTimeout = setTimeout(async () => {
            // Valida o CEP; se válido, consulta o ViaCEP para preencher os outros campos
            const isValid = this.validatePostalCode({
              postalCode: value,
              required: required ?? false,
              dispatchError: true,
            });
            
            if (isValid) {
              await this.fetchAddressByCEP(value);
              this.validateForm({
                dispatchErrors: false,
              });
            } else {
              // Mostra os campos manuais imediatamente se o CEP for inválido
              this.toggleManualAddressFields(true);
              this.validateForm({
                dispatchErrors: false,
              });
            }
          }, 200); // Reduzido para 200ms para resposta mais rápida
        };
        
        inputElement.addEventListener(
          "input",
          this.form.inputs[key].listeners.input
        );

        this.form.inputs[key].listeners.blur = async (event) => {
          const target = event.currentTarget;
          const value = target.value;
          
          // Limpa o timeout se existir
          if (cepInputTimeout) {
            clearTimeout(cepInputTimeout);
          }
          
          // Se o campo estiver vazio, não faz nada
          if (!value.trim()) {
            return;
          }
          
          // Valida o CEP apenas se o usuário tiver digitado algo
          const digits = value.replace(/\D/g, "");
          if (digits.length > 0) {
            const isValid = this.validatePostalCode({
              postalCode: value,
              required: required ?? false,
              dispatchError: true,
            });
            
            if (isValid && digits.length === 8) {
              // CEP válido e completo, busca o endereço
              await this.fetchAddressByCEP(value);
              this.validateForm({
                dispatchErrors: false,
              });
            } else if (digits.length === 8) {
              // CEP com 8 dígitos mas inválido (não encontrado)
              this.toggleManualAddressFields(true);
              this.validateForm({
                dispatchErrors: false,
              });
            } else if (digits.length < 8) {
              // CEP incompleto após perder o foco
              // Mostra os campos manuais apenas se o usuário já terminou de digitar (saiu do campo)
              this.toggleManualAddressFields(true);
              this.validateForm({
                dispatchErrors: false,
              });
            }
          }
        };
        
        inputElement.addEventListener(
          "blur",
          this.form.inputs[key].listeners.blur
        );
        continue;
      }

      if (key === "number") {
        this.form.inputs[key].listeners.input = (event) => {
          const target = event.currentTarget;
          target.value = target.value.slice(0, 50);
        };
        inputElement.addEventListener(
          "input",
          this.form.inputs[key].listeners.input
        );

        this.form.inputs[key].listeners.blur = (event) => {
          const target = event.currentTarget;
          const value = target.value;
          
          // Se o campo estiver vazio e o usuário apenas clicou e saiu, não mostra erro
          if (!value.trim()) {
            this.dispatchInputError({
              inputKey: "number",
              inputErrorMessage: null,
            });
            return;
          }

          this.validateForm({
            dispatchErrors: false,
          });

          this.validateNumber({
            number: value,
            required: required ?? false,
            dispatchError: true,
          });
        };
        inputElement.addEventListener(
          "blur",
          this.form.inputs[key].listeners.blur
        );
        continue;
      }

      if (key === "withoutNumber") {
        // Checkbox que, quando ativo, limpa e desabilita o input "number"
        this.form.inputs[key].listeners.change = (event) => {
          const target = event.currentTarget;
          const isChecked = target.checked;
          const numberInput = this.form.inputs["number"];

          if (isChecked) {
            numberInput.inputElement.value = "SN";
            numberInput.inputElement.disabled = true;
            numberInput.required = false;
          } else {
            numberInput.inputElement.disabled = false;
            numberInput.required = true;
          }
          this.updateInputRequirement("number", numberInput.required);

          this.validateForm({
            dispatchErrors: false,
          });
        };
        inputElement.addEventListener(
          "change",
          this.form.inputs[key].listeners.change
        );
        continue;
      }

      if (key === "complement") {
        this.form.inputs[key].listeners.input = (event) => {
          const target = event.currentTarget;
          target.value = target.value.slice(0, 100);
        };
        inputElement.addEventListener(
          "input",
          this.form.inputs[key].listeners.input
        );

        this.form.inputs[key].listeners.blur = (event) => {
          const value = event.currentTarget.value;
          
          // Se o campo estiver vazio e o usuário apenas clicou e saiu, não mostra erro
          if (!value.trim()) {
            this.dispatchInputError({
              inputKey: "complement",
              inputErrorMessage: null,
            });
            return;
          }
          
          this.validateForm({
            dispatchErrors: false,
          });

          this.validateComplement({
            complement: value,
            required: required ?? false,
            dispatchError: true,
          });
        };
        inputElement.addEventListener(
          "blur",
          this.form.inputs[key].listeners.blur
        );
        continue;
      }

      if (key === "referencePoint") {
        this.form.inputs[key].listeners.input = (event) => {
          const target = event.currentTarget;
          target.value = target.value.slice(0, 100);
        };
        inputElement.addEventListener(
          "input",
          this.form.inputs[key].listeners.input
        );

        this.form.inputs[key].listeners.blur = (event) => {
          const target = event.currentTarget;
          const value = target.value;

          this.validateForm({
            dispatchErrors: false,
          });

          this.validateReferencePoint({
            referencePoint: value,
            required: required ?? false,
            dispatchError: true,
          });
        };
        inputElement.addEventListener(
          "blur",
          this.form.inputs[key].listeners.blur
        );
        continue;
      }
      
      if (key === "state") {
        this.form.inputs[key].listeners.change = (event) => {
          try {
            this.validateForm({
              dispatchErrors: false,
            });
            this.dispatchInputError({
              inputKey: "state",
              inputErrorMessage: this.form.inputs.state.inputElement.value.trim().length ? null : "Estado é obrigatório",
            });
          } catch (error) {
            console.warn("Erro na validação do estado:", error);
          }
        };
        
        this.form.inputs[key].listeners.focus = (event) => {
          try {
            event.stopPropagation();
          } catch (error) {
            console.warn("Erro no evento focus do estado:", error);
          }
        };
        
        inputElement.addEventListener(
          "change",
          this.form.inputs[key].listeners.change
        );
        inputElement.addEventListener(
          "focus",
          this.form.inputs[key].listeners.focus
        );
        continue;
      }
      
      if (key === "city" || key === "neighborhood" || key === "street") {
        this.form.inputs[key].listeners.input = (event) => {
          try {
            const target = event.currentTarget;
            target.value = target.value.slice(0, 100);
          } catch (error) {
            console.warn(`Erro no evento input do campo ${key}:`, error);
          }
        };
        inputElement.addEventListener(
          "input",
          this.form.inputs[key].listeners.input
        );

        this.form.inputs[key].listeners.blur = (event) => {
          try {
            const value = event.currentTarget.value;
            
            if (!value.trim()) {
              this.dispatchInputError({
                inputKey: key,
                inputErrorMessage: null,
              });
              return;
            }
            
            if (key === "city") {
              this.dispatchInputError({
                inputKey: "city",
                inputErrorMessage: value.trim().length ? null : "Cidade é obrigatória",
              });
            } else if (key === "neighborhood") {
              this.dispatchInputError({
                inputKey: "neighborhood",
                inputErrorMessage: value.trim().length ? null : "Bairro é obrigatório",
              });
             } else if (key === "street") {
               this.dispatchInputError({
                 inputKey: "street",
                 inputErrorMessage: value.trim().length ? null : "Rua/Logradouro é obrigatório",
               });
            }
            
            this.validateForm({
              dispatchErrors: false,
            });
          } catch (error) {
            console.warn(`Erro no evento blur do campo ${key}:`, error);
          }
        };
        
        this.form.inputs[key].listeners.focus = (event) => {
          try {
            event.stopPropagation();
          } catch (error) {
            console.warn(`Erro no evento focus do campo ${key}:`, error);
          }
        };
        
        inputElement.addEventListener(
          "blur",
          this.form.inputs[key].listeners.blur
        );
        inputElement.addEventListener(
          "focus",
          this.form.inputs[key].listeners.focus
        );
        continue;
      }

      if (key === "receiverName") {
        this.form.inputs[key].listeners.input = (event) => {
          const target = event.currentTarget;
          target.value = target.value.slice(0, 100);
        };
        inputElement.addEventListener(
          "input",
          this.form.inputs[key].listeners.input
        );

        this.form.inputs[key].listeners.blur = (event) => {
          const target = event.currentTarget;
          const value = target.value;
          
          // Se o campo estiver vazio e o usuário apenas clicou e saiu, não mostra erro
          if (!value.trim()) {
            this.dispatchInputError({
              inputKey: "receiverName",
              inputErrorMessage: null,
            });
            return;
          }

          this.validateForm({
            dispatchErrors: false,
          });

          this.validateReceiverName({
            receiverName: value,
            required: required ?? false,
            dispatchError: true,
          });
        };
        inputElement.addEventListener(
          "blur",
          this.form.inputs[key].listeners.blur
        );
        continue;
      }
    }
  }
}

// DOM load
document.addEventListener("DOMContentLoaded", () => {
  // Verifica se o formulário existe antes de instanciar a classe
  const formElement = document.querySelector("form.checkout-shipping-new-address--form");
  if (!formElement) {
    return; // Sai se o formulário não existir
  }
  
  new ShippingNewAddress({
    form: {
      formLoading: false,
      formElement: document.querySelector(
        "form.checkout-shipping-new-address--form"
      ),
      inputs: {
        postalCode: {
          formGroup: "postalCode",
          inputElement: document.querySelector(
            "#shipping-new-address--postalCode"
          ),
          inputError: null,
          listeners: {},
          required: true,
        },
        state: {
          formGroup: "manual-address-fields",
          inputElement: document.querySelector("#shipping-new-address--state"),
          inputError: null,
          listeners: {},
          required: true,
          manualMode: false,
        },
        city: {
          formGroup: "manual-address-fields",
          inputElement: document.querySelector("#shipping-new-address--city"),
          inputError: null,
          listeners: {},
          required: true,
          manualMode: false,
        },
        neighborhood: {
          formGroup: "manual-address-fields",
          inputElement: document.querySelector(
            "#shipping-new-address--neighborhood"
          ),
          inputError: null,
          listeners: {},
          required: true,
          manualMode: false,
        },
         street: {
           formGroup: "manual-address-fields",
           inputElement: document.querySelector("#shipping-new-address--street"),
           inputError: null,
           listeners: {},
           required: true,
           manualMode: false,
         },
        country: {
          formGroup: "hidden-inputs",
          inputElement: document.querySelector(
            "#shipping-new-address--country"
          ),
          inputError: null,
          listeners: {},
          required: true,
        },
        number: {
          formGroup: "number",
          inputElement: document.querySelector("#shipping-new-address--number"),
          inputError: null,
          listeners: {},
          required: true,
        },
        withoutNumber: {
          formGroup: "number",
          inputElement: document.querySelector(
            "#shipping-new-address--number--withoutNumber"
          ),
          inputError: null,
          listeners: {},
          required: false,
          layout: true,
        },
        complement: {
          formGroup: "complement",
          inputElement: document.querySelector(
            "#shipping-new-address--complement"
          ),
          inputError: null,
          listeners: {},
          required: true,
        },
        referencePoint: {
          formGroup: "referencePoint",
          inputElement: document.querySelector(
            "#shipping-new-address--referencePoint"
          ),
          inputError: null,
          listeners: {},
          required: false,
        },
        receiverName: {
          formGroup: "receiverName",
          inputElement: document.querySelector(
            "#shipping-new-address--receiverName"
          ),
          inputError: null,
          listeners: {},
          required: true,
        },
      },
    },
  });
});
