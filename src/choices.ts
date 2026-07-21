import type { CareerBranch, CouncilEvent, NationId, StrategicPolicy } from './types';
import { historicalCouncilEvents } from './historicalCouncilEvents';
import { wartimeCouncilEvents } from './wartimeCouncilEvents';

export const strategicPolicies: StrategicPolicy[] = [
  { id: 'economy-mass', domain: 'economy', title: '대량생산 체제', description: '소수 표준 장비를 거대한 조립라인에서 생산합니다.', effect: '생산량 +15% · 안정도 -3', productionMultiplier: 1.15, gameDelta: { factories: 4, stability: -3 } },
  { id: 'economy-distributed', domain: 'economy', title: '분산 병기공장', description: '지역 작업장과 민간업체를 군수망에 편입합니다.', effect: '공장 +2 · 적 압력 -4', productionMultiplier: 1.07, gameDelta: { factories: 2, enemyPressure: -4 } },
  { id: 'economy-balanced', domain: 'economy', title: '전시 민생 균형', description: '군수 확장과 배급·민간 소비를 함께 유지합니다.', effect: '안정도 +8 · 재정 +120M', gameDelta: { stability: 8, treasury: 120 } },

  { id: 'doctrine-firepower', domain: 'doctrine', title: '압도적 화력', description: '포병·항공·준비사격으로 전투를 설계합니다.', effect: '공격 보정 +9 · 연료 -10K', attackBonus: 9, gameDelta: { fuel: -10 } },
  { id: 'doctrine-maneuver', domain: 'doctrine', title: '종심 기동전', description: '돌파부대와 예비대를 이용해 전선의 균형을 무너뜨립니다.', effect: '공격 +6 · 지휘점수 +12', attackBonus: 6, supplyRecovery: 2, gameDelta: { commandPoints: 12 } },
  { id: 'doctrine-defense', domain: 'doctrine', title: '탄력적 종심방어', description: '전초선보다 예비대와 반격 지점을 중시합니다.', effect: '방어 보정 +13 · 전쟁 지지 +3', defenseBonus: 13, gameDelta: { warSupport: 3 } },

  { id: 'society-mobilization', domain: 'society', title: '국민 총동원', description: '노동·징병·수송을 국가가 직접 배치합니다.', effect: '인력 +260K · 안정도 -7', gameDelta: { manpower: 260, stability: -7, warSupport: 4 } },
  { id: 'society-welfare', domain: 'society', title: '전시 사회협약', description: '가족수당과 부상병 지원으로 장기전의 동의를 얻습니다.', effect: '안정도 +10 · 재정 -160M', supplyRecovery: 1, gameDelta: { stability: 10, treasury: -160 } },
  { id: 'society-autonomy', domain: 'society', title: '지역 자치 동원', description: '지역정부가 병력과 생산 목표를 자율적으로 달성합니다.', effect: '인력 +120K · 정치력 +14', gameDelta: { manpower: 120, politicalPower: 14 } },

  { id: 'diplomacy-bloc', domain: 'diplomacy', title: '폐쇄적 세력권', description: '자원과 안보를 동맹 내부에만 집중합니다.', effect: '전쟁 지지 +8 · 적 압력 +5', defenseBonus: 4, gameDelta: { warSupport: 8, enemyPressure: 5 } },
  { id: 'diplomacy-aid', domain: 'diplomacy', title: '상호원조 네트워크', description: '무기·기지·정보를 교환하는 다자 체제를 만듭니다.', effect: '정보망 +10 · 해상통제 +6', gameDelta: { intelNetwork: 10, navalPower: 6, treasury: -90 } },
  { id: 'diplomacy-pragmatic', domain: 'diplomacy', title: '실용적 협상', description: '중립국과 적대 세력의 틈을 이용해 전선을 줄입니다.', effect: '적 압력 -10 · 정치력 +8', gameDelta: { enemyPressure: -10, politicalPower: 8 } },
];

