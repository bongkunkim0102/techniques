import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, rename, open, unlink } from 'node:fs/promises';
import { dirname } from 'node:path';
export const hash = text => createHash('sha256').update(text).digest('hex');
export async function readJson(path, fallback) { try { return JSON.parse(await readFile(path,'utf8')); } catch(e) {if(e.code==='ENOENT'&&fallback!==undefined)return fallback;throw e;} }
export async function writeJson(path, data) {await mkdir(dirname(path),{recursive:true});const tmp=`${path}.${process.pid}.tmp`;await writeFile(tmp,JSON.stringify(data,null,2)+'\n');await rename(tmp,path);}
export async function acquireLock(path){
  await mkdir(dirname(path),{recursive:true});
  for(let attempt=0;attempt<2;attempt++){
    try {const handle=await open(path,'wx');await handle.writeFile(String(process.pid));await handle.close();return async()=>{await unlink(path);};}
    catch(e){if(e.code!=='EEXIST')throw e;const pid=Number(await readFile(path,'utf8'));if(!Number.isInteger(pid)||pid<=0)throw new Error('Invalid lock: inspect it before removing');let alive=true;try{process.kill(pid,0);}catch(err){if(err.code==='ESRCH')alive=false;}if(alive)throw new Error(`Another worker is running (PID ${pid})`);await unlink(path);}
  }throw new Error('Could not acquire worker lock');
}
