import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { CodexClient } from './codex.mjs';
import { parseGitHubTarget } from './github.mjs';
import { collectTarget } from './portfolio.mjs';
import { buildInsights } from './insights.mjs';
import { rubric,profiles,currentCatalog,getReviewCatalog,validateResults,aggregateAll } from './rubric.mjs';

export function createJobs({store,dataDir,createClient=options=>new CodexClient(options),collect=collectTarget,retryDelay=3000}) {
  const controllers=new Map();let active=null;
  const update=(r,message)=>{r.message=message;r.events=[...(r.events||[]),{at:new Date().toISOString(),message}].slice(-80);store.save(r);};
  async function run(review) {
    const controller=new AbortController();controllers.set(review.id,controller);active=review.id;
    let client;
    try{
      const catalog=getReviewCatalog(review);
      client=createClient({cwd:join(dataDir,'worker')});
      controller.signal.addEventListener('abort',()=>client.close(),{once:true});
      update(review,'Checking Codex connection');await client.initialize();
      if(!(await client.account()).authenticated)throw new Error('Codex is not signed in. Run codex login, then retry.');
      if(client.selectModel){review.model??=await client.selectModel();update(review,'Using Codex model '+review.model);}
      if(!review.evidence){
        review.status='collecting';update(review,review.subjectType==='portfolio'?'Discovering public repositories':'Collecting repository evidence');
        Object.assign(review,await collect(review.url,{signal:controller.signal,onProgress:m=>update(review,m)}));store.save(review);
      }
      const domains=catalog.rubric.domains.filter(d=>!d.criteria.every(c=>review.results?.some(r=>r.criterion_id===c.id)));
      const batches=[];let next=[];let count=0;
      for(const domain of domains){if(next.length&&(next.length>=4||count+domain.criteria.length>16)){batches.push(next);next=[];count=0;}next.push(domain);count+=domain.criteria.length;}
      if(next.length)batches.push(next);
      review.status='evaluating';review.results??=[];review.summaries??=[];review.validationWarnings??=[];
      for(const [i,batch] of batches.entries()){
        if(controller.signal.aborted)throw controller.signal.reason;
        if(batch.every(d=>d.criteria.every(c=>review.results.some(r=>r.criterion_id===c.id))))continue;
        update(review,'Evaluation batch '+(i+1)+' of '+batches.length);
        let output;
        for(let attempt=1;attempt<=3;attempt++){
          try{output=await client.evaluate({domains:batch,evidence:review.evidence,rubricVersion:catalog.rubric.rubric_version,assessmentContext:review.portfolio?{type:'portfolio',owner:review.portfolio.owner,method:review.portfolio.consolidationMethod,repositories:review.portfolio.included.map(r=>({name:r.fullName,sha:r.sha,incorporatedFiles:r.incorporatedFiles})),failedRepositories:review.portfolio.failed.map(r=>r.fullName),listingTruncated:review.portfolio.listingTruncated}: {type:'repository'},model:review.model,signal:controller.signal,onProgress:m=>update(review,m)});break;}
          catch(error){
            if(controller.signal.aborted||attempt===3||!/at capacity|rate.limit|429|temporarily unavailable|overloaded/i.test(error.message))throw error;
            update(review,'Codex temporarily unavailable; retrying batch (attempt '+(attempt+1)+' of 3)');
            await delay(retryDelay*attempt,undefined,{signal:controller.signal});
          }
        }
        const validated=validateResults(output,batch,review.evidence);
        const ids=new Set(batch.flatMap(d=>d.criteria.map(c=>c.id)));
        review.results=review.results.filter(r=>!ids.has(r.criterion_id)).concat(validated.results);
        review.summaries.push(validated.summary);review.validationWarnings.push(...validated.warnings);store.save(review);
      }
      review.reports=aggregateAll(review.results,catalog);
      if(review.portfolio&&!review.portfolio.collectionComplete)for(const report of review.reports){report.eligible=false;report.band='Provisional — repository collection incomplete';report.blockers.push({id:'portfolio_scope',reason:'One or more selected repositories lack collected source evidence'});}
      review.insights=buildInsights(review.reports,catalog,review.validationWarnings);
      for(const report of review.reports)report.insights=buildInsights([report],catalog,review.validationWarnings);
      review.report=review.reports[0];review.scoringVersion=catalog.scoringConfig.rubric_version;review.status='completed';update(review,'Evaluation complete — three rubric reports');
    }catch(e){review.status=controller.signal.aborted?'cancelled':'failed';update(review,e.message||String(e));}
    finally{client?.close();controllers.delete(review.id);active=null;}
  }
  return {
    start({url,profile='comprehensive'}){
      if(active)throw Object.assign(new Error('A review is already running. Wait or cancel it first.'),{status:409});
      if(!Object.hasOwn(profiles,profile))throw Object.assign(new Error('Unknown assessment profile.'),{status:400});
      const parsed=parseGitHubTarget(url);const now=new Date().toISOString();
      const review=store.save({id:randomUUID(),url:parsed.url,target:parsed,profile:'comprehensive',status:'queued',createdAt:now,updatedAt:now,message:'Queued',appVersion:'0.3.0',rubricVersion:rubric.rubric_version,scoringVersion:currentCatalog.scoringConfig.rubric_version,catalog:structuredClone(currentCatalog),assessmentMode:parsed.kind==='portfolio'?'portfolio_repository_inspection':'repository_inspection',subjectType:parsed.kind});
      void run(review);return review;
    },
    retry(id){
      if(active)throw Object.assign(new Error('A review is already running.'),{status:409});
      const r=store.get(id);if(!r)throw Object.assign(new Error('Review not found.'),{status:404});
      if(r.status==='completed'&&getReviewCatalog(r).rubric.domains.every(d=>d.criteria.every(c=>r.results?.some(row=>row.criterion_id===c.id))))throw Object.assign(new Error('Review is already complete. Start a new review to use the latest rubric or refresh evidence.'),{status:409});
      r.status='queued';delete r.report;delete r.reports;delete r.insights;store.save(r);void run(r);return r;
    },
    upgrade(id){
      if(active)throw Object.assign(new Error('A review is already running.'),{status:409});
      const previous=store.get(id);if(!previous)throw Object.assign(new Error('Review not found.'),{status:404});
      if(previous.status!=='completed'||!previous.evidence)throw Object.assign(new Error('Complete the original review before upgrading its rubric.'),{status:409});
      const oldCatalog=getReviewCatalog(previous);
      if(oldCatalog.rubric.rubric_version===rubric.rubric_version&&oldCatalog.scoringConfig.rubric_version===currentCatalog.scoringConfig.rubric_version)throw Object.assign(new Error('This review already uses the latest rubric. Start a new review to refresh evidence.'),{status:409});
      const oldCriteria=new Map(oldCatalog.rubric.domains.flatMap(d=>d.criteria.map(c=>[c.id,c])));
      const compatible=new Set(rubric.domains.flatMap(d=>d.criteria).filter(c=>JSON.stringify(c)===JSON.stringify(oldCriteria.get(c.id))).map(c=>c.id));
      const now=new Date().toISOString();
      const r=store.save({id:randomUUID(),url:previous.url,target:previous.target,profile:'comprehensive',status:'queued',createdAt:now,updatedAt:now,message:'Queued for latest rubric',appVersion:'0.3.0',rubricVersion:rubric.rubric_version,scoringVersion:currentCatalog.scoringConfig.rubric_version,catalog:structuredClone(currentCatalog),assessmentMode:previous.assessmentMode||'repository_inspection',subjectType:previous.subjectType||'repository',upgradedFrom:id,model:previous.model,repository:structuredClone(previous.repository),portfolio:structuredClone(previous.portfolio),evidence:structuredClone(previous.evidence),warnings:structuredClone(previous.warnings||[]),results:structuredClone((previous.results||[]).filter(row=>compatible.has(row.criterion_id))),summaries:structuredClone(previous.summaries||[]),reusedAssessment:{reviewId:id,criteriaVersion:oldCatalog.rubric.rubric_version,criterionIds:(previous.results||[]).filter(row=>compatible.has(row.criterion_id)).map(row=>row.criterion_id)}});
      void run(r);return r;
    },
    cancel(id){const c=controllers.get(id);if(!c)throw Object.assign(new Error('No running review with this ID.'),{status:409});c.abort(new Error('Cancelled by user.'));},
    shutdown(){for(const c of controllers.values())c.abort(new Error('Application shutting down.'));},
    get active(){return active;}
  };
}
