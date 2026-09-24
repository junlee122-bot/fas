import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TerritoryPoliticalCard } from './TerritoryPoliticalCard';
import { createMapPoliticalLedger } from './mapPoliticalLedger';
import { createPoliticalSettlementState } from './politicalSettlement';
import type { MapPoliticalLedger, PoliticalChange } from './mapPoliticalLedger';
import type { Territory } from './types';
import { createTerritorialTreatiesState, type TerritorialTreaty } from './territorialTreaties';

const territory: Territory = { id: 'korea', name: '경성·조선 중부', region: '한반도', x: 0, y: 0,
  controller: 'axis', ownerId: 'korea', value: 1, supply: 80, terrain: '도시', neighbors: [], theater: 'asia' };
function ledger(): MapPoliticalLedger {
  const state = createMapPoliticalLedger([territory], 0);
  state.current.korea.verifiedControllerNationId = 'japan';
  return state;
}
function change(index: number, territoryId = 'korea'): PoliticalChange {
  return { id: `event-${index}`, territoryId, week: index,
    source: { kind: 'land-combat', id: `combat-${index}`, label: `검증 전투 ${index}호` },
    before: { controller: 'axis', gameOwnerId: 'korea', verifiedControllerNationId: 'japan' },
    after: { controller: 'allies', gameOwnerId: 'korea', verifiedControllerNationId: 'china' } };
}
function markup(state = ledger(), week = 10) {
  return renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={state} week={week} />);
}

