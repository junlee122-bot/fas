import type { NationalSimulationInput, NationalSimulationSnapshot } from './nationalSimulation';

export type LivingWorldSite = 'industry' | 'market' | 'health' | 'council';
export type LivingWorldSeverity = 'stable' | 'watch' | 'critical' | 'unknown';

export interface LivingWorldSitePresentation {
  id: LivingWorldSite;
  severity: LivingWorldSeverity;
  label: string;
  evidence: string;
  /** Explains the visual encoding, never a claim about literal buildings or people. */
  visibleMeaning: string;
  activityLevel: 0 | 1 | 2 | 3;
  /** Zero to six symbolic tokens, not a simulated inventory or population count. */
  tokenCount: number;
}

export interface LivingWorldPresentation {
  week: number | null;
  factories: {
    total: number | null;
    military: number | null;
    civilian: number | null;
    militaryShare: number | null;
    civilianShare: number | null;
    overAllocated: boolean;
  };
  goods: { consumer: number | null; food: number | null; medicine: number | null };
  hospital: { active: boolean; load: number | null };
  staffIssues: number | null;
  sites: Record<LivingWorldSite, LivingWorldSitePresentation>;
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nonnegative = (value: unknown): number | null => finite(value) ? Math.max(0, value) : null;
const percentage = (value: unknown): number | null => finite(value) ? Math.max(0, Math.min(100, value)) : null;
const display = (value: number | null) => value === null ? '자료 없음' : value.toLocaleString('ko-KR', { maximumFractionDigits: 1 });
const supplyLabel = (value: number | null) => value === null ? '자료 없음' : `${display(value)} / 100`;
const tokens = (value: number) => Math.max(0, Math.min(6, Math.round(value * 6)));
const supplySeverity = (value: number | null): LivingWorldSeverity => value === null ? 'unknown' : value < 35 ? 'critical' : value < 68 ? 'watch' : 'stable';
const supplyActivity = (severity: LivingWorldSeverity): 0 | 1 | 2 | 3 => severity === 'unknown' ? 0 : severity === 'critical' ? 1 : severity === 'watch' ? 2 : 3;

/** Pure presentation of current engine values. No timer, forecast, or invented local population. */
export function deriveLivingWorldPresentation(
  input: NationalSimulationInput,
  snapshot: NationalSimulationSnapshot,
  staffIssues: number,
): LivingWorldPresentation {
  const total = nonnegative(input.game.factories);
  const assigned = input.production.map((line) => nonnegative(line.assigned));
  const sum = assigned.reduce<number>((value, amount) => value + (amount ?? 0), 0);
  const military = assigned.some((amount) => amount === null) || !Number.isFinite(sum) ? null : sum;
  const civilian = total === null || military === null ? null : Math.max(0, total - military);
  const overAllocated = total !== null && military !== null && military > total;
  const militaryShare = total === null || military === null ? null : total === 0 ? (military > 0 ? 1 : 0) : Math.min(1, military / total);
  const civilianShare = total === null || civilian === null ? null : total === 0 ? 0 : Math.min(1, civilian / total);
  const goods = {
    consumer: percentage(snapshot.goods.find((good) => good.id === 'consumer')?.availability),
    food: percentage(snapshot.goods.find((good) => good.id === 'food')?.availability),
    medicine: percentage(snapshot.goods.find((good) => good.id === 'medicine')?.availability),
  };
  const active = Boolean(input.publicHealth.activeOutbreak);
  const load = active ? percentage(input.publicHealth.activeOutbreak?.hospitalLoad) : null;
  const normalizedIssues = finite(staffIssues) ? Math.floor(Math.max(0, staffIssues)) : null;
  const week = finite(input.game.week) && input.game.week >= 0 ? Math.floor(input.game.week) : null;

  const industrySeverity: LivingWorldSeverity = total === null || military === null ? 'unknown'
    : overAllocated ? 'critical' : total === 0 || civilian === 0 ? 'watch' : 'stable';
  const marketAvailability = goods.consumer === null || goods.food === null ? null : Math.min(goods.consumer, goods.food);
  const marketSeverity = supplySeverity(marketAvailability);
  const medicineSeverity = supplySeverity(goods.medicine);
  const healthSeverity: LivingWorldSeverity = (load !== null && load >= 80) || medicineSeverity === 'critical' ? 'critical'
    : (active && load === null) || medicineSeverity === 'unknown' ? 'unknown'
      : (load !== null && load >= 50) || medicineSeverity === 'watch' ? 'watch' : 'stable';

  return {
    week,
    factories: { total, military, civilian, militaryShare, civilianShare, overAllocated },
    goods,
    hospital: { active, load },
    staffIssues: normalizedIssues,
    sites: {
      industry: {
        id: 'industry', severity: industrySeverity,
        label: industrySeverity === 'unknown' ? '생산 배치 확인 필요' : overAllocated ? '총 역량을 넘는 배치'
          : total === 0 ? '가용 공장 역량 없음' : civilian === 0 ? '전 역량 군수 배치' : '군수·민수 역량 분담',
        evidence: `총 역량 ${display(total)} · 군수 배치 ${display(military)} · 민수 여력 ${display(civilian)}`,
        visibleMeaning: '공장 표식은 총 역량 중 군수에 배치한 비중입니다. 민수는 미배치 역량이며, 실제 건물 수나 가동·납품 완료를 뜻하지 않습니다.',
        activityLevel: militaryShare === null || militaryShare === 0 ? 0 : militaryShare < 1 / 3 ? 1 : militaryShare < 2 / 3 ? 2 : 3,
        tokenCount: militaryShare === null ? 0 : tokens(militaryShare),
      },
      market: {
        id: 'market', severity: marketSeverity,
        label: marketSeverity === 'unknown' ? '생활재 공급 확인 필요' : marketSeverity === 'critical' ? '생활재 공급 부족'
          : marketSeverity === 'watch' ? '생활재 공급 주의' : '생활재 공급 원활',
        evidence: `소비재 ${supplyLabel(goods.consumer)} · 식량 ${supplyLabel(goods.food)}`,
        visibleMeaning: '시장 물품 표식은 소비재·식량 중 더 낮은 공급 지수를 나타냅니다. 물품 재고량이나 시민 수가 아니며, 가격과 신뢰는 별도 결산입니다.',
        activityLevel: supplyActivity(marketSeverity),
        tokenCount: marketAvailability === null ? 0 : tokens(marketAvailability / 100),
      },
      health: {
        id: 'health', severity: healthSeverity,
        label: healthSeverity === 'unknown' ? '보건 상태 확인 필요' : load !== null && load >= 80 ? '병상 부담 위험'
          : medicineSeverity === 'critical' ? '의약품 공급 부족' : active ? '유행 대응 중' : '진행 중 유행 없음',
        evidence: `의약품 ${supplyLabel(goods.medicine)} · ${active ? `병상 부담 ${load === null ? '자료 없음' : `${display(load)}%`}` : '진행 중 유행 없음'}`,
        visibleMeaning: '보건 경고 표식은 진행 중인 유행의 병상 부담을 나타냅니다. 환자·병상 수가 아닙니다. 유행이 없어도 의약품 공급 부족은 별도로 표시합니다.',
        activityLevel: healthSeverity === 'unknown' || !active || load === null || load === 0 ? 0 : load < 50 ? 1 : load < 80 ? 2 : 3,
        tokenCount: healthSeverity === 'unknown' || !active || load === null ? 0 : tokens(load / 100),
      },
      council: {
        id: 'council', severity: normalizedIssues === null ? 'unknown' : normalizedIssues > 0 ? 'watch' : 'stable',
        label: normalizedIssues === null ? '참모 현안 확인 필요' : normalizedIssues > 0 ? '참모 후속 대화 대기' : '대기 현안 없음',
        evidence: `현재 권한 범위의 참모 서사 현안 ${normalizedIssues === null ? '자료 없음' : `${display(normalizedIssues)}건`}`,
        visibleMeaning: '회의실 표식은 처리할 참모 현안이 있음을 알립니다. 최대 여섯 개의 상징 표식이며, 참석자 수나 갈등 강도를 뜻하지 않습니다.',
        activityLevel: normalizedIssues === null || normalizedIssues === 0 ? 0 : normalizedIssues === 1 ? 1 : normalizedIssues < 4 ? 2 : 3,
        tokenCount: normalizedIssues === null ? 0 : Math.min(6, normalizedIssues),
      },
    },
  };
}
