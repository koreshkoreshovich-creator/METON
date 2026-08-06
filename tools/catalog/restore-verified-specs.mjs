import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalogPath = path.join(root, 'catalog-data.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
const verified = JSON.parse(execFileSync('git', ['show', '7eee250:catalog-data.json'], { cwd: root, encoding: 'utf8' }));
const verifiedById = new Map(verified.products.map((product) => [product.id, product]));
const equipment = catalog.products.filter((product) =>
  ['panel', 'inverter', 'battery'].includes(product.type) && !product.id.includes('mount')
);
const brokenPages = new Set([
  'deye-10k-lp1', 'deye-12k-3p', 'deye-12k-lp1', 'deye-15k-3p', 'deye-20k-3p',
  'deye-30k-3p', 'deye-50k-3p', 'deye-6k-1p', 'deye-80k-3p', 'deye-8k-1p'
]);
const datasheetOverrides = new Map([
  ['battery-deye-se-f16', 'https://deye.com/wp-content/uploads/2026/02/deye-se-f5f5-prof5-plusf12f12-maxf16f16-max-series_brochure-20260206v1.1.pdf'],
  ['battery-deye-se-g5', 'https://deye.com/wp-content/uploads/2026/01/deye-se-g5.1-pro-b-series_brochure-20260115v1.0-_na.pdf'],
  ['battery-litime-12v-100ah', 'https://www.litime.com/products/litime-12v-100ah-lithium-lifepo4-battery'],
  ['battery-lp-24v-100ah', 'https://logicpower.ua/ua/akkumulyatornye-batarei-lifepo4/akkumulyator-lp-lifepo4-24v-25-6v-100-ah-2560wh-smart-bms-100a-s-bt-plastik'],
  ['battery-lp-24v-200ah', 'https://logicpower.ua/ua/akkumulyatornye-batarei-lifepo4/akkumulyator-lp-lifepo4-24v-25-6v-200-ah-5120wh-smart-bms-100a-s-bt-plastik'],
  ['battery-pylontech-us2000c', 'https://www.pylontech.com.cn/products/homeess2'],
  ['battery-pylontech-us3000c', 'https://www.pylontech.com.cn/products/homeess2'],
  ['battery-pylontech-us5000', 'https://www.pylontech.com.cn/products/homeess2'],
  ['deye-80k-3p', 'https://www.deyeinverter.com/deyeinverter/2025/05/29/%E3%80%90b%E3%80%91datasheet_sun-60-80k-sg02hp3-eu-em6_30240102201760_20250520_en-1.pdf']
]);
const specOverrides = new Map([
  ['battery-litime-12v-100ah', 'Хімія: LiFePO4 | Номінальна напруга: 12,8 В | Номінальна ємність: 100 А·год | Номінальна енергія: 1,28 кВт·год | Вбудована BMS: 100 А | Максимальний безперервний струм заряду: 100 А | Максимальний безперервний струм розряду: 100 А | Застосування: малі резервні та автономні системи | Паралельне/послідовне з’єднання: до 4P4S відповідно до паспорта виробника'],
  ['battery-lp-24v-200ah', 'Хімія: LiFePO4 | Номінальна напруга: 25,6 В | Номінальна ємність: 200 А·год | Номінальна енергія: 5,12 кВт·год | Мінімальна напруга: 21 В | Напруга повного заряду: 29,2 В | Напруга заряду в буферному режимі: 27,6 В | Напруга заряду в циклічному режимі: 29,2 В | Максимальний струм заряду: 50 А | Максимальний струм розряду: 100 А | Smart BMS: 100 А | Струм балансування: 2 А | Моніторинг: Bluetooth | Застосування: резервне живлення з ДБЖ/інвертором | Послідовне з’єднання акумуляторів: заборонено'],
  ['deye-80k-3p', 'Номінальна потужність AC: 80 кВт | Фазність: 3 фази | Тип АКБ: високовольтна Li-ion | Діапазон напруги АКБ: 160–1000 В | Входи АКБ: 2 | Максимальний струм заряду/розряду: 160 А (80 + 80 А) | Максимальна доступна PV-потужність: 160 кВт | Максимальна вхідна PV-потужність: 128 кВт | Максимальна вхідна напруга PV: 1000 В | Пускова напруга PV: 180 В | Діапазон MPPT: 150–850 В | Номінальна PV-напруга: 650 В | Кількість MPPT / стрінгів: 6 / 2+2+2+2+2+2 | Максимальний робочий струм PV: 6 × 36 А | Максимальний струм короткого замикання PV: 6 × 54 А | Максимальна вихідна потужність AC: 88 кВА | Максимальний ККД: 97,6% | Комунікація BMS: RS485, CAN | Ступінь захисту: IP65 | Габарити: 606 × 927 × 314 мм | Вага: 80 кг']
]);
const specAppend = new Map([
  ['deye-30k-3p', 'Максимальний ККД: 97,6%'],
  ['deye-50k-3p', 'Максимальний ККД: 97,6%'],
  ['solis-10k', 'Фазність: 3 фази'],
  ['solis-15k', 'Фазність: 3 фази'],
  ['solis-20k', 'Фазність: 3 фази'],
  ['solis-30k', 'Фазність: 3 фази | Максимальна вхідна напруга PV: 1100 В']
]);

function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

for (const product of equipment) {
  const source = verifiedById.get(product.id);
  if (source?.specs) product.specs = source.specs;
  if (source?.datasheet && !product.datasheet) product.datasheet = source.datasheet;
  if (specOverrides.has(product.id)) product.specs = specOverrides.get(product.id);
  if (specAppend.has(product.id)) product.specs = `${product.specs} | ${specAppend.get(product.id)}`;
  if (datasheetOverrides.has(product.id)) product.datasheet = datasheetOverrides.get(product.id);

  const pagePath = path.join(root, product.page);
  if (!fs.existsSync(pagePath)) continue;
  let html = brokenPages.has(product.id)
    ? execFileSync('git', ['show', `7eee250:${product.page}`], { cwd: root, encoding: 'utf8' })
    : fs.readFileSync(pagePath, 'utf8');

  const items = String(product.specs || '').split('|').map((item) => item.trim()).filter(Boolean);
  const list = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
  if (/<ul class=["']spec-list["'][^>]*>[\s\S]*?<\/ul>/i.test(html)) {
    html = html.replace(/<ul class=["']spec-list["'][^>]*>[\s\S]*?<\/ul>/i, `<ul class="spec-list">${list}</ul>`);
  }

  html = html.replace(/<section class="detail">/i, '<section class="detail product-detail">');
  html = html.replace(/<div class="price-row"><strong class="detail-price">([^<]*?)<\/div>/i, (_, price) => {
    const cleanPrice = price.replace(/(\$|грн)2\s*$/u, '$1').trim();
    return `<div class="price-row"><strong class="detail-price">${cleanPrice}</strong></div>`;
  });
  fs.writeFileSync(pagePath, html, 'utf8');
}

catalog.generatedAt = new Date().toISOString();
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Restored verified specifications and normalized markup for ${equipment.length} equipment pages.`);
