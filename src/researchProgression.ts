import type { ResearchProject } from './types';

export interface ResearchAvailability {
  available: boolean;
  yearReady: boolean;
  prerequisitesReady: boolean;
  missingPrerequisiteNames: string[];
  reason: string;
}

type ResearchEra = NonNullable<ResearchProject['era']>;

const project = (
  id: string,
  name: string,
  branch: string,
  description: string,
  minimumYear: number,
  duration: number,
  prerequisites: string[],
  era: ResearchEra,
  historicalBasis: string,
  outcomeTags: string[],
  icon: string,
): ResearchProject => ({
  // Long-horizon projects are national programmes, not single laboratory tasks. Scaling
  // their effort keeps the two research slots meaningfully occupied between historical eras.
  id, name, branch, description, progress: 0, duration: duration * 6, active: false, complete: false,
  icon, minimumYear, prerequisites, era, historicalBasis, outcomeTags,
});

// The opening six projects remain in data.ts so old saves retain their exact progress. This
// catalogue supplies a dated, prerequisite-driven chain from reconstruction to 2020.
export const longHorizonResearchProjects: ResearchProject[] = [
  project('jet-propulsion', '실용 제트 추진기관', '항공', '고속 요격기와 차세대 민간 항공 산업을 엽니다.', 1945, 150, ['radar'], 'reconstruction', '전시 터보제트 개발과 전후 제트 여객기 산업', ['air-power', 'industry'], '✦'),
  project('atomic-science', '원자과학 연구체계', '기초과학', '원자로·동위원소·핵 억지 연구의 공통 기반을 만듭니다.', 1945, 180, ['penicillin'], 'reconstruction', '맨해튼 계획과 각국 원자력 연구기관의 제도화', ['nuclear', 'science'], '☢'),
  project('operations-research', '작전연구·통계행정', '교리', '보급·예산·전투 데이터를 하나의 의사결정 체계로 연결합니다.', 1945, 130, ['logistics', 'code'], 'reconstruction', '전시 작전연구 조직과 통계적 품질관리', ['logistics', 'institutions'], '⌬'),
  project('transistor', '트랜지스터 전자공학', '전자', '진공관 장비를 소형·고신뢰 통신과 계산장치로 전환합니다.', 1950, 180, ['radar'], 'cold-war', '1947년 트랜지스터 이후 반도체 산업의 성장', ['computing', 'communications'], '◇'),
  project('strategic-rocketry', '전략 로켓 공학', '로켓', '장거리 유도무기와 우주 발사체의 공통 추진·유도 기반입니다.', 1950, 210, ['jet-propulsion'], 'cold-war', 'V-2 계보와 전후 미·소 로켓 개발', ['missiles', 'space'], '↑'),
  project('combined-antibiotics', '항생제·예방접종 체계', '의학', '감염병 사망과 동원 손실을 줄이는 전국 보건망을 구축합니다.', 1950, 150, ['penicillin'], 'cold-war', '항생제 보급과 WHO 중심 예방접종 사업', ['health', 'welfare'], '✚'),
  project('main-battle-tank', '주력전차 통합 설계', '기갑', '화력·기동·방호를 하나의 표준 차체에 통합합니다.', 1950, 190, ['tank', 'logistics'], 'cold-war', '센추리온·T-54·M48 계열의 주력전차 개념', ['armor', 'industry'], '▰'),
  project('civil-nuclear-power', '민간 원자력 발전', '에너지', '전력망과 고에너지 산업에 안정적인 기저전력을 공급합니다.', 1955, 220, ['atomic-science'], 'cold-war', '1950년대 상업 원전과 국제 원자력 협력', ['energy', 'prosperity'], '☼'),
  project('container-logistics', '컨테이너·복합수송', '물류', '항만·철도·도로의 환적 비용과 전략 수송 지연을 줄입니다.', 1955, 150, ['operations-research'], 'cold-war', '표준 컨테이너와 전후 세계 물류혁명', ['trade', 'logistics'], '▣'),
  project('integrated-air-defense', '통합 방공망', '전자전', '레이더·요격기·지대공무기를 실시간 지휘망으로 연결합니다.', 1955, 190, ['jet-propulsion', 'transistor'], 'cold-war', '냉전기 방공관제와 지대공 미사일 체계', ['air-defense', 'deterrence'], '⌁'),
  project('digital-computing', '디지털 계산기관', '컴퓨팅', '과학·암호·행정 계산을 국가 규모로 자동화합니다.', 1960, 210, ['transistor', 'operations-research'], 'space-age', '메인프레임과 정부·대학 계산센터', ['computing', 'institutions'], '▦'),
  project('earth-observation', '기상·지구관측 위성', '우주', '농업·재난·정찰·기상예보를 궤도 자료로 지원합니다.', 1960, 220, ['strategic-rocketry', 'transistor'], 'space-age', 'TIROS와 초기 정찰·통신 위성', ['space', 'environment'], '◉'),
  project('green-revolution', '고수확 농업·관개', '농업', '식량 생산성과 농촌 보건을 높이지만 물·비료 의존을 만듭니다.', 1960, 170, ['combined-antibiotics'], 'space-age', '녹색혁명의 품종·관개·비료 체계', ['food', 'development'], '♧'),
  project('crewed-spaceflight', '유인 우주비행 체계', '우주', '유인 캡슐·생명유지·추적망을 통합해 궤도 경쟁을 엽니다.', 1965, 240, ['earth-observation', 'strategic-rocketry'], 'space-age', '보스토크·머큐리·제미니·아폴로 계획', ['space', 'prestige'], '◌'),
  project('integrated-circuits', '집적회로 산업', '전자', '컴퓨터와 유도장비를 소형화하고 대량생산 기반을 만듭니다.', 1965, 200, ['digital-computing'], 'space-age', '집적회로와 실리콘 산업의 확장', ['semiconductors', 'industry'], '▧'),
  project('systems-public-health', '역학 감시·보편의료', '의학', '질병 감시와 일차의료를 연결해 유행을 조기에 발견합니다.', 1965, 180, ['combined-antibiotics', 'operations-research'], 'space-age', '역학조사 체계와 보편적 의료보장 확대', ['health', 'rights'], '✚'),
  project('precision-guidance', '정밀유도 무기', '군사기술', '관성항법·레이저·전자센서를 결합해 표적당 소요 전력을 줄입니다.', 1970, 230, ['integrated-circuits', 'integrated-air-defense'], 'information-age', '베트남전 이후 정밀유도탄과 디지털 항전장비', ['precision', 'deterrence'], '◎'),
  project('packet-networks', '패킷 통신망', '정보통신', '분산된 연구·군·행정 컴퓨터를 장애에 강한 네트워크로 연결합니다.', 1970, 210, ['digital-computing'], 'information-age', 'ARPANET과 패킷 교환 연구', ['networks', 'computing'], '⌘'),
  project('environmental-monitoring', '환경측정·오염규제', '환경', '대기·수질·산업오염을 측정하고 장기 비용을 정책에 반영합니다.', 1970, 180, ['earth-observation', 'operations-research'], 'information-age', '1970년대 환경기관과 국제 환경외교', ['environment', 'rights'], '≈'),
  project('satellite-navigation', '위성항법 체계', '우주', '부대·선박·민간 물류에 정밀 위치와 시각을 제공합니다.', 1975, 240, ['earth-observation', 'integrated-circuits'], 'information-age', 'Transit와 GPS 개발 계보', ['navigation', 'logistics'], '✥'),
  project('biotechnology', '재조합 DNA·생명공학', '생명과학', '의약품·농업·산업효소의 설계 생산을 시작합니다.', 1975, 220, ['systems-public-health', 'integrated-circuits'], 'information-age', '재조합 DNA 기술과 초기 바이오산업', ['health', 'industry'], '⚕'),
  project('composite-airframes', '복합재·고효율 항공기', '항공', '항속거리와 탑재량을 늘리고 연료 소비를 낮춥니다.', 1975, 210, ['jet-propulsion', 'integrated-circuits'], 'information-age', '광동체 항공기와 복합재 적용 확대', ['air-power', 'transport'], '✦'),
  project('personal-computing', '개인용 컴퓨팅', '컴퓨팅', '계산 능력을 부처·기업·가정으로 분산합니다.', 1980, 210, ['integrated-circuits', 'packet-networks'], 'information-age', '마이크로프로세서와 개인용 컴퓨터 혁명', ['computing', 'society'], '▦'),
  project('stealth-sensors', '저피탐·센서융합', '군사기술', '탐지 회피와 다중센서 정보를 통합해 선제 탐지 우위를 만듭니다.', 1980, 250, ['precision-guidance', 'composite-airframes'], 'information-age', '스텔스 형상·재료와 디지털 센서 융합', ['air-power', 'intelligence'], '◈'),
  project('lean-global-logistics', '적시생산·세계 공급망', '산업', '재고와 납기를 데이터로 관리해 생산성을 높이지만 충격 전파 위험을 만듭니다.', 1980, 190, ['container-logistics', 'personal-computing'], 'information-age', '적시생산과 국제 공급망 관리', ['industry', 'trade'], '⇄'),
  project('human-genome', '유전체 분석 체계', '생명과학', '질병 원인·맞춤 치료·생물정보학 연구를 국가 사업으로 연결합니다.', 1985, 250, ['biotechnology', 'personal-computing'], 'information-age', '인간 게놈 프로젝트의 국제 연구 기반', ['health', 'science'], '⚕'),
  project('digital-command', '디지털 합동지휘망', '교리', '육해공·정보·보급 데이터를 공통 작전상황도로 통합합니다.', 1985, 230, ['satellite-navigation', 'packet-networks', 'precision-guidance'], 'information-age', 'C4ISR와 네트워크 중심전의 기반', ['command', 'networks'], '⌬'),
  project('civil-internet', '민간 인터넷·웹', '정보통신', '개방형 표준으로 대학·기업·시민사회를 세계적으로 연결합니다.', 1990, 220, ['packet-networks', 'personal-computing'], 'connected-world', 'TCP/IP 전환과 월드 와이드 웹', ['networks', 'rights'], '◎'),
  project('global-navigation-logistics', '전지구 정밀물류', '물류', '위성항법과 디지털 통관으로 공급망·재난구호·작전을 실시간 조정합니다.', 1990, 200, ['satellite-navigation', 'lean-global-logistics'], 'connected-world', 'GPS 민간 개방과 물류 정보화', ['trade', 'logistics'], '✥'),
  project('renewable-grid', '재생에너지·스마트 전력망', '에너지', '분산 전원과 저장장치를 전력망에 통합해 연료 의존을 낮춥니다.', 1995, 240, ['civil-nuclear-power', 'environmental-monitoring'], 'connected-world', '풍력·태양광 확대와 스마트그리드 연구', ['energy', 'environment'], '☼'),
  project('unmanned-systems', '무인 정찰·타격 체계', '군사기술', '원격 센서와 자동비행으로 위험 지역의 감시·정밀타격을 수행합니다.', 1995, 230, ['digital-command', 'stealth-sensors'], 'connected-world', '1990년대 이후 UAV 운용 확대', ['drones', 'intelligence'], '⌖'),
  project('cyber-defense', '국가 사이버 방위', '정보', '민군 네트워크의 침입 탐지·복구·공급망 보안을 제도화합니다.', 2000, 220, ['civil-internet', 'digital-command'], 'connected-world', '인터넷 기반시설 보호와 국가 CERT', ['cyber', 'institutions'], '◈'),
  project('mrna-platform', 'mRNA 백신 플랫폼', '생명과학', '신종 병원체의 후보 백신 설계와 생산 전환 시간을 단축합니다.', 2000, 250, ['human-genome', 'systems-public-health'], 'connected-world', 'mRNA 전달체·면역학 연구의 축적', ['health', 'biosecurity'], '⚕'),
  project('machine-learning', '기계학습 의사결정 지원', '컴퓨팅', '대규모 자료에서 예측·분류·자원배분 패턴을 학습합니다.', 2005, 230, ['civil-internet', 'human-genome'], 'connected-world', '통계학습과 대규모 데이터 처리의 결합', ['ai', 'institutions'], '▦'),
  project('climate-adaptation', '기후적응·회복도시', '환경', '위험지도·조기경보·회복 기반시설을 국가계획에 통합합니다.', 2005, 220, ['renewable-grid', 'environmental-monitoring'], 'connected-world', '기후 적응계획과 재난위험경감 체계', ['environment', 'resilience'], '≈'),
  project('autonomous-logistics', '자율 물류·로봇 생산', '산업', '창고·공장·수송망을 센서와 로봇으로 연속 운영합니다.', 2010, 240, ['machine-learning', 'global-navigation-logistics'], 'connected-world', '산업용 로봇·자율주행·물류 자동화', ['automation', 'industry'], '⇄'),
  project('gene-editing', '정밀 유전자 편집', '생명과학', '질병 치료와 작물 개량의 정밀도를 높이는 동시에 생물안보 규칙을 요구합니다.', 2010, 250, ['human-genome', 'mrna-platform'], 'connected-world', 'CRISPR 기반 유전자 편집', ['health', 'biosecurity'], '⚕'),
  project('deep-learning', '심층학습·대규모 연산', '컴퓨팅', '영상·언어·과학모델의 인식 능력을 급격히 확장합니다.', 2015, 260, ['machine-learning', 'cyber-defense'], 'connected-world', 'GPU 기반 심층학습과 대규모 모델', ['ai', 'computing'], '▦'),
  project('reusable-launch', '재사용 우주수송', '우주', '발사체 회수와 반복 운용으로 궤도 접근비용을 낮춥니다.', 2015, 280, ['crewed-spaceflight', 'composite-airframes'], 'connected-world', '재사용 발사체의 상업 운용', ['space', 'industry'], '↑'),
  project('pandemic-readiness', '상시 감염병 대응망', '의학', '유전체 감시·플랫폼 백신·지역 생산을 자동 대기체계로 묶습니다.', 2015, 250, ['mrna-platform', 'climate-adaptation'], 'connected-world', '사스·메르스 이후 대비와 코로나19 대응 경험', ['health', 'biosecurity'], '✚'),
];

