// window.addEventListener("load", checkUserLogin, false);

/**
 * Autenticação padrão
 * Busca formulario com id 'authenticateForm'
 *
 * @param {form} email
 * @param {form} password
 */
const authenticateSubmit = async (e) => {
    e.preventDefault();

    const input = convertFormInObject(e.target);

    if (!input.email || !input.password) {
        if (!input.email) {
            document.getElementById('email').classList.add('border-red-500');
            document.getElementById('errorMessageEmail').classList.remove('hidden');
        } else {
            document.getElementById('email').classList.remove('border-red-500');
            document.getElementById('errorMessageEmail').classList.add('hidden');
        }

        if (!input.password) {
            document.getElementById('password').classList.add('border-red-500');
            document.getElementById('errorMessagePassword').classList.remove('hidden');
        } else {
            document.getElementById('password').classList.remove('border-red-500');
            document.getElementById('errorMessagePassword').classList.add('hidden');
        }

        return false;
    }

    const response = await client.customer.authenticate(input.email, input.password);

    if (response?.data?.token) {
        if (response?.data?.isMaster) {
            window.location = checkout_pages.login.impersonate
            return;
        }

        window.location = new URLSearchParams(window.location.search).get('returnUrl') || checkout_pages.account.orders
    }
    else {
        if(response.errors[0]?.extensions.code === "LOG100") {
            showOverlay("Erro ao autenticar usuário", "A senha ou email estão incorretos", true);
        } 
        else showOverlay("Erro ao autenticar usuário", response.errors[0]?.message, true);
    }
}

/**
 * Envia e-mail com chave de acesso
 * Busca formulario com id 'sendEmailWithAccessKeyForm'
 *
 * @param {form} email
 */
const sendEmailWithAccessKeySubmit = async (e) => {
    e.preventDefault();

    const input = convertFormInObject(e.target);

    if (!input.email) {
        document.getElementById('email').classList.add('border-red-500');
        document.getElementById('errorMessageEmail').classList.remove('hidden');

        return false;
    }
    else {
        document.getElementById('email').classList.remove('border-red-500');
        document.getElementById('errorMessageEmail').classList.add('hidden');
    }

    const response = await client.customer.sendAccessKeyEmail(input.email);

    if (response?.data?.isSuccess) {
        document.getElementById('accessKeyEmail').value = input.email;
        document.getElementById('sendEmailWithAccessKeyDiv').classList.add('hidden');
        document.getElementById('authenticateWithAccessKeyDiv').classList.remove('hidden');
        document.getElementById('accessKeySpan').innerHTML = "Insira a chave de acesso enviada no e-mail " + input.email;
    }
    else showOverlay("Erro ao enviar o e-mail", response.errors[0]?.message, true);
}

/**
 * Autenticação com chave de acesso
 * Busca formulario com id 'authenticateWithAccessKeyForm'
 *
 * @param {form} accessKey
 * @param {form} accessKeyEmail
 */
const authenticateWithAccessKeySubmit = async (e) => {
    e.preventDefault();

    const input = convertFormInObject(e.target);

    if (!input.accessKey) {
        document.getElementById('accessKey').classList.add('border-red-500');
        document.getElementById('errorMessageAccessKey').classList.remove('hidden');

        return false;
    }
    else {
        document.getElementById('accessKey').classList.remove('border-red-500');
        document.getElementById('errorMessageAccessKey').classList.add('hidden');
    }

    const response = await client.customer.authenticateAccessKey(input.accessKeyEmail, input.accessKey);

    if (response?.data?.token) {
        window.location = new URLSearchParams(window.location.search).get('returnUrl') || checkout_pages.account.orders
    }
    else showOverlay("Erro ao enviar o e-mail", response.errors[0]?.message, true);
}

/**
 * Renderiza questões de validação de usuário no elemento #authenticateSimpleOptions
 *
 * @param {form} login
 * @param {form} questionId
 * @param {form} answerId
 */