const recurringCouncilEvents: CouncilEvent[] = [
  {
    id: 'supply-crisis', category: '군수 위기', title: '전선 보급이 72시간 안에 끊깁니다', stakes: '부대 전력과 민간 안정 중 무엇을 먼저 지킬지 결정해야 합니다.',
    briefing: '수송선 손실과 철도 파괴가 겹쳤습니다. 군수총감은 현 비축량으로 모든 전선을 유지할 수 없다고 보고합니다.',
    choices: [
      { id: 'supply-front', title: '전선에 전부 보낸다', description: '민간 배급과 예비대 물자를 현역 부대에 우선 투입합니다.', result: '전선은 버텼지만 국내 불만과 비축량 부족이 커졌습니다.', effect: { divisionSupply: 14, gameDelta: { stability: -6, fuel: -12 } } },
      { id: 'supply-ration', title: '전선을 선별한다', description: '핵심 부대만 유지하고 나머지 전선은 계획적으로 후퇴합니다.', result: '핵심 부대의 조직력은 유지됐지만 적이 압박을 강화했습니다.', effect: { divisionSupply: 6, divisionOrganization: 5, gameDelta: { enemyPressure: 7 } } },
      { id: 'supply-allies', title: '동맹에 긴급 요청한다', description: '정치적 양보를 감수하고 수송·연료 지원을 요청합니다.', result: '지원 선단이 도착했고 동맹은 더 큰 발언권을 요구합니다.', effect: { divisionSupply: 9, relationChange: 7, gameDelta: { politicalPower: -10, fuel: 10 } } },
    ],
  },
  {
    id: 'command-rivalry', category: '인사 위기', title: '두 지휘관이 공개적으로 충돌했습니다', stakes: '누구를 지지하느냐에 따라 장교단과 작전 속도가 달라집니다.',
    briefing: '공세 방식과 보급 우선순위를 두고 야전 지휘관들이 명령 집행을 거부할 정도로 대립하고 있습니다.',
    choices: [
      { id: 'command-aggressive', title: '공세파를 지지한다', description: '속도와 결단을 중시하는 지휘관에게 전권을 줍니다.', result: '공세 준비는 빨라졌지만 방어 참모들이 소외됐습니다.', effect: { divisionOrganization: 8, careerReputation: 5, gameDelta: { commandPoints: 10, stability: -3 } } },
      { id: 'command-mediate', title: '합동 계획을 강제한다', description: '양측 참모를 한 계획단으로 묶고 책임을 공동으로 지게 합니다.', result: '결정은 늦었지만 장교단의 분열을 막았습니다.', effect: { divisionOrganization: 4, careerTrust: 7, gameDelta: { politicalPower: -5 } } },
      { id: 'command-dismiss', title: '둘 다 해임한다', description: '지휘 체계를 흔든 책임을 묻고 새로운 세대를 발탁합니다.', result: '충격적인 인사로 조직은 긴장했지만 당신의 권위는 분명해졌습니다.', effect: { careerReputation: 10, careerTrust: -5, gameDelta: { commandPoints: -6, stability: 2 } } },
    ],
  },
  {
    id: 'occupied-government', category: '정치 위기', title: '점령지 대표들이 자치정부를 요구합니다', stakes: '단기 통제력과 장기 협력 가능성이 충돌합니다.',
    briefing: '지역 행정관과 저항조직 일부가 치안·징병 협조를 조건으로 실질적인 자치권을 요구했습니다.',
    choices: [
      { id: 'occupation-autonomy', title: '자치협정을 체결한다', description: '지역 의회와 자체 치안대를 인정합니다.', result: '지역 협조와 정보가 늘었지만 중앙 강경파가 반발했습니다.', effect: { relationChange: 9, careerTrust: -3, gameDelta: { stability: 7, intelNetwork: 6 } } },
      { id: 'occupation-military', title: '군정을 강화한다', description: '행정·식량·노동을 군 지휘부가 직접 통제합니다.', result: '자원 징발은 늘었지만 저항 활동도 격화됐습니다.', effect: { productionEfficiency: 6, enemyTerritorySupply: -8, gameDelta: { factories: 2, enemyPressure: 6 } } },
      { id: 'occupation-coalition', title: '연립행정부를 만든다', description: '지역 온건파와 망명 인사를 함께 참여시킵니다.', result: '불완전하지만 전후 체제의 실험이 시작됐습니다.', effect: { relationChange: 5, careerReputation: 5, gameDelta: { politicalPower: 8, stability: 3 } } },
    ],
  },
  {
    id: 'wonder-weapon', category: '기술 선택', title: '시제 무기가 시험을 통과했습니다', stakes: '품질·수량·실험 중 하나에 산업 역량을 집중할 수 있습니다.',
    briefing: '무기조달국은 신형 장비를 제한 생산할지, 단순화해 대량 생산할지, 더 위험한 개량형으로 밀어붙일지 묻습니다.',
    choices: [
      { id: 'weapon-quality', title: '정예부대에 우선 배치', description: '소량의 완성도 높은 장비를 핵심 편제에 집중합니다.', result: '핵심 편제의 화력과 사기가 크게 향상됐습니다.', effect: { divisionOrganization: 7, productionEfficiency: 2, gameDelta: { steel: -12 } } },
      { id: 'weapon-mass', title: '설계를 단순화한다', description: '성능 일부를 포기하고 모든 공장에서 생산합니다.', result: '장비 수량은 빠르게 늘었지만 현장 불량 보고도 증가했습니다.', effect: { productionEfficiency: 10, gameDelta: { factories: 2, stability: -2 } } },
      { id: 'weapon-experimental', title: '차세대형으로 재설계', description: '즉시 배치를 미루고 기술적 도약에 투자합니다.', result: '당장의 전력은 늘지 않았지만 연구진이 획기적인 자료를 확보했습니다.', effect: { careerReputation: 4, gameDelta: { airPower: 7, intelNetwork: 5, treasury: -140 } } },
    ],
  },
  {
    id: 'peace-feeler', category: '외교 위기', title: '적대국 내부에서 비밀 접촉이 왔습니다', stakes: '전쟁 단축 가능성과 동맹의 신뢰가 동시에 걸려 있습니다.',
    briefing: '상대 정부의 비공식 대표가 제한적 휴전과 세력권 재협상을 제안했습니다. 진위는 확실하지 않습니다.',
    choices: [
      { id: 'peace-reject', title: '접촉을 거부한다', description: '승리 외의 타협은 없다는 입장을 공개합니다.', result: '국내 결속은 강해졌지만 전쟁은 더 격렬해졌습니다.', effect: { careerTrust: 6, gameDelta: { warSupport: 8, enemyPressure: 7 } } },
      { id: 'peace-secret', title: '비밀 협상을 탐색한다', description: '정보기관을 통해 조건과 상대 파벌을 조사합니다.', result: '적 내부 분열을 확인했고 일부 전선의 압력이 줄었습니다.', effect: { careerReputation: 3, gameDelta: { intelNetwork: 9, enemyPressure: -8, politicalPower: -5 } } },
      { id: 'peace-expose', title: '제안을 공개한다', description: '적의 약점을 선전하고 동맹과 정보를 공유합니다.', result: '적 지도부가 흔들렸고 동맹국과의 신뢰가 높아졌습니다.', effect: { relationChange: 8, gameDelta: { warSupport: 4, enemyPressure: -3 } } },
    ],
  },
  {
    id: 'labor-unrest', category: '사회 위기', title: '군수산업 노동자들이 파업을 예고했습니다', stakes: '생산량과 사회적 정당성, 국가 통제력 사이의 선택입니다.',
    briefing: '장시간 노동과 배급 악화로 주요 공장 노동자들이 임금·휴식·대표권을 요구하고 있습니다.',
    choices: [
      { id: 'labor-force', title: '전시복무령을 발동한다', description: '파업 지도부를 체포하고 노동을 군 복무로 전환합니다.', result: '생산은 유지됐지만 사회의 긴장이 위험 수준으로 높아졌습니다.', effect: { productionEfficiency: 8, gameDelta: { stability: -9, warSupport: -4 } } },
      { id: 'labor-deal', title: '전시 임금협약을 맺는다', description: '생산 목표와 임금·휴식 조건을 함께 보장합니다.', result: '비용은 들었지만 생산성과 장기 안정이 높아졌습니다.', effect: { productionEfficiency: 4, careerTrust: 4, gameDelta: { treasury: -170, stability: 8 } } },
      { id: 'labor-councils', title: '공장위원회에 맡긴다', description: '현장 위원회가 교대·배급·생산 계획을 직접 조정합니다.', result: '예상 밖의 혁신이 나왔지만 관료 조직은 권한 상실을 우려합니다.', effect: { productionEfficiency: 6, careerReputation: 7, careerTrust: -3, gameDelta: { politicalPower: 10 } } },
    ],
  },
];

