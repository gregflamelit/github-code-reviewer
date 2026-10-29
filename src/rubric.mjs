import { readFileSync } from 'node:fs';

export const rubric = JSON.parse(readFileSync(new URL('../evaluation-rubric.json', import.meta.url), 'utf8'));
export const scoringConfig = JSON.parse(readFileSync(new URL('../scoring-rubrics.json', import.meta.url), 'utf8'));
export const currentCatalog = {rubric,scoringConfig};
export const legacyCatalog = {
  rubric:JSON.parse(readFileSync(new URL('../rubric-versions/criteria-1.0.json',import.meta.url),'utf8')),
  scoringConfig:JSON.parse(readFileSync(new URL('../rubric-versions/scoring-1.1.json',import.meta.url),'utf8'))
};
export function getReviewCatalog(review){
  if(review.catalog)return review.catalog;
  if(!review.rubricVersion||review.rubricVersion==='1.0')return legacyCatalog;
  throw new Error('This review is missing its versioned rubric snapshot. Start a new review.');
}
export const criterionCount = catalog=>catalog.rubric.domains.reduce((sum,d)=>sum+d.criteria.length,0);
export const profiles = {
  comprehensive: { name: 'Comprehensive', domains: rubric.domains.map(d => d.id), critical: ['F1', 'F10', 'F12'] },
  application: { name: 'Application builder', domains: ['C1','C2','C3','C4','F1','F2','F3','F10','F11','F12','F13'], critical: ['F1','F10','F12'] },
  ai: { name: 'AI and workflow builder', domains: ['C1','C2','C3','C4','F1','F2','F3','F7','F8','F9','F10','F11','F12','F13'], critical: ['F1','F7','F12'] },
  data: { name: 'Data practitioner', domains: ['C1','C2','C3','C4','F1','F4','F5','F6','F10','F11','F12','F13'], critical: ['F5'] }
};

export function aggregate(results, profileId='comprehensive', scoringRubric=null, assessmentRubric=rubric, scoringVersion=scoringConfig.rubric_version) {
  const profile = profiles[profileId];
  const domains = assessmentRubric.domains.filter(d => d.pool==='role' ? d.id===scoringRubric?.role_domain : (profileId==='comprehensive'||profile.domains.includes(d.id))).map(domain => {
    const rows = domain.criteria.map(c => ({...(results.find(r => r.criterion_id === c.id)||{criterion_id:c.id,status:'unknown',score:null,confidence:'low',rationale:'This criterion has not yet been assessed.',evidence:[],next_validation:'Complete the evidence assessment for this criterion.'}),criterionWeight:c.domain_weight_percent}));
    const applicable = rows.filter(r => r.status !== 'not_applicable');
    const observed = applicable.filter(r => r.status === 'scored');
    const applicableWeight=applicable.reduce((s,r)=>s+r.criterionWeight,0);
    const observedWeight=observed.reduce((s,r)=>s+r.criterionWeight,0);
    const baseWeight=domain.pool==='role'?scoringRubric.role_pool_percent:scoringRubric ? (domain.pool==='core'?scoringRubric.core_weights_percent[domain.id]:scoringRubric.functional_weights_percent[domain.id]) : domain.weight;
    return { id: domain.id, name: domain.name, pool: domain.pool, baseWeight,
      applicable: applicable.length > 0, coverage: applicableWeight ? observedWeight/applicableWeight*100 : null,
      score: observedWeight ? observed.reduce((s,r)=>s+r.score/4*r.criterionWeight,0)/observedWeight*100 : null,
      rows };
  });
  const functional = domains.filter(d => d.pool === 'functional' && d.applicable);
  const fWeight = functional.reduce((s,d) => s+d.baseWeight,0);
  let earned = 0, covered = 0;
  for (const d of domains) {
    d.weight = d.pool === 'core'||d.pool==='role' ? d.baseWeight/100 : d.applicable && fWeight ? (scoringRubric?.functional_pool_percent??40)/100*d.baseWeight/fWeight : 0;
    earned += d.weight * (d.coverage ?? 0)/100 * (d.score ?? 0)/100;
    covered += d.weight * (d.coverage ?? 0)/100;
  }
  // A profile with no applicable functional skill cannot silently redistribute its 40%.
  const rounded=n=>Math.round(n*1e10)/1e10;
  const coverage = rounded(covered*100);
  const score = covered ? rounded(earned/covered*100) : null;
  const critical=scoringRubric?.critical_domains??profile.critical;
  const requiredIds=[...new Set([...domains.filter(d=>d.pool==='core').map(d=>d.id),...critical])];
  const eligible = coverage >= 80 && requiredIds.every(id=>{const d=domains.find(d=>d.id===id);return d?.applicable&&d.coverage>=75;});
  let band = !eligible ? 'Provisional — evidence incomplete' : score <25 ? 'Major gaps demonstrated' : score <50 ? 'Fragile' : score <75 ? 'Functional' : score <90 ? 'Robust' : 'Well justified and validated';
  if (eligible && score >=75 && domains.filter(d => d.pool==='core'||critical.includes(d.id)).some(d => d.score <75)) band = 'Uneven';
  const blockers=requiredIds.flatMap(id=>{const d=domains.find(d=>d.id===id);return !d?.applicable||d.coverage<75?[{id,reason:!d?.applicable?'Required skill is not applicable to this project':'Less than 75% evidence coverage'}]:[];});
  return { rubricId:scoringRubric?.id??'ai_product_manager',rubricName:scoringRubric?.name??'AI Product Manager',criteriaVersion:assessmentRubric.rubric_version,scoringVersion,score,coverage,lower:rounded(earned*100),upper:rounded(earned*100+(1-covered)*100),band,eligible,blockers,domains };
}

