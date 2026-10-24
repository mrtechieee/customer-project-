const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const AL={id:['customerid','custid','userid','clientid','id'],age:['age'],gender:['gender','sex'],loc:['location','city','region','country','state'],cat:['category','segment','tier','membership'],date:['purchasedate','orderdate','date'],sp:['spending','spend','amount','revenue','sales','monetary','price']};
const NM={id:'CustomerID',age:'Age',gender:'Gender',loc:'Location',cat:'Category',date:'PurchaseDate',sp:'Spending'};
let S={cols:{},rows:[],log:[],tab:'data',raw:null};
const norm=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');
const med=a=>{if(!a.length)return NaN;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2};
const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y),i=(s.length-1)*p,l=Math.floor(i);return s[l]+(s[Math.min(l+1,s.length-1)]-s[l])*(i-l)};
const sum=a=>a.reduce((x,y)=>x+y,0),mean=a=>a.length?sum(a)/a.length:NaN;
const CURS={INR:{sym:'₹',loc:'en-IN'},USD:{sym:'$',loc:'en-US'},EUR:{sym:'€',loc:'en-IE'},GBP:{sym:'£',loc:'en-GB'},NONE:{sym:'',loc:'en-US'}};
const SYM=()=>CURS[(S&&S.cur)||'NONE'].sym,CS=()=>SYM()?` (${SYM()})`:'';
const money=n=>isFinite(n)?SYM()+Math.round(n).toLocaleString(CURS[(S&&S.cur)||'NONE'].loc):'–',fx=(n,d=1)=>isFinite(n)?n.toFixed(d):'–';
const css=v=>getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const mkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');

