import { getEditorialMediaArtwork } from './editorialMediaArtCatalog';
import './EditorialMediaArt.css';

interface EditorialMediaArtProps {
  mediaId?: string | null;
  compact?: boolean;
}

export function EditorialMediaArt({ mediaId, compact = false }: EditorialMediaArtProps) {
  const artwork = getEditorialMediaArtwork(mediaId);
  if (!artwork) return null;

  return (
    <figure className={`editorial-media-art${compact ? ' editorial-media-art--compact' : ''}`} data-media-art={artwork.id} data-media-era={mediaId}>
      <img src={artwork.src} alt="" width={artwork.width} height={artwork.height} loading="lazy" decoding="async" />
      <figcaption>
        <strong>{artwork.label}</strong>
        <span>보도 환경 삽화 · 실제 사건 사진 아님</span>
        {mediaId === 'civic-network' ? <span>미래 매체의 상징적 표현</span> : null}
      </figcaption>
    </figure>
  );
}
