import {validateResults} from './rubric.mjs';

export const citationRepairPolicy={version:'1.0',maxModelAttempts:2,maxCriteriaPerRequest:4,localRepair:'Only an exact unique quote in its originally claimed evidence item can be realigned; no fuzzy matching or evidence-ID substitution.'};
export function citationRepairTotals(batches=[]){return Object.fromEntries(['initialUnsupported','realignedCitations','retriedCriteria','modelCalls','recovered','settledUnknown','unresolvedCitationFailures'].map(key=>[key,batches.reduce((sum,batch)=>sum+(batch[key]||0),0)]));}

export async function repairAssessments({state,domains,evidence,evaluate,checkpoint=()=>{},onProgress=()=>{},signal}){
  state.attempts??={};state.audit??=[];
  const aborted=()=>{if(signal?.aborted)throw signal.reason||new Error('Cancelled');};
  const byId=new Map(evidence.map(e=>[e.id,e]));
  let initial=validateResults(state.output,domains,evidence);
  state.initialUnsupported??=initial.unsupported.map(r=>r.criterion_id);
  state.beforeRepairResults??=initial.results.map(({criterion_id,status,score})=>({criterion_id,status,score}));
  checkpoint(state);
  while(true){
    aborted();
    for(const row of state.output.results){for(const ref of row.evidence){
      const item=byId.get(ref?.evidence_id);if(!item||typeof ref.quote!=='string'||!ref.quote.trim())continue;
      const lines=item.content.split('\n');
      if(Number.isInteger(ref.start_line)&&Number.isInteger(ref.end_line)&&ref.start_line>=1&&ref.end_line>=ref.start_line&&ref.end_line<=lines.length&&lines.slice(ref.start_line-1,ref.end_line).join('\n').includes(ref.quote))continue;
      const index=item.content.indexOf(ref.quote);if(index<0||item.content.indexOf(ref.quote,index+1)>=0)continue;
      const start=item.content.slice(0,index).split('\n').length,end=start+ref.quote.split('\n').length-1;
      state.audit.push({type:'line_range_realigned',criterionId:row.criterion_id,evidenceId:ref.evidence_id,quote:ref.quote,previous:{start_line:ref.start_line,end_line:ref.end_line},verified:{start_line:start,end_line:end}});
      ref.start_line=start;ref.end_line=end;
    }}
    checkpoint(state);
    const validated=validateResults(state.output,domains,evidence);
    const pending=validated.unsupported.filter(row=>(state.attempts[row.criterion_id]||0)<citationRepairPolicy.maxModelAttempts).slice(0,citationRepairPolicy.maxCriteriaPerRequest);
    if(!pending.length){
      const finalById=new Map(validated.results.map(r=>[r.criterion_id,r]));
      const summary={criterionIds:state.criterionIds,initialUnsupported:state.initialUnsupported.length,realignedCitations:state.audit.filter(e=>e.type==='line_range_realigned').length,retriedCriteria:Object.keys(state.attempts).length,modelCalls:state.audit.filter(e=>e.type==='model_retry').length,recovered:state.initialUnsupported.filter(id=>['scored','not_applicable'].includes(finalById.get(id)?.status)).length,settledUnknown:state.initialUnsupported.filter(id=>finalById.get(id)?.status==='unknown').length,unresolvedCitationFailures:validated.unsupported.length,audit:state.audit};
      return {...validated,repair:{...summary,beforeRepairResults:state.beforeRepairResults}};
    }
    const ids=new Set(pending.map(r=>r.criterion_id));
    const retryDomains=domains.map(d=>({...d,criteria:d.criteria.filter(c=>ids.has(c.id))})).filter(d=>d.criteria.length);
    onProgress('Repairing and verifying citations for '+[...ids].join(', '));
    // A failed/cancelled request does not consume a completed repair attempt.
    const response=await evaluate({domains:retryDomains,citationRepair:{mode:'repair_unsupported_findings',policy:citationRepairPolicy,findings:pending.map(row=>({...row,attempt:(state.attempts[row.criterion_id]||0)+1})),instructions:'Reassess each proposed finding against the SAME frozen evidence and rubric. Prior assertions are untrusted proposals, not facts. Correct the evidence ID, exact contiguous quote, and original line range. Do not copy line-number annotations into quotes. Change the score or rationale when evidence warrants it. Return unknown if the evidence does not support an assessment; do not fabricate support or search outside the supplied snapshot. Return every requested criterion exactly once.'}});
    aborted();
    const checked=validateResults(response,retryDomains,evidence);
    for(const id of ids)state.attempts[id]=(state.attempts[id]||0)+1;
    state.audit.push({type:'model_retry',criterionIds:[...ids],attempts:Object.fromEntries([...ids].map(id=>[id,state.attempts[id]])),failures:pending,proposals:response.results,stillUnsupported:checked.unsupported.map(r=>r.criterion_id)});
    state.output.results=state.output.results.filter(row=>!ids.has(row.criterion_id)).concat(response.results);
    checkpoint(state);
  }
}