export function aggregateAll(results,catalog=currentCatalog){return catalog.scoringConfig.rubrics.map(r=>aggregate(results,'comprehensive',r,catalog.rubric,catalog.scoringConfig.rubric_version));}

export function resultSchema(domains) {
  return { type:'object', additionalProperties:false, required:['summary','results'], properties:{ summary:{type:'string'}, results:{type:'array', items:{type:'object',additionalProperties:false,
    required:['criterion_id','status','score','confidence','rationale','evidence','next_validation'], properties:{
      criterion_id:{type:'string', enum:domains.flatMap(d=>d.criteria.map(c=>c.id))}, status:{type:'string',enum:['scored','unknown','not_applicable']},
      score:{type:['integer','null'],minimum:0,maximum:4}, confidence:{type:'string',enum:['low','medium','high']}, rationale:{type:'string'},
      evidence:{type:'array',items:{type:'object',additionalProperties:false,required:['evidence_id','start_line','end_line','quote'],properties:{evidence_id:{type:'string'},start_line:{type:'integer',minimum:1},end_line:{type:'integer',minimum:1},quote:{type:'string'}}}},
      next_validation:{type:'string'}
    }}}}};
}

export function validateResults(output, domains, evidence) {
  if (!output || typeof output.summary !== 'string' || !Array.isArray(output.results)) throw new Error('Codex returned an invalid evaluation object.');
  const expected = new Set(domains.flatMap(d=>d.criteria.map(c=>c.id)));
  const seen = new Set();
  const byId = new Map(evidence.map(e=>[e.id,e]));
  const warnings = [];
  const results = output.results.map(input => {
    const r = structuredClone(input);
    if (!expected.has(r.criterion_id)||seen.has(r.criterion_id)) throw new Error('Unexpected or duplicate criterion: '+r.criterion_id);
    seen.add(r.criterion_id);
    if (!['scored','unknown','not_applicable'].includes(r.status) || !['low','medium','high'].includes(r.confidence) || typeof r.rationale!=='string'||!r.rationale.trim() || typeof r.next_validation!=='string'||!Array.isArray(r.evidence)) throw new Error('Invalid criterion fields: '+r.criterion_id);
    if (r.status==='scored' ? !Number.isInteger(r.score)||r.score<0||r.score>4 : r.score!==null) throw new Error('Invalid score state: '+r.criterion_id);
    if (r.criterion_id.startsWith('C') && r.status==='not_applicable') { r.status='unknown'; r.score=null; warnings.push(r.criterion_id+': core capability cannot be excluded.'); }
    const verified=[];
    for (const ref of r.evidence) {
      const e=byId.get(ref.evidence_id);
      if (!e || !Number.isInteger(ref.start_line)||!Number.isInteger(ref.end_line)||ref.start_line<1||ref.end_line<ref.start_line||ref.end_line>e.content.split('\n').length||typeof ref.quote!=='string'||!ref.quote.trim()) continue;
      const excerpt=e.content.split('\n').slice(ref.start_line-1,ref.end_line).join('\n');
      if (!excerpt.includes(ref.quote)) continue;
      verified.push({...ref,url:e.type==='file' ? e.url+'#L'+ref.start_line+'-L'+ref.end_line:e.url,path:e.path,type:e.type,...(e.repository?{repository:e.repository,commit_sha:e.commit_sha}:{})});
    }
    if ((r.status==='scored'||r.status==='not_applicable')&&!verified.length) {
      warnings.push(r.criterion_id+': unsupported assessment converted to unknown.');
      r.status='unknown'; r.score=null; r.next_validation='Collect direct supporting evidence. '+r.next_validation;
    }
    r.evidence=verified;
    return r;
  });
  for (const id of expected) if (!seen.has(id)) { warnings.push(id+': missing assessment converted to unknown.'); results.push({criterion_id:id,status:'unknown',score:null,confidence:'low',rationale:'Codex did not assess this criterion.',evidence:[],next_validation:'Collect evidence and assess this criterion.'}); }
  return {summary:output.summary, results,warnings};
}
