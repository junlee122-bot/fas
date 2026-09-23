import { getGameArtwork } from './gameIllustrationCatalog';
import type { GameIllustrationScene } from './gameIllustrationCatalog';
import { ArtworkViewer } from './ArtworkViewer';
import './GameIllustration.css';

export interface GameIllustrationProps {
  scene: GameIllustrationScene;
  compact?: boolean;
  year?: number;
}

/** A supporting figure with read-only inspection, never a simulated scene or game action. */
export function GameIllustration({ scene, compact = false, year }: GameIllustrationProps) {
  const art = getGameArtwork(scene, year);
  if (!art) return null;
  return <figure className={`game-illustration${compact ? ' game-illustration--compact' : ''}`} data-game-illustration={scene} aria-label={art.label}>
    <ArtworkViewer src={art.src} label={art.label} width={art.width} height={art.height} disclosure="상징 삽화 · 실제 기록 아님" note={art.futureSymbolic && year !== undefined && year >= 2035 ? '미래 환경의 상징적 표현' : undefined} />
    <figcaption>
      {!compact ? <strong>{art.label}</strong> : null}
      <span>상징 삽화 · 실제 기록 아님</span>
      {art.futureSymbolic && year !== undefined && year >= 2035 ? <span>미래 환경의 상징적 표현</span> : null}
    </figcaption>
  </figure>;
}
