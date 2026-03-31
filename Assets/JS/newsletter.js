
/**
 * Sends the configured newsletter from the provided informtation on page
 */
async function newsletterSubmit(form) {
  let newsletterAlert = form.querySelector(".newsletter__alert");
  const nameElement = form.querySelector(".newsletter-name");
  const emailElement = form.querySelector(".newsletter-email");
  const nameValue = nameElement.value
  const emailValue = emailElement.value


  const input = {
    name: nameElement.value,
    email: emailElement.value,    
  };

  let response = await client.newsletter.create(input);

  if (response) {
    showNewsletterAlert(newsletterAlert);
    if (typeof sendSharpSpring === "function") {
      sendSharpSpring({nome: nameElement.value, email: emailElement.value, telefone: ''}, "newsletter");
    }
  }
  else {
    showNewsletterError(newsletterAlert);
  }

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
 * Show an alert message with 5s duration
 */
function showNewsletterError(newsletterAlert) {
  newsletterAlert.innerHTML = 'Falha ao realizar cadastro';
  setTimeout(function () {
    hideNewsletterAlert(newsletterAlert);
  }, 5000);
}

/**
 * Show an alert message with 5s duration
 */
function showNewsletterAlert(newsletterAlert) {
  newsletterAlert.innerHTML = 'Cadastro realizado com sucesso!';
  setTimeout(function () {
    hideNewsletterAlert(newsletterAlert);
  }, 5000);
}

/**
 * Newsletter checkbox toggle
 */
function initNewsletterLightboxControls() {
  const newsletterLightbox = document.getElementById("newsletter-lightbox");

  if (!newsletterLightbox || newsletterLightbox.dataset.newsletterInitialized === "true") {
    return;
  }

  const newsletterCheckbox = newsletterLightbox.querySelector(".checkbox__input");
  const newsletterButton = newsletterLightbox.querySelector(".newsletter__button");

  if (!newsletterCheckbox || !newsletterButton) {
    return;
  }

  newsletterCheckbox.addEventListener("change", function () {
    newsletterButton.disabled = newsletterButton.disabled ? false : true;
  });

  newsletterLightbox.dataset.newsletterInitialized = "true";
}

initNewsletterLightboxControls();
window.addEventListener("lazyContentHydrated", initNewsletterLightboxControls);
