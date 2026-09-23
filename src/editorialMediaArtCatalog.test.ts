import { describe, expect, it } from 'vitest';
import { getEditorialMediaArtwork } from './editorialMediaArtCatalog';
import { getNewsMediaEra, getNewsMediaTimeline } from './newsMediaEvolution';

describe('editorial media illustration selection', () => {
  it.each([
    ['wartime-press', 'press', 'press-newsroom.webp'],
    ['radio-wire', 'radio', 'radio-newsroom.webp'],
    ['television-bulletin', 'television', 'television-newsroom.webp'],
    ['satellite-network', 'television', 'television-newsroom.webp'],
    ['web-edition', 'digital', 'digital-newsroom.webp'],
    ['live-feed', 'digital', 'digital-newsroom.webp'],
    ['civic-network', 'digital', 'digital-newsroom.webp'],
  ])('selects %s without consulting the current campaign', (mediaId, id, filename) => {
    const art = getEditorialMediaArtwork(mediaId);
    expect(art).toMatchObject({ id });
    expect(art?.src).toContain(filename);
    expect(art?.label).toBeTruthy();
    expect(art).toMatchObject({ width: 2688, height: 1520 });
    expect(art).toBe(getEditorialMediaArtwork(mediaId));
  });

  it.each([1942, 1953, 1954, 1967, 1968, 1988, 1989, 2004, 2005, 2015, 2016, 2034, 2035, 2060])('covers the media boundary year %s', (year) => {
    expect(getEditorialMediaArtwork(getNewsMediaEra(year).id)).not.toBeNull();
  });

  it.each([undefined, null, '', 'unknown-era', 'toString', 'constructor', '__proto__', NaN, 1942, {}])('omits art for an unknown identifier: %s', (mediaId) => {
    expect(getEditorialMediaArtwork(mediaId)).toBeNull();
  });

  it('stores presentation metadata only, with no events, authority, or simulated outcomes', () => {
    for (const era of getNewsMediaTimeline()) {
      const art = getEditorialMediaArtwork(era.id)!;
      expect(Object.keys(art).every((key) => ['id', 'src', 'label', 'width', 'height'].includes(key))).toBe(true);
      expect(art).not.toHaveProperty('sourceEventId');
      expect(art).not.toHaveProperty('confidence');
      expect(art).not.toHaveProperty('actionTab');
    }
  });
});
