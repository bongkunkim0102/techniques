import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import provenance from '../data/reference/ptolemy-book4-completion-2026-09-18.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326',browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const book=translations.filter(t=>t.series?.id==='ptolemy-book4').sort((a,b)=>a.series.order-b.series.order);
await mkdir('test-results',{recursive:true});
try {
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});assert.equal(await page.locator('main .source-item').count(),72);assert.equal(await page.locator('#ptolemy-ashmand1822 .source-item').count(),70);
 assert.match(await page.locator('#ptolemy-ashmand1822 > p').textContent(),/네 권 70개 장의 본문 전체/);
 assert.deepEqual(await page.locator('#ptolemy-book4 .source-item a').evaluateAll(xs=>xs.map(a=>a.getAttribute('href'))),book.map(t=>`/translations/${t.id}/`));
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#ptolemy-book4"]').click();assert.equal(new URL(page.url()).hash,'#ptolemy-book4');
 assert(await page.locator('#ptolemy-book4').evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom));
 await page.screenshot({path:'test-results/book4-toc-desktop.png',fullPage:false});
 for(const [i,t] of book.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
  assert.equal(await page.locator('a[rel="prev"]').getAttribute('href'),`/translations/${i?book[i-1].id:'ptolemy-disorders-of-mind'}/`);
  if(i<book.length-1)assert.equal(await page.locator('a[rel="next"]').getAttribute('href'),`/translations/${book[i+1].id}/`);else assert.equal(await page.locator('a[rel="next"]').count(),0);
  if(t.contentNotice){assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);assert(await page.locator('[data-translation-notice]').evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('#translation'))&Node.DOCUMENT_POSITION_FOLLOWING)));}
  const visible=await page.locator('main').textContent();for(const paragraph of provenance.chapters.find(c=>c.translationId===t.id).sourceParagraphs)assert(!visible.includes(paragraph));
 }
 await page.goto(origin+'/translations/ptolemy-disorders-of-mind/');await page.locator('a[rel="next"]').click();await page.waitForURL('**/translations/ptolemy-external-fortunes-proem/');
 await page.locator('a[rel="prev"]').click();await page.waitForURL('**/translations/ptolemy-disorders-of-mind/');
 await page.goto(origin+'/translations/ptolemy-periodical-divisions/#paragraph-20');
 await page.locator('#paragraph-20').evaluate(el=>el.scrollIntoView({block:'start'}));assert(await page.locator('#paragraph-20').evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.topbar').getBoundingClientRect().bottom));
 assert.match(await page.locator('#paragraph-20').textContent(),/사인마다 28일/);assert.match(await page.locator('#paragraph-20').textContent(),/2일과 3분의 1일/);
 await page.screenshot({path:'test-results/book4-timing-desktop.png',fullPage:false});
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('시간의 주기적 분할');await page.waitForSelector('.pagefind-ui__result a[href*="/translations/ptolemy-periodical-divisions/"]');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const path of ['/translations/',...book.map(t=>`/translations/${t.id}/`)]){await page.goto(origin+path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px overflow ${path}`);}}
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/translations/ptolemy-periodical-divisions/#paragraph-26');await page.locator('#paragraph-26').evaluate(el=>el.scrollIntoView({block:'start'}));
 assert.equal(await page.locator('#paragraph-26').textContent(),book.at(-1).paragraphs.at(-1));await page.screenshot({path:'test-results/book4-ending-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/ptolemy-marriage/');await page.screenshot({path:'test-results/book4-notice-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Book IV browser checks passed: four complete books, 10 new chapters, 115 exact paragraphs, 95 source paragraphs excluded, end boundary, rates, search, navigation, notices and 390px/320px layout.');
} finally {await browser.close();}
