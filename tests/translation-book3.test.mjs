import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const translations=await read('../src/data/translations.json');
const provenance=await read('../data/reference/ptolemy-book3-completion-2026-09-18.json');
const examples=await read('../data/reference/translation-examples.json');
const hash=x=>createHash('sha256').update(x,'utf8').digest('hex');
const find=id=>translations.find(t=>t.id===id);
const chapter=n=>provenance.chapters.find(c=>c.chapter===n);

test('Book III has all nineteen directly authored chapters and exact edition locators',()=>{
 assert.equal(provenance.externalTranslationModelCalls,0);assert.equal(provenance.completionReview.externalTranslationModelCalls,0);
 assert.deepEqual(provenance.chapters.map(c=>c.chapter),Array.from({length:19},(_,i)=>i+1));
 for(const c of provenance.chapters){const t=find(c.translationId);assert.equal(t.series.id,'ptolemy-book3');assert.equal(t.series.order,c.chapter);assert.equal(t.method,'direct-editor');assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert(!('requestedModel' in t));assert(!('reportedModels' in t));assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));assert.equal(new URL(t.sourceUrl).hash,`#page=${c.pdfPages[0]}`);assert.deepEqual(c.printedPages,c.pdfPages.map(n=>n-33));assert.match(t.scope,/본문 전체/);assert.equal(t.sourceHashKind,'normalized-chapter-transcription');}
});

test('152 source paragraphs cover all 195 Korean paragraphs without omissions or duplication',()=>{
 assert.deepEqual(provenance.chapters.map(c=>c.sourceParagraphs.length),[4,6,5,11,12,7,4,5,3,7,2,4,5,9,10,12,16,18,12]);
 assert.deepEqual(provenance.chapters.map(c=>find(c.translationId).paragraphs.length),[4,8,5,11,16,7,4,5,5,9,2,4,5,14,14,14,20,35,13]);
 for(const c of provenance.chapters){const t=find(c.translationId);assert.deepEqual(c.alignment.map(a=>a.sourceParagraphIndex),c.sourceParagraphs.map((_,i)=>i));assert(c.alignment.every(a=>a.targetParagraphIndices.length));assert.deepEqual(c.alignment.flatMap(a=>a.targetParagraphIndices),t.paragraphs.map((_,i)=>i));assert.equal(c.sourceHash,hash(c.sourceParagraphs.join('\n\n')));assert.equal(t.sourceHash,c.sourceHash);assert.deepEqual(c.targetParagraphHashes,t.paragraphs.map(hash));assert(t.paragraphs.every(p=>p.trim()&&/[가-힣]/u.test(p)&&!p.includes('\uFFFD')));}
});

test('68 source pages and 15 explicit variants retain the complete Book III boundary',()=>{
 const pages=new Set();for(const c of provenance.chapters){for(let n=c.pdfPages[0];n<=c.pdfPages[1];n++)pages.add(n);for(const v of c.variants){assert(c.sourceParagraphs[v.paragraph].includes(v.to));assert(v.page>=c.pdfPages[0]&&v.page<=c.pdfPages[1]);}}
 assert.deepEqual([...pages].sort((a,b)=>a-b),Array.from({length:68},(_,i)=>i+137));assert.deepEqual(provenance.reviewedPdfPages,[...pages].sort((a,b)=>a-b));
 assert.equal(provenance.chapters.flatMap(c=>c.variants).length,15);const excluded=provenance.chapters.flatMap(c=>c.excludedBlocks);assert.equal(excluded.length,1);assert.equal(excluded[0].text,'End of the Third Book');assert(!chapter(19).sourceParagraphs.includes(excluded[0].text));
 assert.deepEqual(provenance.next,{book:4,chapter:1,title:'서문',pdfPage:205,printedPage:172,anchor:'CHAPTER_IV_I'});
});

test('source corrections preserve 148, rational thought and the restored causal phrases',()=>{
 assert.match(chapter(15).sourceParagraphs[1],/148 equatorial times/);assert(!chapter(15).sourceParagraphs[1].includes('140 equatorial times'));
 assert.match(chapter(15).sourceParagraphs[1],/as near as possible/);assert.match(find(chapter(15).translationId).paragraphs[1],/148은 102보다 46/);
 assert.match(chapter(18).sourceParagraphs[1],/rational and intellectual/);assert.match(chapter(18).sourceParagraphs[3],/astrology and divination/);
 assert.match(chapter(1).sourceParagraphs[1],/same accurate observation of the distinct natures/);
 assert.match(chapter(19).sourceParagraphs[3],/governed by the malefics; that is to say/);
});

