import type { CareerRole, NationId } from './types';

export type GovernmentFormId =
  | 'parliamentary-republic'
  | 'constitutional-monarchy'
  | 'crown-state'
  | 'imperial-federation'
  | 'military-regency'
  | 'peoples-commonwealth';
export type NobleRankId = 'baron' | 'count' | 'marquess' | 'duke' | 'prince';
export type SuccessionLawId = 'unsettled' | 'primogeniture' | 'absolute-primogeniture' | 'elective' | 'appointed';

export interface GovernmentFormDefinition {
  id: GovernmentFormId;
  name: string;
  doctrine: string;
  description: string;
  monarchy: boolean;
  titleSystem: boolean;
  politicalCost: number;
  treasuryCost: number;
  minimumLegitimacy: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  strength: string;
  risk: string;
}

export interface NobleRankDefinition {
  id: NobleRankId;
  name: string;
  precedence: number;
  politicalCost: number;
  treasuryCost: number;
  weeklyStipend: number;
  authority: number;
  burden: number;
}

export interface NobleGrant {
  id: string;
  recipientId: string;
  recipientName: string;
  rankId: NobleRankId;
  titleName: string;
  domainId: string;
  domainName: string;
  grantedWeek: number;
  loyaltyAtGrant: number;
  influenceAtGrant: number;
  hereditary: boolean;
  weeklyStipend: number;
}

export interface DynasticMarriage {
  id: string;
  partnerNationId: string;
  partnerNationName: string;
  partnerHouse: string;
  spouseStyle: string;
  arrangedWeek: number;
  relationAtMarriage: number;
  legitimacyGain: number;
  successionGain: number;
  treatyValue: number;
}

export interface DynasticPoliticsState {
  version: 1;
  formId: GovernmentFormId;
  houseName: string;
  regnalName: string;
  formedWeek: number | null;
  lastReformWeek: number | null;
  crownAuthority: number;
  courtUnity: number;
  successionSecurity: number;
  estateBurden: number;
  successionLawId: SuccessionLawId;
  titleGrants: NobleGrant[];
  marriages: DynasticMarriage[];
}

export interface DynasticActionContext {
  week: number;
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  role: CareerRole;
}

export interface DynasticActionResult {
  state: DynasticPoliticsState;
  politicalPowerDelta: number;
  treasuryDelta: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  relationDelta?: { nationId: string; value: number };
  title: string;
  detail: string;
}

export interface MarriageCandidate {
  nationId: string;
  nationName: string;
  houseName: string;
  spouseStyle: string;
  historicalBasis: string;
}

