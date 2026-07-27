import type {
  CareerBranch,
  CovertOperation,
  DiplomaticRelation,
  GameState,
  ResearchProject,
  StrategicPolicy,
  WarEvent,
} from './types';

export type HistoryForce = 'military' | 'industry' | 'diplomacy' | 'civic' | 'liberation' | 'intelligence';
export type EmergentWorldMetric = 'deterrence' | 'multipolarity' | 'decolonization' | 'rights' | 'prosperity' | 'instability';
export type HistoryInfluenceSource = '취임' | '민간 활동' | '국가 원칙' | '결정' | '작전' | '연구' | '외교' | '국정';

export interface HistoryInfluence {
  id: string;
  label: string;
  detail: string;
  source: HistoryInfluenceSource;
  force: HistoryForce;
  strength: number;
  week?: number;
}

export interface EmergentHistoryProfile {
  forces: Record<HistoryForce, number>;
  metricMomentum: Record<EmergentWorldMetric, number>;
  dominantForce: HistoryForce;
  secondaryForce: HistoryForce;
  title: string;
  summary: string;
  influences: HistoryInfluence[];
  resolvedChoiceCount: number;
  signature: string;
  nextLevers: string[];
}

export interface EmergentHistoryInput {
  doctrine: 'coalition' | 'methodical' | 'maneuver';
  roleBranch: CareerBranch;
  game: GameState;
  selectedPolicies?: StrategicPolicy[];
  completedDecisions?: string[];
  events?: WarEvent[];
  research?: ResearchProject[];
  operations?: CovertOperation[];
  relations?: DiplomaticRelation[];
  nationStrategyId?: string;
  nationBudget?: Partial<Record<'reconstruction' | 'welfare' | 'education' | 'industry' | 'diplomacy' | 'security', number>>;
  civilianInfluences?: Array<{
    id: string;
    label: string;
    detail: string;
    force: HistoryForce;
    strength: number;
  }>;
}

export const historyForceLabels: Record<HistoryForce, string> = {
  military: '군사 주도',
  industry: '산업·과학',
  diplomacy: '외교·연합',
  civic: '시민·제도',
  liberation: '독립·자결',
  intelligence: '정보·공작',
};

export const historyForceDescriptions: Record<HistoryForce, string> = {
  military: '전선 성과, 동원, 군사 교리와 무력 사용',
  industry: '생산체계, 연구, 재건과 경제 운용',
  diplomacy: '협상, 원조, 동맹과 국제기구',
  civic: '복지, 노동권, 지방자치와 정치적 정당성',
  liberation: '민족자결, 탈식민화와 저항운동 지원',
  intelligence: '첩보, 비밀공작, 감시와 정보기관의 영향',
};

const forceOrder: HistoryForce[] = ['military', 'industry', 'diplomacy', 'civic', 'liberation', 'intelligence'];
const clamp = (value: number, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, value));
const round = (value: number) => Math.round(value);

function forceFromText(text: string, fallback: HistoryForce): HistoryForce {
  if (/독립|해방|자결|식민|저항|민족|자치/.test(text)) return 'liberation';
  if (/복지|보건|노동|의회|공화|선거|권리|민생|사회|주택|교육/.test(text)) return 'civic';
  if (/외교|협상|동맹|연합|원조|국제|교섭|평화|휴전|무역/.test(text)) return 'diplomacy';
  if (/정보|첩보|공작|비밀|암호|감시|방첩|요원/.test(text)) return 'intelligence';
  if (/산업|경제|재정|생산|공장|연구|과학|기술|장비|통화|재건/.test(text)) return 'industry';
  if (/전선|전투|공세|군사|교리|무기|동원|지휘|점령|방어/.test(text)) return 'military';
  return fallback;
}

function addInfluence(
  forces: Record<HistoryForce, number>,
  influences: HistoryInfluence[],
  influence: HistoryInfluence,
) {
  forces[influence.force] += influence.strength;
  if (!influences.some((item) => item.id === influence.id)) influences.push(influence);
}

function policyForce(policy: StrategicPolicy): HistoryForce {
  if (policy.id.includes('autonomy')) return 'liberation';
  if (policy.id.includes('welfare') || policy.id.includes('balanced')) return 'civic';
  if (policy.domain === 'economy') return 'industry';
  if (policy.domain === 'doctrine') return 'military';
  if (policy.domain === 'diplomacy') return 'diplomacy';
  return forceFromText(`${policy.title} ${policy.description}`, 'civic');
}

function strategyForce(strategyId: string): HistoryForce {
  if (strategyId === 'social-contract' || strategyId === 'open-republic') return 'civic';
  if (strategyId === 'developmental-state' || strategyId === 'reconstruction-state') return 'industry';
  if (strategyId === 'security-republic') return 'military';
  return 'diplomacy';
}

