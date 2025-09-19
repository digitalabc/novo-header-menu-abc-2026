window.addEventListener("load", signupSetup, false);

/**
 * Configura o formulário de registro.
 * Verifica se há um token de acesso do cliente. Se houver, preenche o campo de e-mail com o
 * identificador do usuário associado ao token, se aplicável. 
 * Trata a lógica do checkbox "isento" para o registro estadual.
 */
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

/**
 * Verifica se os campos de entrada estão em branco e exibe mensagens de erro correspondentes.
 * Itera sobre os elementos de entrada marcados com o atributo 'data-id="valid"' e verifica se estão em branco.
 * Também verifica se um elemento de seleção 'gender' tem uma opção selecionada e atualiza a classe CSS
 * e exibe mensagens de erro, se necessário.
 */
function inputValidblank() {
    const inputs = document.querySelectorAll('input[data-id="valid"]');
    var select = document.getElementById('gender');

    if (select && select.selectedIndex !== 0) {
        select.classList.remove('border-red-500');
    } else if (select) {
        select.classList.add('border-red-500');
        const errorSpan = select.parentElement.querySelector('.error');
        if (errorSpan) {
            errorSpan.classList.remove('hidden');
        }
    }

    inputs.forEach(function (input) {
        const fieldValue = input.value.trim();
        const errorSpan = input.parentElement.querySelector('.error');
        const MsgZipCode = document.getElementById('MsgZipCode');
        if (fieldValue === '') {
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
        }
    });
}

/**
 * Formulario para criar novo cliente
 * Busca formulario com id 'accountCreateForm'
 *
 * @param {CustomerCreateInput} input
 */
const accountCreateSubmit = async (e) => {
    e.preventDefault();

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
    
                valid =  false
            }
        } else if (input.id === "receiverName" && !/^\S+\s+\S+/.test(input.value.trim())) {
            showOverlay("Erro no formulário", "Informe o nome e o sobrenome do destinatário.", true);

            input.classList.add('border-red-500');

            valid = false
        } else {
            input.classList.remove('border-red-500');
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
        const createResponse = await client.customer.create(input);

        if (createResponse.errors) {
            if(createResponse?.errors?.[0]?.message == ('CPF already exists')) {
                showOverlay("Erro no formulário", 'CPF já cadastrado', true);
            } else {
                showOverlay("Erro no formulário", createResponse.errors[0].message, true);
            }
        } else {
            const loginResponse = await client.customer.authenticate(input.email, input.password);

            if (loginResponse?.data?.token) {
                window.location = new URLSearchParams(window.location.search).get('returnUrl') || checkout_pages.account.orders;
            } else if (response?.errors?.length > 0) {
                showOverlay("Erro ao autenticar usuário", response.errors[0].message, true);
            } else {
                window.location = new URLSearchParams(window.location.search).get('returnUrl') || checkout_pages.login.authenticate;
            }
        }
    }
};

/**
 * Obtém informações de endereço com base em um CEP fornecido.
 * @returns {Promise<void>} Uma promessa que representa a operação assíncrona.
 */
async function getAddress() {
    try {
        const cepInput = document.getElementById('zipcode');
        const cepValue = cepInput.value.trim();

        if (cepValue === '') {
            console.log('Campo vazio. Por favor, preencha o CEP.');
            return;
        }

        const variables = {
            cep: cepValue
        };

        let addressResponse = await client.snippet.render("wake_checkout_address_snippet.html", "SnippetQueries/wake_account_address.graphql", variables);
        setInnerHtmlById(addressResponse, 'resultGetAddress');

        const cepElement = document.getElementById('CepElement');
        cepElement.value = cepValue;
        document.getElementById('InputCep').classList.add('hidden');
    } catch (error) {
        console.log("Failure");

        document.getElementById('zipcode').classList.add('border-red-500');
        document.getElementById('MsgZipCode').classList.add('text-red-500');
        document.getElementById('invalidCep').classList.add('text-red-500');
        document.getElementById('invalidCep').classList.remove('hidden');

        console.log(error);
    }
};
