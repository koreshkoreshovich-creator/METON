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
