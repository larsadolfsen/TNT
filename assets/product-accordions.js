/**
 * Product Accordions block: wires up open/close click handlers for
 * .accordion-trigger elements inside each #shopify-section-accordions-*
 * container on the page. Holds no Liquid.
 */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll('[id^="shopify-section-accordions-"]').forEach((sectionContainer) => {
      const triggers = sectionContainer.querySelectorAll(".accordion-trigger");
      triggers.forEach(trigger => {
        if (trigger.dataset.accordionBound === "true") return;
        trigger.dataset.accordionBound = "true";

        trigger.addEventListener("click", function () {
          const content = this.nextElementSibling;
          const icon = this.querySelector(".material-symbols-outlined");

          if (content.classList.contains("hidden")) {
            content.classList.remove("hidden");
            if (icon) icon.classList.add("rotate-180");
          } else {
            content.classList.add("hidden");
            if (icon) icon.classList.remove("rotate-180");
          }
        });
      });
    });
  });
})();
