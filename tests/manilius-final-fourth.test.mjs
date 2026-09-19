import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary} from '../src/data/glossary.mjs';import {translationVolumes} from '../src/lib/translations.mjs';
const read=async f=>JSON.parse(await readFile(new URL(f,import.meta.url),'utf8'));
const ts=await read('../src/data/translations.json'),refs=await read('../data/reference/translation-examples.json');
const p4=await read('../data/reference/manilius-book4-completion-2026-09-19.json'),p5=await read('../data/reference/manilius-book5-opening-2026-09-19.json'),old4=await read('../data/reference/manilius-book4-opening-2026-09-19.json');
const hash=s=>createHash('sha256').update(s,'utf8').digest('hex'),find=id=>ts.find(t=>t.id===id),line=(p,n)=>p.verses.find(v=>v.number===n).text;
test('two batches retain direct Latin authorship and the existing terminology edition',()=>{
 for(const p of [p4,p5]){assert.equal(p.sourceLanguage,'la');assert.equal(p.externalTranslationModelCalls,0);assert.equal(p.englishWitness.usedAsSource,false);assert.equal(p.englishWitness.gooldEnglishUsed,false);assert.equal(p.englishWitness.housmanConsulted,false);assert.equal(p.glossaryPreparation.version,'2026-09-18.4');assert.equal(p.glossaryPreparation.newEntries,0);for(const u of p.units){const t=find(u.translationId);assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.method,'direct-editor');assert.equal(t.language,'la');assert.equal(t.glossaryVersion,p.glossaryPreparation.version);assert(t.termIds.every(id=>glossary.some(g=>g.id===id)));}}
});
test('Book IV continuation contains all 351 numbered lines through 935',()=>{
 assert.equal(p4.units.length,13);assert.equal(p4.verses.length,351);assert.deepEqual([...p4.verses.map(v=>v.number)].sort((a,b)=>a-b),Array.from({length:351},(_,i)=>i+585));assert.equal(new Set(p4.verses.map(v=>v.number)).size,351);
 const full=[...old4.verses,...p4.verses];assert.equal(full.length,933);assert.equal(new Set(full.map(v=>v.number)).size,933);assert.deepEqual(full.filter(v=>typeof v.number==='number').map(v=>v.number).sort((a,b)=>a-b),Array.from({length:935},(_,i)=>i+1).filter(n=>![298,500,501].includes(n)));assert.equal(full.filter(v=>v.number==='489b').length,1);
});
test('Book V opening has 247 lines and excludes only absent 6,7,18',()=>{
 assert.equal(p5.units.length,12);assert.equal(p5.verses.length,247);assert.deepEqual([...p5.verses.map(v=>v.number)].sort((a,b)=>a-b),Array.from({length:250},(_,i)=>i+1).filter(n=>![6,7,18].includes(n)));assert.deepEqual(p5.omittedFromBody[0].verseNumbers,[6,7,18]);assert.equal(p5.completion.complete,false);
});
test('all 598 source lines map once to all 95 Korean paragraphs',()=>{
 assert.deepEqual(p4.units.map(u=>u.alignment.length),[5,4,5,4,5,5,4,5,4,4,4,4,3]);assert.deepEqual(p5.units.map(u=>u.alignment.length),[5,4,2,5,4,2,3,3,3,2,4,2]);
 for(const p of [p4,p5]){assert.deepEqual(p.units.flatMap(u=>u.sourceVerseIds),p.verses.map(v=>v.number));for(const u of p.units){const t=find(u.translationId);assert.deepEqual(u.alignment.flatMap(a=>a.sourceVerseIds),u.sourceVerseIds);assert.deepEqual(u.alignment.map(a=>a.targetParagraphIndex),t.paragraphs.map((_,i)=>i));assert.equal(t.paragraphLocators.length,t.paragraphs.length);assert(t.paragraphs.every(s=>/[가-힣]/u.test(s)&&!s.includes('\uFFFD')));}}
});
test('hashes and published Latin agree with the source records',()=>{
 for(const p of [p4,p5])for(const u of p.units){const t=find(u.translationId);assert.equal(u.sourceHash,hash(u.sourceVerseIds.map(n=>`${n}|${line(p,n)}`).join('\n')));assert.equal(t.sourceHash,u.sourceHash);assert.deepEqual(u.targetParagraphHashes,t.paragraphs.map(hash));for(const [i,a] of u.alignment.entries()){assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.number),a.sourceVerseIds);assert.deepEqual(t.paragraphLatinVerses[i].map(v=>v.text),a.sourceVerseIds.map(n=>line(p,n)));}}
});
test('all 23 newly read source pages and their print-page offsets are recorded',()=>{
 for(const [p,start,count] of [[p4,125,14],[p5,139,9]]){assert.deepEqual(p.reviewedPrimaryTranslationPages,Array.from({length:count},(_,i)=>start+i));assert.deepEqual([...new Set(p.verses.map(v=>v.pdfPage))],p.reviewedPrimaryTranslationPages);for(const u of p.units){assert.equal(new URL(find(u.translationId).sourceUrl).hash,`#page=${u.pdfPages[0]}`);assert.deepEqual(u.printedPages,u.pdfPages.map(n=>n-16));assert(u.sourceVerseIds.every(n=>{const page=p.verses.find(v=>v.number===n).pdfPage;return page>=u.pdfPages[0]&&page<=u.pdfPages[1];}));}}
});
test('moved lines 666 and 167 remain in the printed sequence',()=>{
 const a=p4.verses.map(v=>v.number),b=p5.verses.map(v=>v.number);assert.deepEqual(a.slice(a.indexOf(665),a.indexOf(665)+5),[665,667,668,666,669]);assert.deepEqual(b.slice(b.indexOf(163),b.indexOf(163)+6),[163,164,167,165,166,168]);
 assert(find('manilius-iv-646-680').paragraphCriticalNotes.some(s=>s.includes('666')));assert(find('manilius-v-157-173').paragraphCriticalNotes.some(s=>s.includes('167')));
});
test('partial lacuna and crux stay unfilled, with complete and partial italics distinguished',()=>{
 assert.match(line(p4,606),/\* \* \*$/);assert.match(line(p4,800),/†uruptor/);assert.deepEqual(p4.suspectedInterpolationVerses,[683,776]);assert.deepEqual(p5.suspectedInterpolationVerses,[30,31,131]);
 assert.deepEqual(p4.verses.find(v=>v.number===848).italicSpans,['causae quae ecliptica signa']);assert.deepEqual(p4.verses.find(v=>v.number===849).italicSpans,['dixere antiqui']);assert(!p4.verses.find(v=>v.number===848).status);
 assert.match(find('manilius-iv-791-817').paragraphs[1],/\[물고기에 관한 구절 난문\]/);assert.match(find('manilius-iv-585-618').paragraphs[3],/……/);
});
test('draft corrections change actual misreadings rather than masking edition variants',()=>{
 assert.equal(p4.proofRecord.corrections.length,7);assert.equal(p5.proofRecord.corrections.length,5);assert.match(line(p4,618),/pontemque/);assert.match(find('manilius-iv-585-618').paragraphs.at(-1),/다리 역할/);assert.match(line(p4,882),/nostis/);assert.match(find('manilius-iv-866-895').paragraphs[1],/그대들은/);
 assert.match(line(p5,3),/quadriiugis/);assert.match(find('manilius-v-001-031').paragraphs[0],/포이보스는 네 마리 말/);assert.match(line(p5,221),/fletus odiumque/);assert.match(find('manilius-v-206-233').paragraphs[2],/분노의 눈물/);
});
test('geographic overlaps and eclipse duration qualifications are not silently unified',()=>{
 assert.match(line(p4,752),/Aegypti/);assert.match(line(p4,779),/Aegyptique/);assert.match(line(p4,798),/Aegyptum/);assert.match(line(p4,850),/nec uicina.*contraria/);assert.match(line(p4,855),/breuius.*longius/);
 const t=find('manilius-iv-841-865');assert.match(t.paragraphs[1],/이웃한 둘이 아니라/);assert.match(t.paragraphs[2],/더 짧게.*더 길게/);assert.match(t.paragraphs[3],/먼저.*먼저/);
});
test('hunting itself, hunting equipment and named stars are kept distinct',()=>{
 assert.match(line(p5,199),/uenatus non.*uerum arma/);assert.match(find('manilius-v-197-205').paragraphs[0],/사냥 자체가 아니라/);assert.match(line(p5,197),/uicesima/);assert.match(line(p5,198),/septimaque/);assert.match(line(p5,207),/canicula/);
 assert.equal(p5.lexicalConsultation.isEnglishTranslationWitness,false);assert.match(find('manilius-v-174-196').paragraphs[0],/이우굴라이/);assert.equal(find('manilius-v-174-196').additionalSources.length,1);assert.match(line(p5,172),/inuigilat somnis, curas/);
});
test('all fifty new reference records align to the direct Latin texts',()=>{
 for(const p of [p4,p5])for(const u of p.units){const t=find(u.translationId),r=refs.filter(x=>x.translationId===t.id);assert.equal(r.length,2);const pair=r.find(x=>x.kind==='parallel-translation'),whole=r.find(x=>x.kind==='korean-reference');assert.equal(pair.language,'la');assert.equal(pair.sourceText,u.alignment[0].sourceVerseIds.map(n=>line(p,n)).join('\n'));assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(pair.targetText,t.paragraphs[0]);assert.equal(whole.targetText,t.paragraphs.join('\n\n'));assert.deepEqual(pair.notes,t.editorialNotes);}
});
test('all 180 earlier translations and 348 earlier references stay exactly unchanged',()=>{
 for(const p of [p4,p5]){assert.equal(p.preservedTranslations.length,180);assert.equal(p.preservedReferences.length,348);for(const old of p.preservedTranslations)assert.equal(hash(JSON.stringify(find(old.id))),old.sha256,old.id);for(const old of p.preservedReferences)assert.equal(hash(JSON.stringify(refs.find(x=>x.id===old.id))),old.sha256,old.id);}
});
test('four complete books and the partial fifth have explicit boundaries and contextual notices',()=>{
 const volumes=translationVolumes(ts.filter(t=>t.sourceId==='manilius-breiter1907'));assert.deepEqual(volumes.map(v=>v.entries.length),[28,36,22,35,33]);for(const v of volumes)assert.deepEqual(v.entries.map(t=>t.series.order),v.entries.map((_,i)=>i+1));
 assert.match(line(p4,935),/Augusto crescet/);assert.match(line(p5,250),/crater umoris amator/);assert.deepEqual(p5.next,{book:5,verse:251,pdfPage:147,printedPage:131,title:'처녀자리와 화살의 별자리'});
 for(const p of [p4,p5])for(const u of p.units)assert.match(find(u.translationId).contentNotice,/저자의 서술.*현대/);assert.match(find('manilius-v-140-156').editorialNotes.join('\n'),/질환·도덕적 결함/);
});

test('partial interpolation spans produce exact renderable fragments',()=>{
 const t=find('manilius-iv-841-865');
 for(const n of [848,849]){const row=t.paragraphLatinVerses.flat().find(v=>v.number===n);assert(row.fragments);assert.equal(row.fragments.map(f=>f.text).join(''),row.text);assert.deepEqual(row.fragments.filter(f=>f.suspected).map(f=>f.text),row.italicSpans);assert(row.fragments.some(f=>!f.suspected));}
});
