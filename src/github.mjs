import {createHash} from 'node:crypto';
import {balanceEvidence,evidenceCategory,summarizeEvidence} from './evidence.mjs';
import {collectHistory} from './history.mjs';

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
  if(!/\.(md|mdx|rst|txt|json|ya?ml|toml|ini|cfg|js|jsx|ts|tsx|mjs|cjs|py|sql|prisma|go|rs|java|cs|rb|php|html|css|sh|ps1|tf|graphql|proto|ipynb|feature)$|(^|\/)(Dockerfile|Makefile|LICENSE)$/i.test(path))return -1;
  return (/^readme/i.test(path)?120:0)+(/architecture|adr|requirements|product|user|research|experiment|leakage|calibration|sampling|economics|adoption|recovery|reproducib|drift|causal/i.test(path)?75:0)+(/test|spec|eval/i.test(path)?65:0)+(/\.github\/workflows|schema|migration|auth|security|package\.json|pyproject/i.test(path)?60:0)+(/src\/|app\/|server|main\./i.test(path)?45:0)+(path.split('/').length<3?15:0);
}

export async function rawFile(repository,commit,file,{signal,fetcher=fetch}={}){
  const url='https://raw.githubusercontent.com/'+repository+'/'+commit+'/'+file.path.split('/').map(encodeURIComponent).join('/');
  const response=await fetcher(url,{redirect:'error',signal:AbortSignal.any([AbortSignal.timeout(25000),...(signal?[signal]:[])])});
  if(!response.ok)throw new Error('Raw file request failed ('+response.status+').');
  const reader=response.body.getReader(),chunks=[];let size=0;
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>100000){await reader.cancel();throw new Error('Raw file exceeds the collection limit.');}chunks.push(Buffer.from(value));}
  const bytes=Buffer.concat(chunks);
  const digest=createHash('sha1').update('blob '+bytes.length+'\0').update(bytes).digest('hex');
  if(digest!==file.sha)throw new Error('Raw file does not match the pinned Git blob.');
  return bytes.toString('utf8');
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
  const collectedAt=new Date().toISOString();
  const limits={files:60,fileCharacters:14000,fileBudget:130000,historyBudget:40000,totalCharacters:180000};
  const categoryCharacters={};
  const add=(item,ceiling=limits.totalCharacters)=>{const text=item.content.replace(/\r\n/g,'\n');const content=text.slice(0,Math.max(0,ceiling-budget));if(!content.length){warnings.push('Evidence budget omitted '+item.path);return false;}evidence.push({...item,id:'E'+(evidence.length+1),content,category:evidenceCategory(item),truncated:Boolean(item.truncated)||content.length<text.length});budget+=content.length;return true;};
  const selected=balanceEvidence(candidates.map(f=>({...f,type:'file'}))).slice(0,limits.files);
  const fetched=new Map(),collectedFiles=new Map();
  async function collectFile(f,available){
    if(signal?.aborted)throw signal.reason;
    if(available<1||budget>=limits.fileBudget)return;
    const category=evidenceCategory(f);
    try {
      if(!fetched.has(f.path)){
        onProgress('Collecting '+f.path);let text;
        if(request===github)text=await rawFile(parsed.fullName,commit.sha,f,options);
        else{const blob=await request(base+'/git/blobs/'+f.sha,options);if(blob.encoding==='base64')text=Buffer.from(blob.content.replace(/\s/g,''),'base64').toString('utf8');}
        fetched.set(f.path,text&&!text.includes('\u0000')?text.replace(/\r\n/g,'\n'):null);
      }
      const text=fetched.get(f.path);if(!text)return;
      const existing=collectedFiles.get(f.path);const oldLength=existing?.content.length||0;
      const content=text.slice(0,Math.min(limits.fileCharacters,oldLength+available,oldLength+limits.fileBudget-budget));
      const extra=content.length-oldLength;if(extra<=0)return;
      if(existing){existing.content=content;existing.truncated=text.length>content.length;budget+=extra;}
      else if(add({type:'file',category,path:f.path,url:parsed.url+'/blob/'+commit.sha+'/'+f.path.split('/').map(encodeURIComponent).join('/'),content,truncated:text.length>content.length},limits.fileBudget))collectedFiles.set(f.path,evidence.at(-1));
      categoryCharacters[category]=(categoryCharacters[category]||0)+extra;
    }catch(e){if(signal?.aborted)throw e;fetched.set(f.path,null);warnings.push('Could not collect '+f.path+': '+e.message);}
  }
  const categoryCap=limits.fileBudget/new Set(selected.map(evidenceCategory)).size;
  for(const f of selected)await collectFile(f,categoryCap-(categoryCharacters[evidenceCategory(f)]||0));
  // Preserve category representation first, then reuse spare budget without refetching.
  for(const f of selected)await collectFile(f,limits.fileBudget-budget);
  const historyStart=budget;
  const history=await collectHistory(base,{request,signal,collectedAt,warnings,onProgress,add:item=>add(item,historyStart+limits.historyBudget)});
  add({type:'metadata',path:'Repository metadata',url:parsed.url,content:JSON.stringify({full_name:repo.full_name,description:repo.description,default_branch:repo.default_branch,commit_sha:commit.sha,commit_date:commit.commit?.committer?.date,tree_truncated:Boolean(tree.truncated),total_files:inventory.length},null,2)});
  const paths=inventory.slice(0,2500).map(f=>f.path).join('\n');
  add({type:'inventory',path:'File inventory',url:parsed.url+'/tree/'+commit.sha,content:paths.slice(0,9000),truncated:paths.length>9000||inventory.length>2500});
  if(tree.truncated)warnings.push('GitHub truncated the repository tree.');
  if(inventory.length>2500)warnings.push('File inventory limited to 2,500 paths.');
  warnings.push('Bounded deep sample: up to 60 files across tests, documentation, and implementation; 14,000 characters per file, 130,000 file characters, 40,000 discussion characters, 180,000 total. Repository code and tests were not executed. Workflow results and repository settings are not verified. Discussion claims remain unverified.');
  const candidateCounts=summarizeEvidence(candidates.map(f=>({type:'file',path:f.path,content:''})));
  const evidenceCollection={version:'2.0',limits,candidateCounts,categories:summarizeEvidence(evidence),history};
  return {repository:{...parsed,sha:commit.sha,branch:repo.default_branch,description:repo.description,totalFiles:inventory.length,collectedAt,evidenceCollection},evidence,warnings};
}

export function parseGitHubTarget(value){
  let u;try{u=new URL(value);}catch{throw new Error('Enter a public GitHub profile or repository URL.');}
  const parts=u.pathname.replace(/\/$/,'').split('/').filter(Boolean);
  const profileTab=parts.length===1&&u.searchParams.size===1&&u.searchParams.get('tab')==='repositories';
  if(u.protocol!=='https:'||u.hostname!=='github.com'||u.port||u.username||u.password||u.hash||(u.search&&!profileTab)||u.pathname.includes('//')||![1,2].includes(parts.length))throw new Error('Use https://github.com/username or https://github.com/owner/repository.');
  if(parts.length===2)return {...parseRepository(value),kind:'repository'};
  const owner=parts[0];
  if(!/^[a-z0-9](?:[a-z0-9-]{0,37}[a-z0-9])?$/i.test(owner)||['settings','explore','topics','search','orgs','users','login','marketplace','notifications','pulls','issues'].includes(owner.toLowerCase()))throw new Error('Enter a GitHub account profile URL.');
  return {kind:'portfolio',owner,url:'https://github.com/'+owner};
}

