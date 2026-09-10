import type { CouncilChoiceEffect, CouncilEvent, NationId } from './types';

type EventPattern = 'command' | 'economy' | 'diplomacy' | 'resistance' | 'humanitarian' | 'transition' | 'rights';
type ChoiceText = readonly [title: string, description: string, result: string];

interface WartimeEventSeed {
  id: string;
  nation: NationId;
  year: number;
  category: string;
  title: string;
  briefing: string;
  stakes: string;
  basis: string;
  sourceLabel: string;
  sourceUrl: string;
  pattern: EventPattern;
  choices: readonly [ChoiceText, ChoiceText, ChoiceText];
}

const effectsByPattern: Record<EventPattern, readonly [CouncilChoiceEffect, CouncilChoiceEffect, CouncilChoiceEffect]> = {
  command: [
    { divisionOrganization: 9, divisionSupply: 4, gameDelta: { commandPoints: -5, enemyPressure: -4 }, careerReputation: 5 },
    { divisionOrganization: 5, gameDelta: { commandPoints: 8, intelNetwork: 4, politicalPower: -3 }, careerTrust: 6 },
    { divisionSupply: 7, gameDelta: { stability: 4, enemyPressure: 3, politicalPower: 5 }, careerTrust: -2 },
  ],
  economy: [
    { productionEfficiency: 8, gameDelta: { treasury: -110, factories: 1, stability: -3 }, careerReputation: 5 },
    { productionEfficiency: 4, gameDelta: { treasury: -65, stability: 7, politicalPower: 4 }, careerTrust: 5 },
    { gameDelta: { treasury: 95, stability: -7, enemyPressure: 5, politicalPower: -4 }, careerTrust: -4 },
  ],
  diplomacy: [
    { relationChange: 9, gameDelta: { politicalPower: -7, stability: 3 }, careerReputation: 5 },
    { relationChange: 5, gameDelta: { politicalPower: 8, intelNetwork: 4 }, careerTrust: 6 },
    { relationChange: -6, gameDelta: { warSupport: 7, stability: -4, enemyPressure: 5 }, careerReputation: 3 },
  ],
  resistance: [
    { gameDelta: { intelNetwork: 11, manpower: 90, enemyPressure: 7, stability: -3 }, careerReputation: 7 },
    { gameDelta: { intelNetwork: 7, commandPoints: 6, stability: 5 }, careerTrust: 5 },
    { divisionOrganization: 7, gameDelta: { warSupport: 7, enemyPressure: 10, politicalPower: -5 }, careerReputation: 4 },
  ],
  humanitarian: [
    { gameDelta: { manpower: 120, stability: 9, treasury: -125, warSupport: -2 }, careerReputation: 8 },
    { gameDelta: { manpower: 65, stability: 5, treasury: -70, politicalPower: 4 }, relationChange: 4 },
    { gameDelta: { treasury: 80, stability: -10, enemyPressure: 6, warSupport: -5 }, careerTrust: -5 },
  ],
  transition: [
    { gameDelta: { stability: 9, politicalPower: 8, treasury: -80 }, relationChange: 5, careerReputation: 7 },
    { gameDelta: { stability: 5, politicalPower: 4, intelNetwork: 5 }, relationChange: 8, careerTrust: 5 },
    { gameDelta: { stability: -8, warSupport: 8, politicalPower: 11, enemyPressure: 7 }, relationChange: -5, careerReputation: 3 },
  ],
  rights: [
    { gameDelta: { stability: 8, politicalPower: 6, treasury: -65 }, careerReputation: 8 },
    { gameDelta: { stability: 4, intelNetwork: 6, politicalPower: 3 }, careerTrust: 5 },
    { gameDelta: { stability: -9, warSupport: 5, enemyPressure: 7, politicalPower: -3 }, careerTrust: -5 },
  ],
};

const iwm = 'https://www.iwm.org.uk/history/second-world-war';
const nara = 'https://www.archives.gov/research/military/ww2';
const armyHistory = 'https://history.army.mil/Publications/Publications-Catalog/Publications-by-Number/';
const indiaArchives = 'https://www.nationalarchives.gov.uk/education/resources/indian-independence/';
const koreaArchives = 'https://db.history.go.kr/';

