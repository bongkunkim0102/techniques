import { load } from 'cheerio';import robotsParser from 'robots-parser';
import { sources } from '../src/data/sources.mjs';import { hash,writeJson,readJson,acquireLock } from './lib/io.mjs';import { fetchSource,limitedText,USER_AGENT } from './lib/network.mjs';import {setTimeout as delay} from 'node:timers/promises';
const selected=process.argv.slice(2);if(!selected.length){console.log('Usage: npm run collect -- <source-id> [source-id...] | --licensed');process.exit(0);}
const targets=selected.includes('--licensed')?sources.filter(s=>s.license==='CC BY-NC-SA 4.0'||s.id==='xingming'):selected.map(id=>{const s=sources.find(s=>s.id===id);if(!s)throw new Error(`Unknown source: ${id}`);return s;});
// Full-text jobs start with explicitly licensed sources. Other sources remain searchable bibliography.
if(targets.some(s=>s.license!=='CC BY-NC-SA 4.0'&&s.id!=='xingming'))throw new Error('A source-specific adapter is required for this corpus.');
const unlock=await acquireLock('data/jobs/collection.lock');const hosts=new Set(targets.map(s=>new URL(s.url).hostname));const robotsCache=new Map();let failed=0;
try{for(const source of targets){try{
  const origin=new URL(source.url).origin;let robots=robotsCache.get(origin);
  if(!robots){const {response:r}=await fetchSource(`${origin}/robots.txt`,hosts);let txt='';if(r.status===404)await r.body?.cancel();else if(!r.ok)throw new Error(`robots.txt HTTP ${r.status}`);else txt=await limitedText(r,500000);robots=robotsParser(`${origin}/robots.txt`,txt);robotsCache.set(origin,robots);}
  if(robots.isAllowed(source.url,USER_AGENT)===false)throw new Error('robots.txt disallows this source');
  await delay(Math.max(1200,(robots.getCrawlDelay(USER_AGENT)||0)*1000));
  const {response,url}=await fetchSource(source.url,hosts);if(!response.ok){await response.body?.cancel();throw new Error(`HTTP ${response.status}`);}if(!response.headers.get('content-type')?.includes('text/html'))throw new Error('Expected HTML');
  const html=await limitedText(response);const $=load(html);const isWikisource=source.id==='xingming';const licenseUrl=isWikisource?'https://creativecommons.org/licenses/by-sa/4.0/':'https://creativecommons.org/licenses/by-nc-sa/4.0/';
  if(!$(`a[href*="${isWikisource?'creativecommons.org/licenses/by-sa/4.0':'creativecommons.org/licenses/by-nc-sa/4.0'}"]`).length)throw new Error('Expected source license not present');
  const heading=isWikisource?$('#firstHeading'):$('h3').filter((_,el)=>$(el).text().trim().length>1).first();if(!heading.length)throw new Error('Entry heading missing');
  const entryTitle=heading.text().trim();
  $('script,style,nav,footer,form,.sidebar,.menu').remove();
  let text;
  if(isWikisource){$('.mw-editsection,.navbox,.noprint,.ws-noexport,.header-container,.catlinks,.metadata').remove();text=$('#mw-content-text .mw-parser-output').first().text().trim();}
  else{text=heading.nextUntil('h3').map((_,n)=>$(n).text()).get().join('\n\n');text=text.split(/Request\s*\/\s*correct|©\s*Skyscript|SUPPORT|Support/)[0].trim();}
  // Some entries use a nested article element; never save a page-wide navigation dump.
  if(text.length<50||text.length>30000)throw new Error('Extracted article is unexpectedly short or long');
  const digest=hash(text);const snapshot={sourceId:source.id,url,title:entryTitle,author:source.author,license:isWikisource?'CC BY-SA 4.0':source.license,licenseUrl,collectedAt:new Date().toISOString(),sha256:digest,htmlSha256:hash(html),locator:isWikisource?'Wikisource mw-parser-output; main text and table of contents':'h3 glossary entry; paragraph order preserved',text};
  const path=`data/raw/${source.id}/${digest}.json`;const prior=await readJson(path,null);if(!prior)await writeJson(path,snapshot);await writeJson(`data/raw/${source.id}/latest.json`,{path,sha256:digest});console.log(`${source.id}: ${prior?'unchanged':'collected'} (${text.length} characters)`);
}catch(e){failed++;console.error(`${source.id}: ${e.message}`);await writeJson(`data/jobs/collection-${source.id}.json`,{sourceId:source.id,state:'failed',error:e.message,at:new Date().toISOString()});}}}finally{await unlock();}
if(failed)process.exitCode=1;
