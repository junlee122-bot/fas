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
  project('foundation-models', '범용 인공지능 기반모델', '컴퓨팅', '언어·영상·과학 자료를 함께 다루는 국가 연산·검증 기반을 구축합니다.', 2022, 220, ['deep-learning', 'cyber-defense'], 'planetary-age', '대규모 생성형 모델, 공공 연산 기반과 AI 위험관리 논의', ['ai', 'institutions'], '◫'),
  project('grid-scale-storage', '초장주기 전력저장망', '에너지', '계절 변동과 지역 정전을 흡수하는 저장·수요반응 체계를 전국망에 연결합니다.', 2022, 210, ['renewable-grid', 'autonomous-logistics'], 'planetary-age', '재생에너지 확대에 따른 계통 유연성·저장·연계망 과제', ['energy', 'resilience'], '▤'),
  project('planetary-health', '행성보건 감시체계', '의학', '기후·생태·이동·병원체 자료를 통합해 감염병과 재난의 공동 위험을 조기에 포착합니다.', 2024, 210, ['pandemic-readiness', 'earth-observation'], 'planetary-age', '원헬스와 기후·보건 위험의 통합 감시', ['health', 'environment'], '✚'),
  project('quantum-sensing', '양자센서·정밀계측', '기초과학', '항법·지질·의료·잠수함 탐지를 위한 초정밀 시간·중력·자기장 측정을 실용화합니다.', 2024, 240, ['integrated-circuits', 'satellite-navigation'], 'planetary-age', '원자시계·양자계측·중력 및 자기 센서 연구', ['quantum', 'intelligence'], '◈'),
  project('resilient-semiconductor-fabs', '회복형 반도체 생산망', '산업', '설계·소재·장비·제조의 단일 실패점을 줄이고 대체 생산능력을 유지합니다.', 2026, 230, ['foundation-models', 'lean-global-logistics'], 'planetary-age', '반도체 공급망 집중과 경제안보형 산업정책', ['semiconductors', 'trade'], '▧'),
  project('autonomous-command-guardrails', '자율지휘 통제규약', '교리', '기계 추천·무인체계·인간 승인권을 하나의 감사 가능한 교전 규칙으로 묶습니다.', 2026, 230, ['foundation-models', 'unmanned-systems', 'digital-command'], 'planetary-age', '군사 AI의 인간 통제, 검증, 책임소재 논의', ['ai', 'command'], '⌬'),
  project('fusion-demonstrator', '핵융합 실증로', '에너지', '초전도 자석·플라스마 제어·재료 공학을 통합해 장시간 순에너지 실증을 시도합니다.', 2028, 300, ['civil-nuclear-power', 'grid-scale-storage'], 'planetary-age', '국제 핵융합 연구와 실증로 개발의 장기 축적', ['energy', 'science'], '☼'),
  project('orbital-infrastructure', '궤도 수송·정비 기반', '우주', '재사용 발사체, 궤도 급유, 잔해 추적과 위성 정비를 상시 운용체계로 전환합니다.', 2028, 270, ['reusable-launch', 'autonomous-logistics'], 'planetary-age', '상업 발사, 우주상황인식과 궤도 서비스 기술의 결합', ['space', 'logistics'], '◌'),
  project('climate-intervention-governance', '기후개입 국제통제', '환경', '대규모 탄소제거·태양복사 개입의 연구 허가, 피해책임과 중단 규칙을 제도화합니다.', 2030, 240, ['climate-adaptation', 'planetary-health'], 'planetary-age', '기후공학의 국경간 위험과 사전 거버넌스 논의', ['environment', 'institutions'], '≈'),
  project('synthetic-biology-platform', '합성생물 생산 플랫폼', '생명과학', '의약품·식량·소재를 설계 생물체로 생산하되 생물안보 추적 규칙을 함께 구축합니다.', 2030, 260, ['gene-editing', 'pandemic-readiness'], 'planetary-age', '합성생물학·바이오파운드리와 유전자 회로 연구', ['biosecurity', 'industry'], '⚕'),
  project('quantum-secure-network', '양자내성 국가통신망', '정보', '장기 기밀과 기반시설을 양자내성 암호·키 관리·검증 장비로 전환합니다.', 2032, 250, ['quantum-sensing', 'cyber-defense'], 'planetary-age', '양자컴퓨팅 위험에 대비한 암호 전환과 양자통신 연구', ['quantum', 'cyber'], '◇'),
  project('embodied-ai-industry', '체화형 AI 생산체계', '산업', '범용 로봇·공장 시뮬레이션·현장 안전감사를 결합해 노동력 부족과 위험작업을 대체합니다.', 2034, 250, ['foundation-models', 'autonomous-logistics'], 'planetary-age', '로봇공학과 대규모 학습모델의 산업 결합', ['automation', 'industry'], '⇄'),
  project('lunar-logistics', '달 궤도·표면 물류망', '우주', '통신·전력·착륙장·현지자원 실험을 연결해 반복 가능한 달 임무를 운용합니다.', 2034, 300, ['orbital-infrastructure', 'quantum-sensing'], 'planetary-age', '국제 달 탐사와 지속 체류 기반 구상', ['space', 'resources'], '◉'),
  project('advanced-fission', '소형·고온 원자로 계열', '에너지', '피동안전·모듈생산·연료주기 감시를 결합해 지역 전력과 산업열을 공급합니다.', 2036, 260, ['civil-nuclear-power', 'resilient-semiconductor-fabs'], 'planetary-age', '소형모듈원자로와 차세대 원자로 안전·연료주기 연구', ['energy', 'resilience'], '☢'),
  project('circular-carbon-industry', '순환탄소·재제조 산업', '환경', '제품 설계부터 회수·재사용·탄소회계까지 산업 전 과정을 폐쇄형 흐름으로 바꿉니다.', 2038, 240, ['grid-scale-storage', 'climate-intervention-governance'], 'planetary-age', '순환경제·산업 탈탄소·탄소회계 제도의 결합', ['environment', 'industry'], '↻'),
  project('scientific-general-ai', '과학발견 공동지능', '기초과학', '실험설계·수학추론·문헌검증을 수행하는 AI와 인간 연구팀의 책임체계를 구축합니다.', 2040, 290, ['foundation-models', 'synthetic-biology-platform', 'quantum-secure-network'], 'synthetic-age', 'AI 기반 단백질·재료·수학 연구와 재현성 검증의 확장', ['ai', 'science'], '◫'),
  project('orbital-defense-architecture', '궤도 인프라 공동방어', '우주안보', '잔해·재밍·요격 위협을 감시하고 민군 위성의 복구·대체 발사를 준비합니다.', 2042, 270, ['orbital-infrastructure', 'autonomous-command-guardrails'], 'synthetic-age', '우주 교통관리·위성 회복성·군비통제의 역사적 안보딜레마', ['space', 'deterrence'], '⌖'),
  project('fusion-grid', '핵융합·초광역 전력권', '에너지', '핵융합 실증과 대륙간 초전도 송전을 상시 전력시장에 연결합니다.', 2044, 320, ['fusion-demonstrator', 'grid-scale-storage'], 'synthetic-age', '대형 에너지 기술과 광역 전력망 통합의 장기 경로', ['energy', 'prosperity'], '☼'),
  project('neuroprosthetic-health', '신경보철·재활 보편체계', '의학', '신경 인터페이스와 정밀재활을 공공 의료·장애권·데이터권과 함께 운용합니다.', 2046, 270, ['planetary-health', 'scientific-general-ai'], 'synthetic-age', '신경보철·뇌기계 인터페이스와 의료 접근권 논의', ['health', 'rights'], '⚕'),
  project('asteroid-resource-chain', '소행성 자원·행성방위망', '우주', '근지구천체 탐지·궤도변경·무인 채굴을 하나의 국제 책임체계로 묶습니다.', 2048, 310, ['lunar-logistics', 'orbital-defense-architecture'], 'synthetic-age', '행성방위 실험과 우주자원 법제의 결합 가능성', ['space', 'resources'], '✥'),
  project('post-quantum-administration', '검증가능 디지털 국가', '행정', '신원·투표·재정·복지 자료를 양자내성 서명과 공개감사 체계로 보호합니다.', 2050, 260, ['quantum-secure-network', 'scientific-general-ai'], 'synthetic-age', '전자정부·암호 민첩성·공공 알고리즘 감사의 축적', ['institutions', 'rights'], '▦'),
  project('interplanetary-communications', '행성간 통신·항법', '우주', '지연을 견디는 통신망·자율항법·시간표준을 달과 화성권에 확장합니다.', 2052, 300, ['lunar-logistics', 'quantum-sensing'], 'synthetic-age', '심우주 통신과 지연 허용 네트워크 연구', ['space', 'communications'], '◎'),
  project('closed-loop-economy', '완전순환 도시경제', '산업', '물·영양·재료·에너지를 도시권 내부에서 회수해 외부 충격과 폐기물을 줄입니다.', 2054, 280, ['circular-carbon-industry', 'embodied-ai-industry'], 'synthetic-age', '폐쇄형 생명유지·순환도시·산업생태학의 융합', ['resilience', 'prosperity'], '↻'),
  project('planetary-defense-command', '행성방위 국제지휘망', '교리', '천체충돌·우주기상·궤도 사고에 민군·과학기관이 공동 대응하는 지휘절차를 확립합니다.', 2056, 290, ['asteroid-resource-chain', 'autonomous-command-guardrails'], 'synthetic-age', '행성방위 협력에서 축적된 탐지·경보·책임 분담 원칙', ['space', 'institutions'], '⌬'),
  project('longevity-social-contract', '건강수명 사회계약', '사회과학', '수명연장 성과를 연금·노동·돌봄·세대대표 제도와 함께 재설계합니다.', 2058, 280, ['neuroprosthetic-health', 'post-quantum-administration'], 'synthetic-age', '고령화·건강수명·장기돌봄이 제기한 세대간 제도 문제', ['health', 'society'], '♧'),
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
