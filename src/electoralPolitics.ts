import { getCampaignYearForWeek } from './campaignCalendar';
import type { CareerRole, NationId } from './types';

export type ExecutiveModelId = 'presidential' | 'semi-presidential' | 'parliamentary' | 'assembly' | 'crown-parliament';
export type VotingSystemId = 'electoral-college' | 'two-round' | 'first-past-the-post' | 'proportional' | 'mixed-member';
export type ElectionType = 'presidential' | 'parliamentary' | 'referendum' | 'local';
export type ElectionCampaignStage = 'nomination' | 'campaign' | 'debate' | 'voting' | 'runoff' | 'certification';
export type ElectionCampaignActionId = 'mass-rally' | 'radio-address' | 'policy-manifesto' | 'public-debate' | 'fundraising-drive' | 'coalition-pact' | 'local-endorsement' | 'integrity-commission';
export type ReferendumTopicId = 'presidential-constitution' | 'parliamentary-charter' | 'federal-autonomy' | 'universal-suffrage' | 'national-development-plan' | 'peace-settlement';
export type ElectionMediaEraId = 'print-radio' | 'broadcast-party' | 'television-polling' | 'platform-data' | 'synthetic-trust';

export interface ElectionEraProfile {
  id: ElectionMediaEraId;
  name: string;
  period: string;
  dominantChannel: string;
  trustRisk: string;
  description: string;
  momentumMultiplier: number;
  turnoutMultiplier: number;
  integrityMultiplier: number;
}

export interface ElectoralCandidate {
  id: string;
  name: string;
  party: string;
  ideology: string;
  homeRegion: string;
  historicalOffice: string;
  charisma: number;
  organization: number;
  policy: number;
  integrity: number;
  baseSupport: number;
  color: string;
}

export interface ElectionRegion {
  id: string;
  name: string;
  principalCity: string;
  electorate: number;
  seats: number;
  electors: number;
  urbanity: number;
  laborStrength: number;
  establishmentStrength: number;
  turnoutBase: number;
}

export interface ElectionCampaignActionDefinition {
  id: ElectionCampaignActionId;
  name: string;
  description: string;
  politicalCost: number;
  treasuryCost: number;
  minimumTier: CareerRole['tier'];
  branch: CareerRole['branch'] | 'any';
  effect: string;
}

export interface ElectionCampaignActionRecord {
  id: string;
  actionId: ElectionCampaignActionId;
  week: number;
  regionId: string | null;
  detail: string;
  momentumDelta: number;
  integrityDelta: number;
  turnoutDelta: number;
}

export interface ActiveElectionCampaign {
  id: string;
  type: ElectionType;
  stage: ElectionCampaignStage;
  startedWeek: number;
  electionWeek: number;
  round: 1 | 2;
  candidateIds: string[];
  playerCandidateId: string;
  referendumTopicId: ReferendumTopicId | null;
  momentum: Record<string, number>;
  regionalBoosts: Record<string, number>;
  campaignFunds: number;
  turnoutProjection: number;
  integrity: number;
  polarization: number;
  actions: ElectionCampaignActionRecord[];
}

export interface CandidateElectionResult {
  candidateId: string;
  name: string;
  party: string;
  votes: number;
  voteShare: number;
  seats: number;
  electors: number;
}

export interface RegionalElectionResult {
  regionId: string;
  regionName: string;
  principalCity: string;
  turnout: number;
  winnerCandidateId: string;
  winnerName: string;
  winnerParty: string;
  margin: number;
  electors: number;
  seats: number;
}

export interface MayorElectionResult {
  city: string;
  winnerName: string;
  party: string;
  voteShare: number;
  turnout: number;
  alignment: 'government' | 'opposition' | 'independent';
}

export interface ElectionResult {
  id: string;
  type: ElectionType;
  week: number;
  round: 1 | 2;
  title: string;
  winnerCandidateId: string | null;
  winnerName: string;
  winnerParty: string;
  playerWon: boolean;
  turnout: number;
  integrity: number;
  candidateResults: CandidateElectionResult[];
  regionalResults: RegionalElectionResult[];
  mayorResults: MayorElectionResult[];
  referendum: { topicId: ReferendumTopicId; question: string; yesShare: number; passed: boolean } | null;
  summary: string;
  consequence: string;
}

export interface ElectoralPoliticsState {
  version: 1;
  nationId: NationId;
  executiveModelId: ExecutiveModelId;
  votingSystemId: VotingSystemId;
  candidates: ElectoralCandidate[];
  regions: ElectionRegion[];
  governingCandidateId: string;
  activeCampaign: ActiveElectionCampaign | null;
  nextPresidentialWeek: number;
  nextParliamentaryWeek: number;
  nextLocalWeek: number;
  participation: number;
  electoralIntegrity: number;
  partyFragmentation: number;
  campaignHistory: ElectionResult[];
  passedReferendums: ReferendumTopicId[];
}

export interface ElectoralContext {
  week: number;
  role: CareerRole;
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  mandateScore: number;
  unrest: number;
  education: number;
  institutionalCapacity: number;
  inflation: number;
  publicConfidence: number;
}

export interface ElectoralActionResult {
  state: ElectoralPoliticsState;
  politicalPowerDelta: number;
  treasuryDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  title: string;
  detail: string;
}

export interface ElectoralAdvanceEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  cause: string;
  consequence: string;
}

export interface ElectoralAdvanceResult {
  state: ElectoralPoliticsState;
  events: ElectoralAdvanceEvent[];
  politicalPowerDelta: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  playerWonElection: boolean;
}

export interface ReferendumDefinition {
  id: ReferendumTopicId;
  name: string;
  question: string;
  description: string;
  politicalCost: number;
  treasuryCost: number;
  minimumLegitimacy: number;
}

