import fs from 'node:fs';

const htmlFiles = fs.readdirSync('.').filter((file) => file.endsWith('.html'));
const styles = fs.readFileSync('styles.css', 'utf8');
const failures = [];
const detailPages = [];

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');
  if (!html.includes('class="detail')) continue;
  detailPages.push(file);
  if (!/<meta name="viewport"[^>]*width=device-width/i.test(html)) failures.push(`${file}: немає viewport`);
  if (!html.includes('styles.css?v=20260806-4')) failures.push(`${file}: застаріла версія CSS`);

  for (const tag of ['strong', 'article', 'section']) {
    const opened = (html.match(new RegExp(`<${tag}\\b`, 'gi')) || []).length;
    const closed = (html.match(new RegExp(`</${tag}>`, 'gi')) || []).length;
    if (opened !== closed) failures.push(`${file}: незбалансований <${tag}> (${opened}/${closed})`);
  }
}

const requiredGuards = [
  '.detail article{min-width:0;font-size:16px!important',
  '.detail h1{font-size:clamp(30px,3.4vw,48px)!important',
  '.detail .spec-list li,',
  'font-size:16px!important;line-height:1.5!important',
  '@media(max-width:900px)',
  '@media(max-width:640px)'
];
for (const guard of requiredGuards) {
  if (!styles.includes(guard)) failures.push(`styles.css: немає захисту «${guard}»`);
}

console.log(`Перевірено масштабування ${detailPages.length} detail-сторінок і ${htmlFiles.length} HTML-файлів.`);
if (failures.length) {
  console.error(`Знайдено ${failures.length} проблем:\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('Viewport, кеш-версія CSS, баланс тегів і адаптивні обмеження — без помилок.');
