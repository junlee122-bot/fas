import type { CareerBranch, GameTab, Territory } from './types';
import type { GameIconName, GameIconTone } from './GameIcon';

export interface KoreaRoleGuide {
  mission: string;
  firstAction: string;
  authorityBoundary: string;
  destination: GameTab;
  destinationLabel: string;
}

export interface KoreaLiberationTrack {
  id: 'recognition' | 'network' | 'force' | 'return';
  label: string;
  value: number;
  detail: string;
  action: string;
  tab: GameTab;
  icon: GameIconName;
  tone: GameIconTone;
  state: '취약' | '준비 중' | '진전' | '준비 완료';
}

export interface KoreaLiberationInput {
  politicalPower: number;
  stability: number;
  warSupport: number;
  intelNetwork: number;
  averageStrength: number;
  averageSupply: number;
  objectiveProgress: number;
  territories: readonly Territory[];
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

function trackPresentation(value: number): Pick<KoreaLiberationTrack, 'tone' | 'state'> {
  if (value >= 80) return { tone: 'green', state: '준비 완료' };
  if (value >= 65) return { tone: 'blue', state: '진전' };
  if (value >= 45) return { tone: 'gold', state: '준비 중' };
  return { tone: 'red', state: '취약' };
}

export function getKoreaRoleGuide(branch: CareerBranch): KoreaRoleGuide {
  if (branch === 'politics') return {
    mission: '임시정부의 정통성, 독립운동 정파 통합과 연합국 승인을 결재합니다.',
    firstAction: '중국 국민정부와의 승인 교섭 준비도를 먼저 확인하십시오.',
    authorityBoundary: '광복군 개별 부대와 국내 공작요원은 담당 지휘관·정보책을 통해서만 운용합니다.',
    destination: 'diplomacy',
    destinationLabel: '승인 외교 열기',
  };
  if (branch === 'military') return {
    mission: '한국광복군의 훈련·편제·보급과 연합작전 참가를 지휘합니다.',
    firstAction: '광복군 부대의 지휘관·보급·명령 가능 범위를 먼저 확인하십시오.',
    authorityBoundary: '임시정부 헌정 노선과 대외 승인 협상은 정치 지도부의 동의가 필요합니다.',
    destination: 'army',
    destinationLabel: '광복군 편제 열기',
  };
  return {
    mission: '충칭·만주·조선 본토를 잇는 연락망, 침투와 방첩을 지휘합니다.',
    firstAction: '국내정진 침투망의 노출 위험과 정보 신뢰도를 먼저 확인하십시오.',
    authorityBoundary: '대규모 무장작전과 공식 외교선언은 상급 지휘부의 승인이 필요합니다.',
    destination: 'intelligence',
    destinationLabel: '국내공작망 열기',
  };
}

export function deriveKoreaLiberationTracks(input: KoreaLiberationInput): KoreaLiberationTrack[] {
  const recognition = clamp(input.politicalPower * 0.45 + input.stability * 0.25 + input.warSupport * 0.3);
  const network = clamp(input.intelNetwork);
  const force = clamp((input.averageStrength + input.averageSupply) / 2);
  const returnPlan = clamp(input.objectiveProgress);
  const homeland = input.territories.find((territory) => territory.id === 'korea');
  const homelandStatus = homeland?.controller === 'allies' ? '한반도 거점을 확보했습니다.' : homeland?.controller === 'neutral' ? '한반도 지배권이 경합 중입니다.' : '조선 본토는 아직 일제 점령 아래 있습니다.';

  return [
    {
      id: 'recognition', label: '국제 승인', value: recognition,
      detail: '외교·조직력과 임시정부 결속을 합산한 승인 기반',
      action: '승인 교섭', tab: 'diplomacy', icon: 'diplomacy',
      ...trackPresentation(recognition),
    },
    {
      id: 'network', label: '국내 연락망', value: network,
      detail: '충칭–만주–조선의 침투·연락·방첩 역량',
      action: '공작망 점검', tab: 'intelligence', icon: 'intelligence',
      ...trackPresentation(network),
    },
    {
      id: 'force', label: '광복군 준비', value: force,
      detail: '부대 평균 전력과 보급을 합산한 실전 준비도',
      action: '편제·보급', tab: 'army', icon: 'army',
      ...trackPresentation(force),
    },
    {
      id: 'return', label: '국내정진 계획', value: returnPlan,
      detail: `${homelandStatus} 작전 준비와 목표 확보를 추적합니다.`,
      action: '한반도 작전도', tab: 'map', icon: 'map',
      ...trackPresentation(returnPlan),
    },
  ];
}
