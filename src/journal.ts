import type { WarEvent, WarEventComparison, WarEventDomain, WarEventTrace } from './types';

export type JournalFilter = 'all' | WarEventDomain;

const diplomacyKeywords = ['외교', '동맹', '협상', '조약', '관계 개선', '대사', '국제', '지원 요청'];
const historyKeywords = ['대체역사', '전후질서', '세계선', '역사 이정표', '독립', '헌정', '탈식민', '국제질서'];
const managementKeywords = ['국내', '내각', '정치', '생산', '연구', '훈련', '승진', '휴양', '의제', '원칙', '참모', '영입', '재정', '채권', '산업', '취임', '보건', '감염병', '장비', '조달', '주간 지휘 결산'];

export function categorizeWarEvent(event: WarEvent): WarEventDomain {
  if (event.trace?.domain) return event.trace.domain;
  const text = `${event.title} ${event.detail}`;
  if (diplomacyKeywords.some((keyword) => text.includes(keyword))) return 'diplomacy';
  if (historyKeywords.some((keyword) => text.includes(keyword))) return 'history';
  if (managementKeywords.some((keyword) => text.includes(keyword))) return 'management';
  return 'operations';
}

function effect(label: string, value: string, tone: 'positive' | 'negative' | 'neutral'): WarEventTrace['effects'][number] {
  return { label, value, tone };
}

const common = {
  operations: {
    decision: '작전 명령·부대 배치·전투 태세를 이번 주 전장에 적용했습니다.',
    trigger: '예약된 작전 또는 적의 주기적 대응 조건이 충족됐습니다.',
    factors: ['사단 전력·조직력·보급', '지휘관 능력·교리·공세 태세', '정보망 신뢰도·적 압력·전장 변수'],
    ongoing: ['전투 뒤 사단의 회복 상태와 보급이 다음 작전의 승산을 바꿉니다.'],
    nextActions: ['육군 화면에서 손실·조직력·보급을 확인하고 재공세 또는 휴식을 결정하십시오.'],
  },
  management: {
    decision: '이번 주에 유지한 생산·연구·인사·정책 배정을 적용했습니다.',
    trigger: '주간 행정 해결 시점 또는 승인한 사업의 완료 조건에 도달했습니다.',
    factors: ['배정된 공장·예산·참모', '국가 원칙과 위임 보너스', '누적 진행도·조직 피로·보유 자원'],
    ongoing: ['현재 변화는 다음 주 생산효율·연구진행·조직부담의 기준값이 됩니다.'],
    nextActions: ['지휘 본부의 다음 주 예측과 담당 부서의 병목을 비교해 배정을 조정하십시오.'],
  },
  diplomacy: {
    decision: '선택한 회담 의제·양보·협력 노선을 외교 관계에 적용했습니다.',
    trigger: '회담 준비도 또는 외교 사건의 해결 조건이 충족됐습니다.',
    factors: ['상대국 관계와 회담 준비도', '제안한 비용·정치력·정보', '국가 노선과 전황의 신뢰도'],
    ongoing: ['관계와 신뢰 변화는 이후 지원 요청·동맹·인재 접근 조건에 누적됩니다.'],
    nextActions: ['외교 화면에서 상대국 관계와 다음 의제의 준비도를 확인하십시오.'],
  },
  history: {
    decision: '직접 선택한 대체역사 원칙 또는 세계선 분기를 장기 국가노선에 반영했습니다.',
    trigger: '설계한 이정표나 전후질서 분기의 주기적 적용 시점에 도달했습니다.',
    factors: ['플레이어가 고른 세계선 결과', '현재 전쟁 성과와 국가 지표', '정부·경제·동맹·권리 노선의 일관성'],
    ongoing: ['이 선택은 후속 사건의 자동분기와 최종 결말 적합도에 계속 반영됩니다.'],
    nextActions: ['대체지구 아틀라스에서 바뀐 후속 사건과 최종 결말 후보를 비교하십시오.'],
  },
} satisfies Record<WarEventDomain, Pick<WarEventTrace, 'decision' | 'trigger' | 'factors' | 'ongoing' | 'nextActions'>>;