export const governmentForms: GovernmentFormDefinition[] = [
  {
    id: 'parliamentary-republic', name: '의회 공화국', doctrine: '선거·의회 주권', monarchy: false, titleSystem: false,
    description: '선거와 의회를 통치 정통성의 중심에 두며 왕실 특권과 세습 영지를 인정하지 않습니다.',
    politicalCost: 18, treasuryCost: 40, minimumLegitimacy: 35, stabilityDelta: 3, legitimacyDelta: 4, unrestDelta: -3,
    strength: '국민 위임과 제도 역량', risk: '분열 의회와 단기 정책 경쟁',
  },
  {
    id: 'constitutional-monarchy', name: '입헌군주국', doctrine: '왕관과 의회의 이중 정통성', monarchy: true, titleSystem: true,
    description: '군주는 국가 통합과 계승을 맡고 내각은 의회에 책임집니다. 작위는 명예·봉사 계약으로 운용됩니다.',
    politicalCost: 42, treasuryCost: 120, minimumLegitimacy: 45, stabilityDelta: 2, legitimacyDelta: 6, unrestDelta: 1,
    strength: '안정적 계승과 외교 혼인', risk: '왕실 비용과 공화파 반발',
  },
  {
    id: 'crown-state', name: '왕권국가', doctrine: '왕실 중심 행정', monarchy: true, titleSystem: true,
    description: '왕실이 내각·군·지방관 인사권을 장악하고 작위와 영지를 충성 계약으로 직접 배분합니다.',
    politicalCost: 58, treasuryCost: 180, minimumLegitimacy: 52, stabilityDelta: -1, legitimacyDelta: 8, unrestDelta: 6,
    strength: '빠른 결재와 강한 왕권', risk: '궁정 파벌·민중 저항·왕위 찬탈',
  },
  {
    id: 'imperial-federation', name: '제국 연방', doctrine: '다민족 왕관 연합', monarchy: true, titleSystem: true,
    description: '여러 지역의 왕실·자치정부·귀족원을 하나의 연방 왕관 아래 묶습니다. 지방 영지는 강하지만 협상 비용도 큽니다.',
    politicalCost: 76, treasuryCost: 260, minimumLegitimacy: 60, stabilityDelta: -2, legitimacyDelta: 10, unrestDelta: 8,
    strength: '광역 외교권과 지방 동원', risk: '분리주의·영지 과대화·계승전쟁',
  },
  {
    id: 'military-regency', name: '군사 섭정체제', doctrine: '비상 계승 보호', monarchy: true, titleSystem: true,
    description: '전쟁·계승 위기 동안 섭정평의회가 왕실 권한을 대행합니다. 단기 질서는 강하지만 장기 정통성은 취약합니다.',
    politicalCost: 30, treasuryCost: 80, minimumLegitimacy: 30, stabilityDelta: 4, legitimacyDelta: -3, unrestDelta: 4,
    strength: '위기 대응과 지휘통일', risk: '군부 영구집권과 궁정 쿠데타',
  },
  {
    id: 'peoples-commonwealth', name: '인민 공동체', doctrine: '평의회·지역 대표', monarchy: false, titleSystem: false,
    description: '세습 작위 대신 노동·지역·저항조직의 대표권을 제도화하고 영지를 공공 신탁으로 전환합니다.',
    politicalCost: 38, treasuryCost: 90, minimumLegitimacy: 38, stabilityDelta: 1, legitimacyDelta: 5, unrestDelta: -5,
    strength: '대중 조직과 불평등 완화', risk: '당·평의회 권력 집중과 숙청 경쟁',
  },
];

export const nobleRanks: NobleRankDefinition[] = [
  { id: 'baron', name: '남작', precedence: 1, politicalCost: 6, treasuryCost: 18, weeklyStipend: 0.8, authority: 2, burden: 2 },
  { id: 'count', name: '백작', precedence: 2, politicalCost: 10, treasuryCost: 30, weeklyStipend: 1.4, authority: 4, burden: 4 },
  { id: 'marquess', name: '후작', precedence: 3, politicalCost: 15, treasuryCost: 48, weeklyStipend: 2.1, authority: 6, burden: 6 },
  { id: 'duke', name: '공작', precedence: 4, politicalCost: 22, treasuryCost: 72, weeklyStipend: 3.2, authority: 9, burden: 9 },
  { id: 'prince', name: '왕공', precedence: 5, politicalCost: 32, treasuryCost: 110, weeklyStipend: 4.8, authority: 13, burden: 13 },
];

const historicHouseByNation: Record<NationId, string> = {
  britain: '윈저 왕가', usa: '국민 추대 왕실', ussr: '로마노프 왕가', germany: '호엔촐레른 왕가', japan: '일본 황실',
  china: '아이신기오로 가문', india: '인도 제후 연합가', freefrance: '오를레앙 왕가', italy: '사보이 왕가', korea: '전주 이씨 황실',
  vietnam: '응우옌 왕조', indonesia: '욕야카르타 왕가', philippines: '키람 술탄가',
};

const inheritedFormByNation: Partial<Record<NationId, GovernmentFormId>> = {
  britain: 'constitutional-monarchy',
  japan: 'imperial-federation',
  italy: 'constitutional-monarchy',
};

