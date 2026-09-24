import type { ConstitutionalJudiciaryState } from './constitutionalJudiciary';
import type { DynasticPoliticsState, GovernmentFormId, NobleGrant } from './dynasticPolitics';
import type { CareerRole, NationId } from './types';
import { withJosa } from './koreanGrammar';

export type SovereignOfficeKind =
  | 'ceremonial-president'
  | 'executive-president'
  | 'dual-executive-president'
  | 'constitutional-monarch'
  | 'royal-executive'
  | 'imperial-sovereign'
  | 'military-regent'
  | 'collective-chair';

export type SovereignPowerGroup = 'legislation' | 'executive' | 'state' | 'estates';
export type SovereignPowerStatus = 'express' | 'countersigned' | 'reserve' | 'historic-estate' | 'ultra-vires' | 'unavailable';
export type SovereignPowerId =
  | 'promulgate-law'
  | 'return-or-veto-law'
  | 'executive-order'
  | 'appoint-government'
  | 'dismiss-government'
  | 'dissolve-legislature'
  | 'call-referendum'
  | 'declare-emergency'
  | 'end-emergency'
  | 'command-armed-forces'
  | 'treaty-and-envoys'
  | 'grant-pardon'
  | 'high-appointments'
  | 'address-and-counsel'
  | 'grant-honours'
  | 'confirm-peerage-charter'
  | 'summon-regency'
  | 'manage-royal-household'
  | 'upper-house-review'
  | 'estate-administration'
  | 'estate-levy'
  | 'manorial-court'
  | 'court-patronage'
  | 'fund-estate-works'
  | 'petition-crown'
  | 'join-regency'
  | 'press-succession-claim';

export interface SovereignPowerImpact {
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  unrest: number;
  publicConfidence: number;
  justiceIndependence: number;
  justiceIntegrity: number;
  mediaFreedom: number;
  pressTrust: number;
  crownAuthority: number;
  courtUnity: number;
  successionSecurity: number;
  estateBurden: number;
  parliamentaryConfidence: number;
  militaryObedience: number;
  aristocraticLeverage: number;
  patronagePressure: number;
}

export interface SovereignPowerDefinition {
  id: SovereignPowerId;
  group: SovereignPowerGroup;
  name: string;
  summary: string;
  procedure: string;
  historicalBasis: string;
  politicalCost: number;
  treasuryCost: number;
  authorityCost: number;
  cooldownWeeks: number;
  requiresNobleTarget?: boolean;
  impact: Partial<SovereignPowerImpact>;
}

export interface ActiveEmergencyRule {
  declaredWeek: number;
  reviewWeek: number;
  renewals: number;
  oversight: string;
}

export interface SovereignPowerRecord {
  id: string;
  week: number;
  powerId: SovereignPowerId;
  title: string;
  detail: string;
  status: Exclude<SovereignPowerStatus, 'unavailable'>;
  targetName: string | null;
  verificationWeek: number;
  resolved: boolean;
  outcome: string | null;
}

export interface SovereignPowersState {
  version: 1;
  nationId: NationId;
  authorityCapital: number;
  constitutionalConvention: number;
  parliamentaryConfidence: number;
  militaryObedience: number;
  aristocraticLeverage: number;
  patronagePressure: number;
  activeEmergency: ActiveEmergencyRule | null;
  cooldowns: Partial<Record<SovereignPowerId, number>>;
  history: SovereignPowerRecord[];
}

export interface SovereignPowerContext {
  week: number;
  year: number;
  nationId: NationId;
  role: CareerRole;
  formId: GovernmentFormId;
  constitution: ConstitutionalJudiciaryState;
  dynasty: DynasticPoliticsState;
  politicalPower: number;
  treasury: number;
  stability: number;
  legitimacy: number;
  unrest: number;
  publicConfidence: number;
  institutionalCapacity: number;
  mediaFreedom: number;
  justiceIndependence: number;
}

export interface SovereignPowerAssessment {
  definition: SovereignPowerDefinition;
  status: SovereignPowerStatus;
  statusLabel: string;
  allowed: boolean;
  reason: string;
  legalBasis: string;
  countersignature: string;
  politicalCost: number;
  treasuryCost: number;
  authorityCost: number;
  cooldownRemaining: number;
  verificationWeeks: number;
  projectedImpact: SovereignPowerImpact;
}

export interface SovereignPowerActionResult {
  state: SovereignPowersState;
  title: string;
  detail: string;
  note: string;
  status: Exclude<SovereignPowerStatus, 'unavailable'>;
  verificationWeek: number;
  impact: SovereignPowerImpact;
}

export interface SovereignPowerAdvanceResult {
  state: SovereignPowersState;
  impact: Pick<SovereignPowerImpact, 'stability' | 'legitimacy' | 'unrest' | 'publicConfidence' | 'justiceIndependence' | 'mediaFreedom' | 'pressTrust' | 'crownAuthority' | 'courtUnity' | 'successionSecurity' | 'estateBurden'>;
  events: Array<{ title: string; detail: string; tone: 'good' | 'bad' | 'neutral'; cause: string; consequence: string }>;
  note: string;
}

const zeroImpact = (): SovereignPowerImpact => ({
  politicalPower: 0,
  treasury: 0,
  stability: 0,
  legitimacy: 0,
  unrest: 0,
  publicConfidence: 0,
  justiceIndependence: 0,
  justiceIntegrity: 0,
  mediaFreedom: 0,
  pressTrust: 0,
  crownAuthority: 0,
  courtUnity: 0,
  successionSecurity: 0,
  estateBurden: 0,
  parliamentaryConfidence: 0,
  militaryObedience: 0,
  aristocraticLeverage: 0,
  patronagePressure: 0,
});

const impact = (value: Partial<SovereignPowerImpact>) => value;
const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));

export const sovereignPowerGroupLabels: Record<SovereignPowerGroup, { name: string; description: string }> = {
  legislation: { name: '법률·헌정', description: '법률 공포, 거부권, 의회 해산과 국민투표' },
  executive: { name: '정부·위기', description: '내각 인사, 행정명령, 비상권과 군 통수' },
  state: { name: '국가·외교', description: '조약, 사면, 인사, 훈장과 국가 통합 역할' },
  estates: { name: '귀족·영지', description: '귀족원, 영지 행정, 군역, 재판과 섭정' },
};

