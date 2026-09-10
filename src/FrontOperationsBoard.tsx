import { Award, ChevronRight, History, Medal, Search, ShieldAlert, Star, Swords, Users, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { deriveFrontStandouts, getHistoricalFrontFigures } from './frontLegacy';
import type { FrontSummary } from './mapPresentation';
import type { BattleReport, Commander, Division } from './types';

interface FrontOperationsBoardProps {
  fronts: FrontSummary[];
  selectedFrontId: string | null;
  battleReports: BattleReport[];
  commanders: Commander[];
  divisions: Division[];
  onSelectFront: (frontId: string) => void;
  onCloseDetail: () => void;
  onOpenReport: (reportId: string) => void;
}

type FrontFilter = 'contact' | 'all' | 'decorated';

export function FrontOperationsBoard({
  fronts,
  selectedFrontId,
  battleReports,
  commanders,
  divisions,
  onSelectFront,
  onCloseDetail,
  onOpenReport,
}: FrontOperationsBoardProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FrontFilter>('contact');
  const records = useMemo(() => new Map(fronts.map((front) => [front.id, deriveFrontStandouts(
    front.id,
    battleReports,
    commanders,
    divisions,
    front.territoryIds,
  )])), [battleReports, commanders, divisions, fronts]);
  const normalizedQuery = query.trim().toLocaleLowerCase('ko');
  const visibleFronts = fronts.filter((front) => {
    const standouts = records.get(front.id) ?? [];
    const historical = getHistoricalFrontFigures(front.id);
    const matchesQuery = !normalizedQuery || [front.name, front.commandArea, ...standouts.map((item) => item.name), ...historical.map((item) => item.name)]
      .some((value) => value.toLocaleLowerCase('ko').includes(normalizedQuery));
    if (!matchesQuery) return false;
    if (filter === 'contact') return front.activeContacts > 0;
    if (filter === 'decorated') return standouts.some((item) => item.decorations > 0 || item.namedBattles.length > 0);
    return true;
  });
  const selectedFront = fronts.find((front) => front.id === selectedFrontId) ?? null;
  const selectedStandouts = selectedFront ? records.get(selectedFront.id) ?? [] : [];
  const selectedHistoricalFigures = selectedFront ? getHistoricalFrontFigures(selectedFront.id) : [];
  const allSelectedReports = selectedFront
    ? battleReports.filter((report) => report.frontId === selectedFront.id || selectedFront.territoryIds.includes(report.targetId))
    : [];
  const selectedReports = allSelectedReports.slice(0, 5);

  return (
    <section className={`front-operations-board ${selectedFront ? 'detail-open' : ''}`} aria-label="전선 지휘·공적 상황판">
      <header className="front-board-heading">
        <div><span>FRONT COMMAND</span><strong>전선 지휘·공적 상황판</strong></div>
        <em>{fronts.filter((front) => front.activeContacts > 0).length}/{fronts.length} 교전</em>
      </header>
      <div className="front-board-toolbar">
        <label><Search size={12} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="전선·인물 검색" aria-label="전선과 인물 검색" /></label>
        <div role="group" aria-label="전선 필터">
          <button type="button" className={filter === 'contact' ? 'active' : ''} onClick={() => setFilter('contact')}>교전</button>
          <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>전체</button>
          <button type="button" className={filter === 'decorated' ? 'active' : ''} onClick={() => setFilter('decorated')}>전공</button>
        </div>
      </div>

      {!selectedFront && (
        <div className="front-board-list">
          {visibleFronts.map((front) => {
            const standout = records.get(front.id)?.[0];
            const historicalFigure = getHistoricalFrontFigures(front.id)[0];
            const featuredName = standout?.battles ? standout.name : historicalFigure?.name;
            return (
              <button type="button" key={front.id} onClick={() => onSelectFront(front.id)} className={`${front.status === '위기' ? 'danger' : front.status === '우세' ? 'good' : ''}${front.activeContacts === 0 ? ' inactive' : ''}`}>
                <i><Swords size={13} /></i>
                <span>
                  <strong>{front.name}</strong>
                  <small>{front.commandArea}</small>
                  {featuredName && <b><Star size={9} /> {standout?.battles ? '현 전선 선두' : '사료 기준'} · {featuredName}</b>}
                </span>
                <em>{front.activeContacts > 0 ? <>{front.activeContacts} 접촉<br />{front.status}</> : <>비접촉<br />감시</>}</em>
              </button>
            );
          })}
          {visibleFronts.length === 0 && <p className="front-board-empty"><ShieldAlert size={15} /> 이 조건에 맞는 전선 기록이 없습니다.</p>}
        </div>
      )}

      {selectedFront && (
        <div className="front-board-detail">
          <header>
            <button type="button" aria-label="전선 상세 닫기" onClick={onCloseDetail}><X size={14} /></button>
            <div><span>{selectedFront.historicalWindow} · {selectedFront.status}</span><strong>{selectedFront.name}</strong><small>{selectedFront.commandArea}</small></div>
            <em>{selectedFront.intensity}</em>
          </header>
          <div className="front-board-metrics">
            <div><span>통제율</span><strong>{selectedFront.controlPercent}%</strong></div>
            <div><span>평균 보급</span><strong>{selectedFront.averageSupply}%</strong></div>
            <div><span>접촉선</span><strong>{selectedFront.activeContacts}</strong></div>
            <div><span>기록 전투</span><strong>{allSelectedReports.length}</strong></div>
          </div>

          <section className="front-standouts">
            <header><Users size={13} /><span>현재 전선 공적 순위</span><em>전투·승리·교환비·훈장 합산</em></header>
            {selectedStandouts.length > 0 ? selectedStandouts.slice(0, 3).map((person, index) => (
              <article key={person.commanderId}>
                <i>{index + 1}</i>
                <div><strong>{person.name}</strong><small>{person.deployedDivisions.join(' · ') || `최근 행동 제 ${person.lastActionWeek}주`}</small></div>
                <span><b>{person.merit}</b><small>{person.victories}승 / {person.battles}전</small></span>
                {person.decorations > 0 && <em><Medal size={11} /> {person.decorations}</em>}
              </article>
            )) : <p><Star size={13} /> 아직 플레이 중 전공이 없습니다. 아래 사료 인물이 기준 기록으로 표시됩니다.</p>}
          </section>

          <section className="front-historical-figures">
            <header><History size={13} /><span>1940년대 사료 기준 주요 인물</span></header>
            {selectedHistoricalFigures.slice(0, 3).map((person) => (
              <article key={`${selectedFront.id}-${person.name}`}>
                <i className={person.alignment}>{person.name.slice(0, 1)}</i>
                <div><strong>{person.name}</strong><span>{person.role}</span><small>{person.contribution}</small></div>
              </article>
            ))}
          </section>

          <section className="front-honors-log">
            <header><Award size={13} /><span>전투명·훈장 기록</span></header>
            {selectedReports.length > 0 ? selectedReports.map((report) => (
              <button type="button" key={report.id} onClick={() => onOpenReport(report.id)}>
                <i className={report.victory ? 'victory' : 'defeat'}>{report.decoration ? <Medal size={12} /> : <Swords size={12} />}</i>
                <span><strong>{report.battleName ?? `${report.targetName} ${report.victory ? '전투' : '공세'}`}</strong><small>{report.commanderName} · {report.decoration?.name ?? `작전 우세 ${report.margin >= 0 ? '+' : ''}${report.margin}`}</small></span>
                <ChevronRight size={12} />
              </button>
            )) : <p>아직 이 전선에서 완료된 전투가 없습니다.</p>}
          </section>

          <a href={selectedFront.sourceUrl} target="_blank" rel="noreferrer">전역 사료 기준 보기 <ChevronRight size={11} /></a>
        </div>
      )}
    </section>
  );
}
