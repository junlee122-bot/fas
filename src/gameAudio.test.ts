import { describe, expect, it } from 'vitest';
import { inferGameAudioCue, playGameAudioCue } from './gameAudio';

describe('game audio cues', () => {
  it('maps important outcomes to distinct feedback', () => {
    expect(inferGameAudioCue('쿠데타 위기가 발생했습니다.')).toBe('warning');
    expect(inferGameAudioCue('작전 목표 확보 완료')).toBe('confirm');
    expect(inferGameAudioCue('새 보고가 도착했습니다.')).toBe('report');
  });

  it('stays a safe no-op when audio is disabled', () => {
    expect(() => playGameAudioCue('confirm', false)).not.toThrow();
  });
});