export const sovereignPowerStatusLabels: Record<SovereignPowerStatus, string> = {
  express: '명문 권한',
  countersigned: '부서·조언 필요',
  reserve: '관례상 유보권',
  'historic-estate': '영지·작위 특권',
  'ultra-vires': '초헌법적 월권',
  unavailable: '현재 행사 불가',
};

export const sovereignPowerDefinitions: SovereignPowerDefinition[] = [
  { id: 'promulgate-law', group: 'legislation', name: '법률 공포·재가', summary: '의회가 의결한 법안에 서명하거나 왕실 재가를 부여합니다.', procedure: '법률안 검토 → 장관 부서 또는 법제 심사 → 공포', historicalBasis: '미국 헌법의 대통령 서명, 영국의 Royal Assent, 일본국 헌법 제7조의 공포 국사행위', politicalCost: 1, treasuryCost: 0, authorityCost: 2, cooldownWeeks: 1, impact: impact({ legitimacy: 1 }) },
  { id: 'return-or-veto-law', group: 'legislation', name: '법률안 재의·거부', summary: '법안을 의회에 돌려보내 재심을 요구하거나 헌법상 거부권을 행사합니다.', procedure: '거부 사유 공개 → 의회 재의결 혹은 법제 재검토', historicalBasis: '미국 헌법 제1조의 거부권과 프랑스 헌법 제10조의 재의 요구', politicalCost: 6, treasuryCost: 0, authorityCost: 7, cooldownWeeks: 4, impact: impact({ parliamentaryConfidence: -5, legitimacy: -1, stability: -1 }) },
  { id: 'executive-order', group: 'executive', name: '행정명령·칙령', summary: '법률의 집행 범위에서 행정기관에 구속력 있는 명령을 내립니다.', procedure: '법적 근거 확인 → 주무부처 집행 → 의회·법원 사후심사', historicalBasis: '대통령제의 행정명령과 프랑스 헌법 제13·20조의 병령·데크레', politicalCost: 5, treasuryCost: 2, authorityCost: 5, cooldownWeeks: 2, impact: impact({ stability: 2, justiceIndependence: -1, parliamentaryConfidence: -2 }) },
  { id: 'appoint-government', group: 'executive', name: '총리·내각 임명', summary: '의회 다수파, 직선 위임 또는 왕권에 따라 정부를 구성합니다.', procedure: '연정·자문 확인 → 지명 → 인준·선서', historicalBasis: '프랑스 헌법 제8조, 독일 기본법 제63·64조, 영국 군주의 다수파 지도자 총리 임명', politicalCost: 8, treasuryCost: 1, authorityCost: 8, cooldownWeeks: 8, impact: impact({ parliamentaryConfidence: 7, legitimacy: 2, patronagePressure: 2 }) },
  { id: 'dismiss-government', group: 'executive', name: '정부 해임·총리 면직', summary: '내각의 사임을 수리하거나 헌정 위기에서 해임권을 주장합니다.', procedure: '불신임·사임 여부 확인 → 후계 정부 협상 → 면직', historicalBasis: '의회제의 내각책임, 이원집정제의 대통령·총리 관계, 입헌군주의 유보권 논쟁', politicalCost: 12, treasuryCost: 2, authorityCost: 12, cooldownWeeks: 13, impact: impact({ stability: -4, legitimacy: -3, unrest: 4, parliamentaryConfidence: -12, patronagePressure: 4 }) },
  { id: 'dissolve-legislature', group: 'legislation', name: '의회 해산·총선 소집', summary: '입법부의 임기를 끝내고 선거로 국민 위임을 다시 묻습니다.', procedure: '총리·양원 의장 자문 → 해산 공고 → 기한 내 총선', historicalBasis: '프랑스 헌법 제12조, 입헌군주국의 해산 대권과 내각의 조언', politicalCost: 15, treasuryCost: 18, authorityCost: 14, cooldownWeeks: 52, impact: impact({ stability: -5, legitimacy: 2, unrest: 5, parliamentaryConfidence: -18, publicConfidence: -2 }) },
  { id: 'call-referendum', group: 'legislation', name: '국민투표 부의', summary: '헌정·영토·국가 중대사를 직접 투표에 붙입니다.', procedure: '선거관리기관 검증 → 질문 확정 → 찬반 캠페인 보장', historicalBasis: '프랑스 헌법 제11조와 주권을 대표와 국민투표로 행사한다는 제3조', politicalCost: 10, treasuryCost: 24, authorityCost: 10, cooldownWeeks: 26, impact: impact({ legitimacy: 4, publicConfidence: 3, unrest: -1, parliamentaryConfidence: -4 }) },
  { id: 'declare-emergency', group: 'executive', name: '국가비상사태 선포', summary: '전쟁·반란·재난에 대해 한시적 비상명령과 동원권을 실행합니다.', procedure: '위협 요건 입증 → 선포 → 의회·법원의 일모·재승인', historicalBasis: '프랑스 헌법 제16조와 각국 헌법의 기한부 비상권', politicalCost: 10, treasuryCost: 12, authorityCost: 12, cooldownWeeks: 8, impact: impact({ stability: 5, unrest: 2, legitimacy: -2, justiceIndependence: -3, mediaFreedom: -3, militaryObedience: 6 }) },
  { id: 'end-emergency', group: 'executive', name: '비상권 종료·일상 복귀', summary: '비상명령을 폐지하고 의회·법원·지방정부의 통상 권한을 복구합니다.', procedure: '종료 공고 → 예방구금·검열 재심사 → 사후감사', historicalBasis: '헌정적 비상권의 일모와 의회·사법심사 원칙', politicalCost: 3, treasuryCost: 3, authorityCost: 2, cooldownWeeks: 1, impact: impact({ stability: -1, legitimacy: 5, unrest: -3, justiceIndependence: 3, mediaFreedom: 4, publicConfidence: 4, militaryObedience: -2 }) },
  { id: 'command-armed-forces', group: 'executive', name: '군 통수·국방회의 주재', summary: '문민 통제 하에서 최고 전략지침과 고위 지휘관 임명을 승인합니다.', procedure: '국방회의 자문 → 임무·한계 지시 → 의회 예산통제', historicalBasis: '미국 헌법 제2조의 최고사령관, 프랑스 헌법 제15조, 입헌군주의 명목상 통수권', politicalCost: 4, treasuryCost: 4, authorityCost: 6, cooldownWeeks: 3, impact: impact({ stability: 1, militaryObedience: 6, patronagePressure: 1 }) },
  { id: 'treaty-and-envoys', group: 'state', name: '조약 교섭·대사 신임', summary: '조약을 교섭·비준하고 외국 사절을 신임하며 대사를 인증합니다.', procedure: '외무부 교섭 → 의회 동의 혹은 내각 부서 → 비준서 공개', historicalBasis: '미국 헌법 제2조의 조약·대사 임명, 독일 기본법 제59조, 일본국 헌법 제7조', politicalCost: 5, treasuryCost: 5, authorityCost: 5, cooldownWeeks: 4, impact: impact({ legitimacy: 1, publicConfidence: 1 }) },
  { id: 'grant-pardon', group: 'state', name: '사면·감형·복권', summary: '개별 사건의 형을 면제·감형하거나 권리를 복구합니다.', procedure: '사면심사위원회 검토 → 이해충돌 공개 → 개별 재가', historicalBasis: '미국 헌법 제2조, 프랑스 헌법 제17조, 독일 기본법 제60조, 일본국 헌법 제7조', politicalCost: 4, treasuryCost: 1, authorityCost: 4, cooldownWeeks: 4, impact: impact({ legitimacy: 1, unrest: -2, justiceIntegrity: -1, publicConfidence: -1 }) },
  { id: 'high-appointments', group: 'state', name: '고위공직·사법 지명', summary: '장관, 대사, 장성, 법관·검사 후보를 헌법이 정한 절차로 지명합니다.', procedure: '공개 검증 → 독립위 추천·의회 인준 여부 확인 → 임명', historicalBasis: '미국 헌법의 상원 조언·동의, 프랑스 헌법 제13조, 독일 기본법 제60조', politicalCost: 7, treasuryCost: 3, authorityCost: 6, cooldownWeeks: 6, impact: impact({ patronagePressure: 4, justiceIndependence: -1, legitimacy: 1 }) },
  { id: 'address-and-counsel', group: 'state', name: '국정연설·조언·경고', summary: '의회와 국민에게 정부의 상태를 보고하고, 총리에게 비공개 조언과 경고를 제공합니다.', procedure: '정책 보고 → 공개 연설 또는 비공개 주례 알현 → 후속 질의', historicalBasis: '프랑스 헌법 제18조, 미국 국정연설, 영국 군주의 총리 주례 알현과 조언·경고 관례', politicalCost: 2, treasuryCost: 1, authorityCost: 2, cooldownWeeks: 4, impact: impact({ legitimacy: 2, publicConfidence: 3, pressTrust: 1, parliamentaryConfidence: 1 }) },
  { id: 'grant-honours', group: 'state', name: '훈장·영전 수여', summary: '군공·공무·학문·시민적 공헌을 국가 명예로 인정합니다.', procedure: '공적 심사 → 이해충돌 검토 → 수여·공개', historicalBasis: '공화국 대통령의 국가훈장과 일본국 헌법 제7조의 영전 수여, 군주국 훈장 대권', politicalCost: 3, treasuryCost: 3, authorityCost: 3, cooldownWeeks: 3, impact: impact({ legitimacy: 2, militaryObedience: 1, patronagePressure: 2 }) },
  { id: 'confirm-peerage-charter', group: 'estates', name: '작위·귀족원 의석 재가', summary: '서임된 작위에 세습권·귀족원 의석·영지 의무를 헌장으로 확정합니다.', procedure: '작위 영지 선택 → 의무·세습권 협약 → 옥새·의회 등록', historicalBasis: '영국 귀족의 세습적 상원 출석과 작위·토지·왕권에 대한 의무의 결합', politicalCost: 8, treasuryCost: 6, authorityCost: 7, cooldownWeeks: 8, requiresNobleTarget: true, impact: impact({ legitimacy: 2, estateBurden: 5, aristocraticLeverage: 7, courtUnity: 2 }) },
  { id: 'summon-regency', group: 'estates', name: '섭정평의회 소집', summary: '미성년·질병·포로 등으로 군주가 통치할 수 없을 때 섭정 체제를 구성합니다.', procedure: '집무불능 판정 → 섭정자·평의원 지명 → 권한범위·종료조건 공포', historicalBasis: '영국·일본 등 군주국의 섭정법과 중세 섭정평의회', politicalCost: 12, treasuryCost: 8, authorityCost: 12, cooldownWeeks: 52, impact: impact({ stability: 4, successionSecurity: 10, crownAuthority: -5, aristocraticLeverage: 5, courtUnity: -2 }) },
  { id: 'manage-royal-household', group: 'state', name: '왕실재산·궁정 재가', summary: '왕실비, 왕실재산, 종친·궁정 직무와 공적 활동의 경계를 정합니다.', procedure: '왕실 결산 → 의회 예산 혹은 왕실회의 심사 → 공개보고', historicalBasis: '일본국 헌법 제8조의 황실재산 의회 승인과 입헌군주국의 왕실비 예산통제', politicalCost: 4, treasuryCost: 2, authorityCost: 3, cooldownWeeks: 13, impact: impact({ legitimacy: 2, courtUnity: 4, estateBurden: -2, publicConfidence: 2 }) },
  { id: 'upper-house-review', group: 'estates', name: '귀족원 법안 심의', summary: '작위 보유자가 상원에서 법안을 수정·지연하고 정부를 검증합니다.', procedure: '상원 소환 → 위원회 심사 → 수정안·지연권 표결', historicalBasis: '영국 귀족원의 법안 거부권과 1911·1949년 의회법 이후의 지연·재심기능', politicalCost: 4, treasuryCost: 1, authorityCost: 3, cooldownWeeks: 4, requiresNobleTarget: true, impact: impact({ parliamentaryConfidence: -2, aristocraticLeverage: 3, legitimacy: 1 }) },
  { id: 'estate-administration', group: 'estates', name: '영지 행정·징세', summary: '영지의 소작·지대·지방관 임명과 공공질서를 작위 보유자가 관리합니다.', procedure: '영지 회계 → 지방관·재무관 임명 → 세금·지대 결산', historicalBasis: '중세 장원의 영주 관할권, 지대·관습적 공납과 장원법정', politicalCost: 3, treasuryCost: -4, authorityCost: 3, cooldownWeeks: 4, requiresNobleTarget: true, impact: impact({ stability: 1, unrest: 3, estateBurden: 3, aristocraticLeverage: 3, publicConfidence: -2 }) },
  { id: 'estate-levy', group: 'estates', name: '영지 군역·민병 소집', summary: '토지 보유 의무에 따라 기사·종자·민병을 소집하거나 면제금을 납부합니다.', procedure: '왕실 소집령 → 영지별 병력·장비 점검 → 기한부 군역', historicalBasis: '영국 국가기록원의 토지 보유에 따른 기사역·병력 소집·면제금(sc­utage) 기록', politicalCost: 5, treasuryCost: -2, authorityCost: 5, cooldownWeeks: 8, requiresNobleTarget: true, impact: impact({ militaryObedience: 5, stability: 2, unrest: 4, estateBurden: 4, aristocraticLeverage: 5 }) },
  { id: 'manorial-court', group: 'estates', name: '장원법정·지방재판', summary: '영지 관습, 소작, 공유지, 경미한 민·형사사건을 영주 재판권으로 처리합니다.', procedure: '장원청지기 소집 → 소작인·주민 참여 → 상급 왕립법원 항소 허용', historicalBasis: '영국 국가기록원의 court baron·court leet 기록과 지방 영주의 관할권', politicalCost: 6, treasuryCost: 0, authorityCost: 5, cooldownWeeks: 6, requiresNobleTarget: true, impact: impact({ justiceIndependence: -8, justiceIntegrity: -4, unrest: 5, estateBurden: 5, aristocraticLeverage: 6, publicConfidence: -5 }) },
  { id: 'court-patronage', group: 'estates', name: '궁정 후원·관직 추천', summary: '인맥과 재산을 사용해 종자·친족·학자를 궁정과 관료제에 진출시킵니다.', procedure: '후보 추천 → 충성·능력 검증 → 궁정·관료 임용', historicalBasis: '군주제와 귀족제의 후원망, 관직매매·가문 인사가 관료화와 충돌한 역사', politicalCost: 2, treasuryCost: 3, authorityCost: 2, cooldownWeeks: 3, requiresNobleTarget: true, impact: impact({ courtUnity: 3, patronagePressure: 7, aristocraticLeverage: 2, justiceIntegrity: -2 }) },
  { id: 'fund-estate-works', group: 'estates', name: '영지 구호·교량·학교 후원', summary: '작위의 명예와 재산을 이용해 영지 주민을 구호하고 공공시설을 건설합니다.', procedure: '사업비 출연 → 영지회의 감사 → 주민 평가', historicalBasis: '귀족·지주의 종교·교육·구호 후원과 후원자로서의 정치적 역할', politicalCost: 2, treasuryCost: 12, authorityCost: 2, cooldownWeeks: 8, requiresNobleTarget: true, impact: impact({ legitimacy: 3, publicConfidence: 4, unrest: -3, aristocraticLeverage: 2, estateBurden: -1 }) },
  { id: 'petition-crown', group: 'estates', name: '왕권에 청원·간쟁', summary: '귀족원과 영지를 대표해 군주·대통령에게 법안 수정과 정책 재고를 요청합니다.', procedure: '영지 회의 결의 → 청원서 제출 → 옥좌·의회 회답', historicalBasis: '군주의 대회의와 귀족원, 마그나 카르타의 남작 공동협의·군주 제약 전통', politicalCost: 3, treasuryCost: 1, authorityCost: 3, cooldownWeeks: 4, requiresNobleTarget: true, impact: impact({ parliamentaryConfidence: 2, courtUnity: -1, aristocraticLeverage: 3, legitimacy: 1 }) },
  { id: 'join-regency', group: 'estates', name: '섭정평의회 참석', summary: '대귀족이 왕위 공백기의 외교·군사·재정 결재에 참여합니다.', procedure: '작위 서열·이해충돌 심사 → 섭정 선서 → 집단 부서', historicalBasis: '미성년 군주 시기의 귀족·성직자 섭정평의회와 왕위계승 파벌', politicalCost: 6, treasuryCost: 2, authorityCost: 5, cooldownWeeks: 13, requiresNobleTarget: true, impact: impact({ successionSecurity: 4, crownAuthority: -2, aristocraticLeverage: 5, courtUnity: 1 }) },
  { id: 'press-succession-claim', group: 'estates', name: '왕위계승권 주장', summary: '혼인·혈통·선거군주제의 법리를 근거로 자신의 가문을 왕위 후보로 내세웁니다.', procedure: '계보·조약 공개 → 귀족원·성직자 지지 확보 → 계승법정 또는 왕실회의', historicalBasis: '선거군주제, 왕조혼, 섭정과 왕위계승전쟁에서 대귀족 가문이 수행한 역할', politicalCost: 12, treasuryCost: 8, authorityCost: 10, cooldownWeeks: 26, requiresNobleTarget: true, impact: impact({ successionSecurity: -10, courtUnity: -8, crownAuthority: -6, aristocraticLeverage: 9, unrest: 6, legitimacy: -4 }) },
];

