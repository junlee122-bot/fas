import type { HistoricalExpertProfile } from './historicalExperts';
import type { NationId, PersonnelAvailability, PersonnelDiscipline } from './types';

type Citation = readonly [label: string, url: string];

interface ExpandedExpertSeed {
  id: string;
  nation: NationId;
  name: string;
  birthYear: number;
  discipline: PersonnelDiscipline;
  appointmentTitle: string;
  office1942: string;
  affiliation: string;
  wartimeLocation: string;
  expertise: [string, string, string];
  networks: [string, string];
  historicalConstraint: string;
  accessNations?: NationId[];
  availability?: PersonnelAvailability;
  nationality?: string;
  citation?: Citation;
}

const nationalityByNation: Record<NationId, string> = {
  britain: '영국', usa: '미국', ussr: '소련', germany: '독일', japan: '일본', china: '중국', india: '인도',
  freefrance: '프랑스', italy: '이탈리아', korea: '조선', vietnam: '베트남', indonesia: '인도네시아', philippines: '필리핀',
};

// 개별 인물의 sourceLabel과 함께 쓰이는 기관별 원문·공식 인물 아카이브다.
const sources: Record<NationId, Citation> = {
  britain: ['영국 왕립학회 인물·과학사 아카이브', 'https://royalsociety.org/about-us/who-we-are/history/'],
  usa: ['미국 국립문서기록관리청 과학자 기록', 'https://www.archives.gov/research/guide-fed-records/groups/227.html'],
  ussr: ['노벨상 재단 소련 과학자 전기 아카이브', 'https://www.nobelprize.org/prizes/lists/all-nobel-prizes/'],
  germany: ['독일박물관 과학기술 인물 아카이브', 'https://www.deutsches-museum.de/en/research/archive'],
  japan: ['일본 국립국회도서관 근대 인물 아카이브', 'https://www.ndl.go.jp/portrait/e/'],
  china: ['중국과학원 역사 아카이브', 'https://english.cas.cn/about_us/introduction/history/'],
  india: ['인도 과학기술부 과학사 아카이브', 'https://dst.gov.in/about-us/history'],
  freefrance: ['프랑스 국립기록원 제2차 세계대전 자료', 'https://www.archives-nationales.culture.gouv.fr/'],
  italy: ['이탈리아 트레카니 인물사전', 'https://www.treccani.it/enciclopedia/'],
  korea: ['국사편찬위원회 한국사데이터베이스', 'https://db.history.go.kr/'],
  vietnam: ['베트남국립대학교 역사·인물 아카이브', 'https://vnu.edu.vn/eng/'],
  indonesia: ['인도네시아 국립도서관 디지털 아카이브', 'https://khastara.perpusnas.go.id/'],
  philippines: ['필리핀 국립과학기술아카데미 인물 아카이브', 'https://members.nast.ph/'],
};

const appointmentEffects: Record<PersonnelDiscipline, string> = {
  military: '교리 연구 +4/주 · 지휘관 성장 +5%',
  science: '기초 연구 +4/주 · 돌파 확률 +5%',
  engineering: '공학 연구 +4/주 · 시제품 신뢰도 +5%',
  medicine: '병력 회복 +2 · 전염병 위험 -6%',
  economics: '전시 재정 +10/주 · 배분 효율 +5%',
  industry: '산업 산출 +5% · 전환 기간 -1주',
  intelligence: '정보 분석 +6 · 방첩 노출 위험 -5%',
  diplomacy: '협상 영향력 +6 · 해외 접촉 비용 -8%',
  'social-science': '정통성 +4 · 행정 인재 성장 +6%',
};

function p(
  id: string,
  nation: NationId,
  name: string,
  birthYear: number,
  discipline: PersonnelDiscipline,
  appointmentTitle: string,
  office1942: string,
  affiliation: string,
  wartimeLocation: string,
  expertise: [string, string, string],
  networks: [string, string],
  historicalConstraint: string,
  options: Pick<ExpandedExpertSeed, 'accessNations' | 'availability' | 'nationality' | 'citation'> = {},
): ExpandedExpertSeed {
  return { id, nation, name, birthYear, discipline, appointmentTitle, office1942, affiliation, wartimeLocation, expertise, networks, historicalConstraint, ...options };
}

