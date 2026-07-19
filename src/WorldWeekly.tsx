import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Crosshair,
  Newspaper,
  Radio,
  ShieldQuestion,
  Sparkles,
  X,
} from 'lucide-react';
import type { GameTab } from './types';
import { worldNewsCategoryMeta } from './worldWeeklyEngine';
import type { WorldNewsArticle, WorldNewsCategory, WorldNewsConfidence, WorldWeeklyIssue } from './worldWeeklyEngine';

interface WorldWeeklyProps {
  issues: WorldWeeklyIssue[];
  onNavigate: (tab: GameTab) => void;
  onClose: () => void;
}

const confidenceMeta: Record<WorldNewsConfidence, { label: string; description: string }> = {
  confirmed: { label: '확인됨', description: '자국 보고·장부·전투 결과로 교차 확인된 정보' },
  assessed: { label: '분석됨', description: '복수 첩보와 현재 지표를 종합한 정보평가' },
  rumor: { label: '미확인', description: '정보망이 부족하거나 전망 성격이 강한 보고' },
};

const categoryIcons: Record<WorldNewsCategory, React.ReactNode> = {
  front: <Crosshair size={15} />,
  diplomacy: <Radio size={15} />,
  economy: <CircleDollarSign size={15} />,
  society: <Activity size={15} />,
  science: <Sparkles size={15} />,
  intelligence: <ShieldQuestion size={15} />,
};

function Signal({ article, compact = false }: { article: WorldNewsArticle; compact?: boolean }) {
  return (
    <div className={`weekly-signals ${compact ? 'compact' : ''}`}>
      {article.signals.map((signal) => (
        <span key={`${signal.label}-${signal.value}`} className={signal.tone}>
          <small>{signal.label}</small><strong>{signal.value}</strong>
        </span>
      ))}
    </div>
  );
}

function ArticleCard({ article, onNavigate }: { article: WorldNewsArticle; onNavigate: (tab: GameTab) => void }) {
  const category = worldNewsCategoryMeta[article.category];
  const confidence = confidenceMeta[article.confidence];
  return (
    <article className={`world-weekly-article ${article.tone}`}>
      <div className="weekly-article-kicker">
        <span>{categoryIcons[article.category]} {category.desk}</span>
        <em>{article.region}</em>
      </div>
      <h3>{article.headline}</h3>
      <p className="weekly-article-summary">{article.summary}</p>
      <Signal article={article} compact />
      <div className="weekly-causality">
        <div><small>왜 일어났나</small><p>{article.cause}</p></div>
        <ArrowRight size={16} aria-hidden="true" />
        <div><small>다음 주 영향</small><p>{article.consequence}</p></div>
      </div>
      <footer>
        <span className={`weekly-confidence ${article.confidence}`} title={confidence.description}>
          {article.confidence === 'confirmed' ? <CheckCircle2 size={13} /> : <ShieldQuestion size={13} />}
          {confidence.label}
        </span>
        <button onClick={() => onNavigate(article.actionTab)}>{article.actionLabel}<ChevronRight size={14} /></button>
      </footer>
    </article>
  );
}