const renderQuestions = (data) => {
    var questionId = data.questionId;
    var question = data.question;
    var options = data.answers;

    document.getElementById('mainSimpleLogin').classList.add('hidden');

    setInnerHtmlById(`<h3>${question}</h3><div id="authenticateSimpleQuestions" class="wake-authenticate-simple-questions"></div>`, "authenticateSimpleOptions");

    var inputQuestionId = document.createElement('input');
    inputQuestionId.type = 'hidden';
    inputQuestionId.name = 'questionId';
    inputQuestionId.value = questionId;
    document.getElementById("authenticateSimpleQuestions").appendChild(inputQuestionId);

    const form = document.getElementById('authenticateSimpleStepTwoForm');

    options.forEach((option) => {
        var inputAnswers = document.createElement('input');
        inputAnswers.type = 'radio';
        inputAnswers.name = 'answerId';
        inputAnswers.value = option.id;
        inputAnswers.setAttribute('id', option.id);
        inputAnswers.classList.add('hidden');

        var label = document.createElement('label')
        label.setAttribute('for', option.id);
        label.appendChild(inputAnswers);
        label.appendChild(document.createTextNode(option.value));
        label.classList.add('font-semibold');

        var div = document.createElement('div');
        div.classList.add('flex', 'w-full')
        div.appendChild(inputAnswers);
        div.appendChild(label);

        //document.getElementById("authenticateSimpleQuestions").appendChild(label);
        document.getElementById("authenticateSimpleQuestions").appendChild(div);
        document.getElementById("authenticateSimpleStepTwoForm").classList.remove('hidden');
        document.getElementById("authenticateSimpleStepTwoForm").classList.add('flex');

        inputAnswers.addEventListener('change', async function () {
            document.querySelectorAll('#authenticateSimpleQuestions label').forEach((lbl) => {
                lbl.classList.remove('wake-authenticate-simple-answer-selected');
            });

            label.classList.add('wake-authenticate-simple-answer-selected');
            await authenticateSimpleStepTwoSubmit(form);
        });
    });
}

/**
 * Requisição para autenticação simples
 * Busca formulario com id 'authenticateSimpleStepOneForm'
 *
 * @param {form} login
 */
const authenticateSimpleStepOneSubmit = async (e) => {
    e.preventDefault();

    const input = convertFormInObject(e.target);
    var response = await client.customer.simpleLoginStart(input.login);

    if (response?.data?.type === "NEW") {
        window.location = new URLSearchParams(window.location.search).get('returnUrl') || "/";
        return;
    }

    if (response?.data?.question) {
        renderQuestions(response.data.question);
        return;
    }

    showOverlay("Tentativas de login conhecidas excedidas.", 'Você será redirecionado para a página de autenticação.', true);
    setTimeout(() => {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        const returnUrlQueryString = returnUrl && `?returnUrl=${returnUrl}`;
        window.location = `${checkout_pages.login.authenticate}${returnUrlQueryString}`;
    }, 3000)
}

/**
 * Autenticação simples
 * Busca formulario com id 'authenticateSimpleStepTwoForm'
 *
 * @param {form} login
 * @param {form} questionId
 * @param {form} answerId
 */
const authenticateSimpleStepTwoSubmit = async (form) => {
    const inputOne = convertFormInObjectById("authenticateSimpleStepOneForm");
    const inputTwo = convertFormInObject(form);
    const response = await client.customer.simpleLoginVerifyAnswer(inputOne.login, inputTwo.questionId, inputTwo.answerId);

    if (response?.data?.customerAccessToken?.token) {
        window.location = new URLSearchParams(window.location.search).get('returnUrl') || checkout_pages.account.data;
        return;
    }

    if (response?.data?.question) {
        renderQuestions(response.data.question);
        return;
    }

    showOverlay("Tentativas de login conhecidas excedidas.", 'Você será redirecionado para a página de autenticação.', true);
    setTimeout(() => {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        const returnUrlQueryString = returnUrl && `?returnUrl=${returnUrl}`;
        window.location = `${checkout_pages.login.authenticate}${returnUrlQueryString}`;
    }, 3000)

}

/**
 * Autentica o usuário usando o login do Facebook.
 * Chama a função authFacebook para processar a resposta.
 */
const authenticateFacebook = () => {
    FB.login(function (response) {
        if (response.status === 'connected') {
            authFacebook(response.authResponse.accessToken);
        } else {
            showOverlay('Erro no login', 'Não foi possível autenticar utilizando sua conta do Facebook.', true);
        }
    }, { scope: 'public_profile,email' });
}

/**
 * Autentica o usuário utilizando um token de acesso do Facebook.
 * @param {string} facebookAccessToken - O token de acesso do Facebook.
 */
