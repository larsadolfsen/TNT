/**
 * Shared money formatter for both header-cart.js and predictive-search.js.
 * Replicates Shopify's money filter client-side for the shop's configured money_format.
 */
(function() {
  function formatWithDelimiters(cents, precision, thousands, decimal) {
    precision = typeof precision === 'undefined' ? 2 : precision;
    thousands = typeof thousands === 'undefined' ? ',' : thousands;
    decimal = typeof decimal === 'undefined' ? '.' : decimal;
    if (isNaN(cents) || cents === null) return '0';
    var amount = (cents / 100).toFixed(precision);
    var parts = amount.split('.');
    var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1' + thousands);
    var decimals = parts[1] ? decimal + parts[1] : '';
    return dollars + decimals;
  }

  function formatMoney(cents, format) {
    if (!format) return formatWithDelimiters(cents, 2, '.', ',');
    var formatString = format;
    var match = formatString.match(/\{\{\s*(\w+)\s*\}\}/);
    if (!match) return formatString;
    var value;
    switch (match[1]) {
      case 'amount_no_decimals':
        value = formatWithDelimiters(cents, 0);
        break;
      case 'amount_with_comma_separator':
        value = formatWithDelimiters(cents, 2, '.', ',');
        break;
      case 'amount_no_decimals_with_comma_separator':
        value = formatWithDelimiters(cents, 0, '.', ',');
        break;
      case 'amount_with_space_separator':
        value = formatWithDelimiters(cents, 2, ' ', ',');
        break;
      default:
        value = formatWithDelimiters(cents, 2);
    }
    return formatString.replace(/\{\{\s*\w+\s*\}\}/, value);
  }

  window.themeMoney = {
    formatMoney: formatMoney
  };
})();
