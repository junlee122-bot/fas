import type { GeneratedWorldEvent, WorldMetric } from './worldHistory';

export type DystopianPressureId =
  | 'surveillance-state'
  | 'permanent-war'
  | 'corporate-sovereignty'
  | 'fortress-scarcity'
  | 'biosecurity-regime'
  | 'algorithmic-caste'
  | 'ecological-collapse';

export type DystopianPressureStage = 'contained' | 'emerging' | 'advanced' | 'entrenched';

export interface DystopianPressure {
  id: DystopianPressureId;
  title: string;
  worldTitle: string;
  risk: number;
  stage: DystopianPressureStage;
  directChoiceCount: number;
  premise: string;
  everydayLife: string;
  causes: string[];
  reversalLevers: string[];
}

export interface DystopianWorldOutlook {
  warningLevel: 'guarded' | 'unstable' | 'critical';
  resilience: number;
  dominantPressureId: DystopianPressureId;
  dominantWorldTitle: string;
  directChoiceCount: number;
  pressures: DystopianPressure[];
  explanation: string;
}

interface PressureDefinition {
  id: DystopianPressureId;
  title: string;
  worldTitle: string;
  premise: string;
  everydayLife: string;
  reversalLevers: string[];
  base: (metrics: Record<WorldMetric, number>) => number;
  matches: (entry: GeneratedWorldEvent) => boolean;
}

const textOf = (entry: GeneratedWorldEvent) => [
  entry.event.title,
  entry.variant.title,
  entry.variant.summary,
  entry.variant.consequence,
].join(' ');

