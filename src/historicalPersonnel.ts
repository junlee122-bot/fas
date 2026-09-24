import type { HistoricalPerson, NationId, PersonnelAvailability, StaffDepartment } from './types';

export interface HistoricalNationRoster {
  roleHolders: [HistoricalPerson, HistoricalPerson, HistoricalPerson];
  staff: HistoricalPerson[];
  market: HistoricalPerson[];
}

type CommandSeed = NonNullable<HistoricalPerson['command']>;

function person(
  nationId: NationId,
  key: string,
  name: string,
  office: string,
  affiliation: string,
  summary: string,
  department: StaffDepartment,
  ratings: [number, number, number, number, number],
  availability: PersonnelAvailability,
  command?: CommandSeed,
  source?: readonly [label: string, url: string],
): HistoricalPerson {
  const [ability, potential, loyalty, influence, interest] = ratings;
  return {
    id: `${nationId}-${key}`,
    nationId,
    name,
    office,
    affiliation,
    summary,
    department,
    ability,
    potential,
    loyalty,
    influence,
    interest,
    availability,
    sourceLabel: source?.[0],
    sourceUrl: source?.[1],
    command,
  };
}

const commander = (rank: string, command: number, attack: number, defense: number, logistics: number, trait: string, specialty: string): CommandSeed => ({
  rank, command, attack, defense, logistics, trait, specialty,
});