const seeds: ExpandedExpertSeed[] = [
  // 영국: 작전연구·의약·원자·암호계산을 하나의 인재시장으로 연결한다.
  p('uk-archibald-hill', 'britain', '아치볼드 힐', 1886, 'medicine', '생리학·작전연구 고문', '왕립학회 전쟁위원회와 대공 작전연구를 지원한 생리학자', 'Royal Society·Air Defence Research', '런던, 영국', ['생리학', '작전연구', '과학동원'], ['왕립학회', '영국 방공 연구망'], '의회·왕립학회·군 자문을 동시에 맡아 한 부처에 전속시키면 다른 과학동원망이 약해집니다.'),
  p('uk-alexander-fleming', 'britain', '알렉산더 플레밍', 1881, 'medicine', '항생제·감염관리 고문', '세인트메리 병원 세균학 교수로 페니실린 연구를 이어간 의사', 'St Mary’s Hospital Medical School', '런던, 영국', ['세균학', '페니실린', '상처감염'], ['세인트메리 병원', '군 의료연구망'], '실험실 발견을 대량생산 의약품으로 바꾸려면 플로리·체인 연구진과 발효산업의 협력이 필요합니다.', { accessNations: ['usa'] }),
  p('uk-howard-florey', 'britain', '하워드 플로리', 1898, 'medicine', '페니실린 임상·생산 총괄', '옥스퍼드 병리학교의 페니실린 연구책임자', 'University of Oxford Dunn School', '옥스퍼드, 영국', ['임상약리', '페니실린', '의약생산'], ['옥스퍼드 병리학교', '미영 제약 협력망'], '대량생산 설비가 영국에 부족해 미국 제약사와 농무부 연구소의 생산 협정이 필요합니다.', { accessNations: ['usa'] }),
  p('uk-ernst-chain', 'britain', '에른스트 보리스 체인', 1906, 'medicine', '항생제 생화학 고문', '옥스퍼드 페니실린 연구팀의 생화학자', 'University of Oxford Dunn School', '옥스퍼드, 영국', ['생화학', '항생제 정제', '발효공정'], ['옥스퍼드 병리학교', '유럽 망명 과학자망'], '독일에서 탈출한 유대계 망명자이므로 추축국 영입은 정권·인종정책의 근본 전환 없이는 불가능합니다.', { accessNations: ['usa'], nationality: '독일 태생 영국 망명', availability: 'displaced' }),
  p('uk-john-cockcroft', 'britain', '존 콕크로프트', 1897, 'engineering', '레이더·원자연구 조정관', '항공방위연구개발본부와 캐나다 원자연구 협력을 이끈 물리학자', 'Ministry of Supply·Montreal Laboratory', '런던·몬트리올', ['원자물리', '레이더', '연구행정'], ['캐번디시 연구소', '영연방 원자연구망'], '레이더 방공과 원자 연구가 같은 인력·전자장비를 요구하므로 연구 우선순위를 명확히 해야 합니다.', { accessNations: ['usa'] }),
  p('uk-james-chadwick', 'britain', '제임스 채드윅', 1891, 'science', '중성자·원자계획 고문', 'MAUD 후속 원자계획과 미영 핵협력의 과학자', 'University of Liverpool·Tube Alloys', '리버풀·워싱턴', ['중성자물리', '핵분열', '과학외교'], ['튜브 앨로이스', '맨해튼 계획 연락망'], '미영 정보공유가 제한되면 연구 중복이 커지며 핵무기 사용과 전후 통제를 둘러싼 정치 갈등이 생깁니다.', { accessNations: ['usa'] }),
  p('uk-tommy-flowers', 'britain', '토미 플라워스', 1905, 'engineering', '전자계산·통신 고문', '우체국 연구소에서 전자식 교환기와 암호분석 장치를 설계한 공학자', 'Post Office Research Station', '돌리스힐·블레츨리, 영국', ['진공관 계산', '통신교환', '암호분석'], ['우체국 연구소', '블레츨리 파크'], '수천 개 진공관을 쓰는 설계가 신뢰성 없다는 관료적 불신을 이겨내야 콜로서스 계열을 조기 완성할 수 있습니다.'),
  p('uk-joan-clarke', 'britain', '조안 클라크', 1917, 'intelligence', '해군암호·수학분석 고문', '블레츨리 파크 Hut 8의 해군 에니그마 암호분석가', 'Government Code and Cypher School', '블레츨리, 영국', ['암호해독', '수리논리', '해군정보'], ['Hut 8', 'GC&CS 여성 분석가망'], '성별에 따른 직급·보수 차별과 최고기밀 유지 때문에 공식 권한이 실제 능력보다 낮게 책정돼 있습니다.'),

  // 미국: 과학·통계·산업정책의 전시 조직과 전후 디지털 경제를 잇는다.
  p('us-theodore-von-karman', 'usa', '시어도어 폰 카르만', 1881, 'engineering', '항공역학·제트추진 고문', '미 육군항공대 과학자문과 제트추진연구소 창설을 이끈 공기역학자', 'Caltech·Army Air Forces', '패서디나·워싱턴, 미국', ['공기역학', '제트추진', '장거리 항공'], ['칼텍', '미 육군항공대'], '유럽 망명 과학자망과 군의 장기 연구를 보호해야 하며 즉시 생산 요구가 기초 공력연구를 잠식할 수 있습니다.', { accessNations: ['britain'], nationality: '헝가리 태생 미국 망명' }),
  p('us-rachel-carson', 'usa', '레이철 카슨', 1907, 'science', '해양생태·환경정보 고문', '어류·야생동물국의 해양생물학자이자 과학 저술가', 'U.S. Fish and Wildlife Service', '워싱턴 D.C., 미국', ['해양생태', '과학소통', '농약위험'], ['연방 야생동물국', '대중 과학출판망'], '전시 화학물질의 단기 효과를 비판하면 군수·농업 기관과 충돌하지만 장기 환경피해를 조기에 탐지할 수 있습니다.'),
  p('us-linus-pauling', 'usa', '라이너스 폴링', 1901, 'science', '화학결합·군수의학 고문', '칼텍 화학 교수로 폭약·산소계·혈장 대체물질 연구에 참여', 'California Institute of Technology', '패서디나, 미국', ['구조화학', '산소계측', '의약화학'], ['칼텍', 'OSRD 화학위원회'], '광범위한 연구를 비밀무기 한 분야에 묶으면 의학·기초화학 성과가 줄고 정치적 독립성도 훼손됩니다.', { accessNations: ['britain'] }),
  p('us-julian-schwinger', 'usa', '줄리언 슈윙거', 1918, 'science', '마이크로파·이론물리 연구원', '퍼듀대학교 연구자에서 MIT 방사선연구소로 이동한 젊은 이론물리학자', 'MIT Radiation Laboratory', '케임브리지, 미국', ['마이크로파', '도파관', '양자전기역학'], ['MIT 방사선연구소', '미국 이론물리학계'], '1942년에는 영향력이 낮은 신진 연구자이므로 독립 지휘보다 선임 멘토와 고급 실험시설을 제공해야 잠재력이 열립니다.', { accessNations: ['britain'] }),
  p('us-paul-samuelson', 'usa', '폴 새뮤얼슨', 1915, 'economics', '수리경제·동원배분 분석관', 'MIT 경제학 조교수이자 전시 자원배분 문제를 연구한 경제학자', 'Massachusetts Institute of Technology', '케임브리지, 미국', ['수리경제', '후생경제', '자원배분'], ['MIT 경제학부', '전시경제 연구망'], '젊은 이론가라 관료적 권위는 낮지만 장기적으로 생산·무역·국방계획을 하나의 계산체계로 통합할 수 있습니다.'),
  p('us-milton-friedman', 'usa', '밀턴 프리드먼', 1912, 'economics', '전쟁재정·통계분석관', '재무부 조세연구부에서 전쟁세제와 원천징수안을 연구한 경제학자', 'U.S. Treasury Department', '워싱턴 D.C., 미국', ['조세', '통계추론', '통화정책'], ['미 재무부', '컬럼비아 통계연구그룹'], '전시 조세통제에는 기여하지만 이후의 시장주의 처방은 가격통제·복지확대 노선과 강하게 충돌할 수 있습니다.'),
  p('us-george-dantzig', 'usa', '조지 댄치그', 1914, 'engineering', '수송·생산 최적화 분석관', '미 육군항공대 통계통제부의 전투·보급 계획 분석가', 'Army Air Forces Statistical Control', '워싱턴 D.C., 미국', ['선형계획', '수송최적화', '통계통제'], ['육군항공대', '버클리 수학계'], '심플렉스법은 아직 정립 전이므로 고급 계산인력과 문제 표준화를 투자해야 전후 잠재 성과가 조기 등장합니다.'),
  p('us-grace-hopper', 'usa', '그레이스 호퍼', 1906, 'engineering', '해군계산·프로그래밍 고문', '바사대학교 수학 부교수로 해군 예비역 지원을 준비하던 수학자', 'Vassar College·U.S. Naval Reserve', '포킵시, 미국', ['자동계산', '프로그래밍', '해군수학'], ['바사대학교', '해군 계산 연구망'], '1942년에는 아직 해군 계산프로젝트에 배치되기 전이므로 선발규정 완화와 하버드 Mark I 팀 배치가 필요합니다.', { availability: 'poachable' }),

  // 소련: 소개된 설계국·의학 연구·구금된 과학자를 서로 다른 정치비용으로 모델링한다.
  p('su-mstislav-keldysh', 'ussr', '므스티슬라프 켈디시', 1911, 'engineering', '항공진동·응용수학 고문', '중앙항공유체역학연구소에서 플러터와 진동을 연구한 수학자', 'TsAGI', '카잔·모스크바, 소련', ['응용수학', '항공진동', '수치해석'], ['TsAGI', '소련 수학자망'], '젊은 연구자의 이론을 생산설계국이 채택하도록 하려면 시험기와 계산조직을 별도로 보장해야 합니다.'),
  p('su-semyon-lavochkin', 'ussr', '세묜 라보치킨', 1900, 'engineering', '전투기 설계총감', '라보치킨 설계국의 목재·복합구조 전투기 책임자', 'OKB-301', '고리키·모스크바, 소련', ['전투기설계', '복합재구조', '양산개량'], ['OKB-301', '항공산업인민위원부'], '전선 요구에 따른 잦은 개량이 생산표준화를 해치며 엔진·목재 품질 병목을 함께 해결해야 합니다.'),
  p('su-artem-mikoyan', 'ussr', '아르툠 미코얀', 1905, 'engineering', '고속전투기 설계고문', '미코얀·구레비치 설계국 공동책임자', 'OKB-155', '모스크바, 소련', ['고속항공기', '고고도성능', '설계국 운영'], ['OKB-155', '소련 항공산업'], '정치적 후원은 강하지만 실전 성능과 생산성으로 설계국 간 경쟁을 지속적으로 입증해야 합니다.'),
  p('su-vladimir-chelomey', 'ussr', '블라디미르 첼로메이', 1914, 'engineering', '펄스제트·순항무기 연구원', '바우만공대와 중앙항공모터연구소의 젊은 진동·추진 연구자', 'TsIAM·Bauman Institute', '모스크바, 소련', ['펄스제트', '진동역학', '순항비행'], ['TsIAM', '바우만 공학자망'], '1942년에는 독립 설계국이 없으므로 포획기술·시험시설과 정치적 후원이 있어야 순항미사일 계열로 성장합니다.'),
  p('su-nikolai-vavilov', 'ussr', '니콜라이 바빌로프', 1887, 'science', '작물유전·종자보존 고문', '사라토프 감옥에 수감된 식물유전학자이자 종자수집가', 'Institute of Plant Industry', '사라토프 감옥, 소련', ['작물유전', '종자은행', '식량안보'], ['전연방 식물연구소', '세계 종자수집망'], '정치적 박해로 수감 중이며 석방·복권과 리센코주의의 제도적 배제 없이는 연구나 영입이 불가능합니다.', { availability: 'opposition' }),
  p('su-zinaida-yermolyeva', 'ussr', '지나이다 예르몰리예바', 1898, 'medicine', '항생제·전선방역 고문', '전연방 실험의학연구소에서 소련산 페니실린과 콜레라 방역을 연구한 미생물학자', 'All-Union Institute of Experimental Medicine', '모스크바·스탈린그라드', ['미생물학', '페니실린', '콜레라방역'], ['실험의학연구소', '붉은군대 의료망'], '포위전 현장검증은 큰 효과를 내지만 연구진과 배양시설을 전선 가까이 배치하는 높은 위험을 요구합니다.'),
  p('su-sergei-lebedev', 'ussr', '세르게이 레베데프', 1902, 'engineering', '전력망·전자계산 고문', '키예프 피난 뒤 자동제어와 전력계통 안정성을 연구한 전기공학자', 'Academy of Sciences Electrical Institute', '스베르들롭스크·모스크바', ['전력계통', '자동제어', '전자계산'], ['소련 과학아카데미', '전력공학 연구망'], '전쟁 중에는 전력망 안정이 우선이며 전자계산기 잠재력을 열려면 진공관·메모리 연구에 별도 투자가 필요합니다.'),
  p('su-yakov-zeldovich', 'ussr', '야코프 젤도비치', 1914, 'science', '폭발·연소이론 고문', '화학물리연구소에서 연소와 폭굉을 연구한 이론가', 'Institute of Chemical Physics', '카잔, 소련', ['폭굉이론', '연소물리', '핵반응'], ['화학물리연구소', '하리톤 연구진'], '강력한 무기연구 성과에는 고위험 실험과 최고 보안접근이 필요하며 장기 기초연구가 군사과제로 잠식될 수 있습니다.'),

  // 독일: 정권에 협력한 기술자와 추방·저항한 과학자를 같은 시장에서 명확히 구분한다.
  p('de-lise-meitner', 'germany', '리제 마이트너', 1878, 'science', '핵분열 이론·과학외교 고문', '나치 독일을 탈출해 스톡홀름에서 핵물리를 연구한 망명 과학자', 'Nobel Institute for Physics', '스톡홀름, 스웨덴', ['핵분열', '방사물리', '과학외교'], ['스웨덴 과학계', '유럽 망명 핵물리망'], '유대계 출신으로 추방됐으므로 독일이 영입하려면 나치 체제와 인종법을 폐지하고 안전을 보장해야 합니다.', { accessNations: ['britain', 'usa'], nationality: '오스트리아 태생 독일계 망명', availability: 'displaced' }),
  p('de-fritz-strassmann', 'germany', '프리츠 슈트라스만', 1902, 'science', '핵화학·방사성분석 고문', '카이저빌헬름 화학연구소의 핵분열 실험 화학자', 'Kaiser Wilhelm Institute for Chemistry', '베를린, 독일', ['분석화학', '핵분열', '방사성동위원소'], ['카이저빌헬름협회', '오토 한 연구진'], '반나치 성향과 박해받는 동료 지원 때문에 비밀경찰 위험이 있으며 무기화 강요에는 저항할 수 있습니다.', { availability: 'opposition' }),
  p('de-manfred-von-ardenne', 'germany', '만프레트 폰 아르데네', 1907, 'engineering', '전자현미경·동위원소 고문', '베를린 사설연구소에서 전자빔·레이더·동위원소 분리를 연구한 발명가', 'Forschungslaboratorium für Elektronenphysik', '베를린, 독일', ['전자빔', '전자현미경', '동위원소분리'], ['아르데네 연구소', '독일 우편·물리 연구망'], '사설연구소의 독립성과 장비를 보장해야 하며 패전 시 경쟁 승전국이 연구진 전체를 포섭하려 합니다.', { accessNations: ['ussr'], availability: 'poachable' }),
  p('de-eugen-saenger', 'germany', '오이겐 젱거', 1905, 'engineering', '고속로켓·우주비행 고문', '독일 활공연구소에서 장거리 로켓비행을 연구한 항공공학자', 'German Research Institute for Gliding', '아인링, 독일', ['액체로켓', '고속비행', '궤도역학'], ['독일 활공연구소', '오스트리아 로켓 연구망'], '극단적 장거리 폭격기 구상은 막대한 시험예산을 요구하고 즉시 전력화 가능성이 낮아 사업 중단 위험이 큽니다.'),
  p('de-irene-bredt', 'germany', '이레네 브레트', 1911, 'engineering', '로켓공력·재돌입 분석관', '오이겐 젱거 연구팀의 수학·열역학 연구자', 'German Research Institute for Gliding', '아인링, 독일', ['로켓공력', '재돌입열', '궤도계산'], ['젱거 연구팀', '독일 항공연구망'], '여성 연구자로 공식 권한이 제한되고 독립 프로젝트보다 젱거 연구팀의 성과에 가려져 있습니다.'),
  p('de-ludwig-prandtl', 'germany', '루트비히 프란틀', 1875, 'science', '유체역학·항공연구 고문', '괴팅겐 카이저빌헬름 유체연구소장', 'Kaiser Wilhelm Institute for Fluid Dynamics', '괴팅겐, 독일', ['경계층이론', '공기역학', '풍동실험'], ['괴팅겐 연구소', '독일 항공과학계'], '세계적 이론성과 정권기 기술동원의 관계를 평가해야 하며 군수 요구가 공개 과학의 장기 기반을 약화시킵니다.'),
  p('de-hans-bethe', 'germany', '한스 베테', 1906, 'science', '핵이론·폭발계산 고문', '나치 독일에서 추방돼 코넬대학교와 미 전시연구에 참여한 이론물리학자', 'Cornell University·MIT Radiation Laboratory', '이서카·케임브리지, 미국', ['핵반응', '충격파', '이론물리'], ['코넬대학교', '미국 망명 과학자망'], '유대계 혈통으로 추방됐으므로 독일 복귀에는 체제전환이 필요하며 실제 접근은 미국 연구계가 우선합니다.', { accessNations: ['usa', 'britain'], nationality: '독일 태생 미국 망명', availability: 'displaced' }),
  p('de-ernst-ruska', 'germany', '에른스트 루스카', 1906, 'engineering', '전자광학·현미경 고문', '지멘스에서 상용 전자현미경과 전자광학을 개발한 공학자', 'Siemens & Halske', '베를린, 독일', ['전자현미경', '전자광학', '정밀계측'], ['지멘스 연구소', '베를린 공학계'], '정밀 부품과 진공기술이 군수장비와 의학연구 사이에서 경쟁하며 공장 폭격에 매우 취약합니다.'),

  // 일본: 군수 연구와 전후 과학·민주사회 잠재력이 충돌하는 인물군이다.
  p('jp-kenjiro-takayanagi', 'japan', '다카야나기 겐지로', 1899, 'engineering', '전자영상·레이더 고문', 'NHK 기술연구소에서 텔레비전·전자주사 기술을 연구한 공학자', 'NHK Science & Technology Research Laboratories', '도쿄, 일본', ['전자영상', '음극선관', '레이더표시'], ['NHK 기술연구소', '일본 전기공학계'], '방송 영상기술을 군용 탐지·표시장치로 전환하려면 해군과 민간 연구소 사이의 지식공유가 필요합니다.'),
  p('jp-shoichi-sakata', 'japan', '사카타 쇼이치', 1911, 'science', '핵이론·입자물리 연구원', '나고야제국대학에서 중간자·핵이론을 연구한 물리학자', 'Nagoya Imperial University', '나고야, 일본', ['입자이론', '핵물리', '과학철학'], ['나고야 물리학계', '유카와 연구망'], '기초과학 성과를 단기 핵무기 보너스로 전환할 수 없으며 국제 논문교류 단절이 성장속도를 낮춥니다.'),
  p('jp-mitsuo-taketani', 'japan', '다케타니 미쓰오', 1911, 'science', '핵이론·과학정책 고문', '리켄 니시나 연구망과 교토 이론물리학계에서 활동한 물리학자', 'RIKEN·Kyoto Imperial University', '도쿄·교토, 일본', ['핵이론', '과학방법론', '기술윤리'], ['니시나 연구실', '반파시즘 지식인망'], '치안유지법에 따른 체포 전력이 있어 군사경찰의 감시를 받으며 무제한 군사연구에는 반대할 수 있습니다.', { availability: 'opposition' }),
  p('jp-yusuke-hagihara', 'japan', '하기하라 유스케', 1897, 'science', '천문·궤도계산 고문', '도쿄제국대학 천문학 교수로 천체역학을 연구한 수학천문학자', 'Tokyo Imperial University', '도쿄, 일본', ['천체역학', '궤도계산', '수치천문'], ['도쿄제국대학', '국제 천문학계'], '천문 관측망의 군사화와 국제교류 단절이 기초연구를 약화시키며 로켓 응용은 장기투자가 필요합니다.'),
  p('jp-masatoshi-okochi', 'japan', '오코치 마사토시', 1878, 'industry', '국가연구소·군수산업 조정관', '리켄 소장과 리켄 산업단 기업망을 이끈 공학자·귀족원 의원', 'RIKEN Konzern', '도쿄, 일본', ['연구사업화', '정밀기계', '산학조정'], ['리켄', '일본 군수기업망'], '산학결합은 빠른 생산을 가능하게 하지만 군부 통제와 전쟁범죄 연루 기업에 대한 전후 책임 위험이 큽니다.'),
  p('jp-hideo-shima', 'japan', '시마 히데오', 1901, 'engineering', '철도차량·수송체계 고문', '철도성 기술자로 기관차와 철도차량 설계를 담당한 공학자', 'Japanese Government Railways', '도쿄, 일본', ['철도차량', '고속수송', '정비표준'], ['철도성', '일본 기계공학계'], '군수수송 우선이 민간 철도 유지보수를 잠식하며 고속철도 잠재력은 전후 인프라와 안전투자를 요구합니다.'),
  p('jp-kinji-imanishi', 'japan', '이마니시 긴지', 1902, 'social-science', '생태·지역사회 조사고문', '교토제국대학 연구자로 생태학·인류학 현지조사를 수행', 'Kyoto Imperial University', '교토·동아시아, 일본', ['생태학', '인류학', '현지조사'], ['교토학파', '동아시아 조사망'], '점령지 조사는 제국 지식생산과 결합될 위험이 있어 현지 공동연구·자료권리 원칙을 세워야 합니다.'),
  p('jp-masao-maruyama', 'japan', '마루야마 마사오', 1914, 'social-science', '정치사상·전후헌정 연구원', '도쿄제국대학 법학부 조교수로 일본 정치사상을 연구', 'Tokyo Imperial University', '도쿄, 일본', ['정치사상', '권위주의 분석', '헌정개혁'], ['도쿄제국대학', '전후 민주주의 지식인망'], '1942년에는 신진 학자이며 자유주의적 분석이 검열·징집 압력을 받아 공개 정책영향력이 낮습니다.', { availability: 'opposition' }),

  // 중국: 전시 후방대학·해외유학·산업구국의 서로 다른 네트워크를 제공한다.
  p('cn-chien-shiung-wu', 'china', '우젠슝', 1912, 'science', '핵실험·계측 연구원', '버클리 박사 뒤 미국 스미스대학 강사로 있던 중국인 실험물리학자', 'Smith College·UC Berkeley', '매사추세츠, 미국', ['실험핵물리', '방사선계측', '베타붕괴'], ['버클리 물리학계', '중국 유학생망'], '미국 체류 중이며 전쟁기 중국으로 복귀시키면 첨단 장비 접근을 잃고 미국 연구망에 남기면 직접 국내효과가 줄어듭니다.', { accessNations: ['usa'], nationality: '중국', availability: 'displaced' }),
  p('cn-wang-ganchang', 'china', '왕간창', 1907, 'science', '핵물리·우주선 연구고문', '저장대학교 물리학 교수로 전시 후방에서 핵물리를 교육·연구', 'Zhejiang University', '구이저우, 중국', ['핵물리', '우주선', '입자검출'], ['저장대학교', '중국 물리학회'], '대학의 반복 피난과 장비 부족 때문에 이론교육은 가능하지만 정밀 핵실험에는 해외장비·전력이 필요합니다.'),
  p('cn-zhao-jiuzhang', 'china', '자오주장', 1907, 'science', '기상·상층대기 고문', '중앙연구원 기상연구소에서 동역학기상을 연구한 과학자', 'Academia Sinica Institute of Meteorology', '충칭, 중국', ['동역학기상', '상층대기', '관측망'], ['중앙연구원', '전시 기상관측소'], '관측소와 통신선이 전쟁으로 끊겨 전국 예보망을 복구하려면 무선장비와 지방정부 협력이 필요합니다.'),
  p('cn-ye-qisun', 'china', '예치쑨', 1898, 'science', '물리교육·연구조직 고문', '서남연합대학 물리학 교수로 피난 과학교육을 이끈 학자', 'National Southwestern Associated University', '쿤밍, 중국', ['실험물리', '과학교육', '인재조직'], ['서남연합대학', '칭화 물리학파'], '최전선보다 대학 인재양성에 강하며 교수진을 군 프로젝트로 빼면 장기 과학세대의 성장이 둔화됩니다.'),
  p('cn-tong-dizhou', 'china', '퉁디저우', 1902, 'science', '발생생물·수산연구 고문', '전시 후방대학에서 발생학과 해양생물을 연구·교육한 생물학자', 'National Shandong University network', '쓰촨·충칭, 중국', ['발생생물학', '수산과학', '현미조작'], ['중국 생물학회', '유럽 유학 생물학망'], '연구시설 피난과 현미경 부족으로 즉시 성과가 제한되며 식량·수산 응용과 기초연구의 균형이 필요합니다.'),
  p('cn-hou-debang', 'china', '허우더방', 1890, 'industry', '화학공업·비료생산 고문', '융리화학공업의 기술책임자로 소다회·비료 공정을 운영', 'Yongli Chemical Industries', '쓰촨, 중국', ['소다회', '비료', '화학공정'], ['융리화학', '중국 산업구국 기술자망'], '연안 공장 상실 뒤 내륙에서 원료·전력·운송을 다시 확보해야 하며 군수와 농업 수요가 경쟁합니다.'),
  p('cn-lu-jiaxi', 'china', '루자시', 1915, 'science', '구조화학·연료연구원', '칼텍에서 구조화학을 연구하고 미국 국방연구에 참여한 중국인 화학자', 'California Institute of Technology', '패서디나, 미국', ['구조화학', '연료분석', '결정학'], ['칼텍', '중국 유학생 과학망'], '젊은 해외연구자라 국내 영향력은 낮으며 귀국 시 최신 장비를, 잔류 시 중국 연구기관과의 직접 연결을 잃습니다.', { accessNations: ['usa'], availability: 'displaced' }),
  p('cn-fan-xudong', 'china', '판쉬둥', 1883, 'industry', '화학산업·후방공장 총괄', '융리화학과 황하이 화학연구소를 내륙으로 이전한 산업가', 'Yongli Chemical·Huanghai Institute', '충칭·쯔궁, 중국', ['화학산업', '공장피난', '산학연계'], ['융리화학', '황하이 화학연구소'], '민간기업의 자율성과 국가 전시통제가 충돌하며 일본 점령지의 자산·인력 상실을 복구해야 합니다.'),

  // 인도: 식민지 전시동원 속에서 독립국 과학·통계·보건 기반을 조기에 구축할 수 있다.
  p('in-satyendra-bose', 'india', '사티엔드라 나트 보스', 1894, 'science', '통계물리·과학교육 고문', '다카대학교 물리학 교수·학장으로 연구와 교육을 이끈 이론물리학자', 'University of Dhaka', '다카, 영국령 인도', ['통계물리', '양자이론', '과학교육'], ['다카대학교', '인도 물리학자망'], '기초이론은 단기 군수효과보다 인재성장에 강하며 식민정부와 독립운동 사이에서 연구자치가 쟁점입니다.'),
  p('in-birbal-sahni', 'india', '비르발 사니', 1891, 'science', '고식물·자원지질 고문', '러크나우대학교 식물학 교수로 고식물학 연구소를 준비한 과학자', 'University of Lucknow', '러크나우, 영국령 인도', ['고식물학', '석탄지질', '연구소설립'], ['러크나우대학교', '인도 식물학회'], '자원탐사 응용과 독립 연구소 건설을 병행해야 하며 식민정부 예산에 의존하면 연구 의제가 제한됩니다.'),
  p('in-daulat-singh-kothari', 'india', '다울라트 싱 코타리', 1906, 'science', '방위과학·천체물리 고문', '델리대학교 물리학 교수로 통계열역학과 천체물리를 연구', 'University of Delhi', '델리, 영국령 인도', ['천체물리', '탄도과학', '방위연구조직'], ['델리대학교', '인도 방위과학자망'], '1942년에는 독립국 방위연구체제가 없어 군사연구 전환에는 자치권·예산·인도인 지휘권이 필요합니다.'),
  p('in-sisir-kumar-mitra', 'india', '시시르 쿠마르 미트라', 1890, 'engineering', '전리층·무선통신 고문', '캘커타대학교 무선물리학 교수로 전리층 전파를 연구', 'University of Calcutta', '캘커타, 영국령 인도', ['전리층', '단파통신', '전파관측'], ['캘커타대학교', '인도 무선과학망'], '관측장비와 주파수 할당이 제국군 통신에 우선 배정되므로 독자 연구망에는 정치 협상이 필요합니다.'),
  p('in-upendranath-brahmachari', 'india', '우펜드라나트 브라마차리', 1873, 'medicine', '열대병·의약개발 고문', '캘커타에서 칼라아자르 치료와 열대의학 연구를 이어간 의사', 'Calcutta School of Tropical Medicine', '캘커타, 영국령 인도', ['열대의학', '항원충제', '공중보건'], ['캘커타 열대의학교', '벵골 의료망'], '고령과 제한된 생산시설 때문에 후계 연구진·지역 보건소를 함께 육성하지 않으면 효과가 개인에게 집중됩니다.'),
  p('in-asima-chatterjee', 'india', '아시마 차터지', 1917, 'science', '천연물·의약화학 연구원', '캘커타대학교에서 유기화학 박사과정을 수행한 젊은 화학자', 'University of Calcutta', '캘커타, 영국령 인도', ['천연물화학', '의약화학', '식물성분'], ['캘커타대학교', '인도 여성 과학자망'], '신진 여성 연구자로 실험실·직급 접근이 제한되며 장기 육성 시 항말라리아·항경련 의약 경로가 열립니다.'),
  p('in-anna-mani', 'india', '안나 마니', 1918, 'engineering', '기상계측·태양에너지 연구원', '인도과학원에서 라만 연구실 대학원 연구를 시작한 젊은 물리학자', 'Indian Institute of Science', '방갈로르, 영국령 인도', ['기상계측', '분광학', '태양복사'], ['인도과학원', '인도 기상연구망'], '1942년에는 수습 단계이고 여성 연구자 차별이 있어 장비제작·기상관측 책임자로 성장시키려면 장기 훈련이 필요합니다.'),
  p('in-cr-rao', 'india', '칼리암푸디 라다크리슈나 라오', 1920, 'economics', '통계추론·표본조사 연구원', '캘커타대학교 통계학 석사과정과 인도통계연구소 연구훈련에 들어간 신진 수학자', 'Indian Statistical Institute', '캘커타, 영국령 인도', ['통계추론', '표본설계', '다변량분석'], ['인도통계연구소', '마할라노비스 연구망'], '최연소 유망주로 즉시 행정권은 없지만 멘토·자료·계산조직을 제공하면 인구·생산통계 정확도가 크게 성장합니다.'),

  // 자유 프랑스: 레지스탕스, 망명행정, 재건기술을 하나의 포섭망으로 묶는다.
  p('fr-andre-weil', 'freefrance', '앙드레 베유', 1906, 'science', '수학·암호이론 고문', '미국 리하이대학교에서 망명 연구 중이던 프랑스 수학자', 'Lehigh University', '펜실베이니아, 미국', ['대수학', '수론', '암호이론'], ['부르바키 그룹', '미국 망명 학계'], '징집·구금·망명 경험으로 군 지휘체계에 불신이 있으며 독립 연구와 가족 안전을 보장해야 합니다.', { accessNations: ['usa', 'britain'], availability: 'displaced' }),
  p('fr-jean-zay', 'freefrance', '장 제', 1904, 'social-science', '교육·문화재건 고문', '비시 정권에 의해 수감된 전 프랑스 교육·미술부 장관', 'French Third Republic education ministry', '리옹 감옥, 프랑스', ['교육개혁', '문화정책', '공화주의'], ['제3공화국 교육망', '프랑스 레지스탕스'], '비시 정권의 정치범으로 수감돼 있어 구출작전이나 해방 없이는 영입할 수 없고 신변위험이 극도로 높습니다.', { availability: 'opposition' }),
  p('fr-pierre-mendes-france', 'freefrance', '피에르 망데스 프랑스', 1907, 'economics', '전쟁재정·식민정책 고문', '비시 감옥 탈출 뒤 자유 프랑스 공군과 망명정부에 합류한 경제통 정치인', 'Free French Forces', '런던·중동', ['전쟁재정', '의회정치', '탈식민협상'], ['자유 프랑스', '급진공화당 인맥'], '군 복무와 재정행정을 병행하며 식민지 문제에 대한 개혁노선이 제국 유지파와 충돌합니다.', { accessNations: ['britain'] }),
  p('fr-jacques-cousteau', 'freefrance', '자크이브 쿠스토', 1910, 'engineering', '수중정찰·잠수기술 고문', '프랑스 해군 장교로 수중촬영과 자급식 호흡장치를 시험한 탐험가', 'French Navy', '툴롱·지중해', ['잠수장비', '수중촬영', '해양조사'], ['프랑스 해군', '지중해 잠수 연구망'], '비시 통제 해군과 레지스탕스 정보활동 사이의 이중위험이 있으며 장비개발에는 고무·고압용기 공급이 필요합니다.'),
  p('fr-eugene-freyssinet', 'freefrance', '외젠 프레시네', 1879, 'engineering', '교량·프리스트레스트 재건 고문', '프리스트레스트 콘크리트 기술을 사업화하던 토목공학자', 'STUP engineering company', '파리, 점령 프랑스', ['프리스트레스트 콘크리트', '교량', '긴급복구'], ['프랑스 토목기업망', '공공사업 기술자'], '점령지에서 활동하므로 기술자·도면 이동이 제한되고 군용복구와 민간재건의 우선순위가 충돌합니다.', { availability: 'displaced' }),
  p('fr-rene-dumont', 'freefrance', '르네 뒤몽', 1904, 'science', '농업재건·식량정책 고문', '국립농업연구원 교수로 프랑스와 식민지 농업체계를 연구한 농학자', 'Institut national agronomique', '파리, 점령 프랑스', ['농업경제', '식량안보', '토양관리'], ['프랑스 농학계', '식민지 농업조사망'], '식민 농업의 생산성 지식이 현지 권리 침해로 이어지지 않도록 토지개혁·농민대표 조건을 함께 설계해야 합니다.', { accessNations: ['vietnam'] }),
  p('fr-robert-debre', 'freefrance', '로베르 드브레', 1882, 'medicine', '소아의료·저항보건 고문', '파리 의과대학 소아과 교수로 의료 레지스탕스를 지원한 의사', 'University of Paris medical faculty', '파리, 점령 프랑스', ['소아의학', '병원행정', '비밀의료망'], ['파리 의학계', '의료 레지스탕스'], '유대계 가족과 레지스탕스 연락망이 게슈타포 위험에 노출돼 있어 비밀병원·위조신분 보호가 필요합니다.', { availability: 'opposition' }),
  p('fr-paul-rivet', 'freefrance', '폴 리베', 1876, 'social-science', '인류학·망명외교 고문', '반파시즘 활동 뒤 콜롬비아로 망명한 인류학자·박물관장', 'Musée de l’Homme', '보고타, 콜롬비아', ['인류학', '문화유산', '망명외교'], ['인간박물관 레지스탕스', '라틴아메리카 학술망'], '남미 망명지에서 직접 작전효과는 낮지만 자유 프랑스 승인·문화재 보호·현지 외교망에 강합니다.', { accessNations: ['britain', 'usa'], availability: 'displaced' }),

  // 이탈리아: 레이더·제트·토목·금융의 재건 잠재력과 파시즘하 제약을 분리한다.
  p('it-bruno-de-fin-etti', 'italy', '브루노 데 피네티', 1906, 'economics', '확률·위험분석 고문', '보험통계와 주관확률을 연구한 수학자', 'Assicurazioni Generali·University network', '트리에스테·로마, 이탈리아', ['확률론', '보험수리', '의사결정'], ['이탈리아 보험업계', '로마 수학계'], '추상 확률모형을 군수·보급에 적용하려면 표준 데이터가 필요하며 파시스트 인종정책에 대한 제도 책임도 검토해야 합니다.'),
  p('it-nello-carrara', 'italy', '넬로 카라라', 1900, 'engineering', '마이크로파·레이더 연구고문', '해군 연구소와 피렌체에서 마이크로파 탐지기술을 연구한 물리학자', 'Regio Istituto Elettrotecnico', '리보르노·피렌체, 이탈리아', ['마이크로파', '레이더', '전자공학'], ['이탈리아 해군연구소', '피렌체 물리학계'], '연구 성과가 해군 지휘부에 늦게 채택됐고 전자부품 생산기반이 약해 조기경보망 구축에 산업투자가 필요합니다.'),
  p('it-ugo-tiberio', 'italy', '우고 티베리오', 1904, 'engineering', '해군레이더·전자탐지 고문', '해군사관학교에서 EC-3 레이더 계열을 개발한 장교·공학자', 'Italian Naval Academy', '리보르노, 이탈리아', ['해상레이더', '안테나', '사격통제'], ['이탈리아 해군사관학교', '해군 전자기술자망'], '고위 지휘부가 레이더의 가치를 과소평가하고 시제품 수량이 적어 함대교리와 양산계약을 동시에 바꿔야 합니다.'),
  p('it-secondo-campini', 'italy', '세콘도 캄피니', 1904, 'engineering', '제트항공·열기관 고문', '캄피니-카프로니 제트 실험기 개발을 이끈 공학자', 'Campini·Caproni', '탈리에다, 이탈리아', ['모터제트', '항공추진', '시제품개발'], ['카프로니', '이탈리아 항공부'], '모터제트는 터보제트보다 성능 잠재력이 낮아 체면사업을 계속할지 가스터빈 연구로 전환할지 결정해야 합니다.'),
  p('it-luigi-crocco', 'italy', '루이지 크로코', 1909, 'engineering', '로켓·고속유동 연구원', '로마대학교 항공공학 연구자로 로켓추진과 압축성 유동을 연구', 'University of Rome', '로마, 이탈리아', ['로켓추진', '압축성유동', '항공열역학'], ['로마 항공공학부', '국제 로켓연구망'], '전쟁 말기 해외이탈 가능성이 크며 연구자율성과 가족 안전을 보장하지 않으면 미국 연구계로 이동합니다.', { accessNations: ['usa'], availability: 'poachable' }),
  p('it-pier-luigi-nervi', 'italy', '피에르 루이지 네르비', 1891, 'engineering', '대공간 구조·재건 고문', '철근콘크리트 격납고와 대공간 구조를 설계한 건축공학자', 'Nervi & Bartoli', '로마·오르비에토, 이탈리아', ['철근콘크리트', '격납고', '신속시공'], ['네르비 건설사', '이탈리아 토목기술자망'], '군용 격납고 기술은 폭격 표적이 되며 전후 민간재건에 보존할 설계인력과 자재가 필요합니다.'),
  p('it-gustavo-colonnetti', 'italy', '구스타보 콜론네티', 1886, 'engineering', '재료역학·망명교육 고문', '인종법과 파시즘에 반대해 스위스로 피신한 토목공학자', 'Polytechnic University of Turin', '로잔, 스위스', ['재료역학', '토목교육', '산업표준'], ['토리노공대', '스위스 망명 학계'], '반파시스트 망명자여서 귀환에는 체제전환이 필요하고 전후 대학·표준기관 복구에 더 큰 효과를 냅니다.', { accessNations: ['freefrance'], availability: 'displaced' }),
  p('it-franco-modigliani', 'italy', '프랑코 모딜리아니', 1918, 'economics', '저축·전후금융 연구원', '파시스트 인종법을 피해 미국에서 경제학을 공부하던 망명 연구자', 'New School for Social Research', '뉴욕, 미국', ['거시경제', '저축행동', '금융정책'], ['뉴 스쿨', '이탈리아 반파시즘 망명망'], '1942년에는 신진 망명자라 영향력이 낮고 이탈리아 영입은 인종법 폐지·공화정 전환과 안전보장을 요구합니다.', { accessNations: ['usa'], nationality: '이탈리아계 미국 망명', availability: 'displaced' }),

  // 조선: 식민지 학술통제·망명 독립운동·공중보건을 서로 다른 영입경로로 연동한다.
  p('kr-choe-hyeon-bae', 'korea', '최현배', 1894, 'social-science', '언어·대중교육 고문', '조선어학회 사건으로 체포된 한글학자·교육자', 'Korean Language Society', '함흥형무소, 식민지 조선', ['국어학', '대중교육', '문화보존'], ['조선어학회', '민족교육망'], '일제의 조선어학회 탄압으로 수감 중이라 구출·석방과 출판·학교 자율 없이는 영입효과가 발생하지 않습니다.', { availability: 'opposition' }),
  p('kr-jeong-in-bo', 'korea', '정인보', 1893, 'social-science', '역사·정체성 교육고문', '연희전문학교 교수 경력의 민족사학자로 일제 말 은거', 'Yeonhui College intellectual network', '경기도, 식민지 조선', ['한국사', '양명학', '민족교육'], ['연희전문 인맥', '민족사학자망'], '창씨개명과 식민교육에 저항해 공개활동이 제한됐으며 비밀 교육망 보호가 필요합니다.', { availability: 'opposition' }),
  p('kr-an-jae-hong', 'korea', '안재홍', 1891, 'diplomacy', '민족협동·과도정부 고문', '수차례 투옥 뒤 식민지 조선에서 비타협 민족운동을 이어간 언론인', 'Joseon Ilbo·nationalist movement', '경성, 식민지 조선', ['민족협동', '언론', '과도행정'], ['비타협 민족주의자망', '조선 언론계'], '일제 경찰 감시와 좌우 갈등을 동시에 받으며 통합정부 구상에는 폭넓은 파벌 협상이 필요합니다.', { availability: 'opposition' }),
  p('kr-yi-byeong-do', 'korea', '이병도', 1896, 'social-science', '역사자료·대학행정 고문', '진단학회 중심으로 한국사 연구와 사료편찬을 수행한 역사학자', 'Jindan Society', '경성, 식민지 조선', ['한국사', '사료편찬', '대학행정'], ['진단학회', '경성 학술망'], '식민지 학술제도 안에서 활동한 경력을 둘러싼 정통성 논쟁이 있어 공개 검증과 사료 자율이 필요합니다.'),
  p('kr-yun-il-seon', 'korea', '윤일선', 1896, 'medicine', '병리학·의학교육 고문', '경성제국대학 의학부 병리학 교수로 연구·교육한 의사', 'Keijo Imperial University', '경성, 식민지 조선', ['병리학', '암연구', '의학교육'], ['경성 의학계', '일본 유학 의사망'], '식민지 대학의 인사·연구통제를 받으며 독립 보건체계로 전환하려면 교육기관과 병리시설을 함께 인수해야 합니다.'),
  p('kr-kim-chang-se', 'korea', '김창세', 1893, 'medicine', '공중보건·국제구호 고문', '중국과 미주에서 독립운동과 위생·의료 활동을 연결한 의사', 'Korean independence medical network', '중국·미국', ['공중보건', '위생교육', '국제구호'], ['대한민국 임시정부 인맥', '미주 한인 의료망'], '망명지 네트워크는 강하지만 국내 병원과 직접 연결하려면 비밀통신·귀환로·재정지원이 필요합니다.', { accessNations: ['china', 'usa'], availability: 'displaced' }),
  p('kr-jo-so-ang', 'korea', '조소앙', 1887, 'social-science', '삼균주의·헌정설계 고문', '대한민국 임시정부 외교·정책 지도자로 건국강령을 설계', 'Provisional Government of the Republic of Korea', '충칭, 중국', ['삼균주의', '헌정', '독립외교'], ['대한민국 임시정부', '중국 국민정부 외교망'], '좌우·국내외 세력의 동의를 얻어야 하며 임시정부 승인 수준에 따라 실제 정책권한이 크게 달라집니다.', { accessNations: ['china'], availability: 'displaced' }),
  p('kr-kim-kyu-sik', 'korea', '김규식', 1881, 'diplomacy', '연합외교·통합정부 고문', '충칭 대한민국 임시정부 부주석이자 국제외교 지도자', 'Provisional Government of the Republic of Korea', '충칭, 중국', ['독립외교', '좌우협상', '국제승인'], ['대한민국 임시정부', '미중 외교망'], '강대국의 한반도 신탁·군정 구상과 독립정부 승인을 둘러싼 협상이 필요하고 파벌갈등이 지속됩니다.', { accessNations: ['china', 'usa'], availability: 'displaced' }),

  // 베트남: 식민지 지식인·감옥의 혁명가·해외 과학자를 독립 이후 국가건설로 연결한다.
  p('vn-le-van-thiem', 'vietnam', '레반티엠', 1918, 'science', '수학·대학건설 연구원', '유럽에서 수학을 공부하던 베트남인 유학생', 'University study network in Europe', '독일·스위스', ['해석학', '기하학', '수학교육'], ['유럽 수학계', '베트남 유학생망'], '전쟁 중 유럽에 고립된 신진 연구자라 귀국로와 독립 대학이 마련돼야 잠재력이 국가 연구체제로 전환됩니다.', { accessNations: ['freefrance'], availability: 'displaced' }),
  p('vn-nguyen-van-to', 'vietnam', '응우옌반또', 1889, 'social-science', '문해·문화유산 고문', '극동학원 연구자이자 베트남어 보급협회 지도자로 활동', 'École française d’Extrême-Orient·Truyền bá Quốc ngữ', '하노이, 프랑스령 인도차이나', ['문해교육', '역사학', '문화유산'], ['베트남어 보급협회', '하노이 지식인망'], '식민당국과 점령군 검열 아래 대중문해 운동이 정치조직으로 간주될 수 있어 비밀 교육망 보호가 필요합니다.'),
  p('vn-phan-anh', 'vietnam', '판아인', 1912, 'social-science', '헌정·청년동원 고문', '하노이의 변호사·법학교육자로 활동한 민족주의 지식인', 'Indochina law school network', '하노이, 프랑스령 인도차이나', ['헌법', '법률교육', '청년조직'], ['베트남 법조계', '청년 지식인망'], '식민정부·일본 점령세력·독립운동 사이에서 공개 지위가 빠르게 바뀌며 정통성 검증이 필요합니다.'),
  p('vn-vu-dinh-hoe', 'vietnam', '부딘회', 1912, 'social-science', '법무·시민교육 고문', '하노이 법학자이자 청년 지식인 잡지운동 참여자', 'Thanh Nghị intellectual network', '하노이, 프랑스령 인도차이나', ['법무행정', '시민교육', '헌정'], ['타인응이 그룹', '베트남 법조계'], '전시 검열 아래 공개 개혁론이 제한되며 독립정부가 성립해야 법무제도 설계 능력이 본격적으로 작동합니다.'),
  p('vn-dang-thai-mai', 'vietnam', '당타이마이', 1902, 'social-science', '교육·문화정책 고문', '교사·문학연구자이자 반식민 지식인운동 참여자', 'Vietnamese cultural front', '하노이·타인호아', ['교육학', '문학비평', '문화동원'], ['인도차이나 교육자망', '반식민 문화전선'], '프랑스 식민경찰의 체포 전력과 검열 때문에 공개 학교보다 지하 교육·선전망에서 먼저 효과를 냅니다.', { availability: 'opposition' }),
  p('vn-ton-duc-thang', 'vietnam', '똔득탕', 1888, 'industry', '노동조직·조선소 동원 고문', '꼰다오 감옥에 장기 수감된 노동운동·독립운동 지도자', 'Saigon Arsenal labor network', '꼰다오 감옥, 프랑스령 인도차이나', ['노동조직', '조선소', '정치동원'], ['사이공 노동망', '인도차이나 공산운동'], '수감 중이므로 해방 없이는 영입 불가하며 석방 뒤에도 노동자 자치와 중앙 지휘 사이의 권한협상이 필요합니다.', { availability: 'opposition' }),
  p('vn-tran-van-giau', 'vietnam', '쩐반저우', 1911, 'social-science', '지하조직·과도행정 고문', '프랑스 감옥과 유배를 거친 남부 인도차이나 공산운동 조직가', 'Indochinese Communist Party southern network', '남부 베트남', ['지하조직', '정치교육', '과도행정'], ['남부 혁명망', '노동·학생조직'], '식민경찰 감시와 내부 노선갈등이 심하며 공개 행정가로 전환하려면 광범위한 연립정치가 필요합니다.', { availability: 'opposition' }),
  p('vn-nguyen-an-ninh', 'vietnam', '응우옌안닌', 1900, 'diplomacy', '언론·반식민 연대고문', '꼰다오 감옥에 수감된 언론인·반식민 사상가', 'La Cloche Fêlée network', '꼰다오 감옥, 프랑스령 인도차이나', ['언론', '반식민연대', '정치사상'], ['사이공 지식인망', '농민·청년운동'], '1943년 옥사 위험이 임박한 정치범으로 조기 구출과 의료지원이 없으면 세계선에서 영구 상실됩니다.', { availability: 'opposition' }),

  // 인도네시아: 민족주의·이슬람·사회주의·기술관료 노선이 독립국 설계를 경쟁한다.
  p('id-tan-malaka', 'indonesia', '탄 말라카', 1897, 'social-science', '지하혁명·국제연대 고문', '동남아를 오가며 가명으로 활동한 반식민 혁명가', 'Underground Indonesian republican network', '수마트라·자바', ['지하조직', '혁명이론', '국제연대'], ['인도네시아 좌파망', '동남아 반식민 네트워크'], '장기 지하생활로 신원·충성 확인이 어렵고 공화국 지도부와 혁명노선을 둘러싼 심각한 갈등이 예상됩니다.', { accessNations: ['vietnam'], availability: 'opposition' }),
  p('id-agus-salim', 'indonesia', '아구스 살림', 1884, 'diplomacy', '독립외교·종교연대 고문', '이슬람 민족운동의 원로 언론인·외교가', 'Sarekat Islam intellectual network', '자바, 네덜란드령 동인도', ['독립외교', '이슬람정치', '다언어협상'], ['사레카트 이슬람', '국제 이슬람 지식인망'], '세속 민족주의·이슬람·좌파 세력 사이를 중재할 수 있지만 어느 한 진영의 독점에는 협력하지 않습니다.'),
  p('id-sutan-takdir-alisjahbana', 'indonesia', '수탄 탁디르 알리샤바나', 1908, 'social-science', '국어·근대교육 고문', '푸장가 바루를 이끈 작가·언어기획자', 'Pujangga Baru', '자카르타, 네덜란드령 동인도', ['인도네시아어', '교육근대화', '출판'], ['푸장가 바루', '청년 문화운동'], '점령기 검열과 언어정책을 이용할 수 있지만 선전기관에 종속되면 독립 이후 문화정통성이 훼손됩니다.'),
  p('id-mohammad-yamin', 'indonesia', '모하맛 야민', 1903, 'social-science', '헌법·국가상징 고문', '민족주의 법률가·역사가·언어운동가', 'Volksraad nationalist network', '자카르타, 네덜란드령 동인도', ['헌법', '국가상징', '민족사'], ['청년서약 세대', '인도네시아 법조계'], '강한 단일국가 구상이 연방·지역자치 세력과 충돌하며 역사서술의 정치화를 견제할 장치가 필요합니다.'),
  p('id-djuanda-kartawidjaja', 'indonesia', '주안다 카르타위자자', 1911, 'engineering', '철도·해양국가 기술고문', '반둥공과대학 출신 수자원·교통 기술자로 공공사업에 종사', 'Public Works Service·Bandung engineers', '자바, 네덜란드령 동인도', ['토목공학', '철도행정', '군도물류'], ['반둥공대', '식민지 공공사업 기술자망'], '식민행정 기술직의 자료를 공화국이 인수하려면 현지 공무원 보호와 네덜란드 기술관료의 이탈을 관리해야 합니다.'),
  p('id-ar-baswedan', 'indonesia', '압두라흐만 바스웨단', 1908, 'diplomacy', '소수집단·독립외교 고문', '아랍계 인도네시아인 연합을 조직한 언론인·민족주의자', 'Persatuan Arab Indonesia', '자바, 네덜란드령 동인도', ['소수집단통합', '언론', '중동외교'], ['아랍계 인도네시아인 연합', '민족주의 언론망'], '혈통별 식민 분류를 폐지하고 시민적 국민정체성을 보장해야 조직망이 안정적으로 공화국에 합류합니다.'),
  p('id-otto-iskandardinata', 'indonesia', '오토 이스칸다르디나타', 1897, 'social-science', '대중교육·지역조직 고문', '파순단 민족운동과 인민평의회에서 활동한 순다계 지도자', 'Paguyuban Pasundan·Volksraad', '서부 자바', ['지역조직', '교육', '대중정치'], ['파순단', '인민평의회 민족주의파'], '자바 중심주의와 지역대표성 갈등을 조정해야 하며 점령기 협력 여부에 대한 공개 검증이 필요합니다.'),
  p('id-soepomo', 'indonesia', '수포모', 1903, 'social-science', '헌법·관습법 고문', '바타비아 법학교수로 관습법과 국가구조를 연구한 법학자', 'Rechtshogeschool Batavia', '자카르타, 네덜란드령 동인도', ['헌법', '관습법', '국가행정'], ['인도네시아 법학계', '자바 관료망'], '통합주의 국가론이 개인권·권력분립을 약화시킬 수 있어 헌법회의에서 대안 노선과 공개 토론이 필요합니다.'),

  // 필리핀: 망명정부·점령행정·게릴라·헌정복구의 인물을 동일한 정통성 규칙으로 평가한다.
  p('ph-manuel-quezon', 'philippines', '마누엘 케손', 1878, 'diplomacy', '망명정부·독립외교 고문', '워싱턴의 필리핀 코먼웰스 망명정부 대통령', 'Commonwealth Government in Exile', '워싱턴 D.C., 미국', ['망명정부', '독립외교', '국가행정'], ['필리핀 코먼웰스', '미국 행정부'], '결핵으로 건강이 악화됐고 미국 군정과 필리핀 민정의 권한·독립일정을 끊임없이 협상해야 합니다.', { accessNations: ['usa'], availability: 'displaced' }),
  p('ph-sergio-osmena', 'philippines', '세르히오 오스메냐', 1878, 'diplomacy', '정부승계·해방행정 고문', '코먼웰스 망명정부 부통령으로 미국에 피신한 정치가', 'Commonwealth Government in Exile', '워싱턴 D.C., 미국', ['헌정승계', '해방행정', '미필 협상'], ['코먼웰스 내각', '세부 정치망'], '대통령 승계 가능성과 본토 연락 단절 때문에 망명정부 내부 권한조정과 해방 후 지방정부 복구가 필요합니다.', { accessNations: ['usa'], availability: 'displaced' }),
  p('ph-carlos-p-romulo', 'philippines', '카를로스 P. 로물로', 1899, 'diplomacy', '전시선전·국제외교 고문', '필리핀·미국 전선의 언론인·코먼웰스 외교대표', 'Commonwealth information service', '미국·태평양 전선', ['국제외교', '전시언론', '유엔구상'], ['코먼웰스 망명정부', '미국 언론·외교망'], '선전 역할이 사실보도와 충돌할 수 있으며 전후 국제기구 지위를 얻으려면 독자 외교권을 보장해야 합니다.', { accessNations: ['usa'] }),
  p('ph-claro-recto', 'philippines', '클라로 M. 렉토', 1890, 'social-science', '헌정·주권정책 고문', '헌법제정과 의회정치 경험을 가진 법률가·상원의원', 'Philippine constitutionalist network', '마닐라, 점령 필리핀', ['헌법', '주권론', '법률외교'], ['필리핀 법조계', '민족주의 의회망'], '점령기 정치행적과 전후 친미·자주노선 갈등을 공개 심사해야 정통성을 확보할 수 있습니다.'),
  p('ph-jose-abad-santos', 'philippines', '호세 아바드 산토스', 1886, 'social-science', '비상사법·점령저항 고문', '대법원장 겸 비상정부 책임자로 민다나오에서 저항', 'Supreme Court of the Philippines', '민다나오, 필리핀', ['사법행정', '비상정부', '법치'], ['필리핀 대법원', '지방 저항행정망'], '1942년 5월 처형 위험이 임박해 있어 초기 구출·피난 결정이 없으면 세계선에서 영구 상실되는 시간제한 인물입니다.', { availability: 'opposition' }),
  p('ph-lorenzo-tanada', 'philippines', '로렌소 타냐다', 1898, 'social-science', '법무·협력자 조사고문', '검사·법률가로 점령기와 해방 후 법치 복구에 참여할 인물', 'Philippine legal service', '필리핀', ['법무행정', '반부패', '시민권'], ['필리핀 법조계', '시민자유 운동망'], '전시 정보가 불완전해 협력자 처벌이 보복재판이 되지 않도록 증거·항소·공개심리 제도가 필요합니다.'),
  p('ph-manuel-roxas', 'philippines', '마누엘 로하스', 1892, 'economics', '재정·점령행정 전환고문', '코먼웰스 정치가로 일본 점령하 경제행정에 관여', 'Philippine Commonwealth political network', '마닐라, 점령 필리핀', ['재정', '산업정책', '정부전환'], ['필리핀 의회망', '설탕·상업 엘리트'], '점령기 행적과 미국·게릴라 접촉을 검증해야 하며 엘리트 복구가 토지·사회개혁을 막을 위험이 있습니다.'),
  p('ph-francisco-fronda', 'philippines', '프란시스코 프론다', 1896, 'science', '축산·식량자립 고문', '필리핀대학교 농과대학에서 가금·축산 연구를 이끈 과학자', 'University of the Philippines College of Agriculture', '로스바뇨스, 필리핀', ['가금학', '축산', '식량자립'], ['필리핀대학교 농과대학', '농촌 지도망'], '점령과 전투로 종축·사료·연구시설이 소실될 위험이 커 분산 농장과 지역 종자·사료망을 보호해야 합니다.'),
];

