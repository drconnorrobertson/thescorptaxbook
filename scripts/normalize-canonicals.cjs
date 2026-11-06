// Match the existing Vercel trailingSlash:false routes without changing content.
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const root=process.argv[2]||'dist';
const config=require('../vercel.json');
assert.equal(config.trailingSlash,false,'Normalizer is only valid for slashless routes');
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
console.log('Canonical route normalization: '+count+' files updated; four routes verified.');
