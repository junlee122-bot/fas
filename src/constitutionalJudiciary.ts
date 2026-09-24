import type { GovernmentFormId } from './dynasticPolitics';
import type { CareerRole, NationId } from './types';

export type ConstitutionAxis = 'government' | 'rights' | 'review' | 'appointments' | 'prosecution' | 'emergency' | 'territory';
export type ConstitutionStatus = 'awaiting-authority' | 'drafting' | 'enacted';
export type RatificationMethodId = 'constituent-assembly' | 'referendum' | 'executive-proclamation' | 'party-congress' | 'royal-assent';
export type JudicialOfficeId = 'supreme-chief' | 'constitutional-justice' | 'appellate-chief' | 'prosecutor-general' | 'anti-corruption-prosecutor' | 'military-advocate-general';
export type NominationStage = 'vetting' | 'hearing' | 'confirmation';
export type NominationDecisionId = 'confirm' | 'return-vetting' | 'withdraw' | 'force-through';

export interface ConstitutionClauseDefinition {
  id: string;
  axis: ConstitutionAxis;
  name: string;
  summary: string;
  institution: string;
  strength: string;
  risk: string;
  independence: number;
  rights: number;
  executive: number;
  stability: number;
  legitimacy: number;
}

export interface EnactedConstitution {
  name: string;
  enactedWeek: number;
  ratificationMethodId: RatificationMethodId;
  clauses: Record<ConstitutionAxis, string>;
  amendmentThreshold: string;
  publicSupport: number;
  contradictions: string[];
}

export interface JudicialCandidate {
  id: string;
  nationId: NationId;
  name: string;
  profile: string;
  school: string;
  philosophy: 'rights-oriented' | 'institutionalist' | 'security-oriented' | 'social-justice' | 'executive-loyalist' | 'anti-corruption';
  competence: number;
  integrity: number;
  independence: number;
  experience: number;
  publicTrust: number;
  coalitionSupport: number;
  securityConcern: number;
  disclosure: string;
  fictional: true;
}

export interface JudicialOfficeDefinition {
  id: JudicialOfficeId;
  name: string;
  branch: 'judge' | 'prosecutor';
  scope: string;
  termWeeks: number;
  minimumTier: 1 | 2;
  politicalCost: number;
  treasuryCost: number;
}

export interface JudicialAppointment {
  id: string;
  officeId: JudicialOfficeId;
  candidateId: string;
  candidateName: string;
  appointedWeek: number;
  termEndWeek: number;
  confirmationSupport: number;
  independence: number;
  integrity: number;
  competence: number;
}

export interface ActiveJudicialNomination {
  id: string;
  officeId: JudicialOfficeId;
  candidateId: string;
  stage: NominationStage;
  openedWeek: number;
  nextReviewWeek: number;
  hearingSupport: number;
  vettingScore: number;
  concern: string;
}

