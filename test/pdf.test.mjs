import test from 'node:test';
import assert from 'node:assert/strict';
import {createReportPdf} from '../src/pdf.mjs';

const report={rubricId:'ai_product_manager',rubricName:'AI Product Manager',score:51.25,coverage:60,lower:30,upper:70,band:'Provisional',domains:[{id:'C1',name:'Architecture',applicable:true,weight:1,score:50,coverage:60,rows:[{criterion_id:'C1.1',status:'scored',score:2,confidence:'medium',rationale:'Observed implementation',next_validation:'Test recovery',evidence:[{url:'https://github.com/a/b/blob/'+'a'.repeat(40)+'/README.md#L1',path:'README.md',start_line:1,end_line:1,quote:'Source excerpt'}]}]}],insights:{demonstrated:[],evidenceGaps:[]}};
const review={status:'completed',id:'fixture',url:'https://github.com/a/b',createdAt:'2026-10-29',report,reports:[report],repository:{fullName:'a/b',url:'https://github.com/a/b',sha:'a'.repeat(40)},evidence:[]};
test('PDF exports contain a valid paginated document and source link annotations',async()=>{
  const pdf=await createReportPdf(review);assert.equal(pdf.subarray(0,5).toString(),'%PDF-');assert.ok(pdf.toString('latin1').includes('/Subtype /Link'));assert.ok(pdf.toString('latin1').includes('/URI (https://github.com/a/b/'));assert.ok(pdf.toString('latin1').includes('%%EOF'));assert.ok(pdf.length>5000);assert.equal((pdf.toString('latin1').match(/\/Type \/Page\b/g)||[]).length,3,'footers must not create extra pages');
  const selected=await createReportPdf(review,{rubricId:'ai_product_manager'});assert.ok(selected.length>5000);
});
test('PDF refuses incomplete reviews and unavailable rubrics',async()=>{
  await assert.rejects(createReportPdf({...review,status:'evaluating'}),/after evaluation/);await assert.rejects(createReportPdf(review,{rubricId:'bad'}),/Unknown/);
});
