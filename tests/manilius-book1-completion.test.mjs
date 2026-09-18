import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const p=await read('../data/reference/manilius-book1-completion-2026-09-18.json'),opening=await read('../data/reference/manilius-book1-opening-2026-09-18.json'),ts=await read('../src/data/translations.json'),refs=await read('../data/reference/translation-examples.json');
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex'),find=id=>ts.find(t=>t.id===id),verse=n=>p.verses.find(v=>v.number===n);

test('Book I completion is Latin direct translation and preserves the preparation glossary',()=>{
 assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.sourceLanguage,'la');assert.equal(p.translationDirection,'Latin → Korean');assert.equal(p.glossaryVersion,opening.glossaryPreparation.version);
 assert.equal(p.units.length,20);for(const u of p.units){const t=find(u.translationId);assert.equal(t.language,'la');assert.equal(t.method,'direct-editor');assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.glossaryVersion,p.glossaryVersion);assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));assert(!('requestedModel' in t));assert(!('reportedModels' in t));}
});

test('668 new Latin verses map exactly once to 114 Korean paragraphs',()=>{
 assert.equal(p.verses.length,668);assert.equal(new Set(p.verses.map(v=>v.number)).size,668);
 assert.deepEqual(p.units.map(u=>u.alignment.length),[4,4,7,5,7,7,4,7,5,8,4,6,3,7,6,7,5,6,6,6]);
 assert.deepEqual(p.units.flatMap(u=>u.sourceVerseIds),p.verses.map(v=>v.number));
 for(const u of p.units){const t=find(u.translationId);assert.deepEqual(u.alignment.flatMap(a=>a.sourceVerseIds),u.sourceVerseIds);assert.deepEqual(u.alignment.map(a=>a.targetParagraphIndex),t.paragraphs.map((_,i)=>i));assert.deepEqual(u.targetParagraphHashes,t.paragraphs.map(hash));assert.equal(u.sourceHash,hash(u.sourceVerseIds.map(n=>`${n}|${verse(n).text}`).join('\n')));assert.equal(t.sourceHash,u.sourceHash);assert(t.paragraphs.every(s=>/[가-힣]/u.test(s)&&!s.includes('\uFFFD')));for(const [i,a] of u.alignment.entries()){assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.number),a.sourceVerseIds);for(const v of t.paragraphLatinVerses[i])assert.equal(v.text,verse(v.number).text);}}
});

test('the full printed Book I body has 920 verses across 28 continuous reading units',()=>{
 const all=[...opening.verses,...p.verses];assert.equal(all.length,920);assert.equal(new Set(all.map(v=>v.number)).size,920);
 assert.deepEqual([...all.map(v=>v.number)].sort((a,b)=>a-b),Array.from({length:926},(_,i)=>i+1).filter(n=>![38,39,564,565,811,812].includes(n)));
 const units=ts.filter(t=>t.series?.id==='manilius-book1').sort((a,b)=>a.series.order-b.series.order);assert.equal(units.length,28);assert.deepEqual(units.map(t=>t.series.order),Array.from({length:28},(_,i)=>i+1));assert.equal(units.reduce((n,t)=>n+t.paragraphs.length,0),158);assert.equal(units.at(-1).id,'manilius-i-896-926');
});
test('four transpositions retain Breiter order instead of silently renumbering verses',()=>{
 assert.deepEqual(p.transpositions,[{verse:429,after:421,before:422},{verse:642,after:640,before:641},{verse:742,after:739,before:740},{verse:845,after:839,before:840}]);
 const sequence=p.verses.map(v=>v.number);for(const x of p.transpositions){const i=sequence.indexOf(x.verse);assert.equal(sequence[i-1],x.after);assert.equal(sequence[i+1],x.before);}assert.equal(verse(742).pdfPage,40);
});

test('whole-verse and partial-verse editorial italics remain different',()=>{
 assert.deepEqual(p.suspectedInterpolationVerses,[385,386,428,444,594,595,596,664,707,766]);assert.equal(p.partialInterpolations.length,2);
 for(const n of p.suspectedInterpolationVerses)assert.equal(verse(n).status,'suspected-interpolation');
 for(const span of p.partialInterpolations){const v=verse(span.verse);assert.equal(v.status,'contains-suspected-interpolation');assert.equal(v.fragments.map(f=>f.text).join(''),v.text);assert.equal(v.fragments.filter(f=>f.suspected).map(f=>f.text).join(''),span.text);assert(v.fragments.some(f=>!f.suspected));}
 assert.equal(verse(350).fragments.find(f=>f.suspected).text,'quam Perseus armis');assert.equal(verse(351).fragments.find(f=>f.suspected).text,'eripit et sociat sibi, cui');
});

