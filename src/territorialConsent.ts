import type { Territory } from './types';
import type { TerritorialTreaty, TreatyConsentMethod, TreatyConsentRecord, TreatyTerms } from './territorialTreaties';

export function getTreatyTerms(treaty: Pick<TerritorialTreaty, 'terms'>): TreatyTerms {
  return treaty.terms === undefined
    ? { consentMethod: 'none', civilGuarantees: false, withdrawBeforeHandover: false, handoverDelayWeeks: 1 }
    : { ...treaty.terms };
}

export function isTreatyConsentMethod(value: unknown): value is TreatyConsentMethod {
  return value === 'none' || value === 'regional-council' || value === 'referendum';
}
export function validTreatyTerms(value: unknown): value is TreatyTerms {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const terms = value as TreatyTerms;
  return isTreatyConsentMethod(terms.consentMethod) && typeof terms.civilGuarantees === 'boolean'
    && typeof terms.withdrawBeforeHandover === 'boolean' && [1, 4, 8].includes(terms.handoverDelayWeeks);
}
export function satisfiesTreatyConsent(method: TreatyConsentMethod, required: TreatyConsentMethod): boolean {
  if (!isTreatyConsentMethod(method) || !isTreatyConsentMethod(required)) return false;
  return required === 'none' || method === 'referendum' || required === 'regional-council' && method === 'regional-council';
}
function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return hash >>> 0;
}
function bases(treaty: Pick<TerritorialTreaty, 'territoryId' | 'fromNationId' | 'toNationId'>) {
  const identity = JSON.stringify([treaty.territoryId, treaty.fromNationId, treaty.toNationId]);
  return { support: 35 + stableHash(`support:${identity}`) % 31, participation: 20 + stableHash(`participation:${identity}`) % 21 };
}
const round = (value: number) => Math.round(value * 100) / 100;
export const treatyConsentAbstraction = '지역 의견은 거점·당사국·보급·조약 조건으로 계산한 게임 모형이며, 실제 유권자·인구 또는 역사적 여론조사 결과가 아닙니다.';

export function forecastTreatyConsent(treaty: TerritorialTreaty, territory: Territory): { supportPercent: number; participationPercent: number; factors: string[] } {
  const terms = getTreatyTerms(treaty);
  if (!validTreatyTerms(terms) || territory.id !== treaty.territoryId || !Number.isFinite(territory.supply) || territory.supply < 0 || territory.supply > 100) {
    return { supportPercent: 0, participationPercent: 0, factors: ['유효한 거점·보급·조약 조건이 없어 지역 의견을 예측할 수 없습니다.', treatyConsentAbstraction] };
  }
  const base = bases(treaty); const guarantee = terms.civilGuarantees ? 10 : 0;
  const supportPercent = round(base.support + territory.supply * 0.15 + guarantee);
  const participationPercent = round(base.participation + territory.supply * 0.5);
  return { supportPercent, participationPercent, factors: [
    `고정 지역 기반: 찬성 ${base.support}, 참여 ${base.participation}. 같은 거점·제공국·수령국은 제안 주차와 저장 재실행을 바꿔도 동일합니다.`,
    `현지 보급 ${round(territory.supply)}: 찬성 +${round(territory.supply * 0.15)}, 참여 +${round(territory.supply * 0.5)}. 실제 결정 주의 보급을 사용합니다.`,
    `민간 보호 조약상 약속: 찬성 +${guarantee}. 약속을 선택한 것이 현지 법 집행 완료를 뜻하지는 않습니다.`,
    terms.consentMethod === 'regional-council' ? '지역 대표 협의 승인: 찬성 지표 60/100 이상.'
      : terms.consentMethod === 'referendum' ? '지역 투표 승인: 찬성 지표 50 초과와 참여 지표 50/100 이상을 모두 충족.' : '이 조약에는 지역 동의 절차가 지정되지 않았습니다.',
    treatyConsentAbstraction,
  ] };
}

export function treatyConsentApproved(method: Exclude<TreatyConsentMethod, 'none'>, support: number, participation: number): boolean {
  return method === 'regional-council' ? support >= 60 : method === 'referendum' && support > 50 && participation >= 50;
}

/** Evidence binding is deterministic consistency metadata, not a cryptographic signature. */
export function treatyConsentEvidenceKey(treaty: TerritorialTreaty): string {
  const terms = getTreatyTerms(treaty);
  return JSON.stringify([1, treaty.id, treaty.territoryId, treaty.fromNationId, treaty.toNationId,
    terms.consentMethod, terms.civilGuarantees, terms.withdrawBeforeHandover, terms.handoverDelayWeeks]);
}

/** Validate the saved supply snapshot, never today's possibly changed supply or an actual poll. */
export function consistentTreatyConsentResult(treaty: TerritorialTreaty, consent: TreatyConsentRecord): boolean {
  const { supportPercent: support, participationPercent: participation, supplyAtResolution: supply } = consent;
  if (consent.modelVersion !== 1 || consent.evidenceKey !== treatyConsentEvidenceKey(treaty)
    || typeof support !== 'number' || typeof participation !== 'number' || typeof supply !== 'number'
    || !Number.isFinite(supply) || supply < 40 || supply > 100
    || ![support, participation].every((value) => Number.isFinite(value) && value >= 0 && value <= 100)) return false;
  const base = bases(treaty); const guarantee = getTreatyTerms(treaty).civilGuarantees ? 10 : 0;
  return round(base.support + supply * 0.15 + guarantee) === support && round(base.participation + supply * 0.5) === participation;
}
