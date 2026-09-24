import type { CareerRole, NationId } from './types';
import { withJosa } from './koreanGrammar';

export type JusticeCaseCategory =
  | 'procurement-bribery'
  | 'command-responsibility'
  | 'political-finance'
  | 'election-interference'
  | 'intelligence-abuse'
  | 'corporate-bribery'
  | 'foreign-influence'
  | 'public-contract'
  | 'environmental-coverup'
  | 'offshore-assets'
  | 'press-freedom'
  | 'journalist-attack';

export type JusticeCaseStage = 'assessment' | 'investigation' | 'charging' | 'pretrial' | 'trial' | 'appeal' | 'closed';
export type JusticeJurisdiction = 'undecided' | 'ordinary-court' | 'independent-prosecutor' | 'military-tribunal' | 'special-court' | 'truth-commission';
export type JusticeDecisionKind = 'case-opening' | 'bribe-approach' | 'prosecutor-threat' | 'media-leak' | 'charge-route' | 'trial-procedure' | 'verdict-response';
export type JusticeDecisionOptionId =
  | 'appoint-independent-prosecutor'
  | 'direct-ministry-investigation'
  | 'military-inquiry'
  | 'shelve-allegation'
  | 'refuse-and-record-bribe'
  | 'controlled-sting'
  | 'accept-secret-arrangement'
  | 'protect-prosecution-team'
  | 'replace-lead-prosecutor'
  | 'publicize-intimidation'
  | 'evidence-based-briefing'
  | 'protect-source-and-seal'
  | 'seek-prior-restraint'
  | 'file-public-indictment'
  | 'refer-special-court'
  | 'refer-truth-commission'
  | 'decline-charges'
  | 'open-court'
  | 'closed-security-court'
  | 'negotiate-plea'
  | 'respect-verdict'
  | 'appeal-verdict'
  | 'executive-pardon'
  | 'attack-court-and-press';

export interface JusticeEvidenceItem {
  id: string;
  type: 'document' | 'financial' | 'witness' | 'forensic' | 'press' | 'intelligence';
  title: string;
  detail: string;
  reliability: number;
  custody: number;
  public: boolean;
}

export interface JusticeCaseTemplate {
  id: string;
  category: JusticeCaseCategory;
  title: string;
  allegation: string;
  suspect: string;
  office: string;
  firstYear: number;
  severity: number;
  accusedPower: number;
  baseEvidence: number;
  pressAngle: string;
  historicalBasis: string;
}

export interface JusticeCaseRecord {
  id: string;
  templateId: string;
  category: JusticeCaseCategory;
  title: string;
  allegation: string;
  suspect: string;
  office: string;
  stage: JusticeCaseStage;
  jurisdiction: JusticeJurisdiction;
  openedWeek: number;
  stageStartedWeek: number;
  nextReviewWeek: number;
  severity: number;
  accusedPower: number;
  evidenceStrength: number;
  chainOfCustody: number;
  witnessSafety: number;
  prosecutorSafety: number;
  mediaAttention: number;
  publicConfidence: number;
  prosecutor: string;
  judge: string;
  reporter: string;
  evidence: JusticeEvidenceItem[];
  turningPoints: string[];
  outcome: string | null;
  sentence: string | null;
  closedWeek: number | null;
}

export interface JusticePendingDecision {
  id: string;
  caseId: string;
  kind: JusticeDecisionKind;
  openedWeek: number;
  deadlineWeek: number;
  title: string;
  briefing: string;
  danger: string;
  optionIds: JusticeDecisionOptionId[];
}

export interface JusticeHistoryRecord {
  id: string;
  week: number;
  caseId: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
}

export interface JusticeSystemState {
  version: 1;
  nationId: NationId;
  independence: number;
  integrity: number;
  transparency: number;
  prosecutorSafety: number;
  sourceProtection: number;
  corruptionPressure: number;
  impunity: number;
  cases: JusticeCaseRecord[];
  activeCaseId: string | null;
  pendingDecision: JusticePendingDecision | null;
  nextCaseWeek: number;
  convictions: number;
  acquittals: number;
  dismissals: number;
  unresolvedAttacks: number;
  history: JusticeHistoryRecord[];
}

export interface JusticeContext {
  week: number;
  year: number;
  phase: 'war' | 'nation';
  nationId: NationId;
  role: CareerRole;
  politicalPower: number;
  treasury: number;
  stability: number;
  intelNetwork: number;
  legitimacy: number;
  unrest: number;
  institutionalCapacity: number;
  mediaFreedom: number;
  pressTrust: number;
  activeElection: boolean;
  strategyId: string;
}

export interface JusticeEvent {
  id: string;
  title: string;
  detail: string;
  tone: 'good' | 'bad' | 'neutral';
  cause: string;
  consequence: string;
  requiresDecision?: boolean;
}

export interface JusticeAdvanceResult {
  state: JusticeSystemState;
  events: JusticeEvent[];
  legitimacyDelta: number;
  unrestDelta: number;
  institutionalCapacityDelta: number;
  publicConfidenceDelta: number;
  politicalPowerDelta: number;
  treasuryDelta: number;
  stabilityDelta: number;
  note: string;
}

export interface JusticeActionResult extends JusticeAdvanceResult {
  actionTitle: string;
  actionDetail: string;
}

export interface JusticeDecisionOptionDefinition {
  id: JusticeDecisionOptionId;
  name: string;
  approach: string;
  forecast: string;
  politicalCost: number;
  treasuryCost: number;
  minimumTier: 1 | 2 | 3 | 4 | 5;
  tone: 'good' | 'bad' | 'neutral';
}

const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number, digits = 1) => Number(value.toFixed(digits));

const evidenceTypeLabels: Record<JusticeEvidenceItem['type'], string> = {
  document: '공문서류',
  financial: '자금 추적',
  witness: '증인 진술',
  forensic: '감식 결과',
  press: '취재 자료',
  intelligence: '정보 기록',
};

