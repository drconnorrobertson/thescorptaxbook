const fs = require('fs');
const path = require('path');
const root = process.argv[2] || '.';
const config = require('./contextual-crosslinks.json');
const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
for (const item of config) {
  const file = path.join(root, item.file);
  let html = fs.readFileSync(file, 'utf8');
  html = html.replace(/<!-- contextual-crosslink:start -->[\s\S]*?<!-- contextual-crosslink:end -->/g, '');
  const marker = item.insertBefore || '</main>';
  if (html.indexOf(marker) < 0) throw new Error('Missing content insertion point: ' + file);
  const block = '<!-- contextual-crosslink:start --><section class="section" aria-label="Related reading"><div class="container wrap article" style="max-width:820px;margin:2rem auto;padding:1.5rem;line-height:1.7"><h2>' + esc(item.heading) + '</h2><p>' + esc(item.before) + '<a href="' + esc(item.url) + '">' + esc(item.anchor) + '</a>' + esc(item.after) + '</p></div></section><!-- contextual-crosslink:end -->';
  fs.writeFileSync(file, html.replace(marker, block + marker));
  console.log('Contextual link: ' + item.file + ' -> ' + item.url);
}
