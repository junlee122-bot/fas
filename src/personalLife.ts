import type { CareerRole, NationId } from './types';

export type GenderIdentity = 'woman' | 'man' | 'nonbinary' | 'private';
export type OrientationId = 'heterosexual' | 'gay-lesbian' | 'bisexual' | 'pansexual' | 'asexual' | 'private';
export type PartnerTermPreference = 'auto' | 'wife' | 'husband' | 'spouse' | 'partner';
export type RelationshipBoundary = 'exclusive' | 'negotiated' | 'companionate' | 'private';
export type RelationshipVisibility = 'public' | 'private' | 'secret';
export type UnionForm = 'marriage' | 'civil-partnership' | 'domestic-partnership' | 'private-commitment';
export type RelationshipStage = 'courtship' | 'committed' | 'married';
export type PairKind = 'different-gender' | 'same-gender' | 'gender-diverse' | 'private';
export type FamilyLawId = 'restrictive-code' | 'private-life-protection' | 'civil-partnerships' | 'marriage-equality';
export type FamilyPlanId = 'undecided' | 'no-children' | 'birth-parenthood' | 'adoption' | 'guardianship';
export type PersonalLifeActionId = 'spend-time' | 'discuss-boundaries' | 'support-career' | 'public-appearance' | 'protect-privacy' | 'separate';

export interface PersonalIdentityProfile {
  configured: boolean;
  gender: GenderIdentity;
  orientation: OrientationId;
  partnerTerm: PartnerTermPreference;
  boundary: RelationshipBoundary;
}

export interface RelationshipCandidate {
  id: string;
  nationId: string;
  nationName: string;
  name: string;
  gender: Exclude<GenderIdentity, 'private'>;
  orientation: 'bisexual' | 'pansexual';
  pronouns: string;
  profession: string;
  background: string;
  values: [string, string, string];
  relationshipStyle: string;
  preferredVisibility: RelationshipVisibility;
  publicStanding: number;
  relationValue: number;
  fictionalComposite: true;
}

export interface PersonalRelationship {
  id: string;
  candidate: RelationshipCandidate;
  stage: RelationshipStage;
  unionForm: UnionForm | null;
  visibility: RelationshipVisibility;
  pairKind: PairKind;
  partnerTerm: string;
  startedWeek: number;
  formalizedWeek: number | null;
  weeksTogether: number;
  bond: number;
  trust: number;
  strain: number;
  publicSupport: number;
  exposure: number;
  legalRecognition: 'none' | 'partial' | 'full';
  familyPlan: FamilyPlanId;
  dependents: number;
}

export interface PersonalLifeHistoryRecord {
  id: string;
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'neutral' | 'bad';
}

export interface PersonalLifeState {
  version: 1;
  nationId: NationId;
  profile: PersonalIdentityProfile;
  familyLawId: FamilyLawId;
  activeRelationship: PersonalRelationship | null;
  history: PersonalLifeHistoryRecord[];
  lastActivityWeek: number | null;
}

export interface FamilyLawDefinition {
  id: FamilyLawId;
  name: string;
  principle: string;
  description: string;
  sameGenderMarriage: boolean;
  civilPartnership: boolean;
  jointAdoption: boolean;
  politicalCost: number;
  treasuryCost: number;
  requiredEducation: number;
  requiredInstitutions: number;
  requiredLegitimacy: number;
  historicalAnchor: string;
}

export interface PersonalLifeContext {
  week: number;
  year: number;
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  education: number;
  institutionalCapacity: number;
  role: CareerRole;
}

export interface PersonalLifeActionResult {
  state: PersonalLifeState;
  politicalPowerDelta: number;
  treasuryDelta: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  relationDelta?: { nationId: string; value: number };
  title: string;
  detail: string;
}

export interface PersonalLifeWeeklyEffects {
  state: PersonalLifeState;
  weeklyCost: number;
  legitimacy: number;
  unrest: number;
  stability: number;
  note: string;
}

