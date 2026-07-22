import type {
  BattleDecoration,
  BattleRecognitionTier,
  BattleReport,
  Commander,
  Division,
  NationId,
} from './types';

export interface HistoricalFrontFigure {
  name: string;
  role: string;
  contribution: string;
  alignment: 'allied' | 'axis' | 'resistance' | 'contested';
}

export interface FrontStandout {
  commanderId: string;
  name: string;
  battles: number;
  victories: number;
  merit: number;
  decorations: number;
  namedBattles: string[];
  deployedDivisions: string[];
  lastActionWeek: number | null;
}

export interface BattleRecognitionAssessment {
  score: number;
  eligible: boolean;
  maximumTier: BattleRecognitionTier | null;
  suggestedBattleName: string;
  reasons: string[];
}

export interface DecorationOption {
  id: string;
  name: string;
  tier: BattleRecognitionTier;
  availableYear: number;
  historicalBasis: string;
}

const f = (
  name: string,
  role: string,
  contribution: string,
  alignment: HistoricalFrontFigure['alignment'],
): HistoricalFrontFigure => ({ name, role, contribution, alignment });

/**
 * A compact historical baseline for every operational front. These people are
 * context, not a scripted outcome: live campaign performance always ranks
 * above this list once the player begins fighting on the front.
 */
