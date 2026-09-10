import type {
  WorldHistoryCategory,
  WorldHistoryEra,
  WorldHistoryEvent,
  WorldHistoryVariant,
  WorldMetric,
} from './worldHistory';
import { withJosa } from './koreanGrammar';

type Pattern = 'integration' | 'conflict' | 'revolution' | 'economy' | 'technology' | 'rights' | 'health' | 'environment' | 'security';
type Citation = readonly [string, string];
type Spec = readonly [
  id: string,
  title: string,
  year: number,
  era: WorldHistoryEra,
  category: WorldHistoryCategory,
  basis: string,
  citation: Citation,
  pattern: Pattern,
  outcomes: readonly [string, string, string],
];

const sources = {
  state: ['미국 국무부 역사국 · 냉전 주요 전환', 'https://history.state.gov/milestones/all'] as Citation,
  un: ['유엔 · 국제협력과 전후 질서', 'https://www.un.org/en/about-us/history-of-the-un'] as Citation,
  decolonization: ['유엔 · 탈식민화', 'https://www.un.org/en/global-issues/decolonization/'] as Citation,
  peacekeeping: ['유엔 평화유지활동 · 연혁', 'https://peacekeeping.un.org/en/our-history'] as Citation,
  rights: ['유엔 · 세계인권선언', 'https://www.un.org/en/about-us/universal-declaration-of-human-rights/'] as Citation,
  eu: ['유럽연합 · 유럽통합 연표', 'https://european-union.europa.eu/principles-countries-history/history-eu_en'] as Citation,
  nato: ['NATO · 1945년 이후 역사', 'https://www.nato.int/en/about-us/nato-history/a-short-history-of-nato'] as Citation,
  who: ['WHO · 세계 공중보건 주요 사건', 'https://www.who.int/campaigns/75-years-of-improving-public-health/milestones'] as Citation,
  covid: ['WHO · COVID-19 대응 연표', 'https://www.who.int/news/item/29-06-2020-covidtimeline'] as Citation,
  wto: ['WTO · 다자무역체제의 역사', 'https://www.wto.org/english/thewto_e/history_e/history_e.htm'] as Citation,
  climate: ['UNFCCC · 교토의정서와 기후협약', 'https://unfccc.int/process-and-meetings/the-kyoto-protocol'] as Citation,
  paris: ['UNFCCC · 파리협정', 'https://unfccc.int/news/bringing-the-paris-agreement-into-force'] as Citation,
  iaea: ['IAEA · 핵 비확산과 사찰', 'https://www.iaea.org/newscenter/news/atoms-should-be-peace'] as Citation,
  nasa: ['NASA · 우주시대의 역사', 'https://www.nasa.gov/history/65-years-ago-sputnik-ushers-in-the-space-age/'] as Citation,
  worldbank: ['세계은행 · 전후 개발질서', 'https://www.worldbank.org/en/about/history'] as Citation,
  unhcr: ['UNHCR · 난민보호 체제의 역사', 'https://www.unhcr.org/about-unhcr/who-we-are/history-unhcr'] as Citation,
  ai: ['OECD · 인공지능 원칙', 'https://oecd.ai/en/ai-principles'] as Citation,
  tankerWar: ['미 해군 역사유산사령부 · Tanker War와 Operation Earnest Will', 'https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-grams/h-gram-018/h-018-1.html'] as Citation,
};

