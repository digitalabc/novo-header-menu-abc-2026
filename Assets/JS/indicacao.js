// Form functions
function formMessage(status) {
    let div = document.createElement("div");
    document.getElementById("form-message") ? document.getElementById("form-message").remove() : null

    if (status) {
        console.log("success");
        div.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p>
            Formulário enviado
            <small>Formuário enviado com sucesso!</small>
        </p>
        <button id="close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path>
            </svg>
        </button>
        `
    } else {
        console.log("error");
        div.innerHTML = `
        <svg class="error" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <p>
            Formulário não enviado
            <small>O Formuário não pode ser enviado,<br />confira os campos.</small>
        </p>
        <button id="close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z"></path>
            </svg>
        </button>
        `
    }

    div.setAttribute("id", "form-message");
    div.querySelector("#close").setAttribute("onclick", "closeMessage(this)");
    document.querySelector(".attendence").appendChild(div);

    setTimeout(() => {
        document.querySelector("#form-message") ? document.querySelector("#form-message").classList.add("remove") : null
        setTimeout(() => {
            document.getElementById("form-message") ? document.getElementById("form-message").remove() : null
        }, 300);
    }, 5000);

}

function closeMessage(button) {
    button.parentElement.classList.add("remove")
    setTimeout(() => {
        button.parentElement.remove()
    }, 300);
}

async function sendGenericForm(data) {
    var status = false;
    try {
        const request = await client.genericForm.send(data, null);
        status = true;
        handleMsgSubmit()
    } catch (error) {
        console.error(error);
    } finally {
        formMessage(status);
    }
}

const form = document.getElementById('genericForm');

form.addEventListener('submit', function (e) {
    console.log('teste', form);
    e.preventDefault();
    var formData = new FormData(form);
    console.log('formData', formData);

    var data = {};
    formData.forEach((value, key) => data[key] = value);
    console.log('data', data);

    sendGenericForm(data);
});

// Form validations
function validarCNPJ(cnpj, input) {

    let valid = true,
        submit = document.querySelector('#genericForm input[type="submit"]'),
        cnpjError = document.getElementById("cpnj-error")

    cnpj = cnpj.replace(/[^\d]+/g, '');

    var x = input.value.replace(/\D/g, '').match(/(\d{0,2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2})/);
    input.value = !x[2] ? x[1] : x[1] + '.' + x[2] + '.' + x[3] + '/' + x[4] + (x[5] ? '-' + x[5] : '');

    if (cnpj == '') valid = false;

    if (cnpj.length != 14)
        valid = false;

    // Elimina CNPJs invalidos conhecidos
    if (cnpj == "00000000000000" ||
        cnpj == "11111111111111" ||
        cnpj == "22222222222222" ||
        cnpj == "33333333333333" ||
        cnpj == "44444444444444" ||
        cnpj == "55555555555555" ||
        cnpj == "66666666666666" ||
        cnpj == "77777777777777" ||
        cnpj == "88888888888888" ||
        cnpj == "99999999999999")
        valid = false;

    // Valida DVs
    tamanho = cnpj.length - 2
    numeros = cnpj.substring(0, tamanho);
    digitos = cnpj.substring(tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(0))
        valid = false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    for (i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--;
        if (pos < 2)
            pos = 9;
    }
    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
    if (resultado != digitos.charAt(1))
        valid = false;

    if (valid) {
        cnpjError.style.display = "none"
        submit.style.cursor = "pointer"
        submit.removeAttribute("disabled")
    } else {
        cnpjError.style.display = "block"
        submit.style.cursor = "not-allowed"
        submit.setAttribute("disabled", "disabled")
    }
}

function nextForm1() {
    const lojaFields = document.querySelector('.fields-loja');
    const proprietarioFields = document.querySelector('.fields-proprietario');
    const btnNext1 = document.getElementById('btnNextFormulario1');
    const btnNext2 = document.getElementById('btnNextFormulario2');
    const step1 = document.querySelector('.step-1');
    const step2 = document.querySelector('.step-2');

    lojaFields.classList.add('active');

    btnNext1.addEventListener('click', function () {
        if (lojaFields.classList.contains('active')) {
            if (validateFields(lojaFields)) {
                lojaFields.classList.remove('active');
                proprietarioFields.classList.add('active');
                btnNext1.style.display = 'none';
                btnNext2.style.display = 'block';
                step1.style.display = 'none';
                step2.style.display = 'block';
            } else {
                alert('Por favor, preencha todos os campos obrigatórios.');
            }
        }
    });
}

function nextForm2() {
    const proprietarioFields = document.querySelector('.fields-proprietario');
    const lojaFields = document.querySelector('.fields-loja');
    const btnNext2 = document.getElementById('btnNextFormulario2');
    const btnSubmit = document.getElementById('btnEnviarFormulario');

    btnNext2.addEventListener('click', function () {
        if (proprietarioFields.classList.contains('active')) {
            if (validateFields(proprietarioFields)) {
                btnNext2.style.display = 'none';
                lojaFields.classList.add('active');
                btnSubmit.style.display = 'block';
            }
        }
    });
}

function handleMsgSubmit() {
    const blockMsg = document.querySelector('.final-msg');
    const proprietarioFields = document.querySelector('.fields-proprietario');
    const lojaFields = document.querySelector('.fields-loja');
    const btnNext2 = document.getElementById('btnNextFormulario2');
    const step2 = document.querySelector('.step-2');
    const step3 = document.querySelector('.step-3');
    const btnOk = document.querySelector('.btn-voltar');

    proprietarioFields.classList.remove('active');
    lojaFields.classList.remove('active');
    blockMsg.style.display = 'block';
    btnNext2.style.display = 'none';
    step2.style.display = 'none';
    step3.style.display = 'block';
    btnOk.style.display = 'block';
}

function validateFields(section) {
    let isValid = true;
    const inputs = section.querySelectorAll('input[required]');
    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
        }
    });
    return isValid;
}

function mascaraTelefone(input) {
    let telefone = input.value;
    telefone = telefone.replace(/\D/g, ""); // Remove caracteres não numéricos
    telefone = telefone.replace(/^(\d{2})(\d)/g, "($1) $2"); // Adiciona parênteses em torno dos dois primeiros dígitos
    telefone = telefone.replace(/(\d)(\d{4})$/, "$1 $2"); // Adiciona espaço entre o quinto e sexto dígitos
    telefone = telefone.replace(/(\d{4})(\d{4})$/, "$1-$2"); // Adiciona hífen entre o nono e décimo dígitos
    input.value = telefone;
}

function validarEmail(input) {
    const email = input.value;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expressão regular para validar o formato do e-mail
    if (!regex.test(email)) {
        input.setCustomValidity("Por favor, insira um endereço de e-mail válido.");
    } else {
        input.setCustomValidity(""); // Campo válido
    }
}
