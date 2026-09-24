import { useRef, useState } from 'react';
import { Check, ClipboardCheck } from 'lucide-react';
import { getHeadquartersActionProblem } from './headquartersActionGuard';
import type { HeadquartersRoomId } from './headquarters';
import type { NationalSimulationInput } from './nationalSimulation';
import type { RoleTabMandate } from './roleMandate';
import type { StaffDecisionInput } from './staffDecisions';
import { assessResearchAction, getResearchWeeks } from './ResearchDesk';
import { getResearchAvailability } from './researchProgression';
import { reallocateFactory } from './livingWorld';
import './HeadquartersOperations.css';

export interface HeadquartersWorkInput {
  roomId: 'research' | 'workshop';
  nation: NationalSimulationInput;
  staffInput: StaffDecisionInput | null;
  mandate: RoleTabMandate;
  year: number;
  weeklyResearchGain?: number;
  researchConnected: boolean;
  selectedId: string;
  direction: -1 | 1;
}
export type HeadquartersWorkAssessment = { allowed: false; reason: string } | {
  allowed: true; reason: string; title: string; details: string[]; fingerprint: string;
  execution: { type: 'research'; id: string } | { type: 'production'; id: string; amount: -1 | 1 };
};
/** A proposal only. State mutation stays in the existing App command handlers. */
export function assessHeadquartersFacilityWork(input: HeadquartersWorkInput): HeadquartersWorkAssessment {
  const { staffInput, nation, mandate, selectedId } = input;
  const deny = (reason: string): HeadquartersWorkAssessment => ({ allowed: false, reason });
  if (!staffInput || staffInput.game.week !== nation.game.week || staffInput.campaignPhase !== nation.phase) return deny('현재 보직과 기관 보고의 주차·운영 단계를 확인하십시오.');
  const tab = input.roomId === 'research' ? 'research' : 'industry';
  const problem = getHeadquartersActionProblem({ ...staffInput, nationId: nation.nationId, week: nation.game.week, mandate }, tab);
  if (problem) return deny(problem);
  const base = [nation.nationId, nation.game.week, nation.phase, staffInput.role.id, staffInput.career, staffInput.affiliationStatus, mandate];
  if (input.roomId === 'research') {
    if (!input.researchConnected) return deny('연구 지휘 화면에서 과제를 배정하십시오.');
    if (!Number.isFinite(input.year) || new Set(nation.research.map(item => item.id)).size !== nation.research.length
      || nation.research.some(item => !item.id || !Number.isFinite(item.progress) || item.progress < 0 || !Number.isFinite(item.duration) || item.duration <= 0)) return deny('연구 기록을 확인할 수 없어 과제를 배정하지 않습니다.');
    const project = nation.research.find(item => item.id === selectedId);
    const assessment = assessResearchAction(project, nation.research, input.year, Boolean(staffInput.busy));
    if (!project || !assessment.allowed) return deny(assessment.reason);
    const weeks = getResearchWeeks(project, input.weeklyResearchGain ?? 0);
    return { allowed: true, reason: assessment.reason, title: `${project.name} · ${project.active ? '일시 중지' : '연구 배정'}`,
      details: [`누적 진행 ${project.progress} / ${project.duration}은 보존됩니다.`, project.active ? '다른 과제에 쓸 연구 슬롯 1개를 비웁니다.' : `현재 속도 유지 시 ${weeks === null ? '완료 시점은 아직 예측할 수 없습니다.' : `약 ${weeks}회 주간 결산이 필요합니다.`}`, '시설을 선택하거나 검토하는 것만으로는 지시가 집행되지 않습니다.'],
      execution: { type: 'research', id: project.id }, fingerprint: JSON.stringify([...base, input.year, input.weeklyResearchGain, selectedId, nation.research]) };
  }
  if (new Set(nation.production.map(line => line.id)).size !== nation.production.length
    || nation.production.some(line => !line.id || !Number.isInteger(line.assigned) || line.assigned < 0 || !Number.isFinite(line.efficiency) || line.efficiency < 0 || line.efficiency > 100)) return deny('공장 배분 기록을 확인할 수 없어 지시를 집행하지 않습니다.');
  const line = nation.production.find(item => item.id === selectedId);
  if (!line) return deny('조정할 생산 라인을 직접 선택하십시오.');
  const projected = reallocateFactory(nation.production, nation.game.factories, line.id, input.direction, true);
  const next = projected?.find(item => item.id === line.id);
  if (!next) return deny(input.direction === 1 ? '군수에 추가 배치할 공장 여력이 없습니다.' : '선택한 라인에서 회수할 공장이 없습니다.');
  return { allowed: true, reason: '공장 1개에 해당하는 국가 생산 역량을 조정합니다. 실제 건물 1채의 이전이 아닙니다.', title: `${line.name} · ${input.direction === 1 ? '군수 배치 확대' : '민수 여력 확보'}`,
    details: [`배치 ${line.assigned} → ${next.assigned}개 · 라인 효율 ${line.efficiency} → ${next.efficiency}`, '공장 배분은 승인 직후, 생산·생활 공급의 결과는 이후 주간 결산에서 확인합니다.', '창고·수송 중 장비를 즉시 가용 비축으로 편입하지 않습니다.'],
    execution: { type: 'production', id: line.id, amount: input.direction }, fingerprint: JSON.stringify([...base, selectedId, input.direction, nation.game.factories, nation.production]) };
}

