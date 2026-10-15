(async()=>{
const [uc,tools,meta]=await Promise.all(['usecases','tools','meta'].map(n=>fetch(`../data/${n}.json?v=__V__`).then(r=>r.json())));
const by=Object.fromEntries(tools.map(t=>[t.slug,t]));const sel=document.getElementById('ucfield');
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const p=new URLSearchParams(location.search);if(p.get('field'))sel.value=p.get('field');
function render(){const f=sel.value;history.replaceState(null,'',location.pathname+(f?'?field='+f:'')+location.hash);
 for(const s of ['Personal','Work']){const list=uc.filter(u=>u.section===s&&(!f||u.fields.length===0||u.fields.includes(f)));
  document.getElementById('uc-'+s.toLowerCase()).innerHTML=list.map(u=>`<article class="card" id="${u.id}"><h3>${esc(u.title)}</h3>
<p>${esc(u.steps)}</p><p><strong>Watch out:</strong> ${esc(u.watch_out)}</p>
<p class="muted">Tools: ${u.tools.filter(t=>by[t]).map(t=>`<a href="../tools/${t}/">${esc(by[t].name)}</a>`).join(', ')}${u.fields.length?' &middot; Fields: '+u.fields.map(x=>meta.fields[x]).join(', '):''}</p>
<p class="muted">Draft, needs human review</p></article>`).join('')||'<p class="muted">None for this field yet.</p>';}}
sel.addEventListener('change',render);render();})();
