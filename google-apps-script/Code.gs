const SPREADSHEET_ID = '1Zc2yP79YesFvJ-w2MRA5SKQ9VEF_LTS2FpOe0XaN5gk';
const SHEET_NAME = 'Замовлення';

function doPost(e) {
  try {
    const data = JSON.parse((e.postData && e.postData.contents) || '{}');
    const action = data.action || (data.items ? 'order' : 'lead');
    if (action === 'configuration') saveConfiguration_(data);
    else if (action === 'lead') saveLead_(data);
    else saveOrder_(data);
    return json_({ok:true,id:data.orderId || data.leadId});
  } catch (error) {
    console.error(error);
    return json_({ok:false,error:error.message});
  }
}

function doGet(e) {
  const action = String(e.parameter.action || '');
  const callback = validCallback_(e.parameter.callback);
  try {
    let result;
    if (action === 'status') result = findStatus_(e.parameter.orderId, e.parameter.phone);
    else if (action === 'ai') result = answerWithAI_(e.parameter.message, e.parameter.state);
    else result = {ok:true,service:'METON Orders API'};
    return callback ? javascript_(callback, result) : json_(result);
  } catch (error) {
    const result = {ok:false,error:error.message};
    return callback ? javascript_(callback, result) : json_(result);
  }
}

function saveOrder_(data) {
  if (!data.orderId || !data.name || !validPhone_(data.phone) || !Array.isArray(data.items) || !data.items.length) throw new Error('Некоректне замовлення');
  const items = data.items.map(item => `${item.name} — ${item.quantity} шт. — ${item.price || 'ціну уточнюйте'}`).join('\n');
  append_([data.orderId,new Date(),'Нове',data.name,data.phone,data.city || '',items,Number(data.itemCount || 0),Number(data.total || 0),data.comment || '',data.contactMethod || 'Телефон',data.source || 'Кошик METON']);
  sendTelegram_('🛒 Нове замовлення',data,items);
}

function saveConfiguration_(data) {
  if (!data.orderId || !data.name || !validPhone_(data.phone) || !data.configuration) throw new Error('Некоректна конфігурація');
  const c=data.configuration;
  const summary=[
    `${c.type}: ${c.systemKw} кВт`,
    `Панелі: ${c.panels} шт. × близько ${c.panelWatts} Вт`,
    `Інвертор: ${c.phase}`,
    `АКБ: ${c.batteryKwh ? c.batteryKwh+' кВт·год, '+c.batteryClass : 'не обов’язковий'}`,
    `Генерація: близько ${c.annualGeneration} кВт·год/рік`,
    `Площа: близько ${c.areaNeeded} м²`
  ].join('\n');
  append_([data.orderId,new Date(),'Нове',data.name,data.phone,'',summary,1,0,data.comment || '','Телефон',data.source || 'Конфігуратор METON']);
  sendTelegram_('☀️ Нова конфігурація',data,summary);
}

function saveLead_(data) {
  if (!data.name || !validPhone_(data.phone)) throw new Error('Некоректний контакт');
  const id=data.leadId || ('AI-'+Date.now().toString(36).toUpperCase());
  const summary=[
    `Споживання: ${data.monthlyConsumptionKwh || 'не вказано'} кВт·год/міс.`,
    `Орієнтир станції: ${data.systemKw || 'уточнити'} кВт`,
    `Інвертор: ${data.inverter || 'уточнити'}`,
    `Панелі: ${data.panels || 'уточнити'}`,
    `Резерв: ${data.reserve === true ? 'потрібен' : data.reserve === false ? 'не потрібен' : 'уточнити'}`,
    `Питання: ${(data.customerQuestions || []).join('; ') || 'немає'}`
  ].join('\n');
  append_([id,new Date(),'Нове',data.name,data.phone,'',summary,1,0,'AI-консультація','Телефон',data.source || 'AI-консультант METON']);
  sendTelegram_('🤖 Новий AI-лід',{orderId:id,name:data.name,phone:data.phone,city:'',comment:''},summary);
}

function append_(row) {
  const lock=LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('Аркуш замовлень не знайдено');
    sheet.appendRow(row.map(safeCell_));
  } finally { lock.releaseLock(); }
}

function findStatus_(orderId, phone) {
  orderId=String(orderId || '').trim().toUpperCase();
  phone=digits_(phone);
  if (!orderId || phone.length < 7) return {ok:false,error:'Вкажіть номер звернення і телефон'};
  const values=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME).getDataRange().getDisplayValues();
  for (let i=values.length-1;i>0;i--) {
    if (String(values[i][0]).toUpperCase()===orderId && digits_(values[i][4]).slice(-7)===phone.slice(-7)) {
      return {ok:true,orderId:values[i][0],date:values[i][1],status:values[i][2],summary:values[i][6]};
    }
  }
  return {ok:false,error:'Замовлення не знайдено. Перевірте номер і телефон.'};
}

