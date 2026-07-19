import type { WorldHistoryCategory, WorldHistoryEra, WorldHistoryEvent, WorldHistoryVariant, WorldMetric } from './worldHistory';

type Pattern = 'cooperation' | 'conflict' | 'knowledge' | 'rights' | 'health' | 'economy' | 'environment';
type Citation = readonly [label: string, url: string];

interface AlternateHistorySeed {
  id: string;
  title: string;
  year: number;
  era: WorldHistoryEra;
  category: WorldHistoryCategory;
  basis: string;
  source: Citation;
  pattern: Pattern;
  outcomes: readonly [continuity: string, compact: string, rupture: string];
  historicalActorIds?: string[];
}

const source = {
  gchq: ['GCHQ · 블레츨리 파크와 암호전', 'https://www.gchq.gov.uk/information/bletchley-park'] as Citation,
  nara: ['미국 국립문서기록관리청 · 제2차 세계대전 기록', 'https://www.archives.gov/research/military/ww2'] as Citation,
  doe: ['미국 에너지부 · 맨해튼 계획사', 'https://www.osti.gov/opennet/manhattan-project-history/index.htm'] as Citation,
  who: ['WHO · 75년 세계보건 주요 사건', 'https://www.who.int/campaigns/75-years-of-improving-public-health/milestones'] as Citation,
  un: ['유엔 · 유엔과 국제질서의 역사', 'https://www.un.org/en/about-us/history-of-the-un'] as Citation,
  decolonization: ['유엔 · 탈식민화', 'https://www.un.org/en/global-issues/decolonization/'] as Citation,
  rights: ['유엔 · 세계인권선언', 'https://www.un.org/en/about-us/universal-declaration-of-human-rights/'] as Citation,
  unesco: ['UNESCO · 교육·과학·문화 협력의 역사', 'https://www.unesco.org/en/history'] as Citation,
  nih: ['미국 NIH · 뉘른베르크 강령', 'https://history.nih.gov/display/history/Nuremberg+Code'] as Citation,
  india: ['인도 통계부 · 공식통계의 역사', 'https://www.mospi.gov.in/history'] as Citation,
  korea: ['국사편찬위원회 · 한국사데이터베이스', 'https://db.history.go.kr/'] as Citation,
  philippines: ['필리핀 정부 · 공식관보 역사자료', 'https://www.officialgazette.gov.ph/featured/philippine-independence/'] as Citation,
  nasa: ['NASA · 우주시대 역사', 'https://www.nasa.gov/history/65-years-ago-sputnik-ushers-in-the-space-age/'] as Citation,
  iaea: ['IAEA · 평화를 위한 원자력과 비확산', 'https://www.iaea.org/newscenter/news/atoms-should-be-peace'] as Citation,
  unhcr: ['UNHCR · 난민보호의 역사', 'https://www.unhcr.org/about-unhcr/who-we-are/history-unhcr'] as Citation,
  unfccc: ['UNFCCC · 기후협약의 역사', 'https://unfccc.int/process/the-convention/history-of-the-convention'] as Citation,
  women: ['UN Women · CEDAW', 'https://www.un.org/womenwatch/daw/cedaw/'] as Citation,
  imf: ['IMF · 국제금융과 위기대응의 역사', 'https://www.imf.org/external/about/histcoop.htm'] as Citation,
  genome: ['미국 NHGRI · 인간게놈프로젝트', 'https://www.genome.gov/human-genome-project'] as Citation,
  icc: ['국제형사재판소 · 로마규정', 'https://www.icc-cpi.int/about/the-court'] as Citation,
  undp: ['유엔개발계획 · 지속가능발전목표', 'https://www.undp.org/sustainable-development-goals'] as Citation,
  crispr: ['노벨상 재단 · CRISPR 유전자 가위', 'https://www.nobelprize.org/prizes/chemistry/2020/press-release/'] as Citation,
  ebola: ['WHO · 서아프리카 에볼라 유행', 'https://www.who.int/emergencies/situations/ebola-outbreak-2014-2016-West-Africa'] as Citation,
  covid: ['WHO · COVID-19 백신과 국제 대응', 'https://www.who.int/initiatives/act-accelerator/covax'] as Citation,
  wto: ['WTO · 세계 무역과 지정학적 분절', 'https://www.wto.org/english/res_e/booksp_e/wtr23_e/wtr23_e.pdf'] as Citation,
  asean: ['ASEAN · 방콕선언과 우호협력조약', 'https://asean.org/wp-content/uploads/2025/09/SG-Dr.-Kao-Pre-Recorded-Remarks-at-the-2nd-TAC-Conference-18-Sept-2025-As-Delivered.pdf'] as Citation,
  ilo: ['ILO · 사회적 대화와 삼자주의', 'https://www.ilo.org/topics-and-sectors/social-dialogue-and-tripartism'] as Citation,
  imfWealth: ['IMF · 자원부국의 국부관리', 'https://www.imf.org/en/publications/policy-papers/issues/2016/12/31/sovereign-asset-liability-management-guidance-for-resource-rich-economies-pp4876'] as Citation,
  regionalBanks: ['세계은행 · 지역개발은행의 역사', 'https://openknowledge.worldbank.org/server/api/core/bitstreams/4a43a2f8-83dc-5c2d-a638-deb0e435e237/content'] as Citation,
  icann: ['ICANN · 다중이해관계자 인터넷 거버넌스', 'https://atlarge.icann.org/topics/internet-governance/background'] as Citation,
  irena: ['IRENA · 전력망 유연성과 재생에너지 전환', 'https://www.irena.org/Publications/2026/Jan/Flexibility-for-a-secure-and-affordable-power-sector-transformation'] as Citation,
  unclos: ['유엔 · 해양법과 인류 공동유산', 'https://www.un.org/depts/los/convention_agreements/texts/unclos/part11-2.htm'] as Citation,
  undrr: ['UNDRR · 센다이 재난위험경감 체계', 'https://www.undrr.org/implementing-sendai-framework/what-sendai-framework'] as Citation,
  ageing: ['WHO · 건강한 고령화 10년', 'https://www.who.int/initiatives/decade-of-healthy-ageing'] as Citation,
};

