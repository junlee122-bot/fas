import type {
  EquipmentCategory,
  EquipmentDevelopmentState,
  EquipmentEra,
  EquipmentModule,
  EquipmentNode,
  EquipmentPrototype,
  EquipmentStats,
  Division,
  NationId,
} from './types';
import { createWeaponReadinessState, normalizeWeaponReadinessState } from './weaponReadiness';

export const equipmentEraOrder: EquipmentEra[] = ['historical', 'late-war', 'cold-war', 'modern', 'speculative'];

export const equipmentEraLabels: Record<EquipmentEra, string> = {
  historical: '1942 실전 장비',
  'late-war': '후기 대전',
  'cold-war': '냉전·제트 시대',
  modern: '현대 네트워크전',
  speculative: '실험·가상 기술',
};

export const equipmentCategoryLabels: Record<EquipmentCategory, string> = {
  infantry: '보병 체계',
  artillery: '화력 지원',
  armor: '기갑 차량',
  aircraft: '항공 전력',
  naval: '해군 전력',
  logistics: '군수·수송',
  systems: '감시·지휘',
  strategic: '전략 기술',
};

const clamp = (value: number) => Math.max(5, Math.min(100, Math.round(value)));
const stats = (firepower: number, mobility: number, protection: number, range: number, reliability: number, production: number): EquipmentStats => ({ firepower, mobility, protection, range, reliability, production });

function historical(
  nationId: NationId,
  key: string,
  name: string,
  category: Exclude<EquipmentCategory, 'strategic'>,
  year: number,
  summary: string,
  historicalNote: string,
  values: EquipmentStats,
  doctrineEffect: string,
  source?: [string, string],
): EquipmentNode {
  return {
    id: `${nationId}-${key}`,
    name,
    category,
    era: 'historical',
    year,
    authenticity: 'documented',
    nationIds: [nationId],
    summary,
    historicalNote,
    researchCost: 0,
    industrialCost: Math.max(20, 125 - values.production),
    doctrineEffect,
    stats: values,
    sourceLabel: source?.[0],
    sourceUrl: source?.[1],
  };
}

const US_ARMY_M1 = 'https://history.army.mil/portals/143/Images/Publications/catalog/40-6-1.pdf';
const US_ARMY_ORDNANCE = 'https://www.aschq.army.mil/About/History/Tours/RIA/Ordnance/';
const NHHC_ZERO = 'https://www.history.navy.mil/content/history/museums/nnam/explore/collections/aircraft/a/a6m2-zero0.html';
const NHHC_CARRIER = 'https://www.history.navy.mil/about-us/leadership/director/directors-corner/h-grams/h-gram-005/h-005-2.html';
const RAF_LANCASTER = 'https://cms.rafmuseum.org.uk/blog/the-lancaster-enters-the-fray/';
const RAF_MOSQUITO = 'https://www.rafmuseum.org.uk/blog/the-wooden-wonder-of-the-raf/';
const USAF_FW190 = 'https://airandspace.si.edu/collection-objects/focke-wulf-fw-190-d-9/nasm_A19600319000';

