import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const translations=await read('../src/data/translations.json');
const provenance=await read('../data/reference/ptolemy-book2-completion-2026-09-18.json');
const examples=await read('../data/reference/translation-examples.json');
const hash=x=>createHash('sha256').update(x,'utf8').digest('hex');
const find=id=>translations.find(t=>t.id===id);

test('Book II completion contains twelve directly authored chapters with exact locators',()=>{
 assert.equal(provenance.chapters.length,12);assert.equal(provenance.externalTranslationModelCalls,0);
 assert.deepEqual(provenance.chapters.map(c=>find(c.translationId).series.order),Array.from({length:12},(_,i)=>i+3));
 for(const c of provenance.chapters){const t=find(c.translationId);assert.equal(t.method,'direct-editor');assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.series.id,'ptolemy-book2');assert(!('requestedModel' in t));assert(!('reportedModels' in t));assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));assert.equal(new URL(t.sourceUrl).hash,`#page=${c.pdfPages[0]}`);assert.deepEqual(c.printedPages,c.pdfPages.map(p=>p-33));assert.match(t.scope,/본문 전체/);}
});

test('87 complete source paragraphs partition into 131 Korean paragraphs without gaps',()=>{
 assert.deepEqual(provenance.chapters.map(c=>c.sourceParagraphs.length),[21,2,6,2,4,9,10,4,4,12,5,8]);
 assert.deepEqual(provenance.chapters.map(c=>find(c.translationId).paragraphs.length),[36,3,6,3,6,12,22,5,7,12,9,10]);
 for(const c of provenance.chapters){const t=find(c.translationId);assert.deepEqual(c.alignment.map(a=>a.sourceParagraphIndex),c.sourceParagraphs.map((_,i)=>i));assert(c.alignment.every(a=>a.targetParagraphIndices.length>0));assert.deepEqual(c.alignment.flatMap(a=>a.targetParagraphIndices),t.paragraphs.map((_,i)=>i));assert.equal(c.sourceHash,hash(c.sourceParagraphs.join('\n\n')));assert.equal(t.sourceHash,c.sourceHash);assert.deepEqual(c.targetParagraphHashes,t.paragraphs.map(hash));assert(t.paragraphs.every(p=>/[가-힣]/u.test(p)&&!p.includes('\uFFFD')));}
});

test('edition variants are located on source pages and the reversed meaning is not reintroduced',()=>{
 for(const c of provenance.chapters)for(const v of c.variants){assert(c.sourceParagraphs[v.paragraph].includes(v.to),JSON.stringify(v));assert(v.page>=c.pdfPages[0]&&v.page<=c.pdfPages[1]);}
 const c=provenance.chapters.find(c=>c.translationId==='ptolemy-eclipse-effects');
 assert.match(c.sourceParagraphs.at(-1),/an effect least capable of being guarded against/);assert(!c.sourceParagraphs.at(-1).includes('at least capable'));
 assert.match(find(c.translationId).paragraphs.at(-1),/막아 대비하기가 가장 어려운/);
 assert.match(find('ptolemy-sky-weather-signs').paragraphs.join('\n'),/창백하거나 검고 끊어져/);
});

test('rotated geography table preserves twelve signs, both quadrants, and 72 named entries',()=>{
 const c=provenance.chapters[0],e=c.tables[0],t=find(c.translationId).tables[0];
 assert.equal(e.pdfPage,108);assert.equal(e.printedPage,75);assert.equal(t.afterParagraph,36);assert.equal(t.rows.length,12);
 assert.equal(e.sourceTableHash,hash(JSON.stringify(e.source)));assert.equal(find(c.translationId).sourceTableHash,e.sourceTableHash);
 assert.deepEqual(t.rows,e.target.rows);assert.deepEqual(t.columns,e.target.columns);
 assert.equal(new Set(t.rows.map(r=>r[0])).size,12);assert(t.rows.every(r=>r.length===6));
 assert.equal(e.source.rows.reduce((n,r)=>n+r[3].split('; ').length+r[5].split('; ').length,0),72);
 assert.equal(t.rows.reduce((n,r)=>n+r[3].split('·').length+r[5].split('·').length,0),72);
 const opposite={'North West':'South East','South East':'North West','North East':'South West','South West':'North East'};
 const ko={'North West':'북서','South East':'남동','North East':'북동','South West':'남서'};
 e.source.rows.forEach((r,i)=>{assert.equal(r[1],r[2]);assert.equal(r[4],opposite[r[2]]);for(const index of [1,2,4])assert.equal(t.rows[i][index],ko[r[index]]);});
 assert.match(e.source.rows[4][5],/Orchynia/);assert.match(t.rows[8][5],/^아라비아 펠릭스$/);
});

test('timing units and nearest-versus-preceding lunations remain distinct',()=>{
 assert.match(find('ptolemy-eclipse-timing').paragraphs[2],/일식이라면.*시간 수만큼.*여러 해.*월식이라면.*같은 수의 개월/u);
 const timing=find('ptolemy-eclipse-timing').paragraphs[3];for(const part of ['첫 네 달','둘째 네 달','셋째 네 달'])assert(timing.includes(part));
 assert.match(find('ptolemy-weather-judgment').paragraphs[0],/통과하기 이전에/);assert.match(find('ptolemy-new-moon-year').paragraphs[3],/가장 가까울 때/);
 const monthly=find('ptolemy-weather-judgment').paragraphs[2];assert(monthly.includes('신월이었다면'));assert(monthly.includes('보름달이었다면'));
});

test('each new chapter has a full Korean reference and a genuine aligned bilingual example',()=>{
 for(const c of provenance.chapters){const t=find(c.translationId),refs=examples.filter(e=>e.translationId===t.id);assert.equal(refs.length,2);
 const whole=refs.find(e=>e.kind==='korean-reference');assert.equal(whole.targetText,t.paragraphs.join('\n\n'));if(t.tables)assert.deepEqual(whole.tables,t.tables);
 const pair=refs.find(e=>e.kind==='parallel-translation');const i=c.sourceParagraphs.indexOf(pair.sourceText);assert(i>=0);assert.deepEqual(c.alignment[i].targetParagraphIndices,[pair.paragraphIndex]);assert.equal(pair.targetText,t.paragraphs[pair.paragraphIndex]);assert.equal(pair.sourceTextHash,hash(pair.sourceText));}
});

test('the previously committed 31 translations remain byte-equivalent at the object level',()=>{
 assert.equal(provenance.preservedTranslations.length,31);
 for(const old of provenance.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);
});

test('source coverage excludes captions rather than inventing prose and preserves notices',()=>{
 const excluded=provenance.chapters.flatMap(c=>c.excludedBlocks);assert.equal(excluded.length,2);
 const pages=new Set();for(const c of provenance.chapters){for(let p=c.pdfPages[0];p<=c.pdfPages[1];p++)pages.add(p);for(const e of c.excludedBlocks)assert(!c.sourceParagraphs.includes(e.text));}
 assert.deepEqual([...pages].sort((a,b)=>a-b),Array.from({length:42},(_,i)=>i+95));
 assert.match(find('ptolemy-regional-triplicities').contentNotice,/역사적 주장/);assert.match(find('ptolemy-eclipse-effects').contentNotice,/진단·예보가 아니며/);
 assert.equal(find('ptolemy-signs-weather').paragraphs.length,12);
 assert.deepEqual(provenance.next,{book:3,chapter:1,anchor:'CHAPTER_III_I',pdfPage:137,printedPage:104,title:'서문'});
});