// ---------- Ingestion ----------
function detect(h){const o={},u=new Set();for(const k in AL){const hit=h.find(x=>!u.has(x)&&AL[k].includes(norm(x)))||h.find(x=>!u.has(x)&&AL[k].some(a=>a.length>3&&norm(x).includes(a)));if(hit){o[k]=hit;u.add(hit)}}return o}
const num=v=>{if(typeof v==='number')return v;let s=String(v).replace(/rs\.?|inr|usd|eur|gbp/ig,'').replace(/[^0-9.\-]/g,'');return s===''?NaN:parseFloat(s)};
function detectCur(rows,h,sp){const cc=h.find(x=>norm(x)==='currency');if(cc){const r=rows.find(r=>r[cc]),v=String(r?r[cc]:'').toUpperCase();for(const k in CURS)if(k!=='NONE'&&(v.includes(k)||v.includes(CURS[k].sym)))return k}
const t=sp+' '+rows.slice(0,400).map(r=>r[sp]).join(' ');
return /₹|(^|[^a-z])(inr|rs\.?|rupees?)(?![a-z])/i.test(t)?'INR':/€|(^|[^a-z])(eur|euros?)(?![a-z])/i.test(t)?'EUR':/£|(^|[^a-z])(gbp|pounds?)(?![a-z])/i.test(t)?'GBP':/\$|(^|[^a-z])(usd|dollars?)(?![a-z])/i.test(t)?'USD':'NONE'}
function applyCur(){const v=$('#cur').value;S.cur=v==='auto'?(S.auto||'NONE'):v;$('#curn').textContent=v==='auto'?(S.auto&&S.auto!=='NONE'?'Detected: '+CURS[S.auto].sym+' '+S.auto:'No currency found in data — choose one above if needed'):'Set manually'}
function ingest(rows,cur){S.raw=rows;const h=Object.keys(rows[0]||{});S.cols=detect(h);if(!S.cols.sp){alert('A spending/amount column is required. Detected columns: '+h.join(', '));return}S.auto=cur||detectCur(rows,h,S.cols.sp);applyCur();build()}
function handleFile(f){S.pend=null;$('#stage').classList.remove('hide');$('#fn').textContent=f.name;$('#fm').textContent='Reading file…';$('#analyze').disabled=true;
const done=rows=>{if(!rows||!rows.length){$('#fm').textContent='No rows found in this file.';return}const h=Object.keys(rows[0]),C=detect(h);S.pend={rows,name:f.name};
if(!C.sp){$('#fm').textContent='No spending/amount column found. Columns: '+h.join(', ');return}
$('#fm').textContent=`${rows.length.toLocaleString()} rows · ${h.length} columns · detected: ${Object.keys(C).map(k=>NM[k]).join(', ')}`;$('#analyze').disabled=false;$('#dtxt').innerHTML='✓ File ready<br><small>Drop or click to replace</small>'};
const n=f.name.toLowerCase(),err=m=>$('#fm').textContent=m;
try{if(n.endsWith('.csv')||n.endsWith('.txt'))Papa.parse(f,{header:true,skipEmptyLines:true,dynamicTyping:true,complete:r=>done(r.data),error:e=>err('Could not read file: '+e.message)});
else{const r=new FileReader();r.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array',cellDates:true});done(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:null}))}catch(x){err('Could not read this Excel file.')}};r.onerror=()=>err('Could not read file.');r.readAsArrayBuffer(f)}}catch(x){err('Could not read file.')}}

// ---------- Cleaning ----------
function build(){const C=S.cols,log=[],raw=S.raw;log.push(`Loaded <b>${raw.length}</b> rows, ${Object.keys(raw[0]).length} columns. Detected: ${Object.keys(C).map(k=>`${NM[k]}→<code>${C[k]}</code>`).join(', ')}.`);
const miss=Object.keys(NM).filter(k=>!C[k]);if(miss.length)log.push(`Optional columns not found (related analyses skipped): ${miss.map(k=>NM[k]).join(', ')}.`);
let r=raw.map((x,i)=>{const o={_i:i};for(const k in C){let v=x[C[k]];if(typeof v==='string')v=v.trim();if(v==='')v=null;o[k]=v}
if(C.sp)o.sp=num(o.sp);if(C.age)o.age=o.age==null?null:parseFloat(o.age);
if(C.date&&o.date!=null){const d=o.date instanceof Date?o.date:new Date(o.date);o.date=isNaN(d)?null:d}
['gender','loc','cat'].forEach(k=>{if(C[k]&&o[k]!=null){o[k]=String(o[k]).toLowerCase().replace(/\b\w/g,c=>c.toUpperCase())}});return o});
if($('#dedupe').checked){const seen=new Set(),n0=r.length;r=r.filter(o=>{const key=JSON.stringify([o.id,o.age,o.gender,o.loc,o.cat,o.date&&+o.date,o.sp]);if(seen.has(key))return false;seen.add(key);return true});log.push(`Removed <b>${n0-r.length}</b> duplicate rows.`)}
const n1=r.length;r=r.filter(o=>isFinite(o.sp)&&o.sp>=0);log.push(`Dropped <b>${n1-r.length}</b> rows with missing/negative spending.`);
if(C.age){const n2=r.length;r.forEach(o=>{if(o.age!=null&&(o.age<10||o.age>100))o.age=null});const m=med(r.map(o=>o.age).filter(a=>a!=null));let c=0;r.forEach(o=>{if(o.age==null){o.age=m;c++}});log.push(`Age: invalid/missing values (<b>${c}</b>) imputed with median (${fx(m,0)}).`)}
['gender','loc','cat'].forEach(k=>{if(C[k]){let c=0;r.forEach(o=>{if(o[k]==null){o[k]='Unknown';c++}});if(c)log.push(`${NM[k]}: ${c} missing values set to "Unknown".`)}});
if(C.date){const n3=r.length;r=r.filter(o=>o.date);log.push(`Dropped ${n3-r.length} rows with unparseable dates.`)}
const sp=r.map(o=>o.sp),Q1=q(sp,.25),Q3=q(sp,.75),lo=Q1-1.5*(Q3-Q1),hi=Q3+1.5*(Q3-Q1);let oc=0;r.forEach(o=>{o.out=o.sp<lo||o.sp>hi;if(o.out)oc++});
log.push(`Flagged <b>${oc}</b> spending outliers outside [${money(lo)}, ${money(hi)}] (IQR rule).`);if($('#outl').checked){r=r.filter(o=>!o.out);log.push('Outliers excluded per setting.')}
S.rows=r;S.log=log;initFilters();$('#empty').classList.add('hide');$('#app').classList.remove('hide');$('#dlcsv').disabled=$('#dlrep').disabled=false;render()}

// ---------- Filters ----------
function initFilters(){const C=S.cols,r=S.rows;const fill=(id,k)=>{const el=$(id);el.innerHTML=C[k]?[...new Set(r.map(o=>o[k]))].sort().map(v=>`<option selected>${v}</option>`).join(''):'';el.disabled=!C[k]};fill('#loc','loc');fill('#cat','cat');
const ages=r.map(o=>o.age).filter(a=>a!=null);$('#a0').value=C.age?Math.min(...ages):'';$('#a1').value=C.age?Math.max(...ages):'';$('#a0').disabled=$('#a1').disabled=!C.age;
const ds=r.map(o=>o.date).filter(Boolean);const iso=d=>d.toISOString().slice(0,10);$('#d0').value=ds.length?iso(new Date(Math.min(...ds))):'';$('#d1').value=ds.length?iso(new Date(Math.max(...ds))):'';$('#d0').disabled=$('#d1').disabled=!C.date}
const sel=id=>$$(id+' option:checked').map(o=>o.value);
function filt(){const C=S.cols,L=sel('#loc'),G=sel('#cat'),a0=+$('#a0').value,a1=+$('#a1').value,d0=$('#d0').value&&new Date($('#d0').value),d1=$('#d1').value&&new Date($('#d1').value+'T23:59:59');
return S.rows.filter(o=>(!C.loc||L.includes(o.loc))&&(!C.cat||G.includes(o.cat))&&(!C.age||(o.age>=a0&&o.age<=a1))&&(!C.date||!d0||(o.date>=d0&&o.date<=d1)))}
const ageGrp=(a,b)=>{const lo=Math.floor(a/b)*b;return`${lo}–${lo+b-1}`};
function groupBy(rows,f){const m={};rows.forEach(o=>{const k=f(o);(m[k]=m[k]||[]).push(o)});return m}
function custAgg(rows){const C=S.cols;const m=groupBy(rows,o=>C.id?o.id:'r'+o._i);const mx=C.date?Math.max(...rows.map(o=>+o.date)):0;
return Object.entries(m).map(([id,a])=>({id,F:a.length,M:sum(a.map(o=>o.sp)),R:C.date?Math.round((mx-Math.max(...a.map(o=>+o.date)))/864e5):NaN})).sort((x,y)=>y.M-x.M)}

// ---------- Plot helpers ----------
function P(id,data,lay={}){const el=document.getElementById(id);if(!el)return;Plotly.react(el,data,Object.assign({margin:{l:52,r:20,t:10,b:48},paper_bgcolor:'rgba(0,0,0,0)',plot_bgcolor:'rgba(0,0,0,0)',font:{color:css('--tx'),family:'Inter,system-ui,sans-serif',size:12},xaxis:{gridcolor:css('--bd'),zerolinecolor:css('--bd'),automargin:true},yaxis:{gridcolor:css('--bd'),zerolinecolor:css('--bd'),automargin:true},legend:{orientation:'h',y:-.25},hovermode:'closest'},lay),{responsive:true,displaylogo:false})}
const card=(id,t,d,ok=true,why='')=>`<div class="card"><h4>${t}</h4><p>${d}</p>${ok?`<div class="ch" id="${id}"></div>`:`<div class="na">${why||'Required column not available — chart skipped.'}</div>`}</div>`;
const AC=()=>css('--ac'),A2=()=>css('--ac2');

// ---------- Render ----------
const TABS=[['data','Data & Cleaning'],['demo','Demographics'],['seg','Spending & Segments'],['pat','Purchasing Patterns'],['rep','Analytical Report']];
function render(){const C=S.cols,rows=filt(),ab=+$('#ab').value,hp=+$('#hp').value;$('#abv').textContent=ab;$('#hpv').textContent=hp;
$('#tabs').innerHTML=TABS.map(([k,l])=>`<button class="tab ${S.tab===k?'on':''}" data-t="${k}">${l}</button>`).join('');
$$('main section').forEach(s=>s.classList.toggle('hide',s.id!=='p-'+S.tab));
const cu=custAgg(rows),tot=sum(rows.map(o=>o.sp)),thr=cu.length?q(cu.map(c=>c.M),hp/100):NaN,hv=cu.filter(c=>c.M>=thr);
S.v={rows,cu,tot,thr,hv,ab,hp};
$('#kpis').innerHTML=[['Customers',cu.length.toLocaleString()],['Transactions',rows.length.toLocaleString()],['Total revenue',money(tot)],['Avg / customer',money(tot/cu.length)],[`High-value (≥P${hp})`,hv.length.toLocaleString()],['HV revenue share',fx(sum(hv.map(c=>c.M))/tot*100)+'%']].map(([a,b])=>`<div class="kpi"><small>${a}</small><b>${b}</b></div>`).join('');
if(!rows.length){$('#p-'+S.tab).innerHTML='<div class="card na">No rows match the current filters.</div>';return}
({data:rData,demo:rDemo,seg:rSeg,pat:rPat,rep:rRep})[S.tab]()}

function rData(){const r=S.rows,C=S.cols;const cols=Object.keys(C);
$('#p-data').innerHTML=`<div class="grid"><div class="card"><h4>Cleaning log</h4><p>Every transformation applied to your upload.</p><ul class="log">${S.log.map(l=>`<li>${l}</li>`).join('')}</ul></div>
<div class="card"><h4>Column inventory</h4><p>Non-null counts and types after cleaning (df.info equivalent).</p><div class="scroll"><table><tr><th>Field</th><th>Source</th><th>Type</th><th>Non-null</th><th>Unique</th></tr>${cols.map(k=>`<tr><td>${NM[k]}</td><td>${C[k]}</td><td>${k==='sp'||k==='age'?'number':k==='date'?'datetime':'category'}</td><td>${r.filter(o=>o[k]!=null).length}</td><td>${new Set(r.map(o=>String(o[k]))).size}</td></tr>`).join('')}</table></div></div>
<div class="card"><h4>Spending summary (df.describe)</h4><p>Distribution of transaction spending.</p><div class="scroll"><table>${(()=>{const s=r.map(o=>o.sp);return[['count',s.length],['mean',fx(mean(s),2)],['std',fx(Math.sqrt(mean(s.map(x=>(x-mean(s))**2))),2)],['min',fx(Math.min(...s),2)],['25%',fx(q(s,.25),2)],['median',fx(q(s,.5),2)],['75%',fx(q(s,.75),2)],['max',fx(Math.max(...s),2)]].map(([a,b])=>`<tr><th>${a}</th><td>${b}</td></tr>`).join('')})()}</table></div></div>
<div class="card"><h4>Preview</h4><p>First 8 cleaned rows.</p><div class="scroll"><table><tr>${cols.map(k=>`<th>${NM[k]}</th>`).join('')}</tr>${r.slice(0,8).map(o=>`<tr>${cols.map(k=>`<td>${k==='date'&&o[k]?o[k].toISOString().slice(0,10):o[k]}</td>`).join('')}</tr>`).join('')}</table></div></div></div>`}

function rDemo(){const{rows,ab}=S.v,C=S.cols;
$('#p-demo').innerHTML=`<div class="grid">${card('c1','Age distribution',`Histogram with ${ab}-year bins; median ${C.age?fx(med(rows.map(o=>o.age)),0):'–'}.`,!!C.age)}${card('c2','Customers by gender','Share of customers per gender.',!!C.gender)}${card('c3','Top locations','Customer count by region.',!!C.loc)}${card('c4','Customers by category','Distribution across customer tiers/segments.',!!C.cat)}</div>`;
const cu=(k)=>{const m=groupBy(rows,o=>o[k]);return Object.entries(m).map(([a,b])=>[a,new Set(b.map(o=>C.id?o.id:o._i)).size]).sort((x,y)=>y[1]-x[1])};
if(C.age)P('c1',[{type:'histogram',x:rows.map(o=>o.age),xbins:{start:Math.floor(Math.min(...rows.map(o=>o.age))/ab)*ab,end:Math.ceil((Math.max(...rows.map(o=>o.age))+1)/ab)*ab,size:ab},autobinx:false,marker:{color:AC()},hovertemplate:'Age %{x}<br>%{y} txns<extra></extra>'}],{xaxis:{title:'Age',gridcolor:css('--bd')},yaxis:{title:'Transactions',gridcolor:css('--bd')},bargap:.05});
if(C.gender){const d=cu('gender');P('c2',[{type:'pie',labels:d.map(x=>x[0]),values:d.map(x=>x[1]),hole:.55,marker:{colors:[AC(),A2(),css('--wn'),'#9775fa']},textinfo:'label+percent'}],{showlegend:false})}
if(C.loc){const d=cu('loc').slice(0,10);P('c3',[{type:'bar',orientation:'h',y:d.map(x=>x[0]).reverse(),x:d.map(x=>x[1]).reverse(),marker:{color:A2()}}],{xaxis:{title:'Customers',gridcolor:css('--bd')},margin:{l:90,r:20,t:10,b:48}})}
if(C.cat){const d=cu('cat');P('c4',[{type:'bar',x:d.map(x=>x[0]),y:d.map(x=>x[1]),marker:{color:AC()}}],{yaxis:{title:'Customers',gridcolor:css('--bd')}})}}

function rSeg(){const{rows,cu,thr,hv,ab,hp}=S.v,C=S.cols,opts=[['age','Age group'],['gender','Gender'],['cat','Category'],['loc','Location']].filter(o=>C[o[0]]);
const g=S.grp&&opts.some(o=>o[0]===S.grp)?S.grp:(opts[0]||[])[0];S.grp=g;
$('#p-seg').innerHTML=`<div class="grid">
<div class="card" style="grid-column:1/-1"><h4>Pareto — revenue concentration</h4><p>Top 30 customers by spend (bars) and cumulative share of total revenue across all ${cu.length} customers (line). High-value threshold P${hp} = ${money(thr)}.</p><div class="ch" id="c5"></div></div>
${g?`<div class="card"><h4>Spending distribution by group</h4><p>Transaction spend — medians and outliers. Group by: <select id="grp" style="width:auto">${opts.map(o=>`<option value="${o[0]}" ${o[0]===g?'selected':''}>${o[1]}</option>`).join('')}</select></p><div class="ch" id="c6"></div></div>
<div class="card"><h4>Average spend per segment</h4><p>Mean transaction spend with customer-level high-value share.</p><div class="ch" id="c7"></div></div>`:card('c6','Spending by group','',false,'No demographic/segment columns found.')}
${card('c8','RFM scatter — Frequency vs Monetary',`High-value (≥P${hp}) vs standard customers; reveals loyal high-spenders vs occasional big-ticket buyers.`,true)}</div>`;
const T=cu.slice(0,30);let acc=0;const cum=cu.map(c=>(acc+=c.M)/S.v.tot*100);
P('c5',[{type:'bar',x:T.map(c=>String(c.id)),y:T.map(c=>c.M),name:'Spend',marker:{color:T.map(c=>c.M>=thr?AC():css('--mu'))}},{type:'scatter',mode:'lines',x:T.map(c=>String(c.id)),y:cum.slice(0,30),name:'Cumulative %',yaxis:'y2',line:{color:css('--wn'),width:3}}],{xaxis:{title:'Customer',type:'category',gridcolor:css('--bd')},yaxis:{title:'Spend'+CS(),gridcolor:css('--bd')},yaxis2:{overlaying:'y',side:'right',range:[0,100],title:'Cumulative %',showgrid:false}});
if(g){const f=o=>g==='age'?ageGrp(o.age,ab):o[g],m=groupBy(rows,f),ks=Object.keys(m).sort((a,b)=>g==='age'?parseInt(a)-parseInt(b):a.localeCompare(b));
P('c6',ks.map(k=>({type:'box',y:m[k].map(o=>o.sp),name:k,marker:{color:AC()},boxpoints:'outliers'})),{showlegend:false,yaxis:{title:'Spending'+CS(),gridcolor:css('--bd')}});
const hset=new Set(hv.map(c=>String(c.id))),av=ks.map(k=>mean(m[k].map(o=>o.sp)));
P('c7',[{type:'bar',x:ks,y:av,marker:{color:A2()},text:av.map(v=>money(v)),textposition:'outside',hovertemplate:'%{x}<br>Avg '+SYM()+'%{y:,.0f}<extra></extra>'}],{yaxis:{title:'Avg spend'+CS(),gridcolor:css('--bd')}});$('#grp').onchange=e=>{S.grp=e.target.value;rSeg()}}
const hs=new Set(hv.map(c=>c.id));P('c8',[[false,'Standard',css('--mu')],[true,'High-value',AC()]].map(([f,n,c])=>({type:'scatter',mode:'markers',name:n,x:cu.filter(x=>hs.has(x.id)===f).map(x=>x.F),y:cu.filter(x=>hs.has(x.id)===f).map(x=>x.M),text:cu.filter(x=>hs.has(x.id)===f).map(x=>'Customer '+x.id),marker:{color:c,size:8,opacity:.7},hovertemplate:'%{text}<br>Freq %{x}<br>Spend '+SYM()+'%{y:,.0f}<extra></extra>'})),{xaxis:{title:'Frequency (# purchases)',gridcolor:css('--bd')},yaxis:{title:'Monetary (total spend)'+CS(),gridcolor:css('--bd')}})}

function rPat(){const{rows}=S.v,C=S.cols;
$('#p-pat').innerHTML=`<div class="grid">${card('c9','Revenue over time','Monthly total spend (top) — reveals growth and seasonality.',!!C.date)}${card('c10','Day-of-week pattern','Average daily revenue by weekday.',!!C.date)}${card('c11','Revenue by category','Contribution of each category to total revenue.',!!C.cat)}${card('c12','Monthly transactions','Order volume per month.',!!C.date)}</div>`;
if(C.date){const m=groupBy(rows,o=>mkey(o.date)),ks=Object.keys(m).sort();P('c9',[{type:'scatter',mode:'lines+markers',x:ks,y:ks.map(k=>sum(m[k].map(o=>o.sp))),line:{color:AC(),width:3,shape:'spline'},fill:'tozeroy',fillcolor:'rgba(91,120,255,.12)'}],{yaxis:{title:'Revenue'+CS(),gridcolor:css('--bd')}});
P('c12',[{type:'bar',x:ks,y:ks.map(k=>m[k].length),marker:{color:A2()}}],{yaxis:{title:'Transactions',gridcolor:css('--bd')}});
const dn=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],days=groupBy(rows,o=>o.date.toISOString().slice(0,10)),wd=dn.map((_,i)=>{const v=Object.entries(days).filter(([d])=>new Date(d+'T00:00:00Z').getUTCDay()===i).map(([,a])=>sum(a.map(o=>o.sp)));return mean(v)||0});
P('c10',[{type:'bar',x:dn,y:wd,marker:{color:wd.map(v=>v===Math.max(...wd)?css('--wn'):AC())}}],{yaxis:{title:'Avg daily revenue'+CS(),gridcolor:css('--bd')}})}
if(C.cat){const m=groupBy(rows,o=>o.cat),d=Object.entries(m).map(([k,a])=>[k,sum(a.map(o=>o.sp))]).sort((a,b)=>b[1]-a[1]);P('c11',[{type:'pie',labels:d.map(x=>x[0]),values:d.map(x=>x[1]),hole:.5,marker:{colors:[AC(),A2(),css('--wn'),'#9775fa','#f06595','#66d9e8']},textinfo:'label+percent'}],{showlegend:false})}}

function insights(){const{rows,cu,tot,thr,hv,ab,hp}=S.v,C=S.cols,I=[];
const share=sum(hv.map(c=>c.M))/tot*100;
I.push(['Revenue concentration',`The top ${100-hp}% of customers (${hv.length}) generate ${fx(share)}% of revenue, consistent with the Pareto principle.`,'Retention of this small group protects a disproportionate share of income; prioritise loyalty perks and account management.']);
if(C.age){const m=groupBy(rows,o=>ageGrp(o.age,ab)),ks=Object.keys(m),big=ks.sort((a,b)=>m[b].length-m[a].length)[0],top=ks.sort((a,b)=>med(m[b].map(o=>o.sp))-med(m[a].map(o=>o.sp)))[0];
I.push(['Demographics',`The largest age group is ${big} (${fx(m[big].length/rows.length*100)}% of transactions); median age is ${fx(med(rows.map(o=>o.age)),0)}. Highest median spend is in ${top} (${money(med(m[top].map(o=>o.sp)))}).`,'Marketing creative and channel mix should be tuned to the dominant group, while the highest-spending group is the best upsell target.'])}
if(C.cat){const m=groupBy(rows,o=>o.cat),d=Object.entries(m).map(([k,a])=>[k,sum(a.map(o=>o.sp))]).sort((a,b)=>b[1]-a[1]);I.push(['Categories',`${d[0][0]} leads with ${fx(d[0][1]/tot*100)}% of revenue${d[1]?`, followed by ${d[1][0]} (${fx(d[1][1]/tot*100)}%)`:''}.`,'Bundle and cross-sell around leading categories; review under-performing ones for pricing or assortment issues.'])}
if(C.loc){const m=groupBy(rows,o=>o.loc),d=Object.entries(m).map(([k,a])=>[k,sum(a.map(o=>o.sp))]).sort((a,b)=>b[1]-a[1]);I.push(['Geography',`${d[0][0]} is the top region at ${money(d[0][1])} (${fx(d[0][1]/tot*100)}% of revenue).`,'Concentrate local campaigns and logistics where demand is strongest; test expansion in weaker regions.'])}
if(C.date){const m=groupBy(rows,o=>mkey(o.date)),ks=Object.keys(m).sort(),v=ks.map(k=>sum(m[k].map(o=>o.sp))),pk=ks[v.indexOf(Math.max(...v))],lo=ks[v.indexOf(Math.min(...v))];I.push(['Time trends',`Revenue peaks in ${pk} (${money(Math.max(...v))}) and is lowest in ${lo} (${money(Math.min(...v))}) across ${ks.length} months.`,'Time-series shows how performance changes over time; schedule promotions ahead of peaks and use troughs for retention campaigns.'])}
const fr=mean(cu.map(c=>c.F));I.push(['Purchasing behaviour',`Customers average ${fx(fr)} purchases; high-value customers average ${fx(mean(hv.map(c=>c.F)))} purchases and ${money(mean(hv.map(c=>c.M)))} total spend.`,'If frequency drives value, focus on repeat-purchase programs; if not, focus on basket size.']);return I}

function reportMd(){const{rows,cu,tot,hp,thr}=S.v,I=insights(),C=S.cols;
return `# Customer Analysis Report\n_Generated ${new Date().toISOString().slice(0,10)}_\n\n## Executive Summary\n${I.slice(0,3).map(i=>'- **'+i[0]+':** '+i[1]).join('\n')}\n\n## Data Description\n- Source rows: ${S.raw.length}; analysed rows after filters: ${rows.length}; customers: ${cu.length}; total revenue: ${money(tot)}\n- Fields detected: ${Object.keys(C).map(k=>NM[k]).join(', ')}\n${S.log.map(l=>'- '+l.replace(/<[^>]+>/g,'')).join('\n')}\n\n## Key Findings\n${I.map(i=>`### ${i[0]}\n${i[1]}\n\n**Why it matters:** ${i[2]}\n`).join('\n')}\n## Segmentation Definition\nHigh-value customers = total spend ≥ ${hp}th percentile (${money(thr)}).\n\n## Recommendations\n${I.map(i=>'- '+i[2]).join('\n')}\n`}
function rRep(){$('#p-rep').innerHTML=`<div class="card"><h4>Analytical report</h4><p>Auto-generated from the current filters and parameters. Download as Markdown from the header.</p><div class="report">${reportMd().replace(/&/g,'&amp;').replace(/</g,'&lt;')}</div></div>`}

// ---------- Events ----------
function dl(name,txt,type){if(window.parent!==window){parent.postMessage({ci:'save',filename:name,data:txt},'*');return}const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([txt],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)}
$('#dlcsv').onclick=()=>{const C=S.cols,k=Object.keys(C);dl('cleaned_customers.csv',Papa.unparse(S.v.rows.map(o=>Object.fromEntries(k.map(x=>[NM[x],x==='date'&&o[x]?o[x].toISOString().slice(0,10):o[x]])))),'text/csv')};
$('#dlrep').onclick=()=>dl('customer_analysis_report.md',reportMd(),'text/markdown');
$('#file').onchange=e=>{const f=e.target.files[0];if(f)handleFile(f)};
const dz=$('#drop');['dragenter','dragover'].forEach(v=>dz.addEventListener(v,e=>{e.preventDefault();dz.classList.add('over')}));['dragleave','drop'].forEach(v=>dz.addEventListener(v,()=>dz.classList.remove('over')));
dz.addEventListener('drop',e=>{e.preventDefault();const f=e.dataTransfer&&e.dataTransfer.files[0];if(f)handleFile(f)});
let busy=false;
function runAnalyze(){if(!S.pend||busy)return;busy=true;const btn=$('#analyze'),rows=S.pend.rows,ld=$('#loading'),T=matchMedia('(prefers-reduced-motion: reduce)').matches?300:2600,
st=['Reading columns & detecting fields','Cleaning duplicates, missing values & outliers','Detecting currency & segmenting customers','Building charts & report'];
btn.disabled=true;btn.innerHTML='<span class="bs"></span> Analyzing…';$('#empty').classList.add('hide');$('#app').classList.add('hide');ld.classList.remove('hide');
$('#lf').textContent=`${S.pend.name} · ${rows.length.toLocaleString()} rows`;$('#ls').innerHTML=st.map((s,i)=>`<li id="s${i}"><i></i>${s}</li>`).join('');
const bar=$('#lp');bar.style.transition='none';bar.style.width='0';void bar.offsetWidth;bar.style.transition=`width ${T}ms cubic-bezier(.4,0,.2,1)`;bar.style.width='100%';
st.forEach((_,i)=>{setTimeout(()=>$('#s'+i).className='act',i*T/4);setTimeout(()=>$('#s'+i).className='done',(i+1)*T/4-80)});
ld.scrollIntoView({behavior:'smooth',block:'nearest'});
setTimeout(()=>{ld.classList.add('hide');try{ingest(rows)}finally{busy=false;btn.disabled=false;btn.textContent='Analyze data';if(S.raw)$('#app').classList.remove('hide');else $('#empty').classList.remove('hide')}$('#app').scrollIntoView({behavior:'smooth',block:'start'});if(S.raw)saveHist(S.pend.name,rows,S.pend.fromHist)},T+150)}
$('#analyze').onclick=runAnalyze;
$('#cur').onchange=()=>{if(S.raw){applyCur();render()}};
$('#tabs').onclick=e=>{const t=e.target.closest('.tab');if(t){S.tab=t.dataset.t;render()}};
['#ab','#hp','#a0','#a1','#d0','#d1','#loc','#cat'].forEach(s=>$(s).addEventListener(s==='#ab'||s==='#hp'?'input':'change',()=>S.raw&&render()));
['#dedupe','#outl'].forEach(s=>$(s).onchange=()=>S.raw&&build());
$('#reset').onclick=()=>{S.raw&&(initFilters(),render())};
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>S.raw&&render());

// ---------- Demo data ----------
$('#demo').onclick=()=>{let s=42;const R=()=>(s=(s*16807)%2147483647)/2147483647,pick=a=>a[Math.floor(R()*a.length)];
const locs=['Mumbai','Delhi','Bengaluru','Shimla','Pune','Chennai'],cats=['Bronze','Silver','Gold','Platinum'],mult={Bronze:.7,Silver:1,Gold:1.5,Platinum:2.4};
const cust=Array.from({length:380},(_,i)=>{const a=Math.round(18+Math.abs((R()+R()+R()-1.5))*45+8);return{id:'C'+String(1001+i),age:Math.min(a,75),g:pick(['Female','Male','Female','Male','Other']),l:pick(locs),c:pick(['Bronze','Bronze','Silver','Silver','Gold','Platinum']),w:Math.pow(R(),2.2)*6+.3}});
const rows=[];for(let i=0;i<1900;i++){let c,t=R()*cust.reduce((a,x)=>a+x.w,0);for(c of cust){t-=c.w;if(t<=0)break}
const m=Math.floor(R()*12),d=new Date(2025,m,1+Math.floor(R()*28)),season=[1,.9,.95,1,1.05,1,.95,1,1.1,1.2,1.5,1.7][m];
if(R()>season/1.7)continue;rows.push({CustomerID:c.id,Age:R()<.03?null:c.age,Gender:c.g,Location:c.l,Category:c.c,PurchaseDate:d.toISOString().slice(0,10),Spending:Math.round((30+R()*90)*mult[c.c]*(R()<.015?8:1)*100)/100})}
rows.push(...rows.slice(0,12));ingest(rows,'USD');S.pend={rows,name:'Demo data (synthetic)'};saveHist('Demo data (synthetic)',rows)};

// ---------- History: IndexedDB (max 10 datasets) with in-memory fallback ----------
const H={db:null,mode:'idb',MAX:10,ready:false,mem:{sets:new Map(),idx:new Map(),meta:new Map()},arm:0};
const idb=(st,mode,fn)=>new Promise((res,rej)=>{try{const t=H.db.transaction(st,mode),r=fn(t.objectStore(st));t.oncomplete=()=>res(r&&r.result);t.onerror=t.onabort=()=>rej(t.error)}catch(e){rej(e)}});
async function hInit(){try{await new Promise((res,rej)=>{const r=indexedDB.open('customer-insights',1);r.onupgradeneeded=()=>['sets','idx','meta'].forEach(n=>r.result.createObjectStore(n));r.onsuccess=()=>{H.db=r.result;res()};r.onerror=r.onblocked=()=>rej(r.error)});await hPut('meta','_t',1)}catch(e){H.mode='mem'}H.ready=true}
const hPut=(st,k,v)=>H.mode==='idb'?idb(st,'readwrite',s=>s.put(v,k)):(H.mem[st].set(k,v),Promise.resolve());
const hGet=(st,k)=>H.mode==='idb'?idb(st,'readonly',s=>s.get(k)):Promise.resolve(H.mem[st].get(k));
const hDelK=(st,k)=>H.mode==='idb'?idb(st,'readwrite',s=>s.delete(k)):(H.mem[st].delete(k),Promise.resolve());
const hAll=st=>H.mode==='idb'?idb(st,'readonly',s=>s.getAll()):Promise.resolve([...H.mem[st].values()]);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const hid=(n,rows)=>{const s=n+'|'+rows.length+'|'+JSON.stringify(rows[0])+JSON.stringify(rows[rows.length-1]);let h=5381;for(let i=0;i<s.length;i++)h=(h*33^s.charCodeAt(i))>>>0;return h.toString(36)};
function hNote(t,warn){const n=$('#hnote');n.textContent=t;n.style.color=warn?'var(--wn)':''}
async function saveHist(name,rows,touch){if(!H.ready)return;try{const id=hid(name,rows),meta={id,name,n:rows.length,f:Object.keys(S.cols||{}).length,cur:S.cur||'NONE',t:Date.now()};
if(!touch||!(await hGet('sets',id)))await hPut('sets',id,rows);await hPut('idx',id,meta);await hPut('meta','last',id);
const all=(await hAll('idx')).sort((a,b)=>b.t-a.t);for(const m of all.slice(H.MAX)){await hDelK('idx',m.id);await hDelK('sets',m.id)}
S.hid=id;await hRender()}catch(e){hNote('Could not save this dataset to history ('+((e&&e.name)||'storage error')+') - it may be too large for browser storage.',1)}}
const fmtT=t=>new Date(t).toLocaleString(undefined,{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});
async function hRender(){const all=(await hAll('idx')).sort((a,b)=>b.t-a.t);$('#hc').textContent=`(${all.length}/${H.MAX})`;
const item=m=>`<div class="hi ${m.id===S.hid?'on':''}"><button class="hl" data-act="load" data-id="${m.id}" title="Open this dataset"><b>${esc(m.name)}</b><small>${m.n.toLocaleString()} rows · ${m.f} fields${CURS[m.cur]&&CURS[m.cur].sym?' · '+CURS[m.cur].sym:''} · ${fmtT(m.t)}</small></button><button class="hx" data-act="del" data-id="${m.id}" aria-label="Delete ${esc(m.name)} from history">×</button></div>`;
$('#hist').innerHTML=all.length?all.map(item).join('')+'<button class="btn g" data-act="clear" style="width:100%;margin-top:8px;padding:6px">Clear history</button>':'<p class="sub">No saved datasets yet. Every file you analyze is saved here (up to 10).</p>';
$('#histm').innerHTML=all.length?'<h3 style="margin:24px 0 8px;font-size:12px;color:var(--mu);text-transform:uppercase;letter-spacing:.8px">Recent datasets</h3>'+all.map(item).join(''):'';
hNote(H.mode==='mem'?'Browser storage is blocked here, so history lasts for this session only.':'Saved in this browser only.',H.mode==='mem')}
function stageUI(name,rows){const h=Object.keys(rows[0]),C=detect(h);$('#stage').classList.remove('hide');$('#fn').textContent=name;$('#fm').textContent=`${rows.length.toLocaleString()} rows · ${h.length} columns · detected: ${Object.keys(C).map(k=>NM[k]).join(', ')}`;$('#analyze').disabled=!C.sp}
document.addEventListener('click',async e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=b.dataset.id;
if(a==='load'){const rows=await hGet('sets',id),m=await hGet('idx',id);if(!rows||!m){await hRender();return}S.pend={rows,name:m.name,fromHist:true};stageUI(m.name,rows);runAnalyze()}
else if(a==='del'){await hDelK('idx',id);await hDelK('sets',id);if((await hGet('meta','last'))===id)await hPut('meta','last','');await hRender()}
else if(a==='clear'){if(!H.arm){b.textContent='Click again to confirm';H.arm=setTimeout(()=>{H.arm=0;b.textContent='Clear history'},3000);return}clearTimeout(H.arm);H.arm=0;for(const m of await hAll('idx')){await hDelK('idx',m.id);await hDelK('sets',m.id)}await hPut('meta','last','');await hRender()}});
const saveSettings=()=>{if(H.ready)hPut('meta','settings',{ab:+$('#ab').value,hp:+$('#hp').value,cur:$('#cur').value,dedupe:$('#dedupe').checked,outl:$('#outl').checked}).catch(()=>{})};
['#ab','#hp','#cur','#dedupe','#outl'].forEach(s=>$(s).addEventListener('change',saveSettings));
(async()=>{await hInit();const st=await hGet('meta','settings').catch(()=>null);
if(st){[['ab','#ab'],['hp','#hp'],['cur','#cur']].forEach(([k,s])=>{if(st[k]!=null)$(s).value=st[k]});['dedupe','outl'].forEach(k=>{if(st[k]!=null)$('#'+k).checked=st[k]})}
await hRender();const id=await hGet('meta','last').catch(()=>'');
if(id){const rows=await hGet('sets',id),m=await hGet('idx',id);if(rows&&m){S.pend={rows,name:m.name,fromHist:true};S.hid=id;stageUI(m.name,rows);ingest(rows);$('#fm').textContent+=' · restored from history';await hRender()}}})();
