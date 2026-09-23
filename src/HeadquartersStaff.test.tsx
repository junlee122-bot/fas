import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createCareerState, createStaffRoster, getNation, getRole } from './campaign';
import { createStaffNarrativeState } from './staffNarrative';
import type { StaffStoryline } from './staffNarrative';
import { getStaffAuthorityProfile, getStaffSeatTitle } from './staffOrganization';
import { projectStaffWorkWeek } from './staffWork';
import { HeadquartersStaffInspector, HeadquartersStaffTable, getHeadquartersStaffAccess, getHeadquartersStaffNarrative } from './HeadquartersStaff';
import type { HeadquartersStaffProps } from './HeadquartersStaff';

function fixture(roleId = 'britain-tier1'): HeadquartersStaffProps {
  const role = getRole(roleId, 'britain');
  const staff = createStaffRoster('britain', role.id).map((member) => ({ ...member, workPriority: 'normal' as const, workload: 50,
    contractWeeksRemaining: 20, morale: 68, roleSatisfaction: 74, lastMeetingWeek: 1,
  }));
  return {
    context: { input: {
      game: { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30, stability: 78,
        warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 },
      role, staff, developmentFocusId: null, campaignPhase: 'war', nationStatus: getNation('britain').status,
      career: createCareerState('britain', role.id), affiliationStatus: 'serving',
    }, formatMoney: (amount) => `${amount} 파운드`, onUpgradeStaff: vi.fn(), onRenewStaff: vi.fn(), onAssignStaff: vi.fn() },
    selectedStaffIdentity: { id: staff[0].id, personId: staff[0].personId },
    staffNarrative: createStaffNarrativeState(staff), onSelectStaff: vi.fn(), onToggleDelegation: vi.fn(),
    onSetDevelopmentFocus: vi.fn(), onSetWorkPriority: vi.fn(), onMeetStaff: vi.fn(), onOpenOrganization: vi.fn(),
  };
}

