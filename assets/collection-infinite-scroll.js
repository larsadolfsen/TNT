/**
 * Collection infinite scroll: auto-loads the next page of products when the
 * load-more anchor scrolls into view and appends them to #product-grid.
 *
 * Exposes nothing globally. Reads the section id from the
 * #main-collection-config JSON island rendered by sections/main-collection.liquid,
 * and re-binds itself via MutationObserver because assets/main-collection.js
 * replaces #product-grid's innerHTML when filters or sorting change.
 */
(function () {
  // No IntersectionObserver means no auto-loading — the anchor is a real link,
  // so it keeps working as an ordinary page-to-page navigation. Bail before
  // registering the click handler so that native behaviour is preserved.
  if (!('IntersectionObserver' in window)) return;

  var grid = document.getElementById('product-grid');
  if (!grid) return;

  var sectionId = '';
  var configEl = document.getElementById('main-collection-config');
  if (configEl) {
    try {
      sectionId = (JSON.parse(configEl.textContent) || {}).sectionId || '';
    } catch (e) {
      sectionId = '';
    }
  }

  // Start fetching before the customer reaches the bottom so the next batch is
  // usually already in place by the time they scroll to it.
  var ROOT_MARGIN = '600px';

  var loading = false;
  var observer = null;

  function currentAnchor() {
    return grid.querySelector('[data-load-more]');
  }

  function loadNext(anchor) {
    if (loading) return;
    var href = anchor.getAttribute('href');
    if (!href) return;

    loading = true;
    anchor.setAttribute('aria-busy', 'true');
    anchor.classList.add('opacity-50', 'pointer-events-none');

    var url = new URL(href, window.location.origin);
    var params = new URLSearchParams(url.search);
    params.set('section_id', sectionId);

    fetch(url.pathname + '?' + params.toString())
      .then(function (res) {
        // A 404 here returns an empty body, which would otherwise parse into a
        // document with no #product-grid and look like "last page reached" —
        // silently ending the scroll. See docs/failure-log.md F-015.
        if (!res.ok) throw new Error('Load-more request failed: HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        var doc = new DOMParser().parseFromString(html, 'text/html');
        var newGrid = doc.getElementById('product-grid');
        if (!newGrid) throw new Error('No #product-grid in load-more response');

        var wrapper = anchor.closest('[data-load-more-wrapper]') || anchor;
        var incoming = Array.prototype.slice.call(newGrid.children);
        var newWrapper = null;

        incoming.forEach(function (node) {
          if (node.matches('[data-load-more-wrapper]')) {
            newWrapper = node;
            return;
          }
          grid.insertBefore(node, wrapper);
        });

        if (newWrapper) {
          grid.replaceChild(newWrapper, wrapper);
        } else {
          // Last page reached: drop the control entirely.
          wrapper.remove();
        }

        // replaceState, not pushState: Back should leave the collection, not
        // walk back through every batch the customer scrolled past.
        params.delete('section_id');
        var query = params.toString();
        window.history.replaceState({}, '', url.pathname + (query ? '?' + query : ''));
      })
      .catch(function (err) {
        console.error('Error loading more products:', err);
        anchor.removeAttribute('aria-busy');
        anchor.classList.remove('opacity-50', 'pointer-events-none');
      })
      .finally(function () {
        loading = false;
        bind();
      });
  }

  function bind() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    var anchor = currentAnchor();
    if (!anchor) return;
    observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) loadNext(anchor);
        });
      },
      { rootMargin: ROOT_MARGIN }
    );
    observer.observe(anchor);
  }

  grid.addEventListener('click', function (e) {
    var anchor = e.target.closest('[data-load-more]');
    if (!anchor) return;
    e.preventDefault();
    loadNext(anchor);
  });

  // assets/main-collection.js replaces grid.innerHTML on filter/sort/chip
  // changes, which destroys the observed anchor. Skip while `loading` is true
  // so our own appends don't churn the observer needlessly.
  new MutationObserver(function () {
    if (loading) return;
    bind();
  }).observe(grid, { childList: true });

  bind();
})();
