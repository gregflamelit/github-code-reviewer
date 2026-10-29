export function evidenceCategory(item){
  if(item.category)return item.category;
  if(item.type!=='file')return ['issue','issue_comment'].includes(item.type)?'issues':['pull_request','pull_request_review','pull_request_comment','pull_request_diff'].includes(item.type)?'pull_requests':'context';
  const path=item.originalPath||item.path;
  if(/(^|\/)(__tests__|tests?|specs?|fixtures?|cypress|playwright)(\/|\.)|[._-](test|spec)\.|(^|\/)test_[^/]+|\.github\/workflows\//i.test(path))return 'tests';
  if(/\.(md|mdx|rst|txt|ipynb)$|(^|\/)(docs?|adrs?|research|design)\//i.test(path))return 'documentation';
  return 'implementation';
}

export function summarizeEvidence(evidence=[]){
  const counts=Object.fromEntries(['implementation','tests','documentation','issues','pull_requests','context'].map(category=>[category,{items:0,characters:0,truncated:0}]));
  for(const item of evidence){const category=evidenceCategory(item);counts[category]??={items:0,characters:0,truncated:0};counts[category].items++;counts[category].characters+=item.content.length;if(item.truncated)counts[category].truncated++;}
  return counts;
}

export function balanceEvidence(items){
  const categories=['tests','documentation','implementation','issues','pull_requests','context'];
  const groups=categories.map(category=>items.filter(item=>evidenceCategory(item)===category));
  const result=[];
  while(groups.some(group=>group.length))for(const group of groups)if(group.length)result.push(group.shift());
  return result;
}