export const justiceCaseTemplates: JusticeCaseTemplate[] = [
  { id: 'wartime-shell-ledger', category: 'procurement-bribery', title: '포탄 납품가·리베이트 장부', allegation: '불량 포탄을 검수 통과시키고 허위 단가를 지급한 대가로 군수조달 관리가 현금과 외화를 받았다는 의혹입니다.', suspect: '군수조달국 고위 관리', office: '군수조달국', firstYear: 1939, severity: 68, accusedPower: 64, baseEvidence: 48, pressAngle: '전선 병사의 생명과 납품업체 특혜', historicalBasis: '전시 조달 부패·원가 부풀리기·불량 군수품 사례를 합성한 가상 사건' },
  { id: 'occupation-requisition', category: 'command-responsibility', title: '점령지 징발·민간인 피해 지휘책임', allegation: '작전 명령과 징발 지침이 민간인 피해를 예측하고도 방지하지 않았다는 의혹입니다.', suspect: '지역 작전사령부', office: '전구사령부', firstYear: 1943, severity: 86, accusedPower: 83, baseEvidence: 38, pressAngle: '생존자 증언과 명령체계 기록', historicalBasis: '뉘른베르크 원칙의 개인·지휘책임과 공정재판 원칙을 반영한 가상 사건' },
  { id: 'campaign-cash-box', category: 'political-finance', title: '선거자금 비밀금고와 차명 기부', allegation: '군수·통신 기업의 승인을 대가로 차명 기부와 비자금을 조성했다는 의혹입니다.', suspect: '집권 연합 재정책임자', office: '집권 연합', firstYear: 1945, severity: 73, accusedPower: 78, baseEvidence: 43, pressAngle: '정책 결정과 후원금의 교환', historicalBasis: '워터게이트 특별검사 기록의 선거기부·업무방해 수사를 일반화한 가상 사건' },
  { id: 'ballot-pressure', category: 'election-interference', title: '지방 표집계소 압력과 공무원 동원', allegation: '지방 권력자가 행정망을 사용해 유권자와 개표요원에게 압력을 가했다는 의혹입니다.', suspect: '지방 행정책임자', office: '지방정부', firstYear: 1945, severity: 70, accusedPower: 67, baseEvidence: 42, pressAngle: '투표권과 개표 독립', historicalBasis: '선거 감시·관선거·행정조직 동원 사례를 합성한 가상 사건' },
  { id: 'domestic-surveillance', category: 'intelligence-abuse', title: '국내 감찰·세무자료 정치 악용', allegation: '정보기관과 세무조직이 정치적 비판자의 통신과 자산을 법적 근거 없이 조사했다는 의혹입니다.', suspect: '국가정보기관 작전책임자', office: '정보·치안기관', firstYear: 1942, severity: 75, accusedPower: 82, baseEvidence: 35, pressAngle: '국가안보와 시민권리의 경계', historicalBasis: '감찰·세무기관 악용·보복수사 기록을 일반화한 가상 사건' },
  { id: 'industrial-license', category: 'corporate-bribery', title: '산업 면허·독점권 뇌물', allegation: '신설 공장과 독점 면허를 받기 위해 기업 측이 정책결정자에게 현금·주식·취업 약속을 제공했다는 의혹입니다.', suspect: '산업부 인허가 책임자', office: '산업부·특허청', firstYear: 1950, severity: 66, accusedPower: 62, baseEvidence: 51, pressAngle: '독점 특혜와 전관 취업', historicalBasis: 'UNCAC의 공공·민간 부문 뇌물·법인책임·장부 무결성 원칙을 반영한 가상 사건' },
  { id: 'foreign-funds', category: 'foreign-influence', title: '외국 정보기관·기업의 비밀 자금', allegation: '외국 정책에 유리한 투표와 군수계약을 대가로 중개인이 비밀 자금을 전달했다는 의혹입니다.', suspect: '외교·국방 정책 중개인', office: '외교위원회', firstYear: 1945, severity: 78, accusedPower: 76, baseEvidence: 37, pressAngle: '국가주권과 외국 자금', historicalBasis: '외국세력 포섭·비밀 선거자금·로비 사례를 합성한 가상 사건' },
  { id: 'emergency-hospital-contract', category: 'public-contract', title: '긴급 의약품·병원 계약 특혜', allegation: '보건 위기의 수의계약에서 가격을 부풀리고 실질 소유자를 숨겼다는 의혹입니다.', suspect: '보건조달청 계약책임자', office: '보건조달청', firstYear: 1950, severity: 71, accusedPower: 58, baseEvidence: 55, pressAngle: '생명과 재난 이익의 충돌', historicalBasis: '재난·전염병 긴급조달에서의 이익충돌·실질소유자 은닉 위험을 반영한 가상 사건' },
  { id: 'toxic-report', category: 'environmental-coverup', title: '유독물질 조사보고서 은폐', allegation: '국영·민영 산업체의 오염 피해를 숨기기 위해 감식결과를 변조했다는 의혹입니다.', suspect: '산업안전위원회 고위자', office: '산업안전위원회', firstYear: 1965, severity: 72, accusedPower: 69, baseEvidence: 46, pressAngle: '지역 건강과 기업 가동률', historicalBasis: '산업재해·공해 자료 은폐·내부고발 사례를 합성한 가상 사건' },
  { id: 'offshore-minister', category: 'offshore-assets', title: '고위공직자 차명계좌·해외자산', allegation: '공직 소득으로 설명되지 않는 자산을 차명회사와 해외계좌로 은닉했다는 의혹입니다.', suspect: '경제부처 고위공직자', office: '경제·재정부처', firstYear: 1970, severity: 69, accusedPower: 72, baseEvidence: 44, pressAngle: '재산공개와 권력형 치부', historicalBasis: 'UNCAC의 불법자산 증식·자산회수·국제공조 구조를 반영한 가상 사건' },
  { id: 'classified-papers', category: 'press-freedom', title: '기밀문서 보도·사전금지 소송', allegation: '신문사가 정부의 전쟁 판단과 현실의 괴리를 드러내는 기밀문서를 입수했고, 정부가 출판금지를 청구했습니다.', suspect: '정부와 보도기관의 법적 추돌', office: '신문사·국방부처', firstYear: 1942, severity: 74, accusedPower: 80, baseEvidence: 66, pressAngle: '국가안보·공익보도·사전억제', historicalBasis: '펜타곤 페이퍼 사전금지 판결의 증명책임과 공익보도 갈등을 일반화한 가상 사건' },
  { id: 'newsroom-attack', category: 'journalist-attack', title: '편집국 방화·취재진 협박', allegation: '부패·전쟁범죄를 취재하던 기자와 편집국에 협박과 물리적 공격이 이어졌다는 신고입니다.', suspect: '정체불명 무장조직과 권력자 연결망', office: '언론사·치안기관', firstYear: 1942, severity: 82, accusedPower: 74, baseEvidence: 31, pressAngle: '기자 안전과 미제 사건의 책임', historicalBasis: 'UNESCO 기자 안전·무처벌 방지·검사 수사지침을 반영한 가상 사건' },
];