function inferredDomain(title: string, detail: string): WarEventDomain {
  return categorizeWarEvent({ id: 0, week: 0, title, detail, tone: 'neutral' });
}

export function createWarEventTrace(title: string, detail: string, tone: WarEvent['tone'], override: Partial<WarEventTrace> = {}): WarEventTrace {
  const domain = override.domain ?? inferredDomain(title, detail);
  const defaults = common[domain];
  let decision = defaults.decision;
  let trigger = defaults.trigger;
  let factors = [...defaults.factors];
  let ongoing = [...defaults.ongoing];
  let nextActions = [...defaults.nextActions];
  let effects = [effect('확정 결과', detail, tone === 'good' ? 'positive' : tone === 'bad' ? 'negative' : 'neutral')];
  let certainty: WarEventTrace['certainty'] = title.includes('세계 전황') ? 'developing' : 'confirmed';

  if (/전선 돌파|공세 좌절|적 반격|우군 집결/.test(title)) {
    decision = title.includes('적 반격') ? '플레이어가 구축한 방어선과 예비대 배치를 적의 반격에 적용했습니다.' : '승인한 공세 목표·투입 사단·전투 태세를 실제 전투에 적용했습니다.';
    trigger = title.includes('적 반격') ? '3주 주기의 적 공세 판정에서 해당 전선이 위협 목표로 선택됐습니다.' : '대기 중이던 최우선 작전 명령이 주간 진행과 함께 해결됐습니다.';
    factors = ['아군 전력·조직력·보급과 장비', '지휘관 공격·방어·군수 능력과 피로', '신중·균형·총력 태세, 교리, 정보 신뢰도', '목표 가치·적 압력·숨은 전장 난수'];
    ongoing = ['전투 손실은 병력·조직력·보급·전쟁 지지와 다음 주 회복 속도에 남습니다.', '영토 확보·상실은 승리점수와 후속 전선의 인접 관계를 바꿉니다.'];
    nextActions = [tone === 'bad' ? '회복 중인 사단을 재투입하지 말고 보급 또는 예비대부터 보강하십시오.' : '새 전선의 낮아진 보급을 회복한 뒤 다음 인접 목표를 선정하십시오.', '전투 보고서에서 네 단계 전투 흐름과 실제 손실 원인을 확인하십시오.'];
  } else if (/연구 완료|장비 개발 완료/.test(title)) {
    decision = '활성 연구 슬롯과 과학·공학 참모 배정을 매주 유지했습니다.';
    trigger = '누적 연구진행도가 해당 프로젝트의 요구 기간 또는 연구비용에 도달했습니다.';
    factors = ['기본 주간 연구량', '교리와 과학·공학 고문 보너스', '연구개발·군수 부서 위임', '프로젝트 누적 진행도'];
    ongoing = ['완료 효과는 이후 모든 관련 전투·생산·정보 계산의 새 기준값으로 적용됩니다.'];
    nextActions = ['연구 화면에서 빈 슬롯에 후속 프로젝트를 즉시 배정하십시오.', title.includes('장비 개발') ? '시제품을 설계하고 시험위험·신뢰성·양산비용을 비교하십시오.' : '효과가 적용된 전력·보급·정보 지표를 확인하십시오.'];
  } else if (/영입|인재 조사|비밀 접촉|참모 면담|참모 승급|경쟁 기관/.test(title)) {
    decision = '스카우트·접촉·협상·면담 또는 육성 단계 중 하나를 진행했습니다.';
    trigger = '후보 지식·관심·충성·경쟁기관 관심 또는 참모 성장 조건이 갱신됐습니다.';
    factors = ['후보 능력·잠재력·관심도', '스카우트 지식과 역사적 제약', '계약금·주급·권한과 경쟁 제안', '기존 참모와 조직 내 마찰'];
    ongoing = ['관계·지식·경쟁 관심은 다음 협상 성공률과 요구조건에 누적됩니다.'];
    nextActions = [tone === 'bad' ? '후보의 결렬 사유와 경쟁 관심을 확인한 뒤 조건을 바꾸거나 대체 후보를 선정하십시오.' : '조직 화면에서 보직 적합도·주급·기존 참모 마찰을 다시 비교하십시오.'];
  } else if (/보건|감염|유행|격리|백신|병상|방역/.test(`${title} ${detail}`)) {
    decision = '보건 대비 투자와 현재 대응 태세를 인구·군 의료체계에 적용했습니다.';
    trigger = '발병확률 판정, 유행 단계 변화 또는 보건사업 완료 조건이 충족됐습니다.';
    factors = ['유효 재생산지수와 주간 감염', '감시·대비·의료 수용력·공공 신뢰', '전쟁 압력·보급·인구이동', '격리·의료총동원·억제령의 비용과 효과'];
    ongoing = ['감염·사망·병상부하는 병력·보급·조직력과 다음 주 발병위험에 이어집니다.'];
    nextActions = ['보건 위기 화면에서 다음 주 예상 R·사망·병상부하와 대응 비용을 비교하십시오.'];
  } else if (/국가 원칙|내각 결정|국가 의제|보급 방침|조달 포커스|제식 채택|장비 재편/.test(title)) {
    decision = '선택한 국가 원칙·내각안·보급 또는 조달 기준을 승인했습니다.';
    trigger = '결재와 동시에 즉시효과가 적용되고 지속효과가 국가 규칙에 등록됐습니다.';
    factors = ['정책의 직접 자원비용', '현재 안정도·전쟁지지·산업규모', '참모 위임과 국가 노선', '혜택과 함께 발생하는 기회비용'];
    ongoing = ['채택한 규칙은 매주 생산·보급·전투·외교 계산에 반복 적용됩니다.'];
    nextActions = ['다음 주 결산에서 실제 수치 변화가 예상치와 일치하는지 확인하십시오.'];
  } else if (/대체역사|전후질서|세계선|역사 이정표/.test(title)) {
    certainty = title.includes('사전준비') ? 'developing' : 'confirmed';
  } else if (title.startsWith('세계 전황')) {
    decision = '플레이어의 직접 결재가 아닌 세계 시뮬레이션의 외부 전황 변화입니다.';
    trigger = '2주 주기의 국제 전황 전문이 도착했습니다.';
    factors = ['현재 세계선', '주기적 국제사건', '플레이 국가 밖 행위자의 선택'];
    ongoing = ['아직 직접 수치효과가 확정되지 않은 상황정보이며 후속 사건에서 정책·외교 조건이 될 수 있습니다.'];
    nextActions = ['외교·정보 화면에서 이 변화가 자국의 관계와 위험에 미친 영향을 확인하십시오.'];
  }

  return {
    domain,
    decision: override.decision ?? decision,
    trigger: override.trigger ?? trigger,
    factors: override.factors ?? factors,
    effects: override.effects ?? effects,
    comparisons: override.comparisons,
    ongoing: override.ongoing ?? ongoing,
    nextActions: override.nextActions ?? nextActions,
    certainty: override.certainty ?? certainty,
  };
}

