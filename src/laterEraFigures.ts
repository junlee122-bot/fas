import type {
  NationId,
  PersonnelAvailability,
  PersonnelDiscipline,
  StaffCandidate,
  StaffDepartment,
} from './types';
import { wikidataLaterEraFigureSeeds } from './wikidataLaterEraFigures.generated';
import { getCuratedLaterEraDossier } from './curatedLaterEraFigures';
export { curatedLaterEraDossiers, getCuratedLaterEraDossier } from './curatedLaterEraFigures';

export interface LaterEraFigure {
  qid: string;
  nationId: NationId;
  name: string;
  birthYear: number;
  occupation: string;
  discipline: PersonnelDiscipline;
  sitelinks: number;
  generationUnlockYear: number;
  minimumAdultYear: number;
  historicalEra: NonNullable<StaffCandidate['historicalEra']>;
}

const nationLabels: Record<NationId, string> = {
  britain: '영국',
  usa: '미국',
  ussr: '소련',
  germany: '독일',
  japan: '일본',
  china: '중국',
  india: '인도',
  freefrance: '프랑스',
  italy: '이탈리아',
  korea: '한국',
  vietnam: '베트남',
  indonesia: '인도네시아',
  philippines: '필리핀',
};

const disciplineModel: Record<PersonnelDiscipline, {
  department: StaffDepartment;
  role: string;
  unlockAge: number;
  appointmentEffect: string;
}> = {
  military: { department: 'operations', role: '신세대 군사교리 고문', unlockAge: 30, appointmentEffect: '작전 교리와 지휘관 육성에 후대의 조직 경험을 반영합니다.' },
  science: { department: 'science', role: '국가연구 특별고문', unlockAge: 28, appointmentEffect: '연구 우선순위와 과학기관 네트워크의 성장을 가속합니다.' },
  engineering: { department: 'science', role: '첨단공학 계획관', unlockAge: 26, appointmentEffect: '장비 세대교체와 응용기술 연구의 병목을 줄입니다.' },
  medicine: { department: 'science', role: '공중보건·의학 고문', unlockAge: 28, appointmentEffect: '의료 수용력과 감염병 연구·대응 체계를 강화합니다.' },
  economics: { department: 'economy', role: '전후경제 특별고문', unlockAge: 30, appointmentEffect: '재정·산업·금융 정책의 장기 효율을 높입니다.' },
  industry: { department: 'armaments', role: '산업혁신 조정관', unlockAge: 26, appointmentEffect: '산업 투자와 생산 전환, 민군 기술 확산을 촉진합니다.' },
  intelligence: { department: 'personnel', role: '정보조직 혁신고문', unlockAge: 30, appointmentEffect: '정보망·방첩·비밀공작 조직의 세대교체를 지원합니다.' },
  diplomacy: { department: 'political', role: '국제질서 특별대표', unlockAge: 32, appointmentEffect: '동맹 협상과 국제적 영향력 경쟁에서 추가 선택지를 엽니다.' },
  'social-science': { department: 'political', role: '사회·문화정책 고문', unlockAge: 26, appointmentEffect: '대중 지지·문화 영향력·사회통합 정책의 파급력을 높입니다.' },
};

const eraLabels: Record<NonNullable<StaffCandidate['historicalEra']>, string> = {
  wartime: '세계대전기',
  postwar: '전후 재건기',
  'cold-war': '냉전기',
  'late-century': '20세기 후반',
  contemporary: '현대 전환기',
};

