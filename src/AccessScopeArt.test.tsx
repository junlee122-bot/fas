import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AccessScopeArt, getAccessScopeArtwork } from './AccessScopeArt';

describe('Higgsfield access-rights illustrations', () => {
  it.each(['transit', 'naval-base'])('shows distinct native-resolution %s artwork with a read-only viewer', (kind) => {
    const html = renderToStaticMarkup(<AccessScopeArt kind={kind} year={1942} />);
    expect(html).toContain(`data-access-art="${kind}"`);
    expect(html).toContain('width="3504" height="2336"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('상징 삽화 · 실제 기록 아님');
    expect(html).toContain('게임 시간·명령·성과·저장 기록을 변경하지 않습니다');
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).not.toContain('확인 후 집행');
  });
  it.each([1935, 1960, 2020, 2060, NaN, Infinity, 1942.5])('never depicts modern %s with wartime equipment', (year) => {
    expect(renderToStaticMarkup(<AccessScopeArt kind="transit" year={year} />)).toBe('');
  });
  it.each(['', 'constructor', '__proto__', 'air-base'])('rejects unsupported scene %s', (kind) => {
    expect(getAccessScopeArtwork(kind, 1942)).toBeNull();
  });
  it('keeps both era boundaries and separate scene files', () => {
    expect(getAccessScopeArtwork('transit', 1936)).not.toBeNull();
    expect(getAccessScopeArtwork('naval-base', 1959)).not.toBeNull();
    expect(getAccessScopeArtwork('transit', 1942)?.src).not.toBe(getAccessScopeArtwork('naval-base', 1942)?.src);
  });
});