const marriageHouseByNation: Record<NationId, Omit<MarriageCandidate, 'nationId' | 'nationName'>> = {
  britain: { houseName: '윈저 왕가', spouseStyle: '왕실 특사', historicalBasis: '영국 왕실과 유럽 왕가의 혼인·외교 전통' },
  usa: { houseName: '미국 외교 명문가', spouseStyle: '공화국 명예배우자', historicalBasis: '공화국 엘리트 가문과 초국가적 정치 혼인이라는 대체역사 설정' },
  ussr: { houseName: '로마노프 망명계', spouseStyle: '망명 왕가 대표', historicalBasis: '혁명 이후 해외에 남은 로마노프 일가와 왕정복고 운동' },
  germany: { houseName: '호엔촐레른 왕가', spouseStyle: '프로이센 왕자·공주', historicalBasis: '독일 제국 폐지 뒤에도 남은 호엔촐레른 가문의 왕위 주장' },
  japan: { houseName: '일본 황실 방계', spouseStyle: '친왕가 대표', historicalBasis: '전전 일본의 황족·궁가 혼인 네트워크' },
  china: { houseName: '아이신기오로 가문', spouseStyle: '청 황실 후예', historicalBasis: '청 왕조 퇴위 뒤에도 존속한 황실 가문과 복벽 운동' },
  india: { houseName: '인도 제후가 연합', spouseStyle: '마하라자 가문 대표', historicalBasis: '영국령 인도의 수백 개 번왕국과 왕실 혼인 전통' },
  freefrance: { houseName: '오를레앙 왕가', spouseStyle: '프랑스 왕위 요구자 측 대표', historicalBasis: '제3공화국기에도 이어진 오를레앙·부르봉 왕위 계승 주장' },
  italy: { houseName: '사보이 왕가', spouseStyle: '왕실 공작가 대표', historicalBasis: '이탈리아 왕국의 사보이 왕실과 유럽 왕가 혼인' },
  korea: { houseName: '전주 이씨 황실', spouseStyle: '황실 종친 대표', historicalBasis: '대한제국 황실과 전주 이씨 종친 체계' },
  vietnam: { houseName: '응우옌 왕조', spouseStyle: '후에 황실 대표', historicalBasis: '응우옌 왕조의 황족·관료 혼인망' },
  indonesia: { houseName: '욕야카르타 왕가', spouseStyle: '술탄가 대표', historicalBasis: '욕야카르타 술탄국과 군도 각지 왕실의 정치적 권위' },
  philippines: { houseName: '키람 술탄가', spouseStyle: '술루 술탄가 대표', historicalBasis: '술루 술탄국의 왕위 계승과 지역 외교망' },
};

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));

export function createDynasticPoliticsState(nationId: NationId): DynasticPoliticsState {
  const formId = inheritedFormByNation[nationId] ?? 'parliamentary-republic';
  const monarchy = getGovernmentForm(formId).monarchy;
  return {
    version: 1,
    formId,
    houseName: historicHouseByNation[nationId],
    regnalName: '',
    formedWeek: monarchy ? 0 : null,
    lastReformWeek: null,
    crownAuthority: formId === 'imperial-federation' ? 66 : monarchy ? 44 : 0,
    courtUnity: 50,
    successionSecurity: 45,
    estateBurden: 0,
    successionLawId: 'unsettled',
    titleGrants: [],
    marriages: [],
  };
}

export function normalizeDynasticPoliticsState(value: unknown, nationId: NationId): DynasticPoliticsState {
  const fallback = createDynasticPoliticsState(nationId);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<DynasticPoliticsState>;
  if (!governmentForms.some((form) => form.id === candidate.formId)) return fallback;
  return {
    ...fallback,
    ...candidate,
    version: 1,
    titleGrants: Array.isArray(candidate.titleGrants) ? candidate.titleGrants.slice(0, 48) : [],
    marriages: Array.isArray(candidate.marriages) ? candidate.marriages.slice(0, 16) : [],
  };
}

export function getGovernmentForm(formId: GovernmentFormId) {
  return governmentForms.find((form) => form.id === formId) ?? governmentForms[0];
}

export function canManageDynasticPolitics(role: CareerRole) {
  return role.tier === 1 || (role.branch === 'politics' && role.tier <= 2);
}

