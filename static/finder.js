(async()=>{
const f=document.getElementById('filters'),out=document.getElementById('results'),cnt=document.getElementById('count');
const [tools,meta]=await Promise.all([fetch('../data/tools.json').then(r=>r.json()),fetch('../data/meta.json').then(r=>r.json())]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hay=t=>[t.name,t.category,t.tasks.join(' '),t.fields.map(x=>meta.fields[x]).join(' '),t.pricing_summary].join(' ').toLowerCase();
tools.forEach(t=>t._h=hay(t));
const keys=['q','use','field','task','price'];
const p=new URLSearchParams(location.search);keys.forEach(k=>{if(p.get(k))f.elements[k].value=p.get(k)});
function render(){
 const v=Object.fromEntries(keys.map(k=>[k,f.elements[k].value.trim()]));
 const words=v.q.toLowerCase().split(/\s+/).filter(Boolean);
 const r=tools.filter(t=>words.every(w=>t._h.includes(w))&&(!v.use||t.use.includes(v.use))&&(!v.field||t.fields.includes(v.field))&&(!v.task||t.tasks.includes(v.task))&&(!v.price||t.pricing===v.price));
 const q=new URLSearchParams();keys.forEach(k=>v[k]&&q.set(k,v[k]));
 history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''));
 cnt.textContent=`${r.length} of ${tools.length} tools`;
 out.innerHTML=r.map(t=>`<article class="card"><span class="avatar" style="--h:${[...t.category].reduce((a,c)=>a+c.charCodeAt(0),0)*37%360}" aria-hidden="true">${esc(t.name[0])}</span><h3><a href="${t.slug}/">${esc(t.name)}</a>${t.status==='dead'?' <span class="badge warn">link may be down</span>':''}</h3>
<p class="muted">${esc(t.category)} &middot; ${t.use.join(' / ')}</p><p><span class="badge">${meta.price[t.pricing]}</span> Free tier: ${esc(t.free_tier)}</p>
<p class="muted"><strong>Data:</strong> ${esc(t.data_note)}</p></article>`).join('')||'<p>No tools match. Try removing a filter.</p>';
}
f.addEventListener('input',render);f.addEventListener('change',render);
document.getElementById('reset').onclick=()=>{f.reset();render()};render();
})();
