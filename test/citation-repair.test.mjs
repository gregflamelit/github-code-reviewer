import test from 'node:test';
import assert from 'node:assert/strict';
import {repairAssessments,citationRepairTotals} from '../src/citation-repair.mjs';
import {rubric} from '../src/rubric.mjs';
const base=rubric.domains.find(d=>d.id==='F3');
const domains=[{...base,criteria:[base.criteria[0]]}];
const evidence=[{id:'E1',type:'file',path:'file.js',url:'https://github.com/a/b/blob/'+'a'.repeat(40)+'/file.js',content:'first\nprefix transaction protects writes suffix\nlast'}];
const row=(overrides={})=>({criterion_id:'F3.1',status:'scored',score:2,confidence:'medium',rationale:'A transaction protects writes.',evidence:[{evidence_id:'E1',start_line:99,end_line:99,quote:'transaction protects writes'}],next_validation:'Test concurrency.',...overrides});
const output=rows=>({summary:'Fixture',results:rows});
const state=rows=>({criterionIds:rows.map(r=>r.criterion_id),output:output(rows)});

test('an exact unique quote can be realigned only within the claimed evidence item',async()=>{
  const original=structuredClone(evidence);const result=await repairAssessments({state:state([row()]),domains,evidence,evaluate:async()=>{throw new Error('No model retry needed');}});
  assert.equal(result.results[0].score,2);assert.equal(result.results[0].evidence[0].start_line,2);assert.match(result.results[0].evidence[0].url,/#L2-L2$/);assert.equal(result.repair.recovered,1);assert.equal(result.repair.realignedCitations,1);assert.equal(result.repair.modelCalls,0);assert.deepEqual(evidence,original);assert.equal(result.warnings.length,0);assert.equal(result.repair.beforeRepairResults[0].status,'unknown');
});

test('unknown IDs and fabricated quotes require model repair, with two independently verified attempts',async()=>{
  let calls=0;const result=await repairAssessments({state:state([row({evidence:[{evidence_id:'E404',start_line:2,end_line:2,quote:'transaction protects writes'}]})]),domains,evidence,evaluate:async request=>{
    calls++;assert.equal(request.domains[0].criteria.length,1);assert.ok(request.citationRepair.findings[0].issues.length);assert.equal(request.citationRepair.findings[0].attempt,calls);
    return output([calls===1?row({evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'invented support'}]}):row({score:1,evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'transaction protects writes'}]})]);
  }});
  assert.equal(calls,2);assert.equal(result.results[0].score,1);assert.equal(result.repair.recovered,1);assert.equal(result.repair.realignedCitations,0);assert.equal(result.repair.unresolvedCitationFailures,0);assert.equal(result.repair.audit.filter(e=>e.type==='model_retry').length,2);
});

test('ambiguous quotes cannot be relocated and explicit model abstention stays unknown',async()=>{
  let calls=0;const result=await repairAssessments({state:state([row({evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'repeat'}]})]),domains,evidence:[{...evidence[0],content:'repeat\nother\nrepeat'}],evaluate:async()=>{calls++;return output([row({status:'unknown',score:null,evidence:[],rationale:'No supported finding.'})]);}});
  assert.equal(calls,1);assert.equal(result.results[0].status,'unknown');assert.equal(result.repair.realignedCitations,0);assert.equal(result.repair.settledUnknown,1);assert.equal(result.repair.unresolvedCitationFailures,0);
});

test('unsupported findings exhaust two retries and never gain a score from fuzzy text',async()=>{
  let calls=0;const invalid=row({evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'transaction protects the writes'}]});
  const result=await repairAssessments({state:state([invalid]),domains,evidence,evaluate:async()=>{calls++;return output([invalid]);}});
  assert.equal(calls,2);assert.equal(result.results[0].status,'unknown');assert.equal(result.repair.unresolvedCitationFailures,1);assert.equal(result.repair.recovered,0);assert.equal(result.warnings.length,1);
});

test('valid findings and intentional unknowns are never sent for reassessment',async()=>{
  const valid=row({evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'transaction protects writes'}]});
  for(const item of [valid,row({status:'unknown',score:null,evidence:[]})]){const result=await repairAssessments({state:state([item]),domains,evidence,evaluate:async()=>{throw new Error('Must not retry');}});assert.equal(result.repair.modelCalls,0);}
});

test('missing criterion responses are retried but remain unknown after the bound',async()=>{
  let calls=0;const result=await repairAssessments({state:{criterionIds:['F3.1'],output:output([])},domains,evidence,evaluate:async()=>{calls++;return output([]);}});assert.equal(calls,2);assert.equal(result.results[0].status,'unknown');assert.equal(result.repair.unresolvedCitationFailures,1);
});

test('checkpoints preserve repaired criteria and completed attempts across interrupted requests',async()=>{
  const ds=[{...base,criteria:base.criteria.slice(0,2)}];const invalid=id=>row({criterion_id:id,evidence:[]});let saved,calls=0;
  await assert.rejects(repairAssessments({state:state([invalid('F3.1'),invalid('F3.2')]),domains:ds,evidence,checkpoint:s=>{saved=structuredClone(s);},evaluate:async()=>{calls++;if(calls===2)throw new Error('Interrupted');return output([row({evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'transaction protects writes'}]}),invalid('F3.2')]);}}),/Interrupted/);
  assert.equal(saved.attempts['F3.2'],1);let resumed=0;
  const result=await repairAssessments({state:saved,domains:ds,evidence,evaluate:async request=>{resumed++;assert.deepEqual(request.domains[0].criteria.map(c=>c.id),['F3.2']);return output([row({criterion_id:'F3.2',evidence:[{evidence_id:'E1',start_line:2,end_line:2,quote:'transaction protects writes'}]})]);}});
  assert.equal(resumed,1);assert.equal(result.repair.recovered,2);assert.equal(result.repair.modelCalls,2);
});

test('cancellation and malformed retry responses cannot produce successful assessments',async()=>{
  const controller=new AbortController();controller.abort(new Error('Cancelled'));
  await assert.rejects(repairAssessments({state:state([row()]),domains,evidence,signal:controller.signal,evaluate:async()=>{throw Error('Must not run');}}),/Cancelled/);
  await assert.rejects(repairAssessments({state:state([row({evidence:[]})]),domains,evidence,evaluate:async()=>output([row(),row()])}),/duplicate/);
});

test('repair requests are limited to four criteria and two completed attempts per criterion',async()=>{
  const ds=[{...base,criteria:Array.from({length:10},(_,i)=>({...base.criteria[0],id:'X.'+i}))}];const invalid=ds[0].criteria.map(c=>row({criterion_id:c.id,evidence:[]}));let calls=0;
  const result=await repairAssessments({state:state(invalid),domains:ds,evidence,evaluate:async({domains})=>{calls++;assert.ok(domains[0].criteria.length<=4);return output(domains[0].criteria.map(c=>row({criterion_id:c.id,evidence:[]})));}});
  assert.equal(calls,5);assert.equal(result.repair.retriedCriteria,10);assert.equal(result.repair.unresolvedCitationFailures,10);assert.equal(citationRepairTotals([result.repair]).modelCalls,5);
});