export function canAdoptGovernmentForm(state: DynasticPoliticsState, formId: GovernmentFormId, context: DynasticActionContext) {
  const form = getGovernmentForm(formId);
  if (state.formId === formId) return { allowed: false, reason: '이미 시행 중인 국가체제입니다.' };
  if (!canManageDynasticPolitics(context.role) && !(formId === 'military-regency' && context.role.branch === 'military' && context.role.tier <= 2)) return { allowed: false, reason: '국가원수 또는 2단계 이상 정치 보직의 개헌 권한이 필요합니다.' };
  if (state.lastReformWeek !== null && context.week - state.lastReformWeek < 26) return { allowed: false, reason: `헌정 전환 냉각기간이 ${26 - (context.week - state.lastReformWeek)}주 남았습니다.` };
  if (context.legitimacy < form.minimumLegitimacy) return { allowed: false, reason: `정통성 ${form.minimumLegitimacy} 이상이 필요합니다.` };
  if (context.politicalPower < form.politicalCost) return { allowed: false, reason: `정치력 ${form.politicalCost}가 필요합니다.` };
  if (context.treasury < form.treasuryCost) return { allowed: false, reason: `국고 ${form.treasuryCost}M이 필요합니다.` };
  return { allowed: true, reason: '헌정회의 소집 가능' };
}

export function adoptGovernmentForm(state: DynasticPoliticsState, formId: GovernmentFormId, context: DynasticActionContext): DynasticActionResult | null {
  const eligibility = canAdoptGovernmentForm(state, formId, context);
  if (!eligibility.allowed) return null;
  const form = getGovernmentForm(formId);
  const wasMonarchy = getGovernmentForm(state.formId).monarchy;
  return {
    state: {
      ...state,
      formId,
      formedWeek: form.monarchy && !wasMonarchy ? context.week : state.formedWeek,
      lastReformWeek: context.week,
      crownAuthority: form.monarchy ? clamp(Math.max(state.crownAuthority, formId === 'constitutional-monarchy' ? 42 : formId === 'military-regency' ? 58 : 66)) : 0,
      courtUnity: clamp(state.courtUnity + (form.monarchy ? -4 : 5)),
      successionSecurity: form.monarchy ? clamp(Math.max(32, state.successionSecurity)) : 45,
      estateBurden: form.monarchy ? state.estateBurden : Math.max(0, state.estateBurden - 12),
    },
    politicalPowerDelta: -form.politicalCost,
    treasuryDelta: -form.treasuryCost,
    stabilityDelta: form.stabilityDelta,
    legitimacyDelta: form.legitimacyDelta,
    unrestDelta: form.unrestDelta,
    title: `헌정 전환 — ${form.name}`,
    detail: `${form.doctrine} 원칙으로 국가체제를 전환했습니다. ${form.monarchy ? `${state.houseName}가 국가의 왕실로 승인되며 작위·영지·왕실 혼인 기능이 열립니다.` : '세습 특권은 정지되고 기존 작위는 역사 기록으로 보존됩니다.'}`,
  };
}

