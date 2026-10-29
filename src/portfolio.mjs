import {parseGitHubTarget,collectRepository,github} from './github.mjs';

export const portfolioLimits={maxRepositories:8,maxListingPages:5,repositoriesPerPage:100,maxEvidenceCharacters:180000};

export async function collectPortfolio(url,{signal,onProgress=()=>{},request=github,collectRepo=collectRepository,limits=portfolioLimits}={}){
  const target=parseGitHubTarget(url);
  if(target.kind!=='portfolio')throw new Error('A profile URL is required for portfolio collection.');
  const discovered=[];let listingTruncated=false;
  for(let page=1;page<=limits.maxListingPages;page++){
    onProgress('Discovering public repositories for '+target.owner+' (page '+page+')');
    const items=await request('/users/'+target.owner+'/repos?type=owner&sort=full_name&direction=asc&per_page='+limits.repositoriesPerPage+'&page='+page,{signal});
    if(!Array.isArray(items))throw new Error('GitHub did not return a repository list.');
    discovered.push(...items);
    if(items.length<limits.repositoriesPerPage)break;
    if(page===limits.maxListingPages)listingTruncated=true;
  }
  const excluded=[],eligible=[],seen=new Set();
  for(const repo of discovered){
    const name=repo.name;
    if(typeof name!=='string'||! /^[a-z0-9_.-]+$/i.test(name)||name==='.'||name==='..')continue;
    const fullName=target.owner+'/'+name;
    if(seen.has(fullName.toLowerCase()))continue;seen.add(fullName.toLowerCase());
    const reason=repo.private?'Private repository':repo.owner?.login?.toLowerCase()!==target.owner.toLowerCase()?'Not owned by the requested account':repo.fork?'Fork':repo.archived?'Archived':repo.disabled?'Disabled':name.toLowerCase()===target.owner.toLowerCase()||name==='.github'?'Profile or account metadata':repo.size===0?'Empty repository':null;
    const item={name,fullName,url:'https://github.com/'+fullName,pushedAt:repo.pushed_at||null,description:repo.description||null};
    if(reason)excluded.push({...item,reason});else eligible.push(item);
  }
  eligible.sort((a,b)=>(b.pushedAt||'').localeCompare(a.pushedAt||'')||a.fullName.localeCompare(b.fullName));
  const selected=eligible.slice(0,limits.maxRepositories);
  excluded.push(...eligible.slice(limits.maxRepositories).map(r=>({...r,reason:'Repository limit; newer pushed projects selected first'})));
  if(!selected.length)throw new Error('No eligible public code repositories were found. Forks, archived, empty, and profile-metadata repositories are excluded.');
  const buckets=[],failed=[],included=[];
  for(const [index,item]of selected.entries()){
    if(signal?.aborted)throw signal.reason;
    onProgress('Collecting repository '+(index+1)+' of '+selected.length+': '+item.fullName);
    try{
      const collection=await collectRepo(item.url,{signal,request,onProgress:message=>onProgress(item.name+': '+message)});
      if(!collection.evidence.some(e=>e.type==='file'))throw new Error('No supported source or documentation files could be collected.');
      const manifest={...item,sha:collection.repository.sha,branch:collection.repository.branch,totalFiles:collection.repository.totalFiles,collectedAt:collection.repository.collectedAt,availableEvidenceItems:collection.evidence.length,incorporatedFiles:0,incorporatedCharacters:0,omittedEvidenceItems:0,warnings:collection.warnings};
      included.push(manifest);
      buckets.push(collection.evidence.map(e=>({...e,repository:item.fullName,commit_sha:collection.repository.sha,originalPath:e.path,path:item.fullName+'/'+e.path})));
    }catch(error){if(signal?.aborted)throw error;failed.push({...item,reason:error.message});}
  }
  if(!included.length)throw new Error('Evidence collection failed for every selected repository. '+failed.map(r=>r.name+': '+r.reason).join('; '));
  const scope={owner:target.owner,profileUrl:target.url,discoveredCount:seen.size,eligibleCount:eligible.length,selectedCount:selected.length,included,excluded,failed,listingTruncated,limits:{...limits},selectionPolicy:'Most recently pushed owned public projects; forks, archived, disabled, empty, profile README, and account metadata repositories excluded.',consolidationMethod:'One criterion assessment across the combined evidence; repository scores are not averaged.',collectionComplete:failed.length===0};
  const evidence=[{id:'E1',type:'portfolio_metadata',path:'Portfolio selection and scope',url:target.url,content:JSON.stringify({owner:target.owner,discoveredCount:seen.size,eligibleCount:eligible.length,selected:selected.map(r=>r.fullName),included:included.map(r=>({repository:r.fullName,sha:r.sha})),failed,excludedCounts:excluded.reduce((a,r)=>({...a,[r.reason]:(a[r.reason]||0)+1}),{}),listingTruncated,selectionPolicy:scope.selectionPolicy,limits},null,2)}];
  let used=evidence[0].content.length;
  if(used>limits.maxEvidenceCharacters)throw new Error('Portfolio metadata exceeds the configured evidence limit.');
  // Round-robin selection prevents a single large repository from consuming the shared budget.
  let pending=true;
  while(pending){
    pending=false;
    for(let i=0;i<buckets.length;i++){
      const item=buckets[i].shift();if(!item)continue;pending=true;
      if(used+item.content.length>limits.maxEvidenceCharacters){included[i].omittedEvidenceItems++;continue;}
      evidence.push({...item,id:'E'+(evidence.length+1)});used+=item.content.length;
      included[i].incorporatedCharacters+=item.content.length;
      if(item.type==='file')included[i].incorporatedFiles++;
    }
  }
  // Metadata-only sampling cannot establish any capability in an omitted project.
  const warnings=[
    'Consolidated portfolio inspection: one assessment over sampled artifacts, not a personal proficiency rating or an average of repository scores.',
    'Combined evidence is capped at '+limits.maxEvidenceCharacters+' characters and selected round-robin across repositories. Per-repository collection limits still apply.',
    'Repository code was not executed. Issues, full PR discussions, workflow results, and repository settings are not verified.'
  ];
  if(listingTruncated)warnings.push('Repository discovery reached its page limit; additional public repositories may exist.');
  if(eligible.length>selected.length)warnings.push('Only '+selected.length+' of '+eligible.length+' discovered eligible repositories were selected.');
  for(const repo of included){
    if(repo.omittedEvidenceItems)warnings.push(repo.fullName+': '+repo.omittedEvidenceItems+' evidence items omitted by the combined budget.');
    if(repo.incorporatedFiles===0){scope.collectionComplete=false;warnings.push(repo.fullName+': no source files fit the combined evidence budget.');}
    warnings.push(...repo.warnings.map(w=>repo.fullName+': '+w));
  }
  for(const repo of failed)warnings.push(repo.fullName+': collection failed: '+repo.reason);
  return {portfolio:scope,evidence,warnings};
}

export async function collectTarget(url,options={}){
  return parseGitHubTarget(url).kind==='portfolio'?collectPortfolio(url,options):collectRepository(url,options);
}
