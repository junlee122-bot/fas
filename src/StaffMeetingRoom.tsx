import { useId, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Archive, CalendarClock, FileCheck2, FileText, LockKeyhole, UsersRound } from 'lucide-react';
import { deriveStaffMeetingAgenda, deriveStaffMeetingHistory, deriveStaffMeetingPreview } from './staffMeeting';
import type { StaffMeetingContext, StaffMeetingEvidence, StaffMeetingPreview } from './staffMeeting';
import { getStaffMorale, getStaffRoleSatisfaction } from './staffManagement';
import './StaffMeetingRoom.css';

export interface StaffMeetingRoomProps extends StaffMeetingContext {
  onResolve: (storylineId: string, choiceId: string) => boolean;
  onOpenAuthority?: () => void;
}

const signed = (value: number) => `${value > 0 ? '+' : ''}${Number(value.toFixed(1)).toLocaleString('ko-KR')}`;
const effectValue = (value: number | boolean) => typeof value === 'boolean' ? value ? '위임 중' : '위임 없음' : Number(value.toFixed(1)).toLocaleString('ko-KR');
const gameLabels = { politicalPower: '정치력', stability: '국가 안정', intelNetwork: '정보망', commandPoints: '지휘점수', warSupport: '전쟁 지지도' };

function MeetingEvidence({ evidence }: { evidence: StaffMeetingEvidence }) {
  return <section className="staff-meeting-evidence" aria-label="발생 근거">
    <h4><FileText size={17} aria-hidden="true" /> 발생 근거 · {evidence.label}</h4>
    <p>{evidence.description}</p>
    <p className="staff-meeting-source">{evidence.week === null ? '기록 주차 미확인' : `발생 제${evidence.week + 1}주`}{evidence.evidenceId ? ` · 근거 ID: ${evidence.evidenceId}` : ' · 외부 사건 ID 없음'}</p>
    {evidence.warning ? <p className="staff-meeting-note">{evidence.warning}</p> : null}
    <p className="staff-meeting-note">원본 현안에 저장된 요약만 표시합니다. 비공개 원문이나 추가 정보는 조회하지 않습니다.</p>
  </section>;
}

/** Independently renderable confirmation content; every number comes from the original resolver. */
export function StaffMeetingDecisionPreview({ preview }: { preview: StaffMeetingPreview }) {
  return <section className="staff-meeting-preview" aria-label="결재 전 확인">
    <h4><FileCheck2 size={18} aria-hidden="true" /> 결재 전 확인 · 아직 적용되지 않음</h4>
    <strong>{preview.option.label}</strong>
    <p>필요 정치력 {preview.option.cost} · 정치력 {preview.politicalPowerBefore} → {preview.politicalPowerAfter}</p>
    <p className="staff-meeting-note">정치력 순변화에 기존 비용이 이미 포함됩니다. 별도 회의비는 없습니다.</p>
    <ul className="staff-meeting-effects">
      {Object.entries(preview.gameDelta).filter(([key, value]) => key !== 'politicalPower' && value !== 0).map(([key, value]) => <li key={key}>{gameLabels[key as keyof typeof gameLabels]}: {signed(value ?? 0)} <span>(원본 적용 요청량 · 최종 국가 수치의 상·하한 적용)</span></li>)}
      {preview.people.map((person) => <li key={person.staffId}><strong>{person.name}</strong>: {person.effects.length ? person.effects.map((effect) => `${effect.label} ${effectValue(effect.before)} → ${effectValue(effect.after)}`).join(' · ') : '즉시 인물 수치 변화 없음'}</li>)}
      {preview.bond ? <li>{preview.bond.label}: {effectValue(preview.bond.before)} → {effectValue(preview.bond.after)}</li> : null}
    </ul>
    <p><CalendarClock size={16} aria-hidden="true" /> 제{preview.verificationWeek + 1}주 후속 확인 예정 · 현재 선택 시점 기준</p>
    <p className="staff-meeting-note">그 주의 원본 주간 처리에서 동일 인물의 사기·수용 상태를 확인합니다. 지금 이행 완료나 미래 성공을 확정하지 않습니다.</p>
    {preview.reason ? <p className="staff-meeting-warning">{preview.reason}</p> : null}
  </section>;
}

