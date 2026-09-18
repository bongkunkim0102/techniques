const normalize = text => String(text).normalize('NFKD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC').toLowerCase().replace(/[‐‑–—_-]/g, ' ').replace(/\s+/g, ' ');
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function assertGlossaryReady(terms, release, sources) {
  if (!release?.translationReady || release.status !== 'editorial-baseline' || release.termCount !== terms.length) throw new Error('Translation requires a complete Astra glossary edition');
  const ids = new Set(); const sourceIds = new Set(sources.map(s => s.id));
  for (const t of terms) {
    if (ids.has(t.id) || !t.en?.trim() || !t.ko?.trim() || !t.definition?.trim() || !t.note?.trim() || t.terminologyStatus !== 'reviewed-with-note' || !(release.editors || [release.editor]).includes(t.reviewedBy) || t.version !== release.version || !t.refs?.length || t.refs.some(id => !sourceIds.has(id))) throw new Error(`Glossary not ready: ${t.id}`);
    ids.add(t.id);
  }
}

export function selectGlossaryTerms(text, terms) {
  const body = normalize(text);
  return terms.filter(t => [t.en, t.ko, ...t.aliases].some(name => {
    const key = normalize(name);
    if (key === '日' || key === '月') return body.includes(key);
    if (/\p{Script=Han}|\p{Script=Hangul}|\p{Script=Devanagari}/u.test(key)) return key.length >= 2 && body.includes(key);
    if (key.length < 3 && !/^[a-z]\d$/i.test(key)) return false;
    return new RegExp(`(?<![\\p{L}\\p{N}])${escape(key)}(?![\\p{L}\\p{N}])`, 'u').test(body);
  })).map(({id,en,ko,aliases,definition,note,refs,bucketKo}) => ({id,en,ko,aliases,definition,note,refs,tradition:bucketKo}));
}
