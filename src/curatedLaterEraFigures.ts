import type { PersonnelDiscipline } from './types';

export interface CuratedLaterEraDossier {
  qid: string;
  discipline: PersonnelDiscipline;
  historicalEntryYear: number;
  role: string;
  affiliation: string;
  summary: string;
  historicalConstraint: string;
  expertise: [string, string, string];
  networks: [string, string, string];
  friction: string;
  appointmentEffect: string;
  sourceLabel: string;
  sourceUrl: string;
  relatedEventIds: string[];
}

const dossier = (
  qid: string,
  discipline: PersonnelDiscipline | 'political',
  role: string,
  affiliation: string,
  summary: string,
  expertise: [string, string, string],
  networks: [string, string, string],
  friction: string,
  appointmentEffect: string,
  sourceLabel: string,
  sourceUrl: string,
  relatedEventIds: string[],
): CuratedLaterEraDossier => ({
  qid,
  discipline: discipline === 'political'
    ? ({ Q7416: 'economics', Q76167: 'social-science' } as Partial<Record<string, PersonnelDiscipline>>)[qid] ?? 'diplomacy'
    : discipline,
  historicalEntryYear: ({
    Q8027: 1955, Q1615: 1962, Q7327: 1960, Q462843: 1969, Q80: 1989, Q132489: 1959,
    Q41914: 1971, Q1253: 1970, Q2518: 1959, Q567: 1978, Q30487: 1985, Q34453: 1976,
    Q7416: 1959, Q17714: 1966, Q5284: 1975, Q19837: 1976, Q1480: 1983, Q215351: 1950,
    Q6761526: 1986, Q76156: 1965, Q76167: 1971, Q165210: 1954, Q242651: 1979, Q310913: 1964,
    Q446909: 1969,
  } as Record<string, number>)[qid],
  role,
  affiliation,
  summary,
  historicalConstraint: '신원·경력·업적은 연결 사료를 기준으로 한다. 게임 속 조기 등장, 다른 국가에서의 임명, 충성도와 정책 효과는 플레이가 만든 대체역사이며 실제 인물에 대한 평가가 아니다.',
  expertise,
  networks,
  friction,
  appointmentEffect,
  sourceLabel,
  sourceUrl,
  relatedEventIds,
});

