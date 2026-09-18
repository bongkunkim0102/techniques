import seed from '../../planning/horarytalk-techniques-plan/topic_seeds.json' with { type: 'json' };
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { canonicalReference, terminologySources } from './terminology-sources.mjs';
import { lunarNameTerms } from './lunar-names.mjs';
export const glossaryVersion = '2026-09-18.3';
export const editorialPolicy = {
  editor: 'Codex (Astra)',
  method: '등록 용어의 한국어 표기·정의·번역 주의점을 Astra가 직접 편집한 번역 기준판입니다. 출처는 본문·발췌·목차·서지의 확인 범위를 구별합니다. 학계 공인 표준, 모든 원전의 교감 완료, 전 세계 용어의 영구적인 완결을 뜻하지 않습니다.',
  rules: [
    '용어집은 문맥을 판단하는 기준이다. 일반어·인명·역일의 동형어를 기계적으로 치환하지 않는다. 한문 日·月은 천체와 날짜 단위를 문맥으로 구별한다.',
    '첫 등장에는 한국어 권장어와 원어를 함께 쓴다. 한국어 정착어가 불확실하면 음역을 유지한다.',
    'sign은 사인(황도궁), constellation은 별자리로 구별한다. house와 sign을 같은 말로 번역하지 않는다.',
    'direction은 문맥에 따라 디렉션 또는 방향이다. progression은 프로그레션으로 구별한다.',
    'reception의 주체와 객체를 보존한다. 호감이라는 해석은 저자와 적용 분야를 명시한다.',
    'lot은 랏, part는 문헌 명칭에 따라 파트로 쓴다. 실제 천체와 계산점을 구별한다.',
    '주야 공식, 부정문, 순행·역행, 접근·분리, 도·분·초와 시간 단위를 보존한다.',
    'mundane은 세계 사건을 다루는 문데인과 일주운동 기반 좌표의 문데인을 구별한다.',
    '번역되지 않은 원문 문장은 공개 본문에 싣지 않는다. 제목·인명·용어·서지는 원어 병기를 허용한다.',
  ],
};


const rows = new Map();
const directory = resolve('src/data/terminology');
for (const file of readdirSync(directory).filter(f => f.endsWith('.tsv')).sort()) {
  const [header, ...lines] = readFileSync(resolve(directory, file), 'utf8').trim().split(/\r?\n/);
  const keys = header.split('|');
  for (const line of lines.filter(Boolean)) {
    const values = line.split('|');
    if (values.length !== keys.length) throw new Error(`Invalid glossary row in ${file}: ${values[0]}`);
    const row = Object.fromEntries(keys.map((key, i) => [key, values[i]]));
    if (rows.has(row.id)) throw new Error(`Duplicate glossary row: ${row.id}`);
    row.aliases = row.aliases.split(';').filter(Boolean);
    row.refs = row.refs.split(';').filter(Boolean);
    rows.set(row.id, row);
  }
}
const complete = t => {
  if (!t.ko || !t.en || !t.definition || !t.note || !t.refs?.length) throw new Error(`Incomplete glossary term: ${t.id}`);
  const refs = [...new Set(t.refs.map(id => {
    const canonical = canonicalReference(id);
    if (!canonical) throw new Error(`Missing glossary source: ${id} in ${t.id}`);
    return canonical;
  }))];
  return { ...t, aliases: [...new Set(t.aliases)], refs, terminologyStatus: 'reviewed-with-note', reviewedBy: editorialPolicy.editor, reviewScope: '한국어 표기·정의·번역 주의점 직접 편집; 출처별 확인 범위는 참고 문헌에 표시', version: glossaryVersion };
};
const original = seed.topics.map(t => {
  const id = t.id.replace('candidate:', ''); const row = rows.get(id);
  if (!row) throw new Error(`Missing seed definition: ${id}`);
  rows.delete(id);
  return complete({ ...row, en: t.title_original_or_en, bucket: t.discovery_bucket, bucketKo: t.discovery_bucket_ko });
});
export const glossary = [...original, ...[...rows.values()].map(t => complete({ ...t, bucket: 'core-terms', bucketKo: '기본 천체·사인·번역 어휘' })), ...lunarNameTerms.map(complete)];
if (new Set(glossary.map(t => t.id)).size !== glossary.length) throw new Error('Duplicate glossary ID');
export const term = id => glossary.find(t => t.id === id);
export const categories = [...new Map(glossary.map(t => [t.bucket, { id: t.bucket, name: t.bucketKo }])).values()];
export const glossarySources = terminologySources.filter(s => glossary.some(t => t.refs.includes(s.id)));
export const glossaryRelease = {
  version: glossaryVersion, status: 'editorial-baseline', translationReady: true,
  editor: editorialPolicy.editor, seedCount: seed.topics.length, termCount: glossary.length,
  scope: '초기 수집 목록 전 항목 + 기초 번역 어휘 + 27낙샤트라·28수 명칭 + 프톨레마이오스 문헌의 구별 용어',
  limitation: '이 판에 등록한 항목의 번역 기준을 완성했습니다. 새로운 원문에서 미등록 용어·다른 정의가 나오면 Astra 검토 후 판을 갱신합니다. 목록·서지만 확인한 출처는 원전 검증 완료로 취급하지 않습니다.',
};
