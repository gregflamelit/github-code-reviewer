export const challenge = Object.freeze({
  id:'red-wine-v1', version:'1.0', title:'A better decision, bottled.',
  name:'The wine intelligence challenge', campaign:'AI Application Builder · Wine Challenge',
  description:'Turn wine chemistry into a useful product. Build a predictive model, explain what it knows, and bring it to life in a web application of your own design.',
  targetMinutes:30, limitMinutes:60, maxBonus:10,
  dataset:{name:'winequality-red.csv',rows:1599,features:11,target:'quality'},
  deliverables:[
    {title:'Predict quality',text:'Train a reproducible model using the 11 input attributes. Compare it with a simple baseline on a held-out split. Report MAE, your split, and random seed. Keep quality out of the model inputs.'},
    {title:'Make the model useful',text:'Explore patterns, explain predictions or errors, and describe limitations. Fit preprocessing on training data only. A generative AI feature is optional.'},
    {title:'Build the experience',text:'Create a functional web application that calls your model. Choose an audience and a useful workflow: a laboratory dashboard, a batch explorer, or something unexpected.'},
    {title:'Leave a clear handoff',text:'Include setup commands, dependencies, model training and inference instructions, tools used, and known gaps in your README. Commit model artifacts or document reproducible generation.'}
  ],
  rules:[
    'Use AI coding tools and other development tools. Disclose tools, templates, and external code in your README.',
    'The clock starts when GitHub authorization and repository access verification succeed. The assignment and dataset unlock together.',
    'Push to the assigned main branch as often as you like. Only pushes received by this service during your attempt count; local commits do not.',
    'Your last accepted push determines your submission and time. Finish now locks it early; otherwise the attempt closes at 60 minutes.',
    'Earn 10 speed points through minute 30, decreasing continuously to zero at minute 60. Work quality is scored separately.',
    'An outage or delayed webhook can be referred to the operator. Timing is based on service receipt, never author-controlled Git dates. All exceptions require an audit note.',
    'Reports assess repository evidence, not your resume. Unobserved skills remain unknown. A human reviews results; no automated hiring decision is made.'
  ],
  rubrics:['AI Product Manager','AI Engineering','AI Data Science','Human Centered Design']
});
export function timing(attempt,now=Date.now()) {
  if(!attempt.startedAt)return {elapsedSeconds:0,remainingSeconds:3600,bonus:10};
  const end=attempt.lastPushAt?Date.parse(attempt.lastPushAt):now;
  const elapsedSeconds=Math.max(0,(end-Date.parse(attempt.startedAt))/1000);
  return {elapsedSeconds,remainingSeconds:Math.max(0,(Date.parse(attempt.deadlineAt)-now)/1000),bonus:Math.round(10*Math.max(0,Math.min(1,(3600-elapsedSeconds)/1800))*100)/100};
}
