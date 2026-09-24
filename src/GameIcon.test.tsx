import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GAME_ICON_NAMES, GameIcon, type GameIconTone } from './GameIcon';

describe('hand-drawn operational icon family', () => {
  it('provides 40 distinct vector symbols without raster downloads', () => {
    expect(GAME_ICON_NAMES).toHaveLength(40);
    expect(new Set(GAME_ICON_NAMES).size).toBe(40);
    const glyphs = GAME_ICON_NAMES.map((name) => {
      const html = renderToStaticMarkup(<GameIcon name={name} />);
      return html.match(/<svg[\s\S]*<\/svg>/)?.[0];
    });
    expect(glyphs.every(Boolean)).toBe(true);
    expect(new Set(glyphs).size).toBe(40);
  });

  it.each(GAME_ICON_NAMES)('renders %s with shared geometry and transparent negative space', (name) => {
    const html = renderToStaticMarkup(<GameIcon name={name} />);
    expect(html).toContain(`data-game-icon="${name}"`);
    expect(html).toContain('viewBox="0 0 28 28"');
    expect(html).toContain('class="game-icon-line"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toMatch(/game-icon-cut|<image|<img|<filter|<mask|<text|https?:|tabindex/i);
  });

  it('exposes a supplied accessible label exactly once', () => {
    const html = renderToStaticMarkup(<GameIcon name="recruitment" label="인재 영입" />);
    expect(html).toContain('role="img" aria-label="인재 영입"');
    expect(html.match(/인재 영입/g)).toHaveLength(1);
    expect(html).not.toMatch(/<span[^>]*aria-hidden="true"/);
  });

  it('keeps decorative icons out of the accessibility tree', () => {
    const html = renderToStaticMarkup(<GameIcon name="command" />);
    expect(html).toMatch(/<span[^>]*aria-hidden="true"/);
    expect(html).not.toContain('role="img"');
  });

  it.each(['gold', 'blue', 'green', 'red', 'steel', 'muted'] as GameIconTone[])('preserves %s tone, size and existing framed/active styling contracts', (tone) => {
    const html = renderToStaticMarkup(<GameIcon name="naval" size={17} tone={tone} framed active className="test-marker" />);
    expect(html).toContain(`framed tone-${tone} active test-marker`);
    expect(html).toContain('--game-icon-size:17px');
  });

  it.each([NaN, Infinity, -1, 0])('uses a stable default for invalid size %s', (size) => {
    expect(renderToStaticMarkup(<GameIcon name="save" size={size} />)).toContain('--game-icon-size:22px');
  });
});
