/**
 * Fetches and renders shipping quotes when the form is submitted.
 * @param {Event} e - The event.
 * @param {string} productVariantId - The product variant ID to be quoted.
 */
function parsePickupOpeningRange(rangeText) {
  if (!rangeText) return null;

  const normalizedRange = String(rangeText).trim();
  if (!normalizedRange || normalizedRange.toLowerCase() === "fechado") return null;

  const timeRange = normalizedRange.split(" ");
  if (timeRange.length < 3) return null;

  return {
    openingTime: timeRange[0],
    closingTime: timeRange[2],
  };
}

function getPickupDayRange(card, dayIndex) {
  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return (card.dataset[dayKeys[dayIndex]] || "").trim();
}

function getPickupWeekdayInfo(dayIndex) {
  const weekdayInfo = [
    { article: "no", label: "domingo" },
    { article: "na", label: "segunda-feira" },
    { article: "na", label: "terça-feira" },
    { article: "na", label: "quarta-feira" },
    { article: "na", label: "quinta-feira" },
    { article: "na", label: "sexta-feira" },
    { article: "no", label: "sábado" },
  ];

  return weekdayInfo[dayIndex] || { article: "na", label: "" };
}

function isStoreOpen(currentHour, currentMinutes, openingTime, closingTime) {
  const openingHour = Number(openingTime.split(":")[0]);
  const openingMinutes = Number(openingTime.split(":")[1]);
  const closingHour = Number(closingTime.split(":")[0]);
  const closingMinutes = Number(closingTime.split(":")[1]);

  let isOpen = false;

  if (currentHour === openingHour && currentMinutes >= openingMinutes) {
    isOpen = true;
  } else if (currentHour > openingHour) {
    isOpen = true;
  }

  if (currentHour === closingHour && currentMinutes > closingMinutes) {
    isOpen = false;
  } else if (currentHour > closingHour) {
    isOpen = false;
  }

  return isOpen;
}

function getNextPickupOpeningSchedule(card, currentDay) {
  for (let offset = 1; offset <= 7; offset += 1) {
    const dayIndex = (currentDay + offset) % 7;
    const rangeText = getPickupDayRange(card, dayIndex);
    const parsedRange = parsePickupOpeningRange(rangeText);

    if (parsedRange) {
      return {
        dayIndex,
        openingTime: parsedRange.openingTime,
      };
    }
  }

  return null;
}

function buildPickupDateTime(baseDate, timeText) {
  const [hoursText, minutesText] = String(timeText).split(":");
  const dateTime = new Date(baseDate);

  dateTime.setHours(Number(hoursText), Number(minutesText), 0, 0);

  return dateTime;
}

function formatMinutesRemaining(totalMinutes) {
  const safeMinutes = Math.max(0, totalMinutes);
  if (safeMinutes <= 1) {
    return "Fecha em instantes";
  }

  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  const parts = [];

  if (hours > 0) {
    parts.push(`${hours}h`);
  }

  if (minutes > 0) {
    parts.push(`${minutes}min`);
  }

  return `Faltam ${parts.join(" e ")} para fechar`;
}

function buildInvalidCepMessage() {
  return `
    <div class="product-shipping__error" role="status" aria-live="polite">
      <span class="product-shipping__error-icon" aria-hidden="true">😕</span>
      <span class="product-shipping__error-copy">
        <strong>Não conseguimos localizar esse CEP</strong>
        <span>Confere o número e tenta de novo para ver as opções de frete.</span>
      </span>
    </div>
  `;
}

function buildPickupClosingCountdown(currentTime, closingTime) {
  const closingDate = buildPickupDateTime(currentTime, closingTime);
  const minutesRemaining = Math.ceil((closingDate - currentTime) / 60000);

  return formatMinutesRemaining(minutesRemaining);
}

function getPickupCountdownMood(currentTime, openingTime, closingTime) {
  const openingDate = buildPickupDateTime(currentTime, openingTime);
  let closingDate = buildPickupDateTime(currentTime, closingTime);

  if (closingDate <= openingDate) {
    closingDate.setDate(closingDate.getDate() + 1);
  }

  const totalMinutes = Math.max(1, Math.ceil((closingDate - openingDate) / 60000));
  const minutesRemaining = Math.max(0, Math.ceil((closingDate - currentTime) / 60000));
  const remainingRatio = minutesRemaining / totalMinutes;

  if (remainingRatio <= 0.25) {
    return {
      emoji: "😓",
      phase: "red",
    };
  }

  if (remainingRatio <= 0.6) {
    return {
      emoji: "🫡",
      phase: "gold",
    };
  }

  return {
    emoji: "😎",
    phase: "green",
  };
}