const deltas: Record<Pattern, readonly [Partial<Record<WorldMetric, number>>, Partial<Record<WorldMetric, number>>, Partial<Record<WorldMetric, number>>]> = {
  cooperation: [{ prosperity: 4, instability: -2 }, { multipolarity: 5, rights: 5, prosperity: 5, instability: -5 }, { multipolarity: 7, deterrence: 4, instability: 8 }],
  conflict: [{ deterrence: 4, rights: -3, prosperity: -3, instability: 6 }, { multipolarity: 4, rights: 4, instability: -5 }, { deterrence: 7, rights: -7, prosperity: -7, instability: 12 }],
  knowledge: [{ prosperity: 7, deterrence: 2 }, { prosperity: 7, rights: 4, multipolarity: 5, instability: -3 }, { deterrence: 6, rights: -5, multipolarity: 5, instability: 7 }],
  rights: [{ rights: 6, instability: -1 }, { rights: 10, decolonization: 4, instability: -4 }, { rights: -8, deterrence: 4, instability: 9 }],
  health: [{ rights: 4, prosperity: 5, instability: -4 }, { rights: 8, prosperity: 6, multipolarity: 4, instability: -7 }, { rights: -6, prosperity: -7, instability: 11 }],
  economy: [{ prosperity: 7, instability: -2 }, { prosperity: 6, multipolarity: 5, rights: 3, instability: -4 }, { prosperity: -5, multipolarity: 7, instability: 8 }],
  environment: [{ prosperity: 3, rights: 3, instability: -2 }, { prosperity: 6, rights: 5, multipolarity: 4, instability: -6 }, { prosperity: -5, multipolarity: 5, instability: 9 }],
};

const summaries: Record<Pattern, readonly [string, string, string]> = {
  cooperation: ['국가별 제도를 유지한 채 제한적 정보·자원 공유가 진행된다.', '공동기금·대표기관·검증절차가 행위자들을 하나의 규칙으로 묶는다.', '협력이 붕괴하고 경쟁 진영이 별도의 조직과 규칙을 구축한다.'],
  conflict: ['군사·정치 대치가 불완전한 휴전과 현상유지로 귀결된다.', '당사자 대표회의와 국제감시가 단계적 해결책을 집행한다.', '개입세력과 전장이 늘어나며 위기가 장기 국제분쟁으로 번진다.'],
  knowledge: ['국가와 기업이 연구성과를 전략자산으로 관리하며 보급을 선별한다.', '공개표준·공동연구소·인재교류가 지식을 국제 공공재로 만든다.', '기술봉쇄·두뇌유출·군사화가 연구체계를 경쟁 블록으로 분열시킨다.'],
  rights: ['국내법과 점진적 개혁으로 권리범위와 책임제도가 확대된다.', '개인청원·국제재판·시민대표가 정부의 선택을 구속한다.', '안보국가와 강제동원이 개혁을 막고 저항을 지하화한다.'],
  health: ['국가 보건체계가 감시·치료·예방접종을 단계적으로 확대한다.', '병원체 정보·생산시설·특허와 현장조사를 국제적으로 공동관리한다.', '검열·독점·국경봉쇄가 질병과 불평등을 함께 증폭시킨다.'],
  economy: ['국가별 산업·재정정책이 재건과 성장을 주도한다.', '공동청산·개발기금·노동·복지 규칙이 성장성과를 넓게 분배한다.', '제재·채무·자원경쟁으로 세계경제가 자급형 권역으로 분열한다.'],
  environment: ['국내 규제와 기술개량을 통해 피해를 점진적으로 줄인다.', '과학감시·전환기금·구속력 있는 목표를 세계 공동규칙으로 채택한다.', '자원민족주의와 산업경쟁이 생태위기를 안보갈등으로 바꾼다.'],
};