const monarchyOffices: SovereignOfficeKind[] = ['constitutional-monarch', 'royal-executive', 'imperial-sovereign', 'military-regent'];
const strongExecutiveOffices: SovereignOfficeKind[] = ['executive-president', 'dual-executive-president', 'royal-executive', 'imperial-sovereign', 'military-regent', 'collective-chair'];

export function deriveSovereignOfficeKind(formId: GovernmentFormId, constitution: ConstitutionalJudiciaryState): SovereignOfficeKind {
  const governmentClause = constitution.enacted?.clauses.government;
  if (governmentClause === 'presidential-separation') return 'executive-president';
  if (governmentClause === 'semi-presidential') return 'dual-executive-president';
  if (governmentClause === 'parliamentary-cabinet') return 'ceremonial-president';
  if (governmentClause === 'constitutional-crown') return 'constitutional-monarch';
  if (governmentClause === 'council-directorate' || governmentClause === 'peoples-congress') return 'collective-chair';
  switch (formId) {
    case 'presidential-republic': return 'executive-president';
    case 'semi-presidential-republic': return 'dual-executive-president';
    case 'constitutional-monarchy': return 'constitutional-monarch';
    case 'crown-state': return 'royal-executive';
    case 'imperial-federation': return 'imperial-sovereign';
    case 'military-regency': return 'military-regent';
    case 'peoples-commonwealth': return 'collective-chair';
    default: return 'ceremonial-president';
  }
}