function updatePickupStoreStatus(card) {
  const statusEl = card.querySelector("[data-pickup-status]");
  const statusLabelEl =
    card.querySelector("[data-pickup-status-label]") ||
    card.querySelector(".product-shipping__pickup-status-label");
  const statusNoteEl = card.querySelector("[data-pickup-status-note]");
  const hoursValueEl = card.querySelector("[data-pickup-hours-value]");
  const hoursEl = card.querySelector("[data-pickup-hours]");

  if (!statusEl || !statusLabelEl || !statusNoteEl) return;

  const currentTime = new Date();
  const currentDay = currentTime.getDay();
  const currentHour = currentTime.getHours();
  const currentMinutes = currentTime.getMinutes();
  const currentRange = getPickupDayRange(card, currentDay);
  const parsedRange = parsePickupOpeningRange(currentRange);

  if (!currentRange) {
    statusEl.style.display = "none";
    statusNoteEl.style.display = "none";
    if (hoursValueEl) hoursValueEl.textContent = "Horário não informado";
    if (hoursEl) hoursEl.hidden = false;
    return;
  }

  statusEl.style.removeProperty("display");
  statusNoteEl.style.removeProperty("display");

  let isOpen = false;
  let statusNote = "😓 Fechado";
  statusNoteEl.classList.remove("phase-green", "phase-gold", "phase-red");

  if (parsedRange) {
    if (isStoreOpen(currentHour, currentMinutes, parsedRange.openingTime, parsedRange.closingTime)) {
      isOpen = true;
      const countdownMood = getPickupCountdownMood(
        currentTime,
        parsedRange.openingTime,
        parsedRange.closingTime
      );
      statusNote = `${countdownMood.emoji} ${buildPickupClosingCountdown(
        currentTime,
        parsedRange.closingTime
      )}`;
      statusNoteEl.classList.add(`phase-${countdownMood.phase}`);
    } else {
      const openingHour = Number(parsedRange.openingTime.split(":")[0]);
      const openingMinutes = Number(parsedRange.openingTime.split(":")[1]);

      if (currentHour < openingHour || (currentHour === openingHour && currentMinutes < openingMinutes)) {
        statusNote = `Abre hoje às ${parsedRange.openingTime}`;
      } else {
        const nextOpeningSchedule = getNextPickupOpeningSchedule(card, currentDay);
        if (nextOpeningSchedule) {
          const weekdayInfo = getPickupWeekdayInfo(nextOpeningSchedule.dayIndex);
          statusNote = `Abre ${weekdayInfo.article} ${weekdayInfo.label} às ${nextOpeningSchedule.openingTime}`;
        } else {
          statusNote = "😓 Fechado";
        }
      }
    }
  } else {
    const nextOpeningSchedule = getNextPickupOpeningSchedule(card, currentDay);
    if (nextOpeningSchedule) {
      const weekdayInfo = getPickupWeekdayInfo(nextOpeningSchedule.dayIndex);
      statusNote = `Abre ${weekdayInfo.article} ${weekdayInfo.label} às ${nextOpeningSchedule.openingTime}`;
    } else {
      statusNote = "😓 Fechado";
    }
  }

  statusEl.classList.toggle("is-open", isOpen);
  statusEl.classList.toggle("is-closed", !isOpen);
  statusEl.classList.toggle("closed", !isOpen);
  statusNoteEl.classList.toggle("is-open", isOpen);
  statusNoteEl.classList.toggle("is-closed", !isOpen);
  statusLabelEl.textContent = isOpen ? "Aberto" : "Fechado";
  statusNoteEl.textContent = statusNote;

  if (hoursValueEl) {
    hoursValueEl.textContent = currentRange || "";
  }

  if (hoursEl) {
    hoursEl.hidden = !currentRange;
  }
}

function initializePickupStoreStatuses(container = document) {
  if (!container?.querySelectorAll) return;

  container.querySelectorAll(".product-shipping__pickup-option").forEach((card) => {
    updatePickupStoreStatus(card);
  });
}

