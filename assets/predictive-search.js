/**
 * Predictive search (Surface 4).
 *
 * Wires every [data-ps-input] (the desktop inline bar's #search-input and
 * the mobile full-screen takeover's input) to Shopify's
 * /search/suggest.json endpoint: debounce, abort, timeout, out-of-order
 * guard, small in-memory cache, full combobox keyboard support, and the
 * mobile takeover's open/close/focus-trap.
 *
 * Bails out entirely when a #product-grid exists on the page — an
 * unrelated legacy behavior in sections/header-2.liquid already wires
 * #search-input to a client-side collection filter (window.filterProducts)
 * and must not be fought here. See docs/missing-surface-designs.md
 * Surface 4, Open question 4.
 *
 * Both blocks/header-search.liquid and blocks/header-search-icon.liquid can
 * each emit a <script src="predictive-search.js"> tag on the same page (the
 * icon block always loads it, independent of its own predictive_search
 * setting, so its mobile-trigger fallback works even when the desktop bar's
 * predictive search is off). Guard against running init() twice, which
 * would double-bind the mobile overlay's open/close listeners.
 */
(function () {
  if (window.__tntPredictiveSearchLoaded) return;
  window.__tntPredictiveSearchLoaded = true;

  if (document.getElementById('product-grid')) return;

  var DEBOUNCE_MS = 200;
  var MIN_CHARS = 2;
  var TIMEOUT_MS = 5000;
  var CACHE_LIMIT = 10;
  var LIVE_REGION_DEBOUNCE_MS = 500;

  var cache = new Map();

  function getStrings(id) {
    var el = document.querySelector('[data-ps-strings="' + id + '"]');
    if (!el) return {};
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      return {};
    }
  }

  function format(template, params) {
    if (!template) return '';
    return template.replace(/\{(\w+)\}/g, function (match, key) {
      return Object.prototype.hasOwnProperty.call(params, key) ? params[key] : match;
    });
  }

  /* Money formatting uses shared formatter from assets/money.js */
  function centsFromDecimalString(value) {
    var n = parseFloat(value);
    if (isNaN(n)) return 0;
    return Math.round(n * 100);
  }

  function buildUrl(query, productsLimit, otherLimit, showQueries) {
    var limit = Math.max(productsLimit, otherLimit, 1);
    var types = ['product', 'collection', 'page', 'article'];
    if (showQueries) types.push('query');
    var params = new URLSearchParams({
      q: query,
      'resources[type]': types.join(','),
      'resources[limit]': String(limit),
      'resources[limit_scope]': 'each',
      'resources[options][unavailable_products]': 'last',
    });
    return '/search/suggest.json?' + params.toString();
  }

  /* ---------------------------------------------------------------------
   * One controller per predictive-search input
   * ------------------------------------------------------------------- */
  function PredictiveSearch(input) {
    this.input = input;
    this.resultsId = input.getAttribute('aria-controls');
    this.panel = document.getElementById(this.resultsId);
    if (!this.panel) return;

    this.strings = getStrings(this.panel.getAttribute('data-ps-panel'));
    this.moneyFormat = this.strings.moneyFormat || '${{amount}}';
    this.productsLimit = parseInt(input.getAttribute('data-ps-results-products'), 10) || 5;
    this.otherLimit = parseInt(input.getAttribute('data-ps-results-other'), 10) || 3;
    this.showQueries = input.getAttribute('data-ps-show-queries') !== 'false';

    this.debounceTimer = null;
    this.abortController = null;
    this.timeoutTimer = null;
    this.liveRegionTimer = null;
    this.currentQuery = '';
    this.lastRenderedQuery = null;
    this.highlightIndex = -1;
    this.hasResults = false;
    this.form = input.closest('form') || input.closest('[data-ps-form]');

    this.liveRegion = document.querySelector('[data-ps-live-region="' + this.panel.getAttribute('data-ps-panel') + '"]');

    this.stateEls = {
      loadingFirst: this.panel.querySelector('[data-ps-state="loading-first"]'),
      results: this.panel.querySelector('[data-ps-state="results"]'),
      noResults: this.panel.querySelector('[data-ps-state="no-results"]'),
      error: this.panel.querySelector('[data-ps-state="error"]'),
    };
    this.refiningBar = this.panel.querySelector('[data-ps-refining-bar]');
    this.queriesEl = this.panel.querySelector('[data-ps-queries]');
    this.dividerEl = this.panel.querySelector('[data-ps-divider]');
    this.productsGroupEl = this.panel.querySelector('[data-ps-products-group]');
    this.productsListEl = this.panel.querySelector('[data-ps-products-list]');
    this.otherGroupEl = this.panel.querySelector('[data-ps-other-group]');
    this.otherHeadingEl = this.panel.querySelector('[data-ps-other-heading]');
    this.otherListEl = this.panel.querySelector('[data-ps-other-list]');
    this.footerEl = this.panel.querySelector('[data-ps-footer]');
    this.seeAllBtn = this.panel.querySelector('[data-ps-see-all]');
    this.seeAllAltBtn = this.panel.querySelector('[data-ps-see-all-alt]');
    this.retryBtn = this.panel.querySelector('[data-ps-retry]');
    this.noResultsSuggestions = this.panel.querySelector('[data-ps-no-results-suggestions]');
    this.noResultsQueries = this.panel.querySelector('[data-ps-no-results-queries]');
    this.skeletonHost = this.panel.querySelector('[data-ps-skeleton-host]');

    var owner = this.panel.getAttribute('data-ps-panel');
    this.templates = {
      query: document.querySelector('template[data-ps-template="query"][data-ps-owner="' + owner + '"]'),
      other: document.querySelector('template[data-ps-template="other"][data-ps-owner="' + owner + '"]'),
      product: document.querySelector('template[data-ps-template="product"][data-ps-owner="' + owner + '"]'),
      skeletonRow: document.querySelector('template[data-ps-template="skeleton-row"][data-ps-owner="' + owner + '"]'),
    };
    this.icons = {
      collection: this.iconHtml('collection', owner),
      page: this.iconHtml('page', owner),
    };

    this.bind();
  }

  PredictiveSearch.prototype.iconHtml = function (name, owner) {
    var el = document.querySelector('template[data-ps-icon="' + name + '"][data-ps-owner="' + owner + '"]');
    return el ? el.innerHTML : '';
  };

  PredictiveSearch.prototype.bind = function () {
    var self = this;

    this.input.addEventListener('input', function () {
      self.onInput();
    });

    this.input.addEventListener('keydown', function (event) {
      self.onKeydown(event);
    });

    this.input.addEventListener('focus', function () {
      if (self.input.value.trim().length >= MIN_CHARS && self.hasResults) {
        self.openPanel();
      }
    });

    document.addEventListener('click', function (event) {
      if (!self.panel.hidden && !self.panel.contains(event.target) && event.target !== self.input) {
        self.closePanel();
      }
    });

    if (this.retryBtn) {
      this.retryBtn.addEventListener('click', function () {
        self.runQuery(self.currentQuery, true);
      });
    }

    if (this.seeAllBtn) {
      this.seeAllBtn.addEventListener('click', function () {
        self.submitForm();
      });
    }
    if (this.seeAllAltBtn) {
      this.seeAllAltBtn.addEventListener('click', function () {
        self.submitForm();
      });
    }
  };

  PredictiveSearch.prototype.submitForm = function () {
    if (this.form && typeof this.form.submit === 'function') {
      this.form.submit();
    } else {
      window.location.href = '/search?q=' + encodeURIComponent(this.input.value);
    }
  };

  PredictiveSearch.prototype.onInput = function () {
    var query = this.input.value.trim();
    this.currentQuery = query;
    this.highlightIndex = -1;
    this.input.removeAttribute('aria-activedescendant');

    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    if (query.length < MIN_CHARS) {
      this.closePanel();
      this.hasResults = false;
      return;
    }

    var self = this;
    this.debounceTimer = setTimeout(function () {
      self.runQuery(query, false);
    }, DEBOUNCE_MS);
  };

  PredictiveSearch.prototype.runQuery = function (query, isRetry) {
    var self = this;

    if (!navigator.onLine) {
      this.showError(this.strings.offline);
      this.openPanel();
      return;
    }

    if (cache.has(query) && !isRetry) {
      this.render(query, cache.get(query));
      this.openPanel();
      return;
    }

    var hadPriorResults = this.hasResults && this.lastRenderedQuery;
    if (hadPriorResults) {
      this.showRefining();
    } else {
      this.showLoadingFirst();
    }
    this.openPanel();

    if (this.abortController) this.abortController.abort();
    this.abortController = new AbortController();
    if (this.timeoutTimer) clearTimeout(this.timeoutTimer);
    this.timeoutTimer = setTimeout(function () {
      if (self.abortController) self.abortController.abort();
    }, TIMEOUT_MS);

    var url = buildUrl(query, this.productsLimit, this.otherLimit, this.showQueries);

    fetch(url, { signal: this.abortController.signal })
      .then(function (response) {
        if (!response.ok) throw new Error('predictive-search-http-error');
        return response.json();
      })
      .then(function (data) {
        clearTimeout(self.timeoutTimer);
        if (query !== self.currentQuery) return; // out of order, discard
        var results = (data && data.resources && data.resources.results) || {};
        cache.set(query, results);
        if (cache.size > CACHE_LIMIT) {
          var oldestKey = cache.keys().next().value;
          cache.delete(oldestKey);
        }
        self.render(query, results);
      })
      .catch(function (error) {
        clearTimeout(self.timeoutTimer);
        if (error && error.name === 'AbortError') return;
        if (query !== self.currentQuery) return;
        self.showError(self.strings.unavailable);
      });
  };

  /* ---------------------------------------------------------------------
   * State rendering
   * ------------------------------------------------------------------- */
  PredictiveSearch.prototype.hideAllStates = function () {
    var self = this;
    Object.keys(this.stateEls).forEach(function (key) {
      var el = self.stateEls[key];
      if (el) el.classList.add('hidden');
    });
    if (this.refiningBar) this.refiningBar.classList.add('hidden');
    if (this.stateEls.results) this.stateEls.results.classList.remove('opacity-60');
  };

  PredictiveSearch.prototype.showLoadingFirst = function () {
    this.hideAllStates();
    if (this.skeletonHost && this.templates.skeletonRow) {
      this.skeletonHost.innerHTML = '';
      for (var i = 0; i < 3; i++) {
        this.skeletonHost.appendChild(this.templates.skeletonRow.content.cloneNode(true));
      }
    }
    if (this.stateEls.loadingFirst) this.stateEls.loadingFirst.classList.remove('hidden');
  };

  PredictiveSearch.prototype.showRefining = function () {
    if (this.stateEls.results) this.stateEls.results.classList.add('opacity-60');
    if (this.refiningBar) this.refiningBar.classList.remove('hidden');
  };

  PredictiveSearch.prototype.showError = function (message) {
    this.hideAllStates();
    var messageEl = this.stateEls.error && this.stateEls.error.querySelector('[data-field="error-message"]');
    if (messageEl) messageEl.textContent = message || this.strings.unavailable;
    if (this.stateEls.error) this.stateEls.error.classList.remove('hidden');
    this.hasResults = false;
    this.announce(this.strings.searchUnavailable);
  };

  PredictiveSearch.prototype.render = function (query, results) {
    this.hideAllStates();
    this.lastRenderedQuery = query;

    // The endpoint is asked for max(productsLimit, otherLimit) results PER
    // TYPE (resources[limit_scope]=each applies one number to every type in
    // the same request — /search/suggest.json has no per-type limit), so
    // each group is re-trimmed to its own setting here.
    var products = (results.products || []).slice(0, this.productsLimit);
    var collections = results.collections || [];
    var pages = results.pages || [];
    var articles = results.articles || [];
    var queries = results.queries || [];
    var othersTagged = collections
      .map(function (item) { return { item: item, kind: 'collection' }; })
      .concat(pages.map(function (item) { return { item: item, kind: 'page' }; }))
      .concat(articles.map(function (item) { return { item: item, kind: 'page' }; }))
      .slice(0, this.otherLimit);

    var totalCount = products.length + othersTagged.length + queries.length;

    if (totalCount === 0) {
      this.renderNoResults(query, queries);
      this.hasResults = false;
      this.announce(this.strings.noResultsFound);
      return;
    }

    this.hasResults = true;
    this.rows = [];

    // Query suggestions
    if (this.showQueries && queries.length && this.queriesEl) {
      this.queriesEl.innerHTML = '';
      queries.slice(0, 4).forEach(function (q) {
        var row = this.buildQueryRow(q);
        this.queriesEl.appendChild(row);
        this.rows.push(row);
      }, this);
      this.queriesEl.classList.remove('hidden');
    } else if (this.queriesEl) {
      this.queriesEl.classList.add('hidden');
    }

    if (this.dividerEl) {
      if (this.showQueries && queries.length && products.length) {
        this.dividerEl.classList.remove('hidden');
      } else {
        this.dividerEl.classList.add('hidden');
      }
    }

    // Products
    if (products.length && this.productsListEl) {
      this.productsListEl.innerHTML = '';
      products.forEach(function (product) {
        var row = this.buildProductRow(product);
        this.productsListEl.appendChild(row);
        this.rows.push(row);
      }, this);
      if (this.productsGroupEl) this.productsGroupEl.classList.remove('hidden');
    } else if (this.productsGroupEl) {
      this.productsGroupEl.classList.add('hidden');
    }

    // Collections & pages
    if (othersTagged.length && this.otherListEl) {
      this.otherListEl.innerHTML = '';
      var hasCollection = false;
      var hasPage = false;
      othersTagged.forEach(function (entry) {
        if (entry.kind === 'collection') hasCollection = true;
        else hasPage = true;
        var row = this.buildOtherRow(entry.item, entry.kind);
        this.otherListEl.appendChild(row);
        this.rows.push(row);
      }, this);
      if (this.otherHeadingEl) {
        var heading = hasCollection && hasPage
          ? this.strings.collectionsAndPages
          : hasCollection
          ? this.strings.collections
          : this.strings.pages;
        this.otherHeadingEl.textContent = heading;
        if (this.otherGroupEl) this.otherGroupEl.setAttribute('aria-label', heading);
      }
      if (this.otherGroupEl) this.otherGroupEl.classList.remove('hidden');
    } else if (this.otherGroupEl) {
      this.otherGroupEl.classList.add('hidden');
    }

    // Footer "see all results"
    if (this.footerEl) {
      var label = format(this.strings.seeAllResultsFor, { query: query });
      var labelEl = this.seeAllBtn && this.seeAllBtn.querySelector('[data-field="see-all-label"]');
      if (labelEl) labelEl.textContent = label;
      this.footerEl.classList.remove('hidden');
    }

    // Assign option ids for aria-activedescendant
    this.rows.forEach(function (row, index) {
      row.id = this.resultsId + '-option-' + index;
    }, this);

    this.highlightIndex = -1;
    this.input.removeAttribute('aria-activedescendant');

    if (this.stateEls.results) this.stateEls.results.classList.remove('hidden');

    this.announce(format(this.strings.resultsFound, { count: products.length }));
  };

  PredictiveSearch.prototype.renderNoResults = function (query, queries) {
    var titleEl = this.stateEls.noResults && this.stateEls.noResults.querySelector('[data-field="no-results-title"]');
    if (titleEl) titleEl.textContent = format(this.strings.noMatchesFor, { query: query });

    if (this.noResultsQueries) {
      this.noResultsQueries.innerHTML = '';
      var shown = (queries || []).slice(0, 3);
      if (shown.length) {
        shown.forEach(function (q) {
          this.noResultsQueries.appendChild(this.buildQueryRow(q));
        }, this);
        if (this.noResultsSuggestions) this.noResultsSuggestions.classList.remove('hidden');
      } else if (this.noResultsSuggestions) {
        this.noResultsSuggestions.classList.add('hidden');
      }
    }

    var altLabelEl = this.seeAllAltBtn && this.seeAllAltBtn.querySelector('[data-field="see-all-alt-label"]');
    if (altLabelEl) altLabelEl.textContent = this.strings.seeAllResults;

    if (this.stateEls.noResults) this.stateEls.noResults.classList.remove('hidden');
  };

  /* ---------------------------------------------------------------------
   * Row builders (clone + hydrate <template>s)
   * ------------------------------------------------------------------- */
  PredictiveSearch.prototype.buildQueryRow = function (query) {
    var node = this.templates.query.content.firstElementChild.cloneNode(true);
    var text = (query && (query.text || query.title)) || '';
    node.setAttribute('href', (query && (query.url || ('/search?q=' + encodeURIComponent(text)))) || '#');
    var textEl = node.querySelector('[data-field="text"]');
    if (textEl) textEl.textContent = text;
    return node;
  };

  PredictiveSearch.prototype.buildOtherRow = function (item, kind) {
    var node = this.templates.other.content.firstElementChild.cloneNode(true);
    node.setAttribute('href', item.url || '#');
    var textEl = node.querySelector('[data-field="text"]');
    if (textEl) textEl.textContent = item.title || '';
    var iconEl = node.querySelector('[data-field="icon"]');
    if (iconEl) iconEl.innerHTML = kind === 'collection' ? this.icons.collection : this.icons.page;
    return node;
  };

  PredictiveSearch.prototype.buildProductRow = function (product) {
    var node = this.templates.product.content.firstElementChild.cloneNode(true);
    node.setAttribute('href', product.url || '#');

    var titleEl = node.querySelector('[data-field="title"]');
    if (titleEl) titleEl.textContent = product.title || '';

    var contextParts = [];
    if (product.type) contextParts.push(product.type);
    var contextEl = node.querySelector('[data-field="context"]');
    if (contextEl && contextParts.length) {
      contextEl.textContent = contextParts.join(' · ');
      contextEl.classList.remove('hidden');
    }

    // /search/suggest.json's documented product resource exposes the
    // thumbnail as a plain `image` URL string — there is no `featured_image`
    // object on this endpoint (that shape belongs to the Liquid `product`
    // object, not the JSON one).
    var imageUrl = product.image || '';
    var imageEl = node.querySelector('[data-field="image"]');
    var fallbackEl = node.querySelector('[data-field="thumb-fallback"]');
    if (imageUrl && imageEl) {
      imageEl.src = imageUrl;
      imageEl.classList.remove('hidden');
      if (fallbackEl) fallbackEl.classList.add('hidden');
    }

    var priceEl = node.querySelector('[data-field="price"]');
    var compareEl = node.querySelector('[data-field="compare"]');
    var soldOutEl = node.querySelector('[data-field="sold-out"]');
    var unitPriceEl = node.querySelector('[data-field="unit-price"]');

    if (product.available === false) {
      if (priceEl) priceEl.classList.add('hidden');
      if (soldOutEl) soldOutEl.classList.remove('hidden');
    } else if (priceEl) {
      var priceText = window.themeMoney.formatMoney(centsFromDecimalString(product.price), this.moneyFormat);
      if (product.price_varies) priceText = this.strings.fromPrefix + priceText;
      priceEl.textContent = priceText;

      // The endpoint has no singular `compare_at_price` field — only
      // `compare_at_price_min`/`_max`, which come back as "0.0" (not null)
      // when no compare-at price is set, so a genuine discount is only
      // present when the compare-at minimum is actually higher than price.
      var compareAtMin = product.compare_at_price_min != null ? parseFloat(product.compare_at_price_min) : 0;
      var priceMinValue = product.price_min != null ? parseFloat(product.price_min) : parseFloat(product.price);
      if (compareEl && compareAtMin > 0 && compareAtMin > priceMinValue) {
        compareEl.textContent = window.themeMoney.formatMoney(centsFromDecimalString(product.compare_at_price_min), this.moneyFormat);
        compareEl.classList.remove('hidden');
      }

      // Unit pricing (Surface 12) can't be rendered via
      // {% render 'unit-price' %} here — these rows are cloned from client-
      // fetched JSON, not re-rendered through Liquid per result, and
      // /search/suggest.json's documented product schema does not expose
      // unit_price / unit_price_measurement (see docs/missing-surface-designs.md
      // Surface 4, Open question 3). This mirrors snippets/unit-price.liquid's
      // 'xs' output/classes and populates only if that data is ever present
      // on the response, staying hidden otherwise rather than showing
      // nothing where a render call would have silently done the same. Only
      // considered when the item is purchasable — sold-out rows show the
      // "Sold out" label in the same slot instead.
      if (unitPriceEl) {
        var measurement = product.unit_price_measurement;
        if (measurement && product.unit_price != null) {
          var unitSuffix = measurement.reference_unit;
          if (measurement.reference_value && measurement.reference_value !== 1) {
            unitSuffix = measurement.reference_value + ' ' + unitSuffix;
          }
          unitPriceEl.textContent = window.themeMoney.formatMoney(centsFromDecimalString(product.unit_price), this.moneyFormat) + ' / ' + unitSuffix;
          unitPriceEl.classList.remove('hidden');
        }
      }
    }

    return node;
  };

  /* ---------------------------------------------------------------------
   * Panel open/close + keyboard
   * ------------------------------------------------------------------- */
  PredictiveSearch.prototype.openPanel = function () {
    this.panel.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
  };

  PredictiveSearch.prototype.closePanel = function () {
    this.panel.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.highlightIndex = -1;
    this.input.removeAttribute('aria-activedescendant');
  };

  PredictiveSearch.prototype.announce = function (message) {
    var self = this;
    if (this.liveRegionTimer) clearTimeout(this.liveRegionTimer);
    this.liveRegionTimer = setTimeout(function () {
      if (self.liveRegion) self.liveRegion.textContent = message || '';
    }, LIVE_REGION_DEBOUNCE_MS);
  };

  PredictiveSearch.prototype.setHighlight = function (index) {
    if (!this.rows || !this.rows.length) return;
    this.rows.forEach(function (row) {
      row.removeAttribute('data-ps-cursor');
      row.setAttribute('aria-selected', 'false');
    });
    if (index < 0) {
      this.highlightIndex = -1;
      this.input.removeAttribute('aria-activedescendant');
      return;
    }
    var row = this.rows[index];
    if (!row) return;
    row.setAttribute('data-ps-cursor', 'true');
    row.setAttribute('aria-selected', 'true');
    row.scrollIntoView({ block: 'nearest' });
    this.highlightIndex = index;
    this.input.setAttribute('aria-activedescendant', row.id);
  };

  PredictiveSearch.prototype.onKeydown = function (event) {
    // Escape must work regardless of whether the panel is currently open —
    // "first press closes the panel, second press (panel already closed)
    // clears the input" — so it is handled before the guard below, which
    // would otherwise return early and make the second press a no-op.
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.highlightIndex >= 0) {
        this.setHighlight(-1);
      } else if (!this.panel.hidden) {
        this.closePanel();
      } else if (this.input.value) {
        this.input.value = '';
        this.currentQuery = '';
        this.hasResults = false;
      }
      return;
    }

    if (this.panel.hidden || !this.rows || !this.rows.length) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.setHighlight((this.highlightIndex + 1) % this.rows.length);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.setHighlight((this.highlightIndex - 1 + this.rows.length) % this.rows.length);
        break;
      case 'Home':
        event.preventDefault();
        this.setHighlight(0);
        break;
      case 'End':
        event.preventDefault();
        this.setHighlight(this.rows.length - 1);
        break;
      case 'Enter':
        if (this.highlightIndex >= 0 && this.rows[this.highlightIndex]) {
          event.preventDefault();
          window.location.href = this.rows[this.highlightIndex].getAttribute('href');
        }
        // else: let the form submit normally.
        break;
      case 'Tab':
        this.closePanel();
        break;
      default:
        break;
    }
  };

  /* ---------------------------------------------------------------------
   * Mobile full-screen takeover
   * ------------------------------------------------------------------- */
  function initMobileOverlay(trigger) {
    // Scoped to this trigger's own block instance (both the trigger button
    // and its overlay are rendered inside the same Shopify block wrapper by
    // blocks/header-search-icon.liquid) so multiple header-search-icon
    // blocks on one page each open their own overlay rather than all
    // triggers reaching for the first overlay found in the document.
    var scope = trigger.closest('[id^="shopify-block-"]') || document;
    var overlay = scope.querySelector('[data-ps-mobile-overlay]');
    if (!overlay) {
      // Predictive search disabled for this search-icon block — fall back
      // to legacy inline-bar toggle behavior.
      trigger.addEventListener('click', function () {
        if (typeof window.toggleSearchInput === 'function') window.toggleSearchInput();
      });
      return;
    }

    var input = overlay.querySelector('[data-ps-input]');
    var closeBtn = overlay.querySelector('[data-ps-mobile-close]');
    var clearBtn = overlay.querySelector('[data-ps-mobile-clear]');
    var lastFocused = null;
    var inertTargets = null;

    // Everything NOT on the overlay's own ancestor chain — i.e. the rest of
    // the page — gets `inert` (+ aria-hidden as a fallback for browsers
    // without it) while the takeover is open, per the modal pattern the
    // spec calls for. Walking from the overlay up to <body> and collecting
    // siblings at each level covers the whole page without having to know
    // its layout in advance.
    function collectOutsideSiblings(el) {
      var outside = [];
      var node = el;
      while (node && node.parentElement && node !== document.body) {
        var parent = node.parentElement;
        Array.prototype.forEach.call(parent.children, function (sibling) {
          if (sibling !== node) outside.push(sibling);
        });
        node = parent;
      }
      return outside;
    }

    function open() {
      var isMobile = window.matchMedia('(max-width: 839px)').matches;
      if (!isMobile) {
        if (typeof window.toggleSearchInput === 'function') window.toggleSearchInput();
        return;
      }
      lastFocused = document.activeElement;
      overlay.classList.add('is-open');
      document.body.style.overflow = 'hidden';

      inertTargets = collectOutsideSiblings(overlay);
      inertTargets.forEach(function (el) {
        if ('inert' in el) el.inert = true;
        el.setAttribute('aria-hidden', 'true');
      });

      if (input) input.focus();
      document.addEventListener('keydown', onKeydown, true);
    }

    function close() {
      overlay.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown, true);

      if (inertTargets) {
        inertTargets.forEach(function (el) {
          if ('inert' in el) el.inert = false;
          el.removeAttribute('aria-hidden');
        });
        inertTargets = null;
      }

      if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }
      if (event.key === 'Tab') {
        var focusables = Array.prototype.slice.call(
          overlay.querySelectorAll('a[href], button:not([disabled]), input:not([disabled])')
        );
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    trigger.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.focus();
        }
      });
    }
    if (input && clearBtn) {
      input.addEventListener('input', function () {
        clearBtn.classList.toggle('hidden', input.value.length === 0);
      });
    }
  }

  function init() {
    document.querySelectorAll('[data-ps-input]').forEach(function (input) {
      new PredictiveSearch(input);
    });
    document.querySelectorAll('[data-predictive-search-mobile-trigger]').forEach(initMobileOverlay);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