export const electionCampaignActions: ElectionCampaignActionDefinition[] = [
  { id: 'mass-rally', name: '대규모 지역 유세', description: '목표 지역에서 군중집회와 후보 연설을 열어 지지층을 결집합니다.', politicalCost: 3, treasuryCost: 18, minimumTier: 4, branch: 'any', effect: '목표 지역 +5 · 전국 기세 +2 · 투표율 +1' },
  { id: 'radio-address', name: '전국 라디오 연설', description: '전쟁·재건·민생을 하나의 서사로 묶어 전국 유권자에게 직접 호소합니다.', politicalCost: 5, treasuryCost: 28, minimumTier: 3, branch: 'politics', effect: '전국 기세 +4 · 부동층 설득' },
  { id: 'policy-manifesto', name: '공약집 발표', description: '재정 비용과 확인 시점을 명시한 산업·복지·외교 공약을 공개합니다.', politicalCost: 6, treasuryCost: 12, minimumTier: 3, branch: 'politics', effect: '정책 신뢰 +4 · 정통성 +1' },
  { id: 'public-debate', name: '후보 공개토론', description: '주요 후보와 생방송 토론을 벌입니다. 준비가 부족하면 역풍이 날 수 있습니다.', politicalCost: 7, treasuryCost: 8, minimumTier: 2, branch: 'politics', effect: '후보 능력에 따른 기세 -3~+7' },
  { id: 'fundraising-drive', name: '정치후원금 모금', description: '기업·노동조합·지역조직에서 선거자금을 모으되 정치자금 투명성 부담을 감수합니다.', politicalCost: 2, treasuryCost: 0, minimumTier: 4, branch: 'any', effect: '선거자금 +55M · 청렴도 -2' },
  { id: 'coalition-pact', name: '후보·정당 연대', description: '하위 후보와 공약·내각 자리를 교환해 결선 또는 의회 과반 연합을 만듭니다.', politicalCost: 10, treasuryCost: 24, minimumTier: 2, branch: 'politics', effect: '주요 후보 기세 +5 · 양극화 -3' },
  { id: 'local-endorsement', name: '시장 후보 공동유세', description: '주요 도시의 시장 후보와 중앙 공약을 묶어 지방 조직과 전국 선거를 연결합니다.', politicalCost: 4, treasuryCost: 14, minimumTier: 4, branch: 'any', effect: '목표 도시 +6 · 시장 후보 동반상승' },
  { id: 'integrity-commission', name: '독립 선거관리·감시단', description: '명부·개표·언론 접근·정치자금을 감시할 독립기구와 참관단을 지원합니다.', politicalCost: 5, treasuryCost: 36, minimumTier: 3, branch: 'any', effect: '선거 신뢰 +9 · 조작·불복 위험 감소' },
];

const electionEraProfiles: ElectionEraProfile[] = [
  { id: 'print-radio', name: '신문·라디오 동원정치', period: '1942–1949', dominantChannel: '정당지·라디오·대중집회', trustRisk: '배급·전시검열과 지역 조직의 편향', description: '정당 조직과 물리적 집회가 투표율을 만들고 라디오 연설이 전국 의제를 통합합니다.', momentumMultiplier: 1.02, turnoutMultiplier: 1.18, integrityMultiplier: 0.9 },
  { id: 'broadcast-party', name: '정당조직·방송 선거', period: '1950–1979', dominantChannel: '노동조합·지역지부·텔레비전', trustRisk: '국영방송 접근과 정치자금의 불균형', description: '대중정당의 지역 조직과 방송 시간이 후보의 전국적 신뢰를 좌우합니다.', momentumMultiplier: 1.08, turnoutMultiplier: 1.08, integrityMultiplier: 1 },
  { id: 'television-polling', name: '텔레비전·여론조사 시대', period: '1980–2004', dominantChannel: '생방송 토론·정치광고·전화조사', trustRisk: '막대한 광고비와 짧은 이미지 경쟁', description: '토론 준비와 미디어 대응이 큰 폭의 기세 변화를 만들지만 실수의 역풍도 커집니다.', momentumMultiplier: 1.16, turnoutMultiplier: 0.96, integrityMultiplier: 1.04 },
  { id: 'platform-data', name: '플랫폼·데이터 선거', period: '2005–2029', dominantChannel: '검색·소셜 플랫폼·현장 데이터', trustRisk: '불투명 표적광고·해킹·허위정보', description: '지역 조직과 데이터 표적화가 결합되고 선거관리·정보공간 방어가 핵심 쟁점이 됩니다.', momentumMultiplier: 1.2, turnoutMultiplier: 1.03, integrityMultiplier: 1.22 },
  { id: 'synthetic-trust', name: '합성매체·신뢰 인증 시대', period: '2030–2060', dominantChannel: '출처인증 생중계·시민숙의·AI 검증', trustRisk: '합성인물·자동여론·인증체계 장악', description: '도달률보다 발화자의 진위와 알고리즘 감사를 증명하는 능력이 선거 승복을 결정합니다.', momentumMultiplier: 1.08, turnoutMultiplier: 1.06, integrityMultiplier: 1.38 },
];

const eraActionNames: Record<ElectionMediaEraId, Partial<Record<ElectionCampaignActionId, [string, string]>>> = {
  'print-radio': {
    'radio-address': ['전국 라디오 노변연설', '전쟁·배급·재건의 방향을 전파 수신권 전체에 직접 설명합니다.'],
    'integrity-commission': ['개표 참관·명부 조사단', '지역별 명부와 투표함, 언론 접근을 교차 감시합니다.'],
  },
  'broadcast-party': {
    'mass-rally': ['노동·지역조직 순회유세', '대중정당 지부와 노동·농민조직을 순회해 현장 동원력을 확장합니다.'],
    'radio-address': ['전국 방송 정견연설', '라디오와 텔레비전의 법정 방송시간으로 부동층을 설득합니다.'],
  },
  'television-polling': {
    'radio-address': ['프라임타임 TV 연설', '전국 생방송과 후속 뉴스 보도로 후보의 중심 메시지를 각인합니다.'],
    'public-debate': ['전국 생방송 후보토론', '카메라 앞의 정책 검증과 즉각 여론조사로 승패가 크게 움직입니다.'],
    'fundraising-drive': ['미디어 광고 모금전', '방송광고 비용을 충당하되 대형 후원자 의존과 공시 부담을 감수합니다.'],
  },
  'platform-data': {
    'radio-address': ['전 플랫폼 동시 생중계', '검색·영상·소셜 채널에 같은 메시지를 배포하고 반응을 실시간 추적합니다.'],
    'mass-rally': ['현장·디지털 결합 유세', '목표 지역 집회와 자원봉사자 데이터 동원을 하나의 작전으로 묶습니다.'],
    'integrity-commission': ['플랫폼·선거망 방어위원회', '정치광고 출처, 해킹, 허위정보와 개표망을 독립적으로 감사합니다.'],
  },
  'synthetic-trust': {
    'radio-address': ['출처인증 전 지구 생중계', '후보의 실제 발화와 정책 근거를 암호학적 출처 표지와 함께 공개합니다.'],
    'public-debate': ['인간 후보·AI 검증 숙의', '후보 토론을 시민 패널과 독립 모델 감사가 실시간 검증합니다.'],
    'integrity-commission': ['합성신원·알고리즘 감사단', '합성인물, 자동여론, 추천 알고리즘과 개표 인증의 독립 감사권을 보장합니다.'],
  },
};

