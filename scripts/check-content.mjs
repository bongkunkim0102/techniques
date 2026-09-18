import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { glossary, glossaryVersion, glossaryRelease, glossarySources } from '../src/data/glossary.mjs';
import { articles } from '../src/data/articles.mjs';
import { sources } from '../src/data/sources.mjs';
const translations=JSON.parse(await readFile(new URL('../src/data/translations.json',import.meta.url),'utf8'));
import assert from 'node:assert/strict';
const {assertGlossaryReady}=await import('./lib/glossary.mjs');
assertGlossaryReady(glossary,glossaryRelease,glossarySources);
for(const s of glossarySources){const url=new URL(s.url);assert.equal(url.protocol,'https:');assert(!url.username&&!url.password);assert(s.access&&s.locator&&s.author);}
const ids=new Set(glossary.map(t=>t.id));
assert.equal(ids.size,glossary.length,'Duplicate term ID');
assert.equal(new Set(articles.map(a=>a.id)).size,articles.length,'Duplicate article ID');
const sourceIds=new Set(sources.map(s=>s.id));
assert.equal(sourceIds.size,sources.length,'Duplicate source ID');
assert.equal(new Set(translations.map(t=>t.id)).size,translations.length,'Duplicate translation ID');
for(const t of translations){
  assert(/^[a-z0-9-]+$/.test(t.id));assert(sourceIds.has(t.sourceId),`Missing translation source ${t.id}`);
  assert(t.paragraphs.length && t.paragraphs.every(p=>typeof p==='string'&&/[가-힣]/.test(p)),`Missing Korean translation ${t.id}`);
  assert(/^[a-f0-9]{64}$/.test(t.sourceHash));assert.equal(new URL(t.sourceUrl).protocol,'https:');
  for(const id of t.termIds || [t.id])assert(ids.has(id),`Unknown translation term ${id}`);
  for(const table of t.tables || []){
    assert(table.afterParagraph>=1&&table.afterParagraph<=t.paragraphs.length,`Invisible table in ${t.id}`);
    assert(table.id&&table.caption&&table.note&&table.columns.length&&table.rows.length);
    assert(table.rows.every(row=>row.length===table.columns.length&&row.every(c=>typeof c==='string'&&c.trim())));
  }
  for(const s of t.additionalSources || []){assert.equal(new URL(s.url).protocol,'https:');assert(s.title&&s.locator);}
}
const dir=fileURLToPath(new URL('../data/revisions/',import.meta.url));await mkdir(dir,{recursive:true});
for(const a of articles){
  assert(ids.has(a.id),`Missing term ${a.id}`);assert(a.summary&&a.sections.length&&a.refs.length,`Incomplete article ${a.id}`);
  a.related.forEach(id=>assert(ids.has(id),`Unresolved relation ${a.id} -> ${id}`));
  a.refs.forEach(id=>assert(sourceIds.has(id),`Unresolved source ${id}`));
  a.sections.forEach(s=>{assert(s.title&&s.paragraphs.every(p=>typeof p==='string'&&p.trim()),`Empty section ${a.id}`);});
  const snapshot={...a,sourceSnapshots:a.refs.map(id=>sources.find(s=>s.id===id))};
  const path=`${dir}/${a.id}--${a.revision}.json`;
  try{const previous=JSON.parse(await readFile(path,'utf8'));assert.deepEqual(previous,snapshot,`Fixed edition changed: ${a.id}; update the revision hash`);}
  catch(e){if(e.code!=='ENOENT')throw e;await writeFile(path,JSON.stringify(snapshot,null,2)+'\n',{flag:'wx'});}
}
for(const s of sources){const url=new URL(s.url);assert.equal(url.protocol,'https:');assert(!url.username&&!url.password);}
console.log(`${glossary.length} terms; ${articles.length} articles; ${sources.length} sources; references and fixed editions valid. Glossary ${glossaryVersion}`);
