/**
 * Product variant picker: swatch/pill click handling, matches the clicked
 * option combination against #picker-variant-data-* to find the variant,
 * updates the hidden id input + URL, and dispatches "variant-changed" for
 * assets/product-price.js and assets/product-urgency.js to pick up. Holds no
 * Liquid — elements are located by id prefix (one picker block per page).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const pickerContainer = document.querySelector('[id^="variant-picker-"]');
    if (!pickerContainer) return;

    const dataEl = document.querySelector('[id^="picker-variant-data-"]');
    let pickerVariants = [];
    try {
      pickerVariants = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error("Failed to parse picker variants", e);
    }

    // Variant swatch switching logic
    const optionButtons = pickerContainer.querySelectorAll('.product-variant-selectors button');
    optionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clickedBtn = e.currentTarget;
        const optionName = clickedBtn.dataset.optionName;
        const optionValue = clickedBtn.dataset.optionValue;

        // Find parent container to identify this option index
        const groupContainer = clickedBtn.closest('[data-option-index]');
        if (!groupContainer) return;

        // Unselect other buttons in the same option index group
        const siblingButtons = groupContainer.querySelectorAll('button');
        siblingButtons.forEach(b => {
          const isColor = !!b.querySelector('img');
          if (isColor) {
            b.classList.remove('border-[var(--color-accent)]', 'ring-4', 'ring-[var(--color-accent)]/10');
            b.classList.add('border-outline-variant', 'hover:border-[var(--color-accent)]/60');
          } else {
            b.classList.remove('border-2', 'text-primary', 'font-bold');
            b.classList.add('border', 'border-outline-variant', 'text-primary/70');
            b.style.borderColor = '';
            b.style.borderWidth = '';
          }
        });

        // Select this button
        const isColor = !!clickedBtn.querySelector('img');
        if (isColor) {
          clickedBtn.classList.remove('border-outline-variant', 'hover:border-[var(--color-accent)]/60');
          clickedBtn.classList.add('border-[var(--color-accent)]', 'ring-4', 'ring-[var(--color-accent)]/10');
        } else {
          clickedBtn.classList.remove('border', 'border-outline-variant', 'text-primary/70');
          clickedBtn.classList.add('border-2', 'text-primary', 'font-bold');
          clickedBtn.style.borderColor = 'var(--color-accent)';
          clickedBtn.style.borderWidth = '2px';
        }

        // Update the visual text label
        const labelEl = Array.from(pickerContainer.querySelectorAll('[data-selected-option-label]'))
          .find(el => el.dataset.selectedOptionLabel === optionName);
        if (labelEl) {
          labelEl.textContent = optionValue;
        }

        // Determine currently selected values across all options in correct index order
        const selectedValues = [];
        const optionContainers = pickerContainer.querySelectorAll('.product-variant-selectors [data-option-index]');
        optionContainers.forEach(container => {
          const idx = parseInt(container.dataset.optionIndex);
          const activeBtn = Array.from(container.querySelectorAll('button')).find(b => {
            const isBColor = !!b.querySelector('img');
            return isBColor ? b.classList.contains('border-[var(--color-accent)]') : b.classList.contains('font-bold');
          });
          if (activeBtn) {
            selectedValues[idx] = activeBtn.dataset.optionValue;
          }
        });

        // Look up matching variant
        const matchedVariant = pickerVariants.find(variant => {
          return variant.options.every((val, idx) => val === selectedValues[idx]);
        });

        if (matchedVariant) {
          // Update the hidden input
          const hiddenInput = pickerContainer.querySelector('[id^="product-variant-id-"]');
          if (hiddenInput) {
            hiddenInput.value = matchedVariant.id;
            // Dispatch change event to notify other scripts (like tablecloth customizer)
            hiddenInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // Update URL parameter
          const url = new URL(window.location.href);
          url.searchParams.set('variant', matchedVariant.id);
          window.history.replaceState({}, '', url.toString());

          // Dispatch custom event to notify other scripts about active variant update
          document.dispatchEvent(new CustomEvent("variant-changed", {
            detail: { variantId: matchedVariant.id }
          }));
        }
      });
    });
  });
})();
