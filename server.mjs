import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join,resolve } from 'node:path';
import { createStore } from './src/store.mjs';
import { createJobs } from './src/jobs.mjs';
import { CodexClient } from './src/codex.mjs';
import { rubric,profiles,scoringConfig,getReviewCatalog,criterionCount } from './src/rubric.mjs';
import {buildInsights} from './src/insights.mjs';

export function createApplication({dataDir=process.env.REVIEWER_DATA_DIR||resolve('.local'),jobsFactory=createJobs,clientFactory=o=>new CodexClient(o)}={}){
  const store=createStore(dataDir);const jobs=jobsFactory({store,dataDir});
  const assets={'/':['index.html','text/html; charset=utf-8'],'/app.js':['app.js','text/javascript; charset=utf-8'],'/style.css':['style.css','text/css; charset=utf-8']};
  let healthCache=null;
  const send=(res,status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",...headers});res.end(typeof data==='string'?data:JSON.stringify(data));};
  const server=http.createServer(async(req,res)=>{
    try{
      const expected='127.0.0.1:'+server.address().port;
      if(req.headers.host!==expected)return send(res,403,{error:'Use the application loopback URL.'});
      if(req.headers.origin && req.headers.origin!=='http://'+expected)return send(res,403,{error:'Cross-origin requests are not allowed.'});
      const url=new URL(req.url,'http://'+expected);const path=url.pathname;
      if(req.method==='GET' && assets[path]){const [name,type]=assets[path];return send(res,200,await readFile(new URL('./public/'+name,import.meta.url),'utf8'),{'Content-Type':type});}
      if(req.method==='GET' && path==='/api/rubric')return send(res,200,{rubric,profiles,scoringConfig});
      if(req.method==='GET' && path==='/api/health'){
        if(healthCache && Date.now()-healthCache.at<15000)return send(res,200,healthCache.value);
        let client;let value;
        try{client=clientFactory({cwd:join(dataDir,'worker')});await client.initialize();const account=await client.account();value={ready:account.authenticated,codex:account.authenticated?'Connected with '+account.method:'Sign in with codex login',inference:'OpenAI-hosted inference; local application and storage',activeReview:jobs.active};}
        catch(e){value={ready:false,codex:e.message,inference:'OpenAI-hosted inference; local application and storage'};}finally{client?.close();}
        healthCache={at:Date.now(),value};return send(res,200,value);
      }
      if(req.method==='GET' && path==='/api/reviews')return send(res,200,store.list());
      const match=path.match(/^\/api\/reviews\/([a-f0-9-]{36})(?:\/(retry|cancel|export|upgrade))?$/);
      if(req.method==='GET' && match){const r=store.get(match[1]);if(!r)return send(res,404,{error:'Review not found.'});
        r.catalog=getReviewCatalog(r);r.expectedCriteria=criterionCount(r.catalog);
        // Older single-report reviews retain their original aggregates, including narrower scope.
        if(r.report&&!r.reports){r.report={...r.report,rubricId:r.report.rubricId||'ai_product_manager',rubricName:r.report.rubricName||'AI Product Manager',scoringVersion:r.report.scoringVersion||r.scoringVersion||'1.1',blockers:r.report.blockers||[]};r.reports=[r.report];}
        if(r.reports){r.insights??=buildInsights(r.reports,r.catalog,r.validationWarnings||[]);for(const report of r.reports)report.insights??=buildInsights([report],r.catalog,r.validationWarnings||[]);}
        if(match[2]==='export'){
          const selected=url.searchParams.get('rubric');
          if(selected){const report=r.reports?.find(report=>report.rubricId===selected);if(!report)return send(res,400,{error:'Unknown or unavailable rubric report.'});return send(res,200,{...r,reports:undefined,report},{'Content-Disposition':'attachment; filename="'+selected+'-'+r.id+'.json"'});}
          return send(res,200,r,{'Content-Disposition':'attachment; filename="review-'+r.id+'.json"'});
        }
        if(match[2])return send(res,404,{error:'Not found'});return send(res,200,r);
      }
      if(req.method==='POST'){
        if(!req.headers['content-type']?.startsWith('application/json'))return send(res,415,{error:'JSON content type required.'});
        const body=await readJson(req);
        if(path==='/api/reviews')return send(res,202,jobs.start(body));
        if(match?.[2]==='retry')return send(res,202,jobs.retry(match[1]));
        if(match?.[2]==='upgrade')return send(res,202,jobs.upgrade(match[1]));
        if(match?.[2]==='cancel'){jobs.cancel(match[1]);return send(res,202,{status:'cancelling'});}
      }
      send(res,404,{error:'Not found.'});
    }catch(e){send(res,e.status||400,{error:e.message});}
  });
  server.requestTimeout=30000;
  return {server,store,jobs,close(){jobs.shutdown();server.close();setTimeout(()=>store.close(),500).unref();}};
}

async function readJson(req){let body='';for await(const c of req){body+=c;if(Buffer.byteLength(body)>8192)throw Object.assign(new Error('Request too large.'),{status:413});}try{return JSON.parse(body);}catch{throw new Error('Invalid JSON request.');}}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const app=createApplication();const port=Number(process.env.PORT||4317);
  if(!Number.isInteger(port)||port<1||port>65535)throw new Error('PORT must be between 1 and 65535.');
  app.server.on('error',e=>{console.error(e.code==='EADDRINUSE'?'Port '+port+' is already in use. Set PORT to another port.':e.message);process.exitCode=1;app.store.close();});
  app.server.listen(port,'127.0.0.1',()=>console.log('GitHub Code Reviewer: http://127.0.0.1:'+port));
  for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>app.close());
}
