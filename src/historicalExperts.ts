import type { NationId, PersonnelAvailability, PersonnelDiscipline, StaffDepartment } from './types';
import { extendedHistoricalExperts } from './extendedHistoricalExperts';
import { expandedHistoricalExperts } from './expandedHistoricalExperts';
import { massHistoricalExperts } from './massHistoricalExperts';

export interface HistoricalExpertProfile {
  id: string;
  primaryNation: NationId;
  accessNations: NationId[];
  name: string;
  birthYear: number;
  nationality: string;
  department: Extract<StaffDepartment, 'science' | 'economy'>;
  discipline: PersonnelDiscipline;
  appointmentTitle: string;
  office1942: string;
  affiliation: string;
  wartimeLocation: string;
  summary: string;
  historicalConstraint: string;
  expertise: [string, string, string];
  networks: [string, string];
  friction: string;
  appointmentEffect: string;
  ability: number;
  potential: number;
  loyalty: number;
  influence: number;
  interest: number;
  availability: PersonnelAvailability;
  sourceLabel: string;
  sourceUrl?: string;
}

const westernAllies: NationId[] = ['britain', 'usa', 'freefrance', 'india', 'china', 'korea', 'philippines'];
const europeanExiles: NationId[] = ['britain', 'usa', 'freefrance', 'italy'];
const sovietNetwork: NationId[] = ['ussr', 'china', 'korea', 'vietnam'];
const asianLiberation: NationId[] = ['china', 'india', 'korea', 'vietnam', 'indonesia', 'philippines'];
const occupiedAsia: NationId[] = ['japan', 'china', 'korea', 'vietnam', 'indonesia', 'philippines'];

function expert(profile: HistoricalExpertProfile) {
  return profile;
}

