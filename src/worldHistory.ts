import type { GameState, NationId, NationProfile } from './types';
import { extendedWorldHistoryEvents } from './extendedWorldHistory';
import { expandedAlternateHistoryEvents } from './expandedAlternateHistory';
import { intelligenceWorldHistoryEvents } from './intelligenceWorldHistory';
import { resolveIntelligenceHistory } from './intelligenceHistory';
import type { ResolvedIntelligenceOrganization } from './intelligenceHistory';
import { getEndingAlternatives, historicalEndings, resolveHistoricalEnding } from './historicalEndings';
import type { HistoricalEnding, ResolvedHistoricalEnding } from './historicalEndings';
import type { EmergentHistoryProfile, HistoryForce } from './emergentHistory';

export type WorldHistoryCategory = 'nuclear' | 'world-order' | 'economy' | 'decolonization' | 'proxy-war' | 'space' | 'society' | 'technology' | 'environment' | 'public-health' | 'intelligence';
export type WorldHistoryEra = 'war-end' | 'reconstruction' | 'early-rivalry' | 'high-rivalry' | 'detente' | 'transformation' | 'post-cold-war' | 'connected-world';
export type WorldMetric = 'deterrence' | 'multipolarity' | 'decolonization' | 'rights' | 'prosperity' | 'instability';

export interface WorldHistoryVariant {
  id: string;
  title: string;
  summary: string;
  consequence: string;
  metricDelta: Partial<Record<WorldMetric, number>>;
}

export interface WorldHistoryEvent {
  id: string;
  title: string;
  historicalYear: number;
  era: WorldHistoryEra;
  category: WorldHistoryCategory;
  historicalBasis: string;
  sourceLabel: string;
  sourceUrl: string;
  historicalActorIds?: string[];
  variants: [WorldHistoryVariant, WorldHistoryVariant, WorldHistoryVariant];
}

export interface WorldHistoryState {
  seed: number;
  choices: Record<string, string>;
}

export interface GeneratedWorldEvent {
  event: WorldHistoryEvent;
  variant: WorldHistoryVariant;
  year: number;
  actor: string;
  isPlayerChoice: boolean;
  causalFactors: string[];
}

export interface GeneratedWorldline {
  code: string;
  title: string;
  summary: string;
  primaryBloc: string;
  rivalBloc: string;
  thirdPole: string;
  rivalryName: string;
  atomicProject: string;
  atomicSponsor: string;
  nuclearArchitecture: string;
  metrics: Record<WorldMetric, number>;
  timeline: GeneratedWorldEvent[];
  intelligenceHistory: ResolvedIntelligenceOrganization[];
  possibilityCount: string;
  possibilityFormula: string;
  divergenceCount: number;
  faultLines: string[];
  ending: ResolvedHistoricalEnding;
  endingCount: number;
  endingAlternatives: HistoricalEnding[];
}

export interface WorldHistoryInput {
  nation: NationProfile;
  game: Pick<GameState, 'victoryScore' | 'stability' | 'warSupport' | 'factories' | 'intelNetwork' | 'enemyPressure' | 'airPower' | 'navalPower'>;
  state: WorldHistoryState;
  trajectory?: EmergentHistoryProfile;
}

export interface WorldHistoryChoicePreview {
  changedEvents: number;
  metricChanges: Partial<Record<WorldMetric, number>>;
}

const source = {
  doe: ['미국 에너지부 · 맨해튼 계획사', 'https://www.osti.gov/opennet/manhattan-project-history/index.htm'],
  state: ['미국 국무부 역사국 · 1945–1952 주요 전환', 'https://history.state.gov/milestones/1945-1952/foreword'],
  un: ['유엔 · 유엔 창설의 역사', 'https://www.un.org/en/about-us/history-of-the-un'],
  decolonization: ['유엔 · 탈식민화', 'https://www.un.org/en/global-issues/decolonization/'],
  udhr: ['유엔 · 세계인권선언', 'https://www.un.org/en/about-us/universal-declaration-of-human-rights/'],
  peacekeeping: ['유엔 평화유지활동 · 연혁', 'https://peacekeeping.un.org/en/our-history'],
  bretton: ['IMF · 브레턴우즈 체제', 'https://www.imf.org/en/about/factsheets/sheets/2022/imf-world-bank-new'],
  nasa: ['NASA · 스푸트니크와 우주시대', 'https://www.nasa.gov/history/65-years-ago-sputnik-ushers-in-the-space-age/'],
  astp: ['NASA · 아폴로–소유스', 'https://www.nasa.gov/history/astp/overview.html'],
  iaea: ['IAEA · 원자력의 평화적 이용과 NPT', 'https://www.iaea.org/newscenter/news/atoms-should-be-peace'],
  eu: ['유럽연합 · 유럽통합 연표', 'https://european-union.europa.eu/principles-countries-history/history-eu_en'],
  nato: ['NATO · 1945년 이후 역사', 'https://www.nato.int/en/about-us/nato-history/a-short-history-of-nato'],
  who: ['WHO · 세계 공중보건 주요 사건', 'https://www.who.int/campaigns/75-years-of-improving-public-health/milestones'],
  wto: ['WTO · 다자무역체제의 역사', 'https://www.wto.org/english/thewto_e/history_e/history_e.htm'],
  climate: ['UNFCCC · 교토의정서와 기후협약', 'https://unfccc.int/process-and-meetings/the-kyoto-protocol'],
  covid: ['WHO · COVID-19 대응 연표', 'https://www.who.int/news/item/29-06-2020-covidtimeline'],
  worldbank: ['세계은행 · 전후 개발질서의 역사', 'https://www.worldbank.org/en/about/history'],
  unhcr: ['UNHCR · 난민보호 체제의 역사', 'https://www.unhcr.org/about-unhcr/who-we-are/history-unhcr'],
  oecdAi: ['OECD · 인공지능 원칙', 'https://oecd.ai/en/ai-principles'],
} as const;

const v = (
  id: string,
  title: string,
  summary: string,
  consequence: string,
  metricDelta: Partial<Record<WorldMetric, number>>,
): WorldHistoryVariant => ({ id, title, summary, consequence, metricDelta });

const event = (
  id: string,
  title: string,
  historicalYear: number,
  era: WorldHistoryEra,
  category: WorldHistoryCategory,
  historicalBasis: string,
  citation: readonly [string, string],
  variants: [WorldHistoryVariant, WorldHistoryVariant, WorldHistoryVariant],
): WorldHistoryEvent => ({ id, title, historicalYear, era, category, historicalBasis, sourceLabel: citation[0], sourceUrl: citation[1], variants });

