(function () {
  'use strict';

  var UAH_PER_USD = 44.88;
  var UAH = '\u0433\u0440\u043d';
  var DASH = '\u2013';
  var PRICE_SELECTOR = [
    '.price-row strong',
    '.detail-price',
    '.product-detail .price',
    '.card-price',
    '[data-product-price]',
    '.cart-row .muted',
    '.cart-summary .summary-line strong',
    '.compare-option small',
    '.compare-table td'
  ].join(',');

  function numberFromText(value) {
    return Number(String(value || '').replace(/\s+/g, '').replace(',', '.'));
  }

  function formatUahNumber(value) {
    return Math.round(value).toLocaleString('uk-UA');
  }

  function formatUsdNumber(value) {
    return value.toLocaleString('uk-UA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
  }

  function parsePrice(text) {
    var clean = String(text || '').replace(/\u00a0/g, ' ').trim();
    if (!clean || /\u0443\u0442\u043e\u0447\u043d|\u0437\u0430\u043c\u043e\u0432\u043b\u0435\u043d|\u0434\u043e\u0433\u043e\u0432\u0456\u0440\u043d/i.test(clean)) return null;
    var currency = /(?:\$|USD|\u0434\u043e\u043b)/i.test(clean)
      ? 'USD'
      : /(?:\u0433\u0440\u043d|UAH|\u20b4)/i.test(clean) ? 'UAH' : '';
    if (!currency) return null;
    var prefix = /^\s*(\u0432\u0456\u0434|\u0434\u043e|\u043f\u0440\u0438\u0431\u043b\u0438\u0437\u043d\u043e|\u043e\u0440\u0456\u0454\u043d\u0442\u043e\u0432\u043d\u043e)(?=\s|\d)/i.exec(clean);
    var values = clean.match(/\d[\d\s]*(?:[.,]\d+)?/g) || [];
    values = values.map(numberFromText).filter(function (value) {
      return Number.isFinite(value) && value > 0;
    });
    if (!values.length) return null;
    return { currency: currency, prefix: prefix ? prefix[1] + ' ' : '', values: values.slice(0, 2) };
  }

  function formatUah(values) {
    return values.map(formatUahNumber).join(DASH) + ' ' + UAH;
  }

  function formatUsd(values) {
    return values.map(formatUsdNumber).join(DASH) + ' $';
  }

  function renderPrice(element) {
    if (!element || element.querySelector('.price-usd-small')) return;
    var parsed = parsePrice(element.textContent);
    if (!parsed) return;

    var uahValues = parsed.currency === 'USD'
      ? parsed.values.map(function (value) { return value * UAH_PER_USD; })
      : parsed.values;
    var usdValues = parsed.currency === 'USD'
      ? parsed.values
      : parsed.values.map(function (value) { return value / UAH_PER_USD; });

    element.textContent = '';
    var main = document.createElement('span');
    main.className = 'price-uah-main';
    main.textContent = parsed.prefix + formatUah(uahValues);
    var usd = document.createElement('small');
    usd.className = 'price-usd-small';
    usd.textContent = parsed.prefix + formatUsd(usdValues);
    usd.title = '\u0414\u043e\u0432\u0456\u0434\u043a\u043e\u0432\u0438\u0439 \u0435\u043a\u0432\u0456\u0432\u0430\u043b\u0435\u043d\u0442 \u0437\u0430 \u043a\u0443\u0440\u0441\u043e\u043c ' + UAH_PER_USD.toLocaleString('uk-UA') + ' ' + UAH + '/$';
    element.appendChild(main);
    element.appendChild(usd);
  }

  function apply(root) {
    if (root && root.nodeType === 1 && root.matches && root.matches(PRICE_SELECTOR)) renderPrice(root);
    (root || document).querySelectorAll(PRICE_SELECTOR).forEach(renderPrice);
  }

  function start() {
    apply(document);
    new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.type === 'childList') {
          if (mutation.target && mutation.target.nodeType === 1) apply(mutation.target);
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) apply(node);
          });
        }
      });
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
}());
