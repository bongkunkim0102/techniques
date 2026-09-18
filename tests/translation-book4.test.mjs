import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';import {translationVolumes} from '../src/lib/translations.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const translations=await read('../src/data/translations.json'),examples=await read('../data/reference/translation-examples.json'),p=await read('../data/reference/ptolemy-book4-completion-2026-09-18.json');
const hash=x=>createHash('sha256').update(x,'utf8').digest('hex'),chapter=n=>p.chapters.find(c=>c.chapter===n),find=id=>translations.find(t=>t.id===id),text=n=>find(chapter(n).translationId).paragraphs.join('\n');
test('Book IV contains ten directly authored chapters with edition-specific locations',()=>{
 assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.method,'direct-editor');assert.deepEqual(p.chapters.map(c=>c.chapter),Array.from({length:10},(_,i)=>i+1));
 for(const c of p.chapters){const t=find(c.translationId);assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.method,'direct-editor');assert(!('requestedModel' in t));assert(!('reportedModels' in t));assert.equal(t.series.id,'ptolemy-book4');assert.equal(t.series.order,c.chapter);assert.equal(new URL(t.sourceUrl).hash,`#page=${c.pdfPages[0]}`);assert.deepEqual(c.printedPages,c.pdfPages.map(n=>n-33));assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));assert.match(t.scope,/본문 전체/);}
});
test('95 source paragraphs map once to all 115 Korean paragraphs and valid hashes',()=>{
 assert.deepEqual(p.chapters.map(c=>c.sourceParagraphs.length),[1,5,6,13,14,8,12,5,11,20]);assert.deepEqual(p.chapters.map(c=>find(c.translationId).paragraphs.length),[1,5,7,14,20,8,13,6,15,26]);
 for(const c of p.chapters){const t=find(c.translationId);assert.deepEqual(c.alignment.map(a=>a.sourceParagraphIndex),c.sourceParagraphs.map((_,i)=>i));assert(c.alignment.every(a=>a.targetParagraphIndices.length));assert.deepEqual(c.alignment.flatMap(a=>a.targetParagraphIndices),t.paragraphs.map((_,i)=>i));assert.equal(c.sourceHash,hash(c.sourceParagraphs.join('\n\n')));assert.equal(t.sourceHash,c.sourceHash);assert.deepEqual(c.targetParagraphHashes,t.paragraphs.map(hash));assert(t.paragraphs.every(x=>/[가-힣]/u.test(x)&&!x.includes('\uFFFD')));}
});
test('seven verified source differences retain meaning and valid page locations',()=>{
 assert.equal(p.chapters.flatMap(c=>c.variants).length,7);for(const c of p.chapters)for(const v of c.variants){assert(c.sourceParagraphs[v.paragraph].includes(v.to));assert(v.page>=c.pdfPages[0]&&v.page<=c.pdfPages[1]);}
 assert.match(chapter(9).sourceParagraphs[3],/abundant and immoderate heat/);assert.match(text(9),/풍부하고 지나친 열/);assert(!chapter(9).sourceParagraphs[3].includes('immediate heat'));assert.match(chapter(10).sourceParagraphs[10],/affections of the mind/);assert.match(text(10),/마음이 겪는 변화/);
});
test('annual monthly and daily rates preserve 28 days and two-and-a-third days',()=>{
 const s=chapter(10).sourceParagraphs[13];assert.match(s,/one sign for a year/);assert.match(s,/twenty-eight days per sign/);assert.match(s,/two days and a third/);
 const t=text(10);assert.match(t,/1년에 한 사인/);assert.match(t,/사인마다 28일/);assert.match(t,/사인마다 2일과 3분의 1일/);assert.equal((2+1/3)*12,28);
 const numbers={'four':4,'ten':10,'eight':8,'nineteen':19,'fifteen':15,'twelve':12};const durations=chapter(10).sourceParagraphs.slice(3,9).map(s=>Object.entries(numbers).find(([word])=>new RegExp('\\b'+word+'\\b').test(s))?.[1]);assert.deepEqual(durations,[4,10,8,19,15,12]);let sum=0;assert.deepEqual(durations.map(n=>sum+=n),[4,14,22,41,56,68]);
});
test('technical distinctions remain source-specific rather than being silently unified',()=>{
 assert.match(text(2),/낮의 출생이든 밤의 출생이든/);assert.match(chapter(7).sourceParagraphs[1],/seventeen degrees/);assert.match(text(7),/17도 이내/);
 assert.match(text(5),/태양에 관해서는.*달에 관해서는/);assert.match(text(10),/어느 하나만이 아니라 그 전체/);
 const s=chapter(10).sourceParagraphs[14];assert.match(s,/Saturn, on places of general periods/);assert.match(s,/Jupiter, on places of annual periods/);assert.match(s,/Moon’s transit over daily places/);
});
test('all four books contain 70 continuous chapters and exactly 40 Book IV source pages',()=>{
 const volumes=translationVolumes(translations.filter(t=>t.sourceId==='ptolemy-ashmand1822'));assert.deepEqual(volumes.map(v=>v.entries.length),[27,14,19,10]);for(const v of volumes)assert.deepEqual(v.entries.map(t=>t.series.order),v.entries.map((_,i)=>i+1));
 const pages=new Set();for(const c of p.chapters)for(let n=c.pdfPages[0];n<=c.pdfPages[1];n++)pages.add(n);assert.deepEqual([...pages].sort((a,b)=>a-b),Array.from({length:40},(_,i)=>i+205));assert.deepEqual(p.reviewedPdfPages,[...pages].sort((a,b)=>a-b));
 assert.deepEqual(chapter(2).pdfPages,[205,206]);assert.equal(p.completion.lastPdfPage,244);assert.equal(p.completion.lastPrintedPage,211);
});
test('all ten chapters have full Korean references and source-aligned bilingual examples',()=>{
 for(const c of p.chapters){const t=find(c.translationId),refs=examples.filter(e=>e.translationId===t.id);assert.equal(refs.length,2);const whole=refs.find(e=>e.kind==='korean-reference'),pair=refs.find(e=>e.kind==='parallel-translation');assert.equal(whole.targetText,t.paragraphs.join('\n\n'));const i=c.sourceParagraphs.indexOf(pair.sourceText);assert(i>=0);assert.deepEqual(c.alignment[i].targetParagraphIndices,[pair.paragraphIndex]);assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(pair.targetText,t.paragraphs[pair.paragraphIndex]);for(const e of refs){assert.equal(e.sourceUrl,t.sourceUrl);assert.deepEqual(e.notes,t.editorialNotes);}}
});
test('62 earlier translations and 112 reference units are preserved unchanged',()=>{
 assert.equal(p.preservedTranslations.length,62);assert.equal(p.preservedReferences.length,112);for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(examples.find(e=>e.id===old.id))),old.sha256,old.id);
});
test('the final source paragraph is translated while end marker and appendix stay separate',()=>{
 const c=chapter(10),t=find(c.translationId);assert.equal(c.excludedBlocks.length,1);assert.equal(c.excludedBlocks[0].text,'THE END');assert(!c.sourceParagraphs.includes('THE END'));assert.match(c.sourceParagraphs.at(-1),/duly combined and blended together/);assert.match(t.paragraphs.at(-1),/마땅히 결합하고 어우러지도록/);assert.equal(p.completion.nextUntranslatedSection.pdfPage,245);
 for(const n of [2,3,4,5,6,7,8,9,10])assert(find(chapter(n).translationId).contentNotice);assert.match(find(chapter(5).translationId).contentNotice,/역사적 서술/);assert.match(find(chapter(9).translationId).contentNotice,/예측·진단/);
});
