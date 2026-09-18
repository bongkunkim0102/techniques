import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import p4 from '../data/reference/manilius-book4-completion-2026-09-19.json' with {type:'json'};
import p5 from '../data/reference/manilius-book5-opening-2026-09-19.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326',browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const units=[...p4.units,...p5.units].map(u=>translations.find(t=>t.id===u.translationId));await mkdir('test-results',{recursive:true});
try{
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});assert.equal(await page.locator('main .source-item').count(),translations.length);
 for(const [book,count] of [[1,28],[2,36],[3,22],[4,35],[5,12]])assert.equal(await page.locator(`#manilius-book${book} .source-item`).count(),count);
 assert.match(await page.locator('#manilius-breiter1907 > p').textContent(),/제5권 251행 이후/);
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#manilius-book5"]').click();await page.screenshot({path:'test-results/manilius-five-books-toc.png',fullPage:false});
 let sourceCount=0,targetCount=0;
 for(const [i,t] of units.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);
  assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);assert.deepEqual(await page.locator('.verse-locator').allTextContents(),t.paragraphLocators);
  assert.deepEqual(await page.locator('.latin-verse').allTextContents(),t.paragraphLatinVerses.flat().map(v=>v.text));assert.deepEqual(await page.locator('.verse-number').allTextContents(),t.paragraphLatinVerses.flat().map(v=>String(v.number)));
  sourceCount+=await page.locator('.latin-verse').count();targetCount+=t.paragraphs.length;
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);
  assert.equal(await page.locator('a[rel=prev]').getAttribute('href'),`/translations/${i?units[i-1].id:'manilius-iv-568-584'}/`);
  if(i<units.length-1)assert.equal(await page.locator('a[rel=next]').getAttribute('href'),`/translations/${units[i+1].id}/`);else assert.equal(await page.locator('a[rel=next]').count(),0);
 }
 assert.equal(sourceCount,598);assert.equal(targetCount,95);
 await page.goto(origin+'/translations/manilius-iv-568-584/');await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-iv-585-618/');assert.match(await page.locator('.latin-verse').allTextContents().then(x=>x.join(' ')),/\* \* \*/);
 await page.goto(origin+'/translations/manilius-iv-841-865/#paragraph-2');await page.locator('.latin-parallel summary').nth(1).click();
 assert.deepEqual(await page.locator('.suspected-fragment').allTextContents(),['causae quae ecliptica signa','dixere antiqui']);
 const row=page.locator('.latin-parallel li').filter({has:page.locator('.verse-number',{hasText:/^848$/})});assert(await row.locator('.latin-verse').evaluate(el=>getComputedStyle(el).fontStyle==='normal'));
 await page.locator('#paragraph-2').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/manilius-eclipse-fragments-desktop.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-iv-923-935/');await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-v-001-031/');const ids=await page.locator('.verse-number').allTextContents();assert(!ids.some(n=>['6','7','18'].includes(n)));assert.equal(await page.locator('.suspected-interpolation').count(),2);
 await page.goto(origin+'/translations/manilius-v-157-173/');const moved=await page.locator('.verse-number').allTextContents();assert.deepEqual(moved.slice(moved.indexOf('163'),moved.indexOf('163')+6),['163','164','167','165','166','168']);
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('프로키온과 사냥을 돕는 기술');await page.waitForSelector('.pagefind-ui__result a[href*="/translations/manilius-v-197-205/"]');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const t of units){await page.goto(origin+`/translations/${t.id}/`);await page.locator('.latin-parallel summary').first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px ${t.id}`);}}
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/translations/manilius-iv-791-817/#paragraph-2');await page.locator('.latin-parallel summary').nth(1).click();await page.locator('#paragraph-2').evaluate(el=>el.scrollIntoView({block:'start'}));assert.match(await page.locator('#paragraph-2').textContent(),/구절 난문/);await page.screenshot({path:'test-results/manilius-geography-crux-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-v-197-205/#paragraph-1');await page.locator('.latin-parallel summary').first().click();await page.locator('#paragraph-1').evaluate(el=>el.scrollIntoView({block:'start'}));assert.match(await page.locator('#paragraph-1').textContent(),/사냥 자체가 아니라/);await page.screenshot({path:'test-results/manilius-procyon-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-v-234-250/');assert.match(await page.locator('.latin-verse').last().textContent(),/crater umoris amator/);assert.equal(await page.locator('a[rel=next]').count(),0);
 assert.deepEqual(errors,[]);console.log('New continuation passed: 25 units, 598 Latin lines, 95 Korean paragraphs, four-book completion, partial fifth, boundary links, omissions, crux, fragments, search and 390px/320px expanded Latin.');
}finally{await browser.close();}
