import { getCampaignYearForWeek } from './campaignCalendar';
import { headquartersRooms } from './headquarters';
import type { HeadquartersRoomId } from './headquarters';
import type { NationalSimulationInput, NationalSimulationSnapshot } from './nationalSimulation';
import { getResearchAvailability } from './researchProgression';
import { getStaffOfficeProblem } from './staffDecisions';
import type { StaffDecisionInput } from './staffDecisions';
import { getStaffContractWeeks } from './staffManagement';
import { getStaffAuthorityProfile } from './staffOrganization';
import { getStaffWorkReport } from './staffWorkReport';
import type { GameState, ResearchProject, StaffMember } from './types';

export interface HeadquartersActivity {
  roomId: HeadquartersRoomId;
  status: 'active' | 'attention' | 'ready' | 'quiet' | 'unknown';
  label: string;
  headline: string;
  inputs: string[];
  process: string[];
  verify: string[];
  progress?: { label: string; value: number; max: number };
}

const labels: Record<HeadquartersActivity['status'], string> = {
  active: '진행 중', attention: '점검 필요', ready: '검토 가능', quiet: '대기·유지', unknown: '기록 확인 필요',
};
const nations = new Set(['britain', 'usa', 'ussr', 'germany', 'japan', 'china', 'india', 'freefrance', 'italy', 'korea', 'vietnam', 'indonesia', 'philippines']);
const archetypes = new Set(['head-of-state', 'cabinet-minister', 'bureau-director', 'regional-command', 'organizer', 'theater-command', 'service-director', 'field-command', 'unit-command', 'agent', 'resistance']);
const statuses = new Set(['sovereign', 'government-in-exile', 'colonized', 'occupied-commonwealth', 'resistance-coalition']);
const gameFields: Array<keyof GameState> = ['week', 'manpower', 'politicalPower', 'fuel', 'steel', 'factories', 'stability', 'warSupport', 'commandPoints', 'treasury', 'victoryScore', 'airPower', 'navalPower', 'intelNetwork', 'enemyPressure'];
const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const nonnegative = (value: unknown): value is number => finite(value) && value >= 0;
const integer = (value: unknown): value is number => nonnegative(value) && Number.isSafeInteger(value);
const stat = (value: unknown): value is number => nonnegative(value) && value <= 100;
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const number = (value: number) => Number(value.toFixed(1)).toLocaleString('ko-KR');
const unique = (items: readonly { id: string }[]) => items.every((item) => item && text(item.id)) && new Set(items.map((item) => item.id)).size === items.length;

function activity(roomId: HeadquartersRoomId, status: HeadquartersActivity['status'], headline: string,
  inputs: string[], process: string[], verify: string[], progress?: HeadquartersActivity['progress']): HeadquartersActivity {
  return { roomId, status, label: labels[status], headline, inputs, process, verify, ...(progress ? { progress } : {}) };
}

function unknown(roomId: HeadquartersRoomId, reason = '현재 자료의 범위나 수치를 확인할 수 없습니다.'): HeadquartersActivity {
  return activity(roomId, 'unknown', '확인된 운영 기록이 필요합니다.', [], [reason], ['최신 보직·국가 보고를 다시 확인하세요. 이 표시는 명령을 실행하지 않습니다.']);
}

function contextProblem(input: NationalSimulationInput, staffInput: StaffDecisionInput | null): string | null {
  if (!input || !input.game || !nations.has(input.nationId) || !integer(input.game.week)
    || !Number.isFinite(getCampaignYearForWeek(input.game.week)) || !['war', 'nation'].includes(input.phase)
    || input.politicalState?.nationId !== input.nationId || input.nationManagement?.nationId !== input.nationId) return '국가·시점 자료가 서로 일치하지 않습니다.';
  if (!staffInput || !staffInput.role || !staffInput.game) return '현재 보직에서 볼 수 있는 운영 범위가 확인되지 않았습니다.';
  const role = staffInput.role;
  if (role.nationId !== input.nationId || staffInput.game.week !== input.game.week || staffInput.campaignPhase !== input.phase
    || gameFields.some((key) => !Object.is(staffInput.game[key], input.game[key]))
    || !text(role.id) || !archetypes.has(role.archetype) || !integer(role.tier) || role.tier < 1 || role.tier > 5
    || !['military', 'politics', 'intelligence'].includes(role.branch) || !stat(role.authority)
    || !statuses.has(staffInput.nationStatus)) return '국가 보고와 현재 보직·주차가 일치하지 않습니다.';
  if (staffInput.busy) return '주간 결산 중입니다. 완료 후 확정된 운영 기록을 확인하세요.';
  return getStaffOfficeProblem(staffInput);
}

