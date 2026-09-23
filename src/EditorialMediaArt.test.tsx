import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EditorialMediaArt } from './EditorialMediaArt';
import { getEditorialMediaArtwork } from './editorialMediaArtCatalog';

describe('editorial media figure', () => {
  it('labels art as atmosphere and keeps its caption in HTML', () => {
    const art = getEditorialMediaArtwork('wartime-press')!;
    const html = renderToStaticMarkup(<EditorialMediaArt mediaId="wartime-press" />);
    expect(html).toContain('data-media-art="press"');
    expect(html).toContain('data-media-era="wartime-press"');
    expect(html).toContain('<figcaption>');
    expect(html).toContain(art.label);
    expect(html).toContain('보도 환경 삽화 · 실제 사건 사진 아님');
    expect(html).toContain('alt=""');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain(`width="${art.width}"`);
    expect(html).toContain(`height="${art.height}"`);
    expect(html).not.toContain('<button');
    expect(html).not.toContain('<a ');
    expect(html).not.toContain('rel="preload"');
  });

  it('adds a symbolic-future note only to the future civic medium', () => {
    const future = renderToStaticMarkup(<EditorialMediaArt mediaId="civic-network" />);
    const present = renderToStaticMarkup(<EditorialMediaArt mediaId="live-feed" />);
    expect(future).toContain('미래 매체의 상징적 표현');
    expect(present).not.toContain('미래 매체의 상징적 표현');
    expect(future).toContain('data-media-art="digital"');
  });

  it('offers a compact presentation without changing the selected asset', () => {
    const html = renderToStaticMarkup(<EditorialMediaArt mediaId="radio-wire" compact />);
    expect(html).toContain('editorial-media-art--compact');
    expect(html).toContain('data-media-art="radio"');
    expect(html).toContain('보도 환경 삽화 · 실제 사건 사진 아님');
  });

  it.each([undefined, null, 'not-a-media-era', 'constructor'])('renders nothing for unsupported media %s', (mediaId) => {
    expect(renderToStaticMarkup(<EditorialMediaArt mediaId={mediaId} />)).toBe('');
  });
});
