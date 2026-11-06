const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const repo=path.resolve(__dirname,'..');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'buyer-metadata-'));
const canonical='https://example.com/';
const title='Owner pay & elections <guide>';
const description='Compare "salary" & distributions </script> safely.';
const other={'@type':'WebPage',url:'https://example.com/other',name:'Other page',description:'Keep me'};
const publisher={'@type':'Organization',name:'AE Tax Advisors',description:'Publisher description'};
const webpage=()=>({'@type':'WebPage',url:canonical,name:'Old',description:'Old description',publisher});
const schema=html=>[...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>JSON.parse(m[1]));
try{
 fs.copyFileSync(path.join(repo,'scripts/buyer-intent-release.cjs'),path.join(temp,'buyer-intent-release.cjs'));
 fs.writeFileSync(path.join(temp,'buyer-intent-pages.json'),JSON.stringify({'index.html':{title,description,heading:'Next step',body:'<p>Read the guide.</p>'}}));
 const fixtures=[webpage(),{'@context':'https://schema.org','@graph':[webpage(),other,publisher]},[webpage(),other],{'@type':['CreativeWork','WebPage'],'@id':canonical+'#webpage',name:'Old'}];
 for(const data of fixtures){
  fs.writeFileSync(path.join(temp,'index.html'),'<html><head><title>Old</title><link href="'+canonical+'" rel="canonical"><script type="application/ld+json">'+JSON.stringify(data)+'</script></head><body><main><h1>Owner pay</h1></main></body></html>');
  execFileSync(process.execPath,[path.join(temp,'buyer-intent-release.cjs'),temp]);
  const first=fs.readFileSync(path.join(temp,'index.html'),'utf8');
  const output=schema(first)[0];
  const nodes=Array.isArray(output)?output:output['@graph']||[output];
  const page=nodes.find(n=>n.url===canonical||n['@id']===canonical+'#webpage');
  assert.equal(page.name,title);assert.equal(page.description,description);
  if(page.publisher)assert.deepEqual(page.publisher,publisher);
  if(nodes.some(n=>n.url===other.url))assert.deepEqual(nodes.find(n=>n.url===other.url),other);
  assert(first.includes('<title>Owner pay &amp; elections &lt;guide&gt;</title>'));
  assert(!first.includes('</script> safely.'));
  execFileSync(process.execPath,[path.join(temp,'buyer-intent-release.cjs'),temp]);
  assert.equal(fs.readFileSync(path.join(temp,'index.html'),'utf8'),first,'Transform must be idempotent');
 }
 console.log('PASS: page metadata sync, graph/array/@id handling, publisher preservation, escaping and idempotence');
}finally{fs.rmSync(temp,{recursive:true,force:true});}
