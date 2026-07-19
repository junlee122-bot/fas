import type { NationId, PersonnelAvailability, StaffCandidate } from './types';
import type { GeneratedWorldEvent } from './worldHistory';

export type IntelligenceOrganizationKind = 'foreign' | 'domestic' | 'signals' | 'special-operations' | 'military' | 'resistance' | 'political-police';
export type IntelligenceFigureRole = 'recruitable' | 'rival' | 'double-agent' | 'perpetrator';

export interface IntelligenceOrganization {
  id: string;
  name: string;
  abbreviation: string;
  nationIds: NationId[];
  foundedYear: number;
  dissolvedYear?: number;
  kind: IntelligenceOrganizationKind;
  predecessorIds: string[];
  successorIds: string[];
  formationEventId: string;
  historicalBasis: string;
  doctrine: string;
  ethicalRisk: string;
  sourceLabel: string;
  sourceUrl: string;
  variantNames?: Partial<Record<'historical' | 'institutional' | 'transformative', string>>;
}

export interface IntelligenceFigure {
  id: string;
  name: string;
  birthYear: number;
  nationality: string;
  accessNations: NationId[];
  organizationIds: string[];
  availableFromYear: number;
  activeFromYear: number;
  office: string;
  specialty: string;
  summary: string;
  historicalConstraint: string;
  networks: [string, string];
  role: IntelligenceFigureRole;
  ability: number;
  potential: number;
  loyalty: number;
  influence: number;
  interest: number;
  availability: PersonnelAvailability;
  sourceLabel: string;
  sourceUrl: string;
}

export interface ResolvedIntelligenceOrganization extends IntelligenceOrganization {
  displayName: string;
  appearanceYear: number;
  variantId: string;
  variantTitle: string;
  alternateEffect: string;
  figures: IntelligenceFigure[];
}

const urls = {
  cia: 'https://www.archives.gov/research/intelligence/cia',
  oss: 'https://www.archives.gov/research/military/ww2/oss',
  sis: 'https://www.sis.gov.uk/about-us/our-history/',
  mi5: 'https://www.mi5.gov.uk/history/world-war-ii',
  gchq: 'https://www.gchq.gov.uk/section/history/bletchley-park-and-wwii',
  soe: 'https://www.nationalarchives.gov.uk/explore-the-collection/stories/virginia-hall/',
  stasi: 'https://www.bundesarchiv.de/assets/bundesarchiv/de/Bildungsmaterialien/Themenmappe_4_einseitig_BArch_BA.pdf',
  bnd: 'https://www.bundesarchiv.de/themen-entdecken/online-entdecken/podcast/der-fruehe-bundesnachrichtendienst-und-die-ddr/',
  gestapo: 'https://encyclopedia.ushmm.org/content/en/article/gestapo',
  france: 'https://www.dgse.gouv.fr/fr/nous-connaitre/notre-heritage',
  nsa: 'https://www.nsa.gov/History/Cryptologic-History/Historical-Events/Historical-Events-List/',
  mossad: 'https://mossad.gov.il/en/history',
  china: 'https://www.mod.gov.cn/gfbw/gfjy_index/4806820.html',
  japan: 'https://text-message.blogs.archives.gov/2021/10/21/the-capture-and-exploitation-of-japanese-records-during-world-war-ii/',
  korea: 'https://db.history.go.kr/item/level.do?levelId=ij_013_%241exp',
  koreaPeople: 'https://contents.history.go.kr/photo/imsi/imsi_period03.do',
  church: 'https://www.senate.gov/about/powers-procedures/investigations/church-committee.htm',
  senate: 'https://www.senate.gov/about/powers-procedures/investigations/church-committee.htm',
} as const;

function org(profile: IntelligenceOrganization) { return profile; }

