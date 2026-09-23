import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { WorldSiteArt } from './WorldSiteArt';
import { worldSceneArt } from './worldSceneArt';

describe('symbolic world site art', () => {
  it.each(['industry', 'health'] as const)('shows only the selected %s still life with explicit limits', (site) => {
    const html = renderToStaticMarkup(<WorldSiteArt site={site} />);
    expect(html).toContain(`data-world-site-art="${site}"`);
    expect(html).toContain(worldSceneArt[site].src);
    expect(html).toContain(worldSceneArt[site].alt);
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).toContain('분야를 상징한 삽화 · 실제 현장 사진 아님');
    expect(html).toContain('생산량·비축량·회복 여부를 나타내지 않습니다');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('width="2048" height="1360"');
    expect(html).not.toContain('<button');
    expect(html).not.toContain('승리 확정');
    expect(html).not.toContain('복구 완료');
  });

  it.each(['market', 'council', '', 'unknown', 'constructor', '__proto__'])('keeps %s on the existing neutral schematic without substitute art', (site) => {
    expect(renderToStaticMarkup(<WorldSiteArt site={site} />)).toBe('');
  });
});