export function getElectionEraProfile(week: number): ElectionEraProfile {
  const year = getCampaignYearForWeek(week);
  return year < 1950 ? electionEraProfiles[0] : year < 1980 ? electionEraProfiles[1] : year < 2005 ? electionEraProfiles[2] : year < 2030 ? electionEraProfiles[3] : electionEraProfiles[4];
}

export function getElectionActionPresentation(action: ElectionCampaignActionDefinition, week: number) {
  const era = getElectionEraProfile(week);
  const override = eraActionNames[era.id][action.id];
  return {
    ...action,
    name: override?.[0] ?? action.name,
    description: override?.[1] ?? action.description,
    era,
  };
}

export const referendumDefinitions: ReferendumDefinition[] = [
  { id: 'presidential-constitution', name: '대통령제 개헌', question: '국민 직선 대통령에게 행정부 구성권을 부여할 것인가?', description: '통합된 행정부를 만들지만 의회와 대통령의 이중 정통성 충돌 가능성이 생깁니다.', politicalCost: 24, treasuryCost: 70, minimumLegitimacy: 45 },
  { id: 'parliamentary-charter', name: '의회책임제 헌장', question: '정부가 의회 다수의 신임에 따라 구성·해산되도록 할 것인가?', description: '연정과 불신임 투표를 제도화하고 행정부 권력을 의회 다수에 연결합니다.', politicalCost: 22, treasuryCost: 60, minimumLegitimacy: 42 },
  { id: 'federal-autonomy', name: '연방·지방자치', question: '지방정부와 시장에게 조세·치안·개발 권한을 이양할 것인가?', description: '지역 갈등을 낮출 수 있지만 중앙의 직접 통제와 세입이 줄어듭니다.', politicalCost: 18, treasuryCost: 48, minimumLegitimacy: 38 },
  { id: 'universal-suffrage', name: '보통·평등선거', question: '성별·재산·신분과 무관한 보통·평등·비밀선거를 헌법에 보장할 것인가?', description: '참여와 정통성을 높이지만 기존 특권집단의 반발을 부릅니다.', politicalCost: 20, treasuryCost: 55, minimumLegitimacy: 40 },
  { id: 'national-development-plan', name: '국가개발계획 승인', question: '산업·주택·교육 5개년 계획에 장기 조세와 국채 권한을 부여할 것인가?', description: '개발정책의 장기 위임을 얻는 대신 재정 성과가 정권 평가와 직결됩니다.', politicalCost: 16, treasuryCost: 42, minimumLegitimacy: 36 },
  { id: 'peace-settlement', name: '강화조약 국민승인', question: '현재 국경·배상·동맹 조건을 포함한 전후 강화조약을 승인할 것인가?', description: '전쟁 종결의 정통성을 국민투표로 확정하지만 강경파와 실향민 반발이 가능합니다.', politicalCost: 18, treasuryCost: 52, minimumLegitimacy: 38 },
];

const nationCandidateSeeds: Record<NationId, Array<[string, string, string, string, string, string]>> = {
  britain: [['churchill', '윈스턴 처칠', '보수당', '국가연합 보수', '런던', '전시 총리'], ['attlee', '클레멘트 애틀리', '노동당', '사회민주', '런던', '부총리'], ['sinclair', '아치볼드 싱클레어', '자유당', '사회자유', '스코틀랜드', '공군장관']],
  usa: [['roosevelt', '프랭클린 D. 루스벨트', '민주당', '뉴딜 자유주의', '뉴욕', '대통령'], ['dewey', '토머스 E. 듀이', '공화당', '중도 보수', '뉴욕', '뉴욕주 검사'], ['thomas', '노먼 토머스', '사회당', '민주사회주의', '뉴욕', '사회운동가']],
  ussr: [['stalin', '이오시프 스탈린', '전연방공산당', '당국가 중앙주의', '모스크바', '인민위원회 의장'], ['molotov', '뱌체슬라프 몰로토프', '국가행정 블록', '관료 국가주의', '모스크바', '외무인민위원'], ['zhukov', '게오르기 주코프', '조국방위 연합', '군사 공화주의', '레닌그라드', '전선군 사령관']],
  germany: [['goerdeler', '카를 괴르델러', '국가보수연합', '헌정 보수', '라이프치히', '전 라이프치히 시장'], ['schumacher', '쿠르트 슈마허', '사회민주당', '사회민주', '하노버', '사회민주당 정치인'], ['adenauer', '콘라트 아데나워', '기독민주연합', '기독교 민주', '쾰른', '전 쾰른 시장']],
  japan: [['konoe', '고노에 후미마로', '국민협력회', '궁정 국가주의', '도쿄', '전 총리'], ['hatoyama', '하토야마 이치로', '자유헌정파', '의회 자유주의', '도쿄', '중의원 의원'], ['katayama', '가타야마 데쓰', '사회대중당', '사회민주', '가나가와', '중의원 의원']],
  china: [['chiang', '장제스', '중국국민당', '국민 국가주의', '충칭', '국민정부 주석'], ['mao', '마오쩌둥', '중국공산당', '혁명 사회주의', '옌안', '중앙위원회 주석'], ['zhang-lan', '장란', '중국민주동맹', '민주 연합주의', '쓰촨', '민주동맹 지도자']],
  india: [['nehru', '자와할랄 네루', '인도 국민회의', '세속 사회민주', '알라하바드', '국민회의 지도자'], ['jinnah', '무함마드 알리 진나', '전인도 무슬림연맹', '연방 공동체주의', '봄베이', '무슬림연맹 총재'], ['ambedkar', '빔라오 암베드카르', '노동·사회정의 연합', '사회개혁', '봄베이', '노동위원']],
  freefrance: [['de-gaulle', '샤를 드골', '공화국 재건연합', '공화 국가주의', '런던', '자유프랑스 지도자'], ['blum', '레옹 블룸', '노동자 인터내셔널 프랑스지부', '사회민주', '파리', '전 총리'], ['thorez', '모리스 토레즈', '프랑스 공산당', '공산주의', '파리', '공산당 서기장']],
  italy: [['de-gasperi', '알치데 데 가스페리', '기독교민주당', '기독교 민주', '로마', '반파시스트 정치인'], ['nenni', '피에트로 넨니', '이탈리아 사회당', '사회주의', '로마', '사회당 지도자'], ['togliatti', '팔미로 톨리아티', '이탈리아 공산당', '공산주의', '모스크바', '공산당 서기장']],
  korea: [['kim-gu', '김구', '한국독립당', '민족 공화주의', '충칭', '임시정부 주석'], ['rhee', '이승만', '독립촉성 연합', '반공 대통령주의', '워싱턴', '임시정부 외교 지도자'], ['lyuh', '여운형', '건국동맹', '좌우합작', '서울', '건국동맹 지도자']],
  vietnam: [['ho-chi-minh', '호찌민', '베트민', '민족해방 사회주의', '까오방', '베트민 지도자'], ['bao-dai', '바오다이', '황실 입헌연합', '입헌 군주주의', '후에', '응우옌 황제'], ['ngo-dinh-diem', '응오딘지엠', '민족개혁파', '가톨릭 국가주의', '후에', '전 상서']],
  indonesia: [['sukarno', '수카르노', '인도네시아 국민당', '민족주의', '자카르타', '민족운동 지도자'], ['hatta', '모하맛 하타', '협동조합 민주연합', '사회민주', '수마트라', '민족운동 지도자'], ['sjahrir', '수탄 샤리르', '사회당', '민주사회주의', '자카르타', '지하운동 지도자']],
  philippines: [['quezon', '마누엘 케손', '국민당', '자치 국민주의', '마닐라', '자치정부 대통령'], ['osmena', '세르히오 오스메냐', '국민당 개혁파', '의회 보수', '세부', '부통령'], ['roxas', '마누엘 로하스', '자유주의 연합', '경제 자유주의', '카피스', '상원의원']],
};