function answerWithAI_(message, stateText) {
  message=String(message || '').trim().slice(0,600);
  if (!message) return {ok:false,error:'Порожнє повідомлення'};
  const props=PropertiesService.getScriptProperties();
  const key=props.getProperty('OPENAI_API_KEY');
  if (!key) return {ok:false,fallback:true,error:'AI ще не активовано'};
  let state={};
  try { state=JSON.parse(stateText || '{}'); } catch (e) {}
  const instructions=[
    'Ти AI-консультант української компанії МЕТОН із сонячної енергетики. Відповідай українською, коротко, конкретно і доброзичливо.',
    'Не називай цін: вони змінюються, ціну підтверджує менеджер.',
    'Не вигадуй точний SKU, наявність, гарантію чи сумісність. Якщо даних недостатньо — постав одне доречне уточнення.',
    'Для систем 15 кВт і більше з резервом орієнтуй на високовольтні АКБ; для Deye 30 кВт згадуй клас Deye BOS-G Pro, а не Deye Pro-C.',
    'Ємність АКБ визначай за критичним навантаженням і годинами резерву, а не за потужністю станції.',
    'Можеш пояснювати панелі, інвертори, АКБ, монтаж, генерацію, окупність, доставку й логіку підбору.',
    'Чітко відділяй попередній розрахунок від фінального інженерного рішення. За складного питання пропонуй передати дані менеджеру.'
  ].join('\n');
  const payload={
    model:props.getProperty('OPENAI_MODEL') || 'gpt-5.6-luna',
    instructions:instructions,
    input:`Дані поточного підбору: ${JSON.stringify(state).slice(0,1800)}\nПитання клієнта: ${message}`,
    max_output_tokens:450,
    reasoning:{effort:'low'},
    text:{verbosity:'low'}
  };
  const response=UrlFetchApp.fetch('https://api.openai.com/v1/responses',{
    method:'post',contentType:'application/json',
    headers:{Authorization:'Bearer '+key},
    payload:JSON.stringify(payload),muteHttpExceptions:true
  });
  if (response.getResponseCode() >= 300) throw new Error('AI тимчасово недоступний');
  const body=JSON.parse(response.getContentText());
  let answer=body.output_text || '';
  if (!answer && body.output) body.output.forEach(item => (item.content || []).forEach(part => { if (part.type==='output_text') answer += part.text; }));
  return {ok:true,answer:answer || 'Уточніть, будь ласка, параметри об’єкта.',quickReplies:['Розрахувати станцію','Потрібен резерв','Передати менеджеру']};
}

function sendTelegram_(title,data,details) {
  const props=PropertiesService.getScriptProperties(),token=props.getProperty('TELEGRAM_BOT_TOKEN'),chatId=props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) {
    console.warn('Telegram не налаштований: додайте TELEGRAM_BOT_TOKEN і TELEGRAM_CHAT_ID');
    return {ok:false,error:'Telegram не налаштований'};
  }
  const text=[
    title+' '+(data.orderId || ''),
    '',
    'Клієнт: '+data.name,
    'Телефон: '+data.phone,
    'Бажаний зв’язок: '+(data.contactMethod || 'Телефон'),
    'Місто: '+(data.city || 'не вказано'),
    '',
    'Деталі:',
    details,
    '',
    'Коментар: '+(data.comment || 'немає'),
    'Джерело: '+(data.source || 'METON')
  ].join('\n').slice(0,4000);
  const telegramPayload={chat_id:chatId,text:text,disable_web_page_preview:true};
  const threadId=props.getProperty('TELEGRAM_THREAD_ID');
  if (threadId) telegramPayload.message_thread_id=Number(threadId);
  const response=UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`,{
    method:'post',
    contentType:'application/json',
    payload:JSON.stringify(telegramPayload),
    muteHttpExceptions:true
  });
  const result=JSON.parse(response.getContentText() || '{}');
  if (response.getResponseCode() >= 300 || !result.ok) {
    console.error('Telegram: '+(result.description || response.getContentText()));
    return {ok:false,error:result.description || 'Помилка Telegram'};
  }
  return {ok:true,messageId:result.result && result.result.message_id};
}

function testTelegramSetup() {
  const result=sendTelegram_(
    '✅ Тест сповіщень METON',
    {
      orderId:'TEST-'+Date.now(),
      name:'Тестове замовлення',
      phone:'+380000000000',
      city:'Львів',
      contactMethod:'Telegram',
      comment:'Якщо ви бачите це повідомлення, сповіщення налаштовані.',
      source:'Google Apps Script'
    },
    'Тест без оформлення реального замовлення'
  );
  if (!result || !result.ok) throw new Error((result && result.error) || 'Telegram не відповів');
  console.log('Telegram працює. Message ID: '+result.messageId);
}

function listTelegramChatIds() {
  const token=PropertiesService.getScriptProperties().getProperty('TELEGRAM_BOT_TOKEN');
  if (!token) throw new Error('Спочатку додайте TELEGRAM_BOT_TOKEN у властивості сценарію');
  const response=UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/getUpdates`,{muteHttpExceptions:true});
  const body=JSON.parse(response.getContentText() || '{}');
  if (!body.ok) throw new Error(body.description || 'Telegram не повернув список чатів');
  const chats={};
  (body.result || []).forEach(update => {
    const message=update.message || update.channel_post || update.edited_message;
    if (!message || !message.chat) return;
    const chat=message.chat;
    chats[chat.id]={
      id:chat.id,
      type:chat.type,
      name:chat.title || [chat.first_name,chat.last_name].filter(Boolean).join(' ') || chat.username || 'Без назви'
    };
  });
  const found=Object.keys(chats).map(id => chats[id]);
  if (!found.length) throw new Error('Напишіть боту /start або повідомлення в групі, а потім запустіть цю функцію ще раз');
  console.log(JSON.stringify(found,null,2));
  return found;
}

function validPhone_(value){ return /^\+?[0-9\s()\-]{10,20}$/.test(String(value || '')); }
function digits_(value){ return String(value || '').replace(/\D/g,''); }
function safeCell_(value){
  if (value instanceof Date || typeof value === 'number') return value;
  const text=String(value==null?'':value).slice(0,5000);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}
function validCallback_(value){ value=String(value || ''); return /^[A-Za-z_$][0-9A-Za-z_$\.]{0,80}$/.test(value) ? value : ''; }
function json_(value){ return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function javascript_(callback,value){ return ContentService.createTextOutput(`${callback}(${JSON.stringify(value)});`).setMimeType(ContentService.MimeType.JAVASCRIPT); }