export function getWarEventTrace(event: WarEvent) {
  return event.trace ?? createWarEventTrace(event.title, event.detail, event.tone);
}

export function getJournalComparisonStatus(expected: number, actual: number, higherIsBetter = true, tolerance = 0.005): WarEventComparison['status'] {
  if (Math.abs(actual - expected) <= tolerance) return 'matched';
  const improved = higherIsBetter ? actual > expected : actual < expected;
  return improved ? 'better' : 'worse';
}

export function summarizeJournalComparisons(events: WarEvent[], week: number) {
  const comparisons = events
    .filter((event) => event.week === week)
    .flatMap((event) => getWarEventTrace(event).comparisons ?? []);
  return {
    total: comparisons.length,
    matched: comparisons.filter((comparison) => comparison.status === 'matched').length,
    better: comparisons.filter((comparison) => comparison.status === 'better').length,
    worse: comparisons.filter((comparison) => comparison.status === 'worse').length,
    variance: comparisons.filter((comparison) => comparison.status === 'variance').length,
  };
}

export function filterWarEvents(events: WarEvent[], filter: JournalFilter, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  return events.filter((event) => {
    const categoryMatches = filter === 'all' || categorizeWarEvent(event) === filter;
    const queryMatches = normalizedQuery.length === 0
      || (() => {
        const trace = getWarEventTrace(event);
        return `${event.title} ${event.detail} ${trace.decision} ${trace.trigger} ${trace.factors.join(' ')} ${trace.effects.map((entry) => `${entry.label} ${entry.value}`).join(' ')} ${(trace.comparisons ?? []).map((entry) => `${entry.label} ${entry.expected} ${entry.actual} ${entry.explanation}`).join(' ')} ${trace.ongoing.join(' ')} ${trace.nextActions.join(' ')}`
          .toLocaleLowerCase('ko-KR').includes(normalizedQuery);
      })();
    return categoryMatches && queryMatches;
  });
}

