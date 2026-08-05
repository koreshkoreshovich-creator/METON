(function () {
  'use strict';

  var path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  var main = document.querySelector('main');
  if (!main) return;

  function node(markup) {
    var template = document.createElement('template');
    template.innerHTML = markup.trim();
    return template.content.firstElementChild;
  }

  function consultationLink(subject) {
    return 'consultation.html?subject=' + encodeURIComponent(subject);
  }

  function addHomeGrowthSections() {
    if (document.querySelector('[data-growth-home]')) return;
    var section = node(`
      <div data-growth-home>
        <section class="section solution-hub" aria-labelledby="solution-hub-title">
          <div class="section-head solution-heading">
            <div><span class="kicker">Інженерні рішення METON</span><h2 id="solution-hub-title">Оберіть станцію під свій об’єкт</h2></div>
            <p>Почніть із задачі та потужності. Точну комплектацію інженер сформує після перевірки споживання, місця монтажу й потрібного резерву.</p>
          </div>
          <div class="solution-grid">
            <article class="solution-card solution-card-home">
              <img src="assets/station-own-home-10.png" alt="Сонячна електростанція для приватного будинку" loading="lazy">
              <div class="solution-card-body"><span class="badge">Для дому</span><h3>Економія та резервне живлення</h3><p>Гібридні рішення для щоденного споживання, роботи основних приладів під час відключень і накопичення сонячної енергії.</p>
                <div class="power-links"><a href="product-hybrid-deye-6kw-turnkey.html">6 кВт</a><a href="product-own-10kw.html">10 кВт</a><a href="product-own-15kw.html">15 кВт</a><a href="product-own-20kw.html">20 кВт</a><a href="product-own-30kw.html">30 кВт</a></div>
                <a class="btn primary" href="configurator.html">Підібрати для дому</a>
              </div>
            </article>
            <article class="solution-card solution-card-business">
              <img src="assets/station-own-industrial.png" alt="Сонячна електростанція для підприємства" loading="lazy">
              <div class="solution-card-body"><span class="badge">Для бізнесу</span><h3>Менші витрати на електроенергію</h3><p>Мережеві та гібридні СЕС для денного споживання підприємства, керування піками навантаження і масштабування.</p>
                <div class="power-links"><a href="product-own-50kw.html">50 кВт</a><a href="product-own-150kw.html">150 кВт</a><a href="product-own-200kw.html">200 кВт</a><a href="stations-grid.html">Інші рішення</a></div>
                <a class="btn primary" href="${consultationLink('СЕС для підприємства')}">Розрахувати для бізнесу</a>
              </div>
            </article>
          </div>
        </section>

        <section class="section dark energy-value" aria-labelledby="energy-value-title">
          <div class="section-head"><div><span class="kicker">Що дає система</span><h2 id="energy-value-title">Не просто обладнання, а керований результат</h2></div><p>Розрахунок залежить від профілю споживання, тарифу, орієнтації панелей і затінення. Остаточні показники підтверджує інженер.</p></div>
          <div class="value-grid">
            <article><span>01</span><h3>Власна генерація</h3><p>Покриття частини денного споживання енергією від сонячних панелей.</p></article>
            <article><span>02</span><h3>Резерв під час відключень</h3><p>Гібридний інвертор і правильно підібрана АКБ підтримують погоджені групи навантаження.</p></article>
            <article><span>03</span><h3>Контроль витрат</h3><p>Моніторинг генерації та споживання допомагає переносити роботу обладнання на вигідний час.</p></article>
            <article><span>04</span><h3>Масштабування</h3><p>Архітектуру системи можна одразу підготувати до подальшого розширення.</p></article>
          </div>
        </section>

        <section class="section project-showcase" aria-labelledby="projects-title">
          <div class="section-head"><div><span class="kicker">Рішення в роботі</span><h2 id="projects-title">Об’єкти та формати монтажу</h2></div><p>Показуємо не лише товар, а логіку готової системи: панелі, інвертор, захист, кріплення, монтаж і запуск.</p></div>
          <div class="project-grid">
            <a class="project-card" href="product-own-10kw.html"><img src="assets/station-own-home-10.png" alt="Дахова СЕС 10 кВт" loading="lazy"><div><span>Приватний будинок</span><h3>Дахова СЕС 10 кВт</h3><p>Власне споживання та можливість подальшого резервування.</p></div></a>
            <a class="project-card" href="product-own-50kw.html"><img src="assets/station-own-50kw-new.png" alt="Комерційна СЕС 50 кВт" loading="lazy"><div><span>Комерційний об’єкт</span><h3>СЕС 50 кВт для бізнесу</h3><p>Зменшення закупівлі електроенергії у денні години.</p></div></a>
            <a class="project-card" href="mounting-ground.html"><img src="assets/station-grid.png" alt="Наземна сонячна електростанція" loading="lazy"><div><span>Наземний монтаж</span><h3>Конструкція під ділянку</h3><p>Проєктування розкладки, фундаменту та кабельних трас.</p></div></a>
          </div>
        </section>

        <section class="section work-process" aria-labelledby="process-title">
          <div class="section-head"><div><span class="kicker">Від заявки до генерації</span><h2 id="process-title">Як ми реалізуємо станцію</h2></div><p>Клієнт розуміє наступний крок, а комплектація не формується навмання.</p></div>
          <ol class="process-grid"><li><span>1</span><h3>Збір даних</h3><p>Споживання, адреса, тип даху або ділянки, бажаний резерв.</p></li><li><span>2</span><h3>Інженерний розрахунок</h3><p>Потужність, генерація, обладнання, захист і схема розміщення.</p></li><li><span>3</span><h3>Монтаж і запуск</h3><p>Доставка, встановлення, підключення та налаштування моніторингу.</p></li><li><span>4</span><h3>Супровід</h3><p>Пояснення роботи системи, гарантійні документи та сервіс.</p></li></ol>
        </section>

        <section class="section finance-cta">
          <div><span class="kicker">Оплата частинами та кредитування</span><h2>Не відкладайте енергонезалежність через всю суму одразу</h2><p>Допоможемо підготувати комплектацію для звернення до банку або фінансового партнера. Умови, ставка та рішення залежать від обраної програми й перевірки установи.</p></div>
          <div class="button-row"><a class="btn primary" href="${consultationLink('Кредитування сонячної станції')}">Дізнатися про можливості</a><a class="btn ghost" href="configurator.html">Попередньо підібрати станцію</a></div>
        </section>
      </div>`);

    var popular = Array.from(main.querySelectorAll('section')).find(function (item) { return item.classList.contains('dark') && item.querySelector('.product-grid'); });
    if (popular) main.insertBefore(section, popular); else main.appendChild(section);
  }

  function getStationPower() {
    var heading = document.querySelector('h1');
    var match = heading && heading.textContent.match(/(\d+)\s*кВт/i);
    return match ? match[1] + ' кВт' : 'потрібної потужності';
  }

  function addStationDetailSections() {
    if (document.querySelector('[data-station-commercial]')) return;
    var detail = main.querySelector('.detail');
    if (!detail) return;
    detail.classList.add('product-detail', 'station-detail');
    var power = getStationPower();
    var heading = document.querySelector('h1');
    var productName = heading ? heading.textContent.trim() : 'сонячна станція';
    var block = node(`
      <section class="station-commercial section" data-station-commercial>
        <div class="station-summary">
          <div><span class="kicker">Готове інженерне рішення</span><h2>Що отримує клієнт зі станцією ${power}</h2><p>Не набір випадкових компонентів, а узгоджену систему під конкретне споживання, мережу та місце встановлення.</p></div>
          <a class="btn primary" href="${consultationLink(productName)}">Отримати точний розрахунок</a>
        </div>
        <div class="station-benefit-grid">
          <article><span>01</span><h3>Перевірена комплектація</h3><p>Сумісні панелі, інвертор, АКБ за потреби, захист, кабелі та кріплення.</p></article>
          <article><span>02</span><h3>Прогноз генерації</h3><p>Оцінка виробітку з урахуванням регіону, орієнтації, кута та затінення.</p></article>
          <article><span>03</span><h3>Монтаж під об’єкт</h3><p>Рішення для даху або наземної конструкції з погодженою схемою розміщення.</p></article>
          <article><span>04</span><h3>Запуск і моніторинг</h3><p>Налаштування режимів роботи та контроль показників зі смартфона.</p></article>
        </div>
        <div class="station-result-panel">
          <div><span class="kicker">Важливо до замовлення</span><h2>Точна конфігурація — після короткого аудиту</h2><p>Однакова потужність не означає однаковий комплект. Інженер перевіряє фази, пікове навантаження, денне споживання, доступну площу та необхідний час автономної роботи.</p></div>
          <ul><li>Попередній підбір — без ціни в конфігураторі</li><li>Фінальна пропозиція — після перевірки даних</li><li>Кредитування — за умовами банку або партнера</li><li>Гарантія — за документами виробників і монтажу</li></ul>
        </div>
        <div class="station-final-cta"><div><span class="badge">Безплатна первинна консультація</span><h2>Дізнайтеся, чи підходить вам ${productName}</h2><p>Залиште номер — менеджер уточнить кілька параметрів і передасть дані інженеру.</p></div><div class="button-row"><a class="btn primary" href="${consultationLink(productName)}">Замовити розрахунок</a><a class="btn ghost" href="configurator.html">Пройти конфігуратор</a></div></div>
      </section>`);
    detail.insertAdjacentElement('afterend', block);
  }

  if (path === 'index.html') addHomeGrowthSections();
  if (/^product-(own|green)-\d+kw\.html$/.test(path) || path === 'product-hybrid-deye-6kw-turnkey.html') addStationDetailSections();
})();
