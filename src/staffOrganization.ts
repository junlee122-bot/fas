import type { CampaignPhase } from './nationManagement';
import type {
  CareerRole,
  NationStatus,
  PersonnelDiscipline,
  StaffDepartment,
  StaffMember,
} from './types';

export interface StaffSeatDefinition {
  department: StaffDepartment;
  group: 'command' | 'administration' | 'state';
  label: string;
  warTitle: string;
  postwarTitle: string;
  foundingTitle: string;
  responsibility: string;
  preferredDisciplines: PersonnelDiscipline[];
}

export interface StaffAuthorityProfile {
  label: string;
  managedDepartments: StaffDepartment[];
  visibleDepartments: StaffDepartment[];
  maxDelegations: number;
  summary: string;
  restrictionReason: string;
}

export interface StaffSuitability {
  score: number;
  label: '최적' | '적합' | '검토' | '부적합';
  reasons: string[];
}

const allDepartments: StaffDepartment[] = [
  'operations',
  'logistics',
  'armaments',
  'personnel',
  'political',
  'science',
  'economy',
];

export const staffSeatDefinitions: StaffSeatDefinition[] = [
  {
    department: 'operations',
    group: 'command',
    label: '작전·안보',
    warTitle: '작전참모장',
    postwarTitle: '국가안보보좌관',
    foundingTitle: '건국안보실장',
    responsibility: '전선 우선순위, 작전 결재, 국가 안보 위기 조정을 담당합니다.',
    preferredDisciplines: ['military', 'intelligence'],
  },
  {
    department: 'logistics',
    group: 'command',
    label: '군수·재건',
    warTitle: '군수총감',
    postwarTitle: '국토재건청장',
    foundingTitle: '재건교통청장',
    responsibility: '전시 보급망을 관리하고 전후에는 교통·주택·기반시설 재건을 지휘합니다.',
    preferredDisciplines: ['military', 'engineering', 'industry'],
  },
  {
    department: 'armaments',
    group: 'command',
    label: '병기·산업',
    warTitle: '무기조달국장',
    postwarTitle: '산업전환위원장',
    foundingTitle: '산업건설위원장',
    responsibility: '장비 조달과 생산 계약을 담당하고 전후에는 군수 산업의 민수 전환을 관리합니다.',
    preferredDisciplines: ['engineering', 'industry', 'military'],
  },
  {
    department: 'personnel',
    group: 'administration',
    label: '인사·조직',
    warTitle: '인사·훈련국장',
    postwarTitle: '공직인사위원장',
    foundingTitle: '공직·군통합위원장',
    responsibility: '인재 조사, 참모 육성, 지휘관 충원과 새 정부의 공직 체계를 관리합니다.',
    preferredDisciplines: ['military', 'social-science', 'intelligence'],
  },
  {
    department: 'political',
    group: 'administration',
    label: '정무·외교',
    warTitle: '정치연락관',
    postwarTitle: '정부정무수석',
    foundingTitle: '국무조정실장',
    responsibility: '의회·동맹·정파를 조정하고 정부의 정치 일정과 대외 메시지를 관리합니다.',
    preferredDisciplines: ['diplomacy', 'social-science', 'intelligence'],
  },
  {
    department: 'science',
    group: 'state',
    label: '과학·기술',
    warTitle: '과학기술고문',
    postwarTitle: '국가과학위원장',
    foundingTitle: '국가과학원장',
    responsibility: '연구망, 기술 인재, 전략 연구와 민간 과학 기반을 조정합니다.',
    preferredDisciplines: ['science', 'engineering', 'medicine'],
  },
  {
    department: 'economy',
    group: 'state',
    label: '재정·경제',
    warTitle: '전시경제고문',
    postwarTitle: '재무·경제기획장관',
    foundingTitle: '재정경제위원장',
    responsibility: '전시 금융·국채·산업 배분과 전후 예산·통화·개발 계획을 총괄합니다.',
    preferredDisciplines: ['economics', 'industry', 'social-science'],
  },
];

const departmentSets = {
  militaryCommand: ['operations', 'logistics', 'armaments', 'personnel'],
  intelligenceCommand: ['operations', 'personnel', 'political', 'science'],
  fieldCommand: ['operations', 'logistics', 'personnel'],
  fieldIntelligence: ['operations', 'personnel', 'political'],
  politicalMinistry: ['personnel', 'political', 'science', 'economy'],
  unitMilitary: ['operations', 'personnel'],
  grassrootsPolitics: ['personnel', 'political'],
  regionalPolitics: ['personnel', 'political', 'economy'],
} satisfies Record<string, StaffDepartment[]>;

