/**
 * Product testimonial block (blocks/product-testimonial.liquid) mobile
 * slider: highlights the dot for whichever review card is centered and
 * scrolls to a review when its dot is clicked. The slider is located by id
 * prefix (blocks/product-testimonial.liquid renders at most one instance per
 * page), matching assets/trust-countdown.js / assets/product-price.js; the
 * block id embedded in that id is then reused to scope the dot/item class
 * selectors, exactly as the original inline script did.
 */
(function () {
  document.addEventListener('DOMContentLoaded', () => {
    const slider = document.querySelector('[id^="testimonial-slider-"]');
    if (!slider) return;

    const blockId = slider.id.replace('testimonial-slider-', '');
    const dots = document.querySelectorAll('.testimonial-dot-' + blockId);
    if (dots.length === 0) return;

    const updateDots = () => {
      const sliderRect = slider.getBoundingClientRect();
      const sliderCenter = sliderRect.left + sliderRect.width / 2;

      let closestIndex = 0;
      let minDistance = Infinity;

      const items = slider.querySelectorAll('.testimonial-item-' + blockId);
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
        const items = slider.querySelectorAll('.testimonial-item-' + blockId);
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
  });
})();
