import test from 'node:test';
import assert from 'node:assert/strict';
import {parseGitHubTarget} from '../src/github.mjs';
import {collectPortfolio,portfolioLimits} from '../src/portfolio.mjs';
import {buildInsights} from '../src/insights.mjs';

const repo=(name,extra={})=>({name,owner:{login:'alice'},size:10,pushed_at:'2026-01-01',...extra});
const collectRepo=async url=>({repository:{sha:'a'.repeat(40),branch:'main',totalFiles:2,collectedAt:'2026-01-01'},warnings:[],evidence:[{id:'E1',type:'file',path:'src/main.js',url:url+'/blob/'+ 'a'.repeat(40)+'/src/main.js',content:'source code'}]});
test('GitHub targets accept profiles and repository roots with constrained URLs',()=>{
  assert.deepEqual(parseGitHubTarget('https://github.com/alice?tab=repositories'),{kind:'portfolio',owner:'alice',url:'https://github.com/alice'});
  assert.equal(parseGitHubTarget('https://github.com/alice/project').kind,'repository');
  for(const url of ['http://github.com/alice','https://github.com/settings','https://github.com/alice?x=1','https://github.com/alice/project/tree/main','https://github.com/alice//project','https://evil.test/alice','https://user:secret@github.com/alice'])assert.throws(()=>parseGitHubTarget(url));
});
test('portfolio selection filters, deduplicates, limits, and preserves cross-repository provenance',async()=>{
  const list=[repo('old'),repo('new',{pushed_at:'2026-10-01'}),repo('NEW'),repo('fork',{fork:true}),repo('archive',{archived:true}),repo('alice'),repo('empty',{size:0}),repo('private',{private:true})];
  const visited=[];
  const result=await collectPortfolio('https://github.com/alice',{request:async path=>{visited.push(path);return list;},collectRepo,limits:{...portfolioLimits,maxRepositories:1}});
  assert.equal(visited.length,1);assert.equal(result.portfolio.included[0].name,'new');assert.equal(result.portfolio.excluded.length,6);assert.equal(result.portfolio.eligibleCount,2);
  assert.equal(result.evidence[1].repository,'alice/new');assert.equal(result.evidence[1].path,'alice/new/src/main.js');assert.equal(result.evidence[1].originalPath,'src/main.js');assert.match(result.evidence[1].url,/\/blob\/a{40}\//);assert.equal(new Set(result.evidence.map(e=>e.id)).size,result.evidence.length);
});
test('pagination, partial failures, and budget omissions are disclosed',async()=>{
  let page=0;
  const result=await collectPortfolio('https://github.com/alice',{request:async()=>++page===1?[repo('a'),repo('b')]:[repo('c')],collectRepo:async url=>{if(url.endsWith('/b'))throw new Error('Unavailable');const value=await collectRepo(url);value.evidence.push({...value.evidence[0],content:'x'.repeat(4000)});return value;},limits:{...portfolioLimits,repositoriesPerPage:2,maxEvidenceCharacters:3000}});
  assert.equal(page,2);assert.equal(result.portfolio.failed.length,1);assert.equal(result.portfolio.collectionComplete,false);assert.equal(result.portfolio.included.length,2);assert.ok(result.portfolio.included.every(r=>r.incorporatedFiles===1&&r.omittedEvidenceItems===1));assert.ok(result.evidence.reduce((sum,e)=>sum+e.content.length,0)<=3000);
  await assert.rejects(collectPortfolio('https://github.com/alice',{request:async()=>[repo('fork',{fork:true})]}),/No eligible/);
  await assert.rejects(collectPortfolio('https://github.com/alice',{request:async()=>[repo('a')],collectRepo:async()=>{throw new Error('failure');}}),/every selected/);
});
test('discovery caps and cancellation are explicit',async()=>{
  const result=await collectPortfolio('https://github.com/alice',{request:async()=>[repo('a')],collectRepo,limits:{...portfolioLimits,repositoriesPerPage:1,maxListingPages:1}});assert.equal(result.portfolio.listingTruncated,true);
  const controller=new AbortController();controller.abort(new Error('cancelled'));
  await assert.rejects(collectPortfolio('https://github.com/alice',{signal:controller.signal,request:async()=>[repo('a')],collectRepo}),/cancelled/);
});
test('insights rank verified weaknesses separately from missing evidence, including historical rows',()=>{
  const catalog={rubric:{domains:[{id:'D',criteria:[{id:'D.1',name:'Weakness',domain_weight_percent:50},{id:'D.2',name:'Missing',domain_weight_percent:50}]}]}};
  const report={domains:[{id:'D',name:'Domain',weight:1,rows:[{criterion_id:'D.1',status:'scored',score:1,evidence:[{url:'source'}]},{criterion_id:'D.2',status:'unknown',score:null,evidence:[]}]}]};
  const insights=buildInsights([report,report],catalog);assert.equal(insights.demonstrated[0].criteria.length,1);assert.equal(insights.demonstrated[0].criteria[0].criterionId,'D.1');assert.equal(insights.evidenceGaps[0].criteria[0].criterionId,'D.2');assert.ok(Number.isFinite(insights.demonstrated[0].priority));
});
