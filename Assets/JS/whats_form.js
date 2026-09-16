var site_title = "ABC da Construção";
var hello_message =
  "Olá! Tudo bem? Fale com nosso time de consultores via whatsapp e faça seu orçamento.";

var FORM_CLOSE_ANIMATION_MS = 260;

var wppPendingUrl = "";

function preWhatsappHandler(url) {
  wppPendingUrl = url || "https://api.whatsapp.com/send?phone=553191055920&text=%5BABCZAP%5D%20Ol%C3%A1!%20Acessei%20o%20site%20da%20ABC%20da%20Constru%C3%A7%C3%A3o%20e%20gostaria%20de%20informa%C3%A7%C3%B5es";
  var formWpp = document.querySelector("#form-pre-whatsapp");
  if (!formWpp) return;
  formWpp.dataset.pendingUrl = wppPendingUrl;
}

function handleFormWppSubmit(e) {
  e.preventDefault();
  var formWpp = document.querySelector("#form-pre-whatsapp");
  if (!formWpp) return;
  var url = formWpp.dataset.pendingUrl || wppPendingUrl;
  var formWppSubmit = formWpp.querySelector(".form-wpp-submit");
  var dataFormWpp = [];

  var formWppName = (formWpp.querySelector(".form-wpp-name").value || "").trim();
  var formWppEmail = (formWpp.querySelector(".form-wpp-email").value || "").trim();
  var formWppPhone = formWpp.querySelector(".form-wpp-phone").value;
  var phoneDigits = getPhoneDigits(formWppPhone);
  if (
    formWppName.length >= 2 &&
    isValidEmail(formWppEmail) &&
    phoneDigits.length >= 11
  ) {
    dataFormWpp = {
      event_name: "whatsapp_form_send",
      event_params: {
        name: formWppName,
        email: formWppEmail,
        phone: formWppPhone,
        current_url: location.href,
        cookies: getCookie("mm_tracker"),
      },
    };

    if (typeof sendSharpSpring === "function") {
      sendSharpSpring(
        {
          nome: formWppName,
          email: formWppEmail,
          telefone: formWppPhone,
          current_url: location.href,
          cookies: getCookie("mm_tracker"),
          telefone: formWppPhone,
          firstSession: getCookie("FirstSession"),
          lastSession: getCookie("LastSession"),
        },
        "whats_form"
      );
    }

    var dataFormWppStr = JSON.stringify(dataFormWpp);

    jQuery.ajax({
      type: "POST",
      url: "https://gtm-mplx5hr-ntywn.uc.r.appspot.com",
      data: dataFormWppStr,
      dataType: "json",
      async: false,
      headers: {
        "X-Gtm-Server-Preview":
          "ZW52LTV8aG96Yjd6WHAyTTl1VFNZb1dCaUktQXwxOGExOWJlYjBlZjY3MGNiMjU0MjM=",
      },
    });

    dataLayer.push({
      event: "whatsapp_form_send",
    });

    window.open(url, "_blank");
    animateWhatsAppFormOut(formWpp, function () {
      var wrapper = document.querySelector("#mm-whatsapp-wrapper");
      if (wrapper) wrapper.style.display = "flex";
    });
  } else {
    formWpp.querySelector(".form-wpp-error").style.display = "block";
  }
}

function mask(o, f) {
  setTimeout(function () {
    var v = mphone(o.value);
    if (v != o.value) {
      o.value = v;
    }
  }, 1);
}

function handlePhoneKeydown(e) {
  var input = e.target;
  var key = e.key;
  var val = input.value;
  var start = input.selectionStart;
  var end = input.selectionEnd;
  var formWpp = document.querySelector("#form-pre-whatsapp");

  if (key === "Backspace" && start === end && start > 0) {
    var charBefore = val.charAt(start - 1);
    if (charBefore === "-" || charBefore === " " || charBefore === ")") {
      e.preventDefault();
      var digits = val.replace(/\D/g, "");
      if (digits.length > 0) {
        digits = digits.substring(0, digits.length - 1);
        input.value = mphone(digits);
        input.setSelectionRange(input.value.length, input.value.length);
        if (formWpp) updateSubmitState(formWpp);
      }
    }
  } else if (key === "Delete" && start === end && start < val.length) {
    var charAt = val.charAt(start);
    if (charAt === "-" || charAt === " " || charAt === "(") {
      e.preventDefault();
      var digits = val.replace(/\D/g, "");
      var digitIndex = 0;
      for (var i = 0; i < val.length && digitIndex < digits.length; i++) {
        if (i === start) break;
        if (/\d/.test(val.charAt(i))) digitIndex++;
      }
      if (digitIndex < digits.length) {
        digits = digits.substring(0, digitIndex) + digits.substring(digitIndex + 1);
        input.value = mphone(digits);
        input.setSelectionRange(start, start);
        if (formWpp) updateSubmitState(formWpp);
      }
    }
  }
}

