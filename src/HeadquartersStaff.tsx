import { useId, useRef, useState } from 'react';
import { ArrowRightLeft, Check, ChevronRight, LockKeyhole, MessageSquare, UsersRound } from 'lucide-react';
import { PersonPortrait } from './PersonPortrait';
import { withJosa } from './koreanGrammar';
import { StaffDecisionReview, createStaffDeskReview, getStaffDeskAvailability } from './StaffDecisionReview';
import type { StaffDeskContext, StaffDeskReview } from './StaffDecisionReview';
import { createStaffReviewGate, getStaffOfficeProblem } from './staffDecisions';
import type { StaffDecisionAction } from './staffDecisions';
import { getStaffContractWeeks, getStaffMorale, getStaffRoleSatisfaction, staffMeetingOptions } from './staffManagement';
import type { StaffMeetingTopic } from './staffManagement';
import type { StaffNarrativeState } from './staffNarrative';
import { calculateStaffSuitability, getStaffAuthorityProfile, getStaffSeatDefinition, getStaffSeatTitle, staffSeatDefinitions } from './staffOrganization';
import { assessStaffWorkPriority, getStaffWorkPriority, projectStaffWorkWeek, staffWorkPriorities } from './staffWork';
import { getStaffWorkReport } from './staffWorkReport';
import { StaffWorkReportCard, formatStaffWorkDelta } from './StaffWorkReportCard';
import type { StaffDepartment, StaffMember, StaffWorkPriority } from './types';
import './HeadquartersStaff.css';

export interface HeadquartersStaffIdentity { id: string; personId: string }

export interface HeadquartersStaffProps {
  context: StaffDeskContext;
  selectedStaffIdentity: HeadquartersStaffIdentity | null;
  onSelectStaff: (identity: HeadquartersStaffIdentity) => void;
  onToggleDelegation: (id: string) => void;
  onSetDevelopmentFocus: (id: string) => void;
  onSetWorkPriority: (id: string, personId: string, priority: StaffWorkPriority) => void;
  onMeetStaff: (id: string, topic: StaffMeetingTopic) => void;
  staffNarrative: StaffNarrativeState;
  onOpenOrganization: () => void;
  onOpenBriefing?: () => void;
}

export function getHeadquartersStaffAccess(context: StaffDeskContext, member: StaffMember) {
  const input = context.input;
  if (!input) return { allowed: false, reason: '인사 기록을 연결하지 못했습니다.', delegationReason: '인사 기록을 연결하지 못했습니다.' };
  const officeProblem = getStaffOfficeProblem(input);
  const authority = getStaffAuthorityProfile(input.role);
  const reason = officeProblem ?? (input.busy ? '시간 진행 중에는 업무 배치를 변경할 수 없습니다.'
    : !input.staff.some((person) => person.id === member.id && person.personId === member.personId) ? '선택한 인물이 현재 명부와 일치하지 않습니다.'
      : !authority.managedDepartments.includes(member.department) ? `상급기관 관할 · ${authority.restrictionReason}` : null);
  const delegatedCount = input.staff.filter((person) => person.delegated && authority.managedDepartments.includes(person.department)).length;
  return { allowed: !reason, reason, delegationReason: reason ?? (!member.delegated && delegatedCount >= authority.maxDelegations
    ? `현재 보직의 위임 한도 ${authority.maxDelegations}개에 도달했습니다.` : null) };
}

export function getHeadquartersStaffNarrative(member: StaffMember, narrative: StaffNarrativeState, roster: readonly StaffMember[]) {
  const identities = new Map(roster.map((person) => [person.id, person.personId]));
  const bonds = narrative.bonds.filter((bond) =>
    identities.has(bond.firstStaffId) && identities.has(bond.secondStaffId)
    && identities.get(bond.firstStaffId) === bond.firstPersonId && identities.get(bond.secondStaffId) === bond.secondPersonId
    && ((bond.firstStaffId === member.id && bond.firstPersonId === member.personId)
      || (bond.secondStaffId === member.id && bond.secondPersonId === member.personId)));
  const stories = narrative.activeStorylines.filter((story) =>
    identities.has(story.firstStaffId) && identities.get(story.firstStaffId) === story.firstPersonId
    && (!story.secondStaffId || (identities.has(story.secondStaffId) && identities.get(story.secondStaffId) === story.secondPersonId))
    && ((story.firstStaffId === member.id && story.firstPersonId === member.personId)
      || (story.secondStaffId === member.id && story.secondPersonId === member.personId)));
  return { bonds, stories };
}

