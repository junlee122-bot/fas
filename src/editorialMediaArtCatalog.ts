import press from './assets/editorial-media/press-newsroom.webp';
import radio from './assets/editorial-media/radio-newsroom.webp';
import television from './assets/editorial-media/television-newsroom.webp';
import digital from './assets/editorial-media/digital-newsroom.webp';
import type { NewsMediaEraId } from './newsMediaEvolution';

export interface EditorialMediaArtwork {
  readonly id: 'press' | 'radio' | 'television' | 'digital';
  readonly src: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
}

/** Generated newsroom atmosphere, never evidence of the issue's reported events.
 * This presentation-only lookup does not read or change game state or saves. */
const artwork = {
  press: { id: 'press', src: press, label: '인쇄와 전신으로 소식을 전하는 편집국', width: 2688, height: 1520 },
  radio: { id: 'radio', src: radio, label: '목소리와 단파를 연결하는 라디오 편집국', width: 2688, height: 1520 },
  television: { id: 'television', src: television, label: '방송 자료를 검토하는 텔레비전 편집국', width: 2688, height: 1520 },
  digital: { id: 'digital', src: digital, label: '출처와 정보를 확인하는 디지털 편집국', width: 2688, height: 1520 },
} satisfies Record<string, EditorialMediaArtwork>;

const artworkByEra: Record<NewsMediaEraId, EditorialMediaArtwork> = {
  'wartime-press': artwork.press,
  'radio-wire': artwork.radio,
  'television-bulletin': artwork.television,
  'satellite-network': artwork.television,
  'web-edition': artwork.digital,
  'live-feed': artwork.digital,
  'civic-network': artwork.digital,
};

export function getEditorialMediaArtwork(mediaId: unknown): EditorialMediaArtwork | null {
  if (typeof mediaId !== 'string' || !Object.hasOwn(artworkByEra, mediaId)) return null;
  return artworkByEra[mediaId as NewsMediaEraId];
}