const historicalEquipment: EquipmentNode[] = [
  historical('britain', 'lee-enfield-package', 'Lee-Enfield No.4 Mk I · Bren 편제', 'infantry', 1941, '볼트액션 소총과 분대 경기관총을 결합한 영국 보병 화기 체계입니다.', 'No.4 소총 생산이 확대되던 시기였으며 No.1 Mk III*도 전군에 널리 남아 있었습니다.', stats(66, 58, 42, 48, 91, 88), '보병 지속사격과 방어 조직력 향상'),
  historical('britain', 'qf-25-pounder', 'QF 25-pounder Mk II', 'artillery', 1940, '야포와 곡사포 역할을 겸한 영국·영연방의 표준 사단포입니다.', '1942년 북아프리카와 여러 영연방 전선에서 광범위하게 운용되었습니다.', stats(73, 60, 38, 66, 92, 82), '사단 포병의 탄력적 직접·간접 화력'),
  historical('britain', 'churchill-iii', 'Churchill Mk III', 'armor', 1942, '두꺼운 장갑과 6파운더포를 갖춘 보병전차입니다.', 'Mk III는 1942년 실전 배치되어 디에프 공격 등에서 운용되었습니다.', stats(72, 43, 91, 39, 72, 50), '저속 돌파와 보병 근접지원'),
  historical('britain', 'spitfire-v', 'Supermarine Spitfire Mk V', 'aircraft', 1941, '1942년 RAF 전투기사령부의 핵심 단좌 전투기입니다.', '여러 하위 형식이 영국 본토·지중해·아시아 전구에서 사용되었습니다.', stats(79, 87, 48, 58, 82, 70), '전투기 요격과 지역 항공우세'),
  historical('britain', 'tribal-destroyer', 'Tribal급 구축함', 'naval', 1938, '강한 함포 무장을 갖춘 영국 구축함 계열입니다.', '대서양·지중해·북극 호송과 함대 작전에 투입되었습니다.', stats(74, 81, 57, 68, 75, 54), '함대 호위와 수상전'),
  historical('britain', 'bedford-ql', 'Bedford QL 3-ton 4×4', 'logistics', 1941, '영국군의 범용 3톤급 사륜구동 수송차량입니다.', '1941년부터 생산되어 병력·물자 수송과 전문차량 기반으로 쓰였습니다.', stats(19, 75, 28, 66, 84, 86), '전구 보급과 차량화'),
  historical('britain', 'chain-home', 'Chain Home · GL Mk II 레이더망', 'systems', 1938, '조기경보와 지상통제 요격을 연결한 레이더·지휘 체계입니다.', '1942년에는 방공뿐 아니라 해안·포병 레이더의 활용도 확대되고 있었습니다.', stats(28, 24, 47, 89, 79, 57), '조기경보와 공중전 정보 우세'),

  historical('usa', 'm1-garand-package', 'M1 Garand · M1918A2 BAR 편제', 'infantry', 1936, '반자동 제식소총과 분대 자동화기를 결합한 미국 보병 화기 체계입니다.', 'M1은 1942년 미 육군의 기본 소총이었으나 해병대 등에는 M1903도 남아 있었습니다.', stats(79, 61, 43, 51, 88, 84), '분대 단위 반자동 화력 우세', ['U.S. Army Center of Military History', US_ARMY_M1]),
  historical('usa', 'm2a1-105', '105 mm Howitzer M2A1', 'artillery', 1941, '미군 사단 포병의 표준 경곡사포입니다.', '차량 견인과 통신·관측 체계의 결합으로 기동 사단을 지원했습니다.', stats(76, 65, 40, 67, 91, 88), '차량화 사단 포병과 신속 화력전환', ['Rock Island Arsenal', US_ARMY_ORDNANCE]),
  historical('usa', 'm4-sherman', 'M4 Sherman 75 mm', 'armor', 1942, '대량생산·정비성·기동성을 중시한 미국 중형전차입니다.', '1942년 북아프리카에서 실전에 투입되었고 여러 생산 형식이 병행되었습니다.', stats(77, 74, 67, 58, 86, 94), '대량생산형 기동 기갑전', ['Rock Island Arsenal', US_ARMY_ORDNANCE]),
  historical('usa', 'p40-warhawk', 'Curtiss P-40E Warhawk', 'aircraft', 1941, '견고성과 저·중고도 성능을 살린 미국 전투기입니다.', '중국·북아프리카·태평양에서 미군과 연합국이 널리 운용했습니다.', stats(72, 77, 52, 61, 87, 88), '전구 범용 전투·지상지원'),
  historical('usa', 'fletcher-destroyer', 'Fletcher급 구축함', 'naval', 1942, '장거리 항해와 대공·대잠·수상전을 겸한 신형 구축함입니다.', '초도함이 1942년 취역하며 태평양 함대의 대량 건조형으로 발전했습니다.', stats(79, 83, 62, 74, 86, 90), '다목적 함대 호위와 대공 방어'),
  historical('usa', 'gmc-cckw', 'GMC CCKW 2½-ton 6×6', 'logistics', 1941, '미군 차량화 군수망의 대표적인 2.5톤 트럭입니다.', '다양한 차체와 대량생산으로 전략 수송·야전 보급에 사용되었습니다.', stats(21, 82, 30, 76, 90, 96), '대량 차량화와 장거리 보급'),
  historical('usa', 'scr-270', 'SCR-270 · SCR-584 계보', 'systems', 1940, '장거리 조기경보 레이더에서 정밀 사격통제 레이더로 이어지는 미군 전파 체계입니다.', 'SCR-270은 1942년 운용 중이었고 SCR-584는 이후 전시 개발 단계로 이어졌습니다.', stats(31, 26, 43, 87, 76, 67), '레이더 경보와 대공 사격통제'),

  historical('ussr', 'mosin-ppsh-package', 'Mosin-Nagant M91/30 · PPSh-41 편제', 'infantry', 1941, '장거리 소총과 대량생산 기관단총을 함께 운용한 붉은군 보병 화기 체계입니다.', '1942년 PPSh-41 보급이 급증하면서 근접전 분대 화력이 강화되었습니다.', stats(72, 58, 40, 46, 85, 96), '대규모 보병 충원과 근접 화력'),
  historical('ussr', 'zis-3', '76 mm ZiS-3 divisional gun', 'artillery', 1942, '야포와 대전차 임무를 겸한 소련의 대량생산 사단포입니다.', '1942년 정식 채택되어 단순한 생산구조와 범용성으로 빠르게 확산했습니다.', stats(78, 68, 36, 63, 89, 97), '대량 사단포와 대전차 겸용'),
  historical('ussr', 't34-76-1942', 'T-34/76 Model 1942', 'armor', 1942, '경사장갑·넓은 궤도·76 mm 포를 결합한 중형전차입니다.', '공장별 형식 차이가 있었으며 전시 단순화와 생산 확대가 동시에 진행되었습니다.', stats(83, 82, 76, 55, 74, 93), '종심 돌파와 대량 기갑전'),
  historical('ussr', 'il2', 'Ilyushin Il-2', 'aircraft', 1941, '장갑화된 저고도 지상공격기입니다.', '1942년 단좌형에서 후방사수를 둔 복좌형으로 전환이 진행되었습니다.', stats(86, 63, 79, 48, 80, 92), '전선 항공지원과 기갑 타격'),
  historical('ussr', 'gnevny-destroyer', 'Gnevny급 구축함', 'naval', 1938, '소련 해군의 전전형 구축함 계열입니다.', '발트·북방·태평양 함대에서 호송·기뢰·함포 임무를 수행했습니다.', stats(68, 76, 48, 59, 67, 54), '연안 방어와 함대 호위'),
  historical('ussr', 'zis5-truck', 'ZiS-5 3-ton truck', 'logistics', 1933, '단순하고 견고한 소련 3톤급 수송차량입니다.', '전시 생산 단순화형을 포함해 1942년 후방 수송의 핵심 차량으로 운용되었습니다.', stats(17, 63, 23, 58, 88, 95), '단순 정비와 대량 보급'),
  historical('ussr', 'rus-2', 'RUS-2 조기경보 레이더', 'systems', 1940, '소련의 이동식 항공기 조기경보 레이더입니다.', '전쟁 초기부터 방공 경보에 사용되었고 1942년 생산·배치가 확대되었습니다.', stats(23, 37, 41, 78, 70, 70), '도시·전선 방공 경보'),

  historical('germany', 'kar98-mg42-package', 'Kar98k · MG 42 편제', 'infantry', 1942, '볼트액션 소총과 범용기관총 중심의 독일 분대 화기 체계입니다.', 'MG 42는 1942년부터 실전 배치되었고 MG 34와 병행 운용되었습니다.', stats(82, 60, 44, 51, 82, 81), '범용기관총 중심 분대 전술'),
  historical('germany', 'lefH18', '10.5 cm leFH 18', 'artillery', 1935, '독일 사단 포병의 표준 경곡사포입니다.', '말·차량 견인이 병존했고 개량형과 자주화 파생형으로 이어졌습니다.', stats(75, 55, 40, 66, 84, 83), '집중 포병 준비사격'),
  historical('germany', 'panzer-iv-g', 'Panzer IV Ausf. F2/G', 'armor', 1942, '장포신 7.5 cm 포를 도입한 독일 중형전차 계열입니다.', '1942년 F2에서 G형으로 명칭·생산 전환이 이어졌습니다.', stats(85, 75, 69, 64, 78, 76), '대전차 화력 중심 기갑전'),
  historical('germany', 'fw190a', 'Focke-Wulf Fw 190 A', 'aircraft', 1941, '강력한 공랭식 엔진과 중무장을 갖춘 전투기입니다.', '1942년 서부전선에서 요격·전투폭격 임무로 확대 운용되었습니다.', stats(87, 88, 55, 58, 80, 78), '고속 요격과 전투폭격', ['Smithsonian National Air and Space Museum', USAF_FW190]),
  historical('germany', 'type-viic', 'Type VII C U-boat', 'naval', 1940, '독일 잠수함전의 주력 대양형 잠수함입니다.', '1942년 대서양 통상파괴전의 핵심 전력이었습니다.', stats(85, 69, 38, 88, 73, 84), '장거리 통상파괴와 은밀 접근'),
  historical('germany', 'opel-blitz', 'Opel Blitz 3.6-36S', 'logistics', 1937, '독일군의 대표적인 중형 수송트럭입니다.', '다수 사단은 여전히 마필에 의존했지만 차량화 부대 군수의 핵심이었습니다.', stats(18, 72, 25, 62, 84, 88), '기동부대 보급과 표준화'),
  historical('germany', 'freya-wurzburg', 'Freya · Würzburg 레이더망', 'systems', 1939, '장거리 탐지와 정밀 추적을 분담한 독일 방공 레이더 체계입니다.', '1942년 야간전투기 지휘·대공포 사격통제와 결합되었습니다.', stats(36, 24, 48, 91, 78, 68), '레이더 연동 방공과 야간 요격'),

  historical('japan', 'type99-package', '99식 소총 · 96식 경기관총 편제', 'infantry', 1939, '아리사카 계열 소총과 탄창식 경기관총을 결합한 일본군 보병 화기 체계입니다.', '구형 38식 소총도 광범위하게 병용되었습니다.', stats(66, 61, 38, 47, 82, 79), '경량 보병과 장거리 행군'),
  historical('japan', 'type90-field-gun', '90식 75 mm 야포', 'artillery', 1932, '비교적 높은 포구속도를 가진 일본 육군 야포입니다.', '수량은 제한적이었으며 다른 75 mm 야포들과 함께 운용되었습니다.', stats(73, 54, 33, 68, 79, 55), '고속 야포와 대전차 임무'),
  historical('japan', 'shinhoto-chiha', '97식 중전차 개 신포탑 치하', 'armor', 1942, '47 mm 포 신포탑을 올린 일본 중형전차 개량형입니다.', '1942년 필리핀 등에서 실전 운용되며 구형 단포신형을 보완했습니다.', stats(63, 71, 48, 48, 80, 74), '경량 기동과 보병 지원'),
  historical('japan', 'a6m2-zero', 'Mitsubishi A6M2 Zero', 'aircraft', 1940, '긴 항속거리와 기동성을 우선한 일본 해군 함상전투기입니다.', '장갑과 방탄 연료탱크 부족이라는 생존성 약점을 함께 가졌습니다.', stats(83, 96, 34, 84, 72, 82), '장거리 함대 항공우세', ['Naval History and Heritage Command', NHHC_ZERO]),
  historical('japan', 'shokaku-carrier', 'Shōkaku급 항공모함', 'naval', 1941, '대형 항공단과 속도를 갖춘 일본 해군 정규항공모함입니다.', '1942년 산호해를 포함한 주요 항모 작전에 투입되었습니다.', stats(91, 83, 59, 94, 76, 45), '항모 기동부대와 장거리 타격', ['Naval History and Heritage Command', NHHC_CARRIER]),
  historical('japan', 'type94-truck', '94식 6륜 자동화물차', 'logistics', 1934, '일본 육군의 표준 6륜 수송차량 계열입니다.', '도로와 선박 수송을 보완했으나 전구별 차량·연료 부족이 컸습니다.', stats(17, 66, 22, 55, 76, 68), '경량 수송과 남방 전구 보급'),
  historical('japan', 'type2-radar', '2식 2형 조기경보 레이더', 'systems', 1942, '일본 육군의 지상 조기경보 레이더 계열입니다.', '1942년부터 제한적으로 배치되어 기존 육안 감시망을 보완했습니다.', stats(20, 31, 36, 72, 61, 49), '기지 방공 경보'),

  historical('china', 'type24-zb26-package', '24식 중정 소총 · ZB vz.26 편제', 'infantry', 1935, '마우저 계열 국산 소총과 체코계 경기관총을 결합한 국민혁명군 화기 체계입니다.', '부대별 장비 표준화 수준이 크게 달랐고 한양 88식 등도 계속 사용되었습니다.', stats(65, 55, 36, 45, 70, 72), '혼성 장비 보병과 분대 자동화기'),
  historical('china', 'type31-mortar', '31식 60 mm 박격포', 'artillery', 1941, '보병부대가 운용하기 쉬운 국산 경박격포입니다.', '중화기 부족을 보완하는 대대·중대급 곡사화력으로 사용되었습니다.', stats(61, 72, 25, 45, 76, 83), '경량 산악·보병 화력지원'),
  historical('china', 't26', 'T-26 Model 1933 잔존 전차대', 'armor', 1938, '소련 원조로 도입된 경전차를 중심으로 한 중국 기갑 전력입니다.', '1937~39년에 도입되었고 1942년에는 전투 손실과 정비난으로 잔존 수량이 제한적이었습니다.', stats(55, 62, 41, 41, 52, 28), '제한된 기갑 예비대'),
  historical('china', 'p40-avg', 'Curtiss P-40B/E 중국 항공대', 'aircraft', 1941, '중국 공군과 미국인 지원조직이 운용한 P-40 계열 전투기입니다.', 'AVG는 1942년 7월 해산되어 미 육군항공대로 계승되었습니다.', stats(73, 78, 52, 63, 82, 52), '거점 방공과 고속 일격이탈'),
  historical('china', 'river-gunboat', '양쯔강 잔존 포함·포함대', 'naval', 1930, '강과 연안에서 연락·수송·화력지원을 수행한 소형 함정 전력입니다.', '대형 함대는 이미 큰 손실을 입어 1942년에는 분산된 강상·연안 전력이 중심이었습니다.', stats(42, 47, 35, 39, 48, 34), '강상 수송과 연안 지원'),
  historical('china', 'burma-road-fleet', '버마 공로 혼성 수송차량대', 'logistics', 1942, '미·영·소련제 차량이 혼재한 중국의 장거리 보급 차량대입니다.', '버마 공로 단절과 험준한 지형 때문에 차량 정비·부품 표준화가 핵심 문제였습니다.', stats(12, 54, 20, 67, 45, 38), '험지 수송과 연합 원조'),
  historical('china', 'air-warning-net', '중국 방공감시·무선경보망', 'systems', 1938, '관측소·무선통신·도시 방공을 연결한 분산 경보 체계입니다.', '레이더 보유가 제한되어 시각 감시와 연합군 정보 지원 의존도가 높았습니다.', stats(15, 42, 32, 65, 55, 58), '분산 감시와 도시 방공'),

  historical('india', 'smle-bren-package', 'SMLE No.1 Mk III* · Bren 편제', 'infantry', 1937, '영국령 인도군의 표준 소총과 분대 경기관총 체계입니다.', '인도 조병창 생산과 영국 보급이 병행되며 북아프리카·버마 전선에서 사용되었습니다.', stats(67, 59, 40, 47, 89, 86), '영연방식 보병 지속사격'),
  historical('india', 'qf25-india', 'QF 25-pounder 인도 포병대', 'artillery', 1940, '영국령 인도 포병이 운용한 표준 야포 체계입니다.', '구형 18파운더와 산포도 남아 있었으며 신형 장비 전환이 진행 중이었습니다.', stats(72, 58, 37, 65, 90, 66), '영연방 사단 포병 운용'),
  historical('india', 'stuart-india', 'M3 Stuart 인도 기갑부대', 'armor', 1941, '경량·고기동의 미국제 경전차입니다.', '영연방군을 통해 북아프리카와 인도·버마 방면 기갑 전력에 도입되었습니다.', stats(57, 87, 42, 47, 82, 69), '정찰·기동과 경량 기갑'),
  historical('india', 'hurricane-iic', 'Hawker Hurricane Mk II', 'aircraft', 1940, '인도와 버마 방공에 투입된 견고한 영국 전투기 계열입니다.', '1942년 동부 전구에서 요격·전투폭격 임무로 운용되었습니다.', stats(70, 73, 55, 56, 86, 81), '기지 방공과 전술항공 지원'),
  historical('india', 'hmisi-sloop', 'HMIS Jumna급 슬루프', 'naval', 1941, '영국령 인도 해군의 호송·대잠 슬루프 계열입니다.', '인도양 호송과 항만 방어에 투입되었습니다.', stats(57, 60, 46, 61, 82, 61), '인도양 호송과 대잠전'),
  historical('india', 'cmp-truck', 'Canadian Military Pattern truck', 'logistics', 1940, '영연방 표준화 트럭 계열로 인도군 수송에 폭넓게 쓰였습니다.', '여러 제작사·차급이 공통 설계를 공유해 전구 수송을 지원했습니다.', stats(18, 74, 27, 65, 85, 82), '영연방 부품 표준화와 차량화'),
  historical('india', 'air-warning-india', '인도 동부 방공경보망', 'systems', 1942, '레이더·관측소·무선망을 연결해 일본 항공공격을 감시한 체계입니다.', '벵골·아삼·실론의 기지 방어와 항공 통제망이 전쟁 중 빠르게 확장되었습니다.', stats(19, 38, 39, 74, 64, 54), '광역 기지 방공과 항로 감시'),

  historical('freefrance', 'mas36-fm2429', 'MAS-36 · FM 24/29 혼성 편제', 'infantry', 1936, '프랑스제 소총·경기관총에 영국제 장비가 섞인 자유프랑스 보병 체계입니다.', '부대 창설지와 보급원에 따라 프랑스·영국·미국 장비가 혼재했습니다.', stats(65, 58, 39, 46, 78, 48), '혼성 장비 적응과 원정 보병'),
  historical('freefrance', '75-mle1897', 'Canon de 75 modèle 1897', 'artillery', 1897, '프랑스군의 대표적인 속사 야포로 자유프랑스 부대에도 남아 있었습니다.', '1942년에는 구형이었지만 일부 부대에서 대전차·야포 임무로 활용되었습니다.', stats(62, 48, 31, 53, 81, 47), '구형 야포의 다목적 운용'),
  historical('freefrance', 'm3-stuart', 'M3 Stuart 자유프랑스 기갑대', 'armor', 1941, '연합국 지원으로 운용한 미국제 경전차입니다.', '자유프랑스 부대는 영국군 편제와 원조를 통해 여러 연합국 차량을 운용했습니다.', stats(57, 86, 41, 46, 82, 55), '정찰·기동과 연합 보급'),
  historical('freefrance', 'hurricane', 'Hawker Hurricane 자유프랑스 비행대', 'aircraft', 1940, '자유프랑스 공군 비행대가 연합국 보급으로 운용한 전투기입니다.', '중동·북아프리카 전구에서 영국 지휘체계와 함께 작전했습니다.', stats(69, 72, 54, 54, 84, 50), '연합 공군 편제와 전술지원'),
  historical('freefrance', 'le-triomphant', 'Le Triomphant 구축함', 'naval', 1935, '자유프랑스 해군이 운용한 Le Fantasque급 대형 구축함입니다.', '태평양·인도양을 포함한 연합국 임무에 투입되었습니다.', stats(76, 95, 49, 68, 67, 18), '고속 정찰과 연합 함대 작전'),
  historical('freefrance', 'cmp-bedford-fleet', 'CMP · Bedford 혼성 수송대', 'logistics', 1941, '영국·영연방 차량으로 재편된 자유프랑스 수송 체계입니다.', '기존 프랑스 차량과 연합국 원조 차량이 함께 운용되었습니다.', stats(17, 72, 25, 61, 72, 53), '연합 보급망과 혼성 정비'),
  historical('freefrance', 'bcra-radio', 'BCRA 무선연락·암호망', 'systems', 1942, '런던과 점령지 연락조직을 연결한 무선·암호·요원 체계입니다.', '무기체계가 아닌 전략 정보 인프라로 공수·저항조직 작전을 지원했습니다.', stats(18, 64, 34, 81, 67, 42), '저항조직 연락과 전략 정보'),

  historical('italy', 'carcano-breda30', 'Carcano M91/38 · Breda 30 편제', 'infantry', 1938, '카르카노 소총과 브레다 경기관총을 중심으로 한 이탈리아 보병 화기 체계입니다.', '탄약·정비·기관총 신뢰성 문제가 전구 운용에 영향을 주었습니다.', stats(60, 57, 37, 43, 65, 79), '경량 보병과 제한된 자동화력'),
  historical('italy', '75-27', 'Cannone da 75/27 modello 11', 'artillery', 1912, '이탈리아군이 광범위하게 보유한 구형 75 mm 야포입니다.', '1942년에도 수량상 중요한 화력이었으나 사거리와 대전차 성능은 제한적이었습니다.', stats(57, 45, 29, 49, 75, 72), '수량 중심 사단 화력'),
  historical('italy', 'm14-41', 'Carro Armato M14/41', 'armor', 1941, '북아프리카에서 운용된 이탈리아 중형전차입니다.', 'M13/40의 엔진·사막 운용을 개량했지만 장갑과 화력 한계가 남았습니다.', stats(62, 66, 53, 47, 65, 71), '사막 기동과 보병 지원'),
  historical('italy', 'mc202', 'Macchi C.202 Folgore', 'aircraft', 1941, '공기역학과 DB 601 계열 엔진으로 성능을 개선한 이탈리아 전투기입니다.', '1942년 지중해·북아프리카에서 주력 신형 전투기로 운용되었습니다.', stats(79, 88, 46, 55, 76, 58), '고기동 전투기 요격'),
  historical('italy', 'soldati-destroyer', 'Soldati급 구축함', 'naval', 1938, '이탈리아 왕립해군의 고속 구축함 계열입니다.', '지중해 함대전·호송·수송 임무에 투입되었습니다.', stats(72, 88, 48, 62, 68, 55), '고속 함대 호위와 지중해 수송'),
  historical('italy', 'fiat626', 'Fiat 626 NLM', 'logistics', 1939, '이탈리아군의 표준 중형 수송트럭입니다.', '북아프리카·발칸·동부전선에서 널리 운용되었으나 전체 차량 수는 부족했습니다.', stats(17, 67, 23, 57, 79, 79), '표준 중형트럭과 원정군 보급'),
  historical('italy', 'gufo-radar', 'EC3/ter Gufo 함상 레이더', 'systems', 1942, '이탈리아가 실전 배치를 시작한 함상 수색 레이더입니다.', '1942년 일부 함정에 제한적으로 설치되어 야간·악천후 탐지를 보완했습니다.', stats(27, 21, 39, 77, 58, 31), '함대 조기경보와 야간 탐지'),

  historical('korea', 'allied-small-arms', '중국군 지급 소총 · ZB vz.26 혼성 편제', 'infantry', 1942, '광복군이 중국군 지휘·보급체계 안에서 접근한 혼성 소화기를 게임 편제로 묶었습니다.', '광복군 장비는 부대·시기별 차이가 커 단일 제식명보다 중국군 지급·훈련 장비 계보로 표현합니다.', stats(57, 64, 30, 43, 61, 34), '망명군 보병 훈련과 연합 보급'),
  historical('korea', 'light-mortar', '광복군 경박격포·폭파조', 'artillery', 1942, '경량 곡사화기와 폭파교육을 결합한 소부대 지원 편제입니다.', '대규모 독립 포병대가 아닌 중국 전구 훈련·지원 가능성을 게임 규모에 맞게 추상화했습니다.', stats(52, 72, 20, 39, 58, 31), '침투부대 경량 화력'),
  historical('korea', 'allied-armor-allocation', '연합군 기갑차량 배속 계획', 'armor', 1942, '독자 전차군이 아니라 중국 전구의 장갑차량 배속과 승무원 양성 구상입니다.', '1942년 광복군의 실전 기갑부대가 아니며 대체역사 확장을 위한 연합 지원 슬롯입니다.', stats(40, 58, 42, 34, 45, 16), '연합 배속에서 독자 기갑대로 발전'),
  historical('korea', 'allied-air-liaison', '한인 항공인·연합 연락비행대', 'aircraft', 1942, '중국 공군 경력의 한인 항공인과 연락·정찰 임무를 묶은 초기 항공 기반입니다.', '독자 전투비행단 보유가 아니라 인적 자원과 연합 항공협력 가능성을 표시합니다.', stats(38, 74, 23, 58, 50, 18), '연락·정찰에서 독자 공군으로 발전'),
  historical('korea', 'river-coastal-liaison', '한중 수로·해상 연락정', 'naval', 1942, '소형 선박을 이용한 연락·침투·보급 기반입니다.', '정규 해군이 아닌 비정규 연락망을 해군 계보의 출발점으로 처리합니다.', stats(22, 61, 18, 45, 49, 26), '은밀 해상 침투와 연락'),
  historical('korea', 'china-theater-transport', '중국 전구 혼성 트럭·도보 수송대', 'logistics', 1942, '중국군 차량과 철도·도보 운반에 의존한 망명군 보급망입니다.', '광복군의 제한된 규모와 중국 전구 의존성을 반영합니다.', stats(10, 51, 16, 54, 48, 28), '분산 보급과 장거리 이동'),
  historical('korea', 'clandestine-radio', '임시정부·광복군 비밀 무전망', 'systems', 1942, '충칭·중국 전구·국내 공작선을 잇는 연락·암호 체계입니다.', '실제 독립운동 연락망을 기반으로 하되 통합 전구망은 게임용 확장입니다.', stats(12, 39, 25, 68, 51, 24), '국내공작과 연합 정보연락'),

  historical('vietnam', 'captured-french-arms', '프랑스제 소총·노획 소화기 편제', 'infantry', 1942, '식민지군 잔존·노획 소화기와 수제 무기를 함께 운용합니다.', '초기 베트민은 장비가 극도로 부족했으며 정치조직과 소부대가 중심이었습니다.', stats(49, 66, 25, 38, 48, 31), '산악 유격대와 노획 보급'),
  historical('vietnam', 'improvised-demolition', '수제 폭발물·경박격포조', 'artillery', 1942, '수제 폭발물과 제한된 경량화기를 매복 화력으로 사용합니다.', '정규 사단포가 아닌 초기 무장조직의 파괴공작 능력을 나타냅니다.', stats(45, 73, 17, 32, 42, 36), '매복·철도 파괴와 경량 화력'),
  historical('vietnam', 'captured-armored-car', '노획 장갑차 운용반', 'armor', 1942, '식민지군·점령군 장비를 탈취해 제한적으로 운용하는 가상 확대 편제입니다.', '1942년 베트민 정규 기갑부대는 없었으며 연구 계보 연결을 위한 저성능 슬롯입니다.', stats(34, 55, 34, 27, 36, 12), '노획 운용에서 독자 기계화로 발전'),
  historical('vietnam', 'liaison-aircraft', '국경 연락·정찰 항공 계획', 'aircraft', 1942, '중국 국경 연락과 정찰에 소형 항공 지원을 요청하는 계획입니다.', '독자 공군 보유가 아닌 대체역사상 연합 지원 가능성을 명시합니다.', stats(31, 67, 18, 49, 41, 10), '연락 정찰과 연합 항공지원'),
  historical('vietnam', 'sampan-network', '강·연안 삼판 연락망', 'naval', 1942, '현지 소형선박으로 인원과 문서를 은밀히 이동합니다.', '정규 해군이 아닌 수로 기반 지하연락 체계입니다.', stats(18, 57, 15, 37, 55, 42), '수로 침투와 지역 보급'),
  historical('vietnam', 'pack-transport', '자전거·도보·짐꾼 보급대', 'logistics', 1942, '도로 밖 산악로를 이용하는 분산 수송망입니다.', '후대의 대규모 보급망이 아니라 1942년 초기 조직의 소규모 기반입니다.', stats(8, 58, 12, 45, 65, 57), '은닉 산악 보급'),
  historical('vietnam', 'courier-network', '베트민 연락원·비밀 인쇄망', 'systems', 1942, '연락원·암호문·비밀 인쇄로 분산 조직을 연결합니다.', '전자 장비보다 사람과 은닉 거점이 핵심이었던 초기 조직을 반영합니다.', stats(9, 45, 20, 62, 59, 53), '정치조직과 정보망 통합'),

  historical('indonesia', 'knil-small-arms', 'KNIL 잔존 소총·노획 일본군 화기', 'infantry', 1942, '네덜란드령 동인도군 잔존품과 점령군 장비를 비밀리에 확보합니다.', '지역과 조직별로 장비가 크게 달랐던 점을 혼성 편제로 표현합니다.', stats(53, 61, 29, 40, 51, 36), '군도별 혼성 무장대'),
  historical('indonesia', 'knil-field-guns', 'KNIL 잔존 야포·경박격포', 'artillery', 1942, '항복 뒤 은닉·노획된 경화기를 지역 저항조직이 확보하는 편제입니다.', '통합 포병대는 대체역사적 확장이며 실제 잔존 장비를 출발점으로 합니다.', stats(47, 46, 25, 45, 43, 18), '은닉 화기 회수와 지역 방어'),
  historical('indonesia', 'ctls-remnants', 'Marmon-Herrington CTLS 잔존차량', 'armor', 1942, 'KNIL이 도입한 경전차 잔존품을 회수·정비합니다.', '실제 차량 도입을 기반으로 하나 독립운동 세력의 통합 운용은 대체역사 설정입니다.', stats(42, 66, 35, 31, 38, 13), '잔존 경전차와 군도 기동'),
  historical('indonesia', 'brewster-remnants', 'Brewster Buffalo 잔존·연락기 계획', 'aircraft', 1942, 'KNIL 항공대 잔존 인력·기체를 독립 세력으로 전환하는 계획입니다.', '점령 뒤 실제 가용성은 매우 낮아 저성능·저생산으로 반영합니다.', stats(45, 63, 28, 45, 34, 9), '잔존 항공인력과 기지 재건'),
  historical('indonesia', 'prahu-network', '프라우·군도 해상연락대', 'naval', 1942, '전통 범선과 소형선을 이용해 섬 사이의 정보와 물자를 운반합니다.', '정규 함대보다 군도 지형에 맞춘 민간 해상망이 중심입니다.', stats(20, 68, 16, 55, 61, 56), '도서 침투와 군도 연락'),
  historical('indonesia', 'bicycle-rail-network', '자전거·철도 지하수송망', 'logistics', 1942, '도시 철도노동자와 자전거 연락원을 활용한 은닉 수송체계입니다.', '점령기 지하조직의 지역 연락을 게임 군수망으로 추상화했습니다.', stats(9, 64, 14, 49, 58, 62), '도시·농촌 분산 보급'),
  historical('indonesia', 'underground-print-radio', '비밀 인쇄소·수신 무전망', 'systems', 1942, '청년조직과 반일 지하세력이 선전물·단파수신·연락원으로 정보를 공유합니다.', '통합 전자망이 아닌 분산 정치정보 체계입니다.', stats(10, 43, 18, 61, 52, 48), '점령행정 감시와 대중 선전'),

  historical('philippines', 'usaffe-small-arms', 'M1903 · M1917 · BAR 잔존 편제', 'infantry', 1942, '미·필리핀군이 남긴 소화기와 탄약을 게릴라가 분산 보관·운용합니다.', '탄약 규격과 보급 단절이 지속적인 제약이었습니다.', stats(62, 62, 32, 45, 57, 39), '잔존군 화기와 게릴라 분산운용'),
  historical('philippines', '75mm-remnants', '75 mm 야포·박격포 잔존대', 'artillery', 1942, '바탄·민다나오 등지의 잔존 중화기를 은닉·회수합니다.', '대부분의 게릴라에는 중화기가 없었으므로 제한된 전략 자산으로 처리합니다.', stats(55, 42, 28, 52, 40, 13), '희소 중화기와 지역 거점 방어'),
  historical('philippines', 'm3-stuart-remnants', 'M3 Stuart 잔존·회수 계획', 'armor', 1942, '필리핀 전역에 투입됐던 경전차의 잔존 차량과 승무원을 회수합니다.', '게릴라 정규 기갑대는 대체역사 확장이며 실제 배치 이력을 기반으로 합니다.', stats(48, 64, 40, 36, 39, 10), '잔존 전차 회수와 정비'),
  historical('philippines', 'p40-remnants', 'P-40 잔존 항공대 재건 계획', 'aircraft', 1942, '필리핀 방공전에 참가한 항공인력과 잔존 기체를 비밀 비행대로 재건합니다.', '점령기 독자 운용은 대체역사이며 실제 전투·철수 이력을 출발점으로 합니다.', stats(51, 69, 32, 51, 40, 9), '정찰·연락에서 방공대 재건'),
  historical('philippines', 'qboat-coastal', 'Q-boat 계보·민간 해상연락정', 'naval', 1942, '전전 필리핀 해상초계 경험과 민간 선박을 게릴라 연락에 활용합니다.', '정규 함대가 아닌 연안 초계·잠수함 보급 접선 능력입니다.', stats(36, 70, 24, 58, 52, 34), '잠수함 접선과 군도 해상연락'),
  historical('philippines', 'guerrilla-supply', '민간 트럭·카바오·잠수함 보급망', 'logistics', 1942, '육상 운반과 민간 차량, 이후 잠수함 보급을 결합하는 분산 체계입니다.', '지역별 게릴라가 서로 다른 수송수단에 의존한 현실을 반영합니다.', stats(10, 57, 18, 57, 56, 48), '군도 분산 보급과 은닉창고'),
  historical('philippines', 'guerrilla-radio', '게릴라 무전·해안감시망', 'systems', 1942, '비밀 무전과 해안감시원이 일본군 이동을 연합군에 보고합니다.', '필리핀 저항의 정보수집·잠수함 연락 기록을 바탕으로 합니다.', stats(14, 47, 24, 72, 57, 38), '해안감시와 연합 정보연락'),
];

