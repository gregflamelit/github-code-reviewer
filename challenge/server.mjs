import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
import {openStore,secret} from './store.mjs';
import {challenge,timing} from './challenge.mjs';
import {createGitHub,verifyWebhook} from './github.mjs';
const here=dirname(fileURLToPath(import.meta.url));
const failure=(message,status=400)=>Object.assign(new Error(message),{status});
export function configuration(env=process.env){
  return {demo:env.CHALLENGE_DEMO!=='false',port:Number(env.CHALLENGE_PORT||4320),origin:env.CHALLENGE_ORIGIN||'http://127.0.0.1:'+(env.CHALLENGE_PORT||4320),dataDir:resolve(env.CHALLENGE_DATA_DIR||'.local/challenge'),adminPassword:env.CHALLENGE_ADMIN_PASSWORD,appId:env.CHALLENGE_GITHUB_APP_ID,installationId:env.CHALLENGE_GITHUB_INSTALLATION_ID,clientId:env.CHALLENGE_GITHUB_CLIENT_ID,clientSecret:env.CHALLENGE_GITHUB_CLIENT_SECRET,privateKeyPath:env.CHALLENGE_GITHUB_PRIVATE_KEY_PATH,webhookSecret:env.CHALLENGE_GITHUB_WEBHOOK_SECRET};
}
export function createChallengeService(config=configuration(),{github=createGitHub(config),now=()=>Date.now()}={}){
  if(!config.demo&&(!config.adminPassword||config.adminPassword.length<16||!config.appId||!config.installationId||!config.clientId||!config.clientSecret||!config.privateKeyPath||!config.webhookSecret))throw new Error('Live mode requires GitHub App settings and a CHALLENGE_ADMIN_PASSWORD of at least 16 characters. See docs/challenge-service.md.');
  const store=openStore(config.dataDir),secure=new URL(config.origin).protocol==='https:';
  const mode=config.demo?'demo':'live',previousMode=store.db.prepare("SELECT value FROM settings WHERE key='mode'").get();
  if(previousMode&&previousMode.value!==mode){store.close();throw new Error('Demo and live mode require separate data directories.');}
  if(!previousMode){if(store.list().some(a=>a.demo!==config.demo)){store.close();throw new Error('Demo and live mode require separate data directories.');}store.db.prepare("INSERT INTO settings VALUES('mode',?)").run(mode);}
  const loginFailures=new Map();
  const cookies=req=>Object.fromEntries((req.headers.cookie||'').split(';').map(x=>x.trim().split('=')).filter(x=>x.length===2));
  const cookie=(name,value)=>`${name}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${secure?'; Secure':''}`;
  const publicAttempt=a=>{if(!a)return null;const {token,label,githubLogin,notes,challenge:assignment,...safe}=a;return {...safe,timing:timing(a,now()),evaluation:store.job(a.id)?{status:store.job(a.id).status}:null};};
  const adminAttempt=a=>({...publicAttempt(a),label:a.label,githubLogin:a.githubLogin,notes:a.notes,evaluation:store.job(a.id)});
  async function body(req,limit=1_000_000){const parts=[];let size=0;for await(const p of req){size+=p.length;if(size>limit)throw failure('Request too large.',413);parts.push(p);}return Buffer.concat(parts);}
  const server=http.createServer(async(req,res)=>{
    const send=(status,data,type='application/json',headers={})=>{res.writeHead(status,{'Content-Type':type,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",...headers});res.end(type==='application/json'?JSON.stringify(data):data);};
    const redirect=(url,headers={})=>send(302,'','text/plain',{Location:url,...headers});
    try{
      // Host validation prevents DNS rebinding; forwarded headers are deliberately not trusted.
      const allowedHost=new URL(config.origin).host;
      if(req.headers.host!==allowedHost&&!(config.demo&&req.headers.host==='127.0.0.1:'+server.address().port))throw failure('Unexpected host.',403);
      const url=new URL(req.url,config.origin),path=url.pathname,c=cookies(req),session=store.readSession(c.wine_session);
      if(['POST','PUT','DELETE','PATCH'].includes(req.method)&&path!=='/api/github/webhook'&&req.headers.origin!==config.origin&&!(config.demo&&req.headers.origin==='http://127.0.0.1:'+server.address().port))throw failure('Same-origin request required.',403);
      store.expire(now());
      if(req.method==='GET'&&['/','/candidate','/employer','/app.js','/style.css'].includes(path)){
        const file=path==='/app.js'?'app.js':path==='/style.css'?'style.css':'index.html';return send(200,await readFile(join(here,'public',file)),file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html');
      }
      if(path==='/api/config'&&req.method==='GET')return send(200,{demo:config.demo,campaign:challenge.campaign,authenticated:session?.role==='admin',serverTime:new Date(now()).toISOString()});
      if(path==='/api/login'&&req.method==='POST'){
        const source=req.socket.remoteAddress||'local',record=loginFailures.get(source);
        if(record&&record.until>Date.now()&&record.count>=10)throw failure('Too many sign-in attempts. Try again in 15 minutes.',429);
        const data=JSON.parse(await body(req,8192));const attempt=String(data.password||''),expected=config.adminPassword||'';
        const actualBytes=Buffer.from(attempt),expectedBytes=Buffer.from(expected);
        if(!config.demo&&(actualBytes.length!==expectedBytes.length||!timingSafeEqual(actualBytes,expectedBytes))){loginFailures.set(source,{count:record&&record.until>Date.now()?record.count+1:1,until:Date.now()+900000});throw failure('Incorrect password.',401);}
        loginFailures.delete(source);
        store.deleteSession(c.wine_session);return send(200,{ok:true},'application/json',{'Set-Cookie':cookie('wine_session',store.session({role:'admin'}))});
      }
      if(path==='/api/logout'&&req.method==='POST'){store.deleteSession(c.wine_session);return send(200,{ok:true},'application/json',{'Set-Cookie':cookie('wine_session','')});}
      if(path==='/api/invitation'&&req.method==='POST'){
        const {token}=JSON.parse(await body(req,8192));const a=typeof token==='string'?store.invite(token):null;if(!a)throw failure('Invitation not found.',404);
        return send(200,publicAttempt(a),'application/json',{'Set-Cookie':cookie('wine_candidate',store.session({role:'candidate',attemptId:a.id}))});
      }
      const candidateSession=store.readSession(c.wine_candidate),candidate=candidateSession?.role==='candidate'?store.get(candidateSession.attemptId):null;
      if(path==='/api/candidate'&&req.method==='GET'){if(!candidate)throw failure('Open your invitation link first.',401);return send(200,{attempt:publicAttempt(candidate),challenge:candidate.startedAt?candidate.challenge:null});}
      if(path==='/api/candidate/start'&&req.method==='POST'){
        if(!candidate)throw failure('Open your invitation first.',401);
        if(config.demo)return send(200,publicAttempt(store.start(candidate.id,'demo-builder',now())));
        if(candidate.status!=='invited')return send(200,{redirect:'/candidate'});
        const state=secret(),oauth=store.session({role:'oauth',attemptId:candidate.id,state},600000);
        const target=new URL('https://github.com/login/oauth/authorize');target.searchParams.set('client_id',config.clientId);target.searchParams.set('redirect_uri',config.origin+'/auth/github/callback');target.searchParams.set('state',state);
        return send(200,{redirect:target.href},'application/json',{'Set-Cookie':cookie('wine_oauth',oauth)});
      }
      if(path==='/auth/github/callback'&&req.method==='GET'){
        const state=store.readSession(c.wine_oauth);store.deleteSession(c.wine_oauth);
        if(!state||state.role!=='oauth'||url.searchParams.get('state')!==state.state||!candidate||state.attemptId!==candidate.id)throw failure('GitHub session expired or state mismatch.',403);
        const code=url.searchParams.get('code');if(!code)throw failure('GitHub connection was cancelled.');
        const token=await github.authorize(code,config.origin+'/auth/github/callback');
        const login=await github.verifyCandidate(candidate.repository,candidate.githubLogin,token);
        await github.verifyRepository(candidate.repository);store.start(candidate.id,login,now());return redirect('/candidate',{'Set-Cookie':cookie('wine_oauth','')});
      }
      if(path==='/api/candidate/dataset'&&req.method==='GET'){
        if(!candidate?.startedAt)throw failure('Start your challenge to unlock the dataset.',403);
        return send(200,await readFile(join(here,'data/winequality-red.csv')),'text/csv',{'Content-Disposition':'attachment; filename="winequality-red.csv"'});
      }
      if(path==='/api/candidate/finish'&&req.method==='POST'){
        if(!candidate||candidate.status!=='active'||!candidate.commitSha)throw failure('An active attempt with an accepted push is required.');
        return send(200,publicAttempt(store.freeze(candidate.id,now(),'finished early')));
      }
      if(path==='/api/candidate/demo-push'&&req.method==='POST'){
        if(!config.demo||!candidate?.demo)throw failure('Demo endpoint unavailable.',404);
        const sha=(await import('node:crypto')).randomBytes(20).toString('hex');store.push({delivery:secret(),repository:candidate.repository,sha,ref:'refs/heads/main',sender:'demo-builder',now:now()});return send(200,publicAttempt(store.get(candidate.id)));
      }
      if(path==='/api/github/webhook'&&req.method==='POST'){
        if(config.demo)throw failure('Webhooks are disabled in demo mode.',404);
        const receivedAt=now(),bytes=await body(req,25_000_000);
        if(!verifyWebhook(bytes,req.headers['x-hub-signature-256'],config.webhookSecret))throw failure('Invalid webhook signature.',401);
        const delivery=req.headers['x-github-delivery'];if(typeof delivery!=='string'||delivery.length>150)throw failure('Invalid delivery ID.');
        if(req.headers['x-github-event']!=='push')return send(200,{ignored:true});const p=JSON.parse(bytes);
        if(!p.repository?.full_name||p.deleted||p.forced)return send(200,{ignored:true});
        return send(200,store.push({delivery,repository:p.repository.full_name,sha:p.after,ref:p.ref,sender:p.sender?.login,now:receivedAt}));
      }
      if(path.startsWith('/api/employer')){
        if(session?.role!=='admin')throw failure('Employer sign-in required.',401);
        if(path==='/api/employer/attempts'&&req.method==='GET')return send(200,{attempts:store.list().map(adminAttempt),challenge});
        if(path==='/api/employer/attempts'&&req.method==='POST'){
          const data=JSON.parse(await body(req,8192));let repository=String(data.repository||'');const githubLogin=String(data.githubLogin||'');
          if(config.demo)repository='demo/wine-'+secret().slice(0,10);
          if(!/^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(repository)||repository.split('/').some(p=>p==='.'||p==='..'))throw failure('Use an owner/repository name.');
          if(!config.demo){if(!/^[a-z0-9-]{1,39}$/i.test(githubLogin))throw failure('Expected GitHub username is required.');await github.verifyRepository(repository);}
          let result;try{result=store.create({repository,label:String(data.label||''),githubLogin,demo:config.demo});}catch(e){if(e.code?.startsWith('ERR_SQLITE'))throw failure('This repository already has an attempt.');throw e;}
          return send(201,{attempt:adminAttempt(result.attempt),inviteUrl:config.origin+'/candidate#invite='+result.invitation});
        }
        const match=path.match(/^\/api\/employer\/attempts\/([a-f0-9-]{36})(?:\/(queue|note|report))?$/);
        if(match){const a=store.get(match[1]);if(!a)throw failure('Attempt not found.',404);
          if(req.method==='GET'&&!match[2])return send(200,{attempt:adminAttempt(a),events:store.events(a.id)});
          if(req.method==='POST'&&match[2]==='queue')return send(202,store.queue(a.id));
          if(req.method==='POST'&&match[2]==='note'){const {note}=JSON.parse(await body(req,8192));if(typeof note!=='string'||!note.trim()||note.length>4000)throw failure('Enter a note of 1–4,000 characters.');store.transaction(()=>{const fresh=store.get(a.id);fresh.notes.push({at:new Date(now()).toISOString(),text:note});store.save(fresh);store.audit(a.id,'review_note',note);});return send(200,{ok:true});}
          if(req.method==='GET'&&match[2]==='report'){
            const job=store.job(a.id);if(job?.status!=='completed')throw failure('Report is not ready.',409);
            const type=url.searchParams.get('type')||'summary',allowed=['summary','all','ai_product_manager','ai_engineering','ai_data_science','human_centered_design'];if(!allowed.includes(type))throw failure('Unknown report.');
            return send(200,await readFile(join(config.dataDir,'reports',job.id,type+'.pdf')),'application/pdf',{'Content-Disposition':`attachment; filename="${a.id}-${type}.pdf"`});
          }
        }
      }
      throw failure('Not found.',404);
    }catch(e){const status=e.status||400;send(status,{error:e instanceof SyntaxError?'Invalid JSON request.':e.code==='ENOENT'?'File is unavailable.':e.message});}
  });
  server.requestTimeout=30000;
  const expiry=setInterval(()=>store.expire(now()),1000);expiry.unref();
  return {server,store,close(){clearInterval(expiry);return new Promise(resolve=>server.close(()=>{store.close();resolve();}));}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const config=configuration(),app=createChallengeService(config);app.server.listen(config.port,'127.0.0.1',()=>console.log(`Wine Challenge ${config.demo?'DEMO':'LIVE'}: ${config.origin}`));
  for(const sig of ['SIGINT','SIGTERM'])process.on(sig,()=>{void app.close().then(()=>process.exit(0));});
}