const decisionOptions: Record<JusticeDecisionOptionId, JusticeDecisionOptionDefinition> = {
  'appoint-independent-prosecutor': { id: 'appoint-independent-prosecutor', name: '독립 특별검사 임명', approach: '수사범위·예산·해임조건을 서면으로 보장합니다.', forecast: '독립성·증거보전 크게 상승, 지도부 통제력 감소', politicalCost: 5, treasuryCost: 8, minimumTier: 2, tone: 'good' },
  'direct-ministry-investigation': { id: 'direct-ministry-investigation', name: '법무부 직할 수사팀', approach: '기존 명령체계에서 수사하되 주간보고를 받습니다.', forecast: '빠른 착수, 고위권력 수사에서 개입 위험', politicalCost: 2, treasuryCost: 3, minimumTier: 3, tone: 'neutral' },
  'military-inquiry': { id: 'military-inquiry', name: '군 감찰·수사본부', approach: '전시 보안과 지휘체계를 유지한 채 군 내부 절차로 조사합니다.', forecast: '기밀 보호 상승, 민간 신뢰·독립성 하락 위험', politicalCost: 2, treasuryCost: 4, minimumTier: 2, tone: 'neutral' },
  'shelve-allegation': { id: 'shelve-allegation', name: '내사 종결·기록 봉인', approach: '국가안보나 정권 안정을 이유로 사건을 덜어냅니다.', forecast: '단기 안정, 유출 시 무처벌·부패압력 급증', politicalCost: 0, treasuryCost: 0, minimumTier: 2, tone: 'bad' },
  'refuse-and-record-bribe': { id: 'refuse-and-record-bribe', name: '뇌물 거절·접촉 기록', approach: '제안을 거절하고 적법한 방법으로 접촉 경로를 보존합니다.', forecast: '사법방해 증거 확보, 검사·증인 보복위험 상승', politicalCost: 1, treasuryCost: 1, minimumTier: 5, tone: 'good' },
  'controlled-sting': { id: 'controlled-sting', name: '사법승인 하 통제배달', approach: '법원의 통제와 녹음·자금추적 계획 하에 뇌물 전달책을 확인합니다.', forecast: '강한 증거 가능, 작전 노출 시 수사 위기', politicalCost: 3, treasuryCost: 5, minimumTier: 2, tone: 'good' },
  'accept-secret-arrangement': { id: 'accept-secret-arrangement', name: '비밀 타협·수사 축소', approach: '정치자금과 조직 안정을 대가로 핵심 증거를 제외합니다.', forecast: '국고·정치력 즉시 이득, 부패·폭로·협박 위험 누적', politicalCost: 0, treasuryCost: 0, minimumTier: 2, tone: 'bad' },
  'protect-prosecution-team': { id: 'protect-prosecution-team', name: '검사·가족·증인 보호', approach: '독립 경호, 전근 확인, 증인 이주를 패키지로 승인합니다.', forecast: '안전·증언 유지, 국고·정치자원 소모', politicalCost: 3, treasuryCost: 7, minimumTier: 4, tone: 'good' },
  'replace-lead-prosecutor': { id: 'replace-lead-prosecutor', name: '주임검사 교체', approach: '건강과 안전을 명분으로 수사팀 지휘부를 바꿉니다.', forecast: '즉시 위협 감소, 독립성·수사 연속성 하락', politicalCost: 1, treasuryCost: 2, minimumTier: 2, tone: 'bad' },
  'publicize-intimidation': { id: 'publicize-intimidation', name: '외부 압력 즉시 공개', approach: '협박·인사개입·행정방해를 사건번호와 함께 공개합니다.', forecast: '투명성·언론감시 상승, 권력연합 반발', politicalCost: 2, treasuryCost: 2, minimumTier: 4, tone: 'good' },
  'evidence-based-briefing': { id: 'evidence-based-briefing', name: '증거목록 기반 정례 브리핑', approach: '비공개 수사자료는 보호하고 확인된 절차·일정만 설명합니다.', forecast: '오보·여론재판 감소, 공개 노력 필요', politicalCost: 1, treasuryCost: 1, minimumTier: 5, tone: 'good' },
  'protect-source-and-seal': { id: 'protect-source-and-seal', name: '취재원 보호·증거 봉인', approach: '기자의 취재원과 대배심 증인의 신원을 분리 보호합니다.', forecast: '증인·취재원 안전 상승, 즉시 공개성 제한', politicalCost: 2, treasuryCost: 4, minimumTier: 5, tone: 'good' },
  'seek-prior-restraint': { id: 'seek-prior-restraint', name: '보도금지·압수수색 청구', approach: '국가안보를 이유로 출판 전 금지와 취재자료 확보를 시도합니다.', forecast: '단기 기밀 보호, 언론신뢰·취재원 보호 급락', politicalCost: 3, treasuryCost: 3, minimumTier: 2, tone: 'bad' },
  'file-public-indictment': { id: 'file-public-indictment', name: '공개 기소·증거목록 제출', approach: '피고의 방어권과 무죄추정을 명시하고 확인된 소인만 제출합니다.', forecast: '법정으로 전환, 대중관심·보복위험 상승', politicalCost: 3, treasuryCost: 5, minimumTier: 2, tone: 'good' },
  'refer-special-court': { id: 'refer-special-court', name: '독립 특별재판부 회부', approach: '고위권력·국제범죄를 전담할 임시법정과 항소절차를 설치합니다.', forecast: '전문성·접근성 상승, 승자의 정의·소급법 논란 위험', politicalCost: 6, treasuryCost: 12, minimumTier: 1, tone: 'neutral' },
  'refer-truth-commission': { id: 'refer-truth-commission', name: '진실위원회·조건부 소추', approach: '피해자 진술·기록 공개·배상을 우선하되 중대범죄는 면책하지 않습니다.', forecast: '진실규명·사회통합, 빠른 처벌은 제한', politicalCost: 4, treasuryCost: 9, minimumTier: 2, tone: 'neutral' },
  'decline-charges': { id: 'decline-charges', name: '불기소·보강수사 없음', approach: '증거불축 또는 공익을 이유로 소추를 종결합니다.', forecast: '법정 비용 절감, 고위자에 대한 무처벌 비판 가능', politicalCost: 0, treasuryCost: 0, minimumTier: 2, tone: 'bad' },
  'open-court': { id: 'open-court', name: '공개재판·독립 재판부', approach: '증인보호 부분을 제외하고 공판·증거목록·판결이유를 공개합니다.', forecast: '재판 신뢰·투명성 상승, 증인 노출·여론재판 위험', politicalCost: 2, treasuryCost: 4, minimumTier: 5, tone: 'good' },
  'closed-security-court': { id: 'closed-security-court', name: '비공개 안보공판', approach: '기밀 증거와 정보원을 이유로 방청·기록 열람을 제한합니다.', forecast: '기밀보호·증인안전 상승, 조작재판 의심 증가', politicalCost: 2, treasuryCost: 3, minimumTier: 2, tone: 'neutral' },
  'negotiate-plea': { id: 'negotiate-plea', name: '범죄인정·자산회수 합의', approach: '상위선 증언과 자산 환수를 대가로 일부 소인을 감경합니다.', forecast: '빠른 회수·확장수사, 유력자 부당거래 비판', politicalCost: 2, treasuryCost: 2, minimumTier: 2, tone: 'neutral' },
  'respect-verdict': { id: 'respect-verdict', name: '판결 수용·제도개혁', approach: '유무죄와 무관하게 판결이유를 공개하고 감사·조달·보호 제도를 개선합니다.', forecast: '사법독립·제도학습 상승', politicalCost: 1, treasuryCost: 3, minimumTier: 5, tone: 'good' },
  'appeal-verdict': { id: 'appeal-verdict', name: '적법절차로 항소', approach: '판결의 법리·증거채택 오류만 상급심에서 다툩니다.', forecast: '결론 지연, 절차적 정당성 유지', politicalCost: 2, treasuryCost: 5, minimumTier: 2, tone: 'neutral' },
  'executive-pardon': { id: 'executive-pardon', name: '행정부 사면·형집행 면제', approach: '국가통합과 정치적 필요를 이유로 판결의 효과를 제거합니다.', forecast: '특정 세력 지지 상승, 법 앞의 평등·검사 사기 급락', politicalCost: 4, treasuryCost: 0, minimumTier: 1, tone: 'bad' },
  'attack-court-and-press': { id: 'attack-court-and-press', name: '법원·검사·보도 공격', approach: '판결을 정치공작으로 규정하고 인사조치와 언론압박을 예고합니다.', forecast: '핵심 지지층 결집, 사법독립·언론자유·안정 급락', politicalCost: 2, treasuryCost: 0, minimumTier: 2, tone: 'bad' },
};

export function getJusticeDecisionOption(id: JusticeDecisionOptionId) {
  return decisionOptions[id];
}

export function getJusticeDecisionOptions(decision: JusticePendingDecision | null) {
  return decision ? decision.optionIds.map((id) => decisionOptions[id]) : [];
}

export const justiceStageLabels: Record<JusticeCaseStage, string> = {
  assessment: '사건 인지', investigation: '본수사', charging: '기소 검토', pretrial: '공판 준비', trial: '재판', appeal: '항소·사후절차', closed: '종결',
};

export const justiceJurisdictionLabels: Record<JusticeJurisdiction, string> = {
  undecided: '관할 미결정', 'ordinary-court': '일반 사법부', 'independent-prosecutor': '독립 특별검사', 'military-tribunal': '군 수사·재판', 'special-court': '독립 특별재판부', 'truth-commission': '진실위원회·조건부 소추',
};

export function getJusticeEvidenceTypeLabel(type: JusticeEvidenceItem['type']) {
  return evidenceTypeLabels[type];
}

export function getAvailableJusticeCaseTemplates(year: number) {
  return justiceCaseTemplates.filter((template) => year >= template.firstYear);
}

function baseEvidenceFor(template: JusticeCaseTemplate, week: number): JusticeEvidenceItem[] {
  const items: JusticeEvidenceItem[] = [
    { id: `${template.id}-document-${week}`, type: template.category === 'press-freedom' ? 'press' : 'document', title: template.category === 'press-freedom' ? '편집국 입수 문서 목록' : '결재문서·계약서 원본', detail: '작성시각·결재선·수정이력을 대조해야 합니다.', reliability: clamp(template.baseEvidence + 12), custody: 72, public: false },
    { id: `${template.id}-ledger-${week}`, type: template.category === 'command-responsibility' ? 'intelligence' : 'financial', title: template.category === 'command-responsibility' ? '작전일지·명령전문' : '자금흐름·차명계정 단서', detail: '독립 감식과 제3자 자료 확보가 필요합니다.', reliability: clamp(template.baseEvidence - 3), custody: 61, public: false },
    { id: `${template.id}-witness-${week}`, type: 'witness', title: '내부고발자·피해자 초기진술', detail: '보복으로부터 신원과 생계를 보호해야 증언이 유지됩니다.', reliability: clamp(template.baseEvidence - 8), custody: 54, public: false },
  ];
  return items;
}

