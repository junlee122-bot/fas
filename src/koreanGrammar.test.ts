import { describe, expect, it } from 'vitest';
import { withJosa } from './koreanGrammar';

describe('Korean particles', () => {
  it('selects object and subject particles from the final consonant', () => {
    expect(withJosa('몽고메리', '을/를')).toBe('몽고메리를');
    expect(withJosa('앨런 튜링', '이/가')).toBe('앨런 튜링이');
    expect(withJosa('프랑스', '은/는')).toBe('프랑스는');
  });

  it('handles rieul for the instrumental particle', () => {
    expect(withJosa('서울', '으로/로')).toBe('서울로');
    expect(withJosa('런던', '으로/로')).toBe('런던으로');
    expect(withJosa('공작(김)', '을/를')).toBe('공작(김)을');
  });
});
