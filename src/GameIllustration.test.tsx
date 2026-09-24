import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GameIllustration } from './GameIllustration';
import { gameArtworkCatalog, getGameArtwork, type GameArtwork, type GameIllustrationScene } from './gameIllustrationCatalog';

describe('broad symbolic illustration library', () => {
  it('contains24 distinct local illustrations, without inferred world state', () => {
    const entries = Object.values(gameArtworkCatalog);
    expect(entries).toHaveLength(24);
    expect(new Set(entries.map((art) => art.src)).size).toBe(24);
    for (const art of entries) {
      expect(art.src).toContain('.webp');
      expect(art.src).not.toMatch(/^https?:/);
      expect(art.width).toBe(2048);
      expect(art.height).toBe(1360);
    }
  });

  it.each(Object.keys(gameArtworkCatalog) as GameIllustrationScene[])('renders%s as lazy artwork with read-only inspection, never a game action or result', (scene) => {
    const art: GameArtwork = gameArtworkCatalog[scene];
    const html = renderToStaticMarkup(<GameIllustration scene={scene} year={art.minYear} compact />);
    expect(html).toContain(`data-game-illustration="${scene}"`);
    expect(html).toContain('상징 삽화 · 실제 기록 아님');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('width="2048" height="1360"');
    expect(html).toContain('alt=""');
    expect(html).toContain(`aria-label="${art.label} · 삽화 확대"`);
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('그림 열람은 게임 시간·명령·성과·저장 기록을 변경하지 않습니다.');
    expect(html).not.toMatch(/<a |<input|rel="preload"/);
  });

  it.each([null, undefined, '', 'unknown', 'constructor', '__proto__'])('omits unknown scene%s', (scene) => {
    expect(getGameArtwork(scene)).toBeNull();
  });

  it.each([
    ['independence-network', 1936, 1959],
    ['postwar-command', 1960, 1999],
    ['modern-command', 2000, 2060],
  ] as const)('enforces year bounds for%s', (scene, start, end) => {
    expect(getGameArtwork(scene, start)).not.toBeNull();
    expect(getGameArtwork(scene, end)).not.toBeNull();
    for (const year of [undefined, NaN, Infinity, start - 1, end + 1]) {
      expect(getGameArtwork(scene, year)).toBeNull();
      expect(renderToStaticMarkup(<GameIllustration scene={scene} year={year} />)).toBe('');
    }
  });

  it('uses explicit future language and keeps the title outside image pixels', () => {
    const html = renderToStaticMarkup(<GameIllustration scene="modern-command" year={2060} />);
    expect(html).toContain('<strong>디지털 시대의 업무 공간</strong>');
    expect(html).toContain('미래 환경의 상징적 표현');
    expect(renderToStaticMarkup(<GameIllustration scene="modern-command" year={2000} />)).not.toContain('미래 환경의 상징적 표현');
  });
});