export const historicalFrontFigures: Record<string, HistoricalFrontFigure[]> = {
  'british-isles': [f('휴 다우딩', '전투기사령부 총사령관', '통합 방공체계와 전투기 통제를 정립', 'allied'), f('키스 파크', '제11그룹 사령관', '런던과 남동부 방공을 지휘', 'allied')],
  'atlantic-lifeline': [f('맥스 호턴', '서부접근로 사령관', '호송선단과 대잠전 지휘를 통합', 'allied'), f('카를 되니츠', '독일 잠수함대 지휘관', '집단전술로 대서양 보급선을 압박', 'axis')],
  'channel-coast': [f('버트럼 램지', '연합 해군기획 지휘관', '해협 철수와 상륙수송 계획을 지휘', 'allied'), f('에르빈 롬멜', 'B집단군 사령관', '대서양 방벽과 해안 방어를 강화', 'axis')],
  'occupied-france': [f('장 물랭', '레지스탕스 통합대표', '분산된 저항조직의 정치·작전 통합을 추진', 'resistance'), f('샤를 드골', '자유 프랑스 지도자', '망명정부와 국내 저항의 정통성을 결합', 'allied')],
  'low-countries': [f('버나드 몽고메리', '제21집단군 사령관', '벨기에·네덜란드 진격을 지휘', 'allied'), f('구스타프아돌프 폰 장겐', '제15군 사령관', '스헬데 접근로 방어를 지휘', 'axis')],
  'reich-defense': [f('칼 슈파츠', '미 전략공군 지휘관', '독일 산업·공군력에 대한 전략폭격을 지휘', 'allied'), f('요제프 캄후버', '독일 야간전투 지휘관', '레이더 연동 야간방공망을 조직', 'axis')],
  scandinavia: [f('카를 구스타브 플레이셔', '노르웨이 제6사단장', '나르비크 지상전을 지휘', 'allied'), f('에두아르트 디틀', '독일 산악군 지휘관', '북노르웨이와 핀란드 방면을 지휘', 'axis')],
  'leningrad-karelia': [f('레오니트 고보로프', '레닌그라드 전선군 사령관', '포위 방어와 봉쇄 돌파를 지휘', 'allied'), f('칼 구스타프 만네르헤임', '핀란드군 총사령관', '카렐리야 전선의 전략을 통제', 'contested')],
  'baltic-belarus': [f('이반 체르냐홉스키', '제3벨라루스 전선군 사령관', '벨라루스와 발트 방면의 기동전을 지휘', 'allied'), f('게오르크한스 라인하르트', '중부집단군 사령관', '동프로이센 접근로 방어를 지휘', 'axis')],
  'moscow-axis': [f('게오르기 주코프', '서부전선군 사령관', '모스크바 방어와 반격을 조정', 'allied'), f('페도어 폰 보크', '중부집단군 사령관', '모스크바 공세의 주축을 지휘', 'axis')],
  'ukraine-dnieper': [f('니콜라이 바투틴', '제1우크라이나 전선군 사령관', '드네프르 도하와 키이우 공세를 지휘', 'allied'), f('에리히 폰 만슈타인', '남부집단군 사령관', '우크라이나 기동방어와 반격을 지휘', 'axis')],
  'stalingrad-don': [f('바실리 추이코프', '제62군 사령관', '스탈린그라드 시가전 방어를 지휘', 'allied'), f('프리드리히 파울루스', '제6군 사령관', '볼가 접근 공세와 포위군을 지휘', 'axis')],
  'caucasus-oil': [f('이반 튤레네프', '자캅카스 전선군 사령관', '산악 통로와 유전지대 방어를 조정', 'allied'), f('에발트 폰 클라이스트', 'A집단군 사령관', '캅카스 유전지대 공세를 지휘', 'axis')],
  'central-europe': [f('이반 코네프', '제1우크라이나 전선군 사령관', '중부유럽 돌파와 프라하 방면 진격을 지휘', 'allied'), f('페르디난트 쇠르너', '중앙집단군 사령관', '보헤미아 방면 최종 방어를 지휘', 'axis')],
  'balkan-partisan': [f('요시프 브로즈 티토', '유고슬라비아 파르티잔 최고사령관', '다민족 유격군과 해방지역을 조직', 'resistance'), f('드라자 미하일로비치', '체트니크 지도자', '왕당파 저항망을 지휘', 'contested')],
  'italian-peninsula': [f('마크 클라크', '미 제5군 사령관', '살레르노에서 로마까지의 진격을 지휘', 'allied'), f('알베르트 케셀링', '남서부전구 사령관', '이탈리아 종심방어선을 운용', 'axis')],
  'western-mediterranean': [f('드와이트 아이젠하워', '연합군 원정군 총사령관', '횃불작전의 연합 지휘를 조정', 'allied'), f('프랑수아 다를랑', '비시 프랑스군 최고지휘관', '북아프리카 프랑스군의 전환에 관여', 'contested')],
  'tunisia-front': [f('해럴드 알렉산더', '제18집단군 사령관', '튀니지 연합군 공세를 통합', 'allied'), f('한스위르겐 폰 아르님', '제5기갑군 사령관', '튀니지 교두보 방어를 지휘', 'axis')],
  'western-desert': [f('버나드 몽고메리', '영 제8군 사령관', '엘알라메인 이후 서진을 지휘', 'allied'), f('에르빈 롬멜', '아프리카기갑군 사령관', '리비아·이집트 기동전을 지휘', 'axis')],
  'egypt-suez': [f('클로드 오킨렉', '중동군 총사령관', '이집트 방어와 제8군 재편을 지휘', 'allied'), f('버나드 몽고메리', '영 제8군 사령관', '엘알라메인 방어·반격을 지휘', 'allied')],
  'middle-east-corridor': [f('에드워드 퀴넌', '이라크·페르시아군 사령관', '중동 수송로와 유전 방어를 조정', 'allied'), f('브와디스와프 안데르스', '폴란드군 사령관', '소련 이탈 병력의 중동 집결을 지휘', 'allied')],
  'arctic-supply': [f('아르세니 골롭코', '소련 북방함대 사령관', '무르만스크 항로와 호송 엄호를 지휘', 'allied'), f('존 브룸', '영국 호송선단 지휘관', '북극 호송의 근접엄호를 지휘', 'allied')],
  'cotentin-front': [f('J. 로턴 콜린스', '미 제7군단장', '셰르부르 돌파와 코탕탱 반도전을 지휘', 'allied'), f('카를빌헬름 폰 슐리벤', '셰르부르 요새사령관', '항구 방어를 지휘', 'axis')],
  'rhineland-front': [f('오마 브래들리', '미 제12집단군 사령관', '라인란트 진격을 조정', 'allied'), f('발터 모델', 'B집단군 사령관', '서부방벽과 루르 접근로 방어를 지휘', 'axis')],
  'rzhev-vyazma': [f('이반 코네프', '칼리닌 전선군 사령관', '르제프 돌출부 공세를 조정', 'allied'), f('발터 모델', '독일 제9군 사령관', '르제프 돌출부 방어를 지휘', 'axis')],
  'kursk-orel': [f('콘스탄틴 로코솝스키', '중앙전선군 사령관', '쿠르스크 북부 방어와 반격을 지휘', 'allied'), f('헤르만 호트', '제4기갑군 사령관', '쿠르스크 남부 공세를 지휘', 'axis')],
  'donbas-azov': [f('로디온 말리놉스키', '남서전선군 사령관', '돈바스 해방 공세를 지휘', 'allied'), f('에버하르트 폰 마켄젠', '독일 제1기갑군 사령관', '아조프·돈바스 방어를 지휘', 'axis')],
  'black-sea-coast': [f('필리프 옥탸브리스키', '소련 흑해함대 사령관', '세바스토폴 해상보급과 방어를 지휘', 'allied'), f('에리히 폰 만슈타인', '독일 제11군 사령관', '크림 공세를 지휘', 'axis')],
  'kuban-caucasus': [f('이반 페트로프', '북캅카스 전선군 사령관', '쿠반 교두보 축출을 지휘', 'allied'), f('리하르트 루오프', '독일 제17군 사령관', '쿠반 교두보 방어를 지휘', 'axis')],
  'adriatic-partisan': [f('요시프 브로즈 티토', '파르티잔 최고사령관', '아드리아 해안과 산악 해방전을 지휘', 'resistance'), f('알렉산더 뢰어', '남동부전구 사령관', '유고슬라비아 점령군 작전을 지휘', 'axis')],
  'sicily-calabria': [f('조지 패튼', '미 제7군 사령관', '시칠리아 서부·북부 진격을 지휘', 'allied'), f('버나드 몽고메리', '영 제8군 사령관', '시칠리아 동부 상륙과 진격을 지휘', 'allied')],
  'levant-iraq': [f('아치볼드 웨이벌', '중동군 총사령관', '이라크·시리아 위기에 병력을 배분', 'allied'), f('에드워드 퀴넌', '이라크 주둔군 사령관', '바그다드와 페르시아 회랑을 확보', 'allied')],
  'india-base': [f('아치볼드 웨이벌', '인도 총사령관', '인도 방어와 버마 반격 기반을 재편', 'allied'), f('클로드 오킨렉', '인도 총사령관', '훈련·보급·증원 체계를 확장', 'allied')],
  'imphal-kohima': [f('윌리엄 슬림', '영 제14군 사령관', '임팔·코히마 방어와 추격을 지휘', 'allied'), f('무타구치 렌야', '일본 제15군 사령관', '인도 침공작전을 지휘', 'axis')],
  'arakan-front': [f('윌리엄 슬림', '버마군단·제14군 지휘관', '아라칸 패전 뒤 군을 재건', 'allied'), f('사쿠라이 쇼조', '일본 제28군 사령관', '아라칸 해안 방어를 지휘', 'axis')],
  'north-burma': [f('조지프 스틸웰', '중미연합군 지휘관', '레도 도로와 북버마 공세를 조정', 'allied'), f('쑨리런', '중국 신38사단장', '옌안창·미치나 방면 작전을 지휘', 'allied')],
  'central-burma': [f('윌리엄 슬림', '영 제14군 사령관', '메이크틸라 기동전과 랑군 진격을 지휘', 'allied'), f('혼다 마사키', '일본 제33군 사령관', '중부 버마 방어를 지휘', 'axis')],
  'malaya-singapore': [f('아서 퍼시벌', '말라야 사령관', '싱가포르 방어를 지휘', 'allied'), f('야마시타 도모유키', '일본 제25군 사령관', '말라야 종단공세를 지휘', 'axis')],
  'north-china': [f('주더', '팔로군 총사령관', '화북 항일근거지와 유격전을 지휘', 'resistance'), f('오카무라 야스지', '북지나방면군 사령관', '화북 점령작전을 지휘', 'axis')],
  'central-china': [f('쉐웨', '중국 제9전구 사령장관', '창사 방어전을 지휘', 'allied'), f('하타 슌로쿠', '중지나파견군 사령관', '양쯔강 축선 작전을 지휘', 'axis')],
  'south-china': [f('장파쿠이', '중국 제4전구 사령장관', '광둥·광시 방어를 지휘', 'allied'), f('다나카 히사카즈', '일본 제23군 사령관', '광둥 점령지역 작전을 지휘', 'axis')],
  'chongqing-yunnan': [f('웨이리황', '중국원정군 사령관', '윈난과 버마 연계 작전을 지휘', 'allied'), f('클레어 셰놀트', '중국 공군 미국인 지휘관', '충칭 방공과 공중보급을 조직', 'allied')],
  'indochina-front': [f('호찌민', '베트민 지도자', '광범위한 독립전선과 연락망을 조직', 'resistance'), f('보응우옌잡', '베트민 군사지도자', '무장선전대와 북부 근거지를 구축', 'resistance')],
  'manchuria-korea': [f('지청천', '한국광복군 총사령관', '연합작전과 국내진공 계획을 지휘', 'resistance'), f('야마다 오토조', '관동군 총사령관', '만주국과 조선 북방군을 통제', 'axis')],
  'japan-home': [f('커티스 르메이', '미 제21폭격기사령부 지휘관', '일본 본토 항공공세를 지휘', 'allied'), f('아나미 고레치카', '일본 육군대신', '본토결전 준비와 군정 결정을 주도', 'axis')],
  philippines: [f('더글러스 맥아더', '미 극동군 사령관', '필리핀 방어와 탈환을 지휘', 'allied'), f('혼마 마사하루', '일본 제14군 사령관', '루손 침공과 바탄 공세를 지휘', 'axis')],
  'east-indies': [f('헤인 테르 포르턴', '네덜란드령 동인도군 사령관', 'ABDA 지상군 방어를 조정', 'allied'), f('이마무라 히토시', '일본 제16군 사령관', '자바와 수마트라 점령을 지휘', 'axis')],
  papua: [f('시드니 로웰', '뉴기니군 지휘관', '코코다 보급·증원과 방어를 조정', 'allied'), f('호리이 도미타로', '일본 남해지대 사령관', '코코다 산악공세를 지휘', 'axis')],
  'new-guinea': [f('조지 케니', '연합 공군 사령관', '항공차단과 비행장 전진을 지휘', 'allied'), f('아다치 하타조', '일본 제18군 사령관', '뉴기니 북안 방어를 지휘', 'axis')],
  solomons: [f('알렉산더 밴더그리프트', '미 제1해병사단장', '과달카날 상륙과 방어를 지휘', 'allied'), f('햐쿠타케 하루키치', '일본 제17군 사령관', '과달카날 탈환작전을 지휘', 'axis')],
  'central-pacific': [f('체스터 니미츠', '미 태평양함대 사령관', '중부태평양 공세전략을 지휘', 'allied'), f('레이먼드 스프루언스', '미 제5함대 사령관', '마셜·마리아나 상륙을 지휘', 'allied')],
  'north-pacific': [f('토머스 킨케이드', '미 북태평양군 지휘관', '알류샨 탈환작전을 지휘', 'allied'), f('히구치 기이치로', '일본 북방군 사령관', '치시마·알류샨 방어를 통제', 'axis')],
  'southwest-pacific': [f('더글러스 맥아더', '남서태평양지역 최고사령관', '뉴기니·필리핀 축선의 도약전략을 지휘', 'allied'), f('토머스 블레이미', '연합 지상군 사령관', '호주·뉴기니 지상군을 통합 지휘', 'allied')],
  'bengal-assam': [f('오드 윙게이트', '친디트 지휘관', '장거리 침투부대를 운용', 'allied'), f('윌리엄 슬림', '영 제14군 사령관', '아삼 병참과 인도 동부 방어를 재건', 'allied')],
  'irrawaddy-front': [f('윌리엄 슬림', '영 제14군 사령관', '이라와디 도하와 메이크틸라 포위를 지휘', 'allied'), f('기무라 헤이타로', '일본 버마방면군 사령관', '이라와디 방어와 철수를 지휘', 'axis')],
  'thailand-malaya': [f('쁠랙 피분송크람', '태국 총리·원수', '태국의 동맹과 말라야 통로 제공을 결정', 'contested'), f('야마시타 도모유키', '일본 제25군 사령관', '태국·말라야 종단 진격을 지휘', 'axis')],
  'yellow-river': [f('탕언보', '중국 제1전구 지휘관', '중원 방어와 황허 축선 작전을 지휘', 'allied'), f('오카무라 야스지', '일본 북지나방면군 사령관', '철도·거점 토벌작전을 지휘', 'axis')],
  'wuhan-nanchang': [f('쉐웨', '중국 제9전구 사령장관', '후난·장시 방어전을 조정', 'allied'), f('오카무라 야스지', '일본 제11군 사령관', '우한·난창 축선 공세를 지휘', 'axis')],
  'south-manchuria-korea': [f('지청천', '한국광복군 총사령관', '만주 연락망과 국내진공 구상을 지휘', 'resistance'), f('야마다 오토조', '관동군 총사령관', '남만주 철도축과 조선 주둔군을 통제', 'axis')],
  'home-islands-industry': [f('커티스 르메이', '미 제21폭격기사령부 지휘관', '일본 공업도시 항공공세를 지휘', 'allied'), f('고이소 구니아키', '일본 총리', '군수동원과 본토방위 정책을 통괄', 'axis')],
  'luzon-front': [f('더글러스 맥아더', '남서태평양지역 최고사령관', '링가옌 상륙과 마닐라 진격을 지휘', 'allied'), f('야마시타 도모유키', '일본 제14방면군 사령관', '루손 산악지대 지연전을 지휘', 'axis')],
  'visayas-mindanao': [f('루페르토 캉글레온', '레이테 게릴라 지도자', '비사야 정보·저항망을 조직', 'resistance'), f('웬델 퍼티그', '민다나오 게릴라 지도자', '대규모 게릴라 행정·정보망을 지휘', 'resistance')],
  'bismarck-archipelago': [f('조지 케니', '연합 공군 사령관', '라바울 항공고립을 지휘', 'allied'), f('이마무라 히토시', '일본 제8방면군 사령관', '라바울과 비스마르크 방어를 지휘', 'axis')],
  'eastern-mandates': [f('레이먼드 스프루언스', '미 제5함대 사령관', '콰잘레인·에니웨톡 상륙을 지휘', 'allied'), f('고가 미네이치', '일본 연합함대 사령장관', '중부태평양 방어계획을 통괄', 'axis')],
  'gilbert-islands': [f('줄리언 스미스', '미 제2해병사단장', '타라와 상륙작전을 지휘', 'allied'), f('시바자키 게이지', '베티오 수비대 사령관', '타라와 요새 방어를 지휘', 'axis')],
  'aleutian-chain': [f('토머스 킨케이드', '미 북태평양군 지휘관', '애투·키스카 탈환을 지휘', 'allied'), f('야마사키 야스요', '애투 수비대 사령관', '애투 최종방어를 지휘', 'axis')],
};