export const familyLawDefinitions: FamilyLawDefinition[] = [
  {
    id: 'restrictive-code',
    name: '전통 혼인법',
    principle: '이성 간 법률혼만 승인',
    description: '국가는 이성 간 혼인만 등록합니다. 다른 관계는 존재할 수 있지만 법적 보호와 공동양육 권리가 없습니다.',
    sameGenderMarriage: false,
    civilPartnership: false,
    jointAdoption: false,
    politicalCost: 12,
    treasuryCost: 4,
    requiredEducation: 0,
    requiredInstitutions: 0,
    requiredLegitimacy: 20,
    historicalAnchor: '1940년대 다수 국가의 가족법과 국가·사회에 의한 사생활 통제를 반영한 출발점',
  },
  {
    id: 'private-life-protection',
    name: '사생활 보호법',
    principle: '관계 비범죄화·차별 완화',
    description: '성인 간 관계를 처벌하거나 공직 박탈 사유로 삼지 않습니다. 혼인과 공동양육의 동등한 법적 지위는 아직 제한됩니다.',
    sameGenderMarriage: false,
    civilPartnership: false,
    jointAdoption: false,
    politicalCost: 18,
    treasuryCost: 8,
    requiredEducation: 32,
    requiredInstitutions: 38,
    requiredLegitimacy: 35,
    historicalAnchor: '전후 인권 담론과 1960–1990년대 여러 국가의 비범죄화·사생활 보호 개혁을 압축한 단계',
  },
  {
    id: 'civil-partnerships',
    name: '시민결합법',
    principle: '성별과 무관한 재산·상속 보호',
    description: '혼인과 별개의 시민결합을 등록해 재산, 상속, 병원 면회와 제한적 공동양육 권리를 보장합니다.',
    sameGenderMarriage: false,
    civilPartnership: true,
    jointAdoption: true,
    politicalCost: 28,
    treasuryCost: 14,
    requiredEducation: 48,
    requiredInstitutions: 52,
    requiredLegitimacy: 45,
    historicalAnchor: '유럽을 중심으로 확산된 등록 파트너십·시민결합 제도와 혼인 전환 논쟁을 모델링한 단계',
  },
  {
    id: 'marriage-equality',
    name: '혼인평등법',
    principle: '성별과 무관한 혼인·양육의 동등권',
    description: '모든 성인 커플에게 동일한 혼인, 이혼, 상속과 공동양육 절차를 적용합니다.',
    sameGenderMarriage: true,
    civilPartnership: true,
    jointAdoption: true,
    politicalCost: 40,
    treasuryCost: 22,
    requiredEducation: 58,
    requiredInstitutions: 62,
    requiredLegitimacy: 52,
    historicalAnchor: '2000년대 이후 여러 민주국가에서 진행된 혼인평등 법제화와 사법·의회 논쟁을 모델링한 단계',
  },
];

export const personalLifeActionDefinitions: Array<{
  id: PersonalLifeActionId;
  name: string;
  description: string;
  cost: string;
}> = [
  { id: 'spend-time', name: '함께 시간 보내기', description: '공적 일정을 줄이고 관계의 유대와 회복력을 높입니다.', cost: '국고 6M' },
  { id: 'discuss-boundaries', name: '관계 경계 합의', description: '공개 범위와 기대를 대화해 신뢰를 높이고 긴장을 낮춥니다.', cost: '정치력 2' },
  { id: 'support-career', name: '배우자 활동 지원', description: '상대의 직업과 독립성을 지원해 신뢰와 공적 기반을 넓힙니다.', cost: '정치력 3 · 국고 10M' },
  { id: 'public-appearance', name: '공식 일정 동행', description: '관계를 공개 자산으로 만들지만 법적 보호가 약하면 노출 위험이 커집니다.', cost: '정치력 4' },
  { id: 'protect-privacy', name: '사생활 보호 강화', description: '경호·법률 지원으로 노출과 압박을 낮추고 관계를 비공개로 전환합니다.', cost: '정치력 6 · 국고 4M' },
  { id: 'separate', name: '합의 별거·관계 종료', description: '현재 관계를 정리하고 결과를 개인사 기록에 남깁니다.', cost: '정치력 8' },
];

export const familyPlanDefinitions: Array<{ id: FamilyPlanId; name: string; description: string }> = [
  { id: 'undecided', name: '아직 결정하지 않음', description: '관계를 먼저 안정시키고 이후 가족 형태를 결정합니다.' },
  { id: 'no-children', name: '비양육 동반자', description: '자녀 없이 두 사람의 경력과 공동생활에 집중합니다.' },
  { id: 'birth-parenthood', name: '출산·친족 공동양육', description: '출산 또는 친족 돌봄을 포함한 공동양육 가구를 만듭니다.' },
  { id: 'adoption', name: '입양 가족', description: '법적 입양과 공동 친권을 통해 가족을 구성합니다.' },
  { id: 'guardianship', name: '후견·보호 가족', description: '전쟁고아·친족·피보호자의 후견과 교육을 책임집니다.' },
];

const genderLabels: Record<GenderIdentity, string> = {
  woman: '여성',
  man: '남성',
  nonbinary: '논바이너리',
  private: '공개하지 않음',
};

const orientationLabels: Record<OrientationId, string> = {
  heterosexual: '이성애',
  'gay-lesbian': '동성애',
  bisexual: '양성애',
  pansexual: '범성애',
  asexual: '무성애 스펙트럼',
  private: '공개하지 않음·직접 선택',
};

const nationCandidateNames: Record<NationId, [string, string, string]> = {
  britain: ['엘리너 애시포드', '토머스 웨스트', '로언 헤일'],
  usa: ['마거릿 리드', '대니얼 브룩스', '에이버리 모건'],
  ussr: ['안나 볼코바', '미하일 소콜로프', '사샤 레베데프'],
  germany: ['클라라 포겔', '요하네스 베버', '알렉스 노이만'],
  japan: ['하야시 아야', '나카무라 마사토', '미즈키 아키라'],
  china: ['린슈잉', '천웨이', '뤄안'],
  india: ['아샤 메흐타', '아룬 카푸르', '키란 세티'],
  freefrance: ['클레르 모로', '뤼크 베르나르', '카미유 로랑'],
  italy: ['루치아 비앙키', '마테오 로시', '안드레아 콘티'],
  korea: ['윤서진', '박도현', '한별'],
  vietnam: ['응우옌 란', '쩐 민', '레 안'],
  indonesia: ['사리 푸트리', '아디 산토소', '디안 프라타마'],
  philippines: ['마리아 산토스', '안드레스 레예스', '알렉스 크루즈'],
};

