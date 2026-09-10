import type { AlternatePath, GameState, NationProfile } from './types';

export type NationalProgramTone = AlternatePath['tone'];

export interface NationalProgramMilestone {
  week: 6 | 13 | 26;
  title: string;
  detail: string;
  reward: string;
}

export interface NationalProgramProgress {
  program: AlternatePath;
  startedWeek: number;
  elapsedWeeks: number;
  progress: number;
  phase: 'implementation' | 'institutional';
  milestones: NationalProgramMilestone[];
  nextMilestone: NationalProgramMilestone | null;
  reviewCount: number;
  nextReviewWeek: number;
  weeksUntilReview: number;
}

export interface NationalProgramReview {
  week: number;
  cycle: number;
  title: string;
  detail: string;
  reward: string;
  warning: string;
}

export interface NationalProgramPulse {
  gameDelta: Partial<Record<keyof GameState, number>>;
  relationDelta: number;
  milestone: NationalProgramMilestone | null;
  review: NationalProgramReview | null;
}

const milestonesByTone: Record<NationalProgramTone, NationalProgramMilestone[]> = {
  reform: [
    { week: 6, title: '사회적 기반 합의', detail: '핵심 집단과 첫 시행 규칙을 확정합니다.', reward: '안정도 +2 · 정치력 +3' },
    { week: 13, title: '제도권 편입', detail: '현장 조직을 법·예산·인사 체계에 연결합니다.', reward: '국고 +45M · 안정도 +2' },
    { week: 26, title: '개혁의 상설화', detail: '정권 교체 뒤에도 남는 독립 기관과 권리를 만듭니다.', reward: '승리 점수 +4 · 정치력 +6' },
  ],
  hardline: [
    { week: 6, title: '지휘계통 단일화', detail: '경쟁 기관의 자원과 명령권을 하나로 묶습니다.', reward: '지휘 점수 +6 · 전쟁 지지 +2' },
    { week: 13, title: '생산·동원 집중', detail: '군수·수송·인력을 우선 목표에 강제 배분합니다.', reward: '연료 +12K · 강철 +16K' },
    { week: 26, title: '전시국가 완성', detail: '높은 집행력을 얻는 대신 사회적 반작용을 감수합니다.', reward: '승리 점수 +5 · 안정도 -3' },
  ],
  international: [
    { week: 6, title: '예비 협정 체결', detail: '상대 정부·망명조직·지역 세력과 실무 채널을 엽니다.', reward: '정보망 +4 · 정치력 +3' },
    { week: 13, title: '공동 기구 출범', detail: '원조·통상·안보 의사결정을 공동 위원회에 연결합니다.', reward: '국고 +55M · 대외관계 +3' },
    { week: 26, title: '질서의 제도화', detail: '일회성 동맹을 장기 규칙과 상호 의존으로 전환합니다.', reward: '승리 점수 +4 · 대외관계 +5' },
  ],
};

export const nationalProgramToneMeta: Record<NationalProgramTone, {
  label: string;
  domain: string;
  cadence: string;
  tradeoff: string;
}> = {
  reform: {
    label: '개혁 노선',
    domain: '사회·제도',
    cadence: '4주마다 정치력 +1 · 국고 -5M',
    tradeoff: '합의가 느리지만 안정과 장기 정통성이 커집니다.',
  },
  hardline: {
    label: '집중 노선',
    domain: '군사·산업',
    cadence: '4주마다 지휘 +2 · 안정도 -1',
    tradeoff: '단기 집행력이 높지만 피로와 반발이 누적됩니다.',
  },
  international: {
    label: '연대 노선',
    domain: '외교·통상',
    cadence: '4주마다 정보망 +1 · 국고 +6M',
    tradeoff: '공동 자원을 얻지만 상대국의 이해를 계속 조정해야 합니다.',
  },
};

export const getNationalProgramStartMarker = (programId: string, week: number) =>
  `national-program:${programId}:started:${week}`;

export const getNationalProgramMilestoneMarker = (programId: string, week: number) =>
  `national-program:${programId}:milestone:${week}`;

export const getNationalProgramReviewMarker = (programId: string, week: number) =>
  `national-program:${programId}:review:${week}`;

function getInstitutionalReview(program: AlternatePath, elapsedWeeks: number): NationalProgramReview | null {
  if (elapsedWeeks < 39 || (elapsedWeeks - 26) % 13 !== 0) return null;
  const cycle = Math.floor((elapsedWeeks - 26) / 13);
  if (program.tone === 'reform') {
    return {
      week: elapsedWeeks,
      cycle,
      title: `제도 접근성 감사 ${cycle}기`,
      detail: '새 제도가 실제 수혜집단과 지방 조직까지 도달했는지 독립 감사를 실시합니다.',
      reward: '안정도 +1 · 정치력 +2 · 국고 -8M',
      warning: '감사·권리 보장 비용이 계속 발생합니다.',
    };
  }
  if (program.tone === 'hardline') {
    return {
      week: elapsedWeeks,
      cycle,
      title: `동원 피로도 검열 ${cycle}기`,
      detail: '집중 동원으로 얻은 생산성과 지휘력을 유지하면서 누적된 조직 피로를 점검합니다.',
      reward: '지휘 점수 +4 · 전쟁 지지 +2 · 안정도 -2',
      warning: '성과를 유지할수록 사회적 반작용이 커집니다.',
    };
  }
  return {
    week: elapsedWeeks,
    cycle,
    title: `공동기구 분담 협상 ${cycle}기`,
    detail: '동맹국의 분담금·시장 접근·정보 공유 조건을 다시 협상합니다.',
    reward: '국고 +25M · 정보망 +2 · 대외관계 +2',
    warning: '상대국의 이해를 조정하지 않으면 공동기구가 느슨해집니다.',
  };
}