function makeCase(template: JusticeCaseTemplate, week: number, serial: number): JusticeCaseRecord {
  return {
    id: `justice-${template.id}-${week}-${serial}`,
    templateId: template.id,
    category: template.category,
    title: template.title,
    allegation: template.allegation,
    suspect: template.suspect,
    office: template.office,
    stage: 'assessment',
    jurisdiction: 'undecided',
    openedWeek: week,
    stageStartedWeek: week,
    nextReviewWeek: week + 2,
    severity: template.severity,
    accusedPower: template.accusedPower,
    evidenceStrength: template.baseEvidence,
    chainOfCustody: 62,
    witnessSafety: 58,
    prosecutorSafety: 65,
    mediaAttention: clamp(26 + template.severity * .34),
    publicConfidence: 50,
    prosecutor: '수사배당 전',
    judge: '재판부 미배당',
    reporter: template.category === 'press-freedom' || template.category === 'journalist-attack' ? '탐사보도 편집팀' : '공공사건 취재반',
    evidence: baseEvidenceFor(template, week),
    turningPoints: [],
    outcome: null,
    sentence: null,
    closedWeek: null,
  };
}

function createPending(caseRecord: JusticeCaseRecord, kind: JusticeDecisionKind, week: number): JusticePendingDecision {
  if (kind === 'case-opening') return { id: `${caseRecord.id}-opening-${week}`, caseId: caseRecord.id, kind, openedWeek: week, deadlineWeek: week + 3, title: '수사 개시·관할 결정', briefing: `${caseRecord.title}의 초기 증거가 접수됐습니다. 누가 수사하고 어떤 해임·보고 규칙을 적용할지 결정하십시오.`, danger: '관할을 늘어뜨리면 증거 훼손과 검사 인사개입 가능성이 커집니다.', optionIds: ['appoint-independent-prosecutor', 'direct-ministry-investigation', 'military-inquiry', 'shelve-allegation'] };
  if (kind === 'bribe-approach') return { id: `${caseRecord.id}-bribe-${week}`, caseId: caseRecord.id, kind, openedWeek: week, deadlineWeek: week + 2, title: '중개인의 뇌물·타협 제안', briefing: `수사범위를 줄이면 정치자금과 조직 안정을 보장하겠다는 제안이 ${caseRecord.prosecutor}에게 전달됐습니다.`, danger: '비공식 접촉은 수사팀 내부의 다른 경로로도 이루어질 수 있습니다.', optionIds: ['refuse-and-record-bribe', 'controlled-sting', 'accept-secret-arrangement'] };
  if (kind === 'prosecutor-threat') return { id: `${caseRecord.id}-threat-${week}`, caseId: caseRecord.id, kind, openedWeek: week, deadlineWeek: week + 1, title: '주임검사 공격·인사압력', briefing: `${caseRecord.prosecutor}의 사무실이 털리고 가족 동선이 유포됐습니다. 동시에 상급기관은 주임검사 전보를 요구했습니다.`, danger: '물리적 안전, 수사 독립, 협박 공개가 서로 충돌합니다.', optionIds: ['protect-prosecution-team', 'replace-lead-prosecutor', 'publicize-intimidation'] };
  if (kind === 'media-leak') return { id: `${caseRecord.id}-media-${week}`, caseId: caseRecord.id, kind, openedWeek: week, deadlineWeek: week + 2, title: '수사기록 유출·단독보도 예고', briefing: `${caseRecord.reporter}이 ${caseRecord.title}의 문서 사본을 확보했습니다. 보도의 공익성과 증인·배심 오염 위험을 함께 판단해야 합니다.`, danger: '선제공격은 정보원을 위험에 빠뜨리고 사전억제 논란을 키울 수 있습니다.', optionIds: ['evidence-based-briefing', 'protect-source-and-seal', 'seek-prior-restraint'] };
  if (kind === 'charge-route') return { id: `${caseRecord.id}-charge-${week}`, caseId: caseRecord.id, kind, openedWeek: week, deadlineWeek: week + 3, title: '기소·특별재판·진실위 회부', briefing: `증거력 ${Math.round(caseRecord.evidenceStrength)}, 증거보전 ${Math.round(caseRecord.chainOfCustody)}, 피의자 권력 ${Math.round(caseRecord.accusedPower)}입니다. 소추의 장소와 목적을 결정하십시오.`, danger: '증거가 약하면 무죄판결이, 특별법정이 너무 정치적이면 정당성 손실이 남습니다.', optionIds: ['file-public-indictment', 'refer-special-court', 'refer-truth-commission', 'decline-charges'] };
  if (kind === 'trial-procedure') return { id: `${caseRecord.id}-trial-${week}`, caseId: caseRecord.id, kind, openedWeek: week, deadlineWeek: week + 3, title: '공판공개·증인보호·인정협상', briefing: `${caseRecord.title}의 재판부가 배당됐습니다. 공개원칙과 기밀보호, 상위선 수사를 위한 협상을 조합해야 합니다.`, danger: '여론재판과 밀실재판 모두 절차적 신뢰를 훼손할 수 있습니다.', optionIds: ['open-court', 'closed-security-court', 'negotiate-plea'] };
  return { id: `${caseRecord.id}-verdict-${week}`, caseId: caseRecord.id, kind, openedWeek: week, deadlineWeek: week + 2, title: '판결 후 행정부·검찰 대응', briefing: `${caseRecord.outcome ?? '판결'}이 선고됐습니다. 항소는 법리로, 사면은 공개된 이유로 판단해야 합니다.`, danger: '판결불복이 인신공격으로 바뀌면 사법부와 언론에 대한 폭력위험도 커집니다.', optionIds: ['respect-verdict', 'appeal-verdict', 'executive-pardon', 'attack-court-and-press'] };
}

function emptyAdvance(state: JusticeSystemState): JusticeAdvanceResult {
  return { state, events: [], legitimacyDelta: 0, unrestDelta: 0, institutionalCapacityDelta: 0, publicConfidenceDelta: 0, politicalPowerDelta: 0, treasuryDelta: 0, stabilityDelta: 0, note: `사법 독립 ${Math.round(state.independence)} · 무처벌 ${Math.round(state.impunity)} · 미결 ${state.cases.filter((item) => item.stage !== 'closed').length}건` };
}

export function createJusticeSystemState(nationId: NationId, startedWeek: number): JusticeSystemState {
  const starter = makeCase(justiceCaseTemplates[0], startedWeek, 1);
  return {
    version: 1,
    nationId,
    independence: 48,
    integrity: 52,
    transparency: 44,
    prosecutorSafety: 58,
    sourceProtection: 42,
    corruptionPressure: 46,
    impunity: 52,
    cases: [starter],
    activeCaseId: starter.id,
    pendingDecision: createPending(starter, 'case-opening', startedWeek),
    nextCaseWeek: startedWeek + 13,
    convictions: 0,
    acquittals: 0,
    dismissals: 0,
    unresolvedAttacks: 0,
    history: [{ id: `${starter.id}-opened`, week: startedWeek, caseId: starter.id, title: '초기 사건철 접수', detail: starter.allegation, tone: 'neutral' }],
  };
}

function appendHistory(state: JusticeSystemState, record: JusticeHistoryRecord) {
  return { ...state, history: [record, ...state.history].slice(0, 160) };
}

