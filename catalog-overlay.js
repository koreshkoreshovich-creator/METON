(function () {
  'use strict';

  var categoryPages = {
    'Односторонні сонячні панелі': 'panels-one-sided.html',
    'Двосторонні сонячні панелі': 'panels-bifacial.html',
    'Гібридні інвертори': 'inverters-hybrid.html',
    'Мережеві інвертори': 'inverters-grid.html',
    'Низьковольтні акумулятори': 'batteries-lifepo4.html',
    'Високовольтні акумулятори': 'batteries-high-voltage.html',
    'Гібридні станції': 'stations-hybrid.html',
    'Мережеві станції': 'stations-grid.html',
    'Станції для власного споживання': 'stations-own.html',
    'Комплекти кріплення': 'mounting-kits.html',
    'Наземні конструкції': 'mounting-ground.html',
    'Комплектуючі': 'mounting-components.html'
  };

  function currentPage() {
    return window.location.pathname.split('/').pop() || 'index.html';
  }

  function formatPrice(product) {
    if (!Number(product.price)) return 'Ціну уточнюйте';
    var value = Number(product.price).toLocaleString('uk-UA');
    if (product.currency === 'USD') return value + ' $';
    if (product.currency === 'EUR') return value + ' €';
    return value + ' грн';
  }

  function updateProductPage(product) {
    var heading = document.querySelector('.detail h1');
    if (!heading) return;
    var image = document.querySelector('.detail-img img');
    var description = heading.nextElementSibling;
    var price = document.querySelector('.detail-price');
    if (heading) heading.textContent = product.name;
    if (description && description.tagName === 'P') description.textContent = product.description || '';
    if (price) price.textContent = formatPrice(product);
    if (image && product.image) {
      image.src = product.image;
      image.alt = product.image_alt || product.name;
    }
    document.querySelectorAll('a[href^="cart.html?add="]').forEach(function (link) {
      link.href = 'cart.html?add=' + encodeURIComponent(product.id);
    });
    if (product.active !== 'Так' || product.publication === 'Не публікувати') {
      document.querySelector('.detail')?.classList.add('catalog-item-hidden');
    }
  }

  function updateExistingCard(product) {
    var link = document.querySelector('a[href="' + CSS.escape(product.page) + '"]');
    var card = link && link.closest('.product-card');
    if (!card) return false;
    var image = card.querySelector('img');
    var title = card.querySelector('h2, h3');
    var description = card.querySelector('p');
    var price = card.querySelector('.price, .card-price, [data-product-price]');
    if (image && product.image) {
      image.src = product.image;
      image.alt = product.image_alt || product.name;
    }
    if (title) title.textContent = product.name;
    if (description) description.textContent = product.description || '';
    if (price) price.textContent = formatPrice(product);
    card.hidden = product.active !== 'Так' || product.publication === 'Не публікувати';
    return true;
  }

  function createCard(product) {
    var card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-product-card', '');
    card.innerHTML =
      '<a class="product-image-link" href="' + product.page + '">' +
        '<img src="' + product.image + '" alt="' + (product.image_alt || product.name) + '" loading="lazy">' +
      '</a>' +
      '<span class="badge">' + product.category + '</span>' +
      '<h3><a href="' + product.page + '">' + product.name + '</a></h3>' +
      '<p>' + (product.description || '') + '</p>' +
      '<strong class="price" data-product-price>' + formatPrice(product) + '</strong>' +
      '<div class="button-row">' +
        '<a class="btn primary" href="cart.html?add=' + encodeURIComponent(product.id) + '">В кошик</a>' +
        '<a class="btn ghost" href="' + product.page + '">Детальніше</a>' +
        '<a class="btn ghost" href="compare.html?add=' + encodeURIComponent(product.id) + '">Порівняти</a>' +
      '</div>';
    return card;
  }

  fetch('catalog-data.json', { cache: 'no-store' })
    .then(function (response) {
      if (!response.ok) throw new Error('Catalog unavailable');
      return response.json();
    })
    .then(function (catalog) {
      var products = Array.isArray(catalog.products) ? catalog.products : [];
      var page = currentPage();
      var detailProduct = products.find(function (product) { return product.page === page; });
      if (detailProduct) updateProductPage(detailProduct);

      var grid = document.querySelector('.product-grid');
      products.forEach(function (product) {
        if (updateExistingCard(product)) return;
        if (!grid || categoryPages[product.category] !== page) return;
        if (product.active !== 'Так' || product.publication === 'Не публікувати') return;
        grid.appendChild(createCard(product));
      });
    })
    .catch(function () {
      /* Статичний каталог залишається працездатним, якщо файл даних недоступний. */
    });
})();
