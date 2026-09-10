import { useId, useRef, useState } from 'react';
import { ArrowRight, Check, Factory, Minus, Plus } from 'lucide-react';
import { reallocateFactory } from './livingWorld';
import type { PostwarIndustryReport } from './postwarIndustry';
import type { ProductionLine, Stockpile } from './types';
import './CapabilityDesks.css';

const labels: Record<keyof Stockpile, string> = { infantryEquipment: '보병 장비', tanks: '전차', aircraft: '항공기', convoys: '함선·수송선', artillery: '야포', trucks: '차량' };
const legacyKeys: Record<string, keyof Stockpile> = { rifle: 'infantryEquipment', sherman: 'tanks', spitfire: 'aircraft', convoy: 'convoys', artillery: 'artillery', truck: 'trucks' };
interface ProductionDeskProps {
  nationId: string;
  week: number;
  production: ProductionLine[];
  stockpile: Stockpile;
  factories: number;
  weeklyGains: Stockpile;
  postwarForecast?: PostwarIndustryReport;
  routedEquipmentKey?: keyof Stockpile;
  busy?: boolean;
  onAdjust: (id: string, amount: number) => void;
  onOpenPolicy?: () => void;
  onOpenLogistics?: () => void;
  onOpenEquipment?: () => void;
}
export interface FactoryDraft { nationId: string; week: number; lineId: string; delta: -1 | 1; factories: number; base: string }
export function createFactoryDraft(input: Pick<ProductionDeskProps, 'nationId'|'week'|'production'|'factories'>, lineId: string, delta: -1|1): FactoryDraft {
  return { nationId: input.nationId, week: input.week, lineId, delta, factories: input.factories, base: JSON.stringify(input.production) };
}
export function assessFactoryDraft(draft: FactoryDraft | null, input: Pick<ProductionDeskProps, 'nationId'|'week'|'production'|'factories'|'busy'>) {
  const changed = !draft || input.busy || draft.week !== input.week || draft.nationId !== input.nationId || draft.factories !== input.factories || draft.base !== JSON.stringify(input.production);
  const next = !changed && draft ? reallocateFactory(input.production, input.factories, draft.lineId, draft.delta, true) : null;
  return { allowed: Boolean(next), next, reason: changed ? '주차·국가·공장 배정이 바뀌었거나 진행 중입니다. 현재 조건으로 다시 검토하세요.' : next ? '승인하면 공장 배정만 변경합니다. 실제 생산은 다음 주 결산에서 확인하세요.' : '공장 여력이 없거나 변경할 수 없는 생산선입니다.' };
}
export function ProductionDesk(props: ProductionDeskProps) {
  const { production, stockpile, factories, weeklyGains, postwarForecast, routedEquipmentKey, busy, onAdjust, onOpenPolicy, onOpenLogistics, onOpenEquipment } = props;
  const [selectedId, setSelectedId] = useState(() => production[0]?.id ?? '');
  const [draft, setDraft] = useState<FactoryDraft | null>(null);
  const sent = useRef(false);
  const selectId = useId();
  const used = production.reduce((sum, line) => sum + line.assigned, 0);
  const selected = production.find((line) => line.id === selectedId);
  const reportLine = postwarForecast?.perLine.find((line) => line.lineId === selectedId);
  const equipmentKey = reportLine?.stockpileKey ?? legacyKeys[selectedId];
  const assessment = assessFactoryDraft(draft, props);
  const nextLine = assessment.next?.find((line) => line.id === selectedId);
  const choose = (id: string) => { setSelectedId(id); setDraft(null); };
  const propose = (delta: -1|1) => { if (!selected || busy) return; sent.current = false; setDraft(createFactoryDraft(props, selected.id, delta)); };
  const approve = () => { if (!draft || sent.current || !assessFactoryDraft(draft, props).allowed) return; sent.current = true; onAdjust(draft.lineId, draft.delta); setDraft(null); };
  return <section className="capability-desk production-command-desk" aria-label="생산선 지휘 작업대">
    <header className="capability-heading"><div><span className="capability-eyebrow">INDUSTRIAL COMMAND · 제{props.week + 1}주</span><h2>생산선 지휘</h2><p>생산선을 골라 공장 배정과 실제 납품 조건을 확인하세요.</p></div><div className="capability-actions">{onOpenPolicy ? <button type="button" onClick={onOpenPolicy}>가동·예산 검토<ArrowRight size={16} /></button> : null}{onOpenEquipment ? <button type="button" onClick={onOpenEquipment}>제식 장비 변경<ArrowRight size={16} /></button> : null}</div></header>
    <div className="capability-summary"><div><small>총 공장</small><strong>{factories}</strong></div><div><small>군수 배정</small><strong>{used}</strong></div><div><small>민수 공급 여력</small><strong>{Math.max(0, factories - used)}</strong></div></div>
    <div className="capability-split"><aside className="capability-browser" aria-label="생산선 선택">
      <label className="capability-mobile-select" htmlFor={selectId}>생산선 선택<select id={selectId} value={selected?.id ?? ''} disabled={!production.length} onChange={(event) => choose(event.target.value)}><option value="">생산선을 선택하세요</option>{production.map((line) => <option key={line.id} value={line.id}>{line.name} · 공장 {line.assigned}</option>)}</select></label>
      <div className="capability-selection-list">{production.map((line) => <button type="button" key={line.id} aria-pressed={selectedId === line.id} onClick={() => choose(line.id)}><span><strong>{line.name}</strong><small>{line.category} · 효율 {line.efficiency}%</small></span><span><Factory size={16} />{line.assigned}</span></button>)}</div>
      {!production.length ? <p>아직 배정할 생산선이 없습니다.</p> : null}
    </aside><article className="capability-detail" aria-label="선택한 생산선 상세">{selected ? <>
      <span className="capability-eyebrow">{selected.category}</span><h3>{selected.name}</h3>
      <dl className="capability-stat-grid"><div><dt>배정 공장</dt><dd>{selected.assigned}개</dd></div><div><dt>생산 효율</dt><dd>{selected.efficiency}%</dd></div><div><dt>{postwarForecast ? '다음 주 완료 전망' : '해당 품목 주간 전망'}</dt><dd>{(postwarForecast ? reportLine?.delivered ?? 0 : equipmentKey ? weeklyGains[equipmentKey] : 0).toLocaleString()}</dd></div></dl>
      <p className="capability-notice">{equipmentKey === routedEquipmentKey ? '생산 완료 → 집하창고 → 출발 예약 → 실제 도착 후 국가 가용 비축에 편입됩니다.' : postwarForecast ? '현재 승인된 예산·원료 조건에 따른 국가 직접입고 전망입니다.' : '현재 주차·효율·정책·조달 집중을 반영한 품목 전망입니다. 수송선 기본 소모를 포함하며, 전투 손실은 별도입니다.'}</p>
      <div className="capability-actions"><button type="button" disabled={busy || selected.assigned <= 0} onClick={() => propose(-1)}><Minus size={16} />공장 1개 회수안</button><button type="button" disabled={busy || used >= factories} onClick={() => propose(1)}><Plus size={16} />공장 1개 배정안</button></div>
      {draft ? <section className="capability-review" aria-label="공장 배정 변경안"><h4>아직 반영되지 않은 배정안</h4>{nextLine ? <dl className="capability-stat-grid"><div><dt>배정</dt><dd>{selected.assigned} → {nextLine.assigned}</dd></div><div><dt>효율</dt><dd>{selected.efficiency}% → {nextLine.efficiency}%</dd></div></dl> : null}<p role="status">{assessment.reason}</p><div className="capability-actions"><button type="button" onClick={() => setDraft(null)}>변경안 취소</button><button type="button" className="capability-primary" disabled={!assessment.allowed} onClick={approve}><Check size={16} />배정 변경 승인</button></div></section> : <small className="capability-muted">회수하면 해당 생산선 효율이 4 내려갑니다(최저 15). ± 버튼은 검토만 열며 승인이 필요합니다.</small>}
      {equipmentKey === routedEquipmentKey && onOpenLogistics ? <button type="button" onClick={onOpenLogistics}>집하·수송 상태 확인<ArrowRight size={16} /></button> : null}
      {selected.reliability !== undefined || selected.unitCost !== undefined ? <details className="capability-fold"><summary>제식 장비 제조 특성</summary><p>신뢰성 {selected.reliability ?? '자료 없음'} · 제조 단가 지수 {selected.unitCost ?? '자료 없음'}</p></details> : null}
    </> : <p>현재 목록에서 생산선을 직접 선택하세요.</p>}</article></div>
    <details className="capability-fold"><summary>국가 가용 비축과 다음 주 품목 전망</summary><div className="capability-stock">{(Object.keys(labels) as Array<keyof Stockpile>).map((key) => <div key={key}><small>{labels[key]}</small><strong>{stockpile[key].toLocaleString()}</strong><span>{key === routedEquipmentKey ? '공장 완료 전망' : '주간 전망'} +{weeklyGains[key].toLocaleString()}</span></div>)}</div><p>현재 비축에 창고 보관·수송 중 물량은 포함하지 않습니다. 주간 전망은 현재 조건의 예상이며 최종 순증감과 다를 수 있습니다.</p></details>
  </section>;
}
