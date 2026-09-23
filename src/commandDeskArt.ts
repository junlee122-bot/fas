import cabinet from './assets/command-desk/politics-workroom.webp';
import fieldCommand from './assets/command-desk/military-workroom.webp';
import intelligence from './assets/command-desk/intelligence-workroom.webp';
import type { CareerBranch } from './types';
import { getGameArtwork } from './gameIllustrationCatalog';

/** Higgsfield-generated atmosphere, not archival evidence or named-person portraits.
 * Original PNGs and production provenance are preserved under design/.
 * Keep asset selection independent of simulation state and achievements. */
const artwork = {
  military: { src: fieldCommand, label: '지휘부와 작전실' },
  politics: { src: cabinet, label: '정책을 논의하는 참모진' },
  intelligence: { src: intelligence, label: '정보를 검토하는 연락실' },
} satisfies Record<CareerBranch, { src: string; label: string }>;

export function getCommandDeskArtwork(branch: CareerBranch, year?: number) {
  if (year === undefined || !Number.isFinite(year) || year < 1936 || year > 2060) return null;
  if (year >= 1960) {
    const later = getGameArtwork(year < 2000 ? 'postwar-command' : 'modern-command', year);
    return later ? { src: later.src, label: later.label } : null;
  }
  return artwork[branch];
}
