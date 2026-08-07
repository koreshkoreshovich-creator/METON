import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const catalog = JSON.parse(await fs.readFile(path.join(root, 'catalog-data.json'), 'utf8'));
const products = Array.isArray(catalog.products) ? catalog.products : [];

const baseUrl = String(process.env.DIRECTUS_URL || 'https://cms.metongroup.com').replace(/\/$/, '');
const email = process.env.DIRECTUS_ADMIN_EMAIL;
const password = process.env.DIRECTUS_ADMIN_PASSWORD;
const apply = process.argv.includes('--apply');

if (!email || !password) {
  console.error('Set DIRECTUS_ADMIN_EMAIL and DIRECTUS_ADMIN_PASSWORD before running this script.');
  process.exit(1);
}

async function jsonRequest(route, options = {}) {
  const response = await fetch(baseUrl + route, {
    ...options,
    headers: {
      'content-type': 'application/json',
      ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    throw new Error(`${response.status} ${route}: ${text}`);
  }
  return body;
}

const login = await jsonRequest('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const token = login.data.access_token;

const fieldResponse = await jsonRequest('/fields/products', { token });
const productFields = new Set(fieldResponse.data.map((field) => field.field));
const primaryField = fieldResponse.data.find((field) => field.schema?.is_primary_key)?.field || 'id';

const existingResponse = await jsonRequest('/items/products?limit=-1&fields=*', { token });
const existing = existingResponse.data || [];

let categories = [];
let categoryFields = new Set();
let categoryPrimaryField = 'id';
try {
  const categoryFieldResponse = await jsonRequest('/fields/categories', { token });
  categoryFields = new Set(categoryFieldResponse.data.map((field) => field.field));
  categoryPrimaryField = categoryFieldResponse.data.find((field) => field.schema?.is_primary_key)?.field || 'id';
  const categoryResponse = await jsonRequest('/items/categories?limit=-1&fields=*', { token });
  categories = categoryResponse.data || [];
} catch {
  // Category relation is optional. The product data still remains fully editable.
}

const categorySlugByName = new Map([
  ['Односторонні панелі', 'panels-monofacial'],
  ['Двосторонні панелі', 'panels-bifacial'],
  ['Гібридні інвертори', 'inverters-hybrid'],
  ['Мережеві інвертори', 'inverters-grid'],
  ['Низьковольтні акумулятори', 'batteries-low-voltage'],
  ['Високовольтні акумулятори', 'batteries-high-voltage'],
  ['Готові гібридні рішення', 'stations-hybrid'],
  ['Зелений тариф', 'stations-green-tariff'],
  ['Станції власного споживання', 'stations-self-consumption'],
  ['Кріплення для панелей', 'mounting-kits'],
  ['Комплектуючі кріплення', 'mounting-components'],
  ['Наземні конструкції', 'mounting-ground']
]);

function normalized(value) {
  return String(value || '').trim().toLocaleLowerCase('uk-UA');
}

function categoryRecord(name) {
  const slug = categorySlugByName.get(name) || '';
  return categories.find((category) =>
    normalized(category.name || category.title) === normalized(name) ||
    normalized(category.slug || category.key) === normalized(slug)
  );
}

function numericPower(value, unit) {
  const text = String(value || '').replace(',', '.');
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  if (!Number.isFinite(number)) return null;
  if (unit === 'w') return /квт/i.test(text) ? Math.round(number * 1000) : Math.round(number);
  if (unit === 'kw') return /\bвт\b/i.test(text) && !/квт/i.test(text) ? number / 1000 : number;
  return null;
}

function pickPayload(product) {
  const category = categoryRecord(product.category);
  const candidates = {
    name: product.name,
    title: product.name,
    slug: product.id,
    sku: product.id,
    product_type: product.type,
    type: product.type,
    brand: product.brand,
    model: '',
    short_description: product.description,
    description: product.description,
    price: Number(product.price) || null,
    currency: product.currency || 'UAH',
    price_note: Number(product.price) ? '' : 'Ціну уточнюйте',
    availability: product.availability,
    stock: null,
    power_w: numericPower(product.power, 'w'),
    power_kw: numericPower(product.power, 'kw'),
    bifacial: product.category === 'Двосторонні панелі',
    featured: false,
    image_url: product.image,
    image: product.image,
    gallery: product.gallery || null,
    datasheet_url: product.datasheet,
    datasheet: product.datasheet,
    specifications: product.specs,
    specs: product.specs,
    source_page: product.page,
    page: product.page,
    seo_title: product.name ? `${product.name} | METON` : null,
    seo_description: product.description,
    sort: 100,
    status: product.active === 'Так' && product.publication !== 'Не публікувати' ? 'published' : 'draft',
    category: category ? category[categoryPrimaryField] : undefined
  };

  return Object.fromEntries(Object.entries(candidates).filter(([field, value]) =>
    productFields.has(field) && value !== undefined
  ));
}

function findExisting(product) {
  return existing.find((item) =>
    (product.page && [item.source_page, item.page].includes(product.page)) ||
    [item.slug, item.sku].some((value) => value && normalized(value) === normalized(product.id)) ||
    normalized(item.name || item.title) === normalized(product.name)
  );
}

const plan = products.map((product) => {
  const current = findExisting(product);
  return {
    action: current ? 'update' : 'create',
    product,
    current,
    payload: pickPayload(product)
  };
});

const creates = plan.filter((item) => item.action === 'create');
const updates = plan.filter((item) => item.action === 'update');
console.log(`Directus currently has ${existing.length} products.`);
console.log(`Catalog has ${products.length} products: ${updates.length} updates, ${creates.length} creates.`);
if (creates.length) console.log('Missing: ' + creates.map((item) => item.product.name).join(' | '));

if (!apply) {
  console.log('Dry run only. Run again with --apply to write changes.');
  process.exit(0);
}

let completed = 0;
for (const item of plan) {
  if (item.action === 'update') {
    const id = item.current[primaryField];
    await jsonRequest(`/items/products/${encodeURIComponent(id)}`, {
      method: 'PATCH', token, body: JSON.stringify(item.payload)
    });
  } else {
    await jsonRequest('/items/products', {
      method: 'POST', token, body: JSON.stringify(item.payload)
    });
  }
  completed += 1;
  console.log(`[${completed}/${plan.length}] ${item.action}: ${item.product.name}`);
}

console.log(`Done. Directus synchronized with ${completed} catalog products.`);
