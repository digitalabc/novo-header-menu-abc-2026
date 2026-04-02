(() => {
  'use strict';

  const STORAGE_KEY = 'abc-newsletter-popup-state';
  const POPUP_OPEN_DELAY_MS = 2000;
  const WIDGET_AUTO_COLLAPSE_DELAY_MS = 2000;
  const FEEDBACK_AUTO_CLOSE_MS = 25000;
  const REGISTERED_STATE = 'registered';
  const WIDGET_STATE_EXPANDED = 'widget-expanded';
  const WIDGET_STATE_COLLAPSED = 'widget-collapsed';
  const WIDGET_STATE_HIDDEN = 'hidden';
  const POPUP_STATE_CLOSED = 'closed';
  const POPUP_STATE_OPEN = 'open';
  const POPUP_STATE_FEEDBACK_SUCCESS = 'feedback-success';
  const POPUP_STATE_FEEDBACK_ERROR = 'feedback-error';
  const CHECKOUT_CLASSES = ['bg-checkout', 'checkout-shipping', 'wake-cart-page', 'wake-confirmation'];
  const EMAIL_PATTERN = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

  const popup = document.getElementById('abc-newsletter-popup');
  const widget = document.getElementById('abc-newsletter-widget');

  if (!popup || !widget) {
    return;
  }

  if (CHECKOUT_CLASSES.some((className) => document.body.classList.contains(className))) {
    return;
  }

  if (window.__abcNewsletterPopupInitialized) {
    return;
  }

  window.__abcNewsletterPopupInitialized = true;

  const isHome = document.body.classList.contains('home');
  const form = popup.querySelector('#abc-newsletter-form');
  const dismissButton = popup.querySelector('[data-newsletter-dismiss]');
  const inlineMessage = popup.querySelector('.abc-popup-msg');
  const feedbackPopup = popup.querySelector('[data-feedback-popup]');
  const feedbackKicker = popup.querySelector('[data-feedback-kicker]');
  const feedbackTitle = popup.querySelector('[data-feedback-title]');
  const feedbackCopy = popup.querySelector('[data-feedback-copy]');
  const feedbackEmailStatus = popup.querySelector('[data-feedback-email-status]');
  const feedbackCloseButton = popup.querySelector('[data-feedback-close]');
  const nameElement = popup.querySelector('#abc-popup-input-nome');
  const surnameElement = popup.querySelector('#abc-popup-input-sobrenome');
  const emailElement = popup.querySelector('#abc-popup-input-email');
  const phoneElement = popup.querySelector('#abc-popup-input-telefone');
  const submitButton = popup.querySelector('.abc-popup-btn');
  const widgetOpenButton = widget.querySelector('[data-widget-open]');
  const widgetToggleButton = widget.querySelector('[data-widget-toggle]');
  const submitButtonDefaultLabel = submitButton ? submitButton.textContent.trim() : 'Quero meu cupom';
  const submitButtonLoadingLabel = 'Enviando...';

  if (form) {
    form.noValidate = true;
  }

  let popupOpenTimeoutId = null;
  let autoCloseTimeoutId = null;
  let widgetCollapseTimeoutId = null;

  const readPopupState = () => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) || '';
    } catch (error) {
      return '';
    }
  };

  const writePopupState = (state) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, state);
    } catch (error) {
      // Storage can be blocked; the popup still works without persistence.
    }
  };

  const getInitialWidgetState = (persistedState) => {
    if (persistedState === REGISTERED_STATE) {
      return WIDGET_STATE_HIDDEN;
    }

    if (persistedState === WIDGET_STATE_COLLAPSED || persistedState === WIDGET_STATE_EXPANDED) {
      return persistedState;
    }

    return WIDGET_STATE_EXPANDED;
  };

  const persistedState = readPopupState();
  const hasSavedWidgetPreference =
    persistedState === REGISTERED_STATE ||
    persistedState === WIDGET_STATE_COLLAPSED ||
    persistedState === WIDGET_STATE_EXPANDED;

  const state = {
    popupPhase: POPUP_STATE_CLOSED,
    widgetState: getInitialWidgetState(persistedState),
    widgetVisible: !isHome || persistedState !== '',
    registered: persistedState === REGISTERED_STATE,
    submitting: false,
    inlineMessage: '',
    inlineTone: 'error',
    feedback: null,
  };

  const clearPopupOpenTimeout = () => {
    if (popupOpenTimeoutId !== null) {
      window.clearTimeout(popupOpenTimeoutId);
      popupOpenTimeoutId = null;
    }
  };

  const clearAutoCloseTimeout = () => {
    if (autoCloseTimeoutId !== null) {
      window.clearTimeout(autoCloseTimeoutId);
      autoCloseTimeoutId = null;
    }
  };

  const clearWidgetCollapseTimeout = () => {
    if (widgetCollapseTimeoutId !== null) {
      window.clearTimeout(widgetCollapseTimeoutId);
      widgetCollapseTimeoutId = null;
    }
  };

  const setScrollLock = (locked) => {
    document.documentElement.classList.toggle('abc-newsletter-popup-lock', locked);
    document.body.classList.toggle('abc-newsletter-popup-lock', locked);
  };

  const normalizeName = (value) => String(value || '').replace(/\s+/g, ' ').trim();
  const normalizeEmail = (value) => String(value || '').replace(/\s+/g, '').trim();
  const normalizePhone = (value) => String(value || '').replace(/\D/g, '').trim().slice(0, 11);

  const formatBrazilianMobilePhone = (value) => {
    const digits = normalizePhone(value);

    if (!digits) {
      return '';
    }

    if (digits.length <= 2) {
      return `(${digits}`;
    }

    if (digits.length <= 7) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    }

    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const isValidName = (value) => {
    const normalizedValue = normalizeName(value);
    return normalizedValue.length >= 2 && normalizedValue.length <= 50;
  };

  const isValidEmail = (value) => {
    const normalizedValue = normalizeEmail(value);
    return normalizedValue.length > 0 && normalizedValue.length <= 70 && EMAIL_PATTERN.test(normalizedValue);
  };

  const isValidPhone = (value) => normalizePhone(value).length === 11;

  const getSubmissionData = () => {
    const nameValue = normalizeName(nameElement ? nameElement.value : '');
    const surnameValue = normalizeName(surnameElement ? surnameElement.value : '');
    const fullNameValue = normalizeName([nameValue, surnameValue].filter(Boolean).join(' '));
    const emailValue = normalizeEmail(emailElement ? emailElement.value : '');
    const phoneDigits = normalizePhone(phoneElement ? phoneElement.value : '');
    const phoneValue = phoneDigits.length === 11 && phoneElement ? formatBrazilianMobilePhone(phoneElement.value) : '';

    return {
      fullNameValue,
      emailValue,
      phoneValue,
    };
  };

  const getSubmissionValidation = () => {
    if (!nameElement || !surnameElement || !emailElement) {
      return {
        valid: false,
        message: 'Formulário indisponível.',
        focusElement: null,
      };
    }

    const nameValue = normalizeName(nameElement.value);
    if (!nameValue) {
      return {
        valid: false,
        message: 'Favor digitar o nome.',
        focusElement: nameElement,
      };
    }

    if (nameValue.length < 2) {
      return {
        valid: false,
        message: 'Nome deve conter pelo menos 2 caracteres.',
        focusElement: nameElement,
      };
    }

    if (nameValue.length > 50) {
      return {
        valid: false,
        message: 'Nome deve conter menos que 50 caracteres.',
        focusElement: nameElement,
      };
    }

    const surnameValue = normalizeName(surnameElement.value);
    if (!surnameValue) {
      return {
        valid: false,
        message: 'Favor digitar o sobrenome.',
        focusElement: surnameElement,
      };
    }

    if (surnameValue.length < 2) {
      return {
        valid: false,
        message: 'Sobrenome deve conter pelo menos 2 caracteres.',
        focusElement: surnameElement,
      };
    }

    if (surnameValue.length > 50) {
      return {
        valid: false,
        message: 'Sobrenome deve conter menos que 50 caracteres.',
        focusElement: surnameElement,
      };
    }

    const emailValue = normalizeEmail(emailElement.value);
    if (!emailValue) {
      return {
        valid: false,
        message: 'Favor digitar o E-mail.',
        focusElement: emailElement,
      };
    }

    if (emailValue.length > 70) {
      return {
        valid: false,
        message: 'E-mail deve conter menos que 70 caracteres.',
        focusElement: emailElement,
      };
    }

    if (!EMAIL_PATTERN.test(emailValue)) {
      return {
        valid: false,
        message: 'E-mail inválido.',
        focusElement: emailElement,
      };
    }

    return {
      valid: true,
      message: '',
      focusElement: null,
    };
  };

  const syncFieldCompleteState = (field, isComplete) => {
    if (!field) {
      return;
    }

    field.classList.toggle('is-complete', Boolean(isComplete));
  };

  const syncWidgetToggle = (widgetState) => {
    if (!widgetToggleButton) {
      return;
    }

    const isExpanded = widgetState === WIDGET_STATE_EXPANDED;
    widgetToggleButton.setAttribute('aria-expanded', String(isExpanded));
    widgetToggleButton.setAttribute('aria-label', isExpanded ? 'Recolher lembrete' : 'Expandir lembrete');

    const arrowExpanded = widgetToggleButton.querySelector('[data-arrow-expanded]');
    const arrowCollapsed = widgetToggleButton.querySelector('[data-arrow-collapsed]');

    if (arrowExpanded) {
      arrowExpanded.style.display = isExpanded ? '' : 'none';
    }

    if (arrowCollapsed) {
      arrowCollapsed.style.display = isExpanded ? 'none' : '';
    }
  };

  const hideWidget = () => {
    widget.classList.remove('abc-newsletter-widget-open');
    widget.classList.remove('abc-newsletter-widget-expanded');
    widget.classList.remove('abc-newsletter-widget-collapsed');
    widget.dataset.widgetState = WIDGET_STATE_HIDDEN;
    widget.setAttribute('aria-hidden', 'true');
  };

  const getFeedbackState = (tone) => {
    if (tone === 'success') {
      return {
        tone: 'success',
        kicker: 'Cupom no seu e-mail',
        title: 'Cadastro realizado com sucesso!',
        copy: '',
      };
    }

    return {
      tone: 'error',
      kicker: 'Atenção',
      title: 'Falha ao realizar cadastro',
      copy: 'Tente novamente em alguns instantes.',
    };
  };

  const renderInlineMessage = () => {
    if (!inlineMessage) {
      return;
    }

    if (!state.inlineMessage) {
      inlineMessage.textContent = '';
      inlineMessage.removeAttribute('style');
      return;
    }

    inlineMessage.textContent = state.inlineMessage;
    inlineMessage.style.display = 'block';
    inlineMessage.style.color = state.inlineTone === 'success' ? 'green' : 'red';
  };

  const renderFeedback = () => {
    if (!feedbackPopup) {
      return;
    }

    const isFeedbackPhase =
      state.popupPhase === POPUP_STATE_FEEDBACK_SUCCESS ||
      state.popupPhase === POPUP_STATE_FEEDBACK_ERROR;

    if (!isFeedbackPhase) {
      feedbackPopup.classList.remove('is-visible');
      feedbackPopup.setAttribute('aria-hidden', 'true');
      feedbackPopup.dataset.tone = '';
      popup.classList.remove('abc-newsletter-popup-feedback-open');
      return;
    }

    const feedbackState = state.feedback || getFeedbackState(state.popupPhase === POPUP_STATE_FEEDBACK_SUCCESS ? 'success' : 'error');
    feedbackPopup.dataset.tone = feedbackState.tone;
    popup.classList.add('abc-newsletter-popup-feedback-open');

    if (feedbackKicker) {
      feedbackKicker.textContent = feedbackState.kicker;
      feedbackKicker.style.background = feedbackState.tone === 'success'
        ? 'rgba(15, 168, 72, 0.08)'
        : 'rgba(227, 6, 19, 0.08)';
      feedbackKicker.style.color = feedbackState.tone === 'success' ? '#0f8f3d' : 'var(--abc-popup-red)';
    }

    if (feedbackTitle) {
      feedbackTitle.textContent = feedbackState.title;
    }

    if (feedbackCopy) {
      feedbackCopy.textContent = feedbackState.copy;
    }

    if (feedbackEmailStatus) {
      feedbackEmailStatus.textContent = feedbackState.tone === 'success' && state.feedback && state.feedback.email
        ? `Estamos enviando agora para ${state.feedback.email}`
        : '';
    }

    feedbackPopup.classList.add('is-visible');
    feedbackPopup.setAttribute('aria-hidden', 'false');
  };

  const renderWidget = () => {
    const shouldShowWidget =
      !state.registered &&
      state.widgetVisible &&
      state.popupPhase === POPUP_STATE_CLOSED;

    if (!shouldShowWidget) {
      hideWidget();
      return;
    }

    const widgetState = state.widgetState === WIDGET_STATE_COLLAPSED
      ? WIDGET_STATE_COLLAPSED
      : WIDGET_STATE_EXPANDED;

    widget.dataset.widgetState = widgetState;
    widget.classList.add('abc-newsletter-widget-open');
    widget.classList.toggle('abc-newsletter-widget-expanded', widgetState === WIDGET_STATE_EXPANDED);
    widget.classList.toggle('abc-newsletter-widget-collapsed', widgetState === WIDGET_STATE_COLLAPSED);
    widget.setAttribute('aria-hidden', 'false');
    syncWidgetToggle(widgetState);
  };

  const renderFormState = () => {
    if (!submitButton || !nameElement || !surnameElement || !emailElement) {
      return;
    }

    const validation = getSubmissionValidation();
    const canSubmit =
      state.popupPhase === POPUP_STATE_OPEN &&
      validation.valid &&
      !state.submitting;

    if (state.inlineMessage && validation.valid) {
      state.inlineMessage = '';
      state.inlineTone = 'error';
    }

    syncFieldCompleteState(nameElement, isValidName(nameElement.value));
    syncFieldCompleteState(surnameElement, isValidName(surnameElement.value));
    syncFieldCompleteState(emailElement, isValidEmail(emailElement.value));
    syncFieldCompleteState(phoneElement, isValidPhone(phoneElement ? phoneElement.value : ''));

    submitButton.disabled = !canSubmit;
    submitButton.textContent = state.submitting ? submitButtonLoadingLabel : submitButtonDefaultLabel;
    submitButton.setAttribute('aria-busy', state.submitting ? 'true' : 'false');
  };

  const renderPopup = () => {
    const popupVisible = state.popupPhase !== POPUP_STATE_CLOSED;
    const isFeedbackPhase =
      state.popupPhase === POPUP_STATE_FEEDBACK_SUCCESS ||
      state.popupPhase === POPUP_STATE_FEEDBACK_ERROR;

    popup.classList.toggle('abc-newsletter-popup-open', popupVisible);
    popup.classList.toggle('abc-newsletter-popup-feedback-open', isFeedbackPhase);
    popup.setAttribute('aria-hidden', popupVisible ? 'false' : 'true');
    setScrollLock(popupVisible);
  };

  const render = () => {
    renderPopup();
    renderWidget();
    renderFormState();
    renderInlineMessage();
    renderFeedback();
  };

  const clearInlineMessage = () => {
    state.inlineMessage = '';
    state.inlineTone = 'error';
  };

  const openPopup = () => {
    if (state.registered) {
      return;
    }

    clearPopupOpenTimeout();
    clearAutoCloseTimeout();
    clearWidgetCollapseTimeout();
    state.popupPhase = POPUP_STATE_OPEN;
    state.feedback = null;
    state.submitting = false;
    clearInlineMessage();
    render();

    if (nameElement || surnameElement || emailElement) {
      window.setTimeout(() => {
        if (state.popupPhase === POPUP_STATE_OPEN) {
          render();
        }
      }, 250);
    }
  };

  const closePopupToWidgetState = (nextWidgetState) => {
    clearPopupOpenTimeout();
    clearAutoCloseTimeout();
    state.popupPhase = POPUP_STATE_CLOSED;
    state.feedback = null;
    state.submitting = false;
    clearInlineMessage();
    state.widgetState = nextWidgetState;
    render();
  };

  const closePopupAfterSuccess = () => {
    clearPopupOpenTimeout();
    clearAutoCloseTimeout();
    clearWidgetCollapseTimeout();
    state.popupPhase = POPUP_STATE_CLOSED;
    state.feedback = null;
    state.submitting = false;
    clearInlineMessage();
    state.widgetState = WIDGET_STATE_HIDDEN;
    render();
  };

  const showFeedback = (tone, extra = {}) => {
    clearPopupOpenTimeout();
    clearAutoCloseTimeout();
    clearWidgetCollapseTimeout();
    state.popupPhase = tone === 'success' ? POPUP_STATE_FEEDBACK_SUCCESS : POPUP_STATE_FEEDBACK_ERROR;
    state.submitting = false;
    state.feedback = {
      ...getFeedbackState(tone),
      ...extra,
      tone,
    };
    render();
  };

  const showValidationMessage = (message, focusElement) => {
    state.inlineMessage = message;
    state.inlineTone = 'error';
    render();

    if (focusElement) {
      focusElement.focus();
    }
  };

  const getSdkClient = () => {
    try {
      if (typeof client !== 'undefined' && client) {
        return client;
      }
    } catch (error) {
      // Ignore; fall back to the global object below.
    }

    return window.client || null;
  };

  const isExplicitSdkFailure = (response) => {
    if (!response || typeof response !== 'object') {
      return false;
    }

    if (response.success === false || response.ok === false || response.isSuccess === false) {
      return true;
    }

    if (typeof response.status === 'string') {
      const normalizedStatus = response.status.toLowerCase();

      if (normalizedStatus === 'error' || normalizedStatus === 'failed' || normalizedStatus === 'failure') {
        return true;
      }
    }

    if (response.error || (Array.isArray(response.errors) && response.errors.length > 0)) {
      return true;
    }

    return false;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (state.registered || state.popupPhase !== POPUP_STATE_OPEN) {
      return;
    }

    const validation = getSubmissionValidation();

    if (!validation.valid) {
      showValidationMessage(validation.message, validation.focusElement);
      return;
    }

    const sdkClient = getSdkClient();
    if (!sdkClient || !sdkClient.newsletter || typeof sdkClient.newsletter.create !== 'function') {
      showFeedback('error', {
        copy: 'Tente novamente em alguns instantes.',
      });
      return;
    }

    const submissionData = getSubmissionData();
    const payload = {
      name: submissionData.fullNameValue,
      email: submissionData.emailValue,
    };

    state.submitting = true;
    clearInlineMessage();
    render();

    try {
      const response = await sdkClient.newsletter.create(payload);

      if (isExplicitSdkFailure(response)) {
        throw new Error('newsletter.create returned a failure response');
      }

      state.registered = true;
      state.widgetState = WIDGET_STATE_HIDDEN;
      writePopupState(REGISTERED_STATE);

      showFeedback('success', {
        email: submissionData.emailValue,
        copy: `Seu cupom chegará em instantes no e-mail ${submissionData.emailValue}. Confira também a caixa de spam e promoções.`,
      });

      if (typeof sendSharpSpring === 'function') {
        try {
          sendSharpSpring({
            nome: submissionData.fullNameValue,
            email: submissionData.emailValue,
            telefone: submissionData.phoneValue,
          }, 'primeira-compra');
        } catch (error) {
          // SharpSpring is best-effort only.
        }
      }

      clearAutoCloseTimeout();
      autoCloseTimeoutId = window.setTimeout(() => {
        closePopupAfterSuccess();
      }, FEEDBACK_AUTO_CLOSE_MS);
    } catch (error) {
      showFeedback('error', {
        copy: 'Tente novamente em alguns instantes.',
      });
    }
  };

  const handleDismiss = () => {
    clearWidgetCollapseTimeout();
    state.widgetVisible = true;
    state.widgetState = WIDGET_STATE_EXPANDED;
    writePopupState(WIDGET_STATE_COLLAPSED);
    closePopupToWidgetState(WIDGET_STATE_EXPANDED);

    widgetCollapseTimeoutId = window.setTimeout(() => {
      widgetCollapseTimeoutId = null;

      if (state.registered || state.popupPhase !== POPUP_STATE_CLOSED || !state.widgetVisible) {
        return;
      }

      state.widgetState = WIDGET_STATE_COLLAPSED;
      writePopupState(WIDGET_STATE_COLLAPSED);
      render();
    }, WIDGET_AUTO_COLLAPSE_DELAY_MS);
  };

  const handleFeedbackClose = () => {
    if (state.popupPhase === POPUP_STATE_FEEDBACK_SUCCESS) {
      closePopupAfterSuccess();
      return;
    }

    if (state.popupPhase === POPUP_STATE_FEEDBACK_ERROR) {
      clearAutoCloseTimeout();
      state.popupPhase = POPUP_STATE_OPEN;
      state.feedback = null;
      state.submitting = false;
      clearInlineMessage();
      render();
    }
  };

  const handleWidgetToggle = () => {
    if (state.popupPhase !== POPUP_STATE_CLOSED || state.registered) {
      return;
    }

    clearWidgetCollapseTimeout();

    const nextWidgetState = state.widgetState === WIDGET_STATE_COLLAPSED
      ? WIDGET_STATE_EXPANDED
      : WIDGET_STATE_COLLAPSED;

    state.widgetState = nextWidgetState;
    writePopupState(nextWidgetState);
    render();
  };

  const handleWidgetOpen = () => {
    openPopup();
  };

  if (nameElement) {
    nameElement.addEventListener('input', function () {
      const normalizedValue = this.value.replace(/\s{2,}/g, ' ').replace(/^\s+/, '');

      if (this.value !== normalizedValue) {
        this.value = normalizedValue;
      }

      if (state.inlineMessage) {
        clearInlineMessage();
      }

      render();
    });
  }

  if (surnameElement) {
    surnameElement.addEventListener('input', function () {
      const normalizedValue = this.value.replace(/\s{2,}/g, ' ').replace(/^\s+/, '');

      if (this.value !== normalizedValue) {
        this.value = normalizedValue;
      }

      if (state.inlineMessage) {
        clearInlineMessage();
      }

      render();
    });
  }

  if (emailElement) {
    emailElement.addEventListener('input', function () {
      const normalizedValue = normalizeEmail(this.value);

      if (this.value !== normalizedValue) {
        this.value = normalizedValue;
      }

      if (state.inlineMessage) {
        clearInlineMessage();
      }

      render();
    });
  }

  if (phoneElement) {
    phoneElement.addEventListener('input', function () {
      const normalizedValue = formatBrazilianMobilePhone(this.value);

      if (this.value !== normalizedValue) {
        this.value = normalizedValue;
      }

      render();
    });
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  if (dismissButton) {
    dismissButton.addEventListener('click', handleDismiss);
  }

  if (feedbackCloseButton) {
    feedbackCloseButton.addEventListener('click', handleFeedbackClose);
  }

  if (widgetOpenButton) {
    widgetOpenButton.addEventListener('click', handleWidgetOpen);
  }

  if (widgetToggleButton) {
    widgetToggleButton.addEventListener('click', (event) => {
      event.stopPropagation();
      handleWidgetToggle();
    });
  }

  const widgetPanel = widget.querySelector('[data-widget-panel]');
  if (widgetPanel) {
    widgetPanel.addEventListener('click', (event) => {
      if (event.target.closest('[data-widget-open]') || event.target.closest('[data-widget-toggle]')) {
        return;
      }

      event.stopPropagation();
      handleWidgetToggle();
    });
  }

  window.addEventListener('pageshow', () => {
    render();
  });

  render();

  if (isHome && !state.registered && !hasSavedWidgetPreference) {
    popupOpenTimeoutId = window.setTimeout(() => {
      popupOpenTimeoutId = null;
      openPopup();
    }, POPUP_OPEN_DELAY_MS);
  }
})();