const definitions: PressureDefinition[] = [
  {
    id: 'surveillance-state',
    title: '전면 감시 안보국가',
    worldTitle: '유리벽 안의 평화',
    premise: '테러·전쟁·사회불안을 명분으로 정보기관과 행정부의 비상권한이 일상 통치가 됩니다.',
    everydayLife: '이동·통신·고용 기록이 충성도와 연결되고, 선거는 남아도 반대파의 조직 비용이 급격히 높아집니다.',
    reversalLevers: ['정보기관 사법통제와 영장주의 확립', '비상권한 일몰제와 독립 언론 보호', '감시자료 열람·삭제·항소권 보장'],
    base: (metrics) => (100 - metrics.rights) * .56 + metrics.instability * .2 + metrics.deterrence * .08,
    matches: (entry) => (
      (entry.variant.metricDelta.rights ?? 0) < 0
      && (
        entry.event.category === 'intelligence'
        || entry.event.category === 'society'
        || entry.event.category === 'technology'
        || /검열|은폐|비밀경찰|국가안보|폐쇄망|정치경찰/.test(textOf(entry))
      )
    ),
  },
  {
    id: 'permanent-war',
    title: '영구전쟁 동원체제',
    worldTitle: '끝나지 않는 비상사태',
    premise: '핵 억지·대리전·군비경쟁이 서로를 정당화하며 평시의 제도와 경제까지 전시 지휘체계로 바꿉니다.',
    everydayLife: '세대마다 새로운 적이 지정되고, 교육·산업·과학의 성과가 시민생활보다 전쟁 준비로 평가됩니다.',
    reversalLevers: ['군비 상한·상호사찰·위기 직통선 구축', '전쟁예산의 의회 승인과 공개 원가감사', '대리전 당사자의 주민투표·중립화 협상'],
    base: (metrics) => metrics.instability * .42 + metrics.deterrence * .33 + (100 - metrics.prosperity) * .13,
    matches: (entry) => (
      ['nuclear', 'proxy-war', 'space'].includes(entry.event.category)
      && (entry.variant.metricDelta.instability ?? 0) > 3
    ) || /핵교환|군비|무장화|대리전|총동원|선제공격/.test(textOf(entry)),
  },
  {
    id: 'corporate-sovereignty',
    title: '기업주권·사적 치안 세계',
    worldTitle: '주식회사가 된 국경',
    premise: '초국적 기업·도시회랑·채권자가 세금·치안·노동규칙을 국가보다 빠르게 결정합니다.',
    everydayLife: '시민권보다 고용계약과 신용등급이 주거·의료·이동권을 좌우하고, 손실은 공공이 떠안습니다.',
    reversalLevers: ['독점 분할과 노동자·지역사회 이사회 참여', '사적 군사·치안의 공법 통제', '조세회피 차단과 필수서비스의 공공 보장'],
    base: (metrics) => Math.max(0, metrics.prosperity - metrics.rights) * .72 + (100 - metrics.rights) * .23 + metrics.instability * .15,
    matches: (entry) => (
      ['economy', 'technology'].includes(entry.event.category)
      && (
        (entry.variant.metricDelta.rights ?? 0) < 0
        || /기업국가|다국적 기업|민영화|사적 치안|용병|독점기업|채권자/.test(textOf(entry))
      )
    ),
  },
  {
    id: 'fortress-scarcity',
    title: '봉쇄경제·요새국가',
    worldTitle: '철의 관세선 너머',
    premise: '식량·에너지·통화·물류 충격이 상시 봉쇄 논리와 배급 신분제를 낳습니다.',
    everydayLife: '국경과 공급망이 닫히고 직업·지역·충성등급에 따라 배급과 이동 허가가 달라집니다.',
    reversalLevers: ['식량·의약·에너지 공동비축 협정', '민간 배급감사와 취약계층 우선권', '지역 간 결제·철도·항만의 최소 개방선 유지'],
    base: (metrics) => metrics.instability * .4 + (100 - metrics.prosperity) * .38 + (100 - metrics.multipolarity) * .08,
    matches: (entry) => (
      entry.event.category === 'economy'
      && ((entry.variant.metricDelta.prosperity ?? 0) < -2 || (entry.variant.metricDelta.instability ?? 0) > 4)
    ) || /봉쇄|배급|자급|관세|금수|공급망|채무위기/.test(textOf(entry)),
  },
  {
    id: 'biosecurity-regime',
    title: '상시 생물안보 체제',
    worldTitle: '격리구역의 공화국',
    premise: '감염병 대응이 공공보건을 넘어 영구적 이동통제·신원분류·비밀 실험의 통치기술로 굳어집니다.',
    everydayLife: '건강등급과 접촉기록이 취업·이동·보험을 결정하고, 비상조치의 종료 여부를 같은 기관이 판정합니다.',
    reversalLevers: ['보건 비상조치의 의회 재승인과 일몰', '익명화된 역학자료와 차별금지 규칙', '실험·백신·격리정책의 국제 공개검증'],
    base: (metrics) => (100 - metrics.rights) * .3 + metrics.instability * .26 + (100 - metrics.prosperity) * .12,
    matches: (entry) => (
      entry.event.category === 'public-health'
      && ((entry.variant.metricDelta.rights ?? 0) < 0 || (entry.variant.metricDelta.instability ?? 0) > 3)
      && /격리|생물안보|감염|팬데믹|건강등급|비밀 실험|봉쇄/.test(textOf(entry))
    ),
  },
  {
    id: 'algorithmic-caste',
    title: '알고리즘 신분사회',
    worldTitle: '점수로 배정된 인생',
    premise: '자동화·예측모형·플랫폼이 복지·채용·치안·정치정보를 보이지 않는 점수로 배분합니다.',
    everydayLife: '사람은 결정 이유를 알지 못한 채 대출·학교·직장·출국을 거부당하고, 데이터 소유자가 계층 이동을 통제합니다.',
    reversalLevers: ['자동결정 설명·열람·인간 항소권', '고위험 모델 공개감사와 차별검사', '개인 데이터 이동권과 공공 연산 인프라'],
    base: (metrics) => (100 - metrics.rights) * .36 + Math.max(0, metrics.prosperity - metrics.rights) * .3 + metrics.instability * .1,
    matches: (entry) => (
      ['technology', 'intelligence'].includes(entry.event.category)
      && (entry.variant.metricDelta.rights ?? 0) < 0
      && /알고리즘|인공지능|자동화|데이터|예측|플랫폼|폐쇄망|감시/.test(textOf(entry))
    ),
  },
  {
    id: 'ecological-collapse',
    title: '생태붕괴·기후 계엄',
    worldTitle: '붉어진 하늘 아래',
    premise: '기후·오염·물·토지 위기가 협력 대신 국경봉쇄와 자원전쟁으로 처리됩니다.',
    everydayLife: '재난보험이 사라지고 이주 허가·냉방·식수·안전지역이 새로운 계급과 국제분쟁의 기준이 됩니다.',
    reversalLevers: ['구속력 있는 탄소·오염 한도와 전환기금', '기후이주 권리와 도시 적응예산 보장', '물·산림·해양의 공동 관측과 분쟁중재'],
    base: (metrics) => metrics.instability * .4 + (100 - metrics.prosperity) * .28 + (100 - metrics.rights) * .12,
    matches: (entry) => (
      entry.event.category === 'environment'
      && ((entry.variant.metricDelta.instability ?? 0) > 2 || (entry.variant.metricDelta.prosperity ?? 0) < 0)
      && /기후|오염|자원|생태|가뭄|해수면|환경|관세/.test(textOf(entry))
    ),
  },
];

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function stageForRisk(risk: number): DystopianPressureStage {
  if (risk >= 78) return 'entrenched';
  if (risk >= 60) return 'advanced';
  if (risk >= 38) return 'emerging';
  return 'contained';
}

