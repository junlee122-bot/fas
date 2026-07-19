import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Factory,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Landmark,
  Minus,
  Plus,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { EconomyState } from './economy';
import { NationalSimulationOverview } from './NationalSimulationOverview';
import type { NationalSimulationSnapshot } from './nationalSimulation';
import {
  nationBudgetDefinitions,
  nationStrategies,
  type CampaignPhase,
  type NationBudgetDomain,
  type NationManagementState,
  type NationStrategyId,
  type NationTransitionReason,
} from './nationManagement';
import type { GameState, GameTab, NationProfile } from './types';

interface TransitionReadiness {
  score: number;
  eligible: boolean;
  pillars: {
    security: number;
    legitimacy: number;
    finance: number;
    industry: number;
    diplomacy: number;
  };
}

interface NationManagementPanelProps {
  phase: CampaignPhase;
  state: NationManagementState;
  game: GameState;
  economy: EconomyState;
  nation: NationProfile;
  nationalSimulation: NationalSimulationSnapshot;
  worldlineTitle: string;
  readiness: TransitionReadiness;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onTransition: (reason: NationTransitionReason) => void;
  onBudgetChange: (domain: NationBudgetDomain, delta: -5 | 5) => void;
  onTaxChange: (delta: -5 | 5) => void;
  onSpendingChange: (delta: -5 | 5) => void;
  onStrategyChange: (strategyId: NationStrategyId) => void;
  onNavigate: (tab: GameTab) => void;
  onNextWeek: () => void;
}

const budgetIcons: Record<NationBudgetDomain, typeof Building2> = {
  reconstruction: Building2,
  welfare: HeartHandshake,
  education: GraduationCap,
  industry: Factory,
  diplomacy: Handshake,
  security: ShieldCheck,
};

function MetricBar({ value, danger = false }: { value: number; danger?: boolean }) {
  return <span className={`nation-metric-bar ${danger ? 'danger' : ''}`}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span>;
}

function SignedValue({ value, suffix = '' }: { value: number; suffix?: string }) {
  const positive = value >= 0;
  return <span className={positive ? 'positive' : 'negative'}>{positive ? '+' : ''}{value.toFixed(1)}{suffix}</span>;
}