export interface ConstitutionalHistoryRecord {
  id: string;
  week: number;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface ConstitutionalJudiciaryState {
  version: 1;
  nationId: NationId;
  status: ConstitutionStatus;
  authorityReachedWeek: number | null;
  draft: Partial<Record<ConstitutionAxis, string>>;
  enacted: EnactedConstitution | null;
  courtIndependence: number;
  prosecutorialAutonomy: number;
  judicialCapacity: number;
  rightsProtection: number;
  executiveConstraint: number;
  candidates: JudicialCandidate[];
  appointments: JudicialAppointment[];
  activeNomination: ActiveJudicialNomination | null;
  history: ConstitutionalHistoryRecord[];
}

export interface ConstitutionalContext {
  week: number;
  year: number;
  nationId: NationId;
  role: CareerRole;
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  institutionalCapacity: number;
  publicConfidence: number;
}

export interface ConstitutionalActionResult {
  state: ConstitutionalJudiciaryState;
  title: string;
  detail: string;
  politicalPowerDelta: number;
  treasuryDelta: number;
  stabilityDelta: number;
  legitimacyDelta: number;
  unrestDelta: number;
  institutionalCapacityDelta: number;
  publicConfidenceDelta: number;
  justiceIndependenceDelta: number;
  justiceIntegrityDelta: number;
  governmentFormId?: GovernmentFormId;
}

export interface ConstitutionalAdvanceResult {
  state: ConstitutionalJudiciaryState;
  events: Array<{ title: string; detail: string; tone: 'good' | 'bad' | 'neutral' }>;
}

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const axes: ConstitutionAxis[] = ['government', 'rights', 'review', 'appointments', 'prosecution', 'emergency', 'territory'];

export const constitutionAxisLabels: Record<ConstitutionAxis, { name: string; question: string }> = {
  government: { name: '권력구조', question: '누가 정부를 구성하고 해임하는가?' },
  rights: { name: '기본권 헌장', question: '국가가 침해할 수 없는 권리와 사회적 의무는 무엇인가?' },
  review: { name: '사법심사', question: '위헌 법률과 권력 충돌을 누가 판단하는가?' },
  appointments: { name: '사법 인사', question: '판사를 누가 추천·검증·임명하는가?' },
  prosecution: { name: '검찰 체계', question: '수사와 기소가 누구에게 책임을 지는가?' },
  emergency: { name: '비상권한', question: '전쟁·반란·재난 때 권리를 얼마나 제한할 수 있는가?' },
  territory: { name: '지방질서', question: '중앙·지역·식민지·자치공동체의 권한을 어떻게 나누는가?' },
};

export const constitutionClauses: ConstitutionClauseDefinition[] = [
  { id: 'parliamentary-cabinet', axis: 'government', name: '의회책임 내각제', summary: '의회 다수파가 내각을 구성하고 불신임으로 교체합니다.', institution: '총리·내각·양원 또는 단원 의회', strength: '연정과 정권교체의 유연성', risk: '분열 의회에서 단명 내각', independence: 2, rights: 2, executive: -12, stability: 3, legitimacy: 7 },
  { id: 'presidential-separation', axis: 'government', name: '대통령 권력분립제', summary: '직선 또는 선거인단 대통령과 의회가 별도 임기를 가집니다.', institution: '대통령·의회·탄핵 절차', strength: '명확한 국민 위임과 행정부 지속성', risk: '분점정부·개인 권력 집중', independence: 0, rights: 1, executive: 10, stability: 4, legitimacy: 6 },
  { id: 'semi-presidential', axis: 'government', name: '이원집정부제', summary: '대통령은 외교·안보를, 의회책임 총리는 내정을 지휘합니다.', institution: '대통령·총리·의회', strength: '위기 지도력과 의회 책임의 결합', risk: '대통령과 총리의 이중 권력 충돌', independence: 0, rights: 1, executive: 5, stability: 2, legitimacy: 4 },
  { id: 'constitutional-crown', axis: 'government', name: '의회책임 입헌군주제', summary: '군주는 국가를 상징하고 선출 의회가 내각을 통제합니다.', institution: '군주·총리·의회·왕실평의회', strength: '세습 상징과 선거정치의 이중 정통성', risk: '왕실 특권·계승 논쟁', independence: 1, rights: 1, executive: -5, stability: 7, legitimacy: 5 },
  { id: 'council-directorate', axis: 'government', name: '집단 평의회 정부', summary: '노동·지역·군·시민 대표의 집단지도부가 순환 의장을 둡니다.', institution: '국가평의회·소환제·대표단', strength: '권력 독점 억제와 집단 대표', risk: '책임소재 불명확·파벌 교착', independence: -1, rights: 2, executive: -8, stability: -1, legitimacy: 5 },
  { id: 'peoples-congress', axis: 'government', name: '인민대표대회 체제', summary: '당·노동·지역 조직의 대표대회가 국가기관을 선출·감독합니다.', institution: '인민대표대회·상임위원회', strength: '장기계획과 조직 동원', risk: '일당 독점과 반대파 배제', independence: -6, rights: -4, executive: 14, stability: 6, legitimacy: 2 },

  { id: 'civil-liberties-charter', axis: 'rights', name: '자유권·적법절차 헌장', summary: '표현·집회·종교·사생활·신체의 자유와 공정재판을 직접 보장합니다.', institution: '개인 헌법소원과 국가배상', strength: '권력 남용 방지와 언론·시민사회 성장', risk: '안보·행정조치에 잦은 법적 제동', independence: 7, rights: 16, executive: -8, stability: 0, legitimacy: 9 },
  { id: 'social-rights-charter', axis: 'rights', name: '사회국가·노동권 헌장', summary: '교육·의료·주거·노동조합·사회보장을 국가 의무로 둡니다.', institution: '사회권 입법 의무와 노동법원', strength: '불평등 완화와 대중 정당성', risk: '재정 부담과 권리 실현 지연', independence: 2, rights: 13, executive: -2, stability: 3, legitimacy: 11 },
  { id: 'plural-rights-charter', axis: 'rights', name: '다언어·소수자·자치권 헌장', summary: '민족·언어·종교·성별·출신에 따른 차별을 금지하고 공동체 자치를 보장합니다.', institution: '평등위원회·언어권·집단청원', strength: '탈식민 통합과 소수집단 보호', risk: '중앙집권 세력과 다수파의 반발', independence: 5, rights: 15, executive: -5, stability: 1, legitimacy: 10 },
  { id: 'workers-duties-charter', axis: 'rights', name: '노동·사회적 소유 헌장', summary: '노동권과 생존권을 우선하며 재산권에는 사회적 의무를 부과합니다.', institution: '노동평의회·공공소유 심사', strength: '계급 동원과 산업 재편', risk: '기업·지주 반발과 국가노조화', independence: -1, rights: 8, executive: 4, stability: 2, legitimacy: 6 },
  { id: 'order-and-duty-charter', axis: 'rights', name: '국가질서·공민의무 헌장', summary: '국가안보·복무·공공질서를 권리보다 앞세우고 행정 재량을 넓힙니다.', institution: '국가보호 의무·충성심사', strength: '전시 동원과 신속한 치안', risk: '검열·자의적 구금·차별의 제도화', independence: -8, rights: -15, executive: 14, stability: 5, legitimacy: -8 },

  { id: 'constitutional-court-review', axis: 'review', name: '독립 헌법재판소', summary: '전담 재판소가 위헌법률·기관쟁의·헌법소원을 심판합니다.', institution: '임기제 헌법재판관과 추상·구체적 심사', strength: '전문적 권리구제와 권력중재', risk: '재판관 인사전쟁과 사법정치화', independence: 13, rights: 10, executive: -12, stability: 2, legitimacy: 7 },
  { id: 'supreme-court-review', axis: 'review', name: '일반법원 분산형 심사', summary: '모든 법원이 구체적 사건에서 위헌성을 심사하고 대법원이 통일합니다.', institution: '대법원·선례·구체적 심사', strength: '일상 재판 속 권리구제', risk: '판례 변동과 최고법원 인사 집중', independence: 10, rights: 8, executive: -9, stability: 1, legitimacy: 5 },
  { id: 'parliamentary-sovereignty', axis: 'review', name: '의회주권·선언적 심사', summary: '법원은 권리 침해를 선언하지만 최종 법률 변경은 의회가 담당합니다.', institution: '권리불합치 선언·의회 재심', strength: '선출기관의 최종 책임', risk: '다수파가 소수 권리를 무시할 위험', independence: 2, rights: 2, executive: -2, stability: 4, legitimacy: 4 },
  { id: 'popular-supervision', axis: 'review', name: '인민감찰·대표대회 심사', summary: '법률과 행정의 합치성을 최고대표기관과 인민감찰원이 심사합니다.', institution: '인민감찰원·대표대회 법제위원회', strength: '정책 통일성과 대중 청원', risk: '집권조직이 자기 결정을 스스로 심사', independence: -8, rights: -4, executive: 9, stability: 4, legitimacy: 1 },
  { id: 'no-constitutional-review', axis: 'review', name: '위헌심사 부재', summary: '행정·입법기관의 법률 판단을 최종으로 두고 법원은 적용만 담당합니다.', institution: '법률우위·행정해석', strength: '빠른 정책 집행', risk: '권력 남용에 대한 제도적 구제 부재', independence: -15, rights: -13, executive: 18, stability: 2, legitimacy: -10 },

  { id: 'independent-commission', axis: 'appointments', name: '독립 사법인사위원회', summary: '법관 다수와 변호사·시민위원이 공개 기준으로 후보를 추천합니다.', institution: '공개 후보명단·이해충돌 공개·징계위원회', strength: '전문성과 독립성', risk: '법조 엘리트의 자기재생산', independence: 15, rights: 5, executive: -13, stability: 1, legitimacy: 7 },
  { id: 'executive-legislative-confirmation', axis: 'appointments', name: '행정부 지명·의회 인준', summary: '국가원수가 지명하고 공개 청문과 의회 표결을 거칩니다.', institution: '배경검증·공개청문·인준투표', strength: '민주적 책임과 상호견제', risk: '진영별 인사 봉쇄와 거래', independence: 6, rights: 3, executive: 1, stability: 0, legitimacy: 6 },
  { id: 'legislative-election', axis: 'appointments', name: '의회·대표대회 선출', summary: '정당·지역별 몫을 조정해 의회가 재판관을 선출합니다.', institution: '특별다수 또는 대표비례 선출', strength: '다원 대표성', risk: '정당 몫 나누기', independence: 2, rights: 2, executive: -4, stability: 1, legitimacy: 4 },
  { id: 'career-judicial-council', axis: 'appointments', name: '직업법관 평의회 승진제', summary: '시험·경력·평정에 따라 사법평의회가 승진·전보합니다.', institution: '사법연수·평정·무작위 사건배당', strength: '전문성과 조직 연속성', risk: '폐쇄적 관료주의와 내부 파벌', independence: 10, rights: 1, executive: -8, stability: 4, legitimacy: 2 },
  { id: 'leader-appointment', axis: 'appointments', name: '최고지도자 직접 임명', summary: '국가원수가 충성·능력·정책노선을 기준으로 판사를 직접 임명·해임합니다.', institution: '행정부 인사명령', strength: '빠른 충원과 정책 일관성', risk: '보복재판·사법 예속', independence: -18, rights: -9, executive: 18, stability: 3, legitimacy: -9 },

  { id: 'independent-prosecution', axis: 'prosecution', name: '독립 공소청', summary: '검찰총장은 고정 임기와 제한된 해임사유를 가지며 개별 사건 지시를 공개합니다.', institution: '독립예산·서면지휘 공개·특별검사', strength: '권력형 비리 수사와 법률의 평등', risk: '선출권력에 대한 책임성 논쟁', independence: 14, rights: 7, executive: -12, stability: 0, legitimacy: 8 },
  { id: 'ministerial-prosecution', axis: 'prosecution', name: '법무장관 책임 검찰', summary: '검찰은 행정부에 속하되 장관의 사건지휘를 문서화하고 의회가 감독합니다.', institution: '장관 지휘권·의회 보고·감찰관', strength: '정책 책임과 조직 통일', risk: '정적 수사·자기편 봐주기', independence: 2, rights: 0, executive: 8, stability: 3, legitimacy: 2 },
  { id: 'decentralized-prosecution', axis: 'prosecution', name: '지역 선출·분권 검찰', summary: '지역 검사가 주민 또는 지방의회에 책임지고 중앙 특별검찰이 국가범죄를 담당합니다.', institution: '지역검사·중앙 특별검찰·관할조정', strength: '지역 책임성과 권력 분산', risk: '지역차·선거 인기영합', independence: 6, rights: 3, executive: -6, stability: -1, legitimacy: 6 },
  { id: 'procuracy-supervision', axis: 'prosecution', name: '통합 검찰감독원', summary: '검찰이 수사·기소뿐 아니라 행정기관의 합법성과 국가계획 준수를 감독합니다.', institution: '최고검찰감독원·법률감독', strength: '강한 부패통제와 행정 통일', risk: '광범위한 감시권과 당·국가 예속', independence: -4, rights: -6, executive: 12, stability: 5, legitimacy: 0 },

  { id: 'sunset-emergency', axis: 'emergency', name: '엄격한 일몰·의회 재승인', summary: '비상명령은 짧은 기한 뒤 자동 소멸하고 의회·법원이 계속 심사합니다.', institution: '30일 일몰·구금심사·권리 핵심영역', strength: '영구 비상통치 방지', risk: '급변하는 전쟁에서 반복 승인 비용', independence: 7, rights: 12, executive: -13, stability: -2, legitimacy: 8 },
  { id: 'renewable-emergency', axis: 'emergency', name: '의회 갱신형 국가비상사태', summary: '행정부가 선포하고 의회가 분기별로 갱신하며 법원이 비례성을 심사합니다.', institution: '분기 갱신·예산통제·사법심사', strength: '위기 대응과 견제의 균형', risk: '다수파의 자동 갱신', independence: 3, rights: 4, executive: 2, stability: 5, legitimacy: 4 },
  { id: 'executive-decree-review', axis: 'emergency', name: '행정명령·사후 사법심사', summary: '국가원수가 즉시 명령하되 법원과 의회가 사후 취소할 수 있습니다.', institution: '비상명령·사후승인·손해배상', strength: '신속성과 최소한의 사후책임', risk: '되돌릴 수 없는 초기 권리침해', independence: 0, rights: -3, executive: 10, stability: 7, legitimacy: 0 },
  { id: 'permanent-security-directorate', axis: 'emergency', name: '상설 국가보위 비상권', summary: '전쟁·반란 위험을 근거로 보위기관이 구금·검열·특별재판을 상시 운용합니다.', institution: '국가보위위원회·특별재판·예방구금', strength: '강한 통제와 반란 진압', risk: '영구 비상체제·숙청·공포정치', independence: -14, rights: -18, executive: 20, stability: 8, legitimacy: -13 },

  { id: 'unitary-local-government', axis: 'territory', name: '단일국가·법률상 지방자치', summary: '국가 법률이 전국 기준을 정하고 지방정부는 위임 사무를 수행합니다.', institution: '중앙의회·지방자치법·행정법원', strength: '전국적 서비스와 빠른 재건', risk: '지역·민족 요구의 과소대표', independence: 0, rights: 0, executive: 5, stability: 3, legitimacy: 1 },
  { id: 'devolved-regions', axis: 'territory', name: '광역자치·비대칭 분권', summary: '언어·역사·섬 지역마다 서로 다른 입법·재정권을 협약으로 보장합니다.', institution: '광역의회·권한협약·재정조정', strength: '다양한 지역을 유연하게 통합', risk: '권한 분쟁과 분리주의 경쟁', independence: 1, rights: 6, executive: -5, stability: 1, legitimacy: 7 },
  { id: 'federal-compact', axis: 'territory', name: '연방 헌정협약', summary: '주·공화국·지역이 고유 헌법과 의회를 가지며 중앙 권한을 열거합니다.', institution: '연방상원·주정부·권한쟁의 심판', strength: '대륙·다민족 국가의 권력 분산', risk: '재정격차·연방마비·탈퇴 갈등', independence: 2, rights: 5, executive: -8, stability: 0, legitimacy: 8 },
  { id: 'self-determination-compact', axis: 'territory', name: '자결·연합국가 협약', summary: '식민지·민족공동체에 단계적 독립, 자유연합 또는 잔류 국민투표를 보장합니다.', institution: '자결 국민투표·공동방위·자산승계', strength: '탈식민 정당성과 평화적 국가 재편', risk: '영토 축소와 자원·군기지 상실', independence: 2, rights: 10, executive: -10, stability: -3, legitimacy: 12 },
  { id: 'centralized-provinces', axis: 'territory', name: '중앙 임명 지방관제', summary: '중앙정부가 지방관·치안·재정을 직접 통제하고 자치권을 제한합니다.', institution: '임명 도지사·통합경찰·중앙예산', strength: '동원·치안·계획의 통일', risk: '지역 반란·식민지적 지배의 재생산', independence: -3, rights: -8, executive: 13, stability: 4, legitimacy: -8 },
];

export const ratificationMethods: Array<{ id: RatificationMethodId; name: string; detail: string; politicalCost: number; treasuryCost: number; support: number; legitimacy: number; risk: string }> = [
  { id: 'constituent-assembly', name: '제헌의회 3분의 2 의결', detail: '정당·지역·저항조직 대표가 조항별 기록표결을 진행합니다.', politicalCost: 18, treasuryCost: 22, support: 10, legitimacy: 8, risk: '합의 비용은 크지만 패자가 헌정 안에 남을 가능성이 높습니다.' },
  { id: 'referendum', name: '보통·평등 국민투표', detail: '전국 선거인 명부와 비밀투표로 헌법 전체를 승인받습니다.', politicalCost: 14, treasuryCost: 34, support: 12, legitimacy: 11, risk: '단순한 찬반 운동이 복잡한 조항을 진영 대결로 바꿀 수 있습니다.' },
  { id: 'executive-proclamation', name: '최고지도자 헌법 공포', detail: '국가원수가 즉시 기본법을 공포하고 추후 의회 추인을 약속합니다.', politicalCost: 6, treasuryCost: 5, support: -12, legitimacy: -8, risk: '빠르지만 권력 정점의 자기수권이라는 의심을 남깁니다.' },
  { id: 'party-congress', name: '정당·인민대표대회 승인', detail: '집권조직과 산하 대중단체의 대표대회가 헌정 노선을 승인합니다.', politicalCost: 11, treasuryCost: 14, support: 1, legitimacy: 1, risk: '조직 동원은 강하지만 비조직 시민과 반대파 대표성이 취약합니다.' },
  { id: 'royal-assent', name: '왕실·의회 공동 선서', detail: '군주가 특권 제한을 선서하고 의회가 헌법을 의결합니다.', politicalCost: 15, treasuryCost: 28, support: 5, legitimacy: 7, risk: '왕실과 의회 어느 한쪽이 합의를 깨면 이중 정통성 위기가 납니다.' },
];

export const judicialOffices: JudicialOfficeDefinition[] = [
  { id: 'supreme-chief', name: '대법원장', branch: 'judge', scope: '최종심·사법행정·법관 독립', termWeeks: 624, minimumTier: 1, politicalCost: 12, treasuryCost: 8 },
  { id: 'constitutional-justice', name: '헌법재판관', branch: 'judge', scope: '위헌심사·기관쟁의·기본권 구제', termWeeks: 468, minimumTier: 1, politicalCost: 10, treasuryCost: 7 },
  { id: 'appellate-chief', name: '고등법원장', branch: 'judge', scope: '주요 항소심·지역 사법행정', termWeeks: 416, minimumTier: 2, politicalCost: 7, treasuryCost: 5 },
  { id: 'prosecutor-general', name: '검찰총장', branch: 'prosecutor', scope: '전국 공소정책·권력형 비리 수사', termWeeks: 260, minimumTier: 1, politicalCost: 11, treasuryCost: 7 },
  { id: 'anti-corruption-prosecutor', name: '반부패 특별검사', branch: 'prosecutor', scope: '고위공직·군수·선거자금 사건', termWeeks: 156, minimumTier: 2, politicalCost: 8, treasuryCost: 9 },
  { id: 'military-advocate-general', name: '군 법무감', branch: 'prosecutor', scope: '군사재판·교전규칙·지휘책임', termWeeks: 260, minimumTier: 2, politicalCost: 7, treasuryCost: 6 },
];

const candidateNames: Record<NationId, string[]> = {
  britain: ['엘리너 하딩', '아서 펨브로크', '마거릿 로슨', '휴 베넷', '사라 웨스트우드', '콜린 머서'],
  usa: ['에벌린 카터', '새뮤얼 브룩스', '루스 애덤스', '조너선 헤일', '마리아 로웰', '찰스 워런'],
  ussr: ['안나 볼코바', '미하일 소콜로프', '베라 레베데바', '알렉세이 모로조프', '니나 오를로바', '파벨 안토노프'],
  germany: ['클라라 폰 베르크', '요하네스 켈러', '마르타 라이너', '프리드리히 아들러', '헬레네 포겔', '오토 브란트'],
  japan: ['다카하시 사치코', '이시카와 겐지', '나카무라 아야', '모리타 슌', '하야시 게이코', '오가와 다케시'],
  china: ['저우란', '천웨이민', '린슈잉', '왕정궈', '류메이화', '허즈창'],
  india: ['아샤 메논', '라지브 센', '파티마 쿠레시', '비크람 라오', '릴라 바네르지', '아룬 데사이'],
  freefrance: ['마들렌 르클레르', '앙리 보몽', '시몬 베르나르', '뤼시앵 모로', '클레르 뒤랑', '폴 지라르'],
  italy: ['루치아 비안키', '마테오 콘티', '엘레나 로마노', '비토리오 그레코', '소피아 리치', '카를로 페라라'],
  korea: ['김정윤', '이현석', '박혜진', '최명호', '윤서경', '한도진'],
  vietnam: ['응우옌 티 민', '쩐 반 롱', '레 투이 안', '팜 꽝 하이', '부 티 란', '도 민 득'],
  indonesia: ['사리 위자야', '아흐마드 수르야', '라트나 프라나타', '부디 산토소', '마야 하르토노', '유수프 라흐만'],
  philippines: ['테레사 산토스', '라몬 레예스', '루르데스 크루스', '안드레스 가르시아', '엘레나 바티스타', '호세 나바로'],
};

const philosophies: JudicialCandidate['philosophy'][] = ['rights-oriented', 'institutionalist', 'security-oriented', 'social-justice', 'executive-loyalist', 'anti-corruption'];
const profileByPhilosophy: Record<JudicialCandidate['philosophy'], { profile: string; school: string; disclosure: string; stats: [number, number, number, number, number, number, number] }> = {
  'rights-oriented': { profile: '전시 구금과 검열 사건에서 적법절차를 고집한 변호사·항소심 법관', school: '자유권·적법절차', disclosure: '안보기관이 과거 무죄변론과 반대의견을 문제 삼습니다.', stats: [82, 84, 91, 76, 75, 54, 18] },
  institutionalist: { profile: '법원행정과 복잡한 상사·행정사건에 강한 직업법관', school: '법적 안정성·선례', disclosure: '상급법원 내부 승진망과 가까워 폐쇄성 비판이 있습니다.', stats: [88, 79, 76, 91, 69, 70, 16] },
  'security-oriented': { profile: '군법·방첩·국가안보 사건을 맡아온 법무관', school: '국가보호·행정재량', disclosure: '비공개 군사재판에서 방어권을 좁게 해석한 기록이 있습니다.', stats: [79, 68, 52, 84, 58, 76, 27] },
  'social-justice': { profile: '노동·소작·소수집단 사건과 사회권 입법을 다뤄온 법률가', school: '사회권·실질적 평등', disclosure: '기업·지주 단체가 재산권에 적대적이라고 공격합니다.', stats: [81, 86, 83, 72, 80, 61, 20] },
  'executive-loyalist': { profile: '정부 법제와 긴급명령을 방어하며 지도부 신임을 얻은 법률고문', school: '행정 효율·국가통합', disclosure: '정부 계약을 맡은 친족 법률사무소와 이해충돌 의혹이 있습니다.', stats: [77, 51, 38, 79, 49, 88, 42] },
  'anti-corruption': { profile: '군수 리베이트·차명재산 수사로 알려진 특별수사 검사', school: '공직윤리·자산회수', disclosure: '강압수사라는 피의자 측 진정과 내부고발 보호 기록이 함께 존재합니다.', stats: [86, 90, 87, 82, 73, 57, 24] },
};

export function createJudicialCandidates(nationId: NationId): JudicialCandidate[] {
  return candidateNames[nationId].map((name, index) => {
    const philosophy = philosophies[index];
    const profile = profileByPhilosophy[philosophy];
    const variance = ((nationId.charCodeAt(0) + index * 7) % 7) - 3;
    const [competence, integrity, independence, experience, publicTrust, coalitionSupport, securityConcern] = profile.stats;
    return {
      id: `${nationId}-jurist-${index + 1}`,
      nationId,
      name,
      profile: profile.profile,
      school: profile.school,
      philosophy,
      competence: clamp(competence + variance),
      integrity: clamp(integrity - variance),
      independence: clamp(independence + variance),
      experience: clamp(experience),
      publicTrust: clamp(publicTrust - variance),
      coalitionSupport: clamp(coalitionSupport + variance),
      securityConcern: clamp(securityConcern),
      disclosure: profile.disclosure,
      fictional: true,
    };
  });
}

export function createConstitutionalJudiciaryState(nationId: NationId): ConstitutionalJudiciaryState {
  return {
    version: 1,
    nationId,
    status: 'awaiting-authority',
    authorityReachedWeek: null,
    draft: {},
    enacted: null,
    courtIndependence: 50,
    prosecutorialAutonomy: 46,
    judicialCapacity: 45,
    rightsProtection: 42,
    executiveConstraint: 40,
    candidates: createJudicialCandidates(nationId),
    appointments: [],
    activeNomination: null,
    history: [],
  };
}

export function activateConstitutionalFounding(state: ConstitutionalJudiciaryState, context: ConstitutionalContext): ConstitutionalActionResult | null {
  if (state.status !== 'awaiting-authority' || context.role.tier !== 1) return null;
  const title = '권력의 정점 · 제헌권 발동';
  const detail = `${context.role.title} 취임으로 국가 전체의 헌정 설계권이 열렸습니다. 일곱 헌법 축을 작성하고 비준 방식을 선택하십시오.`;
  return {
    state: {
      ...state,
      status: 'drafting',
      authorityReachedWeek: context.week,
      history: [{ id: `founding-${context.week}`, week: context.week, title, detail, tone: 'neutral' as const }, ...state.history].slice(0, 100),
    },
    title,
    detail,
    politicalPowerDelta: 0,
    treasuryDelta: 0,
    stabilityDelta: 0,
    legitimacyDelta: 0,
    unrestDelta: 0,
    institutionalCapacityDelta: 0,
    publicConfidenceDelta: 0,
    justiceIndependenceDelta: 0,
    justiceIntegrityDelta: 0,
  };
}

export function getConstitutionClause(id: string) {
  return constitutionClauses.find((clause) => clause.id === id);
}

export function selectConstitutionClause(state: ConstitutionalJudiciaryState, clauseId: string, context: ConstitutionalContext): ConstitutionalActionResult | null {
  const clause = getConstitutionClause(clauseId);
  if (!clause || state.status !== 'drafting' || context.role.tier !== 1 || context.politicalPower < 1) return null;
  const previous = state.draft[clause.axis];
  if (previous === clause.id) return null;
  const title = `헌법 초안 · ${constitutionAxisLabels[clause.axis].name}`;
  const detail = `${clause.name} 조항을 ${previous ? '대체 채택' : '초안에 채택'}했습니다. 비준 전까지 수정할 수 있습니다.`;
  return {
    state: {
      ...state,
      draft: { ...state.draft, [clause.axis]: clause.id },
      history: [{ id: `draft-${clause.axis}-${context.week}-${clause.id}`, week: context.week, title, detail, tone: 'neutral' as const }, ...state.history].slice(0, 100),
    },
    title,
    detail,
    politicalPowerDelta: -1,
    treasuryDelta: 0,
    stabilityDelta: 0,
    legitimacyDelta: 0,
    unrestDelta: 0,
    institutionalCapacityDelta: 0,
    publicConfidenceDelta: 0,
    justiceIndependenceDelta: 0,
    justiceIntegrityDelta: 0,
  };
}

export function getConstitutionContradictions(draft: Partial<Record<ConstitutionAxis, string>>): string[] {
  const contradictions: string[] = [];
  if (draft.rights === 'civil-liberties-charter' && draft.emergency === 'permanent-security-directorate') contradictions.push('자유권 헌장과 상설 보위 비상권이 정면 충돌합니다. 법원·보위기관의 관할 위기가 반복됩니다.');
  if (draft.review === 'no-constitutional-review' && ['civil-liberties-charter', 'plural-rights-charter'].includes(draft.rights ?? '')) contradictions.push('강한 권리 선언에 이를 집행할 위헌심사 기관이 없습니다. 권리는 정치적 약속에 머물 수 있습니다.');
  if (draft.appointments === 'leader-appointment' && ['constitutional-court-review', 'supreme-court-review'].includes(draft.review ?? '')) contradictions.push('최고지도자가 심사 법관을 직접 임명하므로 사법심사가 인사 충성 경쟁으로 변할 위험이 큽니다.');
  if (draft.government === 'peoples-congress' && draft.review === 'parliamentary-sovereignty') contradictions.push('대표대회와 의회주권의 최종 해석권이 중첩됩니다. 최고기관을 헌법 부칙으로 확정해야 합니다.');
  if (draft.territory === 'federal-compact' && draft.government === 'presidential-separation') contradictions.push('연방 대통령과 주정부 사이의 비상·재정 권한 충돌 가능성이 큽니다. 강한 권한쟁의 절차가 필요합니다.');
  if (draft.territory === 'self-determination-compact' && draft.emergency === 'permanent-security-directorate') contradictions.push('자결 국민투표 약속과 보위기관의 영토통제가 충돌해 탈식민 전쟁으로 번질 수 있습니다.');
  return contradictions;
}

function constitutionName(draft: Record<ConstitutionAxis, string>, nationId: NationId) {
  const government = getConstitutionClause(draft.government)?.name ?? '국가';
  const suffix = government.includes('군주') ? '헌장' : government.includes('인민') || government.includes('평의회') ? '인민기본법' : '헌법';
  const nationLabel: Record<NationId, string> = { britain: '브리튼', usa: '미합중국', ussr: '유라시아', germany: '독일', japan: '일본', china: '중화', india: '인도', freefrance: '프랑스', italy: '이탈리아', korea: '한국', vietnam: '베트남', indonesia: '인도네시아', philippines: '필리핀' };
  return `${nationLabel[nationId]} ${suffix} · ${government}`;
}

function mapGovernmentForm(governmentId: string): GovernmentFormId {
  if (governmentId === 'constitutional-crown') return 'constitutional-monarchy';
  if (governmentId === 'presidential-separation') return 'presidential-republic';
  if (governmentId === 'semi-presidential') return 'semi-presidential-republic';
  if (governmentId === 'peoples-congress' || governmentId === 'council-directorate') return 'peoples-commonwealth';
  return 'parliamentary-republic';
}

export function ratifyConstitution(state: ConstitutionalJudiciaryState, methodId: RatificationMethodId, context: ConstitutionalContext): ConstitutionalActionResult | null {
  const method = ratificationMethods.find((candidate) => candidate.id === methodId);
  if (!method || state.status !== 'drafting' || context.role.tier !== 1 || context.politicalPower < method.politicalCost || context.treasury < method.treasuryCost) return null;
  if (!axes.every((axis) => state.draft[axis])) return null;
  if (methodId === 'royal-assent' && state.draft.government !== 'constitutional-crown') return null;
  if (methodId === 'party-congress' && !['peoples-congress', 'council-directorate'].includes(state.draft.government ?? '')) return null;
  const clauses = Object.fromEntries(axes.map((axis) => [axis, state.draft[axis]!])) as Record<ConstitutionAxis, string>;
  const definitions = axes.map((axis) => getConstitutionClause(clauses[axis])!);
  const contradictions = getConstitutionContradictions(clauses);
  const independence = definitions.reduce((sum, clause) => sum + clause.independence, 0);
  const rights = definitions.reduce((sum, clause) => sum + clause.rights, 0);
  const executive = definitions.reduce((sum, clause) => sum + clause.executive, 0);
  const stability = definitions.reduce((sum, clause) => sum + clause.stability, 0);
  const legitimacy = definitions.reduce((sum, clause) => sum + clause.legitimacy, 0);
  const publicSupport = clamp(Math.round(context.legitimacy * .38 + context.publicConfidence * .28 + context.stability * .18 + method.support + legitimacy * .18 - contradictions.length * 8));
  const enacted: EnactedConstitution = {
    name: constitutionName(clauses, state.nationId),
    enactedWeek: context.week,
    ratificationMethodId: methodId,
    clauses,
    amendmentThreshold: methodId === 'executive-proclamation' ? '지도자 명령 또는 추후 의회 과반' : methodId === 'referendum' ? '의회 3분의 2와 국민투표' : '대표기관 3분의 2',
    publicSupport,
    contradictions,
  };
  const title = `헌법 제정 · ${enacted.name}`;
  const detail = `${method.name}으로 일곱 헌정 축을 공포했습니다. 지지 ${publicSupport}/100, 조항 충돌 ${contradictions.length}건이 장기 정치와 재판에 반영됩니다.`;
  return {
    state: {
      ...state,
      status: 'enacted',
      enacted,
      courtIndependence: clamp(state.courtIndependence + independence * .45),
      prosecutorialAutonomy: clamp(state.prosecutorialAutonomy + (getConstitutionClause(clauses.prosecution)?.independence ?? 0) * .75),
      judicialCapacity: clamp(state.judicialCapacity + context.institutionalCapacity * .08 + (clauses.appointments === 'career-judicial-council' ? 8 : 3)),
      rightsProtection: clamp(state.rightsProtection + rights * .5),
      executiveConstraint: clamp(50 - executive * .55),
      history: [{ id: `constitution-${context.week}`, week: context.week, title, detail, tone: (contradictions.length >= 2 ? 'bad' : 'good') as ConstitutionalHistoryRecord['tone'] }, ...state.history].slice(0, 100),
    },
    title,
    detail,
    politicalPowerDelta: -method.politicalCost,
    treasuryDelta: -method.treasuryCost,
    stabilityDelta: Math.round(stability * .18 - contradictions.length * 2),
    legitimacyDelta: method.legitimacy + Math.round(legitimacy * .12) - contradictions.length * 2,
    unrestDelta: Math.round(contradictions.length * 2 - rights * .06),
    institutionalCapacityDelta: clauses.appointments === 'career-judicial-council' || clauses.appointments === 'independent-commission' ? 4 : 1,
    publicConfidenceDelta: Math.round((publicSupport - 50) / 12),
    justiceIndependenceDelta: Math.round(independence * .18),
    justiceIntegrityDelta: Math.round((rights + independence) * .08),
    governmentFormId: mapGovernmentForm(clauses.government),
  };
}

export function getVacantJudicialOffices(state: ConstitutionalJudiciaryState, week: number) {
  return judicialOffices.filter((office) => isJudicialOfficeConstitutionallyEnabled(state, office.id) && !state.appointments.some((appointment) => appointment.officeId === office.id && appointment.termEndWeek > week));
}

export function isJudicialOfficeConstitutionallyEnabled(state: ConstitutionalJudiciaryState, officeId: JudicialOfficeId) {
  if (officeId !== 'constitutional-justice') return true;
  return !state.enacted || state.enacted.clauses.review === 'constitutional-court-review';
}

export function canNominateJudicialOffice(office: JudicialOfficeDefinition, context: ConstitutionalContext) {
  if (!context.role || context.role.tier > office.minimumTier) return { allowed: false, reason: `${office.minimumTier}급 이내 인사권이 필요합니다.` };
  if (context.role.tier !== 1 && context.role.branch !== 'politics' && !(office.id === 'military-advocate-general' && context.role.branch === 'military')) return { allowed: false, reason: '정치·법무 또는 해당 군 지휘 보직의 인사권이 필요합니다.' };
  if (context.politicalPower < office.politicalCost || context.treasury < office.treasuryCost) return { allowed: false, reason: `정치력 ${office.politicalCost}·국고 ${office.treasuryCost} 필요` };
  return { allowed: true, reason: '후보 검증을 개시할 수 있습니다.' };
}

export function nominateJudicialCandidate(state: ConstitutionalJudiciaryState, officeId: JudicialOfficeId, candidateId: string, context: ConstitutionalContext): ConstitutionalActionResult | null {
  const office = judicialOffices.find((candidate) => candidate.id === officeId);
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!office || !candidate || state.activeNomination || !getVacantJudicialOffices(state, context.week).some((item) => item.id === officeId) || !canNominateJudicialOffice(office, context).allowed) return null;
  const appointmentClause = state.enacted?.clauses.appointments;
  const processBonus = appointmentClause === 'independent-commission' ? 8 : appointmentClause === 'career-judicial-council' ? 6 : appointmentClause === 'leader-appointment' ? -7 : 2;
  const vettingScore = clamp(Math.round(candidate.integrity * .38 + candidate.competence * .3 + (100 - candidate.securityConcern) * .16 + candidate.experience * .16));
  const hearingSupport = clamp(Math.round(candidate.coalitionSupport * .5 + candidate.publicTrust * .25 + vettingScore * .25 + processBonus));
  const title = `${office.name} 후보 지명 · ${candidate.name}`;
  const detail = `재산·경력·판결·수사기록 검증을 시작했습니다. ${context.week + 3}주차에 검증 결과와 청문 지지도를 공개합니다.`;
  return {
    state: {
      ...state,
      activeNomination: { id: `nomination-${officeId}-${candidateId}-${context.week}`, officeId, candidateId, stage: 'vetting', openedWeek: context.week, nextReviewWeek: context.week + 2, hearingSupport, vettingScore, concern: candidate.disclosure },
      history: [{ id: `nominate-${candidateId}-${context.week}`, week: context.week, title, detail, tone: 'neutral' as const }, ...state.history].slice(0, 100),
    },
    title,
    detail,
    politicalPowerDelta: -office.politicalCost,
    treasuryDelta: -office.treasuryCost,
    stabilityDelta: 0,
    legitimacyDelta: 0,
    unrestDelta: 0,
    institutionalCapacityDelta: 0,
    publicConfidenceDelta: 0,
    justiceIndependenceDelta: 0,
    justiceIntegrityDelta: 0,
  };
}