export const curatedLaterEraDossiers: readonly CuratedLaterEraDossier[] = [
  dossier('Q8027', 'social-science', '비폭력 시민동원 고문', '미국 민권운동 연합', '마틴 루터 킹 주니어는 인종분리 철폐와 투표권 확대를 요구한 비폭력 민권운동의 핵심 지도자였다.', ['비폭력 대중동원', '연설·연합정치', '민권 입법 압력'], ['남부기독교지도회의', '워싱턴 행진 연합', '종교·노동·학생 조직'], '점진적 입법파와 직접행동파, 연방정부와 지방 권력 사이의 전략 충돌', '정당성 높은 시민행동과 권리개혁 분기를 열지만 강경 진압 위험도 함께 높입니다.', '미국 국립문서기록관리청 · 워싱턴 행진', 'https://www.archives.gov/milestone-documents/official-program-for-the-march-on-washington', ['civil-rights-march-1963']),
  dossier('Q1615', 'engineering', '유인우주비행 작전고문', '미국 우주비행사단', '닐 암스트롱은 시험비행사와 제미니 8호 지휘관을 거쳐 아폴로 11호에서 최초로 달에 발을 디딘 우주비행사였다.', ['시험비행', '궤도 랑데부', '유인 달착륙'], ['NASA 우주비행사단', '시험조종사 공동체', '아폴로 계획'], '안전 중심의 비행 판단과 정치적 일정 압박의 충돌', '유인 우주계획의 신뢰도와 임무 회복력을 높이며 상징적 국위 분기를 엽니다.', 'NASA · Apollo 11', 'https://www.nasa.gov/mission/apollo-11/', ['lunar-program-human-factor']),
  dossier('Q7327', 'engineering', '우주비행단 창설고문', '소련 우주비행사단', '유리 가가린은 1961년 보스토크 1호로 지구 궤도를 비행한 최초의 인간이었다.', ['우주비행사 선발', '궤도비행 운용', '대중 상징외교'], ['소련 공군', '보스토크 계획', '국제 우주외교'], '선전 일정과 비행 안전, 군 비밀주의 사이의 충돌', '최초 기록 경쟁과 우주외교를 강화하지만 실패 은폐의 제도적 위험도 만듭니다.', 'NASA · Yuri Gagarin', 'https://www.nasa.gov/image-article/yuri-gagarin-first-human-space/', ['first-human-orbit-1961']),
  dossier('Q462843', 'medicine', '전통지식 기반 의약연구 총괄', '중국 중의과학원 항말라리아 연구망', '투유유는 고문헌에서 얻은 단서를 저온 추출법과 임상 검증으로 연결해 아르테미시닌 계열 치료제 개발에 기여했다.', ['천연물 약물탐색', '말라리아 치료', '문헌-실험 전환'], ['전국 523 연구망', '중의과학원', '임상·제약 협력망'], '집단연구의 공로 배분과 신속한 전시 임상시험의 윤리 문제', '풍토병 연구와 전통지식의 과학적 검증을 가속하고 공공의약 분기를 엽니다.', 'Nobel Prize · Tu Youyou biography', 'https://www.nobelprize.org/prizes/medicine/2015/tu/biographical/', ['artemisinin-research-network']),
  dossier('Q80', 'engineering', '개방형 정보망 설계고문', 'CERN 정보관리 연구망', '팀 버너스리는 CERN에서 분산된 연구정보를 연결하기 위해 월드 와이드 웹을 제안하고 구현했다.', ['하이퍼텍스트', '개방형 네트워크 표준', '정보 아키텍처'], ['CERN', '대학·연구소 인터넷망', '웹 표준 공동체'], '개방 표준과 국가·기업의 망 통제권 사이의 충돌', '연구망을 민간 지식망으로 확장하고 공개 표준 또는 폐쇄망 분기를 엽니다.', 'CERN · Where the web was born', 'https://home.cern/science/computing/the-birth-of-the-web/where-web-was-born/', ['world-wide-web-commons-1991']),
  dossier('Q132489', 'economics', '역량·복지경제 고문', '인도·국제 개발경제학 네트워크', '아마르티아 센은 사회선택, 빈곤 측정, 기근과 실질적 자유를 연결한 복지경제학 연구를 발전시켰다.', ['복지경제학', '기근·빈곤 분석', '사회선택 이론'], ['인도 대학권', '케임브리지·하버드', '국제 개발정책 공동체'], '성장률 중심 관료와 권리·분배 중심 정책 사이의 우선순위 충돌', '예산평가에 빈곤·보건·교육과 권리를 반영하는 새로운 국가운영 지표를 엽니다.', 'Nobel Prize · Amartya Sen facts', 'https://www.nobelprize.org/prizes/economic-sciences/1998/sen/facts/', ['india-reform-capability-state']),
  dossier('Q41914', 'economics', '시장개방·재정개혁 조정관', '인도 재무·중앙은행 정책망', '만모한 싱은 경제학자·중앙은행 총재·재무장관을 거쳐 1991년 인도의 경제개혁을 이끈 정책가였다.', ['거시경제 안정', '무역·산업 개혁', '연립정부 조정'], ['인도 재무부', '인도준비은행', '국제금융기관'], '외환위기 대응 속도와 사회안전망·산업주권 사이의 충돌', '외환위기에서 단계적 개방, 사회적 타협 또는 국가통제 강화의 선택지를 정교화합니다.', '인도 총리실 · Dr. Manmohan Singh', 'https://www.pmindia.gov.in/en/former_pm/dr-manmohan-singh-2/', ['india-reform-capability-state']),
  dossier('Q1253', 'diplomacy', '다자위기 조정 특별대표', '유엔 사무총장실·한국 외교망', '반기문은 제8대 유엔 사무총장으로 기후변화, 개발목표, 보건과 평화유지 의제를 국제협상으로 결집했다.', ['다자외교', '기후·개발 협상', '국제기구 행정'], ['대한민국 외교부', '유엔 회원국', '개발·보건 기구'], '강대국 합의와 취약국의 대표성, 선언과 집행재원 사이의 충돌', '기후·보건·개발 위기를 하나의 다자 패키지로 협상하는 선택지를 엽니다.', 'United Nations · Ban Ki-moon', 'https://www.un.org/sg/en/formersg/ban.shtml', ['un-climate-development-2007']),
  dossier('Q2518', 'diplomacy', '통일·동맹협상 총괄', '독일 연방정부·유럽 공동체', '헬무트 콜은 동독의 평화혁명 이후 통화·경제통합과 주변국 협상을 결합해 독일 통일을 추진했다.', ['통일협상', '통화·경제 통합', '동맹 보증'], ['서독 연방정부', '유럽 공동체', '미·소·주변국 정상외교'], '통일 속도와 지역 격차, 민족 통합과 유럽 통합 사이의 충돌', '분단국의 통화·제도·동맹을 묶은 단계적 또는 급속 통일 분기를 엽니다.', '독일 연방정부 · The Chancellor who reunited Germany', 'https://www.bundesregierung.de/breg-en/service/archive/archive/the-chancellor-who-reunited-germany-413888', ['german-reunification-statecraft']),
  dossier('Q567', 'science', '과학기반 위기정부 고문', '독일 과학계·연방정부', '앙겔라 메르켈은 물리학 연구 경력을 거쳐 통일 독일의 정치가와 연방총리가 되었다.', ['과학기반 정책판단', '연립정부 조정', '유럽 위기협상'], ['동독 과학아카데미권', '독일 연방정부', '유럽연합 정상외교'], '점진적 합의정치와 신속한 위기결단 사이의 충돌', '전문가 검토와 연정 합의를 결합한 장기 위기관리 체계를 강화합니다.', '독일 연방정부 · Angela Merkel', 'https://www.bundesregierung.de/breg-en/service/archive/angela-merkel', ['german-reunification-statecraft']),
  dossier('Q30487', 'diplomacy', '체제개혁·군축 협상가', '소련 공산당 지도부·미소 정상외교', '미하일 고르바초프는 페레스트로이카와 글라스노스트를 추진하고 냉전 종결기의 군축·유럽질서 협상에 관여했다.', ['체제개혁', '군축 정상외교', '정보 공개'], ['소련 지도부', '바르샤바조약권', '미·유럽 정상외교'], '개혁 속도와 연방 보존, 공개정치와 당·군 통제 사이의 충돌', '경쟁체제를 완화·연방화하거나 급속 해체로 이끄는 고위험 개혁 분기를 엽니다.', 'Nobel Prize · Mikhail Gorbachev facts', 'https://www.nobelprize.org/prizes/peace/1990/gorbachev/facts/', ['perestroika-political-opening']),
  dossier('Q34453', 'political', '연방전환·권력승계 조정관', '러시아 공화국·후기 소련 개혁파', '보리스 옐친은 소련 말 러시아 공화국의 정치적 중심으로 부상해 연방 해체와 새 국가의 권력승계에 관여했다.', ['연방 권력승계', '대중정치', '시장전환'], ['러시아 공화국 기구', '지역 엘리트', '개혁 관료·기업망'], '연방의 합법적 승계와 공화국 주권, 의회와 대통령 권력 사이의 충돌', '제국·연방 붕괴 때 핵·군·재정 승계를 협상하거나 강행하는 선택지를 엽니다.', 'Russian Presidential Library · Boris Yeltsin', 'https://www.prlib.ru/en/history/619754', ['perestroika-political-opening']),
  dossier('Q7416', 'political', '민영화·노동관계 개혁고문', '영국 보수당·내각', '마거릿 대처는 과학 교육을 받은 정치가로 영국 총리 재임 중 통화·민영화·노동정책의 급격한 전환을 추진했다.', ['재정·통화 규율', '민영화', '노동관계 정치'], ['영국 내각', '보수당', '대서양 동맹'], '구조개혁의 속도와 실업·지역격차·노동갈등 사이의 충돌', '국영경제를 시장화하는 강한 수단을 열지만 사회통합 비용을 명시적으로 발생시킵니다.', 'UK Government · Past Prime Ministers', 'https://www.gov.uk/government/history/past-prime-ministers/margaret-thatcher', ['market-state-realignment-1979']),
  dossier('Q17714', 'science', '이론물리·우주론 연구고문', '케임브리지 우주론 연구망', '스티븐 호킹은 블랙홀, 특이점과 양자우주론 연구로 널리 알려진 이론물리학자였다.', ['블랙홀 물리학', '우주론', '과학 대중소통'], ['케임브리지 대학', '국제 중력이론 연구망', '과학 대중출판'], '장기 기초연구와 단기 군사·산업성과 요구 사이의 충돌', '기초과학 투자와 대중 과학지지를 높여 장기 우주·계산 연구 분기를 엽니다.', 'University of Cambridge · Professor Stephen Hawking', 'https://www.cam.ac.uk/stephen-hawking', ['cosmology-public-science-1974']),
  dossier('Q5284', 'industry', '소프트웨어 산업전략 고문', '미국 개인용 컴퓨팅 기업망', '빌 게이츠는 마이크로소프트 공동창업자로 개인용 컴퓨터용 소프트웨어 사업과 플랫폼 확장에 관여했다.', ['소프트웨어 플랫폼', '표준·라이선스', '기업 확장'], ['마이크로소프트', 'PC 제조사', '개발자 생태계'], '개방형 호환성과 독점적 플랫폼 통제 사이의 충돌', '소프트웨어를 독립 산업으로 키우고 표준경쟁·반독점 분기를 엽니다.', 'Computer History Museum · Bill Gates', 'https://computerhistory.org/profile/bill-gates/', ['personal-computing-platforms-1977']),
  dossier('Q19837', 'industry', '제품·개인컴퓨팅 혁신고문', '미국 실리콘밸리 창업망', '스티브 잡스는 애플 공동창업자로 개인용 컴퓨터와 통합형 소비자 전자제품의 제품화에 관여했다.', ['제품 통합', '개인용 컴퓨팅', '창업 조직'], ['애플', '실리콘밸리 부품망', '디자인·소프트웨어 공동체'], '폐쇄형 통합제품과 개방형 산업표준 사이의 충돌', '소비자 기술의 보급과 고부가가치 제품산업을 앞당기는 분기를 엽니다.', 'Smithsonian · Steve Jobs collection', 'https://americanhistory.si.edu/collections/subject-groups/steve-jobs', ['personal-computing-platforms-1977']),
  dossier('Q1480', 'political', '민주전환 과도정부 지도자', '필리핀 야권·시민연합', '코라손 아키노는 1986년 피플파워 혁명 뒤 대통령이 되어 권위주의 체제에서 헌정질서로의 전환을 이끌었다.', ['민주전환', '시민연합', '헌정 복구'], ['필리핀 야권', '종교·시민사회', '국제 민주지원망'], '문민통제와 군부 이탈세력의 공로·권한, 구체제 청산 사이의 충돌', '비폭력 정권교체 뒤 개헌·군 통제·재산권 청산의 후속 선택지를 엽니다.', '필리핀 대통령박물관 · Corazon Aquino', 'https://malacanang.gov.ph/presidents/fifth-republic/corazon-aquino/', ['people-power-philippines']),
  dossier('Q215351', 'military', '군 이탈·문민통제 협상가', '필리핀군 개혁파·문민정부', '피델 라모스는 1986년 정변 국면에서 마르코스 정권과 결별했고 이후 군 개혁과 대통령직을 수행했다.', ['군 조직개혁', '위기 이탈협상', '문민정부 안보조정'], ['필리핀군', '개혁군 장교망', '문민정부'], '정권교체의 군사적 기여와 민주적 문민통제 사이의 긴장', '쿠데타 국면에서 부대 이탈을 협상으로 전환하고 전후 군 통제 분기를 엽니다.', '필리핀 대통령박물관 · Fidel Ramos', 'https://malacanang.gov.ph/presidents/fifth-republic/fidel-ramos/', ['people-power-philippines']),
  dossier('Q6761526', 'intelligence', '탐사보도·정보검증 고문', '필리핀 독립언론·국제 저널리즘망', '마리아 레사는 디지털 허위정보, 권력과 플랫폼 책임을 취재한 필리핀 언론인이다.', ['탐사보도', '디지털 허위정보 분석', '언론 안전'], ['래플러', '필리핀 기자망', '국제 언론자유 공동체'], '국가안보·플랫폼 규제와 언론자유·취재원 보호 사이의 충돌', '선전·가짜정보를 공개 검증하는 능력을 높이지만 정권과의 충돌 위험도 커집니다.', 'Nobel Prize · Maria Ressa facts', 'https://www.nobelprize.org/prizes/peace/2021/ressa/facts/', ['journalism-platform-accountability']),
  dossier('Q76156', 'engineering', '항공산업·기술국가 설계고문', '인도네시아 항공산업·연구기술부', 'B. J. 하비비는 항공공학자와 기술관료를 거쳐 수하르토 퇴진 뒤 대통령으로 민주전환의 초기 조치를 맡았다.', ['항공공학', '국가 기술산업', '과도기 제도개혁'], ['인도네시아 항공산업', '연구기술 관료', '개혁기 의회·지역'], '대형 국책산업 투자와 생활경제, 과도정부의 속도와 정당성 사이의 충돌', '산업기술 축적과 민주전환을 연계하거나 분리하는 국가전략 분기를 엽니다.', '인도네시아 국가도서관 · B. J. Habibie', 'https://kepustakaan-presiden.perpusnas.go.id/en/president/?box=detail&id=4&from_box=list&hlm=1&search_ruas=&search_keyword=&activation_status=', ['indonesia-reformasi-1998']),
  dossier('Q76167', 'political', '다원주의 헌정조정 고문', '인도네시아 시민사회·종교 다원주의망', '압두라만 와히드는 이슬람 시민사회 지도자이자 대통령으로 군의 정치역할 축소와 다원주의를 추진했다.', ['종교 다원주의', '문민통제', '연립정치'], ['나흐들라툴 울라마', '인권 시민사회', '개혁기 정당연합'], '종교·지역 대표성, 군부 기득권과 대통령 권한 사이의 충돌', '다종교·다민족 국가에서 문민정부와 포용적 연합을 안정시키는 선택지를 엽니다.', '인도네시아 국가도서관 · Abdurrahman Wahid', 'https://kepustakaan-presiden.perpusnas.go.id/en/president/?box=detail&id=5&from_box=list&hlm=1&search_ruas=&search_keyword=&activation_status=', ['indonesia-reformasi-1998']),
  dossier('Q165210', 'political', '민주화·문민정부 개혁고문', '한국 민주화운동·문민정부', '김영삼은 장기간 야당 지도자로 활동한 뒤 대통령이 되어 군내 사조직 해체와 금융실명제 등을 추진했다.', ['민주화 연합', '문민통제', '반부패 제도개혁'], ['야당 정치권', '민주화 시민사회', '문민정부 개혁관료'], '민주연합 내부 경쟁과 구체제 엘리트 청산의 범위 사이의 충돌', '군부권위주의 이후 문민통제·금융투명성·과거청산 분기를 구체화합니다.', '대한민국 대통령기록관 · 김영삼', 'https://www.pa.go.kr/research/contents/president/index.jsp?spMode=YS', ['korea-democracy-1987']),
  dossier('Q242651', 'military', '군정 이양·헌정협상 고문', '한국 군부·민정이양 협상망', '노태우는 군 출신 정치인으로 1987년 직선제 개헌 수용 선언 뒤 대통령이 되었고 북방외교를 추진했다.', ['군-민간 권력이양', '헌정협상', '북방외교'], ['군 지휘부', '집권정당', '사회주의권 외교망'], '권위주의 체제의 자기보존과 실질적 민주화·과거청산 사이의 충돌', '시위·군 지휘·개헌 협상을 연결해 평화 이양 또는 재진압의 갈림길을 엽니다.', '대한민국 대통령기록관 · 노태우', 'https://www.pa.go.kr/research/contents/president/index.jsp?spMode=TW', ['korea-democracy-1987']),
  dossier('Q310913', 'social-science', '비폭력 화해·평화교육 고문', '베트남 불교 평화운동·국제 망명공동체', '틱낫한은 베트남전 속 참여불교와 비폭력 평화운동을 전개하고 망명 뒤 국제 수행공동체를 이끌었다.', ['비폭력 평화운동', '공동체 치유', '종교간 대화'], ['베트남 불교계', '국제 평화운동', '망명 수행공동체'], '전쟁 당사자 어느 편에도 완전히 속하지 않는 중립 평화노선의 정치적 취약성', '휴전 뒤 보복을 줄이고 난민·참전세대의 사회적 치유를 제도화하는 분기를 엽니다.', 'Plum Village · Thich Nhat Hanh biography', 'https://plumvillage.org/about/thich-nhat-hanh/biography', ['vietnam-reconciliation-civic-peace']),
  dossier('Q446909', 'diplomacy', '평화협상·해방외교 대표', '베트남 남부 임시혁명정부·파리협상단', '응우옌티빈은 베트남전 파리평화협정 협상에서 남베트남 임시혁명정부를 대표한 외교관이었다.', ['휴전협상', '해방운동 외교', '전후 교육행정'], ['임시혁명정부', '파리 평화협상단', '비동맹·사회주의 외교망'], '군사적 승리 목표와 포괄적 정치타협·남부 대표성 사이의 충돌', '전쟁 종결을 군사승패가 아닌 휴전·연정·국제보증으로 바꾸는 선택지를 엽니다.', 'United Nations · Paris Peace Accords record', 'https://peacemaker.un.org/viet-nam-parisagreement73', ['vietnam-reconciliation-civic-peace']),
];

const dossierByQid = new Map(curatedLaterEraDossiers.map((entry) => [entry.qid, entry]));

export function getCuratedLaterEraDossier(qid: string) {
  return dossierByQid.get(qid);
}