export const historicalPersonnel: Record<NationId, HistoricalNationRoster> = {
  britain: {
    roleHolders: [
      person('britain', 'churchill', '윈스턴 처칠', '영국 총리 겸 국방장관', '전쟁내각', '전쟁내각과 제국 전략을 직접 이끈 정치 지도자입니다.', 'political', [91, 91, 86, 98, 28], 'displaced'),
      person('britain', 'montgomery', '버나드 몽고메리', '영국 제8군 사령관', '영국 육군', '1942년 8월 제8군 지휘를 맡아 북아프리카 전역을 준비했습니다.', 'operations', [89, 92, 78, 91, 42], 'displaced', commander('중장', 91, 87, 94, 82, '치밀한 준비', '지상전 · 부대 사기')),
      person('britain', 'menzies', '스튜어트 멘지스', '비밀정보부(SIS) 국장 C', 'SIS', '전시 해외정보 수집과 연합 정보 협력을 지휘했습니다.', 'personnel', [86, 88, 77, 88, 35], 'displaced'),
    ],
    staff: [
      person('britain', 'brooke', '앨런 브룩', '제국총참모장', '영국 육군', '전쟁내각의 군사 조언과 세계 전략 조정을 담당했습니다.', 'operations', [92, 94, 82, 94, 72], 'poachable', commander('대장', 93, 86, 93, 88, '전략 조정자', '대전략 · 연합 지휘')),
      person('britain', 'leathers', '프레더릭 리더스', '전시수송장관', '전쟁내각', '상선·철도·항만을 통합해 전구 수송을 관리했습니다.', 'logistics', [87, 88, 79, 82, 76], 'poachable'),
      person('britain', 'lyttelton', '올리버 리틀턴', '생산장관', '전쟁내각', '군수 생산과 부처 간 자원 배분을 조정했습니다.', 'armaments', [86, 89, 73, 81, 78], 'poachable'),
      person('britain', 'ismay', '헤이스팅스 이즈메이', '국방장관 비서 겸 참모장', '전쟁내각 사무국', '총리와 참모총장위원회 사이의 실무 연결을 맡았습니다.', 'personnel', [84, 88, 88, 83, 82], 'poachable'),
      person('britain', 'eden', '앤서니 이든', '외무장관', '외무부', '동맹 관리와 전후 외교 구상을 담당했습니다.', 'political', [88, 92, 80, 91, 68], 'poachable'),
    ],
    market: [
      person('britain', 'alexander', '해럴드 알렉산더', '중동군 총사령관', '영국 육군', '1942년 8월부터 중동 전구의 상급 지휘를 맡았습니다.', 'operations', [88, 91, 78, 86, 68], 'available', commander('대장', 89, 84, 90, 83, '연합군 조정', '전구 지휘 · 방어')),
      person('britain', 'slim', '윌리엄 슬림', '버마 군단장', '영국령 인도군', '버마 철수전의 경험을 가진 현장형 지휘관입니다.', 'logistics', [85, 96, 84, 78, 74], 'available', commander('중장', 87, 86, 88, 92, '현장 회복력', '정글전 · 군수')),
      person('britain', 'mountbatten', '루이스 마운트배튼', '합동작전본부장', '합동작전본부', '상륙전과 합동작전 개념을 추진했습니다.', 'armaments', [82, 92, 70, 90, 71], 'poachable'),
      person('britain', 'gubbins', '콜린 거빈스', '특수작전국 작전국장', 'SOE', '점령지 저항조직 지원과 비정규전을 설계했습니다.', 'personnel', [87, 92, 76, 80, 69], 'poachable'),
      person('britain', 'leigh-mallory', '트래퍼드 리맬러리', '전투기사령부 사령관', '영국 공군', '대규모 전투기 운용을 지지한 공군 지휘관입니다.', 'political', [80, 86, 62, 79, 58], 'available', commander('공군대장', 80, 88, 73, 74, '대편대 지지자', '항공우세 · 공군 정치')),
    ],
  },
  usa: {
    roleHolders: [
      person('usa', 'roosevelt', '프랭클린 D. 루스벨트', '미국 대통령', '백악관', '총동원과 연합국 대전략을 이끈 국가 원수입니다.', 'political', [94, 94, 90, 99, 31], 'displaced'),
      person('usa', 'eisenhower', '드와이트 D. 아이젠하워', '유럽전구 미군 사령관', '미 육군', '1942년 6월 유럽전구 지휘관에 임명되고 토치 작전을 지휘했습니다.', 'operations', [89, 98, 90, 92, 55], 'displaced', commander('중장', 93, 83, 87, 91, '연합 지휘', '연합군 조정 · 대전략')),
      person('usa', 'donovan', '윌리엄 J. 도노번', '전략정보국(OSS) 국장', 'OSS', '1942년 창설된 OSS의 정보·특수작전을 지휘했습니다.', 'personnel', [88, 93, 78, 88, 45], 'displaced'),
    ],
    staff: [
      person('usa', 'marshall', '조지 C. 마셜', '미 육군참모총장', '미 육군', '미 육군의 동원과 세계 전구 전략을 총괄했습니다.', 'operations', [95, 96, 91, 97, 70], 'poachable', commander('대장', 95, 86, 91, 94, '조직 설계자', '대전략 · 동원')),
      person('usa', 'king', '어니스트 J. 킹', '함대총사령관 겸 해군작전부장', '미 해군', '함대 운용과 대서양·태평양 자원 배분을 장악했습니다.', 'logistics', [91, 93, 72, 94, 61], 'poachable', commander('대장', 91, 89, 84, 88, '공세적 해군가', '해군전 · 수송')),
      person('usa', 'arnold', '헨리 H. 아널드', '미 육군항공대 사령관', '미 육군항공대', '항공기 대량 생산과 전략항공 전력을 확대했습니다.', 'armaments', [92, 94, 84, 91, 76], 'poachable'),
      person('usa', 'leahy', '윌리엄 D. 리히', '대통령 비서실장 겸 합참 의장 역할', '백악관', '대통령과 합동참모진 사이에서 최고위 군사 조정을 맡았습니다.', 'personnel', [90, 91, 91, 94, 79], 'poachable'),
      person('usa', 'hopkins', '해리 홉킨스', '대통령 특별보좌관', '백악관', '무기대여와 정상외교를 통해 연합국 자원을 연결했습니다.', 'political', [89, 91, 94, 93, 82], 'poachable'),
    ],
    market: [
      person('usa', 'macarthur', '더글러스 맥아더', '남서태평양지역 연합군 최고사령관', '미 육군', '필리핀 철수 뒤 남서태평양의 독립 지휘권을 보유했습니다.', 'operations', [89, 92, 54, 96, 47], 'poachable', commander('대장', 91, 91, 80, 79, '독립 지휘권', '도서 전역 · 상륙')),
      person('usa', 'nimitz', '체스터 W. 니미츠', '태평양함대 및 태평양지역 총사령관', '미 해군', '미드웨이 이후 중부태평양 해군 전략을 이끌었습니다.', 'logistics', [94, 97, 88, 95, 63], 'poachable', commander('대장', 95, 92, 91, 94, '침착한 함대 지휘', '항모전 · 해상 군수')),
      person('usa', 'patton', '조지 S. 패튼', '서부기동부대 사령관', '미 육군', '토치 작전을 준비한 공격적 기갑 지휘관입니다.', 'armaments', [88, 93, 67, 87, 75], 'available', commander('소장', 88, 95, 72, 76, '기갑 돌파', '속도 · 충격')),
      person('usa', 'bradley', '오마 N. 브래들리', '미 제82보병사단장', '미 육군', '교육과 조직 관리에 강점을 보인 신진 지휘관입니다.', 'personnel', [83, 96, 87, 72, 84], 'available', commander('소장', 84, 82, 86, 87, '병사 중심', '훈련 · 조직')),
      person('usa', 'hull', '코델 헐', '미 국무장관', '국무부', '연합국 외교와 다자주의 구상을 주도했습니다.', 'political', [88, 89, 82, 89, 73], 'poachable'),
    ],
  },
  ussr: {
    roleHolders: [
      person('ussr', 'stalin', '이오시프 스탈린', '국가방위위원회 의장 겸 최고사령관', '국가방위위원회', '소련의 전쟁 수행과 인사·생산 결정을 집중 통제했습니다.', 'political', [92, 92, 48, 100, 18], 'displaced'),
      person('ussr', 'zhukov', '게오르기 주코프', '최고사령관 대리', '스타프카', '1942년 주요 전선의 위기 대응과 반격 계획을 조정했습니다.', 'operations', [96, 97, 79, 95, 46], 'displaced', commander('대장', 96, 95, 93, 86, '결정적 반격', '대규모 지상전 · 돌파')),
      person('ussr', 'sudoplatov', '파벨 수도플라토프', 'NKVD 제4국장', 'NKVD', '적 후방 공작과 특수임무 조직을 지휘했습니다.', 'personnel', [87, 91, 70, 84, 39], 'displaced'),
    ],
    staff: [
      person('ussr', 'vasilevsky', '알렉산드르 바실렙스키', '붉은군 총참모장', '스타프카', '1942년 6월부터 총참모장으로 전략 작전안을 조정했습니다.', 'operations', [95, 98, 88, 92, 73], 'poachable', commander('대장', 95, 91, 94, 92, '총참모 엘리트', '작전계획 · 전선 조정')),
      person('ussr', 'khrulev', '안드레이 흐룰료프', '붉은군 후방근무총국장', '붉은군', '철도·보급·후방근무 체계를 통합 운영했습니다.', 'logistics', [93, 94, 83, 86, 78], 'poachable'),
      person('ussr', 'ustinov', '드미트리 우스티노프', '군비인민위원', '군비인민위원부', '무기 공장의 이전과 전시 생산 확대를 관리했습니다.', 'armaments', [94, 98, 86, 87, 84], 'poachable'),
      person('ussr', 'shaposhnikov', '보리스 샤포시니코프', '국방인민위원 대리', '붉은군', '총참모 경험을 바탕으로 동원·교육 체계를 지원했습니다.', 'personnel', [91, 92, 87, 90, 77], 'poachable'),
      person('ussr', 'molotov', '뱌체슬라프 몰로토프', '외무인민위원', '소련 정부', '영미 동맹과 전시 외교 협상을 담당했습니다.', 'political', [89, 90, 75, 93, 68], 'poachable'),
    ],
    market: [
      person('ussr', 'rokossovsky', '콘스탄틴 로코솝스키', '돈 전선군 사령관', '붉은군', '스탈린그라드 축선에서 유연한 방어와 포위전을 준비했습니다.', 'operations', [94, 99, 84, 88, 76], 'available', commander('중장', 95, 93, 96, 89, '작전적 유연성', '포위 · 종심 방어')),
      person('ussr', 'mikoyan', '아나스타스 미코얀', '국가방위위원회 보급 담당', '국가방위위원회', '식량·연료·피복 등 전시 보급 배분을 조정했습니다.', 'logistics', [90, 92, 78, 89, 72], 'poachable'),
      person('ussr', 'kuznetsov', '니콜라이 쿠즈네초프', '해군인민위원', '소련 해군', '함대 준비태세와 해상 수송을 지휘했습니다.', 'armaments', [88, 94, 82, 87, 70], 'poachable', commander('제독', 89, 85, 90, 88, '준비태세', '함대 · 연안 방어')),
      person('ussr', 'konev', '이반 코네프', '칼리닌 전선군 사령관', '붉은군', '서부 축선에서 공세적 전선 지휘 경험을 축적했습니다.', 'personnel', [90, 96, 74, 86, 79], 'available', commander('중장', 91, 93, 85, 83, '공세 지향', '돌파 · 추격')),
      person('ussr', 'beria', '라브렌티 베리야', '내무인민위원', 'NKVD', '보안기구와 일부 전략 생산 사업에 광범위한 영향력을 행사했습니다.', 'political', [86, 87, 35, 97, 21], 'poachable'),
    ],
  },
  germany: {
    roleHolders: [
      person('germany', 'hitler', '아돌프 히틀러', '국가원수 겸 국방군 최고사령관', '나치 정권', '정치·군사 결정을 개인에게 집중시킨 독재자입니다.', 'political', [75, 75, 22, 100, 10], 'displaced'),
      person('germany', 'rommel', '에르빈 롬멜', '아프리카 기갑군 사령관', '독일 육군', '1942년 북아프리카의 기동전을 지휘했습니다.', 'operations', [91, 93, 69, 94, 48], 'displaced', commander('원수', 92, 96, 82, 71, '대담한 기동', '사막전 · 기갑 돌파')),
      person('germany', 'canaris', '빌헬름 카나리스', '국방군 정보부(아프베어) 국장', 'OKW 아프베어', '해외 군사정보와 방첩 조직을 이끌었습니다.', 'personnel', [84, 88, 45, 87, 32], 'displaced'),
    ],
    staff: [
      person('germany', 'keitel', '빌헬름 카이텔', '국방군 최고사령부 총장', 'OKW', '최고사령부의 명령 전달과 부처 조정을 담당했습니다.', 'operations', [78, 80, 91, 91, 61], 'poachable', commander('원수', 78, 74, 79, 82, '상명하복', '최고사령부 조정')),
      person('germany', 'jodl', '알프레트 요들', '국방군 작전부장', 'OKW', '전구별 작전 명령과 상황 판단을 총괄했습니다.', 'logistics', [86, 88, 78, 86, 68], 'poachable'),
      person('germany', 'speer', '알베르트 슈페어', '군수장관', '군수부', '1942년부터 군수 생산의 집중과 합리화를 추진했습니다.', 'armaments', [91, 96, 70, 91, 81], 'poachable'),
      person('germany', 'fromm', '프리드리히 프롬', '보충군 사령관', '독일 육군', '병력 보충·훈련과 본토 예비군 체계를 관리했습니다.', 'personnel', [87, 89, 65, 83, 73], 'poachable'),
      person('germany', 'goebbels', '요제프 괴벨스', '선전장관', '나치 정권', '언론·선전과 국내 동원 메시지를 통제했습니다.', 'political', [89, 90, 84, 95, 52], 'poachable'),
    ],
    market: [
      person('germany', 'manstein', '에리히 폰 만슈타인', '제11군 사령관', '독일 육군', '크림 전역 뒤 동부전선의 상급 지휘 후보로 부상했습니다.', 'operations', [95, 97, 57, 91, 67], 'available', commander('원수', 96, 96, 90, 86, '작전적 기동', '포위 · 기동방어')),
      person('germany', 'donitz', '카를 되니츠', '잠수함대 사령관', '독일 해군', '대서양 잠수함전을 중앙 통제했습니다.', 'logistics', [89, 92, 81, 89, 71], 'poachable', commander('제독', 89, 91, 85, 87, '집단 잠수함전', '해상차단 · 함대')),
      person('germany', 'milch', '에르하르트 밀히', '공군 총감', '독일 공군', '항공기 생산과 공군 행정에 영향력을 행사했습니다.', 'armaments', [85, 89, 63, 88, 66], 'poachable'),
      person('germany', 'guderian', '하인츠 구데리안', '육군 장성 예비역 상태', '독일 육군', '1941년 말 해임 뒤 지휘 보직 없이 기갑전 교리를 대표했습니다.', 'personnel', [93, 95, 49, 90, 58], 'available', commander('상급대장', 93, 97, 80, 82, '기갑전 이론가', '기갑 · 통신')),
      person('germany', 'schacht', '얄마르 샤흐트', '무임소장관', '독일 정부', '정권 내부에서 배제되어 가던 경제 관료이자 정치적 비주류였습니다.', 'political', [82, 83, 34, 76, 44], 'opposition'),
    ],
  },
  japan: {
    roleHolders: [
      person('japan', 'tojo', '도조 히데키', '일본 총리 겸 육군대신', '일본 내각', '정부와 육군 행정을 결합해 전쟁 수행을 주도했습니다.', 'political', [84, 84, 82, 98, 17], 'displaced'),
      person('japan', 'yamamoto', '야마모토 이소로쿠', '연합함대 사령장관', '일본 해군', '태평양의 주력 함대 작전을 지휘했습니다.', 'operations', [95, 96, 76, 96, 49], 'displaced', commander('대장', 96, 94, 88, 89, '항모전 선구자', '함대결전 · 항공전')),
      person('japan', 'hattori', '핫토리 다쿠시로', '육군 참모본부 작전과장', '육군 참모본부', '남방·태평양 작전 기획에 관여한 핵심 참모였습니다.', 'personnel', [86, 89, 82, 86, 38], 'displaced'),
    ],
    staff: [
      person('japan', 'sugiyama', '스기야마 하지메', '육군 참모총장', '일본 육군', '대본영 육군부의 전구 전략과 병력 배치를 총괄했습니다.', 'operations', [87, 88, 83, 94, 62], 'poachable', commander('대장', 87, 84, 86, 80, '대본영 조정', '육군 전략 · 동원')),
      person('japan', 'nagano', '나가노 오사미', '군령부 총장', '일본 해군', '해군 최고 전략기관을 이끌며 함대 자원을 배분했습니다.', 'logistics', [88, 89, 78, 93, 57], 'poachable', commander('대장', 88, 85, 87, 86, '함대 전략', '해군 · 보급')),
      person('japan', 'shimada', '시마다 시게타로', '해군대신', '일본 내각', '해군 행정과 조함·인사 예산을 담당했습니다.', 'armaments', [82, 84, 84, 88, 69], 'poachable'),
      person('japan', 'ugaki', '우가키 마토메', '연합함대 참모장', '연합함대', '야마모토를 보좌해 함대 작전안을 실무 조정했습니다.', 'personnel', [90, 93, 87, 84, 78], 'poachable'),
      person('japan', 'kido', '기도 고이치', '내대신', '황실', '천황과 내각·군 지도부 사이의 정치 연락을 담당했습니다.', 'political', [86, 88, 81, 92, 65], 'poachable'),
    ],
    market: [
      person('japan', 'nagumo', '나구모 주이치', '제1항공함대 사령장관', '일본 해군', '1942년 주요 항모 기동부대를 지휘했습니다.', 'operations', [85, 87, 74, 87, 68], 'available', commander('중장', 86, 89, 80, 82, '항모 기동부대', '해군항공 · 기습')),
      person('japan', 'kondo', '곤도 노부타케', '제2함대 사령장관', '일본 해군', '남방작전과 미드웨이 지원부대를 지휘했습니다.', 'logistics', [87, 90, 82, 85, 72], 'available', commander('중장', 88, 86, 88, 87, '신중한 함대 지휘', '수상전 · 호송')),
      person('japan', 'ozawa', '오자와 지사부로', '제3함대 사령장관', '일본 해군', '항모 운용과 함대 항공 집중을 연구한 지휘관입니다.', 'armaments', [88, 95, 76, 81, 81], 'available'),
      person('japan', 'yamashita', '야마시타 도모유키', '제1방면군 사령관', '일본 육군', '말레이 전역 뒤 만주 방면으로 전출된 지상군 지휘관입니다.', 'personnel', [92, 94, 71, 89, 59], 'poachable', commander('중장', 93, 95, 86, 84, '고속 침투', '정글전 · 기동')),
      person('japan', 'togo', '도고 시게노리', '외무대신(1942년 9월까지)', '일본 외무성', '개전 외교를 담당했으나 군부와의 견해 차이로 물러났습니다.', 'political', [88, 90, 57, 82, 55], 'opposition'),
    ],
  },
  china: {
    roleHolders: [
      person('china', 'chiang', '장제스', '국민정부 군사위원장 겸 행정원장', '국민정부', '중국의 군사·정치 지도권을 집중 보유했습니다.', 'political', [89, 89, 72, 99, 20], 'displaced'),
      person('china', 'xue-yue', '쉐웨', '제9전구 사령장관', '국민혁명군', '창사 방어전으로 명성을 얻은 전구 지휘관입니다.', 'operations', [92, 95, 80, 90, 52], 'displaced', commander('상장', 93, 90, 95, 83, '천로전법', '종심 방어 · 소모전')),
      person('china', 'dai-li', '다이리', '군사위원회 조사통계국 책임자', '군통', '국민정부의 정보·보안·공작망을 지휘했습니다.', 'personnel', [88, 90, 84, 94, 31], 'displaced'),
    ],
    staff: [
      person('china', 'he-yingqin', '허잉친', '군사위원회 참모총장', '국민혁명군', '국민정부군의 참모·동원 업무를 총괄했습니다.', 'operations', [87, 89, 78, 92, 67], 'poachable', commander('상장', 87, 83, 88, 84, '중앙군 조정', '참모 · 동원')),
      person('china', 'bai-chongxi', '바이충시', '군사위원회 부참모총장', '국민혁명군', '광서계 기반을 가진 전략가로 작전 자문에 참여했습니다.', 'logistics', [91, 94, 61, 91, 62], 'poachable', commander('상장', 92, 91, 89, 88, '소제갈', '기동전 · 참모')),
      person('china', 'tv-soong', '쑹쯔원', '외교부장', '국민정부', '미국 원조·재정·외교 교섭에 핵심 역할을 했습니다.', 'armaments', [90, 92, 74, 93, 76], 'poachable'),
      person('china', 'chen-cheng', '천청', '제6전구 사령장관', '국민혁명군', '중앙군 인사와 전구 지휘에 강한 영향력을 가졌습니다.', 'personnel', [88, 93, 82, 91, 73], 'poachable', commander('상장', 89, 88, 90, 85, '중앙군 핵심', '훈련 · 방어')),
      person('china', 'soong-meiling', '쑹메이링', '항공위원회 사무총장 겸 대외 특사', '국민정부', '항공 원조와 국제 여론전을 연결했습니다.', 'political', [89, 92, 88, 95, 79], 'poachable'),
    ],
    market: [
      person('china', 'li-zongren', '리쭝런', '제5전구 사령장관', '국민혁명군', '광서계의 독자 기반과 대규모 전투 경험을 보유했습니다.', 'operations', [90, 93, 58, 92, 55], 'poachable', commander('상장', 91, 90, 92, 84, '지방군 연합', '전구 방어 · 연합')),
      person('china', 'stilwell', '조지프 스틸웰', '중국전구 연합군 참모장', '미군 중국전구', '미국 원조와 중국군 훈련·버마 작전을 연결했습니다.', 'logistics', [88, 92, 47, 89, 49], 'poachable', commander('중장', 88, 87, 85, 94, '엄격한 훈련', '버마 · 군수')),
      person('china', 'chennault', '클레어 셰놀트', '중국항공특임대 및 제14공군 지휘관', '중미 항공조직', '중국 방공과 항공 원조의 상징적 인물입니다.', 'armaments', [89, 94, 76, 91, 78], 'available'),
      person('china', 'sun-liren', '쑨리런', '신38사단장', '국민혁명군', '버마 전역에서 현대식 훈련과 지휘 능력을 보였습니다.', 'personnel', [88, 98, 83, 80, 86], 'available', commander('소장', 89, 91, 88, 87, '현대식 훈련', '정글전 · 부대 육성')),
      person('china', 'wei-lihuang', '웨이리황', '중국원정군 지휘관', '국민혁명군', '중앙군과 지방군을 아우른 전구 지휘 경험을 가졌습니다.', 'political', [87, 92, 69, 87, 71], 'available', commander('상장', 88, 87, 89, 86, '전구 조정', '연합 · 원정군')),
    ],
  },
  india: {
    roleHolders: [
      person('india', 'linlithgow', '린리스고 후작', '인도 총독 겸 부왕', '인도 총독부', '영국령 인도의 전시 행정과 비상권을 장악했습니다.', 'political', [82, 82, 78, 96, 16], 'displaced'),
      person('india', 'wavell', '아치볼드 웨이벌', '인도군 총사령관', '인도 육군사령부', '버마 패전 뒤 인도 방어와 재편을 책임졌습니다.', 'operations', [91, 94, 84, 92, 47], 'displaced', commander('대장', 92, 86, 94, 91, '전략적 절제', '전구 방어 · 재편')),
      person('india', 'norman-smith', '노먼 스미스', '인도 정보국장', '인도 정보국', '전시 방첩과 정치정보 수집을 지휘했습니다.', 'personnel', [83, 86, 77, 85, 36], 'displaced'),
    ],
    staff: [
      person('india', 'noel-irwin', '노엘 어윈', '인도 동부군 사령관', '영국령 인도군', '벵골·아삼 방어와 버마 반격 준비를 담당했습니다.', 'operations', [82, 86, 76, 83, 69], 'poachable', commander('중장', 83, 82, 85, 81, '동부 방어', '인도 동부 · 정글')),
      person('india', 'slim', '윌리엄 슬림', '버마 군단장', '영국령 인도군', '버마 철수전에서 부대 보존과 재편을 지휘했습니다.', 'logistics', [87, 98, 86, 86, 81], 'poachable', commander('중장', 89, 88, 90, 95, '현장 회복력', '정글전 · 군수')),
      person('india', 'ambedkar', 'B. R. 암베드카르', '총독 집행평의회 노동위원', '인도 총독 집행평의회', '1942년부터 노동·산업 정책과 사회개혁 의제를 담당했습니다.', 'armaments', [88, 96, 84, 95, 74], 'poachable'),
      person('india', 'jogendra-singh', '조겐드라 싱', '총독 집행평의회 교육·보건·토지위원', '인도 총독 집행평의회', '전시 행정과 인적 자원 정책을 담당한 인도인 위원이었습니다.', 'personnel', [84, 89, 82, 84, 77], 'poachable'),
      person('india', 'cripps', '스태퍼드 크립스', '인도 헌정 협상 특사', '영국 전쟁내각', '1942년 인도 지도자들과 전후 자치안을 협상했습니다.', 'political', [89, 91, 72, 92, 66], 'poachable'),
    ],
    market: [
      person('india', 'auchinleck', '클로드 오친렉', '전 중동군 총사령관', '영국령 인도군', '1942년 8월 중동 지휘에서 물러난 뒤 인도와 깊은 경력을 가진 장군입니다.', 'operations', [89, 93, 76, 87, 72], 'available', commander('대장', 90, 87, 91, 90, '방어적 소모전', '사막전 · 인도군')),
      person('india', 'nehru', '자와할랄 네루', '인도국민회의 지도자', '인도국민회의', '독립과 반파시즘을 함께 주장한 대중 정치 지도자입니다.', 'logistics', [86, 94, 64, 98, 28], 'opposition'),
      person('india', 'bose', '수바스 찬드라 보스', '자유인도센터 지도자', '자유인도운동', '추축국 지원을 통해 무장 독립을 추진한 망명 지도자입니다.', 'armaments', [88, 93, 72, 96, 12], 'opposition'),
      person('india', 'patel', '발라브바이 파텔', '인도국민회의 지도자', '인도국민회의', '조직 운영과 대중 동원에 강한 독립운동 지도자입니다.', 'personnel', [90, 92, 83, 96, 31], 'opposition'),
      person('india', 'jinnah', '무함마드 알리 진나', '전인도무슬림연맹 총재', '무슬림연맹', '무슬림 정치 대표권과 별도 국가 구상을 추진했습니다.', 'political', [92, 93, 78, 99, 24], 'opposition'),
    ],
  },
  freefrance: {
    roleHolders: [
      person('freefrance', 'de-gaulle', '샤를 드골', '자유 프랑스 지도자 겸 프랑스 국민위원회 의장', '프랑스 국민위원회', '망명 프랑스의 정치·군사 대표권을 구축했습니다.', 'political', [93, 96, 87, 99, 22], 'displaced'),
      person('freefrance', 'leclerc', '필리프 르클레르', '차드 자유프랑스군 사령관', '자유 프랑스군', '사하라 기동전과 페잔 원정을 이끈 지휘관입니다.', 'operations', [91, 97, 88, 91, 57], 'displaced', commander('준장', 92, 94, 87, 88, '사막 기동', '기동전 · 원정군')),
      person('freefrance', 'passy', '앙드레 드와브랭(파시)', 'BCRA 국장', 'BCRA', '자유 프랑스 정보·행동 조직을 구축하고 본토와 연결했습니다.', 'personnel', [91, 96, 83, 90, 44], 'displaced'),
    ],
    staff: [
      person('freefrance', 'koenig', '마리피에르 쾨니그', '제1자유프랑스여단장', '자유 프랑스군', '비르하케임 방어로 자유프랑스군의 전투력을 입증했습니다.', 'operations', [91, 95, 91, 92, 78], 'poachable', commander('준장', 92, 89, 96, 86, '완강한 방어', '사막전 · 방어')),
      person('freefrance', 'catroux', '조르주 카트루', '레반트 자유프랑스 고등판무관', '프랑스 국민위원회', '레반트 행정과 연합국 관계를 조정했습니다.', 'logistics', [87, 90, 86, 89, 76], 'poachable'),
      person('freefrance', 'pleven', '르네 플레뱅', '프랑스 국민위원회 위원', '프랑스 국민위원회', '식민지·경제·외교 업무를 넘나든 핵심 행정가였습니다.', 'armaments', [88, 93, 89, 90, 83], 'poachable'),
      person('freefrance', 'cassin', '르네 카생', '자유 프랑스 법률고문', '프랑스 국민위원회', '망명정부의 법적 정통성과 행정 체계를 설계했습니다.', 'personnel', [89, 95, 92, 88, 87], 'poachable'),
      person('freefrance', 'muselier', '에밀 뮈즐리에', '자유프랑스 해·공군 사령관(1942년 초까지)', '자유 프랑스군', '자유프랑스 해군과 상징 체계 구축에 기여했으나 지도부와 갈등했습니다.', 'political', [84, 88, 52, 87, 48], 'poachable', commander('중장', 84, 81, 86, 85, '해군 조직자', '해군 · 정치')),
    ],
    market: [
      person('freefrance', 'de-larminat', '에드가 드 라르미나', '자유프랑스군 사단장', '자유 프랑스군', '레반트와 북아프리카에서 지상군 지휘 경험을 쌓았습니다.', 'operations', [86, 91, 82, 84, 78], 'available', commander('소장', 87, 86, 89, 85, '원정군 지휘', '사막전 · 보병')),
      person('freefrance', 'jean-moulin', '장 물랭', '드골의 프랑스 국내 대표', '레지스탕스', '본토 저항조직 통합 임무를 수행했습니다.', 'logistics', [92, 98, 95, 96, 84], 'poachable'),
      person('freefrance', 'martial-valin', '마르시알 발랭', '자유프랑스 공군 사령관', '자유 프랑스 공군', '망명 공군의 편제와 연합국 협력을 정비했습니다.', 'armaments', [87, 93, 88, 85, 82], 'available'),
      person('freefrance', 'brossolette', '피에르 브로솔레트', 'BCRA 연락원', 'BCRA·레지스탕스', '런던과 프랑스 국내 저항세력의 정치 연락을 담당했습니다.', 'personnel', [90, 96, 91, 90, 86], 'poachable'),
      person('freefrance', 'kessel', '조제프 케셀', '자유프랑스 선전·항공 요원', '자유 프랑스', '작가·기자로서 선전과 국제 여론 형성에 참여했습니다.', 'political', [84, 92, 87, 88, 89], 'available'),
    ],
  },
  italy: {
    roleHolders: [
      person('italy', 'mussolini', '베니토 무솔리니', '정부수반 겸 두체', '파시스트 정권', '정부와 당·전쟁 정책을 독재적으로 통제했습니다.', 'political', [76, 76, 49, 99, 11], 'displaced'),
      person('italy', 'cavallero', '우고 카발레로', '최고사령부 총참모장', '이탈리아 최고사령부', '1942년 이탈리아군의 전구 조정과 독일 측 협상을 담당했습니다.', 'operations', [83, 86, 80, 91, 43], 'displaced', commander('원수', 84, 80, 85, 87, '동맹 조정', '최고사령부 · 연합')),
      person('italy', 'ame', '체사레 아메', '군사정보국(SIM) 국장', 'SIM', '이탈리아 군사정보와 방첩 활동을 지휘했습니다.', 'personnel', [87, 91, 79, 86, 41], 'displaced'),
    ],
    staff: [
      person('italy', 'ambrosio', '비토리오 암브로시오', '육군 참모총장', '이탈리아 육군', '1942년부터 왕립육군 참모총장으로 전선 운영을 담당했습니다.', 'operations', [87, 91, 77, 89, 69], 'poachable', commander('대장', 88, 85, 90, 87, '신중한 참모', '육군 전략 · 방어')),
      person('italy', 'riccardi', '아르투로 리카르디', '해군 참모총장', '이탈리아 해군', '지중해 함대 운용과 수송선 호위를 총괄했습니다.', 'logistics', [85, 88, 79, 88, 73], 'poachable', commander('제독', 85, 83, 87, 89, '지중해 함대', '호송 · 함대')),
      person('italy', 'favagrossa', '카를로 파바그로사', '전쟁생산 총감', '전쟁생산총감부', '원자재 부족 속에서 군수 생산과 조달을 조정했습니다.', 'armaments', [88, 91, 83, 84, 81], 'poachable'),
      person('italy', 'fougier', '리노 코르소 푸지에르', '공군 참모총장', '이탈리아 공군', '1941년 말부터 왕립공군의 작전·인사를 이끌었습니다.', 'personnel', [84, 89, 82, 85, 76], 'poachable'),
      person('italy', 'ciano', '갈레아초 치아노', '외무장관', '이탈리아 외무부', '추축 외교를 담당했지만 전쟁 방향에 회의가 커졌습니다.', 'political', [86, 88, 48, 92, 51], 'poachable'),
    ],
    market: [
      person('italy', 'messe', '조반니 메세', '러시아 파견군단장', '이탈리아 육군', '동부전선에서 부대 보존과 현실적 군수 판단을 강조했습니다.', 'operations', [91, 96, 88, 89, 82], 'available', commander('대장', 92, 90, 94, 91, '현장 현실주의', '원정군 · 방어')),
      person('italy', 'badoglio', '피에트로 바돌리오', '전 최고사령부 총참모장', '왕실·이탈리아 육군', '1940년 사임 뒤 공식 지휘에서 물러나 왕실 인맥을 유지했습니다.', 'logistics', [82, 84, 51, 91, 46], 'opposition', commander('원수', 82, 79, 84, 83, '왕실 인맥', '대전략 · 정치')),
      person('italy', 'roatta', '마리오 로아타', '슬로베니아 주둔 제2군 사령관', '이탈리아 육군', '1942년 발칸 점령군을 지휘한 고위 장성입니다.', 'armaments', [82, 85, 61, 86, 58], 'available'),
      person('italy', 'bottai', '주세페 보타이', '국민교육장관', '파시스트 대평의회', '정권 내부에서 제도와 문화 정책을 다루던 정치인이었습니다.', 'personnel', [84, 89, 58, 85, 63], 'poachable'),
      person('italy', 'grandi', '디노 그란디', '법무장관 겸 파시스트 대평의회 의원', '파시스트 대평의회', '왕실과 연결된 정권 내부의 독자적 정치 기반을 가졌습니다.', 'political', [88, 91, 52, 93, 56], 'opposition'),
    ],
  },
  korea: {
    roleHolders: [
      person('korea', 'kim-gu', '김구', '대한민국 임시정부 주석', '대한민국 임시정부', '충칭 임시정부와 한국광복군의 독립전쟁 노선을 이끌었습니다.', 'political', [92, 94, 88, 99, 35], 'displaced'),
      person('korea', 'ji-cheong-cheon', '지청천', '한국광복군 총사령', '한국광복군', '1940년 창설된 한국광복군의 총사령으로 중국 전구에서 군사조직을 지휘했습니다.', 'operations', [90, 94, 90, 94, 57], 'displaced', commander('총사령', 91, 86, 91, 88, '독립군 통합', '망명군 · 연합작전')),
      person('korea', 'kim-won-bong', '김원봉', '조선의용대장·광복군 부사령', '조선의용대·한국광복군', '1942년 조선의용대 본대를 광복군에 합류시키며 임시정부 계열과 연대했습니다.', 'personnel', [91, 95, 69, 96, 42], 'displaced'),
    ],
    staff: [
      person('korea', 'lee-beom-seok', '이범석', '한국광복군 참모장', '한국광복군', '광복군의 참모·훈련 체계를 맡고 연합작전 준비에 참여했습니다.', 'operations', [90, 96, 86, 91, 78], 'poachable', commander('참장', 91, 90, 87, 89, '청년장교 양성', '훈련 · 국내정진')),
      person('korea', 'kim-gyu-sik', '김규식', '대한민국 임시정부 부주석 계열 외교지도자', '대한민국 임시정부', '파리강화회의 이래 국제 승인과 독립 외교를 추진한 지도자였습니다.', 'logistics', [89, 92, 84, 96, 72], 'poachable'),
      person('korea', 'cho-so-ang', '조소앙', '대한민국 임시정부 외무부장', '대한민국 임시정부', '삼균주의를 제시하고 임시정부의 외교와 건국 구상을 담당했습니다.', 'armaments', [90, 94, 88, 93, 77], 'poachable'),
      person('korea', 'shin-ik-hui', '신익희', '대한민국 임시정부 내무부장', '대한민국 임시정부', '임시정부의 내무·행정 조직과 광복 후 국가 운영 준비에 관여했습니다.', 'personnel', [87, 91, 84, 90, 74], 'poachable'),
      person('korea', 'choi-yong-deok', '최용덕', '한국광복군 총무처장·항공인', '한국광복군', '중국 공군 경력을 바탕으로 광복군 조직과 항공전력 구상을 지원했습니다.', 'political', [85, 92, 86, 86, 82], 'poachable', commander('참장', 86, 82, 87, 90, '항공 연락', '공군 건설 · 대외협력')),
    ],
    market: [
      person('korea', 'syngman-rhee', '이승만', '대한민국 임시정부 주미외교위원부 위원장', '주미외교위원부', '워싱턴에서 연합국 승인과 대미 외교를 추진했습니다.', 'political', [87, 90, 48, 98, 31], 'opposition'),
      person('korea', 'kim-hong-il', '김홍일', '중국 국민혁명군 장성·전 광복군 참모장', '중국군·한국광복군', '중국군 장성으로 중일전쟁에 참전하고 광복군 창설기 참모업무를 맡았습니다.', 'operations', [89, 94, 83, 88, 70], 'available', commander('소장', 90, 87, 91, 90, '중국전구 경험', '정규전 · 참모')),
      person('korea', 'cho-man-sik', '조만식', '조선 국내 민족운동 지도자', '국내 민족운동', '평양을 기반으로 교육·산업 진흥과 비폭력 민족운동의 영향력을 유지했습니다.', 'logistics', [85, 89, 91, 94, 53], 'poachable'),
      person('korea', 'lyuh-woon-hyung', '여운형', '조선중앙일보 전 사장·국내 독립운동가', '국내 비밀조직 계열', '국내에서 좌우를 넘는 민족연합과 전후 건국 준비를 모색했습니다.', 'personnel', [91, 95, 75, 97, 64], 'poachable'),
      person('korea', 'kim-du-bong', '김두봉', '화북 조선독립동맹 주석', '조선독립동맹', '화북의 한인 독립운동 세력과 조선의용군 계열을 이끈 지도자였습니다.', 'armaments', [87, 92, 66, 92, 49], 'opposition'),
    ],
  },
  vietnam: {
    roleHolders: [
      person('vietnam', 'ho-chi-minh', '호찌민', '베트남 독립동맹회 지도자', '베트민', '1941년 귀국해 베트민 결성을 주도했으며 1942년 중국에서 구금되었습니다.', 'political', [94, 96, 92, 99, 30], 'displaced'),
      person('vietnam', 'vo-nguyen-giap', '보응우옌잡', '베트민 군사조직 책임자', '베트민', '북부 근거지에서 정치조직과 무장대 건설을 준비했습니다.', 'operations', [91, 99, 91, 94, 59], 'displaced', commander('군사책임자', 92, 91, 88, 85, '정치군사 결합', '유격전 · 조직화')),
      person('vietnam', 'pham-van-dong', '팜반동', '베트민 간부·대외연락 지도자', '베트민', '호찌민과 함께 중국 남부와 베트남 북부의 혁명 연락에 참여했습니다.', 'personnel', [88, 96, 90, 92, 62], 'displaced'),
    ],
    staff: [
      person('vietnam', 'chu-van-tan', '쭈반떤', '베트남 구국군 지휘관', '베트남 구국군', '박선·보냐이 지역의 초기 항일 무장세력을 지휘했습니다.', 'operations', [86, 94, 91, 86, 79], 'poachable', commander('지휘관', 87, 86, 90, 82, '산악 근거지', '유격전 · 방어')),
      person('vietnam', 'nguyen-luong-bang', '응우옌르엉방', '베트민 재정·조직 간부', '베트민', '비밀조직과 재정·연락 업무를 맡은 장기 활동가였습니다.', 'logistics', [87, 94, 93, 88, 80], 'poachable'),
      person('vietnam', 'truong-chinh', '쯔엉찐', '인도차이나공산당 총비서', '인도차이나공산당', '1941년부터 당 조직과 항일 민족전선의 정치노선을 지도했습니다.', 'armaments', [90, 96, 83, 95, 68], 'poachable'),
      person('vietnam', 'hoang-quoc-viet', '호앙꾸옥비엣', '베트민 중앙 간부', '베트민', '노동·대중조직과 북부 비밀망을 연결했습니다.', 'personnel', [86, 93, 89, 87, 81], 'poachable'),
      person('vietnam', 'nguyen-khang', '응우옌캉', '북부 비밀조직 간부', '인도차이나공산당·베트민', '북부 도시와 지방의 비밀조직 활동을 이어가며 이후 하노이 봉기 지도부에 참여했습니다.', 'political', [83, 91, 88, 84, 78], 'poachable'),
    ],
    market: [
      person('vietnam', 'hoang-van-thu', '호앙반투', '인도차이나공산당 상무위원', '인도차이나공산당', '북부 당 조직과 항일운동을 지도하다 1943년 체포되었습니다.', 'operations', [88, 94, 91, 89, 74], 'available'),
      person('vietnam', 'nguyen-binh', '응우옌빈', '민족주의 계열 활동가', '독립운동 세력', '이후 남부 항전 지휘관이 되는 인물로 1942년에는 비밀 활동 경력을 쌓고 있었습니다.', 'logistics', [84, 96, 72, 83, 70], 'available', commander('활동가', 85, 90, 78, 80, '독자 행동', '도시공작 · 남부전선')),
      person('vietnam', 'pham-ngoc-thach', '팜응옥타익', '의사·독립운동 연락자', '해외 베트남인 네트워크', '의료·대외연락 역량을 가진 독립운동 인사로 전후 외교에도 참여했습니다.', 'armaments', [82, 91, 84, 82, 73], 'poachable'),
      person('vietnam', 'ton-duc-thang', '똔득탕', '꼰다오 수감 독립운동가', '노동·독립운동', '1942년 식민당국에 수감 중이었으며 노동운동의 상징적 영향력을 지녔습니다.', 'personnel', [84, 92, 95, 88, 38], 'opposition'),
      person('vietnam', 'huynh-thuc-khang', '후인툭캉', '민족주의 언론인·전 정치범', '중부 민족운동', '중부 베트남에서 높은 도덕적 권위를 지닌 비공산 민족주의 지도자였습니다.', 'political', [86, 88, 94, 91, 47], 'poachable'),
    ],
  },
  indonesia: {
    roleHolders: [
      person('indonesia', 'sukarno', '수카르노', '인도네시아 민족운동 지도자', '민족주의 운동', '1942년 자바로 돌아와 점령기 대중정치의 중심 인물이 되었습니다.', 'political', [92, 94, 75, 99, 34], 'displaced'),
      person('indonesia', 'mohammad-hatta', '모하맛 하타', '인도네시아 민족운동 지도자', '민족주의 운동', '전간기 독립운동과 협동조합 운동을 이끌고 수카르노와 함께 정치공간을 활용했습니다.', 'operations', [91, 94, 84, 97, 39], 'displaced'),
      person('indonesia', 'sutan-sjahrir', '수탄 샤리르', '반일 지하운동 지도자', '지하 저항조직', '일본과의 협력을 거부하고 청년·사회주의 계열의 지하 연락망을 조직했습니다.', 'personnel', [93, 97, 88, 96, 61], 'displaced'),
    ],
    staff: [
      person('indonesia', 'gatot-mangkupraja', '가톳 망쿠프라자', '민족주의 활동가·후일 PETA 창설 제안자', '민족주의 운동', '1943년 PETA 창설을 제안하게 되는 민족주의 활동가였습니다.', 'operations', [82, 91, 79, 84, 76], 'poachable', commander('조직가', 82, 83, 78, 81, '현지군 창설', '동원 · 훈련')),
      person('indonesia', 'achmad-soebardjo', '아흐맛 수바르조', '민족주의 외교 활동가', '민족주의 운동', '전간기 해외 독립운동과 일본 접촉 경력을 가진 외교·연락 인사였습니다.', 'logistics', [87, 92, 80, 90, 72], 'poachable'),
      person('indonesia', 'ki-hajar-dewantara', '키 하자르 데완타라', '타만시스와 교육운동 지도자', '민족교육 운동', '민족교육망과 대중조직을 통해 독립의 사회적 기반을 넓혔습니다.', 'armaments', [88, 92, 94, 93, 76], 'poachable'),
      person('indonesia', 'mas-mansur', '키아이 하지 마스 만수르', '무함마디야 지도자', '이슬람 민족운동', '종교·교육 조직을 통해 대중 동원과 민족운동에 영향력을 가졌습니다.', 'personnel', [85, 90, 91, 91, 73], 'poachable'),
      person('indonesia', 'amir-sjarifuddin', '아미르 샤리푸딘', '반일 지하조직 지도자', '지하 저항조직', '네덜란드 측 자금 지원을 받은 반일 지하조직을 운영하다 1943년 체포되었습니다.', 'political', [90, 95, 75, 91, 67], 'poachable'),
    ],
    market: [
      person('indonesia', 'tan-malaka', '탄 말라카', '해외 망명 독립운동가', '급진 민족주의 운동', '동남아를 오가며 식민지 독립과 범아시아 혁명 노선을 주장했습니다.', 'political', [91, 96, 57, 95, 44], 'opposition'),
      person('indonesia', 'iwa-kusumasumantri', '이와 쿠수마수만트리', '민족주의 법률가·전 망명자', '민족주의 운동', '노동·민족운동 경력과 해외 네트워크를 가진 법률가였습니다.', 'logistics', [84, 91, 76, 86, 66], 'available'),
      person('indonesia', 'a-h-nasution', '압둘 하리스 나수티온', '전 KNIL 장교', '전 네덜란드령 동인도군', '1942년 네덜란드령 동인도군 장교 경력을 가진 젊은 군인이었습니다.', 'operations', [84, 99, 78, 82, 82], 'available', commander('중위', 84, 86, 83, 80, '기동전 학습', '게릴라 · 참모')),
      person('indonesia', 'sudirman', '수디르만', '무함마디야 교사', '민족교육 운동', '1942년에는 교사였고 이후 PETA 장교와 독립전쟁 총사령관으로 성장합니다.', 'personnel', [80, 99, 94, 87, 88], 'available', commander('민간인', 81, 83, 88, 78, '잠재적 국민군 지도자', '대중동원 · 유격전')),
      person('indonesia', 'supriyadi', '수프리야디', '청년 활동가·후일 PETA 장교', '청년 민족운동', '이후 PETA 장교가 되어 1945년 블리타르 봉기를 이끄는 청년 인사였습니다.', 'armaments', [78, 96, 90, 78, 86], 'available'),
    ],
  },
  philippines: {
    roleHolders: [
      person('philippines', 'manuel-quezon', '마누엘 케손', '필리핀 자치정부 대통령', '필리핀 자치정부', '1942년 미국으로 이동한 망명 자치정부를 이끌었습니다.', 'political', [90, 90, 86, 99, 25], 'displaced'),
      person('philippines', 'basilio-valdes', '바실리오 발데스', '필리핀군 참모총장 겸 국방장관', '필리핀 자치정부·필리핀군', '망명정부에서 국방과 군 조직을 담당한 의사 출신 장교였습니다.', 'operations', [87, 91, 91, 91, 58], 'displaced', commander('소장', 88, 82, 91, 89, '정부·군 연결', '국방행정 · 참모')),
      person('philippines', 'jesus-villamor', '헤수스 비야모르', '필리핀 육군항공대 장교·정보 연락원', '필리핀군·연합 정보망', '전투조종사로 싸운 뒤 잠수함을 통한 정보·게릴라 연락 임무에 참여했습니다.', 'personnel', [90, 97, 92, 88, 82], 'displaced'),
    ],
    staff: [
      person('philippines', 'vicente-lim', '비센테 림', '필리핀군 장성·저항조직가', '필리핀군·저항군', '바탄 전투 뒤 지하 저항조직 건설에 참여했습니다.', 'operations', [89, 96, 94, 91, 78], 'poachable', commander('준장', 90, 87, 93, 85, '비밀군 조직', '루손 방어 · 지하전')),
      person('philippines', 'wendell-fertig', '웬들 퍼티그', '미 육군 공병장교·민다나오 게릴라 지도자', '미군·필리핀 저항군', '1942년 민다나오에서 대규모 게릴라 조직을 구축하기 시작했습니다.', 'logistics', [91, 96, 85, 88, 81], 'poachable', commander('대령 자칭', 91, 87, 89, 96, '고립지 군수조직', '민다나오 · 게릴라')),
      person('philippines', 'carlos-romulo', '카를로스 P. 로물로', '망명정부 정보홍보 책임자', '필리핀 자치정부', '언론과 외교를 통해 필리핀의 항전과 독립을 국제사회에 알렸습니다.', 'armaments', [88, 93, 87, 95, 75], 'poachable'),
      person('philippines', 'sergio-osmena', '세르히오 오스메냐', '필리핀 자치정부 부통령', '필리핀 자치정부', '망명정부의 제도적 연속성과 의회 정치 기반을 대표했습니다.', 'personnel', [87, 89, 91, 96, 57], 'poachable'),
      person('philippines', 'edwin-ramsey', '에드윈 램지', '미군 장교·루손 게릴라 지도자', '미군·필리핀 저항군', '바탄 이후 중앙 루손에서 게릴라와 정보망 조직에 참여했습니다.', 'political', [86, 94, 89, 84, 79], 'poachable', commander('중위', 87, 88, 86, 83, '분산 연락망', '루손 · 정찰')),
    ],
    market: [
      person('philippines', 'claire-phillips', '클레어 필립스', '마닐라 비밀정보원', '필리핀 저항 정보망', '마닐라에서 Club Tsubaki를 위장 거점으로 삼아 정보와 물자를 포로·게릴라에게 전달했습니다.', 'personnel', [91, 98, 96, 86, 88], 'available'),
      person('philippines', 'ramon-magsaysay', '라몬 막사이사이', '필리핀군 장교·잠발레스 게릴라', '필리핀 저항군', '바탄 함락 뒤 잠발레스에서 게릴라 조직에 합류했습니다.', 'operations', [84, 97, 91, 86, 83], 'available', commander('대위', 85, 86, 87, 82, '지역 신뢰', '게릴라 · 민정')),
      person('philippines', 'luis-taruc', '루이스 타루크', '후크발라합 지도자', '후크발라합', '1942년 창설된 중부 루손의 항일 농민 게릴라 운동을 이끌었습니다.', 'armaments', [88, 95, 84, 92, 55], 'opposition', commander('게릴라 지휘자', 88, 89, 91, 80, '농민 기반', '중부 루손 · 유격전')),
      person('philippines', 'manuel-roxas', '마누엘 로하스', '전 필리핀군 장교·정치인', '필리핀 정치권·비밀 연락망', '점령 아래에서 복합적인 협력·저항 연락을 유지한 유력 정치인이었습니다.', 'logistics', [86, 91, 56, 94, 44], 'poachable'),
      person('philippines', 'jose-laurel', '호세 P. 라우렐', '필리핀 행정위원회 위원', '점령지 행정기구', '일본 점령하 행정에 참여했고 이후 제2공화국 대통령이 됩니다.', 'political', [83, 86, 45, 95, 21], 'opposition'),
    ],
  },
};

