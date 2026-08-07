(() => {
  const initLifeScrapbook = () => {
    const triggers = Array.from(document.querySelectorAll("[data-life-media]"));
    const boardVideos = Array.from(document.querySelectorAll(".life-board-video"));
    const lightbox = document.getElementById("lifeLightbox");
    const panel = lightbox?.querySelector(".life-lightbox-panel");
    const closeButton = document.getElementById("lifeLightboxClose");
    const lightboxImage = document.getElementById("lifeLightboxImage");
    const lightboxVideo = document.getElementById("lifeLightboxVideo");
    const caption = document.getElementById("lifeLightboxCaption");
    const videoToggle = document.getElementById("lifeVideoToggle");
    const creditPlaceholders = Array.from(document.querySelectorAll("[data-credit-placeholder]"));

    creditPlaceholders.forEach((credit) => {
      credit.addEventListener("click", (event) => {
        if (credit.getAttribute("href") === "#") event.preventDefault();
      });
    });

    if (!triggers.length || !lightbox || !panel || !closeButton || !lightboxImage || !lightboxVideo || !caption || !videoToggle) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const visibleBoardVideos = new Set();
    let currentType = null;
    let returnFocus = null;
    let hideTimer = null;
    let previousBodyOverflow = "";

    const isLightboxOpen = () => lightbox.classList.contains("is-open");

    const playSilently = (video) => {
      video.muted = true;
      video.volume = 0;
      return video.play().catch(() => undefined);
    };

    const syncVideoToggle = () => {
      const isPlaying = !lightboxVideo.paused;
      videoToggle.textContent = isPlaying ? "暂停" : "播放";
      videoToggle.setAttribute("aria-pressed", String(isPlaying));
    };

    const syncBoardVideo = (video) => {
      const shouldPlay = visibleBoardVideos.has(video)
        && !document.hidden
        && !reducedMotion.matches
        && !isLightboxOpen();
      if (shouldPlay) {
        playSilently(video);
      } else {
        video.pause();
      }
    };

    const syncAllBoardVideos = () => boardVideos.forEach(syncBoardVideo);

    const videoObserver = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const video = entry.target;
            if (!(video instanceof HTMLVideoElement)) return;
            if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
              visibleBoardVideos.add(video);
            } else {
              visibleBoardVideos.delete(video);
            }
            syncBoardVideo(video);
          });
        }, { threshold: [0, 0.28, 0.7] })
      : null;

    boardVideos.forEach((video) => {
      video.muted = true;
      video.volume = 0;
      if (videoObserver) {
        videoObserver.observe(video);
      } else if (!reducedMotion.matches) {
        visibleBoardVideos.add(video);
        syncBoardVideo(video);
      }
    });

    const openLightbox = (trigger) => {
      window.clearTimeout(hideTimer);
      currentType = trigger.dataset.lifeMedia || "image";
      returnFocus = trigger;
      previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      caption.textContent = trigger.dataset.lifeCaption || "照片说明 · 待补充";
      lightboxImage.hidden = currentType !== "image";
      lightboxVideo.hidden = currentType !== "video";
      videoToggle.hidden = currentType !== "video";

      if (currentType === "image") {
        lightboxImage.src = trigger.dataset.lifeSrc || "";
        lightboxImage.alt = trigger.dataset.lifeAlt || "生活照片";
        lightboxVideo.pause();
        lightboxVideo.removeAttribute("src");
        lightboxVideo.load();
      } else {
        lightboxImage.removeAttribute("src");
        lightboxImage.alt = "";
        lightboxVideo.src = trigger.dataset.lifeSrc || "";
        lightboxVideo.poster = trigger.dataset.lifePoster || "";
        lightboxVideo.currentTime = 0;
        lightboxVideo.muted = true;
        lightboxVideo.volume = 0;
      }

      lightbox.hidden = false;
      lightbox.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        lightbox.classList.add("is-open");
        closeButton.focus({ preventScroll: true });
        syncAllBoardVideos();
        if (currentType === "video" && !reducedMotion.matches) {
          playSilently(lightboxVideo).finally(syncVideoToggle);
        } else {
          lightboxVideo.pause();
          syncVideoToggle();
        }
      });
    };

    const closeLightbox = () => {
      if (!isLightboxOpen()) return;
      lightbox.classList.remove("is-open");
      lightbox.setAttribute("aria-hidden", "true");
      lightboxVideo.pause();
      document.body.style.overflow = previousBodyOverflow;
      hideTimer = window.setTimeout(() => {
        lightbox.hidden = true;
        lightboxImage.removeAttribute("src");
        lightboxVideo.removeAttribute("src");
        lightboxVideo.load();
        currentType = null;
        if (returnFocus instanceof HTMLElement && document.contains(returnFocus)) {
          returnFocus.focus({ preventScroll: true });
        }
        syncAllBoardVideos();
      }, 220);
    };

    const trapFocus = (event) => {
      const focusable = Array.from(panel.querySelectorAll("button:not([hidden]), [href], [tabindex]:not([tabindex='-1'])"))
        .filter((element) => !element.hasAttribute("disabled"));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    triggers.forEach((trigger) => trigger.addEventListener("click", () => openLightbox(trigger)));
    closeButton.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (event) => {
      if (event.target instanceof HTMLElement && event.target.dataset.lifeClose === "true") closeLightbox();
    });

    videoToggle.addEventListener("click", () => {
      if (lightboxVideo.paused) {
        playSilently(lightboxVideo).finally(syncVideoToggle);
      } else {
        lightboxVideo.pause();
        syncVideoToggle();
      }
    });
    lightboxVideo.addEventListener("play", syncVideoToggle);
    lightboxVideo.addEventListener("pause", syncVideoToggle);

    window.addEventListener("keydown", (event) => {
      if (!isLightboxOpen()) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeLightbox();
      } else if (event.key === "Tab") {
        trapFocus(event);
      }
    }, { capture: true });

    document.addEventListener("visibilitychange", syncAllBoardVideos);
    document.addEventListener("aime:detail-panel-change", (event) => {
      if (event.detail?.panelName !== "more") {
        if (isLightboxOpen()) closeLightbox();
        visibleBoardVideos.clear();
      }
      syncAllBoardVideos();
    });
    reducedMotion.addEventListener?.("change", () => {
      if (reducedMotion.matches) lightboxVideo.pause();
      syncVideoToggle();
      syncAllBoardVideos();
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLifeScrapbook, { once: true });
  } else {
    initLifeScrapbook();
  }
})();
