import test from 'node:test';
import assert from 'node:assert/strict';
import seed from '../planning/horarytalk-techniques-plan/topic_seeds.json' with { type: 'json' };
import { glossary, glossaryRelease, glossarySources } from '../src/data/glossary.mjs';
import { assertGlossaryReady, selectGlossaryTerms } from '../scripts/lib/glossary.mjs';
import { searchEntries } from '../src/lib/search.mjs';

test('every seed and added term has a definition, translation decision and resolvable references', () => {
  assertGlossaryReady(glossary, glossaryRelease, glossarySources);
  for (const t of seed.topics) assert(glossary.some(g=>g.id===t.id.replace('candidate:','')));
  assert.equal(glossary.filter(t=>t.id.startsWith('nakshatra-') && t.bucket==='lunar-names').length,27);
  assert.equal(glossary.filter(t=>t.id.startsWith('lodge-')).length,28);
});
test('translation stops before API calls if an edition contains an incomplete or provisional term', () => {
  for (const change of [{definition:''},{note:''},{refs:['missing-source']},{terminologyStatus:'provisional-label'},{version:'old'}]) {
    assert.throws(()=>assertGlossaryReady([{...glossary[0],...change},...glossary.slice(1)],glossaryRelease,glossarySources),/Glossary not ready/);
  }
  assert.throws(()=>assertGlossaryReady(glossary,{...glossaryRelease,translationReady:false},glossarySources),/Astra glossary/);
});
test('translation matches Chinese, Korean, Sanskrit aliases and Latin word boundaries', () => {
  const ids=text=>selectGlossaryTerms(text,glossary).map(t=>t.id);
  assert(ids('七政四餘의 星命溯源').includes('qizheng-siyu'));
  assert(ids('日月同宮').includes('sun'));assert(ids('日月同宮').includes('moon'));
  assert(ids('나밤샤와 navāṃśa, Sūrya and अश्विनी').includes('navamsa-d9'));
  assert(ids('나밤샤와 navāṃśa, Sūrya and अश्विनी').includes('sun'));
  assert(ids('나밤샤와 navāṃśa, Sūrya and अश्विनी').includes('nakshatra-ashwini'));
  assert(!ids('अश्विन').includes('nakshatra-ashwini'));
  assert(!ids('Sunday oppositionally').includes('sun'));
  assert(!ids('Sunday oppositionally').includes('opposition'));
  assert(ids('The Sun is opposite the Moon.').includes('sun'));
  const ambiguous=ids('Kronos'); assert(ambiguous.includes('saturn')); assert(ambiguous.includes('witte-hypothetical-points'));
});
test('diacritics search and same-pronunciation lunar lodges retain distinct identities', () => {
  assert.equal(searchEntries(glossary,'Śatabhiṣaj')[0].id,'nakshatra-shatabhisha');
  assert.equal(searchEntries(glossary,'Satabhisaj')[0].id,'nakshatra-shatabhisha');
  const results=searchEntries(glossary,'위수');
  assert(results.some(t=>t.id==='lodge-wei-rooftop')); assert(results.some(t=>t.id==='lodge-wei-stomach'));
  assert.equal(searchEntries(glossary,'危宿')[0].id,'lodge-wei-rooftop');
  assert.equal(searchEntries(glossary,'루수')[0].ko,'누수 (婁宿)');assert.equal(searchEntries(glossary,'류수')[0].ko,'유수 (柳宿)');
});
