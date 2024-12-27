/**
 * Sends the configured newsletter from the provided informtation on page
 */
async function newsletterSubmit(e) {
    e.preventDefault();

    const nameElement = document.getElementById("newsletter-form-name");
    const emailElement = document.getElementById("newsletter-form-email");

    const elements = document.querySelectorAll('[id^="newsletter-form-"]');
    const informationGroups = [];

    elements.forEach(el => {
        if (el.id == "newsletter-form-name" || el.id == "newsletter-form-email"){
            return;
        }

        const informationGroup = {
            id: el.getAttribute("value-id"),
            value: el.value
        };

        informationGroups.push(informationGroup);
    });

    const input = {
        name: nameElement.value,
        email: emailElement.value,
        informationGroupValues: informationGroups
    };

    await client.newsletter.create(input);
    
    showNewsletterAlert();
    
    elements.forEach(el => {
        el.value = "";
    });
}

/**
 * Show an alert message with 2s duration
 */
function showNewsletterAlert() {
    showOverlay('Cadastro realizado com sucesso!', '');
}
