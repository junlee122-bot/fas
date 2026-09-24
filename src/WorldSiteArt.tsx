import { worldSceneArt } from './worldSceneArt';
import './WorldSiteArt.css';

export function WorldSiteArt({ site }: { site: string }) {
  const art = site === 'industry' ? worldSceneArt.industry : site === 'health' ? worldSceneArt.health : null;
  if (!art) return null;

  return <figure className="world-site-art" data-world-site-art={site}>
    <img src={art.src} alt={art.alt} width={art.width} height={art.height} loading="lazy" decoding="async" />
    <figcaption><strong>{art.title}</strong><span>분야를 상징한 삽화 · 실제 현장 사진 아님</span><small>생산량·비축량·회복 여부를 나타내지 않습니다. 현재 상태는 실제 지표와 결산으로 확인하세요.</small></figcaption>
  </figure>;
}
