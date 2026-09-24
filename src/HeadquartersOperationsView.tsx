import { ArrowRight, CircleAlert, Route } from 'lucide-react';
import { headquartersRooms, type HeadquartersRoomId } from './headquarters';
import type { HeadquartersActivity } from './headquartersOperations';
import './HeadquartersOperations.css';

export const headquartersRoutes = [
  { id: 'defence', label: '방위 역량', description: '기술을 선택하고, 생산 역량과 보급을 확보한 뒤 작전에 투입합니다.', rooms: ['research', 'workshop', 'warehouse', 'command'] },
  { id: 'civil', label: '민생·재정', description: '재정 여력과 공장 배분을 함께 살피고, 생활 공급과 보건 상태를 확인합니다.', rooms: ['treasury', 'workshop', 'warehouse', 'infirmary'] },
  { id: 'organization', label: '사람·조직', description: '누구에게 맡길지 정하고, 재정과 대외 조건을 확인한 뒤 조직의 실제 결과를 살핍니다.', rooms: ['personnel', 'treasury', 'diplomacy', 'command'] },
] as const satisfies readonly { id: string; label: string; description: string; rooms: readonly HeadquartersRoomId[] }[];
export type HeadquartersRouteId = 'all' | typeof headquartersRoutes[number]['id'];

export function HeadquartersOperationsRibbon({ routeId, activities, selectedRoom, onRoute, onRoom, postwar }: {
  routeId: HeadquartersRouteId;
  activities: Record<HeadquartersRoomId, HeadquartersActivity>;
  selectedRoom: HeadquartersRoomId;
  onRoute: (id: HeadquartersRouteId) => void;
  onRoom: (id: HeadquartersRoomId) => void;
  postwar: boolean;
}) {
  const route = headquartersRoutes.find(item => item.id === routeId);
  const attention = headquartersRooms.filter(room => activities[room.id].status === 'attention');
  return <section className="hq-operations-ribbon" aria-label="기관을 연결하는 운영 흐름">
    <div className="hq-operations-tabs" role="group" aria-label="운영 흐름 선택"><span><Route size={16} aria-hidden="true" />운영 흐름</span>
      <button type="button" aria-pressed={routeId === 'all'} onClick={() => onRoute('all')}>전체 기관</button>
      {headquartersRoutes.map(item => <button type="button" key={item.id} aria-pressed={routeId === item.id} onClick={() => onRoute(item.id)}>{item.label}</button>)}
    </div>
    {route ? <>
      <p>{route.description}</p>
      <ol className="hq-operation-chain">{route.rooms.map((roomId, index) => {
        const room = headquartersRooms.find(item => item.id === roomId)!; const activity = activities[roomId];
        return <li key={roomId}><button type="button" aria-pressed={selectedRoom === roomId} data-activity={activity.status} onClick={() => onRoom(roomId)}>
          <small>{index + 1}. {activity.label}</small><strong>{postwar ? room.postwarLabel : room.label}</strong><span>{activity.headline}</span>
        </button>{index < route.rooms.length - 1 ? <ArrowRight size={14} aria-hidden="true" /> : null}</li>;
      })}</ol>
      <small className="hq-chain-note">판단 순서를 돕는 연결도입니다. 방 사이 거리나 연결선이 생산 보너스·운송 경로를 만들지는 않습니다.</small>
    </> : <div className="hq-operations-watch"><CircleAlert size={16} aria-hidden="true" /><span>{attention.length ? `확인이 필요한 기관 ${attention.length}곳` : '기관별 현재 상태를 살펴보세요.'}</span>
      {attention.slice(0, 3).map(room => <button type="button" key={room.id} onClick={() => onRoom(room.id)}>{postwar ? room.postwarLabel : room.label}<ArrowRight size={13} aria-hidden="true" /></button>)}
    </div>}
  </section>;
}

export function HeadquartersActivityDetail({ activity }: { activity: HeadquartersActivity }) {
  return <section className="hq-activity-detail" aria-label="선택 기관의 실제 업무">
    <div className="hq-activity-heading" data-activity={activity.status}><span>{activity.label}</span><strong>{activity.headline}</strong></div>
    {activity.progress ? <div className="hq-activity-progress"><label>{activity.progress.label}</label><progress aria-label={activity.progress.label} value={activity.progress.value} max={activity.progress.max} /></div> : null}
    <details><summary>필요조건·진행·결과 확인 경로</summary><dl>{([
      ['필요한 것', activity.inputs], ['지금 처리 중인 것', activity.process], ['결과를 확인할 곳', activity.verify],
    ] as const).map(([label, items]) => <div key={label}><dt>{label}</dt><dd>{items.map((item, index) => <p key={index}>{item}</p>)}</dd></div>)}</dl></details>
  </section>;
}
