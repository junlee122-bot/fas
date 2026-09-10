import { useMemo, useState } from 'react';
import { Award, Check, ChevronRight, LockKeyhole, Pin, PinOff, Sparkles, Trophy, X } from 'lucide-react';
import { achievementCategoryLabels, achievementDefinitions, achievementRarityLabels, achievementSortLabels, getAchievement, getAchievementRecommendations, sortAchievementDefinitions } from './achievements';
import type { AchievementCategory, AchievementProgress, AchievementSortMode, AchievementUnlock } from './achievements';

interface AchievementGalleryProps {
  unlocks: AchievementUnlock[];
  progress: Record<string, AchievementProgress>;
  featuredId?: string | null;
  trackedId?: string | null;
  onTrack?: (id: string | null) => void;
  onAcknowledge?: () => void;
  onClose: () => void;
  onOpenGallery?: () => void;
}

export function AchievementGallery({ unlocks, progress, featuredId, trackedId, onTrack, onAcknowledge, onClose, onOpenGallery }: AchievementGalleryProps) {
  const [category, setCategory] = useState<'all' | AchievementCategory>('all');
  const [completionFilter, setCompletionFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  const [sortMode, setSortMode] = useState<AchievementSortMode>('recommended');
  const unlockedIds = useMemo(() => new Set(unlocks.map((unlock) => unlock.id)), [unlocks]);
  const featured = featuredId ? getAchievement(featuredId) : undefined;
  const featuredUnlock = featured ? unlocks.find((unlock) => unlock.id === featured.id) : undefined;
  const totalPoints = achievementDefinitions.reduce((sum, achievement) => sum + achievement.points, 0);
  const earnedPoints = achievementDefinitions.reduce((sum, achievement) => sum + (unlockedIds.has(achievement.id) ? achievement.points : 0), 0);
  const categories = Object.keys(achievementCategoryLabels) as AchievementCategory[];
  const recommendations = useMemo(() => getAchievementRecommendations(progress, unlockedIds), [progress, unlockedIds]);
  const recommendedAchievement = recommendations[0];
  const trackedAchievement = trackedId && !unlockedIds.has(trackedId) ? getAchievement(trackedId) : undefined;
  const focusAchievement = trackedAchievement ?? recommendedAchievement;
  const focusProgress = focusAchievement ? progress[focusAchievement.id] : undefined;
  const focusIsTracked = Boolean(focusAchievement && trackedAchievement?.id === focusAchievement.id);
  const orderedAchievements = useMemo(() => sortAchievementDefinitions(progress, unlockedIds, sortMode), [progress, sortMode, unlockedIds]);
  const visibleAchievements = useMemo(() => orderedAchievements.filter((achievement) => {
    if (category !== 'all' && achievement.category !== category) return false;
    if (completionFilter === 'unlocked' && !unlockedIds.has(achievement.id)) return false;
    if (completionFilter === 'locked' && unlockedIds.has(achievement.id)) return false;
    return true;
  }), [category, completionFilter, orderedAchievements, unlockedIds]);

  if (featured && featuredUnlock) {
    return (
      <div className="achievement-backdrop achievement-unlock-backdrop" role="dialog" aria-modal="true" aria-labelledby="achievement-unlocked-title">
        <article className={`achievement-unlock-card rarity-${featured.rarity}`}>
          <div className="achievement-unlock-art">
            <img src={featured.art} alt={`${featured.title} 도전과제 삽화`} />
            <div className="achievement-unlock-vignette" />
            <div className="achievement-unlock-ribbon"><Sparkles size={15} /> CHALLENGE COMPLETE</div>
          </div>
          <div className="achievement-unlock-copy">
            <span className="achievement-kicker">WEEK {featuredUnlock.unlockedWeek + 1} · {achievementCategoryLabels[featured.category]}</span>
            <h2 id="achievement-unlocked-title">{featured.title}</h2>
            <p className="achievement-subtitle">{featured.subtitle}</p>
            <p>{featured.description}</p>
            <div className="achievement-unlock-meta">
              <span className={`rarity rarity-${featured.rarity}`}><Award size={14} /> {achievementRarityLabels[featured.rarity]}</span>
              <strong>+{featured.points} 명예점수</strong>
            </div>
            <footer>
              <button className="achievement-secondary" onClick={() => { onAcknowledge?.(); onOpenGallery?.(); }}><Trophy size={16} /> 기록실 보기</button>
              <button className="achievement-primary" autoFocus onClick={onAcknowledge}><span>계속 지휘</span><ChevronRight size={16} /></button>
            </footer>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="achievement-backdrop" role="dialog" aria-modal="true" aria-labelledby="achievement-gallery-title">
      <section className="achievement-gallery">
        <header className="achievement-gallery-header">
          <div className="achievement-gallery-seal"><Trophy size={28} /></div>
          <div>
            <span>GENERAL STAFF ARCHIVES</span>
            <h2 id="achievement-gallery-title">도전과제 기록실</h2>
            <p>전쟁의 승패뿐 아니라 어떤 지휘관이 되었는지를 기록합니다.</p>
          </div>
          <div className="achievement-gallery-score">
            <strong>{unlocks.length}<small> / {achievementDefinitions.length}</small></strong>
            <span>{earnedPoints} / {totalPoints} 명예점수</span>
          </div>
          <button className="achievement-close" aria-label="도전과제 기록실 닫기" onClick={onClose}><X size={19} /></button>
        </header>

        <div className="achievement-overall-progress" aria-label={`도전과제 ${unlocks.length}개 완료`}>
          <span style={{ width: `${(unlocks.length / achievementDefinitions.length) * 100}%` }} />
        </div>

        {focusAchievement ? (
          <article className={`achievement-recommendation ${focusIsTracked ? 'tracked' : ''}`} aria-label={focusIsTracked ? '현재 추적 도전과제' : '다음 추천 도전과제'}>
            <div className="achievement-recommendation-icon">{focusIsTracked ? <Pin size={19} /> : <Sparkles size={20} />}</div>
            <div className="achievement-recommendation-copy">
              <span>{focusIsTracked ? 'TRACKED OBJECTIVE' : 'NEXT OBJECTIVE'} · {achievementCategoryLabels[focusAchievement.category]}</span>
              <strong>{focusAchievement.title}</strong>
              <p>{focusAchievement.condition}</p>
            </div>
            <div className="achievement-recommendation-progress">
              <div><span>{focusProgress?.detail ?? '진척도 확인 중'}</span><strong>{focusProgress?.percent ?? 0}%</strong></div>
              <div className="achievement-card-progress"><span style={{ width: `${focusProgress?.percent ?? 0}%` }} /></div>
            </div>
            <span className="achievement-recommendation-actions">
              {onTrack && <button type="button" className={focusIsTracked ? 'tracked' : ''} onClick={() => onTrack(focusIsTracked ? null : focusAchievement.id)}>{focusIsTracked ? <PinOff size={13} /> : <Pin size={13} />}{focusIsTracked ? '자동 추천' : '이 목표 추적'}</button>}
              <button type="button" onClick={() => { setCategory(focusAchievement.category); setCompletionFilter('locked'); setSortMode('recommended'); }}>같은 분야 <ChevronRight size={14} /></button>
            </span>
          </article>
        ) : (
          <div className="achievement-recommendation completed"><Trophy size={20} /><strong>모든 도전과제를 달성했습니다</strong><span>{earnedPoints} 명예점수의 완전한 지휘 기록입니다.</span></div>
        )}

        <div className="achievement-gallery-filters">
          <div className="achievement-status-filters" aria-label="달성 상태 필터">
            {([
              ['all', '전체'],
              ['unlocked', `달성 ${unlocks.length}`],
              ['locked', `미달성 ${achievementDefinitions.length - unlocks.length}`],
            ] as const).map(([id, label]) => <button key={id} className={completionFilter === id ? 'active' : ''} aria-pressed={completionFilter === id} onClick={() => setCompletionFilter(id)}>{label}</button>)}
          </div>
          <div className="achievement-category-filters" aria-label="도전과제 분야 필터">
            <button className={category === 'all' ? 'active' : ''} aria-pressed={category === 'all'} onClick={() => setCategory('all')}>모든 분야 <small>{achievementDefinitions.length}</small></button>
            {categories.map((id) => {
              const count = achievementDefinitions.filter((achievement) => achievement.category === id).length;
              const unlockedCount = achievementDefinitions.filter((achievement) => achievement.category === id && unlockedIds.has(achievement.id)).length;
              return <button key={id} className={category === id ? 'active' : ''} aria-pressed={category === id} onClick={() => setCategory(id)}>{achievementCategoryLabels[id]} <small>{unlockedCount}/{count}</small></button>;
            })}
          </div>
          <div className="achievement-filter-meta">
            <label className="achievement-sort-filter">
              <span>정렬</span>
              <select aria-label="도전과제 정렬" value={sortMode} onChange={(event) => setSortMode(event.target.value as AchievementSortMode)}>
                {(Object.keys(achievementSortLabels) as AchievementSortMode[]).map((id) => <option key={id} value={id}>{achievementSortLabels[id]}</option>)}
              </select>
            </label>
            <span className="achievement-filter-result">{visibleAchievements.length}개 표시</span>
          </div>
        </div>

        <div className="achievement-grid">
          {visibleAchievements.map((achievement) => {
            const unlocked = unlockedIds.has(achievement.id);
            const unlock = unlocks.find((entry) => entry.id === achievement.id);
            const state = progress[achievement.id] ?? { current: 0, target: 1, percent: 0, complete: false, detail: '진척도 확인 중' };
            return (
              <article key={achievement.id} className={`achievement-card rarity-${achievement.rarity} ${unlocked ? 'unlocked' : 'locked'}`}>
                <div className="achievement-card-art">
                  <img src={achievement.art} alt={unlocked ? `${achievement.title} 도전과제 삽화` : ''} aria-hidden={!unlocked} />
                  {!unlocked && <div className="achievement-lock"><LockKeyhole size={22} /><span>{state.percent}%</span></div>}
                  {unlocked && <div className="achievement-check"><Check size={16} /></div>}
                  <span className="achievement-category">{achievementCategoryLabels[achievement.category]}</span>
                </div>
                <div className="achievement-card-body">
                  <div className="achievement-title-row">
                    <div><h3>{achievement.title}</h3><span>{achievement.subtitle}</span></div>
                    <strong>{achievement.points}</strong>
                  </div>
                  <p>{achievement.condition}</p>
                  <div className="achievement-card-progress" aria-label={`${achievement.title} 진척도 ${state.percent}%`}><span style={{ width: `${state.percent}%` }} /></div>
                  <footer>
                    <small>{unlocked ? `제 ${Number(unlock?.unlockedWeek ?? 0) + 1}주 달성` : state.detail}</small>
                    <span className="achievement-card-actions">
                      {!unlocked && onTrack && <button type="button" className={trackedId === achievement.id ? 'tracked' : ''} aria-pressed={trackedId === achievement.id} onClick={() => onTrack(trackedId === achievement.id ? null : achievement.id)}>{trackedId === achievement.id ? <PinOff size={11} /> : <Pin size={11} />}{trackedId === achievement.id ? '추적 해제' : '추적'}</button>}
                      <em className={`rarity rarity-${achievement.rarity}`}>{achievementRarityLabels[achievement.rarity]}</em>
                    </span>
                  </footer>
                </div>
              </article>
            );
          })}
          {visibleAchievements.length === 0 && <div className="achievement-filter-empty"><LockKeyhole size={24} /><strong>조건에 맞는 도전과제가 없습니다</strong><span>분야나 달성 상태 필터를 바꾸십시오.</span></div>}
        </div>
      </section>
    </div>
  );
}