export const sovereignOfficeProfiles: Record<SovereignOfficeKind, { name: string; source: string; role: string; caution: string }> = {
  'ceremonial-president': { name: '의회공화국 대통령', source: '의회·선거인단의 헌정적 위임', role: '국가 연속성, 법률 공포, 정부 구성의 절차적 보증', caution: '대부분의 행위는 총리·장관의 부서가 필요합니다.' },
  'executive-president': { name: '행정부 수반 대통령', source: '국민의 직접·선거인단 위임과 고정 임기', role: '내각 지휘, 법안 거부, 군 통수, 조약·인사·사면', caution: '의회의 입법·예산·탄핵과 사법심사를 받습니다.' },
  'dual-executive-president': { name: '이원집정제 대통령', source: '국민 직선과 의회책임 내각의 이중 위임', role: '헌정 중재, 총리 임명, 외교·국방, 해산·국민투표', caution: '동거정부에서는 내정 주도권이 총리에게 이동합니다.' },
  'constitutional-monarch': { name: '의회책임 입헌군주', source: '세습적 왕관과 국민주권 헌법', role: '국가 상징, 재가·임명 국사행위, 총리에 대한 조언·경고', caution: '통치하지 않는 관례를 깨면 헌정 위기가 발생합니다.' },
  'royal-executive': { name: '왕권정부의 군주', source: '왕조 계승법, 충성 선서, 왕실 행정권', role: '내각·군·지방관 임명, 칙령, 사면, 작위·영지 배분', caution: '법원·의회·지방 특권을 무시하면 반란과 찬탈 위험이 커집니다.' },
  'imperial-sovereign': { name: '제국연방 황제', source: '황실 계승, 연방 관후·제후와의 협약', role: '연방 중재, 외교·군사, 제후 서열·영지·귀족원 조정', caution: '다민족 지방의 자치권과 왕위계승권이 항상 경쟁합니다.' },
  'military-regent': { name: '군사 섭정', source: '왕위 공백·전시 비상 위임', role: '임시 통수, 섭정평의회 주재, 계승자 보호', caution: '기한과 복귀 조건이 없으면 군부 영구집권으로 변질됩니다.' },
  'collective-chair': { name: '국가평의회 의장', source: '대표대회·평의회의 집단적 위임', role: '집단지도부 의사일정, 법률 공포, 외교사절·훈장·국방회의', caution: '의장 개인이 평의회 권한을 대체하면 개인독재로 판정됩니다.' },
};

