/**
 * Product buy-buttons behaviour: quantity stepper + live price recalculation
 * for simple (non-customized) products, add-to-cart via /cart/add.js with
 * optimistic cart-counter updates, and the mobile sticky buy bar (price,
 * variant summary, scroll-based show/hide, syncing with the main button).
 *
 * Moved out of blocks/product-buy-buttons.liquid's two inline <script>
 * tags. The default variant id and the sticky bar's button text (both
 * Liquid-derived) arrive through the #product-buy-buttons-config JSON
 * island rendered by that block; this file holds no Liquid. Reads
 * #simple-variant-data (still rendered inline by the block, since it's a
 * per-product data list, not behaviour).
 */
(function () {
  function readConfig() {
    var el = document.getElementById('product-buy-buttons-config');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent) || {};
    } catch (e) {
      return {};
    }
  }

  var config = readConfig();

  document.addEventListener("DOMContentLoaded", () => {
    const hasCustomizer = !!document.getElementById("shape-selector");
    // 1. If customizer is present, show the calculation summary card; otherwise hide it
    const summaryContainer = document.getElementById("buy-buttons-summary-container");
    if (summaryContainer) {
      if (hasCustomizer) {
        summaryContainer.style.display = "flex";
      } else {
        summaryContainer.style.display = "none";
      }
    }

    // Parse simple variant data
    let simpleVariants = [];
    try {
      simpleVariants = JSON.parse(document.getElementById('simple-variant-data').textContent);
    } catch (e) {
      console.error("Failed to parse simple variants", e);
    }

    // 2. Quantity & Price Stepper state for simple product
    let buyQty = 1;
    const buyQtyContainer = document.getElementById("buy-buttons-quantity-container");
    const buyQtyInput = document.getElementById("input-buy-qty");
    const buyQtyMinusBtn = document.getElementById("btn-buy-qty-minus");
    const buyQtyPlusBtn = document.getElementById("btn-buy-qty-plus");

    if (hasCustomizer && buyQtyContainer) {
      buyQtyContainer.style.display = "none";
    }

    function recalculateBuyPrice() {
      if (hasCustomizer) return;

      let selectedId = null;
      const variantInput = document.querySelector('select[name="id"], input[name="id"]');
      if (variantInput) {
        selectedId = parseInt(variantInput.value);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        selectedId = parseInt(urlParams.get('variant') || config.defaultVariantId);
      }

      const match = simpleVariants.find(v => v.id === selectedId);
      if (match) {
        // Calculate total price
        const totalCents = match.price * buyQty;
        const formattedPrice = (totalCents / 100).toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr.";

        const priceText = "Pris: " + formattedPrice;
        const btn = document.getElementById("btn-add-to-cart");
        const priceDisplay = document.getElementById("btn-price-display");

        const summaryPris = document.getElementById("summary-pris");
        if (summaryPris) summaryPris.textContent = priceText;

        if (priceDisplay) {
          priceDisplay.textContent = formattedPrice;
        } else if (btn) {
          const prefix = btn.getAttribute("data-text-before-price") || "Læg i kurv – ";
          btn.textContent = prefix + formattedPrice;
        }

        // Set global variable to resolve initial page load race condition
        window.currentPageProductPrice = totalCents / 100;

        // Dispatch custom event to notify other scripts about product price update
        document.dispatchEvent(new CustomEvent("product-price-updated", {
          detail: { price: totalCents / 100 }
        }));

        // Dispatch custom event to notify other scripts about active variant update
        document.dispatchEvent(new CustomEvent("variant-changed", {
          detail: { variantId: selectedId }
        }));
      }
    }

    if (!hasCustomizer && buyQtyInput) {
      // Auto-select text on focus
      buyQtyInput.addEventListener("focus", (e) => {
        e.target.select();
      });

      // Handle real-time typing
      buyQtyInput.addEventListener("input", (e) => {
        let sanitized = e.target.value.replace(/\D/g, "");
        e.target.value = sanitized;

        const parsed = parseInt(sanitized);
        if (!isNaN(parsed) && parsed > 0) {
          buyQty = parsed;
          recalculateBuyPrice();
        }
      });

      // Handle blur
      buyQtyInput.addEventListener("blur", (e) => {
        const parsed = parseInt(e.target.value);
        if (isNaN(parsed) || parsed < 1) {
          e.target.value = buyQty;
        } else {
          buyQty = parsed;
          e.target.value = buyQty;
        }
        recalculateBuyPrice();
      });

      // Handle Enter keypress
      buyQtyInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          buyQtyInput.blur();
        }
      });

      // Handle minus click
      if (buyQtyMinusBtn) {
        buyQtyMinusBtn.addEventListener("click", () => {
          if (buyQty > 1) {
            buyQty -= 1;
            buyQtyInput.value = buyQty;
            recalculateBuyPrice();
          }
        });
      }

      // Handle plus click
      if (buyQtyPlusBtn) {
        buyQtyPlusBtn.addEventListener("click", () => {
          buyQty += 1;
          buyQtyInput.value = buyQty;
          recalculateBuyPrice();
        });
      }

      // Initial calculation on load
      recalculateBuyPrice();
    }

    // Add listener to standard variant selector to update price dynamically
    const variantSelect = document.querySelector('select[name="id"]');
    if (variantSelect) {
      variantSelect.addEventListener("change", (e) => {
        if (hasCustomizer) return; // Let customizer handle it
        recalculateBuyPrice();
      });
    }

    document.addEventListener("change", (e) => {
      if (e.target && (e.target.name === "id" || e.target.classList.contains("single-option-selector"))) {
        if (hasCustomizer) return;
        setTimeout(recalculateBuyPrice, 50); // slight delay to allow other scripts to set variant value
      }
    });

    // Keep this form's own "id" field in sync with the active variant so
    // Shopify's dynamic checkout button (Surface 5) and Shop Pay Installments
    // messaging (Surface 11) reflect the currently selected variant even when
    // a separate product-variant-picker block is the one the shopper interacts with.
    const formVariantIdInput = document.getElementById("product-variant-id");
    document.addEventListener("variant-changed", (e) => {
      if (formVariantIdInput && e.detail && e.detail.variantId) {
        formVariantIdInput.value = e.detail.variantId;
        formVariantIdInput.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });

    // 3. Simple product add to cart behavior
    const addToCartBtn = document.getElementById("btn-add-to-cart");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", (e) => {
        // If the customizer is present on the page, let the customizer script handle the click event
        if (document.getElementById("shape-selector")) {
          return;
        }

        e.preventDefault();
        e.stopPropagation();

        addToCartBtn.disabled = true;
        addToCartBtn.classList.add("opacity-50");

        // Find variant ID
        let variantId = null;
        const variantInput = document.querySelector('select[name="id"], input[name="id"]');
        if (variantInput) {
          variantId = variantInput.value;
        } else {
          const urlParams = new URLSearchParams(window.location.search);
          variantId = urlParams.get('variant') || config.defaultVariantId;
        }

        if (!variantId) {
          alert("Fejl: Kunne ikke finde variant ID.");
          addToCartBtn.disabled = false;
          addToCartBtn.classList.remove("opacity-50");
          return;
        }

        // Optimistic update of cart-counter
        const counters = document.querySelectorAll('#cart-counter');
        const originalCounts = [];
        counters.forEach(counter => {
          const currentCount = parseInt(counter.innerText) || 0;
          originalCounts.push({ counter, text: counter.innerText, hasScale0: counter.classList.contains("scale-0") });
          const newCount = currentCount + buyQty;
          counter.innerText = newCount;
          if (newCount > 0) {
            counter.classList.remove("scale-0");
            counter.classList.add("scale-100");
          }
        });

        fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: [{
              id: parseInt(variantId),
              quantity: buyQty
            }]
          })
        })
        .then(response => {
          if (!response.ok) throw new Error("Adding to cart failed");
          return response.json();
        })
        .then(data => {
          // Refresh cart count with a delay to let Shopify session catch up
          return new Promise(resolve => {
            setTimeout(() => {
              fetch('/cart.js')
                .then(res => {
                  if (!res.ok) throw new Error("Cart fetch failed");
                  return res.json();
                })
                .then(resolve)
                .catch(err => {
                  console.error(err);
                  resolve(null);
                });
            }, 350);
          });
        })
        .then(cartData => {
          if (!cartData) return;
          const cartCounter = document.getElementById("cart-counter");
          if (cartCounter) {
            cartCounter.textContent = cartData.item_count;
          }
          document.dispatchEvent(new CustomEvent("cart-updated-total", {
            detail: { cartTotal: cartData.total_price / 100.0 }
          }));

          // if (typeof window.toggleCartDrawer === "function") {
          //   window.toggleCartDrawer(true);
          // }
        })
        .catch(err => {
          console.error(err);
          // Revert optimistic update
          originalCounts.forEach(item => {
            item.counter.innerText = item.text;
            if (item.hasScale0) {
              item.counter.classList.add("scale-0");
              item.counter.classList.remove("scale-100");
            } else {
              item.counter.classList.remove("scale-0");
              item.counter.classList.add("scale-100");
            }
          });
          alert("Der opstod en fejl. Prøv igen.");
        })
        .finally(() => {
          addToCartBtn.disabled = false;
          addToCartBtn.classList.remove("opacity-50");
        });
      });
    }
  });

  document.addEventListener("DOMContentLoaded", () => {
    const stickyBar = document.getElementById("mobile-sticky-buy-bar");
    if (!stickyBar) return;

    const stickyConfigSummary = document.getElementById("sticky-config-summary");
    const stickyBuyBtn = document.getElementById("btn-sticky-buy");
    const mainBuyBtn = document.getElementById("btn-add-to-cart");
    const btnText = config.stickyBuyButtonText;

    // 1. Function to update sticky bar content
    function updateStickyBar() {
      // Get the price display from the page
      const mainPriceDisplay = document.getElementById("btn-price-display");
      let priceText = "";
      if (mainPriceDisplay) {
        priceText = mainPriceDisplay.textContent.trim();
      }

      // Clean the price to match the image: e.g. "118,00 kr." -> "118,00"
      let priceTextClean = priceText.replace(/[\s]*kr\.?/gi, "").trim();

      const stickyBuyPrice = document.getElementById("btn-sticky-buy-price");
      if (stickyBuyPrice) {
        stickyBuyPrice.textContent = priceTextClean;
      }

      const stickyBuyText = document.getElementById("btn-sticky-buy-text");
      if (stickyBuyText) {
        stickyBuyText.textContent = btnText;
      }

      const stickyPriceCustomize = document.getElementById("sticky-price-customize");
      if (stickyPriceCustomize) {
        stickyPriceCustomize.textContent = priceText;
      }

      // Check if customizer is present
      const hasCustomizer = !!document.getElementById("shape-selector");
      let summaryText = "";

      if (hasCustomizer) {
        const shapeLabel = document.getElementById("calc-shape-label");
        const displayLength = document.getElementById("display-length");
        const displayWidth = document.getElementById("display-width");
        if (shapeLabel && displayLength && displayWidth) {
          const shapeText = shapeLabel.textContent.replace("Form:", "").replace("Form: ", "").trim();
          const lengthVal = displayLength.value.trim();
          const widthVal = displayWidth.value.trim();
          if (shapeText.toLowerCase() === 'rund') {
            summaryText = `${shapeText} ${lengthVal} cm`;
          } else {
            summaryText = `${shapeText} ${widthVal}x${lengthVal} cm`;
          }
        }
      } else {
        // Simple variant selection
        const variantSelect = document.querySelector('select[name="id"]');
        if (variantSelect) {
          const selectedOption = variantSelect.options[variantSelect.selectedIndex];
          if (selectedOption) {
            summaryText = selectedOption.textContent.split(" - ")[0].trim();
          }
        }
      }

      // Determine if this is a standard/default variant representation
      const isStandard = !summaryText || summaryText.toLowerCase() === 'standard' || summaryText.toLowerCase() === 'default title';

      // Parse variant data to check if active variant is on sale
      let simpleVariants = [];
      try {
        const dataEl = document.getElementById('simple-variant-data');
        if (dataEl) {
          simpleVariants = JSON.parse(dataEl.textContent);
        }
      } catch (e) {}

      let selectedId = null;
      const variantInput = document.querySelector('select[name="id"], input[name="id"]');
      if (variantInput) {
        selectedId = parseInt(variantInput.value);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        selectedId = parseInt(urlParams.get('variant') || config.defaultVariantId);
      }

      const currentVariant = simpleVariants.find(v => v.id === selectedId);
      const isOnSale = currentVariant && currentVariant.compare_at_price && currentVariant.compare_at_price > currentVariant.price;
      let savings = 0;
      if (isOnSale) {
        savings = Math.round(((currentVariant.compare_at_price - currentVariant.price) * 100) / currentVariant.compare_at_price);
      }

      if (stickyConfigSummary) {
        if (isStandard) {
          if (isOnSale && savings > 0) {
            stickyConfigSummary.innerHTML = `<span class="inline-block bg-[#c8102e] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase">Rabat ${savings} %</span>`;
          } else {
            stickyConfigSummary.textContent = "";
          }
        } else {
          stickyConfigSummary.textContent = summaryText;
        }
      }

      const stickyConfigSummaryCustomize = document.getElementById("sticky-config-summary-customize");
      if (stickyConfigSummaryCustomize) {
        if (isStandard) {
          if (isOnSale && savings > 0) {
            stickyConfigSummaryCustomize.innerHTML = `<span class="inline-block bg-[#c8102e] text-white text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase">Rabat ${savings} %</span>`;
          } else {
            stickyConfigSummaryCustomize.textContent = "";
          }
        } else {
          stickyConfigSummaryCustomize.textContent = summaryText;
        }
      }
    }

    // 2. Initial update and listen to price updates/changes
    updateStickyBar();

    // Listen to custom price update event
    document.addEventListener("product-price-updated", () => {
      setTimeout(updateStickyBar, 20);
    });

    // Listen to document changes (for shape buttons, checkbox, etc.)
    document.addEventListener("click", (e) => {
      if (e.target.closest('.shape-btn') || e.target.closest('#btn-length-minus') || e.target.closest('#btn-length-plus') || e.target.closest('#btn-qty-minus') || e.target.closest('#btn-qty-plus') || e.target.closest('#btn-width-accordion-trigger') || e.target.closest('#btn-width-minus') || e.target.closest('#btn-width-plus')) {
        setTimeout(updateStickyBar, 50);
      }
    });

    // Listen to input changes (direct text changes on length/qty/width)
    const displayLength = document.getElementById("display-length");
    if (displayLength) {
      displayLength.addEventListener("input", () => setTimeout(updateStickyBar, 50));
      displayLength.addEventListener("change", () => setTimeout(updateStickyBar, 50));
    }

    const displayWidth = document.getElementById("display-width");
    if (displayWidth) {
      displayWidth.addEventListener("input", () => setTimeout(updateStickyBar, 50));
      displayWidth.addEventListener("change", () => setTimeout(updateStickyBar, 50));
    }

    // Watch for variant change select dropdowns
    const variantInputs = document.querySelectorAll('select[name="id"], .single-option-selector');
    variantInputs.forEach(input => {
      input.addEventListener("change", () => {
        setTimeout(updateStickyBar, 50);
      });
    });

    // 3. Link sticky buy click to main buy button click
    if (stickyBuyBtn && mainBuyBtn) {
      stickyBuyBtn.addEventListener("click", () => {
        mainBuyBtn.click();
      });
    }

    // 4. Synchronize states (disabled/loading) from main button to sticky button
    if (mainBuyBtn && stickyBuyBtn) {
      const observer = new MutationObserver(() => {
        stickyBuyBtn.disabled = mainBuyBtn.disabled;
        if (mainBuyBtn.disabled) {
          stickyBuyBtn.classList.add("opacity-50", "cursor-not-allowed");
          stickyBuyBtn.classList.remove("bg-accent");
          stickyBuyBtn.classList.add("bg-slate-200");
          const mainTextSpan = mainBuyBtn.querySelector('span:not(#btn-price-display)');
          let disabledText = "Vent...";
          if (mainTextSpan && mainTextSpan.textContent.includes("Bredde")) {
            disabledText = "Over maks bredde";
          }
          stickyBuyBtn.innerHTML = `<span>${disabledText}</span>`;
        } else {
          stickyBuyBtn.classList.remove("opacity-50", "cursor-not-allowed");
          stickyBuyBtn.classList.remove("bg-slate-200");
          stickyBuyBtn.classList.add("bg-accent");
          stickyBuyBtn.innerHTML = `
            <span id="btn-sticky-buy-text">${btnText}</span>
            <span id="btn-sticky-buy-price" class="ml-1.5"></span>
          `;
          updateStickyBar();
        }
      });
      observer.observe(mainBuyBtn, { attributes: true, attributeFilter: ["disabled", "class"] });
    }

    // 5. Scroll and state handling for sticky buy bar when customizer is present
    const customizerEl = document.getElementById("voksdug-customizer-container");
    const standardContent = document.getElementById("sticky-bar-standard-content");

    if (customizerEl && standardContent) {
      function handleScroll() {
        const rect = customizerEl.getBoundingClientRect();

        // 1. Above Customizer (top of customizer is below screen viewport bottom)
        if (rect.top >= window.innerHeight) {
          // Hide standard buy button
          stickyBar.style.transform = "translateY(100%)";
          stickyBar.style.opacity = "0";
          stickyBar.style.pointerEvents = "none";
        }
        // 2. Customizer is visible in viewport
        else if (rect.top < window.innerHeight && rect.bottom > 0) {
          // Hide standard buy button
          stickyBar.style.transform = "translateY(100%)";
          stickyBar.style.opacity = "0";
          stickyBar.style.pointerEvents = "none";
        }
        // 3. Below Customizer (bottom of customizer is above viewport top)
        else {
          // Show standard buy button
          stickyBar.style.transform = "translateY(0)";
          stickyBar.style.opacity = "1";
          stickyBar.style.pointerEvents = "auto";
        }
      }

      // Initial call
      handleScroll();

      // Listen on scroll and resize, plus window load and safety timeouts for layout shifts
      window.addEventListener("scroll", handleScroll, { passive: true });
      window.addEventListener("resize", handleScroll, { passive: true });
      window.addEventListener("load", handleScroll, { passive: true });
      setTimeout(handleScroll, 200);
      setTimeout(handleScroll, 1000);
    }

    // 6. Hide sticky bar when cart drawer opens, restore when it closes
    let cartHidden = false;
    document.addEventListener("cart-drawer-opened", () => {
      cartHidden = true;
      stickyBar.style.transform = "translateY(100%)";
      stickyBar.style.opacity = "0";
      stickyBar.style.pointerEvents = "none";
    });
    document.addEventListener("cart-drawer-closed", () => {
      cartHidden = false;
      // Let the scroll handler decide visibility again
      if (customizerEl && standardContent) {
        handleScroll();
      } else {
        stickyBar.style.transform = "translateY(0)";
        stickyBar.style.opacity = "1";
        stickyBar.style.pointerEvents = "auto";
      }
    });
  });
})();