export const intelligenceOrganizations: IntelligenceOrganization[] = [
  org({ id: 'sis', name: '영국 비밀정보부', abbreviation: 'SIS/MI6', nationIds: ['britain'], foundedYear: 1909, kind: 'foreign', predecessorIds: [], successorIds: [], formationEventId: 'wartime-secret-war', historicalBasis: '1909년 비밀업무국 해외부에서 출발해 전쟁기 중립국·점령지 인적정보망을 운용했습니다.', doctrine: '해외 인적정보·연락·공작', ethicalRisk: '제국 이해와 비밀외교가 식민지의 자기결정권과 충돌할 수 있습니다.', sourceLabel: 'SIS 공식 기관사', sourceUrl: urls.sis }),
  org({ id: 'mi5', name: '영국 보안국', abbreviation: 'MI5', nationIds: ['britain'], foundedYear: 1909, kind: 'domestic', predecessorIds: [], successorIds: [], formationEventId: 'wartime-secret-war', historicalBasis: '전쟁 중 적 요원을 적발·전향시킨 Double Cross 체계를 운영했습니다.', doctrine: '방첩·기만·국내보안', ethicalRisk: '국내 감시와 정치적 충성 심사가 시민권을 침해할 수 있습니다.', sourceLabel: 'MI5 제2차 세계대전사', sourceUrl: urls.mi5 }),
  org({ id: 'soe', name: '특수작전집행부', abbreviation: 'SOE', nationIds: ['britain', 'freefrance', 'india'], foundedYear: 1940, dissolvedYear: 1946, kind: 'special-operations', predecessorIds: [], successorIds: ['sis'], formationEventId: 'wartime-secret-war', historicalBasis: '점령 유럽과 아시아의 저항조직 지원·파괴공작·무전 연락을 담당했습니다.', doctrine: '저항망 조직·파괴·보급', ethicalRisk: '현지 요원과 민간인이 보복·고문·집단처벌에 노출됩니다.', sourceLabel: '영국 국립문서보관소 · SOE', sourceUrl: urls.soe }),
  org({ id: 'gccs-gchq', name: '정부암호학교·정부통신본부', abbreviation: 'GC&CS/GCHQ', nationIds: ['britain'], foundedYear: 1919, kind: 'signals', predecessorIds: [], successorIds: [], formationEventId: 'ukusa-signals-order', historicalBasis: '블레츨리 파크에서 산업적 암호해독과 연합국 정보공유를 발전시켰습니다.', doctrine: '신호정보·암호해독·정보보안', ethicalRisk: '대규모 감청은 동맹 신뢰와 사생활 권리를 동시에 위협할 수 있습니다.', sourceLabel: 'GCHQ 블레츨리 파크 역사', sourceUrl: urls.gchq }),

  org({ id: 'coi', name: '미국 정보조정관실', abbreviation: 'COI', nationIds: ['usa'], foundedYear: 1941, dissolvedYear: 1942, kind: 'foreign', predecessorIds: [], successorIds: ['oss'], formationEventId: 'wartime-secret-war', historicalBasis: '대통령에게 흩어진 해외정보를 조정하기 위해 창설됐습니다.', doctrine: '전략정보 수집·분석·선전', ethicalRisk: '대통령 직속 비공개 조직의 권한과 부처 경쟁이 통제 문제를 낳습니다.', sourceLabel: '미국 국립문서기록관리청 · OSS 계보', sourceUrl: urls.oss }),
  org({ id: 'oss', name: '미국 전략첩보국', abbreviation: 'OSS', nationIds: ['usa', 'korea', 'china', 'freefrance', 'philippines'], foundedYear: 1942, dissolvedYear: 1945, kind: 'special-operations', predecessorIds: ['coi'], successorIds: ['ssu'], formationEventId: 'wartime-secret-war', historicalBasis: '1942년 COI에서 전환되어 분석·첩보·방첩·특수작전을 결합했습니다.', doctrine: '전략분석·X-2 방첩·현장공작', ethicalRisk: '비밀공작의 군사효과와 현지 정치세력 개입 사이의 경계가 불명확합니다.', sourceLabel: '미국 국립문서기록관리청 · OSS 기록', sourceUrl: urls.oss }),
  org({ id: 'ssu', name: '전략업무부대', abbreviation: 'SSU', nationIds: ['usa'], foundedYear: 1945, dissolvedYear: 1946, kind: 'foreign', predecessorIds: ['oss'], successorIds: ['cig'], formationEventId: 'secret-service-demobilization', historicalBasis: 'OSS 해체 뒤 비밀공작 인력과 해외거점 일부를 전쟁부 안에서 유지했습니다.', doctrine: '해외거점 보존·인수인계', ethicalRisk: '전시 인력의 검증 없는 평시 승계와 비공식 작전 지속 위험이 있습니다.', sourceLabel: '미국 국립문서기록관리청 · CIA 계보', sourceUrl: urls.cia }),
  org({ id: 'cig', name: '중앙정보그룹', abbreviation: 'CIG', nationIds: ['usa'], foundedYear: 1946, dissolvedYear: 1947, kind: 'foreign', predecessorIds: ['ssu'], successorIds: ['cia'], formationEventId: 'secret-service-demobilization', historicalBasis: '국가정보기관 창설 전 과도기 중앙 조정기구였습니다.', doctrine: '부처 정보조정·국가정보평가', ethicalRisk: '권한·예산·감독 근거가 약한 과도기 조직입니다.', sourceLabel: '미국 국립문서기록관리청 · CIA 기록', sourceUrl: urls.cia }),
  org({ id: 'cia', name: '중앙정보국', abbreviation: 'CIA', nationIds: ['usa'], foundedYear: 1947, kind: 'foreign', predecessorIds: ['cig'], successorIds: [], formationEventId: 'cia-national-security-act', historicalBasis: '1947년 국가안보법으로 창설되어 정보조정·분석과 대통령 지시 아래 비밀행동을 수행했습니다.', doctrine: '국가정보평가·해외공작·방첩', ethicalRisk: '정권개입·국내활동·암살계획 등 권한 남용은 민주적 감독의 핵심 쟁점입니다.', sourceLabel: '미국 국립문서기록관리청 · CIA', sourceUrl: urls.cia, variantNames: { institutional: '의회감독 중앙정보위원회', transformative: '초국경 전략행동청' } }),
  org({ id: 'us-wartime-cryptologic-services', name: '미 육군 SIS·해군 OP-20-G', abbreviation: 'SIS/OP-20-G', nationIds: ['usa', 'britain'], foundedYear: 1917, dissolvedYear: 1949, kind: 'signals', predecessorIds: [], successorIds: ['nsa'], formationEventId: 'wartime-secret-war', historicalBasis: '육군 신호정보국과 해군 통신정보조직이 별도로 암호해독을 수행하며 영국 기관과 협력했습니다.', doctrine: '군별 암호해독·통신정보·연합 연락', ethicalRisk: '군별 경쟁과 과도한 비밀분류가 정보 공유, 민간 감독과 전문가 처우를 약화시킵니다.', sourceLabel: 'NSA 암호사 연표', sourceUrl: urls.nsa }),
  org({ id: 'nsa', name: '국가안보국', abbreviation: 'NSA', nationIds: ['usa', 'britain'], foundedYear: 1952, kind: 'signals', predecessorIds: ['us-wartime-cryptologic-services'], successorIds: [], formationEventId: 'nsa-cryptologic-centralization', historicalBasis: '군별 암호기관을 통합해 신호정보와 통신보안을 중앙화했습니다.', doctrine: '신호정보·암호보안·기술수집', ethicalRisk: '대량감청과 비밀 법해석은 사생활·표현의 자유·동맹 신뢰를 훼손할 수 있습니다.', sourceLabel: 'NSA 암호사 연표', sourceUrl: urls.nsa }),

  org({ id: 'nkvd', name: '소련 내무인민위원부', abbreviation: 'NKVD', nationIds: ['ussr'], foundedYear: 1934, dissolvedYear: 1946, kind: 'political-police', predecessorIds: [], successorIds: ['mgb'], formationEventId: 'wartime-secret-war', historicalBasis: '국내보안·정치경찰·수용소·일부 해외공작을 결합한 국가강제기관이었습니다.', doctrine: '국가보안·후방통제·해외첩보', ethicalRisk: '대숙청·강제이주·고문·수용소 운영에 책임이 있는 국가폭력기관입니다.', sourceLabel: '미국 국립문서기록관리청 · 정보기관 기록 안내', sourceUrl: urls.cia }),
  org({ id: 'mgb', name: '소련 국가보안부', abbreviation: 'MGB', nationIds: ['ussr'], foundedYear: 1946, dissolvedYear: 1953, kind: 'political-police', predecessorIds: ['nkvd'], successorIds: ['kgb'], formationEventId: 'secret-service-demobilization', historicalBasis: '전후 국가보안·방첩·해외정보를 별도 부처로 재편했습니다.', doctrine: '국가보안·방첩·점령지 통제', ethicalRisk: '사법절차 밖 체포·강압수사와 정치적 숙청의 위험이 큽니다.', sourceLabel: '독일 연방문서보관소 · 동서독 정보전', sourceUrl: urls.stasi }),
  org({ id: 'kgb', name: '소련 국가보안위원회', abbreviation: 'KGB', nationIds: ['ussr'], foundedYear: 1954, dissolvedYear: 1991, kind: 'political-police', predecessorIds: ['mgb'], successorIds: [], formationEventId: 'kgb-state-security-reform', historicalBasis: '해외정보·국내방첩·국경경비·지도부 경호를 위원회 체계에 결합했습니다.', doctrine: '해외침투·체제보안·적극조치', ethicalRisk: '반체제 탄압과 위성국 통제, 허위정보 공작이 제도적 위험입니다.', sourceLabel: '독일 연방문서보관소 · 냉전 정보전', sourceUrl: urls.stasi }),

  org({ id: 'abwehr', name: '독일 국방군 해외·방첩국', abbreviation: 'Abwehr', nationIds: ['germany'], foundedYear: 1920, dissolvedYear: 1944, kind: 'military', predecessorIds: [], successorIds: [], formationEventId: 'wartime-secret-war', historicalBasis: '국방군 최고사령부의 군사정보·파괴공작·방첩 기관이었고 1944년 기능이 RSHA로 흡수됐습니다.', doctrine: '군사정보·파괴·방첩', ethicalRisk: '점령전쟁과 일부 범죄에 가담했으며 내부 반나치 인맥이 존재해 조직 충성도도 분열됐습니다.', sourceLabel: '독일 연방문서보관소 · 국방군 기록', sourceUrl: urls.bnd }),
  org({ id: 'rsha', name: '국가보안본부', abbreviation: 'RSHA/게슈타포·SD', nationIds: ['germany'], foundedYear: 1939, dissolvedYear: 1945, kind: 'political-police', predecessorIds: [], successorIds: [], formationEventId: 'wartime-secret-war', historicalBasis: '게슈타포·형사경찰·SD를 결합해 나치의 정치경찰·정보·박해 체계를 운영했습니다.', doctrine: '정치경찰·인종박해·점령지 보안', ethicalRisk: '홀로코스트·강제이주·고문·학살을 실행한 범죄기관으로 영입 대상이 아닌 적대 조직입니다.', sourceLabel: '미국 홀로코스트기념박물관 · 게슈타포', sourceUrl: urls.gestapo }),
  org({ id: 'gehlen-org', name: '게엘렌 조직', abbreviation: 'Org', nationIds: ['germany', 'usa'], foundedYear: 1946, dissolvedYear: 1956, kind: 'foreign', predecessorIds: ['abwehr'], successorIds: ['bnd'], formationEventId: 'gehlen-bnd-foundation', historicalBasis: '미국 지원 아래 동유럽·소련 정보망을 재건한 서독 전신기관이었습니다.', doctrine: '동구권 군사정보·망명자망', ethicalRisk: '나치 경력자 재활용·허위정보·소련 침투와 책임회피가 구조적 문제였습니다.', sourceLabel: '독일 연방문서보관소 · 게엘렌 조직', sourceUrl: urls.bnd }),
  org({ id: 'bnd', name: '서독 연방정보부', abbreviation: 'BND', nationIds: ['germany'], foundedYear: 1956, kind: 'foreign', predecessorIds: ['gehlen-org'], successorIds: [], formationEventId: 'gehlen-bnd-foundation', historicalBasis: '1956년 게엘렌 조직을 연방정부의 해외정보기관으로 전환했습니다.', doctrine: '해외 군사·정치·기술정보', ethicalRisk: '전신기관 인사검증 실패와 동서 정보기관의 상호침투가 위험입니다.', sourceLabel: '독일 연방문서보관소 · 초기 BND', sourceUrl: urls.bnd }),
  org({ id: 'stasi', name: '동독 국가보안부', abbreviation: 'MfS/Stasi', nationIds: ['germany', 'ussr'], foundedYear: 1950, dissolvedYear: 1990, kind: 'political-police', predecessorIds: [], successorIds: [], formationEventId: 'stasi-security-ministry', historicalBasis: '당국가 보안·국내감시·해외정보를 거대한 비공식협력자망과 결합했습니다.', doctrine: '전사회 감시·방첩·해외침투', ethicalRisk: '광범위한 시민감시·협박·구금·사회관계 파괴를 체계화했습니다.', sourceLabel: '독일 연방문서보관소 · 슈타지 자료', sourceUrl: urls.stasi }),

  org({ id: 'bcra', name: '자유프랑스 중앙정보행동국', abbreviation: 'BCRA', nationIds: ['freefrance', 'britain'], foundedYear: 1942, dissolvedYear: 1943, kind: 'resistance', predecessorIds: [], successorIds: ['sdece'], formationEventId: 'wartime-secret-war', historicalBasis: '정보분석·무전·파괴공작과 국내 레지스탕스 연락을 통합했습니다.', doctrine: '저항정보·행동·연락', ethicalRisk: '망명정부 내부 정파와 국내 저항조직 대표권 경쟁이 작전 안전을 위협합니다.', sourceLabel: 'DGSE · BCRA 유산', sourceUrl: urls.france }),
  org({ id: 'sdece', name: '대외문서방첩국', abbreviation: 'SDECE', nationIds: ['freefrance'], foundedYear: 1945, dissolvedYear: 1982, kind: 'foreign', predecessorIds: ['bcra'], successorIds: ['dgse'], formationEventId: 'secret-service-demobilization', historicalBasis: 'BCRA·DGER 계보를 평시 해외정보·방첩기관으로 통합했습니다.', doctrine: '해외정보·방첩·비밀행동', ethicalRisk: '식민전쟁·정파개입·비공식 행동망이 법적 책임을 흐릴 수 있습니다.', sourceLabel: 'DGSE · SDECE 창설사', sourceUrl: urls.france }),
  org({ id: 'dgse', name: '대외안보총국', abbreviation: 'DGSE', nationIds: ['freefrance'], foundedYear: 1982, kind: 'foreign', predecessorIds: ['sdece'], successorIds: [], formationEventId: 'sdece-dgse-reform', historicalBasis: '1982년 SDECE를 개편해 현대적 임무·지휘체계를 세웠습니다.', doctrine: '해외정보·전략정보·특수행동', ethicalRisk: '비밀작전의 법적 승인·동맹관계·민간피해에 대한 감독이 필요합니다.', sourceLabel: 'DGSE 공식 기관사', sourceUrl: urls.france }),

  org({ id: 'juntong', name: '국민정부 군사위원회 조사통계국', abbreviation: '군통', nationIds: ['china'], foundedYear: 1938, dissolvedYear: 1946, kind: 'political-police', predecessorIds: [], successorIds: [], formationEventId: 'wartime-secret-war', historicalBasis: '대일 정보·파괴공작과 함께 국내 정치감시·탄압을 수행했습니다.', doctrine: '군사정보·대일공작·정권보안', ethicalRisk: '고문·암살·정치탄압과 항일정보 활동이 한 조직 안에 결합됐습니다.', sourceLabel: '중국 국방부 · 군통·중통 연혁', sourceUrl: urls.china }),
  org({ id: 'cpc-social-affairs', name: '중공 중앙사회부', abbreviation: '中央社会部', nationIds: ['china', 'vietnam', 'korea'], foundedYear: 1939, dissolvedYear: 1949, kind: 'foreign', predecessorIds: [], successorIds: ['mss'], formationEventId: 'wartime-secret-war', historicalBasis: '통일전선·점령지·국민정부 내부 정보와 방첩을 결합했습니다.', doctrine: '지하당망·통일전선·방첩', ethicalRisk: '당 조직의 비밀규율이 재판·행정 책임보다 우선할 수 있습니다.', sourceLabel: '중국 국방부 · 정보조직사', sourceUrl: urls.china }),
  org({ id: 'mss', name: '중국 국가안전부', abbreviation: 'MSS', nationIds: ['china'], foundedYear: 1983, kind: 'foreign', predecessorIds: ['cpc-social-affairs'], successorIds: [], formationEventId: 'sdece-dgse-reform', historicalBasis: '1983년 국가 수준의 대외정보·방첩 체계로 재편됐습니다.', doctrine: '대외정보·방첩·기술정보', ethicalRisk: '국가안보와 정치적 반대·해외 영향공작의 경계가 불투명합니다.', sourceLabel: '중국 국방부 · 정보조직사', sourceUrl: urls.china }),

  org({ id: 'kempeitai', name: '일본군 헌병대 정보망', abbreviation: '憲兵隊', nationIds: ['japan', 'korea', 'vietnam', 'indonesia', 'philippines'], foundedYear: 1881, dissolvedYear: 1945, kind: 'political-police', predecessorIds: [], successorIds: [], formationEventId: 'wartime-secret-war', historicalBasis: '점령지 군사경찰·방첩·정치감시와 잔혹한 강압수사를 수행했습니다.', doctrine: '점령지 통제·방첩·군사경찰', ethicalRisk: '고문·학살·강제동원에 책임이 있는 가해기관으로 적대 조직으로만 모델링합니다.', sourceLabel: '미국 국립문서기록관리청 · 일본 정보기관 포획문서', sourceUrl: urls.japan }),
  org({ id: 'japanese-naval-intelligence', name: '일본 해군 군령부 정보부', abbreviation: '해군정보부', nationIds: ['japan'], foundedYear: 1893, dissolvedYear: 1945, kind: 'military', predecessorIds: [], successorIds: [], formationEventId: 'wartime-secret-war', historicalBasis: '해군 군령부와 해군성의 정보·조사 조직이 함대 정보, 해외 정찰과 전쟁수행능력 분석을 맡았습니다.', doctrine: '해군정보·전황분석·해외정찰', ethicalRisk: '침략전쟁 수행과 외교 위장 정보활동에 대한 책임, 육해군 간 정보 독점이 함께 모델링됩니다.', sourceLabel: '미국 국립문서기록관리청 · 일본 정보기관 포획문서', sourceUrl: urls.japan }),
  org({ id: 'psia', name: '일본 공안조사청', abbreviation: 'PSIA', nationIds: ['japan'], foundedYear: 1952, kind: 'domestic', predecessorIds: [], successorIds: [], formationEventId: 'nsa-cryptologic-centralization', historicalBasis: '전후 헌정질서 아래 파괴활동 조사와 국내보안을 담당했습니다.', doctrine: '국내안보·조직분석', ethicalRisk: '사상·결사의 자유와 안보조사의 경계를 법률로 제한해야 합니다.', sourceLabel: '일본 공안조사청', sourceUrl: 'https://www.moj.go.jp/psia/English.html' }),

  org({ id: 'india-ib', name: '인도 정보국', abbreviation: 'IB', nationIds: ['india'], foundedYear: 1887, kind: 'domestic', predecessorIds: [], successorIds: ['raw'], formationEventId: 'postcolonial-intelligence-services', historicalBasis: '식민지 정보기구의 계보를 독립국 국내정보·방첩기관으로 승계했습니다.', doctrine: '국내정보·방첩·국경안보', ethicalRisk: '식민지 감시 관행의 승계와 정파적 국내감시 위험이 있습니다.', sourceLabel: '인도 정부 · 정보보안기관 목록', sourceUrl: 'https://nehruportal.nic.in/sites/default/files/Proactive%20Disclosure%20%28389KB%29.pdf' }),
  org({ id: 'raw', name: '인도 연구분석원', abbreviation: 'R&AW', nationIds: ['india'], foundedYear: 1968, kind: 'foreign', predecessorIds: ['india-ib'], successorIds: [], formationEventId: 'asian-intelligence-state', historicalBasis: '대외정보 임무를 국내정보국에서 분리해 별도 조직으로 만들었습니다.', doctrine: '대외정보·지역분석·비밀공작', ethicalRisk: '지역 분쟁 개입과 국내 정치로의 임무 역류를 감독해야 합니다.', sourceLabel: '인도 정부 · 정보보안기관 목록', sourceUrl: 'https://nehruportal.nic.in/sites/default/files/Proactive%20Disclosure%20%28389KB%29.pdf' }),

  org({ id: 'kla-oss-eagle', name: '한국광복군–OSS 독수리작전망', abbreviation: 'Eagle Project', nationIds: ['korea', 'usa', 'china'], foundedYear: 1945, dissolvedYear: 1945, kind: 'resistance', predecessorIds: [], successorIds: [], formationEventId: 'secret-service-demobilization', historicalBasis: '광복군 요원을 정보·무전·파괴반으로 훈련해 한반도 침투를 준비했습니다.', doctrine: '국내침투·정보·파괴·거점확보', ethicalRisk: '작전 투입 전 종전됐으며 실제 수행하지 못한 계획을 성공작전으로 오인해서는 안 됩니다.', sourceLabel: '국사편찬위원회 · 광복군 OSS 자료', sourceUrl: urls.korea }),
  org({ id: 'kcia', name: '대한민국 중앙정보부', abbreviation: 'KCIA', nationIds: ['korea'], foundedYear: 1961, dissolvedYear: 1981, kind: 'political-police', predecessorIds: [], successorIds: [], formationEventId: 'asian-intelligence-state', historicalBasis: '군사정부 아래 대외정보와 국내정치 보안을 결합한 중앙기관으로 출범했습니다.', doctrine: '대외정보·방첩·정권보안', ethicalRisk: '정치공작·고문·인권침해와 권력집중의 역사적 위험을 명시적으로 모델링합니다.', sourceLabel: '국가기록원 · 중앙정보부 기록', sourceUrl: 'https://www.archives.go.kr/next/newsearch/listSubjectDescription.do?id=009339' }),

  org({ id: 'viet-minh-intelligence', name: '베트민 정보·연락망', abbreviation: 'Nha Tình báo', nationIds: ['vietnam', 'china'], foundedYear: 1945, kind: 'resistance', predecessorIds: [], successorIds: [], formationEventId: 'postcolonial-intelligence-services', historicalBasis: '독립운동의 지하당·연락·정찰망을 국가 군사정보 체계로 전환했습니다.', doctrine: '지역조직·침투·인민전쟁 정보', ethicalRisk: '당·군·행정의 비밀조직 결합은 반대파 권리와 사법절차를 약화할 수 있습니다.', sourceLabel: '베트남 국방부 역사자료', sourceUrl: 'https://mod.gov.vn/' }),
  org({ id: 'indonesia-bpi', name: '인도네시아 국방정보기관', abbreviation: 'BPI', nationIds: ['indonesia'], foundedYear: 1946, dissolvedYear: 1967, kind: 'foreign', predecessorIds: [], successorIds: ['bakin'], formationEventId: 'postcolonial-intelligence-services', historicalBasis: '독립전쟁기의 군·정찰망을 국가정보조직으로 통합했습니다.', doctrine: '독립전쟁 정보·외국군 동향·국내보안', ethicalRisk: '군 파벌과 정권정치가 정보판단을 왜곡할 수 있습니다.', sourceLabel: '인도네시아 국가정보원 기관사', sourceUrl: 'https://www.bin.go.id/' }),
  org({ id: 'bakin', name: '인도네시아 국가정보조정청', abbreviation: 'BAKIN', nationIds: ['indonesia'], foundedYear: 1967, dissolvedYear: 2001, kind: 'domestic', predecessorIds: ['indonesia-bpi'], successorIds: [], formationEventId: 'asian-intelligence-state', historicalBasis: '여러 군·민 정보조직을 신질서 정권의 중앙조정체계로 묶었습니다.', doctrine: '정보조정·정권안보·대외연락', ethicalRisk: '권위주의 통치·반대파 탄압·군부 이해와 결합될 위험이 큽니다.', sourceLabel: '인도네시아 국가정보원 기관사', sourceUrl: 'https://www.bin.go.id/' }),
  org({ id: 'usaaffe-guerrilla-intel', name: '필리핀 USAFFE 게릴라 정보망', abbreviation: 'USAFFE-GF', nationIds: ['philippines', 'usa'], foundedYear: 1942, dissolvedYear: 1945, kind: 'resistance', predecessorIds: [], successorIds: ['nica'], formationEventId: 'wartime-secret-war', historicalBasis: '점령지 무전·해안감시·일본군 동향·구조망을 연합군과 연결했습니다.', doctrine: '게릴라 정찰·무전·해안감시', ethicalRisk: '민간 협조자와 가족이 보복·처형 위험에 직접 노출됩니다.', sourceLabel: '미국 국립문서기록관리청 · 태평양 정보기록', sourceUrl: urls.japan }),
  org({ id: 'nica', name: '필리핀 국가정보조정청', abbreviation: 'NICA', nationIds: ['philippines'], foundedYear: 1949, kind: 'foreign', predecessorIds: ['usaaffe-guerrilla-intel'], successorIds: [], formationEventId: 'postcolonial-intelligence-services', historicalBasis: '전시 게릴라·군 정보 경험을 독립국가의 중앙 정보조정으로 전환했습니다.', doctrine: '국가정보조정·방첩·대외분석', ethicalRisk: '대통령 직속 권한과 국내 반대세력 감시를 구분하는 감독이 필요합니다.', sourceLabel: '필리핀 국가정보조정청', sourceUrl: 'https://nica.gov.ph/' }),

  org({ id: 'sim', name: '이탈리아 군사정보부', abbreviation: 'SIM', nationIds: ['italy'], foundedYear: 1925, dissolvedYear: 1949, kind: 'military', predecessorIds: [], successorIds: ['sifar'], formationEventId: 'wartime-secret-war', historicalBasis: '파시스트기 군사정보·방첩을 담당했고 휴전 뒤 왕국·공화국의 정보망 승계 문제가 생겼습니다.', doctrine: '군사정보·방첩·암호', ethicalRisk: '파시스트 정권과 전쟁범죄 연루 인력의 검증 없는 승계를 막아야 합니다.', sourceLabel: '이탈리아 국방부 역사문서', sourceUrl: 'https://www.difesa.it/' }),
  org({ id: 'sifar', name: '이탈리아 군사정보군사상황국', abbreviation: 'SIFAR', nationIds: ['italy'], foundedYear: 1949, dissolvedYear: 1965, kind: 'military', predecessorIds: ['sim'], successorIds: [], formationEventId: 'postcolonial-intelligence-services', historicalBasis: '공화국 초기 군사정보와 NATO 협력을 담당했습니다.', doctrine: '군사정보·NATO 연락·방첩', ethicalRisk: '국내 정치인 불법사찰과 비상계획의 민주적 통제가 쟁점입니다.', sourceLabel: '이탈리아 국방부', sourceUrl: 'https://www.difesa.it/' }),

  org({ id: 'mossad', name: '이스라엘 정보특수임무원', abbreviation: 'Mossad', nationIds: ['usa', 'britain', 'freefrance'], foundedYear: 1949, kind: 'foreign', predecessorIds: [], successorIds: [], formationEventId: 'postcolonial-intelligence-services', historicalBasis: '1949년 여러 정보기관의 대외활동을 조정하는 중앙기관으로 창설됐습니다.', doctrine: '대외정보·연락·특수임무', ethicalRisk: '국경 밖 비밀행동의 주권 침해·민간피해·사법절차 문제가 있습니다.', sourceLabel: '모사드 공식 기관사', sourceUrl: urls.mossad }),
];

