import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { OrganizationPanel, type OrganizationPanelProps } from './OrganizationPanel';
import { createCampaignDivisions, createCampaignProduction, createStaffCandidates, createStaffRoster, getNation, getRole } from './campaign';
import { createStaffNarrativeState } from './staffNarrative';
import { getStaffAuthorityProfile } from './staffOrganization';

function fixture(): OrganizationPanelProps {
  const nation = getNation('britain');
  const role = getRole('britain-tier1', nation.id);
  const staff = createStaffRoster(nation.id, role.id);
  return {
    nation, role, staff, campaignPhase: 'nation',
    game: { week: 8, manpower: 1280, politicalPower: 86, fuel: 74, steel: 112, factories: 30, stability: 78, warSupport: 84, commandPoints: 42, treasury: 920, victoryScore: 38, airPower: 57, navalPower: 52, intelNetwork: 64, enemyPressure: 68 },
    careerReputation: 45, careerOfferCount: 0, careerStatusLabel: '정상 재직',
    candidates: createStaffCandidates(nation.id, role.id).slice(0, 3),
    divisions: createCampaignDivisions(nation), commanders: [], production: createCampaignProduction(nation),
    stockpile: { infantryEquipment: 1000, tanks: 200, aircraft: 150, artillery: 90, trucks: 30, convoys: 20 },
    supplyPolicy: 'balanced', procurementFocusId: 'rifle', priorityDivisionId: 'britain-formation-1', selectedPolicies: [], developmentFocusId: null,
    staffNarrative: createStaffNarrativeState(staff, 8), formatMoney: (amount) => `£${amount}`,
    onMeetStaff: vi.fn(), onToggleDelegation: vi.fn(), onAssignStaff: vi.fn(), onSetPriorityDivision: vi.fn(),
    onSetProcurementFocus: vi.fn(), onSetSupplyPolicy: vi.fn(), onSelectPolicy: vi.fn(), onSetDevelopmentFocus: vi.fn(),
    onUpgradeStaff: vi.fn(), onScoutCandidate: vi.fn(), onToggleShortlist: vi.fn(), onApproachCandidate: vi.fn(),
    onRecruitCandidate: vi.fn(), onRenewStaff: vi.fn(), onResolveStaffNarrative: vi.fn(), onOpenCareerMarket: vi.fn(),
  };
}

function render(props = fixture()) {
  const before = JSON.stringify(props);
  const html = renderToStaticMarkup(<OrganizationPanel {...props} />);
  expect(JSON.stringify(props)).toBe(before);
  Object.values(props).filter((value) => vi.isMockFunction(value)).forEach((callback) => expect(callback).not.toHaveBeenCalled());
  return html;
}

function button(html: string, label: string) {
  return [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].find(([markup]) => markup.replace(/<[^>]+>/g, '').includes(label))?.[0] ?? '';
}

