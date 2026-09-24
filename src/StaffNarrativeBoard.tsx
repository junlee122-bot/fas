import {
  AlertTriangle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Newspaper,
  ShieldAlert,
  UsersRound,
} from 'lucide-react';
import { getStaffNarrativeAtmosphere, getStaffNarrativeOptions } from './staffNarrative';
import type { StaffNarrativeCause, StaffNarrativeState } from './staffNarrative';
import type { StaffMember } from './types';
import { deriveStaffMeetingHistory } from './staffMeeting';

interface StaffNarrativeBoardProps {
  state: StaffNarrativeState;
  staff: StaffMember[];
  week: number;
  politicalPower: number;
  manageableStaffIds: Set<string>;
  onResolve: (storylineId: string, optionId: string) => void;
  onMeet: (staffId: string) => void;
}

const stageLabels = {
  private: '비공개 현안',
  cabinet: '각료회의 확산',
  public: '언론 공개',
};

function initials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('');
}

function NarrativeCause({ cause }: { cause?: StaffNarrativeCause }) {
  return (
    <div className="staff-story-evidence">
      <strong>발생 근거 · {cause?.source === 'verified-event' ? '플레이 기록 연결' : '자동 내부사정'}</strong>
      <p>{cause?.description ?? '기존 저장에는 연결된 플레이 사건의 근거가 없습니다.'}</p>
      <small>{cause ? `${cause.week}주차 · ` : ''}{cause?.source === 'verified-event' ? `근거 ID: ${cause.evidenceId}` : '전투·임무·언론 보도를 확인한 기록이 아닌 내부 상태 점검입니다.'}</small>
    </div>
  );
}

