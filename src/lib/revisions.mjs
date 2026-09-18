import { readdirSync, readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
const path=resolve('data/revisions');
export const revisions=readdirSync(path).filter(n=>n.endsWith('.json')).map(n=>JSON.parse(readFileSync(join(path,n),'utf8')));
