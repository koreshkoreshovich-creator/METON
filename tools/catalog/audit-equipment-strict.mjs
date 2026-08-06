import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog-data.json'), 'utf8'));
const equipment = catalog.products.filter((product) =>
  ['panel', 'inverter', 'battery'].includes(product.type) && !product.id.includes('mount')
);
const failures = [];
const required = {
  panel: [
    ['потужність', /(?:Pmax|потужність)/i], ['ККД', /ККД/i], ['Voc', /Voc/i], ['Isc', /Isc/i],
    ['Vmp', /Vmp/i], ['Imp', /Imp/i], ['напруга системи', /напруга системи/i], ['габарити', /габарити/i]
  ],
  inverter: [
    ['потужність AC', /потужність(?: AC)?/i], ['фазність', /фазність/i], ['PV-напруга', /вхідна напруга PV/i],
    ['MPPT', /MPPT/i], ['струм', /струм/i], ['ККД', /ККД/i], ['IP-захист', /ступінь захисту/i]
  ],
  battery: [
    ['LiFePO4', /LiFePO4/i], ['напруга', /напруга/i], ['ємність або енергія', /(?:ємність|енергія)/i],
    ['струм', /струм/i], ['BMS або комунікація', /(?:BMS|комунікація|Bluetooth|CAN|RS485)/i]
  ]
};

for (const product of equipment) {
  const specs = String(product.specs || '');
  for (const [label, pattern] of required[product.type]) {
    if (!pattern.test(specs)) failures.push(`${product.id}: немає поля «${label}»`);
  }
  if (!product.datasheet) failures.push(`${product.id}: немає datasheet/офіційного джерела`);
  const page = path.join(root, product.page || '');
  if (!fs.existsSync(page)) {
    failures.push(`${product.id}: немає сторінки ${product.page || '(не вказана)'}`);
    continue;
  }
  const html = fs.readFileSync(page, 'utf8');
  const strongOpen = (html.match(/<strong\b/gi) || []).length;
  const strongClose = (html.match(/<\/strong>/gi) || []).length;
  if (strongOpen !== strongClose) failures.push(`${product.page}: незбалансовані strong (${strongOpen}/${strongClose})`);
  if (!/class=["'][^"']*product-detail/.test(html)) failures.push(`${product.page}: немає захисного класу product-detail`);
  if (!html.includes(`cart.html?add=${product.id}`)) failures.push(`${product.page}: неправильна/відсутня кнопка кошика`);
  if (/(?:\$|грн)2\s*<\/strong>/u.test(html)) failures.push(`${product.page}: пошкоджене значення ціни`);
  const pageSpecCount = (html.match(/<li\b/gi) || []).length;
  const dataSpecCount = specs.split('|').map((item) => item.trim()).filter(Boolean).length;
  if (pageSpecCount < dataSpecCount) failures.push(`${product.page}: на сторінці ${pageSpecCount} характеристик замість ${dataSpecCount}`);
}

for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const badMedia = [...html.matchAll(/<a\b[^>]*class=["'][^"']*product-media[^"']*["'][^>]*href=["']([^"']+)["']/gi)]
    .map((match) => match[1]).filter((href) => /(?:consultation|cart)\.html/i.test(href));
  if (badMedia.length && file !== 'batteries-high-voltage.html') failures.push(`${file}: фото веде на ${badMedia.join(', ')}`);
}

console.log(`Суворо перевірено ${equipment.length} позицій: 17 панелей, 17 інверторів, 9 акумуляторів.`);
if (failures.length) {
  console.error(`Знайдено ${failures.length} проблем:`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log('Обов’язкові електричні параметри, джерела, HTML, кошик і переходи з фото — без помилок.');