export function StaffNarrativeBoard({
  state,
  staff,
  week,
  politicalPower,
  manageableStaffIds,
  onResolve,
  onMeet,
}: StaffNarrativeBoardProps) {
  const members = new Map(staff.map((member) => [member.id, member]));
  const atmosphere = getStaffNarrativeAtmosphere(state);
  const urgentStory = [...state.activeStorylines].sort((left, right) => left.deadlineWeek - right.deadlineWeek)[0];
  const storyPeople = urgentStory
    ? [members.get(urgentStory.firstStaffId), urgentStory.secondStaffId ? members.get(urgentStory.secondStaffId) : undefined].filter(Boolean) as StaffMember[]
    : [];
  const canIntervene = storyPeople.some((member) => manageableStaffIds.has(member.id));
  const visibleBonds = [...state.bonds]
    .sort((left, right) => {
      const leftPressure = Math.abs(left.affinity - 52) + left.grievances * 4;
      const rightPressure = Math.abs(right.affinity - 52) + right.grievances * 4;
      return rightPressure - leftPressure;
    })
    .slice(0, 6);

  return (
    <section className="staff-narrative-board" aria-label="참모 인물 서사와 조직 갈등">
      <header className="staff-narrative-heading">
        <span><UsersRound size={18} /><span><small>STAFF DRESSING ROOM</small><strong>인물·갈등 브리핑</strong></span></span>
        <em className={atmosphere.score < 45 ? 'danger' : ''}>{atmosphere.label} · {atmosphere.score}</em>
      </header>
      <div className="staff-narrative-pulse">
        <span><small>관계 온도</small><strong>{atmosphere.label}</strong><p>{atmosphere.summary}</p></span>
        <span><small>진행 중 현안</small><strong>{state.activeStorylines.length}<em>건</em></strong><p>{urgentStory ? `${Math.max(0, urgentStory.deadlineWeek - week)}주 안에 대응` : `${Math.max(0, state.nextStoryWeek - week)}주 뒤 정례 관계 점검`}</p></span>
        <span><small>장기 기록</small><strong>{state.history.length}<em>건</em></strong><p>결정과 후속 검증이 인물 경력에 남습니다.</p></span>
      </div>

      {urgentStory ? (
        <article className={`staff-story-card ${urgentStory.stage}`}>
          <header>
            <span className="staff-story-status">{urgentStory.stage === 'public' ? <Newspaper size={15} /> : urgentStory.stage === 'cabinet' ? <ShieldAlert size={15} /> : <MessageSquare size={15} />} {urgentStory.stage === 'public' && urgentStory.cause?.source === 'internal-state' ? '공개 갈등 위험' : stageLabels[urgentStory.stage]}</span>
            <span className="staff-story-deadline"><Clock3 size={13} /> {urgentStory.deadlineWeek}주차까지 · 공개 위험 {urgentStory.publicRisk}</span>
          </header>
          <div className="staff-story-body">
            <div className="staff-story-copy">
              <small>{urgentStory.trigger}</small>
              <h4>{urgentStory.title}</h4>
              <p>{urgentStory.summary}</p>
              <NarrativeCause cause={urgentStory.cause} />
              <blockquote>{urgentStory.question}</blockquote>
              <em><AlertTriangle size={12} /> {urgentStory.stakes}</em>
            </div>
            <div className="staff-story-people">
              {storyPeople.map((member) => (
                <button type="button" key={member.id} disabled={!manageableStaffIds.has(member.id)} onClick={() => onMeet(member.id)} title={manageableStaffIds.has(member.id) ? '개별 면담 열기' : '현재 보직의 직접 인사권 밖입니다.'}>
                  <i>{initials(member.name)}</i><span><strong>{member.name}</strong><small>{member.role}</small><em>충성 {Math.round(member.loyalty)} · 업무 {Math.round(member.workload)}%</em></span><ArrowRight size={12} />
                </button>
              ))}
            </div>
          </div>
          <div className="staff-story-decisions">
            {getStaffNarrativeOptions(urgentStory).map((option) => {
              const unavailable = !canIntervene || politicalPower < option.cost;
              return (
                <button type="button" className={option.tone} key={option.id} disabled={unavailable} onClick={() => onResolve(urgentStory.id, option.id)}>
                  <span><small>{option.tone === 'good' ? '관계 중심' : option.tone === 'bad' ? '강경 대응' : '권력 판단'}</small><strong>{option.label}</strong><p>{option.approach}</p><em>{option.forecast}</em></span>
                  <b>{option.cost ? `${option.cost} PP` : '비용 없음'}</b>
                </button>
              );
            })}
          </div>
          {!canIntervene && <p className="staff-story-authority-lock"><ShieldAlert size={13} /> 이 현안의 당사자는 현재 직함의 직접 인사권 밖입니다. 보고를 받고 상급기관의 판단을 기다립니다.</p>}
        </article>
      ) : (
        <div className="staff-story-empty"><CheckCircle2 size={22} /><span><strong>즉시 결재할 인물 현안이 없습니다.</strong><small>관계는 매주 변하며, 면담·위임·보직 약속과 업무량이 다음 사건의 원인이 됩니다.</small></span></div>
      )}

      <div className="staff-narrative-lower">
        <section className="persistent-bond-list">
          <header><strong>지속 관계</strong><small>일회성 계산이 아니라 결정과 공동 업무가 누적됩니다.</small></header>
          <div>
            {visibleBonds.map((bond) => {
              const first = members.get(bond.firstStaffId);
              const second = members.get(bond.secondStaffId);
              if (!first || !second) return null;
              return (
                <article className={bond.affinity < 44 ? 'tense' : bond.affinity >= 68 ? 'trusted' : ''} key={bond.id}>
                  <span><strong>{first.name}</strong><i>↔</i><strong>{second.name}</strong></span>
                  <p>{bond.reason}</p>
                  <em>{bond.trend > 0 ? <ArrowUpRight size={12} /> : bond.trend < 0 ? <ArrowDownRight size={12} /> : null}{bond.affinity} · 공동 성과 {bond.sharedWins} · 앙금 {bond.grievances}</em>
                </article>
              );
            })}
          </div>
        </section>
        <section className="staff-history-list">
          <header><strong>결정과 후속 검증</strong><small>선택이 끝난 뒤 실제 조직 수치를 다시 확인합니다.</small></header>
          <div>
            {state.history.slice(0, 6).map((record) => (
              <article className={record.tone} key={record.id}>
                <span><small>제{record.week + 1}주 · {deriveStaffMeetingHistory(record, staff, week).statusLabel}</small><strong>{record.title}</strong></span>
                <p>{record.decision}</p>
                <em>{record.outcome}</em>
                {record.verificationReason ? <p>{record.verificationReason}</p> : null}
                <NarrativeCause cause={record.cause} />
              </article>
            ))}
            {!state.history.length && <p className="staff-history-empty">아직 누적된 조직 결정이 없습니다. 첫 현안에 대응하면 이곳에 장기 기록이 생깁니다.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