type FutureSeed = [EquipmentCategory, EquipmentEra, string, number | null, string, string, number, number, EquipmentStats];

const futureSeeds: FutureSeed[] = [
  ['infantry', 'late-war', '선택사격 돌격소총 교리', 1944, '소총과 기관단총 사이의 역할을 통합하고 분대 화력을 재구성합니다.', '역사적 후기대전 개념에서 파생', 70, 38, stats(84, 66, 48, 56, 76, 72)],
  ['infantry', 'cold-war', '표준 전투소총·경량지원화기 체계', 1955, '탄약·광학·지원화기를 표준화해 제병협동 보병을 만듭니다.', '전후 실제 발전 경향을 게임용으로 통합', 95, 48, stats(88, 72, 58, 65, 84, 78)],
  ['infantry', 'modern', '모듈식 개인화기·디지털 조준경', 2024, '모듈식 화기와 거리측정·탄도계산·야간 장비를 네트워크로 연결합니다.', '현재 운용·개발 기술을 추상화', 135, 72, stats(94, 82, 73, 79, 89, 59)],
  ['infantry', 'speculative', '적응형 병사 전투 생태계', null, '착용 센서·로봇 보조·스마트 탄약·분산 AI를 하나의 병사 체계로 결합합니다.', '가상 기술: 현실 장비로 오인하지 않도록 분리', 190, 105, stats(99, 94, 88, 91, 76, 35)],

  ['artillery', 'late-war', '자주포·다연장 로켓 화력단', 1944, '견인포 중심 전력을 자주포와 로켓포로 보완해 화력 이동성을 높입니다.', '후기대전 실제 기술 경향을 통합', 72, 52, stats(88, 73, 48, 76, 75, 67)],
  ['artillery', 'cold-war', '기계화 자주곡사포·대포병 레이더', 1965, '장거리 포병과 대포병 탐지를 기계화 지휘체계에 연결합니다.', '전후 실제 발전 경향을 게임용으로 통합', 105, 66, stats(92, 78, 58, 84, 82, 62)],
  ['artillery', 'modern', '네트워크 정밀화력·무인 표적획득', 2024, '센서-사수 연결과 정밀 유도탄으로 반응시간과 명중률을 높입니다.', '현재 운용 기술을 추상화', 145, 88, stats(98, 83, 68, 96, 86, 44)],
  ['artillery', 'speculative', '전자기·고에너지 원거리 화력망', null, '전자기 가속·고출력 에너지·자율 표적화를 조합하는 실험 화력망입니다.', '가상 기술', 205, 132, stats(100, 86, 81, 100, 61, 21)],

  ['armor', 'late-war', '경사장갑·고속포 기갑 플랫폼', 1944, '주포 관통력과 장갑 형상을 개선하고 회수·정비 차량을 표준화합니다.', '후기대전 실제 기술 경향을 통합', 78, 65, stats(91, 76, 87, 69, 73, 63)],
  ['armor', 'cold-war', '주력전차·기계화보병 전투단', 1960, '기동·화력·방호를 단일 주력전차 개념과 장갑차 편제로 통합합니다.', '전후 실제 발전 경향을 게임용으로 통합', 112, 84, stats(95, 84, 92, 76, 82, 54)],
  ['armor', 'modern', '복합장갑·능동방호 네트워크 전차', 2024, '열상·디지털 사격통제·능동방호·데이터링크를 결합합니다.', '현재 운용 기술을 추상화', 158, 116, stats(99, 87, 99, 86, 84, 34)],
  ['armor', 'speculative', '무인 모듈식 지상전투 플랫폼', null, '승무원 없는 차체와 교체형 임무 모듈, 로봇 호위를 결합합니다.', '가상 기술', 220, 151, stats(100, 94, 96, 93, 67, 24)],

  ['aircraft', 'late-war', '초기 제트·전천후 요격기', 1945, '제트 추진과 레이더 요격을 통해 속도와 고도 한계를 확장합니다.', '후기대전 실제 기술 경향을 통합', 86, 73, stats(93, 96, 53, 75, 58, 42)],
  ['aircraft', 'cold-war', '초음속 다목적 전투기', 1965, '레이더·미사일·공중급유를 결합해 장거리 다목적 항공전을 수행합니다.', '전후 실제 발전 경향을 게임용으로 통합', 122, 96, stats(97, 99, 66, 90, 77, 37)],
  ['aircraft', 'modern', '저피탐 센서융합 전투체계', 2024, '저피탐 형상·AESA급 센서·데이터링크·정밀무장을 통합합니다.', '현재 운용 기술을 추상화', 170, 134, stats(100, 99, 82, 98, 80, 22)],
  ['aircraft', 'speculative', '자율 협동 항공군·지향성 에너지', null, '유·무인 협동 편대와 분산 센서, 실험 에너지 무장을 조합합니다.', '가상 기술', 230, 170, stats(100, 100, 91, 100, 62, 16)],

  ['naval', 'late-war', '항모 기동부대·통합 대잠전', 1945, '항모 항공단·레이더 방공·호위함 대잠작전을 단일 편대로 통합합니다.', '후기대전 실제 기술 경향을 통합', 90, 82, stats(94, 87, 72, 96, 77, 38)],
  ['naval', 'cold-war', '미사일 함대·원자력 잠수함 교리', 1965, '유도무기와 장기 잠항 능력으로 함대 임무를 재편합니다.', '전후 실제 발전 경향을 게임용으로 통합', 128, 111, stats(98, 91, 82, 100, 80, 25)],
  ['naval', 'modern', '통합 방공·스텔스 다목적 함대', 2024, '위상배열 센서·수직발사·협동교전·무인기를 연결합니다.', '현재 운용 기술을 추상화', 175, 142, stats(100, 93, 91, 100, 85, 20)],
  ['naval', 'speculative', '분산 무인 해양전투 군집', null, '유·무인 수상·수중 플랫폼과 자율 군집을 분산 운용합니다.', '가상 기술', 235, 177, stats(100, 98, 89, 100, 66, 18)],

  ['logistics', 'late-war', '표준화 차량군·전구 정비단', 1944, '차량·부품·회수정비를 표준화해 대규모 기동전을 지속합니다.', '후기대전 실제 기술 경향을 통합', 64, 42, stats(25, 86, 42, 83, 91, 91)],
  ['logistics', 'cold-war', '전략 공수·컨테이너화 보급', 1965, '대형 수송기와 표준 화물 단위로 전구 보급 속도를 높입니다.', '전후 실제 발전 경향을 게임용으로 통합', 92, 61, stats(29, 92, 49, 94, 88, 84)],
  ['logistics', 'modern', '예측정비·자율 보급망', 2024, '센서 기반 정비와 무인 수송·재고 최적화를 결합합니다.', '현재 운용 기술을 추상화', 132, 82, stats(33, 96, 62, 97, 91, 72)],
  ['logistics', 'speculative', '현장 분산제조·에너지 자립망', null, '첨단 제조와 자율 에너지·재활용 체계로 보급선 의존을 줄입니다.', '가상 기술', 186, 113, stats(38, 99, 78, 100, 73, 48)],

  ['systems', 'late-war', '레이더 사격통제·암호통합 본부', 1945, '레이더·무선·암호분석·작전실을 연결해 전구 상황인식을 높입니다.', '후기대전 실제 기술 경향을 통합', 74, 47, stats(43, 46, 62, 94, 74, 61)],
  ['systems', 'cold-war', '반도체 지휘통제·조기경보망', 1960, '전자계산·데이터링크·장거리 센서를 통합합니다.', '전후 실제 발전 경향을 게임용으로 통합', 108, 68, stats(54, 57, 72, 98, 82, 54)],
  ['systems', 'modern', '다영역 센서융합·사이버전자전', 2024, '우주·공중·지상 센서와 사이버·전자전을 공통 작전상에 결합합니다.', '현재 운용 기술을 추상화', 154, 98, stats(69, 73, 86, 100, 84, 38)],
  ['systems', 'speculative', '양자감시·분산 AI 지휘망', null, '양자 계측과 검증 가능한 분산 AI로 복잡한 전구를 실시간 조정합니다.', '가상 기술', 215, 139, stats(84, 89, 95, 100, 64, 20)],

  ['strategic', 'late-war', '원자 연구·장거리 유도무기 계획', 1945, '대규모 과학·산업 투자를 통해 전략무기 시대의 문을 엽니다.', '실제 후기대전 연구 흐름을 추상화한 전략 프로그램', 115, 120, stats(98, 35, 42, 100, 48, 15)],
  ['strategic', 'cold-war', '핵 억제·탄도미사일·우주정찰', 1965, '전략 억제와 우주 기반 감시를 국가 체계로 통합합니다.', '전후 실제 발전 경향을 게임용으로 통합', 160, 165, stats(100, 55, 68, 100, 67, 10)],
  ['strategic', 'modern', '정밀 장거리타격·통합 미사일방어', 2024, '다층 방어·우주 감시·장거리 정밀타격을 연결합니다.', '현재 운용 기술을 추상화', 205, 195, stats(100, 72, 91, 100, 76, 8)],
  ['strategic', 'speculative', '궤도·극초음속·에너지 전략체계', null, '우주·극초음속·고에너지 기술을 결합한 가상 전략 프로젝트입니다.', '가상 기술', 270, 240, stats(100, 95, 99, 100, 51, 4)],
];

