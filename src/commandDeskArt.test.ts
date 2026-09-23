import { describe, expect, it } from 'vitest';
import { getCommandDeskArtwork } from './commandDeskArt';

describe('command desk illustration boundaries', () => {
  it.each(['military', 'politics', 'intelligence'] as const)('supplies an existing illustration for %s without fictional event data', (branch) => {
    const art = getCommandDeskArtwork(branch, 1942);
    expect(art?.src).toMatch(/\.webp/);
    expect(art?.label).toBeTruthy();
    expect(Object.keys(art!)).toEqual(['src', 'label']);
  });
  it.each([undefined, NaN, Infinity, 1935, 2061])('has a text-only fallback outside the supported era: %s', (year) => {
    expect(getCommandDeskArtwork('military', year)).toBeNull();
  });

  describe.each(['military', 'politics', 'intelligence'] as const)('%s era boundary regression', (branch) => {
    it.each([1936, 1959])('includes the supported boundary year %s', (year) => {
      const art = getCommandDeskArtwork(branch, year);
      expect(art).toEqual(getCommandDeskArtwork(branch, 1942));
      expect(art?.src).toMatch(/\.webp/);
      expect(art?.label).toBeTruthy();
      expect(Object.keys(art!)).toEqual(['src', 'label']);
    });

    it.each([1935, 2061, undefined, NaN, Infinity])('excludes unsupported or unknown year %s', (year) => {
      expect(getCommandDeskArtwork(branch, year)).toBeNull();
    });
  });

  it.each(['military', 'politics', 'intelligence'] as const)('uses era-specific environments after1959 for %s', (branch) => {
    const wartime = getCommandDeskArtwork(branch, 1959)!;
    const postwar = getCommandDeskArtwork(branch, 1960)!;
    const modern = getCommandDeskArtwork(branch, 2000)!;
    expect(postwar.src).toContain('postwar-command');
    expect(modern.src).toContain('modern-command');
    expect(postwar.src).not.toBe(wartime.src);
    expect(getCommandDeskArtwork(branch, 1999)).toEqual(postwar);
    expect(getCommandDeskArtwork(branch, 2060)).toEqual(modern);
    expect(Object.keys(postwar)).toEqual(['src', 'label']);
  });
});
