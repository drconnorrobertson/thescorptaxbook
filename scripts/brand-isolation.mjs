import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const repo = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const policy = JSON.parse(fs.readFileSync(path.join(repo, 'brand-link-policy.json'), 'utf8'));
const root = path.resolve(repo, process.argv[2] || policy.outputDirectory || '.');
const check = process.argv.includes('--check');
const blocked = new Set(policy.blockedDomains.map(x => x.replace(/^www\./, '').toLowerCase()));
function forbidden(value) {
  if (typeof value !== 'string') return false;
  try { return blocked.has(new URL(value).hostname.replace(/^www\./, '').toLowerCase()); }
  catch { return false; }
}
function cleanJson(value) {
  if (typeof value === 'string') return forbidden(value) ? undefined : value;
  if (Array.isArray(value)) return value.map(cleanJson).filter(x => x !== undefined);
  if (value && typeof value === 'object') {
    if (forbidden(value.url) || forbidden(value['@id'])) return undefined;
    return Object.fromEntries(Object.entries(value).map(([k,v]) => [k,cleanJson(v)]).filter(([,v]) => v !== undefined));
  }
  return value;
}
let changed = 0, removed = 0, identityViolations = 0;
function walk(dir) {
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (['.git','node_modules','.next','scripts','work','tests'].includes(entry.name)) continue;
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(file); continue; }
    if (!entry.name.endsWith('.html')) continue;
    const before = fs.readFileSync(file,'utf8');
    let after = before.replace(/<a\b([^>]*?)\bhref\s*=\s*(["'])(.*?)\2([^>]*)>([\s\S]*?)<\/a>/gi,
      (full,pre,quote,url,post,body) => {if (!forbidden(url)) return full; removed++; return body;});
    after = after.replace(/<script\b([^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,
      (full,attrs,body) => {try {const clean = cleanJson(JSON.parse(body)); if (clean === undefined) return ''; const parsed=JSON.parse(body); return JSON.stringify(clean) === JSON.stringify(parsed) ? full : `<script${attrs}>${JSON.stringify(clean).replaceAll('<','\\u003c')}</script>`;} catch {return full;}});
    if (policy.group === 'ae' && /(?:connor(?:\s|&nbsp;|&#160;)+robertson|(?:dr)?connor+robertson[.])/i.test(after)) {
      console.error(`Forbidden Dr. Connor association on AE page: ${file}`); identityViolations++;
    }
    if (after !== before) { changed++; if (!check) fs.writeFileSync(file,after); }
  }
}
walk(root);
console.log(`Brand isolation (${policy.group}): ${changed} pages ${check?'need correction':'corrected'}, ${removed} cross-group anchors ${check?'found':'removed'}.`);
if ((check && changed) || identityViolations) process.exitCode = 1;
