import PDFDocument from 'pdfkit';
import {existsSync} from 'node:fs';
import {summarizeEvidence} from './evidence.mjs';

const number=value=>value==null?'Unknown':value.toFixed(1);
const clean=value=>String(value??'').replace(/[\u2010-\u2015\u2212]/g,'-').replace(/\u00a0/g,' ');

export async function createReportPdf(review,{rubricId}={}){
  if(review.status!=='completed'||!review.report)throw Object.assign(new Error('PDF reports are available after evaluation completes.'),{status:409});
  const all=review.reports||[review.report];
  const reports=rubricId?all.filter(report=>report.rubricId===rubricId):all;
  if(!reports.length)throw Object.assign(new Error('Unknown or unavailable rubric report.'),{status:400});
  const title=review.portfolio?.owner||review.repository?.fullName||review.url;
  const doc=new PDFDocument({size:'A4',margins:{top:54,bottom:54,left:50,right:50},bufferPages:true,info:{Title:title+' - '+(rubricId?reports[0].rubricName:'Consolidated evaluation'),Author:'GitHub Code Reviewer',Subject:'Evidence-based repository assessment'}});
  const chunks=[];const done=new Promise((resolve,reject)=>{doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);});
  const regular=['C:/Windows/Fonts/arial.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf','/System/Library/Fonts/Supplemental/Arial.ttf'].find(existsSync);
  const bold=['C:/Windows/Fonts/arialbd.ttf','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf','/System/Library/Fonts/Supplemental/Arial Bold.ttf'].find(existsSync);
  doc.registerFont('Body',regular||'Helvetica');doc.registerFont('Heading',bold||regular||'Helvetica-Bold');
  const width=doc.page.width-100;
  function room(height=65){if(doc.y+height>doc.page.height-65)doc.addPage();}
  function heading(text,level=2){room(level===1?100:65);doc.font('Heading').fontSize(level===1?23:level===2?15:11).fillColor('#175e4b').text(clean(text),50,doc.y,{width});doc.moveDown(.5);}
  function text(value,options={}){doc.font('Body').fontSize(9).fillColor('#263c38').text(clean(value),50,doc.y,{width,lineGap:3,...options});doc.moveDown(.6);}
  function link(label,url){if(!/^https:\/\/github\.com\//.test(url||''))return;room(30);doc.font('Body').fontSize(8).fillColor('#176650').text(clean(label),50,doc.y,{width,link:url,underline:true});doc.moveDown(.5);}
  function findings(insights){
    if(!insights)return;
    for(const [label,groups]of [['Biggest areas for improvement',insights.demonstrated],['Evidence that would strengthen the assessment',insights.evidenceGaps]]){
      heading(label);
      if(!groups?.length)text('No qualifying findings in the collected evidence.');
      for(const group of groups||[]){heading(group.title,3);for(const c of group.criteria){heading(c.criterionId+' '+c.title+' | '+(c.score==null?'Unknown':c.score+'/4'),3);text(c.rationale);text('Next validation: '+(c.nextValidation||'Collect direct supporting evidence.'));for(const ref of c.evidence||[])link(ref.path+' (excerpt lines '+ref.start_line+'-'+ref.end_line+')',ref.url);}}
    }
  }
  heading('GitHub Code Reviewer',1);text(rubricId?reports[0].rubricName:'Consolidated evaluation - all three rubrics');heading(title,1);
  text('Evaluated: '+review.createdAt+' | Criteria '+(review.rubricVersion||'historical')+' | Scoring '+(review.scoringVersion||'historical'));
  text('This report evaluates sampled repository artifacts, not personal proficiency or authorship. Scores describe observed criteria. Evidence coverage is separate from quality; unknown is not zero. Source inspection does not verify that tests passed or that discussion claims are true.');
  for(const report of reports){heading(report.rubricName,3);text('Score '+number(report.score)+'/100 | Evidence coverage '+number(report.coverage)+'% | '+report.band);text('Possible score range '+number(report.lower)+'-'+number(report.upper)+'. Bounds represent unknown criteria, not statistical confidence.');}
  heading('Collection scope');
  text(review.portfolio?review.portfolio.consolidationMethod:'Single repository at its pinned revision.');
  const repos=review.portfolio?.included||[review.repository].filter(Boolean);
  for(const repo of repos){heading(repo.fullName,3);text('Commit '+repo.sha+' | '+(repo.incorporatedFiles??review.evidence?.filter(e=>e.type==='file').length??0)+' sampled files');link('Open pinned source',repo.url+'/tree/'+repo.sha);}
  if(review.portfolio){text('Discovered '+review.portfolio.discoveredCount+' | Eligible '+review.portfolio.eligibleCount+' | Failed '+review.portfolio.failed.length);for(const repo of [...review.portfolio.excluded,...review.portfolio.failed])text(repo.fullName+': '+repo.reason);if(review.portfolio.listingTruncated)text('Discovery limit reached: additional public repositories may exist.');}
  const categories=summarizeEvidence(review.evidence);
  text('Evidence included: '+Object.entries(categories).map(([category,stats])=>category.replaceAll('_',' ')+' '+stats.items+' items ('+stats.characters+' characters)').join('; '));
  text('Mutable issues, comments, reviews, and PR patches are supplemental snapshots and may postdate the pinned implementation. A first-page or character-limited sample cannot prove absence.');
  for(const report of reports){
    doc.addPage();heading(report.rubricName,1);text('Observed score '+number(report.score)+'/100 | Coverage '+number(report.coverage)+'% | '+report.band);
    heading('Domain scores and coverage');
    for(const domain of report.domains)text(domain.id+' '+domain.name+' | '+(domain.applicable?number(domain.score)+'/100; coverage '+number(domain.coverage)+'%':'Not applicable')+' | Weight '+number(domain.weight*100)+'%');
    findings(report.insights||review.insights);
    heading('Criterion-level assessment',1);
    for(const domain of report.domains){heading(domain.id+' '+domain.name);for(const row of domain.rows){
      const criterion=review.catalog?.rubric.domains.find(d=>d.id===domain.id)?.criteria.find(c=>c.id===row.criterion_id);
      heading(row.criterion_id+' '+(criterion?.name||'')+' | '+(row.score==null?row.status:row.score+'/4'),3);
      text(row.rationale);text('Confidence: '+row.confidence+'. Next validation: '+(row.next_validation||'Not specified.'));
      for(const ref of row.evidence||[]){link(ref.path+' | excerpt lines '+ref.start_line+'-'+ref.end_line,ref.url);text(ref.quote,{indent:10});if(ref.temporal_scope)text('Supplemental history snapshot: '+(ref.collectedAt||'see collection notes'));}
    }}
  }
  doc.addPage();heading('Collection and validation notes',1);for(const warning of [...(review.warnings||[]),...(review.validationWarnings||[])])text('- '+warning);
  const range=doc.bufferedPageRange();for(let index=range.start;index<range.start+range.count;index++){doc.switchToPage(index);const bottom=doc.page.margins.bottom;doc.page.margins.bottom=0;doc.font('Body').fontSize(8).fillColor('#71817b').text('GitHub Code Reviewer | '+(index+1)+' / '+range.count,50,doc.page.height-38,{width,align:'right',lineBreak:false});doc.page.margins.bottom=bottom;}
  doc.end();return done;
}