const seeds: AlternateHistorySeed[] = [
  { id: 'penicillin-mass-production', title: '페니실린 대량생산과 항생제 질서', year: 1942, era: 'war-end', category: 'public-health', basis: '옥스퍼드 연구팀과 미영 제약·발효시설의 협력은 페니실린을 실험실 물질에서 대량 전시의약품으로 전환했다.', source: source.who, pattern: 'health', outcomes: ['연합군 우선 항생제', '국제 공공제약소', '특허·균주 쟁탈전'], historicalActorIds: ['uk-alexander-fleming', 'uk-howard-florey', 'uk-ernst-chain'] },
  { id: 'colossus-electronic-turn', title: '콜로서스와 전자계산의 비밀 탄생', year: 1943, era: 'war-end', category: 'technology', basis: '블레츨리 파크와 우체국 연구소의 협력은 대규모 진공관 전자계산을 암호분석에 실전 배치했다.', source: source.gchq, pattern: 'knowledge', outcomes: ['기밀 해제 지연', '연합 공개계산 연구소', '전자정보 독점국가'], historicalActorIds: ['uk-alan-turing', 'uk-tommy-flowers', 'uk-joan-clarke'] },
  { id: 'soviet-frontline-penicillin', title: '소련산 페니실린과 전선 방역', year: 1943, era: 'war-end', category: 'public-health', basis: '소련 미생물 연구진은 전시 감염·콜레라 대응과 자국 항생제 생산을 결합했다.', source: source.who, pattern: 'health', outcomes: ['전선우선 생산', '동맹 균주·임상공유', '비밀 생물의약 경쟁'], historicalActorIds: ['su-zinaida-yermolyeva', 'su-nikolai-semashko'] },
  { id: 'bengal-famine-governance', title: '벵골 기근과 전시 식량권', year: 1943, era: 'war-end', category: 'public-health', basis: '전쟁·가격·수송·행정 실패가 겹친 벵골 기근은 식량배급과 식민통치의 책임을 세계적 쟁점으로 만들었다.', source: source.un, pattern: 'health', outcomes: ['제국 배급조사', '인도 식량권 위원회', '기근과 독립봉기'], historicalActorIds: ['in-pc-mahalanobis', 'in-cr-rao', 'in-kamaladevi-chattopadhyay'] },
  { id: 'vavilov-genetics-reckoning', title: '바빌로프의 종자은행과 유전학 탄압', year: 1943, era: 'war-end', category: 'technology', basis: '니콜라이 바빌로프의 수감·죽음과 레닌그라드 종자수집 보존은 과학자율·식량안보·국가이념의 충돌을 상징했다.', source: source.unesco, pattern: 'knowledge', outcomes: ['제한적 사후복권', '국제 종자공공재', '이념농학의 세계확산'], historicalActorIds: ['su-nikolai-vavilov', 'su-alexander-oparin'] },
  { id: 'wartime-university-diaspora', title: '피난대학과 전시 두뇌유출', year: 1943, era: 'war-end', category: 'technology', basis: '점령·공습·인종박해는 대학과 연구자를 내륙·중립국·연합국으로 이동시키며 새로운 과학중심을 만들었다.', source: source.unesco, pattern: 'knowledge', outcomes: ['국가별 피난대학', '망명학자 공동대학', '승전국 두뇌독점'], historicalActorIds: ['de-lise-meitner', 'de-hans-bethe', 'it-franco-modigliani', 'cn-ye-qisun'] },
  { id: 'italian-radar-window', title: '이탈리아 해군의 레이더 선택', year: 1942, era: 'war-end', category: 'technology', basis: '이탈리아 연구진의 전자탐지 시제품은 존재했지만 제한된 양산과 교리채택이 함대 운용을 제약했다.', source: source.nara, pattern: 'knowledge', outcomes: ['소수 함정 우선배치', '지중해 공동레이더망', '야간전 패배와 연구진 이탈'], historicalActorIds: ['it-nello-carrara', 'it-ugo-tiberio'] },
  { id: 'philippine-emergency-succession', title: '필리핀 비상승계와 점령지 사법', year: 1942, era: 'war-end', category: 'world-order', basis: '망명정부·현지 비상정부·점령행정·게릴라가 동시에 권위를 주장하며 해방 후 정통성의 기준을 갈랐다.', source: source.philippines, pattern: 'rights', outcomes: ['코먼웰스 승계', '저항대표 과도평의회', '경쟁정부 장기분열'], historicalActorIds: ['ph-manuel-quezon', 'ph-sergio-osmena', 'ph-jose-abad-santos'] },
  { id: 'korean-provisional-charter', title: '대한민국 임시정부 건국강령', year: 1943, era: 'war-end', category: 'decolonization', basis: '충칭 임시정부의 건국강령과 연합외교는 독립 이후 헌정·균등·국제승인의 한 경로를 제시했다.', source: source.korea, pattern: 'rights', outcomes: ['임시정부 법통승계', '좌우·국내외 헌법회의', '분할군정과 경쟁정부'], historicalActorIds: ['kr-jo-so-ang', 'kr-kim-kyu-sik', 'kr-kim-chang-se'] },
  { id: 'vietnam-literacy-famine', title: '베트남 문해운동과 기근 대응', year: 1944, era: 'war-end', category: 'public-health', basis: '전시 수탈·수송 붕괴·기근 속에서 문해·구호·민족조직이 국가형성의 기반으로 결합했다.', source: source.decolonization, pattern: 'health', outcomes: ['지역 구호위원회', '문해·식량 공화국망', '기근과 전면봉기'], historicalActorIds: ['vn-nguyen-van-to', 'vn-dang-thai-mai', 'vn-vu-dinh-hoe'] },
  { id: 'indonesian-constitutional-lab', title: '인도네시아 헌법과 군도국가의 설계', year: 1945, era: 'war-end', category: 'decolonization', basis: '독립 준비과정은 단일국가·연방·관습법·개인권·종교와 군도의 대표성을 한 헌법 안에서 조정해야 했다.', source: source.decolonization, pattern: 'rights', outcomes: ['1945년 단일공화국', '군도 연방헌법회의', '혁명정부 경쟁'], historicalActorIds: ['id-soepomo', 'id-mohammad-yamin', 'id-mohammad-hatta'] },
  { id: 'scientists-nuclear-petition', title: '과학자의 핵무기 통제 청원', year: 1945, era: 'war-end', category: 'nuclear', basis: '원자계획 참여·주변 과학자들은 시범폭발, 사용결정, 국제통제와 과학자의 정치책임을 둘러싸고 서로 다른 제안을 냈다.', source: source.doe, pattern: 'rights', outcomes: ['정부 사용권 유지', '과학자·민간 통제위원회', '핵과학자 국제이탈'], historicalActorIds: ['us-leo-szilard', 'us-albert-einstein', 'uk-james-chadwick'] },
  { id: 'nuremberg-medical-code', title: '뉘른베르크 강령과 인간대상 연구', year: 1947, era: 'reconstruction', category: 'society', basis: '전범재판에서 정리된 자발적 동의와 위험기준은 전시의학을 국제 연구윤리 문제로 바꾸었다.', source: source.nih, pattern: 'rights', outcomes: ['국내 의사윤리', '국제 생명윤리재판소', '안보기밀 인체실험'], historicalActorIds: ['uk-howard-florey', 'ph-fe-del-mundo', 'fr-robert-debre'] },
  { id: 'partition-of-india', title: '인도 분할과 대규모 이주', year: 1947, era: 'reconstruction', category: 'decolonization', basis: '영국령 인도의 분할독립은 국경·시민권·종교공동체와 수백만 이주민의 안전을 국가형성의 핵심으로 만들었다.', source: source.decolonization, pattern: 'conflict', outcomes: ['두 국가의 급속분할', '비대칭 인도연방', '대륙 내전과 복수국가'], historicalActorIds: ['in-br-ambedkar', 'in-kamaladevi-chattopadhyay', 'in-pc-mahalanobis'] },
  { id: 'korean-trusteeship-choice', title: '한반도 군정·신탁·통일정부 선택', year: 1945, era: 'reconstruction', category: 'decolonization', basis: '해방 뒤 점령선과 신탁통치 논쟁은 독립운동 세력의 통합정부와 남북 경쟁체제 사이의 경로를 갈랐다.', source: source.korea, pattern: 'conflict', outcomes: ['점령구역별 정부', '좌우합작 통일헌법회의', '다자 군정 장기화'], historicalActorIds: ['kr-kim-kyu-sik', 'kr-an-jae-hong', 'kr-choe-hyeon-bae'] },
  { id: 'indonesian-revolution-diplomacy', title: '인도네시아 독립전쟁과 국제중재', year: 1945, era: 'reconstruction', category: 'decolonization', basis: '공화국·네덜란드·지역세력·국제중재는 군사혁명과 외교승인의 균형을 두고 경쟁했다.', source: source.decolonization, pattern: 'conflict', outcomes: ['전쟁 뒤 주권이양', '국제보증 군도연방', '장기 게릴라 혁명권'], historicalActorIds: ['id-tan-malaka', 'id-agus-salim', 'id-ar-baswedan'] },
  { id: 'philippine-independence-settlement', title: '필리핀 독립과 전후 경제주권', year: 1946, era: 'reconstruction', category: 'decolonization', basis: '공식 독립은 미군기지·전쟁복구·무역특혜·토지엘리트와 점령협력 청산 문제를 남겼다.', source: source.philippines, pattern: 'economy', outcomes: ['친미 재건공화국', '토지개혁 중립국', '기지·무역권 재협상 위기'], historicalActorIds: ['ph-manuel-roxas', 'ph-claro-recto', 'ph-carlos-p-romulo'] },
  { id: 'programming-profession-lineage', title: '프로그래밍 직업과 표준언어의 탄생', year: 1944, era: 'reconstruction', category: 'technology', basis: '전시 계산기 운영·암호분석·탄도표 작성은 하드웨어와 분리된 프로그램·운영인력의 가치를 드러냈다.', source: source.nara, pattern: 'knowledge', outcomes: ['기관별 기계어', '공개 프로그래밍 표준', '군용 폐쇄 소프트웨어'], historicalActorIds: ['us-grace-hopper', 'uk-tommy-flowers', 'us-george-dantzig'] },
  { id: 'soviet-science-city-network', title: '소련 비밀과학도시와 설계국 체제', year: 1946, era: 'reconstruction', category: 'technology', basis: '원자·로켓·항공 사업은 폐쇄도시, 수석설계자, 수감·포섭 연구진을 결합한 대형 국가연구체제로 발전했다.', source: source.iaea, pattern: 'knowledge', outcomes: ['부문별 비밀설계국', '민군 과학도시 연방', '숙청형 기술동원'], historicalActorIds: ['su-mstislav-keldysh', 'su-sergei-korolev', 'su-yakov-zeldovich'] },
  { id: 'japanese-science-democratization', title: '일본 과학체제의 비군사화와 재건', year: 1947, era: 'reconstruction', category: 'society', basis: '패전 뒤 대학·기업·국가연구소는 군사연구 청산, 학문자유, 산업복구와 연구자 책임을 재설계해야 했다.', source: source.unesco, pattern: 'rights', outcomes: ['민간산업 중심 재건', '과학자 자치평의회', '구 군수연구 비밀승계'], historicalActorIds: ['jp-masao-maruyama', 'jp-mitsuo-taketani', 'jp-kenjiro-takayanagi'] },
  { id: 'universal-health-right-1948', title: '건강권과 보편 보건체계', year: 1948, era: 'reconstruction', category: 'public-health', basis: 'WHO 헌장과 세계인권선언의 건강·사회보장 원칙은 전시 의료동원을 평시 보편권으로 전환할 기준을 만들었다.', source: source.who, pattern: 'health', outcomes: ['국가별 보건서비스', '세계 보건재정연합', '군·기업 의료블록'], historicalActorIds: ['uk-william-beveridge', 'su-nikolai-semashko', 'ph-fe-del-mundo'] },
  { id: 'chinese-scientist-return', title: '중국 과학자의 귀국과 연구주권', year: 1949, era: 'early-rivalry', category: 'technology', basis: '내전 종결과 냉전 봉쇄는 해외 중국인 과학자의 귀국·잔류·기술접근을 전략적 선택으로 바꾸었다.', source: source.unesco, pattern: 'knowledge', outcomes: ['국가 연구소 귀국', '중립 국제과학원', '두뇌·기술 봉쇄전'], historicalActorIds: ['cn-chien-shiung-wu', 'cn-lu-jiaxi', 'cn-qian-xuesen'] },
  { id: 'indian-statistical-planning', title: '인도 통계계획과 개발국가', year: 1950, era: 'early-rivalry', category: 'economy', basis: '표본조사·국민계정·산업연관·계획모형은 신생 독립국의 자원배분과 민주적 개발정책을 결합했다.', source: source.india, pattern: 'economy', outcomes: ['중앙 계획위원회', '주·협동조합 데이터연방', '통계관료 독점국가'], historicalActorIds: ['in-pc-mahalanobis', 'in-cr-rao', 'in-vkrv-rao'] },
  { id: 'korean-reconstruction-talent', title: '한국전쟁 뒤 대학·의료·산업 인재재건', year: 1953, era: 'early-rivalry', category: 'economy', basis: '전쟁은 한반도 인재·시설을 분산시켰고 복구 원조의 대학·병원·산업 배분이 장기 발전경로를 갈랐다.', source: source.korea, pattern: 'economy', outcomes: ['분단국별 원조재건', '중립 학술·보건 공동구역', '인재유출과 군사경제 고착'], historicalActorIds: ['kr-yun-il-seon', 'kr-lee-tae-gyu', 'kr-woo-jang-choon'] },
  { id: 'polio-vaccine-governance', title: '소아마비 백신과 대중접종', year: 1955, era: 'early-rivalry', category: 'public-health', basis: '불활성·경구 백신의 개발과 대규모 시험은 공공신뢰·생산안전·국제 접종전략을 시험했다.', source: source.who, pattern: 'health', outcomes: ['국가별 대중접종', '세계 무상백신망', '백신사고와 접종블록'], historicalActorIds: ['ph-fe-del-mundo', 'fr-robert-debre', 'uk-alexander-fleming'] },
  { id: 'rocket-scientist-diaspora', title: '로켓 과학자 포섭과 우주시대의 주인', year: 1957, era: 'high-rivalry', category: 'space', basis: '전후 포획·이주·비밀설계국으로 재편된 로켓 연구진은 미사일과 위성 경쟁의 국가별 출발선을 바꾸었다.', source: source.nasa, pattern: 'knowledge', outcomes: ['양대국 우주경쟁', '국제 로켓과학원', '다극 미사일확산'], historicalActorIds: ['de-wernher-von-braun', 'su-sergei-korolev', 'su-mstislav-keldysh', 'de-eugen-saenger'] },
  { id: 'nuclear-fallout-public-science', title: '핵실험 낙진과 시민과학', year: 1954, era: 'high-rivalry', category: 'environment', basis: '대기권 핵실험과 방사성 낙진은 비밀 군사자료를 식품·해양·유전 피해에 관한 공개과학 문제로 바꾸었다.', source: source.iaea, pattern: 'environment', outcomes: ['국가별 낙진기준', '세계 방사선 감시망', '비밀실험·해양오염 경쟁'], historicalActorIds: ['us-rachel-carson', 'us-linus-pauling', 'jp-chika-kuroda'] },
  { id: 'decolonized-university-wave', title: '독립국 대학과 과학아카데미의 확산', year: 1960, era: 'high-rivalry', category: 'society', basis: '탈식민화는 행정·보건·공학 인력을 양성할 국립대학과 연구소를 국가주권의 핵심 기관으로 만들었다.', source: source.unesco, pattern: 'knowledge', outcomes: ['국가별 국립대학', '남반구 공동대학망', '강대국 장학생 포섭전'], historicalActorIds: ['in-satyendra-bose', 'vn-le-van-thiem', 'id-ki-hadjar-dewantara'] },
  { id: 'congo-independence-crisis', title: '콩고 독립과 자원·평화유지 위기', year: 1960, era: 'high-rivalry', category: 'proxy-war', basis: '급속 독립, 군 반란, 자원지역 분리와 외국 개입은 유엔 평화유지와 신생국 주권의 한계를 드러냈다.', source: source.decolonization, pattern: 'conflict', outcomes: ['중앙국가 재통합', '유엔보증 자원연방', '광역 아프리카 대리전'] },
  { id: 'oral-contraception-choice', title: '경구피임약과 재생산권', year: 1960, era: 'high-rivalry', category: 'public-health', basis: '경구피임 기술의 확산은 여성의 건강·노동·가족계획과 국가 인구정책의 권한을 새로 규정했다.', source: source.women, pattern: 'rights', outcomes: ['의료허가형 가족계획', '보편 재생산권', '강제 인구통제 경쟁'] },
  { id: 'cultural-revolution-science', title: '문화대혁명과 과학·대학의 존속', year: 1966, era: 'high-rivalry', category: 'society', basis: '정치동원과 대학·연구기관의 재편은 전문가 권위, 대중과학, 연구 연속성 사이의 극단적 충돌을 만들었다.', source: source.unesco, pattern: 'rights', outcomes: ['정치학습 뒤 연구복구', '노동·대학 공동연구제', '전문가 숙청과 세대단절'], historicalActorIds: ['cn-ye-qisun', 'cn-wang-ganchang', 'cn-tong-dizhou'] },
  { id: 'npt-scientist-diplomacy', title: '핵확산금지조약과 과학주권', year: 1968, era: 'high-rivalry', category: 'nuclear', basis: '비확산조약은 핵보유국·비보유국의 의무, 민간 원자력 접근과 사찰을 불평등하지만 보편적인 규칙으로 만들었다.', source: source.iaea, pattern: 'cooperation', outcomes: ['비확산·민간협력', '기한부 핵보유와 전면군축', '지역별 핵기술권'] },
  { id: 'stockholm-environment-1972', title: '인간환경회의와 성장의 한계', year: 1972, era: 'detente', category: 'environment', basis: '스톡홀름 인간환경회의는 오염·개발·주권을 처음으로 보편 국제정치 의제로 결합했다.', source: source.unfccc, pattern: 'environment', outcomes: ['국가 환경청 확산', '세계 생태개발기금', '녹색무역·자원갈등'], historicalActorIds: ['us-rachel-carson', 'fr-rene-dumont'] },
  { id: 'helsinki-rights-basket', title: '헬싱키 최종의정서와 국경·인권', year: 1975, era: 'detente', category: 'society', basis: '유럽안보협력회의는 국경 현상유지, 경제교류와 인권 약속을 하나의 협상 묶음으로 연결했다.', source: source.rights, pattern: 'rights', outcomes: ['국가간 데탕트', '시민감시형 유럽안보공동체', '인권약속 붕괴와 재봉쇄'] },
  { id: 'vietnam-reunification-settlement', title: '베트남 통일과 전후 사회 재편', year: 1975, era: 'detente', category: 'decolonization', basis: '전쟁 종결 뒤 통일국가는 군대·토지·도시경제·난민과 국제관계를 한 체제로 재편해야 했다.', source: source.decolonization, pattern: 'economy', outcomes: ['중앙집권 사회주의 통일', '남북 비대칭 연방', '인도차이나 장기분쟁'], historicalActorIds: ['vn-ton-duc-thang', 'vn-tran-van-giau', 'vn-ta-quang-buu'] },
  { id: 'alma-ata-primary-health', title: '알마아타와 일차보건의료', year: 1978, era: 'detente', category: 'public-health', basis: '알마아타 선언은 병원 중심 의료를 지역사회·예방·보편 접근 중심의 일차보건 전략으로 확장했다.', source: source.who, pattern: 'health', outcomes: ['국가 일차보건망', '국경없는 지역보건연합', '민영 병원·의약블록'] },
  { id: 'cedaw-gender-order', title: '여성차별철폐협약과 국가의무', year: 1979, era: 'transformation', category: 'society', basis: 'CEDAW는 정치·교육·노동·가족에서 여성차별 철폐를 국제 보고와 국내법 의무로 연결했다.', source: source.women, pattern: 'rights', outcomes: ['유보부 국내개혁', '개인청원·동등대표 의무', '문화전쟁과 협약탈퇴'] },
  { id: 'global-debt-crisis-1982', title: '세계 채무위기와 구조조정', year: 1982, era: 'transformation', category: 'economy', basis: '고금리·원자재가격·외화부채 위기는 개발국의 재정·복지·산업정책을 국제채권자 협상에 종속시켰다.', source: source.imf, pattern: 'economy', outcomes: ['긴축·채무재조정', '채무국 공동협상기구', '연쇄 디폴트와 자급권'] },
  { id: 'people-power-philippines', title: '필리핀 피플파워와 비폭력 정권교체', year: 1986, era: 'transformation', category: 'society', basis: '선거부정 논란, 군 이탈, 교회·시민의 대중동원은 권위주의 정권을 비폭력적으로 교체했다.', source: source.philippines, pattern: 'rights', outcomes: ['헌정민주주의 복구', '시민평의회형 개헌', '군부 분열과 장기내전'], historicalActorIds: ['ph-lorenzo-tanada', 'ph-claro-recto'] },
  { id: 'chernobyl-openness', title: '체르노빌과 초국경 핵안전', year: 1986, era: 'transformation', category: 'nuclear', basis: '원자로 사고와 초기 정보통제는 핵안전·재난정보·국경을 넘는 방사능 피해를 국제규칙 문제로 만들었다.', source: source.iaea, pattern: 'environment', outcomes: ['국가별 안전개혁', '초국가 원자로감독청', '정보봉쇄와 핵공포 블록'] },
  { id: 'korea-democracy-1987', title: '한국 6월항쟁과 직선제 개헌', year: 1987, era: 'transformation', category: 'society', basis: '대중시위·노동운동·야권협상은 군부권위주의에서 직선제 헌정으로의 전환을 이끌었다.', source: source.korea, pattern: 'rights', outcomes: ['직선제 민주화', '시민·노동 참여개헌', '비상계엄과 저항확대'], historicalActorIds: ['kr-kim-kyu-sik', 'kr-an-jae-hong'] },
  { id: 'human-genome-project-launch', title: '인간게놈프로젝트와 생명정보', year: 1990, era: 'post-cold-war', category: 'technology', basis: '국제 공공연구와 자동염기서열 분석은 인간 유전정보를 의학·산업·권리의 공동 기반으로 만들었다.', source: source.genome, pattern: 'knowledge', outcomes: ['공공데이터·민간특허 혼합', '세계 생명정보공유재', '유전자 데이터 군비경쟁'] },
  { id: 'rio-earth-summit', title: '리우 환경개발회의와 지속가능발전', year: 1992, era: 'post-cold-war', category: 'environment', basis: '리우회의는 기후·생물다양성·개발재정을 하나의 지속가능발전 의제로 제도화했다.', source: source.unfccc, pattern: 'environment', outcomes: ['자발적 국가행동계획', '구속력 있는 지구개발협약', '남북 환경무역전쟁'] },
  { id: 'rome-statute-court', title: '로마규정과 상설 국제형사재판소', year: 1998, era: 'post-cold-war', category: 'world-order', basis: '로마규정은 집단살해·전쟁범죄·반인도범죄의 개인책임을 상설 국제재판으로 제도화했다.', source: source.icc, pattern: 'rights', outcomes: ['보충성 원칙의 ICC', '보편관할 국제검찰', '강대국 면책·지역재판권'] },
  { id: 'millennium-development-goals', title: '새천년개발목표와 측정 가능한 원조', year: 2000, era: 'connected-world', category: 'economy', basis: '빈곤·교육·보건·성평등 목표와 지표는 개발정책을 세계적 성과측정 체계로 묶었다.', source: source.undp, pattern: 'economy', outcomes: ['목표기반 양자원조', '세계 조세·보편서비스 기금', '지표조작과 원조블록'] },
  { id: 'indian-ocean-tsunami-cooperation', title: '인도양 쓰나미와 재난협력', year: 2004, era: 'connected-world', category: 'environment', basis: '대형 쓰나미는 조기경보 부재, 국제구호 조정, 군사자산의 인도지원 활용을 동시에 시험했다.', source: source.un, pattern: 'cooperation', outcomes: ['국가별 조기경보', '인도양 공동재난군', '구호경쟁·주권충돌'] },
  { id: 'h1n1-pandemic-2009', title: 'H1N1 대유행과 백신 배분', year: 2009, era: 'connected-world', category: 'public-health', basis: '2009년 인플루엔자 대유행은 개정 국제보건규칙, 위험소통과 부유국 백신 선구매의 공정성을 시험했다.', source: source.who, pattern: 'health', outcomes: ['국가별 백신계약', '세계 유행백신 비축고', '과잉공포와 보건불신'] },
  { id: 'crispr-gene-editing', title: 'CRISPR 유전자 편집과 생명주권', year: 2012, era: 'connected-world', category: 'technology', basis: '정밀 유전자 편집은 치료·농업·생물안보의 가능성과 생식세포 개입·특허경쟁 위험을 동시에 열었다.', source: source.crispr, pattern: 'knowledge', outcomes: ['허가형 치료시장', '세계 생명윤리·특허풀', '유전자 강화·생물무기 경쟁'] },
  { id: 'west-africa-ebola-2014', title: '서아프리카 에볼라와 취약국 보건망', year: 2014, era: 'connected-world', category: 'public-health', basis: '에볼라 유행은 지역 보건인력 부족, 국제대응 지연, 격리·장례 관행과 백신 연구를 하나의 위기로 결합했다.', source: source.ebola, pattern: 'health', outcomes: ['긴급 국제파견', '서아프리카 상설 보건군', '국경봉쇄·국가붕괴'] },
  { id: 'sustainable-development-goals', title: '지속가능발전목표와 2030 의제', year: 2015, era: 'connected-world', category: 'world-order', basis: 'SDGs는 빈곤·불평등·기후·평화·제도를 보편적 국가목표와 공통지표로 연결했다.', source: source.undp, pattern: 'cooperation', outcomes: ['국가별 선택이행', '구속력 있는 행성예산', '목표별 경쟁개발권'] },
  { id: 'mrna-vaccine-platform', title: 'mRNA 백신 플랫폼과 생산주권', year: 2020, era: 'connected-world', category: 'public-health', basis: '신속한 mRNA 백신 개발은 공공연구·기업특허·임상자료·초저온 공급망과 세계 배분의 관계를 드러냈다.', source: source.covid, pattern: 'health', outcomes: ['국가 선구매 접종', '세계 백신특허·생산공유', '보건블록과 기술봉쇄'] },
  { id: 'semiconductor-security-blocs', title: '반도체 공급망과 기술안보 블록', year: 2022, era: 'connected-world', category: 'technology', basis: '첨단 반도체의 설계·장비·제조 집중과 수출통제는 민간 디지털경제를 국가안보 경쟁의 핵심으로 바꾸었다.', source: source.wto, pattern: 'knowledge', outcomes: ['동맹 공급망 다변화', '검증형 세계 반도체협정', '완전 분리된 연산블록'] },
  { id: 'regional-development-bank-wave', title: '지역개발은행과 자립형 재건금융', year: 1959, era: 'high-rivalry', category: 'economy', basis: '1950년대 말부터 확산된 지역개발은행은 신생국의 기반시설·기술지원·장기대출을 지역 대표권과 결합했다.', source: source.regionalBanks, pattern: 'economy', outcomes: ['기존 강대국 중심 대출', '지역별 공동개발은행망', '경쟁 개발은행 부채전쟁'] },
  { id: 'tac-regional-nonaggression', title: '동남아 우호협력조약과 합의형 지역주의', year: 1976, era: 'detente', category: 'world-order', basis: '동남아 우호협력조약은 주권존중·무력위협 포기·평화적 분쟁해결을 지역질서의 반복 규칙으로 제도화했다.', source: source.asean, pattern: 'cooperation', outcomes: ['비간섭형 국가협의체', '분쟁중재형 지역공동체', '해양·육상 경쟁동맹 분열'] },
  { id: 'tripartite-social-pact', title: '노동·기업·정부 삼자 사회협약', year: 1976, era: 'detente', category: 'society', basis: 'ILO의 삼자주의와 사회적 대화는 임금·노동조건·산업전환을 정부·사용자·노동자가 협상하는 제도적 선례를 축적했다.', source: source.ilo, pattern: 'rights', outcomes: ['부문별 단체협약', '국가 공동결정 사회협약', '노동배제형 기업국가'] },
  { id: 'unclos-common-heritage', title: '해양법과 심해저 인류 공동유산', year: 1982, era: 'transformation', category: 'environment', basis: '유엔해양법협약은 국가관할권 밖 심해저와 그 자원을 인류 공동유산으로 규정하고 평화적 이용과 이익공유 원칙을 세웠다.', source: source.unclos, pattern: 'cooperation', outcomes: ['배타적 관할수역 경쟁', '심해저 국제신탁·이익공유', '해군·광산기업의 공해 선점전'] },
  { id: 'sovereign-wealth-intergenerational', title: '자원수익과 세대간 국부기금', year: 1990, era: 'post-cold-war', category: 'economy', basis: '자원부국의 국부관리는 변동성 높은 자원수익을 재정안정·저축·세대간 형평과 장기 금융자산으로 전환하는 선택을 제시했다.', source: source.imfWealth, pattern: 'economy', outcomes: ['정부 재정안정기금', '독립 시민배당 국부기금', '정권·기업의 자원기금 사유화'] },
  { id: 'multistakeholder-internet-governance', title: '다중이해관계자 인터넷 거버넌스', year: 1998, era: 'post-cold-war', category: 'technology', basis: '인터넷 주소·표준·정책을 정부만이 아니라 기술공동체·기업·대학·시민사회가 함께 다루는 다중이해관계자 모델이 제도화됐다.', source: source.icann, pattern: 'knowledge', outcomes: ['민간기술조정 체계', '공공대표형 세계 인터넷평의회', '국가별 주소·표준 분할망'] },
  { id: 'sendai-resilient-cities', title: '센다이 체계와 재난회복 도시망', year: 2015, era: 'connected-world', category: 'environment', basis: '센다이 체계는 재난 뒤 구호를 넘어 위험 이해·예방투자·거버넌스·더 나은 복구를 국가와 도시·민간의 공동책임으로 제시했다.', source: source.undrr, pattern: 'environment', outcomes: ['국가별 위험감축계획', '도시 상호구호·조기경보연합', '보험철수·기후재난 요새도시'] },
  { id: 'healthy-ageing-social-contract', title: '건강수명과 장기돌봄 사회계약', year: 2021, era: 'connected-world', category: 'public-health', basis: '건강한 고령화 10년은 고령친화 환경·통합진료·장기돌봄과 노인에 대한 태도 변화를 하나의 사회정책 의제로 묶었다.', source: source.ageing, pattern: 'health', outcomes: ['국가 연금·돌봄 개혁', '세대통합형 보편돌봄권', '수명기술 계급사회'] },
  { id: 'renewable-flexibility-supergrid', title: '재생에너지 유연성·초광역 전력망', year: 2026, era: 'connected-world', category: 'environment', basis: '변동형 재생전원의 확대는 저장·연계선·수요관리·부문결합을 함께 운영하는 유연한 전력체계를 에너지안보의 핵심으로 만들었다.', source: source.irena, pattern: 'environment', outcomes: ['국가별 저장·전력망 보강', '대륙 재생에너지 슈퍼그리드', '전력망 봉쇄·희소광물 냉전'] },
];

