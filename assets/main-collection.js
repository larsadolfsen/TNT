/**
 * Collection grid behaviour: filter list truncation, price-filter sync between
 * desktop/mobile, and AJAX filtering/sorting/collection-chip navigation that
 * swaps #product-grid without a full page reload. Pagination is handled by
 * assets/collection-infinite-scroll.js.
 *
 * Deliberately holds no colour data: swatch colours are rendered in Liquid from
 * collection.filters' own value.swatch.color/.image, so AJAX-swapped filter
 * markup arrives already painted and needs no post-processing here.
 *
 * Moved out of sections/main-collection.liquid's inline <script>. The section
 * key used for the `section_id` param on filter fetches arrives through the
 * #main-collection-config JSON island rendered by that section — it is the
 * short template key ("main-collection"), not section.id, because the Section
 * Rendering API 404s on the long form; this file holds no Liquid. Every fetch
 * here checks res.ok before parsing, so a non-200 lands in the .catch and shows
 * up in the console instead of quietly swapping in nothing. Exposes window.toggleMobileFilter /
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

  // Hold the drawer open briefly after a sort option is picked, so the radio's
  // selected state is visible before the panel slides away.
  const SORT_SELECT_CLOSE_DELAY = 250;

  function selectSortOption(value) {
    const select = document.getElementById('sort-select');
    if (select) {
      select.value = value;
    }
    setTimeout(() => {
      toggleSortDrawer(false);
      filterProducts();
    }, SORT_SELECT_CLOSE_DELAY);
  }

  function toggleFilterBlock(headerEl) {
    const block = headerEl.parentElement;
    const content = block.querySelector('.filter-content');
    const use = block.querySelector('.toggle-icon use');
    if (content.classList.contains('hidden')) {
      content.classList.remove('hidden');
      if (use) use.setAttribute('href', '#icon-minus');
    } else {
      content.classList.add('hidden');
      if (use) use.setAttribute('href', '#icon-plus');
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
      .then(function (res) {
        // A 404 here returns an empty body, which would otherwise parse into a
        // document with no #product-grid — the guards below then skip every swap
        // and the URL is pushed anyway, so a total failure looks exactly like a
        // successful filter. See docs/failure-log.md F-022.
        if (!res.ok) throw new Error('Filter request failed: HTTP ' + res.status);
        return res.text();
      })
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
        .then(function (res) {
          // Without this, a non-200 parses into a document with no #product-grid
          // and the chip silently navigates to a URL whose products never loaded.
          // See docs/failure-log.md F-022.
          if (!res.ok) throw new Error('Collection chip request failed: HTTP ' + res.status);
          return res.text();
        })
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
      .then(function (res) {
        // Without this, a non-200 parses into a document with no #product-grid,
        // so removing a chip (or clearing all filters) leaves the old results on
        // screen under the new URL. See docs/failure-log.md F-022.
        if (!res.ok) throw new Error('Filter chip request failed: HTTP ' + res.status);
        return res.text();
      })
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

  truncateFilterLists();
})();
