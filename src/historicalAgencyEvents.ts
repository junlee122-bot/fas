import type { WorldHistoryCategory, WorldHistoryEra, WorldHistoryEvent, WorldMetric } from './worldHistory';

type Outcome = readonly [id: string, title: string, summary: string, consequence: string, delta: Partial<Record<WorldMetric, number>>];

interface AgencyEventSeed {
  id: string;
  title: string;
  year: number;
  era: WorldHistoryEra;
  category: WorldHistoryCategory;
  basis: string;
  sourceLabel: string;
  sourceUrl: string;
  historicalFigureQids: string[];
  outcomes: readonly [Outcome, Outcome, Outcome];
}

const seeds: readonly AgencyEventSeed[] = [
  {
    id: 'first-human-orbit-1961', title: '최초 유인 궤도비행과 우주인의 정치', year: 1961, era: 'high-rivalry', category: 'space', historicalFigureQids: ['Q7327'],
    basis: '1961년 유리 가가린의 보스토크 1호 비행은 유인우주기술, 군사적 비밀주의와 대중 외교를 하나의 국가사업으로 결합했다.', sourceLabel: 'NASA · Yuri Gagarin, first human in space', sourceUrl: 'https://www.nasa.gov/image-article/yuri-gagarin-first-human-space/',
    outcomes: [
      ['hero-state', '국가영웅 우주계획', '최초 비행을 체제 우위의 증거로 집중 선전하고 군이 후속 계획을 통제한다.', '국민 동원은 커지지만 사고·실패 정보가 은폐되어 다음 세대의 안전성이 낮아진다.', { deterrence: 5, prosperity: 2, rights: -3, instability: 2 }],
      ['open-cosmos', '국제 우주인단', '경쟁국·비동맹국 조종사를 공동 선발하고 비행자료를 단계적으로 공개한다.', '우주기술이 외교·기상·통신 공동재로 확장되어 다극 협력이 빨라진다.', { multipolarity: 6, prosperity: 6, rights: 4, instability: -4 }],
      ['fatal-race', '무인증 총력 우주경쟁', '정치적 최초 기록을 위해 시험단계와 탈출체계를 생략한다.', '대형 참사가 정권 정당성과 미사일 지휘체계까지 흔든다.', { deterrence: 3, prosperity: -4, rights: -5, instability: 10 }],
    ],
  },
  {
    id: 'lunar-program-human-factor', title: '달 착륙과 인간 중심 임무설계', year: 1969, era: 'high-rivalry', category: 'space', historicalFigureQids: ['Q1615'],
    basis: '아폴로 11호는 시험비행, 궤도 랑데부, 지상관제와 승무원의 현장 판단을 결합해 최초의 유인 달 착륙을 달성했다.', sourceLabel: 'NASA · Apollo 11 mission', sourceUrl: 'https://www.nasa.gov/mission/apollo-11/',
    outcomes: [
      ['prestige-landing', '국가 위신형 달 착륙', '한 차례의 결정적 착륙에 예산·방송·시험조직을 집중하고 성공 뒤 사업을 축소한다.', '체제 상징은 극대화되지만 우주산업과 과학기지의 연속성은 약해진다.', { prosperity: 4, deterrence: 4, instability: 1 }],
      ['lunar-science-compact', '국제 달 과학협약', '착륙자료·표본·추적망을 공개하고 후속 기지의 승무원과 비용을 다국적으로 구성한다.', '달 탐사가 군비경쟁보다 장기 과학·통신·재난관측 인프라로 발전한다.', { prosperity: 8, multipolarity: 7, rights: 3, instability: -5 }],
      ['military-high-ground', '군사 달고지 경쟁', '착륙선·대형로켓·심우주통신을 정찰·요격·핵지휘 자산으로 전환한다.', '우주 예산은 유지되지만 궤도와 달 표면이 새로운 선제공격 위기선이 된다.', { deterrence: 10, prosperity: -2, rights: -4, instability: 10 }],
    ],
  },
  {
    id: 'civil-rights-march-1963', title: '워싱턴 행진과 시민권 연합정치', year: 1963, era: 'high-rivalry', category: 'society', historicalFigureQids: ['Q8027'],
    basis: '1963년 워싱턴 일자리와 자유 행진은 민권·종교·노동 단체의 연합과 마틴 루터 킹 주니어의 연설을 전국적 입법 압력으로 바꾸었다.', sourceLabel: '미국 국립문서기록관리청 · 워싱턴 행진 공식 프로그램', sourceUrl: 'https://www.archives.gov/milestone-documents/official-program-for-the-march-on-washington',
    outcomes: [
      ['federal-rights', '연방 시민권 입법', '대규모 비폭력 동원을 차별금지와 투표권 법안의 정치적 동력으로 전환한다.', '법적 평등이 진전되지만 집행권·지역저항을 둘러싼 다음 갈등이 시작된다.', { rights: 10, prosperity: 3, instability: -2 }],
      ['social-compact', '일자리·자유 사회협약', '민권 입법을 고용·주거·교육 투자와 묶어 노동·종교·지역정부의 장기협약으로 만든다.', '형식적 권리와 경제적 격차를 함께 다루는 광범위한 개혁연합이 형성된다.', { rights: 9, prosperity: 7, multipolarity: 2, instability: -5 }],
      ['repression-cycle', '진압과 급진화의 악순환', '정보기관 감시와 지방 경찰의 강경 진압이 온건 연합을 붕괴시킨다.', '도시봉기·백인 반동·무장조직이 서로를 강화하며 국내 냉전이 열린다.', { rights: -10, prosperity: -3, instability: 12 }],
    ],
  },
  {
    id: 'artemisinin-research-network', title: '아르테미시닌과 전시 의약연구망', year: 1972, era: 'detente', category: 'public-health', historicalFigureQids: ['Q462843'],
    basis: '투유유 연구팀은 전통 의학 문헌의 단서를 저온 추출과 임상검증으로 연결했고 1972년 아르테미시닌 계열 물질을 분리했다.', sourceLabel: 'Nobel Prize · Tu Youyou biographical', sourceUrl: 'https://www.nobelprize.org/prizes/medicine/2015/tu/biographical/',
    outcomes: [
      ['national-program', '국가 항말라리아 계획', '군·보건 당국이 연구망을 통제하고 국내 환자와 동맹국에 치료제를 우선 보급한다.', '사망률은 줄지만 연구자료와 생산기술은 안보자산으로 봉인된다.', { prosperity: 5, rights: -1, instability: -2 }],
      ['open-medicine', '개방형 열대의학 컨소시엄', '원료재배·임상자료·내성감시를 발병국과 국제기구가 공동 관리한다.', '저비용 의약과 남반구 연구기관의 협상력이 함께 성장한다.', { prosperity: 9, multipolarity: 6, decolonization: 4, instability: -5 }],
      ['patent-race', '약효 독점과 내성위기', '제약·군 기관이 유효성분과 합성경로를 분할 특허로 묶는다.', '초기 수익은 커지지만 접근성 격차와 부적절한 단독치료가 내성을 촉진한다.', { prosperity: 2, rights: -5, instability: 6 }],
    ],
  },
  {
    id: 'cosmology-public-science-1974', title: '블랙홀 이론과 대중 기초과학', year: 1974, era: 'detente', category: 'technology', historicalFigureQids: ['Q17714'],
    basis: '1970년대 블랙홀 열복사 논의는 중력·양자이론·열역학을 연결했고 장기 기초연구와 과학 대중소통의 가치를 확장했다.', sourceLabel: 'University of Cambridge · Professor Stephen Hawking', sourceUrl: 'https://www.cam.ac.uk/stephen-hawking',
    outcomes: [
      ['elite-labs', '소수 국가의 기초과학 집중', '최상위 대학과 국립연구소에 계산·천문 자원을 집중한다.', '선도 성과는 빨라지지만 연구중심지와 주변국의 격차가 커진다.', { prosperity: 4, deterrence: 2, multipolarity: -2 }],
      ['public-cosmos', '세계 공개우주론망', '관측자료·논문·교육방송과 장애 접근성 기술을 공공재로 묶는다.', '기초과학의 사회적 지지와 국제 공동연구가 장기간 유지된다.', { prosperity: 7, rights: 5, multipolarity: 4, instability: -3 }],
      ['military-computation', '중력연구의 군사 봉인', '고성능 계산과 우주관측을 미사일·정찰 계획에 종속시킨다.', '응용기술은 빨라지나 공개검증 단절로 오류와 군비경쟁이 증폭된다.', { deterrence: 8, rights: -6, instability: 7 }],
    ],
  },
  {
    id: 'personal-computing-platforms-1977', title: '개인용 컴퓨터와 소프트웨어 플랫폼', year: 1977, era: 'detente', category: 'technology', historicalFigureQids: ['Q5284', 'Q19837'],
    basis: '1970년대 후반 개인용 컴퓨터 기업과 독립 소프트웨어 사업은 계산능력을 대형기관 밖으로 옮기고 하드웨어·운영체제·응용프로그램의 권력관계를 다시 만들었다.', sourceLabel: 'Smithsonian · Computer history collections', sourceUrl: 'https://americanhistory.si.edu/collections/subjects/computers',
    outcomes: [
      ['licensed-platforms', '상용 플랫폼 표준전쟁', '운영체제 라이선스와 호환기기 생태계가 국가별 시장을 빠르게 통합한다.', '보급은 빨라지지만 소수 플랫폼 기업의 협상력과 독점 문제가 커진다.', { prosperity: 9, rights: 1, instability: 2 }],
      ['civic-computing', '공개형 시민 컴퓨팅', '대학·동호회·공공기관이 회로·코드·교육과 네트워크 접근을 개방한다.', '지역별 제작·소프트웨어 생태계와 디지털 문해가 폭넓게 성장한다.', { prosperity: 7, rights: 7, multipolarity: 6, instability: -2 }],
      ['security-terminals', '국가 승인 단말기 체제', '개인용 기기를 등록제·암호통제·국영망 전용 단말기로 제한한다.', '행정 효율은 높아지지만 감시와 지하 복제시장이 정보질서를 분열시킨다.', { deterrence: 4, rights: -10, instability: 6 }],
    ],
  },
  {
    id: 'market-state-realignment-1979', title: '시장국가 전환과 노동의 반격', year: 1979, era: 'transformation', category: 'economy', historicalFigureQids: ['Q7416'],
    basis: '1970년대 말 영국을 포함한 여러 국가는 인플레이션·산업침체에 대응해 통화긴축, 민영화와 노동관계 재편을 시험했다.', sourceLabel: 'UK Government · Margaret Thatcher', sourceUrl: 'https://www.gov.uk/government/history/past-prime-ministers/margaret-thatcher',
    outcomes: [
      ['privatization', '민영화와 금융개방', '국영기업 매각·노동규제 완화·금융자유화를 빠르게 추진한다.', '생산성과 자본유입은 늘지만 지역·계층 격차와 산업공동화가 커진다.', { prosperity: 6, rights: -2, instability: 5 }],
      ['worker-capital', '노동자 지분 사회협약', '국영기업 개혁을 노동자 지분·재교육·지역개발은행과 묶는다.', '전환 속도는 느리지만 생산성 이익과 정치적 정당성을 넓게 분배한다.', { prosperity: 7, rights: 6, instability: -5 }],
      ['command-austerity', '비상 긴축국가', '파업과 물가를 안보위기로 규정해 임금·통화·언론을 행정명령으로 통제한다.', '단기 물가는 잡히지만 권리침해와 지하경제가 체제 불안을 키운다.', { deterrence: 2, prosperity: -2, rights: -9, instability: 10 }],
    ],
  },
  {
    id: 'perestroika-political-opening', title: '페레스트로이카와 연방의 공개정치', year: 1985, era: 'transformation', category: 'society', historicalFigureQids: ['Q30487', 'Q34453'],
    basis: '소련의 페레스트로이카와 글라스노스트는 경제개혁·정보공개·민족공화국의 주권 요구를 한꺼번에 활성화했다.', sourceLabel: 'Nobel Prize · Mikhail Gorbachev facts', sourceUrl: 'https://www.nobelprize.org/prizes/peace/1990/gorbachev/facts/',
    outcomes: [
      ['managed-reform', '당 주도 점진개혁', '국영기업 자율과 제한선거를 허용하되 군·연방재정·핵지휘는 중앙이 유지한다.', '체제는 연착륙할 수 있지만 개혁파와 보수파 모두 불만을 품는다.', { prosperity: 4, rights: 5, instability: 2 }],
      ['federal-compact', '신연방 공개협약', '공화국 주권·자원배분·다당선거를 새 연방헌장과 국제보증으로 묶는다.', '블록 붕괴 대신 느슨한 다국가 연합과 공동 핵통제가 등장한다.', { multipolarity: 9, rights: 8, deterrence: 3, instability: -5 }],
      ['sovereignty-rush', '주권 선언과 권력 이중화', '공화국 지도자들이 중앙 개혁기구를 우회해 군·재산·통화를 선점한다.', '국경·핵무기·가격체계가 동시에 풀리며 급속한 해체위기가 온다.', { multipolarity: 7, prosperity: -8, rights: 1, instability: 13 }],
    ],
  },
  {
    id: 'german-reunification-statecraft', title: '독일 통일과 유럽 안보의 재설계', year: 1990, era: 'transformation', category: 'world-order', historicalFigureQids: ['Q2518', 'Q567'],
    basis: '동독의 평화혁명 뒤 헬무트 콜 정부는 통화·경제통합, 전승국 협상과 유럽통합을 결합해 1990년 독일 통일을 추진했다.', sourceLabel: '독일 연방정부 · The Chancellor who reunited Germany', sourceUrl: 'https://www.bundesregierung.de/breg-en/service/archive/archive/the-chancellor-who-reunited-germany-413888',
    outcomes: [
      ['rapid-unity', '통화 선행 급속통일', '통화·법률·동맹체계를 짧은 일정에 통합하고 동부 재건재정을 대규모 투입한다.', '정치적 통일은 확정되지만 산업충격과 지역격차가 장기 부담이 된다.', { prosperity: 5, rights: 7, instability: -4 }],
      ['confederal-europe', '유럽보증 단계연방', '동서독의 과도연방과 유럽 공동안보체제를 먼저 만들고 통화통합을 늦춘다.', '사회적 충격은 줄지만 통일의 가역성과 강대국 영향력이 오래 남는다.', { multipolarity: 8, prosperity: 4, rights: 6, instability: -5 }],
      ['contested-corridor', '중부유럽 중립회랑', '주변국과 강대국이 통일 조건에 합의하지 못해 독일을 군사중립·분할통화 회랑으로 남긴다.', '열전은 피하지만 국경·부채·병력 감축 갈등이 새 냉전선을 만든다.', { multipolarity: 5, deterrence: -3, prosperity: -3, instability: 8 }],
    ],
  },
  {
    id: 'india-reform-capability-state', title: '인도 외환위기와 역량 중심 개혁', year: 1991, era: 'post-cold-war', category: 'economy', historicalFigureQids: ['Q41914', 'Q132489'],
    basis: '1991년 인도의 외환위기는 산업·무역·환율 규제 개혁을 촉발했고, 성장의 성과를 빈곤·교육·보건의 실질 역량으로 평가할 것인지가 장기 쟁점이 되었다.', sourceLabel: 'IMF · India economic reform review', sourceUrl: 'https://www.imf.org/external/pubs/ft/fandd/2001/06/ahluwalia.htm',
    outcomes: [
      ['liberalization', '면허경제 해체와 세계시장 편입', '산업허가·수입장벽을 빠르게 낮추고 외자와 서비스산업을 성장축으로 삼는다.', '성장과 외환은 회복되지만 지역·계층별 전환능력의 차이가 커진다.', { prosperity: 10, multipolarity: 3, instability: 3 }],
      ['capability-compact', '교육·보건 연계 개혁', '시장개방의 세수와 국제금융을 기초보건·교육·식량보장·지방분권과 묶는다.', '성장은 완만하지만 위기 회복력과 실질적 자유가 폭넓게 상승한다.', { prosperity: 8, rights: 8, decolonization: 4, instability: -5 }],
      ['sovereign-controls', '경제주권 비상통제', '외채 모라토리엄과 국유화·수입배급으로 외부 조건을 거부한다.', '전략산업은 보호되지만 물자부족과 암시장, 외교고립이 커진다.', { multipolarity: 5, prosperity: -8, rights: -4, instability: 10 }],
    ],
  },
  {
    id: 'world-wide-web-commons-1991', title: '월드 와이드 웹과 정보공공재', year: 1991, era: 'post-cold-war', category: 'technology', historicalFigureQids: ['Q80'],
    basis: '팀 버너스리가 CERN에서 제안·구현한 웹은 분산된 연구정보를 링크로 연결했고, CERN의 공개 배포는 세계적 확산의 제도적 기반이 되었다.', sourceLabel: 'CERN · Where the web was born', sourceUrl: 'https://home.cern/science/computing/the-birth-of-the-web/where-web-was-born/',
    outcomes: [
      ['open-web', '공개 표준의 세계 웹', '프로토콜과 핵심 소프트웨어를 누구나 구현할 수 있는 공개 표준으로 유지한다.', '지식·상업·시민조직이 폭발적으로 연결되지만 허위정보와 플랫폼 권력도 뒤따른다.', { prosperity: 10, rights: 7, multipolarity: 4, instability: 2 }],
      ['public-service-web', '공공 신원·지식망', '국제기구와 대학이 상호운용 신원·보존·공익검색을 공동 인프라로 운영한다.', '디지털 공공재와 기록 신뢰성이 강해지고 국가별 접근격차가 줄어든다.', { prosperity: 8, rights: 8, multipolarity: 7, instability: -4 }],
      ['licensed-webs', '블록별 허가 웹', '각 동맹이 주소·브라우저·암호화 규격을 허가제로 나누고 국경 게이트웨이를 둔다.', '보안통제는 강화되나 호환성 붕괴와 검열·사이버 밀수가 새 갈등을 만든다.', { deterrence: 4, multipolarity: 8, rights: -10, instability: 8 }],
    ],
  },
  {
    id: 'indonesia-reformasi-1998', title: '인도네시아 레포르마시와 군도 연방성', year: 1998, era: 'post-cold-war', category: 'society', historicalFigureQids: ['Q76156', 'Q76167'],
    basis: '1997–1998년 금융·정치위기와 수하르토 퇴진 뒤 인도네시아는 선거, 문민통제, 지방분권과 다원주의를 동시에 재설계했다.', sourceLabel: '인도네시아 국가도서관 · 대통령 기록', sourceUrl: 'https://kepustakaan-presiden.perpusnas.go.id/en/',
    outcomes: [
      ['elite-transition', '엘리트 주도 단계개혁', '기존 관료·군·재계와 협상해 선거와 언론개방을 순차적으로 실시한다.', '국가 붕괴는 피하지만 부패청산과 군 개혁이 제한된다.', { rights: 5, prosperity: 3, instability: -2 }],
      ['pluralist-devolution', '다원주의 지방분권 협약', '지방재정·종교자유·군의회 철수와 독립선거기관을 하나의 개헌 패키지로 묶는다.', '군도 각 지역의 대표성과 평화적 권력교체가 강화된다.', { rights: 9, multipolarity: 5, decolonization: 5, instability: -6 }],
      ['fragmented-command', '군·지역 권력의 분절', '중앙 권위가 무너진 틈에 부대·재벌·지역정부가 세입과 치안을 각자 장악한다.', '분리주의·종교폭력·자원밀수가 연쇄적으로 확대된다.', { prosperity: -7, rights: -7, instability: 13 }],
    ],
  },
  {
    id: 'un-climate-development-2007', title: '기후·개발·보건의 다자 패키지', year: 2007, era: 'post-cold-war', category: 'world-order', historicalFigureQids: ['Q1253'],
    basis: '반기문 유엔 사무총장 재임기에는 기후변화, 빈곤·개발목표, 여성·아동 보건과 평화유지가 상호연결된 국제 의제로 결집되었다.', sourceLabel: 'United Nations · Ban Ki-moon', sourceUrl: 'https://www.un.org/sg/en/formersg/ban.shtml',
    outcomes: [
      ['summit-diplomacy', '정상회의 공약체제', '국가별 자발적 목표와 개발원조 공약을 정기 정상회의에서 검토한다.', '참여국은 늘지만 집행력과 재원 격차가 남는다.', { prosperity: 4, rights: 3, instability: -2 }],
      ['global-resilience-fund', '세계 회복력 재정연합', '탄소가격·보건감시·식량·물 적응기금을 단일 재정협약으로 묶는다.', '취약국의 교섭력과 위기예방 투자가 커지고 남북 신뢰가 높아진다.', { prosperity: 8, rights: 6, multipolarity: 6, instability: -7 }],
      ['resource-security-blocs', '자원안보 블록화', '식량·에너지·백신과 물을 동맹 공급망의 전략자산으로 봉쇄한다.', '블록 내부 대비는 강화되지만 제재·사재기·기후이주 갈등이 커진다.', { deterrence: 5, prosperity: -3, rights: -5, instability: 10 }],
    ],
  },
  {
    id: 'journalism-platform-accountability', title: '디지털 언론과 플랫폼 권력의 책임', year: 2018, era: 'connected-world', category: 'intelligence', historicalFigureQids: ['Q6761526'],
    basis: '소셜미디어 시대의 탐사보도는 국가 선전, 조직적 괴롭힘, 추천 알고리즘과 언론인의 안전을 하나의 민주적 정보안보 문제로 만들었다.', sourceLabel: 'Nobel Prize · Maria Ressa facts', sourceUrl: 'https://www.nobelprize.org/prizes/peace/2021/ressa/facts/',
    outcomes: [
      ['independent-press', '독립언론 자율검증', '언론사·연구자·시민단체가 공개자료와 취재원 보호를 바탕으로 조작망을 추적한다.', '감시권력 견제는 강해지지만 규모와 자금이 부족한 언론은 취약하다.', { rights: 8, prosperity: 2, instability: -2 }],
      ['auditable-platforms', '감사가능 플랫폼 협약', '추천·정치광고·봇 네트워크를 독립감사하고 국경간 증거보존 절차를 만든다.', '표현의 자유를 유지하면서 조직적 조작의 비용을 높이는 공공규칙이 형성된다.', { rights: 7, multipolarity: 5, instability: -6 }],
      ['information-emergency', '정보비상계엄', '정부가 허위정보 대응을 이유로 언론 허가·플랫폼 차단·실명 추적을 통합한다.', '단기 선전 통제는 가능하지만 반대파 탄압과 암호화 지하망이 급증한다.', { deterrence: 3, rights: -12, instability: 9 }],
    ],
  },
  {
    id: 'vietnam-reconciliation-civic-peace', title: '베트남 전후 화해와 시민평화', year: 1975, era: 'detente', category: 'decolonization', historicalFigureQids: ['Q310913', 'Q446909'],
    basis: '베트남전의 협상·통일·난민 경험은 승전정부, 남부 정치세력, 종교 평화운동과 해외 공동체가 전후 질서를 어떻게 나눌지 시험했다.', sourceLabel: 'United Nations Peacemaker · Paris Peace Accords', sourceUrl: 'https://peacemaker.un.org/viet-nam-parisagreement73',
    outcomes: [
      ['victor-integration', '승전정부 중심 통합', '군·행정·토지와 교육을 중앙 기준으로 빠르게 통합하고 재교육을 실시한다.', '국가 통제는 빠르게 회복되지만 난민과 망명정치가 장기화된다.', { deterrence: 3, prosperity: 1, rights: -5, instability: 3 }],
      ['reconciliation-convention', '전국 화해회의', '협상대표·종교·지역·해외공동체가 사면·재산·실종자·지방자치를 공동 협상한다.', '통일의 속도는 느려지지만 복수의 기억과 인재가 새 국가에 남는다.', { decolonization: 7, rights: 8, prosperity: 5, instability: -7 }],
      ['indochina-proxy-renewal', '인도차이나 대리전 재점화', '승전세력과 패전세력의 후원국이 국경군·난민조직·비밀부대를 재무장시킨다.', '통일전쟁이 캄보디아·라오스·해상 난민로로 번지는 지역전이 된다.', { deterrence: -2, prosperity: -7, rights: -8, instability: 14 }],
    ],
  },
];

export const historicalAgencyEvents: WorldHistoryEvent[] = seeds.map((seed) => ({
  id: seed.id,
  title: seed.title,
  historicalYear: seed.year,
  era: seed.era,
  category: seed.category,
  historicalBasis: seed.basis,
  sourceLabel: seed.sourceLabel,
  sourceUrl: seed.sourceUrl,
  historicalFigureQids: seed.historicalFigureQids,
  variants: seed.outcomes.map(([id, title, summary, consequence, metricDelta]) => ({
    id: `${seed.id}-${id}`,
    title,
    summary,
    consequence,
    metricDelta,
  })) as WorldHistoryEvent['variants'],
}));
