import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ArtworkViewer } from './ArtworkViewer';
import source from './ArtworkViewer.tsx?raw';

const artwork = { src: '/example.webp', label: '연구 작업대', width: 2048, height: 1360, disclosure: '상징 삽화 · 실제 기록 아님' };

describe('read-only artwork viewer', () => {
  it('exposes a named keyboard-operable dialog trigger and keeps original image dimensions', () => {
    const html = renderToStaticMarkup(<ArtworkViewer {...artwork} />);
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="연구 작업대 · 삽화 확대"');
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-controls=');
    expect(html).toContain('width="2048" height="1360" loading="lazy" decoding="async"');
    expect(html.match(/<img /g)).toHaveLength(1);
    expect(html).not.toContain('rel="preload"');
  });

  it('starts closed, has an autofocus close control, and preserves the artwork disclosure', () => {
    const html = renderToStaticMarkup(<ArtworkViewer {...artwork} note="미래 환경의 상징적 표현" />);
    expect(html).toMatch(/<dialog[^>]+aria-labelledby=[^>]+aria-describedby=/);
    expect(html).not.toMatch(/<dialog[^>]+\sopen(?:\s|=|>)/);
    expect(html).toContain('aria-label="삽화 확대 닫기"');
    expect(html).toContain('autofocus=""');
    expect(html).toContain('상징 삽화 · 실제 기록 아님');
    expect(html).toContain('미래 환경의 상징적 표현');
    expect(html).toContain('Esc 키로 닫을 수 있습니다.');
  });

  it('uses native modal focus isolation, explicit restoration, and no game-state writes', () => {
    expect(source).toContain('dialog.showModal()');
    expect(source).toContain('dialogRef.current?.close()');
    expect(source).toContain('onClose={restoreTrigger}');
    expect(source).toContain('focus({ preventScroll: true })');
    expect(source).toContain('createPortal(dialog, document.body)');
    expect(source).toContain('onError={() => setImageFailed(true)}');
    expect(source).toContain('<p role="status">');
    expect(source).not.toMatch(/localStorage|sessionStorage|Math\.random|onAction|onNextWeek|dispatch\(/);
  });
});
