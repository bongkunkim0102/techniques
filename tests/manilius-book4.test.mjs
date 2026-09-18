import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';import {translationVolumes} from '../src/lib/translations.mjs';
const read=async f=>JSON.parse(await readFile(new URL(f,import.meta.url),'utf8'));
const ts=await read('../src/data/translations.json'),refs=await read('../data/reference/translation-examples.json'),p=await read('../data/reference/manilius-book4-opening-2026-09-19.json');
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex'),find=id=>ts.find(t=>t.id===id),verse=n=>p.verses.find(v=>v.number===n).text;
test('Book IV is a directly authored partial book, not an English retranslation',()=>{
 assert.equal(p.sourceLanguage,'la');assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.englishWitness.usedAsSource,false);assert.equal(p.englishWitness.gooldEnglishUsed,false);assert.equal(p.glossaryPreparation.version,'2026-09-18.4');assert.equal(p.glossaryPreparation.newEntries,0);
 for(const u of p.units){const t=find(u.translationId);assert.equal(t.language,'la');assert.equal(t.method,'direct-editor');assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.glossaryVersion,p.glossaryPreparation.version);assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));assert.match(t.scope,/제4권 전체 번역이 아님/);}
});
test('582 body lines retain 489b and omit exactly 298, 500 and 501',()=>{
 assert.equal(p.verses.length,582);assert.equal(new Set(p.verses.map(v=>v.number)).size,582);assert.deepEqual(p.verses.map(v=>v.number).filter(n=>typeof n==='number').sort((a,b)=>a-b),Array.from({length:584},(_,i)=>i+1).filter(n=>![298,500,501].includes(n)));
 assert.equal(p.verses.filter(v=>v.number==='489b').length,1);assert.deepEqual(p.omittedFromBody.flatMap(x=>x.verseNumbers),[298,500,501]);assert.equal(p.addedNumberedVerses[0].number,'489b');
});
test('the two print-order changes are preserved, including the inserted lettered number',()=>{
 const ids=p.verses.map(v=>v.number);assert.deepEqual(ids.slice(ids.indexOf(260),ids.indexOf(260)+4),[260,269,261,262]);assert.deepEqual(ids.slice(ids.indexOf(489),ids.indexOf(489)+6),[489,'489b',491,490,492,493]);
 const t=find('manilius-iv-486-501');assert(t.paragraphLocators.some(x=>x.includes('489b, 491, 490, 492–493')));assert(t.paragraphCriticalNotes.some(x=>x.includes('Bentley')));
});
test('all 22 units cover every source line once in 94 exact Korean paragraphs',()=>{
 assert.equal(p.units.length,22);assert.deepEqual(p.units.flatMap(u=>u.sourceVerseIds),p.verses.map(v=>v.number));assert.deepEqual(p.units.map(u=>u.alignment.length),[4,3,6,5,5,4,4,3,4,4,3,5,5,6,5,3,3,3,4,6,5,4]);
 for(const u of p.units){const t=find(u.translationId);assert.deepEqual(u.alignment.flatMap(a=>a.sourceVerseIds),u.sourceVerseIds);assert.deepEqual(u.alignment.map(a=>a.targetParagraphIndex),t.paragraphs.map((_,i)=>i));assert(t.paragraphs.every(s=>/[가-힣]/u.test(s)&&!s.includes('\uFFFD')));}
});
test('hashes and rendered parallel Latin reproduce the numbered source exactly',()=>{
 for(const u of p.units){const t=find(u.translationId);assert.equal(u.sourceHash,hash(u.sourceVerseIds.map(n=>`${n}|${verse(n)}`).join('\n')));assert.equal(t.sourceHash,u.sourceHash);assert.deepEqual(u.targetParagraphHashes,t.paragraphs.map(hash));for(const [i,a] of u.alignment.entries()){assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.number),a.sourceVerseIds);assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.text),a.sourceVerseIds.map(verse));}}
});
test('source pages, suspected interpolation and crux are explicitly distinguished',()=>{
 assert.deepEqual(p.reviewedPrimaryTranslationPages,Array.from({length:21},(_,i)=>105+i));assert.deepEqual([...new Set(p.verses.map(v=>v.pdfPage))],p.reviewedPrimaryTranslationPages);assert.deepEqual(p.verses.filter(v=>v.status==='suspected-interpolation').map(v=>v.number),[581]);assert.match(verse(522),/†paruo/);
 for(const u of p.units){assert.equal(new URL(find(u.translationId).sourceUrl).hash,`#page=${u.pdfPages[0]}`);assert.deepEqual(u.printedPages,u.pdfPages.map(n=>n-16));assert(u.sourceVerseIds.every(n=>{const page=p.verses.find(v=>v.number===n).pdfPage;return page>=u.pdfPages[0]&&page<=u.pdfPages[1];}));}
});
test('decan assignments have twelve rows and three ten-degree sign portions, not planets',()=>{
 const rows=p.decanAssignments.rows;assert.equal(rows.length,12);const signs=new Set(rows.map(r=>r.sign));assert.equal(signs.size,12);assert.equal(p.decanAssignments.degreesPerPart,10);
 for(const r of rows){assert.equal(r.parts.length,3);assert.equal(r.parts.length*p.decanAssignments.degreesPerPart,30);assert(r.parts.every(x=>signs.has(x)));}
 assert.deepEqual(rows.find(r=>r.sign==='Pisces').parts,['Aries','Taurus','Pisces']);assert.match(find('manilius-iv-338-362').paragraphs.at(-1),/숫양/);assert.match(find('manilius-iv-338-362').paragraphs.at(-1),/황소/);assert.match(find('manilius-iv-338-362').paragraphs.at(-1),/스스로 차지/);
});
test('102 interpreted adverse-degree entries preserve ordinal bounds and the Leo fifteen',()=>{
 assert.equal(p.degreeLists.rows.length,12);assert.equal(p.degreeLists.rows.reduce((n,r)=>n+r.degrees.length,0),102);for(const r of p.degreeLists.rows){assert.equal(new Set(r.degrees).size,r.degrees.length);assert(r.degrees.every(n=>Number.isInteger(n)&&n>=1&&n<=30));}
 assert(p.degreeLists.rows.find(r=>r.sign==='Leo').degrees.includes(15));assert.match(verse(465),/bis quinta/);assert.match(verse(466),/terque/);assert(p.degreeLists.rows.find(r=>r.sign==='Libra').note);assert(p.degreeLists.rows.find(r=>r.sign==='Sagittarius').note);
});
test('primary-image corrections refine the Korean rather than hiding draft errors',()=>{
 assert.equal(p.proofRecord.changes.length,13);assert.match(verse(120),/fabricare/);assert.match(find('manilius-iv-089-123').paragraphs.at(-1),/계단을 세우는/);assert.match(verse(461),/rabit/);assert.match(find('manilius-iv-459-472').paragraphs[0],/사납게 군다/);assert.match(verse(580),/Babyloniacas summersa/);
 assert.deepEqual(p.proofRecord.paragraphMerges,[[23,36],[217,229]]);
});
test('all new bilingual examples use the actual Latin first passage',()=>{
 for(const u of p.units){const t=find(u.translationId),r=refs.filter(x=>x.translationId===t.id);assert.equal(r.length,2);const pair=r.find(x=>x.kind==='parallel-translation'),whole=r.find(x=>x.kind==='korean-reference');assert.equal(pair.language,'la');assert.equal(pair.sourceText,u.alignment[0].sourceVerseIds.map(verse).join('\n'));assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(pair.targetText,t.paragraphs[0]);assert.equal(whole.targetText,t.paragraphs.join('\n\n'));}
});
test('all previously committed 158 translations and 304 references remain unchanged',()=>{
 assert.equal(p.preservedTranslations.length,158);assert.equal(p.preservedReferences.length,304);for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(refs.find(r=>r.id===old.id))),old.sha256,old.id);
});
test('partial fourth book has a precise next location, separate series and historical notices',()=>{
 const v=translationVolumes(ts.filter(t=>t.sourceId==='manilius-breiter1907'));assert.deepEqual(v.slice(0,3).map(v=>v.entries.length),[28,36,22]);assert.deepEqual(p.next,{book:4,verse:585,pdfPage:125,printedPage:109,title:'지리적 배정과 네 방위'});
 assert.equal(p.verses.at(-1).number,584);assert.match(verse(584),/materue duorum/);for(const u of p.units)assert.match(find(u.translationId).contentNotice,/현대 개인|진단/);
});
