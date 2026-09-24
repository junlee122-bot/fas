import { Anchor, Navigation, Fuel, Clock3 } from 'lucide-react';
import type { NavalTaskForce } from './jointOperations';
import { getFleetNavigationSummary } from './navalNavigation';
import './FleetVoyageCard.css';

export function FleetVoyageCard({ fleet }: { fleet: NavalTaskForce }) {
  const summary = getFleetNavigationSummary(fleet);
  const mode = fleet.navigation?.mode ?? 'in-port';
  const steps = ['in-port', 'outbound', 'on-station', 'returning', 'refueling'];
  const labels = ['모항', '합류점 이동', '현장 엄호', '귀항', '급유·점검'];
  const current = steps.indexOf(mode);
  const fuelPercent = summary.rangeNm > 0 ? Math.max(0, Math.min(100, summary.remainingRangeNm / summary.rangeNm * 100)) : 0;
  return <section className="fleet-voyage-card" aria-label={`${fleet.name} 항해 현황`}>
    <header><Navigation size={19} aria-hidden="true" /><strong>{summary.label}</strong><span>{fleet.name}</span></header>
    <ol aria-label="함대 운항 주기">{labels.map((label, index) => <li key={label} aria-current={index === current ? 'step' : undefined} className={index === current ? 'is-current' : ''}>{label}</li>)}</ol>
    <dl><div><dt><Anchor size={14} />모항</dt><dd>{summary.homePort}</dd></div><div><dt><Navigation size={14} />실제 위치</dt><dd>{summary.position}</dd></div><div><dt><Clock3 size={14} />다음 도착</dt><dd>{summary.arrivalWeeks ? `약 ${summary.arrivalWeeks}주` : summary.label}</dd><small>{summary.destination || '새 이동 명령 없음'}</small></div></dl>
    <div className="fv-range"><span><Fuel size={15} />잔여 항속 <strong>{summary.remainingRangeNm.toLocaleString('ko-KR')} / {summary.rangeNm.toLocaleString('ko-KR')}해리</strong></span><div role="meter" aria-label="잔여 항속 비율" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(fuelPercent)}><i style={{ width: `${fuelPercent}%` }} /></div></div>
    <p>{summary.detail}</p>
    {mode === 'returning' || mode === 'refueling' ? <small>귀항·급유가 끝날 때까지 새 작전·호위에 배속할 수 없습니다.</small> : null}
  </section>;
}
