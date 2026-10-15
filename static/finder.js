(async()=>{
const f=document.getElementById('filters'),out=document.getElementById('results'),cnt=document.getElementById('count');
const [tools,meta]=await Promise.all([fetch('../data/tools.json?v=__V__').then(r=>r.json()),fetch('../data/meta.json?v=__V__').then(r=>r.json())]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
// Everyday words -> terms that exist in the data (fields, tasks, categories, keywords)
const SYN={
manager:['plan','summarize','schedule','meeting notes','organize','email','present','small-business'],boss:['plan','meeting notes','email'],
teacher:['education','teach','lesson plans','learn'],educator:['education','teach'],professor:['education','research','teach'],tutor:['learn','tutor'],
nurse:['nurse','healthcare-admin','clinical notes'],doctor:['doctor','healthcare-admin','clinical notes'],physician:['doctor','clinical notes'],clinician:['clinical notes','healthcare-admin'],scribe:['medical scribe'],clinic:['healthcare-admin'],medical:['healthcare-admin'],healthcare:['healthcare-admin'],
recruiter:['sales-marketing','email','write','meeting notes','sell'],hr:['write','email','meeting notes'],
developer:['it','code','programming'],programmer:['code','programming'],engineer:['it','code'],it:['it'],
accountant:['finance','spreadsheet','excel','data analysis'],bookkeeper:['finance','spreadsheet','excel'],
lawyer:['legal','contracts','legal research'],legal:['legal','contracts'],attorney:['legal'],paralegal:['legal'],contract:['contracts','legal'],contracts:['contracts','legal'],
student:['learn','study','research','homework','education'],parent:['learn','plan','tutor','parents'],
marketer:['sales-marketing','write','design','social media'],marketing:['sales-marketing'],salesperson:['sales-marketing','sell','crm','email'],sales:['sales-marketing','sell'],
writer:['writing-creative','write','edit','grammar'],author:['writing-creative','write'],designer:['design','image','writing-creative'],creator:['video','writing-creative','design'],
owner:['small-business','automate','plan'],entrepreneur:['small-business'],founder:['small-business'],freelancer:['small-business','write'],
email:['email','write','grammar'],emails:['email','write'],meeting:['meeting notes','transcribe','summarize'],notes:['notes','meeting notes','summarize'],
slide:['present','slides'],slides:['present','slides'],presentation:['present','slides'],deck:['present'],powerpoint:['present','powerpoint'],
spreadsheet:['spreadsheet','excel','analyze'],excel:['excel','analyze'],data:['analyze'],budget:['budget','budgeting','spreadsheet','excel','finance'],money:['money','budget','finance'],finance:['finance','spreadsheet'],accounting:['finance','spreadsheet'],
schedule:['schedule','calendar'],scheduling:['schedule','calendar'],calendar:['calendar','schedule'],
research:['research','search','papers'],images:['image','design'],image:['image','design'],picture:['image','design'],photo:['image','design'],logo:['design','image'],
video:['video'],videos:['video'],coding:['code','programming','developer'],code:['code','programming'],app:['build','code'],website:['build','website'],
support:['customer support','write','email','automate'],customer:['customer support','crm'],translation:['translate'],translate:['translate'],language:['translate'],spanish:['translate'],
podcast:['podcast','audio'],music:['music','audio'],voice:['voice','audio'],automation:['automate'],automate:['automate'],agent:['agents','automate'],agents:['agents','automate'],
summarize:['summarize'],summary:['summarize'],write:['write'],writing:['write'],essay:['write','edit'],homework:['learn','homework'],study:['study','learn'],chat:['chatbot','assistant'],
resume:['write','grammar','chatbot'],cv:['write','grammar'],cover:['write'],letter:['write','grammar'],trip:['plan','chatbot','search'],travel:['plan','chatbot','search'],vacation:['plan','chatbot'],itinerary:['plan','chatbot'],
pdf:['summarize','documents','research'],document:['documents','summarize'],documents:['documents','summarize'],paper:['papers','research'],grocery:['plan','chatbot'],groceries:['plan','chatbot'],meal:['plan','chatbot'],recipe:['chatbot','plan'],
exam:['study','learn','homework'],test:['study','learn'],quiz:['study','learn'],learn:['learn','study'],blog:['write','copywriting','blog'],social:['social media','design','write'],instagram:['social media','design'],youtube:['video','video editing'],
transcribe:['transcribe','transcription'],transcript:['transcribe','transcription'],interview:['transcribe','podcast'],dictate:['dictate','speech to text'],flyer:['flyers','design'],poster:['design','flyers'],
art:['art','image'],drawing:['art','illustration'],song:['songs','music'],tax:['finance','spreadsheet'],invoice:['finance','small-business'],chart:['charts','analyze'],graph:['charts','analyze'],
workflow:['workflow','automate'],zap:['automate'],crm:['crm'],lead:['leads','crm'],leads:['leads','crm'],ticket:['customer support','it'],helpdesk:['customer support','it'],
proofread:['proofread','grammar'],grammar:['grammar'],rewrite:['rewrite','paraphrase'],paraphrase:['paraphrase'],brainstorm:['brainstorm','chatbot'],ideas:['brainstorm','chatbot'],question:['questions','chatbot','answers'],
patient:['clinical notes','healthcare-admin'],medical:['healthcare-admin','medical scribe'],lesson:['lesson plans','teach'],classroom:['classroom','teach'],kid:['students','tutor'],kids:['students','tutor'],child:['tutor','students'],
programming:['programming','code'],python:['code','programming'],debug:['code','programming'],prototype:['prototype','build'],tasks:['tasks','plan'],todo:['tasks','plan'],project:['projects','plan'],focus:['focus time','calendar'],habit:['habits','calendar']};

const STOP=new Set('a an the to for and or of in on my me i with how do can help make create get some ai tool tools app apps best free use using want need is are it this that from by your our like good new quick quickly easy please'.split(' '));
const stem=w=>w.length>4&&/ies$/.test(w)?w.slice(0,-3)+'y':w.length>5&&/ing$/.test(w)?w.slice(0,-3):w.length>4&&/(ches|shes|xes|sses)$/.test(w)?w.slice(0,-2):w.length>3&&/s$/.test(w)&&!/ss$/.test(w)?w.slice(0,-1):w;
// Optimal string alignment distance (typos incl. swapped letters), capped
function dist(a,b,max){if(Math.abs(a.length-b.length)>max)return max+1;const d=[];for(let i=0;i<=a.length;i++){d[i]=[i];for(let j=1;j<=b.length;j++)d[i][j]=i?0:j}
 for(let i=1;i<=a.length;i++){let rowMin=99;for(let j=1;j<=b.length;j++){const c=a[i-1]===b[j-1]?0:1;let v=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+c);
  if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])v=Math.min(v,d[i-2][j-2]+1);d[i][j]=v;if(v<rowMin)rowMin=v}if(rowMin>max)return max+1}return d[a.length][b.length]}
