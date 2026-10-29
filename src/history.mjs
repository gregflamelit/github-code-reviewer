// Discussions are mutable supplemental evidence, never proof of executed behavior.
export async function collectHistory(base,{request,signal,add,warnings,onProgress=()=>{},collectedAt}){
  const limits={issues:4,pullRequests:2,comments:10,reviews:8,reviewComments:8,changedFiles:12,patchCharacters:2000,bodyCharacters:4000};
  let restricted=false;const endpoints=[];
  async function list(path,limit){
    if(restricted){endpoints.push({path,status:'skipped',collectedAt:new Date().toISOString(),reason:'Earlier rate/access restriction'});return [];}
    try{
      onProgress('Collecting discussion evidence: '+path.replace(base,''));
      const rows=await request(path,{signal});if(!Array.isArray(rows))throw new Error('Expected a list');
      const capped=rows.length>=limit;endpoints.push({path,status:'collected',collectedAt:new Date().toISOString(),returned:rows.length,possiblyTruncated:capped});
      if(capped)warnings.push('Discussion sample may be truncated: '+path);
      return rows.slice(0,limit);
    }catch(error){if(signal?.aborted)throw error;restricted=/rate.limit|access restriction|403|429/i.test(error.message);endpoints.push({path,status:'unavailable',collectedAt:new Date().toISOString(),reason:error.message});warnings.push('Discussion evidence unavailable: '+path+': '+error.message);return [];}
  }
  const repoUrl='https://github.com/'+base.slice('/repos/'.length);
  function item(type,path,url,fields,body='',extra={}){
    const snapshotAt=new Date().toISOString();
    const supplemental='Mutable discussion snapshot collected '+snapshotAt+'. May postdate the evaluated commit. Statements and approvals are not verified execution results.';
    const original=String(body||'').replace(/\r\n/g,'\n');
    add({type,path,url,temporal_scope:'supplemental_history',collectedAt:snapshotAt,content:[supplemental,...Object.entries(fields).map(([key,value])=>key+': '+(value??'unknown')),'',original.slice(0,limits.bodyCharacters)].join('\n'),truncated:original.length>limits.bodyCharacters,...extra});
  }
  const issues=await list(base+'/issues?state=all&sort=updated&direction=desc&per_page=12',12);
  for(const issue of issues.filter(i=>!i.pull_request).slice(0,limits.issues)){
    if(!Number.isSafeInteger(issue.number)||issue.number<1)continue;
    item('issue','Issue #'+issue.number,repoUrl+'/issues/'+issue.number,{title:issue.title,state:issue.state,author:issue.user?.login,created:issue.created_at,updated:issue.updated_at,labels:issue.labels?.map(l=>l.name).join(', ')},issue.body);
  }
  const comments=await list(base+'/issues/comments?sort=updated&direction=desc&per_page='+limits.comments,limits.comments);
  for(const comment of comments){
    const number=comment.issue_url?.match(/\/issues\/(\d+)$/)?.[1];if(!number||!Number.isSafeInteger(comment.id))continue;
    item('issue_comment','Discussion #'+number+' comment '+comment.id,repoUrl+'/issues/'+number+'#issuecomment-'+comment.id,{author:comment.user?.login,updated:comment.updated_at},comment.body);
  }
  const prs=await list(base+'/pulls?state=all&sort=updated&direction=desc&per_page='+limits.pullRequests,limits.pullRequests);
  for(const pr of prs){
    if(!Number.isSafeInteger(pr.number)||pr.number<1)continue;
    const pull=base+'/pulls/'+pr.number,pullUrl=repoUrl+'/pull/'+pr.number;
    item('pull_request','Pull request #'+pr.number,pullUrl,{title:pr.title,state:pr.state,author:pr.user?.login,head_sha:pr.head?.sha,base_sha:pr.base?.sha,merged_at:pr.merged_at,updated:pr.updated_at},pr.body);
    for(const review of await list(pull+'/reviews?per_page='+limits.reviews,limits.reviews)){
      if(!Number.isSafeInteger(review.id))continue;
      item('pull_request_review','PR #'+pr.number+' review '+review.id,pullUrl+'#pullrequestreview-'+review.id,{author:review.user?.login,state:review.state,submitted:review.submitted_at,review_commit:review.commit_id},review.body);
    }
    for(const comment of await list(pull+'/comments?per_page='+limits.reviewComments,limits.reviewComments)){
      if(!Number.isSafeInteger(comment.id))continue;
      item('pull_request_comment','PR #'+pr.number+' inline comment '+comment.id,pullUrl+'#discussion_r'+comment.id,{author:comment.user?.login,path:comment.path,line:comment.line,original_line:comment.original_line,commit:comment.commit_id,updated:comment.updated_at},comment.body);
    }
    for(const file of await list(pull+'/files?per_page='+limits.changedFiles,limits.changedFiles)){
      item('pull_request_diff','PR #'+pr.number+' diff '+file.filename,pullUrl+'/files',{path:file.filename,status:file.status,additions:file.additions,deletions:file.deletions,head_sha:pr.head?.sha},file.patch?'Diff excerpt (may omit context):\n'+file.patch.slice(0,limits.patchCharacters):'Patch unavailable (binary or GitHub omitted diff).',{truncated:!file.patch||file.patch.length>limits.patchCharacters});
    }
  }
  return {limits,endpoints,collectedAt,temporalScope:'Mutable supplemental history; bounded first-page samples, not exhaustive history'};
}
