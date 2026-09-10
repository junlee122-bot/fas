import { useEffect, useRef } from 'react';
import { ArrowRight, CheckCircle2, Newspaper, X } from 'lucide-react';
import { getWarEventTrace } from './journal';
import { worldNewsCategoryMeta } from './worldWeeklyEngine';
import type { WorldWeeklyIssue } from './worldWeeklyEngine';
import type { WarEvent } from './types';
import type { UXAction } from './ux';
import './WeeklyBriefingDialog.css';

interface Props {
  week: number;
  date: string;
  events: WarEvent[];
  issue: WorldWeeklyIssue | null;
  actions: UXAction[];
  onAcknowledge: () => void;
  onClose: () => void;
  onJournal: () => void;
  onNewspaper: () => void;
  onActions: () => void;
}

export function WeeklyBriefingDialog({ week, date, events, issue, actions, onAcknowledge, onClose, onJournal, onNewspaper, onActions }: Props) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  const weeklyEvents = events.filter((event) => event.week === week);
  const orderedEvents = [...weeklyEvents].sort((a, b) => Number(b.tone === 'bad') - Number(a.tone === 'bad'));
  const articles = [...(issue?.articles ?? [])].sort((a, b) => b.priority - a.priority).slice(0, 3);
  const decisions = [...actions].sort((a, b) => Number(b.priority === 'urgent') - Number(a.priority === 'urgent'));
  const urgentCount = actions.filter((action) => action.priority === 'urgent').length;
  return <div className="weekly-review-overlay" onClick={onClose}>
    <section className="weekly-review-dialog" role="dialog" aria-modal="true" aria-labelledby="weekly-review-title" onClick={(event) => event.stopPropagation()}>
      <header className="weekly-review-header">
        <div><span>WEEK {week + 1} · {date}</span><h2 id="weekly-review-title" ref={titleRef} tabIndex={-1}>이번 주, 무엇이 달라졌나</h2><p>결과를 읽고 → 세계의 변화를 확인하고 → 다음 결정을 고르십시오.</p></div>
        <button type="button" onClick={onClose} aria-label="브리핑 닫기, 읽음 처리하지 않음"><X size={20} /></button>
      </header>
      <div className="weekly-review-body">
        <section className="weekly-review-results">
          <header><h3>01 · 내 선택의 결과 <small>{weeklyEvents.length}건</small></h3><button type="button" onClick={onJournal}>결과 전체</button></header>
          {orderedEvents.length === 0 ? <p className="weekly-review-empty">취임 첫 주입니다. 아직 이전 선택의 결산은 없습니다. 아래 창간호와 보직별 업무부터 확인하십시오.</p> : orderedEvents.slice(0, 4).map((event) => {
            const trace = getWarEventTrace(event);
            return <article key={event.id} className={`weekly-review-event ${event.tone}`}>
              <span>{event.tone === 'bad' ? '주의' : event.tone === 'good' ? '성과' : '변화'}</span><h4>{event.title}</h4><p>{event.detail}</p>
              <details><summary>왜 이런 결과가 나왔나</summary><dl><dt>선택</dt><dd>{trace.decision}</dd><dt>원인</dt><dd>{trace.trigger}</dd><dt>다음 확인</dt><dd>{trace.nextActions[0] ?? '다음 주 결산에서 추이를 확인하십시오.'}</dd></dl></details>
            </article>;
          })}
        </section>
        <section className="weekly-review-world">
          <header><h3>02 · 세계의 변화</h3><button type="button" onClick={onNewspaper}><Newspaper size={14} /> 주보 전체</button></header>
          <p className="weekly-review-edition">{issue ? `제 ${issue.edition}호 · ${issue.dateRange}` : '창간호 발행 준비 중'}</p>
          {articles.map((article) => <article key={article.id}><span>{worldNewsCategoryMeta[article.category].label} · {article.confidence === 'confirmed' ? '확인된 소식' : article.confidence === 'rumor' ? '미확인 첩보' : '분석 전망'}</span><h4>{article.headline}</h4><p>{article.summary}</p><details><summary>내게 미칠 영향</summary><p>{article.consequence}</p></details></article>)}
        </section>
        <section className="weekly-review-decisions">
          <header><h3>03 · 다음 결정 <small>{urgentCount > 0 ? `긴급 ${urgentCount}건` : '강제 결재 없음'}</small></h3><button type="button" onClick={onActions}>업무 선택 <ArrowRight size={14} /></button></header>
          {decisions.length === 0 ? <p>필수 조치가 없습니다. 원하는 계획을 준비하거나 다음 주로 진행할 수 있습니다.</p> : <ul>{decisions.slice(0, 3).map((action) => <li key={action.id}><strong>{action.title}</strong><span>{action.reason ?? action.detail}</span></li>)}</ul>}
        </section>
      </div>
      <footer className="weekly-review-footer"><p>닫기만 하면 미확인 상태를 유지합니다. 읽음 처리는 결재·명령을 대신하지 않습니다.</p><button type="button" className="weekly-review-confirm" onClick={onAcknowledge}><CheckCircle2 size={17} /> 확인 완료 · 이번 주 업무로</button></footer>
    </section>
  </div>;
}
