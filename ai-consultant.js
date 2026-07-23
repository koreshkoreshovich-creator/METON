(function () {
  'use strict';

  var state = {
    consumption: 0,
    systemKw: 0,
    inverter: '',
    panels: 0,
    panelModel: '',
    reserve: null,
    name: '',
    phone: '',
    questions: [],
    recommendationReady: false,
    waitingFor: ''
  };

  var catalog = {
    inverter: {
      6: { name: 'Deye SUN-6K-SG03LP1-EU', price: 750, voltage: 'LV', url: 'product-deye-6k-1p.html' },
      8: { name: 'Deye SUN-8K-SG01LP1-EU', price: 1000, voltage: 'LV', url: 'product-deye-8k-1p.html' },
      10: { name: 'Deye 10 кВт', price: 1510, voltage: 'LV', url: 'product-deye-10k-lp1.html' },
      12: { name: 'Deye 12 кВт', price: 1550, voltage: 'LV', url: 'product-deye-12k-3p.html' },
      15: { name: 'Deye 15 кВт', price: 1780, voltage: 'HV', url: 'product-deye-15k-3p.html' },
      20: { name: 'Deye SUN-20K-SG01HP3-EU-AM2', price: 2350, voltage: 'HV', url: 'product-deye-20k-3p.html' },
      30: { name: 'Deye 30 кВт', price: 2500, voltage: 'HV', url: 'product-deye-30k-3p.html' },
      50: { name: 'Deye 50 кВт', price: 4050, voltage: 'HV', url: 'product-deye-50k-3p.html' }
    },
    panel: {
      name: 'LONGi Solar LR7-72HTH-620M',
      watts: 620,
      priceUah: 5006,
      url: 'product-panel-longi-620.html'
    },
    battery: {
      name: 'Deye Pro-C 5,12 кВт·год',
      capacity: 5.12,
      url: 'batteries-lifepo4.html'
    },
    highVoltageBattery: {
      name: 'Deye BOS-G Pro',
      moduleCapacity: 5.12,
      minimumModules: 5,
      url: 'batteries-high-voltage.html'
    }
  };

  var root = document.createElement('div');
  root.className = 'meton-ai';
  root.innerHTML =
    '<button class="meton-ai-launch" type="button" aria-label="Відкрити AI-консультанта" aria-expanded="false">' +
      '<span class="meton-ai-spark">AI</span><span class="meton-ai-launch-copy"><strong>AI-консультант</strong><small>Підібрати СЕС</small></span>' +
    '</button>' +
    '<section class="meton-ai-panel" aria-label="AI-консультант МЕТОН" aria-hidden="true">' +
      '<header class="meton-ai-head"><div><span class="meton-ai-status"></span><strong>AI-консультант МЕТОН</strong><small>Підбір обладнання за 2 хвилини</small></div><button type="button" class="meton-ai-close" aria-label="Закрити">×</button></header>' +
      '<div class="meton-ai-messages" role="log" aria-live="polite"></div>' +
      '<div class="meton-ai-quick"></div>' +
      '<form class="meton-ai-form"><label class="sr-only" for="meton-ai-input">Ваше повідомлення</label><input id="meton-ai-input" autocomplete="off" placeholder="Наприклад: 1200 кВт·год на місяць" maxlength="500"><button type="submit">Надіслати</button></form>' +
      '<p class="meton-ai-note">Розрахунок попередній. Фінальну комплектацію перевіряє інженер МЕТОН.</p>' +
    '</section>';
  document.body.appendChild(root);

  var launch = root.querySelector('.meton-ai-launch');
  var panel = root.querySelector('.meton-ai-panel');
  var close = root.querySelector('.meton-ai-close');
  var form = root.querySelector('.meton-ai-form');
  var input = root.querySelector('#meton-ai-input');
  var messages = root.querySelector('.meton-ai-messages');
  var quick = root.querySelector('.meton-ai-quick');

  function setOpen(open) {
    root.classList.toggle('is-open', open);
    panel.setAttribute('aria-hidden', String(!open));
    launch.setAttribute('aria-expanded', String(open));
    if (open) {
      if (!messages.children.length) welcome();
      window.setTimeout(function () { input.focus(); }, 120);
    }
  }

  function message(text, who, links) {
    var wrap = document.createElement('div');
    wrap.className = 'meton-ai-message ' + (who === 'user' ? 'is-user' : 'is-bot');
    var bubble = document.createElement('div');
    bubble.className = 'meton-ai-bubble';
    text.split('\n').forEach(function (line, index) {
      if (index) bubble.appendChild(document.createElement('br'));
      bubble.appendChild(document.createTextNode(line));
    });
    wrap.appendChild(bubble);
    if (links && links.length) {
      var actions = document.createElement('div');
      actions.className = 'meton-ai-links';
      links.forEach(function (item) {
        var a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.label;
        actions.appendChild(a);
      });
      wrap.appendChild(actions);
    }
    messages.appendChild(wrap);
    messages.scrollTop = messages.scrollHeight;
  }

  function setQuick(items) {
    quick.textContent = '';
    (items || []).forEach(function (label) {
      var button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.addEventListener('click', function () { handle(label); });
      quick.appendChild(button);
    });
  }

  function welcome() {
    message('Вітаю! Я допоможу попередньо підібрати сонячну станцію з обладнання МЕТОН.\nНапишіть ваше споживання електроенергії за місяць у кВт·год.', 'bot');
    setQuick(['600 кВт·год', '1200 кВт·год', '2000 кВт·год']);
  }

  function extractConsumption(text) {
    var match = String(text).replace(/\s/g, '').match(/(\d{2,6})(?:[.,]\d+)?/);
    if (!match) return 0;
    var value = Number(match[1]);
    if (value > 0 && value <= 100000) return value;
    return 0;
  }

  function systemSize(monthly) {
    if (monthly <= 400) return 6;
    if (monthly <= 600) return 8;
    if (monthly <= 800) return 10;
    if (monthly <= 1000) return 15;
    if (monthly <= 1400) return 20;
    if (monthly <= 2000) return 30;
    return 50;
  }

  function recommend(monthly) {
    state.consumption = monthly;
    state.systemKw = systemSize(monthly);
    var inv = catalog.inverter[state.systemKw];
    state.inverter = inv.name;
    state.panelModel = catalog.panel.name;
    state.panels = Math.ceil((state.systemKw * 1.24 * 1000) / catalog.panel.watts);
    state.recommendationReady = true;
    state.waitingFor = 'reserve';

    var annual = monthly * 12;
    var dcPower = (state.panels * catalog.panel.watts / 1000).toFixed(1).replace('.', ',');
    var panelsPrice = state.panels * catalog.panel.priceUah;
    message(
      'Для споживання близько ' + monthly.toLocaleString('uk-UA') + ' кВт·год/місяць попередньо рекомендую:\n' +
      '• інвертор ' + inv.name + ' (' + state.systemKw + ' кВт);\n' +
      '• ' + state.panels + ' панелей ' + catalog.panel.name + ' по 620 Вт;\n' +
      '• сумарна потужність панелей — ' + dcPower + ' кВт.\n' +
      'Поточні ціни в каталозі: інвертор — ' + inv.price.toLocaleString('uk-UA') + ' $, панелі — ' +
      panelsPrice.toLocaleString('uk-UA') + ' грн за ' + state.panels + ' шт. Монтаж, захист, кабель і конструкція рахуються після огляду.\n\n' +
      'Це конфігурація з запасом для сезонності та орієнтовного річного споживання ' + annual.toLocaleString('uk-UA') + ' кВт·год. Потрібне резервне живлення від акумуляторів?',
      'bot',
      [
        { label: 'Переглянути інвертор', url: inv.url },
        { label: 'Переглянути панель', url: catalog.panel.url }
      ]
    );
    setQuick(['Так, потрібен резерв', 'Ні, без акумулятора', 'Хочу уточнити']);
  }

  function reserveAnswer(wantsReserve) {
    state.reserve = wantsReserve;
    state.waitingFor = 'lead';
    if (wantsReserve) {
      var selectedInverter = catalog.inverter[state.systemKw];
      if (selectedInverter && selectedInverter.voltage === 'HV') {
        var hvModules = state.systemKw >= 30 ? 8 : catalog.highVoltageBattery.minimumModules;
        var hvCapacity = (hvModules * catalog.highVoltageBattery.moduleCapacity).toFixed(2).replace('.', ',');
        var hvSystem = hvModules === 8 ? 'BOS-G40 Pro' : 'BOS-G25 Pro';
        message(
          'Для цього високовольтного трифазного інвертора потрібна HV-система — не низьковольтна Pro-C.\n' +
          'Попередньо рекомендую ' + catalog.highVoltageBattery.name + ': ' + hvSystem + ', ' + hvModules +
          ' модулів по 5,12 кВт·год, загальна енергія ' + hvCapacity + ' кВт·год.\n\n' +
          'Остаточну кількість модулів, контролер і стійку менеджер звірить із точним SKU інвертора, списком сумісності Deye та бажаним часом автономної роботи.',
          'bot',
          [{ label: 'Високовольтні BOS-G Pro', url: catalog.highVoltageBattery.url }]
        );
      } else {
        var modules = Math.max(2, Math.ceil(state.systemKw / catalog.battery.capacity));
        var capacity = (modules * catalog.battery.capacity).toFixed(2).replace('.', ',');
        message(
          'Для сумісного низьковольтного інвертора попередньо рекомендую від ' + modules + ' модулів ' + catalog.battery.name +
          ' — разом приблизно ' + capacity + ' кВт·год. Точну кількість інженер визначить за переліком критичних приладів і бажаним часом автономної роботи.\n\n' +
          'Комплект сформовано. Можете поставити запитання про цей підбір або написати ім’я та номер телефону — тоді передам його менеджеру МЕТОН.',
          'bot',
          [{ label: 'Низьковольтні акумулятори', url: catalog.battery.url }]
        );
      }
    } else {
      message('Добре, формую систему без акумулятора. Можете поставити запитання про цей підбір або написати ім’я та номер телефону — тоді передам його менеджеру МЕТОН.', 'bot');
    }
    setQuick(['Поставити запитання', 'Передати менеджеру', 'Зателефонувати менеджеру']);
  }

  function phoneFrom(text) {
    var normalized = String(text).replace(/[^\d+]/g, '');
    var digits = normalized.replace(/\D/g, '');
    if (digits.length >= 9 && digits.length <= 13) return normalized;
    return '';
  }

  function answerProductQuestion(text) {
    var lower = String(text).toLowerCase();
    var answer = '';
    var links = [];

    if (/чому.*(longi|лонг|панел)|навіщо.*(longi|лонг)/.test(lower)) {
      answer =
        'LONGi 620 Вт я запропонував через високу потужність одного модуля: для заданої станції потрібно менше панелей і менше площі, ніж із модулями меншої потужності. Ця модель є в каталозі МЕТОН і підходить для великої DC-потужності комплекту.\n\n' +
        'Але це попередній вибір. Менеджер має звірити фактичну наявність партії, розміри даху, затінення та запропонувати альтернативу, якщо інша панель буде вигіднішою.';
      links = [{ label: 'Характеристики LONGi', url: catalog.panel.url }];
    } else if (/чому.*deye|чому.*дея|навіщо.*deye|інвертор.*чому/.test(lower)) {
      answer =
        'Deye обраний через потрібний діапазон потужності, можливість роботи з резервом і наявність відповідної моделі в каталозі МЕТОН. Для великих систем також важливі трифазне підключення та сумісність з АКБ.\n\n' +
        'Остаточно менеджер перевірить технічні умови об’єкта, фазність, допустиму потужність вводу та сумісність конкретної батареї.';
      links = [{ label: 'Переглянути інвертор', url: catalog.inverter[state.systemKw] ? catalog.inverter[state.systemKw].url : 'inverters-hybrid.html' }];
    } else if (/ціна|кошту|вартіст|скільки.*грн|скільки.*дол/.test(lower)) {
      answer =
        'Я можу показувати поточні ціни обладнання з каталогу, але повна вартість станції залежить від конструкції, кабелю, захисту, доставки та монтажу. Наявність і персональну ціну менеджер підтверджує в день оформлення — так розрахунок не буде застарілим.';
    } else if (/гарант|строк служ|деградац/.test(lower)) {
      answer =
        'Гарантія залежить від точної моделі та партії постачання. Я орієнтуюся на datasheet виробника, але не називаю строк без перевірки документа саме вашої комплектації. Менеджер додасть до пропозиції підтверджену гарантію на інвертор, панелі, АКБ і монтаж окремо.';
    } else if (/наявн|склад|коли буде|є зараз/.test(lower)) {
      answer =
        'Я підбираю з актуального каталогу МЕТОН, але складські залишки можуть змінюватися протягом дня. Точну кількість, резерв товару та дату відвантаження має підтвердити менеджер.';
    } else if (/окуп|економ|заощад|поверн.*грош/.test(lower)) {
      answer =
        'Окупність залежить від вашого денного профілю споживання, тарифу, орієнтації панелей і частки енергії, яку ви використовуєте одразу. Я можу зробити лише попередню оцінку. Для коректного строку окупності менеджеру потрібен рахунок за електроенергію та короткий опис графіка роботи об’єкта.';
    } else if (/скільки.*вироб|генерац|виробіт|квт.*рік/.test(lower)) {
      answer =
        'Річна генерація залежить не лише від потужності панелей, а й від області, кута, орієнтації, затінення та втрат системи. Попередній підбір покриває задане споживання із сезонним запасом, а точний прогноз менеджер зробить після адреси або координат об’єкта.';
    } else if (/двосторон|bifacial|біфац/.test(lower)) {
      answer =
        'Bifacial-панелі виробляють енергію також тильною стороною, але додатковий ефект залежить від висоти монтажу та відбивної здатності поверхні. На звичайному темному даху перевага може бути невеликою. Менеджер має оцінити конструкцію й вирішити, чи виправдана доплата саме на вашому об’єкті.';
      links = [{ label: 'Двосторонні панелі', url: 'panels-bifacial.html' }];
    } else if (/конструкц.*(земл|ґрунт)|на земл|на ґрунт|наземн|ґрунтов.*станц/.test(lower)) {
      answer =
        'Для станції можна передбачити наземну конструкцію. Її переваги — зручний кут, простіше обслуговування та можливість добре вентилювати панелі. ' +
        (state.panels ? 'Для ' + state.panels + ' панелей ' : 'Після визначення кількості панелей ') +
        'потрібно окремо розрахувати кількість рядів, відступи між ними, вітрове й снігове навантаження.\n\n' +
        'Щоб менеджер підібрав точну конструкцію, потрібно уточнити: область, доступну площу ділянки, тип ґрунту та чи можна бетонувати або забивати палі. Я додам потребу в наземній конструкції до вашого підбору.';
      links = [{ label: 'Наземні конструкції', url: 'mounting-ground.html' }];
    } else if (/дах|покрів|черепиц|профнаст|шифер/.test(lower)) {
      answer =
        'Даховий монтаж можливий, але тип кріплення залежить від покрівлі, кроку несучих елементів, кута та стану даху. Для вашої кількості панелей менеджер має перевірити корисну площу, відступи й допустиме навантаження. Після фото або плану даху він запропонує конкретний комплект кріплень.';
      links = [{ label: 'Системи кріплення', url: 'mounting-systems.html' }];
    } else if (/мережев|гібридн|автономн|тип станц|зелений тариф/.test(lower)) {
      answer =
        'Мережева станція зменшує споживання з мережі, але зазвичай вимикається під час аварійного відключення. Гібридна може працювати з АКБ і резервувати вибрані навантаження. Для зеленого тарифу та видачі в мережу окремо перевіряються технічні умови й документи. Остаточний тип менеджер підтвердить після ваших пріоритетів.';
    } else if (/фаз|однофаз|трифаз|1ф|3ф/.test(lower)) {
      answer =
        'Фазність інвертора має відповідати вводу об’єкта й дозволеній потужності. Для станцій від 10–15 кВт найчастіше розглядають трифазне рішення, але автоматично це визначати не можна. Менеджеру потрібне фото ввідного автомата або технічні умови.';
    } else if (/достав|оплат|відправ|нова пошта|термін.*монтаж|скільки.*днів/.test(lower)) {
      answer =
        'Доставка, спосіб оплати й строк монтажу залежать від міста, обсягу комплекту та завантаження монтажної бригади. Бот не показує непідтверджені строки: менеджер перевірить склад, логістику й назве реальну дату перед оформленням.';
      links = [{ label: 'Оплата і доставка', url: 'payment-delivery.html' }];
    } else if (/документ|догов|рахунок|пдв|сертиф|технічн.*умов/.test(lower)) {
      answer =
        'До комерційної пропозиції менеджер може додати рахунок, перелік обладнання, datasheet і доступні сертифікати. Склад документів залежить від типу об’єкта та схеми підключення, тому це потрібно підтвердити перед замовленням.';
    } else if (/інш.*панел|альтернатив|замість longi|замість лонг|інш.*інвертор/.test(lower)) {
      answer =
        'Альтернативи є: можна порівняти інші панелі тієї самої потужності або інвертори Deye, SolaX і Solis. Я не замінюю модель лише за назвою — потрібно звірити напруги стрінгів, фазність, сумісність АКБ, гарантію й наявність. Менеджер запропонує 1–2 рівноцінні варіанти з різницею в ціні.';
      links = [{ label: 'Порівняти обладнання', url: 'compare.html' }];
    } else if (/обслугов|чист|мити|догляд|сервіс/.test(lower)) {
      answer =
        'Панелі періодично оглядають і очищують за потреби, а інвертор та захист перевіряють під час сервісного огляду. Частота залежить від пилу, кута панелей і умов ділянки. Для наземної станції доступ до очищення зазвичай простіший; точний регламент менеджер узгодить для вашого монтажу.';
    } else if (/акум|батар|резерв|автоном/.test(lower)) {
      var inverterForBattery = catalog.inverter[state.systemKw];
      if (inverterForBattery && inverterForBattery.voltage === 'HV') {
        answer =
          'Для вибраного високовольтного трифазного Deye потрібна система Deye BOS-G Pro, а не низьковольтна Pro-C. BOS-G Pro складається з модулів 5,12 кВт·год у послідовній HV-конфігурації; для 30 кВт попередня стартова конфігурація — BOS-G40 Pro на 40,96 кВт·год.\n\n' +
          'Менеджер обов’язково перевірить точну модель інвертора, діапазон напруги, контролер, стійку та бажаний час автономної роботи.';
        links = [{ label: 'Deye BOS-G Pro', url: 'batteries-high-voltage.html' }];
      } else {
        answer =
          'Для сумісного низьковольтного Deye можна розглядати Deye Pro-C. Ємність підбирається за переліком приладів і потрібним часом автономної роботи, а менеджер перевіряє пікові струми та сумісність BMS.';
        links = [{ label: 'Низьковольтні акумулятори', url: 'batteries-lifepo4.html' }];
      }
    } else if (/монтаж|кріплен|кабел|захист|щит|стрінг/.test(lower)) {
      answer =
        'Монтажна частина залежить від покрівлі або ґрунту, довжини трас і схеми захисту. Бот не може безпечно визначити переріз кабелю, стрінги чи автомати без даних об’єкта — це обов’язково перевіряє інженер МЕТОН.';
    } else if (/[?？]|^(чому|який|яка|які|як |чи |скільки|коли|де |що )/.test(lower)) {
      answer =
        'Можу дати попереднє пояснення, але для цього питання потрібні дані конкретного об’єкта або підтвердження актуальної партії товару. Я передам менеджеру вже сформований комплект і саме це запитання, щоб вам не довелося повторювати все спочатку.';
    }

    if (!answer && state.recommendationReady && String(text).trim().length > 4) {
      answer =
        'Я зафіксував це як частину вашого запиту. Щоб не дати неточну відповідь без даних об’єкта, передам формулювання менеджеру разом із уже підібраним комплектом. Можете також уточнити, що для вас важливіше: мінімальна ціна, резерв під час відключень, максимальна генерація чи конкретний спосіб монтажу.';
    }
    if (!answer) return false;
    state.questions = state.questions || [];
    state.questions.push(String(text).trim().slice(0, 300));
    message(answer, 'bot', links);
    setQuick(state.waitingFor === 'reserve'
      ? ['Так, потрібна', 'Ні, без акумулятора', 'Поставити ще питання', 'Передати менеджеру']
      : ['Поставити ще питання', 'Передати менеджеру', 'Зателефонувати менеджеру']);
    return true;
  }

  function saveLead(text) {
    var phone = phoneFrom(text);
    if (!phone) {
      state.waitingFor = 'phone';
      state.name = String(text).trim().slice(0, 80);
      message('Дякую, ' + state.name + '. Тепер вкажіть номер телефону у форматі +380…', 'bot');
      setQuick(['Зателефонувати менеджеру']);
      return;
    }
    state.phone = phone;
    if (!state.name) state.name = 'Клієнт із AI-консультанта';
    var lead = {
      createdAt: new Date().toISOString(),
      source: 'AI-консультант сайту',
      name: state.name,
      phone: state.phone,
      monthlyConsumptionKwh: state.consumption,
      inverter: state.inverter,
      systemKw: state.systemKw,
      panels: state.panels,
      panelModel: state.panelModel,
      reserve: state.reserve,
      customerQuestions: state.questions || []
    };
    try {
      var leads = JSON.parse(localStorage.getItem('metonAiLeads') || '[]');
      leads.push(lead);
      localStorage.setItem('metonAiLeads', JSON.stringify(leads.slice(-50)));
    } catch (error) {}

    var endpoint = window.METON_LEAD_ENDPOINT || '';
    if (endpoint) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lead)
      }).catch(function () {});
    }

    message('Заявку сформовано. Менеджер уже отримає ваше споживання та рекомендований комплект і зв’яжеться з вами для інженерного уточнення.', 'bot',
      [{ label: 'Контакти МЕТОН', url: 'contacts.html' }, { label: 'Подзвонити зараз', url: 'tel:+380960735059' }]);
    setQuick(['Підібрати інший комплект']);
    state.waitingFor = 'done';
  }

  function looksLikeConsultingTopic(text) {
    return /[?？]|чому|навіщо|який|яка|які|як |чи |скільки|коли|де |що |longi|лонг|deye|дея|панел|інвертор|ціна|кошту|вартіст|гарант|наявн|склад|окуп|економ|генерац|виробіт|двосторон|bifacial|біфац|акум|батар|резерв|автоном|конструкц|земл|ґрунт|наземн|дах|покрів|монтаж|кріплен|кабел|захист|щит|фаз|достав|оплат|документ|сертиф|альтернатив|обслугов|сервіс/.test(String(text).toLowerCase());
  }

  function localReply(text) {
    var lower = text.toLowerCase();
    if (lower.indexOf('зателефонувати') !== -1) {
      window.location.href = 'tel:+380960735059';
      return;
    }
    if (lower.indexOf('інший комплект') !== -1) {
      state = { consumption: 0, systemKw: 0, inverter: '', panels: 0, panelModel: '', reserve: null, name: '', phone: '', questions: [], recommendationReady: false, waitingFor: '' };
      message('Почнімо новий підбір. Яке ваше місячне споживання у кВт·год?', 'bot');
      setQuick(['600 кВт·год', '1200 кВт·год', '2000 кВт·год']);
      return;
    }
    if (/поставити.*питан|ще.*питан/.test(lower)) {
      message('Запитуйте. Я поясню логіку підбору, характеристики й орієнтовну економіку, а те, що залежить від об’єкта, партії або актуального складу, позначу для уточнення менеджером.', 'bot');
      setQuick(['Чому саме LONGi?', 'Чому Deye?', 'Яка гарантія?']);
      return;
    }
    if (/передати.*менедж|залишити.*заяв/.test(lower)) {
      state.waitingFor = 'lead';
      message('Напишіть ваше ім’я та номер телефону одним повідомленням. Менеджер отримає також ваш підбір і попередні запитання.', 'bot');
      setQuick(['Зателефонувати менеджеру']);
      return;
    }
    if (state.waitingFor === 'reserve') {
      if (/^так\b|^потріб(ен|на|но)\b/.test(lower.trim())) return reserveAnswer(true);
      if (/^ні\b|^без акум/.test(lower.trim())) return reserveAnswer(false);
      if (answerProductQuestion(text)) return;
      message('Уточніть, будь ласка: потрібна робота основних приладів під час відключень?', 'bot');
      setQuick(['Так, потрібен резерв', 'Ні, без акумулятора']);
      return;
    }
    if (state.waitingFor === 'lead' || state.waitingFor === 'phone') {
      if (looksLikeConsultingTopic(text) && answerProductQuestion(text)) return;
      return saveLead(text);
    }
    if (state.recommendationReady && answerProductQuestion(text)) return;
    if (looksLikeConsultingTopic(text) && answerProductQuestion(text)) return;
    var consumption = extractConsumption(text);
    if (consumption) return recommend(consumption);
    message('Щоб зробити розрахунок, напишіть число — скільки кВт·год ви споживаєте за місяць. Наприклад: 1200 кВт·год.', 'bot');
    setQuick(['600 кВт·год', '1200 кВт·год', '2000 кВт·год']);
  }

  function handle(text) {
    text = String(text || '').trim();
    if (!text) return;
    message(text, 'user');
    input.value = '';
    setQuick([]);

    var endpoint = window.METON_AI_ENDPOINT || '';
    if (!endpoint) {
      window.setTimeout(function () { localReply(text); }, 350);
      return;
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text, state: state })
    }).then(function (response) {
      if (!response.ok) throw new Error('AI endpoint unavailable');
      return response.json();
    }).then(function (data) {
      if (data.state) state = data.state;
      message(data.answer || 'Уточніть, будь ласка, ваше місячне споживання.', 'bot', data.links || []);
      setQuick(data.quickReplies || []);
    }).catch(function () {
      localReply(text);
    });
  }

  launch.addEventListener('click', function () { setOpen(!root.classList.contains('is-open')); });
  close.addEventListener('click', function () { setOpen(false); });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    handle(input.value);
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && root.classList.contains('is-open')) setOpen(false);
  });
})();