function validResearch(project: ResearchProject): boolean {
  return Boolean(project && text(project.id) && text(project.name) && nonnegative(project.progress)
    && finite(project.duration) && project.duration > 0 && project.progress <= project.duration
    && typeof project.active === 'boolean' && typeof project.complete === 'boolean' && !(project.active && project.complete)
    && (project.minimumYear === undefined || integer(project.minimumYear))
    && (project.prerequisites === undefined || (Array.isArray(project.prerequisites) && project.prerequisites.every(text))));
}

function researchActivity(input: NationalSimulationInput): HeadquartersActivity {
  const research = input.research;
  if (!Array.isArray(research) || !research.every(validResearch) || !unique(research)) return unknown('research');
  const year = getCampaignYearForWeek(input.game.week);
  const active = research.filter((project) => project.active && !project.complete);
  if (active.length > 2) return unknown('research', '현재 연구 슬롯 2개보다 진행 과제가 많아 슬롯 기록을 확인해야 합니다.');
  const empty = 2 - active.length;
  const pending = research.filter((project) => !project.active && !project.complete);
  const available = pending.filter((project) => getResearchAvailability(project, research, year).available);
  const blocked = pending.filter((project) => !getResearchAvailability(project, research, year).available);
  const blockedActive = active.filter((project) => !getResearchAvailability(project, research, year).available);
  const status = blockedActive.length ? 'attention' : active.length ? 'active' : empty && available.length ? 'ready' : 'quiet';
  const value = active.reduce((total, project) => total + project.progress, 0);
  const max = active.reduce((total, project) => total + project.duration, 0);
  if (!finite(value) || !finite(max)) return unknown('research');
  return activity('research', status, active.length ? `연구 ${active.length}건 진행 · 빈 슬롯 ${empty}개` : available.length ? `빈 슬롯 ${empty}개 · 조건을 갖춘 과제 ${available.length}건` : '지금 시작 조건을 갖춘 대기 과제가 없습니다.',
    [`현재 ${year}년 · 완료 ${research.filter((project) => project.complete).length}건`, `연구 슬롯 ${active.length} / 2 · 시작 조건 충족 ${available.length}건`],
    [...active.map((project) => `${project.name}: 기록된 작업량 ${number(project.progress)} / ${number(project.duration)}${blockedActive.includes(project) ? ' · 선행·시대 조건 재확인 필요' : ''}`),
      ...(empty ? [available.length ? '빈 슬롯의 과제를 고른 뒤 보직 권한과 최종 시작 조건을 검토합니다.' : '빈 슬롯만으로 긴급 과제는 아닙니다. 시대·선행 연구 조건을 확인합니다.'] : ['현재 두 슬롯 모두 사용 중입니다.']),
      ...blocked.slice(0, 2).map((project) => `${project.name}: ${getResearchAvailability(project, research, year).reason}`)],
    ['다음 주 진행 후 연구 작업량·완료 표시를 비교합니다. 진행 속도에 따라 달라지며 완료 날짜를 보장하지 않습니다.'],
    active.length ? { label: active.length === 1 ? active[0].name : '진행 과제 누적 작업량', value, max } : undefined);
}

