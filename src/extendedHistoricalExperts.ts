import type { HistoricalExpertProfile } from './historicalExperts';
import type { NationId, PersonnelAvailability, PersonnelDiscipline } from './types';

type ExpertDepartment = HistoricalExpertProfile['department'];

interface ExpertSeedOptions {
  accessNations?: NationId[];
  availability?: PersonnelAvailability;
  nationality?: string;
  sourceUrl?: string;
}

interface ExpertSeed {
  id: string;
  primaryNation: NationId;
  name: string;
  birthYear: number;
  department: ExpertDepartment;
  discipline: PersonnelDiscipline;
  appointmentTitle: string;
  office1942: string;
  affiliation: string;
  wartimeLocation: string;
  expertise: [string, string, string];
  networks: [string, string];
  historicalConstraint: string;
  sourceLabel: string;
  options?: ExpertSeedOptions;
}

const nationalityByNation: Record<NationId, string> = {
  britain: '영국', usa: '미국', ussr: '소련', germany: '독일', japan: '일본', china: '중국', india: '인도',
  freefrance: '프랑스', italy: '이탈리아', korea: '조선', vietnam: '베트남', indonesia: '인도네시아', philippines: '필리핀',
};

const effectByDiscipline: Record<PersonnelDiscipline, string> = {
  military: '교리 분석 +4/주 · 합동기획 정확도 +5%',
  science: '기초·응용 연구 +4/주 · 연구 돌파 확률 +5%',
  engineering: '시제품 개발 +4/주 · 장비 신뢰도 +5%',
  medicine: '병력 회복 +2 · 민간 사망과 전염병 위험 -6%',
  economics: '전시 재정 +10/주 · 자원배분 효율 +5%',
  industry: '산업 산출 +5% · 전환·복구 기간 -1주',
  intelligence: '정보망 침투 +6 · 방첩 노출 위험 -5%',
  diplomacy: '협상 영향력 +6 · 해외 인재 접촉 비용 -8%',
  'social-science': '정통성 +4 · 교육·행정 인재 성장 +6%',
};

function s(
  id: string,
  primaryNation: NationId,
  name: string,
  birthYear: number,
  department: ExpertDepartment,
  discipline: PersonnelDiscipline,
  appointmentTitle: string,
  office1942: string,
  affiliation: string,
  wartimeLocation: string,
  expertise: [string, string, string],
  networks: [string, string],
  historicalConstraint: string,
  sourceLabel: string,
  options?: ExpertSeedOptions,
): ExpertSeed {
  return { id, primaryNation, name, birthYear, department, discipline, appointmentTitle, office1942, affiliation, wartimeLocation, expertise, networks, historicalConstraint, sourceLabel, options };
}

