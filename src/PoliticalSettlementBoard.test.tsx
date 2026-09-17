import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { PoliticalSettlementBoard, confirmPoliticalSettlementReview, formatPoliticalSettlementWeek, getPoliticalSettlementLandSeats, preparePoliticalSettlementReview, type PoliticalSettlementBoardProps } from './PoliticalSettlementBoard';
import { createPoliticalSettlementState, executePoliticalSettlementAction, getPoliticalSettlementPolity } from './politicalSettlement';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import type { PoliticalSettlementAction } from './politicalSettlement';
import type { Territory } from './types';

const territories: Territory[] = [
  { id: 'korea', name: '경성·조선 중부', region: '한반도', x: 40, y: 30, controller: 'allies', ownerId: 'korea', value: 7, supply: 85, terrain: '도시', neighbors: ['pyongyang'] },
  { id: 'chongqing', name: '충칭', region: '중국', x: 20, y: 50, controller: 'allies', ownerId: 'china', value: 6, supply: 80, terrain: '도시', neighbors: [] },
  { id: 'pyongyang', name: '평양', region: '한반도', x: 35, y: 20, controller: 'axis', ownerId: 'japan', value: 5, supply: 75, terrain: '도시', neighbors: ['korea'] },
  { id: 'japansea', name: '일본해·동해', region: '아시아 해역', x: 50, y: 30, controller: 'axis', ownerId: 'japan', value: 4, supply: 80, terrain: '바다', siteType: 'sea', neighbors: [] },
];
const declare: PoliticalSettlementAction = { kind: 'declare', name: '대한민국 대표정부', seatTerritoryId: 'chongqing', declaration: 'representation' };
function setup(overrides: Partial<PoliticalSettlementBoardProps> = {}): PoliticalSettlementBoardProps {
  const world = structuredClone(territories);
  return {
    state: createPoliticalSettlementState(),
    context: {
      week: 4, nationId: 'korea', territories: world, control: createMapPoliticalLedger(world, 0),
      relations: [
        { id: 'china', name: '중국', code: 'CN', value: 80, status: '협력', color: '#fff' },
        { id: 'usa', name: '미국', code: 'US', value: 70, status: '교섭', color: '#fff' },
      ],
      politicalPower: 100, treasury: 500, stability: 80, institutionalCapacity: 80,
      canDeclare: true, canNegotiate: true, canAdminister: true,
    },
    nationName: '한국', defaultSeatTerritoryId: 'chongqing', formatMoney: (value) => `${value} 국고`,
    onExecute: vi.fn(), onOpenMap: vi.fn(), authorityNote: '현직 국가 대표 · 선언과 협상 직접 결재', ...overrides,
  };
}
function declared() {
  const p = setup();
  const result = executePoliticalSettlementAction(p.state, declare, p.context);
  expect(result.accepted).toBe(true);
  return { ...p, state: result.state };
}