const nationCities: Record<NationId, string[]> = {
  britain: ['런던', '버밍엄', '맨체스터', '글래스고', '리버풀', '벨파스트'],
  usa: ['뉴욕', '시카고', '로스앤젤레스', '필라델피아', '디트로이트', '휴스턴'],
  ussr: ['모스크바', '레닌그라드', '키이우', '트빌리시', '타슈켄트', '노보시비르스크'],
  germany: ['베를린', '함부르크', '뮌헨', '쾰른', '라이프치히', '브레슬라우'],
  japan: ['도쿄', '오사카', '나고야', '요코하마', '교토', '고베'],
  china: ['충칭', '청두', '쿤밍', '시안', '광저우', '구이린'],
  india: ['델리', '봄베이', '캘커타', '마드라스', '라호르', '방갈로르'],
  freefrance: ['파리', '리옹', '마르세유', '보르도', '릴', '알제'],
  italy: ['로마', '밀라노', '토리노', '나폴리', '팔레르모', '볼로냐'],
  korea: ['서울', '평양', '부산', '대구', '광주', '원산'],
  vietnam: ['하노이', '사이공', '후에', '하이퐁', '다낭', '껀터'],
  indonesia: ['자카르타', '수라바야', '반둥', '욕야카르타', '메단', '마카사르'],
  philippines: ['마닐라', '케손시티', '세부', '다바오', '일로일로', '바기오'],
};

const electoralDefaults: Record<NationId, [ExecutiveModelId, VotingSystemId]> = {
  britain: ['crown-parliament', 'first-past-the-post'], usa: ['presidential', 'electoral-college'], ussr: ['assembly', 'proportional'], germany: ['parliamentary', 'mixed-member'], japan: ['crown-parliament', 'first-past-the-post'], china: ['semi-presidential', 'two-round'], india: ['parliamentary', 'first-past-the-post'], freefrance: ['semi-presidential', 'two-round'], italy: ['crown-parliament', 'proportional'], korea: ['presidential', 'two-round'], vietnam: ['assembly', 'proportional'], indonesia: ['presidential', 'two-round'], philippines: ['presidential', 'two-round'],
};

const candidateColors = ['#c0a461', '#718fa5', '#a46f63', '#77977e'];
const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

function hashPercent(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 1000 / 10;
}

function createCandidates(nationId: NationId): ElectoralCandidate[] {
  return nationCandidateSeeds[nationId].map(([id, name, party, ideology, homeRegion, historicalOffice], index) => ({
    id, name, party, ideology, homeRegion, historicalOffice,
    charisma: Math.round(58 + hashPercent(`${id}:charisma`) * 0.32),
    organization: Math.round(55 + hashPercent(`${id}:organization`) * 0.34),
    policy: Math.round(56 + hashPercent(`${id}:policy`) * 0.33),
    integrity: Math.round(52 + hashPercent(`${id}:integrity`) * 0.38),
    baseSupport: index === 0 ? 38 : index === 1 ? 34 : 28,
    color: candidateColors[index],
  }));
}

function createRegions(nationId: NationId): ElectionRegion[] {
  return nationCities[nationId].map((city, index) => ({
    id: `${nationId}-region-${index + 1}`,
    name: index === 0 ? `${city} 수도권` : `${city} 권역`,
    principalCity: city,
    electorate: 520_000 + Math.round(hashPercent(`${nationId}:${city}:electorate`) * 22_000),
    seats: 8 + Math.round(hashPercent(`${city}:seats`) / 12),
    electors: 4 + Math.round(hashPercent(`${city}:electors`) / 16),
    urbanity: Math.round(45 + hashPercent(`${city}:urban`) * 0.5),
    laborStrength: Math.round(28 + hashPercent(`${city}:labor`) * 0.58),
    establishmentStrength: Math.round(28 + hashPercent(`${city}:establishment`) * 0.58),
    turnoutBase: Math.round(48 + hashPercent(`${city}:turnout`) * 0.28),
  }));
}

function createCampaign(state: Pick<ElectoralPoliticsState, 'nationId' | 'candidates' | 'participation' | 'electoralIntegrity'>, type: ElectionType, startedWeek: number, electionWeek: number, referendumTopicId: ReferendumTopicId | null = null): ActiveElectionCampaign {
  const candidateIds = type === 'referendum' ? [] : state.candidates.map((candidate) => candidate.id);
  return {
    id: `${type}-${state.nationId}-${electionWeek}`,
    type,
    stage: 'nomination',
    startedWeek,
    electionWeek,
    round: 1,
    candidateIds,
    playerCandidateId: state.candidates[0].id,
    referendumTopicId,
    momentum: Object.fromEntries(state.candidates.map((candidate) => [candidate.id, candidate.baseSupport])),
    regionalBoosts: {},
    campaignFunds: 90,
    turnoutProjection: state.participation,
    integrity: state.electoralIntegrity,
    polarization: 38,
    actions: [],
  };
}

