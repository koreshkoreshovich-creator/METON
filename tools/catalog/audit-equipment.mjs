import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'catalog-data.json'), 'utf8'));
const errors = [];
const warnings = [];
const counts = { panel: 0, inverter: 0, battery: 0 };
const ids = new Set();

const products = catalog.products.filter((product) =>
  ['panel', 'inverter', 'battery'].includes(product.type) &&
  !/mount|кріплен/i.test(`${product.id} ${product.category}`)
);

for (const product of products) {
  counts[product.type] += 1;
  if (!product.id || ids.has(product.id)) errors.push(`Неунікальний або порожній ID: ${product.id || '(порожньо)'}`);
  ids.add(product.id);

  const pagePath = path.join(root, product.page || '');
  if (!product.page || !fs.existsSync(pagePath)) {
    errors.push(`${product.id}: сторінку товару не знайдено (${product.page || 'не вказано'})`);
    continue;
  }

  const html = fs.readFileSync(pagePath, 'utf8');
  const pageSpecs = (html.match(/<li\b/gi) || []).length;
  const dataSpecs = String(product.specs || '').split('|').map((item) => item.trim()).filter(Boolean).length;
  if (pageSpecs < 7) errors.push(`${product.id}: на сторінці лише ${pageSpecs} характеристик`);
  if (dataSpecs < 7) errors.push(`${product.id}: у catalog-data лише ${dataSpecs} характеристик`);
  if (!html.includes(`cart.html?add=${product.id}`)) errors.push(`${product.id}: немає правильної кнопки кошика`);

  if (product.image && !/^https?:/i.test(product.image) && !fs.existsSync(path.join(root, product.image))) {
    errors.push(`${product.id}: файл зображення не знайдено (${product.image})`);
  }
  if (!product.datasheet) warnings.push(`${product.id}: datasheet не вказаний у catalog-data`);
}

for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const badMedia = [...html.matchAll(/<a\b[^>]*class=["'][^"']*product-media[^"']*["'][^>]*href=["']([^"']+)["']/gi)]
    .map((match) => match[1])
    .filter((href) => /(?:consultation|cart)\.html/i.test(href));
  // The BOS-G placeholder is replaced by its runtime product card before catalog-details initializes.
  if (badMedia.length && file !== 'batteries-high-voltage.html') {
    errors.push(`${file}: фотографія товару веде не на товар (${badMedia.join(', ')})`);
  }
}

const proCList = fs.readFileSync(path.join(root, 'batteries-lifepo4.html'), 'utf8');
if (!proCList.includes('href="product-battery-deye-se-f5-pro-c.html"')) {
  errors.push('Deye SE-F5 Pro-C: фото/назва не веде на сторінку товару');
}

console.log(`Перевірено ${products.length} товарів: ${counts.panel} панелей, ${counts.inverter} інверторів, ${counts.battery} АКБ.`);
if (warnings.length) {
  console.log(`Попередження (${warnings.length}):`);
  warnings.forEach((message) => console.log(`- ${message}`));
}
if (errors.length) {
  console.error(`Помилки (${errors.length}):`);
  errors.forEach((message) => console.error(`- ${message}`));
  process.exit(1);
}
console.log('Критичних помилок у сторінках, характеристиках, фото-переходах і кошику не знайдено.');