const futureEquipment = futureSeeds.map(([category, era, name, year, summary, historicalNote, researchCost, industrialCost, values], index): EquipmentNode => ({
  id: `${category}-${era}-${index}`,
  name,
  category,
  era,
  year,
  authenticity: era === 'speculative' ? 'speculative' : era === 'modern' ? 'documented' : 'derived',
  nationIds: 'all',
  summary,
  historicalNote,
  researchCost,
  industrialCost,
  doctrineEffect: `${equipmentCategoryLabels[category]}의 ${equipmentEraLabels[era]} 운용 개념을 해금`,
  stats: values,
}));

export const equipmentNodes: EquipmentNode[] = [...historicalEquipment, ...futureEquipment];

type ModuleSeed = [string, EquipmentModule['slot'], EquipmentEra, string, Partial<EquipmentStats>, number, number];

const moduleSeeds: ModuleSeed[] = [
  ['용접 강철·범용 차체', 'platform', 'historical', '정비성과 대량생산을 우선한 전시 표준 플랫폼입니다.', { protection: 5, production: 9, mobility: -2 }, 8, 3],
  ['경량 공수·상륙 플랫폼', 'platform', 'late-war', '중량을 줄여 신속 전개와 상륙 운용을 우선합니다.', { mobility: 12, range: 5, protection: -9 }, 12, 7],
  ['모듈식 차륜·궤도 공통차체', 'platform', 'cold-war', '임무별 상부 구조를 공통 하부체계에 결합합니다.', { mobility: 8, reliability: 5, production: 5 }, 17, 6],
  ['저피탐 복합재 플랫폼', 'platform', 'modern', '신소재와 형상관리를 통해 탐지 가능성을 낮춥니다.', { protection: 9, mobility: 5, production: -8 }, 25, 10],
  ['형상변환 다영역 플랫폼', 'platform', 'speculative', '지상·해상·공중 임무 사이의 경계를 허무는 가상 구조입니다.', { mobility: 16, range: 12, reliability: -9, production: -13 }, 39, 21],

  ['전시 표준 내연기관', 'powerplant', 'historical', '검증된 연료·부품 체계를 사용하는 단순 동력원입니다.', { reliability: 8, production: 6 }, 6, 2],
  ['고출력 과급·초기 제트 동력', 'powerplant', 'late-war', '출력을 우선해 속도를 높이지만 정비 부담이 큽니다.', { mobility: 11, firepower: 2, reliability: -7 }, 13, 10],
  ['가스터빈·원자력 장기동력', 'powerplant', 'cold-war', '높은 출력 또는 긴 작전 지속시간을 제공합니다.', { mobility: 9, range: 15, production: -7 }, 22, 10],
  ['하이브리드 전기·적응형 추진', 'powerplant', 'modern', '연료 효율과 저소음 운용, 순간 출력을 함께 노립니다.', { mobility: 8, range: 12, reliability: 3 }, 27, 9],
  ['고밀도 에너지·장주기 자립동력', 'powerplant', 'speculative', '보급 없이 장기간 운용하는 가상 고밀도 동력계입니다.', { mobility: 14, range: 22, reliability: -8, production: -12 }, 42, 22],

  ['범용 운동에너지 화기', 'weapon', 'historical', '포·기관총·폭탄·어뢰 계열의 검증된 화력 패키지입니다.', { firepower: 8, reliability: 4, production: 3 }, 8, 3],
  ['고속포·로켓·초기 유도무기', 'weapon', 'late-war', '높은 관통력과 포화 화력을 우선합니다.', { firepower: 14, range: 7, reliability: -4 }, 15, 9],
  ['다목적 미사일 셀', 'weapon', 'cold-war', '임무별 유도탄을 공통 발사체계에서 운용합니다.', { firepower: 18, range: 14, production: -7 }, 24, 10],
  ['정밀 네트워크 무장·무인기 제어', 'weapon', 'modern', '센서 정보를 바탕으로 정밀무장과 협동 무인기를 통제합니다.', { firepower: 19, range: 15, reliability: 2, production: -9 }, 30, 12],
  ['전자기·지향성 에너지·군집 효과기', 'weapon', 'speculative', '운동·에너지·전자 효과를 교체하는 가상 무장군입니다.', { firepower: 24, range: 18, reliability: -12, production: -15 }, 47, 24],

  ['균질 압연장갑·방탄 구조', 'protection', 'historical', '단순하고 수리 가능한 물리 방호를 제공합니다.', { protection: 9, mobility: -3, production: 2 }, 8, 3],
  ['경사장갑·방탄 연료계', 'protection', 'late-war', '형상과 내부 생존성을 개선합니다.', { protection: 13, reliability: 4, mobility: -2 }, 14, 6],
  ['복합장갑·NBC 집단방호', 'protection', 'cold-war', '다층 재료와 밀폐식 승무원 보호를 결합합니다.', { protection: 17, mobility: -3, production: -6 }, 22, 8],
  ['능동방호·전자전·저피탐', 'protection', 'modern', '위협을 탐지·교란·요격해 생존성을 높입니다.', { protection: 20, reliability: 1, production: -10 }, 31, 13],
  ['적응형 신소재·분산 피해복구', 'protection', 'speculative', '손상에 반응하고 기능을 재구성하는 가상 방호체계입니다.', { protection: 24, reliability: -8, production: -14 }, 45, 23],

  ['광학 조준·무선 통신', 'sensors', 'historical', '광학 거리판단과 음성 무선을 결합한 기본 사격통제입니다.', { range: 6, firepower: 3, reliability: 4 }, 6, 2],
  ['레이더 사격통제·야시장비', 'sensors', 'late-war', '전파 탐지와 초기 야간 관측으로 악천후 작전을 보조합니다.', { range: 11, firepower: 7, reliability: -2 }, 13, 7],
  ['열상·레이저 거리측정·데이터링크', 'sensors', 'cold-war', '주야간 탐지와 디지털 사격제원을 공유합니다.', { range: 14, firepower: 10, reliability: 3 }, 21, 7],
  ['AESA급 다중센서·AI 융합', 'sensors', 'modern', '분산 센서 자료를 통합해 탐지·교전 순환을 단축합니다.', { range: 18, firepower: 12, protection: 5, production: -6 }, 29, 11],
  ['양자·수동 분산감지망', 'sensors', 'speculative', '다양한 물리 신호를 조합하는 가상 초민감 감시체계입니다.', { range: 23, firepower: 8, protection: 9, reliability: -9 }, 43, 21],

  ['돌파·근접지원 패키지', 'mission', 'historical', '정면 전투와 보병 근접지원을 우선합니다.', { firepower: 6, protection: 5, range: -3 }, 5, 2],
  ['전구 방공·대전차 패키지', 'mission', 'late-war', '기동부대의 공중·기갑 위협 대응을 강화합니다.', { firepower: 8, range: 7, protection: 2 }, 10, 5],
  ['정찰·원정 다목적 패키지', 'mission', 'cold-war', '장거리 전개와 정보 수집, 다목적 운용을 우선합니다.', { mobility: 8, range: 9, firepower: 3 }, 15, 5],
  ['다영역 지휘·전자전 패키지', 'mission', 'modern', '다른 부대의 센서와 효과기를 연결하는 지휘 노드가 됩니다.', { range: 10, protection: 7, reliability: 4, production: -4 }, 23, 8],
  ['완전 자율 임무군 패키지', 'mission', 'speculative', '복수 플랫폼이 인간의 전략 지침 아래 협동하는 가상 임무체계입니다.', { mobility: 10, firepower: 9, range: 11, reliability: -7 }, 36, 18],
];