function materialize(seed: ExpandedExpertSeed, index: number): HistoricalExpertProfile {
  const isEmerging = seed.birthYear >= 1914;
  const ability = (isEmerging ? 73 : 82) + ((seed.birthYear + index * 7) % (isEmerging ? 12 : 13));
  const potential = Math.min(99, ability + (isEmerging ? 9 : 4) + ((index * 3) % 5));
  const citation = seed.citation ?? sources[seed.nation];
  const accessNations = Array.from(new Set([seed.nation, ...(seed.accessNations ?? [])]));
  const department: HistoricalExpertProfile['department'] = ['economics', 'diplomacy', 'social-science'].includes(seed.discipline) ? 'economy' : 'science';
  return {
    id: seed.id,
    primaryNation: seed.nation,
    accessNations,
    name: seed.name,
    birthYear: seed.birthYear,
    nationality: seed.nationality ?? nationalityByNation[seed.nation],
    department,
    discipline: seed.discipline,
    appointmentTitle: seed.appointmentTitle,
    office1942: seed.office1942,
    affiliation: seed.affiliation,
    wartimeLocation: seed.wartimeLocation,
    summary: `${seed.office1942}로 활동하며 ${seed.expertise.join('·')} 역량과 ${seed.networks.join('·')} 인맥을 제공하는 실존 인물입니다.`,
    historicalConstraint: seed.historicalConstraint,
    expertise: seed.expertise,
    networks: seed.networks,
    friction: seed.historicalConstraint,
    appointmentEffect: appointmentEffects[seed.discipline],
    ability,
    potential,
    loyalty: 58 + ((index * 11 + seed.birthYear) % 39),
    influence: (isEmerging ? 45 : 62) + ((index * 13) % (isEmerging ? 32 : 35)),
    interest: 56 + ((index * 17) % 41),
    availability: seed.availability ?? 'available',
    sourceLabel: `${citation[0]} · ${seed.name}`,
    sourceUrl: citation[1],
  };
}

export const expandedHistoricalExperts: HistoricalExpertProfile[] = seeds.map(materialize);