const expertSeeds: ExpertSeed[] = [
  // 영국 — 레이더·작전연구뿐 아니라 복지국가와 전시경제의 민간 설계자를 함께 모델링한다.
  s('uk-robert-watson-watt', 'britain', '로버트 왓슨와트', 1892, 'science', 'engineering', '레이더 방공체계 고문', '항공부 통신연구 자문관', '영국 항공부·전기통신연구소', '런던·맬번, 영국', ['레이더', '방공망', '연구조직'], ['영국 항공부', 'TRE 기술진'], '1942년에는 현장 개발의 중심에서 한발 물러난 자문자였으며, 운용부대와 연구소의 신뢰를 다시 확보해야 합니다.', 'UK Government·Watson-Watt', { accessNations: ['usa'], sourceUrl: 'https://www.gov.uk/government/speeches/2012-05-24-qinetiq-70th-anniversary-dinner' }),
  s('uk-bernard-lovell', 'britain', '버나드 러벨', 1913, 'science', 'engineering', '항공레이더 개발고문', '전기통신연구소 항공 레이더 연구자', 'Telecommunications Research Establishment', '맬번, 영국', ['항공레이더', '마이크로파', '전파천문 기반'], ['TRE', '맨체스터 물리학계'], '공군 임무와 연구를 병행했고 과로·장비 부족이 심하므로 연구시설과 휴식 보장이 필요합니다.', 'Jodrell Bank·Bernard Lovell', { accessNations: ['usa'] }),
  s('uk-frank-whittle', 'britain', '프랭크 휘틀', 1907, 'science', 'engineering', '제트추진 개발고문', '파워 제츠 수석기술자·공군 장교', 'Power Jets', '러터워스, 영국', ['가스터빈', '제트추진', '항공엔진'], ['Power Jets', '항공부 기술국'], '공군과 기업의 반복된 회의론, 특허·생산권 갈등, 건강 악화가 개발 속도를 제한합니다.', 'RAF Museum·Frank Whittle', { accessNations: ['usa'], availability: 'poachable' }),
  s('uk-barnes-wallis', 'britain', '반스 월리스', 1887, 'science', 'engineering', '특수항공무장 설계고문', '비커스암스트롱 수석 항공설계자', 'Vickers-Armstrongs', '웨이브리지, 영국', ['항공구조', '특수폭탄', '표적공학'], ['비커스 설계국', '항공부 폭격 연구진'], '급진적 설계는 시험 자원과 전용 승무원을 대량 요구하며 민간 피해와 표적선정 논쟁을 부릅니다.', 'RAF Museum·Barnes Wallis', { accessNations: ['usa'] }),
  s('uk-dorothy-hodgkin', 'britain', '도로시 호지킨', 1910, 'science', 'science', '구조화학·의약연구 고문', '옥스퍼드대학교 화학 연구원', 'University of Oxford', '옥스퍼드, 영국', ['X선 결정학', '페니실린 구조', '생체분자'], ['옥스퍼드 화학연구소', '연합 의약 연구망'], '첨단 X선 장비와 국제 데이터 교환이 필요하며 군사 연구만 강요하면 의약 성과가 감소합니다.', 'Nobel Prize·Dorothy Hodgkin', { accessNations: ['usa', 'india'], sourceUrl: 'https://www.nobelprize.org/prizes/chemistry/1964/hodgkin/biographical/' }),
  s('uk-solly-zuckerman', 'britain', '솔리 주커먼', 1904, 'science', 'science', '폭격효과·작전연구 고문', '민방위·연합작전본부 과학고문', 'British Civil Defence Research', '런던·북아프리카', ['폭격효과', '피해통계', '작전연구'], ['연합작전본부', '영국 민방위 연구진'], '실증 통계가 지휘관의 직관과 충돌하고 폭격정책의 민간 피해에 대한 윤리 논쟁이 발생합니다.', 'UK National Archives·Zuckerman', { accessNations: ['usa', 'freefrance'] }),
  s('uk-charles-goodeve', 'britain', '찰스 구디브', 1904, 'science', 'engineering', '기뢰전·해군작전연구 고문', '해군성 연구개발 부감독', 'Royal Navy Department of Miscellaneous Weapons Development', '런던, 영국', ['기뢰소거', '함대작전연구', '전기화학'], ['영국 해군성', '캐나다 과학자망'], '해군 보안등급과 캐나다 출신 민간 연구진의 권한 문제가 기술 공유를 지연시킬 수 있습니다.', 'Government OR Service·Goodeve', { accessNations: ['usa'], sourceUrl: 'https://operational-research.gov.uk/public_docs/history-of-gors.pdf' }),
  s('uk-jd-bernal', 'britain', '존 데스먼드 버널', 1901, 'science', 'science', '상륙·과학정보 고문', '연합작전본부 과학고문', 'Combined Operations Headquarters', '런던, 영국', ['상륙지형', '결정학', '과학정보'], ['연합작전본부', '유럽 좌파 과학자망'], '공산주의 성향 때문에 방첩 감시와 보안 접근 제한을 받으며 정치적 신뢰를 확보해야 합니다.', 'Royal Society·J. D. Bernal', { accessNations: ['ussr', 'freefrance'], availability: 'poachable' }),
  s('uk-william-beveridge', 'britain', '윌리엄 베버리지', 1879, 'economy', 'social-science', '사회보장·총동원 고문', '전후 사회보험위원회 위원장', 'Inter-Departmental Committee on Social Insurance', '런던, 영국', ['사회보험', '인력동원', '전후재건'], ['영국 의회', '사회정책 연구망'], '1942년 보고서의 보편복지는 막대한 장기 재정과 부처 통합을 요구해 재무 관료와 충돌합니다.', 'UK Parliament·Beveridge Report', { accessNations: ['freefrance', 'india'] }),
  s('uk-lionel-robbins', 'britain', '라이오널 로빈스', 1898, 'economy', 'economics', '전시경제·전후질서 고문', '전시내각 경제부문 책임자', 'Offices of the War Cabinet', '런던, 영국', ['전시경제', '무역정책', '전후통화질서'], ['전시내각', '런던정경대'], '자유무역 구상과 제국특혜·배급통제가 충돌하며 미국과의 협상에는 정치적 양보가 필요합니다.', 'LSE Archives·Lionel Robbins', { accessNations: ['usa', 'freefrance', 'india'] }),
  s('uk-roy-harrod', 'britain', '로이 해로드', 1900, 'economy', 'economics', '전시통계·성장계획 고문', '수상실 통계·경제 자문관', 'Prime Minister’s Statistical Section', '런던, 영국', ['성장이론', '전시통계', '항공생산 분석'], ['옥스퍼드 경제학계', '수상실 통계부'], '비공식 자문 지위라 부처 자료 접근이 불안정하고 장기성장 구상이 단기 군수 우선과 충돌합니다.', 'Oxford DNB·Roy Harrod', { accessNations: ['usa'] }),
  s('uk-gi-taylor', 'britain', '제프리 잉그램 테일러', 1886, 'science', 'science', '폭발·유체역학 고문', '민방위·폭발현상 연구 과학자', 'University of Cambridge·Ministry of Home Security', '케임브리지, 영국', ['유체역학', '폭발파', '재료거동'], ['케임브리지 연구진', '영국 민방위 과학망'], '광범위한 비밀 연구 요청이 기초과학 연구와 충돌하며 실험에는 고위험 시설이 필요합니다.', 'Royal Society·G. I. Taylor', { accessNations: ['usa'] }),

  // 미국 — 맨해튼 계획만이 아니라 통신·계산·금융·산업조정까지 포괄한다.
  s('us-ernest-lawrence', 'usa', '어니스트 로런스', 1901, 'science', 'science', '동위원소·대형연구소 고문', '버클리 방사선연구소장·S-1 책임 연구자', 'UC Berkeley Radiation Laboratory', '버클리, 미국', ['사이클로트론', '동위원소분리', '대형연구조직'], ['버클리 방사선연구소', 'OSRD'], '전자기 분리 방식은 막대한 전력·구리·공장 건설을 요구하며 다른 핵개발 경로와 예산 경쟁을 벌입니다.', 'U.S. National Archives·Lawrence', { accessNations: ['britain'], sourceUrl: 'https://declassification.blogs.archives.gov/2013/02/01/nobel-prize-winning-scientists-associated-with-the-manhattan-project/' }),
  s('us-harold-urey', 'usa', '해럴드 유리', 1893, 'science', 'science', '동위원소분리 연구고문', '컬럼비아대학교 대체물질연구소 책임자', 'Columbia University SAM Laboratories', '뉴욕, 미국', ['동위원소화학', '기체확산', '중수'], ['컬럼비아 SAM', '맨해튼 계획 과학망'], '기체확산 기술의 불확실성과 대규모 공정시설 비용 때문에 공학진과 일정 갈등이 큽니다.', 'Atomic Heritage Foundation·Urey', { accessNations: ['britain'] }),
  s('us-leo-szilard', 'usa', '레오 실라르드', 1898, 'science', 'science', '연쇄반응·과학정책 고문', '시카고 야금연구소 핵물리 연구자', 'Metallurgical Laboratory', '시카고, 미국', ['연쇄반응', '원자로 특허', '과학정책'], ['시카고 야금연구소', '유럽 망명 과학자망'], '군의 비밀주의와 핵무기 사용에 대한 정치·윤리적 반대 때문에 지휘체계와 지속적으로 충돌합니다.', 'U.S. DOE·Metallurgical Laboratory', { accessNations: ['britain'], nationality: '헝가리계 미국 망명', availability: 'poachable', sourceUrl: 'https://www.energy.gov/lm/metallurgical-laboratory-university-chicago' }),
  s('us-glenn-seaborg', 'usa', '글렌 시보그', 1912, 'science', 'science', '플루토늄화학 고문', '시카고 야금연구소 플루토늄화학 책임자', 'Metallurgical Laboratory', '시카고, 미국', ['플루토늄', '방사화학', '분리공정'], ['시카고 야금연구소', '버클리 화학진'], '극미량 실험을 산업 규모 공정으로 전환해야 하며 방사선 안전과 보안 통제가 필수입니다.', 'U.S. National Archives·Seaborg', { accessNations: ['britain'], sourceUrl: 'https://declassification.blogs.archives.gov/2013/02/01/nobel-prize-winning-scientists-associated-with-the-manhattan-project/' }),
  s('us-richard-feynman', 'usa', '리처드 파인먼', 1918, 'science', 'science', '이론계산·핵연구 고문', '프린스턴 박사후 연구자·맨해튼 계획 합류자', 'Princeton University·Manhattan Project', '프린스턴·로스앨러모스, 미국', ['양자이론', '수치계산', '핵공학 검산'], ['프린스턴 물리학계', '로스앨러모스 이론진'], '1942년에는 매우 젊고 행정 경험이 부족하며 가족 건강 문제와 최고 보안시설 이동을 함께 해결해야 합니다.', 'Los Alamos National Laboratory·Feynman', { accessNations: ['britain'] }),
  s('us-claude-shannon', 'usa', '클로드 섀넌', 1916, 'science', 'engineering', '암호·정보통신 고문', '벨 연구소 화력통제·암호 연구자', 'Bell Telephone Laboratories', '뉴욕, 미국', ['정보이론 기반', '암호분석', '화력통제'], ['벨 연구소', 'NDRC 수학연구진'], '연구가 기업·군 보안으로 분절되어 있고 이론 성과를 즉시 작전효과로 바꾸기 어렵습니다.', 'MIT Archives·Claude Shannon', { accessNations: ['britain'] }),
  s('us-norbert-wiener', 'usa', '노버트 위너', 1894, 'science', 'science', '자동제어·확률연구 고문', 'MIT 수학 교수·대공화력 연구자', 'Massachusetts Institute of Technology', '케임브리지, 미국', ['확률과정', '자동제어', '대공예측'], ['MIT 수학과', 'NDRC 화력통제망'], '군사 기술의 자동화와 인간 통제에 대한 윤리적 우려가 커 무제한 무기개발에는 반대할 수 있습니다.', 'MIT Museum·Norbert Wiener', { accessNations: ['britain'], availability: 'poachable' }),
  s('us-edwin-land', 'usa', '에드윈 랜드', 1909, 'science', 'industry', '광학·정찰장비 산업고문', '폴라로이드 사장·NDRC 광학 연구자', 'Polaroid Corporation', '케임브리지, 미국', ['편광광학', '야간시야', '항공정찰'], ['폴라로이드', 'NDRC 광학위원회'], '민간기업의 특허·생산능력과 군 보안 요구 사이에서 계약과 지식재산권 협상이 필요합니다.', 'Smithsonian·Edwin Land', { accessNations: ['britain'] }),
  s('us-george-stibitz', 'usa', '조지 스티비츠', 1904, 'science', 'engineering', '전자계산·통신연산 고문', 'NDRC 수학자·벨 연구소 계산기 개발자', 'Bell Labs·National Defense Research Committee', '뉴욕·워싱턴, 미국', ['릴레이계산기', '원격연산', '탄도계산'], ['벨 연구소', 'NDRC 계산망'], '릴레이 계산기는 희소 부품과 숙련 정비원을 요구하며 기존 인간 계산조직의 저항을 받습니다.', 'Computer History Museum·Stibitz', { accessNations: ['britain'] }),
  s('us-wassily-leontief', 'usa', '바실리 레온티예프', 1906, 'economy', 'economics', '산업연관·전시배분 고문', '하버드대학교 경제학 교수', 'Harvard University', '케임브리지, 미국', ['산업연관표', '수요예측', '생산배분'], ['하버드 경제학계', '미 연방 통계기관'], '정확한 산업연관 분석에는 기업별 생산자료가 필요해 비밀유지와 자료 표준화 비용이 큽니다.', 'Nobel Prize·Leontief', { accessNations: ['britain', 'ussr'], nationality: '러시아계 미국 망명' }),
  s('us-marriner-eccles', 'usa', '매리너 에클스', 1890, 'economy', 'economics', '전시금융·통화정책 고문', '연방준비제도 이사회 의장', 'Federal Reserve Board', '워싱턴 D.C., 미국', ['통화정책', '전시채권', '은행감독'], ['연방준비제도', '미 재무부'], '재무부의 저금리 전쟁금융 요구와 중앙은행의 물가·신용 통제 목표가 충돌합니다.', 'Federal Reserve History·Eccles', { accessNations: ['britain'] }),
  s('us-beardsley-ruml', 'usa', '비어즐리 럼', 1894, 'economy', 'economics', '조세·전쟁재정 개혁고문', '뉴욕연방준비은행 의장·재정개혁 제안자', 'Federal Reserve Bank of New York', '뉴욕, 미국', ['원천징수', '전쟁재정', '재단행정'], ['뉴욕 연준', '루스벨트 행정부 경제망'], '소득세 원천징수 전환은 단기 세수 공백과 의회·납세자 반발을 함께 처리해야 합니다.', 'Federal Reserve History·Ruml Plan', { accessNations: ['britain'] }),

  // 소련 — 소개·구금·피난이라는 실제 제약을 연구 보너스와 분리한다.
  s('su-abram-ioffe', 'ussr', '아브람 이오페', 1880, 'science', 'science', '반도체·물리연구 조직고문', '카잔으로 피난한 물리기술연구소 지도자', 'Leningrad Physico-Technical Institute', '카잔, 소련', ['고체물리', '반도체', '연구인재 조직'], ['소련 과학아카데미', '레닌그라드 물리학파'], '피난 연구소의 장비 부족과 국가보안기관의 인사 개입이 연구망을 약화시킵니다.', 'Ioffe Institute·History', { accessNations: ['china'] }),
  s('su-lev-landau', 'ussr', '레프 란다우', 1908, 'science', 'science', '이론물리·폭발계산 고문', '물리문제연구소 이론부 책임자', 'Institute for Physical Problems', '카잔·모스크바, 소련', ['양자이론', '유체역학', '저온물리'], ['카피차 연구소', '하르키우 이론물리학파'], '1938년 체포 전력과 정권 비판 때문에 정치경찰의 감시가 지속되며 학문 자율성 보장이 필요합니다.', 'Nobel Prize·Lev Landau', { accessNations: ['china'], availability: 'poachable', sourceUrl: 'https://www.nobelprize.org/prizes/physics/1962/landau/biographical/' }),
  s('su-yulii-khariton', 'ussr', '율리 하리톤', 1904, 'science', 'engineering', '폭발물·핵연쇄반응 고문', '화학물리연구소 폭발연구 책임자', 'Institute of Chemical Physics', '카잔, 소련', ['폭발물리', '연쇄반응', '기폭공학'], ['화학물리연구소', '소련 국방연구망'], '1942년의 원자무기 정보는 불완전하며 대규모 핵계획 전환에는 최고지도부 승인과 비밀시설이 필요합니다.', 'Rosatom History·Khariton'),
  s('su-isaak-kikoin', 'ussr', '이사크 키코인', 1908, 'science', 'science', '동위원소·전기물리 고문', '우랄 피난 물리기술연구소 연구자', 'Leningrad Physico-Technical Institute', '스베르들롭스크, 소련', ['동위원소분리', '자기물리', '전기계측'], ['우랄 과학연구망', '소련 원자연구진'], '피난지 실험장비가 부족하고 유대계 과학자에 대한 제도적 차별 위험이 존재합니다.', 'Kurchatov Institute·Kikoin'),
  s('su-alexander-nesmeyanov', 'ussr', '알렉산드르 네스메야노프', 1899, 'science', 'science', '유기금속·화학동원 고문', '모스크바대학교 유기화학 교수', 'Moscow State University', '아시가바트·모스크바, 소련', ['유기금속화학', '합성재료', '화학교육'], ['모스크바대학교', '소련 과학아카데미'], '대학 피난과 군수화학 우선 때문에 기초연구·교육인력이 흩어져 있습니다.', 'Russian Academy of Sciences·Nesmeyanov'),
  s('su-andrei-tupolev', 'ussr', '안드레이 투폴레프', 1888, 'science', 'engineering', '항공기 설계총감', 'NKVD 제29 특별설계국 수감 설계자', 'TsKB-29·Tupolev Design Bureau', '모스크바, 소련', ['중폭격기', '금속항공구조', '설계국 운영'], ['수감 항공기술진', '소련 항공산업'], '숙청 뒤 수감 상태이므로 석방·복권과 NKVD 통제 완화 없이는 충성도와 설계진 사기가 낮습니다.', 'Tupolev Company·History', { availability: 'displaced' }),
  s('su-alexander-yakovlev', 'ussr', '알렉산드르 야코블레프', 1906, 'science', 'engineering', '전투기·항공생산 고문', '야코블레프 설계국장·항공산업 부인민위원', 'Yakovlev Design Bureau', '모스크바, 소련', ['전투기설계', '경량구조', '항공생산 조정'], ['항공산업인민위원부', '야코블레프 설계국'], '정치적 영향력과 설계국 간 자원경쟁 때문에 다른 항공기 사업의 신뢰를 잃을 수 있습니다.', 'Yakovlev Design Bureau·History'),
  s('su-ivan-bardin', 'ussr', '이반 바르딘', 1883, 'economy', 'industry', '야금·동부산업 이전고문', '소련 과학아카데미 야금 책임자', 'USSR Academy of Sciences', '스베르들롭스크·모스크바', ['제철', '합금', '공장피난'], ['우랄 제철소', '소련 과학아카데미'], '우랄로 이전한 공장의 과부하와 원료·철도 병목을 해결하지 않으면 생산 증가가 지속되지 않습니다.', 'Russian Academy of Sciences·Bardin'),
  s('su-evgeny-varga', 'ussr', '예브게니 바르가', 1879, 'economy', 'economics', '세계경제·적국산업 분석고문', '세계경제세계정치연구소장', 'Institute of World Economy and World Politics', '타슈켄트·모스크바, 소련', ['전쟁경제 분석', '자본주의 산업', '점령지 경제'], ['코민테른 경제망', '소련 과학아카데미'], '분석 결과가 당의 공식 노선과 다르면 정치적 비판과 연구소 해체 위험을 감수해야 합니다.', 'Russian Academy of Sciences·Varga', { accessNations: ['china'] }),
  s('su-nikolai-semashko', 'ussr', '니콜라이 세마시코', 1874, 'science', 'medicine', '전시공중보건 고문', '소련 과학아카데미 보건학자', 'Moscow Medical Institute', '우파·모스크바, 소련', ['공중보건', '예방의학', '의료행정'], ['소련 의료인민위원부', '적십자·위생망'], '전선 의료 우선과 후방 민간 방역의 자원 배분이 충돌하며 중앙집권 체계가 지역 사정을 놓칠 수 있습니다.', 'N. A. Semashko Public Health Archive'),
  s('su-alexander-oparin', 'ussr', '알렉산드르 오파린', 1894, 'science', 'science', '생화학·식량연구 고문', '바흐 생화학연구소 연구자', 'Bach Institute of Biochemistry', '프룬제·모스크바, 소련', ['생화학', '식품공정', '발효'], ['바흐 생화학연구소', '소련 식품과학망'], '피난과 식량위기 때문에 연구가 즉시 생산 가능한 발효·보존기술에 종속됩니다.', 'Russian Academy of Sciences·Oparin'),
  s('su-alexei-kosygin', 'ussr', '알렉세이 코시긴', 1904, 'economy', 'industry', '피난산업·도시보급 고문', '인민위원회의 레닌그라드 피난·공급 담당자', 'Council of People’s Commissars', '레닌그라드·모스크바, 소련', ['공장피난', '도시보급', '경공업'], ['소련 인민위원회', '레닌그라드 행정망'], '당 관료의 할당명령과 현장 공급 현실이 어긋나며 군수 우선이 민간 생존을 악화시킬 수 있습니다.', 'Russian Government Archive·Kosygin'),

  // 독일 — 기술 성과와 나치 체제의 강제노동·박해·보안기관 개입을 같은 카드에서 분리해 보여준다.
  s('de-willy-messerschmitt', 'germany', '빌리 메서슈미트', 1898, 'science', 'industry', '전투기 산업총감', '메서슈미트사 회장·수석설계자', 'Messerschmitt AG', '아우크스부르크, 독일', ['전투기설계', '경량구조', '대량생산'], ['메서슈미트 공장망', '독일 항공부'], '정치권과의 밀착, 경쟁 설계국 배제, 점령지 강제노동 사용에 따른 윤리·저항·생산 위험이 큽니다.', 'Deutsches Museum·Messerschmitt', { availability: 'poachable' }),
  s('de-kurt-tank', 'germany', '쿠르트 탕크', 1898, 'science', 'engineering', '전투기·항공기술 고문', '포케불프 설계부장', 'Focke-Wulf Flugzeugbau', '브레멘, 독일', ['전투기설계', '공력설계', '고고도항공'], ['포케불프 설계국', '독일 항공시험기관'], '항공부의 사양 변경과 메서슈미트 계열과의 자원경쟁이 개발 일정을 흔듭니다.', 'Deutsches Museum·Kurt Tank'),
  s('de-ferdinand-porsche', 'germany', '페르디난트 포르셰', 1875, 'science', 'engineering', '기갑·차량기술 고문', '포르셰 설계사 대표·전차위원회 책임자', 'Porsche KG', '슈투트가르트, 독일', ['전차구동계', '자동차공학', '전기변속'], ['포르셰 설계사', '독일 병기청'], '복잡한 설계와 정치적 후원이 시험 실패를 은폐할 수 있고 생산에는 강제노동 책임이 연결됩니다.', 'Porsche Museum·Ferdinand Porsche', { availability: 'poachable' }),
  s('de-gerhard-domagk', 'germany', '게르하르트 도마크', 1895, 'science', 'medicine', '항균제·전염병 고문', '바이어 병리·세균학 연구소장', 'Bayer·IG Farben', '부퍼탈, 독일', ['설폰아미드', '감염치료', '약품시험'], ['바이어 연구소', '독일 임상의학망'], '나치 당국의 노벨상 수상 금지와 IG 파르벤 체제의 비윤리적 인체실험·강제노동 문제를 분리해 통제해야 합니다.', 'Nobel Prize·Gerhard Domagk', { sourceUrl: 'https://www.nobelprize.org/prizes/medicine/1939/domagk/biographical/' }),
  s('de-max-von-laue', 'germany', '막스 폰 라우에', 1879, 'science', 'science', '결정학·과학자보호 고문', '카이저빌헬름 물리연구소 부소장', 'Kaiser Wilhelm Institute for Physics', '베를린, 독일', ['X선결정학', '고체물리', '학술망 보호'], ['카이저빌헬름협회', '반나치 학자망'], '공개적으로 나치 과학정책에 반대했으므로 정권을 유지한 채 영입하면 감시·체포 위험이 높습니다.', 'Max Planck Society·Max von Laue', { accessNations: ['britain', 'usa', 'freefrance'], availability: 'opposition' }),
  s('de-carl-friedrich-weizsaecker', 'germany', '카를 프리드리히 폰 바이츠제커', 1912, 'science', 'science', '핵이론·천체물리 고문', '카이저빌헬름 물리연구소 우라늄 연구자', 'Kaiser Wilhelm Institute for Physics', '베를린, 독일', ['핵분열이론', '원자로 개념', '천체물리'], ['우라늄 협회', '하이젠베르크 연구진'], '전시 핵연구 참여의 동기와 전후 자기서술에는 논쟁이 있으므로 성과·의도·책임을 단정하지 않습니다.', 'Max Planck Society·Weizsäcker'),
  s('de-gustav-hertz', 'germany', '구스타프 헤르츠', 1887, 'science', 'science', '동위원소·원자물리 고문', '지멘스 연구소장·민간 원자물리 연구자', 'Siemens Research Laboratory', '베를린, 독일', ['원자물리', '기체확산', '동위원소분리'], ['지멘스 연구소', '독일 원자물리학계'], '유대계 조부모 때문에 대학직에서 물러난 뒤 산업연구소에 있었으므로 인종정책 폐지와 연구 자율성이 필요합니다.', 'Nobel Prize·Gustav Hertz', { accessNations: ['ussr'], availability: 'opposition' }),
  s('de-walther-bothe', 'germany', '발터 보테', 1891, 'science', 'science', '핵물리·입자검출 고문', '하이델베르크 카이저빌헬름 의학연구소 물리부장', 'Kaiser Wilhelm Institute for Medical Research', '하이델베르크, 독일', ['핵물리', '동시계수법', '사이클로트론'], ['하이델베르크 연구소', '우라늄 협회'], '사이클로트론 건설 자원과 군수 우선순위가 충돌하며 전쟁기 연구의 군사적 사용 책임이 따릅니다.', 'Nobel Prize·Walther Bothe'),
  s('de-hans-von-ohain', 'germany', '한스 폰 오하인', 1911, 'science', 'engineering', '제트엔진 연구고문', '하인켈사 터보제트 개발자', 'Heinkel Flugzeugwerke', '로스토크, 독일', ['터보제트', '연소실', '고속항공'], ['하인켈 기술진', '독일 항공부'], '엔진 수명과 내열재가 부족하고 하인켈·융커스·BMW 간 사업 경쟁이 성과 공유를 막습니다.', 'Deutsches Museum·Hans von Ohain'),
  s('de-ernst-heinkel', 'germany', '에른스트 하인켈', 1888, 'science', 'industry', '항공산업·제트사업 고문', '하인켈 항공기제작사 대표', 'Heinkel Flugzeugwerke', '로스토크, 독일', ['항공산업', '제트실증기', '공장확장'], ['하인켈 공장망', '항공부 조달국'], '나치 체제 협력과 강제노동 사용 책임, 국유화 압력, 항공부와의 권력갈등을 함께 처리해야 합니다.', 'Deutsches Museum·Ernst Heinkel', { availability: 'poachable' }),
  s('de-herbert-wagner', 'germany', '헤르베르트 바그너', 1900, 'science', 'engineering', '유도무기·공력 고문', '헨셸 항공기 유도무기 기술책임자', 'Henschel Flugzeug-Werke', '베를린, 독일', ['유도폭탄', '공기역학', '원격조종'], ['헨셸 설계국', '독일 항공부 기술진'], '초기 유도체계는 전파교란과 운용훈련에 취약하고 민간·선박 공격에 대한 윤리 책임이 발생합니다.', 'Deutsches Museum·Hs 293 history'),
  s('de-alfred-mueller-armack', 'germany', '알프레트 뮐러아르마크', 1901, 'economy', 'economics', '전후시장질서 연구고문', '뮌스터대학교 경제학 교수', 'University of Münster', '뮌스터, 독일', ['경기순환', '시장질서', '전후재건'], ['뮌스터 경제학계', '독일 산업경제 연구망'], '나치 당 가입 경력과 전후 사회적 시장경제 구상을 함께 검증해야 하며 즉각적 전시배분에는 효과가 제한됩니다.', 'German Federal Archives·Müller-Armack', { availability: 'poachable' }),

  // 일본 — 1942년의 학술·기업 직책을 제국 전쟁동원과 식민지 책임의 맥락에서 다룬다.
  s('jp-yoshio-nishina', 'japan', '니시나 요시오', 1890, 'science', 'science', '핵물리·대형실험 고문', '이화학연구소 핵물리 연구실장', 'RIKEN', '도쿄, 일본', ['핵물리', '사이클로트론', '방사성동위원소'], ['이화학연구소', '육군 항공기술연구소'], '니고 연구는 자원·정보가 부족했고 군사통제와 전후 사이클로트론 파괴 위험까지 감수해야 합니다.', 'RIKEN·Nishina history'),
  s('jp-jiro-horikoshi', 'japan', '호리코시 지로', 1903, 'science', 'engineering', '함재기 설계고문', '미쓰비시 항공기 수석설계자', 'Mitsubishi Heavy Industries', '나고야, 일본', ['함재전투기', '경량공력', '항공생산'], ['미쓰비시 설계진', '일본 해군 항공본부'], '경량화가 방호·생존성과 충돌하고 해군의 무리한 요구와 전쟁 수행 책임을 피할 수 없습니다.', 'Mitsubishi Archives·Jiro Horikoshi'),
  s('jp-hidetsugu-yagi', 'japan', '야기 히데쓰구', 1886, 'science', 'engineering', '전파·레이더 체계고문', '도쿄공업대학 학장', 'Tokyo Institute of Technology', '도쿄, 일본', ['야기우다 안테나', '레이더', '전기통신'], ['도쿄공업대학', '일본 해군 기술연구소'], '육해군의 분절과 해외에서 더 널리 쓰인 특허에 대한 조직적 무관심이 기술 확산을 늦춥니다.', '일본 국립국회도서관·야기 히데쓰구', { sourceUrl: 'https://www.ndl.go.jp/portrait/e/datas/363/' }),
  s('jp-shintaro-uda', 'japan', '우다 신타로', 1896, 'science', 'engineering', '지향성안테나 연구고문', '도호쿠제국대학 전기공학 교수', 'Tohoku Imperial University', '센다이, 일본', ['지향성안테나', '초단파', '통신계측'], ['도호쿠제국대학', '야기 연구진'], '대학 연구와 군용 레이더 사업의 연결이 약하고 육해군 간 표준이 달라 실전화가 지연됩니다.', 'Tohoku University·Yagi-Uda history'),
  s('jp-kinjiro-okabe', 'japan', '오카베 긴지로', 1896, 'science', 'engineering', '마그네트론·레이더 고문', '오사카제국대학 전기공학 교수', 'Osaka Imperial University', '오사카, 일본', ['분할양극 마그네트론', '마이크로파', '레이더 송신'], ['오사카제국대학', '일본 해군 전파연구진'], '실험 발명과 신뢰성 있는 대량생산 사이의 간극, 비밀주의와 부품 부족을 해결해야 합니다.', 'IEEE History Center·Okabe'),
  s('jp-kiyoshi-ito', 'japan', '이토 기요시', 1915, 'science', 'science', '확률과정·통계 고문', '내각통계국 통계관', 'Cabinet Statistics Bureau', '도쿄, 일본', ['확률과정', '통계추정', '위험모형'], ['내각통계국', '일본 수학회'], '1942년에는 젊은 통계관이고 연구가 관료업무에 묻혀 있어 독립 연구시간과 자료 접근이 필요합니다.', 'Kyoto University·Kiyoshi Itô'),
  s('jp-saburo-okita', 'japan', '오키타 사부로', 1914, 'economy', 'economics', '자원·동아시아 경제조사 고문', '동아연구소 경제조사원', 'East Asia Research Institute', '도쿄, 일본', ['자원수지', '경제통계', '지역개발'], ['동아연구소', '전후 일본 경제관료망'], '제국권 조사자료는 식민통치와 수탈을 전제로 했으므로 현지 동의·자료 신뢰를 다시 구축해야 합니다.', 'GRIPS Archives·Saburo Okita'),
  s('jp-kamekichi-takahashi', 'japan', '다카하시 가메키치', 1891, 'economy', 'economics', '전시금융·산업분석 고문', '경제평론가·산업조사 연구자', 'Japanese economic press', '도쿄, 일본', ['경기분석', '전시금융', '산업통계'], ['일본 경제언론', '기업 조사망'], '정부 통제와 검열 아래 독립 분석이 제한되고 총력전 비판은 탄압 위험을 부릅니다.', 'National Diet Library·Takahashi Kamekichi', { availability: 'poachable' }),
  s('jp-chika-kuroda', 'japan', '구로다 치카', 1884, 'science', 'science', '천연색소·의약화학 고문', '오차노미즈 여자고등사범학교 화학 교수', 'Ochanomizu University', '도쿄, 일본', ['유기화학', '천연색소', '의약소재'], ['오차노미즈 화학계', '리켄 여성연구망'], '여성 과학자에 대한 제도적 차별과 군수 우선 배분 때문에 연구실·인력 확보가 어렵습니다.', 'Ochanomizu University·Chika Kuroda'),
  s('jp-takaoki-sasaki', 'japan', '사사키 다카오키', 1878, 'science', 'medicine', '암·병리연구 고문', '사사키연구소장', 'Sasaki Institute', '도쿄, 일본', ['암병리', '화학발암', '임상연구'], ['사사키연구소', '일본 의학계'], '전쟁기 의약·실험자원 부족과 군 의료 우선정책이 장기 암연구를 위축시킵니다.', 'Sasaki Foundation·History'),
  s('jp-kiyoo-wadati', 'japan', '와다치 기요오', 1902, 'science', 'science', '지진·기상정보 고문', '중앙기상대 지진 관측 책임 연구자', 'Central Meteorological Observatory', '도쿄, 일본', ['심발지진', '지진관측', '재난예측'], ['중앙기상대', '국제 지진학망'], '관측소가 군사기상에 우선 동원되고 국제 데이터 교환이 단절되어 예측 정확도가 떨어집니다.', 'Japan Meteorological Agency·Wadati'),
  s('jp-takeo-hatanaka', 'japan', '하타나카 다케오', 1914, 'science', 'science', '천체물리·광학계측 고문', '도쿄제국대학 천문학 연구자', 'Tokyo Imperial University', '도쿄, 일본', ['천체분광', '광학계측', '항법천문'], ['도쿄제국대학 천문대', '일본 광학기술망'], '젊은 기초과학자라 군용 항법으로 전환할 경우 장비·지도교수·관측시간을 새로 확보해야 합니다.', 'National Astronomical Observatory of Japan·Hatanaka'),

  // 중국 — 충칭·쿤밍의 피난 대학, 점령지 의료, 해외 유학생을 하나의 영입시장에 연결한다.
  s('cn-qian-sanqiang', 'china', '첸싼창', 1913, 'science', 'science', '원자물리·해외과학 연락고문', '파리 라듐연구소 핵물리 연구자', 'Institut du Radium', '파리, 점령 프랑스', ['핵분열', '방사화학', '해외인재 귀환'], ['졸리오퀴리 연구진', '중국 유럽유학생망'], '1942년에는 점령 프랑스에 있어 비밀 연락·안전한 이동로가 필요하며 중국 내 대형 연구시설도 부족합니다.', '중국과학원·첸싼창', { accessNations: ['freefrance'], availability: 'displaced', sourceUrl: 'https://www.cas.cn/xzfc/202206/t20220630_4840013.shtml' }),
  s('cn-wu-ta-you', 'china', '우다유', 1907, 'science', 'science', '이론물리·과학교육 고문', '서남연합대학 물리학 교수', 'National Southwestern Associated University', '쿤밍, 중국', ['양자물리', '분광학', '물리인재 양성'], ['서남연합대학', '중국 물리학회'], '피난대학의 실험장비와 재정이 부족하며 학생·교수의 잦은 이동이 연구 연속성을 해칩니다.', 'Academia Sinica·Wu Ta-You'),
  s('cn-zhou-peiyuan', 'china', '저우페이위안', 1902, 'science', 'science', '유체역학·항공이론 고문', '서남연합대학 물리학 교수', 'National Southwestern Associated University', '쿤밍, 중국', ['유체역학', '상대성이론', '항공교육'], ['서남연합대학', '칭화대 피난 교수진'], '실험설비가 파괴·이전된 상태라 이론 성과를 항공 생산으로 옮기려면 공장과의 연결이 필요합니다.', 'Peking University·Zhou Peiyuan'),
  s('cn-su-buqing', 'china', '쑤부칭', 1902, 'science', 'science', '기하학·계산교육 고문', '저장대학교 수학과 교수', 'National Chekiang University', '구이저우 피난지, 중국', ['미분기하', '수치교육', '인재양성'], ['저장대 피난 교수진', '중국 수학회'], '대학이 여러 지역으로 피난해 도서·교원·학생이 흩어졌으므로 교육망 복구가 먼저입니다.', 'Zhejiang University·Su Buqing'),
  s('cn-hua-luogeng', 'china', '화뤄겅', 1910, 'science', 'science', '수론·작전계산 고문', '서남연합대학 수학 교수', 'National Southwestern Associated University', '쿤밍, 중국', ['수론', '행렬계산', '수학인재 양성'], ['칭화 수학학파', '서남연합대학'], '정규 학력에 대한 관료적 편견과 피난지 자료 부족이 연구·임명에 장애가 됩니다.', 'Chinese Academy of Sciences·Hua Luogeng', { accessNations: ['usa'] }),
  s('cn-lin-qiaozhi', 'china', '린차오즈', 1901, 'science', 'medicine', '산모·피난민 의료고문', '베이징 사립병원 산부인과 의사', 'Peking medical community', '베이징, 점령 중국', ['산부인과', '모자보건', '임상교육'], ['협화의학원 동문망', '베이징 민간의료망'], '협화병원이 점령군에 폐쇄되어 개인진료로 활동했으므로 시설·약품·안전한 환자 이동망이 필요합니다.', 'Peking Union Medical College·Lin Qiaozhi', { availability: 'displaced' }),
  s('cn-wu-lien-teh', 'china', '우롄더', 1879, 'science', 'medicine', '방역·검역체계 고문', '국민정부 방역 원로·의학자', 'Chinese Medical Association', '충칭·말라야 연락권', ['검역', '전염병 방역', '공중보건 행정'], ['중화의학회', '국제 방역망'], '고령의 원로이며 전선·점령지 이동이 어렵고 중앙정부와 지역군벌의 보건권한이 분절되어 있습니다.', 'NUS Medicine·Wu Lien-teh', { accessNations: ['britain', 'india'] }),
  s('cn-fei-xiaotong', 'china', '페이샤오퉁', 1910, 'economy', 'social-science', '농촌사회·민족행정 고문', '윈난대학교 사회학 연구자', 'Yunnan University', '쿤밍·루촌, 중국', ['농촌사회', '민족조사', '지역행정'], ['윈난대학교', '중국 농촌조사망'], '현지 공동체 조사는 군사 징발·강제이주 정책과 충돌하며 독립적 현장접근을 보장해야 합니다.', 'Peking University·Fei Xiaotong'),
  s('cn-liang-sicheng', 'china', '량쓰청', 1901, 'economy', 'engineering', '도시·문화유산 재건고문', '중국영조학사 연구책임자', 'Society for Research in Chinese Architecture', '리좡, 쓰촨, 중국', ['건축사', '도시계획', '문화유산 보호'], ['중국영조학사', '중앙박물원 피난망'], '군사적 철거·폭격과 문화유산 보존이 충돌하고 피난지에서 측량장비·건강이 악화됐습니다.', 'Tsinghua University·Liang Sicheng'),
  s('cn-mao-yisheng', 'china', '마오이성', 1896, 'economy', 'engineering', '교량·수송망 고문', '교통대학교 교장·교량공학자', 'National Chiao Tung University', '구이저우·충칭, 중국', ['교량공학', '철도수송', '시설복구'], ['교통대학교', '국민정부 교통기술망'], '전략교량은 적 점령을 막기 위한 파괴와 보급을 위한 보존 사이에서 반복적으로 희생될 수 있습니다.', 'Chinese Academy of Engineering·Mao Yisheng'),
  s('cn-chen-hansheng', 'china', '천한성', 1897, 'economy', 'economics', '농촌경제·정보분석 고문', '국제 반파시스트 연락망의 농촌경제 연구자', 'Chinese Industrial Cooperatives network', '충칭·인도 연락권', ['농촌경제', '토지조사', '국제정보'], ['중국공업합작운동', '인도·중국 좌파 지식인망'], '공산계 인맥과 국제활동 때문에 국민정부 방첩기관의 의심을 받으며 자료 접근이 제한됩니다.', 'Chinese Academy of Social Sciences·Chen Hansheng', { accessNations: ['india', 'ussr'], availability: 'poachable' }),
  s('cn-li-siguang', 'china', '리쓰광', 1889, 'science', 'science', '지질·전략자원 고문', '중앙연구원 지질연구소장', 'Academia Sinica Institute of Geology', '구이린·충칭, 중국', ['지질조사', '석유탐사', '광물자원'], ['중앙연구원', '중국 지질조사소'], '전쟁으로 조사구역과 표본이 상실됐고 지역군벌·외국기업의 광산권과 충돌할 수 있습니다.', 'Chinese Academy of Sciences·Li Siguang'),

  // 인도 — 과학·공업·농업과 사회권·노동정책을 동등한 국가역량으로 취급한다.
  s('in-cv-raman', 'india', '찬드라세카라 벵카타 라만', 1888, 'science', 'science', '광학·과학기관 고문', '인도과학원 물리학 교수·원장 퇴임자', 'Indian Institute of Science', '방갈로르, 인도', ['광학', '분광학', '과학기관 운영'], ['인도과학원', '인도 과학아카데미'], '강한 독립성과 인사 갈등 때문에 국가 연구조정에 협력하려면 학술 자율성과 연구소 권한을 보장해야 합니다.', 'Nobel Prize·C. V. Raman', { accessNations: ['britain'], sourceUrl: 'https://www.nobelprize.org/prizes/physics/1930/raman/biographical/' }),
  s('in-subrahmanyan-chandrasekhar', 'india', '수브라마니안 찬드라세카르', 1910, 'science', 'science', '천체물리·수리모형 고문', '시카고대학교 천체물리학 교수', 'University of Chicago', '시카고, 미국', ['항성구조', '유체역학', '수리모형'], ['시카고대학교', '인도 해외과학자망'], '미국에 정착한 학자이므로 인도 전시기관으로 이동시키려면 연구시설·시민권·가족 선택을 존중해야 합니다.', 'Nobel Prize·Chandrasekhar', { accessNations: ['usa', 'britain'], availability: 'poachable', nationality: '인도계 미국 연구자' }),
  s('in-vikram-sarabhai', 'india', '비크람 사라바이', 1919, 'science', 'science', '우주선·산업연구 고문', '케임브리지 연구 후 인도과학원 우주선 연구자', 'Indian Institute of Science', '방갈로르, 인도', ['우주선', '대기물리', '연구기관 창설'], ['인도과학원', '아마다바드 산업가문'], '1942년에는 경력 초기라 독자 조직 지휘보다 라만 연구진과 산업 후원망의 지원이 필요합니다.', 'INSA·Vikram Sarabhai', { accessNations: ['britain'] }),
  s('in-jn-ghosh', 'india', '즈난 찬드라 고시', 1894, 'science', 'science', '화학공업·과학원 운영고문', '인도과학원 원장', 'Indian Institute of Science', '방갈로르, 인도', ['물리화학', '산업화학', '연구행정'], ['인도과학원', '인도 화학회'], '식민정부의 전쟁수요와 인도인 연구자의 장기 산업자립 목표 사이에서 예산 갈등이 큽니다.', 'Indian National Science Academy·J. C. Ghosh', { accessNations: ['britain'], sourceUrl: 'https://insaindia.res.in/pdf/Year-Book-2025.pdf' }),
  s('in-an-khosla', 'india', '아유디아 나트 코슬라', 1892, 'economy', 'engineering', '수자원·군수토목 고문', '펀자브 관개청 수석기술자', 'Punjab Irrigation Branch', '라호르·펀자브, 인도', ['댐설계', '관개', '수송토목'], ['인도 공공사업국', '펀자브 기술관료망'], '군용 토목과 장기 농업관개가 같은 철강·시멘트·인력을 놓고 경쟁합니다.', 'Indian National Science Academy·A. N. Khosla'),
  s('in-janaki-ammal', 'india', '자나키 암말', 1897, 'science', 'science', '식물유전·식량작물 고문', '존 이니스 원예연구소 세포유전학자', 'John Innes Horticultural Institution', '런던, 영국', ['세포유전학', '작물육종', '생물다양성'], ['존 이니스 연구소', '인도 여성과학자망'], '영국 전시연구소에 체류 중이며 인종·성별 차별과 귀국로 단절을 해결해야 합니다.', 'John Innes Centre·Janaki Ammal', { accessNations: ['britain'], availability: 'displaced' }),
  s('in-dr-gadgil', 'india', '다난자야 라마찬드라 가드길', 1901, 'economy', 'economics', '농촌금융·개발계획 고문', '고칼레 정치경제연구소장', 'Gokhale Institute of Politics and Economics', '푸네, 인도', ['농촌신용', '개발계획', '협동조합'], ['고칼레 연구소', '봄베이 경제학계'], '지방 농촌개발과 중앙 전쟁조달이 충돌하며 식민정부의 통계 접근 제한이 분석을 약화시킵니다.', 'Gokhale Institute·D. R. Gadgil'),
  s('in-vkrv-rao', 'india', 'V. K. R. V. 라오', 1908, 'economy', 'economics', '국민소득·전후개발 고문', '델리대학교 경제학 교수', 'University of Delhi', '델리, 인도', ['국민소득', '산업화', '교육경제'], ['델리대학교', '인도 경제학자망'], '식민지 통계의 공백과 전시 검열로 국민소득·빈곤 추계가 불완전합니다.', 'Institute for Social and Economic Change·V. K. R. V. Rao'),
  s('in-br-ambedkar', 'india', '빔라오 람지 암베드카르', 1891, 'economy', 'social-science', '노동·수자원·사회권 고문', '총독집행위원회 노동위원', 'Viceroy’s Executive Council', '뉴델리, 인도', ['노동법', '수자원정책', '사회적 평등'], ['불가촉민 권리운동', '식민정부 노동행정'], '카스트 철폐와 노동권 보장이 없는 동원정책에는 반대하며 국민회의와 영국정부 모두와 독자 노선을 유지합니다.', 'Government of India·Ambedkar', { accessNations: ['britain'], availability: 'poachable' }),
  s('in-kamaladevi-chattopadhyay', 'india', '카말라데비 차토파디아야', 1903, 'economy', 'social-science', '협동조합·난민생계 고문', '독립운동가·여성사회운동 조직자', 'All India Women’s Conference networks', '인도 각지', ['협동조합', '여성동원', '수공업 복구'], ['전인도여성회의', '국민회의 사회운동망'], '식민정부에 의해 체포·감시된 경력이 있어 공개 임명은 독립운동 노선과 시민자유 보장을 요구합니다.', 'Government of India Culture·Kamaladevi', { accessNations: ['britain'], availability: 'opposition' }),
  s('in-bp-pal', 'india', '벤저민 피어리 팔', 1906, 'science', 'science', '작물육종·식량안보 고문', '제국농업연구소 식물육종 연구자', 'Imperial Agricultural Research Institute', '델리, 인도', ['밀육종', '식물유전', '식량안보'], ['제국농업연구소', '인도 농업과학망'], '전쟁수송과 벵골 식량위기 속에서 종자·비료·현장시험지가 군수보다 후순위로 밀립니다.', 'Indian Agricultural Research Institute·B. P. Pal'),
  s('in-kamala-sohonie', 'india', '카말라 소호니', 1912, 'science', 'science', '영양생화학·민간급식 고문', '레이디 하딘지 의과대학 생화학 연구자', 'Lady Hardinge Medical College', '뉴델리, 인도', ['영양생화학', '빈곤층 식품', '급식과학'], ['인도 생화학계', '여성 과학자망'], '성차별로 연구직 접근이 제한됐고 민간 영양정책은 군 식량배급과 자원 경쟁을 벌입니다.', 'Indian National Science Academy·Kamala Sohonie', { sourceUrl: 'https://insaindia.res.in/pdf/BS.pdf' }),

  // 자유프랑스 — 본토의 점령·비시 통제와 런던·알제·미주 망명망을 구분한다.
  s('fr-louis-de-broglie', 'freefrance', '루이 드 브로이', 1892, 'science', 'science', '양자이론·학술재건 고문', '파리대학교 이론물리학 교수·과학아카데미 서기', 'University of Paris·Académie des sciences', '파리, 점령 프랑스', ['양자이론', '파동역학', '학술조정'], ['프랑스 과학아카데미', '파리 물리학계'], '점령지에 남아 있어 자유프랑스 합류에는 감시 회피와 연구진 안전 보장이 필요합니다.', 'Nobel Prize·Louis de Broglie', { accessNations: ['britain', 'usa'], availability: 'displaced' }),
  s('fr-irene-joliot-curie', 'freefrance', '이렌 졸리오퀴리', 1897, 'science', 'science', '핵화학·저항연락 고문', '라듐연구소 교수·점령지 과학자', 'Institut du Radium', '파리, 점령 프랑스', ['인공방사능', '핵화학', '과학자 저항망'], ['라듐연구소', '프랑스 지식인 저항망'], '결핵성 건강 악화와 점령당국 감시가 이동·연구를 제한하며 가족과 연구진의 안전이 우선입니다.', 'Nobel Prize·Irène Joliot-Curie', { accessNations: ['britain', 'usa'], availability: 'opposition' }),
  s('fr-rene-cassin', 'freefrance', '르네 카생', 1887, 'economy', 'diplomacy', '법률·정통성 고문', '런던 자유프랑스 법률위원', 'Free French National Committee', '런던, 영국', ['국제법', '망명정부 정통성', '인권제도'], ['자유프랑스 위원회', '연합국 법률가망'], '군사적 긴급권과 법치·민간대표성 사이에서 드골 지도부와 마찰할 수 있습니다.', 'Nobel Prize·René Cassin', { accessNations: ['britain', 'usa'] }),
  s('fr-alfred-sauvy', 'freefrance', '알프레드 소비', 1898, 'economy', 'economics', '인구·배급통계 고문', '점령 프랑스 통계·경제 연구자', 'Statistique générale de la France networks', '비시·파리, 프랑스', ['인구통계', '배급', '노동력 전망'], ['프랑스 통계기관', '인구학 연구망'], '비시 체제 아래의 관료 경력과 비공식 저항·정보활동을 검증해야 하며 자료가 점령정책에 오염됐습니다.', 'INED·Alfred Sauvy', { availability: 'poachable' }),
  s('fr-francois-perroux', 'freefrance', '프랑수아 페루', 1903, 'economy', 'economics', '산업권력·재건경제 고문', '파리대학교 경제학 교수', 'University of Paris', '리옹·파리, 프랑스', ['산업조직', '경제권력', '재건계획'], ['프랑스 경제학계', '산업조사 연구망'], '비시기의 기관 참여와 비판적 활동이 교차하므로 정치적 책임과 실제 행동을 별도로 심사해야 합니다.', 'Collège de France·François Perroux', { availability: 'poachable' }),
  s('fr-maurice-allais', 'freefrance', '모리스 알레', 1911, 'economy', 'economics', '광업경제·수리계획 고문', '국립광업학교 기술관료·광산 엔지니어', 'Corps des mines', '낭트·파리, 프랑스', ['수리경제', '광산운영', '효율배분'], ['국립광업학교', '프랑스 광업기술단'], '점령하 공공행정에 속해 있어 자유프랑스 접촉은 보안 위험이 높고 당시 경제학 경력은 초기 단계입니다.', 'Nobel Prize·Maurice Allais', { availability: 'displaced' }),
  s('fr-andre-lwoff', 'freefrance', '앙드레 르보프', 1902, 'science', 'medicine', '미생물·영양생리 고문', '파스퇴르연구소 미생물 연구자', 'Institut Pasteur', '파리, 점령 프랑스', ['미생물학', '바이러스', '영양생리'], ['파스퇴르연구소', '프랑스 생물학자망'], '유대계 연구자 박해와 점령당국의 연구소 통제로 실험·이동·출판이 제한됩니다.', 'Nobel Prize·André Lwoff', { accessNations: ['britain', 'usa'], availability: 'opposition' }),
  s('fr-marcel-dassault', 'freefrance', '마르셀 다소', 1892, 'science', 'engineering', '항공설계·산업재건 고문', '독일 협력을 거부한 항공설계자·피구금자', 'Société des Avions Marcel Bloch', '프랑스 수용소·감옥', ['항공기설계', '프로펠러', '공장재건'], ['블로크 항공기술진', '프랑스 항공산업망'], '유대계라는 이유와 협력 거부로 구금됐으므로 탈출·해방 없이는 임명할 수 없습니다.', 'Musée de l’Air·Marcel Dassault', { accessNations: ['britain'], availability: 'displaced' }),
  s('fr-emile-borel', 'freefrance', '에밀 보렐', 1871, 'science', 'science', '확률·저항학술망 고문', '파리 수학자·레지스탕스 지원자', 'Académie des sciences', '생아프리크·파리, 프랑스', ['확률론', '위험분석', '학술저항망'], ['프랑스 과학아카데미', '지식인 레지스탕스'], '고령이며 점령당국에 체포될 위험이 커 직접 작전보다 인맥·정통성 역할에 적합합니다.', 'Académie des sciences·Émile Borel', { availability: 'opposition' }),
  s('fr-georges-boris', 'freefrance', '조르주 보리스', 1888, 'economy', 'economics', '망명정부 경제·방송 고문', '런던 자유프랑스 재정·경제 자문관', 'Free French National Committee', '런던, 영국', ['전쟁재정', '경제선전', '사회개혁'], ['자유프랑스 런던본부', '프랑스 진보언론망'], '급진적 사회개혁 구상은 보수 군부·식민관료와 갈등하며 본토 경제자료도 제한됩니다.', 'Fondation de la Résistance·Georges Boris', { accessNations: ['britain'] }),
  s('fr-jacques-trefouel', 'freefrance', '자크 트레푸엘', 1897, 'science', 'medicine', '항균제·연구소 운영고문', '파스퇴르연구소장', 'Institut Pasteur', '파리, 점령 프랑스', ['설폰아미드', '감염치료', '연구소 보호'], ['파스퇴르연구소', '프랑스 의약화학망'], '연구소를 점령당국과 물자 압수에서 지켜야 하며 공개 협력처럼 보이는 행정행위의 책임을 검증해야 합니다.', 'Institut Pasteur·Jacques Tréfouël', { availability: 'displaced' }),
  s('fr-marc-bloch', 'freefrance', '마르크 블로크', 1886, 'economy', 'intelligence', '지역사회·저항정보 고문', '역사가·리옹 지역 레지스탕스 조직가', 'Franc-Tireur resistance network', '리옹, 점령 프랑스', ['지역사 분석', '저항조직', '점령사회 정보'], ['프랑티뢰르', '프랑스 대학·교사망'], '유대계 레지스탕스 지도자라 체포·고문·처형 위험이 극도로 높고 연락망 노출을 최소화해야 합니다.', 'Fondation de la Résistance·Marc Bloch', { accessNations: ['britain'], availability: 'opposition' }),

  // 이탈리아 — 국내 잔류, 인종법에 따른 망명, 반파시스트 지하망을 서로 다른 계약 조건으로 둔다.
  s('it-emilio-segre', 'italy', '에밀리오 세그레', 1905, 'science', 'science', '핵물리·방사성원소 고문', '버클리 방사선연구소 연구자·맨해튼 계획 합류자', 'UC Berkeley Radiation Laboratory', '버클리·로스앨러모스, 미국', ['핵물리', '플루토늄', '입자검출'], ['버클리 연구진', '이탈리아 망명 물리학자'], '파시스트 인종법으로 귀국할 수 없으며 이탈리아 영입에는 정권 전환·안전보장·연합국 보안승인이 필요합니다.', 'Nobel Prize·Emilio Segrè', { accessNations: ['usa'], nationality: '이탈리아계 유대인 망명', availability: 'opposition' }),
  s('it-giuseppe-occhialini', 'italy', '주세페 오키알리니', 1907, 'science', 'science', '우주선·입자검출 고문', '상파울루대학교 물리학 연구자', 'University of São Paulo', '상파울루, 브라질', ['우주선', '입자검출', '고에너지물리'], ['브라질 물리학계', '이탈리아 반파시스트 과학자망'], '파시즘을 떠나 남미에 있어 이동로와 연구장비 이전이 필요하고 본국 정권에 대한 신뢰가 없습니다.', 'INFN·Giuseppe Occhialini', { accessNations: ['usa', 'freefrance'], availability: 'displaced' }),
  s('it-rita-levi-montalcini', 'italy', '리타 레비몬탈치니', 1909, 'science', 'medicine', '신경발생·임시실험실 고문', '토리노 자택 비밀실험실의 신경학 연구자', 'Independent home laboratory', '토리노, 이탈리아', ['신경발생', '조직배양', '임시연구실'], ['토리노 의학계', '유대계 지하 지원망'], '인종법으로 대학에서 추방됐고 체포 위험이 있으므로 보호·복권과 비밀 연구공간이 필수입니다.', 'Nobel Prize·Rita Levi-Montalcini', { accessNations: ['usa', 'freefrance'], availability: 'opposition' }),
  s('it-giulio-natta', 'italy', '줄리오 나타', 1903, 'science', 'science', '고분자·산업화학 고문', '밀라노공과대학 산업화학 교수', 'Politecnico di Milano', '밀라노, 이탈리아', ['고분자화학', '촉매', '합성소재'], ['밀라노공과대학', '몬테카티니 화학산업'], '석유계 원료와 정밀 촉매가 부족하고 기업·국가의 군수특허 통제가 연구 공유를 제한합니다.', 'Nobel Prize·Giulio Natta'),
  s('it-corradino-dascanio', 'italy', '코라디노 다스카니오', 1891, 'science', 'engineering', '회전익·프로펠러 설계고문', '피아조 항공기술 설계자', 'Piaggio', '폰테데라, 이탈리아', ['헬리콥터', '프로펠러', '경량차량'], ['피아조 기술진', '이탈리아 항공공학계'], '회전익 사업은 정권·군의 관심을 잃었고 피아조 생산력은 기존 항공군수에 묶여 있습니다.', 'Piaggio Museum·D’Ascanio'),
  s('it-piero-sraffa', 'italy', '피에로 스라파', 1898, 'economy', 'economics', '산업가격·반파시스트 경제고문', '케임브리지대학교 경제학 연구자', 'University of Cambridge', '케임브리지, 영국', ['가격이론', '산업분배', '반파시스트 연락'], ['케임브리지 경제학계', '이탈리아 반파시스트 지식인망'], '영국에 정착한 반파시스트이므로 본국 복귀에는 파시즘 붕괴와 학문·신변 안전이 필요합니다.', 'Trinity College Cambridge·Piero Sraffa', { accessNations: ['britain', 'freefrance'], availability: 'opposition' }),
  s('it-giorgio-mortara', 'italy', '조르조 모르타라', 1885, 'economy', 'economics', '인구·전쟁통계 고문', '브라질 망명 경제통계학 교수', 'University of Brazil', '리우데자네이루, 브라질', ['인구통계', '보험수리', '경제조사'], ['브라질 통계기관', '이탈리아 망명 학자망'], '인종법으로 망명했으므로 복귀에는 법 폐지·재산회복과 장거리 이동이 필요합니다.', 'Italian Statistical Society·Mortara', { accessNations: ['usa', 'freefrance'], availability: 'displaced' }),
  s('it-gustavo-del-vecchio', 'italy', '구스타보 델 베키오', 1883, 'economy', 'economics', '통화·은행제도 고문', '인종법으로 해직된 전 볼로냐대학교 교수', 'Italian academic exile network', '이탈리아 내 은신', ['통화이론', '은행제도', '재정안정'], ['이탈리아 경제학회', '유대계 학술망'], '유대인 인종법으로 공직에서 추방돼 체포 위험이 있으며 파시스트 정부 아래서는 공개 임명이 불가능합니다.', 'Banca d’Italia History·Del Vecchio', { availability: 'opposition' }),
  s('it-donato-menichella', 'italy', '도나토 메니켈라', 1896, 'economy', 'industry', '산업금융·은행정리 고문', '산업부흥공사 IRI 고위 경영자', 'Istituto per la Ricostruzione Industriale', '로마, 이탈리아', ['산업금융', '부실은행 정리', '공기업 운영'], ['IRI', '이탈리아 은행관료망'], '국가통제 산업의 효율화가 파시스트 후원기업·군수 우선배분과 충돌합니다.', 'Banca d’Italia·Donato Menichella'),
  s('it-pasquale-jannaccone', 'italy', '파스콸레 얀나코네', 1872, 'economy', 'economics', '재정·농업경제 원로고문', '토리노 경제학자·학술원 회원', 'University of Turin networks', '토리노, 이탈리아', ['재정학', '농업경제', '통계'], ['토리노 경제학계', '이탈리아 학술원'], '고령이고 파시스트 학술통제 아래 있어 장기 현장행정보다 제도설계와 인재 추천에 적합합니다.', 'Accademia dei Lincei·Jannaccone'),
  s('it-ugo-fano', 'italy', '우고 파노', 1912, 'science', 'science', '방사선·원자물리 고문', '워싱턴 카네기연구소·미국 연구진 합류자', 'Carnegie Institution of Washington', '워싱턴 D.C., 미국', ['원자물리', '방사선생물학', '분광이론'], ['미국 원자연구망', '이탈리아 망명 물리학자'], '인종법을 피해 미국으로 이주했으며 군사보안 승인과 망명자 가족 안전이 계약 조건입니다.', 'NIST·Ugo Fano', { accessNations: ['usa'], availability: 'displaced' }),
  s('it-enrico-mattei', 'italy', '엔리코 마테이', 1906, 'economy', 'industry', '화학산업·저항조달 고문', '밀라노 화학기업 경영자', 'Industria Chimica Lombarda', '밀라노, 이탈리아', ['화학제품 조달', '비밀재정', '산업조직'], ['북이탈리아 기업망', '가톨릭계 저항 연락망'], '1942년에는 후일의 저항 지도부 경력 이전 단계이며 공개 반파시스트 임무는 기업과 가족을 위험에 빠뜨립니다.', 'Fondazione Mattei·Enrico Mattei', { availability: 'poachable' }),
  s('it-beppo-levi', 'italy', '베포 레비', 1875, 'science', 'science', '수학·망명대학 고문', '로사리오 국립해안대학교 수학연구소장', 'Universidad Nacional del Litoral', '로사리오, 아르헨티나', ['해석학', '수학교육', '연구소 창설'], ['아르헨티나 수학계', '이탈리아 유대계 망명학자'], '인종법으로 추방된 원로이므로 정권 전환과 대학 복권 없이는 이탈리아에 돌아오지 않습니다.', 'Italian Mathematical Union·Beppo Levi', { accessNations: ['usa', 'freefrance'], availability: 'displaced' }),

  // 조선 — 식민지 기관 안의 전문직, 망명·유학망, 독립진영의 신뢰 문제를 숨기지 않는다.
  s('kr-lee-won-chul', 'korea', '이원철', 1896, 'science', 'science', '천문·과학교육 고문', '연희전문학교 전 교수·천문학자', 'Yonhi College scientific network', '경성, 조선', ['천문학', '기상관측', '과학교육'], ['연희전문학교', '조선 과학자망'], '식민당국의 교육통제와 학교 탄압으로 공식 연구 기반이 약화됐으며 독립기관 복구가 필요합니다.', '대한민국 과학기술유공자·이원철', { accessNations: ['china', 'usa'], sourceUrl: 'https://www.koreascientists.kr/' }),
  s('kr-woo-jang-choon', 'korea', '우장춘', 1898, 'science', 'science', '작물유전·종자개량 고문', '일본 농림성 농사시험장 출신 민간 육종가', 'Japanese agricultural research network', '교토·도쿄, 일본', ['작물유전', '종자개량', '채소육종'], ['일본 농사시험장 인맥', '재일 조선인 과학자망'], '일본 국적·식민지 가계와 연구경력 때문에 어느 진영에서도 신뢰검증과 가족의 선택이 필요합니다.', '대한민국 과학기술유공자·우장춘', { accessNations: ['japan'], availability: 'poachable', sourceUrl: 'https://www.koreascientists.kr/' }),
  s('kr-choi-gyu-nam', 'korea', '최규남', 1898, 'science', 'science', '물리·고등교육 고문', '연희전문학교 물리학 교수 출신 교육자', 'Yonhi College', '경성, 조선', ['실험물리', '과학교육', '대학행정'], ['연희전문학교', '조선 물리학자망'], '식민교육기관의 폐쇄·개편과 전시동원으로 연구·교육의 독립성이 크게 제한됩니다.', '한국민족문화대백과사전·최규남', { accessNations: ['usa'] }),
  s('kr-kim-yong-gwan', 'korea', '김용관', 1897, 'science', 'engineering', '과학대중화·산업기술 고문', '발명학회·과학운동 조직자', 'Joseon Invention Society networks', '경성, 조선', ['과학대중화', '발명교육', '생활기술'], ['발명학회', '조선 과학대중운동망'], '식민경찰의 감시와 단체 해산, 부품·자금 부족 때문에 공개 활동은 독립운동 노출 위험을 높입니다.', '한국과학사 자료·김용관', { availability: 'opposition' }),
  s('kr-jang-gi-ryeo', 'korea', '장기려', 1911, 'science', 'medicine', '외과·빈민의료 고문', '평양 연합기독병원 외과의', 'Pyongyang Union Christian Hospital', '평양, 조선', ['외과수술', '빈민의료', '병원교육'], ['평양 기독의료망', '조선 의학교육계'], '식민지 전시의료 통제와 약품 부족 속에서 민간 환자 우선 원칙이 군 의료 요구와 충돌합니다.', '대한의학회·장기려'),
  s('kr-paik-in-je', 'korea', '백인제', 1899, 'science', 'medicine', '외과·민족병원 운영고문', '백인제외과병원장', 'Paik In-je Surgical Hospital', '경성, 조선', ['외과수술', '병원경영', '의학교육'], ['백인제병원', '경성 의학전문가망'], '사립병원은 식민당국의 허가·물자통제를 받으며 공개 정치활동은 환자와 직원의 안전을 위협합니다.', '백병원 역사·백인제'),
  s('kr-lee-yong-seol', 'korea', '이용설', 1895, 'science', 'medicine', '공중보건·의학교육 고문', '세브란스의학전문학교 교수·의사', 'Severance Union Medical College', '경성, 조선', ['내과', '공중보건', '의학교육'], ['세브란스 의료망', '기독교 사회사업망'], '전시기 학교·병원의 일본화 압력과 종교계 감시 때문에 독립적 의료행정이 어렵습니다.', '연세대학교 의학사·이용설', { accessNations: ['usa'] }),
  s('kr-kim-hwallan', 'korea', '김활란', 1899, 'economy', 'social-science', '여성교육·동원행정 고문', '이화여자전문학교 교장', 'Ewha College', '경성, 조선', ['여성교육', '학교행정', '국제교류'], ['이화여전', '기독교 여성교육망'], '전시 친일협력 행적이 명확한 논쟁 대상이므로 독립진영 임명은 공개 검증·책임·신뢰비용을 요구합니다.', '한국민족문화대백과사전·김활란', { accessNations: ['japan', 'usa'], availability: 'opposition' }),
  s('kr-park-indeok', 'korea', '박인덕', 1896, 'economy', 'social-science', '여성직업교육·국제연락 고문', '여성교육가·사회사업가', 'Korean women’s education networks', '경성·미국 연락권', ['직업교육', '여성조직', '국제모금'], ['조선 여성교육망', '미국 기독교 후원망'], '전시 협력 논란과 해외 후원망 의존 때문에 독립진영 정통성 심사와 투명한 재정감사가 필요합니다.', '한국민족문화대백과사전·박인덕', { accessNations: ['usa', 'japan'], availability: 'poachable' }),
  s('kr-yu-eok-gyeom', 'korea', '유억겸', 1895, 'economy', 'social-science', '교육법·학교행정 고문', '연희전문학교 부교장 출신 법학자', 'Yonhi College', '경성, 조선', ['법학교육', '학교행정', '체육조직'], ['연희전문학교', '조선 교육자망'], '식민지 교육법과 전시동원 명령 아래에서 학교 자치권이 거의 없으며 공개 저항은 폐교 위험을 부릅니다.', '한국민족문화대백과사전·유억겸'),
  s('kr-choi-seung-hee', 'korea', '최승희', 1911, 'economy', 'diplomacy', '문화외교·선전예술 고문', '동아시아 순회 무용가', 'Choi Seung-hee Dance Company', '도쿄·경성·만주 순회권', ['문화외교', '대중선전', '공연조직'], ['동아시아 공연망', '조선 예술가망'], '제국 전시선전에 동원된 경력과 민족예술의 세계화가 함께 존재하므로 강요·협력·책임을 구분해야 합니다.', '국립문화유산연구원·최승희', { accessNations: ['japan', 'china'], availability: 'poachable' }),
  s('kr-kang-yong-heul', 'korea', '강용흘', 1903, 'economy', 'diplomacy', '해외여론·문화연락 고문', '미국 대학 강사·영문 작가', 'U.S. Korean diaspora academic network', '미국 동부', ['영문선전', '문화번역', '한인 디아스포라'], ['미국 대학문학계', '재미 한인망'], '미국 내 문화활동을 조선 현지 조직과 연결할 통신망이 약하고 군사 선전으로의 과도한 이용에 반대할 수 있습니다.', 'Korean Literature Translation Institute·Kang Yong-heul', { accessNations: ['usa'] }),

  // 베트남 — 식민교육의 전문직과 독립운동의 지하조직 사이 이동 비용을 실제 플레이 조건으로 둔다.
  s('vn-ta-quang-buu', 'vietnam', '따꽝브우', 1910, 'science', 'science', '수학·전파기술 교육고문', '후에·하노이의 수학 교사·독학 연구자', 'Indochinese secondary education network', '후에·하노이, 인도차이나', ['수학', '전파공학', '과학교육'], ['베트남 교사망', '프랑스 유학 동문망'], '식민교육기관과 점령행정의 감시 아래 있어 지하 기술교육으로 전환하면 체포 위험이 커집니다.', 'Vietnam Academy of Science·Tạ Quang Bửu'),
  s('vn-nguyen-xien', 'vietnam', '응우옌씨엔', 1907, 'science', 'science', '기상·수리관측 고문', '인도차이나 기상관측 기술자·교사', 'Indochina Meteorological Service networks', '하노이, 인도차이나', ['기상학', '수학', '관측망'], ['인도차이나 기상대', '베트남 과학교사망'], '기상자료가 프랑스·일본 군사기관에 통제되어 독립세력에 제공하면 방첩 작전이 필요합니다.', 'Vietnam Academy of Science·Nguyễn Xiển'),
  s('vn-dang-van-ngu', 'vietnam', '당반응으', 1910, 'science', 'medicine', '기생충·전염병 고문', '하노이 의학·기생충 연구자', 'Indochina medical research network', '하노이, 인도차이나', ['기생충학', '말라리아', '현장검사'], ['하노이 의학계', '베트남 유학생망'], '연구시설과 혈청·현미경이 부족하며 1943년 일본 연구 유학 이전 단계라 이동 경로가 불안정합니다.', 'Vietnam medical history·Đặng Văn Ngữ'),
  s('vn-ton-that-tung', 'vietnam', '똔텃뚱', 1912, 'science', 'medicine', '외과·간수술 고문', '인도차이나 의과대학 외과의', 'Indochina Medical College', '하노이, 인도차이나', ['외과수술', '간해부', '임상교육'], ['하노이 병원망', '베트남 의학생 조직'], '식민 의료체계의 인종차별과 일본 점령기의 약품 부족으로 독립적 수술팀 운영이 제한됩니다.', 'Vietnam medical history·Tôn Thất Tùng'),
  s('vn-tran-huu-tuoc', 'vietnam', '쩐흐우트억', 1913, 'science', 'medicine', '이비인후·해외저항 연락고문', '파리 의학 연구자·유학생 조직가', 'Paris medical community', '파리, 점령 프랑스', ['이비인후과', '의료교육', '유학생 연락'], ['파리 베트남 유학생망', '프랑스 의료계'], '점령 프랑스에 있어 게슈타포·비시 감시를 피한 연락망과 전후 귀환 계획이 필요합니다.', 'Vietnam medical history·Trần Hữu Tước', { accessNations: ['freefrance'], availability: 'displaced' }),
  s('vn-ho-dac-di', 'vietnam', '호닥지', 1900, 'science', 'medicine', '외과·의학교육 고문', '인도차이나 의과대학 외과 교수', 'Indochina Medical College', '하노이, 인도차이나', ['외과학', '의학교육', '병원행정'], ['인도차이나 의과대학', '베트남 의사망'], '프랑스 식민 의료기관의 직위와 독립운동 지원 사이에서 발각되면 교수진·학생 전체가 위험해집니다.', 'Hanoi Medical University·Hồ Đắc Di'),
  s('vn-nguyen-van-huyen', 'vietnam', '응우옌반후옌', 1905, 'economy', 'social-science', '민속·교육행정 고문', '극동박고원 연구자', 'École française d’Extrême-Orient', '하노이, 인도차이나', ['민속학', '교육정책', '농촌사회'], ['극동박고원', '베트남 교사·학자망'], '식민 학술기관 자료를 독립행정에 쓰려면 조사대상 공동체의 신뢰와 문화재 통제권을 회복해야 합니다.', 'EFEO·Nguyễn Văn Huyên'),
  s('vn-dao-duy-anh', 'vietnam', '다오주이아인', 1904, 'economy', 'social-science', '역사·언어정책 고문', '후에의 역사학자·사전편찬자', 'Huế intellectual network', '후에, 인도차이나', ['역사학', '사전편찬', '민족정체성'], ['후에 지식인망', '베트남 출판계'], '식민당국의 투옥·감시 전력이 있고 통일된 민족서사는 지역·이념 차이와 충돌할 수 있습니다.', 'Vietnam Academy of Social Sciences·Đào Duy Anh', { availability: 'opposition' }),
  s('vn-nguyen-manh-tuong', 'vietnam', '응우옌마인뜨엉', 1909, 'economy', 'social-science', '법률·고등교육 고문', '하노이 변호사·프랑스문학 연구자', 'Hanoi legal community', '하노이, 인도차이나', ['법학', '고등교육', '프랑스어 외교'], ['하노이 법조계', '프랑스 유학 지식인망'], '법치와 학문 자율성을 중시해 당·군의 일방 통제와 충돌할 가능성이 큽니다.', 'Vietnam legal history·Nguyễn Mạnh Tường'),
  s('vn-pham-ngoc-thach', 'vietnam', '팜응옥타익', 1909, 'science', 'medicine', '결핵·지하보건조직 고문', '사이공 의사·비밀 독립운동 조직가', 'Saigon medical community', '사이공, 인도차이나', ['결핵관리', '대중보건', '비밀조직'], ['사이공 의료망', '남부 독립운동 연락선'], '공개 의료활동과 비밀조직을 동시에 운영해 한쪽이 발각되면 환자·조직 모두 위험합니다.', 'Vietnam Ministry of Health history·Phạm Ngọc Thạch', { availability: 'opposition' }),
  s('vn-duong-quang-ham', 'vietnam', '즈엉꽝함', 1898, 'economy', 'social-science', '교육과정·문학교육 고문', '부오이 고등학교 교사·교과서 저자', 'Lycée du Protectorat', '하노이, 인도차이나', ['교육과정', '베트남문학', '교사양성'], ['부오이 고등학교', '베트남 교사망'], '식민 교육과정과 민족 언어교육 사이에서 검열을 받으며 1946년 사망 경위도 불확실성이 남습니다.', 'Vietnam education history·Dương Quảng Hàm'),
  s('vn-bui-bang-doan', 'vietnam', '부이방도안', 1889, 'economy', 'diplomacy', '법률·과도행정 고문', '응우옌 왕조 고위 사법관료', 'Huế royal administration', '후에, 인도차이나', ['사법행정', '관료조정', '과도정부'], ['후에 조정 관료망', '베트남 법률가망'], '왕조 관료 경력은 혁명세력의 불신을 부르며 협력에는 신변보장과 점진적 제도전환이 필요합니다.', 'Vietnam National Assembly history·Bùi Bằng Đoàn', { availability: 'poachable' }),

  // 인도네시아 — 일본 점령기 협력·비협력의 차이와 독립 후 국가역량으로 이어지는 전문성을 함께 표현한다.
  s('id-mohammad-hatta', 'indonesia', '모하맛 하타', 1902, 'economy', 'economics', '협동조합·독립재정 고문', '수카르노와 함께한 민족주의 지도자·경제학자', 'Indonesian nationalist administration networks', '자바·수마트라, 인도네시아', ['협동조합', '통화재정', '국제협상'], ['인도네시아 민족주의자망', '네덜란드 유학 경제학계'], '일본 점령기 조직 참여가 독립 준비와 강제동원 협력 사이의 정통성 논쟁을 일으킵니다.', 'Bank Indonesia Museum·Mohammad Hatta', { accessNations: ['japan'], availability: 'poachable' }),
  s('id-sutan-sjahrir', 'indonesia', '수탄 샤리르', 1909, 'economy', 'diplomacy', '지하저항·대외협상 고문', '일본 비협력 지하조직 지도자', 'Indonesian underground resistance', '자바, 인도네시아', ['지하조직', '노동운동', '대외협상'], ['청년 사회주의자망', '네덜란드 반파시스트 연락선'], '공개 점령기관 참여를 거부해 자금·통신이 부족하고 협력파 민족주의 지도부와 갈등합니다.', 'Indonesian National Archives·Sutan Sjahrir', { accessNations: ['freefrance'], availability: 'opposition' }),
  s('id-johannes-leimena', 'indonesia', '요하네스 레이메나', 1905, 'science', 'medicine', '공중보건·기독교 지역연락 고문', '자카르타 의사·기독교 청년운동 지도자', 'Medical Mission networks', '자카르타, 인도네시아', ['공중보건', '지역의료', '종교간 조정'], ['인도네시아 의사망', '기독교 청년조직'], '점령기 의약품 부족과 종교·지역 대표성 갈등 속에서 자바 중심 정책을 경계합니다.', 'Indonesian National Hero Archive·Leimena'),
  s('id-achmad-mochtar', 'indonesia', '아흐마드 모흐타르', 1892, 'science', 'medicine', '세균학·백신연구 고문', '에이크만 연구소장', 'Eijkman Institute', '자카르타, 인도네시아', ['세균학', '백신', '열대의학'], ['에이크만 연구소', '인도네시아 의사망'], '일본군의 오염 백신 사건 책임을 대신 떠안고 1945년 처형되는 실제 위험이 있어 연구소 보호와 사법독립이 필수입니다.', 'Eijkman Institute history·Achmad Mochtar', { availability: 'displaced' }),
  s('id-tjipto-mangoenkoesoemo', 'indonesia', '칩토 망운쿠수모', 1886, 'science', 'medicine', '빈민의료·민족운동 고문', '수카부미의 의사·피감시 민족주의 원로', 'Indische Partij networks', '수카부미, 자바', ['빈민의료', '민족운동', '대중조직'], ['인디셰 파르타이 인맥', '자바 민간의료망'], '고령과 천식, 식민당국의 유배·감시 전력 때문에 현장활동이 제한되며 1943년 사망 위험이 있습니다.', 'Indonesian National Hero Archive·Tjipto', { availability: 'opposition' }),
  s('id-armijn-pane', 'indonesia', '아르민 파네', 1908, 'economy', 'social-science', '언어·문화선전 고문', '푸장가 바루 작가·편집자', 'Poedjangga Baroe', '자카르타, 인도네시아', ['인도네시아어', '출판', '문화정체성'], ['푸장가 바루 문인망', '인도네시아 교육자망'], '점령 검열 아래 문화활동이 선전도구로 전용될 수 있고 지역언어와 국민어 정책이 충돌합니다.', 'National Library of Indonesia·Armijn Pane'),
  s('id-poerbatjaraka', 'indonesia', '푸르바차라카', 1884, 'economy', 'social-science', '문헌·문화유산 고문', '바타비아 고대자바어 문헌학자', 'Bataviaasch Genootschap networks', '자카르타, 인도네시아', ['고대자바어', '문헌학', '문화재 행정'], ['바타비아 학술원', '자바 궁정 문헌망'], '식민 학술기관 자료의 소유권과 자바 중심 서사가 다른 섬의 정체성과 충돌할 수 있습니다.', 'National Library of Indonesia·Poerbatjaraka'),
  s('id-roosseno', 'indonesia', '루세노 수르조하디쿠수모', 1908, 'science', 'engineering', '토목·방어시설 고문', '반둥공과대학 토목공학자', 'Technische Hoogeschool Bandung', '반둥, 인도네시아', ['철근콘크리트', '교량', '방어시설'], ['반둥 공학계', '인도네시아 토목기술자망'], '점령으로 대학과 건설자재가 통제됐으며 군용 건설이 민간 인프라 복구를 희생시킬 수 있습니다.', 'Institut Teknologi Bandung·Roosseno'),
  s('id-margono-djojohadikusumo', 'indonesia', '마르고노 조요하디쿠수모', 1894, 'economy', 'economics', '협동금융·중앙은행 고문', '식민 신용협동조합 행정가', 'Volkscredietwezen networks', '자바, 인도네시아', ['협동금융', '농촌신용', '중앙은행 설계'], ['토착 신용조합망', '인도네시아 경제관료'], '식민 금융기관의 부채·기록을 독립정부가 승계할지에 대한 정치적 합의가 필요합니다.', 'Bank Negara Indonesia history·Margono'),
  s('id-aa-maramis', 'indonesia', '알렉산더 안드리스 마라미스', 1897, 'economy', 'diplomacy', '헌정·재무외교 고문', '변호사·민족주의 법률가', 'Indonesian legal nationalist network', '자카르타, 인도네시아', ['헌정', '재정법', '종교간 조정'], ['인도네시아 법조계', '미나하사 지식인망'], '점령기 공개활동은 일본 통제와 연결되고 독립 헌정에서는 종교·지역 대표성 협상이 필요합니다.', 'Indonesian Ministry of Finance history·A. A. Maramis'),
  s('id-ki-hadjar-dewantara', 'indonesia', '키 하자르 데완타라', 1889, 'economy', 'social-science', '국민교육·문화자립 고문', '타만시스와 교육운동 지도자', 'Taman Siswa', '욕야카르타, 인도네시아', ['국민교육', '교사양성', '문화자립'], ['타만시스와 학교망', '인도네시아 민족교육자'], '일본 점령기관 참여와 학교 자치 사이의 긴장이 있으며 군국주의 교육을 거부하면 탄압받을 수 있습니다.', 'Indonesia Education Ministry·Ki Hadjar Dewantara', { availability: 'poachable' }),
  s('id-maria-ulfah-santoso', 'indonesia', '마리아 울파 산토소', 1911, 'economy', 'social-science', '여성법률·사회정책 고문', '인도네시아 최초 세대 여성 법률가·교사', 'Indonesian women’s legal network', '자카르타, 인도네시아', ['가족법', '여성권리', '사회정책'], ['여성 법률가망', '민족주의 교육조직'], '점령행정과 전통 가족법 모두에서 여성 대표성이 약해 제도개혁에 보수층 반발이 예상됩니다.', 'Indonesian Women’s History·Maria Ulfah'),

  // 필리핀 — 점령 마닐라, 게릴라 지역, 미국 망명정부의 세 공간을 별도 인맥과 위험으로 모델링한다.
  s('ph-arturo-alcaraz', 'philippines', '아르투로 알카라스', 1916, 'science', 'science', '지질·에너지자원 고문', '필리핀 광산국 젊은 지질학자', 'Philippine Bureau of Mines', '루손, 필리핀', ['화산지질', '광물탐사', '지열 기반'], ['필리핀 광산국', '필리핀대학교 지질학계'], '1942년에는 경력 초기이고 점령으로 조사장비·현장 이동이 제한되어 원로 지질진의 지원이 필요합니다.', 'Philippine DOST·Arturo Alcaraz'),
  s('ph-julian-banzon', 'philippines', '줄리언 반손', 1908, 'science', 'science', '연료·농산화학 고문', '필리핀대학교 농업대학 화학 연구자', 'UP College of Agriculture', '로스바뇨스, 필리핀', ['농산화학', '대체연료', '발효공정'], ['UP 로스바뇨스', '필리핀 농업과학망'], '대학 시설이 점령·전투에 노출되고 원료는 식량과 연료 생산 사이에서 경쟁합니다.', 'Philippine NAST·Julian Banzon', { sourceUrl: 'https://nast.dost.gov.ph/images/pdf%20files/Publications/ASM/NAST%201997%2019th%20Annual%20Scientific%20Meeting%209-10%20July.pdf' }),
  s('ph-eduardo-quisumbing', 'philippines', '에두아르도 키숨빙', 1895, 'science', 'science', '약용식물·식량자원 고문', '국립박물관 식물학자', 'National Museum of the Philippines', '마닐라, 필리핀', ['식물분류', '약용식물', '표본보존'], ['국립표본관', '필리핀 식물학자망'], '표본관과 현장기록이 전쟁에 파괴될 위험이 크며 군의 약용자원 채취가 생태·민간 이용을 해칠 수 있습니다.', 'Philippine NAST·Eduardo Quisumbing', { sourceUrl: 'https://nast.dost.gov.ph/images/pdf%20files/Publications/Annual%20Reports/Academy%20News%201980%20Vol.%202%20No.%203.pdf' }),
  s('ph-juan-salcedo-jr', 'philippines', '후안 살세도 주니어', 1904, 'science', 'medicine', '영양·공중보건 고문', '필리핀 공중보건·영양 의사', 'Philippine public health service', '마닐라·루손, 필리핀', ['영양학', '각기병 예방', '공중보건'], ['필리핀 보건국', '의학·영양 연구망'], '점령기 식량부족에서 군·수감자·민간인의 배급 우선순위가 충돌하고 자료수집도 어렵습니다.', 'Philippine NAST·Juan Salcedo Jr.', { sourceUrl: 'https://www.members.nast.dost.gov.ph/index.php/list-of-national-scientist/details/3/31' }),
  s('ph-maria-orosa', 'philippines', '마리아 오로사', 1893, 'science', 'industry', '식품보존·게릴라보급 고문', '식물산업국 식품기술자·비밀 보급조직원', 'Bureau of Plant Industry', '마닐라, 필리핀', ['식품보존', '영양식', '비밀보급'], ['식물산업국', '마닐라 게릴라 연락망'], '점령군 감시 아래 수감자·게릴라에 식품을 전달하므로 연락망 노출 시 즉각적인 체포 위험이 있습니다.', 'Philippine National Historical Commission·Maria Orosa', { availability: 'opposition' }),
  s('ph-conrado-benitez', 'philippines', '콘라도 베니테스', 1889, 'economy', 'social-science', '헌정·교육행정 고문', '필리핀대학교 학장 출신 교육자·헌정가', 'University of the Philippines networks', '마닐라, 필리핀', ['헌정', '교육행정', '시민교육'], ['필리핀대학교', '1935년 헌법 제정 인맥'], '점령정부와 망명정부 중 어느 쪽이 교육·행정 정통성을 갖는지에 따라 임명 비용이 달라집니다.', 'University of the Philippines·Conrado Benitez'),
  s('ph-helena-benitez', 'philippines', '헬레나 베니테스', 1914, 'economy', 'social-science', '여성교육·민간구호 고문', '필리핀여자대학교 교육자', 'Philippine Women’s University', '마닐라, 필리핀', ['여성교육', '민간구호', '학교행정'], ['필리핀여자대학교', '여성 시민단체망'], '점령기 학교를 유지하는 행위가 협력으로 비칠 수 있어 교육생 보호와 정치적 중립의 투명성이 필요합니다.', 'Philippine Women’s University·Helena Benitez'),
  s('ph-jose-fabella', 'philippines', '호세 파베야', 1888, 'science', 'medicine', '모자보건·사회복지 고문', '산부인과·공공복지 의사', 'Philippine maternal health service', '마닐라, 필리핀', ['모자보건', '공공병원', '사회복지'], ['마닐라 산부인과망', '필리핀 보건관료'], '점령기 병상·약품 부족에서 군 의료보다 산모와 영아를 우선할 정치적 결단이 필요합니다.', 'Jose Fabella Memorial Hospital history'),
  s('ph-teodoro-agoncillo', 'philippines', '테오도로 아곤실료', 1912, 'economy', 'social-science', '역사·국민정체성 고문', '국립언어연구소 직원·역사 연구자', 'Institute of National Language', '마닐라, 필리핀', ['필리핀사', '국민언어', '점령기 기록'], ['국립언어연구소', '마닐라 작가·교사망'], '점령정권의 언어선전과 독립 서술이 충돌하며 당시에는 젊은 연구자라 제도권 영향력이 제한됩니다.', 'Philippine NAST·Teodoro Agoncillo'),
  s('ph-encarnacion-alzona', 'philippines', '엔카르나시온 알소나', 1895, 'economy', 'social-science', '여성사·시민권 고문', '필리핀대학교 역사학 교수', 'University of the Philippines', '마닐라, 필리핀', ['역사학', '여성참정권', '시민교육'], ['필리핀대학교', '여성참정권 운동망'], '점령기 대학 통제와 검열 아래 시민권 교육을 공개하면 탄압받을 수 있습니다.', 'Philippine NAST·Encarnacion Alzona'),
  s('ph-casimiro-del-rosario', 'philippines', '카시미로 델 로사리오', 1896, 'science', 'science', '기상·천문관측 고문', '필리핀 기상국 물리·천문 연구자', 'Philippine Weather Bureau', '마닐라·루손, 필리핀', ['기상학', '천문관측', '방사물리'], ['필리핀 기상국', '마닐라 천문대'], '관측망이 일본군에 장악되거나 파괴돼 연합군·게릴라에 자료를 보내려면 비밀통신이 필요합니다.', 'Philippine NAST·Casimiro del Rosario'),
  s('ph-hilario-lara', 'philippines', '힐라리오 라라', 1894, 'science', 'medicine', '역학·환경보건 고문', '필리핀대학교 위생학 교수', 'University of the Philippines College of Medicine', '마닐라, 필리핀', ['역학', '환경보건', '전염병 통계'], ['필리핀대학교 의대', '공중보건 조사망'], '점령기 인구이동과 검열로 질병통계가 붕괴됐고 현장조사원 안전을 보장해야 합니다.', 'Philippine NAST·Hilario Lara'),
];

