import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const toolDir = path.dirname(fileURLToPath(import.meta.url));
const siteDir = path.resolve(toolDir, '../..');
const files = (await fs.readdir(siteDir))
  .filter((name) => /^product-.*\.html$/i.test(name))
  .sort();
const catalogSources = (await fs.readdir(siteDir))
  .filter((name) => name.endsWith('.html') && !name.startsWith('product-'));
const linkedProductPages = new Set();
for (const source of catalogSources) {
  const html = await fs.readFile(path.join(siteDir, source), 'utf8');
  for (const link of html.matchAll(/href=["'](product-[^"'?#]+\.html)/gi)) {
    linkedProductPages.add(link[1]);
  }
}

function clean(value = '') {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function match(html, expression, fallback = '') {
  return clean(html.match(expression)?.[1] || fallback);
}

function inferBrand(name) {
  const brands = ['Deye', 'SolaX', 'Solis', 'LONGi', 'Longi', 'Trina Solar', 'Tongwei Solar', 'AIKO', 'Jinko', 'Sunova Solar', 'Inter Energy', 'SWI Solar', 'Felicity'];
  return brands.find((brand) => name.toLowerCase().includes(brand.toLowerCase())) || '';
}

function inferType(category, name) {
  const text = `${category} ${name}`.toLowerCase();
  if (text.includes('панел')) return 'panel';
  if (text.includes('інвертор')) return 'inverter';
  if (text.includes('акумулятор') || text.includes('акб')) return 'battery';
  if (text.includes('станц')) return 'station';
  if (text.includes('кріплен') || text.includes('конструкц')) return 'mounting';
  return 'equipment';
}

const products = [];
for (const file of files) {
  if (!linkedProductPages.has(file)) continue;
  const html = await fs.readFile(path.join(siteDir, file), 'utf8');
  const article = html.match(/<article>([\s\S]*?)<\/article>/i)?.[1] || html;
  const name = match(article, /<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!name) continue;

  const cartId = html.match(/cart\.html\?add=([^"'&<]+)/i)?.[1];
  const scriptId = html.match(/var\s+productId\s*=\s*["']([^"']+)/i)?.[1];
  const id = decodeURIComponent(cartId || scriptId || file.replace(/^product-|\.html$/gi, ''));
  const category = match(article, /<span class=["']badge["'][^>]*>([\s\S]*?)<\/span>/i);
  const description = match(article, /<h1[^>]*>[\s\S]*?<\/h1>\s*<p[^>]*>([\s\S]*?)<\/p>/i);
  const priceText = match(article, /class=["']detail-price["'][^>]*>([\s\S]*?)<\/strong>/i);
  const price = Number((priceText.match(/[\d\s.,]+/)?.[0] || '').replace(/\s/g, '').replace(',', '.')) || 0;
  const currency = priceText.includes('$') ? 'USD' : priceText.includes('€') ? 'EUR' : priceText ? 'UAH' : '';
  const image = html.match(/<div class=["']detail-img["'][^>]*>\s*<img[^>]+src=["']([^"']+)/i)?.[1] || '';
  const imageAlt = html.match(/<div class=["']detail-img["'][^>]*>\s*<img[^>]+alt=["']([^"']+)/i)?.[1] || name;
  const specBlock = html.match(/<ul class=["']spec-list["'][^>]*>([\s\S]*?)<\/ul>/i)?.[1] || '';
  const specs = [...specBlock.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((item) => clean(item[1])).filter(Boolean);
  const datasheetLinks = [...html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)]
    .map((item) => ({ url: item[1], label: clean(item[2]) }))
    .filter((item) => /datasheet|паспорт|технічн/i.test(`${item.label} ${item.url}`));
  const datasheet = datasheetLinks[0]?.url || '';

  products.push({
    id,
    active: 'Так',
    category,
    type: inferType(category, name),
    brand: inferBrand(name),
    name,
    description,
    price,
    currency,
    availability: 'В наявності',
    power: match(specBlock, /Потужність:\s*([^<]+)/i),
    image,
    image_alt: clean(imageAlt),
    gallery: '',
    datasheet,
    page: file,
    specs: specs.join(' | '),
    photo_status: image ? 'Є' : 'Немає',
    datasheet_status: datasheet ? 'Є' : 'Немає',
    updated_at: new Date().toISOString()
  });
}

await fs.writeFile(
  path.join(siteDir, 'catalog-data.json'),
  `${JSON.stringify({ version: 1, generatedAt: new Date().toISOString(), products }, null, 2)}\n`,
  'utf8'
);

console.log(`Extracted ${products.length} products to catalog-data.json`);
