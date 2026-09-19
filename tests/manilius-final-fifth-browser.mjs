import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import p from '../data/reference/manilius-book5-completion-2026-09-19.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const added=p.units.map(u=>translations.find(t=>t.id===u.translationId));
await mkdir('test-results',{recursive:true});
try{
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('main .source-item').count(),translations.length);
 assert.equal(await page.locator('#manilius-breiter1907 .source-item').count(),154);
 for(const [v,n] of [[1,28],[2,36],[3,22],[4,35],[5,33]])assert.equal(await page.locator(`#manilius-book${v} .source-item`).count(),n);
 assert.match(await page.locator('#manilius-breiter1907 > p').textContent(),/다섯 권의 현전 인쇄 본문 전체/);
 assert.match(await page.locator('#manilius-breiter1907 > p').textContent(),/결락/);
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#manilius-book5"]').click();
 await page.screenshot({path:'test-results/manilius-five-books-toc.png',fullPage:false});
 let latin=0,korean=0;
 for(const [i,t] of added.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);
  assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);
  assert.deepEqual(await page.locator('.verse-locator').allTextContents(),t.paragraphLocators);
  assert.deepEqual(await page.locator('.latin-verse').allTextContents(),t.paragraphLatinVerses.flat().map(v=>v.text));
  assert.deepEqual(await page.locator('.verse-number').allTextContents(),t.paragraphLatinVerses.flat().map(v=>String(v.number)));
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);
  assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
  assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);
  assert.equal(await page.locator('a[rel=prev]').getAttribute('href'),`/translations/${i?added[i-1].id:'manilius-v-234-250'}/`);
  if(i<added.length-1)assert.equal(await page.locator('a[rel=next]').getAttribute('href'),`/translations/${added[i+1].id}/`);
  else assert.equal(await page.locator('a[rel=next]').count(),0);
  latin+=await page.locator('.latin-verse').count();korean+=t.paragraphs.length;
 }
 assert.equal(latin,493);assert.equal(korean,80);
 await page.goto(origin+'/translations/manilius-v-234-250/');await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-v-251-270/');
 assert.match(await page.locator('h1').textContent(),/아리아드네/);assert(!((await page.locator('.verse-number').allTextContents()).includes('264')));
 await page.locator('.latin-parallel summary').last().click();assert.match(await page.locator('.critical-note').textContent(),/결락/);
 await page.screenshot({path:'test-results/manilius-fifth-crown-desktop.png',fullPage:false});
 for(const [slug,sequence] of [['manilius-v-325-339',['325','339','326']],['manilius-v-505-537',['513','515','514']]]){
  await page.goto(origin+`/translations/${slug}/`);const ids=await page.locator('.verse-number').allTextContents();assert.deepEqual(ids.slice(ids.indexOf(sequence[0]),ids.indexOf(sequence[0])+sequence.length),sequence);
 }
 await page.goto(origin+'/translations/manilius-v-505-537/');const ids=await page.locator('.verse-number').allTextContents();assert.deepEqual(ids.slice(ids.indexOf('528'),ids.indexOf('528')+3),['528','530','529']);
 await page.goto(origin+'/translations/manilius-v-588-612/');await page.locator('.latin-parallel summary').first().click();assert.match(await page.locator('.latin-verse').allTextContents().then(xs=>xs.join(' ')),/†pelagusque/);
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('별의 밝기와 하늘의 공동체');await page.waitForSelector('.pagefind-ui__result a[href*="/translations/manilius-v-711-745/"]');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const t of added){await page.goto(origin+`/translations/${t.id}/`);await page.locator('.latin-parallel summary').first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px: ${t.id}`);}}
 await page.setViewportSize({width:390,height:844});
 await page.goto(origin+'/translations/manilius-v-694-710/#paragraph-3');await page.locator('.latin-parallel summary').last().click();await page.locator('#paragraph-3').evaluate(el=>el.scrollIntoView({block:'start'}));
 assert.match(await page.locator('#paragraph-3').textContent(),/뒤이은 본문 결락/);assert.match(await page.locator('.latin-verse').last().textContent(),/catulosque sagacis/);
 await page.screenshot({path:'test-results/manilius-fifth-lacuna-mobile.png',fullPage:false});
 await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-v-711-745/');assert.match(await page.locator('.latin-verse').first().textContent(),/^tertia Pleiadas/);
 await page.locator('.latin-parallel summary').last().click();await page.locator('#paragraph-5').evaluate(el=>el.scrollIntoView({block:'start'}));
 assert.match(await page.locator('#paragraph-5').textContent(),/타올랐을 것이다/);assert.equal(await page.locator('.verse-number').last().textContent(),'745');assert.equal(await page.locator('a[rel=next]').count(),0);
 await page.screenshot({path:'test-results/manilius-fifth-ending-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Final fifth checked: 21 new units, 493 Latin lines, 80 Korean paragraphs, five-book coverage, provisional reconciliation, moved lines, preserved lacunae, crux, final745, search and 390px/320px expanded Latin.');
}finally{await browser.close();}
