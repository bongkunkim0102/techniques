import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';import {translationVolumes} from '../src/lib/translations.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const ts=await read('../src/data/translations.json'),refs=await read('../data/reference/translation-examples.json'),p=await read('../data/reference/manilius-book3-completion-2026-09-19.json');
const hash=x=>createHash('sha256').update(x,'utf8').digest('hex'),find=id=>ts.find(t=>t.id===id),verse=n=>p.verses.find(v=>v.number===n).text;
test('Book III records the real recovery point and direct Latin authorship',()=>{
 assert.equal(p.recovery.originalDraftUnits,9);assert.equal(p.recovery.originalLastVerse,322);assert.equal(p.recovery.originalKoreanParagraphs,55);assert.equal(p.recovery.resumedAtVerse,323);assert.equal(p.recovery.resumedAtPdfPage,91);assert.equal(p.recovery.causeConfirmed,false);assert.equal(p.recovery.originalDraftFiles.length,9);
 assert.equal(p.sourceLanguage,'la');assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.englishWitness.usedAsSource,false);assert.equal(p.englishWitness.gooldEnglishUsed,false);assert.equal(p.glossaryPreparation.version,'2026-09-18.4');assert.equal(p.glossaryPreparation.newEntries,0);
});
test('682 Latin verses form one complete printed Book III, with the moved verse retained',()=>{
 assert.equal(p.verses.length,682);assert.equal(new Set(p.verses.map(v=>v.number)).size,682);assert.deepEqual([...p.verses.map(v=>v.number)].sort((a,b)=>a-b),Array.from({length:682},(_,i)=>i+1));
 assert.deepEqual(p.verses.slice(12,22).map(v=>v.number),[13,15,16,17,18,19,20,21,14,22]);assert.deepEqual(p.omittedFromBody,[]);assert.deepEqual(p.transpositions,[{verse:14,after:21,before:22,pdfPage:81}]);
});
test('all 22 units map every Latin verse exactly once to all 107 Korean paragraphs',()=>{
 assert.equal(p.units.length,22);assert.deepEqual(p.units.flatMap(u=>u.sourceVerseIds),p.verses.map(v=>v.number));assert.deepEqual(p.units.map(u=>u.alignment.length),[8,9,6,6,7,6,4,4,4,5,4,5,4,4,4,4,4,4,4,4,4,3]);
 for(const u of p.units){const t=find(u.translationId);assert.equal(t.language,'la');assert.equal(t.method,'direct-editor');assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.glossaryVersion,p.glossaryPreparation.version);assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));assert.deepEqual(u.alignment.flatMap(a=>a.sourceVerseIds),u.sourceVerseIds);assert.deepEqual(u.alignment.map(a=>a.targetParagraphIndex),t.paragraphs.map((_,i)=>i));assert.equal(t.paragraphs.length,u.alignment.length);assert(t.paragraphs.every(s=>/[가-힣]/u.test(s)&&!s.includes('\uFFFD')));}
});
test('source and target hashes are reproducible and public Latin follows the same source',()=>{
 for(const u of p.units){const t=find(u.translationId);assert.equal(u.sourceHash,hash(u.sourceVerseIds.map(n=>`${n}|${verse(n)}`).join('\n')));assert.equal(t.sourceHash,u.sourceHash);assert.deepEqual(u.targetParagraphHashes,t.paragraphs.map(hash));for(const [i,a] of u.alignment.entries()){assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.number),a.sourceVerseIds);assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.text),a.sourceVerseIds.map(verse));}}
});
test('all 24 source pages, four interpolated lines and the last boundary are exact',()=>{
 assert.deepEqual([...new Set(p.verses.map(v=>v.pdfPage))],Array.from({length:24},(_,i)=>i+81));assert.deepEqual(p.reviewedPrimaryTranslationPages,Array.from({length:24},(_,i)=>i+81));assert.deepEqual(p.suspectedInterpolationVerses,[92,172,508,538]);assert.deepEqual(p.verses.filter(v=>v.status==='suspected-interpolation').map(v=>v.number),p.suspectedInterpolationVerses);
 for(const u of p.units){assert.equal(new URL(find(u.translationId).sourceUrl).hash,`#page=${u.pdfPages[0]}`);assert.deepEqual(u.printedPages,u.pdfPages.map(n=>n-16));assert(u.sourceVerseIds.every(n=>{const page=p.verses.find(v=>v.number===n).pdfPage;return page>=u.pdfPages[0]&&page<=u.pdfPages[1];}));}
 assert.deepEqual(p.next,{book:4,verse:1,pdfPage:105,printedPage:89,title:'인간의 욕망과 운명에 관한 서시'});
});
test('recovered transcription errors are corrected as draft errors, not hidden edition changes',()=>{
 assert.equal(p.recovery.proofCorrections.sourceCorrections.length,18);assert.match(verse(112),/patronum$/);assert.match(find('manilius-iii-096-126').paragraphs[3],/변호인/);assert(!find('manilius-iii-096-126').paragraphs[3].includes('원로들의'));
 assert.match(verse(110),/consonat astris/);assert.match(verse(326),/decircinat/);assert.match(verse(343),/in umbras/);assert.match(verse(479),/annique inuertitur/);assert.match(verse(572),/geminatque decem geminatque/);
});
test('Fortuna keeps the day-night reversal but counts forward from the ascendant in both',()=>{
 const t=find('manilius-iii-160-202');assert.match(verse(188),/a sole ad lunam/);assert.match(verse(199),/ab ea Phoebus/);assert.match(t.editorialNotes.join('\n'),/낮에는 태양→달, 밤에는 달→태양/);assert.match(t.editorialNotes.join('\n'),/상승점에서 거꾸로 세는 방식으로 바꾸지/);
 const mod=x=>((x%360)+360)%360,fortune=(asc,sun,moon,day)=>mod(asc+(day?mod(moon-sun):mod(sun-moon)));assert.equal(fortune(350,350,10,true),10);assert.equal(fortune(350,350,10,false),330);
});
test('the Nile example keeps 9.5 plus 14.5 hours, 40 stadia and the fractional increment',()=>{
 assert.match(verse(259),/dimidiam atque nouem/);assert.match(verse(260),/bis septem/);assert.match(verse(279),/dena quater stadia/);assert.equal(9.5+14.5,24);assert.equal(40/(4/3),30);assert.equal(1/4+(1/4)/3/5,4/15);assert.equal((4/15)*60,16);assert.equal((4/15)*30,8);
 const d=14.5,n=9.5;assert(Math.abs((d/6-n/6)/3-(d-n)/18)<1e-15,'Equivalent fractional formulas differ only by floating-point rounding');assert.notEqual((d-n)/18,4/15);assert.match(find('manilius-iii-385-417').editorialNotes.join('\n'),/정확히 같은 수열은 아니다/);
});
test('problematic printed numbers are preserved rather than silently made consistent',()=>{
 assert.match(verse(419),/ter centum numeris uicenaque/);assert(!verse(419).includes('quater et'));assert.match(verse(425),/nomine lucis/);assert.match(find('manilius-iii-418-442').paragraphs[1],/낮이라는/);
 assert.equal(300+20,320);assert.equal(30*24,720);assert.notEqual(320,720);assert.match(find('manilius-iii-418-442').editorialNotes.join('\n'),/자동|교체|보충/);
 assert.match(verse(457),/ternis/);assert.equal(.5+1+1.5,3);assert.equal(((24+3)/2-(24-3)/2)/2,1.5);assert.match(find('manilius-iii-443-482').editorialNotes.join('\n'),/맞지 않는다/);
 assert.match(verse(605),/ter uicenos geminat, tris abstrahit/);assert.equal(3*20*2-3,117);assert.match(find('manilius-iii-581-617').editorialNotes.join('\n'),/117/);
});
test('period rulership alternatives and all three seasonal boundary degrees survive',()=>{
 assert.match(verse(514),/quo sol effulserit/);assert.match(verse(517),/luna dabit menses/);assert.match(verse(518),/horoscopos horas/);assert.match(verse(537),/^sunt, quibus/);assert.match(verse(541),/capite ex uno/);
 assert.match(verse(680),/octaua/);assert.match(verse(681),/decimas/);assert.match(verse(682),/primae/);const last=find('manilius-iii-669-682').paragraphs.at(-1);for(const word of ['여덟째','열째','첫째'])assert(last.includes(word));
});
test('each new reference is truly Latin-aligned and all earlier objects remain unchanged',()=>{
 for(const u of p.units){const t=find(u.translationId),rows=refs.filter(r=>r.translationId===t.id);assert.equal(rows.length,2);const pair=rows.find(r=>r.kind==='parallel-translation'),whole=rows.find(r=>r.kind==='korean-reference');assert.equal(pair.language,'la');assert.equal(pair.targetText,t.paragraphs[0]);assert.equal(pair.sourceText,u.alignment[0].sourceVerseIds.map(verse).join('\n'));assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(whole.targetText,t.paragraphs.join('\n\n'));}
 assert.equal(p.preservedTranslations.length,136);assert.equal(p.preservedReferences.length,260);for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(refs.find(r=>r.id===old.id))),old.sha256,old.id);
});
test('three books form distinct continuous reading series with historical safeguards',()=>{
 const volumes=translationVolumes(ts.filter(t=>t.sourceId==='manilius-breiter1907'));assert.deepEqual(volumes.map(v=>v.entries.length),[28,36,22,22]);for(const v of volumes)assert.deepEqual(v.entries.map(t=>t.series.order),v.entries.map((_,i)=>i+1));
 for(const u of p.units)assert.match(find(u.translationId).contentNotice,/현대 천문 계산|건강/);assert.equal(p.completion.lastVerse,682);assert.equal(p.counts.cumulativeManiliusVerses,2569);
});