const coreHistoricalExperts: HistoricalExpertProfile[] = [
  expert({
    id: 'uk-alan-turing', primaryNation: 'britain', accessNations: ['britain', 'usa'], name: '앨런 튜링', birthYear: 1912, nationality: '영국', department: 'science', discipline: 'intelligence', appointmentTitle: '암호수학·계산기술 고문',
    office1942: '정부암호학교(GC&CS) 해군 암호분석가', affiliation: '블레츨리 파크 · Hut 8', wartimeLocation: '블레츨리, 영국',
    summary: '해군 에니그마 분석과 봄브 설계에 핵심 역할을 했고 1942년 말 미국에서 보안 음성·암호 협력을 수행했습니다.',
    historicalConstraint: '업무 자체가 최고기밀이며 다른 부처로 이동시키면 Hut 8의 해군 정보 산출이 약화됩니다.', expertise: ['암호해독', '계산기계', '보안통신'], networks: ['GC&CS', '미 해군 암호기관'], friction: '군 관료제와 신분 노출 위험', appointmentEffect: '정보 연구 +4/주 · 해군 정보 신뢰도 +8',
    ability: 97, potential: 99, loyalty: 91, influence: 82, interest: 54, availability: 'poachable', sourceLabel: 'GCHQ · Alan Turing', sourceUrl: 'https://www.gchq.gov.uk/person/alan-turing',
  }),
  expert({
    id: 'uk-john-maynard-keynes', primaryNation: 'britain', accessNations: ['britain', 'usa', 'freefrance', 'india'], name: '존 메이너드 케인스', birthYear: 1883, nationality: '영국', department: 'economy', discipline: 'economics', appointmentTitle: '전쟁금융·전후질서 고문',
    office1942: '영국 재무부 무보수 고문 · 상원의원', affiliation: '영국 재무부', wartimeLocation: '런던, 영국', summary: '전쟁 재정, 대미 금융 협상과 전후 국제통화질서 구상에 관여했습니다.',
    historicalConstraint: '건강이 좋지 않고 재무부·영란은행·미국 협상선이 동시에 그의 시간을 요구합니다.', expertise: ['전쟁금융', '국제통화', '총수요 관리'], networks: ['영국 재무부', '미 재무부 협상선'], friction: '긴축 관료와 금본위론자', appointmentEffect: '주간 재정 +18 · 동맹 금융 협상 +10',
    ability: 98, potential: 98, loyalty: 86, influence: 96, interest: 60, availability: 'poachable', sourceLabel: 'Bank of England Archive · Keynes 1942–43', sourceUrl: 'https://www.bankofengland.co.uk/CalmView/Record.aspx?id=C43%2F590&src=CalmView.Catalog',
  }),
  expert({
    id: 'uk-patrick-blackett', primaryNation: 'britain', accessNations: westernAllies, name: '패트릭 블래킷', birthYear: 1897, nationality: '영국', department: 'science', discipline: 'science', appointmentTitle: '작전연구·대잠전 고문',
    office1942: '해군성 작전연구 책임 과학자', affiliation: '영국 해군성', wartimeLocation: '런던, 영국', summary: '통계와 물리학을 전술·호송·대잠전에 적용한 작전연구의 대표적 과학자입니다.', historicalConstraint: '전술 효과를 계량화하지만 지휘관의 경험적 판단과 자주 충돌합니다.', expertise: ['작전연구', '대잠전', '통계분석'], networks: ['해군성', '맨체스터 과학자 그룹'], friction: '전통적 해군 지휘부', appointmentEffect: '호송 손실 -8% · 전투 예측 오차 감소', ability: 94, potential: 97, loyalty: 84, influence: 83, interest: 66, availability: 'poachable', sourceLabel: 'Nobel Foundation · Patrick Blackett', sourceUrl: 'https://www.nobelprize.org/prizes/physics/1948/blackett/biographical/',
  }),
  expert({
    id: 'uk-joan-robinson', primaryNation: 'britain', accessNations: ['britain', 'india', 'china', 'freefrance'], name: '조앤 로빈슨', birthYear: 1903, nationality: '영국', department: 'economy', discipline: 'economics', appointmentTitle: '배급·고용경제 고문', office1942: '케임브리지대학교 경제학 강사', affiliation: '케임브리지대학교', wartimeLocation: '케임브리지, 영국', summary: '불완전경쟁과 고용·분배 문제를 연구한 케임브리지 경제학자입니다.', historicalConstraint: '정부 직책보다 학문적 독립을 중시하며 식민지 경제정책을 비판할 수 있습니다.', expertise: ['고용', '배급', '산업조직'], networks: ['케임브리지 경제학파', '노동당 지식인'], friction: '제국 특혜와 독점 기업', appointmentEffect: '민간 배급 안정도 +5 · 노동력 효율 +4%', ability: 89, potential: 96, loyalty: 76, influence: 72, interest: 69, availability: 'available', sourceLabel: 'University of Cambridge · Economics history',
  }),

  expert({
    id: 'us-vannevar-bush', primaryNation: 'usa', accessNations: ['usa', 'britain'], name: '버니바 부시', birthYear: 1890, nationality: '미국', department: 'science', discipline: 'science', appointmentTitle: '국가 연구개발 총괄', office1942: '과학연구개발국(OSRD) 국장', affiliation: '미 대통령실 · OSRD', wartimeLocation: '워싱턴 D.C., 미국', summary: '대학·산업·군 연구를 계약망으로 묶고 레이더·의학·원자 연구를 국가 사업으로 조정했습니다.', historicalConstraint: '최고 수준의 대통령 접근권이 필요하며 군의 독점 통제와 과학자 자율성 사이를 중재해야 합니다.', expertise: ['연구 포트폴리오', '산학군 계약', '레이더'], networks: ['OSRD', 'NDRC·대학 연구소'], friction: '육해군 연구권 경쟁', appointmentEffect: '모든 연구 +3/주 · 연구 슬롯 조정력 +1', ability: 96, potential: 97, loyalty: 93, influence: 98, interest: 52, availability: 'poachable', sourceLabel: 'National Science Foundation · Vannevar Bush', sourceUrl: 'https://www.nsf.gov/about/history/overview-50.jsp',
  }),
  expert({
    id: 'us-jk-galbraith', primaryNation: 'usa', accessNations: ['usa', 'britain', 'freefrance'], name: '존 케네스 갤브레이스', birthYear: 1908, nationality: '캐나다계 미국', department: 'economy', discipline: 'economics', appointmentTitle: '가격통제·민간공급 고문', office1942: '물가관리국(OPA) 부행정관', affiliation: '미국 물가관리국', wartimeLocation: '워싱턴 D.C., 미국', summary: '전시 인플레이션을 억제하기 위한 가격·임대료 통제 행정을 운영했습니다.', historicalConstraint: '기업 로비와 의회의 공격을 받으며 강한 통제는 정치력과 시장 관계를 소모합니다.', expertise: ['가격통제', '배급', '농업경제'], networks: ['OPA', '프린스턴·하버드 경제학자'], friction: '대기업·보수 의회', appointmentEffect: '주간 비용 -10 · 안정도 +3 · 기업 관계 -4', ability: 91, potential: 96, loyalty: 84, influence: 80, interest: 72, availability: 'available', sourceLabel: 'Harvard Gazette · Galbraith timeline', sourceUrl: 'https://news.harvard.edu/story/2006/05/john-kenneth-galbraith-a-timeline-of-his-life/',
  }),
  expert({
    id: 'us-albert-einstein', primaryNation: 'usa', accessNations: europeanExiles, name: '알베르트 아인슈타인', birthYear: 1879, nationality: '독일 태생 미국', department: 'science', discipline: 'science', appointmentTitle: '고등이론·과학외교 고문', office1942: '고등연구소 이론물리학 교수', affiliation: 'Institute for Advanced Study', wartimeLocation: '프린스턴, 미국', summary: '나치 독일을 피해 미국에 정착한 이론물리학자이며 1939년 루스벨트에게 우라늄 연구의 전략적 위험을 알리는 서한에 서명했습니다.', historicalConstraint: '맨해튼 계획의 구성원이 아니었고 보안 허가도 받지 않았습니다. 직접 무기개발 보너스가 아니라 이론·망명학자 네트워크와 과학외교에 기여합니다.', expertise: ['이론물리', '과학외교', '난민 학자망'], networks: ['고등연구소', '유럽 망명 과학자'], friction: '비밀무기 참여와 평화주의의 충돌', appointmentEffect: '기초연구 +4/주 · 망명 과학자 영입 +12', ability: 99, potential: 99, loyalty: 68, influence: 100, interest: 38, availability: 'poachable', sourceLabel: 'Institute for Advanced Study · Einstein', sourceUrl: 'https://www.ias.edu/albert-einstein-brief',
  }),
  expert({
    id: 'us-oppenheimer', primaryNation: 'usa', accessNations: ['usa'], name: 'J. 로버트 오펜하이머', birthYear: 1904, nationality: '미국', department: 'science', discipline: 'science', appointmentTitle: '고속중성자·특수연구소 책임자', office1942: 'S-1 고속파열 연구 조정자 · 로스앨러모스 지명자', affiliation: 'UC 버클리 · S-1 위원회', wartimeLocation: '버클리·뉴멕시코, 미국', summary: '1942년 핵무기 이론 연구를 결집했고 그해 말 비밀 연구소의 과학 책임자로 선택됐습니다.', historicalConstraint: '좌익 인맥에 대한 보안 우려와 전례 없는 조직관리 부담이 동시에 존재합니다.', expertise: ['중성자물리', '대형 연구조직', '핵무기 이론'], networks: ['버클리 물리학계', '맨해튼 계획'], friction: '보안기관·군 지휘체계', appointmentEffect: '전략 연구 +6/주 · 보안 위험 +8', ability: 97, potential: 99, loyalty: 72, influence: 91, interest: 64, availability: 'poachable', sourceLabel: 'U.S. National Park Service · Oppenheimer 1941–46', sourceUrl: 'https://www.nps.gov/articles/000/the-life-of-j-robert-oppenheimer-the-manhattan-project-years-1941-to-1946.htm',
  }),
  expert({
    id: 'us-enrico-fermi', primaryNation: 'usa', accessNations: ['usa', 'italy', 'britain'], name: '엔리코 페르미', birthYear: 1901, nationality: '이탈리아 태생 미국 망명', department: 'science', discipline: 'engineering', appointmentTitle: '원자로·중성자공학 책임자', office1942: '시카고 야금연구소 실험 책임 과학자', affiliation: '맨해튼 계획 · 시카고대학교', wartimeLocation: '시카고, 미국', summary: '1942년 12월 시카고 파일-1에서 최초의 자립 핵연쇄반응을 이끈 실험물리학자입니다.', historicalConstraint: '파시스트 인종법으로 이탈리아를 떠났으므로 이탈리아가 영입하려면 정권·인종정책의 근본적 전환이 필요합니다.', expertise: ['원자로', '중성자물리', '실험조직'], networks: ['시카고 야금연구소', '유럽 망명 물리학자'], friction: '기밀 유지와 가족 안전', appointmentEffect: '원자력 연구 +7/주 · 중공업 안전 요구 증가', ability: 99, potential: 99, loyalty: 88, influence: 95, interest: 61, availability: 'poachable', sourceLabel: 'U.S. Department of Energy · Chicago Pile-1', sourceUrl: 'https://www.energy.gov/lm/metallurgical-laboratory-university-chicago',
  }),
  expert({
    id: 'us-john-von-neumann', primaryNation: 'usa', accessNations: ['usa', 'britain'], name: '존 폰 노이만', birthYear: 1903, nationality: '헝가리 태생 미국', department: 'science', discipline: 'engineering', appointmentTitle: '탄도수학·계산체계 고문', office1942: '애버딘 탄도연구소 과학자문위원', affiliation: '고등연구소 · 미 육군 병기국', wartimeLocation: '프린스턴·애버딘, 미국', summary: '유체역학·탄도학·통계와 수치계산을 군사 문제에 적용했습니다.', historicalConstraint: '여러 군 기관이 동시에 자문을 요구하므로 한 프로젝트에 묶으면 다른 연구망이 약화됩니다.', expertise: ['탄도수학', '충격파', '수치계산'], networks: ['고등연구소', '미 육군·해군 병기국'], friction: '연구기관 간 우선권 경쟁', appointmentEffect: '포병·전략 연구 +5/주 · 시제품 위험 -5', ability: 99, potential: 99, loyalty: 90, influence: 91, interest: 68, availability: 'poachable', sourceLabel: 'Institute for Advanced Study · von Neumann', sourceUrl: 'https://www.ias.edu/von-neumann',
  }),
  expert({
    id: 'us-simon-kuznets', primaryNation: 'usa', accessNations: westernAllies, name: '사이먼 쿠즈네츠', birthYear: 1901, nationality: '러시아 태생 미국', department: 'economy', discipline: 'economics', appointmentTitle: '전시생산·국민소득 분석관', office1942: '전쟁생산위원회 계획통계국 부국장', affiliation: 'War Production Board', wartimeLocation: '워싱턴 D.C., 미국', summary: '국민소득 측정과 생산통계를 전시 동원 계획에 연결했습니다.', historicalConstraint: '정확한 통계를 얻으려면 군·기업의 기밀 자료 공개와 표준화가 필요합니다.', expertise: ['국민계정', '생산통계', '장기성장'], networks: ['NBER', '전쟁생산위원회'], friction: '부처별 통계 은폐', appointmentEffect: '생산 예측 정확도 +15 · 유휴 공장 탐지', ability: 94, potential: 97, loyalty: 87, influence: 80, interest: 70, availability: 'available', sourceLabel: 'Nobel Foundation · Simon Kuznets', sourceUrl: 'https://www.nobelprize.org/prizes/economic-sciences/1971/kuznets/biographical/',
  }),

  expert({
    id: 'su-pyotr-kapitsa', primaryNation: 'ussr', accessNations: ['ussr'], name: '표트르 카피차', birthYear: 1894, nationality: '소련', department: 'science', discipline: 'engineering', appointmentTitle: '극저온·산업산소 총감', office1942: '물리문제연구소장 · 산소산업 담당', affiliation: '소련 과학아카데미', wartimeLocation: '모스크바·카잔, 소련', summary: '저압 팽창터빈을 이용한 산소 생산을 전시 야금·의료 수요에 적용했습니다.', historicalConstraint: '과학적 독립성이 강하고 정치적 간섭에 공개적으로 저항할 수 있습니다.', expertise: ['극저온', '산업산소', '강자기장'], networks: ['과학아카데미', '산소산업총국'], friction: 'NKVD·정치 개입', appointmentEffect: '철강 생산 +5% · 야전 의료 회복 +2', ability: 97, potential: 98, loyalty: 66, influence: 89, interest: 54, availability: 'poachable', sourceLabel: 'Nobel Foundation · Pyotr Kapitsa', sourceUrl: 'https://www.nobelprize.org/prizes/physics/1978/kapitsa/biographical/',
  }),
  expert({
    id: 'su-nikolai-voznesensky', primaryNation: 'ussr', accessNations: ['ussr'], name: '니콜라이 보즈네센스키', birthYear: 1903, nationality: '소련', department: 'economy', discipline: 'economics', appointmentTitle: '국가계획·전시경제 총괄', office1942: '고스플란 의장 · 국가방위위원', affiliation: '소련 국가계획위원회', wartimeLocation: '모스크바, 소련', summary: '공장 소개, 군수 우선순위와 국가 자원계획을 최고 지도부에서 조정했습니다.', historicalConstraint: '계획 수치의 정치화와 부처 간 할당 투쟁이 심하며 실패 책임이 개인에게 집중됩니다.', expertise: ['중앙계획', '공장 소개', '자원 할당'], networks: ['고스플란', '국가방위위원회'], friction: '군수 인민위원부 간 경쟁', appointmentEffect: '공장 이전 손실 -10% · 민간 안정도 -2', ability: 94, potential: 96, loyalty: 90, influence: 96, interest: 42, availability: 'poachable', sourceLabel: 'Encyclopaedia Britannica · Voznesensky',
  }),
  expert({
    id: 'su-igor-kurchatov', primaryNation: 'ussr', accessNations: ['ussr'], name: '이고리 쿠르차토프', birthYear: 1903, nationality: '소련', department: 'science', discipline: 'science', appointmentTitle: '우라늄·함정방호 연구책임자', office1942: '해군 함정 자기기뢰 방호 연구원', affiliation: '레닌그라드 물리기술연구소 · 소련 해군', wartimeLocation: '카잔·무르만스크, 소련', summary: '전쟁 초기 함정의 자기기뢰 방호에 참여했고 1943년 소련 원자계획의 과학책임자가 됩니다.', historicalConstraint: '1942년에는 원자계획이 막 재개되는 단계이므로 즉시 핵무기를 제공하지 않습니다.', expertise: ['핵물리', '자기기뢰 방호', '대형연구소'], networks: ['과학아카데미', '소련 해군'], friction: '정보 부족과 자원 우선순위', appointmentEffect: '기뢰 손실 -6% · 원자 연구 잠금 해제 조건 완화', ability: 95, potential: 99, loyalty: 88, influence: 84, interest: 71, availability: 'available', sourceLabel: 'Rosatom history · Kurchatov',
  }),
  expert({
    id: 'su-leonid-kantorovich', primaryNation: 'ussr', accessNations: sovietNetwork, name: '레오니트 칸토로비치', birthYear: 1912, nationality: '소련', department: 'economy', discipline: 'economics', appointmentTitle: '수송·생산 최적화 고문', office1942: '군사공학기술대학교 교수', affiliation: '레닌그라드 군사공학기술대학교', wartimeLocation: '봉쇄된 레닌그라드·야로슬라블, 소련', summary: '선형계획과 자원배분 수학을 생산·수송 문제에 적용한 수학자·경제학자입니다.', historicalConstraint: '시장가격을 활용한 계산 아이디어가 정통 계획경제 관료에게 정치적으로 의심받을 수 있습니다.', expertise: ['선형계획', '수송 최적화', '자원배분'], networks: ['레닌그라드 수학계', '군사공학기술대'], friction: '정통 경제관료', appointmentEffect: '보급 낭비 -8% · 생산 할당 효율 +4%', ability: 96, potential: 99, loyalty: 79, influence: 70, interest: 76, availability: 'available', sourceLabel: 'Nobel Foundation · Kantorovich', sourceUrl: 'https://www.nobelprize.org/prizes/economic-sciences/1975/kantorovich/biographical/',
  }),
  expert({
    id: 'su-sergei-korolev', primaryNation: 'ussr', accessNations: ['ussr'], name: '세르게이 코롤료프', birthYear: 1907, nationality: '소련', department: 'science', discipline: 'engineering', appointmentTitle: '로켓추진·특수항공 설계자', office1942: 'NKVD 특별설계국 수감 기술자', affiliation: '카잔 제16설계국', wartimeLocation: '카잔, 소련', summary: '수감 상태에서 항공기용 로켓 보조추진과 제트 추진 연구에 참여했습니다.', historicalConstraint: '대숙청 피해자로 건강이 악화됐으며 영입은 석방·복권이라는 정치 결정을 요구합니다.', expertise: ['로켓추진', '항공기 설계', '시험조직'], networks: ['카잔 특별설계국', '소련 로켓 기술자'], friction: 'NKVD 구금체계', appointmentEffect: '로켓 연구 +6/주 · 정치력 비용 증가', ability: 94, potential: 100, loyalty: 46, influence: 62, interest: 88, availability: 'opposition', sourceLabel: 'NASA history · Sergei Korolev', sourceUrl: 'https://www.nasa.gov/history/sergei-p-korolev-the-lead-soviet-rocket-engineer/',
  }),

  expert({
    id: 'de-werner-heisenberg', primaryNation: 'germany', accessNations: ['germany'], name: '베르너 하이젠베르크', birthYear: 1901, nationality: '독일', department: 'science', discipline: 'science', appointmentTitle: '핵물리·우라늄 연구책임자', office1942: '카이저빌헬름 물리학연구소장', affiliation: '우라늄 클럽 · 카이저빌헬름협회', wartimeLocation: '베를린, 독일', summary: '독일 우라늄 연구에서 원자로 이론과 중성자 물리를 담당했습니다.', historicalConstraint: '독일 계획의 규모·목표·성과에는 역사학적 논쟁이 있으며 게임에서도 즉시 핵무기 성공으로 처리하지 않습니다.', expertise: ['양자역학', '원자로 이론', '중성자물리'], networks: ['카이저빌헬름협회', '우라늄 클럽'], friction: '군수 우선순위와 연구자 동기', appointmentEffect: '원자로 연구 +4/주 · 불확실성 높은 전략 분기', ability: 97, potential: 98, loyalty: 55, influence: 90, interest: 58, availability: 'poachable', sourceLabel: 'Nobel Foundation · Heisenberg', sourceUrl: 'https://www.nobelprize.org/prizes/physics/1932/heisenberg/biographical/',
  }),
  expert({
    id: 'de-walter-eucken', primaryNation: 'germany', accessNations: ['germany', 'freefrance'], name: '발터 오이켄', birthYear: 1891, nationality: '독일', department: 'economy', discipline: 'economics', appointmentTitle: '질서경제·전후개혁 고문', office1942: '프라이부르크대학교 경제학 교수', affiliation: '프라이부르크학파', wartimeLocation: '프라이부르크, 독일', summary: '경쟁 질서와 법적 경제구조를 연구하며 전후 경제체제 구상에 참여한 경제학자입니다.', historicalConstraint: '나치 경제 통제와 거리를 두었고 반정권 인맥 때문에 비밀경찰의 감시 위험이 있습니다.', expertise: ['질서경제', '경쟁정책', '전후 재건'], networks: ['프라이부르크학파', '반나치 지식인'], friction: '나치 당·독점 카르텔', appointmentEffect: '장기 생산성 +5% · 정권 충성도 -6', ability: 91, potential: 95, loyalty: 43, influence: 73, interest: 75, availability: 'opposition', sourceLabel: 'Walter Eucken Institut · biography',
  }),
  expert({
    id: 'de-wernher-von-braun', primaryNation: 'germany', accessNations: ['germany', 'usa'], name: '베르너 폰 브라운', birthYear: 1912, nationality: '독일', department: 'science', discipline: 'engineering', appointmentTitle: '장거리 로켓 기술책임자', office1942: '페네뮌데 육군 로켓개발 기술책임자', affiliation: '육군병기국 · 페네뮌데', wartimeLocation: '페네뮌데, 독일', summary: 'A4 장거리 탄도 로켓의 설계·시험 조직을 이끈 공학자입니다.', historicalConstraint: '나치 전쟁기구와 결합된 개발이며 이후 강제노동 생산체계와 연결되는 중대한 윤리·정치 위험이 있습니다.', expertise: ['액체로켓', '탄도유도', '대형 시험장'], networks: ['페네뮌데', '독일 로켓팀'], friction: 'SS·육군의 통제권 경쟁', appointmentEffect: '로켓 연구 +7/주 · 윤리 위험과 적 폭격 위협 증가', ability: 96, potential: 99, loyalty: 61, influence: 87, interest: 73, availability: 'poachable', sourceLabel: 'NASA History · von Braun', sourceUrl: 'https://www.nasa.gov/people/wernher-von-braun/',
  }),
  expert({
    id: 'de-konrad-zuse', primaryNation: 'germany', accessNations: ['germany'], name: '콘라트 추제', birthYear: 1910, nationality: '독일', department: 'science', discipline: 'engineering', appointmentTitle: '자동계산·항공구조 분석가', office1942: '추제 장치제작소 계산기 개발자', affiliation: 'Zuse Apparatebau · 헨셸 항공', wartimeLocation: '베를린, 독일', summary: 'Z3 계산기를 완성하고 항공기 구조 계산을 위한 자동계산 장치를 개발했습니다.', historicalConstraint: '관료들이 계산기의 전략적 가치를 낮게 평가하고 부품·자금이 부족합니다.', expertise: ['프로그램 계산기', '부동소수점', '항공구조 계산'], networks: ['헨셸 항공', '베를린 공학자'], friction: '전자부품 배급 관료', appointmentEffect: '공학 연구 +5/주 · 설계 계산시간 -12%', ability: 92, potential: 99, loyalty: 70, influence: 59, interest: 88, availability: 'available', sourceLabel: 'Deutsches Museum · Konrad Zuse',
  }),
  expert({
    id: 'de-ludwig-erhard', primaryNation: 'germany', accessNations: ['germany', 'freefrance', 'usa'], name: '루트비히 에르하르트', birthYear: 1897, nationality: '독일', department: 'economy', discipline: 'economics', appointmentTitle: '산업조사·전후통화 고문', office1942: '뉘른베르크 산업연구소 연구자', affiliation: 'Institut für Wirtschaftsbeobachtung', wartimeLocation: '뉘른베르크, 독일', summary: '소비재 산업과 전후 경제 전환 문제를 연구했습니다.', historicalConstraint: '전시 통제경제의 즉시 성과보다 전후 경쟁경제 전환에 강하며 정권 핵심과 거리가 있습니다.', expertise: ['산업조사', '통화개혁', '전후 전환'], networks: ['뉘른베르크 산업계', '질서자유주의자'], friction: '전시 배급·카르텔 체계', appointmentEffect: '전후 재건 속도 +12% · 현재 군수 우선도 -2', ability: 86, potential: 96, loyalty: 52, influence: 64, interest: 77, availability: 'opposition', sourceLabel: 'Bundesbank · German monetary history',
  }),
  expert({
    id: 'de-otto-hahn', primaryNation: 'germany', accessNations: ['germany', 'britain'], name: '오토 한', birthYear: 1879, nationality: '독일', department: 'science', discipline: 'science', appointmentTitle: '핵화학·방사성동위원소 고문', office1942: '카이저빌헬름 화학연구소장', affiliation: '카이저빌헬름협회', wartimeLocation: '베를린, 독일', summary: '핵분열 발견에 핵심 기여를 한 방사화학자이며 연구소를 이끌었습니다.', historicalConstraint: '군사적 핵개발에 대한 개인적 태도와 정권의 요구 사이에 긴장이 존재합니다.', expertise: ['핵화학', '방사성동위원소', '연구소 운영'], networks: ['카이저빌헬름협회', '유럽 핵물리학자'], friction: '군사화 요구', appointmentEffect: '핵화학 연구 +5/주 · 국제 과학 평판 +4', ability: 96, potential: 96, loyalty: 48, influence: 88, interest: 55, availability: 'poachable', sourceLabel: 'Nobel Foundation · Otto Hahn', sourceUrl: 'https://www.nobelprize.org/prizes/chemistry/1944/hahn/biographical/',
  }),

  expert({
    id: 'jp-hideki-yukawa', primaryNation: 'japan', accessNations: ['japan'], name: '유카와 히데키', birthYear: 1907, nationality: '일본', department: 'science', discipline: 'science', appointmentTitle: '이론물리·핵력 연구고문', office1942: '교토제국대학 이론물리학 교수', affiliation: '교토제국대학', wartimeLocation: '교토, 일본', summary: '중간자 이론으로 핵력을 설명한 세계적 이론물리학자였습니다.', historicalConstraint: '기초이론 연구자이므로 단기 병기 생산보다 장기 연구 역량과 학술 네트워크에 기여합니다.', expertise: ['핵력 이론', '양자장론', '학술인재 육성'], networks: ['교토제국대학', '일본 물리학회'], friction: '군의 단기성과 요구', appointmentEffect: '기초연구 +5/주 · 과학 인재 성장 +8%', ability: 97, potential: 99, loyalty: 76, influence: 88, interest: 61, availability: 'poachable', sourceLabel: 'Nobel Foundation · Hideki Yukawa', sourceUrl: 'https://www.nobelprize.org/prizes/physics/1949/yukawa/biographical/',
  }),
  expert({
    id: 'jp-tanzan-ishibashi', primaryNation: 'japan', accessNations: ['japan'], name: '이시바시 단잔', birthYear: 1884, nationality: '일본', department: 'economy', discipline: 'economics', appointmentTitle: '전시재정·축소제국론 고문', office1942: '동양경제신보사 사장·주필', affiliation: '동양경제신보', wartimeLocation: '도쿄, 일본', summary: '식민지 포기와 무역 중심의 경제발전을 주장해 온 경제 언론인입니다.', historicalConstraint: '대일본주의와 군부 팽창정책을 비판해 왔으므로 정책 영향력은 검열과 탄압 위험을 동반합니다.', expertise: ['재정', '무역', '탈식민 경제'], networks: ['경제 언론계', '자유주의 정치인'], friction: '군부·검열기관', appointmentEffect: '민간경제 안정 +6 · 점령지 긴장 -5 · 군부 신임 -7', ability: 89, potential: 94, loyalty: 41, influence: 78, interest: 79, availability: 'opposition', sourceLabel: 'Ishibashi Tanzan Memorial Foundation',
  }),
  expert({
    id: 'jp-sin-itiro-tomonaga', primaryNation: 'japan', accessNations: ['japan'], name: '도모나가 신이치로', birthYear: 1906, nationality: '일본', department: 'science', discipline: 'engineering', appointmentTitle: '전자파·레이더 이론고문', office1942: '도쿄문리과대학 교수 · 해군 전파연구 참여', affiliation: '도쿄문리과대학', wartimeLocation: '도쿄, 일본', summary: '양자전기역학 연구와 함께 전시 중 마이크로파·도파관 문제를 다뤘습니다.', historicalConstraint: '기초연구와 군사 전파연구 사이의 자원 배분이 필요합니다.', expertise: ['양자전기역학', '마이크로파', '도파관'], networks: ['니시나 연구실', '해군 전파연구진'], friction: '실험장비 부족', appointmentEffect: '레이더 연구 +6/주 · 야간 탐지 +5', ability: 95, potential: 99, loyalty: 80, influence: 76, interest: 72, availability: 'available', sourceLabel: 'Nobel Foundation · Sin-Itiro Tomonaga', sourceUrl: 'https://www.nobelprize.org/prizes/physics/1965/tomonaga/biographical/',
  }),
  expert({
    id: 'jp-hideo-itokawa', primaryNation: 'japan', accessNations: ['japan'], name: '이토카와 히데오', birthYear: 1912, nationality: '일본', department: 'science', discipline: 'engineering', appointmentTitle: '항공기·공력 설계고문', office1942: '나카지마 비행기 설계기사', affiliation: '나카지마 비행기', wartimeLocation: '오타, 일본', summary: '전투기 구조·공력 설계에 참여한 젊은 항공공학자입니다.', historicalConstraint: '생산 현장에 묶여 있으며 연구 전환에는 군수기업과 육군항공본부의 승인이 필요합니다.', expertise: ['항공역학', '전투기 설계', '경량구조'], networks: ['나카지마 비행기', '도쿄제국대학 항공학계'], friction: '육군·기업 납기 압력', appointmentEffect: '항공기 신뢰도 +4 · 시제품 기간 -8%', ability: 88, potential: 98, loyalty: 78, influence: 65, interest: 82, availability: 'poachable', sourceLabel: 'JAXA · Itokawa legacy',
  }),
  expert({
    id: 'jp-shigeto-tsuru', primaryNation: 'japan', accessNations: ['japan', 'usa'], name: '쓰루 시게토', birthYear: 1912, nationality: '일본', department: 'economy', discipline: 'economics', appointmentTitle: '경제동원·산업연관 분석가', office1942: '전시 경제조사·기획 인력', affiliation: '일본 정부 경제기획 조직', wartimeLocation: '도쿄, 일본', summary: '미국에서 경제학을 수학하고 귀국해 전시 경제조사에 관여한 젊은 경제학자입니다.', historicalConstraint: '미국 유학 경력과 마르크스 경제학 관심 때문에 군부의 의심을 받을 수 있습니다.', expertise: ['산업연관', '국민소득', '경제조사'], networks: ['하버드 경제학계', '일본 경제기획 관료'], friction: '특고·군부 감시', appointmentEffect: '생산 통계 +10 · 전후 경제설계 +6', ability: 85, potential: 96, loyalty: 60, influence: 56, interest: 83, availability: 'available', sourceLabel: 'Hitotsubashi University · Shigeto Tsuru',
  }),

  expert({
    id: 'cn-zhu-kezhen', primaryNation: 'china', accessNations: ['china'], name: '주커전', birthYear: 1890, nationality: '중국', department: 'science', discipline: 'science', appointmentTitle: '기상·국토과학 고문', office1942: '국립저장대학교 총장 · 기상학자', affiliation: '국립저장대학교', wartimeLocation: '쭌이, 중국', summary: '전란 속 대학의 대이동을 이끌면서 기상·지리 연구와 인재교육을 유지했습니다.', historicalConstraint: '대학 공동체를 전선에서 보호해야 하며 중앙정부의 단기 군사동원과 충돌할 수 있습니다.', expertise: ['기상학', '지리학', '대학 이전'], networks: ['저장대학교', '중앙연구원'], friction: '전시 교육예산 부족', appointmentEffect: '기상 예측 +10 · 연구인력 손실 -8%', ability: 92, potential: 96, loyalty: 90, influence: 83, interest: 70, availability: 'poachable', sourceLabel: 'Zhejiang University · Zhu Kezhen history',
  }),
  expert({
    id: 'cn-ma-yinchu', primaryNation: 'china', accessNations: ['china'], name: '마인추', birthYear: 1882, nationality: '중국', department: 'economy', discipline: 'economics', appointmentTitle: '재정개혁·부패감찰 고문', office1942: '국민정부 비판으로 수감·연금된 경제학자', affiliation: '충칭대학교·입법원 경력', wartimeLocation: '구이저우·충칭, 중국', summary: '전시 재정과 권력층 부패를 공개 비판한 경제학자입니다.', historicalConstraint: '영입은 석방과 정치적 보호를 요구하며 기존 재정·당 관료의 반발을 부릅니다.', expertise: ['재정', '인플레이션', '부패감시'], networks: ['중국 대학 경제학계', '개혁파 지식인'], friction: '국민당 권력층', appointmentEffect: '부패 손실 -10 · 정치 신뢰 -5/+8 분기', ability: 89, potential: 92, loyalty: 45, influence: 79, interest: 84, availability: 'opposition', sourceLabel: 'Peking University · Ma Yinchu history',
  }),
  expert({
    id: 'cn-qian-xuesen', primaryNation: 'china', accessNations: ['china', 'usa'], name: '첸쉐썬', birthYear: 1911, nationality: '중국', department: 'science', discipline: 'engineering', appointmentTitle: '공기역학·제트추진 연구원', office1942: '캘리포니아공과대학 공기역학 연구자', affiliation: 'Caltech · GALCIT', wartimeLocation: '패서디나, 미국', summary: '고속 공기역학과 제트추진 이론을 연구한 중국인 공학자입니다.', historicalConstraint: '1942년에는 미국 연구망에 있으며 중국으로 이동시키면 현지 시설·동료 네트워크를 잃습니다.', expertise: ['공기역학', '제트추진', '탄도이론'], networks: ['Caltech', '중국 유학생 과학자망'], friction: '시설 격차와 보안 심사', appointmentEffect: '제트·로켓 연구 +5/주 · 국제 연구 연결 +6', ability: 92, potential: 100, loyalty: 76, influence: 71, interest: 78, availability: 'poachable', sourceLabel: 'Caltech Archives · Qian Xuesen',
  }),
  expert({
    id: 'cn-weng-wenhao', primaryNation: 'china', accessNations: ['china'], name: '웡원하오', birthYear: 1889, nationality: '중국', department: 'economy', discipline: 'industry', appointmentTitle: '자원지질·산업동원 고문', office1942: '국민정부 경제·자원 관료 · 지질학자', affiliation: '국민정부 · 중앙지질조사소', wartimeLocation: '충칭, 중국', summary: '지질학과 자원조사를 바탕으로 광업·산업정책을 연결했습니다.', historicalConstraint: '지역군벌과 성 정부가 광산·수송로 자료를 통제합니다.', expertise: ['자원지질', '광업정책', '산업행정'], networks: ['중앙지질조사소', '국민정부 경제부처'], friction: '성 정부·군벌 자원권', appointmentEffect: '강철 수입 +6/주 · 자원 탐사 성공률 +12', ability: 90, potential: 93, loyalty: 78, influence: 88, interest: 63, availability: 'poachable', sourceLabel: 'Academia Sinica history · Weng Wenhao',
  }),

  expert({
    id: 'in-homi-bhabha', primaryNation: 'india', accessNations: ['india', 'britain'], name: '호미 J. 바바', birthYear: 1909, nationality: '인도', department: 'science', discipline: 'science', appointmentTitle: '우주선·핵물리 연구고문', office1942: '인도과학원 물리학 리더', affiliation: 'Indian Institute of Science', wartimeLocation: '방갈로르, 인도', summary: '전쟁 발발 뒤 인도에 남아 우주선·입자물리 연구진을 구축했습니다.', historicalConstraint: '식민정부의 단기 군사과제보다 인도 독자 연구기관 건설을 중시합니다.', expertise: ['우주선', '입자물리', '연구기관 설계'], networks: ['인도과학원', '타타 재단'], friction: '식민정부 연구 우선순위', appointmentEffect: '기초연구 +5/주 · 독립 연구기관 분기 해금', ability: 95, potential: 100, loyalty: 68, influence: 82, interest: 79, availability: 'available', sourceLabel: 'TIFR · Homi Bhabha history', sourceUrl: 'https://www.tifr.res.in/portal/history.php',
  }),
  expert({
    id: 'in-pc-mahalanobis', primaryNation: 'india', accessNations: ['india', 'britain'], name: '프라산타 찬드라 마할라노비스', birthYear: 1893, nationality: '인도', department: 'economy', discipline: 'economics', appointmentTitle: '통계·표본조사 고문', office1942: '인도통계연구소 설립자·소장', affiliation: 'Indian Statistical Institute', wartimeLocation: '캘커타, 인도', summary: '대규모 표본조사와 통계적 품질관리 체계를 발전시켰습니다.', historicalConstraint: '신뢰할 행정자료가 부족하며 지방·식민 관료의 조사 협조를 확보해야 합니다.', expertise: ['표본조사', '통계계획', '품질관리'], networks: ['인도통계연구소', '국제 통계학계'], friction: '분절된 식민 행정자료', appointmentEffect: '정책 예측 +12 · 생산 불량률 -4%', ability: 95, potential: 98, loyalty: 85, influence: 80, interest: 78, availability: 'available', sourceLabel: 'Indian Statistical Institute · history', sourceUrl: 'https://www.isical.ac.in/content/history',
  }),
  expert({
    id: 'in-shanti-bhatnagar', primaryNation: 'india', accessNations: ['india', 'britain'], name: '샨티 스와루프 바트나가르', birthYear: 1894, nationality: '인도', department: 'science', discipline: 'industry', appointmentTitle: '산업연구·국립연구소 총괄', office1942: '과학산업연구위원회 책임자 · CSIR 초대 총장', affiliation: 'CSIR', wartimeLocation: '델리, 인도', summary: '1942년 출범한 CSIR을 이끌며 과학을 산업 문제와 연결했습니다.', historicalConstraint: '식민정부·인도 산업자본·대학의 서로 다른 요구를 조정해야 합니다.', expertise: ['산업화학', '연구소 네트워크', '기술이전'], networks: ['CSIR', '인도 대학·산업계'], friction: '연구기금과 특허권 배분', appointmentEffect: '산업 연구 +5/주 · 공장 효율 +3%', ability: 93, potential: 96, loyalty: 88, influence: 86, interest: 74, availability: 'poachable', sourceLabel: 'CSIR · Shanti Swarup Bhatnagar', sourceUrl: 'https://www.csir.res.in/en/award/shanti-swarup-bhatnagar-prize-science-and-technology',
  }),
  expert({
    id: 'in-meghnad-saha', primaryNation: 'india', accessNations: ['india'], name: '메그나드 사하', birthYear: 1893, nationality: '인도', department: 'science', discipline: 'science', appointmentTitle: '물리학·국가과학계획 고문', office1942: '캘커타대학교 물리학 교수', affiliation: '캘커타대학교', wartimeLocation: '캘커타, 인도', summary: '항성 이온화 이론으로 유명하며 인도 과학시설·달력·산업계획 문제에 적극 참여했습니다.', historicalConstraint: '식민정책과 과학행정의 무능을 공개 비판해 관료와 충돌할 수 있습니다.', expertise: ['천체물리', '사이클로트론', '과학정책'], networks: ['캘커타대학교', 'Science and Culture'], friction: '식민 과학행정', appointmentEffect: '물리 연구 +4/주 · 과학정책 정당성 +6', ability: 94, potential: 96, loyalty: 74, influence: 84, interest: 77, availability: 'available', sourceLabel: 'TIFR · Famous Indian Scientists', sourceUrl: 'https://www.tifr.res.in/~outreach/biographies/scientists.pdf',
  }),

  expert({
    id: 'fr-frederic-joliot-curie', primaryNation: 'freefrance', accessNations: ['freefrance', 'britain', 'usa'], name: '프레데리크 졸리오퀴리', birthYear: 1900, nationality: '프랑스', department: 'science', discipline: 'science', appointmentTitle: '핵화학·국내 과학저항 연락관', office1942: '콜레주 드 프랑스 교수 · 프랑스 저항운동 참가자', affiliation: 'Collège de France · Front National', wartimeLocation: '점령 파리, 프랑스', summary: '인공방사능 연구의 노벨상 수상자이자 점령지 과학자·저항 네트워크의 중심 인물입니다.', historicalConstraint: '파리에 남아 있어 접촉 자체가 방첩 작전이며 체포·연구시설 상실 위험이 큽니다.', expertise: ['핵화학', '방사능', '과학자 저항망'], networks: ['콜레주 드 프랑스', '프랑스 국내저항'], friction: '독일 점령당국·비시 경찰', appointmentEffect: '핵화학 연구 +5/주 · 국내 저항 정보 +8', ability: 96, potential: 97, loyalty: 80, influence: 91, interest: 73, availability: 'opposition', sourceLabel: 'Nobel Foundation · Frédéric Joliot', sourceUrl: 'https://www.nobelprize.org/prizes/chemistry/1935/joliot-fred/biographical/',
  }),
  expert({
    id: 'fr-jean-monnet', primaryNation: 'freefrance', accessNations: ['freefrance', 'britain', 'usa'], name: '장 모네', birthYear: 1888, nationality: '프랑스', department: 'economy', discipline: 'diplomacy', appointmentTitle: '연합 생산·전후통합 고문', office1942: '영미 전쟁생산 조정·승리계획 고문', affiliation: '영국·미국 연합 생산 네트워크', wartimeLocation: '워싱턴 D.C., 미국', summary: '연합국 생산능력 확대와 프랑스의 전후 정치·경제 재건을 연결했습니다.', historicalConstraint: '드골과의 정치적 관계가 복잡하며 초국가적 통합 구상은 주권파와 충돌합니다.', expertise: ['연합 생산', '경제외교', '전후 통합'], networks: ['백악관·전쟁생산위원회', '자유프랑스·알제 네트워크'], friction: '드골파 주권론자', appointmentEffect: '동맹 생산 지원 +8 · 전후 연합체 분기 해금', ability: 95, potential: 97, loyalty: 70, influence: 95, interest: 65, availability: 'poachable', sourceLabel: 'Fondation Jean Monnet · biography',
  }),
  expert({
    id: 'fr-pierre-auger', primaryNation: 'freefrance', accessNations: ['freefrance', 'britain', 'usa'], name: '피에르 오제', birthYear: 1899, nationality: '프랑스', department: 'science', discipline: 'science', appointmentTitle: '원자·연합과학 연락관', office1942: '자유프랑스 과학자 · 연합 원자연구 참여', affiliation: '자유프랑스 과학연구단', wartimeLocation: '시카고·몬트리올', summary: '우주선·원자물리 연구자이며 망명 프랑스 과학자와 연합 연구기관을 연결했습니다.', historicalConstraint: '연합국 핵 기밀 접근은 프랑스의 독자 통제권과 분리되어 있습니다.', expertise: ['우주선', '원자물리', '과학외교'], networks: ['자유프랑스', '시카고·몬트리올 연구진'], friction: '영미 핵정보 제한', appointmentEffect: '연합 연구 공유 +8 · 프랑스 독자연구 기반 +4', ability: 90, potential: 96, loyalty: 86, influence: 72, interest: 80, availability: 'available', sourceLabel: 'CERN Courier · Pierre Auger',
  }),

  expert({
    id: 'it-edoardo-amaldi', primaryNation: 'italy', accessNations: ['italy', 'freefrance'], name: '에도아르도 아말디', birthYear: 1908, nationality: '이탈리아', department: 'science', discipline: 'science', appointmentTitle: '핵·입자물리 연구고문', office1942: '로마대학교 실험물리학 교수', affiliation: '로마대학교', wartimeLocation: '로마, 이탈리아', summary: '페르미 학파의 일원으로 이탈리아에 남아 물리학 연구와 인재교육을 유지했습니다.', historicalConstraint: '동료들의 망명으로 연구진이 약화됐고 파시스트 체제의 군사화 압력을 받습니다.', expertise: ['중성자물리', '입자검출', '과학조직 재건'], networks: ['로마대학교', '유럽 망명 물리학자'], friction: '연구인력 유출·파시스트 통제', appointmentEffect: '물리 연구 +4/주 · 망명인재 귀환 가능성 +8', ability: 92, potential: 98, loyalty: 64, influence: 75, interest: 81, availability: 'available', sourceLabel: 'CERN · Edoardo Amaldi history',
  }),
  expert({
    id: 'it-luigi-einaudi', primaryNation: 'italy', accessNations: ['italy', 'freefrance'], name: '루이지 에이나우디', birthYear: 1874, nationality: '이탈리아', department: 'economy', discipline: 'economics', appointmentTitle: '통화·자유경제 개혁고문', office1942: '토리노대학교 재정학 교수 · 상원의원', affiliation: '토리노대학교', wartimeLocation: '토리노, 이탈리아', summary: '재정·통화 안정과 자유주의 경제질서를 주장한 경제학자입니다.', historicalConstraint: '파시즘에 비판적이며 1943년 스위스로 피신합니다. 영입은 정권 노선 전환을 요구합니다.', expertise: ['통화안정', '재정', '자유주의 개혁'], networks: ['토리노 학계', '반파시스트 자유주의자'], friction: '파시스트 당·통제경제', appointmentEffect: '인플레이션 -8 · 정권 강경파 신임 -6', ability: 93, potential: 94, loyalty: 42, influence: 85, interest: 80, availability: 'opposition', sourceLabel: 'Banca d’Italia · Luigi Einaudi',
  }),
  expert({
    id: 'it-bruno-rossi', primaryNation: 'italy', accessNations: ['usa', 'italy', 'britain'], name: '브루노 로시', birthYear: 1905, nationality: '이탈리아계 미국 망명', department: 'science', discipline: 'engineering', appointmentTitle: '우주선·검출기술 고문', office1942: 'MIT 방사선연구소 연구자', affiliation: 'MIT Radiation Laboratory', wartimeLocation: '케임브리지, 미국', summary: '파시스트 인종법으로 망명한 뒤 레이더·우주선 계측 연구에 참여했습니다.', historicalConstraint: '이탈리아 복귀에는 인종법 폐지와 안전 보장이 선행되어야 합니다.', expertise: ['입자검출', '레이더 계측', '우주선'], networks: ['MIT 방사선연구소', '이탈리아 망명 과학자'], friction: '파시스트 인종정책', appointmentEffect: '레이더 신뢰도 +5 · 망명 과학자 영입 +6', ability: 93, potential: 97, loyalty: 79, influence: 78, interest: 76, availability: 'opposition', sourceLabel: 'MIT Physics · Bruno Rossi',
  }),
  expert({
    id: 'it-adriano-olivetti', primaryNation: 'italy', accessNations: ['italy', 'freefrance'], name: '아드리아노 올리베티', birthYear: 1901, nationality: '이탈리아', department: 'economy', discipline: 'industry', appointmentTitle: '정밀산업·노동공동체 고문', office1942: '올리베티사 경영자·반파시스트 지식인', affiliation: 'Olivetti', wartimeLocation: '이브레아, 이탈리아', summary: '정밀기계 기업을 경영하면서 노동복지와 지역 공동체 중심 산업모델을 구상했습니다.', historicalConstraint: '반파시스트 활동으로 감시받으며 국가 군수명령과 기업 공동체 구상이 충돌합니다.', expertise: ['정밀기계', '산업디자인', '노동복지'], networks: ['올리베티 기술진', '반파시스트 지식인'], friction: '파시스트 기업통제', appointmentEffect: '정밀장비 생산 +5% · 노동 안정도 +4', ability: 90, potential: 96, loyalty: 48, influence: 80, interest: 78, availability: 'opposition', sourceLabel: 'Fondazione Adriano Olivetti',
  }),

  expert({
    id: 'kr-lee-tae-gyu', primaryNation: 'korea', accessNations: ['korea', 'japan', 'usa'], name: '이태규', birthYear: 1902, nationality: '조선', department: 'science', discipline: 'science', appointmentTitle: '양자화학·화학인재 고문', office1942: '교토제국대학 화학과 교수', affiliation: '교토제국대학', wartimeLocation: '교토, 일본', summary: '교토제국대학에서 양자화학을 연구·교육한 조선인 화학자입니다.', historicalConstraint: '일제 학술체제 안의 교수라는 위치와 전시 협력 논란을 함께 모델링해야 하며, 독립진영 합류는 신뢰 검증을 요구합니다.', expertise: ['양자화학', '반응속도론', '고등교육'], networks: ['교토제국대학', '재일 조선인 과학자'], friction: '식민지 경력과 독립진영의 불신', appointmentEffect: '화학 연구 +5/주 · 고급 인재 양성 +6', ability: 91, potential: 97, loyalty: 52, influence: 72, interest: 71, availability: 'poachable', sourceLabel: '대한민국 과학기술유공자 · 이태규', sourceUrl: 'https://www.koreascientists.kr/',
  }),
  expert({
    id: 'kr-kim-seong-su', primaryNation: 'korea', accessNations: ['korea'], name: '김성수', birthYear: 1891, nationality: '조선', department: 'economy', discipline: 'industry', appointmentTitle: '민족자본·교육재정 고문', office1942: '보성전문학교·경성방직 계열 지도 인사', affiliation: '보성전문학교 · 경성방직', wartimeLocation: '경성, 조선', summary: '교육기관과 민족계 기업·언론을 연결한 자본가·교육자였습니다.', historicalConstraint: '전시기 행적과 친일 협력 논란이 존재하므로 독립운동 진영에서는 정당성·신뢰 비용이 큽니다.', expertise: ['교육재정', '방직산업', '민간 네트워크'], networks: ['보성전문학교', '경성방직·동아일보'], friction: '독립진영 내부 정통성 논쟁', appointmentEffect: '민간 재정 +12 · 정통성 위험 +6', ability: 84, potential: 87, loyalty: 38, influence: 88, interest: 45, availability: 'opposition', sourceLabel: '한국민족문화대백과사전 · 김성수',
  }),
  expert({
    id: 'kr-lee-seung-gi', primaryNation: 'korea', accessNations: ['korea', 'japan'], name: '리승기', birthYear: 1905, nationality: '조선', department: 'science', discipline: 'engineering', appointmentTitle: '고분자·합성섬유 연구고문', office1942: '교토제국대학 응용화학과 교수', affiliation: '교토제국대학', wartimeLocation: '교토, 일본', summary: '합성섬유 비날론의 기반 연구로 알려진 조선인 응용화학자입니다.', historicalConstraint: '일본 전시연구 체계 안에 있으며 이후 북한으로 이동한 경력까지 고려하면 진영 선택과 연구 통제 갈등이 큽니다.', expertise: ['고분자화학', '합성섬유', '산업화학'], networks: ['교토제국대학', '조선인 화학자망'], friction: '식민체제·이념 선택', appointmentEffect: '피복 생산 +7% · 합성소재 연구 +4/주', ability: 90, potential: 97, loyalty: 55, influence: 69, interest: 77, availability: 'poachable', sourceLabel: '한국 과학사 자료 · 리승기',
  }),

  expert({
    id: 'vn-tran-dai-nghia', primaryNation: 'vietnam', accessNations: ['vietnam', 'freefrance'], name: '쩐다이응이아', birthYear: 1913, nationality: '베트남', department: 'science', discipline: 'engineering', appointmentTitle: '항공·병기공학 연락관', office1942: '프랑스 항공·기계 분야 엔지니어', affiliation: '프랑스 산업계', wartimeLocation: '프랑스', summary: '프랑스에서 공학을 수학하고 항공·기계 기술 경력을 쌓았으며 1946년 베트남 혁명정부에 합류합니다.', historicalConstraint: '1942년에는 아직 프랑스에 있으므로 접촉·귀환과 장비·도면 이전이 별도 작전입니다.', expertise: ['기계공학', '항공기술', '병기설계'], networks: ['프랑스 공학계', '베트남 유학생망'], friction: '점령 프랑스 감시·귀환로', appointmentEffect: '현지 병기 연구 +5/주 · 기술 자립 분기 해금', ability: 87, potential: 97, loyalty: 76, influence: 63, interest: 86, availability: 'available', sourceLabel: 'Vietnam military history · Trần Đại Nghĩa',
  }),
  expert({
    id: 'vn-do-dinh-thien', primaryNation: 'vietnam', accessNations: ['vietnam'], name: '도딘티엔', birthYear: 1904, nationality: '베트남', department: 'economy', discipline: 'industry', appointmentTitle: '지하재정·산업조달 고문', office1942: '하노이 기업가·비밀 혁명 후원자', affiliation: '인도차이나 민간 상공망', wartimeLocation: '하노이, 인도차이나', summary: '사업 기반과 비밀 정치 네트워크를 활용해 이후 혁명정부 재정에 기여한 기업가입니다.', historicalConstraint: '자산과 조직이 점령당국의 감시 아래 있어 공개 동원은 전면 압수 위험을 부릅니다.', expertise: ['비밀재정', '상공망', '조달'], networks: ['하노이 상인망', '베트남 독립운동 연락선'], friction: '프랑스·일본 점령행정', appointmentEffect: '비밀자금 +10/주 · 발각 위험 +5', ability: 82, potential: 91, loyalty: 89, influence: 70, interest: 83, availability: 'available', sourceLabel: 'Vietnam revolutionary finance history',
  }),
  expert({
    id: 'vn-hoang-xuan-han', primaryNation: 'vietnam', accessNations: ['vietnam', 'freefrance'], name: '호앙쑤언한', birthYear: 1908, nationality: '베트남', department: 'science', discipline: 'social-science', appointmentTitle: '수학·기술교육 고문', office1942: '부오이 고등학교 수학·공학 교사', affiliation: '인도차이나 교육계', wartimeLocation: '하노이, 인도차이나', summary: '프랑스에서 수학·공학을 공부하고 베트남어 과학·교육 용어 정비에 힘쓴 학자입니다.', historicalConstraint: '무장투쟁보다 교육·문화 자립을 중시해 급진적 군사노선과 충돌할 수 있습니다.', expertise: ['수학교육', '기술용어', '교육행정'], networks: ['하노이 교육계', '베트남 지식인'], friction: '식민교육제도·급진파', appointmentEffect: '인재 성장 +8% · 장기 연구역량 +4', ability: 88, potential: 95, loyalty: 72, influence: 69, interest: 80, availability: 'available', sourceLabel: 'Vietnam education history · Hoàng Xuân Hãn',
  }),

  expert({
    id: 'id-herman-johannes', primaryNation: 'indonesia', accessNations: ['indonesia'], name: '헤르만 요하네스', birthYear: 1912, nationality: '인도네시아', department: 'science', discipline: 'engineering', appointmentTitle: '물리·전력공학 고문', office1942: '반둥공과대학계 공학자', affiliation: 'Technische Hoogeschool Bandung', wartimeLocation: '자바, 네덜란드령 동인도', summary: '물리·공학 교육을 받은 인도네시아 과학자로 이후 독립전쟁의 병기·에너지 기술에 기여합니다.', historicalConstraint: '일본 점령기 교육기관 해체와 이동 때문에 실험실·부품 접근이 제한됩니다.', expertise: ['물리학', '전력공학', '현지 병기기술'], networks: ['반둥 공학계', '인도네시아 청년 기술자'], friction: '점령당국의 연구 통제', appointmentEffect: '현지 공학 연구 +4/주 · 시설 복구 +8%', ability: 84, potential: 95, loyalty: 88, influence: 63, interest: 87, availability: 'available', sourceLabel: 'Universitas Gadjah Mada Museum · Herman Johannes', sourceUrl: 'https://museum.ugm.ac.id/2024/08/18/prof-herman-johannes-ilmuwan-pembuat-bom-dan-pahlawan-nasional-indonesia/',
  }),
  expert({
    id: 'id-sjafruddin-prawiranegara', primaryNation: 'indonesia', accessNations: ['indonesia'], name: '샤프루딘 프라위라네가라', birthYear: 1911, nationality: '인도네시아', department: 'economy', discipline: 'economics', appointmentTitle: '재정·조세행정 고문', office1942: '식민 재정관료 출신 경제인', affiliation: '네덜란드령 동인도 재정행정 경력', wartimeLocation: '자바, 인도네시아', summary: '법학·경제행정 경험을 갖춘 인물로 이후 공화국 재무장관과 비상정부 수반이 됩니다.', historicalConstraint: '식민관료 경력을 독립재정으로 전환하려면 조직 신뢰와 현지 세무자료를 확보해야 합니다.', expertise: ['조세', '중앙은행', '비상재정'], networks: ['인도네시아 행정관료', '이슬람 정치망'], friction: '점령 통화체계·급진 청년파', appointmentEffect: '세입 +11/주 · 화폐 안정 +5', ability: 84, potential: 95, loyalty: 82, influence: 70, interest: 84, availability: 'available', sourceLabel: 'Bank Indonesia history · Sjafruddin',
  }),
  expert({
    id: 'id-sumitro-djojohadikusumo', primaryNation: 'indonesia', accessNations: ['indonesia'], name: '수미트로 조요하디쿠수모', birthYear: 1917, nationality: '인도네시아', department: 'economy', discipline: 'economics', appointmentTitle: '국민신용·개발경제 연구고문', office1942: '네덜란드 경제학교 박사과정 연구자', affiliation: 'Nederlandse Economische Hogeschool', wartimeLocation: '로테르담, 독일 점령 네덜란드', summary: '1943년 국민신용제도와 대공황을 다룬 논문으로 경제학 박사학위를 받은 인도네시아 경제학자입니다.', historicalConstraint: '1942년에는 독일 점령하의 네덜란드에 있으므로 영입에는 비밀 연락·안전한 귀환로·연합국 승인이 필요합니다.', expertise: ['국민신용', '개발경제', '산업계획'], networks: ['로테르담 경제학계', '인도네시아 유학생망'], friction: '점령지 이동·현장 행정 경험 부족', appointmentEffect: '장기 산업계획 +7 · 신용배분 효율 +5%', ability: 84, potential: 98, loyalty: 79, influence: 64, interest: 90, availability: 'available', sourceLabel: 'Universitas Indonesia FEB · Sumitro', sourceUrl: 'https://feb.ui.ac.id/2015/03/26/bedah-buku-jejak-perlawanan-begawan-pejuang-sumitro-djojohadikusumo/',
  }),
  expert({
    id: 'id-sam-ratulangi', primaryNation: 'indonesia', accessNations: ['indonesia'], name: '삼 라툴랑이', birthYear: 1890, nationality: '인도네시아', department: 'science', discipline: 'social-science', appointmentTitle: '수학·지역연방 고문', office1942: '수학자·민족주의 정치인', affiliation: '미나하사 민족운동', wartimeLocation: '술라웨시·자바', summary: '유럽에서 수학 박사학위를 받은 민족주의 지식인으로 지역 대표성과 교육을 연결했습니다.', historicalConstraint: '군도 각 지역의 이해 차이를 무시한 중앙집권 정책에 반대할 수 있습니다.', expertise: ['수학', '지역행정', '교육'], networks: ['미나하사 엘리트', '인도네시아 민족주의자'], friction: '자바 중심주의·점령당국', appointmentEffect: '동부 군도 안정 +7 · 연방주의 분기 해금', ability: 83, potential: 90, loyalty: 87, influence: 76, interest: 78, availability: 'available', sourceLabel: 'Indonesian national hero archive · Ratulangi',
  }),

  expert({
    id: 'ph-gregorio-zara', primaryNation: 'philippines', accessNations: ['philippines', 'usa'], name: '그레고리오 사라', birthYear: 1902, nationality: '필리핀', department: 'science', discipline: 'engineering', appointmentTitle: '항공·통신공학 고문', office1942: '필리핀 항공·물리 공학자', affiliation: '필리핀 공공사업·공학교육계', wartimeLocation: '필리핀', summary: '항공·물리학을 연구한 필리핀 공학자로 전후 항공기와 통신 발명 활동으로 이어집니다.', historicalConstraint: '점령하에서는 연구시설 접근과 연합군 연락이 모두 방첩 위험을 동반합니다.', expertise: ['항공공학', '통신', '대체연료'], networks: ['필리핀 공학계', '프랑스 유학 과학망'], friction: '일본 점령행정·시설 부족', appointmentEffect: '항공 정비 +5% · 비밀통신 연구 +3/주', ability: 83, potential: 94, loyalty: 78, influence: 64, interest: 85, availability: 'available', sourceLabel: 'Philippine National Academy of Science and Technology · Zara', sourceUrl: 'https://www.members.nast.dost.gov.ph/index.php/list-of-national-scientist/details/3/42',
  }),
  expert({
    id: 'ph-vicente-sinco', primaryNation: 'philippines', accessNations: ['philippines', 'usa'], name: '비센테 싱코', birthYear: 1896, nationality: '필리핀', department: 'economy', discipline: 'social-science', appointmentTitle: '헌정·전시행정 고문', office1942: '필리핀 법학자·헌정 연구자', affiliation: '필리핀대학교 법학계', wartimeLocation: '필리핀', summary: '헌법과 행정제도를 연구해 전시정부의 정통성·재건 설계에 활용할 수 있는 법학자입니다.', historicalConstraint: '점령정부·망명정부·저항세력 가운데 어느 기관이 합법성을 갖는지에 따라 충성·영입 조건이 달라집니다.', expertise: ['헌정', '행정법', '국가재건'], networks: ['필리핀대학교', '법조·교육계'], friction: '점령정부 정통성 논쟁', appointmentEffect: '정부 정통성 +6 · 전후 헌정 분기 해금', ability: 84, potential: 92, loyalty: 74, influence: 75, interest: 77, availability: 'available', sourceLabel: 'University of the Philippines history · Vicente Sinco',
  }),
  expert({
    id: 'ph-fe-del-mundo', primaryNation: 'philippines', accessNations: ['philippines', 'usa'], name: '페 델 문도', birthYear: 1911, nationality: '필리핀', department: 'science', discipline: 'medicine', appointmentTitle: '소아의료·피난민 보건 고문', office1942: '산토토마스 억류자 의료·아동보호 활동', affiliation: '필리핀 의료계', wartimeLocation: '마닐라, 필리핀', summary: '미국 연수 뒤 귀국해 전쟁기 아동과 민간인을 치료한 소아과 의사입니다.', historicalConstraint: '군 의료 우선 정책과 민간 아동보호 임무가 충돌할 수 있으며 점령지 이동이 제한됩니다.', expertise: ['소아의학', '피난민 보건', '임시병원'], networks: ['마닐라 의료계', '민간 구호망'], friction: '점령군·군 의료 우선순위', appointmentEffect: '민간 사망 -10% · 안정도 +5 · 병력 회복 +1', ability: 91, potential: 97, loyalty: 94, influence: 77, interest: 83, availability: 'available', sourceLabel: 'Philippine National Academy of Science and Technology · del Mundo',
  }),
  ...extendedHistoricalExperts,
  ...expandedHistoricalExperts,
];

