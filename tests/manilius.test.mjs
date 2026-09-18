import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary,glossaryVersion,glossaryRelease,glossarySources} from '../src/data/glossary.mjs';
import {assertGlossaryReady,selectGlossaryTerms} from '../scripts/lib/glossary.mjs';import {selectReferenceExamples} from '../scripts/lib/translation-reference.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const p=await read('../data/reference/manilius-book1-opening-2026-09-18.json'),survey=await read('../data/reference/manilius-survey-2026-09-18.json'),ts=await read('../src/data/translations.json'),examples=await read('../data/reference/translation-examples.json');
const hash=x=>createHash('sha256').update(x,'utf8').digest('hex'),find=id=>ts.find(t=>t.id===id);
test('five-book review precedes 31 source-specific glossary entries with explicit authorship',()=>{
 assert.deepEqual(survey.books.map(b=>b.book),[1,2,3,4,5]);assert.equal(survey.directTranslationStartedAfterGlossary,true);assert.equal(p.glossaryPreparation.completedBeforeKoreanDrafts,true);
 assert.equal(p.glossaryPreparation.version,'2026-09-18.4');assert(glossary.length>=631);assert.equal(survey.glossary.addedIds.length,31);assertGlossaryReady(glossary,glossaryRelease,glossarySources);
 for(const id of survey.glossary.addedIds){const t=glossary.find(t=>t.id===id);assert(t);assert.equal(t.sourceLanguage,'la');assert.equal(t.reviewedBy,'ChatGPT (GPT-6 Astra Pro)');assert(t.definition&&t.note&&t.locator);assert(t.refs.includes('manilius-breiter1907'));}
 assert.throws(()=>assertGlossaryReady([{...glossary[0],reviewedBy:'unverified'},...glossary.slice(1)],glossaryRelease,glossarySources),/Glossary not ready/);
});
test('the original 600 glossary definitions remain unchanged apart from the release version',()=>{
 assert.equal(survey.glossary.oldObjectHashes.length,600);for(const old of survey.glossary.oldObjectHashes){const t=glossary.find(t=>t.id===old.id);assert.equal(hash(JSON.stringify({...t,version:old.version})),old.sha256,old.id);}
});
test('Latin source has 252 actual verses, two omitted body numbers and Breiter print order',()=>{
 assert.equal(p.sourceLanguage,'la');assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.verses.length,252);assert.equal(new Set(p.verses.map(v=>v.number)).size,252);
 assert.deepEqual([...p.verses.map(v=>v.number)].sort((a,b)=>a-b),Array.from({length:254},(_,i)=>i+1).filter(n=>![38,39].includes(n)));
 assert.deepEqual(p.verses.slice(27,34).map(v=>v.number),[28,29,32,30,31,33,34]);assert.deepEqual(p.omittedFromBody[0].verseNumbers,[38,39]);assert.equal(p.sourcePdf.pages,170);
});
test('eight reading units partition all source verses into 44 Korean paragraphs',()=>{
 assert.equal(p.units.length,8);assert.deepEqual(p.units.map(u=>u.targetParagraphHashes.length),[5,8,8,7,4,4,6,2]);assert.deepEqual(p.units.flatMap(u=>u.sourceVerseIds),p.verses.map(v=>v.number));
 for(const u of p.units){const t=find(u.translationId);assert.equal(t.language,'la');assert.equal(t.method,'direct-editor');assert.equal(t.editor,p.editor);assert.equal(t.glossaryVersion,p.glossaryPreparation.version);assert.equal(t.sourceHashKind,'latin-verse-transcription');
 assert.deepEqual(u.alignment.flatMap(a=>a.sourceVerseIds),u.sourceVerseIds);assert.deepEqual(u.alignment.map(a=>a.targetParagraphIndex),t.paragraphs.map((_,i)=>i));assert.deepEqual(u.targetParagraphHashes,t.paragraphs.map(hash));
 const rows=u.sourceVerseIds.map(n=>p.verses.find(v=>v.number===n));assert.equal(u.sourceHash,hash(rows.map(v=>`${v.number}|${v.text}`).join('\n')));assert.equal(t.sourceHash,u.sourceHash);assert.equal(new URL(t.sourceUrl).hash,`#page=${u.pdfPages[0]}`);
 for(const [i,a] of u.alignment.entries()){assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.number),a.sourceVerseIds);for(const v of t.paragraphLatinVerses[i])assert.equal(v.text,p.verses.find(s=>s.number===v.number).text);}
 assert(t.paragraphs.every(x=>/[가-힣]/u.test(x)&&!x.includes('\uFFFD')));}
});
test('six suspected interpolations and the crux remain visible in the source record',()=>{
 assert.deepEqual(p.verses.filter(v=>v.status==='suspected-interpolation').map(v=>v.number),[37,214,225,226,235,249]);assert(p.verses.find(v=>v.number===217).text.includes('†Niliacas'));
 assert.match(find('manilius-i-001-024').paragraphs[3],/포이보스/);assert.match(p.verses.find(v=>v.number===19).text,/Phoebo/);assert.match(p.verses.find(v=>v.number===214).text,/stellis/);
 assert(find('manilius-i-025-065').paragraphLocators.some(s=>s.includes('28–29, 32')));assert(find('manilius-i-202-235').paragraphCriticalNotes.some(s=>s.includes('217')));
});
test('each reference is genuinely aligned to Latin rather than an English witness',()=>{
 for(const u of p.units){const t=find(u.translationId),refs=examples.filter(e=>e.translationId===t.id);assert.equal(refs.length,2);assert(refs.every(e=>e.language==='la'));const whole=refs.find(e=>e.kind==='korean-reference'),pair=refs.find(e=>e.kind==='parallel-translation');assert.equal(whole.targetText,t.paragraphs.join('\n\n'));assert.equal(pair.targetText,t.paragraphs[pair.paragraphIndex]);assert.equal(pair.sourceText,u.alignment[pair.paragraphIndex].sourceVerseIds.map(n=>p.verses.find(v=>v.number===n).text).join('\n'));assert.equal(pair.sourceTextHash,hash(pair.sourceText));}
});
test('Latin examples require an explicit language instead of Latin-script guessing',()=>{
 const text='mundus et fata ratio siderum',terms=selectGlossaryTerms(text,glossary);
 const latin=selectReferenceExamples(text,terms,examples,4,9000,'la');assert(latin.length);assert(latin.every(e=>e.language==='la'));
 assert(selectReferenceExamples(text,terms,examples).every(e=>e.language==='en'));assert.throws(()=>selectReferenceExamples(text,terms,examples,4,9000,'xx'),/Unsupported source language/);
 const old=selectReferenceExamples('The Sun is opposite the Moon.',selectGlossaryTerms('The Sun is opposite the Moon.',glossary),examples);assert(old.length);assert(old.every(e=>e.language==='en'));
});
test('the glossary distinguishes related techniques rather than merging separate systems',()=>{
 const t=id=>glossary.find(t=>t.id===`manilius-${id}`);
 assert.match(t('athla').note,/현대 하우스/);assert.match(t('templa').note,/아틀라와 합치지/);assert.match(t('half-degree-divisions').definition,/반도/);assert.match(t('half-degree-divisions').note,/모노모이리아와 다르다/);
 assert.match(t('decanica').note,/칼데아/);assert.match(t('tropical-signs').definition,/네 사인/);assert.match(t('ecliptica').note,/황도/);assert.match(t('tutelae').note,/도미사일 표가 아니다/);
});
test('previous 72 translations and 132 reference units are preserved exactly',()=>{
 assert.equal(p.preservedTranslations.length,72);assert.equal(p.preservedReferences.length,132);for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(examples.find(e=>e.id===old.id))),old.sha256,old.id);
});
test('source roles and unfinished extent cannot be misrepresented as five-book completion',()=>{
 assert.equal(p.englishWitness.readAfterKoreanDrafts,true);assert.deepEqual(p.englishWitness.reviewedPdfPages,[3,71,74,75,82,83,84]);assert.equal(survey.sourceRoles.housman,'not consulted');assert.equal(survey.sourceRoles.gooldEnglish,'not used');
 assert.deepEqual(p.next,{book:1,verse:255,pdfPage:25,printedPage:9,title:'황도 사인들의 열거'});for(const u of p.units)assert.match(find(u.translationId).scope,/제1권 전체 번역이 아님/);
});