const displayNumber = (value: number) => Number.isFinite(value) ? Math.round(value * 10) / 10 : '—';

function WorkPriorityControl({ member, context, onSetWorkPriority }: Pick<HeadquartersStaffProps, 'context' | 'onSetWorkPriority'> & { member: StaffMember }) {
  const id = useId();
  const access = getHeadquartersStaffAccess(context, member);
  return <label className="hq-staff-priority" htmlFor={id}>
    <span className="hq-staff-sr-only">{member.name} 업무 속도</span>
    <select id={id} value={getStaffWorkPriority(member)} disabled={!access.allowed} title={access.reason ?? '게임 상태에 즉시 반영 · 다음 주 결산부터 적용'}
      onChange={(event) => {
        const value = event.target.value as StaffWorkPriority;
        if (context.input && assessStaffWorkPriority(context.input, member.id, member.personId, value).allowed) onSetWorkPriority(member.id, member.personId, value);
      }}>
      {staffWorkPriorities.map((priority) => <option key={priority.id} value={priority.id}>{priority.label}</option>)}
    </select>
  </label>;
}

export function HeadquartersStaffTable(props: HeadquartersStaffProps) {
  const { context, selectedStaffIdentity, onSelectStaff, onToggleDelegation, onSetDevelopmentFocus } = props;
  const heading = useId();
  const input = context.input;
  if (!input) return <section className="hq-staff-table-panel" aria-labelledby={heading}><h3 id={heading}>참모 업무표</h3><p>인사 기록을 연결하지 못했습니다. 조직 운영에서 현재 명부를 확인하십시오.</p><button type="button" onClick={props.onOpenOrganization}>조직 운영 열기</button></section>;
  const visible = getStaffAuthorityProfile(input.role).visibleDepartments;
  const roster = input.staff.filter((member) => visible.includes(member.department));
  return <section className="hq-staff-table-panel" aria-labelledby={heading}>
    <header className="hq-staff-section-heading"><div><span>WORK ASSIGNMENTS</span><h3 id={heading}>참모 업무표</h3></div><button type="button" onClick={props.onOpenOrganization}>전체 조직 <ChevronRight size={16} /></button></header>
    <p className="hq-staff-explainer">이름을 선택해 보직을 바꾸거나 면담하십시오. 업무 속도·위임·육성은 게임 상태에 즉시 반영되며, 부담과 성장 변화는 다음 주 결산에서 확인합니다.</p>
    <table className="hq-staff-table"><caption className="hq-staff-sr-only">실제 참모의 보직, 업무 속도, 부담, 책임 위임과 집중 육성</caption>
      <thead><tr><th scope="col">담당자 · 보직</th><th scope="col">업무 속도</th><th scope="col">부담 / 100</th><th scope="col">책임 위임</th><th scope="col">육성</th></tr></thead>
      <tbody>{roster.map((member) => {
        const access = getHeadquartersStaffAccess(context, member);
        const focused = input.developmentFocusId === member.id;
        const forecast = projectStaffWorkWeek(member, focused);
        const actual = getStaffWorkReport(member, input.role.nationId, input.game.week, input.developmentFocusId);
        const selected = selectedStaffIdentity?.id === member.id && selectedStaffIdentity.personId === member.personId;
        const issues = getHeadquartersStaffNarrative(member, props.staffNarrative, input.staff).stories.length;
        return <tr key={member.personId} className={selected ? 'is-selected' : undefined} data-staff-person={member.personId}>
          <th scope="row"><button type="button" className="hq-staff-name" aria-pressed={selected} onClick={() => onSelectStaff({ id: member.id, personId: member.personId })}>
            <PersonPortrait personId={member.personId} name={member.name} size="sm" /><span><strong>{member.name}</strong><small>{getStaffSeatTitle(member.department, input.campaignPhase, input.nationStatus)}</small>
              {!access.allowed ? <em><LockKeyhole size={11} />열람 전용</em> : issues > 0 ? <em>{issues}건의 조직 현안</em> : null}</span></button></th>
          <td><WorkPriorityControl {...props} member={member} /></td>
          <td><div className="hq-staff-workload" data-load={member.workload >= 80 ? 'high' : 'normal'}><strong>{displayNumber(member.workload)}<span> → {displayNumber(forecast.workload)}</span></strong><meter min={0} max={100} value={member.workload} aria-label={`${member.name} 현재 업무 부담`} /><small>다음 주 기본 전망</small>{actual.status === 'available' ? <small className="hq-staff-last-result">제{actual.report.week + 1}주 확정 · 부담 {formatStaffWorkDelta(actual.report.after.workload - actual.report.before.workload)}</small> : <small className="hq-staff-last-result hq-staff-last-result--missing">{actual.status === 'invalid' ? '확정 기록 확인 필요' : '아직 개인 결산 기록 없음'}</small>}</div></td>
          <td><button type="button" className="hq-staff-toggle" aria-label={`${member.name} 책임 위임`} aria-pressed={member.delegated} disabled={Boolean(access.delegationReason)} title={access.delegationReason ?? '담당 참모에게 주간 책임을 맡깁니다.'}
            onClick={() => onToggleDelegation(member.id)}>{member.delegated ? <Check size={14} /> : null}{member.delegated ? '위임 중' : '직접 결재'}</button></td>
          <td><button type="button" className="hq-staff-toggle" aria-label={`${member.name} 집중 육성`} aria-pressed={focused} disabled={!access.allowed} title={access.reason ?? '한 명만 집중 육성할 수 있습니다.'}
            onClick={() => onSetDevelopmentFocus(member.id)}>{focused ? <Check size={14} /> : null}{focused ? '육성 중' : '지정'}</button></td>
        </tr>;
      })}</tbody>
    </table>
    {roster.length === 0 ? <p>현재 이 지휘계통에 배치된 참모가 없습니다.</p> : null}
    <p className="hq-staff-footnote">집중 업무는 부담·성장을 함께 높이고, 부담 경감은 성장 속도를 낮춥니다. 생산량·연구량을 직접 증폭하지 않습니다. 사건·면담에 따라 실제 결산은 달라질 수 있습니다.</p>
  </section>;
}

