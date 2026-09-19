import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';import {translationVolumes} from '../src/lib/translations.mjs';
const read=async f=>JSON.parse(await readFile(new URL(f,import.meta.url),'utf8'));
const ts=await read('../src/data/translations.json'),refs=await read('../data/reference/translation-examples.json'),p=await read('../data/reference/manilius-book5-completion-2026-09-19.json');
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex'),find=id=>ts.find(t=>t.id===id),verse=n=>p.verses.find(v=>v.number===n).text;
test('final Book V batch is Latin direct work with preserved glossary and no delegated translation',()=>{
 assert.equal(p.sourceLanguage,'la');assert.equal(p.method,'direct-editor');assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.englishWitness.usedAsSource,false);assert.equal(p.englishWitness.gooldEnglishUsed,false);assert.equal(p.glossaryPreparation.version,'2026-09-18.4');assert.equal(p.glossaryPreparation.newEntries,0);
 for(const u of p.units){const t=find(u.translationId);assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.language,'la');assert.equal(t.glossaryVersion,p.glossaryPreparation.version);assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));}
});
test('493 extant lines cover 251–745 except the two genuinely omitted body numbers',()=>{
 assert.equal(p.verses.length,493);assert.equal(new Set(p.verses.map(v=>v.number)).size,493);assert.deepEqual([...p.verses.map(v=>v.number)].sort((a,b)=>a-b),Array.from({length:495},(_,i)=>i+251).filter(n=>![264,647].includes(n)));assert.deepEqual(p.omittedFromBody.flatMap(x=>x.verseNumbers),[264,647]);
});
test('all21 reading units cover each line once in80 exact Korean paragraphs',()=>{
 assert.equal(p.units.length,21);assert.deepEqual(p.units.map(u=>u.alignment.length),[4,4,3,3,4,4,4,4,5,4,3,5,5,3,4,3,3,2,5,3,5]);assert.deepEqual(p.units.flatMap(u=>u.sourceVerseIds),p.verses.map(v=>v.number));
 for(const u of p.units){const t=find(u.translationId);assert.deepEqual(u.alignment.flatMap(a=>a.sourceVerseIds),u.sourceVerseIds);assert.deepEqual(u.alignment.map(a=>a.targetParagraphIndex),t.paragraphs.map((_,i)=>i));assert(t.paragraphs.every(s=>/[가-힣]/u.test(s)&&!s.includes('\uFFFD')));}
});
test('Latin source hashes and exact Korean hashes reproduce the published text',()=>{
 for(const u of p.units){const t=find(u.translationId);assert.equal(u.sourceHash,hash(u.sourceVerseIds.map(n=>`${n}|${verse(n)}`).join('\n')));assert.equal(t.sourceHash,u.sourceHash);assert.deepEqual(u.targetParagraphHashes,t.paragraphs.map(hash));for(const [i,a] of u.alignment.entries()){assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.number),a.sourceVerseIds);assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.text),a.sourceVerseIds.map(verse));}}
});
test('three displaced lines retain the printed sequences rather than numeric sorting',()=>{
 const ids=p.verses.map(v=>v.number);assert.deepEqual(ids.slice(ids.indexOf(325),ids.indexOf(325)+4),[325,339,326,327]);assert.deepEqual(ids.slice(ids.indexOf(513),ids.indexOf(513)+4),[513,515,514,516]);assert.deepEqual(ids.slice(ids.indexOf(528),ids.indexOf(528)+4),[528,530,529,531]);assert.deepEqual(p.transpositions.map(t=>t.verse),[339,515,530]);
});
test('source page locations include moved339 on150 and all19 checked images',()=>{
 assert.deepEqual(p.reviewedPrimaryTranslationPages,Array.from({length:19},(_,i)=>147+i));assert.deepEqual([...new Set(p.verses.map(v=>v.pdfPage))],p.reviewedPrimaryTranslationPages);assert.equal(p.verses.find(v=>v.number===339).pdfPage,150);
 for(const u of p.units){assert.equal(new URL(find(u.translationId).sourceUrl).hash,`#page=${u.pdfPages[0]}`);assert.deepEqual(u.printedPages,u.pdfPages.map(n=>n-16));assert(u.sourceVerseIds.every(n=>{const q=p.verses.find(v=>v.number===n).pdfPage;return q>=u.pdfPages[0]&&q<=u.pdfPages[1];}));}
});
test('lacunae remain unfilled and typographical doubt is distinct from missing lines',()=>{
 assert.deepEqual(p.lacunae.map(x=>x.kind),['partial-line','unknown-extent']);assert.equal(p.lacunae[0].verse,268);assert.equal(p.lacunae[1].afterVerse,710);assert.equal(p.lacunae[1].beforeVerse,711);assert(p.lacunae.every(x=>x.reconstructed===false));
 assert.match(verse(268),/\* \*/);assert.match(verse(710),/catulosque sagacis$/);assert.match(verse(711),/^tertia Pleiadas/);assert.deepEqual(p.verses.filter(v=>v.status==='suspected-interpolation').map(v=>v.number),[338]);assert.match(verse(462),/†Atrei/);assert.match(verse(592),/†pelagusque/);
 assert(find('manilius-v-694-710').paragraphCriticalNotes.some(s=>s.includes('결락')));assert(find('manilius-v-711-745').paragraphCriticalNotes.some(s=>s.includes('결락')));
});
test('reconnected proofreading preserves prior drafts and does not double-count the provisional copy',()=>{
 assert.equal(p.finalRecovery.connectionVerified,true);assert.equal(p.finalRecovery.foundSavedWholeBookDraft,true);assert.equal(p.finalRecovery.internalThinkingFailureCauseKnown,false);assert.equal(p.finalRecovery.savedLatinLines,493);assert.equal(p.finalRecovery.externalTranslationModelCalls,0);
 assert.equal(p.finalRecovery.provisionalComparison.replacedLocalDraft,false);assert.equal(p.finalRecovery.provisionalComparison.provisionalKoreanParagraphs,9);assert.equal(p.finalRecovery.provisionalComparison.verifiedLocalParagraphs,8);assert.equal(p.finalRecovery.additionalDraftCorrections.length,4);assert.equal(p.proofRecord.changes.length,27);
});
test('primary-image corrections restore syntax, negation and two overlooked metaphors',()=>{
 assert.match(verse(274),/^seminaque/);assert.match(verse(275),/maiorem sorte/);assert.match(verse(495),/^nec pacem a bello/);assert.match(find('manilius-v-487-504').paragraphs[1],/평화와 전쟁도, 시민과 적도 구별하지/);
 assert.match(verse(483),/scenisue/);assert.match(verse(497),/contendere cuncta/);assert.match(verse(678),/turbaque inmobilis/);assert.match(verse(689),/messisque profundi/);assert.match(find('manilius-v-657-693').paragraphs.at(-1),/수확물/);
 assert.match(verse(694),/primis uultibus/);assert.match(find('manilius-v-694-710').paragraphs[0],/처음의 모습/);assert.match(verse(697),/prima luce/);assert.match(find('manilius-v-694-710').paragraphs[0],/첫 빛/);
});
test('the resumed crown and Spica precede the arrow with distinct zodiacal degrees',()=>{
 assert.match(verse(251),/quinque/);assert.match(verse(253),/Ariadneae.*coronae/);assert.match(verse(271),/decimam/);assert.match(verse(272),/^spica/);assert.match(verse(294),/octaua.*sagittam/);assert.match(verse(295),/^chelarum/);
 assert.match(find('manilius-v-251-270').notes?.join('\n')||find('manilius-v-251-270').editorialNotes.join('\n'),/294행/);assert.match(p.forwardGuideCorrection.corrected,/관/);
});
test('the long Andromeda narrative is retained without replacing its moral logic',()=>{
 const units=p.units.filter(u=>u.nominalVerseRange[0]>=538&&u.nominalVerseRange[1]<=631);assert.equal(units.length,4);assert.deepEqual(units.flatMap(u=>u.sourceVerseIds),Array.from({length:94},(_,i)=>i+538));
 assert.match(verse(573),/uictus in Andromedast/);assert.match(verse(608),/animoque magis quam corpore pendet/);assert.match(verse(631),/poenis innoxia corpora seruat/);assert.match(find('manilius-v-613-631').paragraphs.at(-1),/죄 없는 몸들도 벌을 받도록/);
 for(const u of units)assert.match(find(u.translationId).contentNotice,/역사 문헌/);
});
test('all 42 new references are exact Latin-Korean alignments, not English intermediaries',()=>{
 for(const u of p.units){const t=find(u.translationId),rr=refs.filter(r=>r.translationId===t.id);assert.equal(rr.length,2);assert(rr.every(r=>r.language==='la'));const pair=rr.find(r=>r.kind==='parallel-translation'),whole=rr.find(r=>r.kind==='korean-reference');assert.equal(pair.sourceText,u.alignment[0].sourceVerseIds.map(verse).join('\n'));assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(pair.targetText,t.paragraphs[0]);assert.equal(whole.targetText,t.paragraphs.join('\n\n'));assert.deepEqual(pair.notes,t.editorialNotes);assert.deepEqual(whole.notes,t.editorialNotes);}
});
test('the prior 205 translations and 398 reference records are preserved as committed',()=>{
 assert.equal(p.preservedTranslations.length,205);assert.equal(p.preservedReferences.length,398);for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(refs.find(x=>x.id===old.id))),old.sha256,old.id);
});
test('five reading series end at the actual last line without claiming lost text restoration',()=>{
 const volumes=translationVolumes(ts.filter(t=>t.sourceId==='manilius-breiter1907'));assert.deepEqual(volumes.map(v=>v.entries.length),[28,36,22,35,33]);for(const v of volumes)assert.deepEqual(v.entries.map(t=>t.series.order),v.entries.map((_,i)=>i+1));
 const all=volumes.flatMap(v=>v.entries);assert.equal(all.length,154);assert.equal(all.reduce((n,t)=>n+t.paragraphs.length,0),695);assert.equal(all.reduce((n,t)=>n+t.paragraphLatinVerses.flat().length,0),4242);
 assert.equal(p.completion.bookLatinLines,740);assert.deepEqual(p.completion.fullBookExcludedNumbers,[6,7,18,264,647]);assert.equal(p.completion.allFiveBooksPrintedBodyComplete,true);assert.equal(p.completion.restoredMissingText,false);assert.equal(p.next,null);
 const last=find('manilius-v-711-745');assert.match(verse(745),/totus et accenso mundus flagraret Olympo/);assert.match(last.paragraphs.at(-1),/주었다면/);assert.match(last.paragraphs.at(-1),/타올랐을 것이다/);assert.equal(p.completion.lastPdfPage,165);assert.equal(p.completion.lastPrintedPage,149);
});