export function grantNobleTitle(
  state: DynasticPoliticsState,
  input: { week: number; recipientId: string; recipientName: string; loyalty: number; influence: number; rankId: NobleRankId; domainId: string; domainName: string },
  context: DynasticActionContext,
): DynasticActionResult | null {
  const form = getGovernmentForm(state.formId);
  const rank = nobleRanks.find((item) => item.id === input.rankId);
  if (!form.titleSystem || !rank || !canManageDynasticPolitics(context.role)) return null;
  if (state.titleGrants.some((grant) => grant.recipientId === input.recipientId || grant.domainId === input.domainId)) return null;
  if (context.politicalPower < rank.politicalCost || context.treasury < rank.treasuryCost) return null;
  const grant: NobleGrant = {
    id: `title-${input.week}-${input.recipientId}-${input.domainId}`,
    recipientId: input.recipientId,
    recipientName: input.recipientName,
    rankId: rank.id,
    titleName: `${input.domainName} ${rank.name}`,
    domainId: input.domainId,
    domainName: input.domainName,
    grantedWeek: input.week,
    loyaltyAtGrant: input.loyalty,
    influenceAtGrant: input.influence,
    hereditary: state.formId !== 'constitutional-monarchy',
    weeklyStipend: rank.weeklyStipend,
  };
  const loyaltyBenefit = Math.max(0, input.loyalty - 55) / 18;
  const influenceRisk = Math.max(0, input.influence - 70) / 12;
  return {
    state: {
      ...state,
      titleGrants: [...state.titleGrants, grant],
      crownAuthority: clamp(state.crownAuthority + rank.authority * 0.55 + loyaltyBenefit - influenceRisk),
      courtUnity: clamp(state.courtUnity + loyaltyBenefit + 2 - influenceRisk),
      estateBurden: clamp(state.estateBurden + rank.burden),
    },
    politicalPowerDelta: -rank.politicalCost,
    treasuryDelta: -rank.treasuryCost,
    stabilityDelta: input.loyalty >= 70 ? 1 : 0,
    legitimacyDelta: rank.precedence >= 4 ? 2 : 1,
    unrestDelta: rank.precedence >= 4 ? 2 : 0,
    title: `작위 서임 — ${grant.titleName}`,
    detail: `${input.recipientName}에게 ${grant.hereditary ? '세습' : '비세습'} ${grant.titleName} 작위와 ${input.domainName}의 후견·징세 책임을 부여했습니다. 충성 ${input.loyalty}, 영향력 ${input.influence}가 궁정 결속과 찬탈 위험에 함께 반영됩니다.`,
  };
}

export function revokeNobleGrant(state: DynasticPoliticsState, grantId: string, context: DynasticActionContext): DynasticActionResult | null {
  const grant = state.titleGrants.find((item) => item.id === grantId);
  if (!grant || !canManageDynasticPolitics(context.role) || context.politicalPower < 12) return null;
  const rank = nobleRanks.find((item) => item.id === grant.rankId) ?? nobleRanks[0];
  return {
    state: {
      ...state,
      titleGrants: state.titleGrants.filter((item) => item.id !== grantId),
      crownAuthority: clamp(state.crownAuthority - 3),
      courtUnity: clamp(state.courtUnity - 8 - rank.precedence),
      estateBurden: clamp(state.estateBurden - rank.burden),
    },
    politicalPowerDelta: -12,
    treasuryDelta: 0,
    stabilityDelta: -1,
    legitimacyDelta: -2,
    unrestDelta: 3,
    title: `작위 회수 — ${grant.titleName}`,
    detail: `${grant.recipientName}의 작위와 ${grant.domainName} 후견권을 회수했습니다. 왕권은 권한을 되찾았지만 피서임자와 연계된 궁정 세력이 반발합니다.`,
  };
}

export function getMarriageCandidates(relations: Array<{ id: string; name: string }>): MarriageCandidate[] {
  return relations.map((relation) => {
    const profile = marriageHouseByNation[relation.id as NationId];
    return profile ? { nationId: relation.id, nationName: relation.name, ...profile } : {
      nationId: relation.id,
      nationName: relation.name,
      houseName: `${relation.name} 유력가`,
      spouseStyle: '외교 가문 대표',
      historicalBasis: '해당 국가의 지역 엘리트·명문가 외교를 재구성한 대체역사 후보',
    };
  });
}

