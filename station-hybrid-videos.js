(function () {
  var page = window.location.pathname.split('/').pop();
  var videos = {
    'product-own-10kw.html': {
      id: '7599689556685884694',
      heading: 'Відео гібридного рішення 10 кВт',
      badge: '10 кВт · резервне живлення',
      title: 'Гібридне рішення Deye для резервного живлення',
      description: 'Реальний приклад системи резервного живлення потужністю 10 кВт на обладнанні Deye.'
    },
    'product-own-15kw.html': {
      id: '7525788109406063894',
      heading: 'Приклад гібридної станції близької потужності',
      badge: '16 кВт · гібридна СЕС',
      title: 'Орієнтир для станції класу 15 кВт',
      description: 'У відео показана гібридна станція 16 кВт — найближчий реалізований проєкт METON до цієї потужності.'
    },
    'product-own-20kw.html': {
      id: '7660805407467752726',
      heading: 'Відео гібридної станції для комерційного об’єкта',
      badge: 'Гібридна СЕС · для бізнесу',
      title: 'Генерація, економія та резервне живлення',
      description: 'Приклад гібридного рішення METON для комерційного об’єкта. Точну потужність і ємність акумуляторів підбираємо після аналізу навантаження.'
    },
    'product-own-30kw.html': {
      id: '7558508808306281750',
      heading: 'Відео гібридної станції 30 кВт',
      badge: '30 кВт · гібридна СЕС',
      title: 'Гібридна станція з акумуляторами',
      description: 'Реальний проєкт METON: гібридна СЕС 30 кВт із системою накопичення енергії.'
    },
    'product-own-50kw.html': {
      id: '7540224977686121750',
      heading: 'Відео гібридної станції 50 кВт',
      badge: '50 кВт · гібридна СЕС',
      title: 'Енергонезалежність для бізнесу',
      description: 'Реальний приклад гібридної сонячної станції 50 кВт для комерційного використання.'
    },
    'product-own-150kw.html': {
      id: '7640427119637515542',
      heading: 'Приклад великої гібридної станції для бізнесу',
      badge: '140 кВт поле · 80 кВт гібридної потужності',
      title: 'Комерційна СЕС із накопиченням енергії',
      description: 'Найближчий реалізований проєкт METON: сонячне поле 140 кВт, гібридні інвертори 80 кВт і акумулятори 120 кВт·год.'
    },
    'product-own-200kw.html': {
      id: '7663382075780680982',
      heading: 'Приклад масштабної гібридної системи',
      badge: '120 кВт поле · 240 кВт·год АКБ',
      title: 'Промислове накопичення енергії Deye',
      description: 'Приклад масштабованої системи для бізнесу: сонячне поле 120 кВт, гібридний інвертор 80 кВт і накопичення Deye BOS-B 240 кВт·год.'
    }
  };

  var video = videos[page];
  var main = document.querySelector('main');
  if (!video || !main) return;

  var section = document.createElement('section');
  section.className = 'section station-video-section station-hybrid-video-section';
  section.innerHTML =
    '<div class="section-head">' +
      '<div><span class="kicker">Реалізований проєкт METON</span><h2>' + video.heading + '</h2></div>' +
      '<p>Перегляньте приклад безпосередньо на сайті в офіційному програвачі TikTok.</p>' +
    '</div>' +
    '<div class="station-video-wrap">' +
      '<iframe class="tiktok-player" src="https://www.tiktok.com/player/v1/' + video.id +
      '?controls=1&amp;description=1&amp;music_info=1" title="' + video.heading +
      '" loading="lazy" allow="fullscreen" allowfullscreen></iframe>' +
      '<div class="station-video-copy">' +
        '<span class="badge">' + video.badge + '</span>' +
        '<h3>' + video.title + '</h3>' +
        '<p>' + video.description + '</p>' +
        '<a class="btn ghost" href="https://www.tiktok.com/@m.e.t.o.n/video/' + video.id +
        '" target="_blank" rel="noopener noreferrer">Відкрити в TikTok</a>' +
      '</div>' +
    '</div>';
  main.appendChild(section);
})();