describe('Headquarters staff work assignments', () => {
  it('renders real people and five scoped columns without executing engine callbacks', () => {
    const props = fixture(); const before = JSON.stringify(props.context.input);
    const html = renderToStaticMarkup(<HeadquartersStaffTable {...props} />);
    expect(html).toContain('참모 업무표'); expect(html).toContain('다음 주 결산');
    expect(html.match(/<th scope="col"/g)).toHaveLength(5);
    for (const member of props.context.input!.staff) {
      expect(html).toContain(member.name); expect(html).toContain(`data-staff-person="${member.personId}"`);
    }
    expect(html).toContain('업무 속도'); expect(html).toContain('집중 업무'); expect(html).toContain('부담 경감');
    expect(html).toContain('생산량·연구량을 직접 증폭하지 않습니다');
    expect(props.onSetWorkPriority).not.toHaveBeenCalled(); expect(props.context.onAssignStaff).not.toHaveBeenCalled();
    expect(JSON.stringify(props.context.input)).toBe(before);
  });

  it('uses the actual next-week engine projection and saved priority', () => {
    const props = fixture(); const member = props.context.input!.staff[0];
    member.workPriority = 'recovery'; props.context.input!.developmentFocusId = member.id;
    const projection = projectStaffWorkWeek(member, true);
    const html = renderToStaticMarkup(<HeadquartersStaffTable {...props} />);
    expect(html).toContain('value="recovery" selected=""');
    expect(html).toContain(` → ${Math.round(projection.workload * 10) / 10}`);
    expect(html).toContain(`${member.name} 현재 업무 부담`); expect(html).toContain('육성 중');
  });

  it('retains readable upper-authority staff while disabling their controls', () => {
    const props = fixture('britain-tier2');
    const input = props.context.input!;
    const managed = getStaffAuthorityProfile(input.role).managedDepartments;
    const outside = input.staff.find((member) => !managed.includes(member.department))!;
    expect(outside).toBeDefined();
    expect(getHeadquartersStaffAccess(props.context, outside)).toMatchObject({ allowed: false });
    props.selectedStaffIdentity = { id: outside.id, personId: outside.personId };
    const html = renderToStaticMarkup(<HeadquartersStaffInspector {...props} />);
    expect(html).toContain(outside.name); expect(html).toContain('상급기관 관할');
    expect(html).toContain('disabled=""');
    expect(props.onMeetStaff).not.toHaveBeenCalled();
  });

  it('blocks every staff command during weekly resolution or dismissal', () => {
    const props = fixture(); const input = props.context.input!;
    input.busy = true;
    expect(getHeadquartersStaffAccess(props.context, input.staff[0])).toMatchObject({ allowed: false, reason: expect.stringContaining('시간 진행') });
    input.busy = false; input.affiliationStatus = 'dismissed';
    for (const member of input.staff) expect(getHeadquartersStaffAccess(props.context, member).allowed).toBe(false);
    const html = renderToStaticMarkup(<HeadquartersStaffInspector {...props} />);
    expect(html).toContain('공식 보직에서 이탈');
  });

  it('never substitutes a successor with the same seat id for the selected historical person', () => {
    const props = fixture(); props.selectedStaffIdentity!.personId = 'former-office-holder';
    const html = renderToStaticMarkup(<HeadquartersStaffInspector {...props} />);
    expect(html).toContain('현재 명부에서 찾을 수 없습니다');
    expect(html).toContain('후임자에게 명령하지 않습니다');
    expect(html).not.toContain('보직 재배치');
  });

  it('has useful empty states without pretending that national staff exist', () => {
    const props = fixture(); props.selectedStaffIdentity = null;
    expect(renderToStaticMarkup(<HeadquartersStaffInspector {...props} />)).toContain('참모를 선택하십시오');
    props.context.input = null;
    expect(renderToStaticMarkup(<HeadquartersStaffTable {...props} />)).toContain('인사 기록을 연결하지 못했습니다');
  });

  it('shows contemporary seat titles, real costs and explicit review before any reassignment', () => {
    const props = fixture(); const input = props.context.input!; input.campaignPhase = 'nation';
    const member = input.staff[0];
    const html = renderToStaticMarkup(<HeadquartersStaffInspector {...props} />);
    expect(html).toContain(getStaffSeatTitle(member.department, 'nation', input.nationStatus));
    expect(html).toContain('재배치 검토 · 아직 적용하지 않음');
    expect(html).toContain('면담 실행 · 정치력 3');
    expect(html).toContain('잔여 계약 20주'); expect(html).toContain('실물 사진이 아니며');
    expect(props.context.onAssignStaff).not.toHaveBeenCalled();
  });

  it('uses the correct Korean particle for each current swap counterpart', () => {
    const props = fixture(); const staff = props.context.input!.staff;
    staff[1].name = '올리버 리틀턴'; staff[2].name = '앨런 튜링'; staff[3].name = '마리 퀴리';
    const html = renderToStaticMarkup(<HeadquartersStaffInspector {...props} />);
    expect(html).toContain('올리버 리틀턴과 교대');
    expect(html).toContain('앨런 튜링과 교대');
    expect(html).toContain('마리 퀴리와 교대');
    expect(html).not.toContain('리틀턴와 교대'); expect(html).not.toContain('튜링와 교대');
  });

  it('rejects old relationships belonging to a previous holder of a seat', () => {
    const props = fixture(); const roster = props.context.input!.staff; const member = roster[0];
    const linked = props.staffNarrative.bonds.find((bond) => bond.firstPersonId === member.personId || bond.secondPersonId === member.personId)!;
    expect(linked).toBeDefined();
    const normal = getHeadquartersStaffNarrative(member, props.staffNarrative, roster);
    expect(normal.bonds).toContain(linked);
    linked.firstPersonId = 'a-former-holder';
    expect(getHeadquartersStaffNarrative(member, props.staffNarrative, roster).bonds).not.toContain(linked);
  });

  it('hides a two-person current storyline if the unselected participant has been replaced', () => {
    const props = fixture(); const roster = props.context.input!.staff; const [first, second] = roster;
    const story: StaffStoryline = { id: 'paired-story', kind: 'policy-feud', stage: 'private', title: '두 참모의 이견',
      summary: '당시 두 당사자의 이견입니다.', question: '조정하시겠습니까?', trigger: '의견 대립', stakes: '조직 신뢰',
      firstStaffId: first.id, firstPersonId: first.personId, secondStaffId: second.id, secondPersonId: second.personId,
      createdWeek: 8, deadlineWeek: 10, publicRisk: 20, escalationCount: 0,
      cause: { source: 'internal-state', evidenceId: null, week: 8, description: '당시 당사자의 상태' },
    };
    props.staffNarrative.activeStorylines = [story];
    expect(getHeadquartersStaffNarrative(first, props.staffNarrative, roster).stories).toContain(story);
    const changedRoster = roster.map((member) => member.id === second.id ? { ...member, personId: 'replacement-person' } : member);
    expect(getHeadquartersStaffNarrative(first, props.staffNarrative, changedRoster).stories).toEqual([]);
    props.context.input!.staff = changedRoster;
    const html = renderToStaticMarkup(<HeadquartersStaffInspector {...props} />);
    expect(html).not.toContain('두 참모의 이견');
    expect(html).toContain('미해결 현안이 없습니다');
  });

  it('retains a valid solo storyline without requiring a second participant', () => {
    const props = fixture(); const roster = props.context.input!.staff; const member = roster[0];
    const story: StaffStoryline = { id: 'solo-story', kind: 'confidence-crisis', stage: 'private', title: '신뢰 회복 요청',
      summary: '본인의 신뢰 문제입니다.', question: '면담하시겠습니까?', trigger: '사기 저하', stakes: '개인 신뢰',
      firstStaffId: member.id, firstPersonId: member.personId, createdWeek: 8, deadlineWeek: 10, publicRisk: 0, escalationCount: 0,
      cause: { source: 'internal-state', evidenceId: null, week: 8, description: '당사자의 사기' },
    };
    props.staffNarrative.activeStorylines = [story];
    expect(getHeadquartersStaffNarrative(member, props.staffNarrative, roster).stories).toEqual([story]);
    expect(renderToStaticMarkup(<HeadquartersStaffInspector {...props} />)).toContain('신뢰 회복 요청');
    const replacement = { ...member, personId: 'successor' };
    expect(getHeadquartersStaffNarrative(replacement, props.staffNarrative, [replacement, ...roster.slice(1)]).stories).toEqual([]);
  });

  it('keeps delegation caps and permits withdrawing an existing delegation', () => {
    const props = fixture(); const input = props.context.input!;
    input.role = { ...input.role, tier: 3, archetype: 'bureau-director', branch: 'military' }; input.career = undefined;
    const departments = getStaffAuthorityProfile(input.role).managedDepartments;
    const managed = input.staff.filter((member) => departments.includes(member.department));
    managed.forEach((member, index) => { member.delegated = index < 3; });
    expect(getHeadquartersStaffAccess(props.context, managed[3]).delegationReason).toContain('위임 한도');
    expect(getHeadquartersStaffAccess(props.context, managed[0]).delegationReason).toBeNull();
  });
});
