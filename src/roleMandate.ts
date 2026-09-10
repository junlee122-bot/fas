import type { CampaignStartMode, CareerRole, GameTab } from './types';
import { withJosa } from './koreanGrammar';

export type RoleAccessMode = 'direct' | 'request' | 'report' | 'locked';

export interface RoleTabMandate {
  tab: GameTab;
  mode: RoleAccessMode;
  label: string;
  reason: string;
  authorityRoute: string;
}

const allTabs: GameTab[] = [
  'command',
  'governance',
  'map',
  'organization',
  'economy',
  'health',
  'army',
  'industry',
  'research',
  'diplomacy',
  'intelligence',
];

const modeCopy: Record<RoleAccessMode, Pick<RoleTabMandate, 'label' | 'authorityRoute'>> = {
  direct: { label: '직접 지휘', authorityRoute: '현재 보직에서 결재하고 결과에 책임집니다.' },
  request: { label: '상신 필요', authorityRoute: '담당 부서의 안을 받아 상급기관에 권한과 자원을 요청합니다.' },
  report: { label: '보고 열람', authorityRoute: '현황은 보고받되 담당자의 결재를 대신할 수 없습니다.' },
  locked: { label: '권한 없음', authorityRoute: '제도권 보직 또는 정식 위임을 얻기 전에는 접근할 수 없습니다.' },
};

const branchDirectTabs: Record<CareerRole['branch'], GameTab[]> = {
  military: ['command', 'map', 'organization', 'army'],
  politics: ['command', 'governance', 'organization'],
  intelligence: ['command', 'organization', 'intelligence'],
};

const branchRequestTabs: Record<CareerRole['branch'], GameTab[]> = {
  military: ['industry', 'research', 'intelligence'],
  politics: ['economy', 'health', 'diplomacy', 'industry', 'research'],
  intelligence: ['map', 'research', 'diplomacy'],
};

function describeReason(role: CareerRole, tab: GameTab, mode: RoleAccessMode): string {
  if (mode === 'direct') return `${role.title}의 공식 임무 범위 안에 있는 업무입니다.`;
  if (mode === 'request') return `${withJosa(role.title, '은/는')} ${tab === 'map' ? '작전 지도' : tab === 'research' ? '연구·개발' : tab === 'industry' ? '생산·조달' : tab === 'intelligence' ? '정보 작전' : tab === 'economy' ? '재정 정책' : tab === 'health' ? '보건 정책' : '대외 정책'}에 의견을 낼 수 있지만 단독 결재권은 없습니다.`;
  if (mode === 'locked') return '공식 국가 권한이 없는 민간 커리어입니다.';
  return `${role.title}의 지휘계통 밖 업무입니다. 결과와 위험은 보고되지만 담당 부서가 집행합니다.`;
}

export function getRoleTabMandates(role: CareerRole, startMode: CampaignStartMode = 'office'): Record<GameTab, RoleTabMandate> {
  return Object.fromEntries(allTabs.map((tab) => {
    let mode: RoleAccessMode;
    if (startMode === 'civilian') {
      mode = tab === 'command' ? 'direct' : 'locked';
    } else if (role.tier === 1 || role.archetype === 'head-of-state') {
      mode = 'direct';
    } else if (branchDirectTabs[role.branch].includes(tab)) {
      mode = 'direct';
    } else if (branchRequestTabs[role.branch].includes(tab)) {
      mode = 'request';
    } else {
      mode = 'report';
    }

    // Cabinet and theater-level offices can directly run the central portfolios
    // most closely connected to their remit, without becoming an all-powerful state UI.
    if (startMode !== 'civilian' && role.tier <= 2) {
      if (role.branch === 'politics' && ['economy', 'diplomacy', 'health'].includes(tab)) mode = 'direct';
      if (role.branch === 'military' && ['industry', 'research'].includes(tab)) mode = 'direct';
      if (role.branch === 'intelligence' && tab === 'diplomacy') mode = 'direct';
    }

    return [tab, {
      tab,
      mode,
      ...modeCopy[mode],
      reason: describeReason(role, tab, mode),
    } satisfies RoleTabMandate];
  })) as Record<GameTab, RoleTabMandate>;
}

export function getDirectRoleTabs(mandates: Record<GameTab, RoleTabMandate>): GameTab[] {
  return allTabs.filter((tab) => mandates[tab].mode === 'direct');
}