const decorationProfiles: Record<NationId, DecorationOption[]> = {
  britain: [
    { id: 'uk-mid', name: '전보 게재 표창', tier: 'citation', availableYear: 1939, historicalBasis: 'Mention in Despatches · 작전 중 용맹 공적' },
    { id: 'uk-mc', name: '밀리터리 크로스', tier: 'distinguished', availableYear: 1939, historicalBasis: 'Military Cross · 지상작전 모범적 용맹' },
    { id: 'uk-dso', name: '수훈장', tier: 'supreme', availableYear: 1939, historicalBasis: 'Distinguished Service Order · 성공적인 전투 지휘' },
  ],
  usa: [
    { id: 'us-ss', name: '은성훈장', tier: 'citation', availableYear: 1932, historicalBasis: 'Silver Star · 전투 중 용맹' },
    { id: 'us-dsc', name: '육군수훈십자장', tier: 'distinguished', availableYear: 1918, historicalBasis: 'Distinguished Service Cross · 비범한 영웅적 행동' },
    { id: 'us-moh', name: '명예훈장', tier: 'supreme', availableYear: 1862, historicalBasis: 'Medal of Honor · 최고 수준의 전투 공적' },
  ],
  ussr: [
    { id: 'su-red-star', name: '적성훈장', tier: 'citation', availableYear: 1930, historicalBasis: 'Орден Красной Звезды · 국방 공적' },
    { id: 'su-patriotic', name: '조국전쟁훈장', tier: 'distinguished', availableYear: 1942, historicalBasis: 'Орден Отечественной войны · 전시 전공' },
    { id: 'su-suvorov', name: '수보로프 훈장', tier: 'supreme', availableYear: 1942, historicalBasis: 'Орден Суворова · 탁월한 작전 지휘' },
  ],
  germany: [
    { id: 'de-ek2', name: '2급 철십자장', tier: 'citation', availableYear: 1939, historicalBasis: 'Eisernes Kreuz II. Klasse · 전투 공적' },
    { id: 'de-ek1', name: '1급 철십자장', tier: 'distinguished', availableYear: 1939, historicalBasis: 'Eisernes Kreuz I. Klasse · 반복된 전공' },
    { id: 'de-rk', name: '기사철십자장', tier: 'supreme', availableYear: 1939, historicalBasis: 'Ritterkreuz des Eisernen Kreuzes · 탁월한 군사 지휘' },
  ],
  japan: [
    { id: 'jp-gk6', name: '금치훈장 6등', tier: 'citation', availableYear: 1890, historicalBasis: '금치훈장 · 군사 공적' },
    { id: 'jp-gk4', name: '금치훈장 4등', tier: 'distinguished', availableYear: 1890, historicalBasis: '금치훈장 · 현저한 지휘 공적' },
    { id: 'jp-gk2', name: '금치훈장 2등', tier: 'supreme', availableYear: 1890, historicalBasis: '금치훈장 · 최고 지휘부 전공' },
  ],
  china: [
    { id: 'cn-cloud-banner', name: '운휘훈장', tier: 'citation', availableYear: 1935, historicalBasis: '雲麾勳章 · 군사 공훈' },
    { id: 'cn-precious-tripod', name: '보정훈장', tier: 'distinguished', availableYear: 1929, historicalBasis: '寶鼎勳章 · 국가 방위 공훈' },
    { id: 'cn-blue-sky', name: '청천백일훈장', tier: 'supreme', availableYear: 1929, historicalBasis: '青天白日勳章 · 국가안전에 중대한 전공' },
  ],
  india: [
    { id: 'in-mid', name: '전보 게재 표창', tier: 'citation', availableYear: 1939, historicalBasis: '영국령 인도군 Mention in Despatches' },
    { id: 'in-idsm', name: '인도 수훈장', tier: 'distinguished', availableYear: 1907, historicalBasis: 'Indian Distinguished Service Medal · 전투 공적' },
    { id: 'in-dso', name: '수훈장', tier: 'supreme', availableYear: 1939, historicalBasis: 'Distinguished Service Order · 성공적인 전투 지휘' },
  ],
  freefrance: [
    { id: 'fr-cdg', name: '1939–1945 전쟁십자장', tier: 'citation', availableYear: 1939, historicalBasis: 'Croix de guerre 1939–1945 · 전투 표창' },
    { id: 'fr-liberation', name: '해방훈장', tier: 'distinguished', availableYear: 1940, historicalBasis: 'Ordre de la Libération · 프랑스 해방 공적' },
    { id: 'fr-legion', name: '레지옹 도뇌르', tier: 'supreme', availableYear: 1802, historicalBasis: 'Légion d’honneur · 탁월한 군사 공적' },
  ],
  italy: [
    { id: 'it-bronze', name: '동 무공훈장', tier: 'citation', availableYear: 1833, historicalBasis: 'Medaglia di bronzo al valor militare' },
    { id: 'it-silver', name: '은 무공훈장', tier: 'distinguished', availableYear: 1833, historicalBasis: 'Medaglia d’argento al valor militare' },
    { id: 'it-gold', name: '금 무공훈장', tier: 'supreme', availableYear: 1833, historicalBasis: 'Medaglia d’oro al valor militare' },
  ],
  korea: [
    { id: 'kr-kla-citation', name: '광복군 총사령부 표창', tier: 'citation', availableYear: 1940, historicalBasis: '한국광복군 지휘부의 작전 공적 표창' },
    { id: 'kr-kpg-merit', name: '임시정부 군공장', tier: 'distinguished', availableYear: 1940, historicalBasis: '대한민국임시정부 명의의 대체역사 군공 포상' },
    { id: 'kr-independence', name: '독립전쟁 최고공로장', tier: 'supreme', availableYear: 1940, historicalBasis: '독립전쟁 최고지휘부가 제정하는 대체역사 훈장' },
  ],
  vietnam: [
    { id: 'vn-front-citation', name: '베트민 전선 표창', tier: 'citation', availableYear: 1941, historicalBasis: '베트민 지휘부의 항일·독립전선 공적 표창' },
    { id: 'vn-merit', name: '군공훈장', tier: 'distinguished', availableYear: 1947, historicalBasis: 'Huân chương Quân công · 독립국가 수립 뒤 군공 포상' },
    { id: 'vn-gold-star', name: '금성훈장', tier: 'supreme', availableYear: 1947, historicalBasis: '독립국가의 최고 공로훈장으로 발전하는 대체역사 제도' },
  ],
  indonesia: [
    { id: 'id-front-citation', name: '독립전선 표창', tier: 'citation', availableYear: 1942, historicalBasis: '점령기 독립조직의 전선 공적 표창' },
    { id: 'id-gerilya', name: '게릴라 별 훈장', tier: 'distinguished', availableYear: 1949, historicalBasis: 'Bintang Gerilya · 독립전쟁 공적' },
    { id: 'id-mahaputera', name: '마하푸트라 훈장', tier: 'supreme', availableYear: 1959, historicalBasis: '독립국가의 최고급 공로훈장' },
  ],
  philippines: [
    { id: 'ph-gold-cross', name: '금십자장', tier: 'citation', availableYear: 1934, historicalBasis: 'Gold Cross Medal · 전투 공적' },
    { id: 'ph-dcs', name: '수훈성장', tier: 'distinguished', availableYear: 1939, historicalBasis: 'Distinguished Conduct Star · 비범한 전투 공적' },
    { id: 'ph-valor', name: '용맹훈장', tier: 'supreme', availableYear: 1935, historicalBasis: 'Medal of Valor · 최고 전투 공적' },
  ],
};

