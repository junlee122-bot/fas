import { getCivilianOrigin, getCivilianProfession } from './civilianCareer';
import type { RoleAccessMode, RoleTabMandate } from './roleMandate';
import type { CareerRole, CivilianCareerState, GameTab } from './types';

export type PlayGuideGroup = 'people' | 'operations' | 'state' | 'development';

export interface PlayGuideCapability {
  id: GameTab;
  group: PlayGuideGroup;
  title: string;
  description: string;
  result: string;
  mode: RoleAccessMode;
  accessLabel: string;
  actionLabel: string;
  reason: string;
}

export interface PlayGuide {
  roleSummary: string;
  firstAction: {
    tab: GameTab;
    title: string;
    detail: string;
    result: string;
    actionLabel: string;
  };
  capabilities: PlayGuideCapability[];
}

interface CapabilityDefinition {
  id: Exclude<GameTab, 'command'>;
  group: PlayGuideGroup;
  title: string;
  description: string;
  result: string;
  actionLabel: string;
}

const capabilityDefinitions: readonly CapabilityDefinition[] = [
  {
    id: 'organization', group: 'people', title: '사람을 찾아 배치하기',
    description: '참모 스쿼드에서 담당 업무를 확인하고, 후보 시장에서 조사·영입 조건을 비교합니다.',
    result: '인사 변경은 조직에 반영되고, 면담·위임의 후속 결과는 해당 기록과 주간 진행에서 확인합니다.',
    actionLabel: '조직 운영 살펴보기',
  },
  {
    id: 'map', group: 'operations', title: '어디에서 행동할지 살펴보기',
    description: '지역·부대를 선택해 통제 상태, 보급, 이동 경로와 작전 목표를 검토합니다.',
    result: '지도에서 선택만 해서는 명령이 실행되지 않습니다. 계획을 확인한 뒤 접수된 명령의 진행을 추적합니다.',
    actionLabel: '지도 살펴보기',
  },
  {
    id: 'army', group: 'operations', title: '부대와 작전 관리하기',
    description: '편제·합동작전에서 병력·장비·보급을 살펴보고 지휘 범위 안의 명령을 검토합니다.',
    result: '접수된 명령은 작전 현장에서 경과와 중단 사유를 확인합니다. 모든 이동·전투가 다음 주에 끝나지는 않습니다.',
    actionLabel: '군사 작업대 살펴보기',
  },
  {
    id: 'intelligence', group: 'operations', title: '정보와 비밀 활동 살펴보기',
    description: '정보망의 신뢰도와 노출 위험을 확인하고 요원·표적·작전 조건을 비교합니다.',
    result: '실행한 활동의 진행과 노출 변화는 정보 기록에서 확인합니다. 접촉이나 공작의 성공은 보장되지 않습니다.',
    actionLabel: '정보국 살펴보기',
  },
  {
    id: 'governance', group: 'state', title: '제도와 국가 방향 검토하기',
    description: '정치 체제, 국가 운영 현안과 제도 변경 조건을 살펴봅니다.',
    result: '시행 가능한 조치는 별도 권한·조건을 확인합니다. 이후 변화는 국정 지표와 주간 브리핑에서 비교합니다.',
    actionLabel: '국가 운영 살펴보기',
  },
  {
    id: 'economy', group: 'state', title: '수입·지출과 재정 계획하기',
    description: '주간 수입과 지출, 차입·투자·외환을 구분하고 정책 비용과 예상 영향을 비교합니다.',
    result: '즉시 비용은 거래·조치 기록에서, 실제 수입과 지출은 다음 주 결산에서 예상치와 비교합니다.',
    actionLabel: '재정 살펴보기',
  },
  {
    id: 'health', group: 'state', title: '보건 위험과 대응 살펴보기',
    description: '유행 상황과 의료 여력을 읽고 대응 정책의 부담과 확인 시점을 비교합니다.',
    result: '정책에 표시된 확인 시점에 유행·병상·사회 신뢰 변화를 검토합니다. 대응이 곧바로 종식을 뜻하지는 않습니다.',
    actionLabel: '보건 위기 살펴보기',
  },
  {
    id: 'diplomacy', group: 'state', title: '다른 나라와 협상하기',
    description: '관계·회담부터 조약·영토 이양·통행권·기지 사용권까지 제안 조건을 비교합니다.',
    result: '제안과 합의는 다릅니다. 상대의 답변·비준·현지 인도·이용 조건은 각 협상 기록에서 확인합니다.',
    actionLabel: '외교 살펴보기',
  },
  {
    id: 'research', group: 'development', title: '기술·장비 발전시키기',
    description: '국가 연구와 장비 개발국에서 선행 기술, 연구 슬롯, 비용과 개발 단계를 확인합니다.',
    result: '승인한 연구·개발의 진행은 해당 작업대에서 확인합니다. 연구 완료와 장비 생산·실전 배치는 서로 다른 단계입니다.',
    actionLabel: '연구·개발 살펴보기',
  },
  {
    id: 'industry', group: 'development', title: '생산·보급 계획하기',
    description: '생산선·공장 배정과 원료·비축·수송 병목을 살펴보고 필요한 물량을 비교합니다.',
    result: '다음 주 생산 실적과 비축 변화를 확인하고, 수송 물자는 예약이 아닌 실제 도착 상태까지 추적합니다.',
    actionLabel: '생산·보급 살펴보기',
  },
];

