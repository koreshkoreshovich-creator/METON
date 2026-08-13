import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
let updated = 0;

for (const file of fs.readdirSync(root).filter((name) => name.endsWith('.html'))) {
  const fullPath = path.join(root, file);
  let html = fs.readFileSync(fullPath, 'utf8');
  if (/src=["']site-social\.js["']/i.test(html)) continue;
  const tag = '  <script src="site-social.js" defer></script>\n';
  html = html.replace(/<\/body>/i, `${tag}</body>`);
  fs.writeFileSync(fullPath, html, 'utf8');
  updated += 1;
}

console.log(`Added shared navigation behavior to ${updated} pages.`);
