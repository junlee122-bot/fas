import { describe, expect, it } from 'vitest';
import type { NationalSimulationInput, NationalSimulationSnapshot } from './nationalSimulation';
import { deriveLivingWorldPresentation } from './livingWorldPresentation';

// The presentation reads only these fields; no unrelated engine initialization is needed.
function fixture() {
  const input = {
    game: { week: 2, factories: 20 },
    production: [{ id: 'rifle', assigned: 12 }, { id: 'truck', assigned: 2 }],
    publicHealth: { activeOutbreak: null },
  } as unknown as NationalSimulationInput;
  const snapshot = { goods: [
    { id: 'consumer', availability: 72 }, { id: 'food', availability: 81 }, { id: 'medicine', availability: 90 },
  ] } as NationalSimulationSnapshot;
  return { input, snapshot };
}

function outbreak(input: NationalSimulationInput, load: number) {
  input.publicHealth.activeOutbreak = { hospitalLoad: load } as NonNullable<NationalSimulationInput['publicHealth']['activeOutbreak']>;
}

describe('living world state-backed presentation', () => {
  it('derives only current allocation, supply and issue values without mutation', () => {
    const { input, snapshot } = fixture();
    const before = structuredClone({ input, snapshot });
    const result = deriveLivingWorldPresentation(input, snapshot, 2);
    expect(result.week).toBe(2);
    expect(result.factories).toEqual({ total: 20, military: 14, civilian: 6, militaryShare: .7, civilianShare: .3, overAllocated: false });
    expect(result.sites.industry.evidence).toContain('군수 배치 14');
    expect(result.sites.market.severity).toBe('stable');
    expect(result.sites.council.evidence).toContain('2건');
    expect({ input, snapshot }).toEqual(before);
    expect(deriveLivingWorldPresentation(input, snapshot, 2)).toEqual(result);
  });

  it('changes factory graphics only after input allocation changes', () => {
    const { input, snapshot } = fixture();
    const before = deriveLivingWorldPresentation(input, snapshot, 0);
    input.production[0].assigned = 2;
    const after = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(after.factories.militaryShare).toBe(.2);
    expect(after.factories.civilian).toBe(16);
    expect(after.sites.industry.tokenCount).toBeLessThan(before.sites.industry.tokenCount);
    expect(after.goods).toEqual(before.goods); // Allocation is not an invented settled social outcome.
  });

  it('handles empty zero-capacity economies without NaN or a fake full bar', () => {
    const { input, snapshot } = fixture();
    input.game.factories = 0; input.production = [];
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.factories).toEqual({ total: 0, military: 0, civilian: 0, militaryShare: 0, civilianShare: 0, overAllocated: false });
    expect(result.sites.industry.tokenCount).toBe(0);
    expect(result.sites.industry.label).toBe('가용 공장 역량 없음');
    expect(result.sites.council.tokenCount).toBe(0);
  });

  it('caps shares but explicitly reports over-allocation rather than inventing civilian capacity', () => {
    const { input, snapshot } = fixture(); input.game.factories = 5;
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.factories).toMatchObject({ military: 14, civilian: 0, militaryShare: 1, civilianShare: 0, overAllocated: true });
    expect(result.sites.industry.severity).toBe('critical');
    input.game.factories = 0;
    expect(deriveLivingWorldPresentation(input, snapshot, 0).factories.militaryShare).toBe(1);
  });

  it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])('keeps nonfinite capacity %s unknown', (value) => {
    const { input, snapshot } = fixture(); input.game.factories = value;
    const result = deriveLivingWorldPresentation(input, snapshot, Number.NaN);
    expect(result.factories.total).toBeNull();
    expect(result.factories.militaryShare).toBeNull();
    expect(result.sites.industry.severity).toBe('unknown');
    expect(result.sites.industry.tokenCount).toBe(0);
    expect(result.staffIssues).toBeNull();
    expect(result.sites.council.evidence).toContain('자료 없음');
  });

  it('does not silently treat corrupt assigned capacity as zero', () => {
    const { input, snapshot } = fixture(); input.production[0].assigned = Number.NaN;
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.factories.military).toBeNull();
    expect(result.factories.civilian).toBeNull();
    expect(result.sites.industry.severity).toBe('unknown');
  });

  it('normalizes finite negative values and clamps percentages', () => {
    const { input, snapshot } = fixture(); input.game.factories = -5; input.production[0].assigned = -8; input.production[1].assigned = 0;
    snapshot.goods[0].availability = -10; snapshot.goods[1].availability = 130;
    const result = deriveLivingWorldPresentation(input, snapshot, -4);
    expect(result.factories.total).toBe(0);
    expect(result.factories.military).toBe(0);
    expect(result.goods).toMatchObject({ consumer: 0, food: 100 });
    expect(result.staffIssues).toBe(0);
    expect(result.sites.market.severity).toBe('critical');
  });

  it.each([[34.9, 'critical'], [35, 'watch'], [67.9, 'watch'], [68, 'stable']] as const)('shows lowest confirmed essential supply %s as %s', (value, severity) => {
    const { input, snapshot } = fixture(); snapshot.goods[1].availability = value;
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.sites.market.severity).toBe(severity);
    expect(result.sites.market.evidence).toContain(`식량 ${value} / 100`);
  });

  it('missing or nonfinite goods never look like zero stock or good health', () => {
    const { input, snapshot } = fixture(); snapshot.goods = [{ id: 'consumer', availability: Number.NaN }] as NationalSimulationSnapshot['goods'];
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.goods).toEqual({ consumer: null, food: null, medicine: null });
    expect(result.sites.market.severity).toBe('unknown');
    expect(result.sites.market.tokenCount).toBe(0);
    expect(result.sites.health.severity).toBe('unknown');
    expect(result.sites.market.evidence).not.toContain('0 / 100');
  });

  it('distinguishes no active outbreak from a zero-load active outbreak', () => {
    const { input, snapshot } = fixture();
    const absent = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(absent.hospital).toEqual({ active: false, load: null });
    expect(absent.sites.health.label).toBe('진행 중 유행 없음');
    expect(absent.sites.health.tokenCount).toBe(0);
    outbreak(input, 0);
    const active = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(active.hospital).toEqual({ active: true, load: 0 });
    expect(active.sites.health.label).toBe('유행 대응 중');
    expect(active.sites.health.evidence).toContain('병상 부담 0%');
  });

  it.each([[49.9, 'stable'], [50, 'watch'], [79.9, 'watch'], [80, 'critical'], [140, 'critical']] as const)('hospital burden %s can override plentiful medicine with %s', (load, severity) => {
    const { input, snapshot } = fixture(); outbreak(input, load);
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.sites.health.severity).toBe(severity);
    expect(result.hospital.load).toBe(Math.min(100, load));
    if (load >= 80) expect(result.sites.health.label).toBe('병상 부담 위험');
  });

  it('shows a medicine shortage without inventing an epidemic', () => {
    const { input, snapshot } = fixture(); snapshot.goods[2].availability = 20;
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.hospital.active).toBe(false);
    expect(result.sites.health.severity).toBe('critical');
    expect(result.sites.health.label).toBe('의약품 공급 부족');
    expect(result.sites.health.tokenCount).toBe(0);
  });

  it('retains a known severe burden even if medicine data is absent', () => {
    const { input, snapshot } = fixture(); outbreak(input, 95); snapshot.goods.pop();
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.sites.health.severity).toBe('critical');
    expect(result.sites.health.evidence).toContain('의약품 자료 없음');
    expect(result.sites.health.evidence).toContain('병상 부담 95%');
  });

  it('unknown outbreak load is not an absent epidemic or a calm scene', () => {
    const { input, snapshot } = fixture(); outbreak(input, Number.NaN);
    const result = deriveLivingWorldPresentation(input, snapshot, 0);
    expect(result.hospital).toEqual({ active: true, load: null });
    expect(result.sites.health.severity).toBe('unknown');
    expect(result.sites.health.evidence).toContain('병상 부담 자료 없음');
    expect(result.sites.health.activityLevel).toBe(0);
  });

  it('keeps symbolic visuals bounded even with huge issue counts', () => {
    const { input, snapshot } = fixture(); outbreak(input, 100);
    const result = deriveLivingWorldPresentation(input, snapshot, 900);
    expect(result.staffIssues).toBe(900);
    expect(result.sites.council.evidence).toContain('900건');
    for (const site of Object.values(result.sites)) {
      expect(site.tokenCount).toBeGreaterThanOrEqual(0);
      expect(site.tokenCount).toBeLessThanOrEqual(6);
      expect(site.activityLevel).toBeGreaterThanOrEqual(0);
      expect(site.activityLevel).toBeLessThanOrEqual(3);
      expect(site.visibleMeaning).toMatch(/아니|아닙|않|뜻하지/);
    }
  });

  it('does not give invalid campaign dates a fabricated current week', () => {
    const { input, snapshot } = fixture();
    for (const week of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      input.game.week = week;
      expect(deriveLivingWorldPresentation(input, snapshot, 0).week).toBeNull();
    }
  });
});