// Every family starts from a documented historical pressure, then exposes three systemic outcomes.
// The core and extended atlases exceed one hundred three-way families before campaign variables apply.
export const worldHistoryEvents: WorldHistoryEvent[] = [
  event('atomic-program', '원자폭탄 계획과 과학 동원', 1942, 'war-end', 'nuclear', '맨해튼 계획은 전시 과학·산업·군 조직을 한 체계로 묶었고 전후 핵질서의 출발점이 되었다.', source.doe, [
    v('arsenal', '국가 독점 병기', '최초 개발국이 원자 병기를 군 통수권 아래 봉인한다.', '핵 독점이 동맹의 위계를 고정하지만 경쟁국의 침투와 추격을 부른다.', { deterrence: 8, multipolarity: -4, instability: 5 }),
    v('authority', '국제 원자력 관리청', '시설과 핵물질을 초국가 사찰 체계에 맡긴다.', '원자력은 공동 관리되지만 거부권과 사찰 주권이 새 갈등선이 된다.', { deterrence: 2, rights: 3, instability: -5 }),
    v('distributed', '분산형 원자 경쟁', '과학자와 장비가 여러 승전국·해방정부로 흩어진다.', '핵문턱 국가가 빠르게 늘어 다극 억지는 강해지고 오판 위험도 커진다.', { deterrence: 5, multipolarity: 9, instability: 9 }),
  ]),
  event('war-termination', '총력전의 종결 방식', 1945, 'war-end', 'world-order', '항복, 점령, 원폭과 소련의 참전은 전후 권력 공백과 점령 구역을 규정했다.', source.state, [
    v('conditional', '조건부 연쇄 항복', '왕정·관료·현지군 일부를 보존한 채 단계적으로 무장 해제한다.', '행정 연속성은 높지만 구체제 청산 문제가 오래 남는다.', { prosperity: 3, instability: -2, rights: -2 }),
    v('unconditional', '무조건 항복과 연합 점령', '패전국을 분할 점령하고 중앙에서 비군사화를 집행한다.', '개혁은 강력하지만 점령선이 다음 체제 대립의 경계가 된다.', { rights: 3, multipolarity: -2, instability: 2 }),
    v('negotiated', '다극 휴전 회의', '전선의 실효 지배 세력이 동등한 교전 당사자로 휴전을 체결한다.', '패전의 정의가 흐려지고 지역 군벌·저항군도 국제 행위자가 된다.', { multipolarity: 7, decolonization: 4, instability: 6 }),
  ]),
  event('world-organization', '보편 국제기구의 창설', 1945, 'war-end', 'world-order', '샌프란시스코 회의와 유엔 헌장은 집단안보의 제도적 기준선을 만들었다.', source.un, [
    v('great-power', '대국 협조형 안전보장이사회', '상임 강대국의 합의가 국제 강제력의 전제가 된다.', '대전은 억제되지만 거부권 아래 지역분쟁이 누적된다.', { deterrence: 3, multipolarity: -2, instability: -1 }),
    v('parliament', '세계 의회형 연합', '인구·지역 대표성을 반영한 의회가 제재와 평화군을 승인한다.', '중소국 발언권과 국제법 집행력이 함께 커진다.', { rights: 6, multipolarity: 5, instability: -4 }),
    v('regional', '지역기구 연방', '대륙별 안보기구가 느슨한 세계 평의회를 구성한다.', '지역 자율성은 높지만 지역 패권국을 견제할 장치가 약하다.', { multipolarity: 8, deterrence: 2, instability: 3 }),
  ]),
  event('war-crimes', '전쟁범죄와 책임의 범위', 1945, 'war-end', 'society', '뉘른베르크와 도쿄 재판은 개인의 국제형사책임이라는 선례를 세웠다.', source.state, [
    v('victors', '승전국 국제군사재판', '주요 패전국 지도부를 국제재판에 세운다.', '법적 선례는 남지만 승자의 정의라는 비판도 고착된다.', { rights: 4, instability: 1 }),
    v('universal', '보편 국제형사재판소', '승전국의 범죄와 식민지 폭력까지 동일 기준으로 심리한다.', '인권 규범은 크게 강화되지만 강대국의 반발도 거세다.', { rights: 10, decolonization: 5, instability: 2 }),
    v('amnesty', '정치적 사면과 진실위원회', '처벌보다 증언·배상·행정 복구를 앞세운다.', '화해는 빨라지나 가해 엘리트의 재등장을 막기 어렵다.', { prosperity: 3, rights: -3, instability: 4 }),
  ]),
  event('occupation-reform', '점령과 패전국 재건', 1946, 'reconstruction', 'economy', '점령 당국은 비군사화·민주화·토지개혁·산업 재편을 결합했다.', source.state, [
    v('divided', '분할 점령과 경쟁 개혁', '점령구역마다 다른 정치·경제 제도를 이식한다.', '빠른 복구 뒤 분단국가와 도시간 탈출 경쟁이 나타난다.', { prosperity: 3, multipolarity: -3, instability: 5 }),
    v('trusteeship', '통합 국제신탁통치', '단일 국제위원회가 선거와 배상을 단계적으로 관리한다.', '분단 가능성은 낮아지나 독립 시점 협상이 길어진다.', { rights: 4, instability: -4 }),
    v('self-reform', '국내 연립정부 자력 개혁', '반전파·노동계·보수 관료가 임시연정을 구성한다.', '점령 반감은 줄지만 구체제와 혁명세력의 권력투쟁이 치열해진다.', { multipolarity: 4, prosperity: 2, instability: 3 }),
  ]),
  event('monetary-order', '전후 통화·개발 질서', 1944, 'reconstruction', 'economy', '브레턴우즈 회의는 IMF와 세계은행의 토대를 만들었다.', source.bretton, [
    v('reserve-currency', '단일 기축통화 체제', '최대 채권국의 통화를 고정환율 질서의 중심에 둔다.', '교역은 회복되지만 중심국의 정책이 세계 유동성을 좌우한다.', { prosperity: 7, multipolarity: -4, instability: -1 }),
    v('clearing-union', '다자 청산동맹', '흑자국과 적자국 모두 조정 의무를 지는 국제청산단위를 채택한다.', '불균형은 줄고 지역통화권이 공존한다.', { prosperity: 6, multipolarity: 5, instability: -3 }),
    v('currency-blocs', '경쟁 통화권 분할', '제국권·혁명권·해방권이 별도 결제망을 만든다.', '자급권 내부 산업은 성장하지만 블록 간 교역 충격이 잦다.', { multipolarity: 8, prosperity: -2, instability: 5 }),
  ]),
  event('atomic-control', '핵물질 국제통제안', 1946, 'reconstruction', 'nuclear', '애치슨–릴리엔솔 보고서와 바루크안은 국제 원자력 통제를 둘러싼 실제 협상이었다.', source.state, [
    v('failed-plan', '사찰안 결렬', '비밀·거부권·제재 순서를 둘러싼 협상이 무너진다.', '두 핵개발 체계가 상대의 최악 의도를 전제로 군비경쟁에 들어간다.', { deterrence: 6, instability: 7 }),
    v('verified-control', '상호 사찰 타협', '단계적 신고와 불시사찰을 교환한다.', '개발 속도는 늦어지고 위반 탐지가 외교 위기의 핵심이 된다.', { deterrence: 2, rights: 2, instability: -6 }),
    v('regional-custody', '지역별 공동 핵보관', '대륙기구가 탄두와 운반체계를 분리 보관한다.', '핵 공유 동맹이 여러 개 생기며 패권보다 연합 내부 정치가 중요해진다.', { multipolarity: 8, deterrence: 5, instability: 2 }),
  ]),
  event('indian-independence', '남아시아 독립과 경계선', 1947, 'reconstruction', 'decolonization', '인도 독립과 분할은 제국 해체, 대규모 이주와 국가건설을 동시에 촉발했다.', source.decolonization, [
    v('partition', '분할 독립', '종교 다수 지역을 기준으로 복수 국가가 출범한다.', '주권은 빨리 확보되나 국경·난민·수자원 갈등이 장기화된다.', { decolonization: 7, instability: 7 }),
    v('federation', '다민족 연방 독립', '주 자치와 공동 국방을 맞바꾼 느슨한 연방을 구성한다.', '분리 충돌은 줄지만 중앙권력과 자치정부의 협상이 상시화된다.', { decolonization: 8, multipolarity: 3, instability: -3 }),
    v('confederation', '남아시아 국가연합', '여러 주권국이 관세·철도·강 유역만 공동 관리한다.', '독립의 상징성과 경제 통합이 공존하며 제3세력의 중심이 된다.', { decolonization: 9, multipolarity: 7, prosperity: 4 }),
  ]),
  event('containment-doctrine', '전후 안보 독트린', 1947, 'early-rivalry', 'world-order', '트루먼 독트린과 봉쇄정책은 이념 대립을 세계적 안보 약속으로 전환했다.', source.state, [
    v('containment', '세계적 봉쇄선', '경쟁 이념의 확장을 모든 지역에서 차단한다.', '동맹 신뢰는 높아지나 내전이 블록 대결로 확대된다.', { deterrence: 5, instability: 6, multipolarity: -3 }),
    v('spheres', '상호 세력권 인정', '핵심 완충지대에서 간섭 금지선을 합의한다.', '대국 충돌은 줄지만 약소국의 선택권은 크게 제한된다.', { instability: -3, rights: -4, multipolarity: -3 }),
    v('open-alignment', '사안별 가변 연대', '국가는 안보·통상·이념마다 다른 파트너를 선택한다.', '고정 냉전은 약해지고 다극 외교와 정권교체 경쟁이 치열해진다.', { multipolarity: 10, instability: 3 }),
  ]),
  event('reconstruction-aid', '대륙 재건 원조', 1948, 'early-rivalry', 'economy', '마셜 플랜은 생산 회복과 정치 안정, 서유럽 통합을 함께 추구했다.', source.state, [
    v('bloc-aid', '조건부 블록 원조', '공여국 시장·안보 협력과 연결된 대규모 원조를 제공한다.', '재건은 빠르지만 경제권 분할이 굳어진다.', { prosperity: 9, multipolarity: -4 }),
    v('universal-aid', '보편 재건기금', '승패와 체제를 가리지 않고 피해·인구 기준으로 배분한다.', '교역 복구와 화해가 빨라지고 냉전 동원은 약해진다.', { prosperity: 10, instability: -5, rights: 2 }),
    v('autarkic-drive', '자력갱생 산업화', '원조 의존을 거부하고 배급·국유화·수입대체를 추진한다.', '중공업은 성장하나 소비 회복과 국제교역은 지연된다.', { multipolarity: 4, prosperity: -3, instability: 2 }),
  ]),
  event('human-rights', '보편 인권 규범', 1948, 'early-rivalry', 'society', '세계인권선언은 서로 다른 법·문화 전통을 모아 공통 기준을 선언했다.', source.udhr, [
    v('declaration', '비구속 보편선언', '공통 언어를 채택하되 집행은 각 국가에 맡긴다.', '인권운동의 기준점이 되지만 위반 제재는 약하다.', { rights: 7 }),
    v('binding-charter', '구속력 있는 세계인권헌장', '국제재판과 개인청원권을 즉시 도입한다.', '시민은 국가를 넘어 호소할 수 있고 권위주의 국가는 탈퇴를 위협한다.', { rights: 12, instability: 2 }),
    v('regional-rights', '지역별 권리헌장', '문화권별 헌장을 만들고 최소 공통조항만 공유한다.', '집행 가능성은 높지만 권리의 지역 격차가 제도화된다.', { rights: 4, multipolarity: 4 }),
  ]),
  event('berlin-crisis', '점령도시 봉쇄 위기', 1948, 'early-rivalry', 'proxy-war', '베를린 봉쇄와 공수작전은 직접전쟁 없이 결의를 시험한 초기 냉전 위기였다.', source.state, [
    v('airlift', '대규모 공수와 봉쇄 해제', '무력 돌파 대신 수송 능력으로 도시를 유지한다.', '물류 기술과 동맹 결속이 강화되고 도시는 체제 경쟁의 상징이 된다.', { deterrence: 4, prosperity: 2, instability: 1 }),
    v('neutral-city', '국제 자유도시 타협', '도시와 회랑을 국제기구가 관리한다.', '전초기지 위기는 줄지만 중립도시 정보전이 격화된다.', { instability: -4, multipolarity: 3 }),
    v('armed-corridor', '무장 회랑 돌파', '호송대가 봉쇄선을 강제로 통과한다.', '국지 충돌이 동원 경쟁과 조기 재무장으로 번진다.', { deterrence: 6, instability: 10 }),
  ]),
  event('middle-east-settlement', '서아시아 위임통치의 종결', 1948, 'early-rivalry', 'decolonization', '위임통치 종결, 분할안, 국가 수립과 전쟁은 난민·영토·안보 문제를 남겼다.', source.un, [
    v('partition-war', '분할과 국가간 전쟁', '경쟁 민족국가가 전쟁 속에서 경계를 확정한다.', '난민과 미승인 국경이 국제정치의 상수로 남는다.', { decolonization: 3, instability: 9 }),
    v('binational', '이중민족 연방', '공동 의회와 지역 자치, 국제 보증을 결합한다.', '제도는 포괄적이지만 치안권과 귀환권 협상이 끊이지 않는다.', { rights: 6, instability: -3 }),
    v('regional-trust', '지역연맹 신탁지', '주변국과 국제기구가 성지·난민·수자원을 공동 관리한다.', '주권 확정은 늦어지지만 광역 경제권이 형성된다.', { multipolarity: 5, prosperity: 3, instability: -2 }),
  ]),
  event('chinese-revolution', '중국 내전과 동아시아 질서', 1949, 'early-rivalry', 'world-order', '중국 혁명의 승리는 세계 세력균형과 아시아 탈식민화에 결정적 변화를 주었다.', source.state, [
    v('continental-victory', '대륙 혁명정부의 승리', '혁명정부가 대륙을 통합하고 패배 세력은 도서 거점으로 이동한다.', '동아시아 냉전선이 해협과 반도로 이동한다.', { multipolarity: 4, decolonization: 4, instability: 5 }),
    v('coalition-republic', '연합공화국 타협', '지역군·민족주의자·공산주의자가 연방 선거에 합의한다.', '초강대국 한 축보다 거대한 중립 연방이 등장한다.', { multipolarity: 9, instability: -3, prosperity: 3 }),
    v('regional-fragmentation', '다중 중국의 장기 공존', '대륙에 여러 정권과 자치지역이 국제 승인을 얻는다.', '항구와 자원이 경쟁 블록의 대리전 시장이 된다.', { multipolarity: 7, instability: 10, prosperity: -4 }),
  ]),
  event('alliance-system', '상설 집단방위 동맹', 1949, 'early-rivalry', 'world-order', 'NATO와 뒤이은 대항 동맹들은 평시에도 상설 지휘체계를 유지했다.', source.state, [
    v('two-blocs', '양대 상설군사동맹', '두 중심국이 표준화·기지·자동개입 약속을 묶는다.', '억지력은 높지만 모든 지역 위기가 체제 신뢰도 시험이 된다.', { deterrence: 8, multipolarity: -7, instability: 3 }),
    v('collective-security', '단일 집단안보군', '국제기구가 회원국 전력을 공동 지휘한다.', '블록전쟁 가능성은 줄고 파견 승인 정치가 핵심이 된다.', { deterrence: 4, rights: 3, instability: -5 }),
    v('many-pacts', '다섯 개 지역방위권', '대서양·유라시아·아시아·아프리카·남방권이 교차 보증한다.', '냉전은 삼각·사각 협상으로 변하고 약소국의 교섭력이 커진다.', { multipolarity: 12, deterrence: 4, instability: 2 }),
  ]),
  event('korean-war', '한반도 전쟁과 분단선', 1950, 'early-rivalry', 'proxy-war', '한국전쟁은 내전·분단·국제연합군·중국 참전이 겹친 최초의 대규모 냉전전쟁이었다.', source.state, [
    v('armistice', '국제전과 휴전선', '확전 제한 끝에 군사분계선과 정전체제를 남긴다.', '재무장과 동맹망은 강화되고 평화협정은 다음 세대로 미뤄진다.', { deterrence: 5, instability: 6, prosperity: -3 }),
    v('neutral-unification', '중립 통일정부', '주변 강대국 철군과 감시선거를 교환한다.', '한반도는 완충국이 되고 동아시아 양극화가 늦어진다.', { multipolarity: 5, instability: -6, prosperity: 3 }),
    v('regional-expansion', '동아시아 전면전', '해협·만주·열도까지 전쟁이 확산된다.', '식민지 독립과 정권교체가 전쟁의 결과에 종속된다.', { deterrence: 8, decolonization: 2, instability: 13, prosperity: -8 }),
  ]),
  event('nonaligned-conference', '아시아·아프리카 연대', 1955, 'high-rivalry', 'decolonization', '반둥회의는 신생국 협력과 비동맹 외교의 토대를 놓았다.', source.decolonization, [
    v('nonalignment', '비동맹 운동', '양대 블록 가입을 거부하고 식민주의 반대를 공동 의제로 삼는다.', '제3세계가 표결 블록과 중재자로 성장한다.', { multipolarity: 9, decolonization: 8 }),
    v('development-bank', '남–남 개발공동체', '원자재 가격·기술·개발금융을 공동 관리한다.', '정치적 중립을 넘어 경제적 제3극이 등장한다.', { multipolarity: 10, prosperity: 7, decolonization: 5 }),
    v('liberation-front', '범대륙 해방전선', '독립운동에 훈련·무기·외교승인을 제공한다.', '제국 해체가 빨라지지만 대리전과 쿠데타도 증가한다.', { decolonization: 13, instability: 9 }),
  ]),
  event('suez-peacekeeping', '운하 위기와 평화유지군', 1956, 'high-rivalry', 'proxy-war', '수에즈 위기는 구제국의 한계를 드러냈고 최초의 무장 유엔평화유지군을 낳았다.', source.peacekeeping, [
    v('ceasefire-force', '국제 평화유지군', '교전국 사이에 중립군을 배치해 철수를 감시한다.', '평화유지가 국제기구의 상설 도구가 된다.', { decolonization: 4, instability: -5 }),
    v('canal-consortium', '운하 국제협동조합', '연안국·이용국·노동자가 운하 수익과 운영권을 나눈다.', '자원주권과 항행 자유의 새로운 절충안이 확산된다.', { prosperity: 5, multipolarity: 5, instability: -3 }),
    v('imperial-return', '구제국 군사개입 성공', '원정군이 전략시설을 재점령한다.', '단기 통제 뒤 광범위한 민족해방전쟁과 제재가 뒤따른다.', { decolonization: 8, rights: -5, instability: 12 }),
  ]),
  event('space-launch', '인공위성과 우주 경쟁', 1957, 'high-rivalry', 'space', '스푸트니크 발사는 우주시대와 장거리 로켓·교육·과학 경쟁을 열었다.', source.nasa, [
    v('race', '국가 위신 우주경쟁', '위성·유인비행·달 착륙을 체제 우월성의 증거로 삼는다.', '기술투자는 폭증하지만 군사용 로켓과 감시체계도 함께 성장한다.', { deterrence: 5, prosperity: 4, instability: 2 }),
    v('international-space', '국제 우주기구', '추적망·발사장·과학 탑재체를 공동 운용한다.', '과학 성과가 공유되고 우주 비군사화 규범이 강화된다.', { prosperity: 6, rights: 2, instability: -4 }),
    v('private-frontier', '상업 우주개척 경쟁', '국가가 특허와 발사권을 기업·대학 연합에 개방한다.', '혁신은 빨라지나 궤도와 주파수의 소유권 분쟁이 생긴다.', { prosperity: 9, multipolarity: 4, instability: 3 }),
  ]),
  event('atoms-for-peace', '평화적 원자력과 사찰', 1957, 'high-rivalry', 'nuclear', 'Atoms for Peace 구상, IAEA와 NPT는 원자력 협력과 비확산·사찰을 연결했다.', source.iaea, [
    v('npt-order', '핵보유국–비보유국 교환', '비확산과 평화이용 지원, 장기 군축 약속을 교환한다.', '확산 속도는 늦어지지만 핵 특권 논쟁이 지속된다.', { deterrence: 5, instability: -3 }),
    v('zero-option', '핵무기 전면 폐기협약', '검증 가능한 폐기와 국제 연료은행을 함께 시행한다.', '핵전쟁 위험은 급감하고 재래식 군사력 격차가 새 쟁점이 된다.', { deterrence: -5, rights: 4, instability: -8 }),
    v('open-nuclear-club', '다극 핵클럽', '지역 패권국의 제한 보유를 인정하고 상호통보를 의무화한다.', '핵 억지는 분산되지만 연쇄확산과 지휘통제 사고가 늘어난다.', { deterrence: 9, multipolarity: 8, instability: 7 }),
  ]),
  event('african-independence', '아프리카 독립의 물결', 1960, 'high-rivalry', 'decolonization', '1960년 유엔 탈식민화 선언과 다수 국가의 독립은 국제사회의 구성을 바꾸었다.', source.decolonization, [
    v('inherited-borders', '승계 국경 독립', '식민지 행정경계를 주권국가의 국경으로 인정한다.', '독립 승인은 빠르지만 민족·자원 경계 갈등이 남는다.', { decolonization: 10, instability: 5 }),
    v('federal-regions', '범지역 연방 독립', '철도·강 유역·언어권을 묶은 복수 연방이 출범한다.', '국가 수는 줄고 공동시장은 커지지만 연방 탈퇴 협상이 이어진다.', { decolonization: 11, prosperity: 5, multipolarity: 5 }),
    v('gradual-commonwealth', '단계적 공동체 전환', '국방·통화권을 일정 기간 공유하며 주권을 이양한다.', '행정 공백은 줄지만 신식민주의 논쟁과 독립운동 분열이 심해진다.', { decolonization: 5, prosperity: 3, rights: -3 }),
  ]),
  event('congo-intervention', '자원국가 위기와 국제개입', 1960, 'high-rivalry', 'proxy-war', '콩고 위기는 탈식민화, 분리주의, 광물 이권과 대규모 유엔작전이 겹쳤다.', source.peacekeeping, [
    v('un-operation', '대규모 국제 평화작전', '국제군이 외국군 철수와 영토 통합을 강제한다.', '평화유지군의 권한은 커지나 중립성 논쟁도 깊어진다.', { decolonization: 4, instability: -3 }),
    v('african-mediation', '아프리카 연합 중재', '인접 신생국이 공동군과 선거감시단을 파견한다.', '대륙 자주성이 강화되고 지역기구가 제3극으로 성장한다.', { multipolarity: 7, decolonization: 6, instability: -4 }),
    v('corporate-secession', '광산지대 기업국가', '다국적 기업과 용병이 분리정권을 유지한다.', '자원전쟁과 쿠데타 산업이 전 세계로 확산된다.', { prosperity: -5, rights: -7, instability: 13 }),
  ]),
  event('divided-city-wall', '분단도시와 인구 이동', 1961, 'high-rivalry', 'society', '베를린 장벽은 인구 유출을 차단하며 체제분단의 물리적 상징이 되었다.', source.state, [
    v('wall', '봉쇄장벽 건설', '국경 통행을 물리적으로 차단한다.', '단기 안정과 장기 인권 위기, 탈출 경쟁이 함께 나타난다.', { instability: -1, rights: -7 }),
    v('open-city', '개방도시 협정', '왕래와 취업은 보장하되 군사활동을 금지한다.', '도시는 정보·문화·상업 교류의 완충지대가 된다.', { prosperity: 4, rights: 7, instability: -4 }),
    v('population-exchange', '국제 관리 인구교환', '이주 희망자를 등록·보상하며 단계적으로 이동시킨다.', '즉각적 충돌은 줄지만 재산권과 강제성 논쟁이 남는다.', { rights: -2, instability: -2 }),
  ]),
  event('missile-crisis', '핵미사일 벼랑끝 위기', 1962, 'high-rivalry', 'nuclear', '쿠바 미사일 위기는 비밀 배치, 봉쇄, 핵지휘와 위기소통의 위험을 드러냈다.', source.state, [
    v('backchannel', '비밀 타협과 직통선', '공개 양보 없이 상호 철수하고 정상 간 직통선을 만든다.', '위기관리 규칙이 생기지만 비밀 거래 불신도 남는다.', { deterrence: 5, instability: -7 }),
    v('conference', '공개 다자 군축회의', '지역 비핵화와 모든 전진배치 철수를 묶는다.', '완충지대가 늘고 중소국도 핵협상 당사자가 된다.', { multipolarity: 5, deterrence: 2, instability: -8 }),
    v('exchange', '제한 핵교환', '오판과 지휘 단절로 군사기지에 핵무기가 사용된다.', '보복 제한에 성공해도 핵금기와 세계경제가 붕괴한다.', { deterrence: 12, prosperity: -15, rights: -6, instability: 18 }),
  ]),
  event('rights-movements', '민권·여성·학생·노동 운동', 1964, 'high-rivalry', 'society', '전후 대중운동은 법적 차별, 식민주의, 권위주의와 세대 질서에 도전했다.', source.udhr, [
    v('legislation', '제도권 권리혁명', '선거권·차별금지·노동권을 입법과 사법판결로 확대한다.', '대표성과 사회 이동이 커지고 보수 반동도 정당정치로 조직된다.', { rights: 10, prosperity: 2, instability: 1 }),
    v('participatory', '평의회 민주주의', '직장·대학·지역에서 직접 참여기구가 예산과 인사를 나눈다.', '권리 확대가 경제 운영 방식까지 변화시킨다.', { rights: 11, multipolarity: 4, instability: 3 }),
    v('security-state', '국가안보 우선 탄압', '정보기관이 급진운동을 외세 공작으로 규정한다.', '시위는 지하화되고 감시기술과 정치폭력이 확대된다.', { rights: -12, instability: 9 }),
  ]),
  event('vietnam-war', '민족해방전쟁과 초강대국 개입', 1965, 'high-rivalry', 'proxy-war', '베트남 전쟁은 탈식민화·내전·봉쇄·대규모 외국군 개입이 결합했다.', source.decolonization, [
    v('escalation', '장기 대리전 확대', '외국군·폭격·게릴라전이 국경을 넘어 확대된다.', '군사 혁신과 반전운동, 난민 위기가 동시에 커진다.', { decolonization: 5, rights: -5, instability: 12, prosperity: -6 }),
    v('neutralization', '국제 감시 중립화', '연립정부·외국군 철수·주민투표를 단계적으로 묶는다.', '통일 시점은 늦어지지만 지역전쟁 확산을 막는다.', { decolonization: 6, instability: -7, multipolarity: 4 }),
    v('regional-victory', '지역 혁명 연쇄', '민족해방 세력이 인접국까지 공동전선을 형성한다.', '제국 영향력은 급속히 쇠퇴하고 새로운 지역 블록이 등장한다.', { decolonization: 12, multipolarity: 8, instability: 8 }),
  ]),
  event('arms-limitation', '핵군비 제한과 데탕트', 1972, 'detente', 'nuclear', 'SALT와 ABM 협정은 핵경쟁 속에서도 수량·방어체계를 협상할 수 있음을 보였다.', source.iaea, [
    v('bilateral-limits', '양자 전략무기 제한', '두 최대 핵세력이 발사대와 방어망 상한을 교환한다.', '전략 안정은 높아지나 다른 핵국은 제약 밖에 남는다.', { deterrence: 5, instability: -5, multipolarity: -2 }),
    v('multilateral-freeze', '다자 핵동결', '모든 핵국이 생산 동결과 단계 감축표를 수용한다.', '검증기술과 국제사찰이 안보의 핵심 산업이 된다.', { deterrence: 1, multipolarity: 4, instability: -9 }),
    v('defense-race', '미사일방어 경쟁', '제한 협상이 깨지고 요격망·다탄두·잠수함 경쟁이 가속된다.', '핵전력 비용과 선제공격 공포가 함께 커진다.', { deterrence: 10, prosperity: -4, instability: 9 }),
  ]),
  event('environmental-order', '환경의 국제정치화', 1972, 'detente', 'environment', '스톡홀름 인간환경회의는 환경을 세계적 외교 의제로 올렸다.', source.un, [
    v('soft-law', '환경 선언과 국내 이행', '국제 원칙을 세우고 집행은 국가별 법에 맡긴다.', '규범은 확산되나 산업화 단계별 격차가 커진다.', { rights: 2, prosperity: 1, instability: -1 }),
    v('planetary-authority', '지구환경 관리기구', '대기·해양·산림에 구속력 있는 한도와 기금을 둔다.', '오염은 줄고 환경기술 이전이 새로운 개발 질서가 된다.', { prosperity: 4, rights: 4, instability: -5 }),
    v('resource-nationalism', '자원주권 우선', '신생국이 환경 규제를 북반구의 성장 사다리 걷어차기로 본다.', '산업화는 빨라지지만 국경을 넘는 오염 분쟁이 심해진다.', { decolonization: 3, prosperity: 3, instability: 5 }),
  ]),
  event('oil-shock', '석유 무기와 에너지 전환', 1973, 'detente', 'economy', '석유 금수와 가격 충격은 자원 생산국의 집단행동과 세계경제의 취약성을 드러냈다.', source.state, [
    v('embargo', '생산국 자원외교', '생산량과 가격을 외교적 압력수단으로 사용한다.', '자원국 영향력과 인플레이션이 동시에 커진다.', { multipolarity: 6, prosperity: -7, instability: 6 }),
    v('energy-compact', '생산–소비국 장기협약', '가격 밴드와 개발기금, 비축 의무를 교환한다.', '급격한 충격은 줄고 자원 수익이 개발금융으로 이동한다.', { prosperity: 6, multipolarity: 4, instability: -4 }),
    v('rapid-transition', '원자력·재생에너지 총동원', '수입 의존을 줄이기 위해 국가 연구와 기반시설을 집중한다.', '에너지 기술은 앞당겨지지만 안전·폐기물 정치가 격화된다.', { prosperity: 5, deterrence: 1, instability: 1 }),
  ]),
  event('space-cooperation', '우주 경쟁의 협력 전환', 1975, 'detente', 'space', '아폴로–소유스는 경쟁 우주체계의 도킹과 공동 임무라는 상징을 만들었다.', source.astp, [
    v('symbolic-docking', '경쟁국 공동도킹', '호환 장치와 구조 절차를 공동 개발한다.', '제한된 신뢰가 과학·통신 협력으로 번진다.', { prosperity: 3, instability: -4 }),
    v('orbital-commonwealth', '다국적 궤도공동체', '상설 우주정거장과 발사비를 세계적으로 분담한다.', '우주 인프라가 공공재가 되고 기술격차가 줄어든다.', { prosperity: 8, multipolarity: 5, instability: -5 }),
    v('weaponized-orbit', '궤도 무장화', '요격위성·궤도폭격·감시망을 경쟁 배치한다.', '지상 억지는 강해지나 우주 잔해와 오경보 위험이 급증한다.', { deterrence: 8, instability: 10 }),
  ]),
  event('helsinki-process', '국경 승인과 인권 연계', 1975, 'detente', 'society', '헬싱키 최종의정서는 유럽 국경의 불가침과 인권·교류를 한 협상에 묶었다.', source.state, [
    v('baskets', '안보·경제·인권 일괄협상', '국경 승인과 교류, 인권 감시를 상호 양보한다.', '반체제 시민단체가 정부가 서명한 문서를 정치적 무기로 사용한다.', { rights: 7, instability: -3 }),
    v('open-borders', '대륙 자유왕래', '인적 이동과 방송·출판의 상호 개방까지 합의한다.', '체제 경쟁이 군사보다 생활수준과 문화 매력으로 이동한다.', { rights: 10, prosperity: 5, instability: -5 }),
    v('security-only', '국경 현상유지만 승인', '인권 조항 없이 영토와 군사통보만 합의한다.', '단기 긴장은 줄지만 권위주의 체제의 내부 압력은 누적된다.', { rights: -4, instability: -1 }),
  ]),
  event('iranian-revolution', '석유국가 혁명과 정치종교', 1979, 'transformation', 'world-order', '이란 혁명은 왕정·냉전 동맹·석유경제에 도전하는 새로운 정치동원 모델을 보여줬다.', source.state, [
    v('religious-republic', '종교공화국 혁명', '성직자·시장·대중운동이 공화제와 종교지도체제를 결합한다.', '기존 양극 이념 밖의 혁명 수출과 지역 경쟁이 시작된다.', { multipolarity: 6, instability: 7 }),
    v('social-coalition', '세속–종교 연립공화국', '다양한 혁명세력이 헌법회의와 권력분점을 유지한다.', '지역의 의회주의 모델이 되지만 연립 균열도 상시적이다.', { rights: 5, multipolarity: 5, instability: -1 }),
    v('monarchy-reformed', '입헌군주제 타협', '군과 야권이 국왕 권한 축소·선거·자원 배분에 합의한다.', '급격한 단절은 피하지만 구체제 책임 논쟁이 오래간다.', { prosperity: 3, rights: 2, instability: -3 }),
  ]),
  event('afghan-proxy', '산악 완충국의 대리전', 1979, 'transformation', 'proxy-war', '아프가니스탄 전쟁은 외국군 개입, 무장저항 지원과 장기적 국가붕괴를 결합했다.', source.state, [
    v('proxy-quagmire', '초강대국 소모전', '점령군과 외부 지원 반군이 장기전을 벌인다.', '냉전 비용은 커지고 초국경 무장조직이 성장한다.', { prosperity: -5, rights: -7, instability: 13 }),
    v('neutral-conference', '중립국 보장회의', '철군·난민귀환·지역 자치를 주변국이 공동 보증한다.', '완충국의 주권은 회복되나 군벌 통합에 시간이 걸린다.', { multipolarity: 4, instability: -7 }),
    v('regional-federation', '산악 민족연방', '국경 양편 공동체를 광범위한 자치연방으로 묶는다.', '식민지 국경은 바뀌고 중앙아시아 질서가 새로 짜인다.', { multipolarity: 7, decolonization: 5, instability: 4 }),
  ]),
  event('debt-development', '채무위기와 개발모델 경쟁', 1982, 'transformation', 'economy', '금리 충격과 외채위기는 구조조정, 국가주도 개발과 남–남 협력의 경쟁을 낳았다.', source.bretton, [
    v('structural-adjustment', '시장개방 구조조정', '구제금융과 재정긴축·민영화·무역개방을 묶는다.', '거시 안정은 빨라질 수 있지만 불평등과 정치 반발이 커진다.', { prosperity: 2, rights: -3, instability: 5 }),
    v('debt-jubilee', '다자 채무탕감', '사회지출·투명성 조건과 원금 감면을 교환한다.', '개발 여력은 커지고 채권국의 국내정치 반발이 생긴다.', { prosperity: 7, rights: 4, instability: -4 }),
    v('south-bank', '남반구 개발은행권', '채무국이 자원·통화·기술을 묶어 별도 금융망을 만든다.', '세계금융은 다극화되고 통화권 간 제재 경쟁이 늘어난다.', { multipolarity: 9, prosperity: 4, instability: 2 }),
  ]),
  event('nuclear-accident', '원전 사고와 기술 신뢰', 1986, 'transformation', 'technology', '체르노빌 사고는 방사성 낙진, 정보공개와 국가 기술체계의 신뢰 문제를 세계화했다.', source.iaea, [
    v('secrecy', '사고 은폐와 뒤늦은 공개', '국가안보를 이유로 경보와 자료를 제한한다.', '국경을 넘는 피해가 체제 신뢰와 반핵운동을 폭발시킨다.', { rights: -7, prosperity: -3, instability: 8 }),
    v('open-safety', '국제 즉시통보·안전사찰', '사고 자료와 설계 결함을 공개하고 공동 대응한다.', '원전 안전 규범과 재난외교가 강화된다.', { rights: 5, prosperity: 2, instability: -5 }),
    v('fusion-pivot', '핵융합·재생에너지 전환', '핵분열 신규건설을 동결하고 대체기술에 총투자한다.', '에너지 혁신은 앞당겨지나 전환기의 전력난이 발생한다.', { prosperity: 5, instability: 1 }),
  ]),
  event('ozone-climate', '대기환경 협약의 진화', 1987, 'transformation', 'environment', '몬트리올 의정서형 협력은 과학평가·기금·차등의무가 세계 환경문제를 해결할 수 있음을 보였다.', source.un, [
    v('targeted-treaty', '오존 단일문제 협약', '대체물질 기금과 단계적 금지를 특정 오염물질에 적용한다.', '성공적 선례는 남지만 기후·산림 협상은 별도로 진행된다.', { prosperity: 2, instability: -3 }),
    v('climate-constitution', '조기 지구기후헌장', '탄소예산·기술이전·적응기금을 1980년대에 채택한다.', '화석연료 의존과 기후위험이 수십 년 일찍 꺾인다.', { prosperity: 6, rights: 3, instability: -7 }),
    v('eco-blocs', '녹색 관세권 경쟁', '각 경제권이 서로 다른 환경기준과 국경세를 채택한다.', '청정기술 경쟁은 빨라지나 개발국과 무역분쟁이 심해진다.', { prosperity: 3, multipolarity: 5, instability: 4 }),
  ]),
  event('information-network', '컴퓨터망과 정보질서', 1988, 'transformation', 'technology', '군·대학 연구망과 개인용 컴퓨팅의 결합은 냉전 말 정보경제의 기반을 만들었다.', source.nasa, [
    v('open-network', '개방형 세계 통신망', '공개 표준과 대학·민간 접속을 우선한다.', '지식경제와 시민연결이 성장하고 허위정보 문제도 세계화된다.', { prosperity: 9, rights: 5, instability: 2 }),
    v('sovereign-nets', '국가별 폐쇄망', '안보·검열을 위해 국제 게이트웨이를 제한한다.', '사이버 국경과 디지털 감시국가가 일찍 등장한다.', { rights: -8, multipolarity: 5, instability: 4 }),
    v('cooperative-data', '공공 데이터 연방', '국제기구가 위성·과학·무역 데이터를 공동재로 관리한다.', '개발격차는 줄지만 데이터 주권 분쟁이 핵심 외교 의제가 된다.', { prosperity: 7, rights: 4, multipolarity: 4 }),
  ]),
  event('bloc-transformation', '냉전 블록의 종말 또는 변형', 1989, 'transformation', 'world-order', '1989–1991년 혁명과 국가 해체는 냉전이 영구적 구조가 아님을 보여줬다.', source.state, [
    v('collapse', '한 블록의 급속 붕괴', '경제·민족·정치 위기가 연쇄 정권교체와 동맹 해체를 낳는다.', '단극의 순간과 국경·핵무기 승계 문제가 동시에 발생한다.', { multipolarity: -5, rights: 6, instability: 8 }),
    v('convergence', '양 블록의 단계적 수렴', '상호 군축과 공동시장을 통해 동맹을 정치공동체로 전환한다.', '승패 없는 냉전 종결과 광역 안보공동체가 등장한다.', { prosperity: 9, rights: 7, instability: -9 }),
    v('permanent-plurality', '다극 냉전의 장기화', '어느 블록도 붕괴하지 않고 기술·금융·문화 경쟁으로 이동한다.', '열전은 줄지만 세계는 여러 표준과 정보권으로 나뉜다.', { multipolarity: 12, prosperity: 3, instability: 2 }),
  ]),
  event('postwar-justice', '기억·배상·식민지 책임', 1991, 'transformation', 'society', '냉전 종결 뒤 전쟁 기억, 배상, 문서공개와 식민지 책임이 새로운 국제 쟁점이 되었다.', source.udhr, [
    v('bilateral-settlements', '국가간 배상협정', '정부가 일괄 보상과 최종 해결 조항을 교환한다.', '외교관계는 안정되나 개인 청구권 논쟁이 남는다.', { prosperity: 2, rights: 1, instability: -2 }),
    v('victim-centered', '피해자 중심 국제기금', '개인 증언·기록·배상을 국경과 정권승계와 분리한다.', '과거사 정의가 강화되고 숨겨진 기록이 정치 질서를 바꾼다.', { rights: 9, decolonization: 4, instability: -1 }),
    v('memory-wars', '상충하는 국가 기억', '각 블록이 교과서·기념관·재판을 정통성 경쟁에 사용한다.', '과거의 전선이 문화·외교 갈등으로 재생산된다.', { rights: -3, instability: 7 }),
  ]),
  ...extendedWorldHistoryEvents,
  ...expandedAlternateHistoryEvents,
  ...intelligenceWorldHistoryEvents,
];