export function getStaffAuthorityProfile(role: CareerRole): StaffAuthorityProfile {
  if (role.tier === 1 || role.archetype === 'head-of-state') {
    return {
      label: '전권 인사권',
      managedDepartments: [...allDepartments],
      visibleDepartments: [...allDepartments],
      maxDelegations: allDepartments.length,
      summary: '내각·군·정보·과학·경제 전 보직의 임명과 책임 위임을 직접 결정합니다.',
      restrictionReason: '최고 통수권자 보직이므로 제한되는 참모 영역이 없습니다.',
    };
  }

  if (role.archetype === 'cabinet-minister') {
    return {
      label: '내각 인사권',
      managedDepartments: [...departmentSets.politicalMinistry],
      visibleDepartments: [...allDepartments],
      maxDelegations: 4,
      summary: '소관 부처와 정무·과학·경제 정책실의 장을 임명하고 범정부 위원회를 조정합니다.',
      restrictionReason: '군 작전·보급·병기 지휘계통은 통수기구의 별도 인사권에 속합니다.',
    };
  }

  if (role.archetype === 'theater-command') {
    return {
      label: '전구 지휘 인사권',
      managedDepartments: [...departmentSets.militaryCommand],
      visibleDepartments: [...allDepartments],
      maxDelegations: 4,
      summary: '전구 작전 수행에 직결되는 작전·군수·병기·인사 참모를 관리합니다.',
      restrictionReason: '정무·과학·경제 보직은 중앙정부의 임명권에 속합니다.',
    };
  }

  if (role.archetype === 'service-director') {
    return {
      label: '정보기관 인사권',
      managedDepartments: [...departmentSets.intelligenceCommand],
      visibleDepartments: [...allDepartments],
      maxDelegations: 4,
      summary: '정보작전과 조직 운영에 연결된 작전·인사·정무·과학 참모를 관리합니다.',
      restrictionReason: '군수·병기·경제 보직은 군 지휘부와 재무 당국의 임명권에 속합니다.',
    };
  }

  if (role.archetype === 'bureau-director') {
    const managedDepartments = role.branch === 'military'
      ? departmentSets.militaryCommand
      : role.branch === 'intelligence'
        ? departmentSets.intelligenceCommand
        : departmentSets.politicalMinistry;
    return {
      label: '국·참모부 인사권',
      managedDepartments: [...managedDepartments],
      visibleDepartments: [...allDepartments],
      maxDelegations: 3,
      summary: '중간관리자로서 소관 분야의 실무 책임자를 배치하지만 상급 기관장은 건의만 할 수 있습니다.',
      restrictionReason: '장관·전구사령관·기관장급 보직은 바로 위 지휘계통의 승인 대상입니다.',
    };
  }

  if (role.archetype === 'unit-command') {
    return {
      label: '전투단 인사권',
      managedDepartments: [...departmentSets.unitMilitary],
      visibleDepartments: [...allDepartments],
      maxDelegations: 1,
      summary: '예하 작전 책임자와 인사·훈련 담당만 직접 배치합니다.',
      restrictionReason: '군수·병기와 상급 참모는 여단·전구사령부의 통제를 받습니다.',
    };
  }

  if (role.archetype === 'organizer') {
    return {
      label: '현장 조직 인사권',
      managedDepartments: [...departmentSets.grassrootsPolitics],
      visibleDepartments: [...allDepartments],
      maxDelegations: 1,
      summary: '지역 조직책과 정치 연락 담당만 직접 임명하며 성과로 중앙의 승인을 얻어야 합니다.',
      restrictionReason: '예산·과학·경제·군 지휘 보직은 현장 조직의 권한 밖입니다.',
    };
  }

  if (role.archetype === 'regional-command' && role.branch === 'politics') {
    return {
      label: '지역 행정 인사권',
      managedDepartments: [...departmentSets.regionalPolitics],
      visibleDepartments: [...allDepartments],
      maxDelegations: 2,
      summary: '지역 인사·정무·경제 담당을 배치하고 중앙 정책을 현지 여건에 맞게 집행합니다.',
      restrictionReason: '과학·군사·국가급 정책 책임자는 중앙기관의 임명권에 속합니다.',
    };
  }

  if (role.archetype === 'field-command' || role.branch === 'military') {
    return {
      label: '현장 지휘 인사권',
      managedDepartments: [...departmentSets.fieldCommand],
      visibleDepartments: [...allDepartments],
      maxDelegations: 2,
      summary: '예하 작전·군수·인사 참모만 배치하며 중앙 참모진에는 건의할 수 있습니다.',
      restrictionReason: '전구사령부와 중앙정부의 상급 보직은 직접 교체할 수 없습니다.',
    };
  }

  if (role.archetype === 'agent' || role.archetype === 'resistance' || role.branch === 'intelligence') {
    return {
      label: '공작망 인사권',
      managedDepartments: [...departmentSets.fieldIntelligence],
      visibleDepartments: [...allDepartments],
      maxDelegations: role.tier === 5 ? 1 : 2,
      summary: '작전 셀·요원 관리·정치 연락망의 책임자만 직접 배치합니다.',
      restrictionReason: '정규군·산업·과학·경제 기관은 공작망 지휘계통 밖에 있습니다.',
    };
  }

  return {
    label: '부처 인사권',
    managedDepartments: [...departmentSets.politicalMinistry],
    visibleDepartments: [...allDepartments],
    maxDelegations: 3,
    summary: '소관 부처의 인사·정무·과학·경제 참모를 관리합니다.',
    restrictionReason: '군사 지휘 보직은 통수기구의 별도 임명권에 속합니다.',
  };
}

