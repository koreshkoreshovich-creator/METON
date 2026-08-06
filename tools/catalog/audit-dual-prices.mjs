import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(import.meta.dirname, '../..');
const htmlFiles = fs.readdirSync(root).filter((file) => file.endsWith('.html'));
const failures = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const count = (html.match(/dual-price\.js\?v=20260806-1/g) || []).length;
  if (count !== 1) failures.push(`${file}: dual-price.js підключено ${count} разів`);
  if (/`r`n/.test(html)) failures.push(`${file}: знайдено буквальні маркери переносу рядка`);
}

class Element {
  constructor(text = '') {
    this.textContent = text;
    this.children = [];
    this.dataset = {};
    this.className = '';
  }
  matches() { return true; }
  querySelector(selector) {
    if (selector === '.price-usd-small') {
      return this.children.find((child) => child.className === 'price-usd-small') || null;
    }
    return null;
  }
  querySelectorAll() { return []; }
  append(...nodes) { this.children.push(...nodes); }
  appendChild(node) { this.children.push(node); }
}

function renderPrice(input) {
  const target = new Element(input);
  const document = {
    readyState: 'complete',
    body: {},
    querySelectorAll: () => [target],
    createElement: () => new Element(),
    addEventListener() {},
  };
  class MutationObserver { observe() {} }
  const code = fs.readFileSync(path.join(root, 'dual-price.js'), 'utf8');
  vm.runInNewContext(code, { document, MutationObserver });
  return {
    main: target.children[0]?.textContent || target.textContent,
    usd: target.children[1]?.textContent || '',
  };
}

const cases = [
  ['1 550 $', '69 564 грн', '1 550 $'],
  ['4 917 грн', '4 917 грн', '109,56 $'],
  ['від 1 200–1 500 грн', 'від 1 200–1 500 грн', 'від 26,74–33,42 $'],
];

for (const [input, expectedMain, expectedUsd] of cases) {
  const result = renderPrice(input);
  const normalize = (value) => value.normalize('NFC').replace(/\s/g, ' ').replace(/[\u2013\u2014]/g, '-');
  const main = normalize(result.main);
  const usd = normalize(result.usd);
  if (main !== normalize(expectedMain) || usd !== normalize(expectedUsd)) {
    failures.push(`${input}: ${JSON.stringify(main)} != ${JSON.stringify(normalize(expectedMain))}; ${JSON.stringify(usd)} != ${JSON.stringify(normalize(expectedUsd))}`);
  }
}

const unchanged = renderPrice('Ціну уточнюйте');
if (unchanged.main !== 'Ціну уточнюйте' || unchanged.usd) {
  failures.push('Текст «Ціну уточнюйте» не повинен конвертуватися');
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`OK: ${htmlFiles.length} HTML-сторінок, подвійні ціни та курс 44,88 перевірено.`);