const deltas: Record<Pattern, readonly [Partial<Record<WorldMetric, number>>, Partial<Record<WorldMetric, number>>, Partial<Record<WorldMetric, number>>]> = {
  integration: [{ prosperity: 6, rights: 2, instability: -3 }, { prosperity: 5, rights: 5, multipolarity: 5, instability: -5 }, { multipolarity: 8, prosperity: -3, instability: 7 }],
  conflict: [{ deterrence: 4, prosperity: -4, rights: -3, instability: 7 }, { multipolarity: 3, rights: 3, instability: -6 }, { deterrence: 7, prosperity: -8, rights: -7, instability: 13 }],
  revolution: [{ multipolarity: 4, rights: 2, instability: 5 }, { rights: 7, prosperity: 3, instability: -3 }, { multipolarity: 7, rights: -4, instability: 10 }],
  economy: [{ prosperity: 7, multipolarity: -2, instability: -2 }, { prosperity: 6, multipolarity: 5, rights: 3, instability: -3 }, { multipolarity: 7, prosperity: -3, instability: 7 }],
  technology: [{ prosperity: 8, deterrence: 2, instability: 2 }, { prosperity: 6, rights: 4, multipolarity: 4, instability: -2 }, { prosperity: 4, deterrence: 6, rights: -5, instability: 8 }],
  rights: [{ rights: 7, prosperity: 2, instability: 1 }, { rights: 10, multipolarity: 3, instability: -4 }, { rights: -9, deterrence: 3, instability: 9 }],
  health: [{ rights: 4, prosperity: 5, instability: -5 }, { rights: 7, prosperity: 6, multipolarity: 4, instability: -7 }, { rights: -5, prosperity: -7, instability: 11 }],
  environment: [{ prosperity: 3, rights: 2, instability: -2 }, { prosperity: 6, rights: 5, multipolarity: 4, instability: -6 }, { prosperity: -4, multipolarity: 5, instability: 8 }],
  security: [{ deterrence: 7, multipolarity: -3, instability: 2 }, { deterrence: 3, multipolarity: 5, rights: 3, instability: -5 }, { deterrence: 9, rights: -5, instability: 9 }],
};

const copy: Record<Pattern, readonly [string, string, string]> = {
  integration: ['기능별 협력과 제한된 주권 공유가 진행된다.', '공동기관·의회·분쟁조정 절차가 회원국을 묶는다.', '통합이 무너지고 경쟁 지역권이 별도 규칙을 만든다.'],
  conflict: ['제한전·휴전·불완전한 합의가 현상유지를 만든다.', '지역 당사자와 국제기구가 단계적 정치해법을 집행한다.', '개입국과 전장이 늘며 분쟁이 국제질서를 재편한다.'],
  revolution: ['대중동원과 권력교체가 국가기구를 새 체제로 바꾼다.', '헌법회의와 권력분점이 혁명과 구체제 사이를 중재한다.', '혁명과 반혁명이 국경을 넘어 연쇄 확산된다.'],
  economy: ['주요 경제권이 개방·구제·조정 규칙을 채택한다.', '개발국과 중심국이 공동기금·완충장치·대표권을 교환한다.', '금융·무역 질서가 무너져 자급권과 제재권으로 분열한다.'],
  technology: ['국가·기업 경쟁이 기술 보급과 전략적 우위를 가속한다.', '공개표준과 공동연구가 기술을 세계 공공재로 만든다.', '군사화·독점·감시가 혁신의 방향을 장악한다.'],
  rights: ['법률과 선거를 통한 점진적 권리 확대가 정착한다.', '국제감시와 시민 참여가 국내 개혁을 구속한다.', '안보국가와 강제진압이 개혁을 막고 저항을 지하화한다.'],
  health: ['국가 보건체계가 국제기구의 감시·조정을 받는다.', '특허·생산·정보를 공동관리해 보편 접근을 보장한다.', '국경봉쇄와 독점경쟁이 질병·불평등·불신을 증폭한다.'],
  environment: ['목표와 국내 이행을 결합한 점진적 협약이 작동한다.', '기술이전·기금·검증을 갖춘 구속력 있는 체제가 출범한다.', '자원민족주의와 산업경쟁이 환경협력을 무너뜨린다.'],
  security: ['상설동맹과 억지가 위기를 관리하지만 대립선을 고정한다.', '지역기구와 국제감시가 다자적 완충질서를 만든다.', '군비경쟁과 선제행동이 연쇄 안보딜레마를 일으킨다.'],
};

function variant(id: string, title: string, summary: string, consequence: string, metricDelta: Partial<Record<WorldMetric, number>>): WorldHistoryVariant {
  return { id, title, summary, consequence, metricDelta };
}