export function createElectoralPoliticsState(nationId: NationId, startedWeek: number): ElectoralPoliticsState {
  const [executiveModelId, votingSystemId] = electoralDefaults[nationId];
  const candidates = createCandidates(nationId);
  const base: ElectoralPoliticsState = {
    version: 1, nationId, executiveModelId, votingSystemId, candidates, regions: createRegions(nationId), governingCandidateId: candidates[0].id,
    activeCampaign: null, nextPresidentialWeek: startedWeek + (executiveModelId === 'presidential' || executiveModelId === 'semi-presidential' ? 8 : 520), nextParliamentaryWeek: startedWeek + (executiveModelId === 'parliamentary' || executiveModelId === 'crown-parliament' || executiveModelId === 'assembly' ? 8 : 52), nextLocalWeek: startedWeek + 26,
    participation: 61, electoralIntegrity: 64, partyFragmentation: 46, campaignHistory: [], passedReferendums: [],
  };
  const inauguralType: ElectionType = executiveModelId === 'presidential' || executiveModelId === 'semi-presidential' ? 'presidential' : 'parliamentary';
  base.activeCampaign = createCampaign(base, inauguralType, startedWeek, startedWeek + 8);
  return base;
}

export function normalizeElectoralPoliticsState(value: unknown, nationId: NationId, startedWeek: number): ElectoralPoliticsState {
  const fallback = createElectoralPoliticsState(nationId, startedWeek);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<ElectoralPoliticsState>;
  if (candidate.nationId !== nationId) return fallback;
  return {
    ...fallback,
    ...candidate,
    version: 1,
    nationId,
    candidates: Array.isArray(candidate.candidates) && candidate.candidates.length >= 2 ? candidate.candidates : fallback.candidates,
    regions: Array.isArray(candidate.regions) && candidate.regions.length >= 3 ? candidate.regions : fallback.regions,
    activeCampaign: candidate.activeCampaign ?? null,
    campaignHistory: Array.isArray(candidate.campaignHistory) ? candidate.campaignHistory.slice(0, 40) : [],
    passedReferendums: Array.isArray(candidate.passedReferendums) ? candidate.passedReferendums : [],
  };
}

export function getExecutiveModelName(id: ExecutiveModelId) {
  return id === 'presidential' ? '대통령제' : id === 'semi-presidential' ? '이원집정부제' : id === 'parliamentary' ? '의원내각제' : id === 'assembly' ? '평의회 정부' : '입헌군주·의회정부';
}

export function getVotingSystemName(id: VotingSystemId) {
  return id === 'electoral-college' ? '지역별 선거인단' : id === 'two-round' ? '과반 결선투표' : id === 'first-past-the-post' ? '소선거구 최다득표' : id === 'proportional' ? '정당명부 비례대표' : '지역구·비례 혼합';
}

export function getElectionTypeName(type: ElectionType) {
  return type === 'presidential' ? '대통령 선거' : type === 'parliamentary' ? '총선거' : type === 'referendum' ? '국민투표' : '지방·시장 선거';
}

export function getCampaignStageName(stage: ElectionCampaignStage) {
  return stage === 'nomination' ? '후보 등록' : stage === 'campaign' ? '전국 유세' : stage === 'debate' ? '토론·공약 검증' : stage === 'voting' ? '투표일 준비' : stage === 'runoff' ? '결선투표' : '개표·인증';
}

export function canUseElectionAction(role: CareerRole, action: ElectionCampaignActionDefinition) {
  const hasRank = role.tier <= action.minimumTier;
  return hasRank && (action.branch === 'any' || role.tier === 1 || role.branch === action.branch);
}

export function applyElectionCampaignAction(state: ElectoralPoliticsState, actionId: ElectionCampaignActionId, regionId: string | null, context: ElectoralContext): ElectoralActionResult | null {
  const campaign = state.activeCampaign;
  const action = electionCampaignActions.find((item) => item.id === actionId);
  if (!campaign || !action || !canUseElectionAction(context.role, action) || context.politicalPower < action.politicalCost || context.treasury < action.treasuryCost) return null;
  if ((actionId === 'mass-rally' || actionId === 'local-endorsement') && !regionId) return null;
  const repeated = campaign.actions.filter((record) => record.actionId === actionId).length;
  const efficiency = Math.max(0.42, 1 - repeated * 0.18);
  const presentation = getElectionActionPresentation(action, context.week);
  const era = presentation.era;
  const player = state.candidates.find((candidate) => candidate.id === campaign.playerCandidateId) ?? state.candidates[0];
  let momentumDelta = 0;
  let integrityDelta = 0;
  let turnoutDelta = 0;
  let fundsDelta = -action.treasuryCost;
  let polarizationDelta = 0;
  let legitimacyDelta = 0;
  let unrestDelta = 0;
  if (actionId === 'mass-rally') { momentumDelta = 2.2; turnoutDelta = 1.2; polarizationDelta = 1; }
  else if (actionId === 'radio-address') momentumDelta = 3.8 + player.charisma / 100;
  else if (actionId === 'policy-manifesto') { momentumDelta = 2.5 + player.policy / 35; legitimacyDelta = 1; }
  else if (actionId === 'public-debate') momentumDelta = round((player.charisma + player.policy - 125) / 12 + (hashPercent(`${campaign.id}:${context.week}:debate`) - 50) / 15, 1);
  else if (actionId === 'fundraising-drive') { momentumDelta = 0.8; integrityDelta = -2; fundsDelta = 55; polarizationDelta = 1; }
  else if (actionId === 'coalition-pact') { momentumDelta = 5; polarizationDelta = -3; }
  else if (actionId === 'local-endorsement') { momentumDelta = 1.4; turnoutDelta = 0.8; }
  else { integrityDelta = 9; legitimacyDelta = 1; unrestDelta = -1; }
  momentumDelta = round(momentumDelta * efficiency * era.momentumMultiplier, 1);
  turnoutDelta = round(turnoutDelta * era.turnoutMultiplier, 1);
  integrityDelta = round(integrityDelta * era.integrityMultiplier, 1);
  const regionalDelta = round((actionId === 'local-endorsement' ? 6 : actionId === 'mass-rally' ? 5 : 0) * efficiency * era.turnoutMultiplier, 1);
  const record: ElectionCampaignActionRecord = {
    id: `${campaign.id}:${context.week}:${actionId}:${campaign.actions.length}`,
    actionId,
    week: context.week,
    regionId,
    detail: `${presentation.name} · ${era.name}: ${action.effect}${repeated ? ` · 반복 효율 ${Math.round(efficiency * 100)}%` : ''}`,
    momentumDelta,
    integrityDelta,
    turnoutDelta,
  };
  const nextCampaign: ActiveElectionCampaign = {
    ...campaign,
    momentum: { ...campaign.momentum, [player.id]: round((campaign.momentum[player.id] ?? player.baseSupport) + momentumDelta) },
    regionalBoosts: regionId ? { ...campaign.regionalBoosts, [regionId]: round((campaign.regionalBoosts[regionId] ?? 0) + regionalDelta) } : campaign.regionalBoosts,
    campaignFunds: Math.max(0, round(campaign.campaignFunds + fundsDelta)),
    turnoutProjection: clamp(campaign.turnoutProjection + turnoutDelta),
    integrity: clamp(campaign.integrity + integrityDelta),
    polarization: clamp(campaign.polarization + polarizationDelta),
    actions: [...campaign.actions, record],
  };
  return {
    state: { ...state, activeCampaign: nextCampaign, electoralIntegrity: round(clamp(state.electoralIntegrity + integrityDelta * 0.35)) },
    politicalPowerDelta: -action.politicalCost,
    treasuryDelta: actionId === 'fundraising-drive' ? 0 : -action.treasuryCost,
    legitimacyDelta,
    unrestDelta,
    title: `선거운동 — ${presentation.name}`,
    detail: `${record.detail}. 후보 기세 ${momentumDelta >= 0 ? '+' : ''}${momentumDelta}, 선거 신뢰 ${integrityDelta >= 0 ? '+' : ''}${integrityDelta}, 예상 투표율 ${nextCampaign.turnoutProjection.toFixed(1)}%.`,
  };
}