export function canManageStaffDepartment(role: CareerRole, department: StaffDepartment) {
  return getStaffAuthorityProfile(role).managedDepartments.includes(department);
}

export function getStaffSeatDefinition(department: StaffDepartment) {
  return staffSeatDefinitions.find((seat) => seat.department === department) ?? staffSeatDefinitions[0];
}

export function getStaffSeatTitle(department: StaffDepartment, phase: CampaignPhase, nationStatus: NationStatus) {
  const seat = getStaffSeatDefinition(department);
  if (phase === 'war') return seat.warTitle;
  return nationStatus === 'sovereign' ? seat.postwarTitle : seat.foundingTitle;
}

export function getCareerInstitutionalTitle(role: CareerRole, phase: CampaignPhase, nationStatus: NationStatus) {
  if (phase === 'war') return role.title;
  const founding = nationStatus !== 'sovereign';
  if (role.archetype === 'head-of-state') return founding ? '초대 정부수반' : '국가재건평의회 의장';
  if (role.archetype === 'cabinet-minister') return founding ? '건국내각 수석위원' : '국무조정장관';
  if (role.archetype === 'bureau-director') {
    if (role.branch === 'military') return founding ? '건국군 작전국장' : '합동작전본부장';
    if (role.branch === 'intelligence') return founding ? '건국정보국 전구국장' : '국가정보 지역국장';
    return founding ? '건국정책국장' : '국가정책조정국장';
  }
  if (role.archetype === 'regional-command') return founding ? '지역건국위원장' : '광역행정조정관';
  if (role.archetype === 'organizer') return founding ? '건국준비 현장위원' : '지역조직위원';
  if (role.archetype === 'theater-command') return founding ? '건국군 총사령관' : '국방참모총장';
  if (role.archetype === 'service-director') return founding ? '건국정보국장' : '국가정보원장';
  if (role.archetype === 'field-command') return founding ? '건국군 지역사령관' : '지역방위사령관';
  if (role.archetype === 'unit-command') return founding ? '건국군 전투단장' : '통합방위전투단장';
  if (role.archetype === 'resistance') return founding ? '독립정부 치안연락관' : '국가안보조사관';
  return founding ? '독립정부 정보연락관' : '국가안보조사관';
}

export function calculateStaffSuitability(member: StaffMember, department: StaffDepartment): StaffSuitability {
  const seat = getStaffSeatDefinition(department);
  const disciplineFit = member.discipline && seat.preferredDisciplines.includes(member.discipline);
  const originalSeat = member.department === department;
  const experienceMatch = seat.preferredDisciplines.some((discipline) => {
    const token = discipline === 'military' ? /군|작전|지휘|전선|보급/ : discipline === 'economics' ? /경제|재정|금융|산업/ : discipline === 'intelligence' ? /정보|공작|연락|첩보/ : discipline === 'science' ? /과학|연구|기술/ : discipline === 'engineering' ? /공학|기술|생산|병기/ : null;
    return token?.test(`${member.role} ${member.specialty} ${member.historicalOffice}`) ?? false;
  });
  const rawScore = Math.round(
    member.ability * 0.52
    + member.influence * 0.16
    + member.loyalty * 0.12
    + member.grade * 3
    + (disciplineFit ? 13 : experienceMatch ? 8 : 0)
    + (originalSeat ? 4 : 0)
    - Math.max(0, member.workload - 70) * 0.16,
  );
  const score = Math.max(20, Math.min(99, rawScore));
  const label: StaffSuitability['label'] = score >= 82 ? '최적' : score >= 68 ? '적합' : score >= 55 ? '검토' : '부적합';
  const reasons = [
    disciplineFit ? `${member.discipline} 전공이 보직 요구와 일치` : experienceMatch ? '경력·전문 분야가 보직과 연관' : '직접 연관된 전공 정보가 부족',
    `현재 능력 ${member.ability} · 영향력 ${member.influence}`,
    member.workload > 75 ? `업무량 ${member.workload}%로 과부하 위험` : `업무량 ${member.workload}%로 운용 가능`,
  ];
  return { score, label, reasons };
}

export function reassignStaff(staff: StaffMember[], memberId: string, targetDepartment: StaffDepartment) {
  const movingMember = staff.find((member) => member.id === memberId);
  if (!movingMember || movingMember.department === targetDepartment) return staff;
  const targetMember = staff.find((member) => member.department === targetDepartment);
  if (!targetMember) return staff;
  const sourceDepartment = movingMember.department;
  return staff.map((member) => {
    if (member.id === movingMember.id) return { ...member, department: targetDepartment, delegated: false };
    if (member.id === targetMember.id) return { ...member, department: sourceDepartment, delegated: false };
    return member;
  });
}
