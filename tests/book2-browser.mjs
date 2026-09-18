import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import provenance from '../data/reference/ptolemy-book2-completion-2026-09-18.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const added=provenance.chapters.map(c=>translations.find(t=>t.id===c.translationId));
const book=translations.filter(t=>t.series?.id==='ptolemy-book2').sort((a,b)=>a.series.order-b.series.order);
await mkdir('test-results',{recursive:true});
try {
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#ptolemy-book2 .source-item').count(),14);
 assert.deepEqual(await page.locator('#ptolemy-book2 .source-item a').evaluateAll(xs=>xs.map(a=>a.getAttribute('href'))),book.map(t=>`/translations/${t.id}/`));
 for(const t of added){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);
  assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);
  assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
  const index=book.findIndex(x=>x.id===t.id);assert.equal(await page.locator('a[rel="prev"]').getAttribute('href'),`/translations/${book[index-1].id}/`);
  if(index<book.length-1)assert.equal(await page.locator('a[rel="next"]').getAttribute('href'),`/translations/${book[index+1].id}/`);else assert.equal(await page.locator('a[rel="next"]').count(),0);
  if(t.contentNotice)assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);
 }
 await page.goto(origin+'/translations/ptolemy-regional-triplicities/');
 const table=added[0].tables[0];assert.deepEqual(await page.locator('#ptolemy-regional-signs-table tbody tr').evaluateAll(rows=>rows.map(row=>[...row.children].map(cell=>cell.textContent))),table.rows);
 assert.equal(await page.locator('#paragraph-36').evaluate(el=>el.nextElementSibling.tagName),'FIGURE');
 await page.locator('.translation-table-figure').screenshot({path:'test-results/book2-geography-desktop.png'});
 await page.goto(origin+'/translations/ptolemy-climates-peoples/');await page.locator('a[rel="next"]').click();await page.waitForURL('**/translations/ptolemy-regional-triplicities/');
 await page.goto(origin+'/translations/ptolemy-weather-judgment/');await page.locator('a[rel="next"]').click();await page.waitForURL('**/translations/ptolemy-sky-weather-signs/');
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('막아 대비하기가 가장 어려운');
 await page.waitForSelector('.pagefind-ui__result a[href*="/translations/ptolemy-eclipse-effects/"]');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  for(const t of added){await page.goto(origin+`/translations/${t.id}/`);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px overflow: ${t.id}`);}
 }
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/translations/ptolemy-regional-triplicities/');
 const scroll=page.locator('.translation-table-scroll');await scroll.scrollIntoViewIfNeeded();
 assert(await scroll.evaluate(el=>el.scrollWidth>el.clientWidth));await scroll.evaluate(el=>{el.scrollLeft=el.scrollWidth;});assert(await scroll.evaluate(el=>el.scrollLeft>0));
 await page.screenshot({path:'test-results/book2-geography-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/ptolemy-eclipse-effects/');await page.screenshot({path:'test-results/book2-effects-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Book II browser checks passed: 12 complete chapters, 14-chapter sequence, 12-row table, source/model disclosure, search, notices, 390px/320px layout and scrollable table.');
} finally {await browser.close();}