export const equipmentModules: EquipmentModule[] = moduleSeeds.map(([name, slot, minimumEra, summary, statDelta, industrialCost, risk], index) => ({
  id: `${slot}-${minimumEra}-${index}`,
  name,
  slot,
  minimumEra,
  summary,
  statDelta,
  industrialCost,
  risk,
}));

export function getEquipmentNode(id: string) {
  return equipmentNodes.find((node) => node.id === id);
}

export function getEquipmentModule(id: string) {
  return equipmentModules.find((module) => module.id === id);
}

export function getDevelopedEquipment(id: string | undefined, development: EquipmentDevelopmentState) {
  if (!id) return undefined;
  return getEquipmentNode(id) ?? development.prototypes.find((prototype) => prototype.id === id);
}

export function applyEquipmentToDivision(division: Division, development: EquipmentDevelopmentState): Division {
  const fallbackCategory: EquipmentCategory = division.type === 'armor' ? 'armor' : 'infantry';
  const equipmentId = development.divisionAssignments[division.id]
    ?? division.equipmentPackageId
    ?? development.fieldedByCategory[fallbackCategory];
  const equipment = getDevelopedEquipment(equipmentId, development);
  if (!equipment) return division;

  const readiness = development.readiness.categories[fallbackCategory];
  const readinessStrength = Math.max(-5, Math.min(5, Math.round((readiness.readinessScore - 60) / 8)));
  const readinessOrganization = Math.max(-4, Math.min(5, Math.round((readiness.crewProficiency + readiness.standardization - 120) / 20)));
  const readinessSupply = Math.max(-5, Math.min(5, Math.round((readiness.sparePartsDays + readiness.ammunitionDays - 90) / 18)));

  const strengthBonus = Math.max(-4, Math.min(10, Math.round((equipment.stats.firepower + equipment.stats.protection - 100) / 22)));
  const organizationBonus = Math.max(-3, Math.min(6, Math.round((equipment.stats.reliability + equipment.stats.range - 100) / 34)));
  const supplyBonus = Math.max(-3, Math.min(6, Math.round((equipment.stats.production + equipment.stats.mobility - 100) / 35)));
  return {
    ...division,
    equipmentPackageId: equipment.id,
    strength: Math.max(5, Math.min(100, division.strength + strengthBonus + readinessStrength)),
    organization: Math.max(5, Math.min(100, division.organization + organizationBonus + readinessOrganization)),
    supply: Math.max(5, Math.min(100, division.supply + supplyBonus + readinessSupply)),
  };
}

