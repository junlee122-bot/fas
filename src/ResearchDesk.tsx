import { useId, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, FlaskConical, LockKeyhole, Pause, Play, Search } from 'lucide-react';
import { getResearchAvailability } from './researchProgression';
import type { ResearchProject } from './types';
import './CapabilityDesks.css';

export interface ResearchDeskProps {
  research: ResearchProject[];
  currentYear: number;
  week: number;
  weeklyGain: number;
  busy?: boolean;
  onToggle: (id: string) => void;
  onOpenEquipment?: () => void;
  liaison?: { name: string; office: string; bonus: string };
}
export function assessResearchAction(project: ResearchProject | undefined, research: ResearchProject[], currentYear: number, busy = false) {
  if (!project) return { allowed: false, reason: '검토할 과제를 선택하세요.' };
  if (busy) return { allowed: false, reason: '기간 진행이 끝난 뒤 연구를 변경하세요.' };
  if (project.complete) return { allowed: false, reason: '완료된 과제입니다. 국가 체계에 적용 중입니다.' };
  if (project.active) return { allowed: true, reason: '진행량을 보존하고 연구 슬롯을 비웁니다.' };
  const availability = getResearchAvailability(project, research, currentYear);
  if (!availability.available) return { allowed: false, reason: availability.reason };
  if (research.filter((item) => item.active && !item.complete).length >= 2) return { allowed: false, reason: '두 슬롯 모두 사용 중입니다. 진행 중 과제를 일시 중지하면 배정할 수 있습니다.' };
  return { allowed: true, reason: '이 과제를 빈 연구 슬롯에 배정합니다. 다음 주부터 진행량이 반영됩니다.' };
}
export function getResearchWeeks(project: ResearchProject, gain: number): number | null {
  return Number.isFinite(gain) && gain > 0 ? Math.ceil(Math.max(0, project.duration - project.progress) / gain) : null;
}
type ResearchFilter = 'available' | 'active' | 'future' | 'complete';
export function getResearchDeskSelection(research: ResearchProject[], currentYear: number, selection: { filter: ResearchFilter; query: string; selectedId: string }) {
  const query = selection.query.trim().toLocaleLowerCase();
  const filtered = research.filter((item) => {
    const match = selection.filter === 'active' ? item.active && !item.complete : selection.filter === 'complete' ? item.complete : selection.filter === 'future' ? !item.complete && !getResearchAvailability(item, research, currentYear).available : !item.complete && getResearchAvailability(item, research, currentYear).available;
    return match && `${item.name} ${item.branch} ${item.description}`.toLocaleLowerCase().includes(query);
  });
  return { filtered, selected: filtered.find((item) => item.id === selection.selectedId) };
}
export function getResearchSlotTarget(research: ResearchProject[], slot: number): { filter: ResearchFilter; query: string; selectedId: string } {
  const project = research.filter((item) => item.active && !item.complete)[slot];
  return { filter: project ? 'active' : 'available', query: '', selectedId: project?.id ?? '' };
}
export function ResearchDesk({ research, currentYear, week, weeklyGain, busy = false, onToggle, onOpenEquipment, liaison }: ResearchDeskProps) {
  const [filter, setFilter] = useState<ResearchFilter>('available');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(() => research.find((item) => item.active && !item.complete)?.id ?? research.find((item) => !item.complete && getResearchAvailability(item, research, currentYear).available)?.id ?? '');
  const issued = useRef('');
  const selectId = useId();
  const active = research.filter((item) => item.active && !item.complete);
  const { filtered, selected } = getResearchDeskSelection(research, currentYear, { filter, query, selectedId });
  const action = assessResearchAction(selected, research, currentYear, busy);
  const choose = (id: string) => setSelectedId(id);
  const act = () => {
    if (!selected || !assessResearchAction(selected, research, currentYear, busy).allowed) return;
    const identity = JSON.stringify([week, selected.id, selected.active, selected.progress]);
    if (issued.current === identity) return;
    issued.current = identity;
    onToggle(selected.id);
  };
  return <section className="capability-desk research-command-desk" aria-label="국가 연구 작업대">
    <header className="capability-heading"><div><span className="capability-eyebrow">RESEARCH COMMAND · {currentYear}</span><h2>국가 연구</h2><p>과제를 먼저 읽고, 필요한 연구만 슬롯에 배정하세요.</p></div>{onOpenEquipment ? <button type="button" onClick={onOpenEquipment}><FlaskConical size={17} />장비 개발국</button> : null}</header>
    <div className="research-slot-row" aria-label="두 개의 국가 연구 슬롯">{[0, 1].map((slot) => {
      const project = active[slot]; const weeks = project ? getResearchWeeks(project, weeklyGain) : null;
      return <button type="button" key={slot} aria-pressed={Boolean(project && project.id === selected?.id)} onClick={() => { const target = getResearchSlotTarget(research, slot); setQuery(target.query); setFilter(target.filter); choose(target.selectedId); }}><small>연구 슬롯 {slot + 1}</small><strong>{project?.name ?? '빈 슬롯 · 과제 찾기'}</strong><span>{project ? `${Math.round(project.progress / Math.max(1, project.duration) * 100)}% · ${weeks === null ? '진행량 없음' : `약 ${weeks}주 남음`}` : '선택만으로 연구를 시작하지 않습니다.'}</span></button>;
    })}</div>
    <div className="capability-split">
      <aside className="capability-browser" aria-label="연구 과제 탐색">
        <nav aria-label="연구 상태 필터">{([['available', '가능'], ['active', '진행'], ['future', '선행·시대'], ['complete', '완료']] as const).map(([id, label]) => <button type="button" aria-pressed={filter === id} key={id} onClick={() => setFilter(id)}>{label}</button>)}</nav>
        <label className="capability-search"><Search size={16} /><span className="sr-only">연구 과제 검색</span><input aria-label="연구 과제 검색" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름·분야로 찾기" /></label>
        <label className="capability-mobile-select" htmlFor={selectId}>연구 과제 선택<select id={selectId} value={selected?.id ?? ''} onChange={(event) => choose(event.target.value)}><option value="">{filtered.length ? `${filtered.length}개 과제에서 선택` : '이 조건의 과제 없음'}</option>{filtered.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <div className="capability-selection-list">{filtered.map((item) => <button type="button" key={item.id} aria-pressed={item.id === selectedId} onClick={() => choose(item.id)}><span><strong>{item.name}</strong><small>{item.branch} · {item.minimumYear ?? 1942}년</small></span>{item.complete ? <CheckCircle2 size={17} /> : item.active ? <FlaskConical size={17} /> : filter === 'future' ? <LockKeyhole size={17} /> : <BookOpen size={17} />}</button>)}</div>
        {!filtered.length ? <p className="capability-muted">조건에 맞는 과제가 없습니다. 검색어 또는 상태 필터를 바꿔보세요.</p> : null}
      </aside>
      <article className="capability-detail" aria-label="선택한 연구 상세">{selected ? <>
        <span className="capability-eyebrow">{selected.branch} · {selected.minimumYear ?? 1942}년</span><h3>{selected.name}</h3><p>{selected.description}</p>
        <div className="capability-meter" role="progressbar" aria-label={`${selected.name} 진행률`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.min(100, Math.round(selected.progress / Math.max(1, selected.duration) * 100))}><i style={{ width: `${Math.min(100, selected.progress / Math.max(1, selected.duration) * 100)}%` }} /></div>
        <dl className="capability-stat-grid"><div><dt>누적 진행</dt><dd>{selected.progress} / {selected.duration}</dd></div><div><dt>배정 시 주간 진행</dt><dd>{weeklyGain > 0 ? `+${weeklyGain}` : '진행 보류'}</dd></div><div><dt>{selected.active ? '완료까지 예상' : '지금 배정 시 예상'}</dt><dd>{selected.complete ? '완료' : getResearchWeeks(selected, weeklyGain) === null ? '전망 없음' : `약 ${getResearchWeeks(selected, weeklyGain)}주`}</dd></div></dl>
        <p className="capability-notice">{action.reason}</p><button type="button" className="capability-primary" disabled={!action.allowed} onClick={act}>{selected.active && !selected.complete ? <Pause size={17} /> : <Play size={17} />}{selected.complete ? '이미 적용된 연구' : selected.active ? '이 연구 일시 중지' : '이 연구 시작'}</button>
        <small className="capability-muted">남은 기간은 현재 연구 속도가 유지될 때의 전망입니다. 장비 개발국의 별도 개발 슬롯과 구분됩니다.</small>
        {selected.historicalBasis ? <details className="capability-fold"><summary>역사적 배경과 설계 근거</summary><p>{selected.historicalBasis}</p></details> : null}
      </> : <p>현재 검색·필터 결과에서 과제를 선택하세요. 목록 밖의 과제는 상세와 실행 버튼을 표시하지 않습니다.</p>}</article>
    </div>
    {liaison ? <details className="capability-fold"><summary>1942년 출발 연구 연락망</summary><p>{liaison.name} · {liaison.office}</p><p>{liaison.bonus}. 출발 시기의 활동 영역을 추상화한 배경 설정이며, 현시점의 실제 재직 참모나 추가 보상을 뜻하지 않습니다.</p></details> : null}
  </section>;
}
