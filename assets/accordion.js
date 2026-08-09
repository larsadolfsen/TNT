/**
 * Accordion block: wires up the open/close click handler for each generic
 * accordion's .accordion-trigger, matched by its #accordion-* wrapper id.
 * Holds no Liquid.
 */
(function () {
  document.querySelectorAll('[id^="accordion-"] > .accordion-trigger').forEach((trigger) => {
    trigger.addEventListener('click', function () {
      const content = this.nextElementSibling;
      const icon = this.querySelector('.material-symbols-outlined');
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