const candidateProfessions = [
  ['교육·언론 활동가', '외교·법률 실무자', '예술·시민사회 조직가'],
  ['의료·구호 전문가', '산업·기술 행정가', '연구·문화 기획자'],
  ['지역사회 지도자', '국제기구 연락관', '인권·기록 활동가'],
] as const;

const candidateBackgrounds = [
  '전쟁과 재건을 통과한 민간 네트워크에서 독자적인 경력을 쌓았습니다.',
  '공직과 사생활의 경계를 중시하며 자신의 직업을 포기하지 않으려 합니다.',
  '국경을 넘는 시민사회와 문화 교류를 통해 대체역사의 새로운 가족상을 제안합니다.',
] as const;

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));

function addHistory(state: PersonalLifeState, record: PersonalLifeHistoryRecord): PersonalLifeHistoryRecord[] {
  return [record, ...state.history].slice(0, 80);
}

export function getGenderLabel(gender: GenderIdentity) {
  return genderLabels[gender];
}

export function getOrientationLabel(orientation: OrientationId) {
  return orientationLabels[orientation];
}

export function getFamilyLaw(lawId: FamilyLawId) {
  return familyLawDefinitions.find((law) => law.id === lawId) ?? familyLawDefinitions[0];
}

export function getUnionFormLabel(form: UnionForm | null) {
  if (form === 'marriage') return '법률혼';
  if (form === 'civil-partnership') return '시민결합';
  if (form === 'domestic-partnership') return '동거 동반자';
  if (form === 'private-commitment') return '비공개 서약';
  return '교제 중';
}

export function getVisibilityLabel(visibility: RelationshipVisibility) {
  return visibility === 'public' ? '공개' : visibility === 'private' ? '비공개' : '비밀';
}

export function getPairKindLabel(pairKind: PairKind) {
  return pairKind === 'same-gender' ? '동성 커플' : pairKind === 'different-gender' ? '이성 커플' : pairKind === 'gender-diverse' ? '성별 다양성 커플' : '관계 정보 비공개';
}

export function createPersonalLifeState(nationId: NationId): PersonalLifeState {
  return {
    version: 1,
    nationId,
    profile: {
      configured: false,
      gender: 'private',
      orientation: 'private',
      partnerTerm: 'auto',
      boundary: 'exclusive',
    },
    familyLawId: 'restrictive-code',
    activeRelationship: null,
    history: [],
    lastActivityWeek: null,
  };
}

export function normalizePersonalLifeState(value: unknown, nationId: NationId): PersonalLifeState {
  const fallback = createPersonalLifeState(nationId);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<PersonalLifeState>;
  const validLaw = familyLawDefinitions.some((law) => law.id === candidate.familyLawId);
  const active = candidate.activeRelationship && typeof candidate.activeRelationship === 'object'
    ? candidate.activeRelationship
    : null;
  const history = Array.isArray(candidate.history) ? candidate.history.slice(0, 80) : [];
  const lastActivityWeek = typeof candidate.lastActivityWeek === 'number' && Number.isFinite(candidate.lastActivityWeek) && candidate.lastActivityWeek >= 0
    ? Math.floor(candidate.lastActivityWeek)
    : history.reduce<number | null>((latest, record) => {
      const isActivity = /^(courtship-|union-|relationship-action-|separation-|family-plan-)/.test(record.id);
      return isActivity && Number.isFinite(record.week) && record.week >= 0 ? Math.max(latest ?? 0, Math.floor(record.week)) : latest;
    }, null);
  return {
    ...fallback,
    ...candidate,
    version: 1,
    nationId,
    profile: { ...fallback.profile, ...(candidate.profile ?? {}) },
    familyLawId: validLaw ? candidate.familyLawId! : fallback.familyLawId,
    activeRelationship: active,
    history,
    lastActivityWeek,
  };
}

export function getPersonalLifeActivityAvailability(state: PersonalLifeState, week: number) {
  const remaining = state.lastActivityWeek != null && state.lastActivityWeek >= week ? 0 : 1;
  return {
    allowed: remaining > 0,
    remaining,
    limit: 1,
    nextAvailableWeek: remaining > 0 ? week : state.lastActivityWeek! + 1,
    reason: remaining > 0
      ? '이번 주 개인·가족 활동 1회 가능 · 교제·결합·돌봄·가족계획이 함께 사용합니다.'
      : '이번 주 개인·가족 활동 시간을 사용했습니다. 다음 주에 다시 1회 활동할 수 있습니다.',
  };
}