export function createSovereignPowersState(nationId: NationId): SovereignPowersState {
  return {
    version: 1,
    nationId,
    authorityCapital: 62,
    constitutionalConvention: 72,
    parliamentaryConfidence: 58,
    militaryObedience: 64,
    aristocraticLeverage: 18,
    patronagePressure: 12,
    activeEmergency: null,
    cooldowns: {},
    history: [],
  };
}

export function normalizeSovereignPowersState(value: unknown, nationId: NationId): SovereignPowersState {
  const fallback = createSovereignPowersState(nationId);
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<SovereignPowersState>;
  return {
    ...fallback,
    ...candidate,
    version: 1,
    nationId,
    authorityCapital: clamp(Number(candidate.authorityCapital ?? fallback.authorityCapital)),
    constitutionalConvention: clamp(Number(candidate.constitutionalConvention ?? fallback.constitutionalConvention)),
    parliamentaryConfidence: clamp(Number(candidate.parliamentaryConfidence ?? fallback.parliamentaryConfidence)),
    militaryObedience: clamp(Number(candidate.militaryObedience ?? fallback.militaryObedience)),
    aristocraticLeverage: clamp(Number(candidate.aristocraticLeverage ?? fallback.aristocraticLeverage)),
    patronagePressure: clamp(Number(candidate.patronagePressure ?? fallback.patronagePressure)),
    activeEmergency: candidate.activeEmergency && Number.isFinite(candidate.activeEmergency.declaredWeek) ? candidate.activeEmergency : null,
    cooldowns: candidate.cooldowns && typeof candidate.cooldowns === 'object' ? candidate.cooldowns : {},
    history: Array.isArray(candidate.history) ? candidate.history.slice(0, 80) : [],
  };
}

