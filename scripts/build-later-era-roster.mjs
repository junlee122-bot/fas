import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'src', 'wikidataLaterEraFigures.generated.ts');
const endpoint = 'https://query.wikidata.org/sparql';
const figuresPerNation = 40;

const nationQueries = [
  ['britain', ['Q145']],
  ['usa', ['Q30']],
  ['ussr', ['Q15180']],
  ['germany', ['Q183']],
  ['japan', ['Q17']],
  ['china', ['Q148', 'Q13426199']],
  ['india', ['Q668']],
  ['freefrance', ['Q142']],
  ['italy', ['Q38']],
  ['korea', ['Q884', 'Q423', 'Q18097', 'Q28233']],
  ['vietnam', ['Q881', 'Q43467']],
  ['indonesia', ['Q252']],
  ['philippines', ['Q928']],
];

const disciplineRules = [
  ['military', /military|general|admiral|officer|soldier|군인|장군|제독|장교|사령관/i],
  ['intelligence', /spy|intelligence|crypt|resistance|partisan|espionage|스파이|정보|암호|저항|독립운동/i],
  ['medicine', /physician|doctor|surgeon|nurse|medical|pharmac|biologist|의사|의학|간호|약학|생물학/i],
  ['engineering', /engineer|inventor|architect|aviation|chemist|physicist|mathematic|computer scientist|공학|발명|건축|화학|물리|수학|컴퓨터/i],
  ['science', /scientist|researcher|astronom|geolog|botan|zoolog|academic|professor|과학|연구|천문|지질|생물|학자|교수/i],
  ['economics', /economist|banker|accountant|finance|경제|은행|회계|금융/i],
  ['industry', /business|entrepreneur|industrial|manufacturer|businessperson|기업|사업|산업|제조/i],
  ['diplomacy', /diplomat|ambassador|foreign minister|외교|대사|외무/i],
  ['social-science', /politician|lawyer|judge|civil servant|journalist|writer|teacher|activist|historian|sociolog|artist|actor|composer|athlete|정치|법률|판사|공무원|언론|작가|교사|운동가|역사|사회|예술|배우|작곡|선수/i],
];

function personQuery(nationIds) {
  return `SELECT DISTINCT ?person ?personLabel ?birth ?sitelinks WHERE {
  VALUES ?country { ${nationIds.map((id) => `wd:${id}`).join(' ')} }
  ?person wdt:P31 wd:Q5; wdt:P27 ?country; wdt:P569 ?birth; wikibase:sitelinks ?sitelinks.
  FILTER(?birth >= "1925-01-01T00:00:00Z"^^xsd:dateTime && ?birth < "1985-01-01T00:00:00Z"^^xsd:dateTime)
  FILTER(?sitelinks >= 20)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
}
ORDER BY DESC(?sitelinks)
LIMIT 100`;
}

async function requestJson(query, label, timeout = 90000) {
  const url = `${endpoint}?query=${encodeURIComponent(query)}&format=json`;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'IronDominionLaterEraRoster/1.0 (https://github.com/junlee122-bot/fas)' },
        signal: AbortSignal.timeout(timeout),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      process.stdout.write(`${label}: retry ${attempt}/4\n`);
      await new Promise((resolve) => setTimeout(resolve, attempt * attempt * 2200));
    }
  }
  throw lastError;
}

function classify(occupations) {
  const text = occupations.join(' · ');
  return disciplineRules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'social-science';
}

function normalizePeople(nationId, rows) {
  const people = new Map();
  rows.forEach((row) => {
    const qid = row.person?.value?.match(/Q\d+$/)?.[0];
    const name = row.personLabel?.value?.trim();
    const birthYear = Number(row.birth?.value?.match(/^(\d{4})/)?.[1]);
    const sitelinks = Number(row.sitelinks?.value ?? 0);
    if (!qid || !name || name === qid || !birthYear || !sitelinks) return;
    const current = people.get(qid);
    if (!current || sitelinks > current.sitelinks) people.set(qid, { qid, nationId, name, birthYear, sitelinks });
  });
  return [...people.values()].sort((left, right) => right.sitelinks - left.sitelinks || left.birthYear - right.birthYear || left.name.localeCompare(right.name, 'ko'));
}

async function enrichOccupations(people, nationId) {
  const query = `SELECT ?person (GROUP_CONCAT(DISTINCT ?occupationLabel; separator="|||") AS ?occupations) WHERE {
  VALUES ?person { ${people.map((person) => `wd:${person.qid}`).join(' ')} }
  OPTIONAL { ?person wdt:P106 ?occupation. }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "ko,en".
    ?occupation rdfs:label ?occupationLabel.
  }
}
GROUP BY ?person`;
  const payload = await requestJson(query, `${nationId} occupations`);
  const occupationByQid = new Map(payload.results.bindings.map((row) => [
    row.person?.value?.match(/Q\d+$/)?.[0],
    (row.occupations?.value ?? '').split('|||').map((value) => value.trim()).filter(Boolean),
  ]));
  return people.map((person) => {
    const occupations = (occupationByQid.get(person.qid) ?? []).sort((a, b) => a.localeCompare(b, 'ko')).slice(0, 4);
    return { ...person, occupations, discipline: classify(occupations) };
  });
}

function quote(value) {
  return JSON.stringify(value).replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

const rosters = [];
for (const [nationId, wikidataIds] of nationQueries) {
  const payload = await requestJson(personQuery(wikidataIds), nationId);
  const people = normalizePeople(nationId, payload.results.bindings);
  process.stdout.write(`${nationId}: received ${people.length} notable people\n`);
  const enriched = await enrichOccupations(people, nationId);
  const roster = enriched.filter((person) => person.occupations.length > 0).slice(0, figuresPerNation);
  if (roster.length < figuresPerNation) throw new Error(`${nationId}: only ${roster.length} people with a public occupation record`);
  process.stdout.write(`${nationId}: selected ${roster.length} later-era figures\n`);
  rosters.push(...roster);
}

const lines = rosters.map((person) => `  [${quote(person.qid)}, ${quote(person.nationId)}, ${quote(person.name)}, ${person.birthYear}, ${quote(person.occupations.join(' · '))}, ${quote(person.discipline)}, ${person.sitelinks}],`);
const generated = `/* eslint-disable */
// Generated from Wikidata structured data (CC0) by scripts/build-later-era-roster.mjs.
// Identity, citizenship, birth year and public occupation are source-linked by QID.
// Sitelink count is used only to select a compact, broadly recognizable offline roster.
import type { NationId, PersonnelDiscipline } from './types';

export type WikidataLaterEraFigureSeed = readonly [
  qid: string,
  nationId: NationId,
  name: string,
  birthYear: number,
  occupation: string,
  discipline: PersonnelDiscipline,
  sitelinks: number,
];

export const wikidataLaterEraFigureSeeds: readonly WikidataLaterEraFigureSeed[] = [
${lines.join('\n')}
];
`;

await writeFile(outputPath, generated, 'utf8');
process.stdout.write(`Wrote ${rosters.length} later-era real-person records to ${outputPath}\n`);