export function configurePersonalIdentity(state: PersonalLifeState, profile: Omit<PersonalIdentityProfile, 'configured'>, week = 0): PersonalLifeState {
  if (state.activeRelationship) return state;
  return {
    ...state,
    profile: { ...profile, configured: true },
    history: addHistory(state, {
      id: `identity-${week}-${state.history.length}`,
      week,
      title: '개인 관계 원칙 설정',
      detail: `${getGenderLabel(profile.gender)} · ${getOrientationLabel(profile.orientation)} · ${profile.boundary === 'exclusive' ? '배타적 관계' : profile.boundary === 'negotiated' ? '합의형 관계' : profile.boundary === 'companionate' ? '동반자 관계' : '사생활 비공개'}를 기준으로 관계 후보를 찾습니다.`,
      tone: 'neutral',
    }),
  };
}

function isAttractedTo(profile: PersonalIdentityProfile, candidateGender: RelationshipCandidate['gender']) {
  if (profile.orientation === 'bisexual' || profile.orientation === 'pansexual' || profile.orientation === 'asexual' || profile.orientation === 'private') return true;
  if (profile.gender === 'private') return true;
  if (profile.orientation === 'gay-lesbian') return profile.gender === candidateGender;
  if (profile.gender === 'nonbinary') return candidateGender !== 'nonbinary';
  return (profile.gender === 'woman' && candidateGender === 'man') || (profile.gender === 'man' && candidateGender === 'woman');
}

export function derivePairKind(profileGender: GenderIdentity, candidateGender: RelationshipCandidate['gender']): PairKind {
  if (profileGender === 'private') return 'private';
  if (profileGender === 'nonbinary' || candidateGender === 'nonbinary') return 'gender-diverse';
  return profileGender === candidateGender ? 'same-gender' : 'different-gender';
}

export function getPartnerTerm(candidateGender: RelationshipCandidate['gender'], preference: PartnerTermPreference) {
  if (preference === 'wife') return '아내';
  if (preference === 'husband') return '남편';
  if (preference === 'partner') return '동반자';
  if (preference === 'spouse') return '배우자';
  return candidateGender === 'woman' ? '아내' : candidateGender === 'man' ? '남편' : '배우자';
}

export function getPersonalRelationshipCandidates(
  state: PersonalLifeState,
  countries: Array<{ id: string; name: string; relationValue: number }>,
): RelationshipCandidate[] {
  if (!state.profile.configured) return [];
  return countries.flatMap((country, countryIndex) => {
    const names = nationCandidateNames[country.id as NationId] ?? [`${country.name} 여성 후보`, `${country.name} 남성 후보`, `${country.name} 중립 후보`];
    const professionSet = candidateProfessions[countryIndex % candidateProfessions.length];
    return (['woman', 'man', 'nonbinary'] as const).map((gender, genderIndex): RelationshipCandidate => ({
      id: `partner-${country.id}-${gender}`,
      nationId: country.id,
      nationName: country.name,
      name: names[genderIndex],
      gender,
      orientation: gender === 'nonbinary' ? 'pansexual' : 'bisexual',
      pronouns: gender === 'woman' ? '그녀' : gender === 'man' ? '그' : '그 사람',
      profession: professionSet[genderIndex],
      background: candidateBackgrounds[genderIndex],
      values: genderIndex === 0 ? ['돌봄', '공공성', '개혁'] : genderIndex === 1 ? ['책임', '전문성', '자율'] : ['창의', '연대', '다양성'],
      relationshipStyle: genderIndex === 0 ? '대화와 공동생활 중시' : genderIndex === 1 ? '독립된 경력과 상호 지원' : '합의된 경계와 유연한 동반자 관계',
      preferredVisibility: genderIndex === 0 ? 'private' : genderIndex === 1 ? 'public' : 'private',
      publicStanding: clamp(42 + country.relationValue * .35 + genderIndex * 5),
      relationValue: clamp(country.relationValue),
      fictionalComposite: true,
    })).filter((candidate) => isAttractedTo(state.profile, candidate.gender));
  });
}

export function beginPersonalRelationship(
  state: PersonalLifeState,
  candidate: RelationshipCandidate,
  context: PersonalLifeContext,
): PersonalLifeActionResult | null {
  if (!state.profile.configured || state.activeRelationship || context.politicalPower < 4 || context.treasury < 8) return null;
  if (!getPersonalLifeActivityAvailability(state, context.week).allowed) return null;
  const pairKind = derivePairKind(state.profile.gender, candidate.gender);
  const bond = Math.round(clamp(48 + candidate.relationValue * .12 + candidate.publicStanding * .05, 50, 68));
  const relationship: PersonalRelationship = {
    id: `relationship-${context.week}-${candidate.id}`,
    candidate,
    stage: 'courtship',
    unionForm: null,
    visibility: candidate.preferredVisibility,
    pairKind,
    partnerTerm: getPartnerTerm(candidate.gender, state.profile.partnerTerm),
    startedWeek: context.week,
    formalizedWeek: null,
    weeksTogether: 0,
    bond,
    trust: Math.round(clamp(bond - 4 + (state.profile.boundary === 'negotiated' ? 4 : 0))),
    strain: context.role.tier <= 2 ? 18 : 12,
    publicSupport: candidate.publicStanding,
    exposure: candidate.preferredVisibility === 'public' ? 34 : 12,
    legalRecognition: 'none',
    familyPlan: 'undecided',
    dependents: 0,
  };
  return {
    state: {
      ...state,
      activeRelationship: relationship,
      lastActivityWeek: context.week,
      history: addHistory(state, {
        id: `courtship-${context.week}-${candidate.id}`,
        week: context.week,
        title: `${candidate.name}와 교제 시작`,
        detail: `${candidate.profession}인 ${candidate.name}와 관계를 시작했습니다. 실제 역사 인물의 사생활을 추정하지 않는 가상 복합 인물입니다.`,
        tone: 'good',
      }),
    },
    politicalPowerDelta: -4,
    treasuryDelta: -8,
    stabilityDelta: 0,
    legitimacyDelta: 0,
    unrestDelta: 0,
    title: `새로운 관계 — ${candidate.name}`,
    detail: `${candidate.name}와 교제를 시작했습니다. 유대 ${bond}, 신뢰 ${relationship.trust}, 공개 범위 ${getVisibilityLabel(relationship.visibility)}. 다음 단계는 관계를 돌본 뒤 동거·시민결합·결혼 중 하나를 선택하는 것입니다.`,
  };
}

