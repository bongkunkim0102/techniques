import {chromium} from '@playwright/test';import assert from 'node:assert/strict';import {mkdir} from 'node:fs/promises';
import data from '../src/data/editorial/breiter-preface.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326',browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));await mkdir('test-results',{recursive:true});
try{
 await page.goto(origin+'/translations/',{waitUntil:'networkidle'});assert.equal(await page.locator('#manilius-breiter1907 .source-item').count(),154);await page.locator('a[href="/editorial/breiter1907-preface/"]').click();await page.waitForURL('**/editorial/breiter1907-preface/');
 assert.match(await page.locator('h1').textContent(),/편집자 서문/);assert.match(await page.locator('[data-editorial-scope]').textContent(),/Theodor Breiter/);assert.match(await page.locator('[data-editorial-scope]').textContent(),/모든 이문을/);
 assert.deepEqual(await page.locator('.korean-text').allTextContents(),data.sections.filter(s=>s.id!=='corrigenda').flatMap(s=>s.blocks.map(b=>b.ko)));
 assert.equal(await page.locator('.translated-footnote').count(),7);assert.equal(await page.locator('.erratum').count(),7);assert.equal(await page.locator('figure img').count(),7);assert.equal(await page.locator('.sigla-wrap dt').count(),13);
 const symbols=await page.locator('.sigla-wrap dt').allTextContents();for(const s of ['o','ω','(E)','(L)','u₁','u₂','†'])assert(symbols.includes(s));
 await page.locator('#manuscripts .source-reading summary').nth(2).click();assert.match(await page.locator('#manuscripts .source-reading').nth(2).textContent(),/Gotefredo Richtero/);
 assert.match(await page.locator('#manuscripts .korean-text').nth(3).textContent(),/1853/);assert.match(await page.locator('#witnesses .korean-text').first().textContent(),/2r/);
 assert.match(await page.locator('#editorial-provenance').textContent(),/GPT-6 Astra Pro/);
 await page.locator('nav[aria-label="편집자 서문 목차"] a[href="#editorial-method"]').click();await page.screenshot({path:'test-results/breiter-preface-sigla-desktop.png',fullPage:false});
 for(const image of await page.locator('figure img').all()){await image.scrollIntoViewIfNeeded();await image.evaluate(el=>el.decode());assert(await image.evaluate(el=>el.naturalWidth>300));}
 await page.goto(origin+'/topics/manilius-octotropos/');assert.match(await page.locator('h1').textContent(),/옥토토포스/);assert.match(await page.locator('main').textContent(),/octotropos/);
 await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('Breiter 편집자 서문');await page.waitForSelector('.pagefind-ui__result a[href*="/editorial/breiter1907-preface/"]');
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.goto(origin+'/editorial/breiter1907-preface/');
  await page.locator('details').evaluateAll(xs=>xs.forEach(x=>x.open=true));
  for(const id of ['manuscripts','titles','affinity','editorial-method','corrigenda']){await page.locator('#'+id).scrollIntoViewIfNeeded();assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px overflow ${id}`);}
 }
 await page.setViewportSize({width:390,height:844});await page.goto(origin+'/editorial/breiter1907-preface/#corrigenda');await page.locator('#corrigenda').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/breiter-preface-corrigenda-mobile.png',fullPage:false});
 await page.goto(origin+'/editorial/breiter1907-preface/#editorial-method');await page.locator('.sigla-wrap').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:'test-results/breiter-preface-sigla-mobile.png',fullPage:false});
 assert.deepEqual(errors,[]);console.log('Breiter editorial checks passed: 47 prose paragraphs, 7 footnotes, 7 errata, 13 sigla, 7 facsimiles, stable glossary URL, original154 poem units, search and expanded320/390px layouts.');
}finally{await browser.close();}
