export function parseRepository(value) {
  let u; try { u=new URL(value); } catch { throw new Error('Enter a public GitHub repository URL.'); }
  const parts=u.pathname.replace(/\/$/,'').split('/').filter(Boolean);
  if(u.protocol!=='https:'||u.hostname!=='github.com'||u.port||u.username||u.password||u.search||u.hash||parts.length!==2||parts.some(p=>! /^[A-Za-z0-9_.-]+$/.test(p)||p==='.'||p==='..')) throw new Error('Use https://github.com/owner/repository without a branch or file path.');
  const [owner,raw]=parts; const repo=raw.replace(/\.git$/,'');
  if(!repo) throw new Error('Repository name is required.');
  return {owner,repo,fullName:owner+'/'+repo,url:'https://github.com/'+owner+'/'+repo};
}

export async function github(path,{signal,token=process.env.GITHUB_TOKEN,fetcher=fetch}={}) {
  const res=await fetcher('https://api.github.com'+path,{redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(25000),...(signal?[signal]:[])]),headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28','User-Agent':'local-github-code-reviewer',...(token?{Authorization:'Bearer '+token}:{})}});
  if(!res.ok) throw new Error(res.status===403||res.status===429?'GitHub rate limit or access restriction. Set GITHUB_TOKEN for a higher authenticated limit.':res.status===404?'Public repository or revision not found.':'GitHub request failed ('+res.status+').');
  const reader=res.body.getReader(); let size=0; const chunks=[];
  while(true) { const {done,value}=await reader.read(); if(done)break; size+=value.length; if(size>8_000_000){await reader.cancel();throw new Error('GitHub response exceeded the collection limit.');}chunks.push(Buffer.from(value)); }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function priority(path) {
  if(/(^|\/)(node_modules|vendor|dist|build|\.git)\//i.test(path)||/lock\.(json|yaml)$|package-lock\.json$|\.min\.js$/i.test(path)) return -1;
  if(!/\.(md|mdx|txt|json|ya?ml|toml|ini|cfg|js|jsx|ts|tsx|mjs|cjs|py|sql|prisma|go|rs|java|cs|rb|php|html|css|sh|ps1|tf|graphql|proto|ipynb)$|(^|\/)(Dockerfile|Makefile|LICENSE)$/i.test(path))return -1;
  return (/^readme/i.test(path)?120:0)+(/architecture|adr|requirements|product|user|research|experiment|leakage|calibration|sampling|economics|adoption|recovery|reproducib|drift|causal/i.test(path)?75:0)+(/test|spec|eval/i.test(path)?65:0)+(/\.github\/workflows|schema|migration|auth|security|package\.json|pyproject/i.test(path)?60:0)+(/src\/|app\/|server|main\./i.test(path)?45:0)+(path.split('/').length<3?15:0);
}

export async function collectRepository(url,{signal,onProgress=()=>{},request=github}={}) {
  const parsed=parseRepository(url); const base='/repos/'+parsed.fullName; const options={signal};
  onProgress('Resolving public repository and immutable revision');
  const repo=await request(base,options);
  if(repo.private)throw new Error('Version 1 supports public repositories only.');
  const commit=await request(base+'/commits/'+encodeURIComponent(repo.default_branch),options);
  if(!/^[a-f0-9]{40}$/i.test(commit.sha))throw new Error('GitHub returned an invalid commit.');
  const tree=await request(base+'/git/trees/'+commit.sha+'?recursive=1',options);
  if(!Array.isArray(tree.tree))throw new Error('Repository tree unavailable.');
  const inventory=tree.tree.filter(f=>f.type==='blob');
  const candidates=inventory.filter(f=>f.size>0&&f.size<=100_000&&priority(f.path)>=0).sort((a,b)=>priority(b.path)-priority(a.path)||a.path.localeCompare(b.path));
  const evidence=[]; const warnings=[]; let budget=0;
  const add=(item)=>{const content=item.content.replace(/\r\n/g,'\n'); if(budget+content.length>180_000)return false; evidence.push({...item,id:'E'+(evidence.length+1),content}); budget+=content.length;return true;};
  add({type:'metadata',path:'Repository metadata',url:parsed.url,content:JSON.stringify({full_name:repo.full_name,description:repo.description,default_branch:repo.default_branch,commit_sha:commit.sha,commit_date:commit.commit?.committer?.date,tree_truncated:Boolean(tree.truncated),total_files:inventory.length},null,2)});
  // Inventory is itself bounded, and never establishes the absence of an implementation.
  add({type:'inventory',path:'File inventory',url:parsed.url+'/tree/'+commit.sha,content:inventory.slice(0,2500).map(f=>f.path).join('\n')});
  for(const f of candidates.slice(0,36)) {
    if(signal?.aborted)throw signal.reason;
    if(budget>=170_000)break;
    onProgress('Collecting '+f.path);
    try {
      const blob=await request(base+'/git/blobs/'+f.sha,options);
      if(blob.encoding!=='base64')continue;
      const text=Buffer.from(blob.content.replace(/\s/g,''),'base64').toString('utf8');
      if(text.includes('\u0000'))continue;
      const content=text.slice(0,14000);
      add({type:'file',path:f.path,url:parsed.url+'/blob/'+commit.sha+'/'+f.path.split('/').map(encodeURIComponent).join('/'),content,truncated:text.length>content.length});
    }catch(e){if(signal?.aborted)throw e;warnings.push('Could not collect '+f.path+': '+e.message);}
  }
  // History is supplemental, not pinned implementation evidence. Record its collection time explicitly.
  try {
    const prs=await request(base+'/pulls?state=closed&sort=updated&direction=desc&per_page=4',options);
    for(const pr of prs) add({type:'pull_request',path:'Pull request #'+pr.number,url:pr.html_url,content:JSON.stringify({number:pr.number,title:pr.title,body:pr.body?.slice(0,5000),author:pr.user?.login,head_sha:pr.head?.sha,merged_at:pr.merged_at,temporal_scope:'Supplemental recent history; may postdate evaluated commit'},null,2)});
  }catch(e){if(signal?.aborted)throw e;warnings.push('PR history unavailable: '+e.message);}
  if(tree.truncated)warnings.push('GitHub truncated the repository tree.');
  if(inventory.length>2500)warnings.push('File inventory limited to 2,500 paths.');
  warnings.push('Bounded source sample: up to 36 text files, 14,000 characters each, 180,000 characters total. Repository code was not executed. Issues, PR diffs, workflow results, and repository settings are not collected in v1.');
  return {repository:{...parsed,sha:commit.sha,branch:repo.default_branch,description:repo.description,totalFiles:inventory.length,collectedAt:new Date().toISOString()},evidence,warnings};
}
