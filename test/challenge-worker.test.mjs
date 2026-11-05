import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readFileSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openStore} from '../challenge/store.mjs';
import {createEvaluationWorker} from '../challenge/worker.mjs';
const sha='a'.repeat(40);
function frozen(store){const {attempt:a}=store.create({repository:'acme/wine',githubLogin:'builder'});const now=Date.now();store.start(a.id,'builder',now);store.push({repository:a.repository,sha,delivery:'test',ref:'refs/heads/main',sender:'builder',now:now+1000});store.freeze(a.id,now+2000);return store.get(a.id);}
const client=(evaluate)=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate});
const unknown=async({domains})=>({summary:'No observed evidence in this test fixture.',results:domains.flatMap(d=>d.criteria.map(c=>({criterion_id:c.id,status:'unknown',score:null,confidence:'low',rationale:'Unobserved in fixture',evidence:[],next_validation:'Inspect actual work evidence.'})))});
test('independent worker recovers a queued claim and writes six real PDFs from frozen evidence',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'wine-worker-'));let store=openStore(dir),worker;
  try{
    const a=frozen(store),job=store.queue(a.id);store.claim();store.close();store=null;
    let captured;
    worker=createEvaluationWorker({demo:false,dataDir:dir},{createClient:()=>client(unknown),collect:async(url,{job})=>{captured=job;return {repository:{fullName:'acme/wine',sha:job.commitSha},evidence:[{id:'E1',type:'file',path:'README.md',url:url+'/blob/'+sha+'/README.md',content:'Fixture only'}],warnings:[]};}});
    assert.equal(await worker.tick(),true);assert.equal(captured.commitSha,sha);assert.equal(captured.challenge.id,'red-wine-v1');
    const result=worker.store.job(a.id);assert.equal(result.status,'completed');assert.equal(result.scores.length,4);
    const files=readdirSync(join(dir,'reports',job.id));assert.equal(files.length,6);
    for(const file of files){const bytes=readFileSync(join(dir,'reports',job.id,file));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>1000);}
    assert.equal(await worker.tick(),false);
  }finally{if(worker)await worker.close();if(store)store.close();rmSync(dir,{recursive:true,force:true});}
});
test('failed evaluation retries the original review and saved evidence without collecting a later commit',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'wine-worker-retry-'));let worker,store=openStore(dir);
  try{
    const a=frozen(store);store.queue(a.id);store.close();store=null;
    let fail=true,collections=0;
    worker=createEvaluationWorker({demo:false,dataDir:dir},{createClient:()=>client(async args=>{if(fail)throw new Error('Fixture failure');return unknown(args);}),collect:async()=>{collections++;return {repository:{fullName:'acme/wine',sha},evidence:[{id:'E1',type:'file',path:'README.md',url:'https://github.com/acme/wine/blob/'+sha+'/README.md',content:'Fixture'}],warnings:[]};},reportWriter:async()=>{}});
    await worker.tick();const failed=worker.store.job(a.id);assert.equal(failed.status,'failed');assert.ok(failed.reviewId);
    fail=false;worker.store.queue(a.id);assert.equal(worker.store.job(a.id).reviewId,failed.reviewId);await worker.tick();const completed=worker.store.job(a.id);assert.equal(completed.status,'completed');assert.equal(completed.reviewId,failed.reviewId);assert.equal(collections,1);
  }finally{if(worker)await worker.close();if(store)store.close();rmSync(dir,{recursive:true,force:true});}
});
