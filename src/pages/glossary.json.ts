import {glossary,glossaryVersion,editorialPolicy,glossaryRelease,glossarySources} from '../data/glossary.mjs';
export function GET(){return new Response(JSON.stringify({version:glossaryVersion,release:glossaryRelease,policy:editorialPolicy,terms:glossary,sources:glossarySources}),{headers:{'Content-Type':'application/json; charset=utf-8'}});}
