import {
  Check,
  Factory,
  Gauge,
  MessageSquare,
  Package,
  RefreshCw,
  Shield,
  Star,
  Truck,
  Users,
} from 'lucide-react';
import { policyDomains, strategicPolicies } from './choices';
import type {
  Commander,
  Division,
  GameState,
  NationProfile,
  ProductionLine,
  StaffCandidate,
  StaffMember,
  Stockpile,
  SupplyPolicy,
} from './types';

interface OrganizationPanelProps {
  game: GameState;
  nation: NationProfile;
  staff: StaffMember[];
  candidates: StaffCandidate[];
  divisions: Division[];
  commanders: Commander[];
  production: ProductionLine[];
  stockpile: Stockpile;
  supplyPolicy: SupplyPolicy;
  procurementFocusId: string | null;
  priorityDivisionId: string;
  selectedPolicies: string[];
  developmentFocusId: string | null;
  onMeetStaff: (id: string) => void;
  onToggleDelegation: (id: string) => void;
  onSetPriorityDivision: (id: string) => void;
  onSetProcurementFocus: (id: string) => void;
  onSetSupplyPolicy: (policy: SupplyPolicy) => void;
  onSelectPolicy: (policyId: string) => void;
  onSetDevelopmentFocus: (staffId: string) => void;
  onUpgradeStaff: (staffId: string) => void;
  onScoutCandidate: (candidateId: string) => void;
  onToggleShortlist: (candidateId: string) => void;
  onRecruitCandidate: (candidateId: string) => void;
}

const departmentLabels = {
  operations: '작전',
  logistics: '군수',
  armaments: '병기',
  personnel: '인사',
  political: '정무',
};

const supplyPolicies: Array<{ id: SupplyPolicy; title: string; detail: string; effect: string }> = [
  { id: 'balanced', title: '균형 배분', detail: '전선과 예비대를 같은 기준으로 지원', effect: '안정적 운용' },
  { id: 'frontline', title: '전선 우선', detail: '이동·전투 중인 편제에 물자를 집중', effect: '전선 보급 +3 · 연료 -2/주' },
  { id: 'reserve', title: '전략 예비', detail: '회복 중인 편제를 빠르게 재건', effect: '회복 보급 +2 · 병력 +1/주' },
];

function Meter({ value, tone = 'blue' }: { value: number; tone?: 'blue' | 'gold' | 'red' }) {
  return <span className="org-meter"><i className={tone} style={{ width: Math.max(0, Math.min(100, value)) + '%' }} /></span>;
}