export function arrangeDynasticMarriage(
  state: DynasticPoliticsState,
  candidate: MarriageCandidate,
  relationValue: number,
  context: DynasticActionContext,
): DynasticActionResult | null {
  if (!getGovernmentForm(state.formId).monarchy || !canManageDynasticPolitics(context.role)) return null;
  if (state.marriages.some((marriage) => marriage.partnerNationId === candidate.nationId)) return null;
  const politicalCost = 18;
  const treasuryCost = 65;
  if (context.politicalPower < politicalCost || context.treasury < treasuryCost || relationValue < 30) return null;
  const relationGain = Math.round(clamp(5 + relationValue / 12, 7, 14));
  const legitimacyGain = Math.round(clamp(2 + relationValue / 25, 3, 6));
  const successionGain = Math.round(clamp(8 + relationValue / 8, 10, 20));
  const marriage: DynasticMarriage = {
    id: `marriage-${context.week}-${candidate.nationId}`,
    partnerNationId: candidate.nationId,
    partnerNationName: candidate.nationName,
    partnerHouse: candidate.houseName,
    spouseStyle: candidate.spouseStyle,
    arrangedWeek: context.week,
    relationAtMarriage: relationValue,
    legitimacyGain,
    successionGain,
    treatyValue: relationGain,
  };
  return {
    state: {
      ...state,
      marriages: [...state.marriages, marriage],
      courtUnity: clamp(state.courtUnity + 4),
      successionSecurity: clamp(state.successionSecurity + successionGain),
      crownAuthority: clamp(state.crownAuthority + 2),
    },
    politicalPowerDelta: -politicalCost,
    treasuryDelta: -treasuryCost,
    stabilityDelta: 1,
    legitimacyDelta: legitimacyGain,
    unrestDelta: relationValue < 45 ? 2 : 0,
    relationDelta: { nationId: candidate.nationId, value: relationGain },
    title: `왕실 혼인 협정 — ${candidate.houseName}`,
    detail: `${state.houseName}와 ${candidate.houseName}의 혼인 협정을 체결했습니다. 양국 관계 +${relationGain}, 계승 안정 +${successionGain}. 관계가 악화되면 혼인 동맹이 왕위 요구권 분쟁으로 바뀔 수 있습니다.`,
  };
}

export function setSuccessionLaw(state: DynasticPoliticsState, lawId: SuccessionLawId, context: DynasticActionContext): DynasticActionResult | null {
  if (!getGovernmentForm(state.formId).monarchy || !canManageDynasticPolitics(context.role) || lawId === 'unsettled' || lawId === state.successionLawId || context.politicalPower < 16) return null;
  const securityGain = lawId === 'elective' ? 10 : lawId === 'appointed' ? 8 : 14;
  return {
    state: { ...state, successionLawId: lawId, successionSecurity: clamp(state.successionSecurity + securityGain), courtUnity: clamp(state.courtUnity + (lawId === 'elective' ? 3 : -1)) },
    politicalPowerDelta: -16,
    treasuryDelta: -24,
    stabilityDelta: 1,
    legitimacyDelta: 2,
    unrestDelta: lawId === 'primogeniture' ? 1 : 0,
    title: '왕위계승법 확정',
    detail: `${getSuccessionLawName(lawId)}을(를) 왕위계승 원칙으로 공포했습니다. 계승 안정 +${securityGain}, 정치력 -16, 국고 -24M.`,
  };
}

export function getSuccessionLawName(lawId: SuccessionLawId) {
  return lawId === 'primogeniture' ? '장자 우선 상속' : lawId === 'absolute-primogeniture' ? '절대적 장자 상속' : lawId === 'elective' ? '선거군주 계승' : lawId === 'appointed' ? '군주 지명 계승' : '미정';
}

export function getDynasticWeeklyEffects(state: DynasticPoliticsState) {
  const form = getGovernmentForm(state.formId);
  if (!form.monarchy) return { weeklyCost: 0, legitimacy: 0, unrest: -0.02, coupRisk: 0, note: '세습 특권이 정지된 비왕정 체제' };
  const stipend = state.titleGrants.reduce((total, grant) => total + grant.weeklyStipend, 0);
  const courtCost = state.formId === 'imperial-federation' ? 4.2 : state.formId === 'crown-state' ? 3.2 : 2.2;
  const legitimacy = (state.courtUnity - 50) * 0.0025 + (state.successionSecurity - 50) * 0.0018;
  const unrest = Math.max(0, state.estateBurden - 42) * 0.004 + (state.formId === 'military-regency' ? 0.08 : 0);
  const coupRisk = Math.max(0, 45 - state.successionSecurity) * 0.28 + Math.max(0, 42 - state.courtUnity) * 0.24 + Math.max(0, state.estateBurden - 55) * 0.18;
  return { weeklyCost: Number((stipend + courtCost).toFixed(1)), legitimacy, unrest, coupRisk: Number(coupRisk.toFixed(1)), note: `왕실비 ${courtCost.toFixed(1)}M · 작위 연금 ${stipend.toFixed(1)}M` };
}
