(function () {
  'use strict';

  document.querySelectorAll('[data-account-link]').forEach(function (element) {
    if (element.textContent.trim() === 'Unnamed user') {
      element.textContent = 'Увійти';
    }
  });
})();

/* Fixed station offers approved for the current METON price list (05.08.2026). */
(function () {
  var offers = {
    'hybrid-deye-6kw-turnkey': { roof: 237698, ground: 253406, title: 'Гібридна Deye 6 кВт', specs: ['10 × LONGi BF 615 Вт (6,15 кВт·пік)', 'Deye SUN-6K-SG05LP1-EU, 1 фаза', '2 × Deye Pro-C 5,12 кВт·год (10,24 кВт·год)', 'DC/AC захист, до 100 м кабелю', 'Монтаж сонячного поля та підключення інвертора й АКБ'] },
    'own-10kw': { roof: 331157, ground: 357860, title: 'Гібридна Deye 10 кВт', specs: ['17 × LONGi BF 615 Вт (10,455 кВт·пік)', 'Deye 10 кВт, низьковольтна система', '2 × Deye Pro-C 5,12 кВт·год (10,24 кВт·год)', 'DC/AC захист, до 100 м кабелю', 'Монтаж сонячного поля та підключення інвертора й АКБ'] },
    'own-15kw': { roof: 586481, ground: 625751, title: 'Гібридна Deye 15 кВт HV', specs: ['25 × LONGi BF 615 Вт (15,375 кВт·пік)', 'Deye SUN-15K-SG01HP3-EU-AM2, 3 фази', '5 × Deye BOS-G Pro 5,12 кВт·год (25,6 кВт·год)', 'BMS Deye та стійка на 12 модулів', 'DC/AC захист, до 120 м кабелю та монтаж'] },
    'own-20kw': { roof: 679160, ground: 730996, title: 'Гібридна Deye 20 кВт HV', specs: ['33 × LONGi BF 615 Вт (20,295 кВт·пік)', 'Deye SUN-20K-SG01HP3-EU-AM2, 3 фази', '5 × Deye BOS-G Pro 5,12 кВт·год (25,6 кВт·год)', 'BMS Deye та стійка на 12 модулів', 'DC/AC захист, до 150 м кабелю та монтаж'] },
    'own-30kw': { roof: 831486, ground: 908455, title: 'Гібридна Deye 30 кВт HV', specs: ['49 × LONGi BF 615 Вт (30,135 кВт·пік)', 'Deye SUN-30K-SG01HP3-EU-BM3, 3 фази', '5 × Deye BOS-G Pro 5,12 кВт·год (25,6 кВт·год)', 'BMS Deye та стійка на 12 модулів', 'DC/AC захист, до 200 м кабелю та монтаж'] },
    'own-50kw': { roof: 1176290, ground: 1305095, title: 'Гібридна Deye 50 кВт HV', specs: ['82 × LONGi BF 615 Вт (50,43 кВт·пік)', 'Deye SUN-50K-SG01HP3-EU-BM3, 3 фази', '5 × Deye BOS-G Pro 5,12 кВт·год (25,6 кВт·год)', 'BMS Deye та стійка на 12 модулів', 'DC/AC захист, до 300 м кабелю та монтаж'] },
    'green-30kw': { roof: 498476, ground: 575446, title: 'Мережева Solis 30 кВт', specs: ['49 × LONGi BF 615 Вт (30,135 кВт·пік)', 'Solis S6-GC3P30K03-ND, 3 фази', 'Wi-Fi-моніторинг', 'DC/AC захист, до 200 м кабелю', 'Монтаж сонячного поля; без акумуляторів'] }
  };

  function money(value) { return Number(value).toLocaleString('uk-UA') + ' грн'; }
  function currentId() {
    var path = (location.pathname.split('/').pop() || '').replace(/^product-|\.html$/g, '');
    return path;
  }
  function renderDetail() {
    var id = currentId();
    var offer = offers[id];
    if (!offer) return;
    var price = document.querySelector('.detail-price');
    if (price) price.textContent = 'від ' + money(offer.roof);
    var article = price && price.closest('article');
    if (!article) return;
    var old = article.querySelector('.old-price');
    if (old) old.remove();
    var box = article.querySelector('[data-fixed-station-offer]');
    if (!box) {
      box = document.createElement('section');
      box.setAttribute('data-fixed-station-offer', '');
      box.style.cssText = 'margin:18px 0;padding:18px;border:1px solid #d8d8d2;background:#fafaf7';
      price.closest('.price-row').insertAdjacentElement('afterend', box);
    }
    box.innerHTML = '<strong style="display:block;margin-bottom:10px">Фіксована комплектація</strong>' +
      '<div style="display:grid;gap:8px;margin-bottom:12px"><span>Дахове кріплення: <b>' + money(offer.roof) + '</b></span><span>Наземна конструкція: <b>' + money(offer.ground) + '</b></span></div>' +
      '<ul style="margin:0;padding-left:20px">' + offer.specs.map(function (item) { return '<li>' + item + '</li>'; }).join('') + '</ul>' +
      '<small style="display:block;margin-top:12px;color:#666">Ціна розрахована за курсом 44,88 грн/$ і включає стандартний кабельний ліміт. Додаткові роботи та кабель понад ліміт — після огляду об’єкта.</small>';
    var list = article.querySelector('.spec-list');
    if (list) list.innerHTML = offer.specs.map(function (item) { return '<li>' + item + '</li>'; }).join('');
  }
  function renderCards() {
    Object.keys(offers).forEach(function (id) {
      document.querySelectorAll('a[href="product-' + id + '.html"]').forEach(function (link) {
        var card = link.closest('.product-card, article');
        if (!card) return;
        var price = card.querySelector('.price-row strong, .card-price, [data-product-price]');
        if (price) price.textContent = 'від ' + money(offers[id].roof);
        var old = card.querySelector('.old-price');
        if (old) old.remove();
      });
    });
  }
  function patchCartData() {
    try {
      if (typeof products !== 'undefined') products.forEach(function (product) {
        var offer = offers[product.id];
        if (!offer) return;
        product.price = money(offer.roof);
        product.old = '';
        product.summary = offer.title + '. Фіксована дахова комплектація; наземна версія — ' + money(offer.ground) + '.';
        product.specs = offer.specs.slice();
      });
      if (typeof productMap !== 'undefined') Object.keys(offers).forEach(function (id) {
        if (!productMap[id]) return;
        productMap[id].price = money(offers[id].roof);
        productMap[id].old = '';
        productMap[id].specs = offers[id].specs.slice();
      });
    } catch (error) {}
  }
  function apply() { renderDetail(); renderCards(); patchCartData(); }
  apply();
  document.addEventListener('directus:catalog-applied', apply);
  var attempts = 0;
  var timer = setInterval(function () { apply(); if (++attempts > 12) clearInterval(timer); }, 500);
})();