function getLegalRecognition(lawId: FamilyLawId, pairKind: PairKind, unionForm: UnionForm) {
  const law = getFamilyLaw(lawId);
  const equalityRequired = pairKind === 'same-gender' || pairKind === 'gender-diverse' || pairKind === 'private';
  if (unionForm === 'marriage') return equalityRequired ? (law.sameGenderMarriage ? 'full' : 'none') : 'full';
  if (unionForm === 'civil-partnership') return law.civilPartnership ? 'full' : 'none';
  if (unionForm === 'domestic-partnership') return lawId === 'restrictive-code' ? 'none' : law.civilPartnership ? 'full' : 'partial';
  return lawId === 'restrictive-code' ? 'none' : 'partial';
}

export function canFormalizeUnion(state: PersonalLifeState, unionForm: UnionForm) {
  const relationship = state.activeRelationship;
  if (!relationship) return { allowed: false, reason: '먼저 관계 후보와 교제를 시작해야 합니다.' };
  if (relationship.stage !== 'courtship') return { allowed: false, reason: '이미 관계 형태를 확정했습니다.' };
  if (relationship.bond < 50 || relationship.trust < 45) return { allowed: false, reason: '유대 50·신뢰 45가 필요합니다.' };
  const recognition = getLegalRecognition(state.familyLawId, relationship.pairKind, unionForm);
  if (recognition === 'none' && (unionForm === 'marriage' || unionForm === 'civil-partnership')) {
    return { allowed: false, reason: unionForm === 'marriage' ? '현재 가족법은 이 커플의 법률혼을 승인하지 않습니다.' : '시민결합법이 필요합니다.' };
  }
  return { allowed: true, reason: recognition === 'full' ? '완전한 법적 보호' : recognition === 'partial' ? '제한적 보호' : '법적 보호 없음' };
}

export function formalizePersonalUnion(
  state: PersonalLifeState,
  unionForm: UnionForm,
  visibility: RelationshipVisibility,
  context: PersonalLifeContext,
): PersonalLifeActionResult | null {
  const relationship = state.activeRelationship;
  const eligibility = canFormalizeUnion(state, unionForm);
  if (!relationship || !eligibility.allowed) return null;
  if (!getPersonalLifeActivityAvailability(state, context.week).allowed) return null;
  const politicalCost = unionForm === 'marriage' ? 12 : unionForm === 'civil-partnership' ? 9 : 5;
  const treasuryCost = unionForm === 'marriage' ? 36 : unionForm === 'civil-partnership' ? 20 : unionForm === 'domestic-partnership' ? 12 : 6;
  if (context.politicalPower < politicalCost || context.treasury < treasuryCost) return null;
  const recognition = getLegalRecognition(state.familyLawId, relationship.pairKind, unionForm);
  const publicEffect = visibility === 'public' ? (recognition === 'full' ? 2 : -2) : 0;
  const nextRelationship: PersonalRelationship = {
    ...relationship,
    stage: unionForm === 'marriage' ? 'married' : 'committed',
    unionForm,
    visibility,
    formalizedWeek: context.week,
    bond: clamp(relationship.bond + 7),
    trust: clamp(relationship.trust + 8),
    strain: clamp(relationship.strain - 3),
    exposure: clamp(relationship.exposure + (visibility === 'public' ? 18 : visibility === 'secret' ? -8 : 0)),
    legalRecognition: recognition,
  };
  const label = getUnionFormLabel(unionForm);
  return {
    state: {
      ...state,
      activeRelationship: nextRelationship,
      lastActivityWeek: context.week,
      history: addHistory(state, {
        id: `union-${context.week}-${relationship.id}`,
        week: context.week,
        title: `${label} 성립 — ${relationship.candidate.name}`,
        detail: `${getPairKindLabel(relationship.pairKind)}가 ${getVisibilityLabel(visibility)} 방식으로 ${label}을 선택했습니다. 법적 보호는 ${recognition === 'full' ? '완전' : recognition === 'partial' ? '제한적' : '없음'}입니다.`,
        tone: recognition === 'none' ? 'neutral' : 'good',
      }),
    },
    politicalPowerDelta: -politicalCost,
    treasuryDelta: -treasuryCost,
    stabilityDelta: recognition === 'full' ? 1 : 0,
    legitimacyDelta: publicEffect,
    unrestDelta: visibility === 'public' && recognition === 'none' ? 2 : 0,
    relationDelta: relationship.candidate.nationId !== state.nationId && visibility === 'public'
      ? { nationId: relationship.candidate.nationId, value: recognition === 'full' ? 3 : 1 }
      : undefined,
    title: `${relationship.partnerTerm}와 ${label} 성립`,
    detail: `${relationship.candidate.name}와 ${label}을 선택했습니다. 관계는 ${getVisibilityLabel(visibility)}, 법적 보호는 ${recognition === 'full' ? '완전' : recognition === 'partial' ? '제한적' : '없음'}입니다. 유대 +7, 신뢰 +8.`,
  };
}

