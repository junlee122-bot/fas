import { useMemo, useState } from 'react';
import {
  Atom,
  AlertTriangle,
  BookOpen,
  Check,
  ChevronDown,
  CircleDot,
  Earth,
  Eye,
  ExternalLink,
  Filter,
  GitBranch,
  Landmark,
  Orbit,
  Search,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import type { GeneratedWorldline, WorldHistoryCategory, WorldHistoryEra, WorldMetric } from './worldHistory';
import { worldHistoryCategoryLabels, worldHistoryEraLabels, worldHistoryEvents, worldMetricLabels } from './worldHistory';
import type { EmergentHistoryProfile, HistoryForce } from './emergentHistory';
import { historyForceDescriptions, historyForceLabels } from './emergentHistory';
import { endingHorizonAxes, endingOrderAxes, endingSettlementAxes, filterHistoricalEndings, historicalEndings } from './historicalEndings';
import { getHistoricalExpert } from './historicalExperts';
import { getCuratedLaterEraDossier, getLaterEraFigure } from './laterEraFigures';

interface WorldHistoryAtlasProps {
  worldline: GeneratedWorldline;
  trajectory: EmergentHistoryProfile;
  onClose: () => void;
}

const metricOrder: WorldMetric[] = ['deterrence', 'multipolarity', 'decolonization', 'rights', 'prosperity', 'instability'];
const forceOrder: HistoryForce[] = ['military', 'industry', 'diplomacy', 'civic', 'liberation', 'intelligence'];
const featuredIds = new Set([
  'atomic-program',
  'war-termination',
  'world-organization',
  'monetary-order',
  'atomic-control',
  'chinese-revolution',
  'korean-war',
  'nonaligned-conference',
  'missile-crisis',
  'oil-shock',
  'space-cooperation',
  'bloc-transformation',
  'maastricht',
  'wto-order',
  'september-11',
  'global-financial-crisis',
  'arab-spring',
  'paris-agreement',
  'covid-pandemic',
  'ukraine-full-war',
  'wartime-secret-war',
  'cia-national-security-act',
  'stasi-security-ministry',
  'intelligence-oversight-crisis',
]);

const featuredIntelligenceIds = new Set([
  'soe',
  'oss',
  'nkvd',
  'rsha',
  'bcra',
  'juntong',
  'kempeitai',
  'kla-oss-eagle',
  'usaaffe-guerrilla-intel',
  'cia',
  'kgb',
  'bnd',
  'dgse',
]);

function CategoryIcon({ category }: { category: WorldHistoryCategory }) {
  if (category === 'nuclear') return <Atom size={16} />;
  if (category === 'space') return <Orbit size={16} />;
  if (category === 'world-order') return <Landmark size={16} />;
  if (category === 'decolonization') return <Earth size={16} />;
  if (category === 'society') return <ShieldCheck size={16} />;
  if (category === 'intelligence') return <Eye size={16} />;
  return <CircleDot size={16} />;
}

const intelligenceKindLabels = {
  foreign: '대외정보',
  domestic: '국내보안',
  signals: '신호정보',
  'special-operations': '특수공작',
  military: '군사정보',
  resistance: '레지스탕스',
  'political-police': '정치경찰·가해기관',
} as const;

const pressureStageLabels = {
  contained: '억제됨',
  emerging: '형성 중',
  advanced: '고착 위험',
  entrenched: '체제화',
} as const;

const outlookWarningLabels = {
  guarded: '제도적 방어선 유지',
  unstable: '암울한 체제 분기 진행',
  critical: '디스토피아 체제화 임박',
} as const;

export function WorldHistoryAtlas({ worldline, trajectory, onClose }: WorldHistoryAtlasProps) {
  const [category, setCategory] = useState<'all' | WorldHistoryCategory>('all');
  const [era, setEra] = useState<'all' | WorldHistoryEra>('all');
  const [showAll, setShowAll] = useState(false);
  const [showAllIntelligence, setShowAllIntelligence] = useState(false);
  const [openId, setOpenId] = useState('atomic-program');
  const [showEndingCatalog, setShowEndingCatalog] = useState(false);
  const [endingSearch, setEndingSearch] = useState('');
  const [endingOrder, setEndingOrder] = useState('all');
  const [endingSettlement, setEndingSettlement] = useState('all');
  const [endingHorizon, setEndingHorizon] = useState('all');
  const [endingCatalogLimit, setEndingCatalogLimit] = useState(24);
  const visibleTimeline = useMemo(() => worldline.timeline.filter((entry) => {
    if (category !== 'all' && entry.event.category !== category) return false;
    if (era !== 'all' && entry.event.era !== era) return false;
    return showAll || category !== 'all' || era !== 'all' || featuredIds.has(entry.event.id);
  }), [category, era, showAll, worldline.timeline]);
  const visibleIntelligenceHistory = useMemo(() => (
    showAllIntelligence
      ? worldline.intelligenceHistory
      : worldline.intelligenceHistory.filter((organization) => featuredIntelligenceIds.has(organization.id))
  ), [showAllIntelligence, worldline.intelligenceHistory]);
  const filteredEndings = useMemo(() => {
    return filterHistoricalEndings({ query: endingSearch, orderId: endingOrder, settlementId: endingSettlement, horizonId: endingHorizon })
      .sort((left, right) => Number(right.id === worldline.ending.id) - Number(left.id === worldline.ending.id) || left.title.localeCompare(right.title, 'ko-KR'));
  }, [endingHorizon, endingOrder, endingSearch, endingSettlement, worldline.ending.id]);
  const endingDifference = (ending: (typeof worldline.endingAlternatives)[number]) => {
    const differences = [
      ending.orderId !== worldline.ending.orderId ? '세계질서' : '',
      ending.settlementId !== worldline.ending.settlementId ? '경제·재건' : '',
      ending.horizonId !== worldline.ending.horizonId ? '과학·사회' : '',
    ].filter(Boolean);
    return differences.join(' · ') || '가중치 차이';
  };

  function resetEndingCatalog() {
    setEndingSearch('');
    setEndingOrder('all');
    setEndingSettlement('all');
    setEndingHorizon('all');
    setEndingCatalogLimit(24);
  }

  return (
    <div className="world-history-backdrop">
      <section className="world-history-atlas" role="dialog" aria-modal="true" aria-labelledby="world-history-title">
        <header className="world-history-header">
          <div className="world-history-kicker"><GitBranch size={15} /> LIVING HISTORY · CAUSAL ATLAS · {worldline.code}</div>
          <button className="world-history-close" aria-label="대체지구 아틀라스 닫기" onClick={onClose}><X size={20} /></button>
          <div className="world-history-title-row">
            <div>
              <span>현재 행동에서 이어지는 세계</span>
              <h1 id="world-history-title">{worldline.title}</h1>
              <p>{worldline.summary}</p>
            </div>
            <div className="world-history-count">
              <Sparkles size={18} />
              <span>가능한 결과 공간</span>
              <strong>{worldline.possibilityCount}</strong>
              <small>{worldline.possibilityFormula} · 재추첨이 아닌 행동 조건의 조합</small>
            </div>
          </div>
          <div className="world-history-actions">
            <button onClick={() => setShowAll((current) => !current)}><BookOpen size={15} /> {showAll ? '핵심 분기만 보기' : `${worldHistoryEvents.length}개 사건 전부 보기`}</button>
            <span className="world-history-live-note"><CircleDot size={13} /> 미래는 여기서 고르지 않습니다. 플레이 화면의 결정이 자동 반영됩니다.</span>
          </div>
        </header>

        <div className="world-history-scroll">
          <section className="history-trajectory" aria-labelledby="history-trajectory-title">
            <header>
              <div>
                <span className="atlas-label">PLAYER ACTION TRAJECTORY</span>
                <h2 id="history-trajectory-title">{trajectory.title}</h2>
                <p>{trajectory.summary}</p>
              </div>
              <strong>{trajectory.resolvedChoiceCount}<small>개 누적 결정</small></strong>
            </header>
            <div className="history-force-grid">
              {forceOrder.map((force) => (
                <article className={force === trajectory.dominantForce ? 'dominant' : ''} key={force} title={historyForceDescriptions[force]}>
                  <span>{historyForceLabels[force]}</span>
                  <strong>{trajectory.forces[force]}</strong>
                  <i><b style={{ width: `${trajectory.forces[force]}%` }} /></i>
                </article>
              ))}
            </div>
            <div className="history-cause-ledger">
              <div><span>최근 역사를 움직인 행동</span>{trajectory.influences.slice(0, 5).map((influence) => <p key={influence.id}><em>{influence.source}</em><strong>{influence.label}</strong><small>{influence.force === trajectory.dominantForce ? '주도 흐름 강화' : historyForceLabels[influence.force]}</small></p>)}</div>
              <div><span>다음 선택으로 바꿀 수 있는 방향</span>{trajectory.nextLevers.map((lever) => <p key={lever}><GitBranch size={12} />{lever}</p>)}</div>
            </div>
          </section>

          <section className="world-history-overview" aria-label="세계선 개요">
            <article className="world-history-rivalry">
              <span className="atlas-label">냉전의 주축 · {worldline.rivalryName}</span>
              <div className="rivalry-axis">
                <strong>{worldline.primaryBloc}</strong>
                <i>VS</i>
                <strong>{worldline.rivalBloc}</strong>
              </div>
              <p><b>독립 제3극</b> {worldline.thirdPole}</p>
              <ul>{worldline.faultLines.map((fault) => <li key={fault}>{fault}</li>)}</ul>
            </article>
            <article className="world-history-atomic">
              <span className="atlas-label"><Atom size={14} /> 이 세계의 맨해튼 계획</span>
              <h2>{worldline.atomicProject}</h2>
              <dl>
                <div><dt>주도 세력</dt><dd>{worldline.atomicSponsor}</dd></div>
                <div><dt>핵질서</dt><dd>{worldline.nuclearArchitecture}</dd></div>
                <div><dt>역사 이탈</dt><dd>{worldline.divergenceCount}/{worldline.timeline.length}개 기준선</dd></div>
              </dl>
            </article>
          </section>

          <section className="world-history-metrics" aria-label="세계 지표">
            {metricOrder.map((metric) => (
              <div className={metric === 'instability' ? 'danger' : ''} key={metric}>
                <span>{worldMetricLabels[metric]}</span>
                <strong>{worldline.metrics[metric]}</strong>
                <i><b style={{ width: `${worldline.metrics[metric]}%` }} /></i>
              </div>
            ))}
          </section>

          <section className={`world-history-dark-futures ${worldline.dystopianOutlook.warningLevel}`} aria-labelledby="world-history-dark-futures-title">
            <header className="world-history-section-heading">
              <div>
                <span className="atlas-label"><AlertTriangle size={14} /> PATH-DEPENDENT DARK FUTURES</span>
                <h2 id="world-history-dark-futures-title">선택이 만들 수 있는 암울한 세계들</h2>
                <p>{worldline.dystopianOutlook.explanation}</p>
              </div>
              <div className="dark-future-resilience">
                <span>{outlookWarningLabels[worldline.dystopianOutlook.warningLevel]}</span>
                <strong>{worldline.dystopianOutlook.resilience}<small>/100 제도 회복력</small></strong>
              </div>
            </header>
            <div className="dark-future-dominant">
              <ShieldAlert size={18} />
              <span><small>현재 가장 가까운 암울한 세계</small><strong>{worldline.dystopianOutlook.dominantWorldTitle}</strong></span>
              <p>아래 위험은 무작위 이벤트 확률이 아닙니다. 직접 선택 {worldline.dystopianOutlook.directChoiceCount}회는 더 큰 가중치로, 자동 분기는 누적된 국가 조건으로 반영됩니다.</p>
            </div>
            <div className="dark-future-grid">
              {worldline.dystopianOutlook.pressures.map((pressure) => (
                <article className={pressure.id === worldline.dystopianOutlook.dominantPressureId ? 'dominant' : ''} key={pressure.id}>
                  <header>
                    <span><small>{pressureStageLabels[pressure.stage]} · 직접 선택 {pressure.directChoiceCount}</small><strong>{pressure.title}</strong></span>
                    <em>{pressure.risk}</em>
                  </header>
                  <i aria-label={`${pressure.title} 위험 ${pressure.risk}%`}><b style={{ width: `${pressure.risk}%` }} /></i>
                  <p>{pressure.premise}</p>
                  <div><small>그 세계의 일상</small><span>{pressure.everydayLife}</span></div>
                  <ul>
                    {pressure.causes.slice(0, 3).map((cause) => <li key={cause}><GitBranch size={11} />{cause}</li>)}
                  </ul>
                  <footer><small>되돌리는 선택</small>{pressure.reversalLevers.map((lever) => <span key={lever}>{lever}</span>)}</footer>
                </article>
              ))}
            </div>
          </section>

          <section className="world-history-intelligence" aria-labelledby="world-history-intelligence-title">
            <header className="world-history-section-heading">
              <div>
                <span className="atlas-label"><Eye size={14} /> SHADOW INSTITUTIONS</span>
                <h2 id="world-history-intelligence-title">비밀조직의 창설·승계·해체</h2>
                <p>실제 기관 계보를 기준으로 하되, 위의 선택에 따라 등장 시점과 조직 형태가 달라집니다. 가해기관은 영입 대상이 아니라 감시·해체·사법처리 대상으로 분리됩니다.</p>
              </div>
              <strong className="world-history-intelligence-count">{worldline.intelligenceHistory.length}<small>개 조직</small></strong>
            </header>
            <div className="world-history-intelligence-grid">
              {visibleIntelligenceHistory.map((organization) => (
                <article className={organization.kind === 'political-police' ? 'danger' : ''} key={organization.id}>
                  <div className="world-history-intelligence-meta">
                    <span>{organization.appearanceYear}{organization.dissolvedYear ? `–${organization.dissolvedYear}` : '–'}</span>
                    <em>{intelligenceKindLabels[organization.kind]}</em>
                  </div>
                  <h3>{organization.displayName}</h3>
                  <small>{organization.abbreviation} · {organization.variantTitle}</small>
                  <p>{organization.historicalBasis}</p>
                  <dl>
                    <div><dt>세계선 효과</dt><dd>{organization.alternateEffect}</dd></div>
                    <div className="risk"><dt>윤리·정통성 위험</dt><dd>{organization.ethicalRisk}</dd></div>
                  </dl>
                  {organization.figures.length > 0 && (
                    <div className="world-history-intelligence-figures">
                      {organization.figures.slice(0, 4).map((figure) => <span key={figure.id}>{figure.name}</span>)}
                    </div>
                  )}
                  <a href={organization.sourceUrl} target="_blank" rel="noreferrer">{organization.sourceLabel}<ExternalLink size={11} /></a>
                </article>
              ))}
            </div>
            {worldline.intelligenceHistory.length > visibleIntelligenceHistory.length && !showAllIntelligence && (
              <button className="world-history-expand" onClick={() => setShowAllIntelligence((current) => !current)}>
                <Eye size={16} /> 나머지 {worldline.intelligenceHistory.length - visibleIntelligenceHistory.length}개 조직 펼치기
              </button>
            )}
            {showAllIntelligence && <button className="world-history-expand" onClick={() => setShowAllIntelligence(false)}><Eye size={16} /> 핵심 조직만 보기</button>}
          </section>

          <section className="world-history-ending" aria-labelledby="world-history-ending-title">
            <header className="world-history-ending-header">
              <div>
                <span className="atlas-label"><Sparkles size={14} /> FINAL OUTCOME MATRIX</span>
                <h2 id="world-history-ending-title">{worldline.ending.title}</h2>
                <p>{worldline.ending.summary}</p>
              </div>
              <div className="world-history-ending-count" aria-label={`${worldline.endingCount}개 결말 중 현재 결말`}>
                <strong>{worldline.endingCount}</strong>
                <span>개 사료 기반 결말</span>
                <small>현재 적합도 {worldline.ending.fitScore}</small>
                <code>{worldline.code}</code>
                <small>분기 {worldline.divergenceCount.toLocaleString('ko-KR')}회</small>
              </div>
            </header>

            <div className="world-history-ending-axes">
              <article><small>세계질서</small><strong>{worldline.ending.orderName}</strong><span>{worldline.ending.reasons[0]}</span></article>
              <article><small>경제·재건</small><strong>{worldline.ending.settlementName}</strong><span>{worldline.ending.reasons[1]}</span></article>
              <article><small>과학·사회 미래</small><strong>{worldline.ending.horizonName}</strong><span>{worldline.ending.reasons[2]}</span></article>
            </div>

            <div className="world-history-ending-consequences">
              <p><b>역사적 유산</b>{worldline.ending.legacy}</p>
              <p className="danger"><b>남은 균열</b>{worldline.ending.warning}</p>
            </div>

            <section className="world-history-causal-ledger" aria-labelledby="world-history-causal-title">
              <header>
                <span><GitBranch size={14} /><b id="world-history-causal-title">이 결말을 만든 결정 기록</b></span>
                <small>선택 → 즉시 변화 → 장기 축</small>
              </header>
              {worldline.ending.decisiveChoices.length > 0 ? (
                <div>
                  {worldline.ending.decisiveChoices.slice(0, 6).map((choice) => (
                    <article key={`${choice.year}-${choice.eventTitle}-${choice.choiceTitle}`}>
                      <time>{choice.year}</time>
                      <span><small>{choice.eventTitle}</small><strong>{choice.choiceTitle}</strong></span>
                      <p>{choice.consequence}</p>
                      <em>{choice.axisImpact}</em>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="world-history-causal-empty">아직 결말 축을 바꿀 만큼 큰 선택이 기록되지 않았습니다.</p>
              )}
            </section>

            <div className="world-history-ending-footer">
              <div className="world-history-ending-sources" aria-label="결말 설계의 역사 자료">
                {worldline.ending.anchors.map((anchor) => (
                  <a href={anchor.sourceUrl} target="_blank" rel="noreferrer" key={`${anchor.label}-${anchor.sourceUrl}`}>
                    {anchor.sourceLabel}<ExternalLink size={11} />
                  </a>
                ))}
              </div>
              <div className="world-history-ending-nearby">
                <span>선택 하나로 가까워지는 다른 결말</span>
                <div>{worldline.endingAlternatives.map((ending) => <em key={ending.id}><b>{endingDifference(ending)}</b>{ending.title}</em>)}</div>
              </div>
            </div>

            <button
              className="world-history-ending-catalog-toggle"
              aria-expanded={showEndingCatalog}
              aria-controls="world-history-ending-catalog"
              onClick={() => setShowEndingCatalog((current) => !current)}
            >
              <BookOpen size={15} /> {showEndingCatalog ? '결말 도감 접기' : `${historicalEndings.length.toLocaleString('ko-KR')}개 결말 도감 열기`}
              <ChevronDown size={16} />
            </button>

            {showEndingCatalog && (
              <div className="world-history-ending-catalog" id="world-history-ending-catalog">
                <div className="ending-catalog-intro">
                  <div>
                    <span className="atlas-label">OUTCOME CODEX</span>
                    <h3>가능한 전후 세계 비교</h3>
                    <p>{endingOrderAxes.length}개 세계질서 × {endingSettlementAxes.length}개 경제·재건 × {endingHorizonAxes.length}개 미래 경로를 조합해 현재 세계와 제도적 차이를 비교합니다.</p>
                  </div>
                  <strong aria-live="polite">{filteredEndings.length}<small> / {historicalEndings.length}</small></strong>
                </div>

                <div className="ending-catalog-filters">
                  <label className="ending-catalog-search"><Search size={14} /><span className="sr-only">결말 검색</span><input value={endingSearch} onChange={(event) => { setEndingSearch(event.target.value); setEndingCatalogLimit(24); }} placeholder="결말명·제도·핵심어 검색" /></label>
                  <label><span>세계질서</span><select value={endingOrder} onChange={(event) => { setEndingOrder(event.target.value); setEndingCatalogLimit(24); }}><option value="all">전체 {endingOrderAxes.length}종</option>{endingOrderAxes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}</select></label>
                  <label><span>경제·재건</span><select value={endingSettlement} onChange={(event) => { setEndingSettlement(event.target.value); setEndingCatalogLimit(24); }}><option value="all">전체 {endingSettlementAxes.length}종</option>{endingSettlementAxes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}</select></label>
                  <label><span>미래 경로</span><select value={endingHorizon} onChange={(event) => { setEndingHorizon(event.target.value); setEndingCatalogLimit(24); }}><option value="all">전체 {endingHorizonAxes.length}종</option>{endingHorizonAxes.map((axis) => <option key={axis.id} value={axis.id}>{axis.name}</option>)}</select></label>
                  {(endingSearch || endingOrder !== 'all' || endingSettlement !== 'all' || endingHorizon !== 'all') && <button onClick={resetEndingCatalog}>필터 초기화</button>}
                </div>

                {filteredEndings.length > 0 ? (
                  <div className="ending-catalog-grid">
                    {filteredEndings.slice(0, endingCatalogLimit).map((ending) => {
                      const isCurrent = ending.id === worldline.ending.id;
                      return (
                        <article className={isCurrent ? 'current' : ''} aria-current={isCurrent ? 'true' : undefined} key={ending.id}>
                          <div><span>{isCurrent ? <><Check size={12} /> 현재 결말</> : '대안 세계'}</span><small>{ending.id}</small></div>
                          <h4>{ending.title}</h4>
                          <ul><li>{ending.orderName}</li><li>{ending.settlementName}</li><li>{ending.horizonName}</li></ul>
                          <p>{ending.summary}</p>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="ending-catalog-empty"><Search size={20} /><strong>조건에 맞는 결말이 없습니다.</strong><button onClick={resetEndingCatalog}>전체 결말 보기</button></div>
                )}
                {filteredEndings.length > endingCatalogLimit && <button className="ending-catalog-more" onClick={() => setEndingCatalogLimit((current) => current + 24)}>다음 24개 결말 펼치기 · {filteredEndings.length - endingCatalogLimit}개 남음</button>}
              </div>
            )}
          </section>

          <section className="world-history-timeline-section">
            <div className="world-history-section-heading">
              <div>
                <span className="atlas-label">BUTTERFLY TIMELINE</span>
                <h2>사건 아틀라스와 인과 연쇄</h2>
                <p>각 기준선은 실제 사건에서 시작합니다. 확정 분기는 플레이 중 내린 결정이며, 미래 전망은 지금까지 누적한 정책·전황·외교·연구 조건으로 계산됩니다.</p>
              </div>
              <label className="world-history-filter"><Filter size={14} /><span>분야</span>
                <select value={category} onChange={(event) => setCategory(event.target.value as 'all' | WorldHistoryCategory)}>
                  <option value="all">전체 분야</option>
                  {(Object.entries(worldHistoryCategoryLabels) as [WorldHistoryCategory, string][]).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
                </select>
              </label>
              <label className="world-history-filter"><span>시대</span>
                <select value={era} onChange={(event) => setEra(event.target.value as 'all' | WorldHistoryEra)}>
                  <option value="all">전체 시대</option>
                  {(Object.entries(worldHistoryEraLabels) as [WorldHistoryEra, string][]).map(([id, label]) => <option value={id} key={id}>{label}</option>)}
                </select>
              </label>
            </div>
            <div className="world-history-timeline">
              {visibleTimeline.map((entry) => {
                const isOpen = openId === entry.event.id;
                return (
                  <article className={`world-event-card ${isOpen ? 'open' : ''} ${entry.isPlayerChoice ? 'chosen' : ''}`} key={entry.event.id}>
                    <button className="world-event-summary" aria-expanded={isOpen} onClick={() => setOpenId(isOpen ? '' : entry.event.id)}>
                      <span className="world-event-year">{entry.year}<small>기준 {entry.event.historicalYear}</small></span>
                      <i className={`world-event-icon ${entry.event.category}`}><CategoryIcon category={entry.event.category} /></i>
                      <span className="world-event-copy">
                        <small>{worldHistoryCategoryLabels[entry.event.category]} · {entry.actor}</small>
                        <strong>{entry.event.title}</strong>
                        <em>{entry.variant.title}</em>
                      </span>
                      <b className={`world-event-choice-badge ${entry.isPlayerChoice ? '' : 'forecast'}`}>{entry.isPlayerChoice ? <><Check size={12} /> 플레이에서 확정</> : <><GitBranch size={12} /> 현재 조건 전망</>}</b>
                      <ChevronDown className="world-event-chevron" size={18} />
                    </button>
                    {isOpen && (
                      <div className="world-event-detail">
                        <div className="world-event-basis">
                          <p>{entry.event.historicalBasis}</p>
                          <a href={entry.event.sourceUrl} target="_blank" rel="noreferrer">사료 기준선 · {entry.event.sourceLabel} <ExternalLink size={12} /></a>
                        </div>
                        {((entry.event.historicalActorIds?.length ?? 0) + (entry.event.historicalFigureQids?.length ?? 0) > 0) && (
                          <div className="world-event-people" aria-label="이 사건과 연결된 실존 인물">
                            <span>실제 행위자 · 사료 연결</span>
                            {(entry.event.historicalActorIds ?? []).map((actorId) => {
                              const expert = getHistoricalExpert(actorId);
                              return expert ? <b title={`${expert.office1942} · ${expert.appointmentTitle}`} key={actorId}>{expert.name}<small>{expert.nationality}</small></b> : null;
                            })}
                            {(entry.event.historicalFigureQids ?? []).map((qid) => {
                              const figure = getLaterEraFigure(qid);
                              const curated = getCuratedLaterEraDossier(qid);
                              return figure ? <b className="later-era" title={`${figure.birthYear}년생 · ${curated?.role ?? figure.occupation}`} key={qid}>{figure.name}<small>{curated?.role ?? figure.occupation}</small></b> : null;
                            })}
                          </div>
                        )}
                        <div className="world-event-causality">
                          <strong>{entry.isPlayerChoice ? '이 분기를 확정한 결정' : '현재 전망을 만든 조건'}</strong>
                          {entry.causalFactors.map((factor) => <p key={factor}><GitBranch size={12} />{factor}</p>)}
                        </div>
                        <div className="world-event-options" aria-label="현재 결과와 가능한 다른 경로">
                          {entry.event.variants.map((variant, index) => {
                            const selected = variant.id === entry.variant.id;
                            const metricEffects = (Object.entries(variant.metricDelta) as [WorldMetric, number][]).filter(([, delta]) => delta !== 0).slice(0, 3);
                            return (
                              <article className={selected ? 'selected' : ''} aria-current={selected ? 'true' : undefined} key={variant.id}>
                                <span>{selected ? entry.isPlayerChoice ? '확정된 결과' : '현재 가장 유력' : index === 0 ? '가능한 역사형 경로' : index === 1 ? '가능한 제도형 경로' : '가능한 급진형 경로'} {selected && <Check size={13} />}</span>
                                <strong>{variant.title}</strong>
                                <p>{variant.summary}</p>
                                <em>{variant.consequence}</em>
                                <div className="world-event-preview">
                                  <b><GitBranch size={11} /> {selected ? '누적 조건에 반영됨' : '플레이 선택에 따라 열릴 수 있음'}</b>
                                  <span>{metricEffects.length > 0 ? metricEffects.map(([metric, delta]) => `${worldMetricLabels[metric]} ${delta > 0 ? '+' : ''}${delta}`).join(' · ') : '직접 세계지표 변화 없음'}</span>
                                </div>
                              </article>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
            {!showAll && category === 'all' && era === 'all' && (
              <button className="world-history-expand" onClick={() => setShowAll(true)}><BookOpen size={16} /> 나머지 {worldHistoryEvents.length - visibleTimeline.length}개 역사 분기 펼치기</button>
            )}
          </section>
        </div>
      </section>
    </div>
  );
}
