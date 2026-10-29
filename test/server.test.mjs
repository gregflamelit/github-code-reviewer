import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createApplication} from '../server.mjs';
import {createJobs} from '../src/jobs.mjs';
import {legacyCatalog,aggregateAll} from '../src/rubric.mjs';
test('loopback interface serves app, rejects cross-origin writes, and validates repository URLs',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'reviewer-http-'));
  const app=createApplication({dataDir:dir,clientFactory:()=>({initialize:async()=>{},account:async()=>({authenticated:true,method:'chatgpt'}),close(){}})});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+app.server.address().port;
  try{
    const home=await fetch(base);assert.equal(home.status,200);assert.ok((await home.text()).includes('Start a repository evaluation'));
    assert.equal((await (await fetch(base+'/api/health')).json()).ready,true);
    assert.equal((await fetch(base+'/api/reviews',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://evil.test'},body:JSON.stringify({url:'https://github.com/a/b'})})).status,403);
    assert.equal((await fetch(base+'/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"url":"http://localhost/a/b"}'})).status,400);
    assert.equal((await fetch(base+'/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:'not json'})).status,400);
    assert.equal((await fetch(base+'/evaluation-rubric.json')).status,404);
    assert.deepEqual(await (await fetch(base+'/api/reviews')).json(),[]);
  }finally{await new Promise(resolve=>app.server.close(resolve));app.store.close();rmSync(dir,{recursive:true,force:true});}
});
test('HTTP upgrades and exports preserve legacy scoring and expose all versioned specialist reports',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'reviewer-upgrade-http-'));
  const unknowns=domains=>({summary:'Fixture evidence only',results:domains.flatMap(d=>d.criteria.map(c=>({criterion_id:c.id,status:'unknown',score:null,confidence:'low',rationale:'Unobserved in this fixture',evidence:[],next_validation:'Collect direct evidence'})))});
  const assessed=[];
  const app=createApplication({dataDir:dir,jobsFactory:args=>createJobs({...args,createClient:()=>({initialize:async()=>{},account:async()=>({authenticated:true}),close(){},evaluate:async({domains})=>{assessed.push(...domains.map(d=>d.id));return unknowns(domains);}})})});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+app.server.address().port;
  const id='11111111-1111-4111-8111-111111111111';
  const rows=unknowns(legacyCatalog.rubric.domains).results;const reports=aggregateAll(rows,legacyCatalog);
  const legacy={id,url:'https://github.com/a/b',createdAt:new Date().toISOString(),rubricVersion:'1.0',scoringVersion:'1.1',status:'completed',results:rows,reports,report:reports[0],repository:{sha:'a'.repeat(40)},evidence:[{id:'E1',type:'file',content:'source',path:'README.md',url:'https://github.com/a/b'}]};
  app.store.save(legacy);
  try{
    const current=await(await fetch(base+'/api/rubric')).json();assert.equal(current.rubric.domains.flatMap(d=>d.criteria).length,104);
    const before=await(await fetch(base+'/api/reviews/'+id)).json();assert.equal(before.expectedCriteria,68);assert.equal(before.catalog.scoringConfig.rubric_version,'1.1');assert.deepEqual(before.reports,reports);
    const response=await fetch(base+'/api/reviews/'+id+'/upgrade',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});assert.equal(response.status,202);const created=await response.json();
    for(let n=0;n<100&&app.jobs.active;n++)await new Promise(resolve=>setTimeout(resolve,5));
    const newer=await(await fetch(base+'/api/reviews/'+created.id+'/export')).json();assert.equal(newer.status,'completed');assert.equal(newer.results.length,104);assert.equal(newer.expectedCriteria,104);assert.equal(newer.catalog.scoringConfig.rubric_version,'2.0');assert.deepEqual(assessed,['R1','R2','R3']);
    for(const report of newer.reports){const selected=await(await fetch(base+'/api/reviews/'+created.id+'/export?rubric='+report.rubricId)).json();assert.equal(selected.report.scoringVersion,'2.0');assert.equal(selected.report.domains.filter(d=>d.pool==='role').length,1);assert.equal(selected.reports,undefined);}
    const after=await(await fetch(base+'/api/reviews/'+id)).json();assert.deepEqual(after,before);
    const singleId='22222222-2222-4222-8222-222222222222';
    app.store.save({...legacy,id:singleId,reports:undefined,report:{...reports[0],score:17.25,coverage:40,domains:reports[0].domains.slice(0,4)}});
    const single=await(await fetch(base+'/api/reviews/'+singleId+'/export')).json();assert.equal(single.report.score,17.25);assert.equal(single.report.coverage,40);assert.equal(single.report.domains.length,4);assert.equal(single.reports.length,1);
    assert.equal((await fetch(base+'/api/reviews/'+created.id+'/export?rubric=bad')).status,400);
  }finally{await new Promise(resolve=>app.server.close(resolve));app.store.close();rmSync(dir,{recursive:true,force:true});}
});
