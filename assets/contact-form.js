/**
 * Contact form (sections/contact-form.liquid): progressive-enhancement
 * validation (border/aria-invalid/help-text on invalid fields, "Sending…"
 * affordance) plus focusing the success heading after Shopify's native
 * full-page POST/redirect. Config (form/success ids, translated strings)
 * comes from each form's `[data-contact-form-config]` JSON island.
 */
(function () {
  function readConfigs() {
    var nodes = document.querySelectorAll('[data-contact-form-config]');
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

  function fieldMessage(field, requiredMessage, emailInvalidMessage) {
    if (field.validity.valueMissing) return requiredMessage;
    if (field.type === 'email' && field.validity.typeMismatch) return emailInvalidMessage;
    return requiredMessage;
  }

  function setFieldInvalid(field, isInvalid, requiredMessage, emailInvalidMessage) {
    field.classList.toggle('border-important', isInvalid);
    if (isInvalid) {
      field.setAttribute('aria-invalid', 'true');
    } else {
      field.removeAttribute('aria-invalid');
    }
    var errorEl = document.getElementById(field.id + '-error');
    if (!errorEl) return;
    if (isInvalid) {
      errorEl.textContent = fieldMessage(field, requiredMessage, emailInvalidMessage);
      errorEl.classList.remove('hidden');
    } else {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
  }

  function initValidation(form, config) {
    if (!form || form.dataset.contactInitialized) return;
    form.dataset.contactInitialized = 'true';
    form.noValidate = true;

    var requiredFields = Array.prototype.slice.call(form.querySelectorAll('[data-contact-field]'));
    var allFields = Array.prototype.slice.call(form.querySelectorAll('input, textarea'));
    var submit = form.querySelector('[data-contact-submit]');
    var submittingLabel = config.submittingLabel || '';
    var requiredMessage = config.requiredMessage || '';
    var emailInvalidMessage = config.emailInvalidMessage || '';

    requiredFields.forEach(function (field) {
      field.addEventListener('input', function () {
        if (field.validity.valid) setFieldInvalid(field, false, requiredMessage, emailInvalidMessage);
      });
    });

    form.addEventListener('submit', function (event) {
      var firstInvalid = null;
      requiredFields.forEach(function (field) {
        var valid = field.validity.valid;
        setFieldInvalid(field, !valid, requiredMessage, emailInvalidMessage);
        if (!valid && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        event.preventDefault();
        firstInvalid.focus();
        return;
      }

      if (!submit) return;
      // Deferred so the browser has already read the (still-enabled) field
      // values into the outgoing request before we disable them — disabling
      // synchronously here would drop their values from the submitted form
      // data.
      setTimeout(function () {
        allFields.forEach(function (field) { field.disabled = true; });
        submit.disabled = true;
        submit.classList.add('opacity-70');
        submit.textContent = submittingLabel;
      }, 0);
    });
  }

  function init() {
    readConfigs().forEach(function (config) {
      if (config.formId) {
        initValidation(document.getElementById(config.formId), config);
      }
      if (config.successId) {
        var heading = document.getElementById(config.successId);
        if (heading) heading.focus();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
