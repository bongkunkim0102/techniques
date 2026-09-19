import test from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {corrigendaLinks} from '../src/data/editorial/corrigenda-links.mjs';
const read=async p=>JSON.parse(await readFile(new URL(p,import.meta.url),'utf8'));
const d=await read('../src/data/editorial/breiter-corrigenda.json'),record=await read('../data/reference/breiter-corrigenda-application-2026-09-20.json'),corpus=await read('../src/data/translations.json'),preface=await read('../src/data/editorial/breiter-preface.json');
const hash=s=>createHash('sha256').update(s).digest('hex'),item=id=>d.items.find(e=>e.id===id);
test('corrigenda edition is seven located applications, not additional recovered poem text',()=>{
 assert.deepEqual(d,record);assert.equal(d.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(d.externalTranslationModelCalls,0);assert.equal(d.sourceLanguage,'la');assert.equal(d.englishWitnessUsed,false);
 assert.deepEqual(d.counts,{items:7,bodyCorrections:3,apparatusCorrections:4,contextVerses:128,koreanContextParagraphs:25,facsimiles:7,newPoemVerses:0,newPoemUnits:0});assert.equal(d.glossaryChange,false);assert.deepEqual(d.reviewedPdfPages,[5,29,42,48,55,57,88,89,91,92]);
});
test('all seven directions and local line coordinates match the translated printed errata',()=>{
 const rows=preface.sections.find(s=>s.id==='corrigenda').errata;assert.equal(rows.length,7);
 for(const [i,e] of d.items.entries()){for(const field of ['wrong','right','printedPage','direction','line'])assert.equal(e[field],rows[i][field]);assert.equal(e.erratumLatin,rows[i].latin);assert.equal(e.pdfPage,e.printedPage+16);}
 assert.deepEqual(d.items.map(e=>[e.book,e.verse,e.layer]),[[1,375,'apparatus-reference'],[1,787,'apparatus-reading'],[2,3,'apparatus-reading'],[2,220,'poem-body'],[2,270,'apparatus-heading'],[3,217,'poem-body'],[3,330,'poem-body']]);
});
test('case normalization is explicit and each target changes only its specified occurrence',()=>{
 for(const e of d.items){const before=e.id==='e03'?e.wrong.toLowerCase():e.wrong,after=e.id==='e03'?e.right.toLowerCase():e.right;assert.equal(e.targetBefore.split(before).length,2);assert.equal(e.targetAfter,e.targetBefore.replace(before,after));}
 assert.equal(item('e03').wrong,'Hectoreamque');assert.match(item('e03').targetAfter,/hectoreumque/);
});
test('only II.220, III.217 and III.330 change in the corrected Latin context',()=>{
 const changes=[];for(const e of d.items){const original=corpus.filter(t=>t.series?.id===`manilius-book${e.book}`).flatMap(t=>t.paragraphLatinVerses.flat()).filter(v=>v.number>=e.contextRange[0]&&v.number<=e.contextRange[1]);assert.deepEqual(e.contextBefore,original);
  assert.deepEqual(e.contextBefore.map(v=>v.number),e.contextAfter.map(v=>v.number));for(const [i,v] of e.contextAfter.entries())if(v.text!==e.contextBefore[i].text)changes.push(`${e.book}.${v.number}`);
  if(e.layer!=='poem-body')assert.deepEqual(e.contextBefore,e.contextAfter);
 }
 assert.deepEqual(changes,['2.220','3.217','3.330']);
});
test('128 source verses are covered once by 25 directly written Korean paragraphs',()=>{
 let verses=0,paragraphs=0;for(const e of d.items){assert.deepEqual(e.contextBlocks.flatMap(b=>b.verseIds),e.contextBefore.map(v=>v.number));assert.equal(e.contextBefore.length,e.contextRange[1]-e.contextRange[0]+1);verses+=e.contextBefore.length;paragraphs+=e.contextBlocks.length;
  for(const b of e.contextBlocks){assert(/[가-힣]/u.test(b.ko));assert(!b.ko.includes('\uFFFD'));assert.equal(b.targetHash,hash(b.ko));assert.deepEqual(b.latinBefore,e.contextBefore.filter(v=>b.verseIds.includes(v.number)));assert.deepEqual(b.latinAfter,e.contextAfter.filter(v=>b.verseIds.includes(v.number)));}
 }
 assert.equal(verses,128);assert.equal(paragraphs,25);
});
test('original and corrected source hashes are different only for the three poem cases',()=>{
 for(const e of d.items){assert.equal(e.sourceHash,hash(e.contextBefore.map(v=>`${v.number}|${v.text}`).join('\n')));assert.equal(e.correctedSourceHash,hash(e.contextAfter.map(v=>`${v.number}|${v.text}`).join('\n')));assert.equal(e.sourceHash===e.correctedSourceHash,e.layer!=='poem-body');}
});
test('annotation corrections are not smuggled into adopted verses or headings',()=>{
 assert.match(item('e01').targetAfter,/^375 intra/);assert.match(item('e01').contextAfter.find(v=>v.number===373).text,/^aspice/);
 assert.match(item('e02').contextAfter.find(v=>v.number===787).text,/Curiusque pares/);assert(!item('e02').contextAfter.find(v=>v.number===787).text.includes('parens'));
 assert.match(item('e03').contextAfter.find(v=>v.number===3).text,/sub Hectore Troiam/);assert.equal(item('e05').beforeVerse,true);assert.match(item('e05').targetAfter,/d\. a\. s\. m$/);assert.match(item('e05').contextAfter[0].text,/^nec satis/);
});
test('new Korean makes the changed reading visible without universal replacement',()=>{
 assert.match(item('e04').contextBlocks[2].ko,/천칭자리/);assert(item('e04').existingKorean.some(b=>b.text.includes('집게발')));assert.match(item('e06').contextBlocks[2].ko,/밟아 지나/);assert.match(item('e07').contextBlocks[1].ko,/구면을 따라/);
 assert.match(item('e07').translationNotes.join(' '),/소급하여 지우지/);assert.match(item('e04').explanation.join(' '),/배정 자체가 달라졌다고/);
});
test('all source proof files are real PNGs with reviewed hashes',async()=>{
 for(const e of d.items){const b=await readFile(new URL('../'+e.proof.path,import.meta.url));assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(hash(b),e.proof.sha256);assert(b.readUInt32BE(16)>500);assert.equal(e.proof.pdfPage,e.pdfPage);assert.equal('/'+e.proof.path.slice(7),e.proof.url);}
});
test('existing corpus, examples and prior editorial source remain unchanged',async()=>{
 for(const f of d.preservedFiles){const text=await readFile(new URL('../'+f.path,import.meta.url),'utf8');assert.equal(hash(text.replace(/\r\n/g,'\n')),f.sha256,f.path);}
 const manilius=corpus.filter(t=>t.sourceId==='manilius-breiter1907');assert.equal(manilius.length,154);assert.equal(manilius.reduce((n,t)=>n+t.paragraphs.length,0),695);assert.equal(manilius.reduce((n,t)=>n+t.paragraphLatinVerses.flat().length,0),4242);
});
test('seven targeted notices lead to exact original units without changing old IDs',()=>{
 assert.equal(corrigendaLinks.length,7);for(const e of d.items){const link=corrigendaLinks.find(l=>l.id===e.id);assert.equal(link.translationId,e.translationId);assert.equal(link.url,`/editorial/breiter1907-corrigenda/#${e.id}`);const t=corpus.find(t=>t.id===e.translationId);assert(t);assert(e.originalLink.startsWith(`/translations/${t.id}/#paragraph-`));for(const old of e.existingKorean){const index=Number(old.link.split('paragraph-')[1])-1;assert.equal(old.text,t.paragraphs[index]);}}
});
