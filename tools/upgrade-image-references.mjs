import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const replacements = new Map([
  ['battery-solax-hv11550.webp', 'battery-solax-hv11550-hq.webp'],
  ['battery-solax-t-bat-h-27.webp', 'battery-solax-t-bat-h-27-hq.webp'],
  ['battery-solax-t-bat-h-30.webp', 'battery-solax-t-bat-h-30-hq.webp'],
  ['battery-solax-t-bat-hs36.webp', 'battery-solax-t-bat-hs36-hq.webp'],
  ['battery-solax-lv-d53.webp', 'battery-solax-lv-d53-hq.webp'],
  ['battery-solax-t-hs51.webp', 'battery-solax-t-hs51-hq.webp'],
  ['battery-solax-tp-hs50e.webp', 'battery-solax-tp-hs50e-hq.webp'],
  ['solax-x1-boost-g4.webp', 'solax-x1-boost-g4-hq.webp'],
  ['solax-x1-hybrid-g4.webp', 'solax-x1-hybrid-g4-hq.webp'],
  ['solax-x3-hybrid-g4.webp', 'solax-x3-hybrid-g4-hq.webp'],
  ['solax-x3-mega-g2.webp', 'solax-x3-mega-g2-hq.webp'],
  ['solax-x3-mic-g2.webp', 'solax-x3-mic-g2-hq.webp'],
  ['solax-x3-pro-g2.webp', 'solax-x3-pro-g2-hq.webp'],
  ['solax-x3-ultra.webp', 'solax-x3-ultra-hq.webp']
]);

const eligible = new Set(['.html', '.json', '.js']);
let filesChanged = 0;
let referencesChanged = 0;

for (const file of fs.readdirSync(root)) {
  if (!eligible.has(path.extname(file))) continue;
  const fullPath = path.join(root, file);
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  for (const [oldName, newName] of replacements) {
    if (!content.includes(oldName)) continue;
    const matches = content.split(oldName).length - 1;
    content = content.split(oldName).join(newName);
    referencesChanged += matches;
    changed = true;
  }
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    filesChanged += 1;
  }
}

console.log(`Upgraded ${referencesChanged} low-resolution image references in ${filesChanged} files.`);