const accessLabels: Record<RoleAccessMode, string> = {
  direct: '직접 담당', request: '상신 필요', report: '보고 열람', locked: '권한 필요',
};

const restrictedActions: Record<Exclude<RoleAccessMode, 'direct'>, string> = {
  request: '상신 검토', report: '보고 열람', locked: '권한 필요',
};

const restrictedResults: Record<Exclude<RoleAccessMode, 'direct'>, string> = {
  request: '먼저 권한·자원 요청 조건과 심사 상태를 확인합니다. 상신만으로 집행되거나 승인이 보장되지는 않습니다.',
  report: '담당 부서의 현황과 위험을 보고받습니다. 보고 열람만으로 정책이나 명령이 변경되지는 않습니다.',
  locked: '현재는 이 업무 화면을 열 수 없습니다. 공식 보직이나 유효한 권한이 생기면 접근 범위를 다시 확인합니다.',
};

const firstWork: Record<CareerRole['branch'], { tab: Exclude<GameTab, 'command'>; title: string; detail: string }> = {
  military: {
    tab: 'army', title: '내 부대의 준비 상태 확인',
    detail: '군사 작업대의 편제·합동작전에서 병력·장비·보급을 살펴보세요. 내 지휘 범위의 명령만 검토하며, 아직 공세를 실행할 필요는 없습니다.',
  },
  politics: {
    tab: 'organization', title: '참모와 권한 확인',
    detail: '참모 스쿼드에서 누가 어떤 업무를 맡는지 먼저 살펴보세요. 관리 가능한 부서와 인사 조건을 확인하고, 후보 시장의 조사·영입 흐름을 비교합니다.',
  },
  intelligence: {
    tab: 'intelligence', title: '정보망과 노출 위험 확인',
    detail: '정보국에서 정보의 신뢰도와 노출 위험을 먼저 살펴보세요. 요원과 표적을 비교한 뒤 비용·위험·권한을 확인합니다. 아직 공작을 실행할 필요는 없습니다.',
  },
};

/** Read-only navigation copy. This never grants authority or issues a game action. */
export function getPlayGuide(input: {
  role: Pick<CareerRole, 'branch' | 'title' | 'scope'>;
  mandates: Record<GameTab, RoleTabMandate>;
  civilian?: Pick<CivilianCareerState, 'professionId' | 'originId'>;
}): PlayGuide {
  const capabilities = capabilityDefinitions.map((definition): PlayGuideCapability => {
    const mandate = input.mandates[definition.id];
    const mode = input.civilian ? 'locked' : mandate.mode;
    return {
      ...definition,
      mode,
      accessLabel: accessLabels[mode],
      actionLabel: mode === 'direct' ? definition.actionLabel : restrictedActions[mode],
      result: mode === 'direct' ? definition.result : restrictedResults[mode],
      reason: input.civilian ? '민간 커리어에서는 시민 활동실을 이용합니다. 국가 업무의 직접 집행 권한은 없습니다.' : mandate.reason,
    };
  });

  if (input.civilian) {
    const profession = getCivilianProfession(input.civilian.professionId);
    const origin = getCivilianOrigin(input.civilian.originId);
    return {
      roleSummary: `${profession.name} · ${origin.name}. 시민 활동으로 전문성·인맥·평판을 쌓으며 생계와 감시 부담을 함께 관리합니다.`,
      firstAction: {
        tab: 'command', title: '시민 활동 하나 살펴보기',
        detail: '시민 활동실에서 직업과 활동의 비용·영향을 비교하세요. 국가 정책을 대신 결재하는 것이 아니라, 개인의 활동과 인맥을 통해 세계에 영향을 줍니다.',
        result: '실행한 활동은 개인 활동 기록에 남습니다. 생계·평판·감시의 변화와 다음 주 상황을 함께 확인하세요.',
        actionLabel: '시민 활동실 살펴보기',
      },
      capabilities,
    };
  }

  const work = firstWork[input.role.branch];
  const capability = capabilities.find((entry) => entry.id === work.tab)!;
  return {
    roleSummary: `${input.role.title} · ${input.role.scope}. 직접 담당·상신·보고 범위를 구분하고, 먼저 한 가지 업무를 살펴본 뒤 결과를 확인합니다.`,
    firstAction: {
      ...work,
      detail: capability.mode === 'direct' ? work.detail : `${capability.reason} ${restrictedResults[capability.mode]}`,
      result: capability.result,
      actionLabel: capability.actionLabel,
    },
    capabilities,
  };
}