export function launchReferendum(state: ElectoralPoliticsState, topicId: ReferendumTopicId, context: ElectoralContext): ElectoralActionResult | null {
  const topic = referendumDefinitions.find((item) => item.id === topicId);
  if (!topic || state.activeCampaign || state.passedReferendums.includes(topicId) || context.role.tier > 2 || context.role.branch !== 'politics' || context.legitimacy < topic.minimumLegitimacy || context.politicalPower < topic.politicalCost || context.treasury < topic.treasuryCost) return null;
  const campaign = createCampaign(state, 'referendum', context.week, context.week + 6, topicId);
  campaign.turnoutProjection = clamp(state.participation + 4);
  campaign.momentum = { yes: clamp(44 + context.mandateScore * 0.12), no: clamp(56 - context.mandateScore * 0.12) };
  return {
    state: { ...state, activeCampaign: campaign },
    politicalPowerDelta: -topic.politicalCost,
    treasuryDelta: -topic.treasuryCost,
    legitimacyDelta: 1,
    unrestDelta: 1,
    title: `국민투표 발의 — ${topic.name}`,
    detail: `“${topic.question}”를 6주 뒤 국민투표에 부쳤습니다. 선거운동 행동은 찬성 진영의 기세·투표율·절차 신뢰를 바꿉니다.`,
  };
}

function calculateCandidateScores(state: ElectoralPoliticsState, campaign: ActiveElectionCampaign, region: ElectionRegion, context: ElectoralContext) {
  return campaign.candidateIds.map((candidateId, index) => {
    const candidate = state.candidates.find((item) => item.id === candidateId)!;
    const ideologyFit = index === 0 ? region.establishmentStrength * 0.07 + context.mandateScore * 0.08
      : index === 1 ? region.laborStrength * 0.08 + Math.max(0, 55 - context.mandateScore) * 0.08
        : (100 - Math.abs(region.urbanity - 55)) * 0.05;
    const regional = candidateId === campaign.playerCandidateId ? campaign.regionalBoosts[region.id] ?? 0 : 0;
    const noise = (hashPercent(`${campaign.id}:${campaign.round}:${region.id}:${candidate.id}`) - 50) * 0.1;
    const score = Math.max(3, candidate.baseSupport * 0.35 + (campaign.momentum[candidate.id] ?? candidate.baseSupport) * 0.45 + candidate.organization * 0.08 + candidate.charisma * 0.04 + ideologyFit + regional + noise);
    return { candidate, score };
  });
}

function allocateShares(scores: Array<{ candidate: ElectoralCandidate; score: number }>) {
  const total = scores.reduce((sum, item) => sum + item.score, 0);
  return scores.map((item) => ({ ...item, share: item.score / Math.max(1, total) * 100 }));
}

function resolveCandidateElection(state: ElectoralPoliticsState, campaign: ActiveElectionCampaign, context: ElectoralContext) {
  const aggregates = new Map<string, CandidateElectionResult>();
  campaign.candidateIds.forEach((candidateId) => {
    const candidate = state.candidates.find((item) => item.id === candidateId)!;
    aggregates.set(candidateId, { candidateId, name: candidate.name, party: candidate.party, votes: 0, voteShare: 0, seats: 0, electors: 0 });
  });
  const regionalResults: RegionalElectionResult[] = state.regions.map((region) => {
    const shares = allocateShares(calculateCandidateScores(state, campaign, region, context)).sort((left, right) => right.share - left.share);
    const turnout = clamp(region.turnoutBase * 0.62 + campaign.turnoutProjection * 0.38 + (hashPercent(`${campaign.id}:${region.id}:turnout`) - 50) * 0.05, 32, 92);
    const votesCast = Math.round(region.electorate * turnout / 100);
    shares.forEach(({ candidate, share }) => {
      const aggregate = aggregates.get(candidate.id)!;
      aggregate.votes += Math.round(votesCast * share / 100);
      if (state.votingSystemId === 'proportional') aggregate.seats += Math.round(region.seats * share / 100);
    });
    const winner = shares[0];
    const winnerAggregate = aggregates.get(winner.candidate.id)!;
    if (state.votingSystemId === 'electoral-college') winnerAggregate.electors += region.electors;
    if (state.votingSystemId === 'first-past-the-post') winnerAggregate.seats += region.seats;
    if (state.votingSystemId === 'mixed-member') {
      winnerAggregate.seats += Math.round(region.seats * 0.55);
      shares.forEach(({ candidate, share }) => { aggregates.get(candidate.id)!.seats += Math.round(region.seats * 0.45 * share / 100); });
    }
    return { regionId: region.id, regionName: region.name, principalCity: region.principalCity, turnout: round(turnout), winnerCandidateId: winner.candidate.id, winnerName: winner.candidate.name, winnerParty: winner.candidate.party, margin: round(winner.share - shares[1].share), electors: region.electors, seats: region.seats };
  });
  const candidateResults = [...aggregates.values()];
  const totalVotes = candidateResults.reduce((sum, item) => sum + item.votes, 0);
  candidateResults.forEach((result) => { result.voteShare = round(result.votes / Math.max(1, totalVotes) * 100, 2); });
  candidateResults.sort((left, right) => {
    if (campaign.type === 'presidential' && state.votingSystemId === 'electoral-college') return right.electors - left.electors || right.votes - left.votes;
    if (campaign.type === 'parliamentary') return right.seats - left.seats || right.votes - left.votes;
    return right.votes - left.votes;
  });
  return { candidateResults, regionalResults };
}

