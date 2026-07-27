(function () {
  'use strict';

  document.querySelectorAll('[data-account-link]').forEach(function (element) {
    if (element.textContent.trim() === 'Unnamed user') {
      element.textContent = 'Увійти';
    }
  });
})();

(function () {
  'use strict';

  var header = document.querySelector('.header');
  var desktopNav = header && header.querySelector('.nav');
  if (!header || !desktopNav || header.querySelector('.mobile-catalog-nav')) return;

  var wrapper = document.createElement('div');
  wrapper.className = 'mobile-catalog-nav';

  var label = document.createElement('label');
  label.setAttribute('for', 'mobileCatalogSelect');
  label.textContent = 'Каталог';

  var select = document.createElement('select');
  select.id = 'mobileCatalogSelect';
  select.setAttribute('aria-label', 'Вибрати категорію обладнання');

  [
    ['Оберіть категорію', '', true],
    ['Станції — мережеві', 'stations-grid.html'],
    ['Станції — гібридні', 'stations-hybrid.html'],
    ['Панелі — односторонні', 'panels-one-sided.html'],
    ['Панелі — двосторонні', 'panels-bifacial.html'],
    ['Інвертори — гібридні', 'inverters-hybrid.html'],
    ['Інвертори — мережеві', 'inverters-grid.html'],
    ['Акумулятори — низьковольтні', 'batteries-lifepo4.html'],
    ['Акумулятори — високовольтні', 'batteries-high-voltage.html'],
    ['Кріплення — комплекти', 'mounting-kits.html'],
    ['Кріплення — баластні системи', 'mounting-ballast.html'],
    ['Кріплення — наземні конструкції', 'mounting-ground.html'],
    ['Кріплення — комплектуючі', 'mounting-components.html']
  ].forEach(function (item) {
    var option = document.createElement('option');
    option.textContent = item[0];
    option.value = item[1];
    if (item[2]) {
      option.disabled = true;
      option.selected = true;
    }
    select.appendChild(option);
  });

  select.addEventListener('change', function () {
    if (select.value) window.location.href = select.value;
  });

  wrapper.appendChild(label);
  wrapper.appendChild(select);
  header.appendChild(wrapper);
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
