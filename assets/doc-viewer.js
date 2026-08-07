(() => {
  const viewers = Array.from(document.querySelectorAll("[data-doc-src]"));
  const lightbox = document.getElementById("docLightbox");
  if (!viewers.length || !lightbox) return;

  const panel = lightbox.querySelector(".doc-lightbox-panel");
  const lightboxPage = document.getElementById("docLightboxPage");
  const lightboxLabel = document.getElementById("docLightboxLabel");
  const lightboxCounter = document.getElementById("docLightboxCounter");
  const prevButton = document.getElementById("docLightboxPrev");
  const nextButton = document.getElementById("docLightboxNext");
  const closeButton = document.getElementById("docLightboxClose");

  const wheelStep = 48;
  const wheelIdleReset = 200;
  let active = null;
  let lastFocused = null;
  let closeTimer = 0;

  function pageSource(viewer, page) {
    return viewer.dataset.docSrc.replace("{page}", String(page).padStart(2, "0"));
  }

  function preload(viewer, page) {
    if (page < 1 || page > Number(viewer.dataset.docPages)) return;
    new Image().src = pageSource(viewer, page);
  }

  function setPage(viewer, page) {
    const total = Number(viewer.dataset.docPages);
    const next = Math.max(1, Math.min(total, page));
    if (next === Number(viewer.dataset.docPage)) return false;
    viewer.dataset.docPage = String(next);

    const source = pageSource(viewer, next);
    const label = viewer.dataset.docLabel;
    viewer.querySelector(".doc-viewer-page").src = source;
    viewer.querySelector(".doc-viewer-page").alt = `${label} 第 ${next} 页`;
    viewer.querySelector(".doc-viewer-counter").textContent = `${next} / ${total}`;

    if (active === viewer) {
      lightboxPage.src = source;
      lightboxPage.alt = `${label} 第 ${next} 页`;
      lightboxCounter.textContent = `${next} / ${total}`;
      prevButton.disabled = next === 1;
      nextButton.disabled = next === total;
    }

    preload(viewer, next + 1);
    preload(viewer, next - 1);
    return true;
  }

  // 滚轮翻页；到首尾后不再拦截，让页面正常滚动出去。
  function attachWheel(element, getViewer) {
    let travel = 0;
    let idleTimer = 0;
    element.addEventListener("wheel", (event) => {
      const viewer = getViewer();
      if (!viewer) return;
      const page = Number(viewer.dataset.docPage);
      const total = Number(viewer.dataset.docPages);
      const direction = Math.sign(event.deltaY);
      if ((direction > 0 && page === total) || (direction < 0 && page === 1)) return;

      event.preventDefault();
      travel += event.deltaY;
      window.clearTimeout(idleTimer);
      idleTimer = window.setTimeout(() => { travel = 0; }, wheelIdleReset);
      if (Math.abs(travel) < wheelStep) return;
      setPage(viewer, page + Math.sign(travel));
      travel = 0;
    }, { passive: false });
  }

  function openLightbox(viewer) {
    active = viewer;
    lastFocused = document.activeElement;
    lightboxLabel.textContent = viewer.dataset.docLabel;
    lightboxPage.src = pageSource(viewer, Number(viewer.dataset.docPage));
    lightboxPage.alt = `${viewer.dataset.docLabel} 第 ${viewer.dataset.docPage} 页`;
    lightboxCounter.textContent = `${viewer.dataset.docPage} / ${viewer.dataset.docPages}`;
    prevButton.disabled = Number(viewer.dataset.docPage) === 1;
    nextButton.disabled = Number(viewer.dataset.docPage) === Number(viewer.dataset.docPages);

    window.clearTimeout(closeTimer);
    lightbox.hidden = false;
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    void lightbox.offsetHeight;
    lightbox.classList.add("is-open");
    panel.focus({ preventScroll: true });
  }

  function closeLightbox() {
    if (!active) return;
    active = null;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    closeTimer = window.setTimeout(() => {
      lightbox.hidden = true;
      lightboxPage.removeAttribute("src");
    }, 240);
    lastFocused?.focus?.({ preventScroll: true });
  }

  viewers.forEach((viewer) => {
    viewer.dataset.docPage = "1";
    const frame = viewer.querySelector(".doc-viewer-frame");
    frame.addEventListener("click", () => openLightbox(viewer));
    frame.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLightbox(viewer);
    });
    attachWheel(frame, () => viewer);
    preload(viewer, 2);
  });

  attachWheel(panel, () => active);

  prevButton.addEventListener("click", () => setPage(active, Number(active.dataset.docPage) - 1));
  nextButton.addEventListener("click", () => setPage(active, Number(active.dataset.docPage) + 1));
  closeButton.addEventListener("click", closeLightbox);
  lightbox.querySelector(".doc-lightbox-backdrop").addEventListener("click", closeLightbox);

  window.addEventListener("keydown", (event) => {
    if (!active) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    } else if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      setPage(active, Number(active.dataset.docPage) + 1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      setPage(active, Number(active.dataset.docPage) - 1);
    }
  });
})();
