import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { LandRedeploymentPlanner } from './LandRedeploymentPlanner';
import { createSeaTransportState, type SeaTransportContext } from './seaTransport';
import { createJointForcesState } from './jointOperations';
import { territories } from './data';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { createMilitaryAccessState, type MilitaryAccessAgreement } from './militaryAccess';

const context: SeaTransportContext = { week: 0, nationId: 'britain', playerFaction: 'allies', phase: 'war',
  game: { week: 0, commandPoints: 100, fuel: 100, manpower: 500, politicalPower: 100, steel: 50, factories: 20, stability: 70, warSupport: 70, treasury: 100, victoryScore: 0, airPower: 60, navalPower: 60, intelNetwork: 50, enemyPressure: 40 }, stockpile: { infantryEquipment: 1000, tanks: 100, aircraft: 100, convoys: 100, artillery: 100, trucks: 100 },
  jointForces: createJointForcesState('britain'), orders: [], territories,
  commandableDivisionIds: new Set(['test']), divisions: [{ id: 'test', name: '항구 이동 부대', type: 'infantry', territoryId: 'britain', commanderId: 'player', status: 'ready', strength: 90, organization: 90, supply: 90, experience: 40 }] };
describe('land redeployment review UI', () => {
  it('offers explicit review and no approval or spending on first render', () => {
    const onApprove = vi.fn();
    const html = renderToStaticMarkup(<LandRedeploymentPlanner originId="britain" context={context} state={createSeaTransportState()} onApprove={onApprove} />);
    expect(html).toContain('육상 재배치 검토');
    expect(html).toContain('지휘 3 / 연료 1');
    expect(html).not.toContain('비용을 지불하고 재배치 승인');
    expect(html).not.toContain('value="channel"');
    expect(onApprove).not.toHaveBeenCalled();
  });
  it('does not invent a commandable garrison', () => {
    expect(renderToStaticMarkup(<LandRedeploymentPlanner originId="britain" context={{ ...context, commandableDivisionIds: new Set() }} state={createSeaTransportState()} onApprove={() => {}} />)).toBe('');
  });
  it('keeps unaffordable movement visible but disabled with a reason', () => {
    const html = renderToStaticMarkup(<LandRedeploymentPlanner originId="britain" context={{ ...context, game: { ...context.game, fuel: 0 } }} state={createSeaTransportState()} onApprove={() => {}} />);
    expect(html).toContain('연료 1가 필요');
    expect(html).toContain('disabled=""');
  });
  it('derives foreign transit choices from current agreements without mutation or approval on render', () => {
    const sites = territories.filter((site) => ['britain', 'liverpool'].includes(site.id)).map((site) => ({ ...site, ownerId: site.id === 'liverpool' ? 'germany' as const : 'britain' as const, controller: site.id === 'liverpool' ? 'axis' as const : 'allies' as const }));
    const agreement: MilitaryAccessAgreement = { id: 'land-ui', hostNationId: 'germany', beneficiaryNationId: 'britain', proposerNationId: 'britain', territoryId: 'liverpool', kind: 'transit', durationWeeks: 13, status: 'active', proposedWeek: 0, responseDueWeek: 2, activatedWeek: 2, expiresWeek: 15, reason: '시험' };
    const input = { ...context, week: 3, territories: sites, militaryAccess: { state: { ...createMilitaryAccessState(3), agreements: [agreement] }, control: createMapPoliticalLedger(sites, 0), nationId: 'britain' as const, playerFaction: 'allies' as const, week: 3 } };
    const before = structuredClone(input); const onApprove = vi.fn();
    const render = () => renderToStaticMarkup(<LandRedeploymentPlanner originId="britain" context={input} state={createSeaTransportState()} onApprove={onApprove} />);
    expect(render()).toContain('value="liverpool"');
    expect(render()).toContain('통행권은 소유권·보급권·공격권');
    expect(input).toEqual(before); expect(onApprove).not.toHaveBeenCalled();
    input.militaryAccess.state.agreements = [{ ...agreement, status: 'notice', closedWeek: 3 }];
    expect(render()).toBe('');
  });
});
