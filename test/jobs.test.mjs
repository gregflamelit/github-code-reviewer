import test from 'node:test';
import assert from 'node:assert/strict';
import {createJobs} from '../src/jobs.mjs';

const tick=()=>new Promise(resolve=>setTimeout(resolve,5));
async function finished(jobs){for(let i=0;i<200&&jobs.active;i++)await tick();assert.equal(jobs.active,null);}
function memoryStore(){const map=new Map();return {save(r){map.set(r.id,structuredClone(r));return r;},get(id){return structuredClone(map.get(id));}};}
const collected={repository:{fullName:'a/b',sha:'a'.repeat(40)},evidence:[{id:'E1',content:'artifact',path:'README.md',type:'file',url:'https://github.com/a/b'}],warnings:[]};
const unknowns=domains=>({summary:'Bounded evidence.',results:domains.flatMap(d=>d.criteria.map(c=>({criterion_id:c.id,status:'unknown',score:null,confidence:'low',rationale:'Insufficient evidence.',evidence:[],next_validation:'Inspect more evidence.'})))});
test('interrupted evaluation resumes completed batches against the saved snapshot',async()=>{
  const store=memoryStore();let collections=0,calls=0,fail=true;
  const jobs=createJobs({store,dataDir:'.local',collect:async()=>{collections++;return structuredClone(collected);},createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains})=>{calls++;if(fail&&calls===2)throw new Error('Transient model error');return unknowns(domains);}})});
  const r=jobs.start({url:'https://github.com/a/b',profile:'application'});await finished(jobs);
  assert.equal(store.get(r.id).status,'failed');assert.equal(store.get(r.id).results.length,16);assert.equal(collections,1);
  fail=false;jobs.retry(r.id);await finished(jobs);const result=store.get(r.id);assert.equal(result.status,'completed');assert.equal(result.results.length,68);assert.equal(result.reports.length,3);assert.equal(collections,1);assert.equal(result.repository.sha,'a'.repeat(40));assert.equal(calls,6);assert.equal(result.report.coverage,0);
});
test('single-job limit and cancellation stop evaluation without creating a report',async()=>{
  const store=memoryStore();let closed=0;
  const jobs=createJobs({store,dataDir:'.local',collect:async()=>structuredClone(collected),createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){closed++;},evaluate:({signal})=>new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}))})});
  const r=jobs.start({url:'https://github.com/a/b'});assert.throws(()=>jobs.start({url:'https://github.com/a/b'}),/already running/);await tick();jobs.cancel(r.id);await finished(jobs);assert.equal(store.get(r.id).status,'cancelled');assert.equal(store.get(r.id).report,undefined);assert.ok(closed>0);
});
test('temporary model capacity failures retry without recollecting evidence',async()=>{
  const store=memoryStore();let calls=0,collections=0;
  const jobs=createJobs({store,dataDir:'.local',retryDelay:0,collect:async()=>{collections++;return structuredClone(collected);},createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains})=>{calls++;if(calls===1)throw new Error('Selected model is at capacity.');return unknowns(domains);}})});
  const r=jobs.start({url:'https://github.com/a/b'});await finished(jobs);assert.equal(store.get(r.id).status,'completed');assert.equal(calls,6);assert.equal(collections,1);assert.equal(store.get(r.id).reports.length,3);
});
