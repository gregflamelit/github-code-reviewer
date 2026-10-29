import test from 'node:test';
import assert from 'node:assert/strict';
import {rubric,aggregate,aggregateAll,scoringConfig,validateResults} from '../src/rubric.mjs';
const all=(score=3)=>rubric.domains.flatMap(d=>d.criteria.map(c=>({criterion_id:c.id,status:'scored',score,confidence:'high',rationale:'Direct evidence',evidence:[],next_validation:''})));
test('weights and all 68 criteria match the rubric',()=>{
  assert.equal(rubric.domains.flatMap(d=>d.criteria).length,68);
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
  for(const lens of scoringConfig.rubrics){assert.equal(Object.values(lens.core_weights_percent).reduce((s,w)=>s+w,0)+lens.functional_pool_percent,100);assert.equal(Object.values(lens.functional_weights_percent).reduce((s,w)=>s+w,0),100);}
});
test('same assessments yield independently weighted engineering and data science scores',()=>{
  const rows=all(4).map(r=>['F4','F5','F6'].includes(r.criterion_id.split('.')[0])?{...r,score:1}:r);
  const reports=aggregateAll(rows);assert.ok(Math.abs(reports[0].score-95.2)<1e-8);assert.ok(Math.abs(reports[1].score-97.75)<1e-8);assert.ok(Math.abs(reports[2].score-73.1875)<1e-8);
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