function mphone(v) {
  var r = v.replace(/\D/g, "");
  r = r.replace(/^0/, "");
  if (r.length > 11) {
    r = r.substring(0, 11);
  }
  if (r.length > 10) {
    r = r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
  } else if (r.length > 5) {
    r = r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
  } else if (r.length > 2) {
    r = r.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
  } else {
    r = r.replace(/^(\d*)/, "($1");
  }
  return r;
}

function getPhoneDigits(phone) {
  return (phone || "").replace(/\D/g, "");
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "");
}

function isValidForm(formWpp) {
  var name = (formWpp.querySelector(".form-wpp-name").value || "").trim();
  var email = formWpp.querySelector(".form-wpp-email").value || "";
  var phone = getPhoneDigits(formWpp.querySelector(".form-wpp-phone").value);
  return name.length >= 2 && isValidEmail(email) && phone.length >= 11;
}

function updateSubmitState(formWpp) {
  var btn = formWpp.querySelector(".form-wpp-submit");
  if (btn) {
    btn.disabled = !isValidForm(formWpp);
  }
}

function animateWhatsAppFormIn(formWpp) {
  if (!formWpp) return;

  if (formWpp._hideTimer) {
    window.clearTimeout(formWpp._hideTimer);
    formWpp._hideTimer = null;
  }

  formWpp.style.display = "flex";
  formWpp.classList.remove("form-pre-whatsapp--closing");
  formWpp.classList.remove("form-pre-whatsapp--visible");
  formWpp.getBoundingClientRect();

  window.requestAnimationFrame(function () {
    formWpp.classList.add("form-pre-whatsapp--visible");
  });

  updateSubmitState(formWpp);
}

function animateWhatsAppFormOut(formWpp, onHidden) {
  if (!formWpp) {
    if (typeof onHidden === "function") onHidden();
    return;
  }

  if (formWpp._hideTimer) {
    window.clearTimeout(formWpp._hideTimer);
  }

  formWpp.classList.remove("form-pre-whatsapp--visible");
  formWpp.classList.add("form-pre-whatsapp--closing");
  formWpp._hideTimer = window.setTimeout(function () {
    formWpp.classList.remove("form-pre-whatsapp--closing");
    formWpp.style.display = "none";
    formWpp._hideTimer = null;

    if (typeof onHidden === "function") {
      onHidden();
    }
  }, FORM_CLOSE_ANIMATION_MS);
}

function generateChildInput(parent, type, className, placeholder) {
  var input = document.createElement("input");
  input.setAttribute("type", type);
  input.setAttribute("class", "form-wpp-input " + className);
  input.setAttribute("placeholder", placeholder);

  if (type == "submit") {
    input.setAttribute("value", "Iniciar conversa");
  }

  if (type == "phone") {
    input.setAttribute("onkeypress", "mask(this, mphone)");
    input.setAttribute("onkeyup", "mask(this, mphone)");
    input.setAttribute("oninput", "mask(this, mphone)");
  }

  parent.appendChild(input);
}

