const fs=require('node:fs'),path=require('node:path'),{execSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..'),config=require('./seo-focus.json');
if(!process.argv.includes('--apply-only'))execSync(config.buildCommand,{cwd:repo,stdio:'inherit'});
const root=process.argv.includes('--source')?repo:path.join(repo,config.outputDirectory);
const file=path.join(root,'index.html');let s=fs.readFileSync(file,'utf8');
const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
s=s.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(config.title)+'</title>');
for(const [key,value] of Object.entries({'description':config.description,'og:title':config.title,'og:description':config.description,'twitter:title':config.title,'twitter:description':config.description})){
 let found=false;s=s.replace(/<meta\b[^>]*>/gi,tag=>{const name=tag.match(/(?:name|property)\s*=\s*["']([^"']+)["']/i);if(!name||name[1].toLowerCase()!==key)return tag;found=true;return tag.replace(/content\s*=\s*(["'])[\s\S]*?\1/i,'content="'+esc(value)+'"');});
 if(!found)s=s.replace(/<\/head>/i,'<meta '+(key.startsWith('og:')?'property':'name')+'="'+key+'" content="'+esc(value)+'">\n</head>');
}
s=s.replace(/<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,(tag,attrs,body)=>{const data=JSON.parse(body);function visit(v){if(Array.isArray(v))v.forEach(visit);else if(v&&typeof v==='object'){const types=[v['@type']].flat();if(types.some(t=>['WebPage','CollectionPage'].includes(t))){v.name=config.title;v.description=config.description;}Object.values(v).forEach(visit);}}visit(data);return '<script'+attrs+'>'+JSON.stringify(data).replace(/</g,'\\u003c')+'</script>';});
s=s.replace(/<!-- seo-focus:start -->[\s\S]*?<!-- seo-focus:end -->/g,'');
const block='<!-- seo-focus:start --><section aria-labelledby="seo-focus-title" style="max-width:1120px;margin:32px auto;padding:24px;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:12px"><h2 id="seo-focus-title">'+esc(config.heading)+'</h2><p>'+esc(config.intro)+'</p><nav aria-label="Recommended reading"><ul>'+config.links.map(l=>'<li style="margin:12px 0"><a href="'+esc(l.href)+'">'+esc(l.label)+'</a></li>').join('')+'</ul></nav></section><!-- seo-focus:end -->';
if(!/<\/section>/i.test(s))throw Error('Missing homepage section');
s=s.replace(/<\/section>/i,'</section>'+block);
if((s.match(/seo-focus:start/g)||[]).length!==1)throw Error('Duplicate reading path');
if((s.match(/<h1(?:\s|>)/gi)||[]).length!==1)throw Error('Homepage needs one H1');
for(const link of config.links){
 const target=path.join(root,link.href.replace(/^\//,''),'index.html');
 if(!fs.existsSync(target))throw Error('Missing reading destination: '+link.href);
 const html=fs.readFileSync(target,'utf8');
 if(/<meta[^>]*content=["'][^"']*noindex/i.test(html))throw Error('Reading destination is noindex: '+link.href);
}
fs.writeFileSync(file,s);console.log('SEO focus applied: '+file);