export function getNationHistoricalEquipment(nationId: NationId) {
  return historicalEquipment.filter((node) => node.nationIds !== 'all' && node.nationIds.includes(nationId));
}

export function createEquipmentDevelopment(nationId: NationId): EquipmentDevelopmentState {
  const initial = getNationHistoricalEquipment(nationId);
  const fieldedByCategory = Object.fromEntries(initial.map((node) => [node.category, node.id]));
  return {
    unlockedIds: initial.map((node) => node.id),
    activeProjectId: null,
    progress: 0,
    prototypes: [],
    fieldedByCategory,
    divisionAssignments: {},
    readiness: createWeaponReadinessState(fieldedByCategory),
  };
}

export function canResearchEquipment(node: EquipmentNode, development: EquipmentDevelopmentState, nationId: NationId) {
  if (development.unlockedIds.includes(node.id) || node.era === 'historical') return false;
  if (node.nationIds !== 'all' && !node.nationIds.includes(nationId)) return false;
  const eraIndex = equipmentEraOrder.indexOf(node.era);
  const previousEra = equipmentEraOrder[eraIndex - 1];
  if (!previousEra) return false;
  if (node.category === 'strategic' && node.era === 'late-war') {
    return equipmentNodes.some((candidate) => candidate.category === 'systems' && candidate.era === 'historical' && development.unlockedIds.includes(candidate.id));
  }
  return equipmentNodes.some((candidate) => candidate.category === node.category && candidate.era === previousEra && development.unlockedIds.includes(candidate.id));
}

