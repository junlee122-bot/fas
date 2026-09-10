import { ArrowRight, CalendarClock, Gavel, Landmark, Scale } from 'lucide-react';
import { getConstitutionDraftProgress, getVacantJudicialOffices, judicialOffices } from './constitutionalJudiciary';
import type { NationManagementState } from './nationManagement';
import type { NationDeskView } from './NationDesk';
import type { CareerRole } from './types';
import './InstitutionAgendaDesk.css';

export interface InstitutionAgendaInput {
  state: Pick<NationManagementState, 'nationId' | 'constitutionalJudiciary' | 'justice' | 'sovereignPowers'>;
  role: CareerRole;
  week: number;
}
export interface InstitutionAgendaItem {
  id: string;
  title: string;
  detail: string;
  timing: string;
  action: string;
  destination: 'constitution' | 'justice' | 'sovereign';
  entry?: 'procedure' | 'records';
  mode: 'decision' | 'waiting' | 'review' | 'restricted';
  dueWeek: number | null;
}
export interface InstitutionAgenda {
  valid: boolean;
  items: InstitutionAgendaItem[];
  vacancies: number;
  openCases: number;
  pendingVerifications: number;
}

/** An itinerary, not an engine: dates and outcomes come only from saved procedures. */
export function deriveInstitutionAgenda({ state, role, week }: InstitutionAgendaInput): InstitutionAgenda {
  const empty = { valid: false, items: [], vacancies: 0, openCases: 0, pendingVerifications: 0 };
  if (!Number.isSafeInteger(week) || week < 0 || state.nationId !== role.nationId
    || [state.constitutionalJudiciary, state.justice, state.sovereignPowers].some((part) => part.nationId !== state.nationId)) return empty;
  const constitution = state.constitutionalJudiciary;
  const items: InstitutionAgendaItem[] = [];
  const pending = state.justice.pendingDecision;
  if (pending) {
    const target = state.justice.cases.find((item) => item.id === pending.caseId);
    const remaining = pending.deadlineWeek - week;
    items.push({ id: `justice:${pending.id}`, title: pending.title,
      detail: target ? `${target.title} · 의혹·증거와 절차를 검토하는 단계이며 유죄 확정이 아닙니다.` : '결재와 대상 사건의 연결을 확인해야 합니다. 기록에서 사건 상태를 확인하세요.',
      timing: remaining > 0 ? `제${pending.deadlineWeek + 1}주까지 · ${remaining}주 남음` : remaining === 0 ? '이번 주 응답 기한' : `응답 기한 ${-remaining}주 경과 · 현재 절차 재확인`,
      action: '대상 사건과 결재 확인', destination: 'justice', mode: target ? 'decision' : 'review', dueWeek: pending.deadlineWeek });
  }
  const nomination = constitution.activeNomination;
  if (nomination) {
    const candidate = constitution.candidates.find((item) => item.id === nomination.candidateId);
    const office = judicialOffices.find((item) => item.id === nomination.officeId);
    const deciding = nomination.stage === 'confirmation';
    const stage = nomination.stage === 'vetting' ? '신원·재산 검증' : nomination.stage === 'hearing' ? '공개 청문' : '인준 판단';
    items.push({ id: `nomination:${nomination.id}`, title: `${office?.name ?? '사법 고위직'} · ${stage}`,
      detail: `${candidate?.name ?? '후보 연결 확인 필요'} · 지명과 취임은 다릅니다. 인준 조건과 현재 보직의 권한을 확인하세요.`,
      timing: deciding ? '청문 종료 · 인준 결재 검토' : nomination.nextReviewWeek > week ? `제${nomination.nextReviewWeek + 1}주 심사 · ${nomination.nextReviewWeek - week}주 남음` : '심사 예정 주 도달 · 다음 주간 결산에서 절차 갱신',
      action: deciding ? '후보 인준 조건 확인' : '인사 절차와 기일 확인', destination: 'constitution', entry: 'procedure', mode: deciding ? 'decision' : 'waiting', dueWeek: deciding ? week : nomination.nextReviewWeek });
  }
  const unresolved = state.sovereignPowers.history.filter((record) => !record.resolved);
  const first = [...unresolved].sort((a, b) => a.verificationWeek - b.verificationWeek || a.week - b.week)[0];
  if (first) items.push({ id: `power:${first.id}`, title: `권한 행사 검증 · ${first.title}`,
    detail: `미검증 기록 ${unresolved.length}건. 승인 효과와 후속 정치적 평가는 별개입니다. 확인되지 않은 성공·실패를 미리 확정하지 않습니다.`,
    timing: first.verificationWeek > week ? `제${first.verificationWeek + 1}주 확인 · ${first.verificationWeek - week}주 남음` : '검증 예정 주 도달 · 다음 주간 결산에서 결과 확인',
    action: '권한 검증 장부 확인', destination: 'sovereign', entry: 'records', mode: 'waiting', dueWeek: first.verificationWeek });
  if (constitution.status !== 'enacted') {
    const progress = getConstitutionDraftProgress(constitution);
    const authorized = role.tier === 1;
    items.push({ id: 'constitution:draft', title: constitution.status === 'drafting' ? `헌법 초안 · ${progress}/7장 채택` : '제헌권과 현재 보직',
      detail: authorized ? '조항 열람은 무료이며 채택·비준은 별도 승인입니다. 비준 전까지 조항을 바꿀 수 있습니다.' : `현재 ${role.title}에서는 헌법 채택·비준을 직접 승인할 수 없습니다. 사법 인사권은 직위별로 따로 확인합니다.`,
      timing: constitution.status === 'drafting' ? progress === 7 ? '작성 완료 · 조항 충돌과 비준 조건 확인' : `${7 - progress}개 장 미작성 · 정해진 자동 비준일 없음` : authorized ? '최고위 권한에 따라 제헌 개시 · 화면 또는 주간 결산에서 확인' : '최고위 보직의 제헌권 대기',
      action: '헌법과 사법 인사 검토', destination: 'constitution', mode: authorized ? 'review' : 'restricted', dueWeek: null });
  }
  items.sort((a, b) => (a.mode === 'decision' ? 0 : 1) - (b.mode === 'decision' ? 0 : 1)
    || (a.dueWeek ?? Number.MAX_SAFE_INTEGER) - (b.dueWeek ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id));
  return { valid: true, items, vacancies: getVacantJudicialOffices(constitution, week).length,
    openCases: state.justice.cases.filter((item) => item.stage !== 'closed').length, pendingVerifications: unresolved.length };
}

