import { useState } from 'react';
import {
  BadgeCheck,
  BookOpenCheck,
  Castle,
  ChevronRight,
  CircleDollarSign,
  Crown,
  Gavel,
  Landmark,
  Scale,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Swords,
  Users,
} from 'lucide-react';
import {
  assessSovereignPower,
  deriveSovereignOfficeKind,
  sovereignOfficeProfiles,
  sovereignPowerDefinitions,
  sovereignPowerGroupLabels,
  type SovereignPowerContext,
  type SovereignPowerGroup,
  type SovereignPowerId,
  type SovereignPowersState,
} from './sovereignPowers';

interface SovereignPowersBoardProps {
  state: SovereignPowersState;
  context: SovereignPowerContext;
  compact?: boolean;
  formatMoney: (value: number, options?: { signed?: boolean; exact?: boolean }) => string;
  onExercise: (powerId: SovereignPowerId, targetGrantId: string | null) => void;
}

const groupIcons: Record<SovereignPowerGroup, typeof Landmark> = {
  legislation: ScrollText,
  executive: ShieldCheck,
  state: Landmark,
  estates: Castle,
};

const impactLabels = [
  ['legitimacy', '정통성'],
  ['stability', '안정도'],
  ['unrest', '사회 불안'],
  ['publicConfidence', '국민 신뢰'],
  ['justiceIndependence', '사법 독립'],
  ['mediaFreedom', '언론 자유'],
  ['parliamentaryConfidence', '의회 신임'],
  ['militaryObedience', '군 복종'],
  ['aristocraticLeverage', '귀족 영향'],
  ['patronagePressure', '후원 압력'],
] as const;

function Metric({ label, value, danger = false }: { label: string; value: number; danger?: boolean }) {
  return (
    <article className={danger ? 'warning' : ''}>
      <span>{label}</span><strong>{Math.round(value)}</strong>
      <i aria-hidden="true"><b style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></i>
    </article>
  );
}

