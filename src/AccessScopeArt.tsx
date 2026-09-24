import transitArt from './assets/access-rights/transit-corridor.webp';
import navalArt from './assets/access-rights/naval-basing.webp';
import { ArtworkViewer } from './ArtworkViewer';
import './AccessScopeArt.css';

const accessArtwork = {
  transit: { src: transitArt, label: '국경 통행과 연락 업무' },
  'naval-base': { src: navalArt, label: '항구 이용과 정비 준비' },
} as const;

/** Symbolic period artwork, not a live rendering of territorial control. */
export function getAccessScopeArtwork(kind: string, year: number) {
  if (!Number.isInteger(year) || year < 1936 || year > 1959 || !Object.hasOwn(accessArtwork, kind)) return null;
  return accessArtwork[kind as keyof typeof accessArtwork];
}

export function AccessScopeArt({ kind, year }: { kind: string; year: number }) {
  const art = getAccessScopeArtwork(kind, year);
  if (!art) return null;
  return <figure className="access-scope-art" data-access-art={kind}>
    <ArtworkViewer src={art.src} label={art.label} width={3504} height={2336} disclosure="상징 삽화 · 실제 통행·기지 기록 아님" />
    <figcaption>상징 삽화 · 실제 기록 아님</figcaption>
  </figure>;
}
