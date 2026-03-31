(() => {
  const MAX_SCALE = 4;
  const SWIPE_THRESHOLD = 56;
  const boundRoots = new WeakSet();

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function getDistance(a, b) {
    return Math.hypot(b.x - a.x, b.y - a.y);
  }

  function initializeProductGalleryZoom() {
    if (typeof window.closeProductGalleryZoom === "function") {
      window.closeProductGalleryZoom();
    }

    if (typeof window.destroyProductGalleryZoom === "function") {
      window.destroyProductGalleryZoom();
    }

    const galleryRoot = document.querySelector(".gallery");
    const sliderEl = document.querySelector(".gallery-slider");
    const modal = document.querySelector("[data-gallery-zoom-modal]");
    const viewport = modal?.querySelector("[data-gallery-zoom-viewport]");
    const image = modal?.querySelector("[data-gallery-zoom-image]");
    const closeButton = modal?.querySelector("[data-gallery-zoom-close]");
    const prevButton = modal?.querySelector("[data-gallery-zoom-prev]");
    const nextButton = modal?.querySelector("[data-gallery-zoom-next]");
    const counter = modal?.querySelector("[data-gallery-zoom-counter]");

    if (!galleryRoot || !sliderEl || !modal || !viewport || !image || !closeButton || !prevButton || !nextButton || !counter) {
      return;
    }

    if (boundRoots.has(galleryRoot)) {
      return;
    }

    boundRoots.add(galleryRoot);

    const getSlides = () => Array.from(sliderEl.querySelectorAll(".swiper-slide[data-gallery-zoom-src]"));

    const state = {
      open: false,
      index: 0,
      scale: 1,
      translateX: 0,
      translateY: 0,
      baseScale: 1,
      baseTranslateX: 0,
      baseTranslateY: 0,
      startX: 0,
      startY: 0,
      interaction: null,
      pinchStartDistance: 1,
      pointers: new Map(),
      bodyOverflow: "",
    };

    const updateCounter = () => {
      const total = getSlides().length || 1;
      counter.textContent = `${state.index + 1} / ${total}`;
    };

    const applyTransform = () => {
      image.style.transform = `translate3d(${state.translateX}px, ${state.translateY}px, 0) scale(${state.scale})`;
    };

    const resetTransform = () => {
      state.scale = 1;
      state.translateX = 0;
      state.translateY = 0;
      state.baseScale = 1;
      state.baseTranslateX = 0;
      state.baseTranslateY = 0;
      state.startX = 0;
      state.startY = 0;
      state.interaction = null;
      state.pointers.clear();
      image.style.transformOrigin = "center center";
      applyTransform();
      viewport.style.cursor = "grab";
    };

    const clampTranslation = () => {
      const viewportWidth = viewport.clientWidth;
      const viewportHeight = viewport.clientHeight;
      const maxX = Math.max(0, ((viewportWidth * state.scale) - viewportWidth) / 2);
      const maxY = Math.max(0, ((viewportHeight * state.scale) - viewportHeight) / 2);

      state.translateX = clamp(state.translateX, -maxX, maxX);
      state.translateY = clamp(state.translateY, -maxY, maxY);
    };

    const setActiveSlide = (index) => {
      const slides = getSlides();
      if (!slides.length) {
        return;
      }

      state.index = (index + slides.length) % slides.length;
      const slide = slides[state.index];
      const source = slide.dataset.galleryZoomSrc || slide.querySelector("img")?.src;
      const alt = slide.dataset.galleryZoomAlt || slide.querySelector("img")?.alt || "";

      image.src = source || "";
      image.alt = alt;
      updateCounter();
      resetTransform();
    };

    const openModal = (index) => {
      const slides = getSlides();
      if (!slides.length) {
        return;
      }

      state.open = true;
      state.bodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      setActiveSlide(index);
    };

    const closeModal = () => {
      if (!state.open) {
        return;
      }

      state.open = false;
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
      image.removeAttribute("src");
      image.removeAttribute("alt");
      document.body.style.overflow = state.bodyOverflow;
      resetTransform();
    };

    const goToSlide = (step) => {
      if (!state.open) {
        return;
      }

      setActiveSlide(state.index + step);
    };

    const handleSliderClick = (event) => {
      const slide = event.target.closest(".swiper-slide[data-gallery-zoom-src]");

      if (!slide || slide.classList.contains("swiper-no-swiping")) {
        return;
      }

      const slides = getSlides();
      const index = slides.indexOf(slide);

      if (index >= 0) {
        openModal(index);
      }
    };

    const updateSwipePreview = (event) => {
      const dragX = event.clientX - state.startX;
      const dragY = event.clientY - state.startY;

      if (state.scale > 1 && state.interaction === "pan") {
        state.translateX = state.baseTranslateX + dragX;
        state.translateY = state.baseTranslateY + dragY;
        clampTranslation();
        applyTransform();
        return;
      }

      if (state.scale <= 1 && state.interaction === "swipe") {
        const offset = clamp(dragX * 0.18, -72, 72);
        const verticalOffset = clamp(dragY * 0.04, -18, 18);
        image.style.transform = `translate3d(${offset}px, ${verticalOffset}px, 0) scale(1)`;
      }
    };

    const handlePointerDown = (event) => {
      if (!state.open) {
        return;
      }

      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }

      viewport.setPointerCapture(event.pointerId);
      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (state.pointers.size === 1) {
        state.startX = event.clientX;
        state.startY = event.clientY;
        state.baseTranslateX = state.translateX;
        state.baseTranslateY = state.translateY;
        state.baseScale = state.scale;
        state.interaction = state.scale > 1 ? "pan" : "swipe";
        viewport.style.cursor = state.interaction === "pan" ? "grabbing" : "grab";
      }

      if (state.pointers.size === 2) {
        const [first, second] = [...state.pointers.values()];
        state.baseScale = state.scale;
        state.baseTranslateX = state.translateX;
        state.baseTranslateY = state.translateY;
        state.pinchStartDistance = Math.max(getDistance(first, second), 1);
        state.interaction = "pinch";
        viewport.style.cursor = "grabbing";
      }
    };

    const handlePointerMove = (event) => {
      if (!state.open || !state.pointers.has(event.pointerId)) {
        return;
      }

      state.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (state.pointers.size >= 2) {
        const [first, second] = [...state.pointers.values()];
        const currentDistance = getDistance(first, second);
        const nextScale = clamp(state.baseScale * (currentDistance / state.pinchStartDistance), 1, MAX_SCALE);
        const viewportRect = viewport.getBoundingClientRect();
        const centerX = ((first.x + second.x) / 2) - viewportRect.left - (viewportRect.width / 2);
        const centerY = ((first.y + second.y) / 2) - viewportRect.top - (viewportRect.height / 2);
        const scaleRatio = nextScale / state.baseScale;

        state.scale = nextScale;
        state.translateX = state.baseTranslateX + ((1 - scaleRatio) * centerX);
        state.translateY = state.baseTranslateY + ((1 - scaleRatio) * centerY);
        clampTranslation();
        applyTransform();
        return;
      }

      updateSwipePreview(event);
    };

    const handlePointerUp = (event) => {
      if (!state.pointers.has(event.pointerId)) {
        return;
      }

      const endedX = event.clientX;
      const endedY = event.clientY;
      state.pointers.delete(event.pointerId);

      if (state.pointers.size === 1 && state.interaction === "pinch") {
        const [remaining] = [...state.pointers.values()];
        state.startX = remaining.x;
        state.startY = remaining.y;
        state.baseTranslateX = state.translateX;
        state.baseTranslateY = state.translateY;
        state.interaction = state.scale > 1 ? "pan" : "swipe";
        viewport.style.cursor = state.interaction === "pan" ? "grabbing" : "grab";
        return;
      }

      if (state.pointers.size > 0) {
        return;
      }

      const dragX = endedX - state.startX;
      const dragY = endedY - state.startY;
      const isSwipe = state.scale <= 1
        && state.interaction === "swipe"
        && Math.abs(dragX) > SWIPE_THRESHOLD
        && Math.abs(dragX) > Math.abs(dragY) * 1.15;

      if (isSwipe) {
        goToSlide(dragX < 0 ? 1 : -1);
        return;
      }

      if (state.scale <= 1) {
        resetTransform();
        return;
      }

      clampTranslation();
      applyTransform();
      state.interaction = "pan";
      viewport.style.cursor = "grabbing";
    };

    const handleWheel = (event) => {
      if (!state.open) {
        return;
      }

      event.preventDefault();

      const direction = event.deltaY < 0 ? 1 : -1;
      const nextScale = clamp(state.scale + direction * 0.15, 1, MAX_SCALE);
      const viewportRect = viewport.getBoundingClientRect();
      const pointerX = event.clientX - viewportRect.left - (viewportRect.width / 2);
      const pointerY = event.clientY - viewportRect.top - (viewportRect.height / 2);
      const scaleRatio = nextScale / state.scale;

      state.translateX = state.translateX + ((1 - scaleRatio) * pointerX);
      state.translateY = state.translateY + ((1 - scaleRatio) * pointerY);
      state.scale = nextScale;
      clampTranslation();
      applyTransform();
      viewport.style.cursor = nextScale > 1 ? "grabbing" : "grab";
    };

    const handleBackdropClick = (event) => {
      if (event.target === modal) {
        closeModal();
      }
    };

    const handleKeydown = (event) => {
      if (!state.open) {
        return;
      }

      if (event.key === "Escape") {
        closeModal();
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToSlide(-1);
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToSlide(1);
      }
    };

    const handleResize = () => {
      if (!state.open) {
        return;
      }

      clampTranslation();
      applyTransform();
    };

    const handlePrevClick = () => goToSlide(-1);
    const handleNextClick = () => goToSlide(1);

    sliderEl.addEventListener("click", handleSliderClick);
    closeButton.addEventListener("click", closeModal);
    prevButton.addEventListener("click", handlePrevClick);
    nextButton.addEventListener("click", handleNextClick);
    modal.addEventListener("click", handleBackdropClick);
    viewport.addEventListener("pointerdown", handlePointerDown);
    viewport.addEventListener("pointermove", handlePointerMove);
    viewport.addEventListener("pointerup", handlePointerUp);
    viewport.addEventListener("pointercancel", handlePointerUp);
    viewport.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeydown);
    window.addEventListener("resize", handleResize);

    window.closeProductGalleryZoom = closeModal;
    window.destroyProductGalleryZoom = () => {
      sliderEl.removeEventListener("click", handleSliderClick);
      closeButton.removeEventListener("click", closeModal);
      prevButton.removeEventListener("click", handlePrevClick);
      nextButton.removeEventListener("click", handleNextClick);
      modal.removeEventListener("click", handleBackdropClick);
      viewport.removeEventListener("pointerdown", handlePointerDown);
      viewport.removeEventListener("pointermove", handlePointerMove);
      viewport.removeEventListener("pointerup", handlePointerUp);
      viewport.removeEventListener("pointercancel", handlePointerUp);
      viewport.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeydown);
      window.removeEventListener("resize", handleResize);
    };
  }

  window.initializeProductGalleryZoom = initializeProductGalleryZoom;

  if (document.readyState === "complete") {
    initializeProductGalleryZoom();
  } else {
    window.addEventListener("load", initializeProductGalleryZoom, false);
  }
})();
