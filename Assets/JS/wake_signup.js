// Implementação da função showOverlay para exibir mensagens de erro
function showOverlay(title, message, isError = false) {
  console.log(`[${isError ? 'ERRO' : 'INFO'}] ${title}: ${message}`);
  
  try {
    // Criar elemento de overlay se não existir
    let overlay = document.querySelector('.wake-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'wake-overlay fixed inset-0 flex z-50 items-center justify-center px-4 py-6';
      document.body.appendChild(overlay);
      
      const overlayBox = document.createElement('div');
      overlayBox.className = 'overlay-box w-full flex flex-col items-center justify-center space-y-4';
      overlay.appendChild(overlayBox);
      
      const overlayWrapper = document.createElement('div');
      overlayWrapper.className = 'overlay-wrapper pointer-events-auto w-full max-w-sm overflow-hidden rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5';
      overlayBox.appendChild(overlayWrapper);
      
      const overlayContent = document.createElement('div');
      overlayContent.className = 'p-5';
      overlayWrapper.appendChild(overlayContent);
      
      const statusDiv = document.createElement('div');
      statusDiv.className = 'flex items-center py-2';
      overlayContent.appendChild(statusDiv);
      
      const iconDiv = document.createElement('div');
      iconDiv.className = 'flex-shrink-0 flex items-center justify-center';
      statusDiv.appendChild(iconDiv);
      
      const successIcon = document.createElement('div');
      successIcon.className = 'success h-7 w-7 text-green-400';
      successIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
      iconDiv.appendChild(successIcon);
      
      const errorIcon = document.createElement('div');
      errorIcon.className = 'error w-7 h-7 text-red-400';
      errorIcon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>';
      iconDiv.appendChild(errorIcon);
      
      const messageDiv = document.createElement('div');
      messageDiv.className = 'ml-3 w-0 flex-1';
      statusDiv.appendChild(messageDiv);
      
      const titleElement = document.createElement('p');
      titleElement.className = 'title text-base font-medium text-gray-900';
      messageDiv.appendChild(titleElement);
      
      const contentElement = document.createElement('p');
      contentElement.className = 'content mt-1 text-sm p-2 text-gray-500';
      messageDiv.appendChild(contentElement);
    }
    
    // Atualizar conteúdo do overlay
    const titleElement = document.querySelector('.wake-overlay .title');
    const contentElement = document.querySelector('.wake-overlay .content');
    const successIcon = document.querySelector('.wake-overlay .success');
    const errorIcon = document.querySelector('.wake-overlay .error');
    
    titleElement.textContent = title;
    contentElement.innerHTML = message;
    
    if (isError) {
      successIcon.style.display = 'none';
      errorIcon.style.display = 'block';
    } else {
      successIcon.style.display = 'block';
      errorIcon.style.display = 'none';
    }
    
    // Mostrar overlay
    document.querySelector('.wake-overlay').style.display = 'flex';
    document.querySelector('.overlay-box').style.display = 'flex';
    
    // Esconder overlay após 5 segundos
    setTimeout(() => {
      document.querySelector('.wake-overlay').style.display = 'none';
    }, 5000);
  } catch (error) {
    console.error("Erro ao mostrar overlay:", error);
    alert(`${title}: ${message}`);
  }
}

// Função global para ocultar erro de um campo específico
function hideFieldError(field) {
    if (field.value.trim() !== '') {
        // Procurar mensagem de erro em diferentes posições
        const errorElement = field.parentElement.querySelector('.error') || 
                            field.nextElementSibling?.classList.contains('error') ? field.nextElementSibling : null ||
                            field.parentElement.parentElement.querySelector('.error');
        
        if (errorElement) {
            errorElement.classList.add('hidden');
        }
        field.classList.remove('border-red-500');
    }
}