export function advanceConstitutionalJudiciaryWeek(state: ConstitutionalJudiciaryState, context: ConstitutionalContext): ConstitutionalAdvanceResult {
  let next = state;
  const events: ConstitutionalAdvanceResult['events'] = [];
  if (state.status === 'awaiting-authority' && context.role.tier === 1) {
    const activated = activateConstitutionalFounding(state, context);
    if (activated) {
      next = activated.state;
      events.push({ title: activated.title, detail: activated.detail, tone: 'neutral' });
    }
  }
  const nomination = next.activeNomination;
  if (nomination && context.week >= nomination.nextReviewWeek) {
    const office = judicialOffices.find((item) => item.id === nomination.officeId)!;
    const candidate = next.candidates.find((item) => item.id === nomination.candidateId)!;
    if (nomination.stage === 'vetting') {
      const detail = `${candidate.name} 후보의 검증 점수는 ${nomination.vettingScore}/100입니다. 공개 청문에서 ${candidate.disclosure}`;
      next = { ...next, activeNomination: { ...nomination, stage: 'hearing', nextReviewWeek: context.week + 1 }, history: [{ id: `vetting-${nomination.id}-${context.week}`, week: context.week, title: `${office.name} 검증보고서 공개`, detail, tone: (nomination.vettingScore >= 65 ? 'good' : 'bad') as ConstitutionalHistoryRecord['tone'] }, ...next.history].slice(0, 100) };
      events.push({ title: `${office.name} 검증보고서 공개`, detail, tone: nomination.vettingScore >= 65 ? 'good' : 'bad' });
    } else if (nomination.stage === 'hearing') {
      const detail = `${candidate.name} 후보의 청문 지지도는 ${nomination.hearingSupport}/100입니다. 인준·재검증·철회 또는 강행을 결재하십시오.`;
      next = { ...next, activeNomination: { ...nomination, stage: 'confirmation', nextReviewWeek: context.week }, history: [{ id: `hearing-${nomination.id}-${context.week}`, week: context.week, title: `${office.name} 인준 표결 대기`, detail, tone: (nomination.hearingSupport >= 55 ? 'good' : 'neutral') as ConstitutionalHistoryRecord['tone'] }, ...next.history].slice(0, 100) };
      events.push({ title: `${office.name} 인준 표결 대기`, detail, tone: nomination.hearingSupport >= 55 ? 'good' : 'neutral' });
    }
  }
  const activeAppointments = next.appointments.filter((appointment) => appointment.termEndWeek > context.week);
  if (activeAppointments.length !== next.appointments.length) {
    const expired = next.appointments.filter((appointment) => appointment.termEndWeek <= context.week);
    next = { ...next, appointments: activeAppointments, history: [...expired.map((appointment) => ({ id: `term-end-${appointment.id}-${context.week}`, week: context.week, title: `${judicialOffices.find((office) => office.id === appointment.officeId)?.name ?? '사법 보직'} 임기 종료`, detail: `${appointment.candidateName}의 임기가 종료되어 후임 인선이 필요합니다.`, tone: 'neutral' as const })), ...next.history].slice(0, 100) };
    expired.forEach((appointment) => events.push({ title: '사법 고위직 임기 종료', detail: `${appointment.candidateName}의 임기가 종료됐습니다.`, tone: 'neutral' }));
  }
  return { state: next, events };
}

