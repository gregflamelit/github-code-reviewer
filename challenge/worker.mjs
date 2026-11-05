import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdirSync,writeFileSync} from 'node:fs';
import PDFDocument from 'pdfkit';
import {openStore} from './store.mjs';
import {configuration} from './server.mjs';
import {createGitHub} from './github.mjs';
import {createStore} from '../src/store.mjs';
import {createJobs} from '../src/jobs.mjs';
import {collectRepository,github as githubRequest} from '../src/github.mjs';
import {createReportPdf} from '../src/pdf.mjs';

export async function summaryPdf(attempt,review){
  const doc=new PDFDocument({margin:48,size:'A4'}),chunks=[];
  const result=new Promise((resolve,reject)=>{doc.on('data',b=>chunks.push(b));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
  doc.fillColor('#254e3c').fontSize(24).text('Worksample | Candidate summary');doc.moveDown();doc.fillColor('#252c29').fontSize(16).text('Candidate '+attempt.id.slice(0,8).toUpperCase());
  doc.fontSize(10).moveDown().text('Wine intelligence challenge | '+attempt.challenge.version);
  doc.text('Repository: '+attempt.repository);doc.text('Frozen revision: '+attempt.commitSha);
  doc.text('Last push elapsed: '+(attempt.receipt.elapsedSeconds/60).toFixed(2)+' minutes');doc.text('Speed bonus: '+attempt.receipt.bonus.toFixed(2)+' / 10 (separate from rubric scores)');
  doc.moveDown();for(const r of review.reports){doc.fontSize(13).text(r.rubricName);doc.fontSize(10).text('Score: '+(r.score==null?'Unknown':r.score)+' | Coverage: '+r.coverage+' | '+r.band);doc.moveDown(.6);}
  doc.moveDown().fontSize(10).text('Interpretation: this is a bounded inspection of repository artifacts, not a verified execution or a personal proficiency rating. Missing evidence remains unknown. A short challenge cannot establish every rubric attribute. Review the detailed reports and citations before making a decision.');
  doc.moveDown().text('Mutable issues and pull request discussions were excluded. Candidate code was not executed.');
  doc.moveDown().text('Rubric version: '+review.rubricVersion+' | Review ID: '+review.id);doc.end();return result;
}
export async function writeReports(directory,attempt,review){
  mkdirSync(directory,{recursive:true});
  writeFileSync(join(directory,'summary.pdf'),await summaryPdf(attempt,review));
  writeFileSync(join(directory,'all.pdf'),await createReportPdf(review));
  for(const r of review.reports)writeFileSync(join(directory,r.rubricId+'.pdf'),await createReportPdf(review,{rubricId:r.rubricId}));
}
export function createEvaluationWorker(config=configuration(),{createClient,collect,reportWriter=writeReports}={}){
  if(config.demo)throw new Error('The evaluation worker only runs in live mode. Demo submissions never invoke the evaluator.');
  const store=openStore(config.dataDir);
  // The evaluator store's process lock also prevents two challenge workers owning this queue.
  let reviews;try{reviews=createStore(join(config.dataDir,'evaluator'));}catch(e){store.close();throw e;}
  const github=createGitHub(config);let current,stopped=false;
  for(const row of store.db.prepare("SELECT data FROM jobs WHERE status='running'").all())store.updateJob(JSON.parse(row.data),'queued');
  const jobs=createJobs({store:reviews,dataDir:join(config.dataDir,'evaluator'),...(createClient?{createClient}:{}),collect:async(url,options)=>{
    if(collect)return collect(url,{...options,job:current});
    const request=async(path,opts)=>githubRequest(path,{...opts,token:await github.installationToken()});
    const result=await collectRepository(url,{...options,request,commitSha:current.commitSha,allowPrivate:true,includeHistory:false});
    // Repository metadata is mutable; assessment context comes from the frozen challenge instead.
    result.evidence=result.evidence.filter(e=>e.type!=='metadata');
    result.repository.description=null;
    result.evidence.push({id:'CHALLENGE',type:'metadata',path:'Timed challenge context',url,content:JSON.stringify({challenge:current.challenge,commitSha:current.commitSha,receipt:current.receipt})});
    result.warnings.push('Timed work sample: assess observed artifacts only; unrelated role capabilities remain unknown.');return result;
  }});
  return {store,reviews,
    async tick(){
      if(stopped||current)return false;const job=store.claim();if(!job)return false;current=job;
      try{
        let review=job.reviewId?reviews.get(job.reviewId):null;
        if(review&&review.status!=='completed')review=jobs.retry(review.id);
        else if(!review){review=jobs.start({url:'https://github.com/'+job.repository});job.reviewId=review.id;store.updateJob(job,'running');}
        while(true){review=reviews.get(job.reviewId);job.message=review.message;store.updateJob(job,'running');if(['completed','failed','cancelled','interrupted'].includes(review.status))break;await new Promise(resolve=>setTimeout(resolve,500));}
        if(review.status!=='completed')throw new Error(review.message||'Evaluation interrupted.');
        const a=store.get(job.attemptId);await reportWriter(join(config.dataDir,'reports',job.id),a,review);
        job.scores=review.reports.map(r=>({name:r.rubricName,score:r.score,coverage:r.coverage,band:r.band}));job.message='All reports are ready.';job.completedAt=new Date().toISOString();store.updateJob(job,'completed');store.audit(a.id,'evaluation_completed',review.id);
      }catch(e){job.message=e.message;store.updateJob(job,'failed');store.audit(job.attemptId,'evaluation_failed',e.message);}
      finally{current=null;}return true;
    },
    stop(){stopped=true;jobs.shutdown();},
    async close(){stopped=true;jobs.shutdown();while(current)await new Promise(resolve=>setTimeout(resolve,100));reviews.close();store.close();}
  };
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const config=configuration(),worker=createEvaluationWorker(config);let stop=false;
  console.log('Wine challenge worker ready. Waiting for queued frozen submissions.');
  for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{stop=true;worker.stop();});
  while(!stop){await worker.tick();if(!stop)await new Promise(resolve=>setTimeout(resolve,2000));}await worker.close();
}
