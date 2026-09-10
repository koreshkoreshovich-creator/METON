(function () {
  'use strict';

  var RATE = 44.6462;
  var prices = {
    'panel-tongwei-435':85, 'panel-longi-410':75, 'panel-tongwei-610':95,
    'panel-trina-610':110, 'panel-longi-620':105, 'panel-stock-longi-630':105,
    'panel-stock-inter-455':77, 'panel-stock-inter-620':95,
    'panel-longi-bifacial-650':110, 'panel-stock-longi-bf-650':110,
    'panel-stock-tongwei-bf-575':95, 'panel-tongwei-bifacial-630':105,
    'panel-stock-tongwei-bf-630':105, 'panel-stock-trina-bf-640':112,
    'deye-6k-1p':900, 'deye-8k-1p':1250, 'deye-10k-lp1':1800,
    'deye-12k-lp1':1800, 'deye-10k-3p':1800, 'deye-12k-3p':1750,
    'deye-15k-3p':1900, 'deye-20k-3p':2300, 'deye-25k-3p':2100,
    'deye-30k-3p':2900, 'deye-50k-3p':4500, 'deye-80k-3p':6200,
    'solis-10k':723, 'solis-15k':783, 'solis-20k':904, 'solis-30k':1360,
    'battery-deye-se-f5-pro-c':900, 'battery-deye-se-g5':900,
    'battery-deye-se-f16':2100,
    'mounting-zinc-kit':30, 'mounting-aluminum-kit':356,
    'mounting-c-profile-4141':3, 'mounting-ballast-aluminum':20,
    'mounting-triangle-south-g':40, 'mounting-triangle-south-p':40,
    'mounting-triangle-east-west-g':70, 'mounting-triangle-east-west-p':70,
    'mounting-stud-a2':1.2, 'mounting-stud-zinc':1.1,
    'mounting-ground-one-row':60, 'mounting-ground-two-row':65,
    'mounting-ground-three-row':70, 'mounting-ground-four-row':80
  };

  var unavailable = new Set([
    'panel-longi-580','panel-longi-425','panel-longi-425-807','panel-longi-435',
    'panel-aiko-440','panel-longi-590','panel-stock-aiko-610','panel-stock-inter-600',
    'panel-stock-trina-460','panel-longi-bifacial-610','panel-leapton-620',
    'panel-leapton-710','panel-stock-aiko-bf-645','panel-stock-longi-bf-615',
    'panel-tongwei-bifacial-625','panel-stock-tongwei-bf-625',
    'panel-stock-tongwei-bf-640','panel-stock-tongwei-bf-440',
    'panel-stock-jinko-bf-620','panel-stock-suntech-bf-440',
    'panel-stock-sunova-bf-610','panel-stock-swi-bf-450','panel-stock-swi-bf-610',
    'panel-stock-swi-bf-720','deye-5k-1p','battery-pylontech-us2000c',
    'battery-pylontech-us3000c','battery-pylontech-us5000','battery-litime-12v-100ah',
    'battery-lp-24v-100ah','battery-lp-24v-200ah'
  ]);

  var removed = new Set(['mounting-block-low', 'mounting-block-high']);
  var namePrices = [
    ['SolaX X1-HYB-6.0-LV',936],['SolaX X1-Lite-8.0-LV',1325],
    ['SolaX X1-Lite-10.0-LV',1687],['SolaX X1-Lite-12.0-LV',1806],
    ['SolaX X3-NEO-12K-LV',2048],['SolaX X3-NEO-15K-LV',2288],
    ['SolaX X3-NEO-20K-LV',2891],['SolaX X1-HYBRID 6.0M',542],
    ['SolaX X1-HYBRID 7.5M',603],['SolaX X3-HYBRID 15.0M',1807],
    ['SolaX X3-HYBRID-15K G4 PRO',2169],['SolaX X3-ULT-30K',3373],
    ['SolaX X3-AELIO-50K',4333],['SolaX X3-AELIO-60K',4556],
    ['SolaX X1-BOOST-6K-G4',663],['SolaX X3-PRO 10K-G2',807],
    ['SolaX X3-PRO 15K-G2',867],['SolaX X3-PRO 20K-G2',1180],
    ['SolaX X3-PRO 30K-G2',1350],['SolaX X3-MGA-50K-G2',1900],
    ['SolaX X3-FTH-100K',3300],['SolaX X3-FTH-110K',3600],
    ['SolaX X3-FTH-125K',3800],['SolaX X3-FTH-150K-P',4600],
    ['SolaX T-BAT-LV D53',1012],['Deye BOS-G Pro',880],
    ['SolaX T-BAT HS3.6',964],['SolaX T-HS5.1',1084],
    ['SolaX T-BAT H 2.7',723],['SolaX T-BAT H 3.0',843],
    ['SolaX Slave Pack T-BAT HV11550',1566],['SolaX TB-HR76',1222],
    ['SolaX TP-HS50E',494]
  ];
  var unavailableNames = [];
  var madeToOrderNames = ['SolaX X3-GRD-350K-HV'];

  var extras = [
    {page:'inverters-hybrid.html',id:'deye-15k-lv',name:'Гібридний інвертор Deye SUN-15K-SG05LP3-EU-SM2',badge:'Deye · 15 кВт · 3Ф · LV',price:2550,image:'assets/inverter-deye-15k.webp'},
    {page:'inverters-hybrid.html',id:'deye-20k-lv',name:'Гібридний інвертор Deye SUN-20K-SG05LP3-EU-SM2',badge:'Deye · 20 кВт · 3Ф · LV',price:2650,image:'assets/inverter-deye-20k.webp'},
    {page:'inverters-hybrid.html',id:'deye-100k-3p',name:'Гібридний інвертор Deye SUN-100K-SG02HP3-EU-GM10',badge:'Deye · 100 кВт · 3Ф · HV',price:7200,image:'assets/inverter-deye-80k.webp'},
    {page:'inverters-hybrid.html',id:'deye-125k-3p',name:'Гібридний інвертор Deye SUN-125K-SG02HP3-EU-GM10',badge:'Deye · 125 кВт · 3Ф · HV',price:7800,image:'assets/inverter-deye-80k.webp'},
    {page:'batteries-lifepo4.html',id:'battery-solax-t-bat-ld160',name:'Акумулятор SolaX Power T-BAT-LD160 LV',badge:'SolaX · LV · 16 кВт·год',price:2229,image:'assets/battery-solax-t-bat-lv-d53-hq.webp'},
    {page:'batteries-lifepo4.html',id:'battery-solax-t-bat-lr36',name:'Акумулятор SolaX Power T-BAT-LR36 LV',badge:'SolaX · LV · 3,6 кВт·год',price:550,image:'assets/battery-solax-t-bat-lv-d53-hq.webp'},
    {page:'batteries-high-voltage.html',id:'deye-bos-g-pro-bms',name:'BMS Deye для системи BOS-G Pro',badge:'Deye · BMS · HV',price:880,image:'assets/battery.webp'},
    {page:'batteries-high-voltage.html',id:'deye-bos-g-pro-rack-12',name:'Стійка Deye на 12 високовольтних акумуляторних модулів',badge:'Deye · стійка · 12 модулів',price:450,image:'assets/battery.webp'}
  ];
  extras.forEach(function (item) { prices[item.id] = item.price; });

  function idFromCard(card) {
    if (card.dataset.productId) return card.dataset.productId;
    var cart = card.querySelector('a[href*="cart.html?add="]');
    if (cart) try { return new URL(cart.href, location.href).searchParams.get('add') || ''; } catch (error) {}
    var product = card.querySelector('a[href*="product-"]');
    if (product) {
      var match = (product.getAttribute('href') || '').match(/product-([^/?#]+)\.html/i);
      if (match) return match[1];
    }
    return (card.id || '').replace(/^card-/, '');
  }

  function priceByName(name) {
    for (var i = 0; i < namePrices.length; i += 1) if (name.indexOf(namePrices[i][0]) !== -1) return namePrices[i][1];
    return null;
  }

  function setPrice(element, usd) {
    if (!element) return;
    var priceRow = element.closest('.price-row');
    if (priceRow) priceRow.querySelectorAll('.old-price').forEach(function (oldPrice) { oldPrice.remove(); });
    var card = element.closest('.product-card');
    if (card) card.querySelectorAll('.badge').forEach(function (badge) {
      if (/^\s*-?\d+%\s*$/.test(badge.textContent || '')) badge.remove();
    });
    if (element.dataset.metonUsd === String(usd) && element.querySelector('.price-usd-small')) return;
    element.dataset.metonUsd = String(usd);
    element.textContent = '';
    var main = document.createElement('span');
    main.className = 'price-uah-main';
    main.textContent = Math.round(usd * RATE).toLocaleString('uk-UA') + ' грн';
    var secondary = document.createElement('small');
    secondary.className = 'price-usd-small';
    secondary.textContent = usd.toLocaleString('uk-UA', {maximumFractionDigits:2}) + ' $';
    secondary.title = 'Курс НБУ на 10.09.2026: ' + RATE.toLocaleString('uk-UA') + ' грн/$';
    element.appendChild(main);
    element.appendChild(secondary);
  }

  function setUnavailable(card) {
    card.hidden = false;
    card.classList.add('is-unavailable');
    card.querySelectorAll('.old-price').forEach(function (oldPrice) { oldPrice.remove(); });
    var price = card.querySelector('.price-row strong,.price,.card-price,[data-product-price]');
    if (price) { price.removeAttribute('data-meton-usd'); price.textContent = 'Немає в наявності'; }
    card.querySelectorAll('a[href*="cart.html?add="]').forEach(function (link) { link.remove(); });
    var badge = card.querySelector('.badge');
    if (badge && !/немає в наявності/i.test(badge.textContent)) badge.textContent = 'Немає в наявності';
  }

  function setMadeToOrder(card) {
    card.hidden = false;
    var price = card.querySelector('.price-row strong,.price,.card-price,[data-product-price]');
    if (price) price.textContent = 'Під замовлення';
    var badge = card.querySelector('.badge,.stock-badge');
    if (badge) badge.textContent = 'Під замовлення';
    card.querySelectorAll('a[href*="cart.html"], .add-to-cart').forEach(function (link) { link.remove(); });
  }

  function updateDetailLinks(card, id, priceLabel) {
    card.querySelectorAll('a[href*="equipment-detail.html"]').forEach(function (link) {
      try {
        var url = new URL(link.href, location.href);
        if (id) url.searchParams.set('id', id);
        if (priceLabel) url.searchParams.set('price', priceLabel);
        link.href = url.pathname.split('/').pop() + '?' + url.searchParams.toString();
      } catch (error) {}
    });
  }

  function applyCard(card) {
    var id = idFromCard(card);
    var name = (card.querySelector('h2,h3') || {}).textContent || '';
    if (removed.has(id)) { card.remove(); return; }
    updateDetailLinks(card, id, '');
    if (madeToOrderNames.some(function (part) { return name.indexOf(part) !== -1; })) {
      updateDetailLinks(card, id, 'Під замовлення'); setMadeToOrder(card); return;
    }
    if (unavailable.has(id) || unavailableNames.some(function (part) { return name.indexOf(part) !== -1; })) {
      updateDetailLinks(card, id, 'Немає в наявності'); setUnavailable(card); return;
    }
    var usd = prices[id];
    if (usd === undefined) usd = priceByName(name);
    if (usd !== null && usd !== undefined) {
      updateDetailLinks(card, id, Math.round(usd * RATE).toLocaleString('uk-UA') + ' грн');
      setPrice(card.querySelector('.price-row strong,.price,.card-price,[data-product-price]'), usd);
    }
  }

  function detailId() {
    var file = location.pathname.split('/').pop() || '';
    var match = file.match(/^product-(.+)\.html$/i);
    if (match) return match[1];
    if (/^equipment-detail\.html$/i.test(file)) return new URLSearchParams(location.search).get('id') || '';
    return '';
  }

  function applyDetail() {
    var id = detailId();
    if (!id) return;
    var heading = document.querySelector('.detail h1,.product-detail h1');
    var name = heading ? heading.textContent : '';
    if (unavailable.has(id)) {
      var price = document.querySelector('.detail-price,.product-detail .price');
      if (price) price.textContent = 'Немає в наявності';
      document.querySelectorAll('a[href*="cart.html?add="]').forEach(function (link) { link.remove(); });
      return;
    }
    var usd = prices[id];
    if (usd === undefined) usd = priceByName(name);
    if (usd !== null && usd !== undefined) setPrice(document.querySelector('.detail-price,.product-detail .price'), usd);
  }

  function detailUrl(item) {
    return 'equipment-detail.html?' + new URLSearchParams({name:item.name,category:item.badge,description:'Актуальна модель із каталогу METON. Наявність і комплектацію підтверджує менеджер.',price:item.price+' $',image:item.image,source:item.page,id:item.id}).toString();
  }

  function addExtras() {
    var page = location.pathname.split('/').pop() || 'index.html';
    var grid = document.querySelector('.product-grid');
    if (!grid) return;
    extras.filter(function (item) { return item.page === page; }).forEach(function (item) {
      if (document.querySelector('[data-product-id="'+item.id+'"]')) return;
      var card = document.createElement('article');
      card.className = 'product-card'; card.dataset.productCard = ''; card.dataset.productId = item.id;
      var url = detailUrl(item);
      card.innerHTML = '<a class="product-media" href="'+url+'"><img src="'+item.image+'" alt="'+item.name+'" loading="lazy"></a><div class="product-body"><span class="badge">'+item.badge+'</span><h3><a href="'+url+'">'+item.name+'</a></h3><p>Актуальна модель із каталогу METON.</p><div class="price-row"><strong>'+item.price+' $</strong></div><div class="actions"><a class="btn primary" href="cart.html?add='+item.id+'">В кошик</a><a class="btn ghost" href="'+url+'">Характеристики</a></div></div>';
      grid.appendChild(card);
    });
  }

  function applyProductMap(map) {
    if (!map) return;
    Object.keys(prices).forEach(function (id) {
      var extra = extras.find(function (item) { return item.id === id; });
      if (!map[id] && extra) map[id] = {id:id,name:extra.name,producer:'METON',image:extra.image,badge:extra.badge,url:detailUrl(extra)};
      if (map[id]) map[id].price = Math.round(prices[id] * RATE).toLocaleString('uk-UA') + ' грн';
    });
    unavailable.forEach(function (id) { delete map[id]; });
    removed.forEach(function (id) { delete map[id]; });
  }

  function apply() {
    addExtras();
    document.querySelectorAll('.product-card').forEach(applyCard);
    applyDetail();
    try {
      if (typeof productMap !== 'undefined') {
        applyProductMap(productMap);
        if (typeof renderCart === 'function') renderCart();
      }
    } catch (error) {}
  }

  window.METON_PRICING = {rate:RATE, prices:prices, applyProductMap:applyProductMap, apply:apply};
  apply();
  window.addEventListener('meton:catalog-ready', function () { window.setTimeout(apply, 0); });
  var attempts = 0;
  var timer = window.setInterval(function () { apply(); if (++attempts >= 12) window.clearInterval(timer); }, 500);
})();