const statusLabels = { decision: '응답 검토', waiting: '주간 절차 대기', review: '검토할 업무', restricted: '상급 권한' };
export function InstitutionAgendaDesk({ state, role, week, busy = false, onOpen }: InstitutionAgendaInput & { busy?: boolean; onOpen: (view: NationDeskView, entry?: 'procedure' | 'records') => void }) {
  const agenda = deriveInstitutionAgenda({ state, role, week });
  return <section className="institution-agenda-desk" aria-labelledby="institution-agenda-title">
    <header className="institution-heading"><div><span>INSTITUTIONS / 제{week + 1}주</span><h2 id="institution-agenda-title">제도 업무 일정</h2><p>지금 답할 결재와 기다릴 절차를 먼저 구분하세요.</p></div><CalendarClock size={30} aria-hidden="true" /></header>
    <p className="institution-context">{role.title} · {role.tier}급 · 실제 승인 권한은 각 업무의 법률·보직 조건으로 확인합니다.</p>
    {busy ? <p className="institution-status" role="status">기간 진행 중입니다. 기록과 검토 화면은 열 수 있지만 승인은 결산이 끝난 뒤 가능합니다.</p> : null}
    {!agenda.valid ? <p role="alert">국가·보직·제도 기록이 일치하지 않습니다. 현재 캠페인의 기록을 다시 확인하세요.</p> : <>
      <div className="institution-destinations" aria-label="헌정·사법 업무 선택">
        <button type="button" onClick={() => onOpen('constitution')}><Landmark size={24} /><span><strong>헌법·사법 인사</strong><small>{state.constitutionalJudiciary.status === 'enacted' ? '헌법 시행 중' : '헌법 채택·비준'} · 공석 {agenda.vacancies}곳</small></span><ArrowRight size={18} /></button>
        <button type="button" onClick={() => onOpen('sovereign')}><Scale size={24} /><span><strong>국가 권한</strong><small>행사 조건 · 미검증 기록 {agenda.pendingVerifications}건</small></span><ArrowRight size={18} /></button>
        <button type="button" onClick={() => onOpen('justice')}><Gavel size={24} /><span><strong>수사·재판</strong><small>미결 사건 {agenda.openCases}건 · 대기 결재 {state.justice.pendingDecision ? 1 : 0}건</small></span><ArrowRight size={18} /></button>
      </div>
      <section className="institution-itinerary" aria-labelledby="institution-itinerary-title"><h3 id="institution-itinerary-title">다음에 확인할 절차</h3>
        {agenda.items.length ? <ol>{agenda.items.map((item) => <li key={item.id} className={`institution-item ${item.mode}`}><div><small>{statusLabels[item.mode]}</small><h4>{item.title}</h4><p>{item.detail}</p><p className="institution-timing"><CalendarClock size={15} aria-hidden="true" />{item.timing}</p></div><button type="button" onClick={() => onOpen(item.destination, item.entry)}>{item.action}<ArrowRight size={16} /></button></li>)}</ol> : <p className="institution-empty">현재 저장된 결재·인사 심사·권한 검증 일정이 없습니다. 새 업무를 검토하거나 이미 시행한 제도의 기록을 확인할 수 있습니다.</p>}
      </section>
      <p className="institution-note">화면을 여는 것만으로 비용이 들거나 절차가 진행되지는 않습니다. 예정 주차는 자동 성공일이 아니며, 실제 결과는 해당 주간 결산과 기록으로 확인합니다.</p>
    </>}
  </section>;
}