export interface JournalMomentumPoint {
  week: number;
  good: number;
  bad: number;
  neutral: number;
  balance: number;
}

export interface JournalProgressSummary {
  latestWeek: number;
  previousWeek: number | null;
  balance: number;
  previousBalance: number | null;
  balanceDelta: number | null;
  trend: 'improving' | 'worsening' | 'stable' | 'baseline';
  dominantDomain: WarEventDomain | null;
  developingCount: number;
  priorities: string[];
  momentum: JournalMomentumPoint[];
}

function summarizeWeek(events: WarEvent[], week: number): JournalMomentumPoint {
  const weekEvents = events.filter((event) => event.week === week);
  const good = weekEvents.filter((event) => event.tone === 'good').length;
  const bad = weekEvents.filter((event) => event.tone === 'bad').length;
  return {
    week,
    good,
    bad,
    neutral: weekEvents.length - good - bad,
    balance: good - bad,
  };
}

export function summarizeJournalProgress(events: WarEvent[]): JournalProgressSummary {
  if (events.length === 0) {
    return {
      latestWeek: 0,
      previousWeek: null,
      balance: 0,
      previousBalance: null,
      balanceDelta: null,
      trend: 'baseline',
      dominantDomain: null,
      developingCount: 0,
      priorities: [],
      momentum: [],
    };
  }

  const weeks = [...new Set(events.map((event) => event.week))].sort((a, b) => a - b);
  const latestWeek = weeks.at(-1) ?? 0;
  const previousWeek = weeks.length > 1 ? weeks.at(-2) ?? null : null;
  const latest = summarizeWeek(events, latestWeek);
  const previous = previousWeek === null ? null : summarizeWeek(events, previousWeek);
  const balanceDelta = previous ? latest.balance - previous.balance : null;
  const latestEvents = events.filter((event) => event.week === latestWeek);

  const domainCounts = latestEvents.reduce<Partial<Record<WarEventDomain, number>>>((counts, event) => {
    const domain = categorizeWarEvent(event);
    counts[domain] = (counts[domain] ?? 0) + 1;
    return counts;
  }, {});
  const dominantDomain = (Object.entries(domainCounts)
    .sort((left, right) => right[1] - left[1])[0]?.[0] as WarEventDomain | undefined) ?? null;

  const urgentEvents = [...latestEvents]
    .sort((left, right) => (left.tone === 'bad' ? -1 : 0) - (right.tone === 'bad' ? -1 : 0));
  const priorities = [...new Set(urgentEvents.flatMap((event) => {
    const trace = getWarEventTrace(event);
    return event.tone === 'bad' || trace.certainty !== 'confirmed' ? trace.nextActions.slice(0, 1) : [];
  }))].slice(0, 3);

  const firstMomentumWeek = Math.max(0, latestWeek - 5);
  const momentum = Array.from({ length: latestWeek - firstMomentumWeek + 1 }, (_, index) => summarizeWeek(events, firstMomentumWeek + index));

  return {
    latestWeek,
    previousWeek,
    balance: latest.balance,
    previousBalance: previous?.balance ?? null,
    balanceDelta,
    trend: balanceDelta === null ? 'baseline' : balanceDelta > 0 ? 'improving' : balanceDelta < 0 ? 'worsening' : 'stable',
    dominantDomain,
    developingCount: latestEvents.filter((event) => getWarEventTrace(event).certainty !== 'confirmed').length,
    priorities,
    momentum,
  };
}
