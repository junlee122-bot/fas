import { useId, useRef, useState } from 'react';
import { ArrowRight, Building2, ClipboardList, Globe2, Map, Ship, Truck, Users, X } from 'lucide-react';
import { LivingWorldScene, type LivingWorldSceneProps } from './LivingWorldScene';
import { RegionalLogisticsScene, type RegionalLogisticsSceneProps } from './RegionalLogisticsScene';
import { SeaTransportScene, type SeaTransportSceneProps } from './SeaTransportScene';
import { HeadquartersStaffInspector, HeadquartersStaffTable, getHeadquartersStaffAccess, type HeadquartersStaffIdentity, type HeadquartersStaffProps } from './HeadquartersStaff';
import { HeadquartersRoomArt } from './HeadquartersRoomArt';
import { buildHeadquartersOperations } from './headquartersOperations';
import { HeadquartersActivityDetail, HeadquartersOperationsRibbon, headquartersRoutes, type HeadquartersRouteId } from './HeadquartersOperationsView';
import { HeadquartersFacilityWork } from './HeadquartersFacilityWork';
import { StaffDeliveryPledgeBoard, type StaffDeliveryPledgeBoardProps } from './StaffDeliveryPledgeBoard';
import { PersonPortrait } from './PersonPortrait';
import { getHeadquartersOccupant, getHeadquartersRoomSignal, headquartersRooms, type HeadquartersRoomId } from './headquarters';
import { getStaffAuthorityProfile, getStaffSeatTitle } from './staffOrganization';
import { getStaffWorkPriority, staffWorkPriorities } from './staffWork';
import type { RoleTabMandate } from './roleMandate';
import type { GameTab } from './types';
import './HeadquartersWorkspace.css';

