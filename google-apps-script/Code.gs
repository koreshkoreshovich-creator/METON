const SPREADSHEET_ID = '1Zc2yP79YesFvJ-w2MRA5SKQ9VEF_LTS2FpOe0XaN5gk';
const SHEET_NAME = 'Замовлення';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    validateOrder_(data);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
      if (!sheet) throw new Error('Аркуш замовлень не знайдено');

      const itemsText = data.items
        .map(item => `${item.name} — ${item.quantity} шт. — ${item.price || 'ціну уточнюйте'}`)
        .join('\n');

      sheet.appendRow([
        safeCell_(data.orderId),
        new Date(),
        'Нове',
        safeCell_(data.name),
        safeCell_(data.phone),
        safeCell_(data.city || ''),
        safeCell_(itemsText),
        Number(data.itemCount || 0),
        Number(data.total || 0),
        safeCell_(data.comment || ''),
        safeCell_(data.contactMethod || 'Телефон'),
        safeCell_(data.source || 'Сайт METON')
      ]);

      sendTelegram_(data, itemsText);
    } finally {
      lock.releaseLock();
    }

    return json_({ok: true, orderId: data.orderId});
  } catch (error) {
    console.error(error);
    return json_({ok: false, error: error.message});
  }
}

function validateOrder_(data) {
  if (!data || !data.orderId || !data.name || !data.phone) {
    throw new Error('Заповніть ім’я та телефон');
  }
  if (!Array.isArray(data.items) || !data.items.length || data.items.length > 100) {
    throw new Error('Кошик порожній або містить забагато позицій');
  }
  if (!/^\+?[0-9\s()\-]{10,20}$/.test(String(data.phone))) {
    throw new Error('Некоректний номер телефону');
  }
}

function safeCell_(value) {
  const text = String(value == null ? '' : value).slice(0, 5000);
  return /^[=+\-@]/.test(text) ? `'${text}` : text;
}

function sendTelegram_(data, itemsText) {
  const props = PropertiesService.getScriptProperties();
  const token = props.getProperty('TELEGRAM_BOT_TOKEN');
  const chatId = props.getProperty('TELEGRAM_CHAT_ID');
  if (!token || !chatId) return;

  const message = [
    '🛒 Нове замовлення ' + data.orderId,
    '',
    'Клієнт: ' + data.name,
    'Телефон: ' + data.phone,
    'Місто: ' + (data.city || 'не вказано'),
    'Зв’язок: ' + (data.contactMethod || 'Телефон'),
    '',
    'Товари:',
    itemsText,
    '',
    'Орієнтовна сума: ' + Number(data.total || 0).toLocaleString('uk-UA') + ' грн',
    'Коментар: ' + (data.comment || 'немає')
  ].join('\n');

  UrlFetchApp.fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({chat_id: chatId, text: message}),
    muteHttpExceptions: true
  });
}

function json_(value) {
  return ContentService
    .createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
