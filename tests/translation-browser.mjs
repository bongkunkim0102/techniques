import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {mkdir} from 'node:fs/promises';
import translations from '../src/data/translations.json' with {type:'json'};
import provenance from '../data/reference/ptolemy-continuation-2026-09-18.json' with {type:'json'};
const origin=process.env.TEST_ORIGIN||'http://127.0.0.1:4326';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',error=>errors.push(error.message));
const added=provenance.chapters.map(c=>translations.find(t=>t.id===c.translationId));
await mkdir('test-results',{recursive:true});
try {
  await page.goto(origin+'/translations/',{waitUntil:'networkidle'});
  for(const [volume,count] of [['ptolemy-book1',27],['ptolemy-book2',14]]){
    const actual=await page.locator(`#${volume} .source-item a`).evaluateAll(links=>links.map(a=>a.getAttribute('href')));
    const expected=translations.filter(t=>t.series?.id===volume).sort((a,b)=>a.series.order-b.series.order).map(t=>`/translations/${t.id}/`);
    assert.equal(actual.length,count);assert.deepEqual(actual,expected);
    await page.locator(`nav[aria-label="번역 문헌과 권별 목차"] a[href="#${volume}"]`).click();assert.equal(new URL(page.url()).hash,`#${volume}`);
  }
  for(const t of added){
    const response=await page.goto(origin+`/translations/${t.id}/`);assert.equal(response.status(),200);
    assert.equal(await page.locator('#translation p').count(),t.paragraphs.length);
    assert.equal(await page.locator('#translation p').last().textContent(),t.paragraphs.at(-1));
    assert.equal(await page.locator('#references a').first().getAttribute('href'),t.sourceUrl);
    assert.match(await page.locator('#references details').textContent(),/GPT-6 Astra Pro/);
    if(t.contentNotice){assert.equal(await page.locator('[data-translation-notice] p').textContent(),t.contentNotice);assert(await page.locator('[data-translation-notice]').evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('#translation'))&Node.DOCUMENT_POSITION_FOLLOWING)));}
  }
  await page.goto(origin+'/translations/ptolemy-proem/');assert.equal(await page.locator('a[rel="prev"]').count(),0);
  await page.goto(origin+'/translations/ptolemy-prescience-usefulness/');await page.locator('a[rel="next"]').click();await page.waitForURL('**/translations/ptolemy-planetary-qualities/');
  await page.goto(origin+'/translations/ptolemy-application-separation/');await page.locator('a[rel="next"]').click();await page.waitForURL('**/translations/ptolemy-universal-particular/');
  await page.locator('a[rel="prev"]').click();await page.waitForURL('**/translations/ptolemy-application-separation/');
  await page.goto(origin+'/translations/ptolemy-climates-peoples/');assert.equal(await page.locator('a[rel="next"]').getAttribute('href'),'/translations/ptolemy-regional-triplicities/');
  await page.screenshot({path:'test-results/translation-continuation-desktop.png',fullPage:false});
  await page.goto(origin+'/search/');await page.locator('#fulltext-search input').fill('예지가 유용한 까닭');
  await page.waitForSelector('.pagefind-ui__result a[href*="/translations/ptolemy-prescience-usefulness/"]');
  await page.setViewportSize({width:390,height:844});
  for(const path of ['/translations/',...added.map(t=>`/translations/${t.id}/`)]){
    await page.goto(origin+path);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`overflow at ${path}`);
  }
  await page.screenshot({path:'test-results/translation-continuation-mobile.png',fullPage:false});
  assert.deepEqual(errors,[]);console.log('Translation browser checks passed: volume order, five complete chapters, source/editor disclosure, contextual notices, cross-volume navigation, search, and mobile layout.');
} finally {await browser.close();}
