import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import {
  TerritorialTreatyBoard, TerritorialTreatyConsentRecord, TerritorialTreatyReviewSubject, TerritorialTreatyTerms, confirmTerritorialTreatyReview, formatTerritorialTreatyWeek,
  getTerritorialTreatySites, getTreatyGarrisonDescription, getVisibleTerritorialTreaties, prepareTerritorialTreatyReview,
  type TerritorialTreatyBoardProps,
} from './TerritorialTreatyBoard';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { advanceTreatyWeek, executeTreatyAction, getTreatyTerms } from './territorialTreaties';
import type { TerritorialTreaty, TreatyAction, TreatyTerms } from './territorialTreaties';
import type { Territory } from './types';

const territories: Territory[] = [
  { id: 'pyongyang', name: '평양', region: '한반도', controller: 'allies', ownerId: 'korea', x: 1, y: 1, value: 5, supply: 80, terrain: '도시', neighbors: [] },
  { id: 'wonsan', name: '원산', region: '한반도', controller: 'allies', ownerId: 'korea', x: 2, y: 1, value: 4, supply: 70, terrain: '도시', neighbors: [] },
  { id: 'tianjin', name: '톈진', region: '중국', controller: 'allies', ownerId: 'china', x: 3, y: 1, value: 5, supply: 80, terrain: '도시', neighbors: [] },
  { id: 'korea', name: '경성', region: '한반도', controller: 'allies', ownerId: 'korea', x: 4, y: 1, value: 7, supply: 90, terrain: '도시', neighbors: [] },
  { id: 'hawaii', name: '하와이', region: '태평양', controller: 'allies', ownerId: 'korea', x: 5, y: 1, value: 7, supply: 90, terrain: '항구', neighbors: [] },
  { id: 'japansea', name: '일본해·동해', region: '해역', controller: 'allies', ownerId: 'korea', x: 6, y: 1, value: 3, supply: 80, terrain: '바다', siteType: 'sea', neighbors: [] },
  { id: 'coral_sea', name: '산호해', region: '해역', controller: 'allies', ownerId: 'korea', x: 7, y: 1, value: 3, supply: 80, terrain: '도시', neighbors: [] },
  { id: 'france', name: '파리', region: '프랑스', controller: 'allies', ownerId: 'freefrance', x: 8, y: 1, value: 6, supply: 80, terrain: '도시', neighbors: [] },
  { id: 'dalian', name: '다롄 수도 표기', region: '중국', controller: 'allies', ownerId: 'korea', x: 9, y: 1, value: 6, supply: 80, terrain: '도시', siteType: 'capital', neighbors: [] },
];

const propose: TreatyAction = { kind: 'propose', name: '평양 거점 귀속 합의', partnerNationId: 'china', territoryId: 'pyongyang', direction: 'offer' };
function treaty(overrides: Partial<TerritorialTreaty> = {}): TerritorialTreaty {
  return {
    id: 'treaty:korea:china:tianjin:0', name: '톈진 거점 귀속 합의', proposerNationId: 'korea', partnerNationId: 'china',
    fromNationId: 'china', toNationId: 'korea', territoryId: 'tianjin', proposedWeek: 0, responseDueWeek: 2,
    status: 'accepted', respondedWeek: 2, reason: '상대국이 제안을 수락했습니다. 별도 비준이 필요합니다.', ...overrides,
  };
}
function setup(overrides: Partial<TerritorialTreatyBoardProps> = {}): TerritorialTreatyBoardProps {
  const world = structuredClone(territories);
  return {
    state: { version: 1, treaties: [], lastAdvancedWeek: 4, journal: [] },
    context: {
      week: 4, nationId: 'korea', territories: world, control: createMapPoliticalLedger(world, 0),
      relations: [
        { id: 'china', name: '중국', code: 'CN', value: 80, status: '협력', color: '#fff' },
        { id: 'usa', name: '미국', code: 'US', value: 75, status: '협력', color: '#fff' },
      ],
      politicalPower: 100, treasury: 500, stability: 80, institutionalCapacity: 80,
      canNegotiate: true, canRatify: true, approvalSupport: 75, approvalLabel: '국무위원회 지지', blockedTerritoryIds: [],
    },
    nationName: '한국', authorityNote: '현직 국가 대표 · 협상 및 조약 비준 권한', formatMoney: (amount) => `${amount} 국고`,
    onExecute: vi.fn(), onOpenMap: vi.fn(), ...overrides,
  };
}