export function SovereignPowersBoard({ state, context, compact = false, formatMoney, onExercise }: SovereignPowersBoardProps) {
  const [selectedGroup, setSelectedGroup] = useState<SovereignPowerGroup>('legislation');
  const [selectedGrantId, setSelectedGrantId] = useState(context.dynasty.titleGrants[0]?.id ?? '');
  const officeKind = deriveSovereignOfficeKind(context.formId, context.constitution);
  const profile = sovereignOfficeProfiles[officeKind];
  const selectedGrant = context.dynasty.titleGrants.find((grant) => grant.id === selectedGrantId) ?? context.dynasty.titleGrants[0] ?? null;
  const filteredDefinitions = sovereignPowerDefinitions.filter((definition) => definition.group === selectedGroup);
  const visibleDefinitions = compact ? filteredDefinitions.slice(0, 4) : filteredDefinitions;
  const activeEmergency = state.activeEmergency;

  return (
    <section className={`nation-surface sovereign-powers-board ${compact ? 'compact' : ''}`} aria-labelledby={`sovereign-powers-title-${compact ? 'compact' : 'full'}`}>
      <header className="sovereign-board-header">
        <div>
          <span>OFFICE, CROWN & ESTATES</span>
          <h3 id={`sovereign-powers-title-${compact ? 'compact' : 'full'}`}>{profile.name}의 실제 권한</h3>
          <p>{profile.source} · {profile.role}</p>
        </div>
        <div className={`sovereign-office-seal ${officeKind.includes('monarch') || officeKind.includes('sovereign') ? 'royal' : ''}`}>
          {officeKind.includes('monarch') || officeKind.includes('sovereign') ? <Crown size={18} /> : <Landmark size={18} />}
          <span>{context.role.title}</span>
          <strong>{context.role.tier === 1 ? '직접 행사권' : '위임·부서 권한'}</strong>
        </div>
      </header>

      <div className="sovereign-principle-note"><BookOpenCheck size={16} /><span><strong>{context.constitution.enacted?.name ?? '헌법 제정 전·관습 헌정'}</strong><small>{profile.caution}</small></span></div>

      <div className="sovereign-metrics">
        <Metric label="권한 자본" value={state.authorityCapital} danger={state.authorityCapital < 25} />
        <Metric label="헌정 관례" value={state.constitutionalConvention} danger={state.constitutionalConvention < 40} />
        <Metric label="의회 신임" value={state.parliamentaryConfidence} danger={state.parliamentaryConfidence < 35} />
        <Metric label="군 복종" value={state.militaryObedience} danger={state.militaryObedience < 40} />
        <Metric label="귀족 지레버리지" value={state.aristocraticLeverage} danger={state.aristocraticLeverage > 65} />
        <Metric label="인사 후원 압력" value={state.patronagePressure} danger={state.patronagePressure > 65} />
      </div>

      {activeEmergency ? (
        <div className="sovereign-emergency-banner">
          <ShieldAlert size={18} />
          <span><strong>국가비상사태 시행 중</strong><small>제{activeEmergency.declaredWeek + 1}주 선포 · 제{activeEmergency.reviewWeek + 1}주 재심 · 자동 연장 {activeEmergency.renewals}회</small></span>
          <b>{Math.max(0, activeEmergency.reviewWeek - context.week)}주</b>
        </div>
      ) : null}

      <div className="sovereign-group-tabs" role="tablist" aria-label="권한 분야">
        {(Object.keys(sovereignPowerGroupLabels) as SovereignPowerGroup[]).map((group) => {
          const Icon = groupIcons[group];
          const available = sovereignPowerDefinitions.filter((definition) => definition.group === group && assessSovereignPower(state, definition.id, context, selectedGrant).allowed).length;
          return (
            <button type="button" role="tab" aria-selected={selectedGroup === group} key={group} className={selectedGroup === group ? 'active' : ''} onClick={() => setSelectedGroup(group)}>
              <Icon size={16} /><span><strong>{sovereignPowerGroupLabels[group].name}</strong><small>{sovereignPowerGroupLabels[group].description}</small></span><b>{available}</b>
            </button>
          );
        })}
      </div>

      {selectedGroup === 'estates' ? (
        <div className="sovereign-estate-selector">
          <Crown size={16} />
          <label>행사 주체
            <select value={selectedGrant?.id ?? ''} onChange={(event) => setSelectedGrantId(event.target.value)} disabled={!context.dynasty.titleGrants.length}>
              {!context.dynasty.titleGrants.length ? <option value="">서임된 작위·영지가 없습니다</option> : null}
              {context.dynasty.titleGrants.map((grant) => <option key={grant.id} value={grant.id}>{grant.titleName} · {grant.recipientName}</option>)}
            </select>
          </label>
          <small>{selectedGrant ? `${selectedGrant.hereditary ? '세습' : '비세습'} · ${selectedGrant.domainName} · 서임 당시 충성 ${selectedGrant.loyaltyAtGrant}` : '먼저 아래 왕실 운영에서 작위와 영지를 서임하십시오.'}</small>
        </div>
      ) : null}

      <div className="sovereign-power-grid">
        {visibleDefinitions.map((definition) => {
          const assessment = assessSovereignPower(state, definition.id, context, selectedGrant);
          const visibleImpacts = impactLabels
            .map(([key, label]) => ({ key, label, value: assessment.projectedImpact[key] }))
            .filter((item) => item.value !== 0)
            .slice(0, 4);
          const StatusIcon = assessment.status === 'ultra-vires' || assessment.status === 'reserve' ? ShieldAlert : assessment.status === 'historic-estate' ? Crown : BadgeCheck;
          return (
            <article key={definition.id} className={`sovereign-power-card ${assessment.status} ${assessment.allowed ? '' : 'locked'}`}>
              <div className="sovereign-power-card-heading">
                <span className="sovereign-power-icon">{definition.group === 'estates' ? <Castle size={17} /> : definition.group === 'executive' ? <Swords size={17} /> : definition.group === 'legislation' ? <Gavel size={17} /> : <Landmark size={17} />}</span>
                <span><strong>{definition.name}</strong><small>{definition.summary}</small></span>
              </div>
              <div className={`sovereign-status-line ${assessment.status}`}><StatusIcon size={14} /><strong>{assessment.statusLabel}</strong><span>{assessment.cooldownRemaining > 0 ? `${assessment.cooldownRemaining}주 제한` : `제${context.week + assessment.verificationWeeks + 1}주 검증`}</span></div>
              <p className="sovereign-legal-basis">{assessment.legalBasis}</p>
              <div className="sovereign-procedure"><ScrollText size={13} /><span>{definition.procedure}</span></div>
              {visibleImpacts.length ? <div className="sovereign-impact-preview">{visibleImpacts.map((item) => <span key={item.key} className={item.value > 0 ? 'positive' : 'negative'}>{item.label} {item.value > 0 ? '+' : ''}{item.value}</span>)}</div> : null}
              <div className="sovereign-power-cost"><span><Scale size={13} /> 권한 {assessment.authorityCost}</span><span><Users size={13} /> 정치력 {assessment.politicalCost}</span>{assessment.treasuryCost !== 0 ? <span><CircleDollarSign size={13} /> {formatMoney(-assessment.treasuryCost, { signed: true })}</span> : null}</div>
              <button type="button" disabled={!assessment.allowed} title={assessment.allowed ? assessment.countersignature : assessment.reason} onClick={() => onExercise(definition.id, definition.requiresNobleTarget ? selectedGrant?.id ?? null : null)}>
                {assessment.allowed ? `${assessment.statusLabel} 행사` : assessment.reason}<ChevronRight size={15} />
              </button>
              <details><summary>역사적 근거와 책임 보기</summary><p>{definition.historicalBasis}</p><p>{assessment.countersignature}</p></details>
            </article>
          );
        })}
      </div>

      {compact && filteredDefinitions.length > visibleDefinitions.length ? <p className="sovereign-compact-note">국가 운영 단계에서 이 분야의 나머지 {filteredDefinitions.length - visibleDefinitions.length}개 권한과 상세 후폭풍을 확인할 수 있습니다.</p> : null}

      {!compact && state.history.length ? (
        <div className="sovereign-history">
          <h4>권한 행사 → 확인 → 검증 장부</h4>
          {state.history.slice(0, 10).map((record) => (
            <article key={record.id} className={`${record.status} ${record.resolved ? 'resolved' : 'pending'}`}>
              <span>{record.resolved ? <BadgeCheck size={15} /> : <ShieldAlert size={15} />}<i><strong>{record.title}</strong><small>{record.targetName ? `${record.targetName} · ` : ''}{record.outcome ?? record.detail}</small></i></span>
              <b>{record.resolved ? '검증 완료' : `제${record.verificationWeek + 1}주 확인`}</b>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
