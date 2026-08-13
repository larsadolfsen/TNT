/**
 * Shared drawer/panel primitive (Q9): open/close, backdrop-click-to-close,
 * Escape-to-close, focus trap and return-focus for anchored dropdown panels
 * and centered modal panels. Modeled on the mobile takeover pattern already
 * proven in assets/predictive-search.js (Surface 4).
 *
 * Markup contract (defined here, not a separate snippet — no snippets/panel.liquid exists):
 * - trigger: `[data-panel-trigger]` with `aria-controls="<panel id>"` and
 *   `aria-expanded`.
 * - panel root: `[data-panel]`, hidden by default via the `hidden`
 *   attribute (or, when `data-panel-display="class"`, via a CSS
 *   `.is-open` class only — needed when the panel must switch to
 *   `display:flex` rather than the UA `[hidden]` default, e.g. a
 *   transitioning centered modal).
 * - optional `data-panel-lock-scroll="true"`: locks body scroll while open.
 * - optional `data-panel-inert-siblings="true"`: makes everything outside
 *   the panel inert while open (full takeovers / true modals).
 * - optional `data-panel-autofocus="<selector>[||<selector>...]"`: one or
 *   more `||`-separated candidate selectors, tried in order — the first one
 *   that matches an element inside the panel is focused; falls back to the
 *   first focusable element in the panel when none match.
 * - optional `data-panel-restore-focus="escape-only"`: by default, closing
 *   the panel by any path (Escape, outside-click, close button, trigger
 *   re-click) refocuses whatever had focus before the panel opened. Set
 *   this to restrict that refocus to the Escape-key path only — outside
 *   clicks, close-button clicks and trigger re-click then leave focus
 *   wherever it already is. Needed for panels with no backdrop and no
 *   inert-siblings (e.g. header-account), where other page elements stay
 *   reachable while the panel is open and an outside click should not yank
 *   focus back to the trigger.
 * - optional `data-panel-trigger-open-class="class-a class-b"` on the
 *   trigger: classes toggled on the trigger while its panel is open.
 * - optional `[data-panel-backdrop="<panel id>"]`: a separate dimmed
 *   backdrop element toggled in sync with the panel (kept outside the
 *   panel's own DOM subtree so clicking it counts as an outside click).
 * - any `[data-panel-close]` element inside the panel closes it on click.
 * - lifecycle hook: right before a panel would open, a cancelable
 *   `panel:beforeopen` CustomEvent (bubbles, `detail: { panel, trigger }`)
 *   is dispatched on the trigger. Calling `preventDefault()` on it aborts
 *   the open entirely (no state changes at all) — for callers that need to
 *   redirect a trigger's click to different behavior under some condition
 *   (e.g. assets/predictive-search.js using it to send the mobile search
 *   trigger to the desktop inline search bar above a breakpoint, instead of
 *   opening the mobile takeover panel).
 *
 * Each trigger gets its own independent open/close state and its own
 * document-level listeners (added only while open, removed on close), so
 * multiple independent panels on one page (e.g. header-account and
 * header-search-icon) never interfere with each other.
 */