export function OrganizationPanel({
  game,
  nation,
  staff,
  candidates,
  divisions,
  commanders,
  production,
  stockpile,
  supplyPolicy,
  procurementFocusId,
  priorityDivisionId,
  selectedPolicies,
  developmentFocusId,
  onMeetStaff,
  onToggleDelegation,
  onSetPriorityDivision,
  onSetProcurementFocus,
  onSetSupplyPolicy,
  onSelectPolicy,
  onSetDevelopmentFocus,
  onUpgradeStaff,
  onScoutCandidate,
  onToggleShortlist,
  onRecruitCandidate,
}: OrganizationPanelProps) {
  const delegatedCount = staff.filter((member) => member.delegated).length;
  const weeklyPayroll = staff.reduce((total, member) => total + member.weeklyCost, 0);

  return (
    <div className="organization-grid">
      <section className="management-card staff-card">
        <div className="management-heading">
          <div><span>BACKROOM STAFF</span><h3>직속 참모진</h3></div>
          <em>{delegatedCount}/5 위임 · 주급 £{weeklyPayroll}M</em>
        </div>
        <p className="management-intro">능력만큼 충성도와 업무량도 중요합니다. 권한을 위임하면 매주 해당 부서의 보너스를 받지만 과로와 충성도 하락 위험이 커집니다.</p>
        <div className="staff-table" role="table" aria-label="직속 참모진">
          {staff.map((member) => (
            <article className="staff-row" role="row" key={member.id}>
              <div className="staff-identity">
                <span className="staff-avatar" style={{ borderColor: nation.accent }}>{member.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>
                <div><strong>{member.name}</strong><small>{member.role} · {departmentLabels[member.department]}</small></div>
              </div>
              <div className="staff-rating"><span>현재 / 잠재</span><strong>{member.ability} <small>/ {member.potential}</small></strong><Meter value={member.ability} /></div>
              <div className="staff-rating"><span>충성도</span><strong>{member.loyalty}</strong><Meter value={member.loyalty} tone={member.loyalty < 55 ? 'red' : 'gold'} /></div>
              <div className="staff-rating"><span>업무량</span><strong>{member.workload}%</strong><Meter value={member.workload} tone={member.workload > 75 ? 'red' : 'blue'} /></div>
              <div className="staff-rating"><span>등급 {member.grade} · 성장</span><strong>{member.development}%</strong><Meter value={member.development} tone="gold" /></div>
              <div className="staff-actions">
                <button onClick={() => onMeetStaff(member.id)} title="면담: 정치력 4"><MessageSquare size={13} /> 면담</button>
                <button className={member.delegated ? 'active' : ''} onClick={() => onToggleDelegation(member.id)}><Check size={13} /> {member.delegated ? '위임 중' : '직접 결재'}</button>
                <button className={developmentFocusId === member.id ? 'active' : ''} onClick={() => onSetDevelopmentFocus(member.id)}><Star size={13} /> {developmentFocusId === member.id ? '육성 중' : '육성'}</button>
                <button disabled={member.development < 100 || member.grade >= 3} title={member.grade >= 3 ? '이미 최고 등급에 도달했습니다.' : member.development < 100 ? `성장도 100%가 필요합니다. 현재 ${member.development}%입니다.` : '정치력과 재정을 사용해 참모를 승급합니다.'} onClick={() => onUpgradeStaff(member.id)}><RefreshCw size={13} /> 승급</button>
              </div>
            </article>
          ))}
        </div>
        <div className="recruitment-hub">
          <div className="recruitment-title">
            <div><span>RECRUITMENT FOCUS</span><strong>인재 영입 센터</strong></div>
            <em>조사 수준에 따라 능력치 오차가 줄어듭니다</em>
          </div>
          <div className="candidate-grid">
            {candidates.map((candidate) => {
              const uncertainty = Math.max(1, Math.ceil((100 - candidate.knowledge) / 10));
              const ability = candidate.knowledge >= 65 ? String(candidate.ability) : Math.max(35, candidate.ability - uncertainty) + '–' + Math.min(99, candidate.ability + uncertainty);
              const potential = candidate.knowledge >= 85 ? String(candidate.potential) : Math.max(40, candidate.potential - uncertainty) + '–?';
              return (
                <article className={'candidate-card ' + candidate.status} key={candidate.id}>
                  <header><span>{departmentLabels[candidate.department]}</span><em>{candidate.status === 'shortlisted' ? '최종 명단' : candidate.status === 'scouting' ? '조사 중' : candidate.status === 'signed' ? '영입 완료' : '미평가'}</em></header>
                  <strong>{candidate.name}</strong>
                  <small>{candidate.role}</small>
                  <div className="candidate-attributes">
                    <span><small>현재</small><b>{ability}</b></span>
                    <span><small>잠재</small><b>{potential}</b></span>
                    <span><small>관심</small><b>{candidate.knowledge >= 45 ? candidate.interest + '%' : '?'}</b></span>
                  </div>
                  <Meter value={candidate.knowledge} tone="gold" />
                  <p>정보 {candidate.knowledge}% · 계약금 £{candidate.signingCost}M · 주급 £{candidate.weeklyCost}M</p>
                  <div>
                    <button disabled={candidate.status === 'signed' || candidate.knowledge >= 100} title={candidate.status === 'signed' ? '이미 영입한 인재입니다.' : candidate.knowledge >= 100 ? '조사가 완료됐습니다.' : '정치력 3을 사용해 정보 수준을 높입니다.'} onClick={() => onScoutCandidate(candidate.id)}>정밀 조사</button>
                    <button disabled={candidate.status === 'signed' || candidate.knowledge < 35} title={candidate.status === 'signed' ? '이미 영입한 인재입니다.' : candidate.knowledge < 35 ? `정보 35%가 필요합니다. 현재 ${candidate.knowledge}%입니다.` : '관심 명단에 추가하거나 제거합니다.'} className={candidate.status === 'shortlisted' ? 'active' : ''} onClick={() => onToggleShortlist(candidate.id)}>관심 명단</button>
                    <button disabled={candidate.status === 'signed' || candidate.knowledge < 55} title={candidate.status === 'signed' ? '이미 영입한 인재입니다.' : candidate.knowledge < 55 ? `정보 55%가 필요합니다. 현재 ${candidate.knowledge}%입니다.` : `계약금 £${candidate.signingCost}M으로 협상을 시작합니다.`} onClick={() => onRecruitCandidate(candidate.id)}>영입 협상</button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="management-card formations-card">
        <div className="management-heading">
          <div><span>FIRST TEAM</span><h3>핵심 편제</h3></div>
          <em>{divisions.length}개 편제</em>
        </div>
        <div className="formation-list">
          {divisions.map((division, index) => {
            const commander = commanders.find((item) => item.id === division.commanderId);
            const readiness = Math.round((division.strength + division.organization + division.supply) / 3);
            const priority = division.id === priorityDivisionId;
            return (
              <article className={'formation-management-row ' + (priority ? 'priority' : '')} key={division.id}>
                <div className="formation-rank">{priority ? <Star size={16} fill="currentColor" /> : String(index + 1).padStart(2, '0')}</div>
                <div className="formation-copy"><strong>{division.name}</strong><small>{commander?.name ?? '지휘관 공석'} · {division.status === 'ready' ? '출전 가능' : division.status === 'recovering' ? '재정비' : '작전 중'}</small></div>
                <div className="readiness-score"><span>전투 준비</span><strong>{readiness}</strong><Meter value={readiness} tone={readiness < 55 ? 'red' : 'gold'} /></div>
                <button className={priority ? 'selected' : ''} onClick={() => onSetPriorityDivision(division.id)}>{priority ? '핵심 편제' : '우선 지정'}</button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="management-card procurement-card">
        <div className="management-heading">
          <div><span>RECRUITMENT & PROCUREMENT</span><h3>조달 포커스</h3></div>
          <em><Factory size={13} /> {game.factories}개 공장</em>
        </div>
        <div className="procurement-grid">
          {production.map((line) => {
            const selected = procurementFocusId === line.id;
            return (
              <button className={selected ? 'selected' : ''} key={line.id} onClick={() => onSetProcurementFocus(line.id)}>
                <span className="procurement-icon">{line.icon}</span>
                <span><strong>{line.name}</strong><small>{line.category} · 공장 {line.assigned}</small></span>
                <em>{line.efficiency}%</em>
                {selected && <i><Star size={12} /> 우선 조달</i>}
              </button>
            );
          })}
        </div>
      </section>

      <section className="management-card logistics-card">
        <div className="management-heading">
          <div><span>LOGISTICS</span><h3>보급 운영</h3></div>
          <em><Truck size={13} /> 수송선 {stockpile.convoys.toLocaleString('ko-KR')}</em>
        </div>
        <div className="logistics-summary">
          <span><Package size={14} /><small>보병 장비</small><strong>{stockpile.infantryEquipment.toLocaleString('ko-KR')}</strong></span>
          <span><Gauge size={14} /><small>연료</small><strong>{Math.round(game.fuel)}K</strong></span>
          <span><Shield size={14} /><small>차량</small><strong>{stockpile.trucks.toLocaleString('ko-KR')}</strong></span>
        </div>
        <div className="supply-policy-list">
          {supplyPolicies.map((policy) => (
            <button className={supplyPolicy === policy.id ? 'selected' : ''} key={policy.id} onClick={() => onSetSupplyPolicy(policy.id)}>
              <i>{supplyPolicy === policy.id ? <Check size={14} /> : null}</i>
              <span><strong>{policy.title}</strong><small>{policy.detail}</small></span>
              <em>{policy.effect}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="management-card policy-card">
        <div className="management-heading">
          <div><span>NATIONAL IDENTITY</span><h3>국가 운영 원칙</h3></div>
          <em>{selectedPolicies.length}/4 채택 · 변경 불가</em>
        </div>
        <p className="management-intro">각 영역에서 하나의 원칙을 선택하십시오. 즉시 국가 수치가 변하고, 이후 매주 생산·전투·보급 계산에 계속 반영됩니다.</p>
        <div className="policy-domain-grid">
          {policyDomains.map((domain) => {
            const policies = strategicPolicies.filter((policy) => policy.domain === domain.id);
            const chosen = policies.find((policy) => selectedPolicies.includes(policy.id));
            return (
              <div className="policy-domain" key={domain.id}>
                <header><span>{domain.subtitle}</span><h4>{domain.title}</h4></header>
                {policies.map((policy) => {
                  const selected = selectedPolicies.includes(policy.id);
                  return (
                    <button key={policy.id} disabled={Boolean(chosen) && !selected} title={Boolean(chosen) && !selected ? `${domain.title} 영역은 이미 '${chosen?.title}' 원칙을 채택했습니다.` : selected ? '현재 적용 중인 국가 원칙입니다.' : `${policy.title}: ${policy.effect}`} className={selected ? 'selected' : ''} onClick={() => onSelectPolicy(policy.id)}>
                      <i>{selected ? <Check size={14} /> : null}</i>
                      <span><strong>{policy.title}</strong><small>{policy.description}</small><em>{policy.effect}</em></span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
