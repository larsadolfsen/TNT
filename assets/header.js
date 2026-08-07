/**
 * Header chrome behaviour: the mobile menu drawer and the search-field toggle.
 * Exposes window.toggleMobileMenu / toggleSearchInput for the inline onclick
 * handlers in blocks/header-hamburger.liquid, blocks/header-search-icon.liquid
 * and snippets/header-mobile-drawer.liquid. Cart drawer lives in header-cart.js.
 */
(function () {
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
  });
})();