const authFacebook = async (facebookAccessToken) => {
    const response = await client.customer.socialLoginFacebook(facebookAccessToken);

    if (response?.data?.token) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        if (response.data.type === "AUTHENTICATED") {
            window.location = returnUrl || checkout_pages.account.orders;
        } else {
            window.location = returnUrl || checkout_pages.login.signup;
        }
    } else if (response?.errors?.length > 0)
        showOverlay("Erro ao autenticar usuário", response.errors[0].message, true);
}

/**
 * Configura o botão de login do Google para autenticação.
 * Inicializa o botão de login do Google com o cliente ID fornecido e define
 * a função de retorno de chamada para processar a autenticação.
 * @param {string} clientId - O ID do cliente OAuth do Google.
 */
const configureGoogleLoginButton = (clientId) => {
    google.accounts.id.initialize({
        client_id: clientId,
        callback: authGoogle,
        use_fedcm_for_prompt: true
    });
    google.accounts.id.prompt();
};

/**
 * Autentica o usuário utilizando as credenciais do Google.
 * Este método faz uma chamada assíncrona para o servidor para autenticar o usuário
 * utilizando as credenciais fornecidas pelo Google.
 * @param {object} credentials - As credenciais de autenticação fornecidas pelo Google.
 */
const authGoogle = async (credentials) => {
    const response = await client.customer.socialLoginGoogle(credentials.credential);

    if (response?.data?.token) {
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');

        if (response.data.type === "AUTHENTICATED") {
            window.location = returnUrl || checkout_pages.account.orders;
        } else {
            window.location = returnUrl || checkout_pages.login.signup;
        }
    } else if (response?.errors?.length > 0)
        showOverlay("Erro ao autenticar usuário", response.errors[0].message, true);
}

/**
 * Requisição para trocar senha
 * Busca formulario com id 'passwordChangeForm'
 *
 * @param {form} currentPassword
 * @param {form} newPassword
 */
const passwordChangeSubmit = async (e) => {
    e.preventDefault();

    const input = convertFormInObject(e.target);
    await client.customer.passwordChange(input.currentPassword, input.newPassword);
}

/**
 * Cria um elemento falso para simular o botão de login do Google.
 * Este método cria um elemento falso para representar o botão de login do Google,
 * permitindo acionar o processo de autenticação do Google sem exibir o botão real na interface do usuário.
 * @returns {object} Um objeto com uma função de clique para simular o clique no botão falso de login do Google.
 */
const createFakeGoogleWrapper = () => {
    const googleLoginWrapper = document.createElement("div");
    googleLoginWrapper.style.display = "none";
    googleLoginWrapper.classList.add("custom-google-button");

    // Adiciona o botão falso ao corpo do documento
    document.body.appendChild(googleLoginWrapper);

    // Usa a API do GSI para renderizar o botão dentro do elemento falso
    window.google.accounts.id.renderButton(googleLoginWrapper, {
        type: "icon",
        width: "200",
    });

    const googleLoginWrapperButton =
        googleLoginWrapper.querySelector("div[role=button]");

    return {
        click: () => {
            googleLoginWrapperButton.click();
        },
    };
};

/**
 * Continuar como próprio usuário master
 */
const impersonateOwnUser = async (e) => {
    e.preventDefault();
    window.location = window.location.origin;
}

/**
 * Impersonar usuário
 * Busca formulario com id 'impersonateForm'
 *
 * @param {form} email
 */
const impersonateSubmit = async (e) => {
    e.preventDefault();

    const input = convertFormInObject(e.target);
    const response = await client.customer.impersonate(input.email);

    if (response?.data?.token) window.location = window.location.origin;
    else showOverlay("Erro ao impersonar usuário", response.errors[0]?.message, true);
}

function toggleTypePassword() {
    const senhaInput = document.getElementById("passwordConfirmation");
    const ocultar = document.getElementById('TypePassword');
    const mostrar = document.getElementById('TypePasswordShow');

    const togglePasswordVisibility = (inputElement, hideElement, showElement, inputType) => {
        inputElement.type = inputElement.type === "password" ? "text" : "password";
        hideElement.classList.toggle('hidden');
        showElement.classList.toggle('hidden');
    };

    togglePasswordVisibility(senhaInput, ocultar, mostrar, "password");
}

async function checkUserLogin() {
  try {
    const user = await client.customer.get();
    if (user != null) {
        window.location = new URLSearchParams(window.location.search).get('returnUrl') || "/"
    }

  } catch (error) {
    console.error(error);
  }
}