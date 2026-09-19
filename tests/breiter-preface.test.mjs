import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {glossary,glossaryVersion} from '../src/data/glossary.mjs';import {selectGlossaryTerms} from '../scripts/lib/glossary.mjs';
const read=async f=>JSON.parse(await readFile(new URL(f,import.meta.url),'utf8'));
const data=await read('../src/data/editorial/breiter-preface.json'),record=await read('../data/reference/breiter-preface-verification-2026-09-19.json');
const hash=x=>createHash('sha256').update(x).digest('hex'),section=id=>data.sections.find(s=>s.id===id);
test('editorial prose is Breiter, not a sixth book of Manilius or delegated translation',()=>{
 assert.equal(data.author,'Theodor Breiter');assert.equal(data.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(data.sourceLanguage,'la');assert.equal(data.method,'direct-editor');assert.equal(data.externalTranslationModelCalls,0);assert.match(data.scope,/외교적으로 전사/);assert.match(data.limitation,/1907년 편집자/);
 assert.deepEqual(data.primaryPages,[5,7,8,9,10,11,12,13,14,15]);assert.equal(data.sections.length,11);assert.equal(data.counts.prefaceKoreanParagraphs,47);assert.equal(data.counts.footnotes,7);assert.equal(data.counts.corrigenda,7);assert.deepEqual(data,record);
});
test('all prose, footnotes and errata have directly paired Korean and Latin with exact hashes',()=>{
 const ids=[];for(const s of data.sections){for(const b of [...s.blocks,...(s.footnotes||[]),...(s.errata||[])]){assert(/[가-힣]/u.test(b.ko));assert(!b.ko.includes('\uFFFD'));assert.equal(hash(b.latin),b.sourceHash);assert.equal(hash(b.ko),b.targetHash);if(b.id)ids.push(b.id);}}
 assert.equal(new Set(ids).size,ids.length);assert.equal(data.sections.filter(s=>s.id!=='corrigenda').reduce((n,s)=>n+s.blocks.length,0),47);
});
test('source verification corrects names, date and folio without normalizing 1907 into current facts',()=>{
 assert.match(section('manuscripts').blocks[2].latin,/Gotefredo Richtero/);assert.match(section('manuscripts').blocks[2].ko,/리히터/);assert.match(section('manuscripts').blocks[3].latin,/1853/);assert(!section('manuscripts').blocks[3].ko.includes('1858'));
 assert.match(section('witnesses').blocks[0].latin,/folio 2r/);assert.match(section('witnesses').blocks[0].ko,/둘째 장 앞면/);assert.match(section('madrid').blocks[2].ko,/1–82행/);assert.match(data.limitation,/현대 소장정보/);
});
test('sigla distinguish Latin o from Greek omega and the two Urbinas witnesses',()=>{
 const pairs=Object.fromEntries(section('editorial-method').sigla.map(s=>[s.symbol,s.meaning]));assert.match(pairs.o,/omnes/);assert.match(pairs['ω'],/ceteri/);assert.match(pairs['(E)'],/엘리스/);assert.match(pairs['(L)'],/뢰베/);assert.match(pairs['u₁'],/668\(802\)/);assert.match(pairs['u₂'],/667\(803\)/);assert.match(pairs.u,/일치/);assert.match(section('editorial-method').blocks[1].latin,/crucis \(†\)/);
});
test('all seven corrigenda preserve before/after direction and line-count direction',()=>{
 const rows=section('corrigenda').errata;assert.deepEqual(rows.map(r=>[r.wrong,r.right]),[['373','375'],['parent','parens'],['Hectoreamque','Hectoreumque'],['chelis','libra'],['uas','d. a. s.'],['ferat','terat'],['orbis','orbe']]);assert.deepEqual(rows.map(r=>r.direction),['from-end','from-end','from-end','from-start','from-end','from-start','from-start']);assert.deepEqual(rows.map(r=>r.printedPage),[13,26,32,39,41,72,76]);assert.match(section('corrigenda').notes.join(' '),/자동 치환하지/);
});
test('Octotopos correction retains the stable ID and every historical spelling',()=>{
 const t=glossary.find(t=>t.id==='manilius-octotropos');assert(t);assert.match(t.ko,/옥토토포스/);assert.equal(t.en,'Octotopos (Manilius)');for(const alias of ['octotopos','옥토토포스','octotropos','octotropon','옥토트로포스'])assert(t.aliases.includes(alias));assert.match(t.note,/8하우스/);assert.equal(data.glossaryVersion,'2026-09-19.manilius-editorial.1');assert.equal(data.glossaryCorrection.newVersion,data.glossaryVersion);assert.equal(t.version,glossaryVersion);assert(glossary.length>=631);
 for(const name of ['octotopos','octotropos','옥토토포스','옥토트로포스'])assert(selectGlossaryTerms(name,glossary).some(t=>t.id==='manilius-octotropos'));assert.equal(data.glossaryCorrection.oldTranslationsReversioned,false);
});
test('seven source plates are real PNGs matching the reviewed hashes',async()=>{
 assert.equal(data.plateFiles.length,7);for(const p of data.plateFiles){const bytes=await readFile(new URL('../'+p.path,import.meta.url));assert.equal(bytes.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(hash(bytes),p.sha256);assert(bytes.readUInt32BE(16)>300);assert(bytes.readUInt32BE(20)>100);}
 assert.match(section('affinity').notes.join(' '),/외교적으로|정규화 전사/);assert.match(section('descendants').notes.join(' '),/원문 영인/);
});
test('all prior translations and examples preserve committed content across checkout newlines',async()=>{
 assert.equal(data.preservedFiles.length,2);for(const p of data.preservedFiles){const text=await readFile(new URL('../'+p.path,import.meta.url),'utf8');assert.equal(hash(text.replace(/\r\n/g,'\n')),p.sha256,p.path);assert.match(p.gitBlob,/^[a-f0-9]{40}$/);}
 const corpus=await read('../src/data/translations.json'),manilius=corpus.filter(t=>t.sourceId==='manilius-breiter1907');assert.equal(manilius.length,154);assert.equal(manilius.reduce((n,t)=>n+t.paragraphs.length,0),695);assert.equal(manilius.reduce((n,t)=>n+t.paragraphLatinVerses.flat().length,0),4242);assert(!corpus.some(t=>t.id==='breiter1907-preface'));
});
test('the source-based revision does not upgrade a summary into a complete translation',()=>{
 assert.equal(data.previousDrafts.length,2);assert.match(data.previousDrafts[0].assessment,/요약/);assert.match(data.previousDrafts[1].assessment,/중복 합산하지/);assert.equal(data.corrections.length,7);assert.match(data.scope,/모든 이문을 외교적으로/);assert.match(data.transcriptionPolicy,/읽기용/);
});
test('source title errors and authorial doubts are preserved as evidence',()=>{
 assert.match(section('titles').blocks[3].latin,/LIBER II.*LIBER III/);assert.match(section('titles').blocks[3].ko,/제4권의 끝인데도/);assert.match(section('titles').blocks[4].latin,/Τέλωσ/);assert.match(section('letter').blocks[3].ko,/위대한 아폴론/);assert.match(section('witnesses').blocks[3].ko,/오늘날/);assert.match(section('witnesses').notes.join(' '),/1907년/);
});

test('recovery records the reproduced buffer error without claiming the internal failure cause',()=>{
 const r=data.finalRecovery;assert.equal(r.reproducedError,'spawnSync git ENOBUFS');assert.equal(r.internalThinkingFailureCauseKnown,false);assert.equal(r.poemOrReferenceContentChanged,false);assert.equal(r.externalTranslationModelCalls,0);assert.deepEqual(r.secondaryFinding.map(x=>x.records),[226,440]);assert(r.secondaryFinding.every(x=>x.normalizedTextEqual&&x.objectsIdentical&&x.baseCRLF===0&&x.qaCRLF>0));
});
