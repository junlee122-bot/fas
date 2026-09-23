import image1 from './assets/game-illustrations/staff-council.webp';
import image2 from './assets/game-illustrations/recruitment-dossiers.webp';
import image3 from './assets/game-illustrations/diplomatic-table.webp';
import image4 from './assets/game-illustrations/territorial-administration.webp';
import image5 from './assets/game-illustrations/treasury-ledger.webp';
import image6 from './assets/game-illustrations/market-exchange.webp';
import image7 from './assets/game-illustrations/research-laboratory.webp';
import image8 from './assets/game-illustrations/equipment-workbench.webp';
import image9 from './assets/game-illustrations/production-logistics.webp';
import image10 from './assets/game-illustrations/land-operations.webp';
import image11 from './assets/game-illustrations/naval-operations.webp';
import image12 from './assets/game-illustrations/air-operations.webp';
import image13 from './assets/game-illustrations/constitution-assembly.webp';
import image14 from './assets/game-illustrations/justice-chamber.webp';
import image15 from './assets/game-illustrations/election-campaign.webp';
import image16 from './assets/game-illustrations/civilian-work.webp';
import image17 from './assets/game-illustrations/clandestine-network.webp';
import image18 from './assets/game-illustrations/royal-council.webp';
import image19 from './assets/game-illustrations/socialist-planning.webp';
import image20 from './assets/game-illustrations/independence-network.webp';
import image21 from './assets/game-illustrations/national-reconstruction.webp';
import image22 from './assets/game-illustrations/civilian-relief.webp';
import image23 from './assets/game-illustrations/postwar-command.webp';
import image24 from './assets/game-illustrations/modern-command.webp';

export interface GameArtwork {
  readonly src: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly minYear?: number;
  readonly maxYear?: number;
  readonly futureSymbolic?: boolean;
}

/** Presentation-only symbolic art. Never derive condition, authority or results here. */
export const gameArtworkCatalog = {
  'staff-council': { src: image1, label: '참모 회의와 책임 배분', width: 2048, height: 1360 },
  'recruitment-dossiers': { src: image2, label: '인재 조사와 경력 기록', width: 2048, height: 1360 },
  'diplomatic-table': { src: image3, label: '외교 교섭의 공간', width: 2048, height: 1360 },
  'territorial-administration': { src: image4, label: '조약과 행정 인계 검토', width: 2048, height: 1360 },
  'treasury-ledger': { src: image5, label: '재정 장부와 예산 검토', width: 2048, height: 1360 },
  'market-exchange': { src: image6, label: '시장과 기업 활동', width: 2048, height: 1360 },
  'research-laboratory': { src: image7, label: '실험과 검증의 작업대', width: 2048, height: 1360 },
  'equipment-workbench': { src: image8, label: '장비 설계와 정비 도구', width: 2048, height: 1360 },
  'production-logistics': { src: image9, label: '생산과 보급의 준비', width: 2048, height: 1360 },
  'land-operations': { src: image10, label: '야전 지휘의 도구', width: 2048, height: 1360 },
  'naval-operations': { src: image11, label: '해상 작전과 항해 준비', width: 2048, height: 1360 },
  'air-operations': { src: image12, label: '항공 작전과 비행 준비', width: 2048, height: 1360 },
  'constitution-assembly': { src: image13, label: '헌정 질서와 공적 절차', width: 2048, height: 1360 },
  'justice-chamber': { src: image14, label: '사법 기록과 심리 준비', width: 2048, height: 1360 },
  'election-campaign': { src: image15, label: '선거와 시민의 선택', width: 2048, height: 1360 },
  'civilian-work': { src: image16, label: '민간인의 생활과 배움', width: 2048, height: 1360 },
  'clandestine-network': { src: image17, label: '연락과 정보 검토', width: 2048, height: 1360 },
  'royal-council': { src: image18, label: '왕실의 의전과 권한', width: 2048, height: 1360 },
  'socialist-planning': { src: image19, label: '공동 계획과 대표 협의', width: 2048, height: 1360 },
  'independence-network': { src: image20, label: '독립운동의 연락과 기록', width: 2048, height: 1360, minYear: 1936, maxYear: 1959 },
  'national-reconstruction': { src: image21, label: '국가 운영과 공공 기반', width: 2048, height: 1360 },
  'civilian-relief': { src: image22, label: '민간 보호와 구호 준비', width: 2048, height: 1360 },
  'postwar-command': { src: image23, label: '후기 산업시대의 업무 공간', width: 2048, height: 1360, minYear: 1960, maxYear: 1999 },
  'modern-command': { src: image24, label: '디지털 시대의 업무 공간', width: 2048, height: 1360, minYear: 2000, maxYear: 2060, futureSymbolic: true },
} satisfies Record<string, GameArtwork>;

export type GameIllustrationScene = keyof typeof gameArtworkCatalog;

export function getGameArtwork(scene: unknown, year?: number): GameArtwork | null {
  if (typeof scene !== 'string' || !Object.hasOwn(gameArtworkCatalog, scene)) return null;
  const art: GameArtwork = gameArtworkCatalog[scene as GameIllustrationScene];
  if (art.minYear !== undefined && (year === undefined || !Number.isFinite(year) || year < art.minYear || year > art.maxYear!)) return null;
  return art;
}
