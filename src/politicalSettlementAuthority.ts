import type { CareerAffiliationStatus } from './careerMarket';
import type { CareerRole, CareerState } from './types';

export interface PoliticalSettlementAuthority {
  canDeclare: boolean;
  canNegotiate: boolean;
  canAdminister: boolean;
  reason: string;
}

const nations = new Set(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const branches = new Set(['politics', 'military', 'intelligence']);
const archetypes = new Set(['head-of-state', 'cabinet-minister', 'bureau-director', 'regional-command', 'organizer', 'theater-command', 'service-director', 'field-command', 'unit-command', 'agent', 'resistance']);
const affiliations = new Set(['serving', 'dismissed', 'unattached', 'exile', 'defector', 'double-agent']);
const validIdentity = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const denied = (reason: string): PoliticalSettlementAuthority => ({ canDeclare: false, canNegotiate: false, canAdminister: false, reason });

/**
 * Political authority for the current formal office only. Pass the resolved office,
 * never a role-tab delegation/overreach projection; there is intentionally no
 * roleCommand argument. A positive result permits review of a procedure, not its
 * outcome, foreign recognition, territorial control, or a sovereignty treaty.
 * Costs, current jurisdiction, review freshness and settlement remain domain gates.
 */
export function getPoliticalSettlementAuthority(
  career: CareerState,
  role: CareerRole,
  affiliationStatus?: CareerAffiliationStatus,
): PoliticalSettlementAuthority {
  if (!career || typeof career !== 'object' || Array.isArray(career)
    || !role || typeof role !== 'object' || Array.isArray(role)
    || !validIdentity(role.id) || !nations.has(role.nationId)
    || !branches.has(role.branch) || !archetypes.has(role.archetype)
    || !Number.isInteger(role.tier) || role.tier < 1 || role.tier > 5
    || !Number.isFinite(role.authority) || role.authority < 0 || role.authority > 100) {
    return denied('현재 보직과 정치 권한의 근거를 확인할 수 없습니다.');
  }
  if (affiliationStatus !== undefined && !affiliations.has(affiliationStatus)) {
    return denied('현재 소속 상태를 확인할 수 없어 국가 대표·외교·행정 절차를 진행할 수 없습니다.');
  }
  if (affiliationStatus === 'dismissed' || affiliationStatus === 'unattached') {
    return denied('현재 공식 보직에서 이탈한 상태입니다. 새 보직에 취임한 뒤 정치 권한을 확인하십시오.');
  }
  if (career.nationId !== role.nationId || career.roleId !== role.id) {
    return denied('현재 경력의 국가·보직과 정치 권한 보직이 일치하지 않습니다.');
  }
  // Undefined startMode is an older office-start save, not a civilian appointment.
  if (career.startMode !== undefined && career.startMode !== 'office' && career.startMode !== 'civilian') {
    return denied('현재 경력의 취임 상태를 확인할 수 없습니다.');
  }
  // This records the first appointment and can remain unchanged after promotion.
  // The current office identity is checked against career.roleId above.
  if (career.startMode === 'civilian' && !validIdentity(career.civilian?.enteredOfficeRoleId)) {
    return denied('일반인 경력은 공식 보직 취임 전 국가 대표 선언·외교 승인 요청·행정 준비를 집행할 수 없습니다.');
  }
  if (role.branch !== 'politics') {
    return denied('군사·정보 보직이나 일반 탭 위임에는 국가 대표 선언·외교 승인 요청·현지 행정 준비의 정치 권한이 없습니다.');
  }
  const canDeclare = role.tier === 1 || role.archetype === 'head-of-state';
  const canNegotiate = role.tier <= 2;
  const canAdminister = role.tier <= 2;
  if (!canDeclare && !canNegotiate) {
    return denied('국가 대표 선언은 정치 최고위 또는 국가원수 보직, 외교 승인 요청·행정 준비는 정치 1~2단계 보직이 필요합니다.');
  }
  return {
    canDeclare, canNegotiate, canAdminister,
    reason: canDeclare && canNegotiate
      ? '현직 정치 권한으로 국가 대표 선언·상대국 정부 승인 요청·현재 자국 관할의 행정 준비를 검토할 수 있습니다. 각 절차의 조건과 확정 결과는 별도입니다.'
      : canDeclare
        ? '현직 정치 국가원수로 대표 선언을 검토할 수 있습니다. 외교 승인 요청·행정 준비는 정치 1~2단계 보직이 필요합니다.'
        : '현직 정치 2단계 보직으로 상대국 정부 승인 요청·현재 자국 관할의 행정 준비를 검토할 수 있습니다. 국가 대표 선언은 최고위 또는 국가원수 보직이 필요합니다.',
  };
}