describe('territorial treaty review boundary', () => {
  it('identifies the treaty desk and proposal with a document seal, not ratification status', () => {
    const p = setup();
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html.match(/data-game-icon="treaty"/g)).toHaveLength(2);
    expect(html).toContain('검토할 조약 문서가 없습니다');
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(p.onOpenMap).not.toHaveBeenCalled();
  });
  it.each(['offer', 'request'] as const)('identifies the exact proposal document, site and %s direction inside the review', (direction) => {
    const p = setup();
    const action: TreatyAction = { ...propose, kind: 'propose', direction, territoryId: direction === 'offer' ? 'pyongyang' : 'tianjin', name: '명시적으로 확인할 조약 문서' };
    const review = prepareTerritorialTreatyReview(p, action).review!;
    expect(review.target).toEqual({
      name: action.name, territoryId: action.territoryId, territoryName: direction === 'offer' ? '평양' : '톈진',
      fromNationId: direction === 'offer' ? 'korea' : 'china', toNationId: direction === 'offer' ? 'china' : 'korea',
      terms: getTreatyTerms({}),
    });
    const html = renderToStaticMarkup(<TerritorialTreatyReviewSubject target={review.target} />);
    expect(html).toContain('aria-label="집행 검토 대상"');
    expect(html).toContain(action.name);
    expect(html).toContain(action.territoryId);
    expect(html).toContain(direction === 'offer' ? '한국 독립운동 → 중국' : '중국 → 한국 독립운동');
  });

  it.each(['ratify', 'withdraw'] as const)('takes the %s review target from the saved treaty, not the proposal form', (kind) => {
    const p = setup(); p.state.treaties = [treaty({ name: '기존에 수락된 톈진 합의' })];
    const review = prepareTerritorialTreatyReview({ ...p, formKey: 'unrelated offer draft' }, { kind, treatyId: p.state.treaties[0].id }).review!;
    expect(review.target).toEqual({ name: '기존에 수락된 톈진 합의', territoryId: 'tianjin', territoryName: '톈진', fromNationId: 'china', toNationId: 'korea', terms: getTreatyTerms({}) });
    const html = renderToStaticMarkup(<TerritorialTreatyReviewSubject target={review.target} />);
    expect(html).toContain('기존에 수락된 톈진 합의');
    expect(html).toContain('톈진');
    expect(html).toContain('중국 → 한국 독립운동');
    expect(html).not.toContain('평양');
  });

  it('retains the reviewed target as a snapshot while rejecting changed treaty context', () => {
    const p = setup(); p.state.treaties = [treaty()];
    const review = prepareTerritorialTreatyReview(p, { kind: 'ratify', treatyId: p.state.treaties[0].id }).review!;
    p.state.treaties[0].name = '나중에 바뀐 조약 이름';
    p.context.territories.find((site) => site.id === 'tianjin')!.name = '나중에 바뀐 거점 이름';
    expect(review.target.name).toBe('톈진 거점 귀속 합의');
    expect(review.target.territoryName).toBe('톈진');
    expect(confirmTerritorialTreatyReview(review, p, { current: null }).accepted).toBe(false);
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('fails closed for unknown treaty ids and for a missing or mismatched displayed target', () => {
    const p = setup();
    expect(prepareTerritorialTreatyReview(p, { kind: 'ratify', treatyId: 'unknown' }).review).toBeNull();
    const review = prepareTerritorialTreatyReview(p, propose).review!;
    const html = renderToStaticMarkup(<TerritorialTreatyReviewSubject />);
    expect(html).toContain('검토 대상 확인 불가');
    const missing = { ...review, target: undefined } as unknown as typeof review;
    expect(confirmTerritorialTreatyReview(missing, p, { current: null }).accepted).toBe(false);
    expect(confirmTerritorialTreatyReview({ ...review, target: { ...review.target, toNationId: 'usa' } }, p, { current: null }).accepted).toBe(false);
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('prepares a copied proposal and SSR without spending resources or making transfers', () => {
    const p = setup();
    const before = JSON.stringify([p.state, p.context]);
    const result = prepareTerritorialTreatyReview(p, propose);
    expect(result.review).not.toBeNull();
    expect(result.review!.cost).toEqual({ politicalPower: 6, treasury: 0 });
    expect(result.review!.dueWeek).toBe(6);
    expect(result.review!.action).toEqual(propose);
    expect(result.review!.action).not.toBe(propose);
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('거점 귀속 조약');
    expect(html).toContain('maxLength="80"');
    expect(html).toContain('조약 제안안 검토');
    expect(html).not.toContain('확인 후 집행 요청');
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(p.onOpenMap).not.toHaveBeenCalled();
    expect(JSON.stringify([p.state, p.context])).toBe(before);
  });

  it('sends exactly one explicit confirmation without writing local state or resources', () => {
    const p = setup(); const before = JSON.stringify([p.state, p.context]);
    const review = prepareTerritorialTreatyReview(p, propose).review!;
    const gate = { current: null as string | null };
    expect(confirmTerritorialTreatyReview(review, p, gate).accepted).toBe(true);
    expect(confirmTerritorialTreatyReview(review, p, gate).accepted).toBe(false);
    expect(p.onExecute).toHaveBeenCalledExactlyOnceWith(propose);
    expect(JSON.stringify([p.state, p.context])).toBe(before);
  });

  it.each(['week', 'nation', 'territories', 'control', 'relations', 'politicalPower', 'treasury', 'stability', 'institutionalCapacity', 'canNegotiate', 'canRatify', 'approvalSupport', 'approvalLabel', 'blockedTerritoryIds', 'state', 'authorityNote', 'busy', 'formKey'] as const)(
    'rejects a stale review when %s changes', (field) => {
      const p = { ...setup(), formKey: 'offer:china:pyongyang:draft' };
      const review = prepareTerritorialTreatyReview(p, propose).review!;
      const changed = { ...p, context: { ...p.context } };
      if (field === 'week') changed.context.week += 1;
      if (field === 'nation') changed.context.nationId = 'china';
      if (field === 'territories') changed.context.territories = p.context.territories.map((site) => ({ ...site, supply: site.supply - 1 }));
      if (field === 'control') changed.context.control = { ...p.context.control, current: {} };
      if (field === 'relations') changed.context.relations = p.context.relations.map((relation) => ({ ...relation, value: relation.value - 1 }));
      if (field === 'politicalPower') changed.context.politicalPower -= 1;
      if (field === 'treasury') changed.context.treasury -= 1;
      if (field === 'stability') changed.context.stability -= 1;
      if (field === 'institutionalCapacity') changed.context.institutionalCapacity -= 1;
      if (field === 'canNegotiate') changed.context.canNegotiate = false;
      if (field === 'canRatify') changed.context.canRatify = false;
      if (field === 'approvalSupport') changed.context.approvalSupport -= 1;
      if (field === 'approvalLabel') changed.context.approvalLabel = '변경된 승인 기구';
      if (field === 'blockedTerritoryIds') changed.context.blockedTerritoryIds = ['pyongyang'];
      if (field === 'state') changed.state = { ...p.state, lastAdvancedWeek: 5 };
      if (field === 'authorityNote') changed.authorityNote = '해임 · 열람만 가능';
      if (field === 'busy') changed.busy = true;
      if (field === 'formKey') changed.formKey = 'request:china:tianjin:changed';
      expect(confirmTerritorialTreatyReview(review, changed, { current: null }).accepted).toBe(false);
      expect(p.onExecute).not.toHaveBeenCalled();
    },
  );

  it('blocks preparation during weekly processing and without negotiation authority', () => {
    const p = setup({ busy: true });
    expect(prepareTerritorialTreatyReview(p, propose).review).toBeNull();
    p.busy = false; p.context.canNegotiate = false;
    expect(prepareTerritorialTreatyReview(p, propose).review).toBeNull();
  });

  it('requires explicit top-level ratification before a later handover check', () => {
    const p = setup(); p.state.treaties = [treaty()];
    const review = prepareTerritorialTreatyReview(p, { kind: 'ratify', treatyId: p.state.treaties[0].id }).review!;
    expect(review).not.toBeNull();
    expect(review.cost).toEqual({ politicalPower: 8, treasury: 4 });
    expect(review.dueWeek).toBe(p.context.week + 1);
    expect(p.state.treaties[0].status).toBe('accepted');
    p.context.canRatify = false;
    expect(prepareTerritorialTreatyReview(p, review.action).review).toBeNull();
  });

  it.each(['approvalSupport', 'institutionalCapacity', 'stability'] as const)('denies ratification below the %s threshold', (key) => {
    const p = setup(); p.state.treaties = [treaty()];
    p.context[key] = key === 'approvalSupport' ? 59.99 : 44.99;
    expect(prepareTerritorialTreatyReview(p, { kind: 'ratify', treatyId: p.state.treaties[0].id }).review).toBeNull();
  });

  it('allows no action on the partner nation’s treaty, even when its record is visible', () => {
    const p = setup();
    p.state.treaties = [treaty({ proposerNationId: 'china', partnerNationId: 'korea' })];
    for (const kind of ['ratify', 'withdraw'] as const) {
      expect(prepareTerritorialTreatyReview(p, { kind, treatyId: p.state.treaties[0].id }).review).toBeNull();
    }
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('상대국 기록 열람입니다');
    expect(html).not.toContain('>비준안 검토</button>');
    expect(html).not.toContain('>철회안 검토</button>');
  });

  it('does not allow a ratified treaty to be withdrawn or treat withdrawal as restitution', () => {
    const p = setup(); p.state.treaties = [treaty({ status: 'ratified', ratifiedWeek: 3, handoverDueWeek: 4 })];
    expect(prepareTerritorialTreatyReview(p, { kind: 'withdraw', treatyId: p.state.treaties[0].id }).review).toBeNull();
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('disabled="">철회안 검토');
    expect(html).toContain('비준 기록 · 인계 대기');
    expect(html).not.toContain('거점 인계 완료');
  });
});

describe('territorial treaty board records and selection', () => {
  it('limits offer and request sites to the correct controller, excluding all registered capitals and seas', () => {
    const p = setup(); const before = JSON.stringify(p.context);
    const offers = getTerritorialTreatySites(p.context, 'china', 'offer');
    expect(offers.map((site) => site.id)).toEqual(['pyongyang', 'wonsan']);
    expect(offers[0]).toBe(p.context.territories[0]);
    expect(getTerritorialTreatySites(p.context, 'china', 'request').map((site) => site.id)).toEqual(['tianjin']);
    expect(getTerritorialTreatySites(p.context, 'korea', 'offer')).toEqual([]);
    expect(getTerritorialTreatySites(p.context, 'atlantis' as 'china', 'offer')).toEqual([]);
    expect(JSON.stringify(p.context)).toBe(before);
  });

  it('defaults to the first eligible site and leaves the document name explicitly editable', () => {
    const p = setup(); const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    const siteSelect = html.match(/<select[^>]*-site[^>]*>[\s\S]*?<\/select>/)?.[0] ?? '';
    expect(siteSelect).toContain('value="pyongyang" selected=""');
    expect(siteSelect).not.toContain('value="korea"');
    expect(siteSelect).not.toContain('value="hawaii"');
    expect(siteSelect).not.toContain('value="japansea"');
    expect(siteSelect).not.toContain('value="coral_sea"');
    expect(html).toContain('placeholder="예: 평양 거점 귀속 합의"');
    expect(html).toContain('value=""');
    expect(html).toContain('disabled="">조약 제안안 검토');
  });

  it('shows an explicit empty target choice when no site is eligible', () => {
    const p = setup(); p.context.territories = p.context.territories.filter((site) => site.id === 'korea');
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('value="" disabled="" selected="">현재 선택 가능한 거점이 없습니다');
    expect(html).toContain('대상 거점 미선택');
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('filters self, unknown and repeated diplomatic partners', () => {
    const p = setup();
    p.context.relations = [...p.context.relations, { ...p.context.relations[0] }, { id: 'korea', name: '자국', code: 'KR', value: 80, status: '', color: '' }, { id: 'atlantis', name: '가상국', code: '', value: 80, status: '', color: '' }];
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    const select = html.match(/<select[^>]*-partner[^>]*>[\s\S]*?<\/select>/)?.[0] ?? '';
    expect(select.match(/value="china"/g)).toHaveLength(1);
    expect(select).not.toContain('value="korea"');
    expect(select).not.toContain('atlantis');
  });

  it('shows only relevant treaty records and never exposes unrelated journal text', () => {
    const p = setup();
    const own = treaty();
    const unrelated = treaty({ id: 'foreign-only', name: '외국끼리의 비공개 문서', proposerNationId: 'usa', partnerNationId: 'britain', fromNationId: 'usa', toNationId: 'britain' });
    p.state.treaties = [own, unrelated];
    p.state.journal = [{ id: 'foreign-secret', title: '숨은 외국 정보', detail: '이 내용은 출력하지 않음', tone: 'neutral', week: 4 }];
    expect(getVisibleTerritorialTreaties(p.state, 'korea')).toEqual([own]);
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain(own.name);
    expect(html).not.toContain(unrelated.name);
    expect(html).not.toContain('숨은 외국 정보');
  });

  it.each([
    ['proposed', '상대국 답변 대기'], ['accepted', '상대국 수락 · 비준 대기'], ['rejected', '상대국 거부'],
    ['ratified', '비준 기록 · 인계 대기'], ['suspended', '인계 보류'], ['completed', '거점 인계 완료'], ['withdrawn', '제안 철회'],
  ] as const)('renders persisted %s status without manufacturing completion', (status, label) => {
    const p = setup();
    p.state.treaties = [treaty({ status, respondedWeek: status === 'proposed' ? undefined : 2,
      ratifiedWeek: ['ratified', 'suspended', 'completed'].includes(status) ? 3 : undefined,
      handoverDueWeek: ['ratified', 'suspended', 'completed'].includes(status) ? 4 : undefined,
      completedWeek: status === 'completed' ? 4 : undefined })];
    const before = JSON.stringify(p.state);
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain(label);
    expect(html).toContain('aria-label="조약 처리 단계"');
    expect(html).toContain('당사국 간 한 거점의 귀속 합의');
    expect(html).toContain('병력은 자동 이동하지 않습니다');
    if (status !== 'completed') expect(html).not.toContain('거점 인계 완료');
    expect(JSON.stringify(p.state)).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(p.onOpenMap).not.toHaveBeenCalled();
  });

  it('keeps authority, exact failing approval value, rejection reason and costs visible', () => {
    const p = setup(); p.state.treaties = [treaty()];
    p.context.approvalSupport = 59.99;
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '');
    expect(visible).toContain(p.authorityNote);
    expect(visible).toContain('59.99<small> / 60 이상');
    expect(visible).toContain('비준 비용: 정치력 8 · 국고 4 국고');
    expect(visible).toContain('disabled="">비준안 검토');
    expect(visible).toContain('명시적 비준을 기다립니다');
  });

  it('does not present overdue or missing handover dates as a new promised schedule', () => {
    const p = setup(); p.state.treaties = [treaty({ status: 'proposed', respondedWeek: undefined })];
    expect(renderToStaticMarkup(<TerritorialTreatyBoard {...p} />)).toContain('답변 예정 시점 경과');
    p.state.treaties = [treaty({ status: 'ratified', ratifiedWeek: 3, handoverDueWeek: undefined })];
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('인계 확인 시점 기록 없음');
    expect(html).not.toContain(`인계 조건 확인 ${formatTerritorialTreatyWeek(p.context.week + 1)}`);
  });

  it('keeps records readable while disabling all execution during weekly processing', () => {
    const p = setup({ busy: true }); p.state.treaties = [treaty()];
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('톈진 거점 귀속 합의');
    expect(html).toContain('disabled="">비준안 검토');
    expect(html).toContain('disabled="">철회안 검토');
    expect(html).toContain('disabled="">조약 제안안 검토');
    expect(html).toContain('기간 진행 중입니다');
  });

  it('uses campaign dates and does not fabricate historical agreements for an empty save', () => {
    expect(formatTerritorialTreatyWeek(0)).toBe('제1주 · 1942.10.25');
    expect(formatTerritorialTreatyWeek(2)).toBe('제3주 · 1942.11.08');
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...setup()} />);
    expect(html).toContain('아직 이 국가와 관련된 조약이 없습니다');
    expect(html).toContain('과거 조약이나 귀속 변경을 자동으로 만들어내지 않습니다');
  });
});

describe('territorial treaty conditions and consent presentation', () => {
  const terms = (overrides: Partial<TreatyTerms> = {}): TreatyTerms => ({ consentMethod: 'referendum', civilGuarantees: false, withdrawBeforeHandover: false, handoverDelayWeeks: 1, ...overrides });

  it.each(['none', 'regional-council', 'referendum'] as const)('starts the proposal form with the current %s requirement and explicit accessible options', (requiredConsent) => {
    const p = setup(); p.context.requiredConsent = requiredConsent;
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    const select = html.match(/<select[^>]*-consent[^>]*>[\s\S]*?<\/select>/)?.[0] ?? '';
    expect(select).toContain(`value="${requiredConsent}" selected=""`);
    expect(html).toContain('현재 필수 동의 절차:');
    expect(html).toContain('지역대표 심의는 주민투표 요건을 대신하지 못합니다');
    expect(html).toContain('>동의 절차<select');
    expect(html).toContain('>인도 준비기간<select');
    expect(html).toContain('주민보호 조항');
    expect(html).toContain('육군 주둔부대 철수 확인');
    expect(html).toContain('value="8"');
  });

  it('keeps legacy conditions at none/no-guarantee/no-withdrawal/one week without inventing consent', () => {
    const html = renderToStaticMarkup(<TerritorialTreatyTerms />);
    expect(html).toContain('<dd>없음</dd>');
    expect(html).toContain('추가 보호 약속 미포함');
    expect(html).toContain('육군 철수 확인 조항 없음');
    expect(html).toContain('<dd>1주');
    expect(html).not.toContain('동의 절차 승인');
  });

  it('formats the guarantee surcharge in the active treasury unit in terms, review and proposal', () => {
    const value = terms({ civilGuarantees: true });
    const formatMoney = (amount: number) => `${amount * 100}만 원`;
    expect(renderToStaticMarkup(<TerritorialTreatyTerms terms={value} formatMoney={formatMoney} />)).toContain('국고 추가 800만 원');
    expect(renderToStaticMarkup(<TerritorialTreatyTerms terms={value} />)).toContain('국고 추가 8 ·');
    const p = setup({ formatMoney });
    const review = prepareTerritorialTreatyReview(p, { ...propose, kind: 'propose', terms: value }).review!;
    expect(renderToStaticMarkup(<TerritorialTreatyReviewSubject target={review.target} formatMoney={formatMoney} />)).toContain('국고 추가 800만 원');
    p.state.treaties = [treaty({ terms: value })];
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html.match(/국고 추가 800만 원/g)).toHaveLength(2);
    expect(html).toContain('인도 전 자국 육군 주둔부대 0개를 확인합니다');
    expect(html).not.toContain('현재 외국 제공국은 육군 위치 증거를 확보할 수 없어 이 조항 포함 시 비준 불가');
  });

  it.each(['proposed', 'accepted'] as const)('explains withdrawal and renegotiation for a foreign-provider %s treaty', (status) => {
    const record = treaty({ status, terms: terms({ withdrawBeforeHandover: true }) });
    const html = renderToStaticMarkup(<TerritorialTreatyConsentRecord treaty={record} counts={{ tianjin: 0 }} nationId="korea" />);
    expect(html).toContain('조약은 비준 불가');
    expect(html).toContain('제안국이 철회 후 조건을 제외하고 재협상');
    expect(html).not.toContain('인도 유예');
    expect(html).not.toContain('수량 조건 충족');
  });

  it.each(['ratified', 'suspended'] as const)('keeps an already %s foreign-provider treaty deferred without offering invalid withdrawal', (status) => {
    const record = treaty({ status, ratifiedWeek: 3, terms: terms({ withdrawBeforeHandover: true }) });
    const html = renderToStaticMarkup(<TerritorialTreatyConsentRecord treaty={record} counts={{ tianjin: 0 }} nationId="korea" />);
    expect(html).toContain('외국 육군의 위치 자료가 없어 인도 유예');
    expect(html).not.toContain('비준 불가');
    expect(html).not.toContain('철회 후');
  });

  it('copies nested proposal conditions independently into the action and displayed target', () => {
    const p = setup();
    const action: TreatyAction = { ...propose, kind: 'propose', terms: terms({ civilGuarantees: true, handoverDelayWeeks: 4 }) };
    const review = prepareTerritorialTreatyReview(p, action).review!;
    expect(review.action.kind).toBe('propose');
    if (review.action.kind !== 'propose') throw new Error('proposal expected');
    expect(review.action.terms).not.toBe(action.terms);
    expect(review.target.terms).not.toBe(action.terms);
    expect(review.target.terms).not.toBe(review.action.terms);
    action.terms!.civilGuarantees = false;
    action.terms!.handoverDelayWeeks = 8;
    expect(review.action.terms!.civilGuarantees).toBe(true);
    expect(review.target.terms.handoverDelayWeeks).toBe(4);
    const html = renderToStaticMarkup(<TerritorialTreatyReviewSubject target={review.target} />);
    expect(html).toContain('조약상 주민보호 약속');
    expect(html).toContain('실제 보호 이행 완료를 뜻하지 않음');
    expect(html).toContain('<dd>4주');
  });

  it('rejects a mutated nested action instead of confirming different conditions from the displayed snapshot', () => {
    const p = setup();
    const review = prepareTerritorialTreatyReview(p, { ...propose, kind: 'propose', terms: terms() }).review!;
    if (review.action.kind !== 'propose') throw new Error('proposal expected');
    review.action.terms!.civilGuarantees = true;
    expect(confirmTerritorialTreatyReview(review, p, { current: null }).accepted).toBe(false);
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('copies nested conditions again before handing the confirmed action to the caller', () => {
    const p = setup();
    const review = prepareTerritorialTreatyReview(p, { ...propose, kind: 'propose', terms: terms() }).review!;
    p.onExecute = vi.fn((action: TreatyAction) => { if (action.kind === 'propose') action.terms!.handoverDelayWeeks = 8; });
    expect(confirmTerritorialTreatyReview(review, p, { current: null }).accepted).toBe(true);
    expect(review.target.terms.handoverDelayWeeks).toBe(1);
    if (review.action.kind !== 'propose') throw new Error('proposal expected');
    expect(review.action.terms!.handoverDelayWeeks).toBe(1);
  });

  it.each(['requiredConsent', 'garrisonCountByTerritory', 'formKey'] as const)('invalidates review when new %s input changes', (field) => {
    const p = { ...setup(), formKey: 'original-terms' };
    const review = prepareTerritorialTreatyReview(p, { ...propose, kind: 'propose', terms: terms() }).review!;
    if (field === 'requiredConsent') p.context.requiredConsent = 'referendum';
    if (field === 'garrisonCountByTerritory') p.context.garrisonCountByTerritory = { pyongyang: 0 };
    if (field === 'formKey') p.formKey = 'terms-changed';
    expect(confirmTerritorialTreatyReview(review, p, { current: null }).accepted).toBe(false);
  });

  it('respects the mandatory consent hierarchy without silently upgrading a proposal', () => {
    const p = setup(); p.context.requiredConsent = 'referendum';
    expect(prepareTerritorialTreatyReview(p, { ...propose, kind: 'propose', terms: terms({ consentMethod: 'regional-council' }) }).review).toBeNull();
    p.context.requiredConsent = 'regional-council';
    expect(prepareTerritorialTreatyReview(p, { ...propose, kind: 'propose', terms: terms() }).review).not.toBeNull();
  });

  it('reviews consultation separately, charges only on explicit confirmation and still requires later ratification', () => {
    const p = setup(); p.state.treaties = [treaty({ terms: terms() })];
    const action: TreatyAction = { kind: 'start-consultation', treatyId: p.state.treaties[0].id };
    const before = JSON.stringify([p.state, p.context]);
    const review = prepareTerritorialTreatyReview(p, action).review!;
    expect(review.cost).toEqual({ politicalPower: 4, treasury: 3 });
    expect(review.dueWeek).toBe(p.context.week + 3);
    expect(prepareTerritorialTreatyReview(p, { kind: 'ratify', treatyId: action.treatyId }).review).toBeNull();
    expect(confirmTerritorialTreatyReview(review, p, { current: null }).accepted).toBe(true);
    expect(p.onExecute).toHaveBeenCalledExactlyOnceWith(action);
    expect(JSON.stringify([p.state, p.context])).toBe(before);
  });

  it('enables a separate ratification review only after a real three-tick approved consultation', () => {
    const p = setup(); p.state.treaties = [treaty({ terms: terms({ civilGuarantees: true, handoverDelayWeeks: 4 }) })];
    const started = executeTreatyAction(p.state, { kind: 'start-consultation', treatyId: p.state.treaties[0].id }, p.context);
    expect(started.accepted).toBe(true);
    p.state = started.state;
    for (const week of [5, 6, 7]) {
      p.context.week = week;
      p.state = advanceTreatyWeek(p.state, p.context).state;
    }
    expect(p.state.treaties[0].consent?.status).toBe('approved');
    expect(p.state.treaties[0].status).toBe('accepted');
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('동의 절차 승인');
    expect(html).toContain('disabled="">동의 절차 시작안 검토');
    expect(html).not.toContain('disabled="">비준안 검토');
    const review = prepareTerritorialTreatyReview(p, { kind: 'ratify', treatyId: p.state.treaties[0].id }).review!;
    expect(review.cost).toEqual({ politicalPower: 8, treasury: 12 });
    expect(review.dueWeek).toBe(11);
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('keeps an existing legacy treaty unchanged when the current required method becomes stricter', () => {
    const p = setup(); p.context.requiredConsent = 'referendum'; p.state.treaties = [treaty()];
    const before = JSON.stringify(p.state);
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('현재 필수 동의 절차: 주민투표');
    expect(html).toContain('현재 헌법이 요구하는 지역 동의 절차가 이 제안에 없습니다');
    expect(html).toContain('disabled="">비준안 검토');
    expect(p.state.treaties[0].terms).toBeUndefined();
    expect(JSON.stringify(p.state)).toBe(before);
  });

  it.each(['busy', 'authority', 'foreign-proposer'] as const)('blocks consultation preparation for %s', (mode) => {
    const p = setup(); p.state.treaties = [treaty({ terms: terms() })];
    if (mode === 'busy') p.busy = true;
    if (mode === 'authority') p.context.canNegotiate = false;
    if (mode === 'foreign-proposer') p.state.treaties[0] = { ...p.state.treaties[0], proposerNationId: 'china', partnerNationId: 'korea' };
    expect(prepareTerritorialTreatyReview(p, { kind: 'start-consultation', treatyId: p.state.treaties[0].id }).review).toBeNull();
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it.each([1, 4, 8] as const)('shows guarantee cost and the selected %s-week preparation before handover', (handoverDelayWeeks) => {
    const p = setup(); p.state.treaties = [treaty({ terms: terms({ consentMethod: 'none', civilGuarantees: true, handoverDelayWeeks }) })];
    const review = prepareTerritorialTreatyReview(p, { kind: 'ratify', treatyId: p.state.treaties[0].id }).review!;
    expect(review.cost).toEqual({ politicalPower: 8, treasury: 12 });
    expect(review.dueWeek).toBe(p.context.week + handoverDelayWeeks);
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('비준 비용: 정치력 8 · 국고 12 국고');
    expect(html).toContain('조약상 주민보호 약속');
    expect(html).toContain(`<dd>${handoverDelayWeeks}주`);
  });

  it.each(['preparing', 'suspended', 'approved', 'rejected'] as const)('shows the persisted %s consent result as game indicators without inventing voters', (status) => {
    const resolved = status === 'approved' || status === 'rejected';
    const record = treaty({ terms: terms(), consent: { method: 'referendum', status, startedWeek: 1, lastProcessedWeek: 4, progressWeeks: resolved ? 3 : 1,
      ...(resolved ? { resolvedWeek: 4, supportPercent: status === 'approved' ? 62 : 48, participationPercent: 57 } : {}), reason: '모델에 기록된 지역 절차 사유' } });
    const html = renderToStaticMarkup(<TerritorialTreatyConsentRecord treaty={record} counts={undefined} nationId="korea" />);
    expect(html).toContain('모델에 기록된 지역 절차 사유');
    expect(html).toContain('연속 준비');
    expect(html).toContain('/3주');
    expect(html).toContain('합성된 게임 규칙');
    expect(html).toContain('실제 유권자 수나 역사적 주민 동의를 나타내지 않습니다');
    if (resolved) { expect(html).toContain('게임 내 찬성 지표'); expect(html).toContain('게임 내 참여 지표'); expect(html).toContain('57/100'); }
    else expect(html).not.toContain('결과 기록');
    expect(html).not.toMatch(/\d[\d,]*명/);
  });

  it('never converts missing or foreign army proof into a zero count', () => {
    expect(getTreatyGarrisonDescription(undefined, 'pyongyang')).toContain('확인 불가');
    expect(getTreatyGarrisonDescription({}, 'pyongyang')).toContain('0개로 간주하지 않습니다');
    expect(getTreatyGarrisonDescription({ pyongyang: NaN }, 'pyongyang')).toContain('확인 불가');
    expect(getTreatyGarrisonDescription({ pyongyang: 0 }, 'pyongyang')).toContain('육군 주둔부대 0개');
    expect(getTreatyGarrisonDescription({ pyongyang: 2 }, 'pyongyang')).toContain('인계 전 육군 철수 필요');
    expect(getTreatyGarrisonDescription({ tianjin: 0 }, 'tianjin', true)).toBe('확인 불가 · 외국 육군의 위치 자료가 없어 인도 유예');
    const p = setup(); p.state.treaties = [treaty({ terms: terms({ withdrawBeforeHandover: true }) })];
    p.context.garrisonCountByTerritory = { tianjin: 0 };
    expect(renderToStaticMarkup(<TerritorialTreatyBoard {...p} />)).toContain('제안국이 철회 후 조건을 제외하고 재협상');
  });

  it('marks proposal forecasts as synthetic and leaves state untouched', () => {
    const p = setup(); p.context.requiredConsent = 'referendum';
    const before = JSON.stringify([p.state, p.context]);
    const html = renderToStaticMarkup(<TerritorialTreatyBoard {...p} />);
    expect(html).toContain('동의 절차 게임 지표 미리보기');
    expect(html).toContain('예상 게임 지표 · 결과 확정 아님');
    expect(html).toContain('게임 내 찬성 지표');
    expect(html).toContain('게임 내 참여 지표');
    expect(html).toContain('예상 지표의 게임 요인');
    expect(JSON.stringify([p.state, p.context])).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
  });
});
