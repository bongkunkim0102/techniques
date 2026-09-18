import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';import {translationVolumes} from '../src/lib/translations.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));const p=await read('../data/reference/manilius-book2-completion-2026-09-19.json'),ts=await read('../src/data/translations.json'),refs=await read('../data/reference/translation-examples.json');
const hash=x=>createHash('sha256').update(x,'utf8').digest('hex'),find=id=>ts.find(t=>t.id===id),v=n=>p.verses.find(v=>v.number===n),text=(a,b)=>p.verses.filter(v=>v.number>=a&&v.number<=b).map(v=>v.text).join('\n');
test('Book II is directly authored from Latin using the established glossary',()=>{
 assert.equal(p.method,'direct-editor');assert.equal(p.sourceLanguage,'la');assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.glossaryPreparation.version,'2026-09-18.4');assert.equal(p.glossaryPreparation.newEntries,0);assert.equal(p.units.length,36);
 for(const u of p.units){const t=find(u.translationId);assert.equal(t.language,'la');assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.method,'direct-editor');assert.equal(t.glossaryVersion,p.glossaryPreparation.version);assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));assert(t.contentNotice);}
});
test('all 967 printed Latin verses map exactly once to 161 Korean paragraphs',()=>{
 assert.equal(p.verses.length,967);assert.equal(new Set(p.verses.map(v=>v.number)).size,967);assert.deepEqual([...p.verses.map(v=>v.number)].sort((a,b)=>a-b),Array.from({length:970},(_,i)=>i+1).filter(n=>![343,344,631].includes(n)));
 assert.deepEqual(p.units.flatMap(u=>u.sourceVerseIds),p.verses.map(v=>v.number));let count=0;for(const u of p.units){const t=find(u.translationId);assert.deepEqual(u.alignment.flatMap(a=>a.sourceVerseIds),u.sourceVerseIds);assert.deepEqual(u.alignment.map(a=>a.targetParagraphIndex),t.paragraphs.map((_,i)=>i));count+=t.paragraphs.length;assert(t.paragraphs.every(x=>/[가-힣]/u.test(x)&&!x.includes('\uFFFD')));}assert.equal(count,161);
});
test('source and Korean hashes reproduce the published bilingual text',()=>{
 for(const u of p.units){const t=find(u.translationId);assert.equal(u.sourceHash,hash(u.sourceVerseIds.map(n=>`${n}|${v(n).text}`).join('\n')));assert.equal(t.sourceHash,u.sourceHash);assert.deepEqual(u.targetParagraphHashes,t.paragraphs.map(hash));
 for(const [i,a] of u.alignment.entries()){assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.number),a.sourceVerseIds);for(const row of t.paragraphLatinVerses[i]){assert.equal(row.text,v(row.number).text);assert.equal(row.status,v(row.number).status);assert.deepEqual(row.italicSpans,v(row.number).italicSpans);}}
 }
});
test('three displaced verses retain printed order and omitted verses stay absent',()=>{
 for(const x of p.transpositions){const i=p.verses.findIndex(v=>v.number===x.verse);assert.equal(p.verses[i-1].number,x.after);assert.equal(p.verses[i+1].number,x.before);}assert.deepEqual(p.omittedFromBody.flatMap(x=>x.verseNumbers),[343,344,631]);assert.equal(v(673).pdfPage,71);assert.match(v(673).text,/†proprie/);
});
test('25 whole italic verses and nine fragments on eight verses remain distinct',()=>{
 assert.equal(p.suspectedInterpolationVerses.length,25);assert.equal(p.partialInterpolationSpans.length,9);assert.equal(new Set(p.partialInterpolationSpans.map(s=>s.verse)).size,8);
 assert.deepEqual(p.verses.filter(v=>v.status==='suspected-interpolation').map(v=>v.number),p.suspectedInterpolationVerses);
 assert.deepEqual(v(907).italicSpans,['aethera','sub quoque corpora nostra']);assert.equal(v(907).status,undefined);assert(!v(907).italicSpans.some(s=>s.includes('Phoebus amat')));assert.deepEqual(v(743).italicSpans,['quae uaga dicuntur']);assert.equal(v(743).status,undefined);assert.equal(v(908).status,'suspected-interpolation');
 for(const row of p.verses){for(const span of row.italicSpans||[])assert(row.text.includes(span));if(row.fragments){assert.equal(row.fragments.map(f=>f.text).join(''),row.text);assert.deepEqual(row.fragments.filter(f=>f.suspected).map(f=>f.text),row.italicSpans);}}
});
test('all 33 source pages and cross-book sequence are complete',()=>{
 assert.deepEqual([...new Set(p.verses.map(v=>v.pdfPage))].sort((a,b)=>a-b),Array.from({length:33},(_,i)=>i+48));assert.deepEqual(p.reviewedPrimaryTranslationPages,Array.from({length:33},(_,i)=>i+48));
 for(const u of p.units){const pages=u.sourceVerseIds.map(n=>v(n).pdfPage);assert.deepEqual(u.pdfPages,[Math.min(...pages),Math.max(...pages)]);assert.equal(new URL(find(u.translationId).sourceUrl).hash,'#page='+u.pdfPages[0]);assert.deepEqual(u.printedPages,u.pdfPages.map(p=>p-16));}
 const volumes=translationVolumes(ts.filter(t=>t.sourceId==='manilius-breiter1907'));assert.deepEqual(volumes.slice(0,2).map(v=>v.entries.length),[28,36]);assert.deepEqual(volumes[1].entries.map(t=>t.series.order),Array.from({length:36},(_,i)=>i+1));
});
test('degree geometry preserves 360, 120, 90 and the 150/120/60 boundary cases',()=>{
 assert.match(v(308).text,/et ter uicenae/);assert.match(v(316).text,/ter quinquagenas/);assert.match(v(325).text,/bis sexagenas/);assert.match(v(328).text,/triginta duplicat/);
 assert.equal(300+3*20,360);assert.equal(360/3,120);assert.equal(360/4,90);assert.equal(150-0,150);assert.equal(120-0,120);assert.equal(90-30,60);assert.equal(100+100/5,120);assert.equal(100-100/10,90);
 assert.match(find('manilius-ii-297-341').paragraphs.join(' '),/삼백육십/);assert(!v(308).text.startsWith('et uicenae'));
});
test('dodecatemoria, lunar alternative and half-degree subdivisions stay separate',()=>{
 assert.match(text(693,724),/bis senis/);assert.match(v(715).text,/ipsa suo retinent primas/);assert.match(v(727).text,/ter dispone quaternis/);assert.match(v(731).text,/tricenas/);assert.match(v(742).text,/totidem/);assert.match(v(744).text,/dimidias/);
 assert.equal(30/12,2.5);assert.equal(2.5/5,0.5);assert.equal(0.5*60,30);const t=find('manilius-ii-738-749');assert(t.termIds.includes('manilius-half-degree-divisions'));assert(t.editorialNotes.some(n=>n.includes('모노모이리아로 바꾸지')));assert.match(find('manilius-ii-725-737').paragraphs.join(' '),/나머지 부분/);
});
test('three day/night classifications and god tutelages are not merged into later rules',()=>{
 const s=text(211,222);for(const word of ['sagittari','leonis','pisces','cancer','scorpios'])assert(s.includes(word));assert.match(v(220).text,/sex a chelis/);assert.match(v(221).text,/mascula/);
 assert.match(text(439,447),/Pallas/);assert.match(text(439,447),/Vulcani/);assert.match(text(439,447),/Vesta/);assert(find('manilius-ii-433-452').editorialNotes.some(n=>n.includes('도미사일 표가 아니다')));
});
test('place sequence and the exact octotopos reading preserve source-specific distinctions',()=>{
 assert.match(text(810,812),/primus erit/);assert.match(text(820,821),/proximus/);assert.match(v(826).text,/tertius/);assert.match(v(836).text,/ultimus/);assert.match(text(918,927),/Cytherea/);assert.match(v(927).text,/Fortuna/);
 assert.match(v(969).text,/^octotopos,/);assert(!v(969).text.includes('octotropos'));assert([968,969,970].every(n=>v(n).status==='suspected-interpolation'));assert.match(find('manilius-ii-948-970').editorialNotes.join(' '),/8하우스 체계라고 단정하지/);
});
test('36 full Korean references and 36 genuinely aligned Latin pairs were added',()=>{
 for(const u of p.units){const t=find(u.translationId),selected=refs.filter(e=>e.translationId===t.id);assert.equal(selected.length,2);const full=selected.find(e=>e.kind==='korean-reference'),pair=selected.find(e=>e.kind==='parallel-translation');assert.equal(full.targetText,t.paragraphs.join('\n\n'));assert.equal(pair.language,'la');assert.equal(pair.sourceText,u.alignment[0].sourceVerseIds.map(n=>v(n).text).join('\n'));assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(pair.targetText,t.paragraphs[0]);assert.deepEqual(pair.sourceVerseIds,u.alignment[0].sourceVerseIds);}
});
test('the prior corpus is unchanged and the unstarted continuation is Book III',()=>{
 assert.equal(p.preservedTranslations.length,100);assert.equal(p.preservedReferences.length,188);for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(refs.find(e=>e.id===old.id))),old.sha256,old.id);
 assert.deepEqual(p.englishWitness.newCreechPagesReviewed,[]);assert.equal(p.englishWitness.usedAsSource,false);assert.equal(p.next.book,3);assert.equal(p.next.verse,1);assert.equal(p.next.pdfPage,81);assert.equal(p.completion.lastVerse,970);
});
