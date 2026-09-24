import { CheckCircle2, ChevronRight, Scale, TrendingDown, TrendingUp } from 'lucide-react';
import {
  comparePublicHealthPolicies,
  getPublicHealthPolicy,
  recommendPublicHealthPolicy,
} from './publicHealth';
import type { PublicHealthContext, PublicHealthPolicyId, PublicHealthState } from './publicHealth';
import type { GameState } from './types';

interface PublicHealthForecastProps {
  state: PublicHealthState;
  game: GameState;
  context: PublicHealthContext;
  onPolicyChange: (policyId: PublicHealthPolicyId) => void;
}

const formatNumber = (value: number) => new Intl.NumberFormat('ko-KR').format(Math.round(value));

export function PublicHealthForecast({ state, game, context, onPolicyChange }: PublicHealthForecastProps) {
  const outbreak = state.activeOutbreak;
  if (!outbreak) return null;

  const forecasts = comparePublicHealthPolicies(state, context);
  const recommendation = recommendPublicHealthPolicy(state, game);
  const recommendedPolicy = getPublicHealthPolicy(recommendation.policyId);

  return (
    <section className="health-card health-forecast-command" aria-labelledby="health-forecast-title">
      <div className="health-section-heading">
        <div><span className="eyebrow">NEXT WEEK DECISION SUPPORT</span><h3 id="health-forecast-title">대응 태세별 다음 주 전망</h3></div>
        <span className="health-code"><Scale size={14} /> 같은 역학 조건 비교</span>
      </div>
      <div className="health-recommendation">
        <span><CheckCircle2 size={18} /><strong>참모 권고 · {recommendedPolicy.name}</strong></span>
        <p>{recommendation.reason}</p>
        <button disabled={state.policyId === recommendation.policyId} onClick={() => onPolicyChange(recommendation.policyId)}>
          {state.policyId === recommendation.policyId ? '현재 선택됨' : '권고 태세 채택'}<ChevronRight size={14} />
        </button>
      </div>
      <div className="health-forecast-grid">
        {forecasts.map((forecast) => {
          const policy = getPublicHealthPolicy(forecast.policyId);
          const selected = state.policyId === forecast.policyId;
          const recommended = recommendation.policyId === forecast.policyId;
          const casesTrend = forecast.weeklyCases <= outbreak.weeklyCases;
          return (
            <button key={forecast.policyId} className={`${selected ? 'selected' : ''} ${recommended ? 'recommended' : ''}`} aria-pressed={selected} onClick={() => onPolicyChange(forecast.policyId)}>
              <span><strong>{policy.name}</strong>{recommended && <em>권고</em>}</span>
              <div className={forecast.rEffective > 1 ? 'danger' : 'safe'}><small>예상 R</small><strong>{forecast.rEffective.toFixed(2)}</strong></div>
              <div><small>주간 사례</small><strong>{formatNumber(forecast.weeklyCases)}</strong>{casesTrend ? <TrendingDown size={13} /> : <TrendingUp size={13} />}</div>
              <div><small>주간 사망</small><strong>{formatNumber(forecast.weeklyDeaths)}</strong></div>
              <div className={forecast.hospitalLoad >= 100 ? 'danger' : ''}><small>병상 부하</small><strong>{Math.round(forecast.hospitalLoad)}%</strong></div>
              <span className="health-forecast-cost">국고 {forecast.treasuryCost}{forecast.politicalPowerCost ? ` · 정치 ${forecast.politicalPowerCost}` : ''}</span>
            </button>
          );
        })}
      </div>
      <small className="health-forecast-disclaimer">현재 정보와 동일한 결정론적 난수 조건을 사용한 1주 전망입니다. 장기 결과는 이후 변이·전선·보급·정책 변화에 따라 달라집니다.</small>
    </section>
  );
}