export function highestUnlockedEra(development: EquipmentDevelopmentState) {
  return development.unlockedIds.reduce((highest, id) => {
    const node = getEquipmentNode(id);
    return node ? Math.max(highest, equipmentEraOrder.indexOf(node.era)) : highest;
  }, 0);
}

export function canUseModule(module: EquipmentModule, development: EquipmentDevelopmentState) {
  return highestUnlockedEra(development) >= equipmentEraOrder.indexOf(module.minimumEra);
}

export function calculatePrototype(baseNodeId: string, moduleIds: string[], name: string, week: number): EquipmentPrototype | null {
  const base = getEquipmentNode(baseNodeId);
  const modules = moduleIds.map(getEquipmentModule).filter((module): module is EquipmentModule => Boolean(module));
  if (!base || modules.length === 0 || modules.length !== moduleIds.length || new Set(modules.map((module) => module.slot)).size !== modules.length) return null;
  const finalStats = modules.reduce<EquipmentStats>((current, module) => ({
    firepower: clamp(current.firepower + (module.statDelta.firepower ?? 0)),
    mobility: clamp(current.mobility + (module.statDelta.mobility ?? 0)),
    protection: clamp(current.protection + (module.statDelta.protection ?? 0)),
    range: clamp(current.range + (module.statDelta.range ?? 0)),
    reliability: clamp(current.reliability + (module.statDelta.reliability ?? 0)),
    production: clamp(current.production + (module.statDelta.production ?? 0)),
  }), { ...base.stats });
  const risk = clamp(modules.reduce((total, module) => total + module.risk, 0) / Math.max(1, modules.length) + Math.max(0, 62 - finalStats.reliability) * 0.45);
  return {
    id: `prototype-${week}-${base.id}-${moduleIds.join('-')}`,
    name: name.trim() || `${base.name} 실험형`,
    baseNodeId: base.id,
    category: base.category,
    moduleIds,
    stats: finalStats,
    industrialCost: base.industrialCost + modules.reduce((total, module) => total + module.industrialCost, 0),
    risk,
    reliability: finalStats.reliability,
    createdWeek: week,
  };
}

