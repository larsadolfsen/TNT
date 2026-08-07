/**
 * Product media gallery behaviour: infinite-loop swipeable track (clones
 * first/last slides for wraparound), dot/thumbnail click navigation,
 * pointer-based drag/swipe, per-video play-overlay control, and syncing the
 * active slide to the selected variant's image via #product-media-variants.
 *
 * Moved out of blocks/product-media.liquid's inline <script>. Holds no
 * Liquid — operates purely on elements/JSON already in the DOM
 * (#gallery-track, .dot-btn, .thumbnail-btn, #product-media-variants).
 */
(() => {
  const initGallery = () => {
    const mainImg = document.getElementById("main-product-img");
    const track = document.getElementById("gallery-track");
    const dots = document.querySelectorAll(".dot-btn");
    const thumbnails = document.querySelectorAll(".thumbnail-btn");
    if (!mainImg || !track) return;

    const container = track.parentElement;
    if (!container) return;

    // Prevent duplicate initialization (e.g. in theme editor)
    if (track.dataset.galleryInitialized === "true") return;
    track.dataset.galleryInitialized = "true";

    const slides = Array.from(track.children);
    const N = slides.length;
    if (N <= 1) return;

    // Clone first and last slides for infinite looping animation
    const firstClone = slides[0].cloneNode(true);
    const lastClone = slides[N - 1].cloneNode(true);

    // Append firstClone to end, prepend lastClone to start
    track.appendChild(firstClone);
    track.insertBefore(lastClone, slides[0]);

    let currentIndex = 0;
    let isAnimating = false;

    // Find initial active index from dots or thumbnails
    if (dots.length > 0) {
      dots.forEach((dot, index) => {
        if (dot.classList.contains("bg-primary")) currentIndex = index;
      });
    } else if (thumbnails.length > 0) {
      thumbnails.forEach((t, index) => {
        if (t.classList.contains("border-primary")) currentIndex = index;
      });
    }

    // Set initial position (DOM index 1 corresponds to currentIndex 0)
    track.style.transition = "none";
    track.style.transform = `translateX(-${(currentIndex + 1) * 100}%)`;

    // Video overlay control logic
    const initVideoControls = (parent) => {
      const videoSlides = parent.querySelectorAll(".video-slide");
      videoSlides.forEach(slide => {
        const video = slide.querySelector("video");
        const overlay = slide.querySelector(".custom-play-overlay");
        if (video && overlay) {
          overlay.addEventListener("click", (e) => {
            e.stopPropagation();
            video.play();
            overlay.classList.add("pointer-events-none", "opacity-0");
          });
          video.addEventListener("play", () => {
            overlay.classList.add("pointer-events-none", "opacity-0");
          });
          video.addEventListener("pause", () => {
            overlay.classList.remove("pointer-events-none", "opacity-0");
          });
        }
      });
    };
    initVideoControls(track);

    function showImage(index) {
      if (isAnimating) return;

      let targetIndex = index;
      let isWrapped = false;
      let wrapToDOMIndex = null;

      if (targetIndex >= N) {
        isWrapped = true;
        wrapToDOMIndex = 1; // Slide 0
        currentIndex = 0;
      } else if (targetIndex < 0) {
        isWrapped = true;
        wrapToDOMIndex = N; // Slide N - 1
        currentIndex = N - 1;
      } else {
        currentIndex = targetIndex;
      }

      const activeDot = dots[currentIndex];
      const activeThumbnail = thumbnails[currentIndex];
      const newSrc = (activeDot || activeThumbnail)?.getAttribute("data-src");

      // Update dots styles
      if (dots.length > 0) {
        dots.forEach(d => {
          d.classList.remove("bg-primary");
          d.classList.add("bg-slate-300");
        });
        if (activeDot) {
          activeDot.classList.remove("bg-slate-300");
          activeDot.classList.add("bg-primary");
        }
      }

      // Update thumbnails styles
      if (thumbnails.length > 0) {
        thumbnails.forEach(t => {
          t.classList.remove("border-primary");
          t.classList.add("border-transparent");
        });
        if (activeThumbnail) {
          activeThumbnail.classList.remove("border-transparent");
          activeThumbnail.classList.add("border-primary");
        }
      }

      // Update hidden main image for cart modal compatibility
      if (mainImg && newSrc) {
        mainImg.src = newSrc;
      }

      const domIndex = isWrapped ? (targetIndex + 1) : (currentIndex + 1);

      // Pause other videos
      const domSlides = Array.from(track.children);
      domSlides.forEach((slide, idx) => {
        if (idx !== domIndex) {
          const video = slide.querySelector("video");
          if (video) video.pause();
        }
      });

      isAnimating = true;
      track.style.transition = "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
      track.style.transform = `translateX(-${domIndex * 100}%)`;

      setTimeout(() => {
        if (isWrapped) {
          track.style.transition = "none";
          track.style.transform = `translateX(-${wrapToDOMIndex * 100}%)`;
        }
        isAnimating = false;
      }, 300);
    }

    // Click on dots
    dots.forEach((dot, index) => {
      dot.addEventListener("click", () => {
        showImage(index);
      });
    });

    // Click on thumbnails
    thumbnails.forEach((thumbnail, index) => {
      thumbnail.addEventListener("click", () => {
        showImage(index);
      });
    });

    // Swipe and drag logic (follow-the-finger tracking)
    container.style.touchAction = "pan-y";
    container.style.userSelect = "none";

    let pointerStartX = 0;
    let pointerStartY = 0;
    let isDragging = false;

    container.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return; // Left click or touch only

      // If we are currently in a transition/wrap, snap immediately to the destination
      if (isAnimating) {
        track.style.transition = "none";
        track.style.transform = `translateX(-${(currentIndex + 1) * 100}%)`;
        isAnimating = false;
      }

      pointerStartX = e.clientX;
      pointerStartY = e.clientY;
      isDragging = true;
      track.style.transition = "none"; // Disable animation during active drag
    });

    document.addEventListener("pointermove", (e) => {
      if (!isDragging) return;

      const currentX = e.clientX;
      const currentY = e.clientY;
      const diffX = currentX - pointerStartX;
      const diffY = currentY - pointerStartY;

      // If user scrolls vertically, cancel drag to let native scroll happen
      if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 10) {
        isDragging = false;
        track.style.transition = "transform 300ms cubic-bezier(0.25, 0.46, 0.45, 0.94)";
        track.style.transform = `translateX(-${(currentIndex + 1) * 100}%)`;
        return;
      }

      // Follow pointer exactly
      const containerWidth = container.offsetWidth || 1;
      const dragPercent = (diffX / containerWidth) * 100;
      const totalTranslate = -((currentIndex + 1) * 100) + dragPercent;

      track.style.transform = `translateX(${totalTranslate}%)`;
    });

    document.addEventListener("pointerup", (e) => {
      if (!isDragging) return;
      isDragging = false;

      const pointerEndX = e.clientX;
      const pointerEndY = e.clientY;

      const diffX = pointerEndX - pointerStartX;
      const diffY = pointerEndY - pointerStartY;

      // Threshold swipe detection
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0) {
          showImage(currentIndex + 1);
        } else {
          showImage(currentIndex - 1);
        }
      } else {
        // Snap back
        showImage(currentIndex);
      }
    });

    container.addEventListener("pointercancel", () => {
      if (isDragging) {
        isDragging = false;
        showImage(currentIndex);
      }
    });

    // Listen to variant-changed to slide to the correct image
    document.addEventListener("variant-changed", (e) => {
      const variantId = e.detail.variantId;
      const mediaVariantsEl = document.getElementById('product-media-variants');
      if (!mediaVariantsEl) return;

      let mediaVariants = {};
      try {
        mediaVariants = JSON.parse(mediaVariantsEl.textContent);
      } catch (err) {
        console.error("Failed to parse product-media-variants JSON", err);
        return;
      }

      const imageUrl = mediaVariants[variantId];
      if (!imageUrl) return;

      // Clean URL to compare paths without Shopify size suffixes or queries
      const cleanUrl = (url) => {
        if (!url) return "";
        let path = url.split('?')[0].split('#')[0];
        path = path.replace(/_\d+x\d*/g, '').replace(/_crop_[a-z]+/g, '');
        return path;
      };

      const targetKey = cleanUrl(imageUrl);
      if (!targetKey) return;

      // Find matching thumbnail or dot index
      let targetIndex = -1;

      if (thumbnails.length > 0) {
        thumbnails.forEach((btn, idx) => {
          const src = btn.getAttribute("data-src");
          if (src && cleanUrl(src) === targetKey) {
            targetIndex = idx;
          }
        });
      }

      if (targetIndex === -1 && dots.length > 0) {
        dots.forEach((dot, idx) => {
          const src = dot.getAttribute("data-src");
          if (src && cleanUrl(src) === targetKey) {
            targetIndex = idx;
          }
        });
      }

      if (targetIndex !== -1) {
        showImage(targetIndex);
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initGallery);
  } else {
    initGallery();
  }
})();
