(() => {
    const popup = document.getElementById("abc-fale-especialista");

    if (!popup) {
        return;
    }

    const AUTO_OPEN_DELAY_MS = 12000;
    const shouldShowPopup = document.body.dataset.specialistPopup === "true";

    if (!shouldShowPopup) {
        return;
    }

    const openPopup = () => popup.classList.add("abc-fale-especialista-open");
    const closePopup = () => popup.classList.remove("abc-fale-especialista-open");
    const dismissButton = popup.querySelector("[data-specialist-dismiss]");

    const scheduleOpen = () => {
        window.setTimeout(openPopup, AUTO_OPEN_DELAY_MS);
    };

    if (document.readyState === "complete") {
        scheduleOpen();
    } else {
        window.addEventListener("load", scheduleOpen, { once: true });
    }

    if (dismissButton) {
        dismissButton.addEventListener("click", closePopup);
    }
})();
