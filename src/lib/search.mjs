export const normalizeQuery = text => String(text).normalize('NFKD').replace(/(\p{Script=Latin})\p{M}+/gu, '$1').normalize('NFC').toLocaleLowerCase().replace(/[\s·・\-–_']/g, '');
export function searchEntries(entries, query, bucket = '', state = '') {
  const q = normalizeQuery(query);
  const stripped = q.replace(/(이란|이랑|에서|으로|이|가|은|는|을|를|의)$/u, '');
  return entries.map(e => {
    if (bucket && e.bucket !== bucket || state === 'article' && !e.hasArticle || state === 'term' && e.status !== 'reviewed-with-note') return null;
    const names = [e.ko, e.en, ...e.aliases].map(normalizeQuery);
    const body = normalizeQuery([e.definition,e.summary,e.note].filter(Boolean).join(' '));
    const score = !q ? 1 : names.some(n => n === q) ? 100 : names.some(n => n.includes(q)) ? 60 : stripped.length >= 2 && names.some(n => n === stripped) ? 50 : body.includes(q) ? 20 : 0;
    return score ? { ...e, score } : null;
  }).filter(Boolean).sort((a,b) => b.score - a.score || a.ko.localeCompare(b.ko, 'ko'));
}
