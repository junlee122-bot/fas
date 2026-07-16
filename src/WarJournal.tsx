import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Check, Radio, Search, X } from 'lucide-react';
import { categorizeWarEvent, filterWarEvents } from './journal';
import type { JournalFilter } from './journal';
import type { WarEvent } from './types';

interface WarJournalProps {
  events: WarEvent[];
  onClose: () => void;
}

const filters: Array<{ id: JournalFilter; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'operations', label: '작전' },
  { id: 'domestic', label: '국내' },
  { id: 'diplomacy', label: '외교' },
];

function formatJournalDate(week: number) {
  const date = new Date(Date.UTC(1942, 9, 25 + week * 7));
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export function WarJournal({ events, onClose }: WarJournalProps) {
  const [activeFilter, setActiveFilter] = useState<JournalFilter>('all');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const visibleEvents = useMemo(() => filterWarEvents(events, activeFilter, query), [activeFilter, events, query]);
  const categoryCounts = useMemo(() => ({
    all: events.length,
    operations: events.filter((event) => categorizeWarEvent(event) === 'operations').length,
    domestic: events.filter((event) => categorizeWarEvent(event) === 'domestic').length,
    diplomacy: events.filter((event) => categorizeWarEvent(event) === 'diplomacy').length,
  }), [events]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <div className="journal-overlay" onClick={onClose}>
      <aside className="war-journal" role="dialog" aria-modal="true" aria-labelledby="war-journal-title" onClick={(event) => event.stopPropagation()}>
        <div className="journal-header">
          <div><span className="eyebrow">WAR DIARY</span><h2 id="war-journal-title">전쟁 일지</h2><small>{visibleEvents.length}/{events.length}건 표시</small></div>
          <button aria-label="전쟁 일지 닫기" onClick={onClose}><X size={18} /></button>
        </div>
        <label className="journal-search">
          <Search size={15} />
          <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="전문 제목과 내용 검색" aria-label="전쟁 일지 검색" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기"><X size={13} /></button>}
        </label>
        <div className="journal-filter" role="group" aria-label="전쟁 일지 분류">
          {filters.map((filter) => (
            <button key={filter.id} aria-pressed={activeFilter === filter.id} className={activeFilter === filter.id ? 'active' : ''} onClick={() => setActiveFilter(filter.id)}>
              {filter.label}<em>{categoryCounts[filter.id]}</em>
            </button>
          ))}
        </div>
        <div className="journal-list" aria-live="polite">
          {visibleEvents.length > 0 ? visibleEvents.map((event) => (
            <article className={event.tone} key={event.id}>
              <div className="journal-week">W{event.week + 1}</div>
              <i>{event.tone === 'good' ? <Check size={15} /> : event.tone === 'bad' ? <AlertTriangle size={15} /> : <Radio size={15} />}</i>
              <div><span>{formatJournalDate(event.week)}</span><h3>{event.title}</h3><p>{event.detail}</p></div>
            </article>
          )) : (
            <div className="journal-empty"><Search size={25} /><strong>조건에 맞는 전문이 없습니다.</strong><span>검색어를 바꾸거나 다른 분류를 선택하십시오.</span></div>
          )}
        </div>
      </aside>
    </div>
  );
}