function workshopActivity(input: NationalSimulationInput, snapshot: NationalSimulationSnapshot): HeadquartersActivity {
  const lines = input.production;
  if (!integer(input.game.factories) || !Array.isArray(lines) || !unique(lines)
    || lines.some((line) => !text(line.name) || !integer(line.assigned) || !stat(line.efficiency) || !nonnegative(line.output))) return unknown('workshop');
  const assigned = lines.reduce((total, line) => total + line.assigned, 0);
  if (!integer(assigned) || assigned > input.game.factories) return unknown('workshop', '공장 배정 합계가 전체 공장 수를 초과합니다. 생산 배정 기록을 확인하세요.');
  const spare = input.game.factories - assigned;
  const working = lines.filter((line) => line.assigned > 0);
  const weighted = assigned ? working.reduce((total, line) => total + line.efficiency * line.assigned, 0) / assigned : null;
  if (weighted !== null && !stat(weighted)) return unknown('workshop');
  if (!Array.isArray(snapshot?.goods)) return unknown('workshop', '민수 공급 산출 자료를 확인할 수 없습니다.');
  const consumer = snapshot.goods.filter((good) => good?.id === 'consumer');
  if (consumer.length > 1 || consumer.some((good) => !stat(good.availability))) return unknown('workshop', '민수 공급 산출 자료를 확인할 수 없습니다.');
  return activity('workshop', working.some((line) => line.efficiency < 40) ? 'attention' : assigned ? 'active' : input.game.factories ? 'ready' : 'quiet',
    `군수 ${number(assigned)} / ${number(input.game.factories)}개 · 민수 여력 ${number(spare)}개`,
    [`가동 배정 라인 ${working.length}개`, weighted === null ? '군수 배정 효율: 가동 라인 없음' : `배정 공장 가중 효율 ${number(weighted)}%`],
    [`미배정 ${number(spare)}개는 민수 공급 여력으로 산정합니다.`,
      ...(consumer.length ? [`국가 현황의 소비재 공급 지표 ${number(consumer[0].availability)} / 100 · 납품 수량이 아닙니다.`] : []),
      '생산력 전망은 배치·효율 기준입니다. 정책·조달·원료·수송 조건이 실제 입고를 바꿉니다.'],
    ['생산 조정 검토에서 전환안을 비교합니다. 다음 주 생산·입고 기록과 가용 비축을 구분해 확인하세요.'],
    input.game.factories > 0 ? { label: '전체 공장 중 군수 배정', value: assigned, max: input.game.factories } : undefined);
}

function validDivisions(input: NationalSimulationInput): boolean {
  return Array.isArray(input.divisions) && unique(input.divisions) && input.divisions.every((division) =>
    [division.strength, division.organization, division.supply].every(stat) && ['ready', 'moving', 'combat', 'recovering'].includes(division.status));
}

function warehouseActivity(input: NationalSimulationInput): HeadquartersActivity {
  const stock = input.stockpile;
  if (!stock || !Object.values(stock).every(nonnegative) || ![stock.infantryEquipment, stock.tanks, stock.aircraft, stock.convoys, stock.artillery, stock.trucks].every(nonnegative)
    || !validDivisions(input)) return unknown('warehouse');
  const low = input.divisions.filter((division) => division.supply < 60).length;
  return activity('warehouse', low ? 'attention' : input.divisions.length ? 'ready' : 'quiet',
    input.divisions.length ? `보급 60 미만 ${low} / ${input.divisions.length}개 부대` : '현재 등록된 부대가 없습니다.',
    [`보병 장비 ${number(stock.infantryEquipment)} · 포 ${number(stock.artillery)} · 전차 ${number(stock.tanks)}`,
      `항공기 ${number(stock.aircraft)} · 수송선 ${number(stock.convoys)} · 트럭 ${number(stock.trucks)}`],
    [low ? '가용 비축과 별개로 현장 보급이 낮은 부대가 있습니다. 수송 경로·배분을 점검합니다.' : '현재 부대 보급 지표에서 60 미만인 부대는 없습니다.',
      '창고·수송 중 물량은 국가 가용 비축과 다릅니다. 비축만으로 모든 부대의 장비 충족을 단정하지 않습니다.'],
    ['물류 현장의 실제 입고·배달 기록과 다음 주 부대 보급 지표를 함께 확인하세요.']);
}

function commandActivity(input: NationalSimulationInput): HeadquartersActivity {
  if (!validDivisions(input)) return unknown('command');
  const divisions = input.divisions;
  const combat = divisions.filter((division) => division.status === 'combat').length;
  const moving = divisions.filter((division) => division.status === 'moving').length;
  const recovering = divisions.filter((division) => division.status === 'recovering').length;
  const strained = divisions.filter((division) => division.strength < 60 || division.organization < 55 || division.supply < 60).length;
  return activity('command', strained ? 'attention' : combat || moving ? 'active' : divisions.length ? 'ready' : 'quiet',
    `교전 ${combat} · 이동 ${moving} · 회복 ${recovering}`,
    [`등록 부대 ${divisions.length}개 · 상태가 준비인 부대 ${divisions.filter((division) => division.status === 'ready').length}개`, `전력·조직·보급 기준 점검 대상 ${strained}개`],
    ['점검 기준: 전력 60 미만, 조직력 55 미만, 보급 60 미만 중 하나 이상.', '준비 상태는 승리 보장이 아닙니다. 지도에서 위치·명령·접촉과 보급을 함께 확인합니다.'],
    ['다음 주 작전·전투 기록을 확인하세요. 교전 종료나 목적지 도착 주차를 이 집계만으로 보장하지 않습니다.']);
}