export function getResearchAvailability(projectToCheck: ResearchProject, research: readonly ResearchProject[], currentYear: number): ResearchAvailability {
  const minimumYear = projectToCheck.minimumYear ?? 1942;
  const yearReady = currentYear >= minimumYear;
  const completedIds = new Set(research.filter((item) => item.complete).map((item) => item.id));
  const missingPrerequisites = (projectToCheck.prerequisites ?? []).filter((id) => !completedIds.has(id));
  const names = missingPrerequisites.map((id) => research.find((item) => item.id === id)?.name ?? id);
  const prerequisitesReady = missingPrerequisites.length === 0;
  return {
    available: yearReady && prerequisitesReady,
    yearReady,
    prerequisitesReady,
    missingPrerequisiteNames: names,
    reason: !yearReady ? `${minimumYear}년부터 개방` : !prerequisitesReady ? `선행 연구: ${names.join(' · ')}` : '연구 가능',
  };
}

export function normalizeResearchProjects(value: unknown, catalogue: readonly ResearchProject[]): ResearchProject[] {
  const saved = Array.isArray(value) ? value.filter((item): item is ResearchProject => Boolean(item && typeof item === 'object' && typeof (item as ResearchProject).id === 'string')) : [];
  const savedById = new Map(saved.map((item) => [item.id, item]));
  return catalogue.map((item) => ({ ...item, ...(savedById.get(item.id) ?? {}) }));
}

export function fillOpenResearchSlots(research: readonly ResearchProject[], currentYear: number, slots = 2) {
  let active = research.filter((item) => item.active && !item.complete).length;
  return research.map((item) => {
    if (active >= slots || item.active || item.complete || !getResearchAvailability(item, research, currentYear).available) return item;
    active += 1;
    return { ...item, active: true };
  });
}

export function advanceResearchProjects(research: readonly ResearchProject[], gain: number, currentYear: number) {
  return research.map((item) => {
    if (!item.active || item.complete) return item;
    if (!getResearchAvailability(item, research, currentYear).available) return { ...item, active: false };
    const progress = Math.min(item.duration, item.progress + gain);
    return { ...item, progress, complete: progress >= item.duration, active: progress < item.duration };
  });
}

export function getNewlyAvailableResearch(research: readonly ResearchProject[], previousYear: number, currentYear: number) {
  if (currentYear <= previousYear) return [];
  return research.filter((item) => !item.complete && (item.minimumYear ?? 1942) > previousYear && (item.minimumYear ?? 1942) <= currentYear);
}