describe('political settlement board review and execution boundary', () => {
  it('keeps preview and SSR read-only, without spending resources or opening the map', () => {
    const p = setup(); const before = JSON.stringify([p.state, p.context]);
    const review = preparePoliticalSettlementReview(p, declare);
    expect(review.review).not.toBeNull();
    expect(review.review!.dueWeek).toBeNull();
    expect(review.review!.cost.politicalPower).toBeGreaterThan(0);
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    expect(html).toContain('정부 대표권·현지 행정');
    expect(html).toContain('공표안 검토');
    expect(html).toContain('maxLength="80"');
    expect(html).toContain('영토 주권과 별개');
    expect(html).not.toContain('확인 후 집행 요청');
    expect(p.onExecute).not.toHaveBeenCalled(); expect(p.onOpenMap).not.toHaveBeenCalled();
    expect(JSON.stringify([p.state, p.context])).toBe(before);
  });

  it('sends one explicit confirmation to the owning handler without locally applying costs or claims', () => {
    const p = setup(); const before = JSON.stringify([p.state, p.context]);
    const review = preparePoliticalSettlementReview(p, declare).review!;
    const gate = { current: null as string | null };
    expect(confirmPoliticalSettlementReview(review, p, gate).accepted).toBe(true);
    expect(confirmPoliticalSettlementReview(review, p, gate).accepted).toBe(false);
    expect(p.onExecute).toHaveBeenCalledExactlyOnceWith(declare);
    expect(JSON.stringify([p.state, p.context])).toBe(before);
    expect(p.onOpenMap).not.toHaveBeenCalled();
  });

  it.each(['week', 'nation', 'territories', 'control', 'politicalPower', 'treasury', 'stability', 'institutionalCapacity', 'declarationAuthority', 'negotiationAuthority', 'administrationAuthority', 'authorityNote', 'state', 'busy'] as const)(
    'rejects a review after %s changes without any write', (field) => {
      const p = setup(); const review = preparePoliticalSettlementReview(p, declare).review!;
      const changed: PoliticalSettlementBoardProps = { ...p, context: { ...p.context } };
      if (field === 'week') changed.context.week += 1;
      if (field === 'nation') changed.context.nationId = 'china';
      if (field === 'territories') changed.context.territories = p.context.territories.map((t) => ({ ...t, supply: t.supply - 1 }));
      if (field === 'control') changed.context.control = { ...p.context.control, current: { ...p.context.control.current, korea: { controller: 'axis', gameOwnerId: 'japan' } } };
      if (field === 'politicalPower') changed.context.politicalPower -= 1;
      if (field === 'treasury') changed.context.treasury -= 1;
      if (field === 'stability') changed.context.stability -= 1;
      if (field === 'institutionalCapacity') changed.context.institutionalCapacity -= 1;
      if (field === 'declarationAuthority') changed.context.canDeclare = false;
      if (field === 'negotiationAuthority') changed.context.canNegotiate = false;
      if (field === 'administrationAuthority') changed.context.canAdminister = false;
      if (field === 'authorityNote') changed.authorityNote = '신임 현장 담당 · 보고 열람';
      if (field === 'state') changed.state = executePoliticalSettlementAction(p.state, declare, p.context).state;
      if (field === 'busy') changed.busy = true;
      expect(confirmPoliticalSettlementReview(review, changed, { current: null }).accepted).toBe(false);
      expect(p.onExecute).not.toHaveBeenCalled();
    },
  );

  it('denies review during settlement or without the action-specific authority', () => {
    const p = setup({ busy: true });
    expect(preparePoliticalSettlementReview(p, declare).review).toBeNull();
    p.busy = false; p.context.canDeclare = false;
    expect(preparePoliticalSettlementReview(p, declare).review).toBeNull();
    const withPolity = declared();
    withPolity.context.canNegotiate = false;
    expect(preparePoliticalSettlementReview(withPolity, { kind: 'request-recognition', partnerNationId: 'china' }).review).toBeNull();
    withPolity.context.canAdminister = false;
    expect(preparePoliticalSettlementReview(withPolity, { kind: 'start-administration', territoryId: 'korea' }).review).toBeNull();
  });

  it('reviews recognition as a two-week request, not an immediate foreign approval', () => {
    const p = declared(); const before = JSON.stringify(p.state);
    const action: PoliticalSettlementAction = { kind: 'request-recognition', partnerNationId: 'china' };
    const review = preparePoliticalSettlementReview(p, action).review!;
    expect(review.dueWeek).toBe(p.context.week + 2);
    expect(p.state.recognitions).toHaveLength(0);
    expect(confirmPoliticalSettlementReview(review, p, { current: null }).accepted).toBe(true);
    expect(p.onExecute).toHaveBeenCalledExactlyOnceWith(action);
    expect(JSON.stringify(p.state)).toBe(before);
  });

  it('can review administration without foreign recognition and gives a conditional three-week date', () => {
    const p = declared();
    expect(p.state.recognitions).toHaveLength(0);
    const review = preparePoliticalSettlementReview(p, { kind: 'start-administration', territoryId: 'korea' }).review!;
    expect(review).not.toBeNull(); expect(review.dueWeek).toBe(p.context.week + 3);
    expect(p.state.administrations).toHaveLength(0);
  });

  it('rejects hostile land, sea and insufficient supply for administration', () => {
    const p = declared();
    for (const territoryId of ['pyongyang', 'japansea', 'unknown']) expect(preparePoliticalSettlementReview(p, { kind: 'start-administration', territoryId }).review).toBeNull();
    p.context.territories = p.context.territories.map((t) => t.id === 'korea' ? { ...t, supply: 39 } : t);
    expect(preparePoliticalSettlementReview(p, { kind: 'start-administration', territoryId: 'korea' }).review).toBeNull();
  });

  it('copies action and cost snapshots so preview does not mutate the supplied action', () => {
    const p = setup(); const action = { ...declare };
    const review = preparePoliticalSettlementReview(p, action).review!;
    expect(review.action).not.toBe(action);
    expect(review.action).toEqual(action);
  });
});

