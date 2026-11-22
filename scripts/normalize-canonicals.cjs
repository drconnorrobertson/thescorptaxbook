// Match slashless canonical routes; explicit topic redirects precede the slash fallback.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=process.argv[2]||'dist';
const config=require('../vercel.json');
assert.equal(config.cleanUrls,false,'Implicit clean-URL redirects must not precede retired-file redirects');
assert.equal(config.trailingSlash,undefined,'Built-in slash normalization must not precede topic redirects');
const slashFallback=config.redirects.at(-1);
assert.deepEqual(slashFallback,{source:'/:path([^/].*)/',destination:'/:path',permanent:true},'Slash removal must be the final explicit redirect');
const site=require('../brand/site.json');
const routes=['consultation-preparation','library','ecosystem','editorial-standards'];
const origin='https://'+site.domain;
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
let count=0;
for(const file of files(root).filter(f=>/\.(html|xml)$/.test(f))){
 let s=fs.readFileSync(file,'utf8'),original=s;
 for(const route of routes){
  const absolute=origin+'/'+route;
  s=s.replace(new RegExp(absolute.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'/(?=[\"\'#<])','g'),absolute);
  s=s.replace(new RegExp('(href=["\'])/'+route+'/(?=["\'#])','g'),'$1/'+route);
 }
 if(s!==original){fs.writeFileSync(file,s);count++;}
}
// Fail the build if any canonical or sitemap entry still targets a redirect.
for(const route of routes){
 const html=fs.readFileSync(path.join(root,route,'index.html'),'utf8');
 assert(html.includes('rel="canonical" href="'+origin+'/'+route+'"'),route+' canonical does not match its live route');
 const xml=fs.readFileSync(path.join(root,'sitemap.xml'),'utf8');
 assert(xml.includes('<loc>'+origin+'/'+route+'</loc>'),route+' missing normalized sitemap entry');
 assert(!xml.includes('<loc>'+origin+'/'+route+'/</loc>'),route+' retains redirected sitemap entry');
}

// Every declared owner must have a concrete static rewrite after the redirect phase.
const owners=[...fs.readFileSync(path.join(root,'sitemap.xml'),'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
for(const owner of owners){
 const route=new URL(owner).pathname;
 const matches=(config.rewrites||[]).filter(r=>r.source===route);
 assert.equal(matches.length,1,'Missing or ambiguous owner rewrite: '+route);
 const file=path.resolve(root,matches[0].destination.replace(/^\//,''));
 assert(file.startsWith(path.resolve(root)+path.sep),'Rewrite escaped publish directory');
 assert(fs.existsSync(file)&&fs.statSync(file).isFile(),'Missing rewrite file: '+route);
 const tag=fs.readFileSync(file,'utf8').match(/<link\b[^>]*rel=["']canonical["'][^>]*>/i);
 const canonical=tag&&tag[0].match(/href=["']([^"']+)["']/i);
 assert(canonical&&canonical[1]===owner,'Rewrite points to a different canonical owner: '+route);
}

console.log('Canonical route normalization: '+count+' files updated; four routes verified.');