export const historicalExperts: HistoricalExpertProfile[] = Array.from(
  [...coreHistoricalExperts, ...massHistoricalExperts]
    .reduce((profiles, profile) => {
      const normalizedName = profile.name.trim().toLocaleLowerCase('ko-KR');
      if (!profiles.has(normalizedName)) profiles.set(normalizedName, profile);
      return profiles;
    }, new Map<string, HistoricalExpertProfile>())
    .values(),
);

export const historicalExpertCoverage = historicalExperts.reduce<Partial<Record<NationId, number>>>((coverage, profile) => {
  coverage[profile.primaryNation] = (coverage[profile.primaryNation] ?? 0) + 1;
  return coverage;
}, {}) as Record<NationId, number>;

export const minimumHistoricalExpertsPerNation = Math.min(...Object.values(historicalExpertCoverage));

const startingExpertIds: Record<NationId, { science: string; economy: string }> = {
  britain: { science: 'uk-alan-turing', economy: 'uk-john-maynard-keynes' },
  usa: { science: 'us-vannevar-bush', economy: 'us-jk-galbraith' },
  ussr: { science: 'su-pyotr-kapitsa', economy: 'su-nikolai-voznesensky' },
  germany: { science: 'de-werner-heisenberg', economy: 'de-walter-eucken' },
  japan: { science: 'jp-hideki-yukawa', economy: 'jp-tanzan-ishibashi' },
  china: { science: 'cn-zhu-kezhen', economy: 'cn-ma-yinchu' },
  india: { science: 'in-homi-bhabha', economy: 'in-pc-mahalanobis' },
  freefrance: { science: 'fr-frederic-joliot-curie', economy: 'fr-jean-monnet' },
  italy: { science: 'it-edoardo-amaldi', economy: 'it-luigi-einaudi' },
  korea: { science: 'kr-lee-tae-gyu', economy: 'kr-kim-seong-su' },
  vietnam: { science: 'vn-tran-dai-nghia', economy: 'vn-do-dinh-thien' },
  indonesia: { science: 'id-herman-johannes', economy: 'id-sjafruddin-prawiranegara' },
  philippines: { science: 'ph-gregorio-zara', economy: 'ph-vicente-sinco' },
};

export function getStartingHistoricalExperts(nationId: NationId) {
  const ids = startingExpertIds[nationId];
  return {
    science: historicalExperts.find((profile) => profile.id === ids.science)!,
    economy: historicalExperts.find((profile) => profile.id === ids.economy)!,
  };
}

export function getRecruitableHistoricalExperts(nationId: NationId) {
  const starting = new Set(Object.values(startingExpertIds[nationId]));
  return historicalExperts
    .filter((profile) => profile.accessNations.includes(nationId) && !starting.has(profile.id))
    .sort((a, b) => b.interest + b.potential - (a.interest + a.potential));
}

export function getHistoricalExpert(id: string) {
  return historicalExperts.find((profile) => profile.id === id);
}
