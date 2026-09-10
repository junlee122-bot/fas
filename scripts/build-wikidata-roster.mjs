import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'src', 'wikidataHistoricalFigures.generated.ts');
const endpoint = 'https://query.wikidata.org/sparql';
const minimumPerNation = 220;

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
  ['intelligence', /spy|intelligence|crypt|resistance|partisan|espionage|스파이|정보|암호|레지스탕스|독립운동/i],
  ['medicine', /physician|doctor|surgeon|nurse|medical|pharmac|biologist|의사|의학|간호|약학|생물학/i],
  ['engineering', /engineer|inventor|architect|aviation|chemist|physicist|mathematic|공학|발명|건축|화학|물리|수학/i],
  ['science', /scientist|researcher|astronom|geolog|botan|zoolog|academic|professor|과학|연구|천문|지질|식물|동물|교수/i],
  ['economics', /economist|banker|accountant|finance|경제|은행|회계|금융/i],
  ['industry', /business|entrepreneur|industrial|manufacturer|businessperson|기업|사업|산업|제조/i],
  ['diplomacy', /diplomat|ambassador|foreign minister|외교|대사|외무/i],
  ['social-science', /politician|lawyer|judge|civil servant|journalist|writer|teacher|activist|historian|sociolog|artist|actor|composer|정치|법률|판사|공무원|언론|작가|교사|운동가|역사|사회|예술|배우|작곡/i],
];

const priorityRules = [
  /military|general|admiral|officer|scientist|engineer|physician|doctor|economist|diplomat|politician|lawyer|judge|civil servant|professor|researcher|군인|장군|제독|과학|공학|의사|경제|외교|정치|법률|판사|공무원|교수|연구/i,
  /journalist|writer|teacher|activist|historian|business|inventor|architect|언론|작가|교사|운동가|역사|기업|발명|건축/i,
];

function sparql(nationIds) {
  return `SELECT DISTINCT ?person ?personLabel ?birth ?death WHERE {
  VALUES ?country { ${nationIds.map((id) => `wd:${id}`).join(' ')} }
  ?person wdt:P31 wd:Q5; wdt:P27 ?country; wdt:P569 ?birth.
  FILTER(?birth >= "1850-01-01T00:00:00Z"^^xsd:dateTime && ?birth < "1925-01-01T00:00:00Z"^^xsd:dateTime)
  OPTIONAL { ?person wdt:P570 ?death. }
  FILTER(!BOUND(?death) || ?death >= "1942-10-25T00:00:00Z"^^xsd:dateTime)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "ko,en". }
}
LIMIT 320`;
}

async function requestRows(nationId, wikidataIds) {
  const url = `${endpoint}?query=${encodeURIComponent(sparql(wikidataIds))}&format=json`;
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'IronDominionHistoricalRoster/1.0 (offline game data build)' },
        signal: AbortSignal.timeout(60000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const payload = await response.json();
      process.stdout.write(`${nationId}: received ${payload.results.bindings.length} sourced rows\n`);
      return payload.results.bindings;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1800));
    }
  }
  throw lastError;
}

function deathBeforeCampaign(value) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  return value.slice(0, 10) < '1942-10-25';
}

function classify(occupations) {
  const text = occupations.join(' · ');
  return disciplineRules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'social-science';
}

function priority(occupations) {
  const text = occupations.join(' · ');
  const tier = priorityRules.findIndex((pattern) => pattern.test(text));
  return tier < 0 ? 2 : tier;
}

function normalizeRows(nationId, rows) {
  const people = new Map();
  rows.forEach((row) => {
    const qid = row.person?.value?.match(/Q\d+$/)?.[0];
    const name = row.personLabel?.value?.trim();
    const birth = row.birth?.value?.match(/^(\d{4})/)?.[1];
    if (!qid || !name || name === qid || !birth || deathBeforeCampaign(row.death?.value)) return;
    const current = people.get(qid) ?? { qid, nationId, name, birthYear: Number(birth), occupations: new Set() };
    if (row.occupationLabel?.value && !/^Q\d+$/.test(row.occupationLabel.value)) current.occupations.add(row.occupationLabel.value.trim());
    people.set(qid, current);
  });
  return [...people.values()]
    .map((person) => {
      const occupations = [...person.occupations].sort((a, b) => a.localeCompare(b, 'ko')).slice(0, 4);
      return { ...person, occupations, discipline: classify(occupations), priority: priority(occupations) };
    })
    .sort((a, b) => a.birthYear - b.birthYear || a.name.localeCompare(b.name, 'ko'));
}