test('the worked example uses equatorial time and reproduces all stated arithmetic',()=>{
 const source=chapter(15).sourceParagraphs,t=find(chapter(15).translationId),text=t.paragraphs.join('\n');
 const initial=Number(source[1].match(/mid-heaven (\d+) equatorial times/)[1]);
 const product=Number(source[1].match(/to be (\d+)\./)[1]);assert.equal(product,6*17);assert.equal(initial-product,46);
 const culminating=Number(source[2].match(/mid-heaven (\d+) equatorial times/)[1]);const distance=Number(source[3].match(/distance of (\d+) equatorial times/)[1]);
 assert.equal(culminating,58);assert.equal(product-distance,70);assert.equal(17*3+13,64);assert.equal(culminating+(70-culminating)*3/6,64);assert.equal(culminating+(70-culminating)*2/6,62);assert.equal(70-(70-culminating)*2/6,66);
 for(const value of ['시간도 58','시간도 70','시간도 64'])assert(text.includes(value));
 assert.match(find(chapter(14).translationId).paragraphs[8],/적도 1도는 태양년 1년/);assert.match(find(chapter(10).translationId).paragraphs[6],/일수 또는 시간 수/);
});

test('technical distinctions are retained instead of silently importing later rules',()=>{
 assert.match(find(chapter(3).translationId).paragraphs[1],/트리플리시티·거처·익절테이션·텀·위상 또는 배치/);
 assert.match(find(chapter(13).translationId).paragraphs[1],/밤과 낮의 모든 경우/);assert.match(chapter(13).sourceParagraphs[1],/in all cases, both by night and day/);
 const protection=find(chapter(14).translationId).paragraphs[5];assert.match(protection,/목성이면 12도/);assert.match(protection,/금성이면 8도/);assert.match(protection,/황위가 같지 않을/);
 assert.match(find(chapter(15).translationId).paragraphs[13],/사건들과 앞으로 곧 뒤따를/);
 assert.match(find(chapter(19).translationId).paragraphs[11],/오리엔탈한 위치와 주간 위치/);
});

test('each chapter has one full Korean reference and one genuine bilingual passage',()=>{
 for(const c of provenance.chapters){const t=find(c.translationId),refs=examples.filter(e=>e.translationId===t.id);assert.equal(refs.length,2);const whole=refs.find(e=>e.kind==='korean-reference');assert.equal(whole.targetText,t.paragraphs.join('\n\n'));const pair=refs.find(e=>e.kind==='parallel-translation');const index=c.sourceParagraphs.indexOf(pair.sourceText);assert(index>=0);assert.deepEqual(c.alignment[index].targetParagraphIndices,[pair.paragraphIndex]);assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(pair.targetText,t.paragraphs[pair.paragraphIndex]);for(const e of refs){assert.equal(e.sourceUrl,t.sourceUrl);assert.deepEqual(e.notes,t.editorialNotes);}}
});

test('all 43 previous translations and all 74 previous reference units remain unchanged',()=>{
 assert.equal(provenance.preservedTranslations.length,43);assert.equal(provenance.preservedReferences.length,74);
 for(const old of provenance.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);
 for(const old of provenance.preservedReferences)assert.equal(hash(JSON.stringify(examples.find(e=>e.id===old.id))),old.sha256,old.id);
});

test('historical medical and stigmatizing claims have context and do not become modern advice',()=>{
 for(const n of [5,7,8,9,10,11,12,13,14,15,16,17,18,19])assert(find(chapter(n).translationId).contentNotice,`Chapter ${n} needs context`);
 assert.match(find(chapter(19).translationId).contentNotice,/성적 지향·성별 표현을 질환으로 평가하거나/);
 assert.match(find(chapter(17).translationId).contentNotice,/진단·치료하는 지침으로 제공하지 않습니다/);
 assert.equal(provenance.counts.sourceTableRows,0);for(const c of provenance.chapters){assert(!find(c.translationId).tables);assert(!find(c.translationId).diagram);}
});