export function resolveJudicialNomination(state: ConstitutionalJudiciaryState, decisionId: NominationDecisionId, context: ConstitutionalContext): ConstitutionalActionResult | null {
  const nomination = state.activeNomination;
  if (!nomination || nomination.stage !== 'confirmation') return null;
  const office = judicialOffices.find((item) => item.id === nomination.officeId)!;
  const candidate = state.candidates.find((item) => item.id === nomination.candidateId)!;
  if (context.role.tier > office.minimumTier) return null;
  if (decisionId === 'return-vetting') {
    if (context.politicalPower < 3 || context.treasury < 4) return null;
    const title = `${candidate.name} 후보 보강검증`;
    const detail = '재산·이해충돌·과거 사건 기록을 2주간 추가 조사합니다. 지연은 공석 비용을 만들지만 기습 폭로 가능성을 낮춥니다.';
    return {
      state: { ...state, activeNomination: { ...nomination, stage: 'vetting', nextReviewWeek: context.week + 2, vettingScore: clamp(nomination.vettingScore + 5), hearingSupport: clamp(nomination.hearingSupport + 2) }, history: [{ id: `recheck-${nomination.id}-${context.week}`, week: context.week, title, detail, tone: 'neutral' as const }, ...state.history].slice(0, 100) },
      title, detail, politicalPowerDelta: -3, treasuryDelta: -4, stabilityDelta: 0, legitimacyDelta: 1, unrestDelta: 0, institutionalCapacityDelta: 1, publicConfidenceDelta: 1, justiceIndependenceDelta: 1, justiceIntegrityDelta: 2,
    };
  }
  if (decisionId === 'withdraw') {
    const title = `${office.name} 지명 철회`;
    const detail = `${candidate.name} 후보 지명을 철회했습니다. 공석은 유지되며 새 후보를 선택할 수 있습니다.`;
    return {
      state: { ...state, activeNomination: null, history: [{ id: `withdraw-${nomination.id}-${context.week}`, week: context.week, title, detail, tone: 'neutral' as const }, ...state.history].slice(0, 100) },
      title, detail, politicalPowerDelta: 0, treasuryDelta: 0, stabilityDelta: 0, legitimacyDelta: nomination.hearingSupport >= 65 ? -2 : 0, unrestDelta: 0, institutionalCapacityDelta: 0, publicConfidenceDelta: nomination.hearingSupport >= 65 ? -1 : 1, justiceIndependenceDelta: 0, justiceIntegrityDelta: 0,
    };
  }
  const forceThrough = decisionId === 'force-through';
  if (!forceThrough && (nomination.hearingSupport < 50 || context.politicalPower < 2)) return null;
  if (forceThrough && (context.role.tier !== 1 || context.politicalPower < 8)) return null;
  const processIndependence = state.enacted?.clauses.appointments === 'independent-commission' ? 6 : state.enacted?.clauses.appointments === 'leader-appointment' ? -8 : 1;
  const appointment: JudicialAppointment = {
    id: `appointment-${nomination.officeId}-${context.week}`,
    officeId: nomination.officeId,
    candidateId: candidate.id,
    candidateName: candidate.name,
    appointedWeek: context.week,
    termEndWeek: context.week + office.termWeeks,
    confirmationSupport: forceThrough ? nomination.hearingSupport - 15 : nomination.hearingSupport,
    independence: candidate.independence,
    integrity: candidate.integrity,
    competence: candidate.competence,
  };
  const title = `${office.name} 임명 · ${candidate.name}`;
  const detail = forceThrough
    ? `반대 의견을 누르고 임명을 강행했습니다. ${office.termWeeks}주 임기가 시작되지만 사법 인사의 정당성 논쟁이 남습니다.`
    : `검증과 공개 청문을 거쳐 지지도 ${nomination.hearingSupport}/100으로 임명했습니다. ${office.termWeeks}주 임기가 시작됩니다.`;
  const independenceDelta = Math.round((candidate.independence - 50) / 12 + processIndependence - (forceThrough ? 6 : 0));
  const integrityDelta = Math.round((candidate.integrity - 50) / 14 - (forceThrough ? 3 : 0));
  return {
    state: {
      ...state,
      appointments: [appointment, ...state.appointments.filter((item) => item.officeId !== office.id)].slice(0, 20),
      activeNomination: null,
      courtIndependence: clamp(state.courtIndependence + (office.branch === 'judge' ? independenceDelta : 0)),
      prosecutorialAutonomy: clamp(state.prosecutorialAutonomy + (office.branch === 'prosecutor' ? independenceDelta : 0)),
      judicialCapacity: clamp(state.judicialCapacity + Math.round((candidate.competence - 50) / 15)),
      history: [{ id: `confirm-${nomination.id}-${context.week}`, week: context.week, title, detail, tone: (forceThrough || candidate.integrity < 60 ? 'bad' : 'good') as ConstitutionalHistoryRecord['tone'] }, ...state.history].slice(0, 100),
    },
    title,
    detail,
    politicalPowerDelta: forceThrough ? -8 : -2,
    treasuryDelta: 0,
    stabilityDelta: forceThrough ? -2 : nomination.hearingSupport >= 65 ? 1 : 0,
    legitimacyDelta: forceThrough ? -5 : Math.round((nomination.hearingSupport - 50) / 12),
    unrestDelta: forceThrough ? 4 : 0,
    institutionalCapacityDelta: Math.round((candidate.competence - 50) / 18),
    publicConfidenceDelta: forceThrough ? -5 : Math.round((candidate.publicTrust - 50) / 15),
    justiceIndependenceDelta: independenceDelta,
    justiceIntegrityDelta: integrityDelta,
  };
}