function resolveStatus(powerId: SovereignPowerId, office: SovereignOfficeKind, context: SovereignPowerContext): SovereignPowerStatus {
  const isMonarchy = monarchyOffices.includes(office);
  const executive = strongExecutiveOffices.includes(office);
  const appointmentsClause = context.constitution.enacted?.clauses.appointments;
  const emergencyClause = context.constitution.enacted?.clauses.emergency;
  const rightsClause = context.constitution.enacted?.clauses.rights;
  const noblePower = sovereignPowerDefinitions.find((item) => item.id === powerId)?.group === 'estates';

  if (noblePower) {
    if (!isMonarchy) return 'unavailable';
    if (powerId !== 'summon-regency' && !context.dynasty.titleGrants.length) return 'unavailable';
    if (powerId === 'summon-regency') return context.dynasty.successionSecurity < 65 ? (office === 'constitutional-monarch' ? 'countersigned' : 'express') : 'unavailable';
    if (powerId === 'join-regency') return context.dynasty.successionSecurity < 65 ? 'historic-estate' : 'unavailable';
    if (powerId === 'press-succession-claim') return 'historic-estate';
    if (powerId === 'manorial-court') {
      if (office === 'constitutional-monarch' || rightsClause === 'civil-liberties-charter' || rightsClause === 'plural-rights-charter') return 'ultra-vires';
      return 'historic-estate';
    }
    if (powerId === 'estate-levy' && office === 'constitutional-monarch') return 'ultra-vires';
    if (powerId === 'confirm-peerage-charter' && office === 'constitutional-monarch') return 'countersigned';
    return 'historic-estate';
  }

  if (powerId === 'end-emergency') return context.constitution && context.dynasty ? 'express' : 'unavailable';
  if (powerId === 'manage-royal-household') return isMonarchy ? (office === 'constitutional-monarch' ? 'countersigned' : 'express') : 'unavailable';
  if (powerId === 'promulgate-law' || powerId === 'address-and-counsel' || powerId === 'grant-honours') {
    return office === 'ceremonial-president' || office === 'constitutional-monarch' ? 'countersigned' : 'express';
  }
  if (powerId === 'return-or-veto-law') {
    if (office === 'executive-president' || office === 'dual-executive-president' || office === 'royal-executive' || office === 'imperial-sovereign') return 'express';
    if (office === 'ceremonial-president') return 'countersigned';
    return office === 'constitutional-monarch' ? 'reserve' : executive ? 'express' : 'ultra-vires';
  }
  if (powerId === 'appoint-government') {
    if (office === 'ceremonial-president' || office === 'constitutional-monarch') return 'countersigned';
    return 'express';
  }
  if (powerId === 'dismiss-government') {
    if (office === 'dual-executive-president' || office === 'royal-executive' || office === 'imperial-sovereign' || office === 'military-regent') return 'express';
    if (office === 'ceremonial-president' || office === 'constitutional-monarch') return 'reserve';
    return office === 'collective-chair' ? 'ultra-vires' : 'express';
  }
  if (powerId === 'dissolve-legislature') {
    if (office === 'dual-executive-president' || office === 'royal-executive' || office === 'imperial-sovereign') return 'express';
    if (office === 'ceremonial-president' || office === 'constitutional-monarch') return 'reserve';
    return 'ultra-vires';
  }
  if (powerId === 'call-referendum') {
    if (office === 'dual-executive-president' || office === 'executive-president' || office === 'collective-chair') return 'express';
    return isMonarchy ? 'reserve' : 'ultra-vires';
  }
  if (powerId === 'executive-order') {
    if (executive) return 'express';
    return office === 'constitutional-monarch' || office === 'ceremonial-president' ? 'ultra-vires' : 'reserve';
  }
  if (powerId === 'declare-emergency') {
    if (office === 'ceremonial-president' || office === 'constitutional-monarch') return emergencyClause === 'executive-decree-review' ? 'countersigned' : 'reserve';
    return 'express';
  }
  if (powerId === 'command-armed-forces') {
    if (office === 'ceremonial-president' || office === 'constitutional-monarch') return 'countersigned';
    return 'express';
  }
  if (powerId === 'treaty-and-envoys' || powerId === 'grant-pardon') {
    if (office === 'ceremonial-president' || office === 'constitutional-monarch') return 'countersigned';
    return 'express';
  }
  if (powerId === 'high-appointments') {
    if (appointmentsClause === 'independent-commission' || appointmentsClause === 'career-judicial-council' || appointmentsClause === 'legislative-election') return 'countersigned';
    return office === 'ceremonial-president' || office === 'constitutional-monarch' ? 'countersigned' : 'express';
  }
  return 'unavailable';
}

function legalBasisFor(power: SovereignPowerDefinition, status: SovereignPowerStatus, context: SovereignPowerContext) {
  const enacted = context.constitution.enacted;
  if (status === 'ultra-vires') return `현재 ${enacted?.name ?? '잠정 헌정'}에 명문 근거가 없거나 관례를 정면으로 위배합니다.`;
  if (status === 'reserve') return '헌법 문언상 남아 있지만 통상적으로 행사하지 않는 유보권입니다.';
  if (status === 'historic-estate') return '작위·영지 헌장과 왕실에 대한 봉사 의무에서 나오는 역사적 특권입니다.';
  const relevantClause = power.group === 'executive'
    ? enacted?.clauses.emergency
    : power.id === 'high-appointments'
      ? enacted?.clauses.appointments
      : enacted?.clauses.government;
  return `${enacted?.name ?? '현재 국가체제'} · ${withJosa(relevantClause ?? '관습헌법과 조직법', '을/를')} 근거로 합니다.`;
}

function statusModifiers(status: SovereignPowerStatus) {
  switch (status) {
    case 'countersigned': return { political: 1, authority: 0, impact: { parliamentaryConfidence: 1 } as Partial<SovereignPowerImpact> };
    case 'reserve': return { political: 6, authority: 4, impact: { legitimacy: -3, unrest: 3, parliamentaryConfidence: -7, publicConfidence: -3 } as Partial<SovereignPowerImpact> };
    case 'historic-estate': return { political: 2, authority: 1, impact: { estateBurden: 1, aristocraticLeverage: 2 } as Partial<SovereignPowerImpact> };
    case 'ultra-vires': return { political: 12, authority: 8, impact: { legitimacy: -9, unrest: 7, publicConfidence: -7, justiceIndependence: -8, mediaFreedom: -5, parliamentaryConfidence: -12, patronagePressure: 6 } as Partial<SovereignPowerImpact> };
    default: return { political: 0, authority: 0, impact: {} as Partial<SovereignPowerImpact> };
  }
}

function mergeImpact(...values: Array<Partial<SovereignPowerImpact>>): SovereignPowerImpact {
  const result = zeroImpact();
  for (const value of values) {
    for (const key of Object.keys(result) as Array<keyof SovereignPowerImpact>) result[key] += value[key] ?? 0;
  }
  return result;
}