function person(profile: IntelligenceFigure) { return profile; }

export const intelligenceFigures: IntelligenceFigure[] = [
  person({ id: 'william-donovan', name: '윌리엄 J. 도노반', birthYear: 1883, nationality: '미국', accessNations: ['usa', 'britain', 'freefrance', 'china', 'korea'], organizationIds: ['coi', 'oss'], availableFromYear: 1942, activeFromYear: 1941, office: 'COI 정보조정관·OSS 국장', specialty: '전략정보 조직·특수작전', summary: '미국 최초의 세계적 중앙 정보조직을 분석·첩보·공작 기능으로 설계했습니다.', historicalConstraint: '군·해군·FBI와 관할권 갈등이 심하고 평시기관 구상은 의회·대통령의 별도 승인이 필요합니다.', networks: ['백악관·합참', 'SOE·연합 정보망'], role: 'recruitable', ability: 94, potential: 96, loyalty: 90, influence: 98, interest: 45, availability: 'poachable', sourceLabel: 'CIA Museum · OSS', sourceUrl: 'https://www.cia.gov/legacy/museum/exhibit/the-office-of-strategic-services-n-americas-first-intelligence-agency/' }),
  person({ id: 'virginia-hall', name: '버지니아 홀', birthYear: 1906, nationality: '미국', accessNations: ['usa', 'britain', 'freefrance'], organizationIds: ['soe', 'oss', 'cia'], availableFromYear: 1942, activeFromYear: 1941, office: 'SOE F Section 현장요원·후일 OSS 요원', specialty: '저항회로 구축·탈출망·무전', summary: '프랑스에서 HECKLER와 이후 SAINT망을 조직하고 SOE·OSS·CIA 계보를 잇는 현장요원이 됐습니다.', historicalConstraint: '게슈타포 수배와 네트워크 침투 위험이 높아 공개 보직 전환은 기존 현장망을 붕괴시킬 수 있습니다.', networks: ['SOE F Section', '프랑스 레지스탕스'], role: 'recruitable', ability: 96, potential: 98, loyalty: 93, influence: 86, interest: 68, availability: 'poachable', sourceLabel: '영국 국립문서보관소 · Virginia Hall', sourceUrl: urls.soe }),
  person({ id: 'allen-dulles', name: '앨런 덜레스', birthYear: 1893, nationality: '미국', accessNations: ['usa'], organizationIds: ['oss', 'cia'], availableFromYear: 1942, activeFromYear: 1942, office: 'OSS 베른 지국장·후일 CIA 국장', specialty: '중립국 인적정보·정치연락', summary: '스위스 베른에서 독일·점령유럽 정보망을 운용하고 전후 CIA 지도부가 됐습니다.', historicalConstraint: '고위 정치·금융 인맥은 정보 접근을 높이지만 비공식 거래와 감독 회피 위험도 큽니다.', networks: ['OSS 베른', '미 외교·법률 인맥'], role: 'recruitable', ability: 92, potential: 96, loyalty: 78, influence: 96, interest: 49, availability: 'poachable', sourceLabel: 'CIA · Allen Dulles', sourceUrl: 'https://www.cia.gov/legacy/headquarters/allen-dulles-bas-relief/' }),
  person({ id: 'agnes-driscoll', name: '애그니스 메이어 드리스콜', birthYear: 1889, nationality: '미국', accessNations: ['usa', 'britain'], organizationIds: ['us-wartime-cryptologic-services', 'nsa'], availableFromYear: 1942, activeFromYear: 1918, office: '미 해군 OP-20-G 선임 암호분석가', specialty: '일본 해군 암호·암호기계', summary: '전간기와 전쟁기 미 해군 암호분석을 이끈 핵심 전문인력입니다.', historicalConstraint: '군 조직의 성별 장벽과 기관 간 인사 이동 때문에 공적·권한이 과소평가될 수 있습니다.', networks: ['미 해군 통신정보', '영미 암호협력망'], role: 'recruitable', ability: 97, potential: 97, loyalty: 95, influence: 82, interest: 70, availability: 'available', sourceLabel: 'NSA · Agnes Meyer Driscoll', sourceUrl: 'https://www.nsa.gov/History/Cryptologic-History/Historical-Figures/Historical-Figures-View/Article/1621548/agnes-meyer-driscoll/' }),
  person({ id: 'william-friedman', name: '윌리엄 F. 프리드먼', birthYear: 1891, nationality: '미국', accessNations: ['usa', 'britain'], organizationIds: ['us-wartime-cryptologic-services', 'nsa'], availableFromYear: 1942, activeFromYear: 1917, office: '미 육군 신호정보국 수석 암호학자', specialty: '암호분석·기관설계·신호정보 협력', summary: '미국 현대 암호학의 제도와 인력을 구축하고 전후 중앙 암호기관의 기반을 만들었습니다.', historicalConstraint: '과로와 보안 부담이 심하고 육군·해군 간 관할권 경쟁을 중재해야 합니다.', networks: ['육군 SIS', 'GC&CS 연락망'], role: 'recruitable', ability: 98, potential: 98, loyalty: 94, influence: 91, interest: 60, availability: 'available', sourceLabel: 'NSA · William Friedman', sourceUrl: 'https://www.nsa.gov/History/Cryptologic-History/Historical-Figures/Historical-Figures-View/Article/1621556/william-f-friedman/' }),
  person({ id: 'frank-wisner', name: '프랭크 위즈너', birthYear: 1909, nationality: '미국', accessNations: ['usa'], organizationIds: ['oss', 'cia'], availableFromYear: 1944, activeFromYear: 1944, office: 'OSS 동남유럽 작전장교·후일 OPC 책임자', specialty: '정치전·비밀행동·동유럽망', summary: 'OSS 경력을 바탕으로 전후 미국의 정치전·비밀행동 조직을 확대했습니다.', historicalConstraint: '비밀행동과 정보분석을 혼합하면 정책확증·감독실패 위험이 급격히 커집니다.', networks: ['OSS 동남유럽', 'CIA 정책조정실'], role: 'recruitable', ability: 89, potential: 94, loyalty: 80, influence: 88, interest: 58, availability: 'poachable', sourceLabel: '미국 국립문서기록관리청 · CIA 기록', sourceUrl: urls.cia }),
  person({ id: 'richard-helms', name: '리처드 헬름스', birthYear: 1913, nationality: '미국', accessNations: ['usa'], organizationIds: ['oss', 'cia'], availableFromYear: 1943, activeFromYear: 1943, office: 'OSS 비밀정보부 장교·후일 CIA 국장', specialty: '비밀정보 운영·기관관리', summary: 'OSS 유럽 정보활동을 거쳐 전후 CIA 비밀정보 부문과 기관 운영을 이끌었습니다.', historicalConstraint: '강한 비밀유지 문화는 작전보안을 높이는 대신 의회·행정부 감독과 충돌할 수 있습니다.', networks: ['OSS SI', 'CIA 작전국'], role: 'recruitable', ability: 88, potential: 95, loyalty: 84, influence: 91, interest: 62, availability: 'available', sourceLabel: '미국 국립문서기록관리청 · CIA 기록', sourceUrl: urls.cia }),

  person({ id: 'stewart-menzies', name: '스튜어트 멘지스', birthYear: 1890, nationality: '영국', accessNations: ['britain'], organizationIds: ['sis', 'gccs-gchq'], availableFromYear: 1942, activeFromYear: 1939, office: 'SIS 국장(C)', specialty: '울트라 배포·해외정보 조정', summary: '전쟁기 SIS를 지휘하고 블레츨리 파크 산출물을 최고지도부와 동맹에 배포했습니다.', historicalConstraint: '울트라의 출처를 보호하려면 작전에 정보를 사용하고도 그 이유를 숨겨야 합니다.', networks: ['SIS 해외망', 'GC&CS·전시내각'], role: 'recruitable', ability: 91, potential: 92, loyalty: 92, influence: 96, interest: 42, availability: 'poachable', sourceLabel: 'SIS 공식 기관사', sourceUrl: urls.sis }),
  person({ id: 'david-petrie', name: '데이비드 페트리', birthYear: 1879, nationality: '영국', accessNations: ['britain', 'india'], organizationIds: ['mi5'], availableFromYear: 1942, activeFromYear: 1941, office: 'MI5 국장', specialty: '방첩개혁·Double Cross 감독', summary: '초기 전시 혼란 뒤 MI5를 재정비하고 Double Cross 체계를 감독했습니다.', historicalConstraint: '인도 정보경력과 제국 보안관행은 식민지 정치감시 문제를 동반합니다.', networks: ['MI5', '인도 정보국 경력망'], role: 'recruitable', ability: 90, potential: 90, loyalty: 91, influence: 91, interest: 47, availability: 'poachable', sourceLabel: 'MI5 제2차 세계대전사', sourceUrl: urls.mi5 }),
  person({ id: 'maurice-buckmaster', name: '모리스 벅마스터', birthYear: 1902, nationality: '영국', accessNations: ['britain', 'freefrance'], organizationIds: ['soe'], availableFromYear: 1942, activeFromYear: 1941, office: 'SOE F Section 책임자', specialty: '프랑스 회로·요원 투입·보급', summary: '점령 프랑스 SOE 회로와 현장요원 파견을 지휘했습니다.', historicalConstraint: '침투된 무전망과 현장경고를 잘못 판단하면 다수 요원을 한꺼번에 잃을 수 있습니다.', networks: ['SOE F Section', '프랑스 저항회로'], role: 'recruitable', ability: 84, potential: 87, loyalty: 88, influence: 85, interest: 62, availability: 'available', sourceLabel: '영국 국립문서보관소 · SOE', sourceUrl: urls.soe }),
  person({ id: 'vera-atkins', name: '베라 앳킨스', birthYear: 1908, nationality: '영국·루마니아계', accessNations: ['britain', 'freefrance'], organizationIds: ['soe'], availableFromYear: 1942, activeFromYear: 1941, office: 'SOE F Section 정보·인사장교', specialty: '요원검증·신원관리·실종자 추적', summary: 'F Section 요원의 선발·기록·파견을 관리하고 전후 실종 요원의 행방을 추적했습니다.', historicalConstraint: '외국 출생 신분과 성별 편견 속에서 보안허가·시민권 문제가 권한을 제한합니다.', networks: ['SOE F Section', '점령유럽 요원 가족망'], role: 'recruitable', ability: 92, potential: 95, loyalty: 95, influence: 82, interest: 72, availability: 'available', sourceLabel: '영국 국립문서보관소 · SOE 인사기록', sourceUrl: urls.soe }),
  person({ id: 'noor-inayat-khan', name: '누르 이나야트 칸', birthYear: 1914, nationality: '영국·인도계', accessNations: ['britain', 'india', 'freefrance'], organizationIds: ['soe'], availableFromYear: 1943, activeFromYear: 1943, office: 'SOE F Section 무전요원', specialty: '점령지 무전·회로연락', summary: '점령 프랑스에 투입된 첫 여성 무전요원으로 무너진 회로의 런던 연락을 유지했습니다.', historicalConstraint: '무전 송신은 방향탐지 위험이 극도로 높고 철수명령과 현장 책임 사이 선택을 요구합니다.', networks: ['SOE F Section', 'Prosper·Cinema 회로'], role: 'recruitable', ability: 90, potential: 95, loyalty: 98, influence: 78, interest: 74, availability: 'available', sourceLabel: '영국 국립문서보관소 · Noor Khan', sourceUrl: 'https://www.nationalarchives.gov.uk/education/resources/who-was-noor-khan/' }),
  person({ id: 'juan-pujol-garcia', name: '후안 푸홀 가르시아', birthYear: 1912, nationality: '스페인', accessNations: ['britain'], organizationIds: ['mi5'], availableFromYear: 1942, activeFromYear: 1941, office: 'MI5 Double Cross 요원 GARBO', specialty: '가상 요원망·전략기만', summary: '독일이 믿는 가공의 영국 내 요원망을 만들어 노르망디 상륙 기만에 기여했습니다.', historicalConstraint: '이중 신뢰가 무너지면 기만체계 전체와 가족 안전이 동시에 위험해집니다.', networks: ['MI5 B1A', '아브베어 마드리드망'], role: 'double-agent', ability: 97, potential: 98, loyalty: 91, influence: 86, interest: 80, availability: 'poachable', sourceLabel: 'MI5 · Double Cross', sourceUrl: urls.mi5 }),
  person({ id: 'kim-philby', name: '킴 필비', birthYear: 1912, nationality: '영국', accessNations: ['britain', 'ussr'], organizationIds: ['sis'], availableFromYear: 1942, activeFromYear: 1940, office: 'SIS 방첩부 장교·소련 비밀요원', specialty: '방첩 침투·이중보고', summary: 'SIS 안에서 승진하며 소련에 정보를 제공한 Cambridge Five의 핵심 침투요원이었습니다.', historicalConstraint: '높은 능력과 상류층 신뢰가 실제 충성위험을 가립니다. 영입 시 공개되지 않은 이중요원 위험을 가집니다.', networks: ['SIS Section V', '소련 정보망'], role: 'double-agent', ability: 94, potential: 96, loyalty: 18, influence: 90, interest: 76, availability: 'poachable', sourceLabel: 'MI5 전쟁사 · Cambridge Five', sourceUrl: 'https://www.mi5.gov.uk/history/world-war-ii/mi5-in-world-war-ii' }),

  person({ id: 'pavel-fitin', name: '파벨 피틴', birthYear: 1907, nationality: '소련', accessNations: ['ussr'], organizationIds: ['nkvd'], availableFromYear: 1942, activeFromYear: 1939, office: 'NKVD 해외정보 책임자', specialty: '해외요원망·전략정보 평가', summary: '전쟁기 소련 해외정보를 이끌며 독일 의도와 연합국 과학·정책 정보를 수집했습니다.', historicalConstraint: '정치지도부가 불편한 분석을 거부할 수 있고 기관 숙청이 요원망의 전문성을 위협합니다.', networks: ['NKVD 제1총국', '유럽·미주 불법망'], role: 'recruitable', ability: 91, potential: 93, loyalty: 86, influence: 88, interest: 55, availability: 'poachable', sourceLabel: '미국 국립문서기록관리청 · 정보기록', sourceUrl: urls.cia }),
  person({ id: 'iskhak-akhmerov', name: '이스하크 아흐메로프', birthYear: 1901, nationality: '소련', accessNations: ['ussr'], organizationIds: ['nkvd'], availableFromYear: 1942, activeFromYear: 1934, office: 'NKVD 미국 불법주재 책임자', specialty: '불법신분망·정치정보', summary: '공식 외교신분 밖의 미국 내 정보망을 장기간 운영했습니다.', historicalConstraint: '연락망 집중은 생산성을 높이지만 한 번의 배신·감청으로 전체 네트워크가 붕괴할 수 있습니다.', networks: ['NKVD 뉴욕 불법망', '미국 내 이념협력자'], role: 'recruitable', ability: 93, potential: 94, loyalty: 90, influence: 79, interest: 63, availability: 'available', sourceLabel: '미국 국립문서기록관리청 · 냉전 정보기록', sourceUrl: urls.cia }),
  person({ id: 'lavrentiy-beria', name: '라브렌티 베리야', birthYear: 1899, nationality: '소련', accessNations: ['ussr'], organizationIds: ['nkvd'], availableFromYear: 1942, activeFromYear: 1938, office: 'NKVD 인민위원', specialty: '강제기관 통제·원자계획 보안', summary: 'NKVD와 전시 후방통제, 이후 원자계획을 감독한 최고권력자였습니다.', historicalConstraint: '대숙청·강제이주·고문·처형에 책임이 있는 가해자로 영입 대상이 아닌 권력위협으로만 등장합니다.', networks: ['NKVD 지도부', '국가방위위원회'], role: 'perpetrator', ability: 88, potential: 88, loyalty: 42, influence: 100, interest: 0, availability: 'opposition', sourceLabel: '미국 국립문서기록관리청 · 정보기록', sourceUrl: urls.cia }),
  person({ id: 'markus-wolf', name: '마르쿠스 볼프', birthYear: 1923, nationality: '동독', accessNations: ['germany', 'ussr'], organizationIds: ['stasi'], availableFromYear: 1952, activeFromYear: 1952, office: '동독 해외정보기관 책임자', specialty: '서독 침투·장기 인적정보', summary: '1952년부터 동독 해외정보를 장기간 지휘했습니다.', historicalConstraint: '당국가 감시체계와 해외침투 성과를 분리할 수 없으며 민주적 감독과 양립하기 어렵습니다.', networks: ['HVA', '소련 국가보안 연락망'], role: 'rival', ability: 94, potential: 96, loyalty: 91, influence: 92, interest: 15, availability: 'opposition', sourceLabel: '슈타지 문서보관소 · Markus Wolf', sourceUrl: 'https://www.stasi-mediathek.de/medien/geheimdienstliches-informationsinteresse-an-markus-wolf/' }),

  person({ id: 'wilhelm-canaris', name: '빌헬름 카나리스', birthYear: 1887, nationality: '독일', accessNations: ['germany'], organizationIds: ['abwehr'], availableFromYear: 1942, activeFromYear: 1935, office: '아브베어 국장', specialty: '군사정보·중립국 연락', summary: '국방군 정보기관을 지휘하면서 일부 반히틀러 인맥과도 연결됐습니다.', historicalConstraint: '조직은 점령전쟁에 복무했고 반나치 접촉과 정권 임무가 뒤섞여 충성·책임을 단순 영웅화할 수 없습니다.', networks: ['OKW 아브베어', '군부 반히틀러 인맥'], role: 'rival', ability: 88, potential: 89, loyalty: 43, influence: 94, interest: 22, availability: 'opposition', sourceLabel: '독일 연방문서보관소 · Abwehr', sourceUrl: urls.bnd }),
  person({ id: 'reinhard-gehlen', name: '라인하르트 게엘렌', birthYear: 1902, nationality: '독일', accessNations: ['germany', 'usa'], organizationIds: ['gehlen-org', 'bnd'], availableFromYear: 1946, activeFromYear: 1942, office: '동부외국군과장·후일 게엘렌 조직/BND 수장', specialty: '소련 군사정보·망명자망', summary: '동부전선 자료와 인맥을 미국에 제공해 전후 서독 정보기관의 전신을 만들었습니다.', historicalConstraint: '나치 경력자와 전범 혐의 인력의 재활용, 정보 신뢰성, 소련 침투 문제가 조직 전체를 오염시켰습니다.', networks: ['Fremde Heere Ost', '미 육군·CIA 연락망'], role: 'rival', ability: 89, potential: 92, loyalty: 61, influence: 94, interest: 31, availability: 'opposition', sourceLabel: '독일 연방문서보관소 · 게엘렌 조직', sourceUrl: urls.bnd }),
  person({ id: 'heinrich-muller', name: '하인리히 뮐러', birthYear: 1900, nationality: '독일', accessNations: ['germany'], organizationIds: ['rsha'], availableFromYear: 1942, activeFromYear: 1939, office: '게슈타포 수장·RSHA Amt IV 책임자', specialty: '정치경찰·강압수사·박해조직', summary: '게슈타포를 지휘하며 유대인 deportation과 정치적 박해를 실행했습니다.', historicalConstraint: '홀로코스트와 고문·강제수용에 책임이 있는 가해자로 영입 대상이 아닌 제거·기소 대상입니다.', networks: ['게슈타포', 'RSHA·SS 경찰망'], role: 'perpetrator', ability: 82, potential: 82, loyalty: 86, influence: 96, interest: 0, availability: 'opposition', sourceLabel: '미국 홀로코스트기념박물관 · Gestapo', sourceUrl: urls.gestapo }),

  person({ id: 'andre-dewavrin', name: '앙드레 드와브랭(파시)', birthYear: 1911, nationality: '프랑스', accessNations: ['freefrance', 'britain'], organizationIds: ['bcra', 'sdece'], availableFromYear: 1942, activeFromYear: 1940, office: 'BCRA 책임자', specialty: '저항정보·행동조직 설계', summary: '자유프랑스의 정보·공작·저항연락 체계를 창설했습니다.', historicalConstraint: '드골파·비드골파 저항조직의 대표권 경쟁과 영국 기관 의존을 조정해야 합니다.', networks: ['BCRA', '국내 레지스탕스·SOE'], role: 'recruitable', ability: 93, potential: 96, loyalty: 94, influence: 91, interest: 59, availability: 'available', sourceLabel: 'DGSE · André Dewavrin', sourceUrl: urls.france }),
  person({ id: 'marie-madeleine-fourcade', name: '마리마들렌 푸르카드', birthYear: 1909, nationality: '프랑스', accessNations: ['freefrance', 'britain'], organizationIds: ['bcra'], availableFromYear: 1942, activeFromYear: 1941, office: 'Alliance 정보망 책임자', specialty: '점령지 군사정보·장거리망 관리', summary: '프랑스 최대급 저항 정보망 Alliance를 이끈 여성 지도자였습니다.', historicalConstraint: '광범위한 셀과 가족 단위 연락은 정보량을 높이지만 침투 시 연쇄체포 위험도 큽니다.', networks: ['Alliance réseau', '영국 SIS 연락망'], role: 'recruitable', ability: 94, potential: 96, loyalty: 96, influence: 88, interest: 76, availability: 'available', sourceLabel: '프랑스 국방부 · 레지스탕스 기억자료', sourceUrl: 'https://www.cheminsdememoire.gouv.fr/' }),
  person({ id: 'jacques-soustelle', name: '자크 수스텔', birthYear: 1912, nationality: '프랑스', accessNations: ['freefrance'], organizationIds: ['bcra'], availableFromYear: 1943, activeFromYear: 1943, office: '자유프랑스 정보·행동기관 책임자', specialty: '망명정부 정보조정·정치연락', summary: '자유프랑스 특수기관을 조정하고 전후 정보행정의 핵심 인물이 됐습니다.', historicalConstraint: '이후 알제리 문제의 강경노선처럼 정치적 신념이 기관 임무를 압도할 수 있습니다.', networks: ['자유프랑스 런던·알제', '라틴아메리카 외교망'], role: 'recruitable', ability: 87, potential: 92, loyalty: 79, influence: 88, interest: 66, availability: 'available', sourceLabel: 'DGSE · 자유프랑스 정보기관 유산', sourceUrl: urls.france }),

  person({ id: 'dai-li', name: '다이리(戴笠)', birthYear: 1897, nationality: '중국', accessNations: ['china'], organizationIds: ['juntong'], availableFromYear: 1942, activeFromYear: 1932, office: '군통 책임자', specialty: '대일정보·파괴공작·정치경찰', summary: '대일 첩보와 중미특종기술합작소를 확대하는 동시에 국내 탄압을 수행했습니다.', historicalConstraint: '항일 성과와 고문·암살·정치탄압의 책임을 분리할 수 없어 경쟁 권력·윤리위기로 모델링합니다.', networks: ['군통', 'SACO·미 해군 연락망'], role: 'rival', ability: 91, potential: 91, loyalty: 88, influence: 98, interest: 18, availability: 'opposition', sourceLabel: '중국 국방부 · 군통사', sourceUrl: urls.china }),
  person({ id: 'li-kenong', name: '리커눙(李克农)', birthYear: 1899, nationality: '중국', accessNations: ['china'], organizationIds: ['cpc-social-affairs'], availableFromYear: 1942, activeFromYear: 1929, office: '중공 정보·통일전선 책임간부', specialty: '침투·방첩·협상정보', summary: '국민정부 내부 침투와 항일전쟁기 통일전선 정보활동을 조정했습니다.', historicalConstraint: '당 비밀망의 보안은 강하지만 다른 정파·민간기관과 권한 공유가 어렵습니다.', networks: ['중공 중앙사회부', '국민정부 내부 비밀망'], role: 'recruitable', ability: 95, potential: 96, loyalty: 96, influence: 90, interest: 55, availability: 'poachable', sourceLabel: '중국 국방부 · 정보전 인물사', sourceUrl: urls.china }),
  person({ id: 'pan-hannian', name: '판한녠(潘汉年)', birthYear: 1906, nationality: '중국', accessNations: ['china'], organizationIds: ['cpc-social-affairs'], availableFromYear: 1942, activeFromYear: 1930, office: '상하이 지하정보·통일전선 책임자', specialty: '점령도시 침투·정치연락', summary: '상하이와 홍콩의 지하망·문화인·상업인 연락을 활용했습니다.', historicalConstraint: '점령당국·협력정부와의 비밀접촉은 작전상 필요해도 훗날 반역 혐의로 뒤집힐 수 있습니다.', networks: ['상하이 지하당', '문화·상업 연락망'], role: 'recruitable', ability: 94, potential: 95, loyalty: 88, influence: 84, interest: 69, availability: 'available', sourceLabel: '중국 국방부 · 정보조직사', sourceUrl: urls.china }),

  person({ id: 'takeo-yoshikawa', name: '요시카와 다케오', birthYear: 1912, nationality: '일본', accessNations: ['japan'], organizationIds: ['kempeitai'], availableFromYear: 1942, activeFromYear: 1941, office: '호놀룰루 총영사관 해군정보원', specialty: '항만정찰·해군정보', summary: '외교 위장 아래 진주만 함대 배치와 항만 정보를 수집했습니다.', historicalConstraint: '외교공관의 정보활동은 발각 시 중립·외교신뢰를 붕괴시키며 전략판단 오류도 교정하지 못합니다.', networks: ['일본 해군정보부', '호놀룰루 총영사관'], role: 'rival', ability: 85, potential: 88, loyalty: 90, influence: 70, interest: 26, availability: 'opposition', sourceLabel: '미국 국립문서기록관리청 · 일본 정보기록', sourceUrl: urls.japan }),
  person({ id: 'takagi-sokichi', name: '다카기 소키치', birthYear: 1893, nationality: '일본', accessNations: ['japan'], organizationIds: ['japanese-naval-intelligence'], availableFromYear: 1942, activeFromYear: 1941, office: '일본 해군성 조사과 장교', specialty: '전쟁분석·정치정보·종전공작', summary: '해군 내부에서 전황과 국력을 분석하고 후반기 비밀 종전·반도조 인맥에 관여했습니다.', historicalConstraint: '해군 조직 충성과 전쟁종결 구상이 충돌하며 육군 헌병의 감시를 받습니다.', networks: ['해군성 조사과', '반도조·종전 인맥'], role: 'recruitable', ability: 89, potential: 91, loyalty: 67, influence: 83, interest: 62, availability: 'poachable', sourceLabel: '일본 국립국회도서관 근대인물자료', sourceUrl: 'https://www.ndl.go.jp/portrait/e/' }),

  person({ id: 'rn-kao', name: 'R. N. 카오', birthYear: 1918, nationality: '인도', accessNations: ['india'], organizationIds: ['india-ib', 'raw'], availableFromYear: 1947, activeFromYear: 1947, office: '인도 정보국 장교·후일 R&AW 초대 책임자', specialty: '항공사건 조사·대외정보 조직', summary: '독립 직후 정보국에 들어가 후일 인도 대외정보기관 창설을 이끌었습니다.', historicalConstraint: '1942년에는 아직 기관 경력이 없으므로 독립과 국가기관 창설 뒤에만 등장합니다.', networks: ['인도 정보국', 'R&AW 창설인맥'], role: 'recruitable', ability: 90, potential: 97, loyalty: 92, influence: 88, interest: 72, availability: 'available', sourceLabel: '인도 정부 · 정보기관 목록', sourceUrl: 'https://nehruportal.nic.in/sites/default/files/Proactive%20Disclosure%20%28389KB%29.pdf' }),
  person({ id: 'bhagat-ram-talwar', name: '바가트 람 탈와르', birthYear: 1908, nationality: '인도', accessNations: ['india', 'britain', 'ussr'], organizationIds: ['soe', 'india-ib'], availableFromYear: 1942, activeFromYear: 1941, office: '북서부 국경 다중첩자', specialty: '다중기만·국경연락·허위정보', summary: '여러 국가 정보기관과 접촉하며 추축국에 허위정보를 제공한 복합적 다중요원이었습니다.', historicalConstraint: '실제 충성과 보고선이 여러 겹이라 높은 정보량만으로 신뢰를 판단할 수 없습니다.', networks: ['북서부 국경 혁명망', '영국·소련 연락선'], role: 'double-agent', ability: 95, potential: 96, loyalty: 46, influence: 78, interest: 82, availability: 'poachable', sourceLabel: '영국 국립문서보관소 · 전시 정보기록', sourceUrl: 'https://www.nationalarchives.gov.uk/' }),

  person({ id: 'kim-junyeop', name: '김준엽', birthYear: 1923, nationality: '조선', accessNations: ['korea', 'china', 'usa'], organizationIds: ['kla-oss-eagle'], availableFromYear: 1945, activeFromYear: 1944, office: '한국광복군 제2지대·국내정진대원', specialty: '일본군 탈출·국내침투 준비·통역', summary: '학병에서 탈출해 광복군에 합류하고 OSS 연계 국내진입 준비에 참여했습니다.', historicalConstraint: '1945년 이전에는 해당 경력과 훈련이 성립하지 않으므로 조기 영입할 수 없습니다.', networks: ['광복군 제2지대', 'OSS 중국전구'], role: 'recruitable', ability: 82, potential: 94, loyalty: 96, influence: 72, interest: 88, availability: 'available', sourceLabel: '국사편찬위원회 · 임시정부 사진자료', sourceUrl: urls.koreaPeople }),
  person({ id: 'jang-junha', name: '장준하', birthYear: 1918, nationality: '조선', accessNations: ['korea', 'china', 'usa'], organizationIds: ['kla-oss-eagle'], availableFromYear: 1945, activeFromYear: 1944, office: '한국광복군·국내정진대원', specialty: '탈출·선전·국내진입 준비', summary: '일본군을 탈출해 광복군에 합류하고 국내정진대 활동을 준비했습니다.', historicalConstraint: '광복 이후의 민주화 활동을 전시 정보능력과 동일시하지 않으며, 독립군 정통성과 외국군 지휘권 사이 갈등이 있습니다.', networks: ['광복군 제2지대', '임시정부 청년망'], role: 'recruitable', ability: 84, potential: 95, loyalty: 94, influence: 78, interest: 86, availability: 'available', sourceLabel: '국사편찬위원회 · 임시정부 사진자료', sourceUrl: urls.koreaPeople }),
  person({ id: 'tae-yungi', name: '태윤기', birthYear: 1918, nationality: '조선', accessNations: ['korea', 'usa', 'china'], organizationIds: ['kla-oss-eagle'], availableFromYear: 1945, activeFromYear: 1945, office: '광복군 OSS 정보·파괴반 훈련요원', specialty: '정보·파괴·함경도 침투', summary: 'OSS 특수훈련을 받고 국내정진군 함경도반 투입을 준비했습니다.', historicalConstraint: '실제 침투 전에 종전됐으므로 계획상의 능력을 실전 성과로 과장하지 않습니다.', networks: ['광복군 제2지대', 'OSS 정보·파괴반'], role: 'recruitable', ability: 80, potential: 91, loyalty: 97, influence: 65, interest: 92, availability: 'available', sourceLabel: '국가보훈부 · 태윤기 공훈기록', sourceUrl: 'https://315.mpva.go.kr/english/selectBbsNttView.do?bbsNo=212&integrDeptCode=&key=992&nttNo=54340&pageIndex=1&searchCnd=all&searchCtgry=&searchKrwd=' }),
  person({ id: 'choi-munsik', name: '최문식', birthYear: 1914, nationality: '조선', accessNations: ['korea', 'usa', 'china'], organizationIds: ['kla-oss-eagle'], availableFromYear: 1945, activeFromYear: 1942, office: '광복군 지하공작·OSS 정보파괴반 요원', specialty: '점령지 정보·초모·국내침투', summary: '점령지 정보수집과 초모활동 뒤 OSS 정보·파괴반 훈련을 받았습니다.', historicalConstraint: '지하공작 거점과 가족·협조자의 안전을 우선하지 않으면 네트워크가 붕괴합니다.', networks: ['광복군 제2지대', 'OSS Eagle Project'], role: 'recruitable', ability: 85, potential: 92, loyalty: 97, influence: 67, interest: 91, availability: 'available', sourceLabel: '국가보훈부 · 최문식 공훈기록', sourceUrl: 'https://e-gonghun.mpva.go.kr/user/ContribuReportDetail.do?goTocode=20001&mngNo=8251&pageTitle=Report' }),

  person({ id: 'tran-hieu', name: '쩐히에우(Trần Hiệu)', birthYear: 1914, nationality: '베트남', accessNations: ['vietnam'], organizationIds: ['viet-minh-intelligence'], availableFromYear: 1945, activeFromYear: 1945, office: '베트남 민주공화국 초기 정보책임자', specialty: '항불 정보망·국가기관 창설', summary: '혁명정부 초기 군사·정치 정보조직의 창설을 주도했습니다.', historicalConstraint: '1945년 독립정부 형성 이전에는 국가기관 권한이 없고 지역 당조직과 군 지휘권 조정이 필요합니다.', networks: ['베트민', '초기 베트남 정보기관'], role: 'recruitable', ability: 87, potential: 94, loyalty: 94, influence: 80, interest: 82, availability: 'available', sourceLabel: '베트남 국방부', sourceUrl: 'https://mod.gov.vn/' }),
  person({ id: 'pham-ngoc-thao', name: '팜응옥타오', birthYear: 1922, nationality: '베트남', accessNations: ['vietnam'], organizationIds: ['viet-minh-intelligence'], availableFromYear: 1954, activeFromYear: 1945, office: '베트민 경력의 남베트남 침투장교', specialty: '장기침투·정치군사 공작', summary: '혁명망 경력을 숨기고 남베트남 군·정치권 깊숙이 진입한 장기 침투인물이었습니다.', historicalConstraint: '능력과 충성의 방향이 공개 소속과 다르며 쿠데타 정치가 민간피해·국가붕괴를 키울 수 있습니다.', networks: ['베트민 지하망', '남베트남 군부'], role: 'double-agent', ability: 93, potential: 95, loyalty: 88, influence: 86, interest: 70, availability: 'poachable', sourceLabel: '베트남 국방부 역사자료', sourceUrl: 'https://mod.gov.vn/' }),

  person({ id: 'zulkifli-lubis', name: '줄키플리 루비스', birthYear: 1923, nationality: '인도네시아', accessNations: ['indonesia'], organizationIds: ['indonesia-bpi'], availableFromYear: 1945, activeFromYear: 1944, office: '인도네시아 독립군 정보조직 창설자', specialty: '독립전쟁 정보·기관조직', summary: '일본군 정보교육 경력을 독립공화국의 군사정보 조직에 전환했습니다.', historicalConstraint: '점령군 훈련 경력과 독립운동 충성, 군 파벌정치가 함께 검증되어야 합니다.', networks: ['PETA·독립군', '공화국 군사정보망'], role: 'recruitable', ability: 87, potential: 94, loyalty: 82, influence: 83, interest: 79, availability: 'available', sourceLabel: '인도네시아 국가정보원', sourceUrl: 'https://www.bin.go.id/' }),

  person({ id: 'charles-parsons', name: '찰스 파슨스', birthYear: 1902, nationality: '미국·필리핀 거주', accessNations: ['philippines', 'usa'], organizationIds: ['usaaffe-guerrilla-intel'], availableFromYear: 1942, activeFromYear: 1942, office: '필리핀 잠수함 보급·정보연락 책임자', specialty: '게릴라 보급·잠수함 연락·점령지 정보', summary: '민간인 위장을 활용해 필리핀 게릴라와 연합군 잠수함 보급·정보선을 연결했습니다.', historicalConstraint: '가족과 민간 위장, 점령지 협조자망이 발각되면 광범위한 보복을 받습니다.', networks: ['필리핀 게릴라망', '미 해군 잠수함 연락선'], role: 'recruitable', ability: 93, potential: 95, loyalty: 94, influence: 82, interest: 83, availability: 'available', sourceLabel: '미국 국립문서기록관리청 · 태평양 정보기록', sourceUrl: urls.japan }),
  person({ id: 'jesus-villamor', name: '헤수스 비야모르', birthYear: 1914, nationality: '필리핀', accessNations: ['philippines', 'usa'], organizationIds: ['usaaffe-guerrilla-intel'], availableFromYear: 1943, activeFromYear: 1942, office: '필리핀 육군항공대 장교·연합 정보요원', specialty: '잠수함 침투·게릴라 연락·정찰', summary: '점령 필리핀에 잠수함으로 침투해 저항조직과 연합군 지휘부를 연결했습니다.', historicalConstraint: '서로 경쟁하는 게릴라 지휘관의 신뢰·무전보안·보급 우선순위를 동시에 조정해야 합니다.', networks: ['필리핀 저항군', 'SWPA 연합정보망'], role: 'recruitable', ability: 91, potential: 94, loyalty: 96, influence: 84, interest: 84, availability: 'available', sourceLabel: '필리핀 공군 역사자료', sourceUrl: 'https://www.paf.mil.ph/' }),
  person({ id: 'valeria-panlilio', name: '발레리아 파늘릴리오', birthYear: 1913, nationality: '필리핀계 미국', accessNations: ['philippines', 'usa'], organizationIds: ['usaaffe-guerrilla-intel'], availableFromYear: 1942, activeFromYear: 1942, office: 'Marking 게릴라 정보·선전 책임자', specialty: '점령지 정보·게릴라 행정·선전', summary: '필리핀 최대급 게릴라 조직에서 정보·선전·행정 연락을 담당했습니다.', historicalConstraint: '성별·출신 편견과 게릴라 파벌 경쟁이 공식 지휘권을 약화시킬 수 있습니다.', networks: ['Marking’s Guerrillas', '민간 정보·보급망'], role: 'recruitable', ability: 88, potential: 93, loyalty: 95, influence: 82, interest: 86, availability: 'available', sourceLabel: '미국 국립문서기록관리청 · 필리핀 게릴라 기록', sourceUrl: urls.japan }),

  person({ id: 'cesare-ame', name: '체사레 아메', birthYear: 1892, nationality: '이탈리아', accessNations: ['italy'], organizationIds: ['sim'], availableFromYear: 1942, activeFromYear: 1940, office: '이탈리아 군사정보부(SIM) 책임자', specialty: '군사정보 조정·방첩·암호정보', summary: '1940~1943년 SIM을 지휘하며 군별로 분산된 해외정보와 방첩의 조정을 시도했습니다.', historicalConstraint: '파시스트 침략전쟁을 지원한 기관의 책임자이며 군별 정보경쟁, 정권 충성, 민간인 피해와 인력 검증 문제가 임명 정통성을 크게 낮춥니다.', networks: ['SIM 중앙부', '이탈리아 육·해·공군 정보부'], role: 'recruitable', ability: 88, potential: 90, loyalty: 72, influence: 89, interest: 55, availability: 'poachable', sourceLabel: '이탈리아 카라비니에리 역사보 · 1940~43년 SIM 책임자', sourceUrl: 'https://www.carabinieri.it/docs/default-source/editoria/notiziariostorico/notiziario-2018-2.pdf?sfvrsn=c5a44b23_2' }),

  person({ id: 'reuven-shiloah', name: '레우벤 실로아', birthYear: 1909, nationality: '이스라엘', accessNations: ['usa', 'britain', 'freefrance'], organizationIds: ['mossad'], availableFromYear: 1949, activeFromYear: 1931, office: '모사드 초대 책임자', specialty: '기관조정·중동 정치정보·비밀외교', summary: '여러 정보기관의 해외활동을 조정하는 모사드 창설을 제안하고 이끌었습니다.', historicalConstraint: '국가 창설·전쟁·난민 위기 속 비밀외교와 특수행동의 법적 경계가 불안정합니다.', networks: ['유대기구 정치부', '서방 정보기관 연락망'], role: 'recruitable', ability: 91, potential: 94, loyalty: 93, influence: 91, interest: 63, availability: 'poachable', sourceLabel: '모사드 공식 기관사', sourceUrl: urls.mossad }),
];

