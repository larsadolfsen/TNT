/**
 * Accordion block: wires up the open/close click handler for each generic
 * accordion's .accordion-trigger, matched by its #accordion-* wrapper id.
 * Holds no Liquid.
 *
 * Shared contract with assets/product-accordions.js: accordion blocks can be
 * rendered inside product-accordions' `{% content_for 'blocks' %}`, so both
 * files' triggers overlap and both bind to `.accordion-trigger`. They avoid
 * double-binding only because both use the identical
 * `trigger.dataset.accordionBound` guard string — keep that string in sync
 * between the two files if either one changes it.
 */
(function () {
  document.querySelectorAll('[id^="accordion-"] > .accordion-trigger').forEach((trigger) => {
    if (trigger.dataset.accordionBound === 'true') return;
    trigger.dataset.accordionBound = 'true';

    trigger.addEventListener('click', function () {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.icon');
      if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        if (icon) icon.classList.add('rotate-180');
      } else {
        content.classList.add('hidden');
        if (icon) icon.classList.remove('rotate-180');
      }
    });
  });
})();
