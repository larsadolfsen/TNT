/**
 * Product testimonial block (blocks/product-testimonial.liquid) mobile
 * slider: highlights the dot for whichever review card is centered and
 * scrolls to a review when its dot is clicked. Operates generically on any
 * `[data-testimonial-container]` found on the page via data-attribute hooks,
 * so it needs no Liquid-side block id.
 */
(function () {
  function initContainer(container) {
    if (container.dataset.testimonialInitialized) return;
    container.dataset.testimonialInitialized = 'true';

    const slider = container.querySelector('[data-testimonial-slider]');
    const dots = container.querySelectorAll('[data-testimonial-dot]');
    if (!slider || dots.length === 0) return;

    const updateDots = () => {
      const sliderRect = slider.getBoundingClientRect();
      const sliderCenter = sliderRect.left + sliderRect.width / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      const items = slider.querySelectorAll('[data-testimonial-item]');
      items.forEach((item, index) => {
        const itemRect = item.getBoundingClientRect();
        const itemCenter = itemRect.left + itemRect.width / 2;
        const distance = Math.abs(sliderCenter - itemCenter);
        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      dots.forEach((dot, index) => {
        if (index === closestIndex) {
          dot.style.backgroundColor = 'var(--color-primary)';
          dot.style.opacity = '1';
        } else {
          dot.style.backgroundColor = 'var(--color-outline-variant)';
          dot.style.opacity = '0.5';
        }
      });
    };

    slider.addEventListener('scroll', updateDots);

    dots.forEach((dot, index) => {
      dot.addEventListener('click', () => {
        const items = slider.querySelectorAll('[data-testimonial-item]');
        const item = items[index];
        if (item) {
          const offset = item.offsetLeft - (slider.clientWidth - item.clientWidth) / 2;
          slider.scrollTo({
            left: offset,
            behavior: 'smooth'
          });
        }
      });
    });

    // Initial run to color the dots correctly
    updateDots();
  }

  function init() {
    document.querySelectorAll('[data-testimonial-container]').forEach(initContainer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
