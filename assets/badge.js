/**
 * Badge block: live-updates a text badge's visibility based on the selected
 * variant's stock status (only present when only_if_in_stock is set).
 * Reads per-instance data from the adjacent #product-badge-variant-data-*
 * JSON island; matches it to its container by shared id suffix.
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('script[id^="product-badge-variant-data-"]').forEach((dataEl) => {
      const suffix = dataEl.id.slice("product-badge-variant-data-".length);
      const containerEl = document.getElementById(`badge-container-${suffix}`);
      if (!containerEl) return;

      if (containerEl.dataset.badgeBound === "true") return;
      containerEl.dataset.badgeBound = "true";

      let badgeData = { variants: [] };
      try {
        badgeData = JSON.parse(dataEl.textContent);
      } catch (e) {
        console.error("Failed to parse stock badge data", e);
      }

      function updateBadge(variantId) {
        const variant = badgeData.variants.find(v => v.id === parseInt(variantId));
        if (!variant) return;

        if (variant.available) {
          containerEl.style.display = "";
        } else {
          containerEl.style.display = "none";
        }
      }

      document.addEventListener("variant-changed", (e) => {
        if (e.detail && e.detail.variantId) {
          updateBadge(e.detail.variantId);
        }
      });
    });
  });
})();
