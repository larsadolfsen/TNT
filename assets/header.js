/**
 * Header behaviour: mobile menu drawer, search toggle and the cart drawer
 * (fetch, render, quantity change, remove, money formatting).
 *
 * Moved out of sections/header-2.liquid's inline <script>. Icon markup,
 * localized strings and the shop's money_format arrive through the
 * #header-cart-config JSON island rendered by that section; this file holds no
 * Liquid and no hardcoded copy. Exposes window.addToCart / changeQuantity /
 * removeItem / updateCartUI / toggleCartDrawer / toggleMobileMenu /
 * toggleSearchInput, which the header blocks' inline onclick handlers and the
 * generated cart rows depend on.
 */
(function () {
  /* ---------------------------------------------------------------------
   * Config island (icons, strings, money format)
   *
   * Rendered by sections/header-2.liquid. Missing or malformed JSON must not
   * throw — the drawer still has to open, just without localized copy.
   * ------------------------------------------------------------------- */
  function readConfig() {
    var el = document.getElementById('header-cart-config');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent) || {};
    } catch (e) {
      return {};
    }
  }

  var config = readConfig();
  var strings = config.strings || {};
  var moneyFormat = config.moneyFormat || '';
  var iconShoppingBasketHtml = config.iconShoppingBasket || '';
  var iconDeleteHtml = config.iconDelete || '';

  function text(key) {
    return strings[key] || '';
  }

  /* ---------------------------------------------------------------------
   * Money formatting
   *
   * Cart rows are built from client-fetched /cart.js JSON, so Liquid's `money`
   * filter is out of reach. Replicate the shop's configured money_format
   * client-side, the same way Shopify's own money.js does (mirrors the
   * implementation in assets/predictive-search.js). With no money_format
   * available, fall back to a plain two-decimal amount with comma decimals.
   * ------------------------------------------------------------------- */
  function formatWithDelimiters(cents, precision, thousands, decimal) {
    precision = typeof precision === 'undefined' ? 2 : precision;
    thousands = typeof thousands === 'undefined' ? ',' : thousands;
    decimal = typeof decimal === 'undefined' ? '.' : decimal;
    if (isNaN(cents) || cents === null) return '0';
    var amount = (cents / 100).toFixed(precision);
    var parts = amount.split('.');
    var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    var decimals = parts[1] ? decimal + parts[1] : '';
    return dollars + decimals;
  }

  function formatMoney(cents) {
    if (!moneyFormat) return formatWithDelimiters(cents, 2, '.', ',');
    var match = moneyFormat.match(/\{\{\s*(\w+)\s*\}\}/);
    if (!match) return moneyFormat;
    var value;
    switch (match[1]) {
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      default:
        value = formatWithDelimiters(cents, 2);
    }
    return moneyFormat.replace(/\{\{\s*\w+\s*\}\}/, value);
  }

  function toggleMobileMenu(open) {
    const drawer = document.getElementById("mobile-menu-drawer");
    if (!drawer) return;
    const panel = drawer.querySelector("div");
    if (open) {
      drawer.classList.remove("hidden");
      setTimeout(() => {
        drawer.classList.remove("opacity-0");
        panel.classList.remove("-translate-x-full");
      }, 10);
    } else {
      drawer.classList.add("opacity-0");
      panel.classList.add("-translate-x-full");
      setTimeout(() => {
        drawer.classList.add("hidden");
      }, 300);
    }
  }

  function toggleSearchInput() {
    const searchForm = document.getElementById("header-search-form");
    if (!searchForm) return;
    searchForm.classList.toggle("hidden");
    const shopifyBlock = searchForm.closest('.shopify-block');
    if (shopifyBlock) {
      shopifyBlock.classList.toggle("hidden", searchForm.classList.contains("hidden"));
    }
    if (!searchForm.classList.contains("hidden")) {
      const searchInput = document.getElementById("search-input");
      if (searchInput) {
        searchInput.focus();
      }
    }
  }

  function toggleCartDrawer(open) {
    const drawer = document.getElementById("cart-drawer");
    if (!drawer) return;
    const panel = drawer.querySelector("div");
    if (open) {
      drawer.classList.remove("hidden");
      updateCartUI(); // Refresh contents when opening
      setTimeout(() => {
        drawer.classList.remove("opacity-0");
        panel.classList.remove("translate-x-full");
      }, 10);
    } else {
      drawer.classList.add("opacity-0");
      panel.classList.add("translate-x-full");
      setTimeout(() => {
        drawer.classList.add("hidden");
      }, 300);
    }
  }

  let currentCart = null;

  function renderCart(cart) {
    currentCart = cart;

    // Update the cart counters
    const counters = document.querySelectorAll('#cart-counter');
    counters.forEach(counter => {
      counter.innerText = cart.item_count;
      if (cart.item_count > 0) {
        counter.classList.remove("scale-0");
        counter.classList.add("scale-100");
      } else {
        counter.classList.remove("scale-100");
        counter.classList.add("scale-0");
      }
    });

    // Update the cart drawer
    const cartItemsContainer = document.getElementById("cart-items");
    const cartSubtotal = document.getElementById("cart-subtotal");
    if (!cartItemsContainer || !cartSubtotal) return;

    cartItemsContainer.innerHTML = "";

    if (cart.item_count === 0) {
      cartItemsContainer.innerHTML = `
        <div class="py-12 text-center text-primary/85 flex flex-col items-center justify-center">
          ${iconShoppingBasketHtml}
          <p class="text-sm font-semibold">${text('cartEmpty')}</p>
        </div>
      `;
      cartSubtotal.innerText = formatMoney(0);
      return;
    }

    let calculatedTotalPrice = 0;

    cart.items.forEach(item => {
      let subtitle = item.variant_title || "";
      if (item.properties && Object.keys(item.properties).length > 0) {
        const props = Object.entries(item.properties)
          .map(([k, v]) => {
            if (k.startsWith('_')) return null; // Hide internal properties
            return `${k}: ${v}`;
          })
          .filter(Boolean)
          .join(' • ');
        if (props) {
          subtitle = subtitle ? subtitle + " • " + props : props;
        }
      }

      let imgUrl = item.image ? item.image : "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=150&q=80";
      if (item.properties && item.properties._image) {
        imgUrl = item.properties._image;
      }

      let linePrice = item.final_line_price;
      if (item.properties && item.properties._unit_price) {
        const customUnitPrice = parseInt(item.properties._unit_price, 10);
        const expectedUntransformedPrice = item.price * item.quantity;

        if (item.final_line_price === expectedUntransformedPrice) {
          linePrice = customUnitPrice * item.quantity;
        }
      }

      calculatedTotalPrice += linePrice;

      const isCustom = item.properties && item.properties._base_price;
      let detailsHtml = '';

      if (isCustom) {
        const basePriceCents = parseInt(item.properties._base_price, 10);
        const shapeSurchargeCents = parseInt(item.properties._shape_surcharge || "0", 10);
        const widthSurchargeCents = parseInt(item.properties._width_surcharge || "0", 10);
        const unitPriceCents = basePriceCents + shapeSurchargeCents + widthSurchargeCents;

        let shapeName = text('shapeLabel') + ": " + text('shapeSquare');
        if (item.properties._shape === "rund") {
          shapeName = text('shapeLabel') + ": " + text('shapeRound');
        } else if (item.properties._shape === "oval") {
          shapeName = text('shapeLabel') + ": " + text('shapeOval');
        }

        const width = item.properties._width || "";
        const length = item.properties._length || "";
        let labelText = item.properties._shape === "rund" ? text('diameterLabel') : text('lengthLabel');

        const shapeLine = item.properties._shape ? `
            <div class="flex justify-between gap-2">
              <span>${shapeName}</span>
              <span class="text-primary font-medium flex-shrink-0">${formatMoney(shapeSurchargeCents)}</span>
            </div>
        ` : '';

        const widthLine = item.properties._shape !== "rund" ? `
            <div class="flex justify-between gap-2">
              <span>${text('widthLabel')}: ${width} cm</span>
              <span class="text-primary font-medium flex-shrink-0">${formatMoney(widthSurchargeCents)}</span>
            </div>
        ` : '';

        const customProductTitle = (item.properties && item.properties._metervare_title) ? item.properties._metervare_title : item.product_title;

        detailsHtml = `
          <div>
            <h4 class="text-sm sm:text-base font-semibold text-primary mb-1.5" style="white-space: normal; overflow: visible;" title="${customProductTitle}">${customProductTitle}</h4>
            <div class="space-y-1 text-xs sm:text-sm text-primary/85 font-normal leading-normal">
              <div class="flex justify-between gap-2">
                <span>${labelText}: ${length} cm</span>
                <span class="text-primary font-medium flex-shrink-0">${formatMoney(basePriceCents)}</span>
              </div>
              ${shapeLine}
              ${widthLine}
              <div class="flex justify-between border-t border-outline-variant/60 pt-1 mt-1">
                <span>${text('pricePerItem')}</span>
                <span class="flex-shrink-0">${formatMoney(unitPriceCents)}</span>
              </div>
            </div>
          </div>
        `;
      } else {
        const isLengthCustomized = item.properties && item.properties._length;
        const displayName = isLengthCustomized ? item.title : item.product_title;
        const displaySubtitle = isLengthCustomized ? "" : subtitle;

        detailsHtml = `
          <div>
            <h4 class="text-sm sm:text-base font-semibold text-primary" style="white-space: normal; overflow: visible;" title="${displayName}">${displayName}</h4>
            ${displaySubtitle ? `<p class="text-xs sm:text-sm text-primary/85 truncate">${displaySubtitle}</p>` : ''}
          </div>
        `;
      }

      const itemHtml = `
        <div class="group relative flex gap-4 border-b border-outline-variant/60 pb-4">
          <img src="${imgUrl}" alt="${item.product_title}" class="w-16 h-16 object-cover rounded-xl bg-surface-container flex-shrink-0" />
          <div class="flex-1 min-w-0 flex flex-col justify-between">
            ${detailsHtml}
            <div class="flex justify-between items-center mt-2">
              <div class="flex items-center gap-2">
                <div class="flex items-center border border-outline-variant rounded-full bg-surface-container overflow-hidden">
                  <button onclick="changeQuantity('${item.key}', -1)" class="w-6 h-6 flex items-center justify-center text-primary text-xs font-bold bg-transparent border-0 hover:bg-outline-variant/40 cursor-pointer transition-colors">-</button>
                  <span class="w-6 text-center text-xs sm:text-sm text-primary font-bold">${item.quantity}</span>
                  <button onclick="changeQuantity('${item.key}', 1)" class="w-6 h-6 flex items-center justify-center text-primary text-xs font-bold bg-transparent border-0 hover:bg-outline-variant/40 cursor-pointer transition-colors">+</button>
                </div>
                <button onclick="removeItem('${item.key}')" class="w-8 h-8 flex items-center justify-center text-primary hover:opacity-80 bg-transparent border-0 cursor-pointer transition-opacity duration-200 md:opacity-0 md:group-hover:opacity-100 opacity-100 focus-ring" aria-label="${text('removeItem')}">
                  ${iconDeleteHtml}
                </button>
              </div>
              <span class="text-sm sm:text-base font-bold text-primary">${formatMoney(linePrice)}</span>
            </div>
          </div>
        </div>
      `;
      cartItemsContainer.insertAdjacentHTML("beforeend", itemHtml);
    });

    cartSubtotal.innerText = formatMoney(calculatedTotalPrice);
  }

  async function updateCartUI() {
    try {
      const response = await fetch('/cart.js');
      const cart = await response.json();
      renderCart(cart);
    } catch (error) {
      console.error("Cart update failed:", error);
    }
  }

  async function addToCart(variantId, qty = 1) {
    const counters = document.querySelectorAll('#cart-counter');
    const originalCounts = [];
    counters.forEach(counter => {
      const currentCount = parseInt(counter.innerText) || 0;
      originalCounts.push({ counter, text: counter.innerText, hasScale0: counter.classList.contains("scale-0") });
      const newCount = currentCount + qty;
      counter.innerText = newCount;
      if (newCount > 0) {
        counter.classList.remove("scale-0");
        counter.classList.add("scale-100");
      }
    });

    try {
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: variantId,
          quantity: qty
        })
      });

      if (!response.ok) {
        throw new Error('Could not add product');
      }

      const item = await response.json();
      toggleCartDrawer(true);
    } catch (error) {
      console.error("Add to cart failed:", error);
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
      alert(text('errorAdd'));
    }
  }

  async function changeQuantity(itemKey, change) {
    if (!currentCart) return;

    const existingItem = currentCart.items.find(item => item.key === itemKey);
    if (!existingItem) return;

    const newQty = existingItem.quantity + change;
    if (newQty < 0) return;

    const originalCart = JSON.parse(JSON.stringify(currentCart));

    if (newQty === 0) {
      currentCart.items = currentCart.items.filter(item => item.key !== itemKey);
    } else {
      existingItem.quantity = newQty;
      const unitPrice = (existingItem.properties && existingItem.properties._unit_price)
        ? parseInt(existingItem.properties._unit_price, 10)
        : existingItem.price;
      existingItem.final_line_price = unitPrice * newQty;
    }

    currentCart.item_count = currentCart.items.reduce((sum, item) => sum + item.quantity, 0);

    currentCart.total_price = currentCart.items.reduce((sum, item) => {
      let linePrice = item.final_line_price;
      if (item.properties && item.properties._unit_price) {
        const customUnitPrice = parseInt(item.properties._unit_price, 10);
        const expectedUntransformedPrice = item.price * item.quantity;
        if (item.final_line_price === expectedUntransformedPrice) {
          linePrice = customUnitPrice * item.quantity;
        }
      }
      return sum + linePrice;
    }, 0);

    renderCart(currentCart);

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: newQty
        })
      });

      if (!response.ok) {
        throw new Error('Could not change quantity on the server');
      }

      const updatedCart = await response.json();
      renderCart(updatedCart);
    } catch (error) {
      console.error("Quantity change failed:", error);
      renderCart(originalCart);
      alert(text('errorQuantity'));
    }
  }

  async function removeItem(itemKey) {
    if (!currentCart) return;

    const existingItem = currentCart.items.find(item => item.key === itemKey);
    if (!existingItem) return;

    const originalCart = JSON.parse(JSON.stringify(currentCart));

    currentCart.items = currentCart.items.filter(item => item.key !== itemKey);
    currentCart.item_count = currentCart.items.reduce((sum, item) => sum + item.quantity, 0);

    currentCart.total_price = currentCart.items.reduce((sum, item) => {
      let linePrice = item.final_line_price;
      if (item.properties && item.properties._unit_price) {
        const customUnitPrice = parseInt(item.properties._unit_price, 10);
        const expectedUntransformedPrice = item.price * item.quantity;
        if (item.final_line_price === expectedUntransformedPrice) {
          linePrice = customUnitPrice * item.quantity;
        }
      }
      return sum + linePrice;
    }, 0);

    renderCart(currentCart);

    try {
      const response = await fetch('/cart/change.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: itemKey,
          quantity: 0
        })
      });

      if (!response.ok) {
        throw new Error('Could not remove item on the server');
      }

      const updatedCart = await response.json();
      renderCart(updatedCart);
    } catch (error) {
      console.error("Item removal failed:", error);
      renderCart(originalCart);
      alert(text('errorRemove'));
    }
  }

  window.addToCart = addToCart;
  window.changeQuantity = changeQuantity;
  window.removeItem = removeItem;
  window.updateCartUI = updateCartUI;
  window.toggleCartDrawer = toggleCartDrawer;
  window.toggleMobileMenu = toggleMobileMenu;
  window.toggleSearchInput = toggleSearchInput;

  document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("search-input");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const grid = document.getElementById("product-grid");
        if (grid && typeof window.filterProducts === "function") {
          window.filterProducts();
        }
      });

      const searchForm = searchInput.closest("form");
      if (searchForm) {
        searchForm.addEventListener("submit", (e) => {
          const grid = document.getElementById("product-grid");
          if (grid && typeof window.filterProducts === "function") {
            e.preventDefault();
          }
        });
      }
    }

    const menuDrawer = document.getElementById("mobile-menu-drawer");
    if (menuDrawer) {
      menuDrawer.addEventListener("click", (e) => {
        if (e.target === menuDrawer) {
          toggleMobileMenu(false);
        }
      });
    }

    const cartDrawer = document.getElementById("cart-drawer");
    if (cartDrawer) {
      cartDrawer.addEventListener("click", (e) => {
        if (e.target === cartDrawer) {
          toggleCartDrawer(false);
        }
      });
    }

    updateCartUI();
  });
})();
