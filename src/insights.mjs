// Rankings are deterministic weighted opportunities, not another model's unsupported claims.
export function buildInsights(reports,catalog,validationWarnings=[]){
  const definitions=new Map(catalog.rubric.domains.map(d=>[d.id,d]));
  const groups=new Map();
  for(const report of reports){
    for(const domain of report.domains){
      if(!domain.weight)continue;
      const rowWeight=r=>r.criterionWeight??definitions.get(domain.id)?.criteria.find(c=>c.id===r.criterion_id)?.domain_weight_percent??0;
      const weight=domain.rows.filter(r=>r.status!=='not_applicable').reduce((s,r)=>s+rowWeight(r),0);
      if(!weight)continue;
      const group=groups.get(domain.id)||{domainId:domain.id,title:domain.name,demonstrated:new Map(),unknown:new Map()};
      for(const row of domain.rows){
        const globalWeight=domain.weight*rowWeight(row)/weight;
        const criterion=definitions.get(domain.id)?.criteria.find(c=>c.id===row.criterion_id);
        const item={criterionId:row.criterion_id,title:criterion?.name||row.criterion_id,score:row.score,rationale:row.rationale,nextValidation:row.next_validation,evidence:row.evidence,verificationIssue:validationWarnings.some(w=>w.startsWith(row.criterion_id+':')),weight:globalWeight};
        if(row.status==='scored'&&row.score<=2&&row.evidence.length){item.impact=globalWeight*(1-row.score/4);const old=group.demonstrated.get(row.criterion_id);if(!old||old.impact<item.impact)group.demonstrated.set(row.criterion_id,item);}
        if(row.status==='unknown'){const old=group.unknown.get(row.criterion_id);if(!old||old.weight<globalWeight)group.unknown.set(row.criterion_id,item);}
      }
      groups.set(domain.id,group);
    }
  }
  const ranked=(field)=>[...groups.values()].map(g=>{
    const criteria=[...g[field].values()].sort((a,b)=>(b.impact??b.weight)-(a.impact??a.weight)||a.criterionId.localeCompare(b.criterionId));
    return {domainId:g.domainId,title:g.title,priority:criteria.reduce((s,c)=>s+(c.impact??c.weight),0),criteria:criteria.slice(0,3)};
  }).filter(g=>g.criteria.length).sort((a,b)=>b.priority-a.priority||a.domainId.localeCompare(b.domainId)).slice(0,5);
  return {method:'Highest weighted domain opportunities; each criterion uses its largest effective weight across the three rubrics. Demonstrated weaknesses require scored evidence; unknowns are listed separately.',demonstrated:ranked('demonstrated'),evidenceGaps:ranked('unknown')};
}
