import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  CircleDollarSign,
  Gauge,
  Landmark,
  Scale,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { CampaignPhase } from './nationManagement';
import type { NationalSimulationSnapshot, SimulationStatus } from './nationalSimulation';
import type { GameTab } from './types';

type SimulationLayer = 'population' | 'power' | 'market' | 'institutions';

interface NationalSimulationOverviewProps {
  snapshot: NationalSimulationSnapshot;
  phase: CampaignPhase;
  onNavigate: (tab: GameTab) => void;
}

const statusLabels: Record<SimulationStatus, string> = {
  stable: '안정',
  watch: '관찰',
  strained: '압박',
  critical: '위기',
};

const statusClass = (value: number, warning: number, critical: number, reversed = false) => {
  if (reversed) return value >= critical ? 'critical' : value >= warning ? 'warning' : 'stable';
  return value <= critical ? 'critical' : value <= warning ? 'warning' : 'stable';
};

function Meter({ value, tone = 'neutral' }: { value: number; tone?: 'neutral' | 'good' | 'bad' }) {
  return <span className={`simulation-meter ${tone}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

export function NationalSimulationOverview({ snapshot, phase, onNavigate }: NationalSimulationOverviewProps) {
  const [layer, setLayer] = useState<SimulationLayer>('population');
  const capacityRatio = Math.round((snapshot.administrativeCapacityUsed / Math.max(1, snapshot.administrativeCapacity)) * 100);
  const criticalGoods = snapshot.goods.filter((good) => good.status === 'critical' || good.status === 'strained').length;
  const oppositionClout = snapshot.powerBlocs.filter((bloc) => bloc.status === 'opposition').reduce((sum, bloc) => sum + bloc.clout, 0);
  const weakInstitutions = snapshot.institutions.filter((institution) => institution.status !== 'stable').length;

  const layers: Array<{ id: SimulationLayer; icon: typeof Users; label: string; summary: string }> = [
    { id: 'population', icon: Users, label: '인구집단', summary: `생활수준 ${snapshot.standardOfLiving.toFixed(1)} · 6개 집단` },
    { id: 'power', icon: Scale, label: '권력집단', summary: `반대파 영향력 ${Math.round(oppositionClout)}%` },
    { id: 'market', icon: CircleDollarSign, label: '국가 시장', summary: `공급 압박 ${criticalGoods}개 품목` },
    { id: 'institutions', icon: Landmark, label: '법과 제도', summary: `확대·집행 필요 ${weakInstitutions}개` },
  ];

  return (
    <section className="national-simulation" aria-labelledby="national-simulation-title">
      <header className="simulation-header">
        <div>
          <span className="eyebrow">NATIONAL SIMULATION · {phase === 'war' ? '전시 국가' : '전후 국가'}</span>
          <h2 id="national-simulation-title">국가가 움직이는 이유</h2>
          <p>인구의 필요가 시장과 정치에 압력을 만들고, 법과 행정역량이 실제 결과의 크기를 결정합니다.</p>
        </div>
        <div className="simulation-causal-key" aria-label="국가 시뮬레이션 인과 순서">
          <span>인구</span><ArrowRight /><span>시장·정치</span><ArrowRight /><span>법·제도</span><ArrowRight /><strong>주간 결과</strong>
        </div>
      </header>

      <div className="simulation-kpis">
        <article className={statusClass(snapshot.standardOfLiving, 10, 7)}>
          <Users /><span><small>평균 생활수준</small><strong>{snapshot.standardOfLiving.toFixed(1)}<em>/20</em></strong></span>
          <Meter value={snapshot.standardOfLiving * 5} />
        </article>
        <article className={statusClass(snapshot.marketAccess, 60, 40)}>
          <CircleDollarSign /><span><small>시장 접근성</small><strong>{snapshot.marketAccess}<em>%</em></strong></span>
          <Meter value={snapshot.marketAccess} />
        </article>
        <article className={statusClass(capacityRatio, 90, 110, true)}>
          <Gauge /><span><small>행정역량 사용</small><strong>{snapshot.administrativeCapacityUsed}<em> / {snapshot.administrativeCapacity}</em></strong></span>
          <Meter value={Math.min(100, capacityRatio)} tone={capacityRatio > 100 ? 'bad' : 'neutral'} />
        </article>
        <article className={statusClass(snapshot.socialCohesion, 60, 40)}>
          <Scale /><span><small>사회 결속</small><strong>{snapshot.socialCohesion}<em>%</em></strong></span>
          <Meter value={snapshot.socialCohesion} />
        </article>
      </div>

      <div className="simulation-layer-tabs" role="tablist" aria-label="국가 구조 계층">
        {layers.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} id={`simulation-tab-${item.id}`} role="tab" aria-controls="simulation-layer-panel" aria-selected={layer === item.id} className={layer === item.id ? 'active' : ''} onClick={() => setLayer(item.id)}>
              <Icon /><span><strong>{item.label}</strong><small>{item.summary}</small></span>
            </button>
          );
        })}
      </div>

      <div id="simulation-layer-panel" className="simulation-layer-content" role="tabpanel" aria-labelledby={`simulation-tab-${layer}`}>
        {layer === 'population' && (
          <div className="simulation-population-list">
            {snapshot.populationGroups.map((group) => (
              <article key={group.id} className={group.radicalism >= 60 ? 'critical' : group.trend === 'declining' ? 'warning' : ''}>
                <div className="simulation-row-heading">
                  <span><strong>{group.name}</strong><small>{group.contribution}</small></span>
                  <b>{group.share.toFixed(1)}%</b>
                </div>
                <div className="simulation-population-stats">
                  <span><small>생활수준</small><b>{group.standardOfLiving.toFixed(1)}</b></span>
                  <span><small>승인</small><b>{group.approval > 0 ? '+' : ''}{group.approval}</b></span>
                  <span><small>급진화</small><b>{group.radicalism}</b></span>
                  <span className={`trend ${group.trend}`}>{group.trend === 'improving' ? <TrendingUp /> : group.trend === 'declining' ? <TrendingDown /> : <span>—</span>}{group.trend === 'improving' ? '개선' : group.trend === 'declining' ? '악화' : '유지'}</span>
                </div>
                <p><b>지금 필요한 것</b>{group.primaryNeed}</p>
              </article>
            ))}
          </div>
        )}

        {layer === 'power' && (
          <div className="simulation-power-list">
            {snapshot.powerBlocs.map((bloc) => (
              <button key={bloc.id} className={bloc.status} onClick={() => onNavigate(bloc.destination)}>
                <span className="simulation-power-clout"><strong>{bloc.clout.toFixed(1)}%</strong><Meter value={bloc.clout * 2.5} tone={bloc.status === 'opposition' ? 'bad' : 'neutral'} /></span>
                <span><small>{bloc.status === 'government' ? '정부 연합' : bloc.status === 'cooperative' ? '협력 가능' : '조직된 반대파'}</small><strong>{bloc.name}</strong><p>{bloc.agenda}</p></span>
                <span className="simulation-approval"><small>승인</small><b>{bloc.approval > 0 ? '+' : ''}{bloc.approval}</b><ArrowRight /></span>
              </button>
            ))}
          </div>
        )}

        {layer === 'market' && (
          <div className="simulation-market-grid">
            {snapshot.goods.map((good) => (
              <button key={good.id} className={good.status} onClick={() => onNavigate(good.destination)}>
                <span className="simulation-market-title"><Building2 /><strong>{good.name}</strong><em>{statusLabels[good.status]}</em></span>
                <span className="simulation-market-numbers"><span><small>가격지수</small><strong>{good.priceIndex.toFixed(0)}</strong></span><span><small>공급</small><strong>{good.availability.toFixed(0)}%</strong></span><span><small>주간 수지</small><strong>{good.weeklyBalance > 0 ? '+' : ''}{good.weeklyBalance.toFixed(1)}</strong></span></span>
                <Meter value={good.availability} tone={good.status === 'critical' || good.status === 'strained' ? 'bad' : 'neutral'} />
                <small>{good.driver}</small>
              </button>
            ))}
          </div>
        )}

        {layer === 'institutions' && (
          <div className="simulation-institution-list">
            {snapshot.institutions.map((institution) => (
              <button key={institution.id} className={institution.status} onClick={() => onNavigate(institution.destination)}>
                <span className="simulation-institution-level" aria-label={`제도 단계 ${institution.level}/5`}>{[1, 2, 3, 4, 5].map((level) => <i key={level} className={level <= institution.level ? 'filled' : ''} />)}</span>
                <span><small>{institution.legalBasis}</small><strong>{institution.name}</strong><p>{institution.effect}</p></span>
                <span className="simulation-institution-coverage"><small>적용 범위</small><strong>{institution.coverage}%</strong><em>행정력 {institution.capacityCost}</em></span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="simulation-pressures">
        <div className="simulation-pressures-heading"><ShieldAlert /><span><small>STRUCTURAL PRESSURES</small><strong>이번 주 구조적 압력</strong></span></div>
        <div>
          {snapshot.pressures.map((pressure, index) => (
            <article key={pressure.id} className={pressure.severity}>
              <span className="simulation-pressure-index">0{index + 1}</span>
              <span><small>{pressure.severity === 'critical' ? '즉시 개입' : pressure.severity === 'high' ? '우선 검토' : '중기 관찰'}</small><strong>{pressure.title}</strong><p>{pressure.cause}</p><em>{pressure.consequence}</em></span>
              <button onClick={() => onNavigate(pressure.destination)}>{pressure.actionLabel}<ArrowRight /></button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