export function StaffMeetingRoom(props: StaffMeetingRoomProps) {
  const { state, staff, week, politicalPower, onResolve, onOpenAuthority } = props;
  const id = useId();
  const [view, setView] = useState<'agenda' | 'history'>('agenda');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [review, setReview] = useState<{ storylineId: string; choiceId: string; token: string } | null>(null);
  const [message, setMessage] = useState('');
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const submitted = useRef(new Set<string>());
  const stories = [...state.activeStorylines].sort((first, second) => first.deadlineWeek - second.deadlineWeek);
  const storyId = selectedId && stories.some((story) => story.id === selectedId) ? selectedId : stories[0]?.id;
  const agenda = storyId ? deriveStaffMeetingAgenda(props, storyId) : null;
  const preview = review && review.storylineId === storyId ? deriveStaffMeetingPreview(props, review.storylineId, review.choiceId) : null;
  const reviewChanged = Boolean(preview && review?.token !== preview.reviewToken);

  const switchTab = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : ['ArrowLeft', 'ArrowRight'].includes(event.key) ? 1 - index : null;
    if (target === null) return;
    event.preventDefault();
    setView(target === 0 ? 'agenda' : 'history');
    tabs.current[target]?.focus();
  };
  const selectChoice = (choiceId: string) => {
    if (!storyId) return;
    const next = deriveStaffMeetingPreview(props, storyId, choiceId);
    if (!next) return;
    setReview({ storylineId: storyId, choiceId, token: next.reviewToken });
    setMessage('');
  };
  const confirm = () => {
    if (!review || !storyId || submitted.current.has(storyId)) return;
    const current = deriveStaffMeetingPreview(props, storyId, review.choiceId);
    if (!current?.canConfirm || current.reviewToken !== review.token) {
      setMessage('인물·권한·정치력 또는 주차가 바뀌었습니다. 현재 내용으로 선택을 다시 검토하세요.');
      return;
    }
    submitted.current.add(storyId);
    // A true callback is not a receipt. The history tab only renders persisted source records.
    if (onResolve(storyId, review.choiceId)) {
      setView('history');
      setReview(null);
      setMessage('원본 결정·후속 기록을 확인하세요. 화면에서 별도 비용이나 효과를 적용하지 않습니다.');
    } else {
      submitted.current.delete(storyId);
      setReview(null);
      setMessage('결재가 적용되지 않았습니다. 현재 권한·정치력·안건 상태를 확인하고 다시 검토하세요.');
    }
  };

  return <section className="staff-meeting-room" aria-labelledby={`${id}-title`}>
    <header className="staff-meeting-header">
      <div><span className="staff-meeting-eyebrow">COUNCIL ROOM · 제{week + 1}주</span><h2 id={`${id}-title`}>참모 회의장</h2><p>사람과 근거를 확인하고, 현재 보직에서 책임질 결정을 고릅니다.</p></div>
      <div className="staff-meeting-stamp"><UsersRound size={25} aria-hidden="true" /><strong>활성 현안 {stories.length}건</strong><span>가용 정치력 {politicalPower}</span></div>
    </header>
    <div className="staff-meeting-tabs" role="tablist" aria-label="회의 자료">
      {(['agenda', 'history'] as const).map((tab, index) => <button key={tab} ref={(node) => { tabs.current[index] = node; }} type="button" role="tab" id={`${id}-${tab}-tab`} aria-controls={`${id}-${tab}-panel`} aria-selected={view === tab} tabIndex={view === tab ? 0 : -1} onKeyDown={(event) => switchTab(event, index)} onClick={() => setView(tab)}>{tab === 'agenda' ? '현재 안건' : `결정·후속 기록 (${state.history.length})`}</button>)}
    </div>
    <p className="staff-meeting-status" role="status" aria-live="polite">{message || '입장·열람·보류에는 비용이나 주간 성과 보상이 없습니다.'}</p>
    <div id={`${id}-agenda-panel`} role="tabpanel" aria-labelledby={`${id}-agenda-tab`} hidden={view !== 'agenda'} tabIndex={0}>
      {stories.length && agenda ? <>
        <label className="staff-meeting-agenda-select" htmlFor={`${id}-agenda-select`}>검토할 안건
          <select id={`${id}-agenda-select`} value={storyId} onChange={(event) => { setSelectedId(event.target.value); setReview(null); setMessage(''); }}>
            {stories.map((story) => <option key={story.id} value={story.id}>{story.title} · 제{story.deadlineWeek + 1}주 기한</option>)}
          </select>
        </label>
        {agenda.story ? <>
          <div className="staff-meeting-case-heading"><span>{agenda.story.stage === 'public' ? '공개 위험 단계' : agenda.story.stage === 'cabinet' ? '각료 조정 단계' : '내부 검토 단계'} · 제{agenda.story.createdWeek + 1}주 발생</span><h3>{agenda.story.title}</h3><p>{agenda.story.summary}</p></div>
          <div className="staff-meeting-layout">
            <div className="staff-meeting-chamber">
              <div className="staff-meeting-seats" aria-label="현재 확인된 실제 참가자">
                {agenda.participants.map(({ member, manageable, identityNote, opinion }, index) => <article className="staff-meeting-seat" key={member.id}>
                  <span className="staff-meeting-avatar" aria-hidden="true"><UsersRound size={27} /><b>{index + 1}</b></span>
                  <div><small>당사자 {index + 1} · {manageable ? '직접 관리 범위' : '관련 부서 인사'}</small><h4>{member.name}</h4><p>{member.role}</p></div>
                  <p className="staff-meeting-person-state">사기 {effectValue(getStaffMorale(member))} · 역할 만족 {effectValue(getStaffRoleSatisfaction(member))} · 업무량 {effectValue(member.workload)}</p>
                  <div className="staff-meeting-opinion"><small>게임 상황에 맞춘 재구성 의견 · 역사적 인용 아님</small><p>{opinion}</p></div>
                  {identityNote ? <p className="staff-meeting-note">{identityNote}</p> : null}
                </article>)}
              </div>
              <div className="staff-meeting-table" aria-hidden="true"><span><FileText size={29} /> 검토 자료</span><i /><i /></div>
              <p className="staff-meeting-note">회의 배치 모식도 · 원본 현안의 재직 당사자만 표시 · 별도의 참석 보상 없음</p>
            </div>
            <div className="staff-meeting-dossier">
              {agenda.evidence ? <MeetingEvidence evidence={agenda.evidence} /> : null}
              <section className="staff-meeting-question"><h4>이번 결정의 질문</h4><p>{agenda.story.question}</p><p className="staff-meeting-note">검토 위험: {agenda.story.stakes}</p></section>
              {agenda.reason ? <div className="staff-meeting-warning"><LockKeyhole size={17} aria-hidden="true" /><p>{agenda.reason}</p>{onOpenAuthority ? <button type="button" onClick={onOpenAuthority}>보직·지휘계통 확인</button> : null}<small>이 화면 이동은 권한 위임이나 안건 승인이 아닙니다. 현재 보직의 권한 범위를 확인하세요.</small></div> : null}
            </div>
          </div>
          <section className="staff-meeting-decisions" aria-labelledby={`${id}-choices`}>
            <h3 id={`${id}-choices`}>대응안을 선택한 뒤 결재 내용을 확인하세요</h3>
            <div className="staff-meeting-options">{agenda.options.map((option) => <button type="button" key={option.id} aria-pressed={review?.storylineId === storyId && review.choiceId === option.id} aria-controls={`${id}-confirmation`} disabled={!agenda.canResolve} onClick={() => selectChoice(option.id)}><strong>{option.label}</strong><span>{option.approach}</span><small>필요 정치력 {option.cost} · {option.verifyAfterWeeks}주 뒤 확인</small></button>)}</div>
            <div id={`${id}-confirmation`} aria-live="polite">
              {preview ? <><StaffMeetingDecisionPreview preview={preview} />{reviewChanged ? <p className="staff-meeting-warning">검토 뒤 상태가 바뀌었습니다. 대응안을 다시 선택해 현재 미리보기를 확인하세요.</p> : null}<button type="button" className="staff-meeting-confirm" disabled={!preview.canConfirm || reviewChanged || submitted.current.has(storyId!)} onClick={confirm}>이 내용으로 결재 · {preview.option.label}</button></> : <p className="staff-meeting-note">선택지 열람만으로 집행되지 않습니다. 결재 버튼을 누를 때 다시 검증합니다.</p>}
            </div>
            <button type="button" className="staff-meeting-postpone" onClick={() => { setReview(null); setMessage('검토만 보류했습니다. 현안은 그대로이며 다음 주로 진행하면 기존 기한 규칙이 적용됩니다.'); }}>지금은 보류 · 현안 유지</button>
          </section>
        </> : <p className="staff-meeting-warning">{agenda.reason}</p>}
      </> : <div className="staff-meeting-empty"><UsersRound size={38} aria-hidden="true" /><h3>지금 검토할 활성 현안이 없습니다</h3><p>기존 주간 처리에서 현안이 생기면 실제 당사자와 근거가 여기에 나타납니다. 빈자리를 채울 가상의 참모나 사건은 만들지 않습니다.</p><button type="button" onClick={() => setView('history')}>결정·후속 기록 보기</button></div>}
    </div>
    <div id={`${id}-history-panel`} role="tabpanel" aria-labelledby={`${id}-history-tab`} hidden={view !== 'history'} tabIndex={0}>
      <div className="staff-meeting-history-heading"><Archive size={20} aria-hidden="true" /><h3>원본 결정과 후속 확인</h3><p>확인 예정 주에 도착한 것만으로 성공 처리하지 않습니다. 실제 저장된 확인 기록을 읽습니다.</p></div>
      <div className="staff-meeting-history">{state.history.length ? state.history.map((record) => {
        const history = deriveStaffMeetingHistory(record, staff, week);
        return <article key={record.id} className={`staff-meeting-history-item ${history.status}`}>
          <span>결정 제{record.week + 1}주 · 원 안건 ID: {record.storylineId}</span><h4>{record.title}</h4><strong>{record.decision}</strong><p>{record.outcome}</p><p className="staff-meeting-history-status">{history.statusLabel}</p><p className="staff-meeting-note">{history.participantNote}</p>
          {record.verificationMeasurements?.length && history.status === 'verified' ? <ul>{record.verificationMeasurements.map((person) => <li key={person.staffId}>{person.name} · 당시 확인 사기 {person.morale} · 수용 {person.buyIn} · 역할 만족 {person.roleSatisfaction}</li>)}</ul> : null}
          <details><summary>원 결정의 발생 근거 다시 읽기</summary><MeetingEvidence evidence={history.evidence} /></details>
        </article>;
      }) : <p className="staff-meeting-empty">저장된 결정 기록이 없습니다. 열람만으로 새 기록을 만들지 않습니다.</p>}</div>
    </div>
  </section>;
}
