/**
 * Product price block: re-renders the price display and toggles the Shop Pay
 * installments row when it receives "variant-changed" (dispatched by
 * assets/product-variant-picker.js). Variant price/unit-price data comes
 * from #product-price-variant-data-*; text/currency Liquid values come from
 * the #product-price-config-* island. Elements are located by id prefix
 * (one price block per page).
 */
(function () {
  document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector('[id^="product-price-container-"]');
    if (!container) return;

    let priceVariants = [];
    try {
      priceVariants = JSON.parse(document.querySelector('[id^="product-price-variant-data-"]').textContent);
    } catch (e) {
      console.error("Failed to parse product price variant data", e);
      return;
    }

    let config = {};
    try {
      config = JSON.parse(document.querySelector('[id^="product-price-config-"]').textContent) || {};
    } catch (e) {
      config = {};
    }
    const suffix = config.suffix || "";
    const currencyCode = config.currencyCode || "";
    const compareAtPriceLabel = config.compareAtPriceLabel || "";

    function formatCents(cents) {
      return cents < 10 ? '0' + cents : cents;
    }

    // Headline rule, kept in sync with the initial Liquid render: a variant
    // with unit pricing shows its unit price as the headline (raw price
    // suppressed) and no separate unit-price sub-line — that would just
    // duplicate the headline.
    function unitSuffixHtml(variant, extraClass) {
      if (!variant.has_unit_price) return '';
      return `<span class="text-sm text-primary/85 font-medium whitespace-nowrap${extraClass}">/ ${variant.unit_price_suffix}</span>`;
    }

    function updatePrice(variantId) {
      const variant = priceVariants.find(v => v.id === parseInt(variantId));
      if (!variant) return;

      const headlineRaw = variant.has_unit_price ? variant.unit_price : variant.price;
      const headlineFormatted = variant.has_unit_price ? variant.unit_price_formatted : variant.price_formatted;

      const isOnSale = variant.compare_at_price && variant.compare_at_price > variant.price;

      if (isOnSale) {
        const savings = Math.round(((variant.compare_at_price - variant.price) * 100) / variant.compare_at_price);
        const priceMain = Math.floor(headlineRaw / 100);
        const priceCents = formatCents(headlineRaw % 100);

        let suffixHtml = unitSuffixHtml(variant, ' pb-0.5 ml-0.5');
        if (suffix) {
          suffixHtml += `<span class="text-sm text-primary/85 font-medium whitespace-nowrap pb-0.5 ml-0.5">${suffix}</span>`;
        }

        // Suppressed when has_unit_price: compare_at_price is the raw
        // per-unit compare price (no unit-price equivalent exists for it),
        // and showing it crossed out next to a per-reference-unit headline
        // would be as misleading as the raw headline price this rule fixes.
        let listPriceRow = '';
        if (!variant.has_unit_price) {
          listPriceRow = `
          <div class="flex items-center gap-1.5 text-sm text-primary/60 mt-1 select-none">
            <span>${compareAtPriceLabel}:</span>
            <span class="line-through">${variant.compare_at_price_formatted}</span>
            <span class="material-symbols-outlined text-[16px] cursor-help text-primary/45 hover:text-primary/70 flex items-center" title="Vejledende udsalgspris">info</span>
          </div>`;
        }

        container.innerHTML = `
          <!-- Savings Tag Above Price -->
          <div class="product-savings-container flex items-center mb-1">
            <span class="product-savings-badge inline-block text-[#c8102e] text-2xl font-bold leading-none">
              Spar ${savings}%
            </span>
          </div>
          <!-- Price Display -->
          <div class="flex items-baseline gap-x-3 flex-nowrap overflow-hidden">
            <span class="text-5xl font-black tracking-tight text-primary whitespace-nowrap flex items-start select-all">
              <span>${priceMain}</span>
              <sup class="text-base font-bold ml-0.5 mt-1.5 text-primary">${priceCents} ${currencyCode}</sup>
            </span>
            ${suffixHtml}
          </div>
          ${listPriceRow}
        `;
      } else {
        let suffixHtml = unitSuffixHtml(variant, '');
        if (suffix) {
          suffixHtml += `<span class="text-sm text-primary/85 font-medium whitespace-nowrap">${suffix}</span>`;
        }

        container.innerHTML = `
          <div class="flex items-baseline gap-2 flex-nowrap overflow-hidden">
            <span id="base-price-display" class="text-3xl font-bold tracking-tight text-primary whitespace-nowrap">
              ${headlineFormatted}
            </span>
            ${suffixHtml}
          </div>
        `;
      }
    }

    document.addEventListener("variant-changed", (e) => {
      if (e.detail && e.detail.variantId) {
        updatePrice(e.detail.variantId);
      }
    });

    // Surface 11: Shop Pay Installments — every variant's messaging is
    // pre-rendered by Liquid (payment_terms is a server-only filter with no
    // client-side reformatting API); on variant change we just toggle which
    // one is visible so the amount always matches the selected variant.
    const installmentsWrapper = document.querySelector('[id^="installments-wrapper-"]');
    if (installmentsWrapper) {
      document.addEventListener("variant-changed", (e) => {
        if (!e.detail || !e.detail.variantId) return;
        installmentsWrapper.querySelectorAll(".installments-variant").forEach((el) => {
          el.hidden = el.dataset.variantId !== String(e.detail.variantId);
        });
      });
    }
  });
})();