function sourceForEvent(event: WarEvent): HistoryInfluenceSource {
  if (event.trace?.domain === 'operations') return '작전';
  if (event.trace?.domain === 'diplomacy') return '외교';
  if (event.trace?.domain === 'management') return '결정';
  return '결정';
}

function getMetricMomentum(forces: Record<HistoryForce, number>): Record<EmergentWorldMetric, number> {
  const centered = (force: HistoryForce) => forces[force] - 50;
  return {
    deterrence: clamp(round(centered('military') * .28 + centered('intelligence') * .12), -22, 22),
    multipolarity: clamp(round(centered('diplomacy') * .25 + centered('liberation') * .14), -22, 22),
    decolonization: clamp(round(centered('liberation') * .31 + centered('civic') * .09), -22, 22),
    rights: clamp(round(centered('civic') * .29 - centered('intelligence') * .07), -22, 22),
    prosperity: clamp(round(centered('industry') * .28 + centered('diplomacy') * .08), -22, 22),
    instability: clamp(round(centered('military') * .13 + centered('intelligence') * .08 - centered('civic') * .15 - centered('diplomacy') * .07), -22, 22),
  };
}

function getNextLevers(forces: Record<HistoryForce, number>) {
  const sorted = [...forceOrder].sort((left, right) => forces[left] - forces[right]);
  const suggestions: Record<HistoryForce, string> = {
    military: '공세·방어 교리와 부대 명령은 군사 주도력을 높입니다.',
    industry: '연구와 생산·재건 예산은 산업·과학 경로를 강화합니다.',
    diplomacy: '외교 의제·상호원조·협상은 다자 질서의 가능성을 높입니다.',
    civic: '복지·노동·지방자치 결정은 권리와 제도 정당성을 높입니다.',
    liberation: '자치협정·독립운동 지원은 탈식민화의 속도와 주체를 바꿉니다.',
    intelligence: '요원 배치와 비밀공작은 정보국가와 비정규전의 비중을 높입니다.',
  };
  return sorted.slice(0, 3).map((force) => suggestions[force]);
}

