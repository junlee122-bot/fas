import { getCampaignYearForWeek } from './campaignCalendar';
export { getCampaignYearForWeek } from './campaignCalendar';

export type NewsMediaEraId =
  | 'wartime-press'
  | 'radio-wire'
  | 'television-bulletin'
  | 'satellite-network'
  | 'web-edition'
  | 'live-feed'
  | 'civic-network';

export interface NewsMediaEra {
  id: NewsMediaEraId;
  startYear: number;
  endYear: number;
  masthead: string;
  koreanName: string;
  shortLabel: string;
  medium: string;
  cadence: string;
  newsroom: string;
  interaction: string;
  archiveLabel: string;
  nextTransitionYear?: number;
}

const mediaEras: NewsMediaEra[] = [
  {
    id: 'wartime-press',
    startYear: 1942,
    endYear: 1953,
    masthead: 'THE WORLD WIRE',
    koreanName: '세계 전시 주보',
    shortLabel: '활판 특별판',
    medium: '활판 인쇄·전보 사진',
    cadence: '주 1회 특별판',
    newsroom: '전선 특파원과 전신 편집국',
    interaction: '기사는 다음 호의 정정란과 독자 투고로 검증됩니다.',
    archiveLabel: '제본 신문 보관소',
    nextTransitionYear: 1954,
  },
  {
    id: 'radio-wire',
    startYear: 1954,
    endYear: 1967,
    masthead: 'WORLD WIRE RADIO',
    koreanName: '세계 라디오 주간',
    shortLabel: '라디오 종합',
    medium: '단파 라디오·통신사 속보',
    cadence: '매일 속보·주간 종합',
    newsroom: '앵커 데스크와 해외 단파 중계망',
    interaction: '정부 발표와 현지 음성 보고의 차이를 편집국이 교차 검증합니다.',
    archiveLabel: '방송 원고·음원 보관소',
    nextTransitionYear: 1968,
  },
  {
    id: 'television-bulletin',
    startYear: 1968,
    endYear: 1988,
    masthead: 'WORLD WIRE TELEVISION',
    koreanName: '세계 텔레비전 주간',
    shortLabel: 'TV 뉴스',
    medium: '텔레비전·필름 리포트',
    cadence: '저녁 종합뉴스·주간 특집',
    newsroom: '영상 편집실과 지역 방송 제휴망',
    interaction: '화면 자료와 생방송 인터뷰가 여론과 정책 압력을 빠르게 바꿉니다.',
    archiveLabel: '방송 필름 아카이브',
    nextTransitionYear: 1989,
  },
  {
    id: 'satellite-network',
    startYear: 1989,
    endYear: 2004,
    masthead: 'WORLD WIRE 24',
    koreanName: '세계 24시간 보도망',
    shortLabel: '24시간 뉴스',
    medium: '위성 생중계·24시간 뉴스',
    cadence: '상시 속보·주간 분석',
    newsroom: '국제 위성 데스크와 현장 생중계팀',
    interaction: '실시간 화면이 외교·전투·재난 대응의 결정 시간을 단축합니다.',
    archiveLabel: '위성 뉴스 테이프룸',
    nextTransitionYear: 2005,
  },
  {
    id: 'web-edition',
    startYear: 2005,
    endYear: 2015,
    masthead: 'WORLD WIRE ONLINE',
    koreanName: '세계 온라인 에디션',
    shortLabel: '웹 에디션',
    medium: '웹 기사·데이터 그래픽',
    cadence: '수시 갱신·주간 데이터판',
    newsroom: '통합 디지털 편집국과 데이터 저널리즘팀',
    interaction: '원문 링크·정정 이력·독자 제보가 기사 신뢰도와 함께 표시됩니다.',
    archiveLabel: '검색형 디지털 아카이브',
    nextTransitionYear: 2016,
  },
  {
    id: 'live-feed',
    startYear: 2016,
    endYear: 2034,
    masthead: 'WORLD WIRE LIVE',
    koreanName: '세계 라이브 피드',
    shortLabel: '라이브 피드',
    medium: '모바일 생중계·개인화 피드',
    cadence: '실시간 경보·주간 맥락 보고',
    newsroom: '검증 데스크·위성자료·공개정보 분석망',
    interaction: '추천 알고리즘의 편향과 합성정보 위험을 출처 신뢰도와 함께 공개합니다.',
    archiveLabel: '검증 가능한 피드 원장',
    nextTransitionYear: 2035,
  },
  {
    id: 'civic-network',
    startYear: 2035,
    endYear: 2060,
    masthead: 'WORLD WIRE COMMONS',
    koreanName: '세계 시민 보도망',
    shortLabel: '공공 보도망',
    medium: '분산형 공공망·실시간 시뮬레이션',
    cadence: '상시 상황판·주간 시민감사',
    newsroom: '지역 노드·공공 알고리즘 감사단·전문 검증조합',
    interaction: '누가 무엇을 보도하고 추천했는지 추적하며 시민감사와 정정 투표를 기록합니다.',
    archiveLabel: '분산형 공공기록 원장',
  },
];

export function getNewsMediaEra(year: number): NewsMediaEra {
  return mediaEras.find((era) => year >= era.startYear && year <= era.endYear)
    ?? (year < mediaEras[0].startYear ? mediaEras[0] : mediaEras[mediaEras.length - 1]);
}

export function getNewsMediaEraForWeek(week: number) {
  return getNewsMediaEra(getCampaignYearForWeek(week));
}

export function getNewsMediaTimeline() {
  return mediaEras;
}
