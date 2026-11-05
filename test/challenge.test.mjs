import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {createHmac} from 'node:crypto';
import {openStore} from '../challenge/store.mjs';
import {timing} from '../challenge/challenge.mjs';
import {verifyWebhook,createGitHub} from '../challenge/github.mjs';
import {createChallengeService} from '../challenge/server.mjs';
import {collectRepository} from '../src/github.mjs';

function temporary(){return mkdtempSync(join(tmpdir(),'wine-challenge-'));}
const sha='a'.repeat(40),later='b'.repeat(40),start=Date.parse('2026-11-04T12:00:00Z');
test('timing bonus, restart persistence, final push selection, replay, and freeze boundaries',()=>{
  const dir=temporary();let store=openStore(dir);
  try{
    const {attempt:a,invitation}=store.create({repository:'acme/candidate',githubLogin:'builder'});
    assert.notEqual(a.token,invitation);assert.equal(store.invite(invitation).id,a.id);
    store.start(a.id,'builder',start);store.start(a.id,'builder',start+600000);assert.equal(Date.parse(store.get(a.id).startedAt),start);
    const push=(delivery,minutes,commit=sha,extra={})=>store.push({delivery,repository:'ACME/candidate',sha:commit,ref:'refs/heads/main',sender:'builder',now:start+minutes*60000,...extra});
    assert.equal(push('wrong',10,sha,{sender:'other'}).ignored,true);
    assert.equal(push('branch',10,sha,{ref:'refs/heads/other'}).ignored,true);
    assert.equal(push('pre',-1).ignored,true);assert.equal(push('zero',2,'0'.repeat(40)).ignored,true);
    assert.equal(push('first',30).accepted,true);assert.equal(timing(store.get(a.id)).bonus,10);
    assert.equal(push('first',40,later).duplicate,true);assert.equal(store.get(a.id).commitSha,sha);
    assert.equal(push('second',45,later).accepted,true);assert.equal(timing(store.get(a.id)).bonus,5);
    store.close();store=openStore(dir);assert.equal(store.get(a.id).commitSha,later);
    store.freeze(a.id,start+46*60000,'finished early');assert.equal(store.get(a.id).receipt.bonus,5);
    assert.equal(push('post',47).ignored,true);assert.equal(store.get(a.id).commitSha,later);
    const b=store.create({repository:'acme/empty'}).attempt;store.start(b.id,'builder',start);store.expire(start+3600000);assert.equal(store.get(b.id).status,'no_submission');
    const c=store.create({repository:'acme/deadline'}).attempt;store.start(c.id,'builder',start);
    assert.equal(store.push({delivery:'late',repository:c.repository,sha,ref:'refs/heads/main',sender:'builder',now:start+3600001}).ignored,true);
  }finally{store.close();rmSync(dir,{recursive:true,force:true});}
});
test('signed webhook validation rejects modification, missing signatures, and wrong secrets',()=>{
  const bytes=Buffer.from('{"test":1}'),signature='sha256='+createHmac('sha256','secret').update(bytes).digest('hex');
  assert.equal(verifyWebhook(bytes,signature,'secret'),true);assert.equal(verifyWebhook(Buffer.from('{}'),signature,'secret'),false);assert.equal(verifyWebhook(bytes,signature,'wrong'),false);assert.equal(verifyWebhook(bytes,'sha256=bad','secret'),false);assert.equal(verifyWebhook(bytes,signature,''),false);
});
test('GitHub identity verification rejects the wrong account and missing private-repository write access',async()=>{
  let login='intruder',repo={private:true,permissions:{push:true}};
  const github=createGitHub({},async url=>new Response(JSON.stringify(url.endsWith('/user')?{login}:repo),{status:200,headers:{'Content-Type':'application/json'}}));
  await assert.rejects(github.verifyCandidate('acme/wine','builder','test-token'),/named in your invitation/);
  login='Builder';repo={private:true,permissions:{push:false}};
  await assert.rejects(github.verifyCandidate('acme/wine','builder','test-token'),/write access/);
  repo={private:false,permissions:{push:true}};await assert.rejects(github.verifyCandidate('acme/wine','builder','test-token'),/write access/);
  repo={private:true,permissions:{push:true}};assert.equal(await github.verifyCandidate('acme/wine','builder','test-token'),'Builder');
});

