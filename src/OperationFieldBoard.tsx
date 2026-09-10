import { useState } from 'react';
import { battleTypeProfiles, getOperationOrderId, getOperationProgress, getOperationReports } from './operations';
import type { OperationStopReceipt } from './operations';
import type { BattleReport, Commander, Division, Order, Territory } from './types';
import './OperationFieldBoard.css';

export interface OperationFieldBoardProps {
  week: number;
  phase: 'war' | 'nation';
  orders: readonly Order[];
  reports: readonly BattleReport[];
  divisions: readonly Division[];
  territories: readonly Territory[];
  commanders: readonly Commander[];
  commandableDivisionIds: ReadonlySet<string>;
  stoppages?: readonly OperationStopReceipt[];
  processingWeek?: boolean;
  selectedOrderId?: string | null;
  onSelectOrder?: (orderId: string) => void;
  onStop: (orderId: string) => void;
  onSelectTarget: (targetId: string) => void;
}

interface FieldSelection {
  orderId: string;
  divisionId: string;
  targetId: string;
  order?: Order;
}

const number = (value: number | undefined) => value !== undefined && Number.isFinite(value) ? value.toLocaleString('ko-KR', { maximumFractionDigits: 2 }) : '자료 없음';
const validWeek = (week: number, currentWeek: number) => Number.isInteger(week) && week >= 0 && week <= currentWeek;