const variantYearShift: Record<string, number> = { historical: 0, institutional: 1, transformative: -1 };

export function resolveIntelligenceHistory(timeline: GeneratedWorldEvent[]): ResolvedIntelligenceOrganization[] {
  const variants = new Map(timeline.map((entry) => [entry.event.id, entry.variant]));
  return intelligenceOrganizations.map((organization) => {
    const variant = variants.get(organization.formationEventId);
    const variantId = variant?.id ?? 'historical';
    const displayName = organization.variantNames?.[variantId as 'historical' | 'institutional' | 'transformative'] ?? organization.name;
    const appearanceYear = Math.max(organization.foundedYear - 2, organization.foundedYear + (variantYearShift[variantId] ?? 0));
    const figures = intelligenceFigures.filter((figure) => figure.organizationIds.includes(organization.id));
    return {
      ...organization,
      displayName,
      appearanceYear,
      variantId,
      variantTitle: variant?.title ?? '기준 역사 기관',
      alternateEffect: variant?.consequence ?? organization.doctrine,
      figures,
    };
  }).sort((left, right) => left.appearanceYear - right.appearanceYear || left.name.localeCompare(right.name, 'ko-KR'));
}

export function getEmergentIntelligenceFigures(nationId: NationId, year: number, timeline: GeneratedWorldEvent[] = []) {
  const availableOrganizations = new Set(resolveIntelligenceHistory(timeline)
    .filter((organization) => organization.appearanceYear <= year && (!organization.dissolvedYear || organization.dissolvedYear >= year))
    .map((organization) => organization.id));
  return intelligenceFigures.filter((figure) => (
    figure.role !== 'perpetrator'
    && figure.accessNations.includes(nationId)
    && figure.availableFromYear <= year
    && figure.organizationIds.some((organizationId) => availableOrganizations.has(organizationId))
  ));
}