async function httpApp(demo=true){
  const dir=temporary();let clock=start;
  const config={demo,dataDir:dir,origin:'http://127.0.0.1:0',adminPassword:'a-long-test-password',appId:'1',installationId:'1',clientId:'client',clientSecret:'secret',privateKeyPath:'unused',webhookSecret:'webhook-secret'};
  let githubCalls=0;
  const service=createChallengeService(config,{now:()=>clock,github:{verifyRepository:async()=>{githubCalls++;return {private:true};},authorize:async()=>{githubCalls++;return 'token';},verifyCandidate:async()=>{githubCalls++;return 'builder';}}});
  await new Promise(resolve=>service.server.listen(0,'127.0.0.1',resolve));config.origin='http://127.0.0.1:'+service.server.address().port;
  const request=async(path,{data,cookie,headers={},method}={})=>fetch(config.origin+path,{method:method||(data===undefined?'GET':'POST'),headers:{...(data===undefined?{}:{'Content-Type':'application/json',Origin:config.origin}),...(cookie?{Cookie:cookie}:{}),...headers},body:data===undefined?undefined:JSON.stringify(data),redirect:'manual'});
  return {service,config,request,clock:v=>clock=v,calls:()=>githubCalls,close:async()=>{await service.close();rmSync(dir,{recursive:true,force:true});}};
}
const cookie=res=>res.headers.get('set-cookie').split(';')[0];
test('demo HTTP journey enforces auth, hides assignment until start, and freezes a receipt',async()=>{
  const h=await httpApp();
  try{
    assert.equal((await h.request('/employer')).status,200);
    assert.equal((await h.request('/api/employer/attempts')).status,401);
    assert.equal((await h.request('/api/login',{data:{},headers:{Origin:'https://evil.test'}})).status,403);
    const admin=cookie(await h.request('/api/login',{data:{}}));
    const invite=await (await h.request('/api/employer/attempts',{data:{label:'private name'},cookie:admin})).json();
    assert.ok(invite.inviteUrl.includes('#invite='));
    const candidate=cookie(await h.request('/api/invitation',{data:{token:invite.inviteUrl.split('#invite=')[1]}}));
    let result=await (await h.request('/api/candidate',{cookie:candidate})).json();
    assert.equal(result.challenge,null);assert.equal(result.attempt.challenge,undefined);assert.equal(result.attempt.label,undefined);assert.equal(result.attempt.token,undefined);
    assert.equal((await h.request('/api/candidate/dataset',{cookie:candidate})).status,403);
    await h.request('/api/candidate/start',{cookie:candidate,data:{}});
    h.clock(start+45*60000);
    await h.request('/api/candidate/demo-push',{cookie:candidate,data:{}});
    const csv=await h.request('/api/candidate/dataset',{cookie:candidate});assert.equal(csv.status,200);assert.equal((await csv.text()).trim().split('\n').length,1600);
    result=await (await h.request('/api/candidate/finish',{cookie:candidate,data:{}})).json();assert.equal(result.receipt.bonus,5);assert.equal(result.status,'submitted');assert.equal(result.pushes.length,1);
    const frozen=result.commitSha;
    h.clock(start+50*60000);await h.request('/api/candidate/demo-push',{cookie:candidate,data:{}});result=await (await h.request('/api/candidate',{cookie:candidate})).json();assert.equal(result.attempt.commitSha,frozen);
    assert.equal((await h.request('/api/employer/attempts/'+invite.attempt.id+'/queue',{cookie:admin,data:{}})).status,400);
    assert.equal((await h.request('/api/employer/attempts/'+invite.attempt.id+'/note',{cookie:admin,data:{note:'Follow up on model error analysis.'}})).status,200);
    assert.equal(h.calls(),0);
  }finally{await h.close();}
});
test('live OAuth verifies account before starting; signed pushes freeze at deadline and queue exact SHA',async()=>{
  const h=await httpApp(false);
  try{
    assert.equal((await h.request('/api/login',{data:{password:'wrong'}})).status,401);
    const admin=cookie(await h.request('/api/login',{data:{password:h.config.adminPassword}}));
    const invite=await (await h.request('/api/employer/attempts',{cookie:admin,data:{repository:'acme/live',githubLogin:'builder'}})).json();
    const candidate=cookie(await h.request('/api/invitation',{data:{token:invite.inviteUrl.split('#invite=')[1]}}));
    const begin=await h.request('/api/candidate/start',{cookie:candidate,data:{}}),oauth=cookie(begin),url=new URL((await begin.json()).redirect);
    assert.equal(h.service.store.get(invite.attempt.id).startedAt,undefined);
    assert.equal((await h.request('/auth/github/callback?code=code&state=bad',{cookie:candidate+'; '+oauth})).status,403);
    const begin2=await h.request('/api/candidate/start',{cookie:candidate,data:{}}),oauth2=cookie(begin2),url2=new URL((await begin2.json()).redirect);
    assert.equal((await h.request('/auth/github/callback?code=code&state='+url2.searchParams.get('state'),{cookie:candidate+'; '+oauth2})).status,302);
    assert.equal(h.service.store.get(invite.attempt.id).status,'active');
    const event={repository:{full_name:'acme/live'},sender:{login:'builder'},ref:'refs/heads/main',after:sha};
    const signature='sha256='+createHmac('sha256',h.config.webhookSecret).update(JSON.stringify(event)).digest('hex');
    const headers={'x-hub-signature-256':signature,'x-github-event':'push','x-github-delivery':'event-1'};
    h.clock(start+30*60000);
    assert.equal((await h.request('/api/github/webhook',{data:event})).status,401);
    assert.equal((await (await h.request('/api/github/webhook',{data:event,headers})).json()).accepted,true);
    assert.equal((await (await h.request('/api/github/webhook',{data:event,headers})).json()).duplicate,true);
    h.clock(start+61*60000);await h.request('/api/candidate',{cookie:candidate});
    const a=h.service.store.get(invite.attempt.id);assert.equal(a.status,'submitted');assert.equal(a.commitSha,sha);assert.equal(a.receipt.bonus,10);
    const queued=await h.request('/api/employer/attempts/'+a.id+'/queue',{cookie:admin,data:{}});assert.equal(queued.status,202);assert.equal((await queued.json()).commitSha,sha);
    assert.equal((await h.request('/api/employer/attempts/'+a.id+'/queue',{cookie:admin,data:{}})).status,400);
    assert.equal((await h.request('/api/employer/attempts/'+a.id+'/report')).status,401);
    assert.equal((await h.request('/api/employer/attempts/'+a.id+'/report',{cookie:admin})).status,409);
    assert.equal((await h.request('/api/candidate/demo-push',{cookie:candidate,data:{}})).status,404);
    assert.ok(url.searchParams.get('state'));
  }finally{await h.close();}
});
test('demo sessions cannot be reused by switching the same database into live mode',async()=>{
  const h=await httpApp();const config={...h.config,demo:false};await h.service.close();
  try{assert.throws(()=>createChallengeService(config),/separate data directories/);}finally{rmSync(config.dataDir,{recursive:true,force:true});}
});
test('timed private collector resolves frozen SHA and excludes later discussion evidence',async()=>{
  const paths=[];
  const request=async path=>{paths.push(path);if(path==='/repos/a/b')return {private:true,default_branch:'main'};if(path.includes('/commits/'))return {sha};if(path.includes('/git/trees/'))return {tree:[{type:'blob',path:'README.md',size:10,sha:'blob'}]};if(path.includes('/git/blobs/'))return {encoding:'base64',content:Buffer.from('A work sample').toString('base64')};throw new Error('Unexpected mutable endpoint: '+path);};
  const result=await collectRepository('https://github.com/a/b',{request,allowPrivate:true,commitSha:sha,includeHistory:false});
  assert.equal(result.repository.sha,sha);assert.ok(paths.includes('/repos/a/b/commits/'+sha));assert.equal(paths.some(p=>p.includes('pulls')||p.includes('issues')),false);assert.ok(result.evidence.find(e=>e.type==='file').url.includes(sha));
  await assert.rejects(collectRepository('https://github.com/a/b',{request,allowPrivate:true,commitSha:later,includeHistory:false}),/does not match/);
});
