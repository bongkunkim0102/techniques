import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {selectReferenceExamples} from '../scripts/lib/translation-reference.mjs';
import {jobKey} from '../scripts/lib/translation.mjs';
import {selectGlossaryTerms} from '../scripts/lib/glossary.mjs';
import {glossary} from '../src/data/glossary.mjs';
const examples=JSON.parse(await readFile(new URL('../data/reference/translation-examples.json',import.meta.url),'utf8'));
const translations=JSON.parse(await readFile(new URL('../src/data/translations.json',import.meta.url),'utf8'));
test('reference corpus matches published Astra translations and valid term IDs',()=>{
  assert(examples.length>0);assert.equal(new Set(examples.map(e=>e.id)).size,examples.length);
  for(const e of examples){
    const t=translations.find(t=>t.id===e.translationId);assert(t);assert.equal(t.method,'direct-editor');
    assert.equal(e.targetText,e.kind==='korean-reference'?t.paragraphs.join('\n\n'):t.paragraphs[e.paragraphIndex]);
    assert.equal(e.sourceUrl,t.sourceUrl);assert.equal(e.sourceLicense,t.license);
    assert(e.termIds.every(id=>glossary.some(t=>t.id===id)));
    if(e.kind!=='korean-reference')assert(e.sourceText.length>10);
  }
});
test('retrieval uses source language and related terms, with a bounded prompt budget',()=>{
  for(const text of ['The Sun, Moon and Saturn belong to different sects.','晝生日而金水輔從夜誕月而火羅侍衛']){
    const selected=selectReferenceExamples(text,selectGlossaryTerms(text,glossary),examples);
    assert(selected.length>0);assert(selected.length<=4);
    assert.equal(new Set(selected.map(e=>e.translationId)).size,selected.length);
    assert(selected.every(e=>e.language===(text.startsWith('The')?'en':'lzh')));
    assert(selected.reduce((n,e)=>n+JSON.stringify(e).length,0)<=9000);
  }
  assert.deepEqual(selectReferenceExamples('unrelated document',[],examples),[]);
  assert.deepEqual(selectReferenceExamples('Sun',[{id:'sun'}],examples,4,1),[]);
});
test('changed reference corpus cannot reuse a completed translation job',()=>{
  assert.notEqual(jobKey('source','glossary','auto','https://example.test','old'),jobKey('source','glossary','auto','https://example.test','new'));
});
test('Ptolemy technical chapters are continuous and source-specific distinctions resolve',()=>{
  const chapters=translations.filter(t=>t.series?.id==='ptolemy-book1');
  assert.deepEqual(chapters.map(t=>t.series.order).sort((a,b)=>a-b),Array.from({length:24},(_,i)=>i+4));
  for(const t of chapters)assert(examples.some(e=>e.translationId===t.id));
  const selected=selectGlossaryTerms('proper face and chariot; tropical signs; commanding and obeying signs',glossary).map(t=>t.id);
  for(const id of ['proper-face','planetary-chariot','solstitial-signs','commanding-obeying-signs'])assert(selected.includes(id),id);
  const refs=selectReferenceExamples('proper face and chariot',selectGlossaryTerms('proper face and chariot',glossary),examples);
  assert.equal(refs[0].translationId,'ptolemy-faces-chariots');
  assert.equal(refs[0].kind,'parallel-translation');
});
test('Egyptian bounds transcription covers each sign once and reproduces source planet totals',()=>{
  const table=translations.find(t=>t.id==='ptolemy-egyptian-chaldean-terms').tables[0];
  assert.equal(table.rows.length,12);assert.equal(new Set(table.rows.map(r=>r[0])).size,12);
  const totals={};
  for(const [sign,...cells] of table.rows){
    let end=0;const planets=new Set();
    for(const cell of cells){const match=cell.match(/^(\S+) · (\d+)° → (\d+)°$/);assert(match,cell);const [,planet,size,boundary]=match;assert(!planets.has(planet),sign);planets.add(planet);end+=Number(size);assert.equal(end,Number(boundary),sign);totals[planet]=(totals[planet]||0)+Number(size);}
    assert.equal(end,30,sign);assert.equal(planets.size,5);
  }
  assert.deepEqual(totals,{'목성':79,'금성':82,'수성':76,'화성':66,'토성':57});
});