function variant(id: string, title: string, summary: string, consequence: string, metricDelta: Partial<Record<WorldMetric, number>>): WorldHistoryVariant {
  return { id, title, summary, consequence, metricDelta };
}

function materialize(seed: AlternateHistorySeed): WorldHistoryEvent {
  return {
    id: seed.id,
    title: seed.title,
    historicalYear: seed.year,
    era: seed.era,
    category: seed.category,
    historicalBasis: seed.basis,
    sourceLabel: seed.source[0],
    sourceUrl: seed.source[1],
    historicalActorIds: seed.historicalActorIds,
    variants: [
      variant('continuity', seed.outcomes[0], summaries[seed.pattern][0], `${seed.outcomes[0]}의 성과와 미해결 문제가 다음 사건의 기준선이 된다.`, deltas[seed.pattern][0]),
      variant('compact', seed.outcomes[1], summaries[seed.pattern][1], `${seed.outcomes[1]}이 행위자·제도·자원배분의 규칙을 다시 쓴다.`, deltas[seed.pattern][1]),
      variant('rupture', seed.outcomes[2], summaries[seed.pattern][2], `${seed.outcomes[2]}이 새로운 경쟁 블록과 장기 위기선을 만든다.`, deltas[seed.pattern][2]),
    ],
  };
}

export const expandedAlternateHistoryEvents: WorldHistoryEvent[] = seeds.map(materialize);
