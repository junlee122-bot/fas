import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { HeadquartersRoomArt, type HeadquartersRoomArtKind } from './HeadquartersRoomArt';

const kinds: HeadquartersRoomArtKind[] = ['command', 'research', 'warehouse', 'workshop', 'infirmary', 'personnel', 'diplomacy', 'treasury'];

describe('headquarters furnishing layer', () => {
  it.each(kinds)('renders %s as decorative furnishing, without overlapping interaction', kind => {
    const html = renderToStaticMarkup(<HeadquartersRoomArt kind={kind} />);
    expect(html).toContain('viewBox="0 0 240 135"');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('focusable="false"');
    expect(html).toContain('pointer-events:none');
    expect(html).toContain(`data-room-art="${kind}"`);
    expect(html).not.toMatch(/<text\b|<button\b|tabindex=|<image\b/);
  });

  it('uses distinct furnishing silhouettes for all eight facilities', () => {
    const drawings = kinds.map(kind => renderToStaticMarkup(<HeadquartersRoomArt kind={kind} />).match(/<g stroke-linejoin="round"[\s\S]*<\/g>/)?.[0]);
    expect(drawings.every(Boolean)).toBe(true);
    expect(new Set(drawings).size).toBe(kinds.length);
  });

  it('isolates paint and shadow ids when multiple facilities are rendered', () => {
    const html = renderToStaticMarkup(<>{kinds.map(kind => <HeadquartersRoomArt key={kind} kind={kind} />)}</>);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    expect(ids).toHaveLength(kinds.length * 3);
    expect(new Set(ids).size).toBe(ids.length);
    const references = [...html.matchAll(/url\(#([^)]*)\)/g)].map(match => match[1]);
    expect(references.every(ref => ids.includes(ref))).toBe(true);
  });

  it('changes apparatus presentation, not controls or game state, in the modern era', () => {
    const period = renderToStaticMarkup(<HeadquartersRoomArt kind="command" />);
    const modern = renderToStaticMarkup(<HeadquartersRoomArt kind="command" modern />);
    expect(period).toContain('data-apparatus="radio"');
    expect(modern).toContain('data-apparatus="terminal"');
    expect(modern).toContain('data-era-furnishing="modern"');
    expect(modern).not.toContain('onclick');
  });
});