// Função para configurar validação instantânea do CEP
function setupCepValidation() {
    const cepInput = document.getElementById('zipcode');
    if (!cepInput) return;
    
    let timeoutId;
    
    // Função para validar CEP com debounce
    function validateCepWithDebounce() {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
            const cepValue = cepInput.value.trim();
            
            // Validar apenas se o CEP tem 8 dígitos
            if (cepValue.length === 8 && /^\d{8}$/.test(cepValue)) {
                // Usar a função getAddress para manter consistência
                await getAddress();
            } else if (cepValue.length > 0 && cepValue.length < 8) {
                // CEP incompleto - não mostrar erro ainda
                return;
            } else if (cepValue.length > 8) {
                // CEP muito longo - mostrar erro
                cepInput.classList.add('border-red-500');
                const invalidCep = document.getElementById('invalidCep');
                const msgZipCode = document.getElementById('MsgZipCode');
                
                if (invalidCep) {
                    invalidCep.classList.remove('hidden');
                    invalidCep.classList.add('text-red-500');
                }
                if (msgZipCode) {
                    msgZipCode.classList.add('text-red-500');
                }
            }
        }, 500); // Debounce de 500ms
    }
    
    // Adicionar eventos para validação instantânea
    cepInput.addEventListener('input', validateCepWithDebounce);
    cepInput.addEventListener('paste', () => {
        setTimeout(validateCepWithDebounce, 100);
    });
    
    // Validar CEP quando o usuário pressionar Enter
    cepInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault(); // Evitar envio do formulário
            
            // Validar o CEP imediatamente
            clearTimeout(timeoutId);
            
            // Usar getAddress diretamente para validação imediata
            const cepValue = this.value.trim();
            if (cepValue.length === 8 && /^\d{8}$/.test(cepValue)) {
                getAddress(e);
            } else {
                validateCepWithDebounce();
            }
        }
    });
}

window.addEventListener("load", signupSetup, false);

async function signupSetup() {
    const emailInput = document.querySelector('[id="email"]');
    const token = await client.cookie.get("sf_customer_access_token");

    if (token) {
        try {
            const response = await client.customer.accessTokenDetails(token);
            const details = response.data;

            if (details.origin === "SOCIAL" && details.type === "NEW") {
                emailInput.value = details.identifier;
                emailInput.setAttribute('disabled', 'disabled');
            }
        } catch (error) {
            showOverlay("Erro ao acessar informações do usuário", "Não foi possivel acessar email social", true);
        }
    }
    
    // Adicionar evento para ocultar mensagens de erro quando o usuário começar a digitar
    const allInputs = document.querySelectorAll('.wake-signup-wrapper input, .wake-signup-wrapper select');
    allInputs.forEach(input => {
        input.addEventListener('input', function() {
            hideFieldError(this);
        });
        
        input.addEventListener('change', function() {
            hideFieldError(this);
        });
        
        // Verificar campos já preenchidos ao carregar a página
        if (input.value.trim() !== '') {
            hideFieldError(input);
        }
    });
    
    // Função para inicializar validação de campos já preenchidos
    function initializeFieldValidation() {
        const allFields = document.querySelectorAll('.wake-signup-wrapper input, .wake-signup-wrapper select');
        allFields.forEach(field => {
            if (field.value.trim() !== '') {
                hideFieldError(field);
            }
        });
    }
    
    // Inicializar verificação de campos já preenchidos
    initializeFieldValidation();
    
    // Configurar validação instantânea do CEP
    setupCepValidation();
    
    const isentoCheckbox = document.getElementById('exemptStateRegistrationFree');
    const stateRegistrationInput = document.getElementById('stateRegistration');
    const stateRegistrationError = document.getElementById('stateregistration-error')

    if (isentoCheckbox) {
        isentoCheckbox.addEventListener('change', function () {
            if (this.checked) {
                stateRegistrationInput.removeAttribute('data-id');
                stateRegistrationInput.classList.remove('border-red-500');
                stateRegistrationError.classList.add('hidden');
            } else {
                stateRegistrationInput.setAttribute('data-id', 'valid');
                stateRegistrationInput.classList.add('border-red-500');
                stateRegistrationError.classList.remove('hidden');
            }
        });
    }
}