function stableHash(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function eraForYear(year: number): LaterEraFigure['historicalEra'] {
  if (year <= 1955) return 'postwar';
  if (year <= 1991) return 'cold-war';
  if (year <= 2000) return 'late-century';
  return 'contemporary';
}

export const laterEraFigures: readonly LaterEraFigure[] = wikidataLaterEraFigureSeeds.map(([
  qid,
  nationId,
  name,
  birthYear,
  occupation,
  discipline,
  sitelinks,
]) => {
  const curated = getCuratedLaterEraDossier(qid);
  const resolvedDiscipline = curated?.discipline ?? discipline;
  const generationUnlockYear = Math.max(1945, birthYear + 18, curated?.historicalEntryYear ?? birthYear + disciplineModel[resolvedDiscipline].unlockAge);
  return {
    qid,
    nationId,
    name,
    birthYear,
    occupation,
    discipline: resolvedDiscipline,
    sitelinks,
    generationUnlockYear,
    minimumAdultYear: birthYear + 18,
    historicalEra: eraForYear(generationUnlockYear),
  };
});

function canEnterInternationalMarket(figure: LaterEraFigure, playerNationId: NationId) {
  if (figure.nationId === playerNationId) return true;
  if (figure.sitelinks < 150) return false;
  return stableHash(`${figure.qid}:${playerNationId}:international`) % 5 === 0;
}

function availabilityFor(figure: LaterEraFigure, playerNationId: NationId): PersonnelAvailability {
  if (figure.nationId !== playerNationId) return stableHash(`${figure.qid}:foreign`) % 3 === 0 ? 'opposition' : 'poachable';
  return stableHash(`${figure.qid}:local`) % 4 === 0 ? 'poachable' : 'available';
}

function createCandidate(figure: LaterEraFigure, playerNationId: NationId, campaignYear: number): StaffCandidate {
  const model = disciplineModel[figure.discipline];
  const curated = getCuratedLaterEraDossier(figure.qid);
  const seed = stableHash(`${figure.qid}:${playerNationId}`);
  const age = Math.max(18, campaignYear - figure.birthYear);
  const recognitionBonus = Math.min(10, Math.floor(figure.sitelinks / 30));
  const ability = Math.min(96, 43 + Math.min(25, Math.floor(age * 0.7)) + recognitionBonus + seed % 8);
  const potential = Math.min(99, Math.max(ability + 2, 70 + recognitionBonus + (seed >>> 5) % 17));
  const isAccelerated = campaignYear < figure.generationUnlockYear;
  const origin = nationLabels[figure.nationId];
  const eraLabel = eraLabels[figure.historicalEra];
  return {
    id: `later-${figure.qid}`,
    personId: `later-${figure.qid}`,
    name: figure.name,
    role: curated?.role ?? model.role,
    historicalOffice: `${figure.occupation} · 후대 실존 인물`,
    affiliation: curated?.affiliation ?? `${origin} ${eraLabel} 인재 네트워크`,
    summary: curated ? `${curated.summary} ${campaignYear}년의 임명과 능력 수치는 현재 세계선이 만든 대체역사 설정입니다.` : `${figure.name}은(는) ${figure.birthYear}년생 실존 인물이며 공개 직업 기록은 ‘${figure.occupation}’입니다. ${campaignYear}년의 이 직책·접촉 경로와 능력 수치는 현재 세계선이 만든 대체역사 설정입니다.`,
    department: model.department,
    ability,
    potential,
    loyalty: 40 + (seed >>> 9) % 48,
    weeklyCost: 6 + Math.floor(ability / 16),
    signingCost: 52 + ability + Math.round(recognitionBonus * 3.5),
    interest: 42 + (seed >>> 13) % 52,
    knowledge: 18,
    status: 'unscouted',
    specialty: figure.occupation,
    influence: Math.min(96, 48 + recognitionBonus * 3 + (seed >>> 17) % 17),
    relationship: 7 + (seed >>> 20) % 15,
    rivalInterest: 18 + recognitionBonus * 2 + (seed >>> 23) % 24,
    availability: availabilityFor(figure, playerNationId),
    lastApproachWeek: null,
    discipline: figure.discipline,
    birthYear: figure.birthYear,
    nationality: origin,
    wartimeLocation: `${eraLabel} 인물 풀 · ${campaignYear}년 세계선에서 접촉`,
    historicalConstraint: curated?.historicalConstraint ?? `실존 정보는 신원·국적·출생연도·공개 직업까지입니다. ${campaignYear}년의 임명 가능성, 충성도, 능력치와 조직 효과는 대체역사 시뮬레이션이며 실제 평가가 아닙니다.`,
    expertise: curated?.expertise ?? figure.occupation.split(' · ').slice(0, 3),
    networks: curated?.networks ?? [`${origin} 인맥`, `${eraLabel} 세대`, isAccelerated ? '가속 세계선 조기 발탁' : '달력 연도에 따른 세대 등장'],
    friction: curated?.friction ?? (figure.nationId === playerNationId ? '기성 엘리트와 신세대 인물의 권한 충돌' : '국적·이념·기관 충성 및 해외 포섭 위험'),
    appointmentEffect: curated?.appointmentEffect ?? model.appointmentEffect,
    sourceLabel: curated?.sourceLabel ?? `Wikidata ${figure.qid} · 신원·직업`,
    sourceUrl: curated?.sourceUrl ?? `https://www.wikidata.org/wiki/${figure.qid}`,
    historicalEra: figure.historicalEra,
    marketEntryYear: campaignYear,
    generationUnlockYear: figure.generationUnlockYear,
    alternateHistoryEntry: isAccelerated,
  };
}

export function getLaterEraFigure(qid: string) {
  return laterEraFigures.find((figure) => figure.qid === qid);
}

export function getEligibleLaterEraFigures(
  playerNationId: NationId,
  campaignYear: number,
  historicalHorizon = campaignYear,
): LaterEraFigure[] {
  const unique = new Map<string, LaterEraFigure>();
  laterEraFigures
    .filter((figure) => canEnterInternationalMarket(figure, playerNationId))
    .filter((figure) => campaignYear >= figure.minimumAdultYear)
    .filter((figure) => historicalHorizon >= figure.generationUnlockYear)
    .sort((left, right) => {
      const localDifference = Number(right.nationId === playerNationId) - Number(left.nationId === playerNationId);
      return localDifference || left.generationUnlockYear - right.generationUnlockYear || right.sitelinks - left.sitelinks || left.qid.localeCompare(right.qid);
    })
    .forEach((figure) => {
      if (!unique.has(figure.qid)) unique.set(figure.qid, figure);
    });
  return [...unique.values()];
}

export function createLaterEraCandidates(
  playerNationId: NationId,
  campaignYear: number,
  historicalHorizon = campaignYear,
): StaffCandidate[] {
  return getEligibleLaterEraFigures(playerNationId, campaignYear, historicalHorizon)
    .map((figure) => createCandidate(figure, playerNationId, campaignYear));
}

export function getLaterEraRosterSummary() {
  return {
    total: laterEraFigures.length,
    byNation: Object.fromEntries(Object.keys(nationLabels).map((nationId) => [
      nationId,
      laterEraFigures.filter((figure) => figure.nationId === nationId).length,
    ])) as Record<NationId, number>,
  };
}
