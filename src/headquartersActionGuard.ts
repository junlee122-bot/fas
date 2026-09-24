import { getStaffOfficeProblem, type StaffDecisionInput } from './staffDecisions';
import type { RoleTabMandate } from './roleMandate';
import type { NationId } from './types';

export type HeadquartersDirectActionTab = 'research' | 'industry' | 'army';
export interface HeadquartersActionContext extends Pick<StaffDecisionInput, 'role' | 'career' | 'affiliationStatus' | 'busy'> {
  nationId: NationId;
  week: number;
  /** Effective mandate, including legitimate temporary delegations. */
  mandate: RoleTabMandate;
}

/** Execution-time gate shared by the facility controls and the existing detailed desks. */
export function getHeadquartersActionProblem(input: HeadquartersActionContext, tab: HeadquartersDirectActionTab): string | null {
  if (input.busy) return '기간 진행 중에는 기관 지시를 변경할 수 없습니다. 결산이 끝난 뒤 다시 확인하십시오.';
  if (!Number.isSafeInteger(input.week) || input.week < 0) return '현재 주차를 확인할 수 없어 기관 지시를 집행하지 않습니다.';
  const role = input.role;
  if (!input.career || typeof role.id !== 'string' || !role.id.trim() || role.nationId !== input.nationId
    || !Number.isInteger(role.tier) || role.tier < 1 || role.tier > 5
    || !['military', 'politics', 'intelligence'].includes(role.branch)) {
    return '현재 국가와 공식 보직을 확인할 수 없습니다. 소속을 다시 확인하십시오.';
  }
  if (input.affiliationStatus === 'dismissed' || input.affiliationStatus === 'unattached') {
    return '현재 공식 보직에서 이탈한 상태입니다. 새 보직에 취임한 뒤 기관 운영 권한을 행사할 수 있습니다.';
  }
  if (getStaffOfficeProblem(input)) return '현재 경력·소속·공식 보직이 기관 운영 권한과 일치하지 않습니다. 보직과 취임 상태를 확인하십시오.';
  if (input.mandate.tab !== tab || input.mandate.mode !== 'direct') {
    return input.mandate.tab === tab ? input.mandate.reason : '해당 기관의 직접 결재권을 확인할 수 없습니다.';
  }
  return null;
}