async function ShippingQuoteSubmit(e, productVariantId = null, checkoutId) {
  e.preventDefault();
  if (productVariantId) {
    const responseEl = document.getElementById(
      "shipping-quotes-snippet-div-" + productVariantId
    );
    if (!responseEl) return;
    responseEl.innerHTML = `<img style="display: block; margin: auto;" src="/localstatic/img/my-loader.svg?theme=local&v=" alt="">`;

    // if (validateShippingAddress()) {
    try {
      const cepEl = document.getElementById("shipping-quote-cep");
      if (!cepEl) {
        responseEl.innerHTML =
          '<span class="product-shipping__error">Campo de CEP não encontrado.</span>';
        return;
      }
      const cep = cepEl.value;
      const quantityEl = document.getElementById("selected-quantity");
      const quantity = quantityEl ? Number(quantityEl.value || 1) : 1;
      if (typeof client === "undefined" || !client?.snippet?.render) {
        responseEl.innerHTML =
          '<span class="product-shipping__error">Serviço indisponível no momento.</span>';
        return;
      }

      let variables = {
        cep,
        productVariantId: Number(productVariantId),
        quantity,
      };

      let snippetResponse = await client.snippet.render(
        "product_shipping_quotes_snippet.html",
        "SnippetQueries/shipping_quotes.graphql",
        variables
      );

      if (!snippetResponse || !String(snippetResponse).trim()) {
        snippetResponse = buildInvalidCepMessage();
      }

      responseEl.innerHTML = snippetResponse;
      initializePickupStoreStatuses(responseEl);
    } catch (error) {
      console.error(error);
    }
    // } else {
    //     openShippingModal()
    // }
  } else {
    document.getElementById(
      "minicart-shipping-quotes-snippet-div"
    ).innerHTML = `<img style="display: block; margin: auto;" src="/localstatic/img/my-loader.svg?theme=local&v=" alt="">`;

    try {
      const cep = document.getElementById("minicart-shipping-quote-cep").value;

      let variables = {
        cep,
        checkoutId,
      };

      let snippetResponse = await client.snippet.render(
        "mini_cart_shipping_quotes_snippet.html",
        "SnippetQueries/shipping_quotes.graphql",
        variables
      );

      if (!snippetResponse || !String(snippetResponse).trim()) {
        snippetResponse = buildInvalidCepMessage();
      }

      document.getElementById(
        "minicart-shipping-quotes-snippet-div"
      ).innerHTML = snippetResponse;
    } catch (error) {
      console.error(error);
    }
  }
}

/**
 * Applies a mask to the CEP field.
 * @param {string} t - CEP input value.
 */
function cepMask(t, e) {
  const mask = "#####-###";
  let value = t.value;
  let i = value.length;
  let out = mask.substring(1, 0);
  let text = mask.substring(i);
  const evt = e || window.event;
  const key = evt?.key || "";

  if (["Enter", "Tab", "Backspace", "Delete", "ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) {
    return;
  }

  if (evt && isNaN(Number(key))) evt.preventDefault();

  if (text.substring(0, 1) != out) t.value += text.substring(0, 1);
}

function validateShippingAddress() {
  const cep = document.getElementById("shipping-quote-cep").value,
    partnerCep = client.partner.getCep();

  if (cep == partnerCep) {
    return true;
  }

  return false;
}

function closeShippingModal(e, element = null) {
  if (e.target == e.currentTarget) {
    document.getElementById("shipping-invalid").classList.remove("visible");
    setTimeout(() => {
      element.style.display = "none";
    }, 200);
  }
}

function openShippingModal() {
  let cep = document.getElementById("shipping-quote-cep").value;
  let partnerCep = client.partner.getCep();

  document.querySelector("[id^='shipping-quotes-snippet-div']").innerHTML = "";

  if (cep == "" || partnerCep == "") return false;

  setTimeout(() => {
    document.getElementById("shipping-invalid").style.display = "block";
  }, 200);
  document.getElementById("shipping-invalid").classList.add("visible");

  document.getElementById(
    "shipping-partner_cep"
  ).innerHTML = `${partnerCep} (${checkZipAddress(
    parseInt(partnerCep.replace("-", ""))
  )})`;
  document.getElementById(
    "shipping-cep"
  ).innerHTML = `${cep} (${checkZipAddress(parseInt(cep.replace("-", "")))})`;
}

function changeParterByRegion() {
  let cep = document.getElementById("shipping-quote-cep").value;

  if (cep) changeRegionalOffers(cep);
}

initializePickupStoreStatuses();
