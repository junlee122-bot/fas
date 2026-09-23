import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { historicalPortraits, resolveHistoricalPortrait } from './historicalPortraits';
import { PersonPortrait } from './PersonPortrait';

describe('historical illustrated portraits', () => {
  it('has unique local artwork and explicit reference-era labels', () => {
    expect(historicalPortraits.length).toBeGreaterThanOrEqual(20);
    expect(new Set(historicalPortraits.map((p) => p.id)).size).toBe(historicalPortraits.length);
    expect(new Set(historicalPortraits.map((p) => p.src)).size).toBe(historicalPortraits.length);
    for (const p of historicalPortraits) {
      expect(p.src).toContain('.webp');
      expect(p.src).not.toMatch(/^https?:/);
      expect(p.referenceEra).toContain('1940년대');
      for (const personId of p.personIds) expect(resolveHistoricalPortrait({ personId, name: p.name })).toBe(p);
    }
  });

  it.each(historicalPortraits)('renders $name as clearly labelled illustration without fetching external data', (portrait) => {
    const html = renderToStaticMarkup(<PersonPortrait personId={portrait.personIds[0]} name={portrait.name} />);
    expect(html).toContain(`data-person-portrait="${portrait.id}"`);
    expect(html).toContain('data-portrait-kind="illustrated"');
    expect(html).toContain('AI 재구성 초상 · 실제 사진 아님');
    expect(html).toContain('1940년대 참고 외형');
    expect(html).toContain('loading="lazy" decoding="async"');
    expect(html).toContain('width="2048" height="2048"');
    expect(html).not.toMatch(/<button|<a |<input|rel="preload"/);
  });

  it('resolves explicit aliases without partial names or office guesses', () => {
    expect(resolveHistoricalPortrait({ personId: 'w40-fr-charles-de-gaulle', name: '샤를 드 골' })?.id).toBe('de-gaulle');
    expect(resolveHistoricalPortrait({ name: '  ALAN   TURING  ' })?.id).toBe('turing');
    for (const name of ['튜링', '처칠의 후계자', '새 장군', 'constructor', '__proto__', '']) {
      expect(resolveHistoricalPortrait({ name })).toBeNull();
    }
  });

  it('fails closed for unregistered, blank, conflicting and replaced identities', () => {
    for (const personId of ['unknown', '', 'constructor', '__proto__', 'usa-roosevelt']) {
      expect(resolveHistoricalPortrait({ personId, name: '윈스턴 처칠' })).toBeNull();
    }
    expect(resolveHistoricalPortrait({ personId: 'britain-churchill', name: '새로 임명된 사람' })).toBeNull();
    expect(resolveHistoricalPortrait({ personId: 'player', name: '윈스턴 처칠' })).toBeNull();
    expect(resolveHistoricalPortrait({ personId: 'britain-churchill', name: '윈스턴 처칠', player: true })).toBeNull();
    expect(resolveHistoricalPortrait({ name: '마오쩌둥', player: true })).toBeNull();
  });

  it('never paints the replaced incumbent onto a player', () => {
    const html = renderToStaticMarkup(<PersonPortrait personId="britain-churchill" name="윈스턴 처칠" player />);
    expect(html).toContain('data-portrait-kind="player"');
    expect(html).toContain('실존 인물 초상 미사용');
    expect(html).not.toContain('<img');
  });

  it('keeps unknown people as name markers instead of fabricated faces', () => {
    const html = renderToStaticMarkup(<PersonPortrait personId="new-recruit" name="신규 참모" />);
    expect(html).toContain('data-portrait-kind="monogram"');
    expect(html).toContain('제작된 초상 없음');
    expect(html).not.toContain('<img');
  });
});