function makeEvent(spec: Spec): WorldHistoryEvent {
  const [id, title, historicalYear, era, category, historicalBasis, citation, pattern, outcomes] = spec;
  return {
    id,
    title,
    historicalYear,
    era,
    category,
    historicalBasis,
    sourceLabel: citation[0],
    sourceUrl: citation[1],
    variants: [
      variant('historical', outcomes[0], copy[pattern][0], `${outcomes[0]}의 제도와 미해결 문제가 다음 세대로 이어진다.`, deltas[pattern][0]),
      variant('institutional', outcomes[1], copy[pattern][1], `${withJosa(outcomes[1], '이/가')} 협력 규칙과 행위자 구성을 바꾼다.`, deltas[pattern][1]),
      variant('transformative', outcomes[2], copy[pattern][2], `${withJosa(outcomes[2], '이/가')} 새로운 블록과 장기 위기선을 만든다.`, deltas[pattern][2]),
    ],
  };
}

const specs: Spec[] = [
  ['who-order', '세계보건기구와 질병 감시망', 1948, 'reconstruction', 'public-health', 'WHO 헌장은 국제 질병감시와 대규모 보건 캠페인의 기반이 되었다.', sources.who, 'health', ['WHO 중심 보건협력', '보편보건 공동체', '국가별 방역권 분열']],
  ['european-coal-steel', '석탄·철강 공동관리', 1951, 'early-rivalry', 'economy', '유럽석탄철강공동체는 전쟁 핵심산업 공동관리로 유럽통합의 첫 단계를 만들었다.', sources.eu, 'integration', ['유럽석탄철강공동체', '유럽 산업연방', '경쟁 중공업 블록']],
  ['iran-oil-coup', '석유 국유화와 정권개입', 1953, 'early-rivalry', 'proxy-war', '이란 석유국유화 위기와 정권개입은 자원주권·정보공작·냉전동맹을 결합했다.', sources.state, 'revolution', ['친서방 왕정 복귀', '입헌 자원공화국', '중동 국유화 연쇄']],
  ['indochina-geneva', '디엔비엔푸와 인도차이나 협정', 1954, 'early-rivalry', 'decolonization', '프랑스의 패배와 제네바협정은 인도차이나 독립·분단·선거 문제를 남겼다.', sources.decolonization, 'conflict', ['분단과 미완 선거', '인도차이나 중립연방', '범지역 해방전쟁']],
  ['warsaw-pact', '대항 군사동맹의 창설', 1955, 'high-rivalry', 'world-order', '바르샤바조약기구 성립으로 유럽 양대 군사지휘체계가 완성됐다.', sources.nato, 'security', ['양대 동맹 고착', '전유럽 상호안보조약', '복수 사회주의 방위권']],
  ['hungarian-uprising', '헝가리 봉기와 동맹 이탈', 1956, 'high-rivalry', 'society', '헝가리 봉기는 개혁사회주의·중립화 요구와 동맹군 개입의 한계를 드러냈다.', sources.nato, 'revolution', ['군사개입과 체제 복구', '중립 개혁사회주의', '동유럽 혁명 연쇄']],
  ['european-economic-community', '로마조약과 공동시장', 1957, 'high-rivalry', 'economy', '로마조약은 공동시장과 유럽원자력공동체를 출범시켰다.', sources.eu, 'integration', ['유럽경제공동체', '유럽연방 조기출범', '대서양·대륙 관세권 분열']],
  ['taiwan-strait', '대만해협 포격위기', 1958, 'high-rivalry', 'proxy-war', '금문·마조 포격은 중국내전의 미완성과 핵우산·해협방위의 위험을 보여줬다.', sources.state, 'conflict', ['억지와 해협 현상유지', '양안 중립화 협정', '동아시아 해전 확대']],
  ['cuban-revolution', '쿠바 혁명과 카리브 질서', 1959, 'high-rivalry', 'society', '쿠바 혁명은 토지·자원개혁과 미주 냉전, 혁명수출을 결합했다.', sources.state, 'revolution', ['혁명정부의 블록 편입', '비동맹 사회공화국', '카리브 혁명연방']],
  ['sino-soviet-split', '중·소 분열과 사회주의 다극화', 1960, 'high-rivalry', 'world-order', '중소분열은 공산권을 경쟁 중심을 가진 다극세계로 바꾸었다.', sources.state, 'security', ['중·소 장기분열', '사회주의권 공동지도부', '세 개 혁명중심 경쟁']],
  ['algerian-independence', '알제리 전쟁과 정착민 식민주의', 1962, 'high-rivalry', 'decolonization', '알제리전쟁은 게릴라전·정착민·본국 정치붕괴가 결합한 탈식민화의 분수령이었다.', sources.decolonization, 'conflict', ['에비앙 협정 독립', '다민족 연방공화국', '북아프리카 해방전쟁']],
  ['partial-test-ban', '대기권 핵실험 금지', 1963, 'high-rivalry', 'nuclear', '부분적 핵실험금지조약은 낙진여론과 핵위기 뒤 최초의 주요 군비통제 성과였다.', sources.iaea, 'security', ['부분 핵실험 금지', '포괄적 조기 핵실험 금지', '실험·요격 경쟁 재개']],
  ['six-day-war', '6일 전쟁과 점령지 질서', 1967, 'high-rivalry', 'proxy-war', '1967년 전쟁은 점령지·난민·안보리 결의와 평화협상의 지형을 결정했다.', sources.un, 'conflict', ['점령과 불완전 휴전', '국제보증 국경협정', '광역 중동전쟁']],
  ['asean-foundation', 'ASEAN과 동남아 지역주의', 1967, 'high-rivalry', 'world-order', 'ASEAN은 동남아 국가들이 분쟁억제와 경제협력을 제도화한 사건이었다.', sources.un, 'integration', ['주권존중형 ASEAN', '동남아 공동체 연방', '경쟁 해양동맹 분열']],
  ['prague-spring', '프라하의 봄과 제한주권', 1968, 'high-rivalry', 'society', '체코슬로바키아 개혁과 침공은 동맹자율성과 개혁사회주의의 한계를 드러냈다.', sources.nato, 'rights', ['침공과 정상화', '민주사회주의 중립국', '동유럽 개혁연쇄']],
  ['green-revolution', '녹색혁명과 식량질서', 1968, 'high-rivalry', 'technology', '고수확 품종·관개·비료는 식량생산을 바꾸면서 토지·수자원 격차도 만들었다.', sources.worldbank, 'technology', ['국가주도 녹색혁명', '공공 종자·수자원 공동체', '농업기업 독점체제']],
  ['moon-landing', '유인 달 착륙과 우주 주권', 1969, 'high-rivalry', 'space', '아폴로 11호 달 착륙은 우주경쟁과 국가위신의 정점이었다.', sources.nasa, 'technology', ['국가 달 착륙 경쟁', '국제 달 과학기지', '군사 달기지 경쟁']],
  ['bangladesh-war', '방글라데시 독립전쟁', 1971, 'detente', 'decolonization', '동파키스탄 위기와 전쟁은 언어민족주의·난민·강대국 외교를 결합했다.', sources.un, 'conflict', ['방글라데시 독립', '벵골 자치연방', '남아시아 전면전']],
  ['china-us-rapprochement', '미·중 접근과 삼각외교', 1972, 'detente', 'world-order', '미중 관계개선은 양극 냉전을 삼각외교로 전환했다.', sources.state, 'integration', ['삼각외교 정상화', '동아시아 집단안보회의', '중·미 공동패권권']],
  ['yom-kippur-war', '10월 전쟁과 중동 외교', 1973, 'detente', 'proxy-war', '1973년 전쟁은 군사기습·석유정치와 단계적 평화협상을 연결했다.', sources.un, 'conflict', ['전쟁 뒤 단계적 협상', '포괄적 중동평화회의', '초강대국 직접대치']],
  ['portuguese-revolution', '카네이션 혁명과 제국 해체', 1974, 'detente', 'decolonization', '포르투갈 민주혁명은 아프리카 식민지 독립을 급격히 앞당겼다.', sources.decolonization, 'revolution', ['민주화와 급속 독립', '루소폰 연방 이양', '식민지 내전 연쇄']],
  ['cambodian-genocide', '캄보디아 혁명과 집단학살', 1975, 'detente', 'society', '크메르루주 집단학살과 뒤이은 전쟁은 혁명폭력·주권·인도적 개입 문제를 남겼다.', sources.un, 'rights', ['정권 붕괴 뒤 국제재판', '조기 국제보호구역', '지역 혁명전쟁 확대']],
  ['angolan-civil-war', '앙골라 독립과 국제화된 내전', 1975, 'detente', 'proxy-war', '앙골라 내전은 독립운동 경쟁과 외국군·강대국 지원이 겹친 대리전이었다.', sources.peacekeeping, 'conflict', ['장기 대리전과 협상', '아프리카 중재 연립정부', '남부아프리카 광역전쟁']],
  ['china-reform', '중국 개혁개방', 1978, 'transformation', 'economy', '개혁개방은 계획경제와 시장·외자를 결합해 세계 생산질서를 바꾸었다.', sources.wto, 'economy', ['국가주도 시장개방', '협동조합형 개방경제', '대륙 경제권 자급화']],
  ['smallpox-eradication', '천연두 박멸', 1980, 'transformation', 'public-health', 'WHO의 천연두 박멸 선언은 세계 예방접종·감시협력의 가능성을 입증했다.', sources.who, 'health', ['세계 천연두 박멸', '보편 백신공동체 확대', '백신주권 경쟁']],
  ['iran-iraq-war', '이란–이라크 전쟁', 1980, 'transformation', 'proxy-war', '8년 전쟁은 혁명안보·국경·석유·화학무기와 외부지원을 결합했다.', sources.un, 'conflict', ['소모전 뒤 휴전', '걸프 집단안보협정', '걸프 전면 재편전쟁']],
  ['solidarity-poland', '폴란드 연대노조와 계엄', 1980, 'transformation', 'society', '연대노조는 시민사회와 당국가의 협상을 체제전환 동력으로 만들었다.', sources.nato, 'rights', ['계엄 뒤 원탁협상', '노동자 자주공화국', '동유럽 총파업 연쇄']],
  ['personal-computing', '개인용 컴퓨터와 반도체 경제', 1981, 'transformation', 'technology', '개인용 컴퓨터 대중화는 생산·정보·교육·군사기술의 기반을 분산시켰다.', sources.wto, 'technology', ['기업 주도 PC 혁명', '공공 컴퓨팅망', '전략 반도체 블록']],
  ['falklands-war', '포클랜드·말비나스 전쟁', 1982, 'transformation', 'proxy-war', '남대서양 전쟁은 탈식민 영유권·해양전력·국내정치를 결합했다.', sources.un, 'conflict', ['도서 영유권 현상유지', '공동주권 해양구역', '남대서양 동맹전쟁']],
  ['hiv-aids', 'HIV/AIDS와 세계 보건권', 1983, 'transformation', 'public-health', 'HIV/AIDS는 낙인·의약품 접근·시민운동과 국제 보건재정을 변화시켰다.', sources.who, 'health', ['국가별 치료 확대', '무상 의약품 특허풀', '낙인과 치료민족주의']],
  ['glasnost-perestroika', '페레스트로이카와 글라스노스트', 1985, 'transformation', 'society', '소련 개혁은 경제재편·정보공개·민족문제를 동시에 열었다.', sources.nato, 'revolution', ['개혁 뒤 연방해체', '민주 사회주의 연방개조', '보수 쿠데타와 재봉쇄']],
  ['hormuz-tanker-war', '유조선 전쟁과 호르무즈 해협', 1987, 'transformation', 'proxy-war', '이란–이라크전 중 상선 공격·기뢰전·유조선 호송은 호르무즈 해협의 에너지 수송과 해군 개입을 하나의 국제위기로 묶었다.', sources.tankerWar, 'conflict', ['다국적 호송과 제한 해전', '걸프 해운중립 감시기구', '해협 봉쇄와 에너지 전쟁']],
  ['inf-treaty', '중거리핵전력 폐기', 1987, 'transformation', 'nuclear', 'INF 조약은 한 종류의 핵미사일을 검증과 함께 전면 폐기했다.', sources.nato, 'security', ['양자 미사일 폐기', '세계 중거리미사일 금지', '극초음속 대체경쟁']],
  ['tiananmen', '중국 개혁과 1989년 정치위기', 1989, 'transformation', 'society', '1989년 시위와 진압은 경제개혁·정치개혁·국가안정의 경로를 갈랐다.', sources.rights, 'rights', ['진압 뒤 경제개혁 지속', '협상형 정치개혁', '전국적 체제붕괴']],
  ['gulf-war', '쿠웨이트 침공과 걸프전쟁', 1990, 'transformation', 'proxy-war', '쿠웨이트 침공과 유엔 승인 다국적군은 냉전 이후 집단안보의 시험대였다.', sources.un, 'conflict', ['다국적군 승리와 제재', '아랍연맹 중재철군', '중동 광역전쟁']],
  ['yugoslav-dissolution', '유고슬라비아 해체전쟁', 1991, 'transformation', 'proxy-war', '연방해체와 민족전쟁은 승인·인종청소·평화유지·전범재판의 한계를 드러냈다.', sources.peacekeeping, 'conflict', ['분리독립과 국제개입', '비대칭 발칸연방', '장기 지역전쟁']],
  ['maastricht', '마스트리히트와 유럽연합', 1992, 'post-cold-war', 'world-order', '마스트리히트조약은 공동시장을 정치·통화연합으로 확대했다.', sources.eu, 'integration', ['유럽연합과 단일통화', '유럽연방 헌법', '다중속도 유럽권']],
  ['oslo-process', '오슬로 협정과 상호인정', 1993, 'post-cold-war', 'world-order', '오슬로 과정은 상호인정과 단계적 자치 틀을 만들었다.', sources.un, 'integration', ['단계적 자치와 교착', '국제보증 양국가 협정', '단일국가 권리투쟁']],
  ['south-africa-transition', '남아프리카 아파르트헤이트 종식', 1994, 'post-cold-war', 'society', '보통선거·협상전환·진실화해위원회는 인종지배 종식의 모델이 되었다.', sources.rights, 'rights', ['협상 민주화와 진실화해', '사회경제 재건헌장', '내전과 분리국가화']],
  ['rwanda-genocide', '르완다 집단학살과 보호책임', 1994, 'post-cold-war', 'society', '르완다 집단학살은 조기경보·평화유지군 권한·형사책임의 실패를 드러냈다.', sources.peacekeeping, 'rights', ['사후 재건과 국제재판', '조기 강제보호작전', '오대호 광역 집단전쟁']],
  ['wto-order', 'WTO와 세계 무역규칙', 1995, 'post-cold-war', 'economy', 'WTO는 상품·서비스·지식재산과 분쟁해결을 하나의 다자체계로 묶었다.', sources.wto, 'economy', ['WTO 다자무역체제', '개발권 중심 공정무역기구', '경쟁 관세·제재 블록']],
  ['bosnia-dayton', '데이턴 협정과 다층 평화구축', 1995, 'post-cold-war', 'world-order', '데이턴 협정은 전쟁을 끝냈지만 복잡한 권력분점 체제를 남겼다.', sources.nato, 'integration', ['국제감독 권력분점', '시민 중심 연방헌법', '민족별 영구분할']],
  ['commercial-internet', '상업 인터넷과 세계 연결망', 1995, 'post-cold-war', 'technology', '인터넷 상용화와 웹 확산은 통신·금융·문화·정치조직을 연결했다.', sources.wto, 'technology', ['개방형 상업 인터넷', '국제 공공통신망', '주권별 폐쇄 인터넷']],
  ['asian-financial-crisis', '아시아 금융위기', 1997, 'post-cold-war', 'economy', '통화·외채 위기는 IMF 처방, 자본통제와 동아시아 금융협력 논쟁을 촉발했다.', sources.worldbank, 'economy', ['IMF 구제금융과 구조조정', '아시아 통화기금', '연쇄 채무불이행']],
  ['kyoto-protocol', '교토의정서와 탄소감축', 1997, 'post-cold-war', 'environment', '교토의정서는 산업국에 구속력 있는 온실가스 감축목표를 부여했다.', sources.climate, 'environment', ['차등의무 감축체제', '보편 탄소예산', '기후무역전쟁']],
  ['south-asian-nuclear-tests', '남아시아 핵실험', 1998, 'post-cold-war', 'nuclear', '인도와 파키스탄 핵실험은 지역억지·제재·비확산체제의 한계를 드러냈다.', sources.iaea, 'security', ['상호 핵억지', '남아시아 비핵협정', '연쇄 핵확산']],
  ['kosovo-intervention', '코소보와 인도적 개입', 1999, 'post-cold-war', 'proxy-war', '코소보전쟁은 인도적 개입·안보리 승인·주권과 분리독립의 충돌을 남겼다.', sources.nato, 'conflict', ['공습 뒤 국제통치', '유엔 중재 자치연방', '발칸 전쟁 재확대']],
  ['china-wto', '중국의 WTO 가입과 세계공장', 2001, 'post-cold-war', 'economy', '중국의 WTO 가입은 생산망·산업이전과 세계 경제력 균형을 바꾸었다.', sources.wto, 'economy', ['세계 생산망 편입', '노동·환경 연계 가입', '중국 중심 별도 무역권']],
  ['september-11', '9·11 테러와 집단방위', 2001, 'post-cold-war', 'world-order', '9·11은 비국가행위자의 공격과 NATO 최초 집단방위조항 발동을 낳았다.', sources.nato, 'security', ['테러와의 전쟁', '국제경찰·사법 공조', '영구 비상안보체제']],
  ['afghanistan-intervention', '아프가니스탄 개입과 국가재건', 2001, 'post-cold-war', 'proxy-war', '외국군 개입과 ISAF는 대테러·국가재건·반군전·철수를 결합했다.', sources.nato, 'conflict', ['장기개입 뒤 철수', '지역보증 연립정부', '중앙아시아 영구전쟁']],
  ['iraq-war', '이라크 전쟁과 예방전쟁 독트린', 2003, 'post-cold-war', 'proxy-war', '이라크 침공은 무기정보·안보리 정당성·점령과 국가붕괴 문제를 남겼다.', sources.un, 'conflict', ['침공·점령과 불안정', '강화사찰·봉쇄 타협', '중동 정권교체 연쇄전쟁']],
  ['sars-ihr', 'SARS와 국제보건규칙 강화', 2003, 'post-cold-war', 'public-health', 'SARS는 신속 정보공개와 국경을 넘는 감시의 필요성을 드러냈다.', sources.who, 'health', ['개정 국제보건규칙', '세계 방역지휘부', '국가별 검역장벽']],
  ['eu-enlargement', '유럽연합 동방확대', 2004, 'post-cold-war', 'world-order', '2004년 확대는 중·동유럽을 단일시장과 유럽제도에 대규모 편입했다.', sources.eu, 'integration', ['조건부 동방확대', '범유럽 연방가입', '동·서 유럽권 재분열']],
  ['global-financial-crisis', '세계 금융위기', 2008, 'connected-world', 'economy', '주택·파생상품·은행위기가 세계 신용경색과 구제금융·긴축 논쟁으로 번졌다.', sources.worldbank, 'economy', ['은행구제와 규제개혁', '국제 공공금융 전환', '세계 금융체제 붕괴']],
  ['arab-spring', '아랍의 봄', 2011, 'connected-world', 'society', '아랍권 봉기는 민주화·내전·반혁명이라는 다른 결과를 낳았다.', sources.un, 'revolution', ['국가별 혼합 전환', '지역 민주헌장', '혁명·반혁명 광역전쟁']],
  ['syrian-war', '시리아 내전과 다국적 개입', 2011, 'connected-world', 'proxy-war', '시리아전쟁은 봉기·내전·극단주의·난민·외국군 개입을 결합했다.', sources.unhcr, 'conflict', ['분할전선과 불완전 휴전', '국제감독 연방평화', '중동 강대국 직접전쟁']],
  ['social-media-politics', '소셜미디어와 네트워크 정치', 2011, 'connected-world', 'technology', '스마트폰·플랫폼은 시위·선거·선전·허위정보의 속도와 범위를 바꾸었다.', sources.ai, 'technology', ['플랫폼 중심 정보공간', '공공 알고리즘 규약', '감시·선전 인터넷']],
  ['crimea-2014', '크림반도 병합과 유럽 안보위기', 2014, 'connected-world', 'proxy-war', '크림반도 병합과 동부우크라이나 전쟁은 국경불가침·제재·회색지대전을 재점화했다.', sources.nato, 'conflict', ['제재와 동결분쟁', '국제감시 자치협정', '유럽 재무장 연쇄']],
  ['paris-agreement', '파리기후협정', 2015, 'connected-world', 'environment', '파리협정은 모든 당사국의 국가결정기여와 온도목표를 채택했다.', sources.paris, 'environment', ['국가별 기후공약', '구속력 있는 세계 탄소예산', '탄소권역 무역전쟁']],
  ['migration-crisis', '난민·이주 거버넌스 위기', 2015, 'connected-world', 'society', '대규모 이동은 망명권·국경통제·분담정치의 균열을 드러냈다.', sources.unhcr, 'rights', ['국가별 수용과 국경강화', '세계 난민분담협정', '요새화된 지역권']],
  ['brexit', '브렉시트와 통합의 역류', 2016, 'connected-world', 'world-order', '영국의 EU 탈퇴는 초국가통합의 가역성과 국내 정체성갈등을 보여줬다.', sources.eu, 'integration', ['협상 탈퇴와 새 관계', '유럽 다중회원제', '연쇄 탈퇴와 통합붕괴']],
  ['ai-governance', '인공지능 원칙과 자동화 경쟁', 2019, 'connected-world', 'technology', 'OECD AI 원칙 등은 자동화에 인권·투명성·책임 규칙을 적용하려 했다.', sources.ai, 'technology', ['기업·국가 AI 경쟁', '검증 가능한 공공 AI 협약', '자율무기·감시 AI 블록']],
  ['covid-pandemic', 'COVID-19 세계대유행', 2020, 'connected-world', 'public-health', 'COVID-19은 보건위기·봉쇄·백신·공급망·불평등을 동시에 촉발했다.', sources.covid, 'health', ['국가 방역과 백신경쟁', '세계 백신·데이터 공유체제', '장기 국경봉쇄와 보건블록']],
  ['supply-chain-shock', '세계 공급망과 경제안보', 2020, 'connected-world', 'economy', '팬데믹과 지정학충격은 효율 중심 공급망을 회복력·핵심기술 중심으로 바꾸었다.', sources.wto, 'economy', ['공급망 다변화', '세계 전략비축 공동체', '완전한 경제블록 분리']],
  ['afghanistan-withdrawal', '아프가니스탄 철수와 정권복귀', 2021, 'connected-world', 'world-order', '외국군 철수와 탈레반 복귀는 장기 국가재건 개입의 한계를 남겼다.', sources.nato, 'conflict', ['철수와 정권복귀', '지역보증 포괄정부', '철수붕괴와 주변국 개입']],
  ['ukraine-full-war', '러시아의 우크라이나 전면 침공', 2022, 'connected-world', 'proxy-war', '2022년 침공은 유럽 대규모 지상전·제재·군사지원·핵위험을 촉발했다.', sources.nato, 'conflict', ['장기전과 동맹지원', '국제보증 단계적 평화', '유럽 강대국 직접전쟁']],
  ['generative-ai', '생성형 AI의 대중화', 2022, 'connected-world', 'technology', '생성형 AI 대중화는 노동·교육·정보신뢰·창작과 안보정책을 변화시켰다.', sources.ai, 'technology', ['상업 AI 급속확산', '국제 모델감사·공공연산', '폐쇄형 AI 군비경쟁']],
];

export const extendedWorldHistoryEvents: WorldHistoryEvent[] = specs.map(makeEvent);
