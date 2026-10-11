(() => {
  const slides = Array.from(document.querySelectorAll(
    ".meeting-content > .meeting-cover, .meeting-content > .meeting-section"
  ));
  const controls = document.querySelector(".slideshow-controls");
  const counter = document.querySelector(".slideshow-counter");
  const previousButton = document.querySelector("[data-presentation-previous]");
  const nextButton = document.querySelector("[data-presentation-next]");
  const enterButton = document.querySelector("[data-presentation-enter]");
  const exitButton = document.querySelector("[data-presentation-exit]");

  if (!slides.length || !controls || !counter || !previousButton || !nextButton || !enterButton || !exitButton) {
    return;
  }

  let currentSlide = 0;
  let previousScrollPosition = 0;
  let isActive = false;

  function showSlide(index) {
    currentSlide = Math.max(0, Math.min(index, slides.length - 1));

    slides.forEach((slide, slideIndex) => {
      const isCurrent = slideIndex === currentSlide;
      slide.classList.toggle("is-active", isCurrent);
      slide.setAttribute("aria-hidden", String(isActive && !isCurrent));
      slide.inert = isActive && !isCurrent;
      if (isCurrent) slide.scrollTop = 0;
    });

    counter.textContent = `${currentSlide + 1} / ${slides.length}`;
    previousButton.disabled = currentSlide === 0;
    nextButton.disabled = currentSlide === slides.length - 1;
  }

  function enterPresentation() {
    if (isActive) return;
    previousScrollPosition = window.scrollY;
    isActive = true;
    document.body.classList.add("presentation-mode");
    controls.hidden = false;
    enterButton.setAttribute("aria-pressed", "true");
    showSlide(0);
    nextButton.focus();
  }

  function exitPresentation() {
    if (!isActive) return;
    isActive = false;
    document.body.classList.remove("presentation-mode");
    controls.hidden = true;
    enterButton.setAttribute("aria-pressed", "false");
    slides.forEach((slide) => {
      slide.classList.remove("is-active");
      slide.setAttribute("aria-hidden", "false");
      slide.inert = false;
      slide.scrollTop = 0;
    });
    window.scrollTo(0, previousScrollPosition);
    enterButton.focus();
  }

  enterButton.addEventListener("click", enterPresentation);
  exitButton.addEventListener("click", exitPresentation);
  previousButton.addEventListener("click", () => showSlide(currentSlide - 1));
  nextButton.addEventListener("click", () => showSlide(currentSlide + 1));

  document.addEventListener("keydown", (event) => {
    if (!isActive || event.altKey || event.ctrlKey || event.metaKey) return;

    if (event.key === "Escape") {
      event.preventDefault();
      exitPresentation();
    } else if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
      event.preventDefault();
      showSlide(currentSlide + 1);
    } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
      event.preventDefault();
      showSlide(currentSlide - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      showSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      showSlide(slides.length - 1);
    }
  });
})();
