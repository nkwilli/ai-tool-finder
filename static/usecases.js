(async()=>{
const [uc,tools,meta]=await Promise.all(['usecases','tools','meta'].map(n=>fetch(`../data/${n}.json?v=__V__`).then(r=>r.json())));
const by={};tools.forEach(t=>by[t.slug]=t);const sel=document.getElementById('ucfield');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const label=x=>x==='other'?'Other / general':(meta.fields[x]||x);
const p=new URLSearchParams(location.search);const want=p.get('show')||p.get('field');
if(want&&[...sel.options].some(o=>o.value===want))sel.value=want;
const match=(u,f)=>!f||(f==='personal'?u.section==='Personal':u.fields.indexOf(f)>=0);
function render(){const f=sel.value;history.replaceState(null,'',location.pathname+(f?'?show='+encodeURIComponent(f):'')+location.hash);
 for(const s of ['Personal','Work']){const list=uc.filter(u=>u.section===s&&match(u,f));const box=document.getElementById('uc-'+s.toLowerCase());
  const h=document.getElementById(s.toLowerCase());const hide=!!f&&!list.length;box.hidden=hide;if(h)h.hidden=hide;
  box.innerHTML=list.map(u=>`<article class="card" id="${u.id}"><h3>${esc(u.title)}</h3>
<p>${esc(u.steps)}</p><p><strong>Watch out:</strong> ${esc(u.watch_out)}</p>
<p class="muted">Tools: ${u.tools.filter(t=>by[t]).map(t=>`<a href="../tools/${t}/">${esc(by[t].name)}</a>`).join(', ')}${u.fields.length?' &middot; Fields: '+u.fields.map(label).join(', '):''}</p>
<p class="muted">Draft, needs human review</p></article>`).join('')||'<p class="muted">None here yet.</p>';}}
sel.addEventListener('change',render);render();})();