export function NationManagementPanel({
  phase,
  state,
  game,
  economy,
  nation,
  nationalSimulation,
  worldlineTitle,
  readiness,
  formatMoney,
  onTransition,
  onBudgetChange,
  onTaxChange,
  onSpendingChange,
  onStrategyChange,
  onNavigate,
  onNextWeek,
}: NationManagementPanelProps) {
  const latestReport = state.reports[0] ?? null;
  const localizeMoney = (text: string) => text.replace(/([+−-]?)£([\d.]+)M/g, (_match, sign: string, amount: string) => formatMoney(Number(amount) * (sign === '−' || sign === '-' ? -1 : 1), { signed: sign === '+' }));
  const electionWeeks = Math.max(0, state.nextElectionWeek - game.week);
  const currentStrategy = nationStrategies.find((strategy) => strategy.id === state.strategyId) ?? nationStrategies[0];

  if (phase === 'war') {
    const pillarRows = [
      { label: '전쟁 종결력', value: readiness.pillars.security, detail: '승점과 전선 주도권' },
      { label: '국내 정통성', value: readiness.pillars.legitimacy, detail: '안정도와 정부 신뢰' },
      { label: '재정 여력', value: readiness.pillars.finance, detail: '전후 예산을 버틸 국고' },
      { label: '산업 전환력', value: readiness.pillars.industry, detail: '군수 공장을 민수로 돌릴 기반' },
      { label: '외교 출구', value: readiness.pillars.diplomacy, detail: '강화 회담과 무역망의 신뢰' },
    ];
    return (
      <div className="nation-management nation-transition-planner">
        <section className="nation-transition-hero">
          <div>
            <span className="eyebrow">WAR TO STATE · 연속 캠페인</span>
            <h2>전쟁을 끝내도, 이 세계선은 끝나지 않습니다</h2>
            <p>전쟁에서 만든 국경·부채·물가·공장·연구·인물·외교 관계를 그대로 이어받아 {nation.shortName}의 전후 국가를 운영합니다. 완전 승전과 협상 종전은 서로 다른 출발 조건을 만듭니다.</p>
          </div>
          <div className={`transition-readiness-seal ${readiness.eligible ? 'ready' : ''}`}>
            <span>국가 전환 준비도</span>
            <strong>{readiness.score}</strong>
            <em>{readiness.eligible ? '협상 종전 가능' : '국가 기반 보강 필요'}</em>
          </div>
        </section>

        <div className="nation-transition-grid">
          <section className="nation-surface transition-pillars">
            <header><div><span>전환 조건</span><h3>전쟁에서 국가로</h3></div><small>45점 이상 · 안정도 35 이상</small></header>
            <div className="transition-pillar-list">
              {pillarRows.map((pillar) => (
                <div key={pillar.label} className="transition-pillar">
                  <div><strong>{pillar.label}</strong><small>{pillar.detail}</small></div>
                  <MetricBar value={pillar.value} danger={pillar.value < 40} />
                  <b>{pillar.value}</b>
                </div>
              ))}
            </div>
            <button
              className="nation-primary-action"
              disabled={!readiness.eligible}
              onClick={() => onTransition('negotiated')}
            >
              <Handshake size={18} /> 협상 종전 후 국가 운영 시작 <ArrowRight size={17} />
            </button>
            {!readiness.eligible && <p className="transition-lock-note">전선을 안정시키거나 국고·산업·외교 관계를 보강하면 협상 종전이 열립니다. 완전 승리 시에는 준비도와 관계없이 전환할 수 있습니다.</p>}
          </section>

          <section className="nation-surface inherited-state">
            <header><div><span>계승되는 세계</span><h3>지금의 선택이 전후 초기 조건</h3></div><Landmark size={20} /></header>
            <div className="inheritance-cards">
              <article><CircleDollarSign /><span>국고와 부채</span><strong>{formatMoney(game.treasury)} · 부채 {formatMoney(economy.debt)}</strong><small>무리한 전비 조달은 전후 세금과 복지를 압박합니다.</small></article>
              <article><TrendingUp /><span>물가와 신뢰</span><strong>{economy.inflation.toFixed(1)}% · 신뢰 {Math.round(economy.publicConfidence)}</strong><small>배급·채권·투자 결정이 생활비와 정부 위임으로 이어집니다.</small></article>
              <article><Factory /><span>생산 기반</span><strong>{game.factories}개 공장</strong><small>군수 생산력은 주택·철도·소비재 산업으로 전환할 수 있습니다.</small></article>
              <article><Users /><span>사람과 제도</span><strong>내각·지휘관·전문가 유지</strong><small>전쟁 중 영입하고 성장시킨 인물이 전후 부처와 기관을 이끕니다.</small></article>
            </div>
          </section>
        </div>

        <section className="nation-surface transition-routes">
          <header><div><span>두 개의 종전 경로</span><h3>같은 나라, 다른 출발선</h3></div><small>{worldlineTitle}</small></header>
          <div>
            <article className="preferred"><CheckCircle2 /><h4>완전 승전 체제</h4><p>승전국의 외교 영향력과 국민적 위임을 얻지만, 넓어진 점령지·동원 해제·전쟁 부채를 동시에 관리해야 합니다.</p><b>전쟁 승리 화면에서 선택</b></article>
            <article><Scale /><h4>협상 종전 체제</h4><p>더 일찍 민생 회복을 시작하고 인명·산업 손실을 줄이지만, 미완의 전선과 강경파 반발이 초기 정통성을 압박합니다.</p><b>{readiness.eligible ? '현재 선택 가능' : `준비도 ${Math.max(0, 45 - readiness.score)}점 추가 필요`}</b></article>
          </div>
        </section>
      </div>
    );
  }

  const objectiveRows = [
    { label: '국가 성과 60 달성', current: state.nationalScore, target: 60 },
    { label: '국민 위임 50 이상 유지', current: state.mandateScore, target: 50 },
    { label: '사회 불안 35 이하', current: 100 - state.unrest, target: 65 },
    { label: '민수 산업 65 달성', current: state.civilianIndustry, target: 65 },
  ];

  return (
    <div className="nation-management nation-live-government">
      <section className="nation-government-hero">
        <div>
          <span className="eyebrow">{nation.code} NATIONAL GOVERNMENT · {state.transitionReason === 'victory' ? '승전 계승 체제' : '협상 종전 체제'}</span>
          <h2>{nation.shortName} 국가 운영 내각</h2>
          <p>{worldlineTitle} · 영토 확장보다 국민의 삶, 제도의 지속성, 경제와 외교에서 국가의 성과를 증명해야 합니다.</p>
        </div>
        <div className="nation-hero-scores">
          <div><span>국가 성과</span><strong>{state.nationalScore}</strong><small>산업·교육·복지·제도 종합</small></div>
          <div><span>국민 위임</span><strong>{state.mandateScore}</strong><small>다음 평가까지 {electionWeeks}주</small></div>
          <button onClick={onNextWeek}>국정 1주 진행 <ChevronRight size={17} /></button>
        </div>
      </section>

      <section className="nation-kpi-grid">
        {[
          ['고용', state.employment, Factory, false],
          ['복지', state.welfare, HeartHandshake, false],
          ['교육', state.education, GraduationCap, false],
          ['주택', state.housing, Building2, false],
          ['제도 역량', state.institutionalCapacity, Landmark, false],
          ['사회 불안', state.unrest, TrendingDown, true],
        ].map(([label, value, Icon, danger]) => {
          const MetricIcon = Icon as typeof Factory;
          return <article key={label as string} className={danger && Number(value) > 55 ? 'warning' : ''}><MetricIcon /><span>{label as string}</span><strong>{Math.round(Number(value))}</strong><MetricBar value={Number(value)} danger={Boolean(danger)} /></article>;
        })}
      </section>

      <NationalSimulationOverview snapshot={nationalSimulation} phase="nation" onNavigate={onNavigate} />

      <div className="nation-government-grid">
        <section className="nation-surface fiscal-cabinet">
          <header><div><span>주간 재정</span><h3>세입·지출 조정</h3></div><CircleDollarSign size={20} /></header>
          <div className="fiscal-summary">
            <div><span>국고</span><strong>{formatMoney(game.treasury)}</strong></div>
            <div><span>국가 부채</span><strong>{formatMoney(economy.debt)}</strong></div>
            <div><span>물가</span><strong>{economy.inflation.toFixed(1)}%</strong></div>
            <div><span>최근 수지</span><strong>{latestReport ? formatMoney(latestReport.fiscalBalance, { signed: true }) : '첫 결산 전'}</strong></div>
          </div>
          <div className="fiscal-controls">
            <div><span><b>조세 부담</b><small>세입 증가 · 고용과 지지 부담</small></span><div><button aria-label="조세 부담 5 낮추기" onClick={() => onTaxChange(-5)} disabled={state.taxBurden <= 20}><Minus /></button><strong>{state.taxBurden}</strong><button aria-label="조세 부담 5 높이기" onClick={() => onTaxChange(5)} disabled={state.taxBurden >= 80}><Plus /></button></div></div>
            <div><span><b>공공지출</b><small>정책 효과 증가 · 부채와 물가 부담</small></span><div><button aria-label="공공지출 5 낮추기" onClick={() => onSpendingChange(-5)} disabled={state.spendingLevel <= 25}><Minus /></button><strong>{state.spendingLevel}</strong><button aria-label="공공지출 5 높이기" onClick={() => onSpendingChange(5)} disabled={state.spendingLevel >= 85}><Plus /></button></div></div>
          </div>
          <button className="economy-deep-link" onClick={() => onNavigate('economy')}>채권·세제·기업 투자 상세 관리 <ChevronRight size={15} /></button>
        </section>

        <section className="nation-surface national-objectives">
          <header><div><span>국가 운영 목표</span><h3>정복이 아닌 지속 가능한 승리</h3></div><ShieldCheck size={20} /></header>
          <div>
            {objectiveRows.map((objective) => (
              <article key={objective.label}>
                <span><strong>{objective.label}</strong><small>{Math.round(objective.current)} / {objective.target}</small></span>
                <MetricBar value={(objective.current / objective.target) * 100} danger={objective.label.includes('불안')} />
              </article>
            ))}
          </div>
          <p>선거·국민 위임, 경제 안정, 공공서비스, 외교적 생존이 새 승리 조건입니다. 군사력은 억지력과 안보 비용으로 남지만 영토 점령은 더 이상 주간 진행의 중심이 아닙니다.</p>
        </section>
      </div>

      <section className="nation-surface ministry-budget-board">
        <header><div><span>내각 예산안</span><h3>100%의 한정된 자원을 어디에 배분할 것인가</h3></div><small>한 부처를 +5% 하면 여력이 가장 큰 다른 부처에서 자동 조정됩니다.</small></header>
        <div className="ministry-budget-grid">
          {nationBudgetDefinitions.map((definition) => {
            const Icon = budgetIcons[definition.id];
            return (
              <article key={definition.id}>
                <div className="ministry-title"><Icon /><span><small>{definition.ministry}</small><strong>{definition.name}</strong></span><b>{state.budget[definition.id]}%</b></div>
                <p>{definition.description}</p>
                <small className="ministry-effect">{definition.primaryEffect}</small>
                <div className="ministry-control"><button aria-label={`${definition.name} 예산 5퍼센트포인트 낮추기`} onClick={() => onBudgetChange(definition.id, -5)} disabled={state.budget[definition.id] <= 5}><Minus /></button><MetricBar value={(state.budget[definition.id] / 45) * 100} /><button aria-label={`${definition.name} 예산 5퍼센트포인트 높이기`} onClick={() => onBudgetChange(definition.id, 5)} disabled={state.budget[definition.id] >= 45}><Plus /></button></div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="nation-surface national-strategy-board">
        <header><div><span>국가 발전 노선</span><h3>내각 전체가 따를 장기 전략</h3></div><small>현재: {currentStrategy.name}</small></header>
        <div className="national-strategy-grid">
          {nationStrategies.map((strategy) => (
            <button key={strategy.id} className={state.strategyId === strategy.id ? 'active' : ''} onClick={() => onStrategyChange(strategy.id)}>
              <span>{strategy.doctrine}</span><strong>{strategy.name}</strong><p>{strategy.description}</p><small><b>강점</b> {strategy.strengths}</small><em><b>위험</b> {strategy.risk}</em>
            </button>
          ))}
        </div>
      </section>

      {latestReport && (
        <section className="nation-surface nation-weekly-causality">
          <header><div><span>제{latestReport.week + 1}주 국정 결산</span><h3>무엇을 선택했고, 무엇이 달라졌는가</h3></div><strong>{formatMoney(latestReport.fiscalBalance, { signed: true })}</strong></header>
          <div className="causality-columns">
            <div><h4>원인</h4>{latestReport.causes.map((cause) => <p key={cause}>{localizeMoney(cause)}</p>)}</div>
            <ChevronRight className="causality-arrow" />
            <div><h4>결과</h4>{latestReport.effects.map((effect) => <p key={effect}>{localizeMoney(effect)}</p>)}</div>
          </div>
          {latestReport.events.map((event) => <article className={`nation-policy-event ${event.tone}`} key={event.id}><span>{event.title}</span><strong>{event.detail}</strong><p><b>발생 원인</b> {event.cause}</p><p><b>향후 영향</b> {event.consequence}</p></article>)}
        </section>
      )}
    </div>
  );
}
