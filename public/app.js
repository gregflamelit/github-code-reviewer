const $=selector=>document.querySelector(selector);
let currentId=null, timer=null, catalog=null, selectedRubricId='ai_product_manager';
const running=new Set(['queued','collecting','evaluating']);
const el=(tag,props={},children=[])=>{const n=document.createElement(tag);for(const [k,v]of Object.entries(props)){if(k==='text')n.textContent=v;else if(k==='class')n.className=v;else n.setAttribute(k,v);}for(const child of children)n.append(child);return n;};
const number=n=>n==null?'—':n.toFixed(1);
async function api(path,options={}){const res=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});const body=await res.json();if(!res.ok)throw new Error(body.error||'Request failed');return body;}
function showError(message){$('#form-error').textContent=message;$('#form-error').hidden=false;}
async function history(){const reviews=await api('/api/reviews');$('#history').replaceChildren(...reviews.map(r=>{const b=el('button',{class:'history-item'+(r.id===currentId?' selected':''),type:'button'},[el('span',{text:r.repository?.fullName||r.url.replace('https://github.com/','')}),el('small',{text:r.status+' · '+new Date(r.createdAt).toLocaleDateString()})]);b.onclick=()=>openReview(r.id);return b;}));if(!reviews.length)$('#history').append(el('p',{class:'muted',text:'No evaluations yet'}));}
async function checkHealth(){try{const h=await api('/api/health');$('#connection').textContent=h.ready?'● Codex connected':'○ Codex unavailable';$('#connection').className='connection '+(h.ready?'ready':'failed');$('#connection').title=h.codex; if(!h.ready)showError(h.codex);}catch(e){$('#connection').textContent='Connection unavailable';showError(e.message);}}
$('#new-review').onclick=()=>{clearTimeout(timer);currentId=null;window.history.replaceState(null,'','/');$('#setup').hidden=false;$('#review').hidden=true;$('#repo-url').focus();history().catch(showError);};
$('#review-form').onsubmit=async event=>{event.preventDefault();$('#form-error').hidden=true;$('#submit').disabled=true;try{const r=await api('/api/reviews',{method:'POST',body:JSON.stringify({url:$('#repo-url').value.trim()})});await openReview(r.id);}catch(e){showError(e.message);}finally{$('#submit').disabled=false;}};
async function openReview(id){clearTimeout(timer);currentId=id;window.history.replaceState(null,'','/#'+id);$('#setup').hidden=true;$('#review').hidden=false;$('#review-title').textContent='Loading evaluation…';await poll();history().catch(showError);}
async function poll(){const id=currentId;if(!id)return;try{const r=await api('/api/reviews/'+id);if(currentId!==id)return;render(r);if(running.has(r.status))timer=setTimeout(poll,1800);else history().catch(()=>{});}catch(e){$('#review-error').hidden=false;$('#review-error').textContent=e.message;}}
function render(r){
  const reviewCatalog=r.catalog||catalog;
  $('#rubric-version').textContent='Criteria '+reviewCatalog.rubric.rubric_version+' · Scoring '+(r.scoringVersion||reviewCatalog.scoringConfig.rubric_version);
  $('#review-title').textContent=r.repository?.fullName||r.url.replace('https://github.com/','');
  $('#review-meta').textContent=['Three rubric reports',r.repository?.sha?'Commit '+r.repository.sha.slice(0,12):'Resolving revision','Repository evidence only'].join('  ·  ');
  const busy=running.has(r.status);$('#progress').hidden=!busy;$('#status').textContent=r.status[0].toUpperCase()+r.status.slice(1);$('#progress-message').textContent=r.message;
  const incomplete=reviewCatalog.rubric.domains.some(d=>d.criteria.some(c=>!r.results?.some(row=>row.criterion_id===c.id)));
  $('#upgrade').hidden=r.status!=='completed'||(reviewCatalog.rubric.rubric_version===catalog.rubric.rubric_version&&reviewCatalog.scoringConfig.rubric_version===catalog.scoringConfig.rubric_version);
  $('#upgrade').onclick=async()=>{try{const newer=await api('/api/reviews/'+r.id+'/upgrade',{method:'POST',body:'{}'});await openReview(newer.id);}catch(e){$('#review-error').hidden=false;$('#review-error').textContent=e.message;}};
  $('#cancel').hidden=!busy;$('#retry').hidden=busy||(r.status==='completed'&&!incomplete);$('#retry').textContent=r.status==='completed'?'Complete saved evaluation':'Retry / resume';$('#export-all').hidden=!r.report;$('#export-all').href='/api/reviews/'+r.id+'/export';
  $('#review-error').hidden=busy||r.status==='completed';$('#review-error').textContent=r.message;
  $('#cancel').onclick=async()=>{try{await api('/api/reviews/'+r.id+'/cancel',{method:'POST',body:'{}'});}catch(e){$('#review-error').hidden=false;$('#review-error').textContent=e.message;}};
  $('#retry').onclick=async()=>{try{await api('/api/reviews/'+r.id+'/retry',{method:'POST',body:'{}'});await poll();}catch(e){$('#review-error').hidden=false;$('#review-error').textContent=e.message;}};
  $('#events').replaceChildren(...(r.events||[]).map(e=>el('li',{text:new Date(e.at).toLocaleTimeString()+' — '+e.message})));
  $('#metrics').hidden=!r.report;$('#report-notice').hidden=!r.report;$('#summaries').hidden=!r.report;$('#rubric-cards').hidden=!r.report;$('#selected-report-heading').hidden=!r.report;$('#rubric-weights').hidden=!r.report;
  $('#domains').replaceChildren();
  if(r.report){
    const reports=r.reports||[r.report];
    const report=reports.find(report=>report.rubricId===selectedRubricId)||reports[0];
    $('#rubric-cards').replaceChildren(...reports.map(item=>{const b=el('button',{type:'button',class:'rubric-card'+(item.rubricId===report.rubricId?' selected':''),'aria-pressed':String(item.rubricId===report.rubricId)},[el('span',{class:'rubric-card-name',text:item.rubricName}),el('strong',{text:number(item.score)}),el('span',{class:'rubric-card-coverage',text:number(item.coverage)+'% evidence coverage'}),el('span',{class:'rubric-card-band',text:item.band})]);b.onclick=()=>{selectedRubricId=item.rubricId;render(r);};return b;}));
    $('#selected-report-name').textContent=report.rubricName;
    $('#export').href='/api/reviews/'+r.id+'/export?rubric='+encodeURIComponent(report.rubricId);
    $('#rubric-weight-content').replaceChildren(el('p',{text:'Same evidence and criterion assessments; independent weights, coverage, and role requirements. Weights below reflect applicable-skill normalization.'}),el('ul',{},report.domains.map(d=>el('li',{text:d.name+': '+number(d.weight*100)+'%'+(!d.applicable?' (not applicable)':'')}))),el('p',{text:report.blockers.length?'Required evidence gaps: '+report.blockers.map(b=>b.id+' — '+b.reason).join('; '):'Role requirements meet the evidence coverage threshold.'}));
    $('#metrics').replaceChildren(...[['Observed maturity',number(report.score),report.band],['Evidence coverage',number(report.coverage)+'%','Unknown is separate from failure'],['Possible score range',number(report.lower)+'–'+number(report.upper),'Bounds for unobserved criteria; not statistical confidence']].map(([label,value,caption])=>el('article',{class:'metric'},[el('label',{text:label}),el('b',{text:value}),el('p',{text:caption})])));
    $('#report-notice').textContent='This report assesses repository artifacts, not a person’s proficiency. '+(!report.eligible?'The evidence is insufficient for an overall maturity band under this rubric. ':'')+(incomplete?'Resume to complete this review under its saved rubric. ':'')+(reviewCatalog.rubric.rubric_version!==catalog.rubric.rubric_version?'Historical rubric preserved. Use Evaluate latest rubric to assess new specialist criteria in a separate report. ':'')+(r.upgradedFrom?'This review reuses compatible assessments and the evidence snapshot of an earlier review. ':'')+'Open each domain to inspect findings and scoring anchors. Each rubric calculates its own score and coverage; citation checks verify source locations, not every conclusion.';
    $('#summaries').textContent=(r.summaries||[]).join('\n\n');
    for(const domain of report.domains){
      const def=reviewCatalog.rubric.domains.find(d=>d.id===domain.id);
      const rows=domain.rows.map(row=>{
        const criterion=def.criteria.find(c=>c.id===row.criterion_id);
        const refs=row.evidence.map(ref=>el('div',{class:'evidence'},[el('a',{href:ref.url,target:'_blank',rel:'noreferrer',text:ref.evidence_id+' · '+ref.path+' · lines '+ref.start_line+'–'+ref.end_line}),el('pre',{text:ref.quote})]));
        const anchors=el('details',{class:'scoring-anchor'},[el('summary',{text:'Scoring anchors · '+criterion.domain_weight_percent+'% of this domain'}),...(criterion.level_2_requirement?[el('p',{text:'2 — Functional: '+criterion.level_2_requirement})]:[]),el('p',{text:'3 — Robust: '+criterion.level_3_requirement}),...(criterion.level_4_requirement?[el('p',{text:'4 — Validated: '+criterion.level_4_requirement})]:[]),el('p',{text:'Evidence to seek: '+criterion.github_evidence.join('; ')})]);
        return el('article',{class:'criterion'},[el('div',{class:'criterion-top'},[el('h3',{text:row.criterion_id+' '+criterion.name}),el('span',{class:'pill',text:(row.score==null?row.status.replace('_',' '):row.score+'/4')+' · '+row.confidence+' confidence'})]),el('p',{text:row.rationale}),anchors,...refs,el('p',{class:'next',text:'Next validation: '+(row.next_validation||'No further validation specified.')})]);
      });
      $('#domains').append(el('details',{class:'domain'},[el('summary',{},[el('span',{class:'domain-name',text:domain.id+' '+domain.name}),el('span',{class:'domain-score',text:domain.applicable?number(domain.score)+'/100':'Not applicable'}),el('span',{class:'coverage',text:domain.applicable?number(domain.coverage)+'% evidence coverage':'Excluded with contextual evidence'})]),el('div',{class:'criteria'},rows)]));
    }
  }
  $('#collection-details').hidden=!r.evidence;
  $('#collection-content').replaceChildren(el('p',{text:(r.evidence?.length||0)+' evidence items · '+(r.repository?.totalFiles||0)+' repository files · '+(r.repository?.collectedAt||'')}),el('code',{text:r.repository?.sha||''}),el('ul',{},[...(r.warnings||[]),...(r.validationWarnings||[])].map(text=>el('li',{text}))));
}
try{catalog=await api('/api/rubric');$('#criterion-total').textContent=catalog.rubric.domains.reduce((sum,d)=>sum+d.criteria.length,0)+' criteria across '+catalog.rubric.domains.length+' domains, including three specialist assessments.';$('#rubric-version').textContent='Criteria '+catalog.rubric.rubric_version+' · Scoring '+catalog.scoringConfig.rubric_version;await history();void checkHealth();if(/^[a-f0-9-]{36}$/.test(location.hash.slice(1)))await openReview(location.hash.slice(1));}catch(e){showError(e.message);}
