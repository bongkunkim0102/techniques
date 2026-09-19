import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import p from '../data/reference/manilius-book4-opening-2026-09-19.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326',browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const book=p.units.map(u=>translations.find(t=>t.id===u.translationId));await mkdir('test-results',{recursive:true});
try{
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('main .source-item').count(),translations.length);assert.equal(await page.locator('#manilius-breiter1907 .source-item').count(),translations.filter(t=>t.sourceId==='manilius-breiter1907').length);assert.equal(await page.locator('#manilius-book4 .source-item').count(),translations.filter(t=>t.series?.id==='manilius-book4').length);
 assert.match(await page.locator('#manilius-breiter1907 > p').textContent(),/다섯 권의 현전 인쇄 본문 전체/);
 assert.deepEqual(await page.locator('#manilius-book4 .source-item a').evaluateAll(xs=>xs.slice(0,22).map(a=>a.getAttribute('href'))),book.map(t=>`/translations/${t.id}/`));
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#manilius-book4"]').click();await page.screenshot({path:'test-results/manilius-book4-toc-desktop.png',fullPage:false});
 let latin=0,korean=0;
 for(const [i,t] of book.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);
  assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);assert.deepEqual(await page.locator('.verse-locator').allTextContents(),t.paragraphLocators);
  assert.deepEqual(await page.locator('.latin-verse').allTextContents(),t.paragraphLatinVerses.flat().map(v=>v.text));assert.deepEqual(await page.locator('.verse-number').allTextContents(),t.paragraphLatinVerses.flat().map(v=>String(v.number)));
  latin+=await page.locator('.latin-verse').count();korean+=t.paragraphs.length;
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);
  assert.equal(await page.locator('a[rel=prev]').getAttribute('href'),`/translations/${i?book[i-1].id:'manilius-iii-669-682'}/`);
  if(i<book.length-1)assert.equal(await page.locator('a[rel=next]').getAttribute('href'),`/translations/${book[i+1].id}/`);else assert.equal(await page.locator('a[rel=next]').getAttribute('href'),'/translations/manilius-iv-585-618/');
 }
 assert.equal(latin,582);assert.equal(korean,94);
 await page.goto(origin+'/translations/manilius-iii-669-682/');await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-iv-001-022/');
 await page.goto(origin+'/translations/manilius-iv-486-501/');const ids=await page.locator('.verse-number').allTextContents();assert.deepEqual(ids.slice(ids.indexOf('489'),ids.indexOf('489')+6),['489','489b','491','490','492','493']);assert(!ids.includes('500')&&!ids.includes('501'));
 await page.locator('.latin-parallel summary').nth(1).click();assert.match(await page.locator('.critical-note').textContent(),/489b/);await page.screenshot({path:'test-results/manilius-book4-lettered-desktop.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-iv-243-272/');const moved=await page.locator('.verse-number').allTextContents();assert.equal(moved[moved.indexOf('269')-1],'260');assert.equal(moved[moved.indexOf('269')+1],'261');
 await page.goto(origin+'/translations/manilius-iv-338-362/#paragraph-5');await page.locator('.latin-parallel summary').last().click();assert.match(await page.locator('#paragraph-5').textContent(),/남은 것은 스스로/);await page.locator('#paragraph-5').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/manilius-book4-decans-desktop.png',fullPage:false});
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('나머지 도수와 삽입');await page.waitForSelector('.pagefind-ui__result a[href*="/translations/manilius-iv-486-501/"]');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const t of book){await page.goto(origin+`/translations/${t.id}/`);await page.locator('.latin-parallel summary').first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px ${t.id}`);}}
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/translations/manilius-iv-486-501/#paragraph-2');await page.locator('.latin-parallel summary').nth(1).click();await page.locator('#paragraph-2').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/manilius-book4-lettered-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-iv-568-584/#paragraph-4');await page.locator('.latin-parallel summary').last().click();await page.locator('#paragraph-4').evaluate(el=>el.scrollIntoView({block:'start'}));assert.equal(await page.locator('.suspected-interpolation').count(),1);assert.match(await page.locator('.latin-verse').last().textContent(),/materue duorum/);await page.screenshot({path:'test-results/manilius-book4-ending-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Book IV opening checked: 22 units, 582 Latin lines, 94 Korean paragraphs, 489b and both transpositions, exact partial scope, old-book transition, search and expanded Latin at 390px/320px.');
}finally{await browser.close();}
