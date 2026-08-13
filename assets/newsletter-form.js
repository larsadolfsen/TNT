/**
 * Footer newsletter signup (snippets/newsletter-form.liquid): inline email
 * validity styling plus a "submitting…" disabled state before Shopify's
 * native full-page POST/redirect. Config (form id, translated string) comes
 * from each form's `[data-newsletter-form-config]` JSON island.
 */
(function () {
  function readConfigs() {
    var nodes = document.querySelectorAll('[data-newsletter-form-config]');
    var configs = [];
    nodes.forEach(function (node) {
      try {
        var parsed = JSON.parse(node.textContent);
        if (parsed) configs.push(parsed);
      } catch (e) {
        // ignore malformed config, skip this instance
      }
    });
    return configs;
  }

  function initForm(config) {
    var form = config.formId ? document.getElementById(config.formId) : null;
    if (!form || form.dataset.newsletterInitialized) return;
    form.dataset.newsletterInitialized = 'true';

    var email = form.querySelector('[data-newsletter-email]');
    var submit = form.querySelector('[data-newsletter-submit]');
    var invalidMessage = form.querySelector('[data-newsletter-invalid-message]');
    var submittingLabel = config.submittingLabel || '';

    if (!email || !submit) return;

    function setInvalid(isInvalid) {
      email.classList.toggle('border-important', isInvalid);
      email.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
      if (invalidMessage) {
        invalidMessage.classList.toggle('hidden', !isInvalid);
      }
    }

    email.addEventListener('input', function () {
      if (email.validity.valid) setInvalid(false);
    });

    form.addEventListener('submit', function (event) {
      if (!email.validity.valid) {
        event.preventDefault();
        setInvalid(true);
        email.focus();
        return;
      }
      setInvalid(false);
      submit.disabled = true;
      submit.classList.add('opacity-70');
      submit.textContent = submittingLabel;
      email.disabled = true;
    });
  }

  function init() {
    readConfigs().forEach(initForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
