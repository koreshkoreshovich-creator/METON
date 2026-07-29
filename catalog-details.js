(function () {
  'use strict';
  if (document.querySelector('.product-card, .detail, .product-detail')) {
    var directusScript = document.createElement('script');
    directusScript.src = 'directus-catalog.js';
    directusScript.async = true;
    document.head.appendChild(directusScript);
  }
  if (/equipment-detail\.html$/i.test(location.pathname)) return;

  function text(el) {
    return el ? el.textContent.trim().replace(/\s+/g, ' ') : '';
  }

  function categoryFromPath() {
    var path = location.pathname.toLowerCase();
    if (path.indexOf('panels-one-sided') !== -1) return 'Одностороння сонячна панель';
    if (path.indexOf('panels-bifacial') !== -1) return 'Двостороння сонячна панель';
    if (path.indexOf('inverters-grid') !== -1) return 'Мережевий інвертор';
    if (path.indexOf('inverters-hybrid') !== -1) return 'Гібридний інвертор';
    if (path.indexOf('batteries-high-voltage') !== -1) return 'Високовольтний акумулятор';
    if (path.indexOf('batteries-lifepo4') !== -1) return 'Низьковольтний акумулятор';
    return 'Обладнання для сонячної станції';
  }

  function isExistingProductLink(href) {
    return /^product-[^?#]+\.html/i.test(href || '') || /^technical-[^?#]+\.html/i.test(href || '');
  }

  function makeUrl(card, index) {
    var title = text(card.querySelector('h3'));
    var badge = text(card.querySelector('.badge'));
    var paragraphs = card.querySelectorAll('.product-body > p');
    var description = text(paragraphs[0]);
    var price = text(card.querySelector('.price-row strong'));
    var image = card.querySelector('.product-media img');
    var datasheet = Array.prototype.find.call(card.querySelectorAll('a[href]'), function (a) {
      return /datasheet|технічн|specification|brochure|download/i.test(text(a) + ' ' + a.href);
    });
    var params = new URLSearchParams({
      name: title,
      category: categoryFromPath(),
      badge: badge,
      description: description,
      price: price || 'Ціну уточнюйте',
      image: image ? image.getAttribute('src') : '',
      datasheet: datasheet ? datasheet.getAttribute('href') : '',
      source: location.pathname.split('/').pop() || 'index.html',
      id: (card.dataset.brand || 'item') + '-' + index
    });
    return 'equipment-detail.html?' + params.toString();
  }

  function enhance() {
    document.querySelectorAll('article.product-card').forEach(function (card, index) {
      if (card.dataset.detailsEnhanced === 'true') return;
      var existing = Array.prototype.find.call(card.querySelectorAll('a[href]'), function (a) {
        return isExistingProductLink(a.getAttribute('href'));
      });
      if (existing) {
        card.dataset.detailsEnhanced = 'true';
        return;
      }
      var name = card.querySelector('h3');
      if (!name || !text(name)) return;
      var url = makeUrl(card, index);
      var link = document.createElement('a');
      link.href = url;
      link.textContent = text(name);
      name.textContent = '';
      name.appendChild(link);

      var media = card.querySelector('.product-media');
      if (media && media.tagName !== 'A') {
        media.classList.add('is-clickable');
        media.tabIndex = 0;
        media.setAttribute('role', 'link');
        media.setAttribute('aria-label', 'Детальніше: ' + text(name));
        media.addEventListener('click', function () { location.href = url; });
        media.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            location.href = url;
          }
        });
      }

      var actions = card.querySelector('.actions');
      if (actions && !actions.querySelector('[data-details-link]')) {
        var details = document.createElement('a');
        details.className = 'btn ghost';
        details.href = url;
        details.dataset.detailsLink = '';
        details.textContent = 'Характеристики';
        var sheet = Array.prototype.find.call(actions.querySelectorAll('a'), function (a) {
          return /datasheet|технічн/i.test(text(a));
        });
        actions.insertBefore(details, sheet || null);
      }
      card.dataset.detailsEnhanced = 'true';
    });
  }

  enhance();
  window.setTimeout(enhance, 0);
})();
