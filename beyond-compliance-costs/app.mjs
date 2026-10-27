import{FIRMS,SCENARIOS,DEFAULTS,cleanState,calculate,savingsProfile,classify}from'./model.mjs';
const $=id=>document.getElementById(id);
const fmt=(n,d=2)=>Number(n).toLocaleString('en-AU',{minimumFractionDigits:d,maximumFractionDigits:d});
const money=(n,d=2)=>'A$'+fmt(n,d)+'m';
const signedMoney=(n,d=2)=>(n<0?'−':'+')+money(Math.abs(n),d);
let state=cleanState(Object.fromEntries(new URLSearchParams(location.search)));
let lastViewportKind=null;let view='3d', timer, rendering=false, pending=false, plotReady=false, has3d=!!window.Plotly;
const phoneCamera={eye:{x:2.7,y:2.7,z:1.8},center:{x:0,y:0,z:0}};const camera={eye:{x:1.65,y:1.65,z:1.05},center:{x:0,y:0,z:-.08}};
const labels={equivalent:'Equivalent annual basis',first:'First-year basis',ongoing:'Ongoing-year basis'};
function toast(t){$('toast').textContent=t;$('toast').style.display='block';clearTimeout(window.toastTimer);window.toastTimer=setTimeout(()=>$('toast').style.display='none',3500);}
function viewURL(){const u=new URL(location.href);u.search='';for(const[k,v]of Object.entries(state))u.searchParams.set(k,v);u.hash='explore';return u.href;}
function syncControls(){for(const k of ['basis','loss','risk','realized','years','discount'])$(k).value=state[k];document.querySelectorAll('[data-scenario]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.scenario===state.scenario)));}
function update(pushURL=true){
 state=cleanState(state);syncControls();
 const r=calculate(state),s=state;
 $('scenario-note').textContent=r.profile.note;
 $('loss-out').textContent=money(s.loss,s.loss%1?1:0);
 $('risk-out').textContent=fmt(s.risk,2)+' pp';$('realized-out').textContent=fmt(s.realized,0)+'%';
 $('k-saving').textContent=money(r.annualSavings);$('k-scenario').textContent=r.profile.label+' · '+s.realized+'% realised';
 $('saving-label').textContent=s.basis==='first'?'Modelled first-year saving':s.basis==='ongoing'?'Modelled ongoing saving':'Equivalent annual saving';
 $('k-firm').textContent='A$'+fmt(r.perFirmAUD,0);$('k-firm-note').textContent=labels[s.basis];
 $('k-risk').textContent=fmt(r.thresholdPP,3)+' pp';$('k-loss').textContent='At '+money(s.loss,s.loss%1?1:0)+' loss per failure';
 $('basis-help').textContent=s.basis==='equivalent'?'Converts the full savings stream into an equivalent annual amount. NPV uses your appraisal period and discount rate.':s.basis==='first'?'Compares first-year savings and one year of expected harm. Appraisal settings do not change this one-year result.':'Compares recurring savings and one ongoing year of expected harm. Appraisal settings do not change this one-year result.';
 $('appraisal-controls').querySelectorAll('input,button').forEach(el=>el.disabled=s.basis!=='equivalent');
 $('result-label').textContent=s.basis==='equivalent'?s.years+'-year discounted net benefit':s.basis==='first'?'First-year net benefit':'Ongoing annual net benefit';
 const result=r.npv??r.net;
 $('result-value').textContent=Math.abs(result)<1e-8?money(0):signedMoney(result);
 $('result-value').parentElement.parentElement.classList.toggle('negative',result<0);
 const conclusion=Math.abs(result)<1e-8?'The selected assumptions are at break-even.':result>0?'Savings exceed additional expected harm under the selected assumptions.':'Additional expected harm exceeds savings under the selected assumptions.';
 $('result-message').textContent=conclusion+' The break-even additional annual risk is '+fmt(r.thresholdPP,3)+' percentage points.';
 $('surface-subtitle').textContent=s.basis==='equivalent'?'Discounted net benefit · A$ million · '+s.years+' years at '+s.discount+'% real':'Net benefit · A$ million · '+(s.basis==='first'?'first year':'ongoing year');
 const rows=[
 ['Time basis',labels[s.basis]],['Savings realised',fmt(s.realized,2)+'%'],['Annual saving in selected basis',money(r.annualSavings,6)],['Saving per company','A$'+fmt(r.perFirmAUD,6)],
 ['Additional annual risk',fmt(s.risk,6)+' percentage points'],['Expected additional failures per year',fmt(FIRMS*s.risk/100,6)],
 ['Annual expected social harm',money(r.annualHarm,6)],['Annual net benefit in selected basis',signedMoney(r.net,6)],['Break-even additional annual risk',fmt(r.thresholdPP,9)+' percentage points'],
 ['Additional expected failures at break-even per year',fmt(r.extraFailures,6)],['Reciprocal at break-even',r.reciprocal===null?'No positive harm capacity':'One per '+fmt(r.reciprocal,6)+' company-years']];
 if(s.basis==='equivalent')rows.push(['Annuity factor',fmt(r.profile.factor,9)],['Present value of realised savings',money(r.pvSavings,6)],['Present value of expected harm',money(r.pvHarm,6)],['Net present value',signedMoney(r.npv,6)]);
 $('exact-results').innerHTML=rows.map(([a,b])=>'<tr><th scope="row">'+a+'</th><td>'+b+'</td></tr>').join('');
 compare();draw2d(r);
 $('linkedin').href='https://www.linkedin.com/sharing/share-offsite/?url='+encodeURIComponent(viewURL());
 if(pushURL){const u=new URL(viewURL());u.hash=location.hash;history.replaceState(null,'',u);}
 clearTimeout(timer);timer=setTimeout(draw3d,130);
}
function compare(){
 const data=['earlier','treasury','mandala'].map(k=>({k,...savingsProfile(k,state.years,state.discount/100)}));
 const max=Math.max(...data.map(s=>s.equivalent));
 $('savings-bars').innerHTML=data.map(s=>'<div class="bar-row"><div class="bar-label"><span>'+s.label+'</span><strong>'+money(s.equivalent)+'</strong></div><div class="bar-track"><div class="bar-fill" style="width:'+s.equivalent/max*100+'%"></div></div></div>').join('');
 $('comparison-note').textContent='Equivalent annual savings at 100% realisation · '+state.years+' years · '+state.discount+'% real. Bars start at zero and share one scale.';
 $('comparison-caption').textContent='100% realisation · '+state.years+' years · '+state.discount+'% real · risk column uses equivalent annual savings and A$10m loss';
 $('comparison-rows').innerHTML=data.map(s=>'<tr><th scope="row">'+s.label+'</th><td>'+fmt(s.first,3)+'</td><td>'+fmt(s.ongoing,3)+'</td><td>'+fmt(s.equivalent,3)+'</td><td>'+fmt(s.equivalent/(FIRMS*10)*100,3)+'</td></tr>').join('');
}
function draw2d(r){
 const W=900,H=485,L=90,R=25,T=30,B=85,iw=W-L-R,ih=H-T-B;
 const x=v=>L+(v-1)/49*iw,y=v=>T+ih-v/6*ih;
 let g='';
 for(let v=0;v<=6;v++){g+='<line x1="'+L+'" y1="'+y(v)+'" x2="'+(W-R)+'" y2="'+y(v)+'" stroke="#d9cdd0"/><text x="'+(L-17)+'" y="'+(y(v)+6)+'" text-anchor="end">'+v+'</text>';}
 for(const v of[1,10,20,30,40,50])g+='<text x="'+x(v)+'" y="'+(H-B+32)+'" text-anchor="middle">'+v+'</text>';
 const colors={earlier:'#7194a4',treasury:'#163f52',mandala:'#a44f71'};
 const curves=['earlier','treasury','mandala'].map(k=>{
 const a=calculate({...state,scenario:k}).annualSavings;
 const path=Array.from({length:491},(_,i)=>{const loss=1+i/10;return(i?'L':'M')+x(loss).toFixed(2)+','+y(a/FIRMS/loss*100).toFixed(2);}).join(' ');
 return '<path d="'+path+'" fill="none" stroke="'+colors[k]+'" stroke-width="'+(k===state.scenario?5:2.5)+'"/>';
 }).join('');
 $('frontier').innerHTML='<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-labelledby="frontier-title frontier-desc"><title id="frontier-title">Break-even risk by loss per failure</title><desc id="frontier-desc">Curves show the largest additional annual risk at which savings equal expected harm. At the selected loss, the active scenario threshold is '+fmt(r.thresholdPP,3)+' percentage points. Values above 6 percentage points are outside the displayed axis.</desc><defs><clipPath id="clip"><rect x="'+L+'" y="'+T+'" width="'+iw+'" height="'+ih+'"/></clipPath></defs><g font-family="Georgia,serif" font-size="21" fill="#294952">'+g+'<line x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'" stroke="#46626b"/><g clip-path="url(#clip)">'+curves+'<line x1="'+x(state.loss)+'" y1="'+T+'" x2="'+x(state.loss)+'" y2="'+(H-B)+'" stroke="#64777a" stroke-dasharray="5,5"/><circle cx="'+x(state.loss)+'" cy="'+y(r.thresholdPP)+'" r="7" fill="#9a4868" stroke="#fff6f1" stroke-width="3"/><circle cx="'+x(state.loss)+'" cy="'+y(state.risk)+'" r="6" fill="#163f52" stroke="#fff6f1" stroke-width="2"/></g><text x="'+(W/2)+'" y="'+(H-18)+'" text-anchor="middle">Social loss per extra failure (A$ million)</text><text transform="translate(28 '+(H/2)+') rotate(-90)" text-anchor="middle">Additional annual risk (pp)</text><text x="390" y="78" fill="#9a4868" font-size="20">Above a curve: harm exceeds savings</text><text x="390" y="110" fill="#315e65" font-size="20">Below a curve: savings exceed harm</text></g></svg><p class="figure-note">Ocean: Treasury · blue: earlier costs · rose: Mandala. The thick curve is selected. Rose dot: break-even at your loss assumption; ocean dot: your chosen risk. Curves beyond 6 pp are outside this view. All curves use the selected time basis and savings realisation.</p>';
}
function showView(next){view=next;$('surface').hidden=view!=='3d';$('frontier').hidden=view!=='2d';$('reset-camera').hidden=view!=='3d';document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));if(view==='3d'&&plotReady)Plotly.Plots.resize($('surface'));}
function fail3d(){has3d=false;$('chart-fallback').hidden=false;showView('2d');document.querySelector('[data-view="3d"]').disabled=true;}
async function draw3d(){
 if(!has3d){fail3d();return;}if(rendering){pending=true;return;}rendering=true;
 try{
 const viewportKind=$('surface').clientWidth<500?'mobile':'desktop';const resetView=lastViewportKind!==viewportKind;const selectedCamera=viewportKind==='mobile'?phoneCamera:camera;const r=calculate(state),pv=state.basis==='equivalent',factor=pv?r.profile.factor:1;
 const xs=Array.from({length:36},(_,i)=>1+i*49/35),ys=Array.from({length:31},(_,i)=>i/5);
 const zs=ys.map(p=>xs.map(l=>(r.annualSavings-FIRMS*l*p/100)*factor));
 const min=Math.min(...zs.flat()),max=Math.max(...zs.flat()),zero=(0-min)/(max-min);
 const colorScale=max>0?[[0,'#b65f7e'],[Math.max(0,zero*.7),'#dca6b9'],[zero,'#f8f1ee'],[1,'#245e70']]:[[0,'#b65f7e'],[1,'#f8f1ee']];
 const lineX=[],lineY=[];
 for(let i=0;i<=200;i++){const l=1+i*49/200,p=r.annualSavings/FIRMS/l*100;if(p>=0&&p<=6){lineX.push(l);lineY.push(p);}}
 const data=[
 {type:'surface',name:'Net benefit',x:xs,y:ys,z:zs,colorscale:colorScale,cmin:min,cmax:max,showscale:false,opacity:.97,contours:{z:{show:true,usecolormap:false,color:'#d7b3bf',width:1}},hovertemplate:'Loss: A$%{x:.2f}m<br>Extra risk: %{y:.3f} pp<br>Net benefit: A$%{z:,.2f}m<extra></extra>'},
 {type:'surface',x:[1,50],y:[0,6],z:[[0,0],[0,0]],colorscale:[[0,'#536d73'],[1,'#536d73']],opacity:.14,showscale:false,hoverinfo:'skip',name:'Zero plane'},
 {type:'scatter3d',mode:'lines',x:lineX,y:lineY,z:lineX.map(()=>0),line:{color:'#163f52',width:7},hovertemplate:'Break-even<br>Loss: A$%{x:.2f}m<br>Extra risk: %{y:.3f} pp<extra></extra>',showlegend:false},
 {type:'scatter3d',mode:'markers',x:[state.loss],y:[state.risk],z:[r.net*factor],marker:{size:6,color:'#163f52',line:{color:'#fff7f1',width:2}},name:'Your assumptions',hovertemplate:'Your assumptions<br>Loss: A$%{x:.2f}m<br>Extra risk: %{y:.3f} pp<br>Net benefit: A$%{z:,.2f}m<extra></extra>',showlegend:false}
 ];
 const axis={showbackground:true,backgroundcolor:'#f8f1ee',gridcolor:'#d9ccce',zerolinecolor:'#8d999b',tickfont:{family:'Georgia',size:15},title:{font:{family:'Georgia',size:17}},showspikes:false};
 const layout={autosize:true,paper_bgcolor:'#f8f1ee',plot_bgcolor:'#f8f1ee',font:{family:'Georgia,serif',size:17,color:'#163f52'},margin:{l:10,r:10,t:15,b:10},showlegend:false,uirevision:'retain-camera-'+viewportKind,scene:{camera:resetView?selectedCamera:undefined,aspectmode:'manual',aspectratio:{x:1.25,y:1,z:.8},xaxis:{...axis,title:{text:'Loss per failure (A$m)',font:{size:17}},range:[1,50],tickvals:[1,10,20,30,40,50]},yaxis:{...axis,title:{text:viewportKind==='mobile'?'Extra risk (pp)':'Extra annual risk (pp)',font:{size:17}},range:[0,6],dtick:1},zaxis:{...axis,title:{text:pv?'NPV (A$m)':'Net benefit (A$m)',font:{size:17}},tickformat:viewportKind==='mobile'?'~s':',.0f',nticks:5}}};
 await Plotly.react($('surface'),data,layout,{responsive:true,displaylogo:false,scrollZoom:true,modeBarButtonsToRemove:['toImage','resetCameraLastSave3d'],displayModeBar:'hover'});
 lastViewportKind=viewportKind;if(!plotReady){$('surface').on('plotly_webglcontextlost',fail3d);plotReady=true;}
 }catch(error){console.error('3D rendering failed',error);fail3d();}
 finally{rendering=false;if(pending){pending=false;draw3d();}}
}
for(const k of['basis','loss','risk','realized','years','discount'])$(k).addEventListener('input',()=>{
 if($(k).value===''||!$(k).checkValidity())return;
 state[k]=k==='basis'?$(k).value:Number($(k).value);update();
});
document.querySelectorAll('[data-scenario]').forEach(b=>b.addEventListener('click',()=>{state.scenario=b.dataset.scenario;update();}));
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>showView(b.dataset.view)));
document.querySelectorAll('[data-discount]').forEach(b=>b.addEventListener('click',()=>{state.discount=Number(b.dataset.discount);update();}));
$('reset').addEventListener('click',()=>{state={...DEFAULTS};update();toast('Default assumptions restored');});
$('reset-camera').addEventListener('click',()=>{if(plotReady)Plotly.relayout($('surface'),{'scene.camera':$('surface').clientWidth<500?phoneCamera:camera});});
window.addEventListener('popstate',()=>{state=cleanState(Object.fromEntries(new URLSearchParams(location.search)));update(false);});
document.querySelectorAll('.share-link').forEach(b=>b.addEventListener('click',async()=>{
 const url=viewURL();try{await navigator.clipboard.writeText(url);toast('Link copied with your selected assumptions');}catch{$('share-url').value=url;$('share-dialog').showModal();$('share-url').select();}
}));
$('close-share').addEventListener('click',()=>$('share-dialog').close());
$('export').addEventListener('click',()=>{
 const r=calculate(state),esc=v=>'"'+String(v).replaceAll('"','""')+'"';
 const rows=[['Beyond Compliance Costs — calculation export',''],['Evidence date','2026-10-27'],['Share URL',viewURL()],['Currency','AUD; monetary model values in millions'],['Scenario',SCENARIOS[state.scenario].label],...Object.entries(state),...Object.entries(r).filter(([k,v])=>!['state','profile'].includes(k)&&v!==null),['first_year_gross_m',r.profile.first],['ongoing_gross_m',r.profile.ongoing],['equivalent_annual_gross_m',r.profile.equivalent],['annuity_factor',r.profile.factor],['Caveat','Decision threshold; no forecast. Rounded source estimates. Original model workbook not supplied.']];
 const a=document.createElement('a');const u=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(row=>row.map(esc).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8'}));a.href=u;a.download='beyond-compliance-costs-'+state.scenario+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);
});
function company(){
 const inputs=['revenue','assets','employees'].map(k=>$(k));if(inputs.some(el=>el.value===''||!el.checkValidity())){$('company-result').textContent='Enter nonnegative values for all three company measures.';return;}
 const result=classify(...inputs.map(el=>Number(el.value))),count=a=>a.filter(Boolean).length;
 $('company-result').innerHTML=(result.currentLarge&&!result.proposedLarge?'This example moves from large to small.':result.proposedLarge?'This example remains large under the proposal.':'This example is small under both size tests.')+'<small>Current: '+count(result.current)+' of 3 tests met · Proposed: '+count(result.proposed)+' of 3 tests met</small>';
 const tests=[['Revenue','A$50m','A$100m'],['Gross assets','A$25m','A$50m'],['Employees','100 FTE','100 FTE']];
 $('threshold-rows').innerHTML=tests.map(([name,a,b],i)=>'<tr><th scope="row">'+name+'</th><td class="'+(result.current[i]?'pass':'fail')+'">'+a+' · '+(result.current[i]?'met ✓':'not met')+'</td><td class="'+(result.proposed[i]?'pass':'fail')+'">'+b+' · '+(result.proposed[i]?'met ✓':'not met')+'</td></tr>').join('');
}
for(const k of['revenue','assets','employees'])$(k).addEventListener('input',company);
async function sources(){try{const response=await fetch('data/source-register.json');if(!response.ok)throw new Error('Source register unavailable');const d=await response.json();$('sources').replaceChildren(...d.sources.map(s=>{const el=document.createElement('div');el.className='source-item';const title=document.createElement(s.url?'a':'strong');title.textContent=s.title+(s.url?' ↗':'');if(s.url){title.href=s.url;title.target='_blank';title.rel='noopener';}el.append(title);const desc=document.createElement('p');desc.textContent=s.date+' · '+s.location+'. '+s.supports;el.append(desc);return el;}));}catch{$('sources').textContent='The machine-readable source register could not load. Source links and the full audit remain in the page; reload to try again.';}}
window.addEventListener('resize',()=>{clearTimeout(timer);timer=setTimeout(draw3d,200);});update(false);company();sources();