export const historicalSupplementalPersonnel: Record<NationId, HistoricalPerson[]> = {
  britain: [
    person('britain', 'attlee', '클레멘트 애틀리', '영국 부총리 겸 자치령부장관·추밀원 의장', '전쟁내각·노동당', '전시 연립내각의 국내 행정과 장관위원회를 조정하며 처칠 부재 시 내각을 주재했습니다.', 'political', [91, 94, 92, 96, 74], 'poachable', undefined, ['영국 정부 총리 기록', 'https://www.gov.uk/government/history/past-prime-ministers/clement-attlee']),
    person('britain', 'hugh-dalton', '휴 돌턴', '경제전쟁장관·상무원 총재', '전쟁내각·SOE 감독 계통', '경제전쟁부에서 봉쇄와 특수작전국의 정치적 감독을 맡고 1942년 상무원으로 이동했습니다.', 'political', [87, 91, 79, 88, 71], 'poachable', undefined, ['제국전쟁박물관 SOE 기록', 'https://www.iwm.org.uk/history/soe-the-secret-british-organisation-of-the-second-world-war']),
  ],
  usa: [
    person('usa', 'harriman', 'W. 애버럴 해리먼', '대통령 무기대여 특별대표', '백악관·무기대여 사절단', '런던과 모스크바를 오가며 연합국 원조와 최고위 외교 연락을 조정했습니다.', 'political', [90, 94, 86, 95, 78], 'poachable', undefined, ['미 국무부 인물 기록', 'https://history.state.gov/departmenthistory/people/harriman-w-averell']),
    person('usa', 'frank-knox', '프랭크 녹스', '미 해군장관', '미 해군부', '양대양 함대 확장, 조선·기지 건설과 해군의 전시 행정을 감독했습니다.', 'armaments', [88, 91, 85, 92, 70], 'poachable', undefined, ['미 해군 역사유산사령부', 'https://www.history.navy.mil/']),
  ],
  ussr: [
    person('ussr', 'antonov', '알렉세이 안토노프', '북캅카스·자캅카스 전선군 참모장', '붉은군', '1942년 남부 전선의 참모 업무를 맡고 연말 총참모부 작전 지도부로 발탁되었습니다.', 'operations', [93, 99, 90, 88, 86], 'available', commander('중장', 94, 90, 94, 96, '정밀한 참모', '작전계획 · 전선 조정'), ['미 육군 군사사센터 제2차대전사', 'https://history.army.mil/Publications/Publications-Catalog/Publications-by-Number/']),
    person('ussr', 'ivan-maisky', '이반 마이스키', '주영 소련 대사', '소련 외무인민위원부', '런던에서 제2전선과 군수 원조를 둘러싼 영소 고위 외교를 담당했습니다.', 'political', [90, 93, 81, 92, 75], 'poachable', undefined, ['미 국무부 1942 외교문서', 'https://history.state.gov/historicaldocuments/frus1942v03']),
  ],
  germany: [
    person('germany', 'tresckow', '헤닝 폰 트레스코', '중부집단군 작전참모', '독일 육군·군부 저항망', '1942년 중부집단군에서 작전을 담당하면서 군부 반정권 연락망을 강화했습니다.', 'operations', [91, 97, 58, 87, 52], 'opposition', commander('대령', 91, 89, 92, 88, '양심적 반대파', '집단군 참모 · 비밀조직'), ['독일 저항기념관', 'https://www.gdw-berlin.de/en/recess/biographies/index_of_persons/biographie/view-bio/henning-von-tresckow/']),
    person('germany', 'goerdeler', '카를 프리드리히 괴르델러', '전 라이프치히 시장·민간 저항 지도자', '독일 민간 저항망', '보수 민간 반대파와 군부를 연결하며 정권 교체 뒤의 정부 구상을 준비했습니다.', 'political', [89, 94, 63, 93, 39], 'opposition', undefined, ['독일 저항기념관', 'https://www.gdw-berlin.de/en/recess/topics/8-paths-leading-to-july-20-1944']),
  ],
  japan: [
    person('japan', 'kantaro-suzuki', '스즈키 간타로', '추밀원 의장', '일본 추밀원·해군 원로', '해군 대장 출신 추밀원 의장으로 황실·내각·해군 원로층 사이에 영향력을 가졌습니다.', 'political', [86, 91, 82, 92, 56], 'poachable', undefined, ['일본 국립국회도서관 근대사료', 'https://www.ndl.go.jp/modern/e/']),
    person('japan', 'mitsumasa-yonai', '요나이 미쓰마사', '예비역 해군대장·전 총리', '일본 해군 원로', '1942년에는 공직 전면에서 물러나 있었지만 해군 온건파의 상징적 인물로 남았습니다.', 'political', [88, 92, 67, 90, 48], 'opposition', undefined, ['일본 국립국회도서관 근대사료', 'https://www.ndl.go.jp/modern/e/']),
  ],
  china: [
    person('china', 'zhou-enlai', '저우언라이', '중국공산당 충칭 대표', '중국공산당·통일전선', '충칭에서 국민정부와의 협상, 국제 연락, 항일 통일전선의 정치 조정을 맡았습니다.', 'political', [94, 98, 91, 98, 61], 'opposition', undefined, ['미 육군 중국-버마-인도 전구사', 'https://history.army.mil/Publications/Publications-Catalog/Stilwells-Mission-to-China/']),
    person('china', 'zhu-de', '주더', '제18집단군 총사령', '팔로군·중국공산당', '중국 북부의 공산당 계열 항일군과 근거지 전략을 상징하는 최고 군사지도자였습니다.', 'operations', [93, 97, 92, 96, 54], 'opposition', commander('상장', 94, 90, 95, 89, '근거지 전쟁', '유격전 · 통일전선'), ['미 육군 중국-버마-인도 전구사', 'https://history.army.mil/Publications/Publications-Catalog/Stilwells-Mission-to-China/']),
  ],
  india: [
    person('india', 'gandhi', '모한다스 K. 간디', '인도국민회의 대중 지도자', '인도국민회의', '1942년 8월 영국의 즉각 철수를 요구한 뒤 체포되어 아가 칸 궁에 구금되었습니다.', 'political', [95, 95, 98, 100, 8], 'opposition', undefined, ['간디 유산 포털', 'https://www.gandhiheritageportal.org/']),
    person('india', 'abul-kalam-azad', '마울라나 아불 칼람 아자드', '인도국민회의 의장', '인도국민회의', '국민회의 의장으로 독립 협상과 공동 민족주의를 이끌다 Quit India 운동 뒤 투옥되었습니다.', 'political', [92, 95, 94, 97, 27], 'opposition', undefined, ['인도 문화부 간디 유산 포털', 'https://www.gandhiheritageportal.org/']),
  ],
  freefrance: [
    person('freefrance', 'henri-frenay', '앙리 프레네', 'Combat 운동 지도자', '프랑스 국내 레지스탕스', '남부 비점령지의 Combat 운동을 이끌며 런던과의 지원·통합 조건을 협상했습니다.', 'operations', [91, 97, 91, 92, 81], 'poachable', commander('레지스탕스 지도자', 91, 88, 93, 86, '지하조직 건설', '국내저항 · 비밀군'), ['프랑스 국방부 기억의 길', 'https://www.cheminsdememoire.gouv.fr/fr/lunification-de-la-resistance']),
    person('freefrance', 'emmanuel-dastier', '에마뉘엘 다스티에 드 라 비제리', 'Libération-Sud 운동 지도자', '프랑스 국내 레지스탕스', 'Libération-Sud를 이끌고 장 물랭의 남부 레지스탕스 통합 과정에 참여했습니다.', 'political', [89, 96, 90, 91, 84], 'poachable', undefined, ['프랑스 국방부 기억의 길', 'https://www.cheminsdememoire.gouv.fr/fr/lunification-de-la-resistance']),
  ],
  italy: [
    person('italy', 'ferruccio-parri', '페루초 파리', '정의와 자유·행동당 저항조직가', '이탈리아 반파시스트 지하망', '북부 이탈리아의 정의와 자유 계열을 조직했고 1942년 행동당 결성에 참여했습니다.', 'operations', [91, 97, 94, 91, 78], 'opposition', commander('지하조직가', 91, 88, 94, 85, '반파시스트 연합', '북부저항 · 정치군사 조정'), ['이탈리아 파르티잔협회', 'https://www.anpi.it/biografia/ferruccio-parri']),
    person('italy', 'de-gasperi', '알치데 데 가스페리', '바티칸 도서관 직원·기독교민주 지하정치가', '가톨릭 반파시스트 네트워크', '바티칸의 보호 아래 옛 인민당 인맥을 유지하며 전후 기독교민주 정치의 기반을 준비했습니다.', 'political', [92, 96, 90, 95, 51], 'opposition', undefined, ['알치데 데 가스페리 재단', 'https://www.fondazionedegasperi.org/']),
  ],
  korea: [
    person('korea', 'park-chan-ik', '박찬익', '대한민국 임시정부 국무위원·대중 외교인', '대한민국 임시정부', '중국 정부와의 외교 연락과 임시정부의 재정·교민 업무에 오랫동안 참여했습니다.', 'political', [88, 93, 90, 91, 76], 'poachable', undefined, ['국사편찬위원회 한국사데이터베이스', 'https://db.history.go.kr/']),
    person('korea', 'park-cha-jeong', '박차정', '조선의용대 여성대원·독립운동가', '조선의용대', '중국 관내의 항일 선전·여성 조직과 무장투쟁에 참여했으며 전상 후유증 속에서도 활동을 이어갔습니다.', 'personnel', [87, 95, 96, 88, 82], 'available', undefined, ['국사편찬위원회 한국사데이터베이스', 'https://db.history.go.kr/']),
  ],
  vietnam: [
    person('vietnam', 'le-duan', '레주언', '꼰다오 수감 혁명가', '인도차이나공산당', '남부 조직 활동 뒤 1940년 체포되어 1942년에는 꼰다오 감옥에 수감되어 있었습니다.', 'political', [88, 97, 91, 92, 22], 'opposition', undefined, ['호찌민 박물관', 'https://baotanghochiminh.vn/']),
    person('vietnam', 'hoang-van-hoan', '호앙반호안', '중국 남부 베트민 해외연락 간부', '베트민', '중국 남부의 베트남 혁명가 네트워크에서 국제·교민 연락과 조직 업무를 수행했습니다.', 'personnel', [86, 94, 84, 87, 79], 'poachable', undefined, ['호찌민 박물관', 'https://baotanghochiminh.vn/']),
  ],
  indonesia: [
    person('indonesia', 'mohammad-natsir', '모하맛 나시르', '반둥 이슬람 교육·정치 지도자', '페르시스·이슬람 민족운동', '교육과 출판을 통해 이슬람 개혁과 인도네시아 민족주의의 정치 기반을 넓혔습니다.', 'political', [88, 95, 91, 93, 69], 'poachable', undefined, ['인도네시아 국가기록원', 'https://anri.go.id/']),
    person('indonesia', 'wikana', '위카나', '청년 민족주의·지하운동 활동가', '청년 지하조직', '점령기 청년·좌파 지하망에서 활동하며 이후 독립선언을 압박하는 급진 청년층의 핵심이 됩니다.', 'personnel', [84, 97, 87, 86, 86], 'available', undefined, ['인도네시아 국가기록원', 'https://anri.go.id/']),
  ],
  philippines: [
    person('philippines', 'tomas-confesor', '토마스 콘페소르', '파나이 자유민정 지도자·게릴라 협력자', '필리핀 자치정부·파나이 저항군', '파나이 내륙에서 점령에 굴복하지 않은 민정 체계와 게릴라 지원망을 유지했습니다.', 'political', [90, 96, 95, 93, 82], 'poachable', undefined, ['필리핀 국가역사위원회', 'https://nhcp.gov.ph/']),
    person('philippines', 'nieves-fernandez', '니에베스 페르난데스', '타클로반 교사·게릴라 지도자', '필리핀 저항군', '교사 출신으로 레이테에서 소규모 게릴라대를 조직해 점령군과 맞섰습니다.', 'operations', [86, 98, 97, 86, 89], 'available', commander('게릴라 지휘자', 87, 90, 91, 79, '민간 저항조직', '레이테 · 매복전'), ['필리핀 국가역사위원회', 'https://nhcp.gov.ph/']),
  ],
};

export function getHistoricalRoleHolder(nationId: NationId, tier: 1 | 2 | 3) {
  return historicalPersonnel[nationId].roleHolders[tier - 1];
}

export function getHistoricalPerson(personId: string) {
  return Object.entries(historicalPersonnel)
    .flatMap(([nationId, roster]) => [...roster.roleHolders, ...roster.staff, ...roster.market, ...historicalSupplementalPersonnel[nationId as NationId]])
    .find((entry) => entry.id === personId);
}