const tierRank: Record<BattleRecognitionTier, number> = { citation: 1, distinguished: 2, supreme: 3 };

function compactBattlePlace(targetName: string): string {
  return targetName.split('·')[0].replace(/\([^)]*\)/g, '').trim();
}

export function assessBattleRecognition(report: BattleReport): BattleRecognitionAssessment {
  const targetValue = report.targetValue ?? 5;
  const economyOfForce = Math.max(0, report.defenderStrengthLoss - report.attackerStrengthLoss);
  const score = Math.max(0, Math.min(100, Math.round(
    (report.victory ? 22 : 0)
      + Math.max(0, report.margin) * 1.8
      + targetValue * 2.5
      + economyOfForce
      + (report.victory && report.attackerStrengthLoss <= 6 ? 10 : 0),
  )));
  const eligible = report.victory && score >= 52;
  const maximumTier: BattleRecognitionTier | null = !eligible
    ? null
    : score >= 88
      ? 'supreme'
      : score >= 68
        ? 'distinguished'
        : 'citation';
  const reasons = [
    `작전 우세 ${report.margin >= 0 ? '+' : ''}${report.margin}`,
    `전략가치 ${targetValue}`,
    `교환비 ${report.defenderStrengthLoss}:${report.attackerStrengthLoss}`,
  ];
  if (report.attackerStrengthLoss <= 6) reasons.push('저손실 작전');
  return {
    score,
    eligible,
    maximumTier,
    suggestedBattleName: `${compactBattlePlace(report.targetName)} 전투`,
    reasons,
  };
}

