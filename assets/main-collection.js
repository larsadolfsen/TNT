/**
 * Collection grid behaviour: color swatch styling, filter list truncation,
 * price-filter sync between desktop/mobile, and AJAX filtering/sorting/
 * collection-chip navigation that swaps #product-grid without a full page
 * reload. Pagination is handled by assets/collection-infinite-scroll.js.
 *
 * Moved out of sections/main-collection.liquid's inline <script>. The
 * section's id (needed for the `section_id` param on filter fetches) arrives
 * through the #main-collection-config JSON island rendered by that section;
 * this file holds no Liquid. Exposes window.toggleMobileFilter /
 * toggleSortDrawer / selectSortOption / toggleFilterBlock / filterProducts /
 * syncPriceFilters / removeFilterChipUrl / clearAllFiltersUrl, which the
 * section's inline onclick/onchange/oninput handlers depend on.
 */
(function () {
  function readConfig() {
    var el = document.getElementById('main-collection-config');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent) || {};
    } catch (e) {
      return {};
    }
  }

  var config = readConfig();
  var sectionId = config.sectionId || '';
  var iconChevronDownHtml = config.iconChevronDown || '';
  var iconChevronUpHtml = config.iconChevronUp || '';

  const productGrid = document.getElementById("product-grid");
  const productCountDisplay = document.getElementById("product-count-display");
  const desktopFilters = document.getElementById("desktop-filters");
  const mobileFilters = document.getElementById("mobile-filters");

  // Dynamic color map from metafields if needed on client side (progressive enhancement)
  const metafieldColorMap = {};

  function isHexLight(color) {
    if (!color || typeof color !== 'string') return false;
    let hex = color.trim();
    if (hex.startsWith('#')) hex = hex.substring(1);
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    if (hex.length !== 6) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
    return brightness > 155;
  }

  function getColorSwatchStyles(colorName) {
    const name = colorName.toLowerCase().trim();

    if (metafieldColorMap[name]) {
      const entry = metafieldColorMap[name];
      if (entry.image) {
        return { bg: `url(${entry.image}) center/cover no-repeat`, isLight: true };
      }
      if (entry.color) {
        return { bg: entry.color, isLight: isHexLight(entry.color) };
      }
    }

    let bg = '#cccccc';
    const colorsMap = {
      'hvid': { bg: '#ffffff', isLight: true },
      'white': { bg: '#ffffff', isLight: true },
      'sort': { bg: '#1a1a1a', isLight: false },
      'black': { bg: '#1a1a1a', isLight: false },
      'grå': { bg: '#8e8e93', isLight: false },
      'graa': { bg: '#8e8e93', isLight: false },
      'gray': { bg: '#8e8e93', isLight: false },
      'grey': { bg: '#8e8e93', isLight: false },
      'antracit': { bg: '#3a3a3c', isLight: false },
      'rød': { bg: '#ff3b30', isLight: false },
      'roed': { bg: '#ff3b30', isLight: false },
      'red': { bg: '#ff3b30', isLight: false },
      'blå': { bg: '#007aff', isLight: false },
      'blaa': { bg: '#007aff', isLight: false },
      'blue': { bg: '#007aff', isLight: false },
      'grøn': { bg: '#34c759', isLight: false },
      'groen': { bg: '#34c759', isLight: false },
      'green': { bg: '#34c759', isLight: false },
      'gul': { bg: '#ffcc00', isLight: true },
      'yellow': { bg: '#ffcc00', isLight: true },
      'orange': { bg: '#ff9500', isLight: false },
      'brun': { bg: '#a2845e', isLight: false },
      'brown': { bg: '#a2845e', isLight: false },
      'pink': { bg: '#ff2d55', isLight: false },
      'lyserød': { bg: '#ffb3c1', isLight: true },
      'lyseroed': { bg: '#ffb3c1', isLight: true },
      'lilla': { bg: '#af52de', isLight: false },
      'purple': { bg: '#af52de', isLight: false },
      'beige': { bg: '#f5f5dc', isLight: true },
      'sand': { bg: '#e5d3b3', isLight: true },
      'creme': { bg: '#fffdd0', isLight: true },
      'cream': { bg: '#fffdd0', isLight: true },
      'guld': { bg: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)', isLight: true },
      'gold': { bg: 'linear-gradient(135deg, #bf953f, #fcf6ba, #b38728, #fbf5b7, #aa771c)', isLight: true },
      'sølv': { bg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', isLight: true },
      'soelv': { bg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', isLight: true },
      'silver': { bg: 'linear-gradient(135deg, #cfd9df 0%, #e2ebf0 100%)', isLight: true },
      'gennemsigtig': { bg: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%), linear-gradient(45deg, #e0e0e0 25%, #ffffff 25%, #ffffff 75%, #e0e0e0 75%)', isLight: true, isCheckered: true },
      'klar': { bg: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%), linear-gradient(45deg, #e0e0e0 25%, #ffffff 25%, #ffffff 75%, #e0e0e0 75%)', isLight: true, isCheckered: true },
      'transparent': { bg: 'linear-gradient(45deg, #e0e0e0 25%, transparent 25%, transparent 75%, #e0e0e0 75%), linear-gradient(45deg, #e0e0e0 25%, #ffffff 25%, #ffffff 75%, #e0e0e0 75%)', isLight: true, isCheckered: true },
      'frosted': { bg: 'linear-gradient(135deg, #eef2f3 0%, #8e9eab 100%)', isLight: true }
    };

    const matchKey = Object.keys(colorsMap).find(k => name.includes(k));
    if (matchKey) {
      return colorsMap[matchKey];
    }

    return { bg: name, isLight: false };
  }

  function enhanceColorSwatches() {
    const swatches = document.querySelectorAll('[data-color-name]');
    swatches.forEach(el => {
      const colorName = el.getAttribute('data-color-name');
      const swatchCircle = el.querySelector('.swatch-circle');
      if (colorName && swatchCircle) {
        const styles = getColorSwatchStyles(colorName);
        swatchCircle.style.background = styles.bg;
        if (styles.isCheckered) {
          swatchCircle.style.backgroundSize = '8px 8px';
          swatchCircle.style.backgroundPosition = '0 0, 4px 4px';
        }
      }
    });
  }

  function truncateFilterLists() {
    const filterContainers = document.querySelectorAll('#desktop-filters > div > div.filter-content, #mobile-filters > div > div.filter-content');
    filterContainers.forEach(container => {
      if (container.classList.contains('filter-block-color')) return;

      const labels = Array.from(container.querySelectorAll('label')).filter(l => l.style.display !== 'none');
      const limit = 8;
      if (labels.length > limit) {
        for (let i = limit; i < labels.length; i++) {
          labels[i].classList.add('hidden', 'truncated-filter-option');
        }

        const toggleBtn = document.createElement('button');
        toggleBtn.type = 'button';
        toggleBtn.className = 'text-xs text-secondary hover:underline bg-transparent border-0 cursor-pointer p-0 mt-2 font-semibold flex items-center gap-1 w-full';
        toggleBtn.innerHTML = `<span>Vis flere (+${labels.length - limit})</span>${iconChevronDownHtml}`;

        toggleBtn.onclick = function() {
          const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
          if (isExpanded) {
            for (let i = limit; i < labels.length; i++) {
              labels[i].classList.add('hidden');
            }
            toggleBtn.setAttribute('aria-expanded', 'false');
            toggleBtn.innerHTML = `<span>Vis flere (+${labels.length - limit})</span>${iconChevronDownHtml}`;
          } else {
            for (let i = limit; i < labels.length; i++) {
              labels[i].classList.remove('hidden');
            }
            toggleBtn.setAttribute('aria-expanded', 'true');
            toggleBtn.innerHTML = `<span>Vis færre</span>${iconChevronUpHtml}`;
          }
        };

        container.appendChild(toggleBtn);
      }
    });
  }

  function syncPriceFilters(changedInput) {
    const id = changedInput.id;
    const val = changedInput.value;
    if (id === 'price-min') {
      const el = document.getElementById('mobile-price-min');
      if (el) el.value = val;
    } else if (id === 'price-max') {
      const el = document.getElementById('mobile-price-max');
      if (el) el.value = val;
    } else if (id === 'mobile-price-min') {
      const el = document.getElementById('price-min');
      if (el) el.value = val;
    } else if (id === 'mobile-price-max') {
      const el = document.getElementById('price-max');
      if (el) el.value = val;
    }
    filterProducts();
  }

  function toggleMobileFilter(open) {
    const drawer = document.getElementById("mobile-filter-drawer");
    if (!drawer) return;
    const panel = drawer.querySelector("div");
    if (open) {
      drawer.classList.remove("hidden");
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

  function toggleSortDrawer(open) {
    const drawer = document.getElementById("sort-drawer");
    if (!drawer) return;
    const panel = drawer.querySelector("div");
    if (open) {
      drawer.classList.remove("hidden");
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

  function selectSortOption(value) {
    const select = document.getElementById('sort-select');
    if (select) {
      select.value = value;
    }
    toggleSortDrawer(false);
    filterProducts();
  }

  function toggleFilterBlock(headerEl) {
    const block = headerEl.parentElement;
    const content = block.querySelector('.filter-content');
    const icon = block.querySelector('.toggle-icon');
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      if (icon) icon.textContent = 'remove';
    } else {
      content.classList.add('hidden');
      if (icon) icon.textContent = 'add';
    }
  }

  document.addEventListener('change', function(e) {
    if (e.target.closest('#desktop-filters input, #mobile-filters input')) {
      if (e.target.classList.contains('filter-checkbox')) {
        const name = e.target.name;
        const value = e.target.value;
        const isChecked = e.target.checked;

        const counterparts = document.querySelectorAll(`input[name="${name}"][value="${value.replace(/"/g, '\\"')}"]`);
        counterparts.forEach(el => el.checked = isChecked);
      }
      filterProducts();
    }
  });

  function filterProducts() {
    const params = new URLSearchParams();

    const checkedInputs = document.querySelectorAll('#desktop-filters input.filter-checkbox:checked');
    checkedInputs.forEach(input => {
      params.append(input.name, input.value);
    });

    const minPrice = document.getElementById('price-min')?.value;
    const maxPrice = document.getElementById('price-max')?.value;
    if (minPrice) params.append('filter.v.price.gte', minPrice);
    if (maxPrice) params.append('filter.v.price.lte', maxPrice);

    const sortBy = document.getElementById('sort-select')?.value;
    if (sortBy) params.append('sort_by', sortBy);

    params.append('section_id', sectionId);

    const url = `${window.location.pathname}?${params.toString()}`;

    if (productGrid) {
      productGrid.classList.add('opacity-50', 'pointer-events-none');
    }

    fetch(url)
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const newGrid = doc.getElementById('product-grid');
        if (newGrid && productGrid) {
          productGrid.innerHTML = newGrid.innerHTML;
        }

        const newProductCount = doc.getElementById('product-count-display');
        if (newProductCount && productCountDisplay) {
          productCountDisplay.innerText = newProductCount.innerText;
        }

        const newAppliedFilters = doc.getElementById('applied-filters-container');
        const appliedFilters = document.getElementById('applied-filters-container');
        if (newAppliedFilters && appliedFilters) {
          appliedFilters.innerHTML = newAppliedFilters.innerHTML;
          appliedFilters.className = newAppliedFilters.className;
        } else if (appliedFilters) {
          appliedFilters.classList.add('hidden');
        }

        const newDesktopFilters = doc.getElementById('desktop-filters');
        if (newDesktopFilters && desktopFilters) {
          desktopFilters.innerHTML = newDesktopFilters.innerHTML;
        }

        const newMobileFilters = doc.getElementById('mobile-filters');
        if (newMobileFilters && mobileFilters) {
          mobileFilters.innerHTML = newMobileFilters.innerHTML;
        }

        enhanceColorSwatches();
        truncateFilterLists();

        params.delete('section_id');
        const newUrl = `${window.location.pathname}?${params.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        if (productGrid) {
          productGrid.classList.remove('opacity-50', 'pointer-events-none');
        }
      })
      .catch(err => {
        console.error('Error filtering products:', err);
        if (productGrid) {
          productGrid.classList.remove('opacity-50', 'pointer-events-none');
        }
      });
  }

  document.addEventListener('click', function(e) {
    const chip = e.target.closest('[data-collection-chip="true"]');
    if (chip) {
      e.preventDefault();
      const url = new URL(chip.href);

      if (productGrid) {
        productGrid.classList.add('opacity-50', 'pointer-events-none');
      }

      fetch(url.href)
        .then(res => res.text())
        .then(html => {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          const newGrid = doc.getElementById('product-grid');
          if (newGrid && productGrid) {
            productGrid.innerHTML = newGrid.innerHTML;
          }

          const newProductCount = doc.getElementById('product-count-display');
          if (newProductCount && productCountDisplay) {
            productCountDisplay.innerText = newProductCount.innerText;
          }

          const newAppliedFilters = doc.getElementById('applied-filters-container');
          const appliedFilters = document.getElementById('applied-filters-container');
          if (newAppliedFilters && appliedFilters) {
            appliedFilters.innerHTML = newAppliedFilters.innerHTML;
            appliedFilters.className = newAppliedFilters.className;
          } else if (appliedFilters) {
            appliedFilters.classList.add('hidden');
          }

          const newDesktopFilters = doc.getElementById('desktop-filters');
          if (newDesktopFilters && desktopFilters) {
            desktopFilters.innerHTML = newDesktopFilters.innerHTML;
          }

          const newMobileFilters = doc.getElementById('mobile-filters');
          if (newMobileFilters && mobileFilters) {
            mobileFilters.innerHTML = newMobileFilters.innerHTML;
          }

          const newSubcollections = doc.getElementById('collection-subcollections-container');
          const subcollections = document.getElementById('collection-subcollections-container');
          if (newSubcollections && subcollections) {
            subcollections.innerHTML = newSubcollections.innerHTML;
            subcollections.className = newSubcollections.className;
          }

          enhanceColorSwatches();
          truncateFilterLists();

          window.history.pushState({ path: url.href }, '', url.href);

          if (productGrid) {
            productGrid.classList.remove('opacity-50', 'pointer-events-none');
          }
        })
        .catch(err => {
          console.error('Error filtering collection by chip:', err);
          if (productGrid) {
            productGrid.classList.remove('opacity-50', 'pointer-events-none');
          }
        });
      return;
    }
  });

  function fetchAndSwapUrl(urlStr) {
    const url = new URL(urlStr, window.location.origin);
    const params = new URLSearchParams(url.search);
    params.append('section_id', sectionId);

    if (productGrid) {
      productGrid.classList.add('opacity-50', 'pointer-events-none');
    }

    fetch(`${url.pathname}?${params.toString()}`)
      .then(res => res.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const newGrid = doc.getElementById('product-grid');
        if (newGrid && productGrid) {
          productGrid.innerHTML = newGrid.innerHTML;
        }

        const newProductCount = doc.getElementById('product-count-display');
        if (newProductCount && productCountDisplay) {
          productCountDisplay.innerText = newProductCount.innerText;
        }

        const newAppliedFilters = doc.getElementById('applied-filters-container');
        const appliedFilters = document.getElementById('applied-filters-container');
        if (newAppliedFilters && appliedFilters) {
          appliedFilters.innerHTML = newAppliedFilters.innerHTML;
          appliedFilters.className = newAppliedFilters.className;
        } else if (appliedFilters) {
          appliedFilters.classList.add('hidden');
        }

        const newDesktopFilters = doc.getElementById('desktop-filters');
        if (newDesktopFilters && desktopFilters) {
          desktopFilters.innerHTML = newDesktopFilters.innerHTML;
        }

        const newMobileFilters = doc.getElementById('mobile-filters');
        if (newMobileFilters && mobileFilters) {
          mobileFilters.innerHTML = newMobileFilters.innerHTML;
        }

        enhanceColorSwatches();
        truncateFilterLists();

        params.delete('section_id');
        const newUrl = `${url.pathname}?${params.toString()}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        if (productGrid) {
          productGrid.classList.remove('opacity-50', 'pointer-events-none');
        }
      })
      .catch(err => {
        console.error('Error removing chip:', err);
        if (productGrid) {
          productGrid.classList.remove('opacity-50', 'pointer-events-none');
        }
      });
  }

  window.toggleMobileFilter = toggleMobileFilter;
  window.toggleSortDrawer = toggleSortDrawer;
  window.selectSortOption = selectSortOption;
  window.toggleFilterBlock = toggleFilterBlock;
  window.filterProducts = filterProducts;
  window.syncPriceFilters = syncPriceFilters;
  window.removeFilterChipUrl = function(e, urlStr) {
    e.preventDefault();
    fetchAndSwapUrl(urlStr);
  };
  window.clearAllFiltersUrl = function(e, urlStr) {
    e.preventDefault();
    fetchAndSwapUrl(urlStr);
  };

  document.addEventListener('DOMContentLoaded', () => {
    const mobileFilterDrawer = document.getElementById('mobile-filter-drawer');
    if (mobileFilterDrawer) {
      mobileFilterDrawer.addEventListener('click', (e) => {
        if (e.target === mobileFilterDrawer) {
          toggleMobileFilter(false);
        }
      });
    }

    const sortDrawer = document.getElementById('sort-drawer');
    if (sortDrawer) {
      sortDrawer.addEventListener('click', (e) => {
        if (e.target === sortDrawer) {
          toggleSortDrawer(false);
        }
      });
    }
  });

  enhanceColorSwatches();
  truncateFilterLists();
})();