export function assessSovereignPower(state: SovereignPowersState, powerId: SovereignPowerId, context: SovereignPowerContext, target?: NobleGrant | null): SovereignPowerAssessment {
  const definition = sovereignPowerDefinitions.find((item) => item.id === powerId) ?? sovereignPowerDefinitions[0];
  let status = resolveStatus(powerId, deriveSovereignOfficeKind(context.formId, context.constitution), context);
  const cooldownUntil = state.cooldowns[powerId] ?? 0;
  const cooldownRemaining = Math.max(0, cooldownUntil - context.week);
  const modifiers = statusModifiers(status);
  const politicalCost = definition.politicalCost + modifiers.political;
  const authorityCost = definition.authorityCost + modifiers.authority;
  const treasuryCost = definition.treasuryCost;
  const projectedImpact = mergeImpact(definition.impact, modifiers.impact, {
    politicalPower: -politicalCost,
    treasury: -treasuryCost,
  });
  const topOffice = context.role.tier === 1;
  const delegatedMinister = context.role.branch === 'politics' && context.role.tier <= 2 && status === 'countersigned';
  const titledEstateAction = definition.group === 'estates' && context.role.branch === 'politics' && context.role.tier <= 2;
  let allowed = status !== 'unavailable' && (topOffice || delegatedMinister || titledEstateAction);
  let reason = status === 'unavailable' ? '현재 체제·계승 상태에서 인정되는 권한이 아닙니다.' : '행사 가능';
  if (powerId === 'declare-emergency' && state.activeEmergency) {
    allowed = false;
    reason = `제${state.activeEmergency.reviewWeek + 1}주 재심까지 이미 비상사태가 시행 중입니다.`;
  } else if (powerId === 'end-emergency' && !state.activeEmergency) {
    status = 'unavailable';
    allowed = false;
    reason = '종료할 비상사태가 없습니다.';
  } else if (!topOffice && !delegatedMinister && !titledEstateAction) {
    allowed = false;
    reason = '국가원수·1급 보직 또는 해당 행위를 부서할 2급 정치 보직이 필요합니다.';
  } else if (definition.requiresNobleTarget && !target) {
    allowed = false;
    reason = '행사 주체가 될 작위·영지 보유자를 선택하십시오.';
  } else if (cooldownRemaining > 0) {
    allowed = false;
    reason = `관례적 재행사 제한이 ${cooldownRemaining}주 남았습니다.`;
  } else if (context.politicalPower < politicalCost) {
    allowed = false;
    reason = `정치력 ${politicalCost}가 필요합니다.`;
  } else if (treasuryCost > 0 && context.treasury < treasuryCost) {
    allowed = false;
    reason = `국고 ${treasuryCost}M이 필요합니다.`;
  } else if (state.authorityCapital < authorityCost) {
    allowed = false;
    reason = `권한 자본 ${authorityCost}가 필요합니다.`;
  }
  const verificationWeeks = status === 'ultra-vires' ? 4 : status === 'reserve' ? 3 : definition.group === 'estates' ? 4 : 2;
  const countersignature = status === 'countersigned'
    ? '총리·주무장관의 조언과 부서가 효력 요건입니다.'
    : status === 'express'
      ? '국가원수가 책임을 지고 직접 행사하되 입법·사법 견제를 받습니다.'
      : status === 'historic-estate'
        ? '작위 헌장의 의무와 특권이 함께 적용됩니다.'
        : '행사 즉시 법원·의회·언론·궁정 세력의 헌정 반발을 각오해야 합니다.';
  return {
    definition,
    status,
    statusLabel: sovereignPowerStatusLabels[status],
    allowed,
    reason,
    legalBasis: legalBasisFor(definition, status, context),
    countersignature,
    politicalCost,
    treasuryCost,
    authorityCost,
    cooldownRemaining,
    verificationWeeks,
    projectedImpact,
  };
}

export function exerciseSovereignPower(state: SovereignPowersState, powerId: SovereignPowerId, context: SovereignPowerContext, target?: NobleGrant | null): SovereignPowerActionResult | null {
  const assessment = assessSovereignPower(state, powerId, context, target);
  if (!assessment.allowed || assessment.status === 'unavailable') return null;
  const status = assessment.status;
  const impactValue = assessment.projectedImpact;
  const conventionDelta = status === 'ultra-vires' ? -18 : status === 'reserve' ? -8 : status === 'historic-estate' ? -1 : status === 'countersigned' ? 1 : 0;
  const verificationWeek = context.week + assessment.verificationWeeks;
  const emergency = powerId === 'declare-emergency'
    ? { declaredWeek: context.week, reviewWeek: context.week + (context.constitution.enacted?.clauses.emergency === 'sunset-emergency' ? 4 : 13), renewals: 0, oversight: assessment.legalBasis }
    : powerId === 'end-emergency'
      ? null
      : state.activeEmergency;
  const record: SovereignPowerRecord = {
    id: `sovereign-${context.week}-${powerId}-${state.history.length}`,
    week: context.week,
    powerId,
    title: assessment.definition.name,
    detail: `${assessment.definition.procedure} · ${assessment.countersignature}`,
    status,
    targetName: target?.titleName ?? null,
    verificationWeek,
    resolved: false,
    outcome: null,
  };
  const next: SovereignPowersState = {
    ...state,
    authorityCapital: clamp(state.authorityCapital - assessment.authorityCost + (powerId === 'end-emergency' ? 4 : 0)),
    constitutionalConvention: clamp(state.constitutionalConvention + conventionDelta),
    parliamentaryConfidence: clamp(state.parliamentaryConfidence + impactValue.parliamentaryConfidence),
    militaryObedience: clamp(state.militaryObedience + impactValue.militaryObedience),
    aristocraticLeverage: clamp(state.aristocraticLeverage + impactValue.aristocraticLeverage),
    patronagePressure: clamp(state.patronagePressure + impactValue.patronagePressure),
    activeEmergency: emergency,
    cooldowns: { ...state.cooldowns, [powerId]: context.week + assessment.definition.cooldownWeeks },
    history: [record, ...state.history].slice(0, 80),
  };
  return {
    state: next,
    title: `${assessment.definition.name} — ${assessment.statusLabel}`,
    detail: `${target ? `${withJosa(`${target.titleName}(${target.recipientName})`, '을/를')} 주체로 ` : ''}${assessment.definition.summary} 제${verificationWeek + 1}주에 의회·법원·언론·궁정의 실제 반응을 검증합니다.`,
    note: `${assessment.legalBasis} ${assessment.countersignature}`,
    status,
    verificationWeek,
    impact: impactValue,
  };
}

function pickOutcome(record: SovereignPowerRecord, state: SovereignPowersState) {
  const lawful = record.status === 'express' || record.status === 'countersigned';
  if (record.status === 'ultra-vires') return state.constitutionalConvention >= 55 ? '법원·의회가 월권을 정지시켰고 탄핵·퇴위 논의가 열렸습니다.' : '명령은 집행됐지만 헌정 관례가 크게 훼손됐습니다.';
  if (record.status === 'reserve') return state.parliamentaryConfidence >= 50 ? '위기 중재로 받아들여졌지만 재행사 제한 협약이 요구됐습니다.' : '의회 다수파가 헌정관례 위배로 규정하고 정면 대결을 선언했습니다.';
  if (record.status === 'historic-estate') return state.aristocraticLeverage <= 60 ? '영지 의무와 특권이 협약 범위에서 수행됐습니다.' : '귀족원이 성과를 근거로 추가 자치권·세습권을 요구했습니다.';
  return lawful && state.constitutionalConvention >= 55 ? '정해진 절차와 견제 안에서 효력이 안정적으로 확정됐습니다.' : '행위의 효력은 유지됐지만 추가 정치 협상이 필요합니다.';
}