export interface HeadquartersWorkspaceProps extends Omit<HeadquartersStaffProps, 'selectedStaffIdentity' | 'onSelectStaff'> {
  world: LivingWorldSceneProps;
  mandates: Record<GameTab, RoleTabMandate>;
  year: number;
  logistics?: RegionalLogisticsSceneProps;
  seaTransport?: SeaTransportSceneProps;
  researchControl?: { weeklyGain: number; onToggle: (id: string) => void };
  deliveryGoals?: StaffDeliveryPledgeBoardProps;
  onOpenUnitSupply?: () => void;
  onOpenFacility?: (room: HeadquartersRoomId, tab: GameTab) => void;
}
export function HeadquartersWorkspace(props: HeadquartersWorkspaceProps) {
  const { world, context, mandates, year } = props;
  const deliveryGoals = props.deliveryGoals?.context.nationId === world.input.nationId && props.deliveryGoals.context.week === world.input.game.week
    && props.deliveryGoals.context.phase === 'nation' && world.input.phase === 'nation' ? props.deliveryGoals : undefined;
  const [selectedView, setView] = useState<'floor' | 'staff' | 'national' | 'logistics' | 'sea' | 'goals'>('floor');
  const view = (selectedView === 'logistics' && !props.logistics) || (selectedView === 'sea' && !props.seaTransport) || (selectedView === 'goals' && !deliveryGoals) ? 'floor' : selectedView;
  const [roomId, setRoomId] = useState<HeadquartersRoomId>('command');
  const [identity, setIdentity] = useState<HeadquartersStaffIdentity | null>(null);
  const [routeId, setRouteId] = useState<HeadquartersRouteId>('all');
  const detailRef = useRef<HTMLElement>(null);
  const id = useId();
  const input = context.input;
  const activities = buildHeadquartersOperations(world.input, world.snapshot, input, world.staffIssues, context.formatMoney);
  const route = headquartersRoutes.find(item => item.id === routeId);
  const selectRoom = (location: HeadquartersRoomId) => { setRoomId(location); setIdentity(null); };
  const member = input?.staff.find((person) => person.id === identity?.id && person.personId === identity.personId);
  const room = (member && headquartersRooms.find((item) => item.department === member.department)) || headquartersRooms.find((item) => item.id === roomId)!;
  const mandate = mandates[room.tab];
  const title = (value: typeof room) => input?.campaignPhase === 'nation' ? value.postwarLabel : value.label;
  const onSelectStaff = (selection: HeadquartersStaffIdentity) => {
    setIdentity(selection);
    const person = input?.staff.find((item) => item.id === selection.id && item.personId === selection.personId);
    const location = headquartersRooms.find((item) => item.department === person?.department);
    if (location) setRoomId(location.id);
  };
  const staffProps: HeadquartersStaffProps = { ...props, selectedStaffIdentity: identity, onSelectStaff, onOpenBriefing: world.onOpenBriefing };
  const occupant = getHeadquartersOccupant(room, input);
  const staffAccess = member ? getHeadquartersStaffAccess(context, member) : null;
  const goToFacility = () => { if (mandate.mode !== 'locked') { if (props.onOpenFacility) props.onOpenFacility(room.id, room.tab); else world.onNavigate(room.tab); } };
  const viewLabels = { floor: '지휘부 배치도', staff: '참모 업무표', national: '국가 현황', logistics: '물류 현장', sea: '해상 수송', goals: '이행 목표' };
  const availableViews: (keyof typeof viewLabels)[] = ['floor', 'staff', 'national', ...(props.logistics ? ['logistics' as const] : []), ...(props.seaTransport ? ['sea' as const] : []), ...(deliveryGoals ? ['goals' as const] : [])];
  return <section className="hq-workspace" aria-labelledby={`${id}-title`}>
    <header className="hq-heading"><div><span>HEADQUARTERS / {year} · 제{world.input.game.week + 1}주</span><h2 id={`${id}-title`}>{world.nationName} · 나의 지휘부</h2><p>공간에서 고르고, 사람에게 맡기고, 다음 결산에서 확인합니다.</p></div><button type="button" onClick={world.onOpenBriefing}><ClipboardList size={17} />주간 브리핑</button></header>
    <nav className="hq-view-switch" aria-label="현장 작업대">
      {availableViews.map((value) => <button key={value} type="button" aria-pressed={view === value} onClick={() => setView(value)}>{value === 'floor' ? <Building2 size={17} /> : value === 'staff' ? <Users size={17} /> : value === 'logistics' ? <Truck size={17} /> : value === 'sea' ? <Ship size={17} /> : value === 'goals' ? <ClipboardList size={17} /> : <Globe2 size={17} />}{viewLabels[value]}</button>)}
      <span>{input?.role.title ?? '현재 보직 확인 필요'}</span>
    </nav>
    {view === 'goals' && deliveryGoals ? <StaffDeliveryPledgeBoard {...deliveryGoals} initialView="records" /> : view === 'national' ? <LivingWorldScene {...world} /> : view === 'logistics' && props.logistics ? <RegionalLogisticsScene {...props.logistics} /> : view === 'sea' && props.seaTransport ? <SeaTransportScene {...props.seaTransport} /> : <>
      <div className={`hq-layout hq-layout--${view}`}>
        <div className="hq-primary">
          {view === 'staff' ? <HeadquartersStaffTable {...staffProps} /> : <>
            <HeadquartersOperationsRibbon routeId={routeId} activities={activities} selectedRoom={room.id} onRoute={setRouteId} onRoom={selectRoom} postwar={world.input.phase === 'nation'} />
            <div className="hq-map-caption"><span>시설은 방을, 담당자는 초상을 선택</span><small>현재 조직의 배치 모식도 · 실제 건물·이동 위치 아님</small></div>
            <div className="hq-floorplan" aria-label="지휘부 시설과 담당자 배치도">
              {headquartersRooms.map((location, index) => {
                const person = getHeadquartersOccupant(location, input);
                const access = mandates[location.tab];
                const selected = !identity && roomId === location.id;
                const personSelected = Boolean(person && identity?.id === person.id && identity.personId === person.personId);
                const work = person && staffWorkPriorities.find((option) => option.id === getStaffWorkPriority(person));
                const activity = activities[location.id];
                const outsideRoute = route && !(route.rooms as readonly HeadquartersRoomId[]).includes(location.id);
                return <div key={location.id} className={`hq-room hq-room--${location.id}${selected || personSelected ? ' is-selected' : ''}${outsideRoute ? ' is-outside-route' : ''}`} data-room={location.id} data-activity={activity.status}>
                  {index === 4 && <span className="hq-corridor-label" aria-hidden="true">통신·연결 복도</span>}
                  <div className="hq-room-sign"><small>{String(index + 1).padStart(2, '0')} / {access.label}<span className="hq-room-state">{activity.label}</span></small><strong>{title(location)}</strong></div>
                  <div className="hq-room-furnishings"><HeadquartersRoomArt kind={location.id} modern={year >= 1980} /></div>
                  <button className="hq-room-hit" type="button" aria-label={`${title(location)} 선택 · ${getHeadquartersRoomSignal(location, world.input, world.staffIssues, context.formatMoney)}`} aria-pressed={selected} aria-controls={`${id}-detail`} onClick={() => { setRoomId(location.id); setIdentity(null); }} />
                  <div className="hq-room-floor-status">{activity.headline}{activity.progress ? <progress aria-label={activity.progress.label} value={activity.progress.value} max={activity.progress.max} /> : null}</div>
                  {person ? <button className="hq-person-token" type="button" aria-pressed={personSelected} aria-controls={`${id}-detail`} aria-label={`${person.name} 선택 · ${getStaffSeatTitle(person.department, input!.campaignPhase, input!.nationStatus)}`} onClick={() => onSelectStaff({ id: person.id, personId: person.personId })}>
                    <PersonPortrait personId={person.personId} name={person.name} size="sm" /><span><strong>{person.name}</strong><small>{work?.label} · {getStaffAuthorityProfile(input!.role).managedDepartments.includes(person.department) ? (person.delegated ? '위임 중' : '직접 관리') : '상급 관리'}</small></span><i data-load={person.workload >= 80 ? 'high' : 'normal'} aria-label={`업무량 ${Math.round(person.workload)}`} />
                  </button> : <span className="hq-no-person">{location.department ? '담당 기록 없음' : '보건 체계 보고'}</span>}
                  <span className="hq-door" aria-hidden="true" />
                </div>;
              })}
            </div>
            <div className="hq-floor-legend"><span><i /> 담당 참모</span><span><i className="high" /> 업무량 80 이상</span><span>방 선택·참모 선택만으로 명령이 집행되지 않습니다.</span></div>
          </>}
        </div>
        <aside className="hq-detail" id={`${id}-detail`} tabIndex={-1} ref={detailRef} aria-label="선택 상세">
          {identity ? <><button className="hq-back-to-room" type="button" onClick={() => setIdentity(null)}><X size={14} />시설 정보로</button><HeadquartersStaffInspector key={`${identity.id}:${identity.personId}`} {...staffProps} /></> : <section className="hq-facility-inspector">
            <span className="hq-eyebrow">FACILITY / {mandate.label}</span><h3>{title(room)}</h3><p>{room.purpose}</p>
            <dl><div><dt>담당자</dt><dd>{occupant?.name ?? (room.department ? '현재 담당 기록 없음' : '보건 체계 보고')}</dd></div><div><dt>결정 권한</dt><dd>{mandate.label}</dd></div></dl>
            <p className="hq-authority-note">{mandate.reason}</p>
            <HeadquartersFacilityWork roomId={room.id} nation={world.input} staffInput={input} mandate={mandate} year={year} researchControl={props.researchControl} onReallocate={world.onReallocate} />
            <HeadquartersActivityDetail activity={activities[room.id]} />
            {occupant && <button type="button" onClick={() => onSelectStaff({ id: occupant.id, personId: occupant.personId })}><Users size={16} />{occupant.name} 업무·배치</button>}
            <button type="button" disabled={mandate.mode === 'locked'} onClick={goToFacility}>{mandate.mode === 'report' ? '담당 보고 확인' : mandate.mode === 'request' ? '상신·조건 확인' : room.action}<ArrowRight size={16} /></button>
            {room.id === 'workshop' && <button type="button" onClick={() => setView('national')}>군수·민수 배분 미리보기<ArrowRight size={16} /></button>}
            {room.id === 'warehouse' && props.logistics ? <button type="button" onClick={() => setView('logistics')}><Truck size={16} />실제 물류 현장 보기<ArrowRight size={16} /></button> : null}
            {room.id === 'warehouse' && props.seaTransport ? <button type="button" onClick={() => setView('sea')}><Ship size={16} />병력 해상 수송 보기<ArrowRight size={16} /></button> : null}
              {deliveryGoals && ['workshop', 'warehouse', 'personnel'].includes(room.id) ? <button type="button" onClick={() => setView('goals')}><ClipboardList size={16} />담당자·납품 목표 추적<ArrowRight size={16} /></button> : null}
              {props.onOpenUnitSupply && ['warehouse', 'command'].includes(room.id) && mandates.army.mode !== 'locked' ? <button type="button" onClick={props.onOpenUnitSupply}><Truck size={16} />{mandates.army.mode === 'direct' ? '부대 지급·수령 창구' : '부대 보급 보고·권한 확인'}<ArrowRight size={16} /></button> : null}
            <details className="hq-howto"><summary>여기서 무엇을 하나요?</summary><ol><li>방을 골라 현재 업무를 확인합니다.</li><li>참모 초상에서 배치·면담·업무 속도를 정합니다.</li><li>업무표로 부담을 비교하고, 다음 주 브리핑에서 결과를 확인합니다.</li></ol><p>보직 재배치는 별도 검토와 최종 승인이 필요합니다. 건설·걷기 시뮬레이션은 아닙니다.</p></details>
          </section>}
        </aside>
      </div>
      <footer className="hq-actionbar" aria-label="선택 대상 행동">
        <div><small>{member ? '선택한 참모' : identity ? '명부 확인 필요' : '선택한 시설'}</small><strong>{member?.name ?? (identity ? '선택 인물이 변경되었습니다' : title(room))}</strong><span>{member ? getStaffSeatTitle(member.department, input!.campaignPhase, input!.nationStatus) : mandate.label}</span></div>
        {member ? <><button type="button" disabled={!staffAccess?.allowed} title={staffAccess?.reason ?? undefined} onClick={() => detailRef.current?.focus()}>업무·보직 검토</button><button type="button" disabled={Boolean(staffAccess?.delegationReason)} title={staffAccess?.delegationReason ?? undefined} onClick={() => props.onToggleDelegation(member.id)}>{member.delegated ? '위임 회수' : '책임 위임'}</button></> : !identity && <>{(room.id === 'research' || room.id === 'workshop') && mandate.mode === 'direct' ? <button type="button" onClick={() => detailRef.current?.querySelector<HTMLSelectElement>('.hq-facility-work select')?.focus()}>현장 지시 검토</button> : null}<button type="button" disabled={mandate.mode === 'locked'} onClick={goToFacility}>{mandate.mode === 'direct' ? room.action : '권한·보고 확인'}<ArrowRight size={16} /></button></>}
        <button type="button" onClick={() => setView(view === 'staff' ? 'floor' : 'staff')}>{view === 'staff' ? <Map size={16} /> : <Users size={16} />}{view === 'staff' ? '배치도로' : '업무표로'}</button>
        <button type="button" onClick={world.onOpenBriefing}>결과 확인<ClipboardList size={16} /></button>
      </footer>
    </>}
  </section>;
}
