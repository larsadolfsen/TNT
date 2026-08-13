/**
 * Footer country / language selector (Surface 14).
 *
 * Drives blocks/footer-localization.liquid + snippets/localization-picker.liquid:
 * the country/language tab switch, the client-side substring filter, filling
 * in flag glyphs, and locking the list against double submission while a
 * selection navigates away. Open/close/backdrop-click/Escape/focus-trap for
 * the modal itself is handled generically by assets/panel.js (Q9) — this
 * file only wires the content inside it.
 *
 * The actual selection itself is a real <form action="/localization">
 * <button type="submit"> — this file only manages the picker UI around it,
 * never intercepts the submission with an AJAX request.
 */
(function () {
  function isoToFlagEmoji(isoCode) {
    if (!isoCode || isoCode.length !== 2) return '';
    var codePoints = isoCode
      .toUpperCase()
      .split('')
      .map(function (letter) {
        return 0x1f1e6 + (letter.charCodeAt(0) - 65);
      });
    return String.fromCodePoint.apply(null, codePoints);
  }

  function initFlags(modal) {
    var flags = modal.querySelectorAll('[data-localization-flag]');
    flags.forEach(function (flag) {
      flag.textContent = isoToFlagEmoji(flag.getAttribute('data-iso'));
    });
  }

  function initFilter(panel) {
    var input = panel.querySelector('[data-localization-filter]');
    if (!input) return;

    var rows = Array.prototype.slice.call(panel.querySelectorAll('[data-localization-row]'));
    var noMatches = panel.querySelector('[data-localization-no-matches]');

    input.addEventListener('input', function () {
      var query = input.value.trim().toLowerCase();
      var visibleCount = 0;

      rows.forEach(function (row) {
        var isMatch = row.getAttribute('data-localization-name').indexOf(query) !== -1;
        row.hidden = !isMatch;
        if (isMatch) visibleCount += 1;
      });

      if (noMatches) {
        if (visibleCount === 0 && query !== '') {
          var template = noMatches.getAttribute('data-template') || '';
          noMatches.textContent = template.replace('{query}', input.value.trim());
          noMatches.hidden = false;
        } else {
          noMatches.hidden = true;
        }
      }
    });
  }

  function initSubmitLock(panel) {
    var form = panel.querySelector('form');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      var clickedRow = event.submitter;
      var rows = panel.querySelectorAll('[data-localization-row]');
      rows.forEach(function (row) {
        row.disabled = true;
        row.classList.add('pointer-events-none');
      });
      if (clickedRow) {
        clickedRow.classList.add('opacity-60');
      }
    });
  }

  function initTabs(modal) {
    var tabs = Array.prototype.slice.call(modal.querySelectorAll('[data-localization-tab]'));
    if (tabs.length < 2) return;

    function activate(tab) {
      tabs.forEach(function (candidate) {
        var isSelected = candidate === tab;
        candidate.setAttribute('aria-selected', isSelected ? 'true' : 'false');
        candidate.tabIndex = isSelected ? 0 : -1;
        candidate.classList.toggle('text-primary', isSelected);
        candidate.classList.toggle('border-b-2', isSelected);
        candidate.classList.toggle('border-primary', isSelected);
        candidate.classList.toggle('text-primary/60', !isSelected);
      });

      var panelId = tab.getAttribute('aria-controls');
      modal.querySelectorAll('[data-localization-panel]').forEach(function (panel) {
        panel.hidden = panel.id !== panelId;
      });
    }

    tabs.forEach(function (tab, index) {
      tab.addEventListener('click', function () {
        activate(tab);
      });
      tab.addEventListener('keydown', function (event) {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        event.preventDefault();
        var nextIndex =
          event.key === 'ArrowRight' ? (index + 1) % tabs.length : (index - 1 + tabs.length) % tabs.length;
        tabs[nextIndex].focus();
        activate(tabs[nextIndex]);
      });
    });
  }

  function initModal(modal) {
    if (modal.dataset.localizationInitialized) return;
    modal.dataset.localizationInitialized = 'true';

    initFlags(modal);
    modal.querySelectorAll('[data-localization-panel]').forEach(function (panel) {
      initFilter(panel);
      initSubmitLock(panel);
    });
    initTabs(modal);
  }

  function initTrigger(trigger) {
    if (trigger.dataset.localizationInitialized) return;
    trigger.dataset.localizationInitialized = 'true';

    var modal = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!modal) return;

    // Content wiring (flags/filter/tabs/submit-lock) happens once up front
    // rather than lazily on first click — open/close itself is owned by
    // assets/panel.js, which needs the panel's content already wired by the
    // time its trigger click opens it.
    initModal(modal);
  }

  function init() {
    document.querySelectorAll('[data-localization-trigger]').forEach(initTrigger);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Support Shopify theme editor section reloads.
  document.addEventListener('shopify:section:load', init);
})();
