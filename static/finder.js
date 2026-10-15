(async()=>{
const f=document.getElementById('filters'),out=document.getElementById('results'),cnt=document.getElementById('count');
const [tools,meta]=await Promise.all([fetch('../data/tools.json').then(r=>r.json()),fetch('../data/meta.json').then(r=>r.json())]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Everyday words -> terms that exist in the data (fields, tasks, categories, keywords)
const SYN={
manager:['plan','summarize','schedule','meeting notes','organize','email','present','small-business'],boss:['plan','meeting notes','email'],
teacher:['education','teach','lesson plans','learn'],educator:['education','teach'],professor:['education','research','teach'],tutor:['learn','tutor'],
nurse:['healthcare-admin','research','write','transcribe'],doctor:['healthcare-admin','research','transcribe'],clinic:['healthcare-admin'],medical:['healthcare-admin'],healthcare:['healthcare-admin'],
recruiter:['sales-marketing','email','write','meeting notes','sell'],hr:['write','email','meeting notes'],
developer:['it','code','programming'],programmer:['code','programming'],engineer:['it','code'],it:['it'],
accountant:['analyze','spreadsheet','excel','small-business'],bookkeeper:['spreadsheet','excel','small-business'],
lawyer:['research','write','summarize','documents'],legal:['research','summarize','documents'],
student:['learn','study','research','homework','education'],parent:['learn','plan','tutor','parents'],
marketer:['sales-marketing','write','design','social media'],marketing:['sales-marketing'],salesperson:['sales-marketing','sell','crm','email'],sales:['sales-marketing','sell'],
writer:['writing-creative','write','edit','grammar'],author:['writing-creative','write'],designer:['design','image','writing-creative'],creator:['video','writing-creative','design'],
owner:['small-business','automate','plan'],entrepreneur:['small-business'],founder:['small-business'],freelancer:['small-business','write'],
email:['email','write','grammar'],emails:['email','write'],meeting:['meeting notes','transcribe','summarize'],notes:['notes','meeting notes','summarize'],
slide:['present','slides'],slides:['present','slides'],presentation:['present','slides'],deck:['present'],powerpoint:['present','powerpoint'],
spreadsheet:['spreadsheet','excel','analyze'],excel:['excel','analyze'],data:['analyze'],budget:['spreadsheet','analyze','plan','excel'],money:['analyze','plan'],finance:['analyze','spreadsheet'],
schedule:['schedule','calendar'],scheduling:['schedule','calendar'],calendar:['calendar','schedule'],
research:['research','search','papers'],images:['image','design'],image:['image','design'],picture:['image','design'],photo:['image','design'],logo:['design','image'],
video:['video'],videos:['video'],coding:['code','programming'],code:['code'],app:['build','code'],website:['build','website'],
support:['customer support','write','email','automate'],customer:['customer support','crm'],translation:['translate'],translate:['translate'],language:['translate'],spanish:['translate'],
podcast:['podcast','audio'],music:['music','audio'],voice:['voice','audio'],automation:['automate'],automate:['automate'],agent:['agents','automate'],agents:['agents','automate'],
summarize:['summarize'],summary:['summarize'],write:['write'],writing:['write'],essay:['write','edit'],homework:['learn','homework'],study:['study','learn'],chat:['chatbot','assistant']};
const STOP=new Set('a an the to for and or of in on my me i with how do can help make create get some ai tool tools app best free use using want need'.split(' '));
const stem=w=>w.length>4&&w.endsWith('ies')?w.slice(0,-3)+'y':w.length>4&&w.endsWith('ing')?w.slice(0,-3):w.length>3&&w.endsWith('es')&&!w.endsWith('ses')?w.slice(0,-2):w.length>3&&w.endsWith('s')&&!w.endsWith('ss')?w.slice(0,-1):w;
tools.forEach(t=>{t._name=t.name.toLowerCase();t._terms=[...t.tasks,...t.fields,...t.fields.map(x=>meta.fields[x].toLowerCase()),t.category.toLowerCase(),...(t.keywords||[]).map(k=>k.toLowerCase())];t._all=[t._name,...t._terms,t.pricing_summary.toLowerCase()].join(' | ')});
const hit=(t,term)=>{const s=stem(term);return t._terms.some(x=>x===term||x.includes(term)||(s.length>=3&&x.split(/[\s/&-]+/).some(w=>w.startsWith(s))))};
function score(t,q){
 const raw=q.toLowerCase().split(/[^a-z0-9+#.-]+/).filter(Boolean);
 const words=raw.filter(w=>!STOP.has(w));if(!words.length)return raw.length?0:1;
 let sc=0;const phrase=words.join(' ');if(t._name.includes(phrase))sc+=50;if(t._terms.some(x=>x.includes(phrase)))sc+=20;
 for(const w of words){const s=stem(w);let ws=0;
  if(t._name.startsWith(w)||t._name.includes(w))ws=Math.max(ws,30);
  if(hit(t,w))ws=Math.max(ws,12);
  for(const syn of (SYN[w]||SYN[s]||[]))if(hit(t,syn))ws=Math.max(ws,8)+1;
  if(!ws&&s.length>=3&&t._all.includes(s))ws=3;
  sc+=ws;}
 return sc;}
const POPULAR=['chatgpt','claude','google-gemini','otter-ai','canva','zapier'];
const EXAMPLES=['meeting notes','teacher','make a presentation','email','budget','translation','coding','small business'];
const keys=['q','use','field','task','price'];
const p=new URLSearchParams(location.search);keys.forEach(k=>{if(p.get(k))f.elements[k].value=p.get(k)});
const hue=t=>[...t.category].reduce((a,c)=>a+c.charCodeAt(0),0)*37%360;
const cardH=t=>`<article class="card"><span class="avatar" style="--h:${hue(t)}" aria-hidden="true">${esc(t.name[0])}</span><h3><a href="${t.slug}/">${esc(t.name)}</a>${t.status==='dead'?' <span class="badge warn">link may be down</span>':''}</h3>
<p class="muted">${esc(t.category)} &middot; ${t.use.join(' / ')}</p><p><span class="badge">${meta.price[t.pricing]}</span> Free tier: ${esc(t.free_tier)}</p>
<p class="muted"><strong>Data:</strong> ${esc(t.data_note)}</p></article>`;
const exH=()=>`<p class="muted">Try: ${EXAMPLES.map(e=>`<button type="button" class="ex" data-q="${esc(e)}">${esc(e)}</button>`).join(' ')}</p>`;
function render(){
 const v=Object.fromEntries(keys.map(k=>[k,f.elements[k].value.trim()]));
 const pass=t=>(!v.use||t.use.includes(v.use))&&(!v.field||t.fields.includes(v.field))&&(!v.task||t.tasks.includes(v.task))&&(!v.price||t.pricing===v.price);
 const ranked=tools.map(t=>[t,score(t,v.q)]).filter(([t,s])=>s>0&&pass(t)).sort((a,b)=>b[1]-a[1]).map(x=>x[0]);
 const q=new URLSearchParams();keys.forEach(k=>v[k]&&q.set(k,v[k]));
 history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''));
 if(ranked.length){cnt.textContent=`${ranked.length} of ${tools.length} tools${v.q?' (best matches first)':''}`;out.innerHTML=ranked.map(cardH).join('')+(v.q?'':'');return}
 // never a dead end: closest matches ignoring filters, else popular
 let close=tools.map(t=>[t,score(t,v.q)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]).slice(0,6).map(x=>x[0]);
 const pop=POPULAR.map(s=>tools.find(t=>t.slug===s)).filter(Boolean);
 cnt.textContent='No exact matches.';
 out.innerHTML=`<div class="empty" style="grid-column:1/-1"><p><strong>No tools match all of that.</strong> Try fewer words or remove a filter.</p>${exH()}</div>`+
  (close.length?`<h2 style="grid-column:1/-1">Closest matches</h2>`+close.map(cardH).join(''):'')+
  `<h2 style="grid-column:1/-1">Popular tools</h2>`+pop.map(cardH).join('');
}
out.addEventListener('click',e=>{const b=e.target.closest('.ex');if(b){f.elements.q.value=b.dataset.q;f.reset&&0;render();f.elements.q.focus()}});
f.addEventListener('input',render);f.addEventListener('change',render);
document.getElementById('reset').onclick=()=>{f.reset();render()};render();
})();