export interface HeadquartersFacilityWorkProps {
  roomId: HeadquartersRoomId;
  nation: NationalSimulationInput;
  staffInput: StaffDecisionInput | null;
  mandate: RoleTabMandate;
  year: number;
  researchControl?: { weeklyGain: number; onToggle: (id: string) => void };
  onReallocate: (id: string, amount: number) => void;
}
export function HeadquartersFacilityWork(props: HeadquartersFacilityWorkProps) {
  if (props.roomId !== 'research' && props.roomId !== 'workshop') return null;
  return <FacilityWork key={`${props.nation.nationId}:${props.staffInput?.role.id}:${props.roomId}`} {...props} roomId={props.roomId} />;
}
function FacilityWork(props: HeadquartersFacilityWorkProps & { roomId: 'research' | 'workshop' }) {
  const [selectedId, setSelectedId] = useState('');
  const [direction, setDirection] = useState<-1 | 1>(-1);
  const [review, setReview] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const issued = useRef('');
  const input: HeadquartersWorkInput = { ...props, researchConnected: Boolean(props.researchControl), weeklyResearchGain: props.researchControl?.weeklyGain, selectedId, direction };
  const assessment = assessHeadquartersFacilityWork(input);
  const validReview = assessment.allowed && review === assessment.fingerprint;
  const choices = props.roomId === 'research' ? props.nation.research.filter(item => !item.complete && (item.active || getResearchAvailability(item, props.nation.research, props.year).available)) : props.nation.production;
  const stale = selectedId !== '' && !choices.some(item => item.id === selectedId);
  const approve = () => {
    const current = assessHeadquartersFacilityWork(input);
    if (!current.allowed || review !== current.fingerprint || issued.current === current.fingerprint) return;
    issued.current = current.fingerprint;
    setReview(null);
    if (current.execution.type === 'research') props.researchControl?.onToggle(current.execution.id);
    else props.onReallocate(current.execution.id, current.execution.amount);
    setNotice('지시를 전달했습니다. 현재 배정과 다음 주간 결산에서 적용 결과를 확인하십시오.');
  };
  return <section className="hq-facility-work" aria-label={props.roomId === 'research' ? '현장 연구 지시' : '현장 공장 배분'}>
    <h4>{props.roomId === 'research' ? '이 연구실에서 과제 배정' : '이 생산실에서 공장 배분'}</h4>
    <label>{props.roomId === 'research' ? '연구 과제' : '생산 라인'}<select value={stale ? '' : selectedId} onChange={event => { setSelectedId(event.target.value); setReview(null); setNotice(''); }}>
      <option value="">{stale ? '선택했던 대상이 바뀌었습니다. 다시 선택하세요.' : '대상을 직접 선택하세요'}</option>
      {choices.map(item => <option key={item.id} value={item.id}>{item.name}{'active' in item && item.active ? ' · 진행 중' : 'assigned' in item ? ` · ${item.assigned}개 배치` : ''}</option>)}
    </select></label>
    {props.roomId === 'workshop' ? <div className="hq-work-directions" role="group" aria-label="현장 공장 전환 방향"><button type="button" aria-pressed={direction === -1} onClick={() => { setDirection(-1); setReview(null); }}>민수로 1개</button><button type="button" aria-pressed={direction === 1} onClick={() => { setDirection(1); setReview(null); }}>군수로 1개</button></div> : null}
    <p>{assessment.reason}</p>
    {!assessment.allowed && props.mandate.mode !== 'direct' ? <small>아래 기존 창구에서 보고·상신 절차를 이용할 수 있습니다. 이 패널은 상급기관 권한을 대신 행사하지 않습니다.</small> : null}
    <button type="button" disabled={!assessment.allowed} onClick={() => { if (assessment.allowed) { setReview(assessment.fingerprint); setNotice(''); } }}><ClipboardCheck size={15} aria-hidden="true" /> 지시안 검토</button>
    {review && !validReview ? <p className="hq-work-notice" role="status">대상·주차·권한 또는 진행 상태가 바뀌었습니다. 최신 지시안을 다시 검토하십시오.</p> : null}
    {validReview && assessment.allowed ? <section className="hq-work-review" aria-label="시설 지시 최종 검토"><h5>{assessment.title}</h5>{assessment.details.map(detail => <p key={detail}>{detail}</p>)}<footer><button type="button" onClick={() => setReview(null)}>검토 취소</button><button type="button" onClick={approve}><Check size={15} aria-hidden="true" />이 지시 승인</button></footer></section> : null}
    {notice ? <p className="hq-work-notice" role="status">{notice}</p> : null}
  </section>;
}