(function () {
  'use strict';

  var header = document.querySelector('.header');
  var desktopNav = header && header.querySelector('.nav');
  if (!header || !desktopNav || header.querySelector('.mobile-subcategory-panel')) return;

  var panel = document.createElement('div');
  panel.className = 'mobile-subcategory-panel';
  panel.hidden = true;
  desktopNav.insertAdjacentElement('afterend', panel);

  function isMobileNavigation() {
    return window.matchMedia('(max-width: 1120px)').matches;
  }

  function closeMobileSubmenu() {
    panel.hidden = true;
    panel.innerHTML = '';
    desktopNav.querySelectorAll('.nav-item.mobile-open').forEach(function (item) {
      item.classList.remove('mobile-open');
      var trigger = item.querySelector(':scope > a');
      if (trigger) trigger.setAttribute('aria-expanded', 'false');
    });
  }

  desktopNav.querySelectorAll('.nav-item').forEach(function (item) {
    var trigger = item.querySelector(':scope > a');
    var dropdown = item.querySelector(':scope > .dropdown');
    if (!trigger || !dropdown) return;

    trigger.setAttribute('aria-haspopup', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.addEventListener('click', function (event) {
      if (!isMobileNavigation()) return;
      event.preventDefault();

      var isOpen = item.classList.contains('mobile-open');
      closeMobileSubmenu();
      if (isOpen) return;

      item.classList.add('mobile-open');
      trigger.setAttribute('aria-expanded', 'true');
      panel.innerHTML = '<strong>' + trigger.textContent.trim() + '</strong>';
      var links = document.createElement('div');
      links.className = 'mobile-subcategory-links';
      dropdown.querySelectorAll('a').forEach(function (sourceLink) {
        var link = sourceLink.cloneNode(true);
        links.appendChild(link);
      });
      panel.appendChild(links);
      panel.hidden = false;
    });
  });

  window.addEventListener('resize', function () {
    if (!isMobileNavigation()) closeMobileSubmenu();
  });
})();

(function () {
  'use strict';

  if (!document.querySelector('link[href="social-video.css"]')) {
    var stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = 'social-video.css';
    document.head.appendChild(stylesheet);
  }

  var footer = document.querySelector('.footer');
  if (!footer || footer.querySelector('.footer-social')) return;

  var brandColumn = footer.firstElementChild || footer;
  var social = document.createElement('nav');
  social.className = 'footer-social';
  social.setAttribute('aria-label', 'METON у соціальних мережах');

  [
    ['Instagram', 'IG', 'https://www.instagram.com/meton.com.ua/'],
    ['TikTok', 'TT', 'https://www.tiktok.com/@m.e.t.o.n'],
    ['YouTube', 'YT', 'https://www.youtube.com/@Meton_ua']
  ].forEach(function (network) {
    var link = document.createElement('a');
    link.className = 'footer-social-link';
    link.href = network[2];
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', network[0] + ' METON');
    link.innerHTML = '<span aria-hidden="true">' + network[1] + '</span><strong>' + network[0] + '</strong>';
    social.appendChild(link);
  });

  brandColumn.appendChild(social);
})();

(function () {
  if (document.querySelector('script[data-meton-catalog]')) return;
  var script = document.createElement('script');
  script.src = 'catalog-overlay.js';
  script.defer = true;
  script.setAttribute('data-meton-catalog', 'true');
  document.head.appendChild(script);
})();
