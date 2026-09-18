import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import provenance from '../data/reference/ptolemy-book3-completion-2026-09-18.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const book=translations.filter(t=>t.series?.id==='ptolemy-book3').sort((a,b)=>a.series.order-b.series.order);
await mkdir('test-results',{recursive:true});
try {
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('#ptolemy-book3 .source-item').count(),19);
 assert.deepEqual(await page.locator('#ptolemy-book3 .source-item a').evaluateAll(xs=>xs.map(a=>a.getAttribute('href'))),book.map(t=>`/translations/${t.id}/`));
 assert.match(await page.locator('#ptolemy-ashmand1822 > p').textContent(),/네 권 70개 장의 본문 전체/);
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#ptolemy-book3"]').click();
 assert.equal(new URL(page.url()).hash,'#ptolemy-book3');
 await page.screenshot({path:'test-results/book3-toc-desktop.png',fullPage:false});
 for(const [i,t] of book.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);
  assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);
  assert.deepEqual(await page.locator('#translation > p').evaluateAll(ps=>ps.map(p=>p.id)),t.paragraphs.map((_,i)=>`paragraph-${i+1}`));
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);
  assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
  assert.equal(await page.locator('a[rel="prev"]').getAttribute('href'),`/translations/${i?book[i-1].id:'ptolemy-sky-weather-signs'}/`);
  if(i<book.length-1)assert.equal(await page.locator('a[rel="next"]').getAttribute('href'),`/translations/${book[i+1].id}/`);else assert.equal(await page.locator('a[rel="next"]').getAttribute('href'),'/translations/ptolemy-external-fortunes-proem/');
  if(t.contentNotice){assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);assert(await page.locator('[data-translation-notice]').evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('#translation'))&Node.DOCUMENT_POSITION_FOLLOWING)));}
  const c=provenance.chapters.find(c=>c.translationId===t.id),visible=await page.locator('main').textContent();for(const sourceParagraph of c.sourceParagraphs)assert(!visible.includes(sourceParagraph),`Unpublished source text in ${t.id}`);
 }
 await page.goto(origin+'/translations/ptolemy-sky-weather-signs/');await page.locator('a[rel="next"]').click();await page.waitForURL('**/translations/ptolemy-nativities-proem/');
 await page.locator('a[rel="prev"]').click();await page.waitForURL('**/translations/ptolemy-sky-weather-signs/');
 await page.goto(origin+'/translations/ptolemy-prorogation-example/#paragraph-2');
 await page.locator('#paragraph-2').scrollIntoViewIfNeeded();assert.match(await page.locator('#paragraph-2').textContent(),/148은 102보다 46/);
 await page.screenshot({path:'test-results/book3-calculation-desktop.png',fullPage:false});
 await page.goto(origin+'/translations/ptolemy-qualities-of-mind/#paragraph-19');await page.locator('#paragraph-19').scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/book3-mind-lists-desktop.png',fullPage:false});
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('프러로게이션의 계산 예제');
 await page.waitForSelector('.pagefind-ui__result a[href*="/translations/ptolemy-prorogation-example/"]');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});
  for(const path of ['/translations/',...book.map(t=>`/translations/${t.id}/`)]){
   await page.goto(origin+path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px overflow: ${path}`);
  }
 }
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/translations/ptolemy-disorders-of-mind/');
 await page.screenshot({path:'test-results/book3-notice-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/ptolemy-prorogation-example/#paragraph-2');await page.locator('#paragraph-2').scrollIntoViewIfNeeded();
 await page.screenshot({path:'test-results/book3-calculation-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Book III browser checks passed: 19 chapters, 195 exact paragraphs, 152-source-paragraph privacy, sequence, anchors, provenance, notices, search, and 390px/320px layout.');
} finally {await browser.close();}
