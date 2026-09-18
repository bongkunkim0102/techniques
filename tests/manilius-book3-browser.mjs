import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import p from '../data/reference/manilius-book3-completion-2026-09-19.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));
const book=p.units.map(u=>translations.find(t=>t.id===u.translationId));
await mkdir('test-results',{recursive:true});
try{
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});
 assert.equal(await page.locator('main .source-item').count(),translations.length);
 for(const [volume,count] of [[1,28],[2,36],[3,22]])assert.equal(await page.locator(`#manilius-book${volume} .source-item`).count(),count);
 assert.match(await page.locator('#manilius-breiter1907 > p').textContent(),/제4권 585행 이후/);
 assert.match(await page.locator('#manilius-book3 > h3').textContent(),/22개 구간/);
 assert.deepEqual(await page.locator('#manilius-book3 .source-item a').evaluateAll(xs=>xs.map(a=>a.getAttribute('href'))),book.map(t=>`/translations/${t.id}/`));
 await page.locator('nav[aria-label="번역 문헌과 권별 목차"] a[href="#manilius-book3"]').click();
 await page.screenshot({path:'test-results/manilius-book3-toc-desktop.png',fullPage:false});
 let latin=0,korean=0;
 for(const [i,t] of book.entries()){
  const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);
  assert.deepEqual(await page.locator('#translation > p').allTextContents(),t.paragraphs);
  assert.deepEqual(await page.locator('.verse-locator').allTextContents(),t.paragraphLocators);
  assert.deepEqual(await page.locator('.latin-verse').allTextContents(),t.paragraphLatinVerses.flat().map(v=>v.text));
  assert.deepEqual(await page.locator('.verse-number').allTextContents(),t.paragraphLatinVerses.flat().map(v=>String(v.number)));
  latin+=await page.locator('.latin-verse').count();korean+=t.paragraphs.length;
  assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);
  assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
  assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);
  assert.equal(await page.locator('a[rel=prev]').getAttribute('href'),`/translations/${i?book[i-1].id:'manilius-ii-948-970'}/`);
  if(i<book.length-1)assert.equal(await page.locator('a[rel=next]').getAttribute('href'),`/translations/${book[i+1].id}/`);
  else assert.equal(await page.locator('a[rel=next]').getAttribute('href'),'/translations/manilius-iv-001-022/');
 }
 assert.equal(latin,682);assert.equal(korean,107);
 await page.goto(origin+'/translations/manilius-ii-948-970/');await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-iii-001-042/');
 const order=await page.locator('.verse-number').allTextContents();assert.equal(order[order.indexOf('14')-1],'21');assert.equal(order[order.indexOf('14')+1],'22');
 await page.goto(origin+'/translations/manilius-iii-301-322/');await page.locator('a[rel=next]').click();await page.waitForURL('**/translations/manilius-iii-323-355/');
 await page.goto(origin+'/translations/manilius-iii-418-442/');await page.locator('.latin-parallel summary').nth(1).click();
 assert.match(await page.locator('.latin-verse').allTextContents().then(xs=>xs.join(' ')),/sub nomine lucis/);
 assert.match(await page.locator('#translation > p').nth(1).textContent(),/낮이라는/);
 await page.locator('#translation > p').nth(1).evaluate(el=>el.scrollIntoView({block:'start'}));
 await page.screenshot({path:'test-results/manilius-book3-numerical-desktop.png',fullPage:false});
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('스타디아 환산과 저본의 수치상 난점');
 await page.waitForSelector('.pagefind-ui__result a[href*="/translations/manilius-iii-418-442/"]');
 for(const width of [390,320]){await page.setViewportSize({width,height:844});for(const t of book){await page.goto(origin+`/translations/${t.id}/`);await page.locator('.latin-parallel summary').first().click();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px: ${t.id}`);}}
 await page.setViewportSize({width:390,height:844});
 await page.goto(origin+'/translations/manilius-iii-160-202/#paragraph-7');await page.locator('.latin-parallel summary').last().click();await page.locator('#paragraph-7').evaluate(el=>el.scrollIntoView({block:'start'}));
 await page.screenshot({path:'test-results/manilius-book3-fortuna-mobile.png',fullPage:false});
 await page.goto(origin+'/translations/manilius-iii-669-682/#paragraph-3');await page.locator('.latin-parallel summary').last().click();await page.locator('#paragraph-3').evaluate(el=>el.scrollIntoView({block:'start'}));
 assert.match(await page.locator('.latin-verse').last().textContent(),/frenosque dierum/);assert.match(await page.locator('#paragraph-3').textContent(),/열째/);
 await page.screenshot({path:'test-results/manilius-book3-ending-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Book III checks passed: 22 units, 682 Latin verses, 107 Korean paragraphs, recovered-to-new continuation, moved line, numerical notes, three-book navigation, search and 390px/320px expanded Latin.');
}finally{await browser.close();}
