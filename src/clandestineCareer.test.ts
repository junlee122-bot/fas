import { describe, expect, it } from 'vitest';
import { getRole } from './campaign';
import {
  advanceClandestineCareerWeek,
  createClandestineCareerState,
  getClandestineIncidentForecast,
  getClandestineMissionForecast,
  respondToClandestineIncident,
  respondToClandestineMission,
  setClandestinePosture,
} from './clandestineCareer';
import type {
  ClandestineCareerState,
  ClandestineIncident,
  ClandestineWeekContext,
} from './clandestineCareer';

const role = getRole('britain-tier2', 'britain');

function createState(): ClandestineCareerState {
  return createClandestineCareerState({
    homeNationId: 'britain',
    handlerNationId: 'germany',
    week: 4,
    role,
    handlerTrust: 58,
    coverStrength: 74,
    weeklyRetainer: 12,
  });
}

function context(week: number, exposure = 24): ClandestineWeekContext {
  return {
    week,
    role,
    intelNetwork: 76,
    stability: 62,
    warSupport: 71,
    campaignPhase: 'war',
    exposure,
  };
}

describe('long-form clandestine career', () => {
  it('opens with a handler identity, cover and immediate verification mission', () => {
    const state = createState();
    expect(state.status).toBe('probation');
    expect(state.handlerAlias.length).toBeGreaterThan(0);
    expect(state.coverName.length).toBeGreaterThan(0);
    expect(state.missions).toHaveLength(1);
    expect(state.missions[0]?.status).toBe('offered');
    expect(state.missions[0]?.eraId).toBe('world-war');
    expect(state.careerChapters[0]?.eraId).toBe('world-war');
    expect(state.messages[0]?.sender).toBe('handler');
  });

  it('turns a mission response into a multi-week assignment and resolves it', () => {
    const initial = createState();
    const mission = initial.missions[0]!;
    const started = respondToClandestineMission(initial, mission.id, 'comply-selective', context(4));
    expect(started?.state.missions[0]?.status).toBe('in-progress');
    expect(started?.state.missions[0]?.resolutionWeek).toBe(6);
    const weekFive = advanceClandestineCareerWeek(started!.state, context(5, 30));
    expect(weekFive.state.missions[0]?.status).toBe('in-progress');
    const weekSix = advanceClandestineCareerWeek(weekFive.state, context(6, 31));
    expect(['resolved', 'failed']).toContain(weekSix.state.missions[0]?.status);
    expect(weekSix.notices.some((notice) => notice.title.includes('비밀 임무 결과'))).toBe(true);
  });

  it('supports reporting to home counterintelligence and controlled deception', () => {
    const initial = createState();
    const mission = initial.missions[0]!;
    const result = respondToClandestineMission(initial, mission.id, 'controlled-double', context(4));
    expect(result?.state.status).toBe('controlled-double');
    expect(result?.state.controlledByHome).toBe(true);
    expect(result?.state.posture).toBe('controlled-deception');
    expect(result?.state.homeTrust).toBeGreaterThan(initial.homeTrust);
    expect(result?.gameDelta.intelNetwork).toBeGreaterThan(0);
  });

  it('changes the long-term posture without discarding mission history', () => {
    const initial = createState();
    const prepared = setClandestinePosture(initial, 'prepare-exit');
    expect(prepared.status).toBe('exfiltration');
    expect(prepared.posture).toBe('prepare-exit');
    expect(prepared.missions).toEqual(initial.missions);
  });

  it('resolves counterintelligence incidents into distinct career states', () => {
    const incident: ClandestineIncident = {
      id: 'incident-test',
      kind: 'internal-audit',
      openedWeek: 8,
      title: '접근기록 감사',
      detail: '내부 감사가 시작됐습니다.',
      stakes: ['보안인가', '핸들러 연락선'],
    };
    const initial = {
      ...createState(),
      status: 'under-investigation' as const,
      incident,
    };
    const cooperate = respondToClandestineIncident(initial, 'cooperate-home', context(8, 72));
    expect(cooperate?.state.incident).toBeNull();
    expect(cooperate?.state.status).toBe('controlled-double');
    expect(cooperate?.state.controlledByHome).toBe(true);
    expect(cooperate?.exposureDelta).toBeLessThan(0);
    expect(cooperate?.state.incidentCooldownUntilWeek).toBe(60);
    expect(cooperate?.state.stress).toBeLessThan(initial.stress);
    const cutTies = respondToClandestineIncident(initial, 'cut-ties', context(8, 72));
    expect(cutTies?.state.status).toBe('closed');
  });

  it('shows quantified mission and incident forecasts before committing', () => {
    const initial = createState();
    const mission = initial.missions[0]!;
    const missionForecast = getClandestineMissionForecast(initial, mission, 'controlled-double', context(4, 42));
    expect(missionForecast.successChance).toBeGreaterThan(10);
    expect(missionForecast.exposureDelta).toBe(2);
    expect(missionForecast.homeTrustDelta).toBe(12);
    const incidentForecast = getClandestineIncidentForecast(initial, 'cooperate-home');
    expect(incidentForecast.exposureDelta).toBe(-24);
    expect(incidentForecast.cooldownWeeks).toBe(52);
  });

  it('opens a new career chapter and recovers pressure when the historical era changes', () => {
    const initial = {
      ...createState(),
      status: 'active' as const,
      lastProcessedWeek: 415,
      nextMissionWeek: 500,
      missions: [],
      stress: 74,
      pressure: 68,
      incidentCooldownUntilWeek: 0,
    };
    const result = advanceClandestineCareerWeek(initial, context(416, 44));
    expect(result.state.currentEraId).toBe('early-cold-war');
    expect(result.state.careerChapters).toHaveLength(2);
    expect(result.state.careerChapters[1]?.endedWeek).toBe(415);
    expect(result.state.stress).toBeLessThan(initial.stress);
    expect(result.notices.some((notice) => notice.title.includes('새 장'))).toBe(true);
  });

  it('does not advance a closed clandestine career', () => {
    const closed = { ...createState(), status: 'closed' as const };
    const result = advanceClandestineCareerWeek(closed, context(12, 40));
    expect(result.state).toBe(closed);
    expect(result.notices).toHaveLength(0);
    expect(result.exposureDelta).toBe(0);
  });

  it('opens a final extraction decision and returns a foreign transfer target', () => {
    const prepared = {
      ...createState(),
      status: 'exfiltration' as const,
      posture: 'prepare-exit' as const,
      extractionReadiness: 78,
      lastProcessedWeek: 9,
      missions: [],
      nextMissionWeek: 20,
    };
    const advanced = advanceClandestineCareerWeek(prepared, context(10, 58));
    expect(advanced.state.incident?.kind).toBe('emergency-extraction');
    expect(advanced.needsAttention).toBe(true);
    const extracted = respondToClandestineIncident(advanced.state, 'request-extraction', context(10, 58));
    expect(extracted?.transferNationId).toBe('germany');
    expect(extracted?.state.status).toBe('closed');
    expect(extracted?.state.extractionReadiness).toBe(100);
  });
});