// Esta função só será chamada no envio do formulário
function inputValidblank() {
    const inputs = document.querySelectorAll('input[data-id="valid"]');
    var select = document.getElementById('gender');

    // Validar campo de gênero
    if (select && select.selectedIndex !== 0) {
        select.classList.remove('border-red-500');
        hideFieldError(select);
    } else if (select) {
        select.classList.add('border-red-500');
        const errorSpan = select.parentElement.querySelector('.error');
        if (errorSpan) {
            errorSpan.classList.remove('hidden');
        }
    }

    // Verificar apenas campos vazios no momento do envio
    inputs.forEach(function (input) {
        const fieldValue = input.value.trim();
        const errorSpan = input.parentElement.querySelector('.error') || 
                         input.nextElementSibling?.classList.contains('error') ? input.nextElementSibling : null ||
                         input.parentElement.parentElement.querySelector('.error');
        const MsgZipCode = document.getElementById('MsgZipCode');
        
        if (fieldValue === '') {
            input.classList.add('border-red-500');
            if (errorSpan) {
                errorSpan.classList.remove('hidden');
            }
            if (MsgZipCode) {
                MsgZipCode.classList.add('text-red-500');
            }
            const invalidCep = document.getElementById('invalidCep');
            if (invalidCep) {
                invalidCep.classList.add('text-red-500');
            }
        } else {
            input.classList.remove('border-red-500');
            if (errorSpan) {
                errorSpan.classList.add('hidden');
            }
        }
    });
}

const accountCreateSubmit = async (e) => {
    e.preventDefault();
    
    // Adicionar classe para indicar que o formulário foi enviado
    document.querySelector('.wake-signup-wrapper').classList.add('form-submitted');

    const input = convertFormInObject(e.target);
    const inputs = document.querySelectorAll('input[data-id="valid"]');
    const errorElements = document.querySelectorAll('.error');
    const physicalPerson = document.getElementById('customerCpf').checked;

    let valid = true;

    inputs.forEach(function (input) {
        if (input.value === '') {
            input.classList.add('border-red-500');
            document.getElementById('invalidCep').classList.remove('hidden');
            valid = false;
        } else if (input.id === "password") {
            if(input.value.length < 6 ) {
                showOverlay("Erro no formulário", "A senha precisa conter no mínimo 6 caracteres.", true);
                input.classList.add('border-red-500');
                valid = false;
            } else if (input.value !== document.querySelector('input[id=passwordConfirmation]').value) {
                showOverlay("Erro no formulário", "A senha e a confirmação de senha não são iguais.", true);
                input.classList.add('border-red-500');
                valid = false;
            } else {
                hideFieldError(input);
            }
        } else if (input.id === "receiverName" && !/^\S+\s+\S+/.test(input.value.trim())) {
            showOverlay("Erro no formulário", "Informe o nome e o sobrenome do destinatário.", true);
            input.classList.add('border-red-500');
            valid = false;
        } else {
            hideFieldError(input);
        }
    });

    if (valid) {
        errorElements.forEach(function (error) {
            error.classList.add('hidden');
        });

        input.reseller = document.getElementById('reseller').checked;
        input.newsletter = document.getElementById('newsletter').checked;
        input.exemptStateRegistration = document.getElementById('exemptStateRegistrationFree').checked;
        input.address = document.getElementById('address')?.value;
        input.state = document.getElementById('state')?.value;
        input.neighborhood = document.getElementById('neighborhood')?.value;
        input.city = document.getElementById('city')?.value;
        input.email = document.querySelector('[id="email"]')?.value
        if (input?.secondaryPhoneAreaCode === '' && input?.secondaryPhoneNumber === '') {
            input.secondaryPhoneAreaCode = null;
            input.secondaryPhoneNumber = null;
        }
        if (!physicalPerson) {
            Object.keys(input).forEach((key) => {
                if (input[key] === '') {
                    delete input[key];
                }
            });
        }
        
        try {
            const createResponse = await client.customer.create(input);

            if (createResponse.errors) {
                const errorMessage = createResponse.errors[0].message;
                const linkRecuperar = '<a href="/login/password/recovery" style="color: #0092ff; text-decoration: underline;">Clique aqui para recuperar</a>';
                
                if (errorMessage.includes('CPF already exists') || errorMessage.includes('CPF já cadastrado')) {
                    showOverlay("Erro no formulário", `CPF já cadastrado. Você esqueceu a senha? ${linkRecuperar}`, true);
                } else if (errorMessage.includes('Email already exists') || errorMessage.includes('Email já cadastrado') || errorMessage.includes('email already exists')) {
                    showOverlay("Erro no formulário", `Usuário já cadastrado. Você esqueceu a senha? ${linkRecuperar}`, true);
                } else if (errorMessage.includes('CNPJ already exists') || errorMessage.includes('CNPJ já cadastrado')) {
                    showOverlay("Erro no formulário", `CNPJ já cadastrado. Você esqueceu a senha? ${linkRecuperar}`, true);
                } else if (errorMessage.includes('already exists') || errorMessage.includes('já cadastrado')) {
                    showOverlay("Erro no formulário", `Usuário já cadastrado. Você esqueceu a senha? ${linkRecuperar}`, true);
                } else if (errorMessage.includes('password') || errorMessage.includes('Password')) {
                    showOverlay("Erro no formulário", "Erro na senha. Verifique se sua senha atende aos requisitos de segurança.", true);
                } else if (errorMessage.includes('email') || errorMessage.includes('Email')) {
                    showOverlay("Erro no formulário", `Email inválido ou já cadastrado. Você esqueceu a senha? ${linkRecuperar}`, true);
                } else {
                    showOverlay("Erro no formulário", "Ocorreu um erro ao processar seu cadastro. Por favor, verifique os dados e tente novamente.", true);
                }
            } else {
                try {
                    const loginResponse = await client.customer.authenticate(input.email, input.password);

                    if (loginResponse?.data?.token) {
                        window.location = new URLSearchParams(window.location.search).get('returnUrl') || "/account/my-data";
                    } else if (loginResponse?.errors?.length > 0) {
                        showOverlay("Erro ao autenticar usuário", "Não foi possível autenticar o usuário. Por favor, tente novamente.", true);
                    } else {
                        window.location = new URLSearchParams(window.location.search).get('returnUrl') || "/login/authenticate";
                    }
                } catch (loginError) {
                    console.error("Erro ao autenticar após cadastro:", loginError);
                    showOverlay("Erro ao autenticar usuário", "Cadastro realizado com sucesso, mas não foi possível fazer login automático. Por favor, faça login manualmente.", true);
                    setTimeout(() => {
                        window.location = "/login/authenticate";
                    }, 3000);
                }
            }
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            showOverlay("Erro no sistema", "Ocorreu um erro técnico ao processar seu cadastro. Por favor, tente novamente mais tarde ou entre em contato com o suporte.", true);
        }
    }
};