function validStaff(member: StaffMember): boolean {
  return Boolean(member && text(member.id) && text(member.personId) && stat(member.workload)
    && (member.contractWeeksRemaining === undefined || integer(member.contractWeeksRemaining)));
}

function personnelActivity(input: NationalSimulationInput, staffInput: StaffDecisionInput, staffIssues: number): HeadquartersActivity {
  if (!Array.isArray(staffInput.staff)) return unknown('personnel');
  const visibleDepartments = getStaffAuthorityProfile(staffInput.role).visibleDepartments;
  const visible = staffInput.staff.filter((member) => member && visibleDepartments.includes(member.department));
  if (!visible.every(validStaff) || !unique(visible) || new Set(visible.map((member) => member.personId)).size !== visible.length
    || new Set(visible.map((member) => member.department)).size !== visible.length || !integer(staffIssues)) return unknown('personnel');
  const loaded = visible.filter((member) => member.workload >= 80).length;
  const expiring = visible.filter((member) => getStaffContractWeeks(member) <= 13).length;
  const reports = visible.map((member) => getStaffWorkReport(member, input.nationId, input.game.week, staffInput.developmentFocusId));
  const actual = reports.filter((report) => report.status === 'available' && report.ageWeeks === 0).length;
  const past = reports.filter((report) => report.status === 'available' && report.ageWeeks > 0).length;
  const invalid = reports.filter((report) => report.status === 'invalid').length;
  // The supplied issue count has no participant scope. Never reveal it for a partial staff view.
  const allVisible = visible.length === staffInput.staff.length;
  return activity('personnel', loaded || expiring || invalid || (allVisible && staffIssues > 0) ? 'attention' : visible.length ? 'ready' : 'quiet',
    `표시 가능한 참모 ${visible.length}명 · 과로 점검 ${loaded}명 · 계약 점검 ${expiring}명`,
    [`과로 기준 업무량 80 이상 · 계약 점검 잔여 13주 이하`, ...(allVisible ? [`현재 조직 현안 ${staffIssues}건`] : ['권한 밖 참모와 전체 조직 현안 수는 이 집계에서 제외합니다.'])],
    [`현재 주차 확정 결산 ${actual}명 · 이전 결산 ${past}명 · 기록 확인 필요 ${invalid}명`,
      '실제 결산은 업무·계약·기본관계 이후 조직 사건까지 반영한 기록입니다. 업무 속도 전망과 구분합니다.',
      '보고 가능한 참모와 직접 지시할 수 있는 참모는 다릅니다. 배치·위임·면담은 별도 권한 검토를 거칩니다.'],
    ['참모 업무표에서 개인별 확정 전후 수치를 확인하고 다음 주 결산과 비교하세요. 기록이 없는 사람의 성과는 추정하지 않습니다.']);
}

function treasuryActivity(input: NationalSimulationInput, formatMoney: (value: number) => string): HeadquartersActivity {
  const economy = input.economy;
  if (!economy || !nonnegative(input.game.treasury) || !nonnegative(economy.debt) || !stat(economy.inflation) || !stat(economy.publicConfidence)) return unknown('treasury');
  const ledger = economy.lastLedger;
  if (ledger && (!integer(ledger.week) || ledger.week > input.game.week || !finite(ledger.netTreasuryChange)
    || ![ledger.operatingRevenue, ledger.financingRaised, ledger.totalExpenses].every(nonnegative))) return unknown('treasury', '재정 결산의 주차·금액을 확인할 수 없습니다.');
  const money = (value: number) => { try { const result = formatMoney(value); return text(result) ? result : null; } catch { return null; } };
  const treasury = money(input.game.treasury);
  const debt = money(economy.debt);
  const balance = ledger ? money(ledger.netTreasuryChange) : null;
  if (!treasury || !debt || (ledger && !balance)) return unknown('treasury', '현재 표시 통화의 금액을 확인할 수 없습니다.');
  return activity('treasury', input.game.treasury === 0 || economy.inflation >= 20 || economy.publicConfidence < 40 ? 'attention' : 'ready',
    `현재 국고 ${treasury}`,
    [`현재 부채 ${debt}`, `물가 상승률 ${number(economy.inflation)}% · 경제 신뢰 ${number(economy.publicConfidence)} / 100`],
    [ledger ? `보관된 제${ledger.week + 1}주 재정 결산 수지 ${balance} · 현재 표시 통화` : '아직 확인된 주간 재정 결산이 없습니다.',
      ...(ledger ? ['보관 결산에는 국가·진행 단계 식별이 없어 참고 자료로만 표시합니다. 현재 단계의 성과나 현재 적자를 뜻하지 않습니다.'] : []),
      '국고 현재값, 보관된 재정 결산, 다음 주 전망은 서로 다릅니다. 이 화면은 새 차입·투자를 집행하지 않습니다.'],
    ['재정 보고에서 실제 세입·차입·지출 내역을 확인하고 다음 결산과 비교하세요.']);
}

