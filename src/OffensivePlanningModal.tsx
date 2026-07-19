import { useEffect, useRef } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, Package, Shield, Swords, Target, X } from 'lucide-react';
import type { BattleForecast } from './combat';
import type { BattleStance, Commander, Division, Territory } from './types';

interface OffensivePlanningModalProps {
  division: Division;
  commander: Commander;
  origin: Territory;
  target: Territory;
  stance: BattleStance;
  forecasts: Record<BattleStance, BattleForecast>;
  commandPoints: number;
  intelNetwork: number;
  onStanceChange: (stance: BattleStance) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const stanceOptions: Array<{ id: BattleStance; title: string; summary: string }> = [
  { id: 'cautious', title: '신중한 공세', summary: '정찰과 보존 우선' },
  { id: 'balanced', title: '균형 공세', summary: '화력과 손실 균형' },
  { id: 'aggressive', title: '총공세', summary: '돌파 확률과 손실 증가' },
];

const confidenceLabels = { low: '낮음', medium: '보통', high: '높음' };
const riskLabels = { low: '통제 가능', moderate: '주의', high: '고위험', critical: '극심한 위험' };

export function OffensivePlanningModal({
  division,
  commander,
  origin,
  target,
  stance,
  forecasts,
  commandPoints,
  intelNetwork,
  onStanceChange,
  onConfirm,
  onCancel,
}: OffensivePlanningModalProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const forecast = forecasts[stance];
  const attackerShare = Math.max(8, Math.min(92, forecast.attackerPower / (forecast.attackerPower + forecast.defenderPower) * 100));

  useEffect(() => {
    cancelButtonRef.current?.focus();
  }, []);

  return (
    <div className="modal-backdrop offensive-planning-backdrop">
      <section className="offensive-planning-modal" role="dialog" aria-modal="true" aria-labelledby="offensive-planning-title" aria-describedby="offensive-planning-note">
        <header>
          <div className="offensive-planning-mark"><Target size={25} /></div>
          <div>
            <span>OFFENSIVE PLANNING ROOM · 제 {origin.region} 작전</span>
            <h2 id="offensive-planning-title">{target.name} 공세 승인 검토</h2>
            <small>{division.name} · {commander.rank} {commander.name}</small>
          </div>
          <button ref={cancelButtonRef} onClick={onCancel} aria-label="작전 계획실 닫고 목표 다시 선택"><X size={17} /></button>
        </header>

        <div className="offensive-route-strip">
          <div><span>출발선</span><strong>{origin.name}</strong><small>보급 {division.supply}% · 조직력 {division.organization}%</small></div>
          <ArrowRight size={22} />
          <div><span>공세 목표</span><strong>{target.name}</strong><small>{target.terrain} · 전략 가치 {target.value}</small></div>
          <div className={'forecast-risk ' + forecast.risk}><Shield size={15} /><span>작전 위험<strong>{riskLabels[forecast.risk]}</strong></span></div>
        </div>

        <div className="offensive-planning-body">
          <section className="stance-planning-column" aria-labelledby="stance-planning-title">
            <div className="planning-section-heading">
              <span>1 · ENGAGEMENT POSTURE</span>
              <h3 id="stance-planning-title">교전 태세 선택</h3>
              <small>태세별 승산과 예상 비용을 비교하십시오.</small>
            </div>
            <div className="planning-stance-options">
              {stanceOptions.map((option) => {
                const optionForecast = forecasts[option.id];
                return (
                  <button key={option.id} className={stance === option.id ? 'selected' : ''} aria-pressed={stance === option.id} onClick={() => onStanceChange(option.id)}>
                    <i>{option.id === 'cautious' ? <Shield size={17} /> : option.id === 'aggressive' ? <Swords size={17} /> : <Target size={17} />}</i>
                    <span><strong>{option.title}</strong><small>{option.summary}</small></span>
                    <em><strong>{optionForecast.successChance}%</strong><small>전력 -{optionForecast.strengthLoss[0]}~{optionForecast.strengthLoss[1]} · 보급 -{optionForecast.supplySpent}</small></em>
                  </button>
                );
              })}
            </div>

            <div className="planning-intelligence-note">
              <Eye size={17} />
              <span><strong>정보 신뢰도 {confidenceLabels[forecast.confidence]}</strong><small>정보망 {Math.round(intelNetwork)}% · 예상 승산 범위 {forecast.successRange[0]}~{forecast.successRange[1]}%</small></span>
            </div>
          </section>

          <section className="forecast-detail-column" aria-labelledby="forecast-detail-title" aria-live="polite">
            <div className="planning-section-heading">
              <span>2 · COMMAND ESTIMATE</span>
              <h3 id="forecast-detail-title">전투 참모부 예측</h3>
              <small>81개 전투 조건 조합을 동일 전투 엔진으로 분석했습니다.</small>
            </div>

            <div className="forecast-hero">
              <div className={'forecast-chance ' + forecast.risk}>
                <span>목표 확보 추정</span>
                <strong>{forecast.successChance}<small>%</small></strong>
                <em>{forecast.successRange[0]}~{forecast.successRange[1]}% 범위</em>
              </div>
              <div className="forecast-force-comparison">
                <div><span>아군 작전력</span><strong>{forecast.attackerPower}</strong></div>
                <div className="forecast-power-bar"><i style={{ width: `${attackerShare}%` }} /></div>
                <div><span>적 방어력</span><strong>{forecast.defenderPower}</strong></div>
                <small>기대 우세 {forecast.expectedMargin >= 0 ? '+' : ''}{forecast.expectedMargin}</small>
              </div>
            </div>

            <div className="forecast-cost-grid">
              <div><Swords size={17} /><span>전력 손실<strong>-{forecast.strengthLoss[0]} ~ -{forecast.strengthLoss[1]}</strong></span></div>
              <div><Shield size={17} /><span>조직력 손실<strong>-{forecast.organizationLoss[0]} ~ -{forecast.organizationLoss[1]}</strong></span></div>
              <div><Package size={17} /><span>보급 소모<strong>-{forecast.supplySpent}</strong></span></div>
            </div>

            <dl className="forecast-factors">
              <div><dt>부대 준비도</dt><dd>전력 {division.strength} · 조직 {division.organization} · 보급 {division.supply}</dd></div>
              <div><dt>지휘관 역량</dt><dd>공격 {commander.attack} · 지휘 {commander.command} · 군수 {commander.logistics}</dd></div>
              <div><dt>목표 방어 조건</dt><dd>{target.terrain} 지형 · 전략 가치 {target.value} · 적 압력 반영</dd></div>
            </dl>
          </section>
        </div>

        <footer>
          <p id="offensive-planning-note"><AlertTriangle size={15} /><span>예측은 현재 정보와 준비도를 기준으로 합니다. 승인한 명령은 지도 이동이나 다른 지역 선택으로 취소되지 않으며, 다음 주 결산까지 전황 지도의 ‘승인된 공세’에서 추적됩니다.</span></p>
          <div>
            <button className="planning-cancel" onClick={onCancel}>목표 다시 선택</button>
            <button className="planning-confirm" onClick={onConfirm} disabled={commandPoints < 5}><CheckCircle2 size={16} /> 이 계획 승인 <span>지휘 점수 5</span></button>
          </div>
        </footer>
      </section>
    </div>
  );
}
