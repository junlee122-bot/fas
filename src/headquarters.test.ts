import { describe, expect, it } from 'vitest';
import { createCareerState, createStaffRoster, getNation, getRole } from './campaign';
import { createEconomyState } from './economy';
import { getHeadquartersOccupant, getHeadquartersRoomSignal, headquartersRooms } from './headquarters';
import { createNationManagementState } from './nationManagement';
import type { NationalSimulationInput } from './nationalSimulation';
import { createPoliticalCrisisState, getNationPoliticalProfile } from './politicalCrisis';
import { createPublicHealthState } from './publicHealth';
import type { StaffDecisionInput } from './staffDecisions';
import { getStaffAuthorityProfile } from './staffOrganization';
import type { GameState } from './types';

function fixture(): { staffInput: StaffDecisionInput; nation: NationalSimulationInput } {
  const role = getRole('britain-tier1', 'britain');
  const game: GameState = { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30,
    stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38,
    airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 };
  const economy = createEconomyState('britain');
  return {
    staffInput: { game, role, staff: createStaffRoster('britain', role.id), developmentFocusId: null,
      campaignPhase: 'war', nationStatus: getNation('britain').status, career: createCareerState('britain', role.id), affiliationStatus: 'serving' },
    nation: {
      nationId: 'britain', phase: 'war', game, economy,
      stockpile: { infantryEquipment: 48200, tanks: 1284, aircraft: 2106, convoys: 624, artillery: 3840, trucks: 12600 },
      divisions: [
        { id: 'a', name: '제1사단', type: 'infantry', strength: 82, organization: 78, experience: 54, supply: 76, territoryId: 'home', commanderId: 'a', status: 'ready' },
        { id: 'b', name: '제2사단', type: 'armor', strength: 78, organization: 72, experience: 60, supply: 68, territoryId: 'front', commanderId: 'b', status: 'combat' },
      ],
      production: [{ id: 'rifles', name: '소총', category: '보병 장비', assigned: 8, efficiency: 84, output: 1200, icon: 'factory' },
        { id: 'trucks', name: '트럭', category: '수송', assigned: 6, efficiency: 76, output: 160, icon: 'truck' }],
      research: [
        { id: 'radio', name: '무선 통신', branch: '통신', description: '지휘 연결', progress: 100, duration: 100, active: false, complete: true, icon: 'radio' },
        { id: 'medicine', name: '대량 의약품', branch: '의학', description: '의료 공급', progress: 40, duration: 100, active: true, complete: false, icon: 'health' },
      ],
      publicHealth: createPublicHealthState(42), selectedPolicies: [], politicalState: createPoliticalCrisisState('britain'),
      coupRisk: { score: 18, tier: 'stable', weeklyChance: 0, triggers: [], leadingFaction: getNationPoliticalProfile('britain').factions[0],
        weakestRelation: { pair: 'civil-military', value: 48 }, crisisLabel: '헌정 비상전환' },
      nationManagement: createNationManagementState('britain', game, economy, 1, 'negotiated'),
    },
  };
}

describe('headquarters assignment and facility model', () => {
  it('maps eight distinct facilities to seven distinct real staff departments', () => {
    const { staffInput } = fixture();
    expect(headquartersRooms).toHaveLength(8);
    expect(new Set(headquartersRooms.map(room => room.id)).size).toBe(8);
    const departments = headquartersRooms.flatMap(room => room.department ? [room.department] : []);
    expect(departments).toHaveLength(7); expect(new Set(departments).size).toBe(7);
    const occupants = headquartersRooms.flatMap(room => {
      const person = getHeadquartersOccupant(room, staffInput); return person ? [person] : [];
    });
    expect(occupants).toHaveLength(7);
    expect(new Set(occupants.map(person => person.id)).size).toBe(7);
    expect(new Set(occupants.map(person => person.personId)).size).toBe(7);
    for (const person of occupants) expect(staffInput.staff).toContain(person);
  });

  it('does not create fictional medical staff or substitute a missing record', () => {
    const { staffInput } = fixture();
    const infirmary = headquartersRooms.find(room => room.id === 'infirmary')!;
    expect(infirmary.department).toBeUndefined();
    expect(getHeadquartersOccupant(infirmary, staffInput)).toBeNull();
    expect(getHeadquartersOccupant(headquartersRooms[0], null)).toBeNull();
    staffInput.staff = staffInput.staff.filter(person => person.department !== 'operations');
    expect(getHeadquartersOccupant(headquartersRooms[0], staffInput)).toBeNull();
  });

  it('follows the real visibility profile while retaining readable upper-authority staff', () => {
    const { staffInput } = fixture();
    staffInput.role = getRole('britain-tier2', 'britain');
    const authority = getStaffAuthorityProfile(staffInput.role);
    const upperAuthority = staffInput.staff.filter(person => !authority.managedDepartments.includes(person.department));
    expect(upperAuthority.length).toBeGreaterThan(0);
    for (const room of headquartersRooms) {
      const visible = Boolean(room.department && authority.visibleDepartments.includes(room.department));
      const occupant = getHeadquartersOccupant(room, staffInput);
      expect(Boolean(occupant)).toBe(visible);
      if (occupant) expect(occupant.department).toBe(room.department);
    }
    for (const person of upperAuthority) {
      const room = headquartersRooms.find(item => item.department === person.department)!;
      expect(getHeadquartersOccupant(room, staffInput)).toBe(person);
    }
  });

  it('reads all room signals from current engine state without changing it', () => {
    const { nation } = fixture(); const before = structuredClone(nation);
    const values = Object.fromEntries(headquartersRooms.map(room => [room.id, getHeadquartersRoomSignal(room, nation, 3, value => `${value} 파운드`)]));
    expect(values).toEqual({ command: '교전 1 · 부대 2', research: '진행 1 · 완료 1', warehouse: '보병 장비 48,200', workshop: '공장 배분 14 / 30',
      personnel: '참모 현안 3건', diplomacy: '정치력 86', treasury: '국고 920 파운드', infirmary: `진행 중 유행 없음 · 준비도 ${Math.round(nation.publicHealth.preparedness)}` });
    expect(nation).toEqual(before);
    nation.divisions[0].status = 'combat'; nation.production[0].assigned = 9; nation.game.treasury = 777;
    nation.research[1].complete = true; nation.publicHealth.preparedness = 84;
    const changed = (id: string) => getHeadquartersRoomSignal(headquartersRooms.find(room => room.id === id)!, nation, 0, value => `${value} 파운드`);
    expect(changed('command')).toBe('교전 2 · 부대 2'); expect(changed('workshop')).toBe('공장 배분 15 / 30');
    expect(changed('treasury')).toBe('국고 777 파운드'); expect(changed('research')).toBe('진행 0 · 완료 2');
    expect(changed('infirmary')).toBe('진행 중 유행 없음 · 준비도 84');
  });

  it('does not display corrupt numeric data as reassuring zero values', () => {
    const { nation } = fixture(); nation.stockpile.infantryEquipment = Number.NaN;
    const warehouse = headquartersRooms.find(room => room.id === 'warehouse')!;
    const personnel = headquartersRooms.find(room => room.id === 'personnel')!;
    expect(getHeadquartersRoomSignal(warehouse, nation, 0, String)).toBe('보병 장비 자료 없음');
    const unknownIssues = getHeadquartersRoomSignal(personnel, nation, Number.NaN, String);
    expect(unknownIssues).toContain('자료 없음'); expect(unknownIssues).not.toContain('NaN');
  });
});