const seeds: WartimeEventSeed[] = [
  {
    id: 'wartime-britain-dunkirk-rearmament', nation: 'britain', year: 1940, category: '영국 · 본토방위', title: '됭케르크 철수 뒤 남은 장비와 병력을 다시 세워야 합니다',
    briefing: '병력 33만여 명은 귀환했지만 중화기·차량·통신장비 대부분을 잃었습니다. 육군은 즉시 재편을, 공군은 본토항공전 우선을, 민방위는 해안과 도시 방어를 요구합니다.',
    stakes: '다음 침공을 막는 속도와 장기 반격군의 질, 제국·연합국 병력에 대한 대우가 동시에 결정됩니다.',
    basis: '1940년 5~6월 다이너모 작전은 33만 명 이상을 구출했지만 영국원정군은 장비 대부분을 프랑스에 남겼고 곧 본토항공전과 침공 위협이 이어졌습니다.', sourceLabel: '제국전쟁박물관 · 됭케르크 철수', sourceUrl: 'https://www.iwm.org.uk/history/what-you-need-to-know-about-the-dunkirk-evacuations', pattern: 'command',
    choices: [
      ['본토방위 사단부터 즉시 재편한다', '귀환병·향토방위대에 가용 소총과 대전차무기를 우선 배정합니다.', '침공 대비선은 빠르게 채워졌지만 숙련병의 휴식과 기계화 재건이 늦어졌습니다.'],
      ['육·해·공 합동 우선순위표를 만든다', '레이더·전투기·해안방어·기동예비대를 하나의 위험표로 조정합니다.', '부처 간 경쟁은 줄었고 제한된 장비가 가장 위험한 축선에 배치됐습니다.'],
      ['반격군의 간부와 장비를 보존한다', '해안의 얇은 방어를 감수하고 정예부대와 기갑생산을 재건합니다.', '당장의 공포는 커졌지만 이후 대륙 복귀에 필요한 지휘·장비 기반이 남았습니다.'],
    ],
  },
  {
    id: 'wartime-britain-welfare-settlement', nation: 'britain', year: 1945, category: '영국 · 전후 사회계약', title: '승전 뒤 배급·주택·고용을 새로운 사회계약으로 바꿔야 합니다',
    briefing: '동원해제 병사, 폭격 피해도시, 여성 노동자와 노동조합은 전전 체제로 돌아가지 않겠다고 말합니다. 재무부는 부채와 외환 부족을 경고합니다.',
    stakes: '보편복지의 범위와 비용, 노동당·보수당·노조의 합의가 전후 정권의 정통성을 좌우합니다.',
    basis: '1942년 베버리지 보고서와 전시 완전고용 경험은 1945년 이후 사회보험·보건·주택·고용정책의 핵심 논쟁이 되었습니다.', sourceLabel: '제국전쟁박물관 · 전시 영국 사회', sourceUrl: iwm, pattern: 'economy',
    choices: [
      ['보편 사회보험과 주택계획을 즉시 시행한다', '국채와 누진조세로 의료·실업·연금·공공주택을 한꺼번에 시작합니다.', '재정 부담은 컸지만 동원해제 충격과 계층 불안을 새로운 시민권으로 흡수했습니다.'],
      ['완전고용부터 단계적으로 보장한다', '산업전환과 직업훈련을 먼저 시행하고 복지 급여는 생산 회복에 맞춰 확대합니다.', '일자리 충격은 줄었고 재정은 버텼지만 즉각적 보편복지를 요구한 세력은 실망했습니다.'],
      ['전시통제를 해제하고 민간회복에 맡긴다', '가격·배급·고용 규제를 빠르게 풀어 기업 투자와 수출을 유도합니다.', '국고는 숨을 돌렸지만 주택·실업·생활비 문제가 선거의 중심 위기로 떠올랐습니다.'],
    ],
  },
  {
    id: 'wartime-usa-fepc', nation: 'usa', year: 1941, category: '미국 · 방위산업과 민권', title: '방위산업 차별에 맞선 대규모 워싱턴 행진이 예고됐습니다',
    briefing: 'A. 필립 랜돌프와 흑인 노동단체는 방위산업·연방기관·군대의 차별 철폐를 요구합니다. 기업과 군은 전시 효율을 이유로 기존 관행을 지키려 합니다.',
    stakes: '군수생산 확대가 시민권 확대와 결합할지, 차별을 유지한 총력전이 될지가 결정됩니다.',
    basis: '1941년 랜돌프의 워싱턴 행진 압박 뒤 루스벨트는 행정명령 8802호로 방위산업 차별을 금지하고 공정고용실천위원회를 설치했습니다.', sourceLabel: '미국 국립문서기록관리청 · 제2차 세계대전 기록', sourceUrl: nara, pattern: 'rights',
    choices: [
      ['강제 조사권을 가진 공정고용위를 만든다', '계약 취소·고용자료 공개·노동자 진정을 연방기관이 직접 집행합니다.', '행진은 철회됐고 숙련인력 진입이 늘었지만 기업·남부 정치권의 저항도 커졌습니다.'],
      ['노조·기업 공동조정위로 타협한다', '지역별 고용목표와 중재절차를 만들되 연방 제재는 최후수단으로 남깁니다.', '생산 차질은 줄었지만 차별 철폐 속도와 지역별 성과는 크게 달랐습니다.'],
      ['행진을 금지하고 기존 계약을 유지한다', '전시 치안과 생산연속성을 이유로 시위를 제한합니다.', '단기 계약은 유지됐지만 군수도시의 파업·갈등과 정부 불신이 확산됐습니다.'],
    ],
  },
  {
    id: 'wartime-usa-bretton-woods', nation: 'usa', year: 1944, category: '미국 · 전후 금융질서', title: '브레턴우즈에서 통화·재건·무역의 규칙을 정해야 합니다',
    briefing: '연합국 대표들은 환율안정과 재건자금에는 동의하지만 의결권, 자본통제, 적자국·흑자국 책임을 두고 맞섭니다.',
    stakes: '전후 세계가 달러 중심 블록, 다자간 조정체계, 지역 통화권 가운데 어디로 흐를지가 달렸습니다.',
    basis: '1944년 브레턴우즈 회의는 국제통화기금과 국제부흥개발은행의 틀을 만들고 고정환율·전후재건 금융질서를 설계했습니다.', sourceLabel: '미국 국립문서기록관리청 · 전후 국제회의 기록', sourceUrl: nara, pattern: 'diplomacy',
    choices: [
      ['다자기금과 재건은행을 넓게 개방한다', '승패와 체제를 가리지 않고 납입·사찰·재건계획 조건으로 참여를 허용합니다.', '교역 회복의 공통규칙은 강해졌지만 국내 의회는 부담과 통제권 상실을 비판했습니다.'],
      ['달러 중심 체제와 단계적 자본통제를 묶는다', '미국의 자금력에 기반하되 각국의 고용·복지정책 공간을 일부 보장합니다.', '안정적인 중심통화가 생겼고 참여국은 환율정책의 상당 부분을 공동규칙에 맡겼습니다.'],
      ['동맹국 재건만 우선하는 금융권을 만든다', '전략동맹과 시장개방을 원조·환율지원의 조건으로 겁니다.', '지원 속도는 빨랐지만 경쟁 통화권과 초기 냉전의 경제경계가 굳어졌습니다.'],
    ],
  },
  {
    id: 'wartime-ussr-factory-evacuation', nation: 'ussr', year: 1941, category: '소련 · 산업소개', title: '서부 공장을 우랄과 시베리아로 옮길 열차가 부족합니다',
    briefing: '기계·기술자·가족·원료가 같은 열차를 요구합니다. 전선은 탄약을, 도시 지도부는 식량을, 산업인민위원부는 설비를 먼저 보내라고 압박합니다.',
    stakes: '오늘의 전선 보급과 몇 달 뒤 생산회복, 소개 노동자의 생존이 서로 충돌합니다.',
    basis: '1941년 독일 침공 뒤 소련은 수많은 공장과 노동자를 동부로 소개해 군수생산을 재건했으며 운송·주거·식량 부족을 겪었습니다.', sourceLabel: '미 육군 군사사센터 · 동부전선 공식 전사', sourceUrl: armyHistory, pattern: 'economy',
    choices: [
      ['핵심 공작기계와 기술자부터 이동시킨다', '완성품보다 생산수단을 우선해 우랄에서 조립라인을 다시 엽니다.', '전선의 단기 부족은 심해졌지만 겨울부터 대량생산 기반이 살아났습니다.'],
      ['노동자 가족·식량과 설비를 함께 이동시킨다', '열차 처리량은 줄어도 주거·배급·보육을 공장계획에 포함합니다.', '재가동은 늦었지만 이탈·질병·숙련손실이 줄어 장기 생산성이 높아졌습니다.'],
      ['전선 완성품 수송을 우선한다', '포위 위기의 부대에 탄약·차량을 보내고 일부 공장은 현지에서 버티게 합니다.', '당장의 방어선은 보강됐지만 점령된 설비와 기술인력 손실이 장기 병목이 됐습니다.'],
    ],
  },
  {
    id: 'wartime-ussr-kursk-reserve', nation: 'ussr', year: 1943, category: '소련 · 쿠르스크 전략', title: '적 공세를 먼저 받아낼지 선제공격할지 결정해야 합니다',
    briefing: '정보기관은 쿠르스크 돌출부 공격 준비를 보고합니다. 전선군은 종심방어와 예비대를, 일부 지휘관은 적 준비가 끝나기 전 공격을 주장합니다.',
    stakes: '정보 신뢰, 전차 예비대의 생존, 철도·민간인의 피해와 전략 주도권이 걸려 있습니다.',
    basis: '1943년 쿠르스크 전투 전 소련군은 독일 공세 정보를 바탕으로 깊은 방어지대와 대규모 예비대를 준비한 뒤 반격했습니다.', sourceLabel: '미 육군 군사사센터 · 제2차 세계대전 전사', sourceUrl: armyHistory, pattern: 'command',
    choices: [
      ['종심방어 뒤 예비대 반격을 준비한다', '지뢰·대전차진지·포병대를 여러 선에 배치하고 기갑예비대를 숨깁니다.', '초기 피해를 견딘 뒤 적의 소모가 확인된 시점에 전략예비대가 투입됐습니다.'],
      ['정보를 공유한 전선군 합동계획을 만든다', '중앙은 목표만 정하고 방어선·포병·항공 배분을 현지 사령관들과 조정합니다.', '명령은 복잡해졌지만 보고 왜곡이 줄고 축선 변화에 빠르게 대응했습니다.'],
      ['공세 집결지를 먼저 타격한다', '항공·포병·기갑군으로 적 준비단계에 주도권을 빼앗습니다.', '일부 집결지를 흔들었지만 예비대가 조기에 노출되어 이후 반격의 충격력은 약해졌습니다.'],
    ],
  },
  {
    id: 'wartime-germany-white-rose', nation: 'germany', year: 1943, category: '독일 · 시민저항', title: '백장미단 전단과 체포자 명단이 전국 대학으로 퍼졌습니다',
    briefing: '학생과 교수 일부는 전쟁범죄와 독재를 비판합니다. 경찰은 공개재판과 연좌수사를 요구하고, 군부저항은 비폭력망을 보호할지 고민합니다.',
    stakes: '공개 반대의 생존, 정권 정통성, 군부·학생·교회 저항세력의 연결 가능성이 달렸습니다.',
    basis: '백장미단은 1942~1943년 뮌헨을 중심으로 반나치 전단을 배포했고 조피·한스 숄 등은 체포되어 처형되었습니다.', sourceLabel: '미국 홀로코스트기념박물관 · White Rose', sourceUrl: 'https://encyclopedia.ushmm.org/content/en/article/white-rose', pattern: 'resistance',
    choices: [
      ['학생들을 빼내 전국 지하출판망으로 분산한다', '위조서류·은신처·인쇄장비를 마련하고 작은 셀로 재편합니다.', '전단은 더 넓게 퍼졌지만 구조에 참여한 군·교회 인맥도 감시 대상이 됐습니다.'],
      ['증거를 보존하고 비밀재판 준비에 연결한다', '당장의 대규모 행동보다 정권범죄·처형명령·책임자 기록을 해외로 보냅니다.', '대중 봉기는 일어나지 않았지만 전후 책임추궁과 정권전환의 도덕적 기반이 커졌습니다.'],
      ['조직을 미끼로 보안기관 내부를 추적한다', '일부 연락선을 노출시켜 게슈타포 지휘망과 정보원을 파악합니다.', '정보는 얻었지만 학생 체포와 처형 위험을 의도적으로 감수한 결정이 저항연합을 분열시켰습니다.'],
    ],
  },
  {
    id: 'wartime-germany-july-plot', nation: 'germany', year: 1944, category: '독일 · 정권전환', title: '발퀴레 작전을 쿠데타가 아닌 헌정전환으로 완성해야 합니다',
    briefing: '군부저항은 수도 장악 계획을 마련했지만 전쟁 종결조건, 강제수용소 해방, 피점령국 배상, 노동·사회민주 세력의 참여에 합의하지 못했습니다.',
    stakes: '거사의 성공뿐 아니라 다음 정부가 또 다른 군사독재가 될지 법치정부가 될지가 결정됩니다.',
    basis: '1944년 7월 20일 암살·쿠데타 시도는 발퀴레 동원계획을 이용했으나 실패했고 군인·민간 저항인사 다수가 처형되었습니다.', sourceLabel: '독일저항기념관 · 1944년 7월 20일', sourceUrl: 'https://www.gdw-berlin.de/en/recess/topics/1-the-attempted-coup-of-july-20-1944/', pattern: 'transition',
    choices: [
      ['민군 과도평의회와 즉시 휴전을 선언한다', '군부·사회민주·교회·노동 대표가 수용소 해방과 국제협상을 공동 승인합니다.', '거사는 느려졌지만 성공 시 새 정부의 법적·사회적 기반이 넓어졌습니다.'],
      ['연합국과 비밀 연락 뒤 동시 행동한다', '휴전 조건과 점령계획을 미리 확인해 전선군의 무의미한 저항을 줄입니다.', '외교적 출구는 생겼지만 통신 누설과 무조건항복 요구가 거사 시점을 흔들었습니다.'],
      ['군 지휘계통만으로 수도를 장악한다', '정치협상을 미루고 통신·친위대·정부청사를 예비군이 즉시 점령합니다.', '초기 속도는 빨랐지만 시민세력과 피점령국은 또 다른 군사정부를 의심했습니다.'],
    ],
  },
  {
    id: 'wartime-japan-munitions-ministry', nation: 'japan', year: 1943, category: '일본 · 군수성 신설', title: '기획원 해체 뒤 군수성이 선박·연료·항공생산을 통합하려 합니다',
    briefing: '해상수송 감소와 육해군 경쟁으로 계획이 무너졌습니다. 새 군수성은 민간기업과 노동배치까지 직접 통제하려 합니다.',
    stakes: '생산통합이 실제 보급 개선으로 이어질지, 강제노동과 부처독점만 확대할지가 달렸습니다.',
    basis: '일본은 1943년 군수성을 설치해 기획원 기능과 군수생산을 통합했지만 해상수송력 저하와 자원부족은 계속 악화되었습니다.', sourceLabel: '일본 국립국회도서관 · 국가총동원', sourceUrl: 'https://www.ndl.go.jp/modern/e/cha4/description19.html', pattern: 'economy',
    choices: [
      ['선박·연료 기준의 현실 생산계획을 세운다', '명목 생산량 대신 실제 수송 가능한 원료와 완성품을 월별로 맞춥니다.', '과장된 목표는 줄었고 호송·정비가 개선됐지만 신규 공세 요구는 축소됐습니다.'],
      ['민간생존선과 군수생산을 공동 배분한다', '식량·비료·철도·주택을 군수계획에 포함하고 강제동원을 제한합니다.', '생산 증가폭은 작았지만 도시기아·질병·노동이탈이 늦춰졌습니다.'],
      ['군수성에 기업·노동 전권을 준다', '사업장·노동자·식민지 자원을 목표량에 따라 강제 재배치합니다.', '표면상 생산은 뛰었지만 강제노동 피해, sabotage, 수송붕괴가 함께 커졌습니다.'],
    ],
  },
  {
    id: 'wartime-japan-surrender-cabinet', nation: 'japan', year: 1945, category: '일본 · 종전결정', title: '항복 조건과 군부 통제권을 놓고 최고회의가 갈라졌습니다',
    briefing: '도시 파괴·해상봉쇄·소련 참전으로 전쟁 지속능력이 무너집니다. 지도부는 국체 보장, 즉시 수락, 본토결전을 놓고 맞섭니다.',
    stakes: '민간인·포로의 생존, 천황제와 전후재판, 군의 명령복종 여부가 한 결정에 걸려 있습니다.',
    basis: '1945년 스즈키 내각과 최고전쟁지도회의는 포츠담선언 수락을 둘러싸고 분열했고 8월 항복 결정과 궁성사건을 겪었습니다.', sourceLabel: '일본 국립국회도서관 · 종전 공작', sourceUrl: 'https://www.ndl.go.jp/modern/e/cha4/description17.html', pattern: 'transition',
    choices: [
      ['포츠담선언을 즉시 수락하고 군을 해체한다', '전 전선에 교전중지·포로보호·문서보존 명령을 동시에 내립니다.', '추가 희생은 줄었고 책임추궁 자료가 남았지만 강경파의 쿠데타 위험이 급상승했습니다.'],
      ['중립국 중재로 황실·점령조건을 확인한다', '항복 의사는 전달하되 통치 연속성과 무장해제 절차를 협상합니다.', '수락 가능성은 높아졌지만 지연되는 동안 도시와 전선의 피해가 계속됐습니다.'],
      ['본토결전 준비로 더 나은 조건을 강요한다', '민간동원·특공·해안방어를 확대해 연합국 손실을 협상수단으로 삼습니다.', '정권 강경파는 결집했지만 기아·공습·침공 위험과 전후 책임이 폭증했습니다.'],
    ],
  },
  {
    id: 'wartime-china-new-fourth-army', nation: 'china', year: 1941, category: '중국 · 국공합작', title: '신사군 사건 뒤 항일 통일전선이 붕괴 직전입니다',
    briefing: '국민정부는 군령 위반을 주장하고 공산당은 포위공격과 정치탄압을 비난합니다. 일본군은 분열된 전선에 공세를 준비합니다.',
    stakes: '항일 공동전선, 각 당의 무장권, 지역 민간인의 안전과 전후 내전 가능성이 동시에 걸려 있습니다.',
    basis: '1941년 신사군 사건은 국민당과 공산당의 군사충돌로 제2차 국공합작을 심각하게 약화시켰습니다.', sourceLabel: '미 육군 군사사센터 · 중국전구 전사', sourceUrl: 'https://history.army.mil/Publications/Publications-Catalog/Stilwells-Mission-to-China/', pattern: 'diplomacy',
    choices: [
      ['중립 조사단과 공동 대일전선을 복구한다', '양측 손실·명령문서를 조사하고 일본군 접촉선에 공동작전구역을 다시 설정합니다.', '정파 선전은 계속됐지만 대일전선의 최소 협조와 포로교환이 재개됐습니다.'],
      ['군령은 분리하고 보급·정보만 공유한다', '부대 통합을 포기하는 대신 일본군 정보와 의료·탄약 통로를 공동 관리합니다.', '상호 침투는 줄었지만 두 개의 군정체제가 전후 경쟁을 준비하기 시작했습니다.'],
      ['상대 무장조직을 강제로 해산한다', '항일보다 국내 통수권 확립을 우선해 봉쇄·체포·선전전을 확대합니다.', '중앙 통제는 강해졌지만 일본군 압력과 내전 준비가 동시에 커졌습니다.'],
    ],
  },
  {
    id: 'wartime-china-chongqing-talks', nation: 'china', year: 1945, category: '중국 · 전후 권력협상', title: '충칭 협상에서 군 통합과 연립정부의 순서를 정해야 합니다',
    briefing: '전쟁은 끝났지만 국민정부와 공산당은 점령지 인수, 철도·도시 통제, 지방정권, 군대 수를 놓고 협상합니다.',
    stakes: '평화협정이 실제 군축과 선거로 이어질지, 시간을 벌기 위한 내전 준비가 될지가 결정됩니다.',
    basis: '1945년 장제스와 마오쩌둥의 충칭 협상은 정치협상과 평화건국 방침을 논의했지만 군사·권력 갈등을 해소하지 못했습니다.', sourceLabel: '미국 국무부 역사문서 · 중국 1945', sourceUrl: 'https://history.state.gov/historicaldocuments/frus1945v07', pattern: 'transition',
    choices: [
      ['비례 과도정부와 단계적 군축을 묶는다', '각 정파·지역·무소속 대표와 공동 감시 아래 부대 등록·감축을 동시에 시작합니다.', '정부 정통성은 넓어졌지만 지휘권 이양 속도를 둘러싼 마찰이 계속됐습니다.'],
      ['미·소·중 공동 휴전감시를 요청한다', '철도·대도시 인수와 접촉선에 국제 연락단을 배치합니다.', '대규모 충돌은 늦춰졌지만 외세가 중국 정치의 중재권을 갖게 됐습니다.'],
      ['전략도시를 먼저 장악한 뒤 협상한다', '수송·항공 지원으로 주력군을 북중국에 이동시켜 유리한 현상을 만듭니다.', '협상력은 높아졌지만 상대도 총동원에 들어가 내전이 빨라졌습니다.'],
    ],
  },
  {
    id: 'wartime-india-bengal-famine', nation: 'india', year: 1943, category: '인도 · 벵골 기근', title: '벵골의 식량가격·수송·배급 붕괴가 대규모 기근으로 번집니다',
    briefing: '전시 수요, 가격폭등, 지방 간 이동제한, 수송 부족과 정책 실패가 겹칩니다. 군·도시·농촌이 같은 쌀과 선박을 요구합니다.',
    stakes: '수백만 민간인의 생존과 식민정부의 정통성, 전시경제의 우선순위가 걸려 있습니다.',
    basis: '1943년 벵골 기근은 전시경제·가격·배급·수송과 행정 실패가 복합된 대규모 인도주의 재난이었습니다.', sourceLabel: '영국 국립문서보관소 · 인도 독립·전시 문서', sourceUrl: indiaArchives, pattern: 'humanitarian',
    choices: [
      ['군 수송을 전환해 보편 배급을 실시한다', '쌀 수입·철도·연안선박을 확보하고 무상급식·가격상한·농촌 배급을 시행합니다.', '전선 수송은 줄었지만 사망과 이주가 급감하고 정부의 생명보호 의무가 확립됐습니다.'],
      ['지역 조달과 이동배급소를 결합한다', '군 창고 일부와 상인 재고를 조사해 가장 위험한 구역부터 배급합니다.', '구호는 빨랐지만 지역별 격차와 투기 단속의 부패가 남았습니다.'],
      ['시장 공급 회복을 기다리며 군 수요를 유지한다', '가격 통제를 최소화하고 상업 유통이 식량을 끌어오도록 둡니다.', '일부 도시 공급은 유지됐지만 구매력 없는 농촌·피난민의 사망이 폭증했습니다.'],
    ],
  },
  {
    id: 'wartime-india-cabinet-mission', nation: 'india', year: 1946, category: '인도 · 헌정과 분할', title: '내각사절단안·해군반란·공동체 갈등이 권력이양을 압박합니다',
    briefing: '국민회의는 강한 중앙을, 무슬림연맹은 집단별 자치와 파키스탄을, 번왕국·달리트·시크 대표는 독자 보장을 요구합니다.',
    stakes: '독립 시점과 국경, 군·철도·재정의 승계, 대규모 이주와 폭력 가능성이 달렸습니다.',
    basis: '1946년 내각사절단은 연방적 통합안을 제안했으나 합의가 무너졌고 해군반란·직접행동일·공동체 폭력이 권력이양을 재촉했습니다.', sourceLabel: '영국 국립문서보관소 · 인도 독립', sourceUrl: indiaArchives, pattern: 'transition',
    choices: [
      ['다층 연방헌법과 소수권 보장을 채택한다', '중앙은 국방·외교·통화만 맡고 주·집단에 광범위 자치와 이탈 재검토권을 줍니다.', '단일국가의 틀은 남았지만 권한분쟁과 헌법 재협상이 상시 정치가 됐습니다.'],
      ['경계위원회·주민투표·난민보호를 먼저 만든다', '분할 가능성을 인정하고 치안·재산·철도·수자원 승계를 공동 관리합니다.', '분리 자체를 막지는 못했지만 국경 발표 전 보호·이동 체계가 준비됐습니다.'],
      ['즉시 중앙정부를 인수하고 반대를 진압한다', '군·통신·철도를 장악한 뒤 헌정 논쟁을 독립 후로 미룹니다.', '권력이양은 빨랐지만 소수지역의 이탈과 공동체 무장화가 가속됐습니다.'],
    ],
  },
  {
    id: 'wartime-france-legitimacy-1940', nation: 'freefrance', year: 1940, category: '프랑스 · 정통성 경쟁', title: '휴전정부와 런던의 자유 프랑스가 제국·함대·관료의 충성을 다툽니다',
    briefing: '본토 패전 뒤 장교·식민총독·외교관·시민은 서로 다른 합법정부를 주장합니다. 영국도 프랑스 함대와 식민지의 향방을 우려합니다.',
    stakes: '자유 프랑스가 개인의 호소를 넘어 국가기관과 대표성을 갖출 수 있는지가 달렸습니다.',
    basis: '1940년 프랑스 휴전과 비시정부 수립 뒤 드골은 런던에서 자유 프랑스를 조직했고 식민지·함대·저항세력의 승인을 확보하려 했습니다.', sourceLabel: '프랑스 국방부 · 기억의 길', sourceUrl: 'https://www.cheminsdememoire.gouv.fr/en', pattern: 'diplomacy',
    choices: [
      ['식민지·정당·노조 대표평의회를 만든다', '군 지휘와 별도로 영토·시민세력 대표가 법령과 전후계획을 심의합니다.', '결정은 느려졌지만 자유 프랑스는 장군 개인이 아닌 대안정부의 모습을 갖췄습니다.'],
      ['연합국의 군사승인을 먼저 확보한다', '함대·기지·병력을 연합작전에 제공하고 물자·방송·외교지위를 받습니다.', '전투능력은 빠르게 늘었지만 영국 의존과 제국정책의 연속성이 논란이 됐습니다.'],
      ['강한 단일지휘로 충성지역을 장악한다', '총독·장교에게 즉시 선택을 요구하고 불응 기관의 자산과 지휘권을 회수합니다.', '지휘선은 선명해졌지만 중립·온건 세력과 일부 식민지의 반발이 커졌습니다.'],
    ],
  },
  {
    id: 'wartime-france-liberation-government', nation: 'freefrance', year: 1944, category: '프랑스 · 해방과 공화국', title: '해방도시의 행정·저항군·협력자 처리를 하나의 공화국으로 묶어야 합니다',
    briefing: '국내저항 평의회, 자유 프랑스 관료, 공산계 파르티잔, 연합군 군정안이 시장·경찰·식량창고·재판소를 두고 경쟁합니다.',
    stakes: '즉결보복을 막으면서 공화국 법통·여성참정권·사회개혁을 얼마나 빠르게 회복할지가 달렸습니다.',
    basis: '1944년 프랑스 해방 과정에서 임시정부는 연합군 군정 대신 프랑스 행정을 복구하고 저항세력 통합·협력자 청산·여성참정권을 추진했습니다.', sourceLabel: '프랑스 국방부 · 해방과 레지스탕스', sourceUrl: 'https://www.cheminsdememoire.gouv.fr/en', pattern: 'transition',
    choices: [
      ['저항평의회 기반 임시 지방정부를 승인한다', '지역 저항대표·법관·노조·여성단체가 시장과 치안책임자를 공동 추천합니다.', '해방의 대중 정통성은 높아졌지만 지역별 행정과 숙청 기준이 달라졌습니다.'],
      ['중앙 파견관과 적법재판으로 통일한다', '공화국 법령·배급·경찰·재판 절차를 전국 동일 기준으로 복구합니다.', '보복은 줄고 행정은 안정됐지만 일부 저항세력은 혁명적 개혁이 봉쇄됐다고 느꼈습니다.'],
      ['군사비상통치를 유지한다', '무장해제·치안·보급이 끝날 때까지 군과 정보기관이 행정을 직접 맡습니다.', '혼란은 빠르게 억제됐지만 선거·시민권·저항세력의 정치참여가 늦어졌습니다.'],
    ],
  },
  {
    id: 'wartime-italy-armistice', nation: 'italy', year: 1943, category: '이탈리아 · 휴전과 내전', title: '휴전 발표 뒤 왕실·군·저항세력의 명령선이 붕괴했습니다',
    briefing: '독일군은 요충지를 장악하고 병사들은 명령 없이 흩어집니다. 왕실정부, 사회공화국, 파르티잔, 연합군이 서로 다른 합법성을 주장합니다.',
    stakes: '군 포로화·민간인 보복·영토 분단을 줄이고 새 정부의 책임을 정해야 합니다.',
    basis: '1943년 9월 휴전 발표 뒤 이탈리아군 지휘체계가 붕괴했고 독일 점령, 이탈리아 사회공화국, 연합국 측 공동교전군과 레지스탕스가 충돌했습니다.', sourceLabel: '트레카니 · 1943년 이탈리아', sourceUrl: 'https://www.treccani.it/enciclopedia/8-settembre_%28Enciclopedia-Italiana%29/', pattern: 'command',
    choices: [
      ['전군에 독일군 저항·민간보호 명령을 방송한다', '부대별 철수로·연합군 접촉·무기고 파괴·포로보호 지침을 즉시 보냅니다.', '일부 부대는 조직적으로 저항했고 포로화는 줄었지만 독일군 보복도 거세졌습니다.'],
      ['지역 CLN과 군 지휘부를 결합한다', '정규군 장교·파르티잔·시장에게 지역방위와 식량보호를 공동 위임합니다.', '명령은 복잡했지만 해산 병력과 시민저항이 하나의 방어망으로 묶였습니다.'],
      ['왕실정부와 정예부대의 남부 철수를 우선한다', '정부 연속성과 연합군 협상을 위해 수도·북부 부대의 희생을 감수합니다.', '합법정부는 살아남았지만 버려진 병사·도시의 분노가 군주제 정통성을 무너뜨렸습니다.'],
    ],
  },
  {
    id: 'wartime-italy-republic-referendum', nation: 'italy', year: 1946, category: '이탈리아 · 공화국 선택', title: '군주제 국민투표와 제헌의회 결과를 새 국가질서로 확정해야 합니다',
    briefing: '지역별 투표차, 파시즘 책임, 여성의 첫 전국투표, 군주파 불복 가능성이 맞물립니다.',
    stakes: '왕실 승계가 아니라 선거결과·제헌절차·지역통합이 국가 정통성의 기준이 될 수 있는지가 달렸습니다.',
    basis: '1946년 이탈리아 국민투표에서 공화국이 선택됐고 여성도 전국 선거에 참여했으며 제헌의회가 새 헌법을 작성했습니다.', sourceLabel: '트레카니 · 이탈리아 공화국', sourceUrl: 'https://www.treccani.it/enciclopedia/repubblica-italiana/', pattern: 'rights',
    choices: [
      ['개표 공개·사법심사 뒤 공화국을 선포한다', '지역별 원자료와 이의절차를 공개하고 왕실의 평화적 퇴진을 보장합니다.', '결과 수용은 넓어졌고 새 헌법의 권위가 투명한 절차에서 출발했습니다.'],
      ['지역자치 타협과 함께 결과를 시행한다', '군주제 지지가 높은 남부에 재정·행정 자치와 상원대표를 보장합니다.', '분리 불안은 줄었지만 중앙집권 개혁과 토지정책은 느려졌습니다.'],
      ['질서를 이유로 결과 확정을 연기한다', '군·경 비상통치 아래 왕실·정당 협상을 계속합니다.', '즉각 충돌은 미뤘지만 투표 불복과 쿠데타 소문이 새 국가의 첫 기억이 됐습니다.'],
    ],
  },
  {
    id: 'wartime-korea-liberation-army', nation: 'korea', year: 1940, category: '한국 · 광복군 창설', title: '한국광복군의 군령·재정·부대편제를 실제 군대로 만들어야 합니다',
    briefing: '임시정부는 총사령부를 세웠지만 중국 군사위원회 승인, 무기·급양, 각 독립군·의용대 계열의 보직 배분이 해결되지 않았습니다.',
    stakes: '상징적 군대에 머물지, 연합작전과 국내진공을 수행할 통합군이 될지가 결정됩니다.',
    basis: '한국광복군은 1940년 충칭에서 창설됐고 1942년 조선의용대 일부가 편입되며 지대 편제와 부사령 직제가 재조정되었습니다.', sourceLabel: '국사편찬위원회 · 한국광복군 자료집', sourceUrl: 'https://db.history.go.kr/item/level.do?levelId=ij_011_%241exp', pattern: 'command',
    choices: [
      ['독립운동 계열별 지대를 통합 편성한다', '출신조직의 지분을 인정하되 군령·급양·교육은 총사령부 기준으로 통일합니다.', '오랜 경쟁은 남았지만 각 계열이 이름과 지위를 잃지 않고 하나의 작전체계에 들어왔습니다.'],
      ['중국군·연합국과 합동지원협정을 맺는다', '무기·훈련·무전 지원을 받고 작전승인·연락장교 규칙을 문서화합니다.', '실전능력은 높아졌지만 독자 군령과 국내정치 대표권을 놓고 새 협상이 필요해졌습니다.'],
      ['국내진공 정예대부터 비밀 양성한다', '소수 요원을 무전·낙하·정보·파괴공작에 집중시키고 대규모 편성은 미룹니다.', '침투능력은 빠르게 생겼지만 광범위한 독립군 통합과 대중적 상징성은 약해졌습니다.'],
    ],
  },
  {
    id: 'wartime-korea-liberation-transition', nation: 'korea', year: 1945, category: '한국 · 해방과 통일정부', title: '해방 뒤 행정권·치안·신탁통치·귀환세력의 대표성을 정해야 합니다',
    briefing: '국내 건국준비조직, 임시정부, 좌우 정당, 해외군정, 친일 관료와 지역 인민위원회가 서로 다른 권한을 주장합니다.',
    stakes: '분단선이 국가경계가 될지, 통합 선거·과도정부·청산 절차로 이어질지가 결정됩니다.',
    basis: '1945년 해방 뒤 미·소 점령, 임시정부 미승인, 건국준비위원회와 인민위원회, 신탁통치 논쟁이 한반도의 권력구조를 갈라놓았습니다.', sourceLabel: '국사편찬위원회 · 해방 직후 정치사 자료', sourceUrl: koreaArchives, pattern: 'transition',
    choices: [
      ['좌우·임정·지역대표 통합 과도정부를 구성한다', '친일청산·치안통합·토지·선거법을 합의할 때까지 단독정부 수립을 금지합니다.', '협상은 느렸지만 각 지역 조직을 국가제도 안으로 들이는 통로가 생겼습니다.'],
      ['국제 공동위원회와 전국총선 일정을 묶는다', '점령군 철수·정당등록·언론자유·국제감시 선거를 하나의 시간표로 제안합니다.', '외세 중재 의존은 커졌지만 분단을 확정하기 전 검증 가능한 정치절차가 마련됐습니다.'],
      ['점령지역별 행정을 먼저 장악한다', '치안·관료·재정을 신속히 접수하고 상대지역과의 협상은 뒤로 미룹니다.', '행정공백은 줄었지만 두 체제가 각자 군대·화폐·선거를 만들며 분단이 굳어졌습니다.'],
    ],
  },
  {
    id: 'wartime-vietnam-famine-1945', nation: 'vietnam', year: 1945, category: '베트남 · 기근과 권력붕괴', title: '북부 기근 속 일본·프랑스 행정과 곡물창고 통제가 무너집니다',
    briefing: '쌀 징발, 수송 단절, 전시작물 전환과 자연재해가 겹쳐 굶주림이 확산됩니다. 베트민은 창고 개방과 구호조직을 요구합니다.',
    stakes: '민간 생존과 혁명 정통성, 지방행정의 충성, 폭력적 징발의 확산이 걸려 있습니다.',
    basis: '1944~1945년 베트남 북부의 대기근은 점령·식민 전시정책, 수송장애와 작황 악화가 겹쳐 막대한 인명피해를 냈습니다.', sourceLabel: '호찌민박물관 · 1945년 혁명사 자료', sourceUrl: 'https://baotanghochiminh.vn/', pattern: 'humanitarian',
    choices: [
      ['군·지주 창고를 등록해 무상배급한다', '지역 구호위원회가 재고·필요인구·수송로를 공개하고 취약층부터 배급합니다.', '기근 사망은 줄고 새 행정의 신뢰가 높아졌지만 무장세력과 지주의 반격도 커졌습니다.'],
      ['시장·사찰·마을망과 협정배급을 만든다', '강제몰수 대신 고정가격 매입과 지역별 공동부엌을 지원합니다.', '폭력은 줄었지만 재고 은닉과 지역 격차를 완전히 막지는 못했습니다.'],
      ['군량과 봉기 준비를 우선한다', '전략거점의 식량을 보존하고 기근 지역 주민을 조직·징집합니다.', '무장력은 늘었지만 굶주림을 동원에 이용했다는 기억이 새 정부의 정통성을 훼손했습니다.'],
    ],
  },
  {
    id: 'wartime-vietnam-august-revolution', nation: 'vietnam', year: 1945, category: '베트남 · 8월혁명', title: '권력공백 속 독립선언과 전국 행정접수를 어떤 순서로 진행할지 정해야 합니다',
    briefing: '일본 항복 뒤 기존 관료, 바오다이 조정, 베트민, 종교·민족주의 단체, 중국·영국·프랑스군이 각 지역에 접근합니다.',
    stakes: '독립정부의 대표성, 무장세력 통합, 외국군 진주와 프랑스 복귀 대응이 결정됩니다.',
    basis: '1945년 8월 일본 항복 뒤 베트민이 권력을 장악하고 9월 독립을 선언했으나 중국·영국군 진주와 프랑스의 복귀가 이어졌습니다.', sourceLabel: '호찌민박물관 · 8월혁명 자료', sourceUrl: 'https://baotanghochiminh.vn/', pattern: 'transition',
    choices: [
      ['광범위 연립정부와 제헌선거를 먼저 발표한다', '베트민 외 민족주의·종교·지역 대표에게 임시의석과 선거일정을 보장합니다.', '정부 장악 속도는 느려졌지만 독립선언의 국내외 대표성이 넓어졌습니다.'],
      ['중국·영국군과 철수·군축 협정을 맺는다', '지역별 치안공동위와 외국군 철수일정을 교환해 프랑스 복귀를 지연시킵니다.', '외교 공간은 생겼지만 외세와 국내 경쟁정파에 양보한 권한이 많아졌습니다.'],
      ['핵심도시·무기고를 선점한다', '인민위원회와 무장대를 동원해 행정·통신·군 시설을 즉시 접수합니다.', '주도권은 확보했지만 경쟁정파 숙청과 외국군 충돌 위험이 급격히 커졌습니다.'],
    ],
  },
  {
    id: 'wartime-indonesia-proclamation', nation: 'indonesia', year: 1945, category: '인도네시아 · 독립선언', title: '일본 항복과 청년파 압박 속 독립선언의 주체와 시점을 정해야 합니다',
    briefing: '청년파는 즉시 독자선언을, 기존 지도부는 전국 대표기관과 일본군 충돌 방지를 요구합니다. 연합군·네덜란드군의 귀환도 임박했습니다.',
    stakes: '선언의 정통성, 무기·행정 접수, 점령협력 책임과 혁명전쟁의 범위가 결정됩니다.',
    basis: '1945년 8월 17일 수카르노와 하타가 인도네시아 독립을 선언했고 곧 행정·군대 창설과 네덜란드 복귀에 맞선 전쟁이 이어졌습니다.', sourceLabel: '인도네시아 국가기록원 · 기관 역사', sourceUrl: 'https://www.anri.go.id/en/profile/history', pattern: 'transition',
    choices: [
      ['전국대표 준비위원회 이름으로 즉시 선언한다', '청년·이슬람·지역·여성 대표를 추가하고 일본기관과 분리된 문서로 선포합니다.', '선언의 폭은 넓어졌고 지방 접수조직이 생겼지만 합의 과정에서 하루하루의 주도권 경쟁이 치열했습니다.'],
      ['연합국에 독립·질서유지 계획을 함께 통보한다', '포로보호·일본군 무장해제·선거일정을 제시해 국제승인을 얻습니다.', '외교적 명분은 커졌지만 급진 청년파는 혁명이 외세 승인에 종속됐다고 반발했습니다.'],
      ['청년무장대가 먼저 방송국과 무기고를 장악한다', '기성지도부의 승인 전 혁명위원회가 전국에 독립과 총동원을 선포합니다.', '주도권은 빨랐지만 일본군·연합군·지역세력과의 무력충돌이 폭발했습니다.'],
    ],
  },
  {
    id: 'wartime-indonesia-round-table', nation: 'indonesia', year: 1949, category: '인도네시아 · 주권이양', title: '헤이그 원탁회의의 연방·부채·서뉴기니 조건을 받아들일지 결정해야 합니다',
    briefing: '네덜란드는 연방제와 식민부채 승계를, 공화국은 실질 주권과 군 통합을 요구합니다. 지역 연방국의 대표성도 논쟁입니다.',
    stakes: '전쟁을 끝내는 속도와 경제주권, 군도 통합, 미해결 영토분쟁의 장기 비용이 달렸습니다.',
    basis: '1949년 네덜란드-인도네시아 원탁회의는 인도네시아 합중국으로의 주권이양, 부채·연방·군 문제를 합의했으나 서뉴기니 문제를 남겼습니다.', sourceLabel: '인도네시아 국가기록원 · 1945~1949 독립기록', sourceUrl: 'https://www.anri.go.id/en/profile/history', pattern: 'diplomacy',
    choices: [
      ['단계적 부채조정과 연방 해체권을 명시한다', '주권이양 뒤 주민의회가 연방 잔류를 재표결하고 식민부채를 회계감사합니다.', '전쟁은 끝났고 통합의 법적 길도 남았지만 채권·지역정부와 긴 협상이 시작됐습니다.'],
      ['국제보증 아래 타협안을 수락한다', '유엔 감시, 군 철수, 교역·통화 안정과 영토 후속협상을 묶습니다.', '주권은 빨리 확보됐지만 국제기구와 공여국이 이행과정에 큰 영향력을 갖게 됐습니다.'],
      ['완전한 단일국가와 부채거부를 고수한다', '군사·경제 압박을 계속해 연방제·식민부채·영토유보를 모두 거부합니다.', '혁명 원칙은 지켰지만 전쟁·봉쇄·지역분리 위험과 국제승인 지연이 이어졌습니다.'],
    ],
  },
  {
    id: 'wartime-philippines-government-evacuation', nation: 'philippines', year: 1941, category: '필리핀 · 정부와 바탄', title: '마닐라 철수 뒤 정부·군·금고·민간 행정을 어디에 남길지 정해야 합니다',
    briefing: '군은 바탄 집중을, 정부는 헌정승계와 문서·금 준비를, 지방관은 시민 식량·치안을 요구합니다.',
    stakes: '망명정부의 생존과 국내 저항의 정통성, 바탄의 전투지속, 점령지 민간인 보호가 걸려 있습니다.',
    basis: '1941~1942년 일본 침공 뒤 필리핀 자치령 정부는 코레히도르를 거쳐 미국으로 이동했고 USAFFE는 바탄·코레히도르에서 저항했습니다.', sourceLabel: '필리핀 관보 · 제2차 세계대전', sourceUrl: 'https://www.officialgazette.gov.ph/featured/world-war-ii-in-the-philippines/', pattern: 'command',
    choices: [
      ['헌정승계팀과 무전망을 국내에 분산한다', '정부 핵심은 철수하되 판사·지방관·군 연락관이 비밀 행정망을 유지합니다.', '망명정부와 국내 저항의 연결은 살아남았지만 잔류 인원은 체포·보복 위험에 놓였습니다.'],
      ['바탄 방어에 모든 수송·비축을 집중한다', '정부자산과 차량을 군에 넘기고 민간 소개보다 전투지속을 우선합니다.', '방어기간은 늘었지만 피난민·도시 배급과 전후 정부기록의 손실이 커졌습니다.'],
      ['정부·금·기록의 안전한 해외철수를 우선한다', '정권 연속성과 미국 원조 확보를 위해 고위지도부와 자산을 먼저 이동합니다.', '국제대표는 보존됐지만 국내에 남은 군인과 시민은 버려졌다는 감정을 품었습니다.'],
    ],
  },
  {
    id: 'wartime-philippines-independence-trade', nation: 'philippines', year: 1946, category: '필리핀 · 독립과 경제주권', title: '독립 직후 미국 원조·무역특혜·기지권과 국내 재건을 맞바꿀지 결정해야 합니다',
    briefing: '전쟁피해 복구에는 자금이 필요하지만 무역·통화·토지·군사기지 조건이 경제주권을 제한할 수 있습니다. 게릴라 인정과 협력자 처리도 미해결입니다.',
    stakes: '빠른 재건, 농지·산업의 소유구조, 대미동맹과 독립국의 실질 주권이 달렸습니다.',
    basis: '1946년 필리핀 독립 뒤 재건원조와 Bell Trade Act, 미국 기지·군사협정, 협력자와 게릴라 처리가 핵심 정치쟁점이 되었습니다.', sourceLabel: '필리핀 관보 · 독립과 전후정부 기록', sourceUrl: 'https://www.officialgazette.gov.ph/featured/philippine-independence/', pattern: 'economy',
    choices: [
      ['원조는 받되 상호권리·기지조항을 재협상한다', '회계감사·현지조달·기한부 기지·산업보호 조건을 붙입니다.', '재건은 시작됐고 일부 주권 제한은 줄었지만 원조 승인과 지급이 늦어졌습니다.'],
      ['농지·게릴라 보상과 재건기금을 결합한다', '대외원조를 토지개혁·참전인정·지방 인프라에 우선 배정합니다.', '농촌 불만과 무장갈등은 줄었지만 도시 기업과 지주·해외투자자의 반발이 커졌습니다.'],
      ['무역특혜와 기지권을 전면 수락한다', '즉시 자금·시장 접근·안보보장을 얻고 국내 개혁은 성장 뒤로 미룹니다.', '수출·복구는 빨랐지만 산업편중·토지갈등과 대외의존이 새 국가구조에 고착됐습니다.'],
    ],
  },
];

function materialize(seed: WartimeEventSeed): CouncilEvent {
  const effects = effectsByPattern[seed.pattern];
  return {
    id: seed.id,
    nationIds: [seed.nation],
    historicalYear: seed.year,
    category: seed.category,
    title: seed.title,
    briefing: seed.briefing,
    stakes: seed.stakes,
    historicalBasis: seed.basis,
    sourceLabel: seed.sourceLabel,
    sourceUrl: seed.sourceUrl,
    choices: seed.choices.map((choice, index) => ({
      id: `${seed.id}-${index + 1}`,
      title: choice[0],
      description: choice[1],
      result: choice[2],
      effect: effects[index],
    })) as CouncilEvent['choices'],
  };
}

export const wartimeCouncilEvents: CouncilEvent[] = seeds.map(materialize);

export const wartimeCouncilEventCoverage = wartimeCouncilEvents.reduce<Record<NationId, number>>((coverage, event) => {
  event.nationIds?.forEach((nationId) => { coverage[nationId] += 1; });
  return coverage;
}, {
  britain: 0, usa: 0, ussr: 0, germany: 0, japan: 0, china: 0, india: 0,
  freefrance: 0, italy: 0, korea: 0, vietnam: 0, indonesia: 0, philippines: 0,
});