export function canReformFamilyLaw(state: PersonalLifeState, lawId: FamilyLawId, context: PersonalLifeContext) {
  const law = getFamilyLaw(lawId);
  if (state.familyLawId === lawId) return { allowed: false, reason: '현재 시행 중인 가족법입니다.' };
  if (!(context.role.tier === 1 || (context.role.branch === 'politics' && context.role.tier <= 2))) return { allowed: false, reason: '국가원수 또는 2단계 이상 정치 보직의 법안 발의 권한이 필요합니다.' };
  if (context.politicalPower < law.politicalCost) return { allowed: false, reason: `정치력 ${law.politicalCost}가 필요합니다.` };
  if (context.treasury < law.treasuryCost) return { allowed: false, reason: `행정비 ${law.treasuryCost}M이 필요합니다.` };
  if (context.education < law.requiredEducation) return { allowed: false, reason: `교육 수준 ${law.requiredEducation}이 필요합니다.` };
  if (context.institutionalCapacity < law.requiredInstitutions) return { allowed: false, reason: `제도 역량 ${law.requiredInstitutions}가 필요합니다.` };
  if (context.legitimacy < law.requiredLegitimacy) return { allowed: false, reason: `정통성 ${law.requiredLegitimacy}가 필요합니다.` };
  return { allowed: true, reason: '법안 발의 가능' };
}

export function reformFamilyLaw(state: PersonalLifeState, lawId: FamilyLawId, context: PersonalLifeContext): PersonalLifeActionResult | null {
  const eligibility = canReformFamilyLaw(state, lawId, context);
  if (!eligibility.allowed) return null;
  const law = getFamilyLaw(lawId);
  const oldIndex = familyLawDefinitions.findIndex((candidate) => candidate.id === state.familyLawId);
  const nextIndex = familyLawDefinitions.findIndex((candidate) => candidate.id === lawId);
  const reformDistance = nextIndex - oldIndex;
  const eraResistance = clamp(72 - Math.max(0, context.year - 1942) * .55 - context.education * .28 - context.institutionalCapacity * .18, 0, 70);
  const unrestDelta = reformDistance > 0 ? Math.round(clamp(eraResistance / 12 + reformDistance, 1, 8)) : Math.round(clamp(Math.abs(reformDistance) * 2, 1, 7));
  const legitimacyDelta = reformDistance > 0 ? Math.round(clamp(2 + context.education / 35, 2, 5)) : -2;
  const active = state.activeRelationship;
  const upgradedRecognition = active?.unionForm ? getLegalRecognition(lawId, active.pairKind, active.unionForm) : active?.legalRecognition;
  return {
    state: {
      ...state,
      familyLawId: lawId,
      activeRelationship: active ? { ...active, legalRecognition: upgradedRecognition ?? active.legalRecognition } : null,
      history: addHistory(state, {
        id: `family-law-${context.week}-${lawId}`,
        week: context.week,
        title: `가족법 개정 — ${law.name}`,
        detail: `${law.principle}. ${context.year}년의 교육·제도·사회 저항을 반영해 사회 불안 ${unrestDelta}가 발생했습니다.`,
        tone: reformDistance > 0 ? 'good' : 'neutral',
      }),
    },
    politicalPowerDelta: -law.politicalCost,
    treasuryDelta: -law.treasuryCost,
    stabilityDelta: reformDistance > 0 && eraResistance < 25 ? 1 : -Math.min(2, Math.ceil(unrestDelta / 4)),
    legitimacyDelta,
    unrestDelta,
    title: `가족법 개정 — ${law.name}`,
    detail: `${law.principle} 원칙을 법제화했습니다. 역사적 시대 압력 ${Math.round(eraResistance)}/100 · 정통성 ${legitimacyDelta >= 0 ? '+' : ''}${legitimacyDelta} · 사회 불안 +${unrestDelta}. 대체역사에서는 충분한 교육과 제도 역량으로 실제 역사보다 빠른 개혁도 가능합니다.`,
  };
}

