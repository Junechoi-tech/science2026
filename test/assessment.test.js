import test from 'node:test';
import assert from 'node:assert/strict';
import { foods, foodQuestions } from '../src/digestion.js';
import { hasResponse, foodProgress, totalProgress, canMoveForward, makeSubmission, escapeHtml } from '../src/assessment.js';
import { packPdf } from '../src/report-pdf.js';
const student={school:'한입중학교',classroom:'2학년 3반',number:'12',name:'김학생'};
function fullResponses(){return Object.fromEntries(foods.flatMap(f=>foodQuestions[f.id].map((q,i)=>[`${f.id}:${i}`,q.type==='choice'?q.answer:Array.isArray(q.accepted[0])?q.accepted.map(g=>g[0]).join(' + '):q.accepted[0]])));}

test('every valid response unlocks movement regardless of correctness',()=>{
 const q=foodQuestions.potato[0];
 assert.equal(hasResponse(q,0),true);assert.equal(hasResponse(q,undefined),false);
 assert.equal(hasResponse(q,'0'),false);assert.equal(hasResponse(q,3),false);
 assert.equal(canMoveForward('potato',0,{'potato:0':0}),true);
 assert.equal(canMoveForward('potato',0,{}),false);
 assert.equal(canMoveForward('potato',6,fullResponses()),false);
 const text=foodQuestions.potato[1];assert.equal(hasResponse(text,'모르겠음'),true);
 assert.equal(hasResponse(text,'   '),false);assert.equal(hasResponse(text,'x'.repeat(81)),false);
});
test('food completion and all-28 completion count answers, not marks, and respond to edits',()=>{
 const answers=fullResponses();answers['potato:0']=0;answers['potato:1']='모름';
 assert.equal(foodProgress('potato',answers),7);assert.equal(totalProgress(answers),28);
 delete answers['almond:6'];assert.equal(totalProgress(answers),27);assert.equal(foodProgress('almond',answers),6);
 assert.throws(()=>makeSubmission(answers,student),/28문항/);
});
test('report snapshot captures all answers, marks and identity before later draft edits',()=>{
 const answers=fullResponses();answers['potato:0']=0;answers['potato:1']='모름';
 const report=makeSubmission(answers,student,'2026-10-31T02:00:00Z');
 assert.equal(report.rows.length,28);assert.equal(report.correct,26);
 assert.equal(report.rows[0].correct,false);assert.match(report.rows[0].answer,/아미노산/);
 assert.equal(report.rows[1].answer,'모름');assert.equal(report.rows[1].correct,false);
 assert.equal(report.rows[27].number,28);assert.equal(report.rows[27].correct,true);
 answers['potato:1']='연동 운동';student.name='다른학생';
 assert.equal(report.rows[1].answer,'모름');assert.equal(report.student.name,'김학생');student.name='김학생';
 assert.throws(()=>makeSubmission(fullResponses(),{name:'학생'}),/학년/);
 assert.equal(escapeHtml('<script>"&'), '&lt;script&gt;&quot;&amp;');
});
test('PDF binary has valid object offsets, page references and stream lengths',async()=>{
 const blob=packPdf([new Uint8Array([255,216,255,217])],2,2);
 assert.equal(blob.type,'application/pdf');const bytes=new Uint8Array(await blob.arrayBuffer());
 const data=new TextDecoder('latin1').decode(bytes);assert.ok(data.startsWith('%PDF-1.4'));
 assert.match(data,/\/Type \/Pages \/Count 1/);assert.match(data,/\/Length 4 >>\nstream/);
 const xref=Number(data.match(/startxref\n(\d+)/)[1]);assert.equal(new TextDecoder().decode(bytes.slice(xref,xref+4)),'xref');
 const entries=data.slice(data.indexOf('0000000000 65535 f')).split('\n').slice(1,6);
 entries.forEach((line,i)=>{const offset=Number(line.slice(0,10));assert.ok(new TextDecoder().decode(bytes.slice(offset,offset+7)).startsWith(`${i+1} 0 obj`));});
});