export function createEmergentIntelligenceCandidates(nationId: NationId, year: number, timeline: GeneratedWorldEvent[] = []): StaffCandidate[] {
  return getEmergentIntelligenceFigures(nationId, year, timeline).map((figure, index) => ({
    id: `${nationId}-intelligence-candidate-${figure.id}`,
    personId: `intel-${figure.id}`,
    name: figure.name,
    role: figure.role === 'double-agent' ? '특별검증 대상 정보고문' : '정보기관·비밀공작 고문',
    historicalOffice: figure.office,
    affiliation: figure.organizationIds.map((id) => intelligenceOrganizations.find((organization) => organization.id === id)?.abbreviation ?? id).join(' · '),
    summary: figure.summary,
    department: 'personnel',
    ability: figure.ability,
    potential: figure.potential,
    loyalty: figure.loyalty,
    weeklyCost: 6 + Math.floor(figure.ability / 16),
    signingCost: 52 + figure.ability + Math.round(figure.influence * 0.7),
    interest: figure.interest,
    knowledge: 12 + (index % 7) * 6,
    status: 'unscouted',
    specialty: figure.specialty,
    influence: figure.influence,
    relationship: 5 + (index % 5) * 3,
    rivalInterest: Math.max(16, figure.influence - 52),
    availability: figure.role === 'rival' ? 'opposition' : figure.availability,
    lastApproachWeek: null,
    discipline: 'intelligence',
    birthYear: figure.birthYear,
    nationality: figure.nationality,
    wartimeLocation: `${figure.activeFromYear}년부터 활동`,
    historicalConstraint: figure.historicalConstraint,
    expertise: [figure.specialty, ...figure.networks],
    networks: figure.networks,
    friction: figure.role === 'double-agent' ? '이중 충성·방첩 검증 위험' : '기관 관할권·비밀유지·정치적 감독',
    appointmentEffect: '정보망 +4/주 · 작전 노출 위험 -5% · 인사부 업무량 +6',
    sourceLabel: figure.sourceLabel,
    sourceUrl: figure.sourceUrl,
  }));
}