describe('read-only territory political card', () => {
  it('shows the local process and agreed conditions without pretending approval means handover', () => {
    const treaties = createTerritorialTreatiesState();
    treaties.treaties = [{ id: 'terms1', name: '주민 동의 조건부 합의', proposerNationId: 'korea', partnerNationId: 'china',
      fromNationId: 'korea', toNationId: 'china', territoryId: territory.id, proposedWeek: 0, responseDueWeek: 2,
      respondedWeek: 2, status: 'accepted', reason: '지역 동의 승인 뒤 비준 필요',
      terms: { consentMethod: 'referendum', civilGuarantees: true, withdrawBeforeHandover: true, handoverDelayWeeks: 4 },
      consent: { method: 'referendum', status: 'approved', startedWeek: 2, lastProcessedWeek: 5, progressWeeks: 3, resolvedWeek: 5,
        supportPercent: 67, participationPercent: 76, reason: '게임의 합성 지역 모형으로 승인' } }];
    const before = JSON.stringify(treaties);
    const html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={5} treaties={treaties} />);
    expect(html).toContain('주민투표');
    expect(html).toContain('비준 후 4주');
    expect(html).toContain('조약상 주민보호 약속');
    expect(html).toContain('인도 시 제공국의 육군 주둔부대 철수 확인 필요');
    expect(html).toContain('지역 동의 승인');
    expect(html).toContain('게임 내 찬성 지표 67/100 · 참여 지표 76/100');
    expect(html).toContain('실제 역사 여론·득표수나 절차의 공정성을 증명하지 않습니다');
    expect(html).not.toContain('당사국 간 합의 귀속');
    expect(html).not.toContain('현지 인도 완료');
    expect(html).not.toContain('67%');
    expect(JSON.stringify(treaties)).toBe(before);
  });

  it('hides later consultation receipts and reasons from earlier map dates', () => {
    const treaties = createTerritorialTreatiesState();
    treaties.treaties = [{ id: 'later', name: '미래 심의 결과', proposerNationId: 'korea', partnerNationId: 'china',
      fromNationId: 'korea', toNationId: 'china', territoryId: territory.id, proposedWeek: 0, responseDueWeek: 2,
      respondedWeek: 2, status: 'accepted', reason: '미래 주민 승인 사유',
      terms: { consentMethod: 'regional-council', civilGuarantees: false, withdrawBeforeHandover: false, handoverDelayWeeks: 1 },
      consent: { method: 'regional-council', status: 'approved', startedWeek: 2, lastProcessedWeek: 5, progressWeeks: 3, resolvedWeek: 5,
        supportPercent: 70, participationPercent: 76, reason: '미래 동의 결과 근거' } }];
    const html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={4} treaties={treaties} />);
    expect(html).not.toContain('미래');
    expect(html).not.toContain('지역 동의 승인');
    expect(html).not.toContain('70/100');
    expect(html).toContain('이 거점에 연결된 조약이 없습니다');
  });

  it('distinguishes pending local consent and legacy default terms', () => {
    const treaties = createTerritorialTreatiesState();
    const treaty: TerritorialTreaty = { id: 'pending', name: '주민 심의 협정', proposerNationId: 'korea', partnerNationId: 'china',
      fromNationId: 'korea', toNationId: 'china', territoryId: territory.id, proposedWeek: 0, responseDueWeek: 2,
      respondedWeek: 2, status: 'accepted', reason: '심의 대기' };
    treaties.treaties = [treaty];
    let html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={4} treaties={treaties} />);
    expect(html).toContain('별도 지역 동의 조항 없음');
    expect(html).toContain('비준 후 1주');
    treaty.terms = { consentMethod: 'regional-council', civilGuarantees: false, withdrawBeforeHandover: false, handoverDelayWeeks: 8 };
    html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={4} treaties={treaties} />);
    expect(html).toContain('지역대표 심의');
    expect(html).toContain('지역 동의 착수 전');
    expect(html).not.toContain('지역 동의 승인');
  });

  it('separates bilateral attribution, suspended handover and third-party military control', () => {
    const treaties = createTerritorialTreatiesState();
    treaties.treaties = [{ id: 'treaty1', name: '경성 거점 협정', proposerNationId: 'korea', partnerNationId: 'china',
      fromNationId: 'korea', toNationId: 'china', territoryId: territory.id, proposedWeek: 0, responseDueWeek: 2,
      respondedWeek: 2, ratifiedWeek: 3, handoverDueWeek: 4, status: 'suspended', reason: '제3국 통제로 인도 보류' }];
    const before = JSON.stringify(treaties);
    const html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={4} treaties={treaties} onOpenTreaties={() => undefined} />);
    expect(html).toContain('통제 국가</dt><dd>일본');
    expect(html).toContain('당사국 간 합의 귀속</dt><dd>중국');
    expect(html).toContain('비준 유지 · 현지 인도 중단');
    expect(html).toContain('영역 미확인');
    expect(html).toContain('조약·영토 이양 열기');
    expect(html).toContain('영토 주권·국경</dt><dd class="territory-political-unverified">확정 기록 없음');
    expect(JSON.stringify(treaties)).toBe(before);
  });

  it('does not infer a concluded treaty or future receipt from military ownership', () => {
    const treaties = createTerritorialTreatiesState();
    const future: TerritorialTreaty = { id: 'future', name: '미래 조약', proposerNationId: 'korea', partnerNationId: 'china',
      fromNationId: 'korea', toNationId: 'china', territoryId: territory.id, proposedWeek: 0, responseDueWeek: 2,
      respondedWeek: 2, ratifiedWeek: 10, handoverDueWeek: 11, status: 'ratified', reason: '미래 비준 내용' };
    treaties.treaties = [future];
    const html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={4} treaties={treaties} />);
    expect(html).not.toContain('당사국 간 합의 귀속');
    expect(html).not.toContain('미래 비준 내용');
    expect(html).toContain('이 거점에 연결된 조약이 없습니다.');
  });
  it('connects actual representation and administration records without asserting sovereignty', () => {
    const settlement = createPoliticalSettlementState();
    settlement.polities = [{ id: 'polity:korea', nationId: 'korea', name: '시험 대표정부', declaration: 'independence', seatTerritoryId: 'korea', declaredWeek: 1 }];
    settlement.recognitions = [{ id: 'r1', polityId: 'polity:korea', partnerNationId: 'china', requestedWeek: 2, dueWeek: 4, resolvedWeek: 4, status: 'recognized', reason: '심사 승인' }];
    settlement.administrations = [{ id: 'a1', polityId: 'polity:korea', territoryId: 'korea', status: 'preparing', startedWeek: 3, lastProcessedWeek: 4, progressWeeks: 1, reason: '관할·보급 검증 중' }];
    const before = JSON.stringify(settlement);
    const html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={4} settlement={settlement} onOpenDiplomacy={() => undefined} />);
    expect(html).toContain('시험 대표정부');
    expect(html).toContain('대표권 승인국</dt><dd>중국');
    expect(html).toContain('준비 1/3주');
    expect(html).toContain('영토 주권·국경');
    expect(html).toContain('확정 기록 없음');
    expect(html).toContain('소유권이나 수도 지위를 뜻하지 않습니다');
    expect(html).toContain('정부·행정 절차 열기');
    expect(JSON.stringify(settlement)).toBe(before);
    const otherSite = renderToStaticMarkup(<TerritoryPoliticalCard territory={{ ...territory, id: 'britain' }} ledger={ledger()} week={4} settlement={settlement} />);
    expect(otherSite).not.toContain('시험 대표정부');
    expect(otherSite).toContain('연결된 정부 선언이나 행정 기록이 없습니다');
  });

  it('does not show a later declaration or approval as a current fact', () => {
    const settlement = createPoliticalSettlementState();
    settlement.polities = [{ id: 'polity:korea', nationId: 'korea', name: '미래 대표정부', declaration: 'representation', seatTerritoryId: 'korea', declaredWeek: 3 }];
    settlement.recognitions = [{ id: 'r1', polityId: 'polity:korea', partnerNationId: 'china', requestedWeek: 3, dueWeek: 5, resolvedWeek: 5, status: 'recognized', reason: '심사 승인' }];
    let html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={2} settlement={settlement} />);
    expect(html).not.toContain('미래 대표정부');
    html = renderToStaticMarkup(<TerritoryPoliticalCard territory={territory} ledger={ledger()} week={3} settlement={settlement} />);
    expect(html).toContain('아직 없음 · 심사 중 1개국');
    expect(html).not.toContain('대표권 승인국</dt><dd>중국');
  });

  it('shows the surviving last receipt when this site has fallen out of the global history window', () => {
    const state = ledger();
    state.latestByTerritory.korea = change(1);
    state.omittedCount = 30;
    const html = markup(state);
    expect(html).toContain('마지막 근거 1건');
    expect(html).toContain('검증 전투 1호');
    expect(html).toContain('상세 이력이 보관 한도를 넘어');
    expect(html).not.toContain('기록 기준 이후 확인된 변동이 없습니다');
  });

  it('uses the same one-based week and UTC date as the campaign header', () => {
    const state = ledger(); state.changes = [change(1)];
    const html = markup(state, 1);
    expect(html).toContain('기록 기준 1주차 · 현재 2주차');
    expect(html).toContain('dateTime="1942-11-01"');
    expect(html).not.toContain('0주차');
  });

  it('separates faction, verified controlling nation, game attribution and unconfirmed sovereignty', () => {
    const html = markup();
    expect(html).toContain('추축 진영');
    expect(html).toMatch(/통제 국가<\/dt><dd>일본<\/dd>/);
    expect(html).toMatch(/게임상 귀속<\/dt><dd>한국 독립운동<\/dd>/);
    expect(html).toContain('영토 주권·국경');
    expect(html).toContain('확정 기록 없음');
    expect(html).toContain('군사 통제·점령은 법적 주권이나 국제 승인을 뜻하지 않습니다');
    expect(html).toContain('조회 전용');
    expect(html).not.toMatch(/<(?:button|input|select|form)\b/);
  });

  it('does not invent a controller from the owning country or fill missing history', () => {
    const state = ledger();
    delete state.current.korea.verifiedControllerNationId;
    let html = markup(state);
    expect(html).toMatch(/통제 국가<\/dt><dd>국가 미확인<\/dd>/);
    delete state.current.korea;
    html = markup(state);
    expect(html).toContain('추축 진영');
    expect(html).toMatch(/게임상 귀속<\/dt><dd>한국 독립운동<\/dd>/);
    expect(html).toContain('현재 지도 값만 표시합니다');
    expect(html).toContain('통제 국가는 귀속 값에서 추정하지 않습니다');
    expect(html).toContain('기록 기준 이후 확인된 변동이 없습니다');
  });

  it('explains the legacy-load baseline and does not claim its unknown earlier occupations', () => {
    const state = ledger(); state.baselineKind = 'legacy-load'; state.startedWeek = 42;
    const html = markup(state, 44);
    expect(html).toContain('기록 기준 43주차 · 현재 45주차');
    expect(html).toContain('기존 저장을 불러온 시점부터 기록합니다');
    expect(html).toContain('그 이전의 점령·귀속 이력은 추정해 만들지 않습니다');
    expect(html).not.toContain('캠페인 시작 상태를 기준');
  });

  it('shows only this site’s five most recent confirmed changes, newest first, inside closed native details', () => {
    const state = ledger(); state.changes = [change(1), change(2), change(3), change(4), change(5), change(6), change(7, 'japan_home'), change(12)];
    const original = JSON.stringify(state);
    const html = markup(state, 10);
    expect(html).toContain('최근 5건 / 6건');
    expect(html).not.toContain('검증 전투 1호');
    expect(html).not.toContain('검증 전투 7호');
    expect(html).not.toContain('검증 전투 12호');
    expect(html.indexOf('검증 전투 6호')).toBeLessThan(html.indexOf('검증 전투 5호'));
    expect(html.indexOf('검증 전투 5호')).toBeLessThan(html.indexOf('검증 전투 2호'));
    expect(html).toContain('육상 전투');
    expect(html).toContain('일본</span>');
    expect(html).toContain('<strong>중국</strong>');
    expect(html).toContain('<strong>연합 진영</strong>');
    expect(html).toMatch(/<details class="territory-political-history">/);
    expect(html).not.toMatch(/<details[^>]*\bopen/);
    expect(html).toContain('aria-label="최근 통제·귀속 변동, 최신순"');
    expect(JSON.stringify(state)).toBe(original);
  });

  it('reports country-attribution-only changes without suggesting sovereignty was ceded', () => {
    const state = ledger(); const entry = change(2);
    entry.source = { kind: 'nation-transition', id: 'constitution-2', label: '검증 국가 전환' };
    entry.before = { controller: 'allies', gameOwnerId: 'japan' };
    entry.after = { controller: 'allies', gameOwnerId: 'korea' };
    state.changes = [entry]; state.omittedCount = 20;
    const html = markup(state);
    expect(html).toContain('국가 체제 전환');
    expect(html).toContain('검증 국가 전환');
    expect(html).toContain('이전 세계 기록 20건');
    expect(html).toContain('영토 주권·국경');
    expect(html).toContain('확정 기록 없음');
    expect(html).not.toContain('주권 이양 완료');
  });

  it('isolates pointer, scroll and keyboard map input without mutating either input', () => {
    const state = ledger(); state.changes = [change(2)];
    const before = JSON.stringify({ territory, state });
    const tree = TerritoryPoliticalCard({ territory, ledger: state, week: 10 });
    expect(tree.props.id).toBe('territory-political-card');
    expect(tree.props.tabIndex).toBe(-1);
    for (const eventName of ['onPointerDown', 'onMouseDown', 'onClick', 'onDoubleClick', 'onWheel', 'onKeyDown', 'onKeyUp'] as const) {
      const stopPropagation = vi.fn();
      tree.props[eventName]({ stopPropagation } as never);
      expect(stopPropagation).toHaveBeenCalledOnce();
    }
    expect(JSON.stringify({ territory, state })).toBe(before);
  });

  it('distinguishes maritime superiority from territorial sovereignty and keeps receipt identifiers internal', () => {
    const state = ledger(); state.changes = [change(2)];
    const html = renderToStaticMarkup(<TerritoryPoliticalCard territory={{ ...territory, siteType: 'sea' }} ledger={state} week={10} />);
    expect(html).toContain('해역 우세는 영토 주권과 다릅니다');
    expect(html).not.toContain('군사 통제·점령은');
    expect(html).toContain('검증 전투 2호');
    expect(html).not.toContain('combat-2');
    expect(html).not.toContain('event-2');
  });

  it('fails closed for unknown nation identifiers and invalid weeks without raw IDs or NaN', () => {
    const state = ledger(); state.current.korea = { controller: 'axis', gameOwnerId: 'invented-owner', verifiedControllerNationId: 'invented-controller' } as never;
    state.startedWeek = NaN; state.omittedCount = Infinity; state.changes = [change(1)];
    const html = markup(state, Infinity);
    expect(html).toContain('주차 미확인');
    expect(html).toMatch(/통제 국가<\/dt><dd>국가 미확인<\/dd>/);
    expect(html).toMatch(/게임상 귀속<\/dt><dd>미기록<\/dd>/);
    expect(html).not.toContain('invented-');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
    expect(html).not.toContain('검증 전투 1호');
  });
});