describe('OrganizationPanel Command Edition workspace contract', () => {
  it('defaults to a current-person squad with exactly one detailed dossier, not all planning boards', () => {
    const props = fixture();
    const html = render(props);
    expect(html).toContain('workspace-squad');
    expect(html).toContain('aria-label="현재 참모 명단"');
    expect(html.match(/class="org-roster-person /g)).toHaveLength(props.staff.length);
    expect(html.match(/class="org-person-detail"/g)).toHaveLength(1);
    expect(html).toContain(`${props.staff[0].name} 참모 상세`);
    expect(html).not.toContain('class="staff-planner-layout"');
    expect(html).not.toContain('class="staff-responsibility-board"');
    expect(html).not.toContain('class="staff-dynamics-board"');
    expect(html).not.toContain('role="table"');
    expect(html).not.toContain('<img');
    expect(html.indexOf('class="org-squad-layout"')).toBeLessThan(html.indexOf('org-authority-disclosure'));
    expect(html.indexOf('class="org-squad-layout"')).toBeLessThan(html.indexOf('org-briefing-disclosure'));
    expect(button(html, '명단·개인 관리')).toContain('aria-pressed="true"');
    expect(button(html, '보직 배치')).toContain('aria-pressed="false"');
  });

  it('keeps diagnosis, historical authority and all operational settings available but initially folded', () => {
    const html = render();
    for (const section of ['org-authority-disclosure', 'org-briefing-disclosure', 'org-operations-disclosure']) {
      expect(html).toContain(`<details class="org-disclosure ${section}">`);
      expect(html).not.toContain(`class="org-disclosure ${section}" open`);
    }
    for (const label of ['이번 주 참모진 브리핑', '핵심 편제', '조달 우선순위', '보급 운영', '국가 운영 원칙', '책임 위임', '분위기·계약']) expect(html).toContain(label);
    expect(html).toContain('인물 선택과 상세 열람에는 비용이나 성과 보상이 없습니다');
    expect(button(html, '면담 의제 선택')).not.toContain('disabled');
    expect(button(html, '육성 대상으로 지정')).not.toContain('disabled');
  });

  it('obeys the controlled market workspace and leaves outer navigation ownership to the parent', () => {
    const props = { ...fixture(), workspace: 'market' as const, hideWorkspaceNavigation: true, onWorkspaceChange: vi.fn() };
    const html = render(props);
    expect(html).toContain('workspace-market');
    expect(html).not.toContain('aria-label="조직 운영 작업공간"');
    expect(html).not.toContain('class="org-roster"');
    expect(html).not.toContain('org-operations-disclosure');
    expect(html).toContain('후보 시장');
    expect(button(html, '내 국제 경력')).not.toBe('');
    expect(html).toContain('정상 재직 · 제안 0건');
    expect(html.match(/<select/g)).toHaveLength(3);
    expect(html).toContain('후보 이름·직책·기관·전문 분야 검색');
    expect(html.indexOf('class="candidate-grid"')).toBeLessThan(html.indexOf('org-market-guide'));
  });

  it('retains all candidate actions and known historical information behind per-candidate details', () => {
    const props = fixture();
    const candidate = { ...props.candidates[0], knowledge: 85, status: 'unscouted' as const };
    const html = render({ ...props, workspace: 'market', candidates: [candidate] });
    expect(html).toContain(candidate.name);
    expect(html).toContain('class="org-candidate-more"');
    expect(html).toContain('경력·영입 조건과 빠른 조치');
    expect(html).toContain('임명은 조건 합의 후');
    expect(html).toContain('조사 2PP · 접촉 4PP');
    for (const label of ['조사 보고서', '조사', '관심', '접촉', '협상']) expect(button(html, label)).not.toBe('');
    expect(html).toContain(`£${candidate.signingCost}`);
    expect(html).toContain(`£${candidate.weeklyCost}`);
    expect(html).not.toContain('class="candidate-report"');
    expect(html).toContain('후보 선택·보고서 열람에는 비용이나 성과 보상이 없습니다');
  });

  it('distinguishes each candidate dossier action by the real candidate name', () => {
    const props = { ...fixture(), workspace: 'market' as const };
    const html = render(props);
    for (const candidate of props.candidates) {
      expect(html).toContain(`aria-label="${candidate.name} 조사 보고서"`);
    }
    expect(html.match(/class="open-candidate-report"/g)).toHaveLength(props.candidates.length);
    expect(html).not.toContain('aria-label="조사 보고서"');
  });

  it('does not invent a departed or replacement person when the current roster is empty', () => {
    const props = fixture();
    const html = render({ ...props, staff: [], onOpenDeliveryPledges: vi.fn() });
    expect(html).toContain('선택할 재직자가 없습니다');
    expect(html).toContain('없는 인물을 대신 표시하지 않습니다');
    expect(html).not.toContain('class="org-roster-person');
    expect(html).not.toContain('참모의 이행 약속 열기');
    expect(html).not.toContain(`${props.staff[0].name} 참모 상세`);
    expect(html).toMatch(/<select aria-label="참모 선택"[^>]*disabled=""/);
  });

  it('provides a labelled native mobile staff picker bound to the same current detail selection', () => {
    const props = fixture();
    const html = render(props);
    const picker = html.match(/<label class="org-mobile-staff-picker">[\s\S]*?<\/label>/)?.[0] ?? '';
    expect(picker).toContain('aria-label="참모 선택"');
    const detailId = html.match(/class="org-person-detail" id="([^"]+)"/)?.[1];
    expect(picker).toContain(`aria-controls="${detailId}"`);
    expect(picker).toContain(`<option value="${props.staff[0].id}" selected="">`);
    expect(picker.match(/<option /g)).toHaveLength(props.staff.length);
    for (const member of props.staff) expect(picker).toContain(member.name);
    expect(html.indexOf('org-mobile-staff-picker')).toBeLessThan(html.indexOf('class="org-person-detail"'));
  });

  it('only exposes the delivery pledge route for directly managed national-phase staff when provided', () => {
    const props = { ...fixture(), onOpenDeliveryPledges: vi.fn() };
    expect(button(render(props), '이 참모의 이행 약속 열기')).not.toBe('');
    expect(render({ ...props, campaignPhase: 'war' })).not.toContain('참모의 이행 약속 열기');
    expect(render({ ...props, onOpenDeliveryPledges: undefined })).not.toContain('참모의 이행 약속 열기');
    const role = { ...props.role, tier: 5 as const, branch: 'military' as const, archetype: 'unit-command' as const };
    const authority = getStaffAuthorityProfile(role);
    const staff = props.staff.filter((member) => !authority.managedDepartments.includes(member.department));
    const html = render({ ...props, role, staff });
    expect(html).toContain('열람 전용');
    expect(html).not.toContain('참모의 이행 약속 열기');
    const actions = html.match(/<div class="org-person-actions"[\s\S]*?<\/div>/)?.[0] ?? '';
    for (const markup of actions.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) ?? []) {
      if (!markup.includes('보직 배치 비교')) expect(markup).toContain('disabled');
    }
    expect(button(actions, '면담 의제 선택')).not.toBe('');
  });

  it('preserves the existing development and renewal eligibility conditions in the personal dossier', () => {
    const props = fixture();
    const readyStaff = { ...props.staff[0], development: 100, grade: 2 as const, contractWeeksRemaining: 3 };
    const html = render({ ...props, staff: [readyStaff] });
    expect(button(html, '승급')).not.toContain('disabled');
    expect(button(html, '재계약 · 4PP')).not.toContain('disabled');
    const poor = render({ ...props, staff: [readyStaff], game: { ...props.game, politicalPower: 0, treasury: 0 } });
    expect(button(poor, '재계약 · 4PP')).toContain('disabled');
    const mature = render({ ...props, staff: [{ ...readyStaff, grade: 3 }] });
    expect(button(mature, '승급')).toContain('disabled');
  });

  it('shows the next current staff member rather than historical fallback staff in a partial roster', () => {
    const props = fixture();
    const staff = props.staff.slice(2, 3);
    const html = render({ ...props, staff });
    expect(html).toContain(`${staff[0].name} 참모 상세`);
    expect(html).not.toContain(`${props.staff[0].name} 참모 상세`);
    expect(html.match(/class="org-roster-person /g)).toHaveLength(1);
  });

  it('keeps authority outside candidates investigable but does not expose a legal appointment action', () => {
    const props = fixture();
    const role = { ...props.role, tier: 5 as const, branch: 'military' as const, archetype: 'unit-command' as const };
    const candidate = { ...props.candidates[0], department: 'economy' as const, knowledge: 90, status: 'unscouted' as const };
    const html = render({ ...props, role, workspace: 'market', candidates: [candidate] });
    expect(html).toContain('임명 권한 없음');
    const actions = html.match(/<div class="candidate-actions"[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(button(actions, '협상')).toContain('disabled');
    expect(button(actions, '조사')).not.toContain('disabled');
  });

  it('separates active investigation assignments from interest tracking and completed reports', () => {
    const props = fixture();
    const [first, second, third] = props.candidates;
    const html = render({ ...props, workspace: 'market', onStopScouting: vi.fn(), candidates: [
      { ...first, status: 'scouting', knowledge: 40, shortlisted: true },
      { ...second, status: 'scouting', knowledge: 100, shortlisted: false },
      { ...third, status: 'shortlisted', knowledge: 80 },
    ] });
    expect(html).toContain('진행 중 1명 보기');
    expect(html).toContain('완료 보고서 1명 보기');
    expect(html).toContain('관심 명단</small><strong>2명');
    expect(html).toContain('관심 등록은 조사를 중단하지 않습니다');
    expect(html).toContain('중단 검토 · 무료');
    expect(html).toContain('100%에 도달하면 슬롯을 반환');
    expect(html).not.toContain('예상 합의율');
    expect(html).not.toContain('합의 가능성');
    expect(html).toContain('기본조건 설득 점수');
    expect(html).toContain('확률 아님');
  });

  it.each([false, true])('shows real free weekly investigation cadence with personnel delegation %s', (delegated) => {
    const props = fixture();
    const html = render({ ...props, workspace: 'market', staff: props.staff.map((member) => ({ ...member, delegated: member.department === 'personnel' && delegated })), candidates: [{ ...props.candidates[0], status: 'scouting', knowledge: 55 }] });
    expect(html).toContain(`매주 +${delegated ? 23 : 18} 무료`);
    expect(html).toContain(`1 / ${delegated ? 3 : 2} 슬롯`);
    expect(html).toContain(`약 ${delegated ? 2 : 3}주 후 완료`);
  });

  it('never charges directly from quick investigation or approach buttons, and disables active restart', () => {
    const props = fixture();
    const html = render({ ...props, workspace: 'market', candidates: [{ ...props.candidates[0], status: 'scouting', knowledge: 70 }] });
    const actions = html.match(/<div class="candidate-actions"[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(button(actions, '조사 검토')).toContain('disabled');
    expect(button(actions, '조사 검토')).toContain('이미 자동 조사 중');
    expect(button(actions, '접촉 검토')).not.toContain('disabled');
    expect(html).not.toContain('조사 계속 · 2PP');
  });

  it.each(['busy', 'poor', 'contacted', 'low-intelligence'] as const)('uses current engine conditions for candidate actions: %s', (condition) => {
    const props = fixture();
    const candidate = { ...props.candidates[0], status: 'unscouted' as const, knowledge: 65, lastApproachWeek: condition === 'contacted' ? props.game.week : null };
    const html = render({ ...props, workspace: 'market', busy: condition === 'busy', game: { ...props.game, politicalPower: condition === 'poor' ? 0 : 86, intelNetwork: condition === 'low-intelligence' ? 10 : 64 }, candidates: [candidate] });
    const actions = html.match(/<div class="candidate-actions"[\s\S]*?<\/div>/)?.[0] ?? '';
    expect(button(actions, '접촉 검토')).toContain('disabled');
    if (condition === 'busy' || condition === 'poor') expect(button(actions, '조사 검토')).toContain('disabled');
    expect(button(html, '조사 보고서')).not.toContain('disabled');
  });

  it('bounds candidate presentation to 24 rows but keeps full-market search and counts', () => {
    const props = fixture();
    const candidates = createStaffCandidates(props.nation.id, props.role.id).slice(0, 30);
    const html = render({ ...props, candidates, workspace: 'market' });
    expect(html.match(/class="open-candidate-report"/g)).toHaveLength(24);
    expect(html).toContain('검색 결과 30명');
    expect(html).toContain('1/2쪽');
    expect(button(html, '이전')).toContain('disabled');
    expect(button(html, '다음')).not.toContain('disabled');
  });
});
