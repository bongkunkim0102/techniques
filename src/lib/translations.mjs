// Compare the volume before the chapter: Book II.1 must not precede Book I.2.
export function compareTranslations(a, b) {
  const volume = (a.series?.id || '').localeCompare(b.series?.id || '', 'en', {numeric: true});
  return volume || (a.series?.order || 0) - (b.series?.order || 0);
}

export function translationVolumes(entries) {
  const groups = new Map();
  for (const entry of [...entries].sort(compareTranslations)) {
    const id = entry.series?.id || 'standalone';
    if (!groups.has(id)) groups.set(id, {id, label: entry.series?.label || '', entries: []});
    groups.get(id).entries.push(entry);
  }
  return [...groups.values()];
}
