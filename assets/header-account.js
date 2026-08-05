/**
 * Header account panel (Surface 1).
 *
 * Wires the desktop account dropdown trigger(s): open/close, focus trap,
 * Escape-to-close, outside-click-to-close. Mobile always navigates directly
 * (plain <a>) and needs no JS — see blocks/header-account.liquid.
 */
(function () {
  function focusablesIn(el) {
    return Array.prototype.slice.call(
      el.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    );
  }

  function setup(trigger) {
    var panelId = trigger.getAttribute('aria-controls');
    var panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

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
      close(false);
    }

    function open() {
      panel.hidden = false;
      trigger.setAttribute('aria-expanded', 'true');
      trigger.classList.add('bg-card-high', 'rounded-full');
      var focusables = focusablesIn(panel);
      if (focusables.length) focusables[0].focus();
      document.addEventListener('keydown', onKeydown, true);
      document.addEventListener('click', onOutsideClick, true);
    }

    function close(returnFocus) {
      panel.hidden = true;
      trigger.setAttribute('aria-expanded', 'false');
      trigger.classList.remove('bg-card-high', 'rounded-full');
      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('click', onOutsideClick, true);
      if (returnFocus) trigger.focus();
    }

    trigger.addEventListener('click', function () {
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        close(false);
      } else {
        open();
      }
    });
  }

  function init() {
    var triggers = document.querySelectorAll('[data-account-trigger]');
    triggers.forEach(setup);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
