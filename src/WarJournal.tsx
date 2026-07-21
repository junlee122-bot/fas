import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, ChevronDown, CircleDot, Minus, Radio, Search, TrendingDown, TrendingUp, X } from 'lucide-react';
import { categorizeWarEvent, filterWarEvents, getWarEventTrace, summarizeJournalComparisons, summarizeJournalProgress } from './journal';
import type { JournalFilter } from './journal';
import type { WarEvent } from './types';

interface WarJournalProps {
  events: WarEvent[];
  onClose: () => void;
}

const filters: Array<{ id: JournalFilter; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'operations', label: '작전' },
  { id: 'management', label: '국정·조직' },
  { id: 'diplomacy', label: '외교' },
  { id: 'history', label: '대체역사' },
];

const domainLabels = { operations: '작전', management: '국정·조직', diplomacy: '외교', history: '대체역사' } as const;
const certaintyLabels = { confirmed: '확정 결과', developing: '진행 중', forecast: '전망' } as const;
const comparisonLabels = { matched: '예상 일치', better: '예상 상회', worse: '예상 하회', variance: '확률 변동' } as const;

function formatJournalDate(week: number) {
  const date = new Date(Date.UTC(1942, 9, 25 + week * 7));
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(date);
}

export function WarJournal({ events, onClose }: WarJournalProps) {
  const [activeFilter, setActiveFilter] = useState<JournalFilter>('all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<number | null>(events[0]?.id ?? null);
  const searchRef = useRef<HTMLInputElement>(null);
  const visibleEvents = useMemo(() => filterWarEvents(events, activeFilter, query), [activeFilter, events, query]);
  const categoryCounts = useMemo(() => ({
    all: events.length,
    operations: events.filter((event) => categorizeWarEvent(event) === 'operations').length,
    management: events.filter((event) => categorizeWarEvent(event) === 'management').length,
    diplomacy: events.filter((event) => categorizeWarEvent(event) === 'diplomacy').length,
    history: events.filter((event) => categorizeWarEvent(event) === 'history').length,
  }), [events]);
  const latestWeek = events.reduce((latest, event) => Math.max(latest, event.week), 0);
  const latestEvents = events.filter((event) => event.week === latestWeek);
  const latestGood = latestEvents.filter((event) => event.tone === 'good').length;
  const latestBad = latestEvents.filter((event) => event.tone === 'bad').length;
  const progressSummary = useMemo(() => summarizeJournalProgress(events), [events]);
  const comparisonSummary = useMemo(() => summarizeJournalComparisons(events, latestWeek), [events, latestWeek]);
  const trendLabel = progressSummary.trend === 'improving' ? '전주보다 개선' : progressSummary.trend === 'worsening' ? '전주보다 악화' : progressSummary.trend === 'stable' ? '전주와 동일' : '비교 기준 생성';
  const TrendIcon = progressSummary.trend === 'improving' ? TrendingUp : progressSummary.trend === 'worsening' ? TrendingDown : Minus;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    searchRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return (
    <div className="journal-overlay" onClick={onClose}>
      <aside className="war-journal" role="dialog" aria-modal="true" aria-labelledby="war-journal-title" onClick={(event) => event.stopPropagation()}>
        <div className="journal-header">
          <div><span className="eyebrow">AFTER ACTION & DECISION REVIEW</span><h2 id="war-journal-title">진행 결과 분석실</h2><small>{visibleEvents.length}/{events.length}건 · 선택→계산→결과 추적</small></div>
          <button aria-label="진행 결과 분석실 닫기" onClick={onClose}><X size={18} /></button>
        </div>
        <section className="journal-week-brief" aria-label="최근 주간 결과 요약">
          <div><span>최근 결산</span><strong>제 {latestWeek + 1}주</strong><small>{formatJournalDate(latestWeek)}</small></div>
          <div className="positive"><span>유리한 결과</span><strong>{latestGood}</strong><small>확정 전문</small></div>
          <div className="negative"><span>불리한 결과</span><strong>{latestBad}</strong><small>대응 필요</small></div>
          <div><span>전체 변화</span><strong>{latestEvents.length}</strong><small>같은 주에 해결</small></div>
        </section>
        {comparisonSummary.total > 0 && (
          <section className="journal-comparison-brief" aria-label="최근 결산 예상 정확도">
            <header><span><CircleDot size={14} /><strong>예상 대비 확정</strong></span><em>{comparisonSummary.matched}/{comparisonSummary.total}건 일치</em></header>
            <div>
              <span className="matched"><small>예상 일치</small><strong>{comparisonSummary.matched}</strong></span>
              <span className="better"><small>예상 상회</small><strong>{comparisonSummary.better}</strong></span>
              <span className="worse"><small>예상 하회</small><strong>{comparisonSummary.worse}</strong></span>
              <span className="variance"><small>확률 변동</small><strong>{comparisonSummary.variance}</strong></span>
            </div>
            <p>현황판에서 본 사전 결산과 실제 주간 결과를 비교합니다. 전투·발병·국제사건은 별도 확률 판정으로 설명됩니다.</p>
          </section>
        )}
        <section className={`journal-progress-review ${progressSummary.trend}`} aria-label="최근 6주 지휘 성과 추세">
          <div className="journal-progress-heading">
            <span><TrendIcon size={15} /><strong>{trendLabel}</strong><small>순성과 = 유리 {latestGood} − 불리 {latestBad} = {progressSummary.balance >= 0 ? '+' : ''}{progressSummary.balance}</small></span>
            <em>{progressSummary.balanceDelta === null ? '첫 비교 주간' : `전주 대비 ${progressSummary.balanceDelta >= 0 ? '+' : ''}${progressSummary.balanceDelta}`}</em>
          </div>
          <div className="journal-momentum" role="img" aria-label="최근 6주의 유리한 결과와 불리한 결과 막대 비교">
            {progressSummary.momentum.map((point) => (
              <div key={point.week} title={`제 ${point.week + 1}주: 유리 ${point.good}, 불리 ${point.bad}, 순성과 ${point.balance}`}>
                <span><i className="good" style={{ height: `${Math.min(34, Math.max(point.good ? 4 : 0, point.good * 7))}px` }} /><i className="bad" style={{ height: `${Math.min(34, Math.max(point.bad ? 4 : 0, point.bad * 7))}px` }} /></span>
                <small>W{point.week + 1}</small>
              </div>
            ))}
          </div>
          <div className="journal-priority-review">
            <span><small>집중 분야</small><strong>{progressSummary.dominantDomain ? domainLabels[progressSummary.dominantDomain] : '결과 대기'}</strong></span>
            <span><small>진행·전망</small><strong>{progressSummary.developingCount}건</strong></span>
            <div><small>이번 주 우선 대응</small>{progressSummary.priorities.length ? <ol>{progressSummary.priorities.map((priority) => <li key={priority}>{priority}</li>)}</ol> : <strong>즉시 교정이 필요한 결과가 없습니다.</strong>}</div>
          </div>
        </section>
        <label className="journal-search">
          <Search size={15} />
          <input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="결정, 원인, 수치, 후속 조치 검색" aria-label="진행 결과 검색" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기"><X size={13} /></button>}
        </label>
        <div className="journal-filter" role="group" aria-label="진행 결과 분류">
          {filters.map((filter) => (
            <button key={filter.id} aria-pressed={activeFilter === filter.id} className={activeFilter === filter.id ? 'active' : ''} onClick={() => setActiveFilter(filter.id)}>
              {filter.label}<em>{categoryCounts[filter.id]}</em>
            </button>
          ))}
        </div>
        <div className="journal-list" aria-live="polite">
          {visibleEvents.length > 0 ? visibleEvents.map((event) => {
            const trace = getWarEventTrace(event);
            const isOpen = openId === event.id;
            const comparisons = trace.comparisons ?? [];
            return (
            <article className={`${event.tone} ${isOpen ? 'open' : ''}`} key={event.id}>
              <button className="journal-event-summary" aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? null : event.id)}>
                <div className="journal-week">W{event.week + 1}</div>
                <i>{event.tone === 'good' ? <Check size={15} /> : event.tone === 'bad' ? <AlertTriangle size={15} /> : <Radio size={15} />}</i>
                <div><span>{formatJournalDate(event.week)} · {domainLabels[trace.domain]} · {certaintyLabels[trace.certainty]}</span><h3>{event.title}</h3><p>{event.detail}</p></div>
                <ChevronDown size={16} />
              </button>
              {isOpen && (
                <div className="journal-causality">
                  <div className="journal-cause-chain" aria-label="결정과 결과의 연결">
                    <section><span>01 · 진행·선택</span><strong>{trace.decision}</strong></section><ArrowRight size={16} />
                    <section><span>02 · 해결 조건</span><strong>{trace.trigger}</strong></section><ArrowRight size={16} />
                    <section><span>03 · 확정 결과</span><strong>{trace.effects[0]?.value ?? event.detail}</strong></section>
                  </div>
                  {comparisons.length > 0 && (
                    <section className="journal-comparison-review" aria-label="예상과 확정 결과 비교">
                      <header><span><CircleDot size={13} /><strong>예상 대비 확정</strong></span><em>{comparisons.filter((comparison) => comparison.status === 'matched').length}/{comparisons.length}건 일치</em></header>
                      <div>
                        {comparisons.map((comparison) => (
                          <article className={comparison.status} key={comparison.label}>
                            <header><strong>{comparison.label}</strong><span>{comparisonLabels[comparison.status]}</span></header>
                            <div><span><small>예상</small><b>{comparison.expected}</b></span><ArrowRight size={13} /><span><small>확정</small><b>{comparison.actual}</b></span></div>
                            <p>{comparison.explanation}</p>
                          </article>
                        ))}
                      </div>
                    </section>
                  )}
                  <div className="journal-analysis-grid">
                    <section>
                      <h4><CircleDot size={13} /> 왜 이 결과가 나왔나</h4>
                      <ul>{trace.factors.map((factor) => <li key={factor}>{factor}</li>)}</ul>
                    </section>
                    <section>
                      <h4><Check size={13} /> 즉시 바뀐 값</h4>
                      <div className="journal-effect-list">{trace.effects.map((entry) => <span className={entry.tone} key={`${entry.label}-${entry.value}`}><small>{entry.label}</small><strong>{entry.value}</strong></span>)}</div>
                    </section>
                    <section>
                      <h4><Radio size={13} /> 다음 주까지 남는 영향</h4>
                      <ul>{trace.ongoing.map((item) => <li key={item}>{item}</li>)}</ul>
                    </section>
                    <section className="journal-next-action">
                      <h4><AlertTriangle size={13} /> 권장 후속 조치</h4>
                      <ol>{trace.nextActions.map((item) => <li key={item}>{item}</li>)}</ol>
                    </section>
                  </div>
                </div>
              )}
            </article>
          );}) : (
            <div className="journal-empty"><Search size={25} /><strong>조건에 맞는 전문이 없습니다.</strong><span>검색어를 바꾸거나 다른 분류를 선택하십시오.</span></div>
          )}
        </div>
      </aside>
    </div>
  );
}