test('unquantified lacuna and absent body verses are not reconstructed',()=>{
 assert.deepEqual(p.omittedFromBody.flatMap(x=>x.verseNumbers),[564,565,811,812]);assert.equal(p.lacunae.length,1);assert.equal(p.lacunae[0].afterVerse,560);assert.equal(p.lacunae[0].extent,'분량 미상');
 assert.match(find('manilius-i-532-560').paragraphs.at(-1),/〔이 뒤 원문 결락〕/);assert(!p.verses.some(v=>v.number===564));assert(!p.verses.some(v=>v.number===812));
 assert.equal(verse(445).text,'peregrino caelum depingitur astris,');
});

test('selected readings and geometrical quantities retain the actual edition',()=>{
 for(const d of p.selectedTextualDecisions){assert(verse(d.verse).text.includes(d.reading),String(d.verse));assert.equal(verse(d.verse).pdfPage,d.pdfPage);}
 assert.match(find('manilius-i-308-345').paragraphs[4],/주먹/);assert.match(find('manilius-i-532-560').paragraphs.at(-1),/출생/);assert.match(find('manilius-i-865-895').paragraphs.at(-1),/새로운 무덤/);
 const geometry=find('manilius-i-532-560');assert.match(geometry.paragraphs[2],/3분의 1/);assert.match(geometry.editorialNotes.join('\n'),/근사/);assert.equal(12/3,4);assert.equal(4/2,2);
 assert.match(verse(681).text,/ter uicenas.*trecentas/);assert.match(verse(682).text,/bis sex/);assert.match(find('manilius-i-666-683').paragraphs.at(-1),/너비는 열두/);
});

test('all 23 new source pages and PDF links match the stored primary source',()=>{
 const seen=new Set();for(const u of p.units){for(let n=u.pdfPages[0];n<=u.pdfPages[1];n++)seen.add(n);assert.deepEqual(u.printedPages,u.pdfPages.map(n=>n-16));assert.equal(new URL(find(u.translationId).sourceUrl).hash,`#page=${u.pdfPages[0]}`);for(const n of u.sourceVerseIds)assert(verse(n).pdfPage>=u.pdfPages[0]&&verse(n).pdfPage<=u.pdfPages[1]);}
 assert.deepEqual([...seen].sort((a,b)=>a-b),Array.from({length:23},(_,i)=>i+25));assert.deepEqual(p.reviewedPrimaryTranslationPages,[...seen].sort((a,b)=>a-b));assert.equal(p.sourcePdf.sha256,opening.sourcePdf.sha256);
});
test('twenty new bilingual examples match Latin passages and published Korean',()=>{
 for(const u of p.units){const t=find(u.translationId),r=refs.filter(e=>e.translationId===u.translationId);assert.equal(r.length,2);assert(r.every(e=>e.language==='la'));const full=r.find(e=>e.kind==='korean-reference'),pair=r.find(e=>e.kind==='parallel-translation');assert.equal(full.targetText,t.paragraphs.join('\n\n'));assert.equal(pair.targetText,t.paragraphs[0]);assert.equal(pair.sourceText,u.alignment[0].sourceVerseIds.map(n=>verse(n).text).join('\n'));assert.equal(pair.sourceTextHash,hash(pair.sourceText));}
});

test('the previous 80 translations and 148 reference units remain exactly unchanged',()=>{
 assert.equal(p.preservedTranslations.length,80);assert.equal(p.preservedReferences.length,148);
 for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(refs.find(e=>e.id===old.id))),old.sha256,old.id);
});

test('selected English comparison is post-draft only, and the next task is Book II',()=>{
 assert.equal(p.englishWitness.readAfterKoreanDrafts,true);assert.deepEqual(p.englishWitness.reviewedPdfPages,[95,99]);
 assert.deepEqual(p.next,{book:2,verse:1,pdfPage:48,printedPage:32,title:'새로운 시의 길과 우주의 이성'});assert.equal(p.completion.lastVerse,926);assert.equal(p.completion.lastPdfPage,47);assert.match(p.completion.scope,/제2–5권은 미번역/);
 assert.match(verse(926).text,/cumque deum caelo dederit/);assert.match(find('manilius-i-896-926').paragraphs.at(-1),/지상에서 다시 신을 찾지 않기를/);
});