function showWhatsAppForm() {
  var existingForm = document.querySelector("#form-pre-whatsapp");
  if (existingForm) {
    animateWhatsAppFormIn(existingForm);
    return;
  }

  var formBox = document.createElement("div");
  formBox.setAttribute("id", "form-pre-whatsapp");
  formBox.setAttribute("class", "form-pre-whatsapp");

  var formHeader = document.createElement("div");
  formHeader.setAttribute("class", "form-pre-whatsapp__header");

  var formHeaderClose = document.createElement("button");
  formHeaderClose.setAttribute("type", "button");
  formHeaderClose.setAttribute("class", "form-pre-whatsapp__close");
  formHeaderClose.setAttribute("aria-label", "Fechar");
  formHeaderClose.innerHTML = "×";
  formHeaderClose.addEventListener("click", function () {
    animateWhatsAppFormOut(formBox, function () {
      var wrapper = document.querySelector("#mm-whatsapp-wrapper");
      if (wrapper) wrapper.style.display = "flex";
    });
  });

  var visibleLogos = document.querySelectorAll(".navbar-brand img, .navbar__logo img");
  var logoImg = null;
  for (var i = 0; i < visibleLogos.length; i++) {
    var el = visibleLogos[i];
    if (!el.hasAttribute("hidden") && el.style.display !== "none" && getComputedStyle(el).display !== "none") {
      logoImg = el;
      break;
    }
  }
  if (!logoImg) logoImg = visibleLogos[visibleLogos.length - 1] || null;
  var logoUrl = logoImg ? logoImg.src : "https://abcdaconstrucao.fbitsstatic.net/sf/img/header/logo-abc.svg";

  var formHeaderLeft = document.createElement("div");
  formHeaderLeft.setAttribute("class", "form-pre-whatsapp__avatar");
  var logoEl = document.createElement("img");
  logoEl.src = logoUrl;
  logoEl.alt = site_title;
  logoEl.setAttribute("class", "form-pre-whatsapp__avatar-img");
  formHeaderLeft.appendChild(logoEl);

  var formHeaderRight = document.createElement("div");
  formHeaderRight.setAttribute("class", "form-pre-whatsapp__header-info");
  formHeaderRight.innerHTML =
    '<span class="form-pre-whatsapp__title">' + site_title + '</span>' +
    '<span class="form-pre-whatsapp__status">online</span>';

  var formContent = document.createElement("div");
  formContent.setAttribute("class", "form-pre-whatsapp__body");

  var formHello = document.createElement("div");
  formHello.setAttribute("class", "form-pre-whatsapp__message");
  formHello.innerHTML = hello_message;

  var formError = document.createElement("div");
  formError.setAttribute("class", "form-pre-whatsapp__error form-wpp-error");
  formError.innerHTML =
    "Por favor, precisamos de seu <strong>Nome</strong>, <strong>E-mail</strong> e <strong>Telefone com DDD</strong> para prosseguir. 🙂";

  var form = document.createElement("form");
  form.setAttribute("id", "form-wpp");
  form.setAttribute("class", "form-pre-whatsapp__form");

  generateChildInput(form, "text", "form-wpp-name", "Seu Nome*");
  generateChildInput(form, "email", "form-wpp-email", "Seu Melhor E-mail*");
  generateChildInput(form, "phone", "form-wpp-phone", "Seu Telefone com DDD*");
  generateChildInput(form, "submit", "form-wpp-submit", "Iniciar Conversa");

  formHeader.appendChild(formHeaderLeft);
  formHeader.appendChild(formHeaderRight);
  formHeader.appendChild(formHeaderClose);
  formBox.appendChild(formHeader);
  formBox.appendChild(formContent);
  formContent.appendChild(formHello);
  formContent.appendChild(formError);
  formContent.appendChild(form);

  document.body.appendChild(formBox);

  var formWpp = document.querySelector("#form-pre-whatsapp");
  var submitBtn = formWpp.querySelector(".form-wpp-submit");
  submitBtn.disabled = true;

  ["input", "keyup", "change"].forEach(function (evt) {
    formWpp.addEventListener(evt, function () {
      updateSubmitState(formWpp);
    });
  });

  var phoneInput = formWpp.querySelector(".form-wpp-phone");
  if (phoneInput) {
    phoneInput.setAttribute("inputmode", "numeric");
    phoneInput.addEventListener("keydown", handlePhoneKeydown);
  }

  formWpp.querySelector("#form-wpp").addEventListener("submit", handleFormWppSubmit);

  animateWhatsAppFormIn(formBox);
}

function onLoadWppIcon() {
  try {
    if (document.getElementById("mm-whatsapp-wrapper")) {
      return;
    }

    var wppIconButtons = document.querySelector("#whatsapp");
    if (!wppIconButtons) return;
    var mmWppIcon = wppIconButtons.cloneNode(true);
    mmWppIcon.setAttribute("id", "mm-whatsapp");
    mmWppIcon.style.cursor = "pointer";
    mmWppIcon.style.filter = "none";

    var wrapper = document.createElement("div");
    wrapper.setAttribute("id", "mm-whatsapp-wrapper");
    wrapper.setAttribute("class", "mm-whatsapp-wrapper");
    wrapper.setAttribute("aria-label", "Falar com especialista via WhatsApp");

    var label = document.createElement("span");
    label.setAttribute("class", "mm-whatsapp-label");
    label.textContent = "Falar com especialista";

    wrapper.appendChild(label);
    wrapper.appendChild(mmWppIcon);

    wppIconButtons.remove();
    document.body.appendChild(wrapper);

    var wppApiButtons = document.querySelectorAll('a[href*="api.whatsapp"]');
    var wameButtons = document.querySelectorAll('a[href*="wa.me"]');
    var wppIconWrapper = document.querySelector("#mm-whatsapp-wrapper");
    var wppIconButton = document.querySelector("#mm-whatsapp");
    var wppButtons = Array.prototype.slice
      .call(wppApiButtons)
      .concat(Array.prototype.slice.call(wameButtons))
      .concat(wppIconWrapper);

    for (var i = 0; i < wppButtons.length; i++) {
      wppButtons[i].addEventListener("click", function (e) {
        var wppUrl = this.getAttribute("href");
        var wppDefault =
          "https://api.whatsapp.com/send?phone=553191055920&text=%5BABCZAP%5D%20Ol%C3%A1!%20Acessei%20o%20site%20da%20ABC%20da%20Constru%C3%A7%C3%A3o%20e%20gostaria%20de%20informa%C3%A7%C3%B5es";
        e.preventDefault();
        wppIconWrapper.style.display = "none";
        showWhatsAppForm();

        dataLayer.push({
          event: "whatsapp_form_click",
        });

        if (wppUrl) {
          preWhatsappHandler(wppUrl);
        } else {
          preWhatsappHandler(wppDefault);
        }
      });
    }
  } catch {
    console.log("Erro ao carregar icone de WhatsApp")
  }
}

if (document.readyState === "complete") {
  onLoadWppIcon();
} else {
  window.addEventListener("load", onLoadWppIcon, false);
}
