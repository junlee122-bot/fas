import { nations } from './campaign';
import type { ConstitutionalJudiciaryState } from './constitutionalJudiciary';
import type { GovernmentFormId } from './dynasticPolitics';
import type { PoliticalSettlementAuthority } from './politicalSettlementAuthority';
import { advancePoliticalSettlementWeek } from './politicalSettlement';
import type { PoliticalSettlementContext, PoliticalSettlementEvent, PoliticalSettlementState } from './politicalSettlement';
import { recordPoliticalUpdates } from './mapPoliticalLedger';
import { advanceTreatyWeek, getTreatySiteController } from './territorialTreaties';
import type { TreatyConsentMethod, TreatyContext, TreatyState } from './territorialTreaties';
import type { MapPoliticalLedger } from './mapPoliticalLedger';
import type { SovereignPowersState } from './sovereignPowers';
import type { Division, NationId, Territory } from './types';

/** The current country's land roster is evidence of its own deployment only.
 * Foreign forces, fleets, aircraft and basing rights are deliberately not inferred.
 * Moving/embarked units conservatively remain counted at their registered site
 * until the military engine records arrival; diplomacy cannot move them.
 */
export function getTreatyGarrisonEvidence(
  nationId: NationId, territories: readonly Territory[], control: MapPoliticalLedger,
  divisions: readonly Pick<Division, 'territoryId'>[],
): Readonly<Record<string, number>> {
  const counts: Record<string, number> = Object.create(null);
  for (const site of territories) {
    if (site.siteType !== 'sea' && getTreatySiteController(site, control) === nationId) counts[site.id] = 0;
  }
  for (const division of divisions) {
    if (Object.prototype.hasOwnProperty.call(counts, division.territoryId)) counts[division.territoryId] += 1;
  }
  return counts;
}

/** These are game approval indicators, not a fabricated parliamentary vote. */
export function getTreatyRatificationMandate(
  nationId: NationId, authority: PoliticalSettlementAuthority,
  constitution: ConstitutionalJudiciaryState, form: GovernmentFormId,
  powers: SovereignPowersState,
) {
  const valid = constitution.nationId === nationId && powers.nationId === nationId;
  const territoryClause = constitution.enacted?.clauses.territory;
  const requiredConsent: TreatyConsentMethod = territoryClause === 'self-determination-compact' ? 'referendum'
    : ['devolved-regions', 'federal-compact'].includes(territoryClause ?? '') ? 'regional-council' : 'none';
  const representative = ['parliamentary-republic', 'presidential-republic', 'semi-presidential-republic', 'constitutional-monarchy', 'peoples-commonwealth'].includes(form);
  const backing = representative ? powers.parliamentaryConfidence : powers.authorityCapital;
  const indicatorsValid = [powers.constitutionalConvention, backing].every((value) => Number.isFinite(value) && value >= 0 && value <= 100);
  const support = indicatorsValid ? Math.min(powers.constitutionalConvention, backing) : 0;
  return {
    canRatify: valid && indicatorsValid && authority.canDeclare,
    requiredConsent,
    approvalSupport: valid ? support : 0,
    approvalLabel: representative ? '의회·대표기관 신임 / 헌정 관례' : '통치 권한 기반 / 헌정 관례',
    reason: !valid ? '현재 소속국의 헌정 기록이 일치하지 않습니다.' : !indicatorsValid ? '국내 승인 기반의 원본 지표가 유효하지 않습니다.'
      : `${authority.reason} 비준은 최고 정치 보직에 한하며 승인 기반 60·안정도 45·행정역량 45 이상을 재확인합니다. 승인 기반은 게임 지표이며 실제 의회 표결 결과가 아닙니다.${requiredConsent === 'none' ? '' : ` 현재 헌법의 주민·지방 동의 요건: ${requiredConsent === 'referendum' ? '주민투표' : '지역대표 심의 또는 주민투표'} 승인 기록이 해당 조약에 필요합니다.`} 상대국의 별도 헌정 절차 전체를 모형화하지는 않습니다.`,
  };
}

/** One post-combat weekly settlement. Handover precedes administration review,
 * so the former government's local administration cannot survive another week.
 * Signature alone never writes a control receipt. Units/assets are not inputs:
 * this function cannot teleport, donate, respawn, or award them.
 */
export function advanceTerritorialDiplomacyWeek(
  treaties: TreatyState, settlement: PoliticalSettlementState,
  context: TreatyContext, politicalContext: PoliticalSettlementContext,
) {
  const treatyResult = advanceTreatyWeek(treaties, context);
  const bySite = new Map(treatyResult.transfers.map((transfer) => [transfer.territoryId, transfer]));
  const territories = bySite.size ? context.territories.map((site) => {
    const transfer = bySite.get(site.id);
    const recipient = transfer && nations.find((nation) => nation.id === transfer.toNationId);
    return recipient ? { ...site, ownerId: recipient.id, controller: recipient.alignment } : site;
  }) : context.territories;
  const control = recordPoliticalUpdates(context.control, treatyResult.transfers.map((transfer) => ({
    territoryId: transfer.territoryId,
    controller: nations.find((nation) => nation.id === transfer.toNationId)!.alignment,
    gameOwnerId: transfer.toNationId, verifiedControllerNationId: transfer.toNationId,
    week: transfer.week,
    source: { kind: 'treaty-transfer' as const, id: transfer.treatyId, label: `조약 이행 · ${treatyResult.state.treaties.find((treaty) => treaty.id === transfer.treatyId)!.name}` },
  })));
  // A restored partial tick may already have observed administration this week.
  // Reconcile jurisdiction only; do not replay preparation, recognition or costs.
  const reconciliationEvents: PoliticalSettlementEvent[] = [];
  const administrations = settlement.administrations.map((entry) => {
    const transfer = bySite.get(entry.territoryId);
    const polity = settlement.polities.find((candidate) => candidate.id === entry.polityId);
    if (!transfer || !polity || polity.nationId === transfer.toNationId || entry.status === 'suspended') return entry;
    const reason = '조약에 따른 현지 인도로 기존 정부의 관할이 종료되어 행정을 중단했습니다. 새 정부의 행정은 별도로 준비해야 합니다.';
    reconciliationEvents.push({ id: `treaty:administration-suspended:${transfer.treatyId}:${entry.id}`, week: context.week,
      title: `${context.territories.find((site) => site.id === entry.territoryId)?.name ?? '거점'} 기존 행정 중단`, detail: reason, tone: 'neutral' });
    return { ...entry, status: 'suspended' as const, progressWeeks: 0, lastProcessedWeek: context.week, reason };
  });
  const reconciled = reconciliationEvents.length ? { ...settlement, administrations,
    journal: [...settlement.journal, ...reconciliationEvents].slice(-200) } : settlement;
  const advanced = advancePoliticalSettlementWeek(reconciled, {
    ...politicalContext, week: context.week, nationId: context.nationId, territories, control,
  });
  const politicalResult = { ...advanced, events: [...reconciliationEvents, ...advanced.events] };
  return { treatyResult, politicalResult, territories, control };
}
