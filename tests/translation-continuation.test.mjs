import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {compareTranslations,translationVolumes} from '../src/lib/translations.mjs';
const read=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const translations=await read('../src/data/translations.json');
const provenance=await read('../data/reference/ptolemy-continuation-2026-09-18.json');
const examples=await read('../data/reference/translation-examples.json');
const hash=text=>createHash('sha256').update(text,'utf8').digest('hex');

test('continuation covers every source paragraph once and retains reproducible hashes',()=>{
  assert.equal(provenance.chapters.length,5);assert.match(provenance.sourcePdf.sha256,/^[a-f0-9]{64}$/);
  assert.deepEqual(provenance.chapters.map(c=>c.sourceParagraphs.length),[3,13,9,6,6]);
  for(const c of provenance.chapters){
    const t=translations.find(t=>t.id===c.translationId);assert(t,c.translationId);
    assert.equal(t.sourceHashKind,'normalized-chapter-transcription');
    assert.equal(c.sourceHash,hash(c.sourceParagraphs.join('\n\n')));assert.equal(t.sourceHash,c.sourceHash);
    assert.deepEqual(c.alignment.map(a=>a.sourceParagraphIndex),c.sourceParagraphs.map((_,i)=>i));
    assert(c.alignment.every(a=>a.targetParagraphIndices.length>0));
    assert.deepEqual(c.alignment.flatMap(a=>a.targetParagraphIndices),t.paragraphs.map((_,i)=>i));
    assert.deepEqual(c.targetParagraphHashes,t.paragraphs.map(hash));
    assert(t.paragraphs.every(p=>p.trim()&&!p.includes('\uFFFD')));
    assert.equal(t.editor,'ChatGPT (GPT-6 Astra Pro)');assert.equal(t.method,'direct-editor');
    assert.equal(new URL(t.sourceUrl).hash,`#page=${c.pdfPages[0]}`);
    assert.deepEqual(c.printedPages,c.pdfPages.map(n=>n-33));
    assert(t.additionalSources.some(s=>new URL(s.url).hash===`#${c.anchor}`));
    for(const v of c.variants){assert(c.sourceParagraphs[v.paragraph].includes(v.to));assert(v.page>=c.pdfPages[0]&&v.page<=c.pdfPages[1]);}
  }
});

test('new reference examples map to checked source passages, not merely similar prose',()=>{
  for(const c of provenance.chapters){
    const t=translations.find(t=>t.id===c.translationId);
    const pairs=examples.filter(e=>e.translationId===c.translationId&&e.kind==='parallel-translation');assert(pairs.length);
    for(const pair of pairs){const sourceIndex=c.sourceParagraphs.indexOf(pair.sourceText);assert(sourceIndex>=0);assert.deepEqual(c.alignment[sourceIndex].targetParagraphIndices,[pair.paragraphIndex]);assert.equal(pair.sourceTextHash,hash(pair.sourceText));assert.equal(pair.targetText,t.paragraphs[pair.paragraphIndex]);}
    assert(examples.some(e=>e.translationId===c.translationId&&e.kind==='korean-reference'));
  }
});

test('volumes never interleave, Book I is complete, and Book II begins at I',()=>{
  const entries=translations.filter(t=>t.sourceId==='ptolemy-ashmand1822');const volumes=translationVolumes(entries);
  assert.deepEqual(volumes.map(v=>v.id),['ptolemy-book1','ptolemy-book2','ptolemy-book3']);
  assert.deepEqual(volumes[0].entries.map(t=>t.series.order),Array.from({length:27},(_,i)=>i+1));
  assert.deepEqual(volumes[1].entries.map(t=>t.series.order),Array.from({length:14},(_,i)=>i+1));
  assert.deepEqual(volumes[2].entries.map(t=>t.series.order),Array.from({length:19},(_,i)=>i+1));
  const ordered=[...entries].sort(compareTranslations),end=ordered.findIndex(t=>t.id==='ptolemy-application-separation');
  assert.equal(ordered[end+1].id,'ptolemy-universal-particular');
  const synthetic=[10,2,1].map(n=>({id:`test-${n}`,series:{id:`ptolemy-book${n}`,order:1}}));
  assert.deepEqual(synthetic.sort(compareTranslations).map(t=>t.id),['test-1','test-2','test-10']);
});

test('historical claims retain contextual notices and edition-specific vocabulary',()=>{
  const find=id=>translations.find(t=>t.id===id);
  assert.match(find('ptolemy-climates-peoples').contentNotice,/역사적 서술/);assert.match(find('ptolemy-prescience-usefulness').contentNotice,/검증/);
  assert.match(find('ptolemy-universal-particular').paragraphs[1],/^천문/);assert.match(find('ptolemy-climates-peoples').paragraphs.at(-1),/모든 개인에게 반드시/);
});
