/**
 * Trust countdown widget: computes the next Copenhagen-time shipping cutoff
 * from the container's data-shipping-* attributes and renders the live
 * countdown text. Holds no Liquid — the container/content elements are
 * located by id prefix (blocks/trust-countdown.liquid renders exactly one
 * instance per page), so no config island is needed.
 */
(function () {
  const container = document.querySelector('[id^="trust-countdown-"]');
  if (!container) return;

  const legacyText = (container.getAttribute("data-legacy-text") || "").trim();
  const legacySuffix = (container.getAttribute("data-legacy-suffix") || "").trim();

  // Parse shipping config from data attributes
  const shippingConfig = [];
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  days.forEach((day, index) => {
    const activeAttr = container.getAttribute(`data-shipping-${day}-active`);
    const cutoffAttr = container.getAttribute(`data-shipping-${day}-cutoff`);
    const deliveryAttr = container.getAttribute(`data-shipping-${day}-delivery`);

    shippingConfig.push({
      active: activeAttr === 'true',
      cutoff: cutoffAttr || '12:00',
      delivery: deliveryAttr || ''
    });
  });

  const contentEl = container.querySelector('[id^="countdown-content-"]');
  const danishDays = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];

  function getCopenhagenTime() {
    const options = { timeZone: 'Europe/Copenhagen', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false };
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const parts = formatter.formatToParts(new Date());
    const partValues = {};
    parts.forEach(p => partValues[p.type] = p.value);
    return new Date(partValues.year, partValues.month - 1, partValues.day, partValues.hour, partValues.minute, partValues.second);
  }

  function updateUI() {
    const now = getCopenhagenTime();
    let targetDate = null;
    let shippingDayOffset = 0;
    let config = null;
    let isBeforeCutoff = false;

    // Check if we are before today's cutoff (if today is an active shipping day)
    const todayOfWeek = now.getDay();
    const todayConfig = shippingConfig[todayOfWeek];

    if (todayConfig && todayConfig.active) {
      const [hoursStr, minutesStr] = todayConfig.cutoff.split(':');
      const targetHours = parseInt(hoursStr, 10) || 12;
      const targetMinutes = parseInt(minutesStr, 10) || 0;

      const todayCutoffDate = new Date(now);
      todayCutoffDate.setHours(targetHours, targetMinutes, 0, 0);

      if (now < todayCutoffDate) {
        isBeforeCutoff = true;
        targetDate = todayCutoffDate;
        shippingDayOffset = 0;
        config = todayConfig;
      }
    }

    // If we are not before today's cutoff, find the next active shipping day
    if (!isBeforeCutoff) {
      for (let i = 1; i < 8; i++) {
        const checkDate = new Date(now);
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();
        const currentConfig = shippingConfig[dayOfWeek];

        if (currentConfig && currentConfig.active) {
          const [hoursStr, minutesStr] = currentConfig.cutoff.split(':');
          const targetHours = parseInt(hoursStr, 10) || 12;
          const targetMinutes = parseInt(minutesStr, 10) || 0;

          checkDate.setHours(targetHours, targetMinutes, 0, 0);

          targetDate = checkDate;
          shippingDayOffset = i;
          config = currentConfig;
          break;
        }
      }
    }

    if (!targetDate) {
      // Fallback
      targetDate = new Date(now);
      targetDate.setDate(now.getDate() + 1);
      targetDate.setHours(12, 0, 0, 0);
      shippingDayOffset = 1;
      config = { active: true, cutoff: '12:00', delivery: '1-2 hverdage' };
    }

    // Clean up cutoff string format (e.g. replace ':' with '.') to match Danish style
    const formattedCutoff = config.cutoff.replace(':', '.');
    const cutoffHtml = `<span class="font-bold">${formattedCutoff}</span>`;

    // Determine shipping day text
    let shippingDayText = '';
    if (shippingDayOffset === 0) {
      shippingDayText = 'i dag';
    } else if (shippingDayOffset === 1) {
      shippingDayText = 'i morgen';
    } else {
      shippingDayText = 'på ' + danishDays[targetDate.getDay()];
    }

    const deliveryDayText = config.delivery || '1-2 hverdage';

    // Detect punctuation requirements based on the Suffix's capitalization
    const firstChar = legacySuffix.charAt(0);
    const isCapitalized = firstChar === firstChar.toUpperCase() && firstChar !== firstChar.toLowerCase();
    const separator = isCapitalized ? ". " : " ";

    let finalHtml = "";

    if (isBeforeCutoff) {
      // Replace dynamic keywords if they are used in legacySuffix
      let updatedSuffix = legacySuffix
        .replace(/{shipping_day}/gi, shippingDayText)
        .replace(/{delivery_day}/gi, deliveryDayText);

      // If the suffix doesn't contain shipping_day or delivery_day, append automatically
      if (!legacySuffix.includes("{shipping_day}") && !legacySuffix.includes("{delivery_day}")) {
        if (legacySuffix.toLowerCase().includes("levering")) {
          updatedSuffix = updatedSuffix + " " + deliveryDayText;
        } else {
          updatedSuffix = updatedSuffix + " " + shippingDayText;
        }
      }

      finalHtml = `${legacyText} ${cutoffHtml}${separator}${updatedSuffix}.`;
    } else {
      let updatedSuffix = legacySuffix
        .replace(/{shipping_day}/gi, shippingDayText)
        .replace(/{delivery_day}/gi, deliveryDayText);

      if (!legacySuffix.includes("{shipping_day}") && !legacySuffix.includes("{delivery_day}")) {
        if (legacySuffix.toLowerCase().includes("levering")) {
          updatedSuffix = updatedSuffix + " " + deliveryDayText;
        } else {
          updatedSuffix = updatedSuffix + " " + shippingDayText;
        }
      }

      finalHtml = `Bestil i dag${separator}${updatedSuffix}.`;
    }

    // Clean up double spaces or double periods
    finalHtml = finalHtml
      .replace(/\s+/g, " ")
      .replace(/\.\.+/g, ".")
      .replace(/\s+\./g, ".")
      .trim();

    contentEl.innerHTML = finalHtml;
  }

  updateUI();
})();