export function deriveEmergentHistory(input: EmergentHistoryInput): EmergentHistoryProfile {
  const forces: Record<HistoryForce, number> = {
    military: 24,
    industry: 24,
    diplomacy: 24,
    civic: 24,
    liberation: 20,
    intelligence: 20,
  };
  const influences: HistoryInfluence[] = [];

  const doctrineMeta = input.doctrine === 'coalition'
    ? { label: '연합과 협상', detail: '취임 지휘 철학이 공동작전과 협상을 우선합니다.', force: 'diplomacy' as const }
    : input.doctrine === 'methodical'
      ? { label: '산업과 준비', detail: '취임 지휘 철학이 생산·연구·장기 준비를 우선합니다.', force: 'industry' as const }
      : { label: '속도와 충격', detail: '취임 지휘 철학이 기동전과 결전 속도를 우선합니다.', force: 'military' as const };
  addInfluence(forces, influences, { id: `doctrine:${input.doctrine}`, ...doctrineMeta, source: '취임', strength: 20 });

  const branchForce: Record<CareerBranch, HistoryForce> = { military: 'military', politics: 'civic', intelligence: 'intelligence' };
  addInfluence(forces, influences, {
    id: `branch:${input.roleBranch}`,
    label: input.roleBranch === 'military' ? '군 지휘계통의 권한' : input.roleBranch === 'politics' ? '정치 보직의 위임' : '정보조직의 접근권',
    detail: '선택한 보직의 실제 권한 범위가 가능한 행동과 역사적 영향의 출발점을 만듭니다.',
    source: '취임',
    force: branchForce[input.roleBranch],
    strength: 11,
  });

  (input.civilianInfluences ?? []).forEach((influence) => {
    addInfluence(forces, influences, {
      ...influence,
      source: '민간 활동',
    });
  });

  (input.selectedPolicies ?? []).forEach((policy) => {
    addInfluence(forces, influences, {
      id: `policy:${policy.id}`,
      label: policy.title,
      detail: policy.effect,
      source: '국가 원칙',
      force: policyForce(policy),
      strength: 15,
    });
  });

  (input.events ?? [])
    .filter((event) => event.trace?.certainty === 'confirmed' && event.trace.decision)
    .slice(0, 24)
    .forEach((event) => {
      const text = `${event.title} ${event.trace?.decision ?? ''} ${event.detail}`;
      const fallback: HistoryForce = event.trace?.domain === 'operations' ? 'military'
        : event.trace?.domain === 'diplomacy' ? 'diplomacy'
          : event.trace?.domain === 'history' ? 'liberation' : 'industry';
      addInfluence(forces, influences, {
        id: `event:${event.id}`,
        label: event.trace?.decision ?? event.title,
        detail: event.trace?.ongoing?.[0] ?? event.detail,
        source: sourceForEvent(event),
        force: forceFromText(text, fallback),
        strength: event.trace?.domain === 'history' ? 7 : 4,
        week: event.week,
      });
    });

  (input.research ?? []).filter((project) => project.complete).forEach((project) => {
    const text = `${project.name} ${project.branch} ${project.description}`;
    addInfluence(forces, influences, {
      id: `research:${project.id}`,
      label: `${project.name} 연구 완료`,
      detail: project.description,
      source: '연구',
      force: forceFromText(text, 'industry'),
      strength: 5,
    });
  });

  (input.operations ?? []).filter((operation) => operation.active || operation.progress >= 50).forEach((operation) => {
    addInfluence(forces, influences, {
      id: `operation:${operation.id}`,
      label: operation.name,
      detail: `${operation.region}에서 진행된 비밀작전이 정보기관과 현지 세력의 영향력을 키웁니다.`,
      source: '작전',
      force: 'intelligence',
      strength: Math.max(3, Math.round(operation.progress / 18)),
    });
  });

  if (input.nationStrategyId) {
    addInfluence(forces, influences, {
      id: `strategy:${input.nationStrategyId}`,
      label: `전후 국가 노선 · ${input.nationStrategyId}`,
      detail: '전후 내각의 장기 발전 노선이 세계선의 제도와 경제 방향을 누적해서 바꿉니다.',
      source: '국정',
      force: strategyForce(input.nationStrategyId),
      strength: 16,
    });
  }

  if (input.nationBudget) {
    const budgetForces: Record<keyof NonNullable<EmergentHistoryInput['nationBudget']>, HistoryForce> = {
      reconstruction: 'industry', welfare: 'civic', education: 'civic', industry: 'industry', diplomacy: 'diplomacy', security: 'military',
    };
    Object.entries(input.nationBudget)
      .sort(([, left], [, right]) => Number(right) - Number(left))
      .slice(0, 2)
      .forEach(([domain, share]) => {
        addInfluence(forces, influences, {
          id: `budget:${domain}`,
          label: `${domain} 예산 우선`,
          detail: `국가예산 ${share}%가 장기 제도와 사회 구조에 반영됩니다.`,
          source: '국정',
          force: budgetForces[domain as keyof typeof budgetForces],
          strength: Math.max(3, Math.round(Number(share) / 4)),
        });
      });
  }

  const relationAverage = (input.relations ?? []).reduce((total, relation) => total + relation.value, 0) / Math.max(1, input.relations?.length ?? 0);
  if ((input.relations?.length ?? 0) > 0 && relationAverage >= 65) forces.diplomacy += Math.round((relationAverage - 60) / 3);
  forces.military += Math.round((input.game.airPower + input.game.navalPower + input.game.warSupport - 150) / 18);
  forces.industry += Math.round((input.game.factories - 20) / 2.5);
  forces.intelligence += Math.round((input.game.intelNetwork - 50) / 5);
  forces.civic += Math.round((input.game.stability - 50) / 5);

  forceOrder.forEach((force) => { forces[force] = clamp(round(forces[force])); });
  const ranked = [...forceOrder].sort((left, right) => forces[right] - forces[left] || forceOrder.indexOf(left) - forceOrder.indexOf(right));
  const [dominantForce, secondaryForce] = ranked;
  const metricMomentum = getMetricMomentum(forces);
  const resolvedChoiceCount = (input.completedDecisions ?? []).filter((decision) => decision.startsWith('world-flashpoint:')).length
    + (input.events ?? []).filter((event) => event.trace?.certainty === 'confirmed' && ['history', 'diplomacy', 'management'].includes(event.trace.domain)).length;
  const title = `${historyForceLabels[dominantForce]} 중심의 역사 · ${historyForceLabels[secondaryForce]} 보조 흐름`;
  const summary = `${historyForceDescriptions[dominantForce]}의 영향이 가장 강하며, ${historyForceDescriptions[secondaryForce]}이(가) 이를 보완하거나 충돌합니다. 미래는 선언문이 아니라 다음 행동으로 계속 바뀝니다.`;
  const signature = forceOrder.map((force) => `${force}:${forces[force]}`).join('|');

  return {
    forces,
    metricMomentum,
    dominantForce,
    secondaryForce,
    title,
    summary,
    influences: influences.sort((left, right) => (right.week ?? -1) - (left.week ?? -1) || right.strength - left.strength).slice(0, 12),
    resolvedChoiceCount,
    signature,
    nextLevers: getNextLevers(forces),
  };
}
