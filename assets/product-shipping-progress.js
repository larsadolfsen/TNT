/**
 * Free shipping progress widget: renders/animates the progress bar, the
 * rolling digit "ticker" for the remaining amount, and fetches the dynamic
 * shipping threshold. Config (cart total, product price) comes from the
 * #product-shipping-progress-config island; see readConfig() below.
 */
(function () {
  function readConfig() {
    var el = document.getElementById("product-shipping-progress-config");
    if (!el) return {};
    try {
      return JSON.parse(el.textContent) || {};
    } catch (e) {
      return {};
    }
  }

  var config = readConfig();

  function initShippingWidget() {
    const widget = document.getElementById("free-shipping-widget");
    if (!widget) return;

    let threshold = parseFloat(widget.getAttribute("data-threshold")) || 590.00;
    let cartTotal = config.cartTotal !== undefined ? config.cartTotal : 0;
    let productPrice = window.currentPageProductPrice !== undefined ? window.currentPageProductPrice : (config.productPrice !== undefined ? config.productPrice : 0);

    function formatPrice(value) {
      return value.toLocaleString("da-DK", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " kr.";
    }

    let lastValue = null;

    function createTickerChild(char, isDigit) {
      const span = document.createElement('span');
      if (isDigit) {
        span.className = 'ticker-char ticker-digit';
        span.setAttribute('data-value', char);

        const list = document.createElement('span');
        list.className = 'ticker-digit-list';
        // Add 3 sets of digits 0-9 for infinite continuous rolling in both directions
        for (let s = 0; s < 3; s++) {
          for (let i = 0; i <= 9; i++) {
            const digitSpan = document.createElement('span');
            digitSpan.textContent = i;
            list.appendChild(digitSpan);
          }
        }
        const digit = parseInt(char, 10);
        // Position initially in the middle set (index 10 + digit)
        list.style.transform = `translateY(-${(10 + digit) * (100 / 30)}%)`;
        span.appendChild(list);
      } else {
        span.className = 'ticker-char ticker-static';
        span.textContent = char;
      }
      return span;
    }

    function updateTicker(tickerEl, valueString, isUp) {
      const chars = valueString.split('');

      // Clear ticker if it doesn't contain ticker-char class (e.g. initial plain text load)
      if (tickerEl.children.length === 0 || !tickerEl.firstElementChild.classList.contains('ticker-char')) {
        tickerEl.innerHTML = '';
        chars.forEach(char => {
          const isDigit = char >= '0' && char <= '9';
          tickerEl.appendChild(createTickerChild(char, isDigit));
        });
        return;
      }

      // Reconcile right-to-left
      const currentChildren = Array.from(tickerEl.children);
      const maxLen = Math.max(chars.length, currentChildren.length);

      // Map digit indices from left-to-right to apply increasing delays
      let digitCount = 0;
      const digitIndices = [];
      for (let i = 0; i < chars.length; i++) {
        if (chars[i] >= '0' && chars[i] <= '9') {
          digitIndices[i] = digitCount;
          digitCount++;
        }
      }

      for (let i = 0; i < maxLen; i++) {
        const charIndex = chars.length - 1 - i;
        const childIndex = currentChildren.length - 1 - i;

        const char = charIndex >= 0 ? chars[charIndex] : null;
        const child = childIndex >= 0 ? currentChildren[childIndex] : null;

        if (char !== null) {
          const isDigit = char >= '0' && char <= '9';

          if (child) {
            const wasDigit = child.classList.contains('ticker-digit');
            if (isDigit && wasDigit) {
              const currentD = parseInt(child.getAttribute('data-value'), 10);
              const targetD = parseInt(char, 10);

              if (currentD !== targetD) {
                const list = child.querySelector('.ticker-digit-list');
                if (list) {
                  // Determine target index to ensure all digits spin in the same direction
                  let targetIndex;
                  if (isUp) {
                    // Roll UP: Target index is higher (translates list up relative to viewport)
                    targetIndex = targetD >= currentD ? 10 + targetD : 20 + targetD;
                  } else {
                    // Roll DOWN: Target index is lower (translates list down relative to viewport)
                    targetIndex = targetD <= currentD ? 10 + targetD : targetD;
                  }

                  // Apply staggered transition delay from left-to-right
                  const digitIndex = digitIndices[charIndex] !== undefined ? digitIndices[charIndex] : 0;
                  list.style.transitionDelay = (digitIndex * 0.12) + "s";
                  list.style.transform = `translateY(-${targetIndex * (100 / 30)}%)`;

                  // Instantly reset back to the middle set (10 + targetD) on transition completion
                  list.ontransitionend = (e) => {
                    if (e.propertyName === 'transform') {
                      list.style.transition = 'none';
                      list.style.transform = `translateY(-${(10 + targetD) * (100 / 30)}%)`;
                      list.offsetHeight; // Force reflow
                      list.style.transition = '';
                    }
                  };
                }
                child.setAttribute('data-value', char);
              }
            } else if (!isDigit && !wasDigit) {
              if (child.textContent !== char) {
                child.textContent = char;
              }
            } else {
              // Replace child due to mismatch
              const newChild = createTickerChild(char, isDigit);
              if (child.parentNode === tickerEl) {
                tickerEl.replaceChild(newChild, child);
              }
            }
          } else {
            // Prepend new child at the beginning
            const newChild = createTickerChild(char, isDigit);
            tickerEl.insertBefore(newChild, tickerEl.firstChild);
          }
        } else {
          // Remove extra child at the left
          if (child && child.parentNode === tickerEl) {
            tickerEl.removeChild(child);
          }
        }
      }
    }

    function updateUI() {
      const progressBar = document.getElementById("shipping-progress-bar");
      const potentialBar = document.getElementById("shipping-potential-bar");
      const progressMsg = document.getElementById("shipping-progress-msg");
      const successMsg = document.getElementById("shipping-success-msg");
      const amountTicker = document.getElementById("shipping-amount-ticker");

      if (!progressBar) return;

      const progressPercent = Math.min((cartTotal / threshold) * 100, 100);
      progressBar.style.width = progressPercent + "%";

      let potentialPercent = progressPercent;
      const totalCombined = cartTotal + productPrice;
      if (productPrice > 0) {
        potentialPercent = Math.min((totalCombined / threshold) * 100, 100);
      }

      if (potentialBar) {
        const potentialWidth = Math.max(0, potentialPercent - progressPercent);
        potentialBar.style.width = potentialWidth + "%";
      }

      if (totalCombined < threshold) {
        const missing = threshold - totalCombined;
        if (amountTicker) {
          const isUp = lastValue !== null ? missing > lastValue : false;
          lastValue = missing;
          updateTicker(amountTicker, formatPrice(missing), isUp);
        }
        if (progressMsg) progressMsg.classList.remove("hidden");
        if (successMsg) successMsg.classList.add("hidden");
        progressBar.className = "h-full bg-emerald-600 transition-all duration-300";
      } else {
        lastValue = 0; // reset
        if (progressMsg) progressMsg.classList.add("hidden");
        if (successMsg) successMsg.classList.remove("hidden");
        progressBar.className = "h-full bg-emerald-500 transition-all duration-300";
      }
    }

    const countryMap = {
      'AF': 'Afghanistan', 'AX': 'Åland Islands', 'AL': 'Albania', 'DZ': 'Algeria', 'AS': 'American Samoa', 'AD': 'Andorra', 'AO': 'Angola', 'AI': 'Anguilla', 'AQ': 'Antarctica', 'AG': 'Antigua and Barbuda', 'AR': 'Argentina', 'AM': 'Armenia', 'AW': 'Aruba', 'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan',
      'BS': 'Bahamas', 'BH': 'Bahrain', 'BD': 'Bangladesh', 'BB': 'Barbados', 'BY': 'Belarus', 'BE': 'Belgium', 'BZ': 'Belize', 'BJ': 'Benin', 'BM': 'Bermuda', 'BT': 'Bhutan', 'BO': 'Bolivia', 'BQ': 'Bonaire, Sint Eustatius and Saba', 'BA': 'Bosnia and Herzegovina', 'BW': 'Botswana', 'BV': 'Bouvet Island', 'BR': 'Brazil', 'IO': 'British Indian Ocean Territory', 'BN': 'Brunei', 'BG': 'Bulgaria', 'BF': 'Burkina Faso', 'BI': 'Burundi',
      'KH': 'Cambodia', 'CM': 'Cameroon', 'CA': 'Canada', 'CV': 'Cape Verde', 'KY': 'Cayman Islands', 'CF': 'Central African Republic', 'TD': 'Chad', 'CL': 'Chile', 'CN': 'China', 'CX': 'Christmas Island', 'CC': 'Cocos (Keeling) Islands', 'CO': 'Colombia', 'KM': 'Comoros', 'CG': 'Congo', 'CD': 'Congo (Democratic Republic)', 'CK': 'Cook Islands', 'CR': 'Costa Rica', 'CI': 'Côte d\'Ivoire', 'HR': 'Croatia', 'CU': 'Cuba', 'CW': 'Curaçao', 'CY': 'Cyprus', 'CZ': 'Czech Republic',
      'DK': 'Denmark', 'DJ': 'Djibouti', 'DM': 'Dominica', 'DO': 'Dominican Republic',
      'EC': 'Ecuador', 'EG': 'Egypt', 'SV': 'El Salvador', 'GQ': 'Equatorial Guinea', 'ER': 'Eritrea', 'EE': 'Estonia', 'SZ': 'Eswatini', 'ET': 'Ethiopia',
      'FK': 'Falkland Islands', 'FO': 'Faroe Islands', 'FJ': 'Fiji', 'FI': 'Finland', 'FR': 'France', 'GF': 'French Guiana', 'PF': 'French Polynesia', 'TF': 'French Southern Territories',
      'GA': 'Gabon', 'GM': 'Gambia', 'GE': 'Georgia', 'DE': 'Germany', 'GH': 'Ghana', 'GI': 'Gibraltar', 'GR': 'Greece', 'GL': 'Greenland', 'GD': 'Grenada', 'GP': 'Guadeloupe', 'GU': 'Guam', 'GT': 'Guatemala', 'GG': 'Guernsey', 'GN': 'Guinea', 'GW': 'Guinea-Bissau', 'GY': 'Guyana',
      'HT': 'Haiti', 'HM': 'Heard Island and McDonald Islands', 'VA': 'Holy See', 'HN': 'Honduras', 'HK': 'Hong Kong', 'HU': 'Hungary',
      'IS': 'Iceland', 'IN': 'India', 'ID': 'Indonesia', 'IR': 'Iran', 'IQ': 'Iraq', 'IE': 'Ireland', 'IM': 'Isle of Man', 'IL': 'Israel', 'IT': 'Italy',
      'JM': 'Jamaica', 'JP': 'Japan', 'JE': 'Jersey', 'JO': 'Jordan',
      'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KI': 'Kiribati', 'KP': 'North Korea', 'KR': 'South Korea', 'KW': 'Kuwait', 'KG': 'Kyrgyzstan',
      'LA': 'Laos', 'LV': 'Latvia', 'LB': 'Lebanon', 'LS': 'Lesotho', 'LR': 'Liberia', 'LY': 'Libya', 'LI': 'Liechtenstein', 'LT': 'Lithuania', 'LU': 'Luxembourg',
      'MO': 'Macao', 'MG': 'Madagascar', 'MW': 'Malawi', 'MY': 'Malaysia', 'MV': 'Maldives', 'ML': 'Mali', 'MT': 'Malta', 'MH': 'Marshall Islands', 'MQ': 'Martinique', 'MR': 'Mauritania', 'MU': 'Mauritius', 'YT': 'Mayotte', 'MX': 'Mexico', 'FM': 'Micronesia', 'MD': 'Moldova', 'MC': 'Monaco', 'MN': 'Mongolia', 'ME': 'Montenegro', 'MS': 'Montserrat', 'MA': 'Morocco', 'MZ': 'Mozambique', 'MM': 'Myanmar',
      'NA': 'Namibia', 'NR': 'Nauru', 'NP': 'Nepal', 'NL': 'Netherlands', 'NC': 'New Caledonia', 'NZ': 'New Zealand', 'NI': 'Nicaragua', 'NE': 'Niger', 'NG': 'Nigeria', 'NU': 'Niue', 'NF': 'Norfolk Island', 'MP': 'Northern Mariana Islands', 'NO': 'Norway',
      'OM': 'Oman',
      'PK': 'Pakistan', 'PW': 'Palau', 'PS': 'Palestine', 'PA': 'Panama', 'PG': 'Papua New Guinea', 'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines', 'PN': 'Pitcairn', 'PL': 'Poland', 'PT': 'Portugal', 'PR': 'Puerto Rico',
      'QA': 'Qatar',
      'RE': 'Réunion', 'RO': 'Romania', 'RU': 'Russia', 'RW': 'Rwanda',
      'BL': 'Saint Barthélemy', 'SH': 'Saint Helena', 'KN': 'Saint Kitts and Nevis', 'LC': 'Saint Lucia', 'MF': 'Saint Martin', 'PM': 'Saint Pierre and Miquelon', 'VC': 'Saint Vincent and the Grenadines', 'WS': 'Samoa', 'SM': 'San Marino', 'ST': 'Sao Tome and Principe', 'SA': 'Saudi Arabia', 'SN': 'Senegal', 'RS': 'Serbia', 'SC': 'Seychelles', 'SL': 'Sierra Leone', 'SG': 'Singapore', 'SX': 'Sint Maarten', 'SK': 'Slovakia', 'SI': 'Slovenia', 'SB': 'Solomon Islands', 'SO': 'Somalia', 'ZA': 'South Africa', 'GS': 'South Georgia and the South Sandwich Islands', 'SS': 'South Sudan', 'ES': 'Spain', 'LK': 'Sri Lanka', 'SD': 'Sudan', 'SR': 'Suriname', 'SJ': 'Svalbard and Jan Mayen', 'SE': 'Sweden', 'CH': 'Switzerland', 'SY': 'Syria',
      'TW': 'Taiwan', 'TJ': 'Tajikistan', 'TZ': 'Tanzania', 'TH': 'Thailand', 'TL': 'Timor-Leste', 'TG': 'Togo', 'TK': 'Tokelau', 'TO': 'Tonga', 'TT': 'Trinidad and Tobago', 'TN': 'Tunisia', 'TR': 'Turkey', 'TM': 'Turkmenistan', 'TC': 'Turks and Caicos Islands', 'TV': 'Tuvalu',
      'UG': 'Uganda', 'UA': 'Ukraine', 'AE': 'United Arab Emirates', 'GB': 'United Kingdom', 'US': 'United States', 'UM': 'United States Minor Outlying Islands', 'UY': 'Uruguay', 'UZ': 'Uzbekistan',
      'VU': 'Vanuatu', 'VE': 'Venezuela', 'VN': 'Vietnam', 'VG': 'Virgin Islands, British', 'VI': 'Virgin Islands, U.S.',
      'WF': 'Wallis and Futuna', 'EH': 'Western Sahara',
      'YE': 'Yemen',
      'ZM': 'Zambia', 'ZW': 'Zimbabwe'
    };

    let ratesFetched = false;
    function fetchShippingRates() {
      if (ratesFetched) return;
      const countryCode = window.Shopify?.country || 'DK';
      let country = countryCode;
      if (countryCode.length === 2) {
        country = countryMap[countryCode.toUpperCase()] || 'Denmark';
      }
      fetch(`/cart/shipping_rates.json?shipping_address[country]=${encodeURIComponent(country)}`)
        .then(res => {
          if (!res.ok) throw new Error("Rates fetch failed");
          return res.json();
        })
        .then(data => {
          ratesFetched = true;
          const rates = data.shipping_rates;
          if (rates && rates.length > 0) {
            // Find standard rate (either name standard or description has standard)
            const standardRate = rates.find(r =>
              (r.name && r.name.toLowerCase().includes("standard")) ||
              (r.description && r.description.toLowerCase().includes("standard"))
            );
            if (standardRate && standardRate.description) {
              // Match gratis/free threshold e.g. "Gratis for ordrer på 599,00 kr. og derover"
              const match = standardRate.description.match(/(?:ordrer på|over|ved køb over|over for)\s*([\d.,]+)/i) ||
                            standardRate.description.match(/([\d.,]+)\s*kr/i) ||
                            standardRate.description.match(/([\d.,]+)/);
              if (match) {
                let cleanNum = match[1];
                if (cleanNum.includes(',') && cleanNum.includes('.')) {
                  cleanNum = cleanNum.replace(/\./g, '').replace(',', '.');
                } else if (cleanNum.includes(',')) {
                  cleanNum = cleanNum.replace(',', '.');
                } else if (cleanNum.includes('.')) {
                  const parts = cleanNum.split('.');
                  if (parts[parts.length - 1].length !== 2) {
                    cleanNum = cleanNum.replace(/\./g, '');
                  }
                }
                const val = parseFloat(cleanNum);
                if (!isNaN(val) && val > 0) {
                  window.freeShippingThreshold = val;
                  document.dispatchEvent(new CustomEvent("shipping-threshold-updated", { detail: { threshold: val } }));
                }
              }
            }
          }
        })
        .catch(err => {
          console.warn("Could not load dynamic shipping threshold:", err);
        });
    }

    // Listen for customizer cart updates to update cartTotal
    document.addEventListener("cart-updated-total", (e) => {
      if (e.detail && typeof e.detail.cartTotal === "number") {
        cartTotal = e.detail.cartTotal;
        if (cartTotal > 0) {
          fetchShippingRates();
        }
        updateUI();
      }
    });

    // Listen for product price updates (e.g. customizer or variant selection changes)
    document.addEventListener("product-price-updated", (e) => {
      if (e.detail && typeof e.detail.price === "number") {
        productPrice = e.detail.price;
        updateUI();
      }
    });

    // Listen for threshold updates
    document.addEventListener("shipping-threshold-updated", (e) => {
      if (e.detail && typeof e.detail.threshold === "number") {
        threshold = e.detail.threshold;
        widget.setAttribute("data-threshold", threshold);
        updateUI();
      }
    });

    // Fetch dynamic threshold from shipping rates if cart has items
    if (cartTotal > 0) {
      fetchShippingRates();
    }

    // Initial update
    updateUI();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initShippingWidget);
  } else {
    initShippingWidget();
  }
})();