function replaceCase(state: JusticeSystemState, caseRecord: JusticeCaseRecord) {
  return { ...state, cases: state.cases.map((item) => item.id === caseRecord.id ? caseRecord : item) };
}

export function canUseJusticeOption(option: JusticeDecisionOptionDefinition, context: JusticeContext) {
  if (context.role.tier > option.minimumTier) return { allowed: false, reason: `${option.minimumTier}급 이내 사법·정치 결재권한 필요` };
  if (context.politicalPower < option.politicalCost) return { allowed: false, reason: `정치력 ${option.politicalCost} 필요` };
  if (context.treasury < option.treasuryCost) return { allowed: false, reason: `국고 ${option.treasuryCost}M 필요` };
  if (option.id === 'military-inquiry' && context.phase !== 'war') return { allowed: false, reason: '전시·계엄 체계에서만 선택 가능' };
  if (option.id === 'refer-truth-commission' && context.year < 1945) return { allowed: false, reason: '1945년 이후 전환기 정의 절차에서 가능' };
  return { allowed: true, reason: '결재 가능' };
}

export function openJusticeCase(state: JusticeSystemState, templateId: string, context: JusticeContext): JusticeActionResult | null {
  const template = getAvailableJusticeCaseTemplates(context.year).find((item) => item.id === templateId);
  if (!template || state.pendingDecision || state.cases.filter((item) => item.stage !== 'closed').length >= 6 || context.politicalPower < 2) return null;
  const caseRecord = makeCase(template, context.week, state.cases.length + 1);
  let next = replaceCase({ ...state, cases: [...state.cases, caseRecord], activeCaseId: caseRecord.id, pendingDecision: createPending(caseRecord, 'case-opening', context.week), nextCaseWeek: Math.max(state.nextCaseWeek, context.week + 10) }, caseRecord);
  next = appendHistory(next, { id: `${caseRecord.id}-opened`, week: context.week, caseId: caseRecord.id, title: '신규 사건철 개봉', detail: caseRecord.allegation, tone: 'neutral' });
  const event: JusticeEvent = { id: `${caseRecord.id}-decision-open`, title: `사건 인지 · ${caseRecord.title}`, detail: caseRecord.allegation, tone: 'neutral', cause: `${template.historicalBasis} · 초기 증거 ${caseRecord.evidenceStrength}/100`, consequence: '3주 안에 관할과 수사 독립성을 결정해야 합니다.', requiresDecision: true };
  return { ...emptyAdvance(next), events: [event], politicalPowerDelta: -2, actionTitle: '사건철 개봉', actionDetail: `${withJosa(caseRecord.title, '을/를')} 공식 사건으로 등록했습니다.` };
}

function resolveVerdict(caseRecord: JusticeCaseRecord, state: JusticeSystemState) {
  const dueProcess = state.independence * .22 + state.integrity * .16 + state.transparency * .1 + caseRecord.chainOfCustody * .2 + caseRecord.witnessSafety * .08;
  const proof = caseRecord.evidenceStrength * .46 + dueProcess - caseRecord.accusedPower * .16;
  if (proof >= 68) return { outcome: '유죄·핵심 소인 인정', sentence: caseRecord.category === 'command-responsibility' ? '지휘권 박탈·국제법상 형사책임·피해배상' : '공직박탈·부당이득 환수·실형 또는 집행유예', convicted: true };
  if (proof >= 52) return { outcome: '일부 유죄·핵심 소인 무죄', sentence: '부당이득 일부 환수·자격정지·제도개선 명령', convicted: true };
  if (proof >= 40) return { outcome: '증거불축·합리적 의심으로 무죄', sentence: '형사책임 없음·행정감사와 제도개선은 별도', convicted: false };
  return { outcome: '증거오염·절차위반으로 공소기각', sentence: '수사기관 감찰·증거보전 재점검', convicted: false };
}

function nextInvestigationDecision(caseRecord: JusticeCaseRecord): JusticeDecisionKind {
  if (!caseRecord.turningPoints.includes('bribe-approach')) return 'bribe-approach';
  if (!caseRecord.turningPoints.includes('prosecutor-threat')) return 'prosecutor-threat';
  if (!caseRecord.turningPoints.includes('media-leak')) return 'media-leak';
  return 'charge-route';
}

function maybeGenerateCase(state: JusticeSystemState, context: JusticeContext): { state: JusticeSystemState; event: JusticeEvent | null } {
  if (state.pendingDecision || context.week < state.nextCaseWeek || state.cases.filter((item) => item.stage !== 'closed').length >= 5) return { state, event: null as JusticeEvent | null };
  const pool = getAvailableJusticeCaseTemplates(context.year).filter((template) => !state.cases.some((item) => item.templateId === template.id && item.stage !== 'closed'));
  if (pool.length === 0) return { state: { ...state, nextCaseWeek: context.week + 26 }, event: null as JusticeEvent | null };
  const index = Math.abs((context.week * 17 + state.cases.length * 7 + context.nationId.length) % pool.length);
  const template = pool[index];
  const caseRecord = makeCase(template, context.week, state.cases.length + 1);
  const next = appendHistory({ ...state, cases: [...state.cases, caseRecord], activeCaseId: caseRecord.id, pendingDecision: createPending(caseRecord, 'case-opening', context.week), nextCaseWeek: context.week + 13 + (index % 8) }, { id: `${caseRecord.id}-auto-open`, week: context.week, caseId: caseRecord.id, title: '감사·언론 제보 접수', detail: caseRecord.allegation, tone: 'neutral' });
  return { state: next, event: { id: `${caseRecord.id}-decision-open`, title: `신규 수사안건 · ${caseRecord.title}`, detail: caseRecord.allegation, tone: 'neutral', cause: `${template.pressAngle} 보도와 감사 자료가 동시에 접수됐습니다.`, consequence: '3주 안에 수사 관할을 결정하지 않으면 증거보전과 신뢰가 하락합니다.', requiresDecision: true } };
}