describe('political settlement board presentation', () => {
  it('puts visible independent record ledgers before their target controls', () => {
    const p = declared();
    p.state = executePoliticalSettlementAction(p.state, { kind: 'request-recognition', partnerNationId: 'china' }, p.context).state;
    p.state = executePoliticalSettlementAction(p.state, { kind: 'start-administration', territoryId: 'korea' }, p.context).state;
    const before = JSON.stringify([p.state, p.context]);
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '');
    const recognitionLedger = visible.indexOf('aria-label="국가별 요청·답변 기록"');
    const administrationLedger = visible.indexOf('aria-label="거점별 행정 상태 기록"');
    expect(recognitionLedger).toBeGreaterThan(-1);
    expect(administrationLedger).toBeGreaterThan(recognitionLedger);
    expect(recognitionLedger).toBeLessThan(visible.indexOf('>요청할 상대국<select'));
    expect(administrationLedger).toBeLessThan(visible.indexOf('>인수할 육상 거점<select'));
    expect(visible).toContain('심사 중');
    expect(visible).toContain('인수 준비 중');
    expect(visible.match(/class="settlement-record-select [^"]+" aria-pressed="true"/g)).toHaveLength(2);
    expect(visible).toContain('선언·외교 승인과 별도로');
    expect(JSON.stringify([p.state, p.context])).toBe(before);
    expect(p.onExecute).not.toHaveBeenCalled();
    expect(p.onOpenMap).not.toHaveBeenCalled();
  });

  it('keeps thresholds, timing and blocking reasons visible when rule explanations are collapsed', () => {
    const p = declared();
    p.context.territories = p.context.territories.map((territory) => territory.id === 'korea' ? { ...territory, supply: 39 } : territory);
    p.context.canNegotiate = false;
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '');
    expect(html).toContain('<details class="settlement-help"><summary>심사 규칙과 승인의 범위');
    expect(html).toContain('<details class="settlement-help"><summary>행정 준비 규칙과 통제 조건');
    expect(visible).toContain(' / 65 이상');
    expect(visible).toContain(' / 45 이상');
    expect(visible).toContain(' / 40 이상');
    expect(visible).toContain('답변 심사 2주');
    expect(visible).toContain('3주간 요건 유지');
    expect(visible).toContain('현재 보직에는 정부 대표권 승인 협상 권한이 없습니다.');
    expect(visible).toContain('현지 보급이 40 이상이어야 행정 준비를 시작·유지할 수 있습니다.');
    expect(visible).toContain('disabled="">승인 요청안 검토');
    expect(visible).toContain('disabled="">행정 인수안 검토');
  });

  it('keeps a selected refusal receipt visible without opening the explanatory details', () => {
    const p = declared();
    const requested = executePoliticalSettlementAction(p.state, { kind: 'request-recognition', partnerNationId: 'china' }, p.context).state;
    p.state = { ...requested, recognitions: requested.recognitions.map((entry) => ({ ...entry, status: 'rejected' as const, resolvedWeek: 4, reason: '답변 시점 관계 악화로 거부' })) };
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    const visible = html.replace(/<details\b[\s\S]*?<\/details>/g, '');
    expect(visible).toContain('답변 시점 관계 악화로 거부');
    expect(visible).toContain('거부·보류 결정 뒤 4주가 지나야 재신청할 수 있습니다.');
    expect(visible).toContain('class="settlement-record-select status-rejected" aria-pressed="true"');
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('does not round a failing condition up to its displayed threshold', () => {
    const p = declared();
    p.context.relations = p.context.relations.map((relation) => ({ ...relation, value: 64.99 }));
    p.context.stability = 44.99;
    p.context.institutionalCapacity = 44.99;
    p.context.territories = p.context.territories.map((territory) => territory.id === 'korea' ? { ...territory, supply: 39.99 } : territory);
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    expect(html).toContain('<dd>64.99<small> / 65 이상</small>');
    expect(html).toContain('<dd>44.99<small> / 45 이상</small>');
    expect(html).toContain('<dd>39.99<small> / 40 이상</small>');
    expect(html).toContain('disabled="">행정 인수안 검토');
  });

  it('keeps current facts visible to an observer without exposing enabled execution', () => {
    const p = declared();
    p.context = { ...p.context, canDeclare: false, canNegotiate: false, canAdminister: false };
    p.authorityNote = '일반인 · 공개 현황만 열람 · 국가 결재권 없음';
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    expect(html).toContain('대한민국 대표정부'); expect(html).toContain(p.authorityNote);
    expect(html).toContain('국경의 범위가 아닙니다');
    expect(html).toContain('disabled="">승인 요청안 검토');
    expect(html).toContain('disabled="">행정 인수안 검토');
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('filters unknown, duplicate and own-nation diplomatic partner options', () => {
    const p = declared();
    p.context.relations = [...p.context.relations, { id: 'korea', name: '자국', code: 'KR', value: 90, status: '자국', color: '' }, { id: 'atlantis', name: '잘못된 국가', code: '', value: 80, status: '', color: '' }, p.context.relations[0]];
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    const partnerSelect = html.match(/<select[^>]*-partner[^>]*>[\s\S]*?<\/select>/)?.[0] ?? '';
    expect(partnerSelect).toContain('value="china"');
    expect(partnerSelect.match(/value="china"/g)).toHaveLength(1);
    expect(partnerSelect).not.toContain('value="korea"'); expect(partnerSelect).not.toContain('atlantis');
  });

  it('excludes sea seats without relocating or changing land territory objects', () => {
    const input = structuredClone(territories); const before = JSON.stringify(input);
    const seats = getPoliticalSettlementLandSeats(input);
    expect(seats.map((t) => t.id)).toEqual(['korea', 'chongqing', 'pyongyang']);
    expect(seats[0]).toBe(input[0]); expect(JSON.stringify(input)).toBe(before);
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...setup()} />);
    expect(html).not.toContain('<option value="japansea"');
  });

  it('shows pending reply timing separately from the declaration', () => {
    const p = declared();
    p.state = executePoliticalSettlementAction(p.state, { kind: 'request-recognition', partnerNationId: 'china' }, p.context).state;
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    expect(html).toContain('심사 중'); expect(html).toContain('답변 예정 제7주 · 1942.12.06');
    expect(html).toContain('0개국'); expect(html).toContain('영토 주권과 별개');
    expect(p.onExecute).not.toHaveBeenCalled();
  });

  it('shows suspended administration with a distinct resume action and no fabricated operating result', () => {
    const p = declared();
    const result = executePoliticalSettlementAction(p.state, { kind: 'start-administration', territoryId: 'korea' }, p.context);
    expect(result.accepted).toBe(true);
    p.state = { ...result.state, administrations: result.state.administrations.map((entry) => ({ ...entry, status: 'suspended' as const, reason: '직전 주 보급 요건 미달', progressWeeks: 1 })) };
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...p} />);
    expect(html).toContain('인수·운영 중단'); expect(html).toContain('준비 재개안 검토');
    expect(html).toContain('0개 거점 운영');
    expect(html).not.toContain(`>${getPoliticalSettlementPolity(p.state, p.context.nationId)!.id}<`);
  });

  it('keeps an unavailable seat selection empty instead of substituting a different city', () => {
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...setup({ defaultSeatTerritoryId: 'missing' })} />);
    expect(html).toContain('value="" disabled="" selected="">육상 거점을 선택하세요');
    expect(html).toContain('disabled="">공표안 검토');
  });

  it('distinguishes blank legacy records from an invented historical chronology', () => {
    const html = renderToStaticMarkup(<PoliticalSettlementBoard {...setup()} />);
    expect(html).toContain('새 기능 이전의 선언·승인·행정 이력은 만들어내지 않습니다');
    expect(html).toContain('정치 상태 변경 기록 0건');
  });

  it('prints one-based campaign weeks with real UTC campaign dates', () => {
    expect(formatPoliticalSettlementWeek(0)).toBe('제1주 · 1942.10.25');
    expect(formatPoliticalSettlementWeek(2)).toBe('제3주 · 1942.11.08');
  });
});