export function advanceSovereignPowersWeek(state: SovereignPowersState, context: SovereignPowerContext): SovereignPowerAdvanceResult {
  const resolved: SovereignPowerRecord[] = [];
  const history = state.history.map((record) => {
    if (record.resolved || record.verificationWeek > context.week) return record;
    const next = { ...record, resolved: true, outcome: pickOutcome(record, state) };
    resolved.push(next);
    return next;
  });
  const overdueEmergency = state.activeEmergency && context.week >= state.activeEmergency.reviewWeek;
  const recentReserveUses = history.filter((record) => context.week - record.week <= 26 && (record.status === 'reserve' || record.status === 'ultra-vires')).length;
  const patronageCrisis = state.patronagePressure >= 70;
  const estateCrisis = state.aristocraticLeverage >= 72 || context.dynasty.estateBurden >= 70;
  const impactValue = {
    stability: overdueEmergency ? 0.3 : 0,
    legitimacy: overdueEmergency ? -0.35 : recentReserveUses >= 3 ? -0.18 : state.constitutionalConvention >= 72 ? 0.05 : 0,
    unrest: overdueEmergency ? 0.28 : estateCrisis ? 0.16 : 0,
    publicConfidence: patronageCrisis ? -0.2 : state.constitutionalConvention >= 72 ? 0.04 : 0,
    justiceIndependence: overdueEmergency ? -0.12 : recentReserveUses >= 3 ? -0.08 : 0.03,
    mediaFreedom: overdueEmergency ? -0.1 : 0.02,
    pressTrust: patronageCrisis ? -0.12 : 0.02,
    crownAuthority: estateCrisis ? -0.08 : 0,
    courtUnity: estateCrisis ? -0.12 : 0.03,
    successionSecurity: estateCrisis ? -0.08 : 0.02,
    estateBurden: context.dynasty.titleGrants.length ? 0.01 : -0.03,
  };
  const events = [
    ...resolved.map((record) => ({
      title: `권한 행사 검증 — ${record.title}`,
      detail: record.outcome ?? '후속 검증이 완료됐습니다.',
      tone: record.status === 'ultra-vires' ? 'bad' as const : record.status === 'reserve' || record.status === 'historic-estate' ? 'neutral' as const : 'good' as const,
      cause: `${sovereignPowerStatusLabels[record.status]} 행사 후 의회·법원·언론·궁정의 반응을 ${record.verificationWeek - record.week}주간 추적했습니다.`,
      consequence: record.outcome ?? '후속 협상이 필요합니다.',
    })),
    ...(overdueEmergency ? [{ title: '비상권 재심 기한 도래', detail: '의회·법원이 비상명령의 존속 필요성과 권리 제한을 재심하라고 요구했습니다.', tone: 'bad' as const, cause: `제${state.activeEmergency!.declaredWeek + 1}주 선포 후 제${state.activeEmergency!.reviewWeek + 1}주 재심 기한이 도래했습니다.`, consequence: '종료하지 않으면 매주 정통성·사법독립·언론자유가 하락합니다.' }] : []),
    ...(patronageCrisis ? [{ title: '고위인사 연고주의 감사', detail: '인사청탁과 훈장·관직 거래가 제도 신뢰를 압박하고 있습니다.', tone: 'bad' as const, cause: `후원 압력 ${Math.round(state.patronagePressure)}/100`, consequence: '독립 검증·공개청문 없이 인사를 반복하면 사법·언론 사건이 확대됩니다.' }] : []),
    ...(estateCrisis ? [{ title: '귀족원·영지 권력의 독자 세력화', detail: '대작위 보유자들이 조세·군역·사법권을 묶어 중앙정부에 공동 교섭을 요구했습니다.', tone: 'bad' as const, cause: `귀족 지레버리지 ${Math.round(state.aristocraticLeverage)} · 영지 부담 ${Math.round(context.dynasty.estateBurden)}`, consequence: '거부하면 궁정 쿠데타, 수용하면 장기적 국가 역량 약화 위험이 커집니다.' }] : []),
  ];
  const office = deriveSovereignOfficeKind(context.formId, context.constitution);
  const next: SovereignPowersState = {
    ...state,
    authorityCapital: clamp(state.authorityCapital + 0.6 + context.legitimacy * 0.003 + (state.constitutionalConvention >= 65 ? 0.15 : -0.08)),
    constitutionalConvention: clamp(state.constitutionalConvention + (recentReserveUses === 0 ? 0.08 : -recentReserveUses * 0.02)),
    parliamentaryConfidence: clamp(state.parliamentaryConfidence + (context.stability >= 60 ? 0.05 : -0.05)),
    militaryObedience: clamp(state.militaryObedience + (context.stability >= 55 ? 0.04 : -0.08)),
    aristocraticLeverage: clamp(state.aristocraticLeverage + (context.dynasty.titleGrants.length * 0.008) - (context.dynasty.estateBurden < 35 ? 0.03 : 0)),
    patronagePressure: clamp(state.patronagePressure - (context.institutionalCapacity >= 60 ? 0.09 : 0.02)),
    activeEmergency: overdueEmergency && state.activeEmergency ? { ...state.activeEmergency, reviewWeek: state.activeEmergency.reviewWeek + 4, renewals: state.activeEmergency.renewals + 1 } : state.activeEmergency,
    history,
  };
  return {
    state: next,
    impact: impactValue,
    events,
    note: `${sovereignOfficeProfiles[office].name} · 권한 자본 ${Math.round(next.authorityCapital)} · 헌정 관례 ${Math.round(next.constitutionalConvention)} · 의회 신임 ${Math.round(next.parliamentaryConfidence)}${next.activeEmergency ? ` · 비상권 재심 ${Math.max(0, next.activeEmergency.reviewWeek - context.week)}주` : ''}`,
  };
}
