/**
 * Subcollections pill/chip row (sections/collection-subcollections.liquid):
 * intercepts clicks on [data-collection-chip="true"] links and AJAX-swaps
 * the product grid, filters, and this chip row itself instead of a full
 * page navigation. Holds no Liquid; the section is effectively
 * single-instance per page (its container uses the fixed id
 * #collection-subcollections-container, not a per-section unique id).
 */
(function () {
  function handleChipClick(e) {
    var chip = e.target.closest('[data-collection-chip="true"]');
    if (!chip || !chip.href || chip.href === '#') return;
    e.preventDefault();
    var targetUrl = chip.href;
    var productGrid = document.getElementById('product-grid');
    var subcollectionsContainer = document.getElementById('collection-subcollections-container');
    var productCountDisplay = document.getElementById('product-count-display');
    var appliedFilters = document.getElementById('applied-filters-container');
    var desktopFilters = document.getElementById('desktop-filters');
    var mobileFilters = document.getElementById('mobile-filters');
    if (productGrid) { productGrid.classList.add('opacity-50', 'pointer-events-none'); }
    fetch(targetUrl)
      .then(function(res) { return res.text(); })
      .then(function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newGrid = doc.getElementById('product-grid');
        if (newGrid && productGrid) { productGrid.innerHTML = newGrid.innerHTML; }
        var newCount = doc.getElementById('product-count-display');
        if (newCount && productCountDisplay) { productCountDisplay.innerText = newCount.innerText; }
        var newApplied = doc.getElementById('applied-filters-container');
        if (newApplied && appliedFilters) {
          appliedFilters.innerHTML = newApplied.innerHTML;
          appliedFilters.className = newApplied.className;
        } else if (appliedFilters) {
          appliedFilters.classList.add('hidden');
        }
        var newDesktop = doc.getElementById('desktop-filters');
        if (newDesktop && desktopFilters) { desktopFilters.innerHTML = newDesktop.innerHTML; }
        var newMobile = doc.getElementById('mobile-filters');
        if (newMobile && mobileFilters) { mobileFilters.innerHTML = newMobile.innerHTML; }
        var newSubs = doc.getElementById('collection-subcollections-container');
        if (newSubs && subcollectionsContainer) {
          subcollectionsContainer.innerHTML = newSubs.innerHTML;
        }
        window.history.pushState({ path: targetUrl }, '', targetUrl);
        if (productGrid) { productGrid.classList.remove('opacity-50', 'pointer-events-none'); }
        if (typeof enhanceColorSwatches === 'function') enhanceColorSwatches();
        if (typeof truncateFilterLists === 'function') truncateFilterLists();
      })
      .catch(function(err) {
        console.error('Chip navigation error:', err);
        if (productGrid) { productGrid.classList.remove('opacity-50', 'pointer-events-none'); }
      });
  }
  document.addEventListener('click', handleChipClick);
})();
