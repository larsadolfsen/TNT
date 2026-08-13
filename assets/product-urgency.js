/**
 * Product stock urgency block: shows/hides and re-renders the low-stock /
 * in-stock message on "variant-changed" (dispatched by
 * assets/product-variant-picker.js). All data — variants, thresholds, copy,
 * and the show_urgency toggle — comes from #product-urgency-variant-data-*;
 * elements are located by id prefix (one urgency block per page).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const dataEl = document.querySelector('[id^="product-urgency-variant-data-"]');
    const sectionEl = document.querySelector('[id^="product-urgency-section-"]');
    const textEl = document.querySelector('[id^="product-urgency-text-"]');
    if (!dataEl || !sectionEl || !textEl) return;

    let urgencyData = { variants: [], hideUnderLimit: 5, urgencyText: "", inStockText: "", showUrgency: true };
    try {
      urgencyData = JSON.parse(dataEl.textContent);
    } catch (e) {
      console.error("Failed to parse stock urgency data", e);
    }

    function updateUrgency(variantId) {
      if (!urgencyData.showUrgency) {
        sectionEl.style.display = "none";
        return;
      }

      const btmVariant = urgencyData.variants.find(v => v.sku === 'BTM001');
      const targetVariant = btmVariant || urgencyData.variants.find(v => v.id === parseInt(variantId));
      if (!targetVariant) return;

      let show = true;
      let state = 'in-stock';

      if (targetVariant.inventory_management) {
        if (targetVariant.inventory_quantity <= 0) {
          show = false;
        } else if (targetVariant.inventory_quantity < urgencyData.hideUnderLimit) {
          state = 'low-stock';
        }
      }

      if (show) {
        sectionEl.style.display = "";
        if (state === 'low-stock') {
          const qty = targetVariant.inventory_quantity;
          let text = urgencyData.urgencyText;
          text = text.replace(/få/g, qty)
                     .replace(/Få/g, qty)
                     .replace(/\[count\]/g, qty)
                     .replace(/\[antal\]/g, qty);
          textEl.textContent = text;
          textEl.className = "text-sm font-semibold text-red-700";
        } else {
          const qty = targetVariant.inventory_quantity;
          let text = urgencyData.inStockText;
          text = text.replace(/\[count\]/g, qty)
                     .replace(/\[antal\]/g, qty);
          textEl.textContent = text;
          textEl.className = "text-sm font-semibold text-emerald-600";
        }
      } else {
        sectionEl.style.display = "none";
      }
    }

    const variantInput = document.querySelector('select[name="id"], input[name="id"]');
    const initialVariantId = variantInput ? variantInput.value : (urgencyData.variants[0] ? urgencyData.variants[0].id : null);
    if (initialVariantId) {
      updateUrgency(initialVariantId);
    }

    document.addEventListener("variant-changed", (e) => {
      if (e.detail && e.detail.variantId) {
        updateUrgency(e.detail.variantId);
      }
    });
  });
})();
