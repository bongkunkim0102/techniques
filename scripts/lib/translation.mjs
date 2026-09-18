import {hash} from './io.mjs';
export const promptVersion='techniques-ko-v3';
export function chunkParagraphs(text,max=5000){
  const paragraphs=text.split(/\n\s*\n/).map(s=>s.trim()).filter(Boolean);const chunks=[];let current=[];let size=0;
  for(const paragraph of paragraphs){const parts=paragraph.length>max?paragraph.match(new RegExp(`[\\s\\S]{1,${max}}`,'g')):[paragraph];for(const p of parts){if(size+p.length>max&&current.length){chunks.push(current.join('\n\n'));current=[];size=0;}current.push(p);size+=p.length+2;}}
  if(current.length)chunks.push(current.join('\n\n'));return chunks;
}
export function jobKey(sourceHash,glossaryHash,model,endpoint,referenceHash=''){return hash(JSON.stringify({sourceHash,glossaryHash,model,endpoint,referenceHash,promptVersion}));}
export function retryDelay(header,attempt,now=Date.now()){if(header){const seconds=Number(header);if(Number.isFinite(seconds)&&seconds>=0)return Math.ceil(seconds*1000);const date=Date.parse(header);if(Number.isFinite(date))return Math.max(0,date-now);}return Math.min(60000,2000*2**attempt);}
export function normalizeModel(model){return String(model||'').replace(/^(?:camel\/|openai\/)/g,'').trim();}
export async function parseCompletion(response){
  if(!response.headers.get('content-type')?.includes('text/event-stream')){const j=await response.json();if(j.error)throw new Error(`Provider error: ${j.error.code||'unknown'}`);const choice=j.choices?.[0];if(choice?.finish_reason==='length')throw new Error('Translation truncated');if(choice?.finish_reason!=='stop'||!choice.message?.content)throw new Error('Translation missing final completion');return {text:choice.message.content,model:j.model||null,finishReason:choice.finish_reason,usage:j.usage||null};}
  const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='',text='',model=null,finish=null,doneMarker=false;const MAX=200000;let size=0;
  const processLine=line=>{if(!line.startsWith('data:'))return;const data=line.slice(5).trim();if(data==='[DONE]'){doneMarker=true;return;}if(!data)return;const j=JSON.parse(data);if(j.error)throw new Error(`Provider error: ${j.error.code||'unknown'}`);if(j.model)model=j.model;for(const c of j.choices||[]){if(c.delta?.content)text+=c.delta.content;if(c.finish_reason)finish=c.finish_reason;}};
  try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX)throw new Error('Translation exceeds output limit');buffer+=decoder.decode(value,{stream:true});let i;while((i=buffer.indexOf('\n'))>=0){processLine(buffer.slice(0,i).replace(/\r$/,''));buffer=buffer.slice(i+1);}}buffer+=decoder.decode();if(buffer.trim())processLine(buffer.trim());}finally{await reader.cancel().catch(()=>{});}
  if(!doneMarker||finish!=='stop'||!text.trim())throw new Error(`Incomplete translation stream (${finish||'no finish'})`);return {text,model,finishReason:finish};
}
export function validateTranslation(text){if(typeof text!=='string'||text.trim().length<10||!/[가-힣]/.test(text))throw new Error('Expected Korean translation text');if(/<script|<iframe|```(?:html|javascript)|\bqaml_live_/i.test(text))throw new Error('Unexpected executable or secret-like output');return text.trim();}