function resolveMayors(state: ElectoralPoliticsState, campaign: ActiveElectionCampaign, context: ElectoralContext): MayorElectionResult[] {
  return state.regions.map((region) => {
    const shares = allocateShares(calculateCandidateScores(state, campaign, region, context)).sort((left, right) => right.share - left.share);
    const winner = shares[0];
    const turnout = clamp(region.turnoutBase - 4 + campaign.turnoutProjection * 0.12 + (hashPercent(`${campaign.id}:${region.id}:mayor`) - 50) * 0.06, 28, 88);
    return { city: region.principalCity, winnerName: `${winner.candidate.party} ${region.principalCity} 후보`, party: winner.candidate.party, voteShare: round(winner.share), turnout: round(turnout), alignment: winner.candidate.id === campaign.playerCandidateId ? 'government' : winner.candidate.id === state.governingCandidateId ? 'government' : 'opposition' };
  });
}

function applyPassedReferendum(state: ElectoralPoliticsState, topicId: ReferendumTopicId, week: number) {
  if (topicId === 'presidential-constitution') return { ...state, executiveModelId: 'presidential' as const, votingSystemId: 'two-round' as const, nextPresidentialWeek: week + 26 };
  if (topicId === 'parliamentary-charter') return { ...state, executiveModelId: 'parliamentary' as const, votingSystemId: 'mixed-member' as const, nextParliamentaryWeek: week + 26 };
  return state;
}

function resolveElection(state: ElectoralPoliticsState, campaign: ActiveElectionCampaign, context: ElectoralContext): ElectoralAdvanceResult {
  if (campaign.type === 'referendum') {
    const topic = referendumDefinitions.find((item) => item.id === campaign.referendumTopicId)!;
    const campaignYes = campaign.momentum.yes ?? 50;
    const actionLift = campaign.actions.reduce((sum, action) => sum + action.momentumDelta, 0);
    const yesShare = round(clamp(36 + context.mandateScore * 0.18 + context.legitimacy * 0.08 - context.unrest * 0.06 + actionLift * 0.5 + (hashPercent(`${campaign.id}:referendum`) - 50) * 0.08 + campaignYes * 0.08, 18, 82));
    const passed = yesShare >= 50;
    const turnout = round(clamp(campaign.turnoutProjection + (hashPercent(`${campaign.id}:turnout`) - 50) * 0.08, 30, 92));
    const result: ElectionResult = {
      id: `result-${campaign.id}`, type: 'referendum', week: context.week, round: campaign.round, title: `${topic.name} 국민투표`, winnerCandidateId: null, winnerName: passed ? '찬성' : '반대', winnerParty: '국민투표', playerWon: passed, turnout, integrity: round(campaign.integrity), candidateResults: [], regionalResults: [], mayorResults: [],
      referendum: { topicId: topic.id, question: topic.question, yesShare, passed },
      summary: `찬성 ${yesShare.toFixed(1)}% · 반대 ${(100 - yesShare).toFixed(1)}% · 투표율 ${turnout.toFixed(1)}%`,
      consequence: passed ? `${topic.name}이 국민의 직접 위임을 받아 시행됩니다.` : `${topic.name}이 부결되어 52주 동안 같은 안건을 다시 발의할 수 없습니다.`,
    };
    let nextState: ElectoralPoliticsState = { ...state, activeCampaign: null, campaignHistory: [result, ...state.campaignHistory].slice(0, 40), passedReferendums: passed ? [...state.passedReferendums, topic.id] : state.passedReferendums };
    if (passed) nextState = applyPassedReferendum(nextState, topic.id, context.week);
    return { state: nextState, events: [{ id: result.id, title: result.title, detail: result.summary, tone: passed ? 'good' : 'neutral', cause: `공약·유세 ${campaign.actions.length}건 · 절차 신뢰 ${campaign.integrity.toFixed(1)} · 국민 위임 ${context.mandateScore}`, consequence: result.consequence }], politicalPowerDelta: passed ? 10 : -5, stabilityDelta: passed ? 2 : -1, legitimacyDelta: passed ? 5 : -2, unrestDelta: passed ? -2 : 3, playerWonElection: passed };
  }

  const { candidateResults, regionalResults } = resolveCandidateElection(state, campaign, context);
  const popularLeader = [...candidateResults].sort((left, right) => right.voteShare - left.voteShare)[0];
  if (state.votingSystemId === 'two-round' && campaign.round === 1 && popularLeader.voteShare < 50) {
    const finalists = [...candidateResults].sort((left, right) => right.voteShare - left.voteShare).slice(0, 2);
    const runoff: ActiveElectionCampaign = { ...campaign, stage: 'runoff', round: 2, electionWeek: context.week + 3, candidateIds: finalists.map((item) => item.candidateId), momentum: Object.fromEntries(finalists.map((item) => [item.candidateId, item.voteShare])), regionalBoosts: {}, actions: [] };
    return { state: { ...state, activeCampaign: runoff }, events: [{ id: `${campaign.id}-runoff`, title: `${getElectionTypeName(campaign.type)} 결선 확정`, detail: `${finalists[0].name} ${finalists[0].voteShare.toFixed(1)}% 대 ${finalists[1].name} ${finalists[1].voteShare.toFixed(1)}%. 3주 뒤 결선투표를 실시합니다.`, tone: 'neutral', cause: '1차 투표에서 과반 득표자가 나오지 않았습니다.', consequence: '결선 기간의 연대·토론·지역 유세가 최종 승자를 다시 계산합니다.' }], politicalPowerDelta: 0, stabilityDelta: 0, legitimacyDelta: 0, unrestDelta: 1, playerWonElection: false };
  }

  const winner = candidateResults[0];
  const playerWon = winner.candidateId === campaign.playerCandidateId;
  const turnout = round(regionalResults.reduce((sum, region) => sum + region.turnout, 0) / regionalResults.length);
  const mayorResults = campaign.type === 'local' ? resolveMayors(state, campaign, context) : [];
  const result: ElectionResult = {
    id: `result-${campaign.id}-${campaign.round}`, type: campaign.type, week: context.week, round: campaign.round, title: `${getElectionTypeName(campaign.type)} 결과`, winnerCandidateId: winner.candidateId, winnerName: winner.name, winnerParty: winner.party, playerWon, turnout, integrity: round(campaign.integrity), candidateResults, regionalResults, mayorResults, referendum: null,
    summary: `${winner.name} ${winner.voteShare.toFixed(1)}%${state.votingSystemId === 'electoral-college' ? ` · 선거인 ${winner.electors}` : campaign.type === 'parliamentary' ? ` · 의석 ${winner.seats}` : ''} · 투표율 ${turnout.toFixed(1)}%`,
    consequence: playerWon ? '정부·여당이 새 임기의 정책 위임을 확보했습니다.' : '야권 승리로 정책 권한과 인사 구성이 재조정됩니다.',
  };
  const presidentialAdvance = campaign.type === 'presidential' ? context.week + 208 : state.nextPresidentialWeek;
  const parliamentaryAdvance = campaign.type === 'parliamentary' ? context.week + 208 : state.nextParliamentaryWeek;
  const localAdvance = campaign.type === 'local' ? context.week + 104 : state.nextLocalWeek;
  return {
    state: { ...state, governingCandidateId: winner.candidateId, activeCampaign: null, nextPresidentialWeek: presidentialAdvance, nextParliamentaryWeek: parliamentaryAdvance, nextLocalWeek: localAdvance, participation: round(clamp(state.participation + (turnout - state.participation) * 0.18)), electoralIntegrity: round(clamp(state.electoralIntegrity + (campaign.integrity - state.electoralIntegrity) * 0.2)), campaignHistory: [result, ...state.campaignHistory].slice(0, 40) },
    events: [{ id: result.id, title: result.title, detail: result.summary, tone: playerWon ? 'good' : 'bad', cause: `유세 행동 ${campaign.actions.length}건 · 선거 신뢰 ${campaign.integrity.toFixed(1)} · 투표제도 ${getVotingSystemName(state.votingSystemId)}`, consequence: result.consequence }],
    politicalPowerDelta: playerWon ? 14 : -10, stabilityDelta: campaign.integrity >= 55 ? 2 : -4, legitimacyDelta: playerWon ? 5 : -5, unrestDelta: playerWon ? -3 : 5, playerWonElection: playerWon,
  };
}