async function enrichOccupations(people) {
  const query = `SELECT ?person (GROUP_CONCAT(DISTINCT ?occupationLabel; separator="|||") AS ?occupations) WHERE {
  VALUES ?person { ${people.map((person) => `wd:${person.qid}`).join(' ')} }
  OPTIONAL { ?person wdt:P106 ?occupation. }
  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "ko,en".
    ?occupation rdfs:label ?occupationLabel.
  }
}
GROUP BY ?person`;
  const url = `${endpoint}?query=${encodeURIComponent(query)}&format=json`;
  let payload;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'IronDominionHistoricalRoster/1.1 (https://github.com/junlee122-bot/fas)' },
        signal: AbortSignal.timeout(90000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      payload = await response.json();
      break;
    } catch (error) {
      lastError = error;
      process.stdout.write(`occupation query retry ${attempt}/4\n`);
      await new Promise((resolve) => setTimeout(resolve, attempt * attempt * 2500));
    }
  }
  if (!payload) throw lastError;
  const occupationByQid = new Map(payload.results.bindings.map((row) => [
    row.person?.value?.match(/Q\d+$/)?.[0],
    (row.occupations?.value ?? '').split('|||').map((value) => value.trim()).filter(Boolean),
  ]));

  return people.map((person) => {
    const occupations = (occupationByQid.get(person.qid) ?? [])
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .slice(0, 4);
    const resolvedOccupations = occupations.length > 0 ? occupations : person.occupations;
    return {
      ...person,
      occupations: resolvedOccupations,
      discipline: classify(resolvedOccupations),
      priority: priority(resolvedOccupations),
    };
  });
}

function quote(value) {
  return JSON.stringify(value).replaceAll('\u2028', '\\u2028').replaceAll('\u2029', '\\u2029');
}

const rosters = [];
for (const [nationId, wikidataIds] of nationQueries) {
  const rows = await requestRows(nationId, wikidataIds);
  const enriched = await enrichOccupations(normalizeRows(nationId, rows));
  const roster = enriched
    .sort((a, b) => Number(a.occupations.length === 0) - Number(b.occupations.length === 0) || a.priority - b.priority || a.birthYear - b.birthYear || a.name.localeCompare(b.name, 'ko'))
    .slice(0, minimumPerNation);
  if (roster.length < 200) throw new Error(`${nationId}: only ${roster.length} eligible real people found`);
  if (roster.some((person) => person.occupations.length === 0)) {
    throw new Error(`${nationId}: fewer than ${minimumPerNation} eligible people have a public occupation record`);
  }
  process.stdout.write(`${nationId}: selected ${roster.length} people\n`);
  rosters.push(...roster);
}

const lines = rosters.map((person) => `  [${quote(person.qid)}, ${quote(person.nationId)}, ${quote(person.name)}, ${person.birthYear}, ${quote(person.occupations.join(' · ') || '공공 기록 인물')}, ${quote(person.discipline)}],`);
const generated = `/* eslint-disable */
// Generated from Wikidata structured data (CC0) by scripts/build-wikidata-roster.mjs.
// Identity, citizenship, birth year and campaign-date survival are source-linked by QID.
import type { NationId, PersonnelDiscipline } from './types';

export type WikidataHistoricalFigureSeed = readonly [
  qid: string,
  nationId: NationId,
  name: string,
  birthYear: number,
  occupation: string,
  discipline: PersonnelDiscipline,
];

export const wikidataHistoricalFigureSeeds: readonly WikidataHistoricalFigureSeed[] = [
${lines.join('\n')}
];
`;

await writeFile(outputPath, generated, 'utf8');
process.stdout.write(`Wrote ${rosters.length} real-person records to ${outputPath}\n`);