export function HeadquartersStaffInspector(props: HeadquartersStaffProps) {
  const identity = props.selectedStaffIdentity;
  const member = identity && props.context.input?.staff.find((person) => person.id === identity.id && person.personId === identity.personId);
  if (!member || !props.context.input) return <aside className="hq-staff-inspector hq-staff-empty"><UsersRound size={30} /><h3>{identity ? '현재 명부에서 찾을 수 없습니다' : '참모를 선택하십시오'}</h3><p>{identity ? '이전 담당자의 기록으로 후임자에게 명령하지 않습니다. 배치도나 업무표에서 다시 선택하십시오.' : '배치도의 담당자 또는 아래 업무표에서 이름을 선택하면 실제 보직·부담·관계와 조치가 표시됩니다.'}</p></aside>;
  return <HeadquartersSelectedStaff key={`${member.id}:${member.personId}`} {...props} member={member} />;
}

function HeadquartersSelectedStaff(props: HeadquartersStaffProps & { member: StaffMember }) {
  const { context, member } = props;
  const input = context.input!;
  const heading = useId();
  const targetId = useId();
  const [target, setTarget] = useState<StaffDepartment>(member.department);
  const [review, setReview] = useState<StaffDeskReview | null>(null);
  const [message, setMessage] = useState('');
  const [meeting, setMeeting] = useState<StaffMeetingTopic>('wellbeing');
  const gate = useRef(createStaffReviewGate());
  const sequence = useRef(0);
  const reviewOrigin = useRef<HTMLButtonElement | null>(null);
  const access = getHeadquartersStaffAccess(context, member);
  const focus = input.developmentFocusId === member.id;
  const forecast = projectStaffWorkWeek(member, focus);
  const narrative = getHeadquartersStaffNarrative(member, props.staffNarrative, input.staff);
  const fit = calculateStaffSuitability(member, member.department);
  const seat = getStaffSeatDefinition(member.department);
  const assignAction: StaffDecisionAction = { kind: 'assign', staffId: member.id, department: target };
  const assignment = getStaffDeskAvailability(input, assignAction);
  const meetingOption = staffMeetingOptions.find((option) => option.id === meeting)!;
  const meetingReason = access.reason ?? (member.lastMeetingWeek === input.game.week ? '이번 주 면담을 마쳤습니다. 다음 주에 다시 대화할 수 있습니다.'
    : input.game.politicalPower < meetingOption.cost ? `정치력 ${meetingOption.cost}가 필요합니다.` : null);
  function openReview(action: StaffDecisionAction) {
    const next = createStaffDeskReview(context, action);
    if (!next) { setMessage(getStaffDeskAvailability(context.input, action).reason); return; }
    sequence.current += 1;
    setReview(next);
    setMessage('');
  }
  return <aside className="hq-staff-inspector" aria-labelledby={heading}>
    <header className="hq-staff-person-heading"><PersonPortrait personId={member.personId} name={member.name} size="lg" /><div><span>{access.allowed ? '내 지휘계통' : '상급기관 관할'}</span><h3 id={heading}>{member.name}</h3><p>{getStaffSeatTitle(member.department, input.campaignPhase, input.nationStatus)}</p><small>적합도 {fit.score} · {fit.label}</small></div></header>
    <p className="hq-staff-responsibility">{seat.responsibility}</p>
    <dl className="hq-staff-person-stats"><div><dt>사기</dt><dd>{getStaffMorale(member)}</dd></div><div><dt>충성</dt><dd>{displayNumber(member.loyalty)}</dd></div><div><dt>부담</dt><dd>{displayNumber(member.workload)}</dd></div><div><dt>역할 만족</dt><dd>{getStaffRoleSatisfaction(member)}</dd></div></dl>
    {access.reason ? <p className="hq-staff-restriction"><LockKeyhole size={15} />{access.reason}</p> : null}
    <StaffWorkReportCard member={member} nationId={input.role.nationId} week={input.game.week} developmentFocusId={input.developmentFocusId} formatMoney={context.formatMoney} onOpenBriefing={props.onOpenBriefing} />
    <section className="hq-staff-work-settings"><h4>이번 주 업무</h4><WorkPriorityControl {...props} member={member} /><p>{staffWorkPriorities.find((option) => option.id === getStaffWorkPriority(member))?.summary}</p>
      <div className="hq-staff-career-actions"><button type="button" aria-pressed={member.delegated} disabled={Boolean(access.delegationReason)} title={access.delegationReason ?? '이 참모에게 주간 책임을 맡기거나 회수합니다.'} onClick={() => props.onToggleDelegation(member.id)}>{member.delegated ? '책임 위임 회수' : '주간 책임 위임'}</button><button type="button" aria-pressed={focus} disabled={!access.allowed} title={access.reason ?? '집중 육성 대상은 한 명입니다.'} onClick={() => props.onSetDevelopmentFocus(member.id)}>{focus ? '집중 육성 해제' : '집중 육성 지정'}</button></div>
      <p>다음 주 기본 전망 · 부담 {displayNumber(member.workload)} → {displayNumber(forecast.workload)} · 성장도 {displayNumber(member.development)} → {displayNumber(forecast.development)}</p>
      <small>실제 사건·면담 전 전망입니다. 속도 지정 자체에는 즉시 비용이 들지 않습니다.</small></section>
    <section className="hq-staff-assignment"><h4><ArrowRightLeft size={16} /> 보직 재배치</h4><label htmlFor={targetId}>이동할 보직</label><select id={targetId} value={target} disabled={!access.allowed || Boolean(review)} onChange={(event) => { setTarget(event.target.value as StaffDepartment); setMessage(''); }}>
      {staffSeatDefinitions.map((definition) => {
        const available = getStaffDeskAvailability(input, { kind: 'assign', staffId: member.id, department: definition.department });
        const current = definition.department === member.department;
        const occupant = input.staff.find((person) => person.department === definition.department && person.id !== member.id);
        return <option key={definition.department} value={definition.department} disabled={!current && !available.allowed}>{getStaffSeatTitle(definition.department, input.campaignPhase, input.nationStatus)}{current ? ' · 현재' : occupant ? ` · ${withJosa(occupant.name, '과/와')} 교대` : ' · 공석'}</option>;
      })}</select>
      <p>{assignment.allowed ? '검토서에서 상대 담당자의 이동·약속·위임과 비용을 확인한 뒤 승인합니다.' : assignment.reason}</p>
      <button ref={reviewOrigin} type="button" disabled={!assignment.allowed || Boolean(review)} onClick={() => openReview(assignAction)}>재배치 검토 · 아직 적용하지 않음</button>
    </section>
    {review ? <StaffDecisionReview key={sequence.current} review={review} context={context} gate={gate.current} onClose={() => { setReview(null); setMessage(''); requestAnimationFrame(() => reviewOrigin.current?.focus()); }} /> : null}
    {message ? <p role="status" className="hq-staff-restriction">{message}</p> : null}
    <details className="hq-staff-detail"><summary><MessageSquare size={16} /> 개인 면담</summary><label>면담 의제<select value={meeting} disabled={!access.allowed} onChange={(event) => setMeeting(event.target.value as StaffMeetingTopic)}>{staffMeetingOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label><p>{meetingOption.summary}</p><p className="hq-staff-meeting-forecast">{meetingOption.forecast}</p><p>{meetingReason ?? `정치력 ${meetingOption.cost} 사용 · 결과는 즉시 기록 · 1인당 주 1회`}</p><button type="button" disabled={Boolean(meetingReason) || Boolean(review)} onClick={() => props.onMeetStaff(member.id, meeting)}>면담 실행 · 정치력 {meetingOption.cost}</button></details>
    <details className="hq-staff-detail"><summary>관계와 조직 현안 · {narrative.stories.length}건</summary>
      {narrative.stories.length ? narrative.stories.map((story) => <article key={story.id}><strong>{story.title}</strong><p>{story.summary}</p><small>확인된 원인 · {story.cause.description}</small></article>) : <p>현재 이 인물에게 연결된 미해결 현안이 없습니다.</p>}
      {narrative.bonds.slice().sort((a, b) => a.affinity - b.affinity).slice(0, 4).map((bond) => {
        const otherId = bond.firstStaffId === member.id ? bond.secondStaffId : bond.firstStaffId;
        const other = input.staff.find((person) => person.id === otherId)!;
        return <article key={bond.id} className="hq-staff-bond"><strong>{other.name} · 관계 {bond.affinity}/100</strong><p>{bond.reason}</p><small>공동 성과 {bond.sharedWins} · 누적 불만 {bond.grievances}</small></article>;
      })}<button type="button" onClick={props.onOpenOrganization}>조직 현안에서 대응하기 <ChevronRight size={15} /></button>
    </details>
    <details className="hq-staff-detail"><summary>경력 · 계약 · 육성</summary><p>{member.summary}</p><p>전문 분야 · {member.specialty}</p><p>주급 {context.formatMoney(member.weeklyCost)} · 잔여 계약 {getStaffContractWeeks(member)}주</p>
      <div className="hq-staff-career-actions">{(['renew', 'promote'] as const).map((kind) => { const action: StaffDecisionAction = { kind, staffId: member.id }; const available = getStaffDeskAvailability(input, action); return <button key={kind} type="button" disabled={!available.allowed || Boolean(review)} title={available.reason} onClick={() => openReview(action)}>{kind === 'renew' ? '계약 연장 검토' : '참모 승급 검토'}</button>; })}</div>
      <small>초상은 인물 식별용 AI 재구성입니다. 실물 사진이 아니며 등록되지 않은 인물은 이름 표식을 사용합니다.</small>
    </details>
  </aside>;
}