export function resolvePersonalLifeAction(state: PersonalLifeState, actionId: PersonalLifeActionId, context: PersonalLifeContext): PersonalLifeActionResult | null {
  const relationship = state.activeRelationship;
  if (!relationship) return null;
  if (!getPersonalLifeActivityAvailability(state, context.week).allowed) return null;
  const costs: Record<PersonalLifeActionId, [number, number]> = {
    'spend-time': [0, 6],
    'discuss-boundaries': [2, 0],
    'support-career': [3, 10],
    'public-appearance': [4, 0],
    'protect-privacy': [6, 4],
    separate: [8, 0],
  };
  const [politicalCost, treasuryCost] = costs[actionId];
  if (context.politicalPower < politicalCost || context.treasury < treasuryCost) return null;
  if (actionId === 'separate') {
    return {
      state: {
        ...state,
        activeRelationship: null,
        lastActivityWeek: context.week,
        history: addHistory(state, {
          id: `separation-${context.week}-${relationship.id}`,
          week: context.week,
          title: `${relationship.candidate.name}와 관계 종료`,
          detail: `${relationship.weeksTogether}주 동안 이어진 관계를 합의 아래 정리했습니다. 유대 ${Math.round(relationship.bond)}, 신뢰 ${Math.round(relationship.trust)}의 기록은 개인사에 남습니다.`,
          tone: 'neutral',
        }),
      },
      politicalPowerDelta: -politicalCost,
      treasuryDelta: 0,
      stabilityDelta: -1,
      legitimacyDelta: relationship.visibility === 'public' ? -1 : 0,
      unrestDelta: 0,
      title: `관계 종료 — ${relationship.candidate.name}`,
      detail: '관계를 합의 아래 종료했습니다. 이후 새로운 관계를 시작할 수 있습니다.',
    };
  }
  const effects: Record<Exclude<PersonalLifeActionId, 'separate'>, { bond: number; trust: number; strain: number; support: number; exposure: number; visibility?: RelationshipVisibility }> = {
    'spend-time': { bond: 8, trust: 3, strain: -10, support: 0, exposure: -2 },
    'discuss-boundaries': { bond: 3, trust: 9, strain: -7, support: 0, exposure: 0 },
    'support-career': { bond: 5, trust: 8, strain: -3, support: 6, exposure: 2 },
    'public-appearance': { bond: 2, trust: 2, strain: 2, support: 9, exposure: 14, visibility: 'public' },
    'protect-privacy': { bond: 1, trust: 5, strain: -5, support: -2, exposure: -16, visibility: 'private' },
  };
  const effect = effects[actionId];
  const nextRelationship: PersonalRelationship = {
    ...relationship,
    bond: clamp(relationship.bond + effect.bond),
    trust: clamp(relationship.trust + effect.trust),
    strain: clamp(relationship.strain + effect.strain),
    publicSupport: clamp(relationship.publicSupport + effect.support),
    exposure: clamp(relationship.exposure + effect.exposure),
    visibility: effect.visibility ?? relationship.visibility,
  };
  const actionName = personalLifeActionDefinitions.find((action) => action.id === actionId)?.name ?? actionId;
  const unrecognizedPublicRisk = actionId === 'public-appearance' && relationship.legalRecognition === 'none' && relationship.pairKind !== 'different-gender';
  return {
    state: {
      ...state,
      activeRelationship: nextRelationship,
      lastActivityWeek: context.week,
      history: addHistory(state, {
        id: `relationship-action-${context.week}-${actionId}`,
        week: context.week,
        title: actionName,
        detail: `유대 ${Math.round(relationship.bond)}→${Math.round(nextRelationship.bond)} · 신뢰 ${Math.round(relationship.trust)}→${Math.round(nextRelationship.trust)} · 긴장 ${Math.round(relationship.strain)}→${Math.round(nextRelationship.strain)}`,
        tone: unrecognizedPublicRisk ? 'bad' : 'good',
      }),
    },
    politicalPowerDelta: -politicalCost,
    treasuryDelta: -treasuryCost,
    stabilityDelta: actionId === 'spend-time' || actionId === 'discuss-boundaries' ? 1 : 0,
    legitimacyDelta: actionId === 'public-appearance' ? (unrecognizedPublicRisk ? -1 : 2) : actionId === 'support-career' ? 1 : 0,
    unrestDelta: unrecognizedPublicRisk ? 2 : 0,
    title: `${actionName} — ${relationship.candidate.name}`,
    detail: `유대 ${effect.bond >= 0 ? '+' : ''}${effect.bond}, 신뢰 ${effect.trust >= 0 ? '+' : ''}${effect.trust}, 긴장 ${effect.strain >= 0 ? '+' : ''}${effect.strain}, 노출 ${effect.exposure >= 0 ? '+' : ''}${effect.exposure}.`,
  };
}

