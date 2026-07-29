(function () {
  'use strict';

  var DIRECTUS_URL = 'https://cms.metongroup.com';
  var PRODUCTS_URL = DIRECTUS_URL + '/items/products?limit=-1&fields=*';
  var CATEGORY_PAGES = {
    'panels-monofacial': 'panels-one-sided.html',
    'panels-bifacial': 'panels-bifacial.html',
    'inverters-hybrid': 'inverters-hybrid.html',
    'inverters-grid': 'inverters-grid.html',
    'batteries-low-voltage': 'batteries-lifepo4.html',
    'batteries-high-voltage': 'batteries-high-voltage.html',
    'stations-hybrid': 'stations-hybrid.html',
    'stations-green-tariff': 'stations-grid.html',
    'stations-self-consumption': 'stations-grid.html',
    'mounting-kits': 'mounting-kits.html',
    'mounting-ground': 'mounting-ground.html',
    'mounting-components': 'mounting-components.html'
  };

  function value(product, names, fallback) {
    for (var i = 0; i < names.length; i += 1) {
      var current = product[names[i]];
      if (current !== undefined && current !== null && current !== '') return current;
    }
    return fallback;
  }

  function fileUrl(file) {
    if (!file) return '';
    if (typeof file === 'object') file = file.id || file.uuid || '';
    return file ? DIRECTUS_URL + '/assets/' + encodeURIComponent(file) : '';
  }

  function productName(product) {
    return String(value(product, ['name', 'title'], '') ||
      [product.brand, product.model].filter(Boolean).join(' ')).trim();
  }

  function productPage(product) {
    var source = String(value(product, ['source_page', 'page'], '')).trim();
    if (/product-[^/?#]+\.html/i.test(source)) {
      return source.match(/product-[^/?#]+\.html/i)[0];
    }
    return '';
  }

  function productId(product) {
    var page = productPage(product);
    if (page) return page.replace(/^product-|\.html$/gi, '');
    return String(value(product, ['slug', 'sku', 'id'], '')).trim();
  }

  function formatPrice(product) {
    var price = Number(value(product, ['price'], 0));
    var note = String(value(product, ['price_note'], '')).trim();
    if (!price) return note || 'Ціну уточнюйте';
    var currency = String(value(product, ['currency'], 'UAH')).toUpperCase();
    var suffix = currency === 'USD' ? ' $' : currency === 'EUR' ? ' €' : ' грн';
    return price.toLocaleString('uk-UA', { maximumFractionDigits: 2 }) + suffix;
  }

  function productImage(product) {
    return fileUrl(product.image_file) ||
      String(value(product, ['image_url', 'image'], '')).trim();
  }

  function datasheetUrl(product) {
    return fileUrl(product.datasheet_file) ||
      String(value(product, ['datasheet_url', 'datasheet'], '')).trim();
  }

  function normalize(valueToNormalize) {
    return String(valueToNormalize || '')
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim();
  }

  function cardProductId(card) {
    var cartLink = card.querySelector('a[href*="cart.html?add="]');
    if (cartLink) return new URL(cartLink.href).searchParams.get('add') || '';
    var rating = card.querySelector('[data-card-rating]');
    return rating ? rating.getAttribute('data-card-rating') : '';
  }

  function findCard(product) {
    var page = productPage(product);
    if (page) {
      var links = document.querySelectorAll('.product-card a[href]');
      for (var i = 0; i < links.length; i += 1) {
        if ((links[i].getAttribute('href') || '').split(/[?#]/)[0] === page) {
          return links[i].closest('.product-card');
        }
      }
    }
    var id = productId(product);
    var cards = document.querySelectorAll('.product-card');
    for (var j = 0; j < cards.length; j += 1) {
      if (cardProductId(cards[j]) === id) return cards[j];
    }
    var wantedName = normalize(productName(product));
    if (!wantedName) return null;
    for (var k = 0; k < cards.length; k += 1) {
      var heading = cards[k].querySelector('h2, h3');
      var currentName = normalize(heading && heading.textContent);
      if (currentName === wantedName ||
          (currentName.length > 8 && wantedName.indexOf(currentName) !== -1) ||
          (wantedName.length > 8 && currentName.indexOf(wantedName) !== -1)) {
        return cards[k];
      }
    }
    return null;
  }

  function updateCard(card, product) {
    var name = productName(product);
    var description = String(value(product, ['short_description', 'description'], '')).trim();
    var imageUrl = productImage(product);
    var sheetUrl = datasheetUrl(product);
    var title = card.querySelector('h2, h3');
    var paragraph = card.querySelector('.product-body > p, p');
    var price = card.querySelector('.price-row strong, .price, .card-price, [data-product-price]');
    var image = card.querySelector('img');
    if (title && name) {
      var titleLink = title.querySelector('a');
      if (titleLink) titleLink.textContent = name;
      else title.textContent = name;
    }
    if (paragraph && description) paragraph.textContent = description;
    if (price) price.textContent = formatPrice(product);
    if (image && imageUrl) {
      image.src = imageUrl;
      image.alt = name || image.alt;
    }
    var sheet = Array.prototype.find.call(card.querySelectorAll('a[href]'), function (link) {
      return /datasheet|паспорт|технічн/i.test(link.textContent + ' ' + link.href);
    });
    if (sheet && sheetUrl) sheet.href = sheetUrl;
    var availability = String(value(product, ['availability', 'status'], '')).toLowerCase();
    card.hidden = availability === 'unavailable' || availability === 'archived' ||
      availability === 'не публікувати';
  }

  function updateDetail(product) {
    var page = productPage(product);
    if (!page || page !== (location.pathname.split('/').pop() || '')) return;
    var heading = document.querySelector('.detail h1, .product-detail h1');
    var price = document.querySelector('.detail-price, .product-detail .price');
    var image = document.querySelector('.detail-img img, .product-detail img');
    var description = heading && heading.nextElementSibling;
    var name = productName(product);
    var imageUrl = productImage(product);
    if (heading && name) heading.textContent = name;
    if (price) price.textContent = formatPrice(product);
    if (description && description.tagName === 'P') {
      description.textContent = value(product, ['description', 'short_description'], description.textContent);
    }
    if (image && imageUrl) {
      image.src = imageUrl;
      image.alt = name || image.alt;
    }
    var sheetUrl = datasheetUrl(product);
    if (sheetUrl) {
      document.querySelectorAll('a[href]').forEach(function (link) {
        if (/datasheet|паспорт|технічн/i.test(link.textContent + ' ' + link.href)) link.href = sheetUrl;
      });
    }
  }

  function createCard(product) {
    var current = location.pathname.split('/').pop() || 'index.html';
    var category = String(value(product, ['category'], '')).trim();
    if (CATEGORY_PAGES[category] !== current) return null;
    var grid = document.querySelector('.product-grid');
    if (!grid) return null;
    var id = productId(product);
    var name = productName(product);
    var page = productPage(product) || ('directus-product.html?id=' + encodeURIComponent(product.id));
    var image = productImage(product) || 'assets/station.png';
    var description = String(value(product, ['short_description', 'description'], '')).trim();
    var sheet = datasheetUrl(product);
    var card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-product-card', '');
    card.setAttribute('data-directus-id', product.id);
    card.innerHTML =
      '<a class="product-media" href="' + page + '"><img loading="lazy"></a>' +
      '<div class="product-body"><span class="badge"></span><h3><a></a></h3><p></p>' +
      '<div class="price-row"><strong></strong></div>' +
      '<div class="actions"><a class="btn primary">В кошик</a><a class="btn ghost">Детальніше</a></div></div>';
    card.querySelector('img').src = image;
    card.querySelector('img').alt = name;
    card.querySelector('.badge').textContent =
      product.power_w ? product.power_w + ' Вт' : (product.power_kw ? product.power_kw + ' кВт' : category);
    card.querySelector('h3 a').href = page;
    card.querySelector('h3 a').textContent = name;
    card.querySelector('p').textContent = description;
    card.querySelector('.price-row strong').textContent = formatPrice(product);
    card.querySelector('.actions a:first-child').href = 'cart.html?add=' + encodeURIComponent(id);
    card.querySelector('.actions a:nth-child(2)').href = page;
    if (sheet) {
      var sheetLink = document.createElement('a');
      sheetLink.className = 'btn ghost datasheet-link';
      sheetLink.href = sheet;
      sheetLink.target = '_blank';
      sheetLink.rel = 'noopener';
      sheetLink.textContent = 'Datasheet';
      card.querySelector('.actions').appendChild(sheetLink);
    }
    grid.appendChild(card);
    return card;
  }

  function applyProducts(products) {
    products.forEach(function (product) {
      updateDetail(product);
      var card = findCard(product);
      if (!card) card = createCard(product);
      if (card) updateCard(card, product);
    });
    window.dispatchEvent(new CustomEvent('meton:catalog-ready', { detail: products }));
  }

  fetch(PRODUCTS_URL + '&_=' + Date.now(), {
    cache: 'no-store',
    headers: { Accept: 'application/json' }
  })
    .then(function (response) {
      if (!response.ok) throw new Error('Directus HTTP ' + response.status);
      return response.json();
    })
    .then(function (payload) {
      applyProducts(Array.isArray(payload.data) ? payload.data : []);
    })
    .catch(function (error) {
      console.warn('METON: Directus catalog is temporarily unavailable; static catalog is shown.', error);
    });
})();