function materialize(seed: ExpertSeed, index: number): HistoricalExpertProfile {
  const ability = 80 + ((index * 7 + seed.birthYear) % 15);
  const potential = Math.min(99, ability + 3 + ((index * 5) % 6));
  const accessNations = Array.from(new Set([seed.primaryNation, ...(seed.options?.accessNations ?? [])]));
  return {
    id: seed.id,
    primaryNation: seed.primaryNation,
    accessNations,
    name: seed.name,
    birthYear: seed.birthYear,
    nationality: seed.options?.nationality ?? nationalityByNation[seed.primaryNation],
    department: seed.department,
    discipline: seed.discipline,
    appointmentTitle: seed.appointmentTitle,
    office1942: seed.office1942,
    affiliation: seed.affiliation,
    wartimeLocation: seed.wartimeLocation,
    summary: `${seed.office1942}로 활동하며 ${seed.expertise.join('·')} 분야의 지식과 ${seed.networks.join('·')} 인맥을 연결할 수 있는 실존 전문가입니다.`,
    historicalConstraint: seed.historicalConstraint,
    expertise: seed.expertise,
    networks: seed.networks,
    friction: seed.historicalConstraint,
    appointmentEffect: effectByDiscipline[seed.discipline],
    ability,
    potential,
    loyalty: 62 + ((index * 11) % 34),
    influence: 64 + ((index * 13) % 32),
    interest: 58 + ((index * 17) % 38),
    availability: seed.options?.availability ?? 'available',
    sourceLabel: seed.sourceLabel,
    sourceUrl: seed.options?.sourceUrl,
  };
}

export const extendedHistoricalExperts: HistoricalExpertProfile[] = expertSeeds.map(materialize);