const tolerance=w=>w.length>=8?2:w.length>=4?1:0;
const split=x=>x.toLowerCase().split(/[\s/&,()+.:;!?"']+/).filter(Boolean);
// Build a weighted word index per tool. Hyphenated words ("no-code") are kept whole so they don't count as "code".
tools.forEach(t=>{const idx=new Map();const phr=[];
 const add=(text,wt)=>{phr.push([text.toLowerCase(),wt]);split(text).forEach(w=>{if(!idx.has(w)||idx.get(w)<wt)idx.set(w,wt)})};
 add(t.name,3);t.tasks.forEach(x=>add(x,2));(t.keywords||[]).forEach(x=>add(x,2));add(t.category,2.5);
 t.fields.forEach(x=>{add(x,1.5);add(meta.fields[x]||x,1.5)});add(t.pricing_summary,.4);add(t.data_note,.3);
 t._idx=[...idx.entries()];t._phr=phr;t._name=t.name.toLowerCase()});
const SYNK=Object.keys(SYN);
const synFor=w=>{if(SYN[w])return SYN[w];const s=stem(w);if(SYN[s])return SYN[s];const tol=tolerance(w);if(!tol)return [];
 let best=null,bd=9;for(const k of SYNK){const d=dist(w,k,tol);if(d<bd){bd=d;best=k}}return bd<=tol?SYN[best]:[]};
function wordScore(t,w){const s=stem(w),tol=tolerance(w);let best=0;
 for(const [x,wt] of t._idx){let m=0;
  if(x===w)m=10;else if(stem(x)===s)m=9;
  else if(s.length>=3&&x.startsWith(s)&&x.indexOf('-')<0)m=6;else if(x.length>=4&&w.startsWith(x))m=4;
  else if(tol&&wt>=1&&x.length>=4&&dist(w,x,tol)<=tol)m=5;
  if(m*wt>best)best=m*wt}
 return best}
function phraseHit(t,term){term=term.toLowerCase();let best=0;for(const [p,wt] of t._phr){if(wt<1)continue;
 if(p===term||(' '+p+' ').indexOf(' '+term+' ')>=0||(term.indexOf(' ')<0&&split(p).some(x=>x===term||stem(x)===stem(term))))best=Math.max(best,wt)}return best}
function score(t,q){
 const raw=split(q);if(!raw.length)return 1;let qw=raw.filter(w=>!STOP.has(w));if(!qw.length)qw=raw;
 let sc=0;const phrase=qw.join(' ');
 if(t._name.indexOf(phrase)>=0)sc+=40;if(qw.length>1&&phraseHit(t,phrase))sc+=15;
 for(const w of qw){let ws=wordScore(t,w);
  let sy=[];for(const term of synFor(w)){const h=phraseHit(t,term);if(h)sy.push(4*h)}
  if(sy.length){sy.sort((a,b)=>b-a);const v=sy[0]+0.3*sy.slice(1).reduce((a,b)=>a+b,0);ws=Math.max(ws,v)}   // synonyms rank below direct matches
  sc+=ws}
 return sc}
const POPULAR=['chatgpt','claude','google-gemini','otter-ai','canva','zapier'];
const EXAMPLES=['meeting notes','teacher','make a presentation','email','budget','translate','write code','plan a trip'];
const keys=['q','use','field','task','price'];
const p=new URLSearchParams(location.search);keys.forEach(k=>{if(p.get(k))f.elements[k].value=p.get(k)});
const hue=t=>[...t.category].reduce((a,c)=>a+c.charCodeAt(0),0)*37%360;
const cardH=t=>`<article class="card"><span class="avatar" style="--h:${hue(t)}" aria-hidden="true">${esc(t.name[0])}</span><h3><a href="${t.slug}/">${esc(t.name)}</a>${t.status==='dead'?' <span class="badge warn">link may be down</span>':''}</h3>
<p class="muted">${esc(t.category)} &middot; ${t.use.join(' / ')}</p><p><span class="badge">${meta.price[t.pricing]}</span> Free tier: ${esc(t.free_tier)}</p>
<p class="muted"><strong>Data:</strong> ${esc(t.data_note)}</p></article>`;
const H=s=>`<h2 class="sec" style="grid-column:1/-1">${s}</h2>`;
const exH=()=>`<p class="muted" style="grid-column:1/-1">Try: ${EXAMPLES.map(e=>`<button type="button" class="ex" data-q="${esc(e)}">${esc(e)}</button>`).join(' ')}</p>`;
const plural=(n,w)=>`${n} ${w}${n===1?'':(/(ch|sh|s|x)$/.test(w)?'es':'s')}`;
function rank(list,q){return list.map(t=>[t,score(t,q)]).sort((a,b)=>b[1]-a[1]||POPULAR.indexOf(b[0].slug)-POPULAR.indexOf(a[0].slug))}
function split2(r){const top=r.length?r[0][1]:0;const best=r.filter(x=>x[1]>0&&x[1]>=Math.max(top*0.5,12)).map(x=>x[0]);
 const rel=r.filter(x=>x[1]>0&&best.indexOf(x[0])<0).slice(0,12).map(x=>x[0]);return [best,rel]}
function render(){
 const v=Object.fromEntries(keys.map(k=>[k,f.elements[k].value.trim()]));
 const pass=t=>(!v.use||t.use.indexOf(v.use)>=0)&&(!v.field||t.fields.indexOf(v.field)>=0)&&(!v.task||t.tasks.indexOf(v.task)>=0)&&(!v.price||t.pricing===v.price);
 const q=new URLSearchParams();keys.forEach(k=>v[k]&&q.set(k,v[k]));
 history.replaceState(null,'',location.pathname+(q.toString()?'?'+q:''));
 const filtered=tools.filter(pass);const pop=POPULAR.map(s=>tools.find(t=>t.slug===s)).filter(Boolean);
 if(!filtered.length){const near=split2(rank(tools,v.q));const show=(near[0].concat(near[1])).slice(0,9);
  cnt.textContent='Your filters exclude every tool.';
  out.innerHTML=`<div class="empty" style="grid-column:1/-1"><p><strong>No tools fit all of those filters.</strong> <button type="button" id="clearf">Clear filters</button></p></div>`+H('Nearest results')+(show.length?show:pop).map(cardH).join('');
  document.getElementById('clearf').onclick=()=>{['use','field','task','price'].forEach(k=>f.elements[k].value='');render()};return}
 if(!v.q){cnt.textContent=plural(filtered.length,'tool');out.innerHTML=filtered.map(cardH).join('');return}
 const [best,rel]=split2(rank(filtered,v.q));
 if(!best.length&&!rel.length){cnt.textContent='No exact match. Here are popular tools.';
  const fp=filtered.filter(t=>POPULAR.indexOf(t.slug)>=0);const show=(fp.length?fp:filtered).slice(0,9);
  out.innerHTML=H('No exact match — try these')+exH()+show.map(cardH).join('');return}
 cnt.textContent=best.length?`${plural(best.length,'best match')}${rel.length?`, ${rel.length} related`:''}`:`${plural(rel.length,'related tool')}`;
 out.innerHTML=(best.length?best.map(cardH).join(''):'')+(rel.length?H(best.length?'Related tools':'Related tools (closest we have)')+rel.map(cardH).join(''):'');
}
out.addEventListener('click',e=>{const b=e.target.closest('.ex');if(b){f.elements.q.value=b.dataset.q;render();f.elements.q.focus()}});
f.addEventListener('input',render);f.addEventListener('change',render);
document.getElementById('reset').onclick=()=>{f.reset();render()};render();
})();
