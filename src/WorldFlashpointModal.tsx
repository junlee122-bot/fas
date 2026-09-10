import { AlertTriangle, Anchor, ChevronRight, ExternalLink, Globe2 } from 'lucide-react';
import { deriveWorldFlashpointEffects } from './worldFlashpoints';
import type { WorldFlashpointSelection } from './worldFlashpoints';
import { worldHistoryCategoryLabels, worldHistoryEraLabels, worldMetricLabels } from './worldHistory';
import type { WorldMetric } from './worldHistory';

interface WorldFlashpointModalProps {
  selection: WorldFlashpointSelection;
  campaignPhase: 'war' | 'nation';
  onChoose: (variantId: string) => void;
}

export function WorldFlashpointModal({ selection, campaignPhase, onChoose }: WorldFlashpointModalProps) {
  const { entry, campaignYear, historicalHorizon, accelerated } = selection;
  const event = entry.event;
  return (
    <div className="world-flashpoint-backdrop" role="dialog" aria-modal="true" aria-labelledby="world-flashpoint-title">
      <section className="world-flashpoint-modal">
        <header>
          <span className="world-flashpoint-seal"><Globe2 size={27} /></span>
          <div>
            <span>GLOBAL FLASHPOINT · {worldHistoryCategoryLabels[event.category]}</span>
            <h2 id="world-flashpoint-title">{event.title}</h2>
            <small>{worldHistoryEraLabels[event.era]}{event.scenarioType === 'historical-pattern' ? ' · 역사 패턴 기반 가능세계' : ''} · 현재 행위자 {entry.actor}</small>
          </div>
          <em><AlertTriangle size={14} /> 시간 정지 · 결정 필요</em>
        </header>

        <div className="world-flashpoint-context">
          <div>
            <span>왜 지금 발생했는가</span>
            <strong>{campaignYear}년 세계선 · 사료 기준 {event.historicalYear}년</strong>
            <p>{accelerated
              ? `앞선 ${selection.resolvedCount}개 세계 위기에서 제도·무기·동맹 발전이 가속되어 역사적 전개 범위가 ${historicalHorizon}년까지 열렸습니다.`
              : `${campaignYear}년 달력과 역사적 조건이 이 위기의 기준 시점에 도달했습니다.`}</p>
          </div>
          <div className={campaignPhase === 'war' ? 'overlapping-war' : ''}>
            <span>현재 캠페인 상태</span>
            <strong>{campaignPhase === 'war' ? '세계대전과 장기경쟁이 겹쳐 진행 중' : '국가 운영과 국제 위기가 동시 진행 중'}</strong>
            <p>{campaignPhase === 'war' ? '전쟁이 종결되지 않았어도 일부 지역은 이미 냉전·탈식민·자원전쟁의 논리로 움직입니다.' : '국내 예산과 국제 대응을 함께 감당해야 합니다.'}</p>
          </div>
        </div>

        <div className="world-flashpoint-basis">
          <Anchor size={18} />
          <span><small>{event.scenarioType === 'historical-pattern' ? '역사적 패턴과 제도적 기준선' : '역사적 기준점'}</small><strong>{event.historicalBasis}</strong></span>
          <a href={event.sourceUrl} target="_blank" rel="noreferrer">{event.sourceLabel}<ExternalLink size={12} /></a>
        </div>

        <div className="world-flashpoint-choices">
          {event.variants.map((variant, index) => {
            const effects = deriveWorldFlashpointEffects(event.id, event.category, variant);
            const metrics = Object.entries(variant.metricDelta) as [WorldMetric, number][];
            return (
              <button type="button" className={effects.tone} key={variant.id} onClick={() => onChoose(variant.id)}>
                <i>{String(index + 1).padStart(2, '0')}</i>
                <span className="world-flashpoint-choice-copy">
                  <em>{index === 0 ? '역사 기준 대응' : index === 1 ? '제도적 대안' : '급진적 세계선'}</em>
                  <strong>{variant.title}</strong>
                  <p>{variant.summary}</p>
                  <small>{variant.consequence}</small>
                  <span className="world-flashpoint-effects">
                    {effects.summary.map((effect) => <b key={effect}>{effect}</b>)}
                  </span>
                  <span className="world-flashpoint-metrics">
                    {metrics.map(([metric, value]) => <b className={value >= 0 ? 'positive' : 'negative'} key={metric}>{worldMetricLabels[metric]} {value > 0 ? '+' : ''}{value}</b>)}
                  </span>
                </span>
                <ChevronRight size={19} />
              </button>
            );
          })}
        </div>
        <footer>선택은 즉시 국가 자원과 외교에 반영되고, 이후 세계 사건의 행위자·연도·결말 가중치를 영구적으로 바꿉니다.</footer>
      </section>
    </div>
  );
}
