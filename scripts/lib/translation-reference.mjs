// Examples preserve the vocabulary of a particular edition, never universal rules.
export function selectReferenceExamples(text, terms, examples, max = 4, maxChars = 9000) {
  const han = (text.match(/\p{Script=Han}/gu) || []).length;
  const latin = (text.match(/[a-z]/gi) || []).length;
  const language = han > latin ? 'lzh' : 'en';
  const ids = new Set(terms.map(t => t.id));
  const ranked = examples.filter(e => e.language === language)
    .map(e => ({e, score: e.termIds.filter(id => ids.has(id)).length}))
    .filter(({score}) => score > 0)
    .sort((a,b) => b.score - a.score || Number(Boolean(b.e.sourceText))-Number(Boolean(a.e.sourceText)) || a.e.id.localeCompare(b.e.id));
  const selected = []; const documents = new Set(); let size = 0;
  for (const {e} of ranked) {
    if(documents.has(e.translationId))continue;
    const chars = JSON.stringify(e).length;
    if (size + chars > maxChars) continue;
    selected.push(e); documents.add(e.translationId); size += chars;
    if (selected.length >= max) break;
  }
  return selected;
}
