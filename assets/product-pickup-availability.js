/**
 * Pickup availability block (blocks/product-pickup-availability.liquid):
 * expand/collapse the location panel on click, and swap which variant's
 * pre-rendered row is shown on the shared "variant-changed" event dispatched
 * by product-buy-buttons.js / product-variant-picker.js. Operates generically
 * on any `[data-pickup-availability]` container, so it needs no Liquid-side
 * block id.
 */
(function () {
  function initContainer(container) {
    if (container.dataset.pickupInitialized) return;
    container.dataset.pickupInitialized = 'true';

    container.addEventListener('click', (e) => {
      const trigger = e.target.closest('.pickup-row-trigger');
      if (!trigger || !container.contains(trigger)) return;

      const panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (!panel) return;

      const willOpen = trigger.getAttribute('aria-expanded') !== 'true';
      trigger.setAttribute('aria-expanded', String(willOpen));
      panel.hidden = !willOpen;
      trigger.classList.toggle('bg-card-high', willOpen);
      trigger.classList.toggle('bg-card-light', !willOpen);

      const chevron = trigger.querySelector('.pickup-chevron');
      if (chevron) chevron.style.transform = willOpen ? 'rotate(180deg)' : '';
    });

    document.addEventListener('variant-changed', (e) => {
      if (!e.detail || !e.detail.variantId) return;
      container.querySelectorAll('.pickup-variant-state').forEach((el) => {
        el.hidden = el.dataset.variantId !== String(e.detail.variantId);
      });
    });
  }

  function init() {
    document.querySelectorAll('[data-pickup-availability]').forEach(initContainer);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