export const councilEvents: CouncilEvent[] = [...recurringCouncilEvents, ...historicalCouncilEvents, ...wartimeCouncilEvents];

export function getEligibleCouncilEvents(nationId: NationId, roleBranch: CareerBranch, campaignYear: number) {
  return councilEvents
    .filter((event) => (!event.nationIds || event.nationIds.includes(nationId)))
    .filter((event) => (!event.roleBranches || event.roleBranches.includes(roleBranch)))
    .filter((event) => (!event.historicalYear || event.historicalYear <= campaignYear))
    .sort((left, right) => {
      const leftNational = left.nationIds?.includes(nationId) ? 0 : 1;
      const rightNational = right.nationIds?.includes(nationId) ? 0 : 1;
      return leftNational - rightNational
        || (left.historicalYear ?? Number.MAX_SAFE_INTEGER) - (right.historicalYear ?? Number.MAX_SAFE_INTEGER)
        || left.id.localeCompare(right.id);
    });
}

export const policyDomains = [
  { id: 'economy' as const, title: '전시 경제', subtitle: '생산과 민생' },
  { id: 'doctrine' as const, title: '군사 교리', subtitle: '전투 흐름' },
  { id: 'society' as const, title: '국가 동원', subtitle: '인력과 안정' },
  { id: 'diplomacy' as const, title: '세계 질서', subtitle: '동맹과 휴전' },
];