function nextScheduledElection(state: ElectoralPoliticsState, week: number): { type: ElectionType; dueWeek: number } | null {
  const entries: Array<{ type: ElectionType; dueWeek: number }> = [
    { type: 'presidential', dueWeek: state.nextPresidentialWeek },
    { type: 'parliamentary', dueWeek: state.nextParliamentaryWeek },
    { type: 'local', dueWeek: state.nextLocalWeek },
  ];
  return entries.filter((entry) => entry.dueWeek >= week).sort((left, right) => left.dueWeek - right.dueWeek)[0] ?? null;
}

export function advanceElectoralPoliticsWeek(state: ElectoralPoliticsState, context: ElectoralContext): ElectoralAdvanceResult {
  let working = state;
  const events: ElectoralAdvanceEvent[] = [];
  if (!working.activeCampaign) {
    const next = nextScheduledElection(working, context.week);
    if (next && next.dueWeek - context.week <= 8) {
      working = { ...working, activeCampaign: createCampaign(working, next.type, context.week, next.dueWeek) };
      events.push({ id: `campaign-open-${next.type}-${context.week}`, title: `${getElectionTypeName(next.type)} 선거운동 개막`, detail: `${next.dueWeek - context.week}주 동안 후보 등록·유세·토론·투표 준비가 진행됩니다.`, tone: 'neutral', cause: '법정 선거 일정이 8주 안으로 들어왔습니다.', consequence: '매주 하나 이상의 선거운동 행동을 선택하고 지역별 판세를 관리할 수 있습니다.' });
    }
  }
  const campaign = working.activeCampaign;
  if (!campaign) return { state: working, events, politicalPowerDelta: 0, stabilityDelta: 0, legitimacyDelta: 0, unrestDelta: 0, playerWonElection: false };
  if (context.week >= campaign.electionWeek) {
    const resolved = resolveElection(working, campaign, context);
    return { ...resolved, events: [...events, ...resolved.events] };
  }
  const weeksRemaining = campaign.electionWeek - context.week;
  const stage: ElectionCampaignStage = campaign.round === 2 ? 'runoff' : weeksRemaining >= 7 ? 'nomination' : weeksRemaining >= 4 ? 'campaign' : weeksRemaining >= 2 ? 'debate' : 'voting';
  const passiveTurnout = context.education >= 60 && context.institutionalCapacity >= 55 ? 0.12 : context.unrest >= 65 ? -0.15 : 0.03;
  const nextCampaign = { ...campaign, stage, turnoutProjection: round(clamp(campaign.turnoutProjection + passiveTurnout)) };
  if (stage !== campaign.stage) events.push({ id: `${campaign.id}-${stage}`, title: `${getElectionTypeName(campaign.type)} — ${getCampaignStageName(stage)}`, detail: `투표일까지 ${weeksRemaining}주. 현재 예상 투표율 ${nextCampaign.turnoutProjection.toFixed(1)}%, 절차 신뢰 ${nextCampaign.integrity.toFixed(1)}%.`, tone: 'neutral', cause: '선거 일정이 다음 단계에 진입했습니다.', consequence: stage === 'debate' ? '토론·공약 검증 행동의 효과가 가장 커집니다.' : stage === 'voting' ? '이후 행동보다 선거관리와 투표율 방어가 중요합니다.' : '지역 유세와 조직 구축을 계속할 수 있습니다.' });
  return { state: { ...working, activeCampaign: nextCampaign }, events, politicalPowerDelta: 0, stabilityDelta: 0, legitimacyDelta: 0, unrestDelta: 0, playerWonElection: false };
}