export function chooseFamilyPlan(state: PersonalLifeState, familyPlan: FamilyPlanId, context: PersonalLifeContext): PersonalLifeActionResult | null {
  const relationship = state.activeRelationship;
  if (!relationship || relationship.stage === 'courtship') return null;
  if (relationship.familyPlan === familyPlan || !getPersonalLifeActivityAvailability(state, context.week).allowed) return null;
  const law = getFamilyLaw(state.familyLawId);
  if (familyPlan === 'adoption' && !law.jointAdoption) return null;
  const politicalCost = familyPlan === 'adoption' ? 8 : familyPlan === 'guardianship' ? 5 : 2;
  const treasuryCost = familyPlan === 'adoption' ? 18 : familyPlan === 'guardianship' ? 12 : familyPlan === 'birth-parenthood' ? 14 : 0;
  if (context.politicalPower < politicalCost || context.treasury < treasuryCost) return null;
  const dependents = familyPlan === 'no-children' || familyPlan === 'undecided' ? 0 : 1;
  const definition = familyPlanDefinitions.find((plan) => plan.id === familyPlan) ?? familyPlanDefinitions[0];
  return {
    state: {
      ...state,
      activeRelationship: { ...relationship, familyPlan, dependents, bond: clamp(relationship.bond + (dependents ? 3 : 1)), strain: clamp(relationship.strain + (dependents ? 4 : -2)) },
      lastActivityWeek: context.week,
      history: addHistory(state, {
        id: `family-plan-${context.week}-${familyPlan}`,
        week: context.week,
        title: `가족 계획 — ${definition.name}`,
        detail: definition.description,
        tone: 'good',
      }),
    },
    politicalPowerDelta: -politicalCost,
    treasuryDelta: -treasuryCost,
    stabilityDelta: dependents ? 1 : 0,
    legitimacyDelta: relationship.visibility === 'public' && relationship.legalRecognition === 'full' ? 1 : 0,
    unrestDelta: 0,
    title: `가족 계획 — ${definition.name}`,
    detail: `${definition.description} 부양 가족 ${dependents}명 · 초기 비용 ${treasuryCost}M.`,
  };
}

export function getEraFamilyClimate(year: number) {
  if (year < 1969) return { label: '국가 통제와 비가시성의 시대', detail: '법적 보호가 거의 없고 공직자의 사생활은 보안기관·언론·가문 정치의 압력을 받습니다.', pressure: 72 };
  if (year < 1990) return { label: '해방운동과 비범죄화의 시대', detail: '시민운동과 인권 담론이 성장하지만 법적 인정은 국가마다 크게 갈립니다.', pressure: 52 };
  if (year < 2010) return { label: '시민결합과 제도 인정의 시대', detail: '등록 파트너십·차별금지·공동재산권이 정치 의제로 부상합니다.', pressure: 31 };
  return { label: '혼인평등과 가족 다양성의 시대', detail: '혼인·양육의 동등권과 종교·지역 자율성의 경계가 주요 정치 쟁점입니다.', pressure: 16 };
}

export function advancePersonalLifeWeek(
  state: PersonalLifeState,
  context: { week: number; stability: number; publicHealthPressure: number; roleTier: number },
): PersonalLifeWeeklyEffects {
  const relationship = state.activeRelationship;
  if (!relationship) return { state, weeklyCost: 0, legitimacy: 0, unrest: 0, stability: 0, note: '현재 동반자 관계 없음' };
  const law = getFamilyLaw(state.familyLawId);
  const workloadStrain = context.roleTier <= 2 ? .11 : .06;
  const crisisStrain = context.publicHealthPressure * .002 + Math.max(0, 48 - context.stability) * .003;
  const householdRecovery = relationship.trust >= 65 ? .1 : .04;
  const repressionPressure = relationship.pairKind !== 'different-gender' && relationship.legalRecognition === 'none'
    ? (relationship.visibility === 'public' ? .12 : relationship.visibility === 'secret' ? .08 : .04)
    : 0;
  const nextRelationship: PersonalRelationship = {
    ...relationship,
    weeksTogether: relationship.weeksTogether + 1,
    bond: clamp(relationship.bond + (relationship.strain < 55 ? .035 : -.045) + householdRecovery * .2),
    trust: clamp(relationship.trust + (state.profile.boundary === 'negotiated' ? .035 : .018) - repressionPressure * .08),
    strain: clamp(relationship.strain + workloadStrain + crisisStrain + repressionPressure - householdRecovery),
    exposure: clamp(relationship.exposure + (relationship.visibility === 'secret' ? .035 : relationship.visibility === 'public' ? -.02 : 0)),
    legalRecognition: relationship.unionForm ? getLegalRecognition(state.familyLawId, relationship.pairKind, relationship.unionForm) : 'none',
  };
  const weeklyCost = Number((.25 + relationship.dependents * .18 + (relationship.visibility === 'public' ? .12 : 0)).toFixed(2));
  const legitimacy = relationship.visibility === 'public' && nextRelationship.legalRecognition === 'full'
    ? (nextRelationship.publicSupport - 50) * .0008
    : 0;
  const unrest = repressionPressure * .08;
  const stability = nextRelationship.bond >= 70 && nextRelationship.strain < 45 ? .015 : nextRelationship.strain >= 75 ? -.03 : 0;
  return {
    state: { ...state, activeRelationship: nextRelationship },
    weeklyCost,
    legitimacy,
    unrest,
    stability,
    note: `${nextRelationship.partnerTerm} ${nextRelationship.candidate.name} · 유대 ${Math.round(nextRelationship.bond)} · 신뢰 ${Math.round(nextRelationship.trust)} · 긴장 ${Math.round(nextRelationship.strain)} · ${law.name}`,
  };
}