export function WorldWeekly({ issues, onNavigate, onClose }: WorldWeeklyProps) {
  const [selectedIssueId, setSelectedIssueId] = useState(issues[0]?.id ?? '');
  const [category, setCategory] = useState<WorldNewsCategory | 'all'>('all');

  useEffect(() => {
    if (!issues.some((issue) => issue.id === selectedIssueId)) setSelectedIssueId(issues[0]?.id ?? '');
  }, [issues, selectedIssueId]);

  const issue = issues.find((candidate) => candidate.id === selectedIssueId) ?? issues[0];
  const lead = issue?.articles.find((article) => article.id === issue.leadArticleId) ?? issue?.articles[0];
  const visibleArticles = useMemo(() => issue?.articles.filter((article) => (
    article.id !== lead?.id && (category === 'all' || article.category === category)
  )) ?? [], [category, issue, lead?.id]);

  if (!issue || !lead) return null;

  const navigate = (tab: GameTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="world-weekly-backdrop" role="dialog" aria-modal="true" aria-labelledby="world-weekly-title">
      <div className="world-weekly-shell">
        <aside className="world-weekly-archive" aria-label="세계 주보 지난 호">
          <div className="weekly-archive-brand"><Newspaper size={22} /><span><strong>THE WORLD WIRE</strong><small>세계 주보 보관소</small></span></div>
          <div className="weekly-archive-list">
            {issues.map((candidate) => (
              <button key={candidate.id} className={candidate.id === issue.id ? 'active' : ''} onClick={() => { setSelectedIssueId(candidate.id); setCategory('all'); }}>
                <span>제 {candidate.edition}호</span>
                <strong>{candidate.articles.find((article) => article.id === candidate.leadArticleId)?.headline ?? '세계 주간 결산'}</strong>
                <small>{candidate.dateRange}</small>
              </button>
            ))}
          </div>
          <div className="weekly-archive-note"><BookOpen size={15} /><p>각 호는 해당 주의 실제 게임 상태에서 발행됩니다. 이후 세계선이 바뀌어도 과거 기사는 당시 기록으로 남습니다.</p></div>
        </aside>

        <main className="world-weekly-paper">
          <header className="world-weekly-header">
            <div className="weekly-dateline"><span>{issue.worldlineCode} · ALTERNATE HISTORY NEWS SERVICE</span><em>{issue.dateRange}</em></div>
            <div className="weekly-masthead">
              <div><Newspaper size={26} /></div>
              <span><small>THE</small><h1 id="world-weekly-title">WORLD WIRE</h1><strong>세계 주보</strong></span>
              <button onClick={onClose} aria-label="세계 주보 닫기"><X size={20} /></button>
            </div>
            <div className="weekly-edition-line"><span>제 {issue.edition}호 · 지난 7일의 세계</span><strong>{issue.worldlineTitle}</strong><em>전황·외교·경제·사회·과학·정보</em></div>
          </header>

          <section className="weekly-metrics" aria-label="이번 주 세계 핵심 수치">
            <div><Crosshair size={16} /><span><small>활성 전선</small><strong>{issue.metrics.activeFronts}</strong></span></div>
            <div><BarChart3 size={16} /><span><small>전투 / 영토변경</small><strong>{issue.metrics.battleCount} / {issue.metrics.territoryChanges}</strong></span></div>
            <div className={issue.metrics.treasuryChange < 0 ? 'negative' : 'positive'}><CircleDollarSign size={16} /><span><small>주간 재정</small><strong>{issue.metrics.treasuryChange >= 0 ? '+' : ''}{issue.metrics.treasuryChange.toFixed(1)}M</strong></span></div>
            <div><Radio size={16} /><span><small>외교 평균</small><strong>{issue.metrics.relationAverage}</strong></span></div>
            <div className={issue.metrics.healthRisk >= 1 ? 'negative' : ''}><Activity size={16} /><span><small>보건 위험</small><strong>{issue.metrics.healthRisk >= 100 ? '비상' : `${issue.metrics.healthRisk.toFixed(2)}%`}</strong></span></div>
            <div><ShieldQuestion size={16} /><span><small>정보망</small><strong>{Math.round(issue.metrics.intelligence)}</strong></span></div>
          </section>

          <section className={`weekly-lead ${lead.tone}`}>
            <div className="weekly-lead-copy">
              <div className="weekly-article-kicker"><span>{categoryIcons[lead.category]} {worldNewsCategoryMeta[lead.category].desk} · 1면</span><em>{lead.region}</em></div>
              <h2>{lead.headline}</h2>
              <p>{lead.summary}</p>
              <Signal article={lead} />
            </div>
            <div className="weekly-lead-analysis">
              <span>EDITOR'S ANALYSIS</span>
              <div><small>원인</small><p>{lead.cause}</p></div>
              <div><small>예상되는 영향</small><p>{lead.consequence}</p></div>
              <footer>
                <span className={`weekly-confidence ${lead.confidence}`} title={confidenceMeta[lead.confidence].description}>
                  {lead.confidence === 'confirmed' ? <CheckCircle2 size={13} /> : <ShieldQuestion size={13} />}
                  {confidenceMeta[lead.confidence].label}
                </span>
                <button onClick={() => navigate(lead.actionTab)}>{lead.actionLabel}<ChevronRight size={14} /></button>
              </footer>
            </div>
          </section>

          <nav className="weekly-desk-filters" aria-label="세계 주보 편집국 필터">
            <button className={category === 'all' ? 'active' : ''} onClick={() => setCategory('all')}>전체 기사 <em>{issue.articles.length}</em></button>
            {(Object.keys(worldNewsCategoryMeta) as WorldNewsCategory[]).map((id) => (
              <button key={id} className={category === id ? 'active' : ''} onClick={() => setCategory(id)}>{categoryIcons[id]} {worldNewsCategoryMeta[id].label}</button>
            ))}
          </nav>

          <section className="weekly-article-grid">
            {visibleArticles.map((article) => <ArticleCard key={article.id} article={article} onNavigate={navigate} />)}
            {visibleArticles.length === 0 && category !== 'all' && lead.category === category && (
              <div className="weekly-filter-empty"><Newspaper size={24} /><strong>이 편집국의 핵심 기사는 1면에 실렸습니다.</strong><button onClick={() => setCategory('all')}>전체 기사 보기</button></div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