export function normalizeEquipmentDevelopment(value: Partial<EquipmentDevelopmentState> | undefined, nationId: NationId): EquipmentDevelopmentState {
  const fallback = createEquipmentDevelopment(nationId);
  if (!value) return fallback;
  const prototypes = Array.isArray(value.prototypes) ? value.prototypes.filter((prototype): prototype is EquipmentPrototype => (
    Boolean(prototype)
    && typeof prototype.id === 'string'
    && typeof prototype.name === 'string'
    && Boolean(getEquipmentNode(prototype.baseNodeId))
    && Array.isArray(prototype.moduleIds)
    && prototype.moduleIds.every((id) => Boolean(getEquipmentModule(id)))
    && Boolean(prototype.stats)
    && typeof prototype.stats.firepower === 'number'
    && typeof prototype.industrialCost === 'number'
  )).slice(0, 8) : [];
  const activeProjectId = value.activeProjectId && getEquipmentNode(value.activeProjectId) ? value.activeProjectId : null;
  const validEquipmentIds = new Set([...equipmentNodes.map((node) => node.id), ...prototypes.map((prototype) => prototype.id)]);
  const fieldedByCategory = Object.fromEntries(
    Object.entries({ ...fallback.fieldedByCategory, ...(value.fieldedByCategory ?? {}) })
      .filter(([, id]) => typeof id === 'string' && validEquipmentIds.has(id)),
  ) as EquipmentDevelopmentState['fieldedByCategory'];
  const divisionAssignments = Object.fromEntries(
    Object.entries(value.divisionAssignments ?? {}).filter(([, id]) => validEquipmentIds.has(id)),
  );
  return {
    unlockedIds: Array.from(new Set([...fallback.unlockedIds, ...(value.unlockedIds ?? [])])).filter((id) => Boolean(getEquipmentNode(id))),
    activeProjectId,
    progress: Math.min(getEquipmentNode(activeProjectId ?? '')?.researchCost ?? 0, Math.max(0, value.progress ?? 0)),
    prototypes,
    fieldedByCategory,
    divisionAssignments,
    readiness: normalizeWeaponReadinessState(value.readiness, fieldedByCategory),
  };
}