export function advanceJusticeWeek(state: JusticeSystemState, context: JusticeContext): JusticeAdvanceResult {
  let next: JusticeSystemState = {
    ...state,
    independence: clamp(state.independence + (context.institutionalCapacity - 50) * .003 + (context.strategyId === 'security-republic' ? -.05 : .02)),
    integrity: clamp(state.integrity + (context.institutionalCapacity - state.integrity) * .002 - state.corruptionPressure * .0008),
    transparency: clamp(state.transparency + (context.mediaFreedom - state.transparency) * .003),
    sourceProtection: clamp(state.sourceProtection + (context.mediaFreedom + context.pressTrust - state.sourceProtection * 2) * .0015),
    corruptionPressure: clamp(state.corruptionPressure + (100 - context.legitimacy) * .002 + (context.activeElection ? .05 : 0) - state.integrity * .0015),
    impunity: clamp(state.impunity + state.corruptionPressure * .0016 - state.independence * .0015),
  };
  const events: JusticeEvent[] = [];
  let legitimacyDelta = 0;
  let unrestDelta = 0;
  let publicConfidenceDelta = 0;
  let stabilityDelta = 0;

  if (next.pendingDecision) {
    const pendingDecision = next.pendingDecision;
    const caseRecord = next.cases.find((item) => item.id === pendingDecision.caseId);
    const overdue = Math.max(0, context.week - pendingDecision.deadlineWeek);
    if (caseRecord && overdue > 0) {
      const pressuredCase = { ...caseRecord, chainOfCustody: clamp(caseRecord.chainOfCustody - .7), witnessSafety: clamp(caseRecord.witnessSafety - .8), prosecutorSafety: clamp(caseRecord.prosecutorSafety - .6), mediaAttention: clamp(caseRecord.mediaAttention + .6) };
      next = replaceCase(next, pressuredCase);
      next = { ...next, impunity: clamp(next.impunity + .25), corruptionPressure: clamp(next.corruptionPressure + .2) };
      if (overdue === 1 || overdue % 4 === 0) events.push({ id: `${pendingDecision.id}-overdue-${context.week}`, title: `미결 결재 지연 · ${pendingDecision.title}`, detail: `기한을 ${overdue}주 넘겼습니다. 증인이 이탈하고 수사기록의 완결성이 약해집니다.`, tone: 'bad', cause: '사법·정치 결재 미지정', consequence: '증거보전·증인안전·검사안전 하락', requiresDecision: true });
    }
  } else {
    const dueCase = next.cases
      .filter((item) => item.stage !== 'closed' && context.week >= item.nextReviewWeek)
      .sort((left, right) => left.nextReviewWeek - right.nextReviewWeek || right.severity - left.severity)[0];
    if (dueCase) {
      let progressed = dueCase;
      let decisionKind: JusticeDecisionKind | null = null;
      if (dueCase.stage === 'investigation') decisionKind = nextInvestigationDecision(dueCase);
      else if (dueCase.stage === 'charging') decisionKind = 'charge-route';
      else if (dueCase.stage === 'pretrial') decisionKind = 'trial-procedure';
      else if (dueCase.stage === 'trial') {
        const verdict = resolveVerdict(dueCase, next);
        progressed = { ...dueCase, stage: 'appeal', stageStartedWeek: context.week, nextReviewWeek: context.week + 4, outcome: verdict.outcome, sentence: verdict.sentence };
        decisionKind = 'verdict-response';
        next = { ...next, convictions: next.convictions + (verdict.convicted ? 1 : 0), acquittals: next.acquittals + (verdict.convicted ? 0 : 1) };
      } else if (dueCase.stage === 'appeal') {
        progressed = { ...dueCase, stage: 'closed', closedWeek: context.week, nextReviewWeek: context.week + 999 };
        next = appendHistory(next, { id: `${dueCase.id}-closed-${context.week}`, week: context.week, caseId: dueCase.id, title: '사건 종결·제도개선 이관', detail: `${dueCase.outcome ?? '절차 종결'} · ${dueCase.sentence ?? '별도 처분 없음'}`, tone: dueCase.outcome?.includes('유죄') ? 'good' : 'neutral' });
        events.push({ id: `${dueCase.id}-closed`, title: `사건 종결 · ${dueCase.title}`, detail: `${dueCase.outcome ?? '절차 종결'} · ${dueCase.sentence ?? '별도 처분 없음'}`, tone: 'neutral', cause: `${context.week - dueCase.openedWeek}주간의 수사·재판·항소 절차`, consequence: '사건철은 보존되고 감사·조달·증인보호 개혁의 근거로 이관됩니다.' });
      }
      next = replaceCase(next, progressed);
      if (decisionKind) {
        const pending = createPending(progressed, decisionKind, context.week);
        next = { ...next, pendingDecision: pending, activeCaseId: progressed.id };
        events.push({ id: `${pending.id}-decision-open`, title: `${pending.title} · ${progressed.title}`, detail: pending.briefing, tone: decisionKind === 'prosecutor-threat' || decisionKind === 'bribe-approach' ? 'bad' : 'neutral', cause: pending.danger, consequence: `제${pending.deadlineWeek + 1}주까지 결정하십시오.`, requiresDecision: true });
      }
    }
  }

  const generated = maybeGenerateCase(next, context);
  next = generated.state;
  if (generated.event) events.push(generated.event);
  const openCases = next.cases.filter((item) => item.stage !== 'closed').length;
  legitimacyDelta += round((next.independence - state.independence) * .03 - Math.max(0, next.impunity - 65) * .002, 2);
  publicConfidenceDelta += round((next.transparency - state.transparency) * .025 - Math.max(0, openCases - 4) * .03, 2);
  unrestDelta += round(Math.max(0, next.impunity - 70) * .002, 2);
  stabilityDelta += round((legitimacyDelta - unrestDelta) * .16, 2);
  return { state: next, events, legitimacyDelta, unrestDelta, institutionalCapacityDelta: round((next.integrity - state.integrity) * .025, 2), publicConfidenceDelta, politicalPowerDelta: 0, treasuryDelta: 0, stabilityDelta, note: `사법 독립 ${Math.round(next.independence)} · 증인·검사 안전 ${Math.round((next.prosecutorSafety + (next.cases.find((item) => item.id === next.activeCaseId)?.witnessSafety ?? next.prosecutorSafety)) / 2)} · 무처벌 ${Math.round(next.impunity)} · 미결 ${openCases}건` };
}

function addEvidence(caseRecord: JusticeCaseRecord, week: number, title: string, type: JusticeEvidenceItem['type'], reliability: number) {
  const evidence = { id: `${caseRecord.id}-${type}-${week}-${caseRecord.evidence.length}`, type, title, detail: '신규 자료는 독립 감식·반대심문·출처 확인을 거쳐야 최종 증거력에 반영됩니다.', reliability, custody: 74, public: false } satisfies JusticeEvidenceItem;
  return { ...caseRecord, evidence: [evidence, ...caseRecord.evidence].slice(0, 10) };
}

