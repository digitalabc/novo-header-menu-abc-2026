window.addEventListener("load", newsletterSetup, false);
let newsletterAlert = "";

/**
 * Saves the alert element in the scope of the js
 */
function newsletterSetup() {
    newsletterAlert = document.getElementById("alert-newsletter");
}

/**
 * Sends the configured newsletter from the provided informtation on page
 */
async function newsletterSubmit() {
    const nameElement = document.getElementById("newsletter-form-name");
    const emailElement = document.getElementById("newsletter-form-email");

    const input = {
        name: nameElement.value,
        email: emailElement.value,
    };

    await client.newsletter.create(input);

    showNewsletterAlert();
    nameElement.value = "";
    emailElement.value = "";
}

/**
 * Removes the div content
 */
function hideNewsletterAlert() {
    newsletterAlert.innerHTML = "";
}

/**
 * Show an alert message with 2s duration
 */
function showNewsletterAlert() {
    newsletterAlert.innerHTML =
        '<div class="alert alert-success col-6" role="alert" style="visibility: visible; position: relative; text-align: center; margin-bottom: auto; z-index: 1;">Cadastro realizado com sucesso!</div>';
    setTimeout(hideNewsletterAlert, 2000);
}
