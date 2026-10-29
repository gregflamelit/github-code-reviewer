import test from 'node:test';
import assert from 'node:assert/strict';
import {createJobs} from '../src/jobs.mjs';
import {legacyCatalog} from '../src/rubric.mjs';

const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
async function finished(jobs){for(let i=0;i<200&&jobs.active;i++)await tick();assert.equal(jobs.active,null);}
function memoryStore(){const map=new Map();return {save(r){map.set(r.id,structuredClone(r));return r;},get(id){return structuredClone(map.get(id));}};}
const collected={repository:{fullName:'a/b',sha:'a'.repeat(40)},evidence:[{id:'E1',content:'artifact',path:'README.md',type:'file',url:'https://github.com/a/b'}],warnings:[]};
const unknowns=domains=>({summary:'Bounded evidence.',results:domains.flatMap(d=>d.criteria.map(c=>({criterion_id:c.id,status:'unknown',score:null,confidence:'low',rationale:'Insufficient evidence.',evidence:[],next_validation:'Inspect more evidence.'})))});

test('profile evaluates the combined evidence once for all three reports and carries incomplete scope',async()=>{
  const store=memoryStore();let collections=0;const ids=[];
  const portfolio={owner:'alice',included:[{fullName:'alice/a',sha:'a'.repeat(40),incorporatedFiles:1}],failed:[{fullName:'alice/b'}],collectionComplete:false,consolidationMethod:'Combined evidence',listingTruncated:false};
  const jobs=createJobs({store,dataDir:'.local',collect:async()=>{collections++;return {portfolio,evidence:collected.evidence,warnings:[]};},createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains,assessmentContext})=>{assert.equal(assessmentContext.type,'portfolio');assert.equal(assessmentContext.repositories[0].name,'alice/a');ids.push(...domains.flatMap(d=>d.criteria.map(c=>c.id)));return unknowns(domains);}})});
  const review=jobs.start({url:'https://github.com/alice'});await finished(jobs);const result=store.get(review.id);
  assert.equal(collections,1);assert.equal(ids.length,104);assert.equal(new Set(ids).size,104);assert.equal(result.subjectType,'portfolio');assert.equal(result.reports.length,3);assert.ok(result.reports.every(r=>!r.eligible&&r.blockers.some(b=>b.id==='portfolio_scope')&&r.insights));assert.ok(result.insights.evidenceGaps.length);
});
test('interrupted evaluation resumes completed batches against the saved snapshot',async()=>{
  const store=memoryStore();let collections=0,calls=0,fail=true;
  const jobs=createJobs({store,dataDir:'.local',collect:async()=>{collections++;return structuredClone(collected);},createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains})=>{calls++;if(fail&&calls===2)throw new Error('Transient model error');return unknowns(domains);}})});
  const r=jobs.start({url:'https://github.com/a/b',profile:'application'});await finished(jobs);
  assert.equal(store.get(r.id).status,'failed');assert.equal(store.get(r.id).results.length,16);assert.equal(collections,1);
  fail=false;jobs.retry(r.id);await finished(jobs);const result=store.get(r.id);assert.equal(result.status,'completed');assert.equal(result.results.length,104);assert.equal(result.reports.length,3);assert.equal(collections,1);assert.equal(result.repository.sha,'a'.repeat(40));assert.equal(calls,8);assert.equal(result.report.coverage,0);assert.equal(result.catalog.rubric.rubric_version,'2.0');
});
test('single-job limit and cancellation stop evaluation without creating a report',async()=>{
  const store=memoryStore();let closed=0;
  const jobs=createJobs({store,dataDir:'.local',collect:async()=>structuredClone(collected),createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){closed++;},evaluate:({signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))})});
  const r=jobs.start({url:'https://github.com/a/b'});assert.throws(()=>jobs.start({url:'https://github.com/a/b'}),/already running/);await tick();jobs.cancel(r.id);await finished(jobs);assert.equal(store.get(r.id).status,'cancelled');assert.equal(store.get(r.id).report,undefined);assert.ok(closed>0);
});
test('temporary model capacity failures retry without recollecting evidence',async()=>{
  const store=memoryStore();let calls=0,collections=0;
  const jobs=createJobs({store,dataDir:'.local',retryDelay:0,collect:async()=>{collections++;return structuredClone(collected);},createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains})=>{calls++;if(calls===1)throw new Error('Selected model is at capacity.');return unknowns(domains);}})});
  const r=jobs.start({url:'https://github.com/a/b'});await finished(jobs);assert.equal(store.get(r.id).status,'completed');assert.equal(calls,8);assert.equal(collections,1);assert.equal(store.get(r.id).reports.length,3);
});
test('retrying a pre-specialist review remains pinned to its original criteria and weights',async()=>{
  const store=memoryStore();const batches=[];
  store.save({id:'legacy',url:'https://github.com/a/b',profile:'comprehensive',rubricVersion:'1.0',status:'failed',results:[],...structuredClone(collected)});
  const jobs=createJobs({store,dataDir:'.local',createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains,rubricVersion})=>{assert.equal(rubricVersion,'1.0');batches.push(domains);return unknowns(domains);}})});
  jobs.retry('legacy');await finished(jobs);const r=store.get('legacy');assert.equal(r.results.length,68);assert.equal(r.scoringVersion,'1.1');assert.ok(batches.every(ds=>ds.every(d=>d.pool!=='role')));
});
test('upgrading creates a separate review, reuses only unchanged criteria, and evaluates all new specialists',async()=>{
  const store=memoryStore();const oldRows=unknowns(legacyCatalog.rubric.domains).results;
  const previous={id:'legacy-completed',createdAt:'2026-01-01',url:'https://github.com/a/b',profile:'comprehensive',rubricVersion:'1.0',status:'completed',results:oldRows,report:{score:42},...structuredClone(collected)};
  store.save(previous);const assessed=[];
  const jobs=createJobs({store,dataDir:'.local',collect:async()=>{throw new Error('Must reuse source evidence');},createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains})=>{assessed.push(...domains.map(d=>d.id));return unknowns(domains);}})});
  const upgraded=jobs.upgrade(previous.id);await finished(jobs);const final=store.get(upgraded.id);
  assert.notEqual(final.id,previous.id);assert.deepEqual(store.get(previous.id),previous);assert.deepEqual(assessed,['R1','R2','R3']);assert.equal(final.reusedAssessment.criterionIds.length,68);assert.equal(final.results.length,104);assert.equal(final.repository.sha,previous.repository.sha);assert.equal(final.scoringVersion,'2.0');assert.equal(final.reports.length,3);assert.throws(()=>jobs.upgrade(final.id),/latest rubric/);
});