export function getNationalProgramStartedWeek(programId: string | null, decisions: string[]) {
  if (!programId) return null;
  const prefix = `national-program:${programId}:started:`;
  const marker = [...decisions].reverse().find((decision) => decision.startsWith(prefix));
  if (!marker) return null;
  const value = Number(marker.slice(prefix.length));
  return Number.isFinite(value) ? value : null;
}

export function getNationalProgramProgress(
  nation: NationProfile,
  programId: string | null,
  decisions: string[],
  currentWeek: number,
): NationalProgramProgress | null {
  const program = nation.paths.find((path) => path.id === programId);
  const startedWeek = getNationalProgramStartedWeek(programId, decisions);
  if (!program || startedWeek === null) return null;
  const elapsedWeeks = Math.max(0, currentWeek - startedWeek);
  const milestones = milestonesByTone[program.tone];
  const phase = elapsedWeeks >= 26 ? 'institutional' : 'implementation';
  const reviewCount = elapsedWeeks < 39 ? 0 : Math.floor((elapsedWeeks - 26) / 13);
  const nextReviewElapsedWeek = elapsedWeeks < 26
    ? 26
    : 26 + (Math.floor((elapsedWeeks - 26) / 13) + 1) * 13;
  return {
    program,
    startedWeek,
    elapsedWeeks,
    progress: Math.min(100, Math.round(elapsedWeeks / 26 * 100)),
    phase,
    milestones,
    nextMilestone: milestones.find((milestone) => milestone.week > elapsedWeeks) ?? null,
    reviewCount,
    nextReviewWeek: startedWeek + nextReviewElapsedWeek,
    weeksUntilReview: Math.max(0, nextReviewElapsedWeek - elapsedWeeks),
  };
}

export function getNationalProgramPulse(
  program: AlternatePath | undefined,
  startedWeek: number | null,
  nextWeek: number,
  decisions: string[],
): NationalProgramPulse {
  if (!program || startedWeek === null) return { gameDelta: {}, relationDelta: 0, milestone: null, review: null };
  const elapsedWeeks = nextWeek - startedWeek;
  const cadence = elapsedWeeks > 0 && elapsedWeeks % 4 === 0;
  const milestone = milestonesByTone[program.tone].find((candidate) => (
    candidate.week === elapsedWeeks
    && !decisions.includes(getNationalProgramMilestoneMarker(program.id, candidate.week))
  )) ?? null;
  const candidateReview = getInstitutionalReview(program, elapsedWeeks);
  const review = candidateReview && !decisions.includes(getNationalProgramReviewMarker(program.id, candidateReview.week))
    ? candidateReview
    : null;
  const gameDelta: Partial<Record<keyof GameState, number>> = cadence
    ? program.tone === 'reform'
      ? { politicalPower: 1, treasury: -5 }
      : program.tone === 'hardline'
        ? { commandPoints: 2, stability: -1, warSupport: 1 }
        : { intelNetwork: 1, treasury: 6 }
    : {};
  if (milestone?.week === 6) {
    Object.assign(gameDelta, program.tone === 'reform'
      ? { stability: (gameDelta.stability ?? 0) + 2, politicalPower: (gameDelta.politicalPower ?? 0) + 3 }
      : program.tone === 'hardline'
        ? { commandPoints: (gameDelta.commandPoints ?? 0) + 6, warSupport: (gameDelta.warSupport ?? 0) + 2 }
        : { intelNetwork: (gameDelta.intelNetwork ?? 0) + 4, politicalPower: (gameDelta.politicalPower ?? 0) + 3 });
  }
  if (milestone?.week === 13) {
    Object.assign(gameDelta, program.tone === 'reform'
      ? { treasury: (gameDelta.treasury ?? 0) + 45, stability: (gameDelta.stability ?? 0) + 2 }
      : program.tone === 'hardline'
        ? { fuel: (gameDelta.fuel ?? 0) + 12, steel: (gameDelta.steel ?? 0) + 16 }
        : { treasury: (gameDelta.treasury ?? 0) + 55 });
  }
  if (milestone?.week === 26) {
    Object.assign(gameDelta, program.tone === 'hardline'
      ? { victoryScore: (gameDelta.victoryScore ?? 0) + 5, stability: (gameDelta.stability ?? 0) - 3 }
      : { victoryScore: (gameDelta.victoryScore ?? 0) + 4, politicalPower: (gameDelta.politicalPower ?? 0) + (program.tone === 'reform' ? 6 : 0) });
  }
  if (review) {
    Object.assign(gameDelta, program.tone === 'reform'
      ? {
          stability: (gameDelta.stability ?? 0) + 1,
          politicalPower: (gameDelta.politicalPower ?? 0) + 2,
          treasury: (gameDelta.treasury ?? 0) - 8,
        }
      : program.tone === 'hardline'
        ? {
            commandPoints: (gameDelta.commandPoints ?? 0) + 4,
            warSupport: (gameDelta.warSupport ?? 0) + 2,
            stability: (gameDelta.stability ?? 0) - 2,
          }
        : {
            treasury: (gameDelta.treasury ?? 0) + 25,
            intelNetwork: (gameDelta.intelNetwork ?? 0) + 2,
          });
  }
  return {
    gameDelta,
    relationDelta: (milestone && program.tone === 'international' ? milestone.week === 26 ? 5 : milestone.week === 13 ? 3 : 0 : 0)
      + (review && program.tone === 'international' ? 2 : 0),
    milestone,
    review,
  };
}

export function getNationalProgram(nation: NationProfile, programId: string | null) {
  return nation.paths.find((path) => path.id === programId);
}
