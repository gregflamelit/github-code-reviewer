import test from 'node:test';
import assert from 'node:assert/strict';
import {collectRepository} from '../src/github.mjs';
import {collectHistory} from '../src/history.mjs';
import {collectPortfolio} from '../src/portfolio.mjs';
import {validateResults,rubric} from '../src/rubric.mjs';

test('deep repository sample includes tests, docs, issues, PR reviews, inline comments, and patches',async()=>{
  const sha='a'.repeat(40);const calls=[];
  const request=async path=>{
    calls.push(path);
    if(path==='/repos/a/b')return {private:false,default_branch:'main',full_name:'a/b'};
    if(path.includes('/commits/'))return {sha};
    if(path.includes('/git/trees/'))return {tree:[...Array.from({length:65},(_,i)=>({type:'blob',path:'src/file'+i+'.js',size:100,sha:'source'})),{type:'blob',path:'tests/recovery.test.js',size:100,sha:'test'},{type:'blob',path:'docs/research.md',size:100,sha:'docs'}]};
    if(path.includes('/git/blobs/'))return {encoding:'base64',content:Buffer.from('first line\r\nchecks and implementation').toString('base64')};
    if(path.includes('/issues?'))return [{number:1,title:'Customer recovery',body:'Acceptance: retry preserves work',state:'closed'},{number:2,pull_request:{},body:'Not an issue'}];
    if(path.includes('/issues/comments?'))return [{id:4,issue_url:'https://api.github.com/repos/a/b/issues/1',body:'User confirmed recovery works',user:{login:'reviewer'}}];
    if(path.includes('/pulls?'))return [{number:2,title:'Fix recovery',body:'Adds a regression test',head:{sha:'b'.repeat(40)}}];
    if(path.includes('/reviews?'))return [{id:5,state:'CHANGES_REQUESTED',body:'Please test restart recovery',user:{login:'reviewer'},commit_id:'b'.repeat(40)}];
    if(path.includes('/comments?'))return [{id:6,path:'src/main.js',line:3,body:'Handle failures before returning success'}];
    if(path.includes('/files?'))return [{filename:'tests/recovery.test.js',status:'added',patch:'@@ -0,0 +1 @@\n+assert(recovery())'}];
    throw new Error(path);
  };
  const result=await collectRepository('https://github.com/a/b',{request});
  assert.equal(result.evidence.filter(e=>e.type==='file').length,60);assert.ok(result.evidence.some(e=>e.category==='tests'));assert.ok(result.evidence.some(e=>e.category==='documentation'));
  for(const type of ['issue','issue_comment','pull_request','pull_request_review','pull_request_comment','pull_request_diff'])assert.ok(result.evidence.some(e=>e.type===type),type);
  assert.ok(!result.evidence.some(e=>e.type==='issue'&&e.path==='Issue #2'));
  const review=result.evidence.find(e=>e.type==='pull_request_review');assert.match(review.url,/#pullrequestreview-5$/);assert.equal(review.temporal_scope,'supplemental_history');assert.ok(review.collectedAt);
  const domain=rubric.domains[0];const line=review.content.split('\n').findIndex(s=>s==='Please test restart recovery')+1;
  const output={summary:'Fixture',results:[{criterion_id:domain.criteria[0].id,status:'scored',score:2,confidence:'medium',rationale:'Review asks for recovery tests',evidence:[{evidence_id:review.id,start_line:line,end_line:line,quote:'Please test restart recovery'}],next_validation:'Execute tests'}]};
  const validated=validateResults(output,[domain],result.evidence);assert.equal(validated.results[0].evidence[0].url,review.url);assert.equal(validated.results[0].evidence[0].temporal_scope,'supplemental_history');
  assert.equal(result.repository.evidenceCollection.categories.tests.items,1);assert.ok(result.evidence.reduce((n,e)=>n+e.content.length,0)<=180000);
});

test('history respects body and patch bounds and stops after rate restriction',async()=>{
  const evidence=[],warnings=[];let calls=0;
  const history=await collectHistory('/repos/a/b',{collectedAt:'now',warnings,add:e=>evidence.push(e),request:async()=>{calls++;throw new Error('GitHub rate limit or access restriction');}});
  assert.equal(calls,1);assert.ok(warnings.length);assert.ok(history.endpoints.some(e=>e.status==='skipped'));
  const items=[];
  await collectHistory('/repos/a/b',{collectedAt:'now',warnings:[],add:e=>items.push(e),request:async path=>path.includes('/pulls?')?[{number:1,body:'x'.repeat(5000)}]:path.includes('/files?')?[{filename:'file',patch:'x'.repeat(10000)}]:[]});
  assert.equal(items.find(e=>e.type==='pull_request').truncated,true);assert.equal(items.find(e=>e.type==='pull_request_diff').truncated,true);assert.ok(items.every(e=>e.content.length<5000));
  const controller=new AbortController();controller.abort(new Error('cancelled'));
  await assert.rejects(collectHistory('/repos/a/b',{collectedAt:'now',warnings:[],signal:controller.signal,add(){},request:async()=>{throw controller.signal.reason;}}),/cancelled/);
});

test('portfolio protects discussion and test evidence from large implementation samples',async()=>{
  const result=await collectPortfolio('https://github.com/alice',{request:async()=>[{name:'project',owner:{login:'alice'},size:100}],collectRepo:async()=>({repository:{sha:'a'.repeat(40)},warnings:[],evidence:[...Array.from({length:20},(_,i)=>({type:'file',path:'src/'+i+'.js',content:'x'.repeat(10000),url:'https://github.com/alice/project'})),{type:'file',path:'tests/main.test.js',content:'assert()',url:'https://github.com/alice/project'},{type:'pull_request_review',path:'PR #1 review',content:'review feedback',url:'https://github.com/alice/project/pull/1#pullrequestreview-1',temporal_scope:'supplemental_history'}]})});
  assert.ok(result.evidence.some(e=>e.type==='pull_request_review'));assert.ok(result.evidence.some(e=>e.path.includes('tests/')));assert.equal(result.evidence.find(e=>e.type==='pull_request_review').commit_sha,undefined);assert.ok(result.portfolio.included[0].incorporatedCategories.pull_requests.items);
});

test('unused category budget is redistributed without downloading any file twice',async()=>{
  const fetched=[];
  const request=async path=>{
    if(path==='/repos/a/b')return {private:false,default_branch:'main'};
    if(path.includes('/commits/'))return {sha:'a'.repeat(40)};
    if(path.includes('/git/trees/'))return {tree:[...Array.from({length:6},(_,i)=>({type:'blob',path:'src/'+i+'.js',size:14000,sha:'source'+i})),{type:'blob',path:'tests/test.js',size:100,sha:'test'},{type:'blob',path:'docs/research.md',size:100,sha:'docs'}]};
    if(path.includes('/git/blobs/')){fetched.push(path);return {encoding:'base64',content:Buffer.from('x'.repeat(path.includes('source')?14000:100)).toString('base64')};}
    return [];
  };
  const result=await collectRepository('https://github.com/a/b',{request});assert.equal(fetched.length,8);assert.equal(new Set(fetched).size,8);assert.equal(result.repository.evidenceCollection.categories.implementation.characters,84000);assert.equal(result.evidence.filter(e=>e.type==='file').length,8);
});
