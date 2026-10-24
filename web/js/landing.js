const DASH_URL='dashboard/index.html';
const app=document.getElementById('app'),df=document.getElementById('df');
function openDash(push){if(!df.getAttribute('src'))df.src=DASH_URL;app.classList.add('on');document.body.style.overflow='hidden';try{if(push!==false&&location.hash!=='#dashboard')location.hash='dashboard'}catch(_){}}
function closeDash(){app.classList.remove('on');document.body.style.overflow='';if(location.hash==='#dashboard')history.back()}
document.querySelectorAll('[data-dash]').forEach(a=>{a.href='#dashboard';a.removeAttribute('target');a.addEventListener('click',e=>{e.preventDefault();openDash()})});
addEventListener('hashchange',()=>{location.hash==='#dashboard'?openDash(false):(app.classList.remove('on'),document.body.style.overflow='')});
if(location.hash==='#dashboard')openDash(false);
addEventListener('keydown',e=>{if(e.key==='Escape'&&app.classList.contains('on'))closeDash()});
addEventListener('message',async e=>{if(e.source!==df.contentWindow)return;const m=e.data;if(m==='ci-home')closeDash();else if(m&&m.ci==='save'){try{const d=window.claude&&await claude.use('downloads');if(d){await d.save({filename:m.filename,data:m.data});return}}catch(_){}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([m.data],{type:'text/plain'}));a.download=m.filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)}});
const $=s=>document.querySelector(s),RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const P={users:'M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',star:'m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8 5.8 21l1.2-6.9-5-4.9 6.9-1z',usd:'M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',clk:'M12 6v6l4 2M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20',chart:'M3 3v18h18M7 14l4-4 3 3 5-6',file:'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5',layers:'m12 2 10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5',shield:'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',bag:'M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0',home:'M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z'};
const ic=n=>`<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="${P[n]}"/></svg>`;
$('#f1').innerHTML=ic('layers');$('#f2').innerHTML=ic('bag');$('#f3').innerHTML=ic('shield');
$('#ind').innerHTML=[['chart','Interactive Visualizations'],['layers','Customer Segmentation'],['star','Actionable Insights']].map(a=>`<span>${ic(a[0])}${a[1]}</span>`).join('');
$('#sb').innerHTML=['home','users','usd','chart','file'].map((n,i)=>`<span class="${i?'':'on'}">${ic(n)}</span>`).join('');
$('#yr').textContent=new Date().getFullYear();
// headline word reveal
(function(){let n=0;const h=$('#h1');const wrap=t=>t.split(' ').map(w=>`<span class="wd" style="--n:${n++}" aria-hidden="true">${w}</span>`).join(' ');h.innerHTML=wrap('Understand Your Customers.')+'<br><span class="g" style="display:inline-block">'+wrap('Unlock Your Growth.')+'</span>';h.querySelector('.g').style.cssText='display:inline';h.querySelectorAll('.g .wd').forEach(s=>{s.style.cssText+=';background:linear-gradient(90deg,#4F8CFF,#52D6FF);-webkit-background-clip:text;background-clip:text;color:transparent'})})();
// particles + parallax
(function(){const b=$('#bgl');for(let i=0;i<16;i++){const p=document.createElement('i');p.className='pt';p.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*70}%;animation-duration:${12+Math.random()*14}s;animation-delay:-${Math.random()*14}s;opacity:${.2+Math.random()*.4}`;b.appendChild(p)}
if(!RM)addEventListener('scroll',()=>{b.style.transform=`translateY(${Math.min(scrollY,800)*.25}px)`},{passive:true})})();
// dotted globe
(function(){const c=$('#gc'),x=c.getContext('2d'),N=1500,pts=[];for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),t=Math.PI*(3-Math.sqrt(5))*i;pts.push([Math.cos(t)*r,y,Math.sin(t)*r])}
let S=0,a=0;const tl=.4,ct=Math.cos(tl),st=Math.sin(tl);
function size(){const d=Math.min(devicePixelRatio||1,1.5),w=c.clientWidth||800;c.width=c.height=w*d;S=w*d}
function draw(){x.clearRect(0,0,S,S);const R=S*.45,m=S/2,ca=Math.cos(a),sa=Math.sin(a),k=S/1100;
for(const p of pts){const X=p[0]*ca+p[2]*sa,Z=-p[0]*sa+p[2]*ca,Y=p[1],Y2=Y*ct-Z*st,Z2=Y*st+Z*ct;if(Z2<-.1)continue;const f=(Z2+1)/2,u=(X+Y2+2)/4;
x.fillStyle=`rgba(${240-150*u|0},${90+30*u|0},${225+30*u|0},${.12+.75*f})`;x.beginPath();x.arc(m+X*R,m-Y2*R,(.7+1.7*f)*k,0,6.283);x.fill()}}
size();draw();addEventListener('resize',()=>{size();draw()});
if(!RM)(function f(){if(!document.hidden&&scrollY<1500){a+=.0022;draw()}requestAnimationFrame(f)})()})();
// pro effects
(function(){const g=$('#gc'),gl=document.querySelector('.gl'),bgl=$('#bgl');
[['n1','chart'],['n2','users'],['n3','usd']].forEach(a=>$('#'+a[0]).innerHTML=ic(a[1]));
for(let i=0;i<6;i++){const s=document.createElement('i');s.className='sk';s.style.cssText=`left:${8+Math.random()*84}%;top:${Math.random()*30}%;animation-delay:-${Math.random()*9}s;animation-duration:${6+Math.random()*6}s`;bgl.appendChild(s)}
const pr=$('#pr');addEventListener('scroll',()=>{pr.style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`},{passive:true});
document.querySelectorAll('.f,.k,.pan').forEach(el=>el.addEventListener('pointermove',e=>{const r=el.getBoundingClientRect();el.style.setProperty('--mx',e.clientX-r.left+'px');el.style.setProperty('--my',e.clientY-r.top+'px')}));
if(RM||matchMedia('(pointer:coarse)').matches)return;
const hero=document.querySelector('.hero'),fr=document.querySelector('.fr'),pv=$('#preview');
hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect(),nx=(e.clientX-r.left)/r.width-.5,ny=(e.clientY-r.top)/r.height-.5;g.style.translate=`${nx*-26}px ${ny*-16}px`;gl.style.translate=`${nx*-40}px ${ny*-24}px`;
const q=pv.getBoundingClientRect(),tx=Math.max(-.5,Math.min(.5,(e.clientX-q.left)/q.width-.5)),ty=Math.max(-.5,Math.min(.5,(e.clientY-q.top)/q.height-.5));fr.style.transform=`perspective(1600px) rotateX(${-ty*3}deg) rotateY(${tx*4}deg)`});
hero.addEventListener('pointerleave',()=>{fr.style.transform='';g.style.translate='';gl.style.translate=''});
hero.querySelectorAll('.cta .btn').forEach(b=>{b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.translate=`${(e.clientX-r.left-r.width/2)*.14}px ${(e.clientY-r.top-r.height/2)*.22}px`});b.addEventListener('pointerleave',()=>b.style.translate='')})})();
// reliable in-page scrolling (works inside the viewer iframe too)
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||a.hasAttribute('data-dash'))return;const id=a.getAttribute('href').slice(1);if(!id||id==='dashboard')return;e.preventDefault();if(app.classList.contains('on'))return;
if(id==='top'){scrollTo({top:0,behavior:RM?'auto':'smooth'});return}const t=document.getElementById(id);if(!t)return;scrollTo({top:t.getBoundingClientRect().top+scrollY-68,behavior:RM?'auto':'smooth'})},true);
// nav
const nav=$('#nav'),lk=$('#lk'),bg=$('#bg');addEventListener('scroll',()=>nav.classList.toggle('s',scrollY>20),{passive:true});
bg.onclick=()=>{const o=lk.classList.toggle('o');bg.setAttribute('aria-expanded',o)};lk.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{lk.classList.remove('o');bg.setAttribute('aria-expanded',false)}));
const secs=['top','features','analytics','reports'],ls=[...lk.querySelectorAll('a.l')];
const so=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){const i=secs.indexOf(e.target.id);ls.forEach((a,j)=>a.classList.toggle('on',i===j))}}),{rootMargin:'-45% 0px -50% 0px'});secs.forEach(id=>so.observe(document.getElementById(id)));
// charts (pro SVG, drawn at real pixel size)
const tip=$('#tip');let UID=0;
function bind(el){el.querySelectorAll('[data-t]').forEach(n=>{n.setAttribute('tabindex','0');n.setAttribute('aria-label',n.dataset.t.replace('|',': '));
const show=e=>{const[a,b]=n.dataset.t.split('|');tip.innerHTML=`<b>${a}</b>`+(b?`<span>${b}</span>`:'');tip.style.opacity=1;const r=n.getBoundingClientRect(),x=e.clientX||r.left+r.width/2,y=e.clientY||r.top;tip.style.left=Math.max(8,Math.min(x+14,innerWidth-210))+'px';tip.style.top=Math.max(8,y-58)+'px'};
n.addEventListener('pointermove',show);n.addEventListener('focus',show);n.addEventListener('pointerleave',()=>tip.style.opacity=0);n.addEventListener('blur',()=>tip.style.opacity=0)})}
function mount(el,f,h){el._f=f;el._h=h;const d=()=>{el.innerHTML=el._f(Math.max(240,el.clientWidth||320),el._h);bind(el)};d();el._w=el.clientWidth;
if(!el._ro){el._ro=new ResizeObserver(()=>{clearTimeout(el._t);el._t=setTimeout(()=>{if(Math.abs(el._w-el.clientWidth)>2){el._w=el.clientWidth;d()}},140)});el._ro.observe(el)}}
function nice(mx,n=4){const raw=mx/n,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p,s=(f<=1?1:f<=2?2:f<=5?5:10)*p;return{s,top:Math.ceil(mx/s-1e-9)*s}}
const fk=v=>v>=1000?(v/1000).toFixed(v%1000?1:0)+'k':String(Math.round(v*10)/10);
function frame(w,h,max,fmt){const m={l:46,r:14,t:24,b:30},{s,top}=nice(max),iw=w-m.l-m.r,ih=h-m.t-m.b;let g='';
for(let v=0;v<=top+1e-9;v+=s){const y=m.t+ih*(1-v/top);g+=`<line x1="${m.l}" x2="${w-m.r}" y1="${y}" y2="${y}" stroke="rgba(148,163,184,${v?.13:.3})" ${v?'stroke-dasharray="3 5"':''}/><text x="${m.l-9}" y="${y+4}" text-anchor="end" fill="#8b93a7" font-size="11">${fmt(v)}</text>`}return{m,top,iw,ih,g}}
const svgO=(w,h,c,defs,body)=>`<svg class="ch ${c}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"><defs>${defs}</defs>${body}</svg>`;
const bars=(lab,v,o={})=>(w,h)=>{const id='b'+UID++,c=o.c||'#8B6CFF',pre=o.pre||'',u=o.u||'',F=frame(w,h,Math.max(...v),x=>pre+fk(x)+u),{m,top,iw,ih}=F,cw=iw/v.length,bw=Math.min(cw*.62,56),tot=sum(v);
let s=F.g;v.forEach((x,i)=>{const bh=Math.max(2,ih*x/top),x0=m.l+i*cw+(cw-bw)/2,y0=m.t+ih-bh,r=Math.min(9,bw/2,bh);
s+=`<g class="bc" data-t="${lab[i]}|${pre}${x.toLocaleString()}${u}${o.tu||''} · ${Math.round(x/tot*100)}% of total"><rect x="${m.l+i*cw}" y="${m.t}" width="${cw}" height="${ih}" fill="transparent"/><path class="bar" style="--d:${i}" d="M${x0} ${m.t+ih}V${y0+r}Q${x0} ${y0} ${x0+r} ${y0}H${x0+bw-r}Q${x0+bw} ${y0} ${x0+bw} ${y0+r}V${m.t+ih}Z" fill="url(#${id})"/><text class="lb" x="${x0+bw/2}" y="${y0-8}" text-anchor="middle" fill="#e4e7f3" font-size="11.5" font-weight="650">${pre}${fk(x)}${u}</text></g><text x="${x0+bw/2}" y="${h-9}" text-anchor="middle" fill="#8b93a7" font-size="11.5">${lab[i]}</text>`});
return svgO(w,h,'bars',`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c}"/><stop offset="1" stop-color="${c}" stop-opacity=".3"/></linearGradient>`,s)};
const line=(lab,v,o={})=>(w,h)=>{const id='l'+UID++,pre=o.pre||'',u=o.u||'',F=frame(w,h,Math.max(...v),x=>pre+fk(x)+u),{m,top,iw,ih}=F,st=iw/(v.length-1),P=v.map((x,i)=>[m.l+i*st,m.t+ih*(1-x/top)]);
let d=`M${P[0][0]} ${P[0][1]}`;for(let i=0;i<P.length-1;i++){const a=P[i-1]||P[i],b=P[i],c=P[i+1],e=P[i+2]||c;d+=`C${b[0]+(c[0]-a[0])/6} ${b[1]+(c[1]-a[1])/6} ${c[0]-(e[0]-b[0])/6} ${c[1]-(e[1]-b[1])/6} ${c[0]} ${c[1]}`}
const pk=v.indexOf(Math.max(...v)),E=P[P.length-1],step=Math.ceil(36/st);let s=F.g+`<path class="ar" d="${d}L${E[0]} ${m.t+ih}L${m.l} ${m.t+ih}Z" fill="url(#${id}a)"/><path class="ln" pathLength="1" d="${d}" fill="none" stroke="url(#${id}s)" stroke-width="3" stroke-linecap="round"/><circle class="pd" cx="${E[0]}" cy="${E[1]}" r="4.5" fill="#45D0E8"/><circle class="pd pl" cx="${E[0]}" cy="${E[1]}" r="4.5" fill="none" stroke="#45D0E8"/>`;
s+=`<text class="lb" x="${P[pk][0]}" y="${P[pk][1]-12}" text-anchor="${P[pk][0]>w-70?'end':'middle'}" fill="#cbbdff" font-size="11.5" font-weight="650">Peak ${pre}${v[pk]}${u}</text>`;
P.forEach((p,i)=>{const dl=i?Math.round((v[i]/v[i-1]-1)*100):0;s+=`<g class="pt" data-t="${lab[i]}|${pre}${v[i]}${u}${i?` · ${dl>=0?'+':''}${dl}% vs prev`:''}"><rect x="${p[0]-st/2}" y="${m.t}" width="${st}" height="${ih}" fill="transparent"/><line class="gd" x1="${p[0]}" x2="${p[0]}" y1="${m.t}" y2="${m.t+ih}" stroke="rgba(139,108,255,.55)" stroke-dasharray="3 4"/><circle class="gd" cx="${p[0]}" cy="${p[1]}" r="5.5" fill="#05060c" stroke="#45D0E8" stroke-width="2.5"/></g>`;if(i%step===0)s+=`<text x="${p[0]}" y="${h-9}" text-anchor="middle" fill="#8b93a7" font-size="11.5">${lab[i]}</text>`});
return svgO(w,h,'lines',`<linearGradient id="${id}a" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8B6CFF" stop-opacity=".42"/><stop offset="1" stop-color="#8B6CFF" stop-opacity="0"/></linearGradient><linearGradient id="${id}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8B6CFF"/><stop offset="1" stop-color="#45D0E8"/></linearGradient>`,s)};
const scat=pts=>(w,h)=>{const nx=nice(Math.max(...pts.map(p=>p[0])),5),F=frame(w,h,Math.max(...pts.map(p=>p[1])),x=>'$'+fk(x)),{m,top,iw,ih}=F;let s=F.g;
for(let v=0;v<=nx.top+1e-9;v+=nx.s)s+=`<text x="${m.l+iw*v/nx.top}" y="${h-9}" text-anchor="middle" fill="#8b93a7" font-size="11.5">${v}</text>`;
s+=`<circle cx="${m.l+4}" cy="10" r="4.5" fill="#45D0E8"/><text x="${m.l+14}" y="14" fill="#aab2c5" font-size="11">High-value</text><circle cx="${m.l+92}" cy="10" r="4" fill="#8B6CFF"/><text x="${m.l+102}" y="14" fill="#aab2c5" font-size="11">Standard</text><text x="${w-m.r}" y="14" text-anchor="end" fill="#6f7891" font-size="10.5">x: purchases · y: spend</text>`;
[...pts].sort((a,b)=>a[2]-b[2]).forEach((p,i)=>{s+=`<circle class="pop" style="--d:${i}" data-t="${p[0]} purchases|$${p[1].toLocaleString()} spent${p[2]?' · high-value':''}" cx="${m.l+iw*p[0]/nx.top}" cy="${m.t+ih*(1-p[1]/top)}" r="${p[2]?6:4.5}" fill="${p[2]?'#45D0E8':'#8B6CFF'}" fill-opacity="${p[2]?1:.7}" ${p[2]?'stroke="rgba(69,208,232,.3)" stroke-width="5"':''}/>`});
return svgO(w,h,'sct','',s)};
// illustrative data
const AG=['18–24','25–34','35–44','45–54','55–64','65+'],AV=[310,540,470,360,240,130],SG=['Bronze','Silver','Gold','Platinum'],SV=[153,258,366,412],MO=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],MV=[71,68,77,82,88,85,90,94,101,118,142,173];
let sd=7;const rnd=()=>(sd=sd*16807%2147483647)/2147483647;const PT=Array.from({length:44},()=>{const f=1+Math.floor(rnd()*19),s=Math.round(f*(28+rnd()*38)*(rnd()<.12?1.8:1));return[f,s,0]});const cut=PT.map(p=>p[1]).sort((a,b)=>a-b)[Math.floor(PT.length*.88)];PT.forEach(p=>p[2]=p[1]>=cut?1:0);
const sum=a=>a.reduce((x,y)=>x+y,0),pc=(x,t)=>Math.round(x/t*100);
mount($('#c1'),bars(AG,AV),230);mount($('#c2'),bars(SG,SV,{c:'#45D0E8',pre:'$',u:'K'}),230);mount($('#c3'),scat(PT),230);mount($('#c4'),line(MO,MV,{pre:'$',u:'K'}),230);
[['#c1','Peak '+AG[AV.indexOf(Math.max(...AV))]],['#c2',pc(SV[2]+SV[3],sum(SV))+'% from top tiers'],['#c3',PT.filter(p=>p[2]).length+' high-value'],['#c4','Peak '+MO[MV.indexOf(Math.max(...MV))]]].forEach(a=>$(a[0]).closest('.cc').querySelector('h3').insertAdjacentHTML('beforeend',`<span class="chip">${a[1]}</span>`));
// KPIs (values derived from the demo arrays)
const CU=sum(AV),TS=sum(SV)*1000,KP=[['Total Customers',CU,v=>Math.round(v).toLocaleString(),'users','Unique customers in sample'],['Total Spending',TS,v=>'$'+(v/1e6).toFixed(2)+'M','usd','Sum of sample purchases'],['Avg Customer Spending',TS/CU,v=>'$'+Math.round(v),'chart','Total ÷ customers'],['High-Value Customers',Math.round(CU*.1),v=>Math.round(v).toLocaleString(),'star','Top 10% by spend (P90)']];
$('#kp').innerHTML=KP.map((k,i)=>`<div class="k" tabindex="0" title="${k[4]} — illustrative"><div class="h">${k[0]}${ic(k[3])}</div><b data-i="${i}">${k[2](RM?k[1]:0)}</b><small>${k[4]}</small><i></i></div>`).join('');
function count(){if(RM)return;const t0=performance.now();(function f(t){const p=Math.min(1,(t-t0)/1400),e=1-Math.pow(1-p,3);KP.forEach((k,i)=>document.querySelector(`[data-i="${i}"]`).textContent=k[2](k[1]*e));p<1&&requestAnimationFrame(f)})(t0)}
// features
const FT=[['users','Customer Demographics','Understand customer age groups, geographic distribution, and available demographic characteristics.'],['star','High-Value Customer Discovery','Identify the customers and segments contributing most to total spending.'],['usd','Spending Intelligence','Compare spending behavior across customer categories, locations, and demographic groups.'],['clk','Purchase Pattern Analysis','Investigate purchasing frequency, repeat behavior, and time-based trends when transaction data is available.'],['chart','Interactive Visualizations','Explore customer data using clear, interactive charts and configurable filters.'],['file','Actionable Reports','Convert analytical findings into evidence-based recommendations and downloadable reports.']];
$('#fg').innerHTML=FT.map((f,i)=>`<article class="f rv" style="--d:${i%3}"><div class="ic">${ic(f[0])}</div><h3>${f[1]}</h3><p>${f[2]}</p></article>`).join('');
// showcase
const TOP=Math.max(...AV),SH={
demo:['Customer Demographics',()=>bars(AG,AV,{tu:' customers'}),'How customers are distributed across age groups.','Knowing who your customers are guides channel, messaging, and product decisions.',`The ${AG[AV.indexOf(TOP)]} group is the largest at ${pc(TOP,CU)}% of the sample.`],
val:['Customer Value Distribution',()=>scat(PT),'Each point is a customer: purchase frequency against total spend. Highlighted points are the top 12% by spend.','Separating loyal high spenders from occasional buyers shows where retention effort pays off.',`${PT.filter(p=>p[2]).length} of ${PT.length} sampled customers are high-value, averaging ${Math.round(sum(PT.filter(p=>p[2]).map(p=>p[0]))/PT.filter(p=>p[2]).length)} purchases.`],
spend:['Revenue Concentration',()=>bars(SG,SV,{c:'#45D0E8',pre:'$',u:'K'}),'How much total customer spending is contributed by different customer groups.','Understanding spending concentration can help businesses prioritize customer retention and investigate revenue dependency.',`Gold and Platinum together contribute ${pc(SV[2]+SV[3],sum(SV))}% of sample revenue.`],
pat:['Purchase Patterns Over Time',()=>line(MO,MV,{pre:'$',u:'K'}),'Monthly spending across a year, revealing seasonality and growth.','Time-based patterns help schedule promotions ahead of peaks and plan inventory and staffing.',`Spend peaks in ${MO[MV.indexOf(Math.max(...MV))]} — ${pc(Math.max(...MV),sum(MV))}% of annual sample spend.`]};
const TABS=[['demo','Demographics'],['val','Customer Value'],['spend','Spending'],['pat','Purchase Patterns']];
$('#seg').innerHTML=TABS.map((t,i)=>`<button role="tab" id="t-${t[0]}" data-k="${t[0]}" aria-selected="${!i}" class="${i?'':'on'}">${t[1]}</button>`).join('');
let CUR='demo';function showTab(k){CUR=k;const d=SH[k],c=$('#sch');$('#st').textContent=d[0];$('#sw').textContent=d[2];$('#sy').textContent=d[3];$('#sk').textContent=d[4];c.className='';mount(c,d[1](),280);void c.offsetWidth;c.className=$('#show').classList.contains('in')?'in':'';c.classList.add('cc');c.style.cssText='opacity:1;transform:none;padding:0;border:0;background:none';
document.querySelectorAll('#seg button').forEach(b=>{const on=b.dataset.k===k;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)})}
$('#seg').onclick=e=>{const b=e.target.closest('button');b&&showTab(b.dataset.k)};
$('#seg').onkeydown=e=>{const bs=[...document.querySelectorAll('#seg button')],i=bs.findIndex(b=>b.classList.contains('on'));if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const n=bs[(i+(e.key==='ArrowRight'?1:bs.length-1))%bs.length];n.focus();showTab(n.dataset.k)}};
showTab('demo');
// steps
$('#steps').innerHTML=[['Upload Your Data','Import a supported customer dataset and inspect its structure.'],['Discover Insights','Clean the data, analyze customer segments, and explore visualizations.'],['Make Better Decisions','Review evidence-based findings and export an analytical report.']].map((s,i)=>`<div class="s"><div class="n">0${i+1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`).join('');
// reveal
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);if(e.target.id==='preview')count();if(e.target.id==='show')showTab(CUR)}}),{threshold:.15});
document.querySelectorAll('.rv,.cc').forEach((el,i)=>{if(el.closest('.pv'))el.style.transitionDelay=(i%4)*.12+'s';if(el.id!=='sch')io.observe(el)});io.observe($('#preview'));
const pvo=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.querySelectorAll('.cc').forEach(c=>c.classList.add('in'));pvo.disconnect()}}),{threshold:.1});pvo.observe($('#preview'));
