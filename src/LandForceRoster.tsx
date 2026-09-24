import { useId, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import type { Commander, Division, Territory } from './types';
import type { RoleOperationalScope } from './roleCommand';

const statusLabels = { ready: '준비', moving: '이동', combat: '교전', recovering: '재편' };
export function getLandDivisionSelectionId(divisions: ReadonlyArray<Pick<Division, 'id'>>, id: string): string | null {
  return id && divisions.some((division) => division.id === id) ? id : null;
}
export function LandForceRoster({ divisions, commanders, territories, selectedId, commandableIds, scope, onSelect }: {
  divisions: Division[]; commanders: Commander[]; territories: Territory[]; selectedId: string;
  commandableIds: ReadonlySet<string>; scope: Pick<RoleOperationalScope, 'label'|'detail'>; onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState(''); const id = useId();
  const visible = divisions.filter((division) => `${division.name} ${commanders.find((item) => item.id === division.commanderId)?.name ?? ''} ${territories.find((item) => item.id === division.territoryId)?.name ?? ''}`.includes(query.trim()));
  const choose = (selectionId: string) => { const targetId = getLandDivisionSelectionId(visible, selectionId); if (targetId !== null) onSelect(targetId); };
  return <aside className="capability-browser land-roster" aria-label="육군 부대 선택"><header><h3>야전군 편제</h3><small>직접 {commandableIds.size} / 전체 {divisions.length}</small></header><label className="capability-search"><Search size={16} /><input aria-label="사단·지휘관·주둔지 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="사단·지휘관·주둔지" /></label>
    <label className="capability-mobile-select" htmlFor={id}>사단 선택<select id={id} value={visible.some((item) => item.id === selectedId) ? selectedId : ''} onChange={(event) => choose(event.target.value)}><option value="" disabled>{visible.length ? '사단을 선택하세요' : '검색 결과 없음'}</option>{visible.map((division) => <option key={division.id} value={division.id}>{division.name} · {commandableIds.has(division.id) ? statusLabels[division.status] : '상급 관할'}</option>)}</select></label>
    <div className="capability-selection-list">{visible.map((division) => <button type="button" key={division.id} aria-pressed={division.id === selectedId} onClick={() => choose(division.id)}><span><strong>{division.name}</strong><small>{territories.find((item) => item.id === division.territoryId)?.name ?? '주둔지 미상'} · {commandableIds.has(division.id) ? statusLabels[division.status] : '상급 관할'}</small></span><span>{division.strength}%</span></button>)}</div>
    {!visible.length ? <p>일치하는 부대가 없습니다.</p> : null}
    <details className="capability-fold"><summary><ShieldCheck size={14} /> 지휘권 범위</summary><p>{scope.label}</p><p>{scope.detail}</p></details>
  </aside>;
}
