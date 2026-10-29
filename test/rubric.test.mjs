import test from 'node:test';
import assert from 'node:assert/strict';
import {rubric,aggregate,aggregateAll,scoringConfig,validateResults,legacyCatalog,getReviewCatalog} from '../src/rubric.mjs';
const all=(score=3)=>rubric.domains.flatMap(d=>d.criteria.map(c=>({criterion_id:c.id,status:'scored',score,confidence:'high',rationale:'Direct evidence',evidence:[],next_validation:''})));
test('104 criteria include 36 specialist criteria with normalized domain weights',()=>{
  assert.equal(rubric.domains.flatMap(d=>d.criteria).length,104);
  assert.equal(new Set(rubric.domains.flatMap(d=>d.criteria.map(c=>c.id))).size,104);
  for(const d of rubric.domains)assert.equal(d.criteria.reduce((s,c)=>s+c.domain_weight_percent,0),100);
  assert.equal(rubric.domains.filter(d=>d.pool==='role').flatMap(d=>d.criteria).length,36);
  assert.equal(rubric.domains.filter(d=>d.pool==='core').reduce((s,d)=>s+d.weight,0),60);
  assert.equal(rubric.domains.filter(d=>d.pool==='functional').reduce((s,d)=>s+d.weight,0),100);
});
test('worked scores and missing core evidence match the specification',()=>{
  let rows=all();for(const r of rows)if(r.criterion_id.startsWith('C2.')||r.criterion_id.startsWith('C3.'))r.score=2;
  let report=aggregate(rows,'comprehensive');assert.ok(Math.abs(report.score-67.5)<1e-8);assert.ok(Math.abs(report.coverage-100)<1e-8);assert.equal(report.band,'Functional');
  rows=rows.map(r=>r.criterion_id.startsWith('C4.')?{...r,status:'unknown',score:null}:r);
  report=aggregate(rows,'comprehensive');assert.ok(Math.abs(report.coverage-85)<1e-8);assert.ok(Math.abs(report.lower-56.25)<1e-8);assert.ok(Math.abs(report.upper-71.25)<1e-8);assert.equal(report.eligible,false);
});
test('not applicable functional skills renormalize; unknown skills do not',()=>{
  const rows=all(4).map(r=>r.criterion_id.startsWith('F8.')?{...r,status:'not_applicable',score:null}:r);
  const report=aggregate(rows,'comprehensive');assert.ok(Math.abs(report.score-100)<1e-8);assert.ok(Math.abs(report.coverage-100)<1e-8);
  const unknown=aggregate(rows.map(r=>r.criterion_id.startsWith('F7.')?{...r,status:'unknown',score:null}:r),'comprehensive');assert.ok(unknown.coverage<100);assert.ok(Math.abs(unknown.score-100)<1e-8);
});
test('strong overall score cannot conceal weak core capability',()=>{
  const rows=all(4).map(r=>r.criterion_id.startsWith('C2.')?{...r,score:1}:r);
  assert.equal(aggregate(rows,'application').band,'Uneven');
});
test('empty evidence yields null score and full uncertainty',()=>{
  const report=aggregate([],'comprehensive');assert.equal(report.score,null);assert.equal(report.coverage,0);assert.equal(report.lower,0);assert.equal(report.upper,100);
});
test('all three rubric weight systems independently sum to 100 percent',()=>{
  for(const lens of scoringConfig.rubrics){assert.equal(Object.values(lens.core_weights_percent).reduce((s,w)=>s+w,0)+lens.functional_pool_percent+lens.role_pool_percent,100);assert.equal(Object.values(lens.functional_weights_percent).reduce((s,w)=>s+w,0),100);}
});
test('same assessments yield independently weighted engineering and data science scores',()=>{
  const rows=all(4).map(r=>['F4','F5','F6'].includes(r.criterion_id.split('.')[0])?{...r,score:1}:r);
  const reports=aggregateAll(rows);assert.ok(Math.abs(reports[0].score-96.64)<1e-8);assert.ok(Math.abs(reports[1].score-98.425)<1e-8);assert.ok(Math.abs(reports[2].score-81.23125)<1e-8);
  assert.equal(reports[0].rubricName,'AI Product Manager');assert.equal(reports[1].rubricName,'AI Engineering Rubric');assert.equal(reports[2].rubricName,'AI Data Science Rubric');
});
test('zero-weight data science criteria do not change engineering scores or coverage',()=>{
  const rows=all(4).map(r=>r.criterion_id.startsWith('F6.')?{...r,status:'unknown',score:null}:r);
  const reports=aggregateAll(rows);assert.ok(Math.abs(reports[1].score-100)<1e-8);assert.ok(Math.abs(reports[1].coverage-100)<1e-8);assert.ok(reports[2].coverage<90);assert.equal(reports[2].eligible,false);
});
test('data science role cannot receive a band when its central skill is not applicable',()=>{
  const rows=all(4).map(r=>r.criterion_id.startsWith('F6.')?{...r,status:'not_applicable',score:null}:r);
  const report=aggregateAll(rows)[2];assert.ok(Math.abs(report.score-100)<1e-8);assert.equal(report.eligible,false);assert.ok(report.blockers.some(b=>b.id==='F6'));
});
test('a specialist assessment changes only its own report and blocks an inflated band',()=>{
  const rows=all(4).map(r=>r.criterion_id.startsWith('R2.')?{...r,score:1}:r);
  const reports=aggregateAll(rows);assert.equal(reports[0].score,100);assert.equal(reports[1].score,77.5);assert.equal(reports[1].band,'Uneven');assert.equal(reports[2].score,100);
  for(const r of reports){assert.equal(r.domains.filter(d=>d.pool==='role').length,1);assert.equal(r.domains.find(d=>d.pool==='role').weight,.3);}
});
test('criterion weights affect specialist scores and evidence coverage',()=>{
  let rows=all(4).map(r=>r.criterion_id==='R1.1'?{...r,score:0}:r);assert.equal(aggregateAll(rows)[0].score,97);
  rows=all(4).map(r=>r.criterion_id==='R1.12'?{...r,score:0}:r);assert.equal(aggregateAll(rows)[0].score,98.5);
  rows=all(4).map(r=>r.criterion_id==='R1.1'?{...r,status:'unknown',score:null}:r);assert.equal(aggregateAll(rows)[0].coverage,97);
});
test('missing or excluded specialist evidence cannot disappear into shared score normalization',()=>{
  for(const status of ['unknown','not_applicable']){
    const rows=all(4).map(r=>r.criterion_id.startsWith('R3.')?{...r,status,score:null}:r);
    const report=aggregateAll(rows)[2];assert.equal(report.coverage,70);assert.equal(report.lower,70);assert.equal(report.upper,100);assert.equal(report.eligible,false);assert.ok(report.blockers.some(b=>b.id==='R3'));
  }
});
test('legacy catalog preserves scoring 1.1 rather than applying specialist weights retroactively',()=>{
  const rows=all(4).filter(r=>!r.criterion_id.startsWith('R')).map(r=>['F4','F5','F6'].includes(r.criterion_id.split('.')[0])?{...r,score:1}:r);
  assert.equal(getReviewCatalog({rubricVersion:'1.0'}),legacyCatalog);
  const reports=aggregateAll(rows,legacyCatalog);assert.equal(reports[0].score,95.2);assert.equal(reports[1].score,97.75);assert.ok(Math.abs(reports[2].score-73.1875)<1e-8);assert.equal(reports[0].scoringVersion,'1.1');assert.equal(reports[0].criteriaVersion,'1.0');
  assert.throws(()=>getReviewCatalog({rubricVersion:'unrecognized'}),/missing/);
});
const evidence=[{id:'E1',type:'file',path:'test.js',url:'https://github.com/a/b/blob/'+'a'.repeat(40)+'/test.js',content:'first\ntransaction protects writes\nlast'}];
const result=(overrides={})=>({criterion_id:'F3.3',status:'scored',score:2,confidence:'medium',rationale:'Transaction exists',evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'transaction protects writes'}],next_validation:'Test concurrent writes',...overrides});
test('exact citations become immutable GitHub line links',()=>{
  const valid=validateResults({summary:'Example',results:[result()]},[rubric.domains.find(d=>d.id==='F3')],evidence);
  assert.equal(valid.results[0].score,2);assert.ok(valid.results[0].evidence[0].url.endsWith('#L2-L2'));assert.equal(valid.results.length,4);
});
test('fabricated quotes, invalid ranges, and uncited exclusions cannot earn scores',()=>{
  for(const item of [result({evidence:[{evidence_id:'E1',start_line:1,end_line:1,quote:'transaction protects writes'}]}),result({evidence:[]}),result({status:'not_applicable',score:null,evidence:[]})]){
    const valid=validateResults({summary:'Example',results:[item]},[rubric.domains.find(d=>d.id==='F3')],evidence);assert.equal(valid.results[0].status,'unknown');assert.equal(valid.results[0].score,null);
  }
});
test('duplicate criteria and invalid score states are rejected',()=>{
  const domains=[rubric.domains.find(d=>d.id==='F3')];
  assert.throws(()=>validateResults({summary:'x',results:[result(),result()]},domains,evidence),/duplicate/);
  assert.throws(()=>validateResults({summary:'x',results:[result({score:9})]},domains,evidence),/Invalid score/);
  assert.throws(()=>validateResults({summary:'x',results:[result({status:'unknown',score:2})]},domains,evidence),/Invalid score/);
});