function infirmaryActivity(input: NationalSimulationInput): HeadquartersActivity {
  const health = input.publicHealth;
  if (!health || !stat(health.preparedness) || !stat(health.medicalCapacity)) return unknown('infirmary');
  const outbreak = health.activeOutbreak;
  if (outbreak && (!text(outbreak.codeName) || !integer(outbreak.detectedWeek) || outbreak.detectedWeek > input.game.week
    || !nonnegative(outbreak.hospitalLoad) || !nonnegative(outbreak.weeklyCases))) return unknown('infirmary');
  if (outbreak === undefined) return unknown('infirmary');
  return activity('infirmary', outbreak ? outbreak.hospitalLoad >= 90 ? 'attention' : 'active' : health.preparedness < 40 ? 'attention' : 'quiet',
    outbreak ? `${outbreak.codeName} · 현재 유행 대응 중` : '현재 진행 중인 유행 없음',
    [`방역 준비도 ${number(health.preparedness)} / 100 · 의료 역량 ${number(health.medicalCapacity)} / 100`,
      ...(outbreak ? [`현재 병상 부담 ${number(outbreak.hospitalLoad)}% · 최근 주간 사례 ${number(outbreak.weeklyCases)}건`] : [])],
    [outbreak ? '유행과 병상 부담은 현재 보건 엔진 기록입니다. 정책 효과는 다음 진행에서 확인합니다.' : '진행 중 유행이 없어도 감시·비축·의료 대비를 점검할 수 있습니다.', '별도 의사 인물의 활동이나 치료 완료 인원을 추정하지 않습니다.'],
    ['보건 보고의 다음 주 사례·병상 부담·준비도와 정책 비용을 함께 확인하세요. 유행 종료일을 보장하지 않습니다.']);
}

/** Read-only summaries of current facts, not action permissions, simulated work or new effects. */
export function buildHeadquartersOperations(input: NationalSimulationInput, snapshot: NationalSimulationSnapshot,
  staffInput: StaffDecisionInput | null, staffIssues: number, formatMoney: (value: number) => string): Record<HeadquartersRoomId, HeadquartersActivity> {
  const problem = contextProblem(input, staffInput);
  if (problem || !staffInput) return Object.fromEntries(headquartersRooms.map((room) => [room.id, unknown(room.id, problem ?? undefined)])) as Record<HeadquartersRoomId, HeadquartersActivity>;
  return {
    research: researchActivity(input), workshop: workshopActivity(input, snapshot), warehouse: warehouseActivity(input),
    command: commandActivity(input), personnel: personnelActivity(input, staffInput, staffIssues), treasury: treasuryActivity(input, formatMoney),
    infirmary: infirmaryActivity(input),
    diplomacy: nonnegative(input.game.politicalPower) ? activity('diplomacy', 'ready', '외교 창구에서 관계·조건을 확인합니다.',
      [`현재 정치력 ${number(input.game.politicalPower)}`], ['정치력은 사용 가능한 국가 자원입니다. 이 값만으로 협상 성공률·상대국의 수락 여부를 계산하지 않습니다.',
        '구체적인 제안·조약·통행권은 외교 창구의 현재 대상과 승인 절차를 따릅니다.'], ['외교 창구에서 실제 제안 상태와 상대의 응답·조약 기록을 확인하세요.']) : unknown('diplomacy'),
  };
}