export function getDecorationOptions(
  nationId: NationId,
  year: number,
  maximumTier: BattleRecognitionTier | null,
): DecorationOption[] {
  if (!maximumTier) return [];
  return decorationProfiles[nationId]
    .filter((option) => option.availableYear <= year && tierRank[option.tier] <= tierRank[maximumTier])
    .sort((left, right) => tierRank[left.tier] - tierRank[right.tier]);
}

export function recognizeBattle(
  report: BattleReport,
  input: { nationId: NationId; year: number; battleName?: string; decorationId?: string; citation?: string },
): BattleReport {
  const assessment = assessBattleRecognition(report);
  if (!assessment.eligible) return report;
  const battleName = (input.battleName?.trim() || assessment.suggestedBattleName).slice(0, 42);
  const option = getDecorationOptions(input.nationId, input.year, assessment.maximumTier)
    .find((candidate) => candidate.id === input.decorationId);
  const decoration: BattleDecoration | undefined = option ? {
    id: option.id,
    name: option.name,
    tier: option.tier,
    citation: (input.citation?.trim() || `${battleName}에서 탁월한 지휘로 작전 목표를 달성함.`).slice(0, 120),
    awardedWeek: report.week,
  } : report.decoration;
  return { ...report, battleName, decoration };
}

export function deriveFrontStandouts(
  frontId: string,
  reports: BattleReport[],
  commanders: Commander[],
  divisions: Division[],
  territoryIds: string[],
): FrontStandout[] {
  const territorySet = new Set(territoryIds);
  const commanderById = new Map(commanders.map((commander) => [commander.id, commander]));
  const records = new Map<string, FrontStandout>();
  const ensure = (commanderId: string, name: string) => {
    const existing = records.get(commanderId);
    if (existing) return existing;
    const created: FrontStandout = {
      commanderId,
      name,
      battles: 0,
      victories: 0,
      merit: 0,
      decorations: 0,
      namedBattles: [],
      deployedDivisions: [],
      lastActionWeek: null,
    };
    records.set(commanderId, created);
    return created;
  };

  divisions.forEach((division) => {
    if (!territorySet.has(division.territoryId)) return;
    const commander = commanderById.get(division.commanderId);
    if (!commander) return;
    const record = ensure(commander.id, commander.name);
    record.deployedDivisions.push(division.name);
    record.merit += 4;
  });

  reports.forEach((report) => {
    if (report.frontId !== frontId && !territorySet.has(report.targetId)) return;
    const commanderId = report.commanderId ?? `legacy:${report.commanderName}`;
    const record = ensure(commanderId, report.commanderName);
    record.battles += 1;
    record.victories += report.victory ? 1 : 0;
    record.merit += 6
      + (report.victory ? 16 : 0)
      + Math.max(0, report.margin)
      + Math.max(0, report.defenderStrengthLoss - report.attackerStrengthLoss)
      + (report.decoration ? tierRank[report.decoration.tier] * 12 : 0);
    record.decorations += report.decoration ? 1 : 0;
    if (report.battleName && !record.namedBattles.includes(report.battleName)) record.namedBattles.push(report.battleName);
    record.lastActionWeek = Math.max(record.lastActionWeek ?? 0, report.week);
  });

  return [...records.values()]
    .map((record) => ({
      ...record,
      merit: Math.round(record.merit),
      deployedDivisions: [...new Set(record.deployedDivisions)],
      namedBattles: [...new Set(record.namedBattles)].slice(0, 3),
    }))
    .sort((left, right) => right.merit - left.merit || right.victories - left.victories || left.name.localeCompare(right.name, 'ko'))
    .slice(0, 5);
}

export function getHistoricalFrontFigures(frontId: string): HistoricalFrontFigure[] {
  return historicalFrontFigures[frontId] ?? [];
}
