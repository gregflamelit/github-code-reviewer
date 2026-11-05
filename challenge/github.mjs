import {createSign,createHmac,timingSafeEqual} from 'node:crypto';
import {readFileSync} from 'node:fs';
export function verifyWebhook(bytes,signature,secret){
  if(!secret||!/^sha256=[a-f0-9]{64}$/.test(signature||''))return false;
  const expected=Buffer.from('sha256='+createHmac('sha256',secret).update(bytes).digest('hex'));
  return timingSafeEqual(expected,Buffer.from(signature));
}
export function createGitHub(config,fetcher=fetch){
  let cached;
  async function request(path,{token,method='GET',body}={}){
    const res=await fetcher('https://api.github.com'+path,{method,redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2026-03-10','User-Agent':'wine-challenge-service',Authorization:'Bearer '+token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
    if(!res.ok)throw Object.assign(new Error('GitHub request failed ('+res.status+'). Check installation permissions and repository access.'),{status:502});
    if(res.status===204)return null;return res.json();
  }
  async function installationToken(){
    if(cached&&cached.until>Date.now()+60000)return cached.token;
    const now=Math.floor(Date.now()/1000),enc=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
    const input=enc({alg:'RS256',typ:'JWT'})+'.'+enc({iat:now-60,exp:now+540,iss:config.appId});
    const signer=createSign('RSA-SHA256');signer.update(input);
    const jwt=input+'.'+signer.sign(readFileSync(config.privateKeyPath),'base64url');
    const data=await request('/app/installations/'+config.installationId+'/access_tokens',{token:jwt,method:'POST',body:{permissions:{contents:'read',metadata:'read'}}});
    cached={token:data.token,until:Date.parse(data.expires_at)};return cached.token;
  }
  return {request,installationToken,
    async verifyRepository(repository){const token=await installationToken();const repo=await request('/repos/'+repository,{token});if(!repo.private)throw new Error('Candidate repositories must be private.');return repo;},
    async authorize(code,redirectUri){
      const response=await fetcher('https://github.com/login/oauth/access_token',{method:'POST',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Accept:'application/json','Content-Type':'application/json'},body:JSON.stringify({client_id:config.clientId,client_secret:config.clientSecret,code,redirect_uri:redirectUri})});
      const data=await response.json();if(!response.ok||!data.access_token)throw new Error('GitHub authorization failed. Try connecting again.');
      return data.access_token;
    },
    async verifyCandidate(repository,expectedLogin,token){
      const user=await request('/user',{token});if(user.login.toLowerCase()!==expectedLogin.toLowerCase())throw new Error('Connect the GitHub account named in your invitation.');
      const repo=await request('/repos/'+repository,{token});if(!repo.private||!repo.permissions?.push)throw new Error('Accept your repository invitation and verify write access before starting.');return user.login;
    }
  };
}
