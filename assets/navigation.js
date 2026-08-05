/**
 * Desktop navigation (Surface 3).
 *
 * Desktop dropdown/mega-menu — hover-intent timers + keyboard, wired to
 * blocks/header-navigation.liquid + snippets/nav-dropdown-panel.liquid.
 * (Mobile drawer navigation is a flat link list with no JS behaviour; see
 * snippets/nav-drawer-tree.liquid.)
 */
(function () {
  // Single tunable constant, per docs/missing-surface-designs.md Surface 3
  // Open question 1 (250ms is a knowing deviation from Baymard's ~500ms
  // cited figure; kept as one constant so it is trivially adjustable).
  var OPEN_DELAY = 250;
  var CLOSE_DELAY = 400;

  function usesFinePointer() {
    return (
      window.matchMedia &&
      window.matchMedia('(hover: hover) and (pointer: fine)').matches
    );
  }

  /* ---------------------------------------------------------------------
   * Desktop dropdown / mega menu
   * ------------------------------------------------------------------- */
  function initDesktopNav(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll('[data-nav-item]'));
    var withDropdowns = items.filter(function (li) {
      return li.querySelector('[data-nav-panel]');
    });
    if (!withDropdowns.length) return;

    var openOnSetting = root.getAttribute('data-open-on') || 'hover';
    var currentlyOpen = null;
    var openTimer = null;
    var closeTimer = null;

    function triggerFor(li) {
      return li.querySelector('[data-nav-trigger]');
    }
    function panelFor(li) {
      return li.querySelector('[data-nav-panel]');
    }
    function firstFocusableIn(panel) {
      return panel.querySelector('a[href], button:not([disabled])');
    }
    function allTriggers() {
      return items
        .map(function (li) {
          return li.querySelector('.nav-link-pill, [data-nav-trigger]');
        })
        .filter(Boolean);
    }

    function openItem(li, focusFirst) {
      if (currentlyOpen === li) return;
      if (currentlyOpen) closeItem(currentlyOpen);
      var trigger = triggerFor(li);
      var panel = panelFor(li);
      if (!trigger || !panel) return;
      li.classList.add('nav-menu-item--open');
      trigger.setAttribute('aria-expanded', 'true');
      panel.hidden = false;
      currentlyOpen = li;
      if (focusFirst) {
        var first = firstFocusableIn(panel);
        if (first) first.focus();
      }
    }

    function closeItem(li) {
      var trigger = triggerFor(li);
      var panel = panelFor(li);
      if (!trigger || !panel) return;
      li.classList.remove('nav-menu-item--open');
      trigger.setAttribute('aria-expanded', 'false');
      panel.hidden = true;
      if (currentlyOpen === li) currentlyOpen = null;
    }

    function clearTimers() {
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = null;
      }
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    }

    withDropdowns.forEach(function (li) {
      var trigger = triggerFor(li);
      var panel = panelFor(li);
      if (!trigger || !panel) return;

      trigger.addEventListener('click', function (event) {
        event.preventDefault();
        var isOpen = currentlyOpen === li;
        if (isOpen) {
          closeItem(li);
        } else {
          openItem(li, false);
        }
      });

      trigger.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          openItem(li, true);
        } else if (event.key === 'Escape' && currentlyOpen === li) {
          event.preventDefault();
          closeItem(li);
          trigger.focus();
        }
      });

      li.addEventListener('pointerenter', function (event) {
        if (event.pointerType !== 'mouse' || !usesFinePointer()) return;
        clearTimers();
        if (currentlyOpen && currentlyOpen !== li) {
          openItem(li, false);
        } else {
          openTimer = setTimeout(function () {
            openItem(li, false);
          }, OPEN_DELAY);
        }
      });

      li.addEventListener('pointerleave', function (event) {
        if (event.pointerType !== 'mouse' || !usesFinePointer()) return;
        clearTimers();
        closeTimer = setTimeout(function () {
          closeItem(li);
        }, CLOSE_DELAY);
      });

      li.addEventListener('focusout', function (event) {
        if (li.contains(event.relatedTarget)) return;
        closeItem(li);
      });
    });

    // Arrow-left/right moves focus between top-level triggers.
    var triggers = allTriggers();
    triggers.forEach(function (el, index) {
      el.addEventListener('keydown', function (event) {
        if (event.key === 'ArrowRight' && triggers[index + 1]) {
          event.preventDefault();
          triggers[index + 1].focus();
        } else if (event.key === 'ArrowLeft' && triggers[index - 1]) {
          event.preventDefault();
          triggers[index - 1].focus();
        }
      });
    });

    document.addEventListener('click', function (event) {
      if (!currentlyOpen) return;
      if (root.contains(event.target)) return;
      closeItem(currentlyOpen);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && currentlyOpen) {
        var trigger = triggerFor(currentlyOpen);
        closeItem(currentlyOpen);
        if (trigger) trigger.focus();
      }
    });
  }

  function init() {
    document.querySelectorAll('[data-nav-root]').forEach(initDesktopNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
