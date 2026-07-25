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

export type KoreaLiberationOutcome =
  | 'contested-transition'
  | 'negotiated-return'
  | 'coalition-government'
  | 'armed-liberation'
  | 'sovereign-return';

export interface KoreaLiberationAssessment {
  score: number;
  eligible: boolean;
  outcome: KoreaLiberationOutcome;
  outcomeLabel: string;
  partitionRisk: number;
  blockedTrackIds: KoreaLiberationTrack['id'][];
  tracks: KoreaLiberationTrack[];
}

export interface KoreaLiberationAssessmentInput extends KoreaLiberationInput {
  weeksElapsed: number;
  victoryScore: number;
  battleVictories: number;
  relationAverage: number;
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

export const koreaLiberationOutcomeLabels: Record<KoreaLiberationOutcome, string> = {
  'contested-transition': '분할 위험 속 과도정부',
  'negotiated-return': '협상 귀환·과도정부',
  'coalition-government': '통합 독립연합정부',
  'armed-liberation': '광복군 주도 해방정부',
  'sovereign-return': '주권 회복·통합 건국',
};

export function classifyKoreaLiberationOutcome(
  assessment: Pick<KoreaLiberationAssessment, 'eligible' | 'score' | 'partitionRisk' | 'tracks'>,
): KoreaLiberationOutcome {
  if (!assessment.eligible) return 'contested-transition';
  const trackValue = (id: KoreaLiberationTrack['id']) => assessment.tracks.find((track) => track.id === id)?.value ?? 0;
  if (assessment.score >= 86 && assessment.partitionRisk <= 38) return 'sovereign-return';
  if (trackValue('force') >= 68 && trackValue('return') >= 60) return 'armed-liberation';
  if (trackValue('recognition') >= 88 && trackValue('network') >= 82) return 'coalition-government';
  return 'negotiated-return';
}

export function assessKoreaLiberationReadiness(input: KoreaLiberationAssessmentInput): KoreaLiberationAssessment {
  const operationalReturn = clamp(
    input.objectiveProgress * 0.34
      + input.victoryScore * 0.32
      + input.battleVictories * 4
      + Math.min(18, input.weeksElapsed / 13)
      + (input.territories.find((territory) => territory.id === 'korea')?.controller === 'allies' ? 24 : 0),
  );
  const baseTracks = deriveKoreaLiberationTracks({ ...input, objectiveProgress: operationalReturn });
  const operationalForce = clamp(
    (input.averageStrength + input.averageSupply) / 2
      + Math.min(18, input.battleVictories * 2)
      + Math.min(10, input.weeksElapsed / 26),
  );
  const tracks = baseTracks.map((track) => track.id === 'force' ? {
    ...track,
    value: operationalForce,
    detail: '현재 전력·보급에 광복군의 실전 경험과 장기 편제 숙련을 합산한 준비도',
    ...trackPresentation(operationalForce),
  } : track);
  const trackValue = (id: KoreaLiberationTrack['id']) => tracks.find((track) => track.id === id)?.value ?? 0;
  const recognition = trackValue('recognition');
  const network = trackValue('network');
  const force = trackValue('force');
  const returnPlan = trackValue('return');
  const score = clamp(recognition * 0.28 + network * 0.22 + force * 0.2 + returnPlan * 0.3);
  const thresholds: Record<KoreaLiberationTrack['id'], number> = {
    recognition: 58,
    network: 52,
    force: 50,
    return: 50,
  };
  const blockedTrackIds = tracks.filter((track) => track.value < thresholds[track.id]).map((track) => track.id);
  const eligible = score >= 62 && blockedTrackIds.length === 0;
  const partitionRisk = clamp(
    120
      - recognition * 0.28
      - network * 0.18
      - force * 0.14
      - returnPlan * 0.32
      - Math.max(0, input.relationAverage - 50) * 0.12
      + Math.max(0, input.weeksElapsed - 208) * 0.025,
  );
  const outcome = classifyKoreaLiberationOutcome({ eligible, score, partitionRisk, tracks });
  return {
    score,
    eligible,
    outcome,
    outcomeLabel: koreaLiberationOutcomeLabels[outcome],
    partitionRisk,
    blockedTrackIds,
    tracks,
  };
}