export const worldHistoryCategoryLabels: Record<WorldHistoryCategory, string> = {
  nuclear: '핵질서',
  'world-order': '국제질서',
  economy: '경제·재건',
  decolonization: '탈식민화',
  'proxy-war': '위기·대리전',
  space: '우주',
  society: '사회·인권',
  technology: '과학기술',
  environment: '환경·에너지',
  'public-health': '보건·팬데믹',
  intelligence: '정보·비밀조직',
};

export const worldHistoryEraLabels: Record<WorldHistoryEra, string> = {
  'war-end': '전쟁 종결 · 1942–1946',
  reconstruction: '재건과 독립 · 1944–1948',
  'early-rivalry': '초기 냉전 · 1947–1955',
  'high-rivalry': '고도 냉전 · 1956–1969',
  detente: '데탕트와 자원정치 · 1970–1978',
  transformation: '체제 변형 · 1979–1991+',
  'post-cold-war': '탈냉전과 세계화 · 1992–2007',
  'connected-world': '연결세계와 다극화 · 2008–현재',
};

export const worldMetricLabels: Record<WorldMetric, string> = {
  deterrence: '전략 억지',
  multipolarity: '다극성',
  decolonization: '탈식민화',
  rights: '권리 보장',
  prosperity: '공동 번영',
  instability: '세계 불안정',
};

