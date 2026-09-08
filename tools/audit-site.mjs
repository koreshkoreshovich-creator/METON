import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
const missing = [];
const schemaErrors = [];
const canonicalErrors = [];
const missingSourceImages = [];
let productSchemas = 0;

function localTarget(raw) {
  if (!raw || raw.includes('${') || /^(?:[a-z][a-z0-9+.-]*:|#|\/\/)/i.test(raw)) return null;
  const clean = decodeURIComponent(raw.split('#')[0].split('?')[0]);
  if (!clean) return null;
  return path.join(root, clean.replace(/^\//, ''));
}

const sourceFiles = fs.readdirSync(root).filter((name) => /\.(?:html|js)$/i.test(name));
for (const file of sourceFiles) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  for (const match of source.matchAll(/["']([^"']*[a-z0-9_-]+\.(?:avif|gif|jpe?g|png|svg|webp))(?:[?#][^"']*)?["']/gi)) {
    const reference = match[1];
    if (/^(?:https?:)?\/\//i.test(reference) || reference.includes('${')) continue;
    const clean = reference.replace(/^\.\//, '').replace(/^\//, '');
    const target = clean.includes('/') ? path.join(root, clean) : path.join(root, 'assets', clean);
    if (!fs.existsSync(target) && !fs.existsSync(path.join(root, clean))) {
      missingSourceImages.push(`${file} -> ${reference}`);
    }
  }
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const canonicals = [...html.matchAll(/<link\s+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/gi)];
  if (canonicals.length !== 1 || !canonicals[0][1].startsWith('https://metongroup.com/')) {
    canonicalErrors.push(`${file}: ${canonicals.length} canonical links`);
  }

  for (const match of html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Product') productSchemas += 1;
    } catch (error) {
      schemaErrors.push(`${file}: ${error.message}`);
    }
  }

  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
    const target = localTarget(match[1]);
    if (target && !fs.existsSync(target)) missing.push(`${file} -> ${match[1]}`);
  }
}

const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapUrls = [...sitemap.matchAll(/<loc>https:\/\/metongroup\.com\/(.*?)<\/loc>/g)].map((match) => match[1] || 'index.html');
const missingSitemapPages = sitemapUrls.filter((item) => !fs.existsSync(path.join(root, item || 'index.html')));

const result = {
  htmlFiles: htmlFiles.length,
  canonicalErrors,
  schemaErrors,
  productSchemas,
  sitemapUrls: sitemapUrls.length,
  missingSitemapPages,
  missingLocalResources: [...new Set(missing)].sort(),
  missingSourceImages: [...new Set(missingSourceImages)].sort(),
  missingCartJsReference: htmlFiles.some((file) => fs.readFileSync(path.join(root, file), 'utf8').includes('cart.js'))
};

console.log(JSON.stringify(result, null, 2));
if (canonicalErrors.length || schemaErrors.length || missingSitemapPages.length || missing.length || missingSourceImages.length || result.missingCartJsReference) process.exitCode = 1;
