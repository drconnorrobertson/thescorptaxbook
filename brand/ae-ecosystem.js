(()=>{
const b=document.querySelector('.ae-mobile'),n=document.querySelector('.ae-menu');
if(b&&n)b.addEventListener('click',()=>{const open=n.classList.toggle('is-open');b.setAttribute('aria-expanded',String(open));b.textContent=open?'Close':'Menu'});
const q=document.querySelector('[data-library-search]'),s=document.querySelector('[data-library-category]'),items=[...document.querySelectorAll('[data-library-item]')],count=document.querySelector('[data-library-count]');
if(!q||!s||!items.length)return;
const list=items[0].parentElement;list.id='ae-library-items';q.setAttribute('aria-controls',list.id);s.setAttribute('aria-controls',list.id);
const clear=document.createElement('button');clear.type='button';clear.className='ae-library-clear';clear.textContent='Clear filters';clear.hidden=true;clear.dataset.libraryClear='';document.querySelector('.ae-filters').append(clear);
const empty=document.createElement('p');empty.className='ae-library-empty';empty.textContent='No resources match these filters. Try fewer words, choose another collection, or clear the filters to browse everything.';empty.hidden=true;empty.dataset.libraryEmpty='';list.before(empty);
const text=items.map(el=>el.textContent.toLocaleLowerCase());
function restore(){const p=new URLSearchParams(location.search);q.value=(p.get('q')||'').slice(0,240);const category=(p.get('collection')||'').slice(0,80);s.value=[...s.options].some(o=>o.value===category)?category:''}
function filter(updateUrl=true){const words=q.value.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);let total=0;items.forEach((el,i)=>{const show=words.every(w=>text[i].includes(w))&&(!s.value||el.dataset.category===s.value);el.hidden=!show;if(show)total++});if(count)count.textContent=total+' of '+items.length+' resources match your selection.';empty.hidden=total!==0;clear.hidden=!q.value&&!s.value;if(updateUrl){const u=new URL(location.href);const query=q.value.trim().slice(0,240);query?u.searchParams.set('q',query):u.searchParams.delete('q');s.value?u.searchParams.set('collection',s.value):u.searchParams.delete('collection');history.replaceState(null,'',u.pathname+u.search+u.hash)}}
q.addEventListener('input',()=>filter());s.addEventListener('change',()=>filter());clear.addEventListener('click',()=>{q.value='';s.value='';filter();q.focus()});window.addEventListener('popstate',()=>{restore();filter(false)});restore();filter(false);
})();