async function getAddress(event) {
    // Se o evento foi passado e é um evento de tecla Enter, prevenir comportamento padrão
    if (event && event.key === 'Enter') {
        event.preventDefault();
    }
    
    try {
        const cepInput = document.getElementById('zipcode');
        const cepValue = cepInput.value.trim();

        if (cepValue === '') {
            console.log('Campo vazio. Por favor, preencha o CEP.');
            return;
        }

        // Limpar estados anteriores de erro
        cepInput.classList.remove('border-red-500');
        const invalidCep = document.getElementById('invalidCep');
        const msgZipCode = document.getElementById('MsgZipCode');
        
        if (invalidCep) {
            invalidCep.classList.add('hidden');
            invalidCep.classList.remove('text-red-500');
        }
        if (msgZipCode) {
            msgZipCode.classList.remove('text-red-500');
        }

        const variables = {
            cep: cepValue
        };

        let addressResponse = await client.snippet.render("wake_checkout_address_snippet.html", "SnippetQueries/wake_account_address.graphql", variables);
        setInnerHtmlById(addressResponse, 'resultGetAddress');

        const cepElement = document.getElementById('CepElement');
        if (cepElement) {
            cepElement.value = cepValue;
        }
        
        const inputCep = document.getElementById('InputCep');
        if (inputCep) {
            inputCep.classList.add('hidden');
        }
        
        // Remover foco do campo para evitar múltiplos envios
        cepInput.blur();
        
        return true; // Indica sucesso
    } catch (error) {
        console.log("Falha na validação do CEP:", error);

        const cepInput = document.getElementById('zipcode');
        const invalidCep = document.getElementById('invalidCep');
        const msgZipCode = document.getElementById('MsgZipCode');
        
        if (cepInput) {
            cepInput.classList.add('border-red-500');
        }
        
        if (msgZipCode) {
            msgZipCode.classList.add('text-red-500');
        }
        
        if (invalidCep) {
            invalidCep.classList.add('text-red-500');
            invalidCep.classList.remove('hidden');
        }

        return false; // Indica falha
    }
};