const atomicProjects: Record<NationId, string> = {
  britain: '튜브 앨로이스 계승계획',
  usa: '맨해튼 계획',
  ussr: '제1총국 원자계획',
  germany: '우라늄 협회 통합계획',
  japan: '니고·F고 통합계획',
  china: '천뢰 계획',
  india: '아누샥티 계획',
  freefrance: '졸리오 원자위원회 계획',
  italy: '라가치 디 비아 파니스페르나 계획',
  korea: '무궁화 원자계획',
  vietnam: '홍하 계획',
  indonesia: '가루다 원자계획',
  philippines: '마야리 계획',
};

function clamp(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function hash(input: string) {
  let value = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    value ^= input.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function seeded(seed: number, salt: string) {
  let value = hash(`${seed}:${salt}`);
  value ^= value << 13;
  value ^= value >>> 17;
  value ^= value << 5;
  return (value >>> 0) / 4294967296;
}

function formatLargeNumber(value: bigint) {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function createWorldHistorySeed(nationId: NationId, roleId: string, week = 0) {
  return hash(`${nationId}:${roleId}:${week}:world-history`) % 1_000_000_000;
}

export function normalizeWorldHistoryState(value: unknown, fallbackSeed: number): WorldHistoryState {
  const sourceValue = value && typeof value === 'object' ? value as Partial<WorldHistoryState> : {};
  const seed = Number.isFinite(sourceValue.seed) ? Math.max(1, Math.floor(Number(sourceValue.seed))) : fallbackSeed;
  const rawChoices = sourceValue.choices && typeof sourceValue.choices === 'object' ? sourceValue.choices : {};
  const choices: Record<string, string> = {};
  worldHistoryEvents.forEach((entry) => {
    const selected = rawChoices[entry.id];
    if (entry.variants.some((variant) => variant.id === selected)) choices[entry.id] = selected;
  });
  return { seed, choices };
}

function getBlocNames(nation: NationProfile, trajectory: EmergentHistoryProfile | undefined, seed: number) {
  const direction = trajectory?.dominantForce ?? 'diplomacy';
  const playerSuffix: Record<HistoryForce, string> = {
    military: nation.defaultTheater === 'asia' ? '태평양 방위협약' : '대서양 방위협약',
    industry: '재건·산업공동체',
    diplomacy: nation.defaultTheater === 'asia' ? '아시아 협력회의' : '유럽 협력회의',
    civic: '헌장국가 연합',
    liberation: '국제 해방평의회',
    intelligence: '공동정보 조정망',
  };
  const primaryBloc = `${nation.shortName}–${playerSuffix[direction]}`;
  const candidates = [
    '대서양 연방권',
    '유라시아 사회공화국권',
    '동아시아 공동번영권',
    '유럽 합중연합',
    '범아시아 해방회의',
    '남반구 비동맹 협약',
    '중동 자원주권 연맹',
  ].filter((candidate) => !primaryBloc.includes(candidate.split(' ')[0]));
  const rivalIndex = Math.floor(seeded(seed, `rival:${nation.id}:${direction}:${trajectory?.secondaryForce ?? 'industry'}`) * candidates.length);
  const rivalBloc = candidates[rivalIndex];
  const remaining = candidates.filter((candidate) => candidate !== rivalBloc);
  const thirdPole = remaining[Math.floor(seeded(seed, `third:${nation.id}`) * remaining.length)];
  return { primaryBloc, rivalBloc, thirdPole };
}

function initialMetrics(input: WorldHistoryInput): Record<WorldMetric, number> {
  const { game, trajectory } = input;
  const momentum = trajectory?.metricMomentum;
  return {
    deterrence: clamp(30 + game.victoryScore * 0.22 + (game.airPower + game.navalPower) * 0.12 + (momentum?.deterrence ?? 0)),
    multipolarity: clamp(34 + game.intelNetwork * 0.18 + (momentum?.multipolarity ?? 0)),
    decolonization: clamp(38 + (momentum?.decolonization ?? 0)),
    rights: clamp(34 + game.stability * 0.25 + (momentum?.rights ?? 0)),
    prosperity: clamp(32 + game.factories * 0.7 + game.stability * 0.18 + (momentum?.prosperity ?? 0)),
    instability: clamp(58 + game.enemyPressure * 0.22 - game.stability * 0.2 - game.warSupport * 0.08 + (momentum?.instability ?? 0)),
  };
}

interface VariantResolution {
  variant: WorldHistoryVariant;
  causalFactors: string[];
}

function chooseVariant(entry: WorldHistoryEvent, input: WorldHistoryInput, metrics: Record<WorldMetric, number>): VariantResolution {
  const manual = input.state.choices[entry.id];
  if (manual) {
    const variant = entry.variants.find((candidate) => candidate.id === manual) ?? entry.variants[0];
    return {
      variant,
      causalFactors: [`플레이 중 ‘${variant.title}’ 대응을 직접 결정해 이 분기가 확정됐습니다.`],
    };
  }
  const metricFingerprint = (Object.keys(metrics) as WorldMetric[]).map((metric) => Math.round(metrics[metric])).join(':');
  const scored = entry.variants.map((variant) => {
    const contributions = (Object.entries(variant.metricDelta) as [WorldMetric, number][]).map(([metric, delta]) => {
      const momentum = input.trajectory?.metricMomentum[metric] ?? 0;
      const pathDependence = (metrics[metric] - 50) / 3;
      return { metric, value: delta * (momentum + pathDependence) / 8 };
    });
    const causalScore = contributions.reduce((total, contribution) => total + contribution.value, 0);
    const contextualNoise = (seeded(input.state.seed, `${entry.id}:${variant.id}:${metricFingerprint}:${input.nation.id}`) - .5) * 5;
    return { variant, contributions, score: causalScore + contextualNoise };
  }).sort((left, right) => right.score - left.score);
  const selected = scored[0];
  const strongestMetrics = selected.contributions
    .filter((contribution) => Math.abs(contribution.value) >= .5)
    .sort((left, right) => Math.abs(right.value) - Math.abs(left.value))
    .slice(0, 2)
    .map((contribution) => `${worldMetricLabels[contribution.metric]}의 누적 방향이 ‘${selected.variant.title}’ 가능성을 높였습니다.`);
  const recentCauses = (input.trajectory?.influences ?? []).slice(0, Math.max(1, 2 - strongestMetrics.length)).map((influence) => `${influence.source} · ${influence.label}`);
  return {
    variant: selected.variant,
    causalFactors: [...strongestMetrics, ...recentCauses].slice(0, 2),
  };
}

function applyMetrics(metrics: Record<WorldMetric, number>, delta: Partial<Record<WorldMetric, number>>) {
  (Object.keys(metrics) as WorldMetric[]).forEach((key) => {
    // Cards describe strong local effects; the century-long index uses quarter-scale accumulation
    // so more than one hundred consecutive events remain legible instead of pinning at 0 or 100.
    metrics[key] = clamp(metrics[key] + Math.round((delta[key] ?? 0) * 0.25));
  });
}

function getWorldTitle(metrics: Record<WorldMetric, number>, primaryBloc: string, rivalBloc: string) {
  if (metrics.instability >= 76) return '깨진 억지의 시대';
  if (metrics.decolonization >= 80 && metrics.multipolarity >= 72) return '해방국가들의 다극세기';
  if (metrics.rights >= 78 && metrics.instability <= 40) return '헌장과 개방국경의 세계';
  if (metrics.prosperity >= 78) return '재건 공동체의 장기호황';
  if (metrics.multipolarity >= 72) return '다섯 개 태양의 냉전';
  if (metrics.deterrence >= 75) return '원자 억지의 긴 평화';
  return `${primaryBloc} 대 ${rivalBloc}`;
}

export function generateWorldline(input: WorldHistoryInput): GeneratedWorldline {
  const blocs = getBlocNames(input.nation, input.trajectory, input.state.seed);
  const metrics = initialMetrics(input);
  const actors = [blocs.primaryBloc, blocs.rivalBloc, blocs.thirdPole];
  const chronologicalEvents = [...worldHistoryEvents].sort((a, b) => a.historicalYear - b.historicalYear || a.id.localeCompare(b.id));
  const timeline = chronologicalEvents.map((entry, index): GeneratedWorldEvent => {
    const resolution = chooseVariant(entry, input, metrics);
    const { variant } = resolution;
    applyMetrics(metrics, variant.metricDelta);
    const jitter = Math.floor(seeded(input.state.seed, `${entry.id}:year`) * 5) - 1;
    const actorOffset = entry.category === 'decolonization' ? 2 : entry.category === 'nuclear' || entry.category === 'space' ? index % 2 : index % 3;
    return {
      event: entry,
      variant,
      year: Math.max(1942, entry.historicalYear + jitter),
      actor: actors[actorOffset],
      isPlayerChoice: Boolean(input.state.choices[entry.id]),
      causalFactors: resolution.causalFactors,
    };
  }).sort((a, b) => a.year - b.year || a.event.historicalYear - b.event.historicalYear);

  const atomicVariant = timeline.find((entry) => entry.event.id === 'atomic-program')?.variant ?? worldHistoryEvents[0].variants[0];
  const atomicControl = timeline.find((entry) => entry.event.id === 'atomic-control')?.variant;
  const axisStyle = metrics.multipolarity >= 70 ? '다극 장기경쟁' : metrics.deterrence >= 68 ? '원자 억지 냉전' : '재건질서 경쟁';
  const title = getWorldTitle(metrics, blocs.primaryBloc, blocs.rivalBloc);
  const codeHash = hash(`${input.state.seed}:${timeline.map((entry) => entry.variant.id).join('|')}:${input.nation.id}:${input.trajectory?.signature ?? 'initial'}`);
  const formula = `3^${worldHistoryEvents.length}`;
  const possibilityCount = formatLargeNumber(3n ** BigInt(worldHistoryEvents.length));
  const highestMetric = (Object.entries(metrics) as [WorldMetric, number][]).sort((a, b) => b[1] - a[1])[0][0];
  const faultLines = [
    `${blocs.primaryBloc}와 ${blocs.rivalBloc}의 ${axisStyle}`,
    metrics.decolonization >= 68 ? `${blocs.thirdPole}가 독립국 표결권과 자원주권을 결집` : '제국 승계국과 해방운동 사이의 미완 청산',
    highestMetric === 'instability' ? '핵지휘·국경·대리전이 서로 증폭하는 연쇄위기' : `${worldMetricLabels[highestMetric]}이 국제기구의 최우선 의제로 부상`,
  ];
  const ending = resolveHistoricalEnding({
    nationId: input.nation.id,
    metrics,
    timeline,
    trajectory: input.trajectory,
    game: input.game,
    seed: input.state.seed,
  });
  const intelligenceHistory = resolveIntelligenceHistory(timeline);

  return {
    code: `EARTH-${String(codeHash % 100000).padStart(5, '0')}`,
    title,
    summary: `${input.nation.shortName}에서 실제로 집행한 정책·작전·외교·연구가 누적된 세계입니다. 현재 경쟁의 두 주축은 ${blocs.primaryBloc}와 ${blocs.rivalBloc}이며, 다음 선택에 따라 다시 달라질 수 있습니다.`,
    primaryBloc: blocs.primaryBloc,
    rivalBloc: blocs.rivalBloc,
    thirdPole: blocs.thirdPole,
    rivalryName: axisStyle,
    atomicProject: atomicProjects[input.nation.id],
    atomicSponsor: atomicVariant.id === 'distributed' ? `${blocs.primaryBloc}·${blocs.thirdPole} 공동망` : blocs.primaryBloc,
    nuclearArchitecture: atomicControl?.title ?? atomicVariant.title,
    metrics,
    timeline,
    intelligenceHistory,
    possibilityCount,
    possibilityFormula: formula,
    divergenceCount: timeline.filter((entry) => entry.variant.id !== entry.event.variants[0].id).length,
    faultLines,
    ending,
    endingCount: historicalEndings.length,
    endingAlternatives: getEndingAlternatives(ending),
  };
}

export function previewWorldHistoryChoice(input: WorldHistoryInput, eventId: string, variantId: string): WorldHistoryChoicePreview {
  const baseline = generateWorldline(input);
  const target = worldHistoryEvents.find((entry) => entry.id === eventId);
  if (!target || !target.variants.some((variant) => variant.id === variantId)) return { changedEvents: 0, metricChanges: {} };
  const alternate = generateWorldline({
    ...input,
    state: { ...input.state, choices: { ...input.state.choices, [eventId]: variantId } },
  });
  const baselineVariants = new Map(baseline.timeline.map((entry) => [entry.event.id, entry.variant.id]));
  const changedEvents = alternate.timeline.filter((entry) => (
    entry.event.historicalYear > target.historicalYear
    && baselineVariants.get(entry.event.id) !== entry.variant.id
  )).length;
  const metricChanges: Partial<Record<WorldMetric, number>> = {};
  (Object.keys(baseline.metrics) as WorldMetric[]).forEach((metric) => {
    const delta = alternate.metrics[metric] - baseline.metrics[metric];
    if (delta !== 0) metricChanges[metric] = delta;
  });
  return { changedEvents, metricChanges };
}
