import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(toolDir, '../..');
const sheetId = '1Zc2yP79YesFvJ-w2MRA5SKQ9VEF_LTS2FpOe0XaN5gk';
const defaultUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Каталог')}`;
const csvUrl = process.env.CATALOG_SHEET_CSV_URL || defaultUrl;

function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(value); value = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(value); value = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else value += char;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}

function slug(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\wа-яіїєґ]+/giu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}

async function localizeImage(product) {
  if (!/^https?:\/\//i.test(product.image)) return product.image;
  let source = product.image;
  const driveId = source.match(/\/d\/([^/]+)/)?.[1] || source.match(/[?&]id=([^&]+)/)?.[1];
  if (driveId) source = `https://drive.google.com/uc?export=download&id=${driveId}`;
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Не вдалося завантажити фото ${product.id}: ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  const extension = contentType.includes('png') ? 'png' : contentType.includes('webp') ? 'webp' : 'jpg';
  const target = `assets/catalog/${slug(product.id)}.${extension}`;
  await fs.mkdir(path.join(siteDir, 'assets/catalog'), { recursive: true });
  await fs.writeFile(path.join(siteDir, target), Buffer.from(await response.arrayBuffer()));
  return target;
}

function updatePage(html, product) {
  const price = product.price ? `${Number(product.price).toLocaleString('uk-UA')} ${product.currency === 'USD' ? '$' : product.currency === 'EUR' ? '€' : 'грн'}` : 'Ціну уточнюйте';
  html = html.replace(/(<h1[^>]*>)[\s\S]*?(<\/h1>)/i, `$1${escapeHtml(product.name)}$2`);
  html = html.replace(/(<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>)[\s\S]*?(<\/p>)/i, `$1${escapeHtml(product.description)}$2`);
  html = html.replace(/(<strong class=["']detail-price["'][^>]*>)[\s\S]*?(<\/strong>)/i, `$1${price}$2`);
  html = html.replace(/(<div class=["']detail-img["'][^>]*>\s*<img[^>]+src=["'])[^"']+(["'])/i, `$1${product.image}$2`);
  html = html.replace(/(<div class=["']detail-img["'][^>]*>\s*<img[^>]+alt=["'])[^"']*(["'])/i, `$1${escapeHtml(product.image_alt || product.name)}$2`);
  if (product.specs) {
    const items = product.specs.split('|').map((item) => item.trim()).filter(Boolean).map((item) => `<li>${escapeHtml(item)}</li>`).join('');
    html = html.replace(/(<ul class=["']spec-list["'][^>]*>)[\s\S]*?(<\/ul>)/i, `$1${items}$2`);
  }
  if (product.datasheet) {
    html = html.replace(/(<a[^>]+href=["'])[^"']+(["'][^>]*>[^<]*(?:Datasheet|паспорт|Технічні характеристики)[^<]*<\/a>)/i, `$1${product.datasheet}$2`);
  }
  return html;
}

const response = await fetch(csvUrl);
if (!response.ok) throw new Error(`Google Sheets повернув ${response.status}. Відкрийте доступ «усі, хто має посилання».`);
const rows = parseCsv(await response.text());
const headers = rows.shift();
const records = rows.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ''])));
const previous = JSON.parse(await fs.readFile(path.join(siteDir, 'catalog-data.json'), 'utf8'));
const previousById = new Map(previous.products.map((product) => [product.id, product]));
const products = [];

for (const record of records) {
  const id = record.ID || slug(record.Назва);
  if (!id || record.Активний === 'Ні') continue;
  const old = previousById.get(id) || {};
  const product = {
    ...old,
    id,
    active: record.Активний || 'Так',
    category: record.Категорія || old.category || '',
    type: record.Тип || old.type || 'equipment',
    brand: record.Бренд || old.brand || '',
    name: record.Назва || old.name || '',
    description: record['Короткий опис'] || old.description || '',
    price: Number(String(record.Ціна || 0).replace(/\s/g, '').replace(',', '.')) || 0,
    currency: record.Валюта || old.currency || 'UAH',
    availability: record.Наявність || 'В наявності',
    power: record.Потужність || '',
    image: record['Основне фото'] || old.image || '',
    image_alt: record['Alt фото'] || record.Назва || '',
    gallery: record.Галерея || '',
    datasheet: record.Datasheet || '',
    page: record.Сторінка || old.page || `product-${slug(id)}.html`,
    specs: record.Характеристики || '',
    photo_status: record.Фото || (record['Основне фото'] ? 'Є' : 'Немає'),
    datasheet_status: record['Datasheet статус'] || (record.Datasheet ? 'Є' : 'Немає'),
    publication: record.Публікація || 'Потребує перевірки',
    errors: record.Помилки || '',
    updated_at: new Date().toISOString()
  };
  if (!product.name || !product.image) {
    console.warn(`Пропущено ${id}: потрібні назва та основне фото`);
    continue;
  }
  product.image = await localizeImage(product);
  products.push(product);

  const pagePath = path.join(siteDir, product.page);
  let html;
  try {
    html = await fs.readFile(pagePath, 'utf8');
  } catch {
    const exemplar = previous.products.find((item) => item.type === product.type && item.page);
    if (!exemplar) throw new Error(`Немає шаблону сторінки для типу ${product.type}`);
    html = await fs.readFile(path.join(siteDir, exemplar.page), 'utf8');
    html = html.split(exemplar.id).join(product.id);
  }
  await fs.writeFile(pagePath, updatePage(html, product), 'utf8');
}

await fs.writeFile(
  path.join(siteDir, 'catalog-data.json'),
  `${JSON.stringify({ version: 2, generatedAt: new Date().toISOString(), products }, null, 2)}\n`,
  'utf8'
);

const sitemapPath = path.join(siteDir, 'sitemap.xml');
try {
  let sitemap = await fs.readFile(sitemapPath, 'utf8');
  sitemap = sitemap.replace(/\s*<url>\s*<loc>[^<]*\/product-[^<]+\.html<\/loc>[\s\S]*?<\/url>/gi, '');
  const productUrls = products.map((product) =>
    `  <url><loc>https://koreshkoreshovich-creator.github.io/METON/${product.page}</loc></url>`
  ).join('\n');
  sitemap = sitemap.replace(/\s*<\/urlset>\s*$/i, `\n${productUrls}\n</urlset>\n`);
  await fs.writeFile(sitemapPath, sitemap, 'utf8');
} catch {
  console.warn('sitemap.xml не знайдено — пропущено його оновлення');
}
console.log(`Каталог синхронізовано: ${products.length} товарів`);
