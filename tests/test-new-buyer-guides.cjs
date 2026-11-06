const fs=require('fs'),assert=require('assert/strict'),path=require('path');
const guides=require('../scripts/new-buyer-guides.json');
for(const root of ['.','dist'])for(const g of guides){
 const route='/resources/'+g.slug,u='https://www.thescorptaxbook.com'+route;
 const s=fs.readFileSync(path.join(root,route,'index.html'),'utf8');
 assert.equal((s.match(/<h1\b/gi)||[]).length,1);
 assert(s.includes('rel="canonical" href="'+u+'"'));
 assert(!/noindex/i.test(s));
 assert(s.includes(g.title));assert(s.includes('https://www.aetaxadvisors.com/discovery/'));
 for(const m of s.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi))JSON.parse(m[1]);
 for(const m of s.matchAll(/href="(\/[^"#?]*)/g)){const p=path.join(root,m[1]);assert(fs.existsSync(p)||fs.existsSync(p+'.html')||fs.existsSync(path.join(p,'index.html')),m[1]);}
 assert(fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').includes('<loc>'+u+'</loc>'));
 for(const hub of ['resources/index.html','reading-guides/index.html'])assert(fs.readFileSync(path.join(root,hub),'utf8').includes('href="'+route+'"'));
}
console.log('Two buyer guides: canonical, H1, schema, sitemap, conversion path and internal links pass.');
