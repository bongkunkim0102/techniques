import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import provenance from '../data/reference/manilius-book1-opening-2026-09-18.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326',browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const units=provenance.units.map(u=>translations.find(t=>t.id===u.translationId));await mkdir('test-results',{recursive:true});
try {
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});assert.equal(await page.locator('main .source-item').count(),translations.length);assert.equal(await page.locator('#manilius-breiter1907 .source-item').count(),8);assert.equal(await page.locator('#ptolemy-ashmand1822 .source-item').count(),70);
 assert.deepEqual(await page.locator('#manilius-book1 .source-item a').evaluateAll(xs=>xs.map(a=>a.getAttribute('href'))),units.map(t=>`/translations/${t.id}/`));
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#manilius-book1"]').click();await page.screenshot({path:'test-results/manilius-toc-desktop.png',fullPage:false});
 let total=0;
 for(const [i,t] of units.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);assert.deepEqual(await page.locator('.verse-locator').allTextContents(),t.paragraphLocators);
  assert.equal(await page.locator('.latin-parallel').count(),t.paragraphs.length);assert.deepEqual(await page.locator('.latin-verse').allTextContents(),t.paragraphLatinVerses.flat().map(v=>v.text));total+=await page.locator('.latin-verse').count();
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
  if(i)assert.equal(await page.locator('a[rel=prev]').getAttribute('href'),`/translations/${units[i-1].id}/`);else assert.equal(await page.locator('a[rel=prev]').count(),0);
  if(i<units.length-1)assert.equal(await page.locator('a[rel=next]').getAttribute('href'),`/translations/${units[i+1].id}/`);else assert.equal(await page.locator('a[rel=next]').count(),0);
 }
 assert.equal(total,252);
 await page.goto(origin+'/translations/manilius-i-001-024/#paragraph-4');await page.locator('.latin-parallel').nth(3).locator('summary').click();await page.locator('#paragraph-4').evaluate(el=>el.scrollIntoView({block:'start'}));assert.match(await page.locator('.latin-parallel').nth(3).textContent(),/Phoebo/);await page.screenshot({path:'test-results/manilius-latin-desktop.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-i-025-065/');assert.match(await page.locator('.verse-locator').nth(1).textContent(),/28–29, 32/);assert.equal(await page.locator('.suspected-interpolation').count(),1);
 await page.goto(origin+'/translations/manilius-i-202-235/');assert.equal(await page.locator('.suspected-interpolation').count(),4);assert.match(await page.locator('.latin-verse').allTextContents().then(xs=>xs.join(' ')),/†Niliacas/);
 await page.goto(origin+'/topics/manilius-athla/');assert.match(await page.locator('main').textContent(),/열두/);assert.match(await page.locator('main').textContent(),/포르투나/);
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('시와 천문술의 두 제단');await page.waitForSelector('.pagefind-ui__result a[href*="/translations/manilius-i-001-024/"]');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const t of units){await page.goto(origin+`/translations/${t.id}/`);await page.locator('.latin-parallel summary').first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px: ${t.id}`);}}
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/translations/manilius-i-001-024/#paragraph-4');await page.locator('.latin-parallel summary').nth(3).click();await page.locator('#paragraph-4').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/manilius-latin-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-i-202-235/');await page.locator('.latin-parallel summary').nth(3).click();await page.locator('.critical-note').nth(1).evaluate(el=>el.scrollIntoView({block:'center'}));await page.screenshot({path:'test-results/manilius-crux-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Manilius browser checks passed: 8 units, 44 Korean paragraphs, 252 Latin verses, edition marks, separate series, glossary, search, 390px/320px expanded-source layout.');
}finally{await browser.close();}