function scorePressure(definition: PressureDefinition, timeline: GeneratedWorldEvent[], metrics: Record<WorldMetric, number>) {
  const matching = timeline.filter(definition.matches);
  const manual = matching.filter((entry) => entry.isPlayerChoice);
  const projected = matching.filter((entry) => !entry.isPlayerChoice);
  const manualImpact = manual.reduce((total, entry) => {
    const deltaMagnitude = Object.values(entry.variant.metricDelta).reduce((sum, value) => sum + Math.abs(value ?? 0), 0);
    return total + 6 + Math.min(8, deltaMagnitude * .55);
  }, 0);
  const projectedImpact = Math.min(12, projected.length * 1.5);
  const risk = clamp(definition.base(metrics) + manualImpact + projectedImpact);
  const causeEntries = [...manual, ...projected].slice(0, 4);
  const causes = causeEntries.length > 0
    ? causeEntries.map((entry) => `${entry.isPlayerChoice ? '직접 선택' : '누적 조건'} · ${entry.event.title} → ${entry.variant.title}`)
    : ['현재는 이 체제를 밀어 올리는 뚜렷한 선택 연쇄가 없습니다.'];
  return {
    id: definition.id,
    title: definition.title,
    worldTitle: definition.worldTitle,
    risk,
    stage: stageForRisk(risk),
    directChoiceCount: manual.length,
    premise: definition.premise,
    everydayLife: definition.everydayLife,
    causes,
    reversalLevers: definition.reversalLevers,
  } satisfies DystopianPressure;
}

export function resolveDystopianWorldOutlook(
  timeline: GeneratedWorldEvent[],
  metrics: Record<WorldMetric, number>,
): DystopianWorldOutlook {
  const pressures = definitions
    .map((definition) => scorePressure(definition, timeline, metrics))
    .sort((left, right) => right.risk - left.risk || left.id.localeCompare(right.id));
  const dominant = pressures[0];
  const directChoiceCount = timeline.filter((entry) => entry.isPlayerChoice).length;
  const topPressureAverage = pressures.slice(0, 3).reduce((sum, pressure) => sum + pressure.risk, 0) / 3;
  const resilience = clamp(metrics.rights * .42 + metrics.prosperity * .28 + (100 - metrics.instability) * .3 - topPressureAverage * .12);
  const warningLevel = dominant.risk >= 78 ? 'critical' : dominant.risk >= 55 ? 'unstable' : 'guarded';
  return {
    warningLevel,
    resilience,
    dominantPressureId: dominant.id,
    dominantWorldTitle: dominant.worldTitle,
    directChoiceCount,
    pressures,
    explanation: '정해진 악역이나 무작위 결말이 아니라, 전쟁·권리·경제·정보·보건·환경 선택이 누적되어 각 체제의 위험도를 바꿉니다.',
  };
}