export function getConstitutionDraftProgress(state: ConstitutionalJudiciaryState) {
  return axes.filter((axis) => state.draft[axis]).length;
}

export function normalizeConstitutionalJudiciaryState(value: unknown, nationId: NationId): ConstitutionalJudiciaryState {
  const fallback = createConstitutionalJudiciaryState(nationId);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<ConstitutionalJudiciaryState>;
  if (candidate.version !== 1 || candidate.nationId !== nationId) return fallback;
  const candidates = Array.isArray(candidate.candidates) && candidate.candidates.length >= 4 ? candidate.candidates : fallback.candidates;
  return {
    ...fallback,
    ...candidate,
    draft: candidate.draft ?? {},
    enacted: candidate.enacted ?? null,
    candidates,
    appointments: Array.isArray(candidate.appointments) ? candidate.appointments.slice(0, 20) : [],
    activeNomination: candidate.activeNomination ?? null,
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 100) : [],
    courtIndependence: clamp(Number(candidate.courtIndependence ?? fallback.courtIndependence)),
    prosecutorialAutonomy: clamp(Number(candidate.prosecutorialAutonomy ?? fallback.prosecutorialAutonomy)),
    judicialCapacity: clamp(Number(candidate.judicialCapacity ?? fallback.judicialCapacity)),
    rightsProtection: clamp(Number(candidate.rightsProtection ?? fallback.rightsProtection)),
    executiveConstraint: clamp(Number(candidate.executiveConstraint ?? fallback.executiveConstraint)),
  };
}