(function () {
  function isVisible(el) {
    // getClientRects().length is 0 for display:none (including elements
    // hidden via the `hidden` attribute, e.g. localization.js's row filter,
    // or Liquid's `hidden: multi_country` on the language picker) and for
    // any ancestor with display:none. Deliberately not offsetParent-based:
    // offsetParent is null for position:fixed elements even when visible,
    // which would wrongly exclude a focusable element that is itself
    // fixed-positioned.
    return el.getClientRects().length > 0;
  }

  function focusablesIn(el) {
    return Array.prototype.slice
      .call(
        el.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      )
      .filter(isVisible);
  }

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

  function setup(trigger) {
    if (trigger.dataset.panelBound === 'true') return;
    trigger.dataset.panelBound = 'true';

    var panelId = trigger.getAttribute('aria-controls');
    var panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    var useHiddenAttr = panel.getAttribute('data-panel-display') !== 'class';
    var lockScroll = panel.getAttribute('data-panel-lock-scroll') === 'true';
    var inertSiblings = panel.getAttribute('data-panel-inert-siblings') === 'true';
    var autofocusSelector = panel.getAttribute('data-panel-autofocus');
    var escapeOnlyRestoreFocus = panel.getAttribute('data-panel-restore-focus') === 'escape-only';
    var openClass = trigger.getAttribute('data-panel-trigger-open-class');
    var openClasses = openClass ? openClass.split(/\s+/).filter(Boolean) : [];
    var backdrop = panelId ? document.querySelector('[data-panel-backdrop="' + panelId + '"]') : null;

    var lastFocused = null;
    var inertTargets = null;

    function onKeydown(event) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close(true);
        return;
      }
      if (event.key === 'Tab') {
        var focusables = focusablesIn(panel);
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

    function onOutsideClick(event) {
      if (panel.contains(event.target) || trigger.contains(event.target)) return;
      close();
    }

    function open() {
      var beforeOpenEvent = new CustomEvent('panel:beforeopen', {
        cancelable: true,
        bubbles: true,
        detail: { panel: panel, trigger: trigger },
      });
      if (!trigger.dispatchEvent(beforeOpenEvent)) return;

      lastFocused = document.activeElement;

      if (useHiddenAttr) panel.hidden = false;
      panel.classList.add('is-open');
      if (backdrop) {
        if (useHiddenAttr) backdrop.hidden = false;
        backdrop.classList.add('is-open');
      }
      trigger.setAttribute('aria-expanded', 'true');
      if (openClasses.length) trigger.classList.add.apply(trigger.classList, openClasses);

      if (lockScroll) document.body.style.overflow = 'hidden';

      if (inertSiblings) {
        inertTargets = collectOutsideSiblings(panel).filter(function (el) {
          return el !== backdrop;
        });
        inertTargets.forEach(function (el) {
          if ('inert' in el) el.inert = true;
          el.setAttribute('aria-hidden', 'true');
        });
      }

      var autofocusEl = null;
      if (autofocusSelector) {
        var candidates = autofocusSelector.split('||');
        for (var i = 0; i < candidates.length && !autofocusEl; i++) {
          autofocusEl = panel.querySelector(candidates[i].trim());
        }
      }
      var focusables = focusablesIn(panel);
      var toFocus = autofocusEl || focusables[0];
      if (toFocus) toFocus.focus();

      document.addEventListener('keydown', onKeydown, true);
      document.addEventListener('click', onOutsideClick, true);
    }

    function close(viaEscape) {
      if (useHiddenAttr) panel.hidden = true;
      panel.classList.remove('is-open');
      if (backdrop) {
        if (useHiddenAttr) backdrop.hidden = true;
        backdrop.classList.remove('is-open');
      }
      trigger.setAttribute('aria-expanded', 'false');
      if (openClasses.length) trigger.classList.remove.apply(trigger.classList, openClasses);

      if (lockScroll) document.body.style.overflow = '';

      if (inertTargets) {
        inertTargets.forEach(function (el) {
          if ('inert' in el) el.inert = false;
          el.removeAttribute('aria-hidden');
        });
        inertTargets = null;
      }

      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('click', onOutsideClick, true);

      var shouldRestoreFocus = escapeOnlyRestoreFocus ? viaEscape === true : true;
      if (shouldRestoreFocus && lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
    }

    panel.querySelectorAll('[data-panel-close]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        close();
      });
    });

    trigger.addEventListener('click', function () {
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        close();
      } else {
        open();
      }
    });
  }

  function init() {
    document.querySelectorAll('[data-panel-trigger]').forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Support Shopify theme editor section reloads (new trigger/panel pairs
  // re-rendered into the DOM need their own listeners bound).
  document.addEventListener('shopify:section:load', init);
})();
