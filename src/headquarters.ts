import type { NationalSimulationInput } from './nationalSimulation';
import type { StaffDecisionInput } from './staffDecisions';
import { getStaffAuthorityProfile } from './staffOrganization';
import type { GameTab, StaffDepartment } from './types';

export type HeadquartersRoomId = 'command' | 'research' | 'warehouse' | 'workshop' | 'infirmary' | 'personnel' | 'diplomacy' | 'treasury';
export interface HeadquartersRoom {
  id: HeadquartersRoomId;
  label: string;
  postwarLabel: string;
  department?: StaffDepartment;
  tab: GameTab;
  purpose: string;
  action: string;
}
export const headquartersRooms: readonly HeadquartersRoom[] = [
  { id: 'command', label: '작전 지휘실', postwarLabel: '안보 상황실', department: 'operations', tab: 'map', purpose: '전선과 부대의 현재 상태를 확인하고 작전을 지휘합니다.', action: '작전 지도 열기' },
  { id: 'research', label: '연구실', postwarLabel: '과학기술실', department: 'science', tab: 'research', purpose: '진행 중인 연구와 다음 기술의 조건을 확인합니다.', action: '연구 계획 열기' },
  { id: 'warehouse', label: '군수 창고', postwarLabel: '물류 조정실', department: 'logistics', tab: 'industry', purpose: '보유 장비와 생산·보급 경로를 함께 검토합니다.', action: '군수·보급 열기' },
  { id: 'workshop', label: '생산 관리실', postwarLabel: '산업전환실', department: 'armaments', tab: 'industry', purpose: '공장 배분과 군수·민수 전환을 검토합니다. 설비 그림은 실제 공장 개수가 아닙니다.', action: '생산 조정 열기' },
  { id: 'personnel', label: '참모 인사실', postwarLabel: '공직 인사실', department: 'personnel', tab: 'organization', purpose: '참모 배치·위임·육성과 면담을 관리합니다.', action: '조직 운영 열기' },
  { id: 'diplomacy', label: '정무 연락실', postwarLabel: '정무 외교실', department: 'political', tab: 'diplomacy', purpose: '외교 관계와 협상 조건을 확인합니다.', action: '외교 창구 열기' },
  { id: 'treasury', label: '재정실', postwarLabel: '경제기획실', department: 'economy', tab: 'economy', purpose: '국고·주간 수지·금융 정책을 점검합니다.', action: '재정 보고 열기' },
  { id: 'infirmary', label: '의무·보건실', postwarLabel: '공중보건실', tab: 'health', purpose: '유행과 병상 부담·방역 준비도를 확인합니다. 별도 의료 참모가 있다고 가정하지 않습니다.', action: '보건 보고 열기' },
];

/** Tokens represent current organizational assignment, never a simulated physical location. */
export function getHeadquartersOccupant(room: HeadquartersRoom, input: StaffDecisionInput | null) {
  if (!input || !room.department || !getStaffAuthorityProfile(input.role).visibleDepartments.includes(room.department)) return null;
  return input.staff.find((member) => member.department === room.department) ?? null;
}

const number = (value: number) => Number.isFinite(value) ? Math.round(value).toLocaleString('ko-KR') : '자료 없음';
export function getHeadquartersRoomSignal(room: HeadquartersRoom, input: NationalSimulationInput, issues: number, money: (value: number) => string) {
  switch (room.id) {
    case 'command': return `교전 ${input.divisions.filter((division) => division.status === 'combat').length} · 부대 ${input.divisions.length}`;
    case 'research': return `진행 ${input.research.filter((project) => project.active && !project.complete).length} · 완료 ${input.research.filter((project) => project.complete).length}`;
    case 'warehouse': return `보병 장비 ${number(input.stockpile.infantryEquipment)}`;
    case 'workshop': return `공장 배분 ${number(input.production.reduce((sum, line) => sum + line.assigned, 0))} / ${number(input.game.factories)}`;
    case 'personnel': return Number.isFinite(issues) ? `참모 현안 ${number(issues)}건` : '참모 현안 자료 없음';
    case 'diplomacy': return `정치력 ${number(input.game.politicalPower)}`;
    case 'treasury': return `국고 ${money(input.game.treasury)}`;
    case 'infirmary': return input.publicHealth.activeOutbreak ? `유행 대응 중 · 준비도 ${number(input.publicHealth.preparedness)}` : `진행 중 유행 없음 · 준비도 ${number(input.publicHealth.preparedness)}`;
  }
}
