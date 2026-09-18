import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import provenance from '../data/reference/manilius-book1-completion-2026-09-18.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326',browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));const added=provenance.units.map(u=>translations.find(t=>t.id===u.translationId));
const book=translations.filter(t=>t.series?.id==='manilius-book1').sort((a,b)=>a.series.order-b.series.order);await mkdir('test-results',{recursive:true});
try {
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});assert.equal(await page.locator('#manilius-book1 .source-item').count(),28);assert.equal(await page.locator('main .source-item').count(),translations.length);
 assert.deepEqual(await page.locator('#manilius-book1 .source-item a').evaluateAll(xs=>xs.map(a=>a.getAttribute('href'))),book.map(t=>`/translations/${t.id}/`));assert.match(await page.locator('#manilius-breiter1907 > p').textContent(),/실제 920행/);assert.match(await page.locator('#manilius-breiter1907 > p').textContent(),/제2–5권은 아직/);
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#manilius-book1"]').click();await page.screenshot({path:'test-results/manilius-book1-toc-desktop.png',fullPage:false});
 let latinCount=0,koreanCount=0;
 for(const [i,t] of added.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);assert.deepEqual(await page.locator('.verse-locator').allTextContents(),t.paragraphLocators);
  assert.deepEqual(await page.locator('.latin-verse').allTextContents(),t.paragraphLatinVerses.flat().map(v=>v.text));assert.deepEqual(await page.locator('.verse-number').allTextContents(),t.paragraphLatinVerses.flat().map(v=>String(v.number)));
  latinCount+=await page.locator('.latin-verse').count();koreanCount+=await page.locator('#translation > p').count();
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
  assert.equal(await page.locator('a[rel=prev]').getAttribute('href'),`/translations/${i?added[i-1].id:'manilius-i-236-254'}/`);
  if(i<added.length-1)assert.equal(await page.locator('a[rel=next]').getAttribute('href'),`/translations/${added[i+1].id}/`);else assert.equal(await page.locator('a[rel=next]').count(),0);
 }
 assert.equal(latinCount,668);assert.equal(koreanCount,114);
 await page.goto(origin+'/translations/manilius-i-236-254/');await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-i-255-274/');
 await page.goto(origin+'/translations/manilius-i-346-372/#paragraph-1');await page.locator('.latin-parallel summary').first().click();
 assert.deepEqual(await page.locator('.suspected-fragment').allTextContents(),['quam Perseus armis','eripit et sociat sibi, cui']);assert.equal(await page.locator('.suspected-interpolation').count(),0);
 assert(await page.locator('.suspected-fragment').first().evaluate(el=>getComputedStyle(el).fontStyle==='italic'&&getComputedStyle(el.parentElement).fontStyle==='normal'));
 await page.locator('.suspected-fragment').first().evaluate(el=>el.scrollIntoView({block:'center'}));await page.screenshot({path:'test-results/manilius-book1-partial-italic-desktop.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-i-532-560/');assert.match(await page.locator('#translation > p').last().textContent(),/〔이 뒤 원문 결락〕/);assert.match(await page.locator('.critical-note').textContent(),/560행 뒤/);
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('전쟁의 징조와 평화를 구하는 종결');await page.waitForSelector('.pagefind-ui__result a[href*="/translations/manilius-i-896-926/"]');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const t of added){await page.goto(origin+`/translations/${t.id}/`);await page.locator('.latin-parallel summary').first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px: ${t.id}`);}}
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/translations/manilius-i-532-560/#paragraph-5');await page.locator('.latin-parallel summary').last().click();await page.locator('#paragraph-5').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/manilius-book1-lacuna-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-i-896-926/#paragraph-6');await page.locator('.latin-parallel summary').last().click();await page.locator('#paragraph-6').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/manilius-book1-ending-mobile.png',fullPage:false});assert.match(await page.locator('.latin-verse').last().textContent(),/non quaerat in orbe/);
 assert.deepEqual(errors,[]);console.log('Book I completion browser checks passed: 28-unit book, 20 new units, 668 Latin verses, 114 Korean paragraphs, partial italics, lacuna, transitions, final line, search, 390px/320px expanded-source layout.');
}finally{await browser.close();}