export function resolveJusticeDecision(state: JusticeSystemState, optionId: JusticeDecisionOptionId, context: JusticeContext): JusticeActionResult | null {
  const pending = state.pendingDecision;
  const option = decisionOptions[optionId];
  if (!pending || !option || !pending.optionIds.includes(optionId) || !canUseJusticeOption(option, context).allowed) return null;
  const original = state.cases.find((item) => item.id === pending.caseId);
  if (!original) return null;
  let caseRecord = { ...original, turningPoints: [...original.turningPoints, pending.kind], nextReviewWeek: context.week + 2 };
  let next: JusticeSystemState = { ...state, pendingDecision: null };
  let legitimacyDelta = 0;
  let unrestDelta = 0;
  let institutionalCapacityDelta = 0;
  let publicConfidenceDelta = 0;
  let politicalPowerDelta = -option.politicalCost;
  let treasuryDelta = -option.treasuryCost;
  let stabilityDelta = 0;
  let actionDetail = option.forecast;

  if (optionId === 'appoint-independent-prosecutor') {
    caseRecord = { ...caseRecord, stage: 'investigation', stageStartedWeek: context.week, jurisdiction: 'independent-prosecutor', prosecutor: '독립 특별검사단', evidenceStrength: clamp(caseRecord.evidenceStrength + 6), chainOfCustody: clamp(caseRecord.chainOfCustody + 8), prosecutorSafety: clamp(caseRecord.prosecutorSafety + 5), nextReviewWeek: context.week + 3 };
    next = { ...next, independence: clamp(next.independence + 6), integrity: clamp(next.integrity + 3), transparency: clamp(next.transparency + 2) };
    legitimacyDelta = 2; publicConfidenceDelta = 3;
  } else if (optionId === 'direct-ministry-investigation') {
    caseRecord = { ...caseRecord, stage: 'investigation', stageStartedWeek: context.week, jurisdiction: 'ordinary-court', prosecutor: '법무부 공공수사팀', evidenceStrength: clamp(caseRecord.evidenceStrength + 3), nextReviewWeek: context.week + 2 };
    next = { ...next, independence: clamp(next.independence - 1), integrity: clamp(next.integrity + 1) };
  } else if (optionId === 'military-inquiry') {
    caseRecord = { ...caseRecord, stage: 'investigation', stageStartedWeek: context.week, jurisdiction: 'military-tribunal', prosecutor: '군 감찰·법무단', chainOfCustody: clamp(caseRecord.chainOfCustody + 5), mediaAttention: clamp(caseRecord.mediaAttention - 8), nextReviewWeek: context.week + 3 };
    next = { ...next, independence: clamp(next.independence - 3), transparency: clamp(next.transparency - 5) };
    publicConfidenceDelta = -1;
  } else if (optionId === 'shelve-allegation') {
    caseRecord = { ...caseRecord, stage: 'closed', outcome: '내사 종결·기록 봉인', sentence: '소추 없음', closedWeek: context.week, nextReviewWeek: context.week + 999 };
    next = { ...next, independence: clamp(next.independence - 7), integrity: clamp(next.integrity - 6), corruptionPressure: clamp(next.corruptionPressure + 9), impunity: clamp(next.impunity + 10), dismissals: next.dismissals + 1 };
    politicalPowerDelta += 4; legitimacyDelta = -4; publicConfidenceDelta = -5; unrestDelta = 2; actionDetail = '단기적으로 연합은 안정됐지만 봉인 기록은 후일 대형 폭로의 증거가 됩니다.';
  } else if (optionId === 'refuse-and-record-bribe') {
    caseRecord = addEvidence({ ...caseRecord, evidenceStrength: clamp(caseRecord.evidenceStrength + 7), prosecutorSafety: clamp(caseRecord.prosecutorSafety - 3) }, context.week, '뇌물 제안 접촉기록', 'forensic', 78);
    next = { ...next, integrity: clamp(next.integrity + 5), corruptionPressure: clamp(next.corruptionPressure - 2) };
    legitimacyDelta = 1; institutionalCapacityDelta = 1;
  } else if (optionId === 'controlled-sting') {
    const success = context.intelNetwork + state.integrity + caseRecord.chainOfCustody >= 155;
    caseRecord = addEvidence({ ...caseRecord, evidenceStrength: clamp(caseRecord.evidenceStrength + (success ? 15 : -5)), prosecutorSafety: clamp(caseRecord.prosecutorSafety - (success ? 2 : 10)), mediaAttention: clamp(caseRecord.mediaAttention + (success ? 6 : 15)) }, context.week, success ? '통제배달 현장 녹음·일련번호' : '노출된 통제배달 작전기록', 'forensic', success ? 91 : 43);
    next = { ...next, integrity: clamp(next.integrity + (success ? 6 : -3)), corruptionPressure: clamp(next.corruptionPressure + (success ? -4 : 5)) };
    actionDetail = success ? '뇌물 전달 경로와 상위 지시자를 확인했습니다.' : '작전이 노출돼 수사팀과 증인의 안전이 위협받습니다.';
    legitimacyDelta = success ? 2 : -2; unrestDelta = success ? 0 : 2;
  } else if (optionId === 'accept-secret-arrangement') {
    caseRecord = { ...caseRecord, evidenceStrength: clamp(caseRecord.evidenceStrength - 18), chainOfCustody: clamp(caseRecord.chainOfCustody - 15), publicConfidence: clamp(caseRecord.publicConfidence - 15) };
    next = { ...next, integrity: clamp(next.integrity - 14), corruptionPressure: clamp(next.corruptionPressure + 16), impunity: clamp(next.impunity + 13) };
    politicalPowerDelta += 8; treasuryDelta += 18; legitimacyDelta = -5; publicConfidenceDelta = -6; actionDetail = '비자금이 유입됐지만 중개인이 접촉기록을 협박자료로 보유합니다.';
  } else if (optionId === 'protect-prosecution-team') {
    caseRecord = { ...caseRecord, witnessSafety: clamp(caseRecord.witnessSafety + 14), prosecutorSafety: clamp(caseRecord.prosecutorSafety + 18), evidenceStrength: clamp(caseRecord.evidenceStrength + 3) };
    next = { ...next, prosecutorSafety: clamp(next.prosecutorSafety + 9), independence: clamp(next.independence + 3) };
    legitimacyDelta = 1; institutionalCapacityDelta = 1;
  } else if (optionId === 'replace-lead-prosecutor') {
    caseRecord = { ...caseRecord, prosecutor: '신규 주임검사·인수팀', prosecutorSafety: clamp(caseRecord.prosecutorSafety + 7), evidenceStrength: clamp(caseRecord.evidenceStrength - 9), chainOfCustody: clamp(caseRecord.chainOfCustody - 5) };
    next = { ...next, independence: clamp(next.independence - 7), impunity: clamp(next.impunity + 5), unresolvedAttacks: next.unresolvedAttacks + 1 };
    legitimacyDelta = -3; publicConfidenceDelta = -3;
  } else if (optionId === 'publicize-intimidation') {
    caseRecord = addEvidence({ ...caseRecord, prosecutorSafety: clamp(caseRecord.prosecutorSafety + 3), mediaAttention: clamp(caseRecord.mediaAttention + 18) }, context.week, '검사·가족 협박과 인사개입 기록', 'document', 82);
    next = { ...next, transparency: clamp(next.transparency + 7), independence: clamp(next.independence + 4), prosecutorSafety: clamp(next.prosecutorSafety + 2) };
    legitimacyDelta = 2; unrestDelta = 1; publicConfidenceDelta = 3;
  } else if (optionId === 'evidence-based-briefing') {
    caseRecord = { ...caseRecord, mediaAttention: clamp(caseRecord.mediaAttention + 7), publicConfidence: clamp(caseRecord.publicConfidence + 9), evidence: caseRecord.evidence.map((item, index) => index === 0 ? { ...item, public: true } : item) };
    next = { ...next, transparency: clamp(next.transparency + 7), sourceProtection: clamp(next.sourceProtection + 2) };
    publicConfidenceDelta = 3;
  } else if (optionId === 'protect-source-and-seal') {
    caseRecord = { ...caseRecord, witnessSafety: clamp(caseRecord.witnessSafety + 12), chainOfCustody: clamp(caseRecord.chainOfCustody + 7), mediaAttention: clamp(caseRecord.mediaAttention - 3) };
    next = { ...next, sourceProtection: clamp(next.sourceProtection + 9), integrity: clamp(next.integrity + 2) };
    publicConfidenceDelta = 1;
  } else if (optionId === 'seek-prior-restraint') {
    caseRecord = { ...caseRecord, mediaAttention: clamp(caseRecord.mediaAttention + 22), witnessSafety: clamp(caseRecord.witnessSafety - 8), publicConfidence: clamp(caseRecord.publicConfidence - 14) };
    next = { ...next, transparency: clamp(next.transparency - 12), sourceProtection: clamp(next.sourceProtection - 13), impunity: clamp(next.impunity + 4) };
    legitimacyDelta = -4; publicConfidenceDelta = -6; unrestDelta = 3;
  } else if (optionId === 'file-public-indictment') {
    caseRecord = { ...caseRecord, stage: 'pretrial', stageStartedWeek: context.week, jurisdiction: caseRecord.jurisdiction === 'undecided' ? 'ordinary-court' : caseRecord.jurisdiction, judge: '독립 형사재판부', mediaAttention: clamp(caseRecord.mediaAttention + 16), nextReviewWeek: context.week + 4 };
    next = { ...next, transparency: clamp(next.transparency + 4) };
    legitimacyDelta = caseRecord.evidenceStrength >= 45 ? 2 : -1;
  } else if (optionId === 'refer-special-court') {
    caseRecord = { ...caseRecord, stage: 'pretrial', stageStartedWeek: context.week, jurisdiction: 'special-court', judge: '국내·국제법관 합의부', chainOfCustody: clamp(caseRecord.chainOfCustody + 5), nextReviewWeek: context.week + 5 };
    next = { ...next, independence: clamp(next.independence + 4), transparency: clamp(next.transparency + 2) };
    legitimacyDelta = 1; institutionalCapacityDelta = 2;
  } else if (optionId === 'refer-truth-commission') {
    caseRecord = { ...caseRecord, stage: 'pretrial', stageStartedWeek: context.week, jurisdiction: 'truth-commission', judge: '피해자·법률가·기록전문가 진실위원회', evidenceStrength: clamp(caseRecord.evidenceStrength + 8), witnessSafety: clamp(caseRecord.witnessSafety + 8), nextReviewWeek: context.week + 6 };
    next = { ...next, transparency: clamp(next.transparency + 6), integrity: clamp(next.integrity + 2) };
    legitimacyDelta = 2; unrestDelta = -2; publicConfidenceDelta = 3;
  } else if (optionId === 'decline-charges') {
    caseRecord = { ...caseRecord, stage: 'closed', outcome: '불기소·소추 종결', sentence: '처분 없음', closedWeek: context.week, nextReviewWeek: context.week + 999 };
    next = { ...next, dismissals: next.dismissals + 1, impunity: clamp(next.impunity + (caseRecord.evidenceStrength >= 50 ? 9 : 2)), independence: clamp(next.independence - (caseRecord.accusedPower >= 70 ? 5 : 1)) };
    legitimacyDelta = caseRecord.evidenceStrength >= 50 ? -5 : 0; publicConfidenceDelta = caseRecord.evidenceStrength >= 50 ? -6 : -1;
  } else if (optionId === 'open-court') {
    caseRecord = { ...caseRecord, stage: 'trial', stageStartedWeek: context.week, judge: caseRecord.judge.includes('미배당') ? '독립 합의재판부' : caseRecord.judge, mediaAttention: clamp(caseRecord.mediaAttention + 18), publicConfidence: clamp(caseRecord.publicConfidence + 11), nextReviewWeek: context.week + Math.max(4, Math.round(caseRecord.severity / 14)) };
    next = { ...next, transparency: clamp(next.transparency + 8), independence: clamp(next.independence + 3) };
    publicConfidenceDelta = 3;
  } else if (optionId === 'closed-security-court') {
    caseRecord = { ...caseRecord, stage: 'trial', stageStartedWeek: context.week, mediaAttention: clamp(caseRecord.mediaAttention + 8), publicConfidence: clamp(caseRecord.publicConfidence - 7), witnessSafety: clamp(caseRecord.witnessSafety + 8), nextReviewWeek: context.week + Math.max(4, Math.round(caseRecord.severity / 16)) };
    next = { ...next, transparency: clamp(next.transparency - 6) };
    publicConfidenceDelta = -2;
  } else if (optionId === 'negotiate-plea') {
    caseRecord = addEvidence({ ...caseRecord, stage: 'trial', stageStartedWeek: context.week, evidenceStrength: clamp(caseRecord.evidenceStrength + 9), nextReviewWeek: context.week + 3 }, context.week, '상위선 지시·자산회수 합의서', 'witness', 79);
    treasuryDelta += 8; publicConfidenceDelta = -1;
  } else if (optionId === 'respect-verdict') {
    caseRecord = { ...caseRecord, stage: 'closed', closedWeek: context.week, nextReviewWeek: context.week + 999 };
    next = { ...next, independence: clamp(next.independence + 6), integrity: clamp(next.integrity + 4), impunity: clamp(next.impunity - (caseRecord.outcome?.includes('유죄') ? 8 : 3)) };
    legitimacyDelta = 3; publicConfidenceDelta = 4; institutionalCapacityDelta = 2;
  } else if (optionId === 'appeal-verdict') {
    caseRecord = { ...caseRecord, stage: 'appeal', nextReviewWeek: context.week + 5 };
    next = { ...next, independence: clamp(next.independence + 1) };
  } else if (optionId === 'executive-pardon') {
    caseRecord = { ...caseRecord, stage: 'closed', outcome: `${caseRecord.outcome ?? '판결'} 후 행정부 사면`, sentence: '형집행 면제·권리 복권', closedWeek: context.week, nextReviewWeek: context.week + 999 };
    next = { ...next, independence: clamp(next.independence - 12), integrity: clamp(next.integrity - 7), impunity: clamp(next.impunity + 12) };
    politicalPowerDelta += 5; legitimacyDelta = -6; publicConfidenceDelta = -7; unrestDelta = 3;
  } else if (optionId === 'attack-court-and-press') {
    caseRecord = { ...caseRecord, stage: 'closed', outcome: `${caseRecord.outcome ?? '판결'} 후 정치적 불복`, closedWeek: context.week, nextReviewWeek: context.week + 999, prosecutorSafety: clamp(caseRecord.prosecutorSafety - 18), witnessSafety: clamp(caseRecord.witnessSafety - 12), mediaAttention: 100 };
    next = { ...next, independence: clamp(next.independence - 16), transparency: clamp(next.transparency - 11), prosecutorSafety: clamp(next.prosecutorSafety - 14), sourceProtection: clamp(next.sourceProtection - 10), impunity: clamp(next.impunity + 14), unresolvedAttacks: next.unresolvedAttacks + 1 };
    politicalPowerDelta += 7; legitimacyDelta = -9; publicConfidenceDelta = -9; unrestDelta = 7; stabilityDelta = -4;
  }

  next = replaceCase(next, caseRecord);
  next = appendHistory(next, { id: `${pending.id}-${optionId}`, week: context.week, caseId: caseRecord.id, title: option.name, detail: actionDetail, tone: option.tone });
  const event: JusticeEvent = { id: `${pending.id}-${optionId}`, title: `${option.name} · ${caseRecord.title}`, detail: actionDetail, tone: option.tone, cause: pending.briefing, consequence: `${option.forecast} · 다음 절차 ${caseRecord.stage === 'closed' ? '종결' : `제${caseRecord.nextReviewWeek + 1}주 예정`}` };
  return { state: next, events: [event], legitimacyDelta, unrestDelta, institutionalCapacityDelta, publicConfidenceDelta, politicalPowerDelta, treasuryDelta, stabilityDelta, note: `사법 독립 ${Math.round(next.independence)} · 무처벌 ${Math.round(next.impunity)} · ${caseRecord.title} ${justiceStageLabels[caseRecord.stage]}`, actionTitle: option.name, actionDetail };
}