/** Read-only: no predictions, enemy-strength fields, or fallback matching by names. */
export function OperationFieldBoard(props: OperationFieldBoardProps) {
  const { week, phase, orders, reports, divisions, territories, commanders, commandableDivisionIds,
    stoppages = [], processingWeek = false, selectedOrderId, onSelectOrder, onStop, onSelectTarget } = props;
  const [localSelection, setLocalSelection] = useState<string | null>(null);
  const currentDivisions = new Map(divisions.map((division) => [division.id, division]));
  const currentTerritories = new Map(territories.map((territory) => [territory.id, territory]));
  const choices = new Map<string, FieldSelection>();
  for (const order of orders) {
    const orderId = getOperationOrderId(order);
    if (!choices.has(orderId)) choices.set(orderId, { orderId, divisionId: order.divisionId, targetId: order.targetId, order });
  }
  for (const stop of [...stoppages].sort((a, b) => b.week - a.week)) {
    if (validWeek(stop.week, week) && !choices.has(stop.orderId)) choices.set(stop.orderId, { orderId: stop.orderId, divisionId: stop.divisionId, targetId: stop.targetId });
  }
  for (const report of [...reports].sort((a, b) => b.week - a.week)) {
    if (report.orderId && validWeek(report.week, week) && !choices.has(report.orderId)) {
      choices.set(report.orderId, { orderId: report.orderId, divisionId: report.divisionId, targetId: report.targetId });
    }
  }
  const selected = choices.get(selectedOrderId ?? localSelection ?? '') ?? choices.values().next().value;
  const division = selected ? currentDivisions.get(selected.divisionId) : undefined;
  const target = selected ? currentTerritories.get(selected.targetId) : undefined;
  const selectedReports = selected ? getOperationReports(reports, selected.orderId, week, selected) : [];
  const lastReport = selectedReports[0];
  const stop = selected ? [...stoppages].filter((item) => item.orderId === selected.orderId && item.divisionId === selected.divisionId
    && item.targetId === selected.targetId && validWeek(item.week, week)).sort((a, b) => b.week - a.week)[0] : undefined;
  const order = selected?.order;
  const commander = division ? commanders.find((item) => item.id === division.commanderId) : undefined;
  const stopPending = order?.stopRequestedWeek !== undefined;
  const finalized = lastReport?.operationOutcome === 'victory' || lastReport?.operationOutcome === 'defeat';
  const status = order ? stopPending ? '중단 대기' : (order.elapsedWeeks ?? 0) > 0 ? '교전 진행 중' : '승인됨 · 첫 결산 전'
    : stop ? '중단 완료' : finalized ? lastReport.operationOutcome === 'victory' ? '작전 승리' : '작전 패배·철수' : '활성 명령 없음 · 종결 확인 불가';
  const progress = order ? getOperationProgress(order) : stop?.progressPercent ?? (lastReport?.operationRequired
    ? Math.max(0, Math.min(100, Math.round((lastReport.operationProgress ?? 0) / lastReport.operationRequired * 100))) : undefined);
  const elapsedWeeks = order?.elapsedWeeks ?? stop?.elapsedWeeks ?? lastReport?.operationWeek;
  const commandCost = order?.commandCost ?? lastReport?.orderCommandCost;
  const canStop = Boolean(order && division && phase === 'war' && commandableDivisionIds.has(order.divisionId)
    && !processingWeek && !stopPending && order.startedWeek <= week);
  const stopReason = !order ? '종료된 명령은 다시 중단할 수 없습니다.' : phase !== 'war' ? '국정에서는 전시 공세 명령을 집행하지 않습니다.'
    : !division ? '해당 부대가 없어 주간 검증에서 명령을 정리합니다.' : !commandableDivisionIds.has(order.divisionId) ? '현재 보직의 지휘 범위 밖입니다. 전황만 열람합니다.'
      : processingWeek ? '주간 결산 중에는 새 중단 요청을 받지 않습니다.' : stopPending ? '중단 요청이 저장됐습니다. 다음 주 교전 전에 처리합니다.'
        : order.startedWeek > week ? '아직 승인 주차가 되지 않은 명령입니다.' : '중단은 다음 주 교전 전에 적용합니다. 승인 비용·기존 손실은 환급하지 않습니다.';
  const legacyReports = reports.filter((report) => !report.orderId && validWeek(report.week, week)).length;

  return <section className="operation-field" aria-labelledby="operation-field-title">
    <header className="operation-field-header"><div><span className="operation-field-kicker">명령에서 결산까지 · 제{week + 1}주</span><h2 id="operation-field-title">작전 현장</h2></div><p>실제 지상 명령과 연결된 기록만 표시합니다.</p></header>
    {choices.size === 0 ? <p className="operation-field-empty">진행 중이거나 식별자가 연결된 작전이 없습니다. 군사 화면에서 지휘 범위와 계획을 확인하십시오.</p> : <div className="operation-field-layout">
      <nav className="operation-field-list" aria-label="작전 선택">
        {[...choices.values()].map((choice) => <button type="button" key={choice.orderId} aria-pressed={choice.orderId === selected?.orderId}
          onClick={() => { setLocalSelection(choice.orderId); onSelectOrder?.(choice.orderId); }}>
          <strong>{currentTerritories.get(choice.targetId)?.name ?? reports.find((report) => report.orderId === choice.orderId && report.targetId === choice.targetId)?.targetName ?? '목표 자료 없음'}</strong>
          <span>{currentDivisions.get(choice.divisionId)?.name ?? '이전 배속 부대'} · {choice.order ? '활성 명령' : '과거 기록'}</span>
        </button>)}
      </nav>
      {selected ? <div className="operation-field-detail" aria-live="polite">
        <div className="operation-field-heading"><div><span className="operation-field-state">{status}</span><h3>{target?.name ?? lastReport?.targetName ?? '목표 자료 없음'}</h3></div>
          {target ? <button type="button" onClick={() => onSelectTarget(target.id)}>지도에서 목표 보기</button> : <span>목표 위치를 확인할 수 없습니다.</span>}
        </div>
        <div className="operation-field-scene" aria-label="배속 부대와 실제 작전 목표의 관계">
          <div><small>{order ? '현재 배속' : '기록의 배속'}</small><strong>{order ? division?.name ?? '부대 자료 없음' : lastReport?.divisionName ?? division?.name ?? '부대 자료 없음'}</strong><span>{order ? commander?.name ?? '지휘관 자료 없음' : lastReport?.commanderName ?? '지휘관 기록 없음'}</span></div>
          <span className={`operation-field-link ${order && !stopPending ? 'active' : ''}`} aria-hidden="true">→</span>
          <div><small>{target?.terrain ?? lastReport?.terrain ?? '지형 자료 없음'}</small><strong>{target?.name ?? lastReport?.targetName ?? selected.targetId}</strong><span>{order?.battleType ? battleTypeProfiles[order.battleType]?.label : lastReport?.battleType ? battleTypeProfiles[lastReport.battleType]?.label : '작전 유형 미확인'}</span></div>
        </div>
        <p className="operation-field-disclaimer">관계 모식도입니다. 실제 행군 경로·적 비공개 병력·실시간 피해를 나타내지 않습니다.</p>
        <dl className="operation-field-metrics">
          <div><dt>경과 기간</dt><dd>{number(elapsedWeeks)}{elapsedWeeks !== undefined ? '주' : ''}</dd></div>
          <div><dt>누적 작전 진척</dt><dd>{number(progress)}{progress !== undefined ? '%' : ''}</dd></div>
          <div><dt>최초 승인 지휘비용</dt><dd>{commandCost !== undefined ? `${number(commandCost)} · 이미 집행` : '구기록/연결 자료 없음'}</dd></div>
        </dl>
        {order && division ? <><h4>배속 부대의 현재 상태</h4><dl className="operation-field-metrics">
          <div><dt>전력</dt><dd>{number(division.strength)} / 100</dd></div><div><dt>조직</dt><dd>{number(division.organization)} / 100</dd></div><div><dt>아군 보급</dt><dd>{number(division.supply)} / 100</dd></div>
        </dl></> : null}
        {lastReport ? <section className="operation-field-receipt" aria-label="연결된 최근 교전 결산">
          <h4>제{lastReport.week + 1}주 교전 결산 · {lastReport.operationOutcome === 'ongoing' ? '작전은 당시 진행 중' : lastReport.operationOutcome === 'victory' ? '작전 승리 확정' : lastReport.operationOutcome === 'defeat' ? '작전 패배·철수 확정' : '작전 종결 상태 미확인'}</h4>
          <p>{lastReport.summary}</p>
          <dl className="operation-field-metrics">
            <div><dt>{lastReport.appliedLosses ? '확정 반영 전력 손실' : '계산된 전력 소모'}</dt><dd>-{number(lastReport.appliedLosses?.strength ?? lastReport.attackerStrengthLoss)}</dd></div>
            <div><dt>{lastReport.appliedLosses ? '확정 반영 조직 소모' : '계산된 조직 소모'}</dt><dd>-{number(lastReport.appliedLosses?.organization ?? lastReport.organizationLoss)}</dd></div>
            <div><dt>{lastReport.appliedLosses ? '확정 반영 보급 소모' : '계산된 보급 소모'}</dt><dd>-{number(lastReport.appliedLosses?.supply ?? lastReport.supplySpent)}</dd></div>
            <div><dt>실제 적용 항공지원 진척</dt><dd>{lastReport.appliedAirSupport !== undefined ? `+${number(lastReport.appliedAirSupport)}` : '구기록/연결 자료 없음'}</dd></div>
          </dl>
          {!lastReport.appliedLosses ? <small>현재 부대 상태와 직접 대조된 적용량은 이 구기록에 없습니다. 계산 소모를 실제 차감량으로 단정하지 않습니다.</small> : null}
          {lastReport.appliedLosses ? <small>해당 교전 적용분입니다. 후속 회복·재보급은 별도 결산입니다.</small> : null}
        </section> : <p className="operation-field-empty">이 작전 ID에 연결된 교전 결산이 아직 없습니다. 다른 공세의 기록으로 채우지 않습니다.</p>}
        {stop ? <p className="operation-field-stopped" role="status">제{stop.week + 1}주 중단 확정: {stop.reason}</p> : null}
        <div className="operation-field-actions"><p>{stopReason}</p>{order ? <button type="button" disabled={!canStop} onClick={() => { if (canStop) onStop(selected.orderId); }}>이 공세 중단 요청</button> : null}</div>
        <details className="operation-field-identity"><summary>기록 연결 확인</summary><p>작전 ID: {selected.orderId}</p>{lastReport ? <p>교전 보고서 ID: {lastReport.id}</p> : null}</details>
      </div> : null}
    </div>}
    {legacyReports > 0 ? <p className="operation-field-disclaimer">작전 ID가 없는 구 교전 기록 {legacyReports}건은 다른 공세와 임의 연결하지 않았습니다. 기존 전투 보고서에서 열람할 수 있습니다.</p> : null}
  </section>;
}
