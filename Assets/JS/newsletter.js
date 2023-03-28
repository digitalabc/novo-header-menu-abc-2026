// window.addEventListener("load", newsletterSetup, false);

/**
 * Saves the alert element in the scope of the js
 */
// function newsletterSetup() {
//     newsletterAlert = document.getElementById("alert-newsletter");
// }

/**
 * Sends the configured newsletter from the provided informtation on page
 */
async function newsletterSubmit(form) {
    console.log(typeof(form))
    let newsletterAlert = form.querySelector(".newsletter__alert");
    const nameElement = form.querySelector(".newsletter-name");
    const emailElement = form.querySelector(".newsletter-email");

    const input = {
        name: nameElement.value,
        email: emailElement.value,
    };

    await client.newsletter.create(input);

    showNewsletterAlert(newsletterAlert);
    nameElement.value = "";
    emailElement.value = "";
}

/**
 * Removes the div content
 */
function hideNewsletterAlert(newsletterAlert) {
  newsletterAlert.innerHTML = "";
}

/**
 * Show an alert message with 2s duration
 */
function showNewsletterAlert(newsletterAlert) {
  newsletterAlert.innerHTML = 'Cadastro realizado com sucesso!';
  setTimeout(function() {
    hideNewsletterAlert(newsletterAlert);
  }, 2000);
}