function numberOr(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function normalizeJusticeSystemState(value: unknown, nationId: NationId, startedWeek: number): JusticeSystemState {
  const fallback = createJusticeSystemState(nationId, startedWeek);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<JusticeSystemState>;
  if (candidate.version !== 1 || candidate.nationId !== nationId) return fallback;
  const cases = Array.isArray(candidate.cases) ? candidate.cases.filter((item): item is JusticeCaseRecord => Boolean(item && typeof item.id === 'string' && typeof item.title === 'string')).slice(0, 40) : fallback.cases;
  const pending = candidate.pendingDecision && cases.some((item) => item.id === candidate.pendingDecision?.caseId) ? candidate.pendingDecision : null;
  return {
    ...fallback,
    ...candidate,
    independence: clamp(numberOr(candidate.independence, fallback.independence)),
    integrity: clamp(numberOr(candidate.integrity, fallback.integrity)),
    transparency: clamp(numberOr(candidate.transparency, fallback.transparency)),
    prosecutorSafety: clamp(numberOr(candidate.prosecutorSafety, fallback.prosecutorSafety)),
    sourceProtection: clamp(numberOr(candidate.sourceProtection, fallback.sourceProtection)),
    corruptionPressure: clamp(numberOr(candidate.corruptionPressure, fallback.corruptionPressure)),
    impunity: clamp(numberOr(candidate.impunity, fallback.impunity)),
    cases,
    activeCaseId: cases.some((item) => item.id === candidate.activeCaseId) ? candidate.activeCaseId ?? null : cases[0]?.id ?? null,
    pendingDecision: pending,
    nextCaseWeek: Math.max(startedWeek, numberOr(candidate.nextCaseWeek, fallback.nextCaseWeek)),
    convictions: Math.max(0, numberOr(candidate.convictions, 0)),
    acquittals: Math.max(0, numberOr(candidate.acquittals, 0)),
    dismissals: Math.max(0, numberOr(candidate.dismissals, 0)),
    unresolvedAttacks: Math.max(0, numberOr(candidate.unresolvedAttacks, 0)),
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 160) : [],
  };
}
