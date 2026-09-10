import { describe, expect, it } from 'vitest';
import { territories } from './data';
import { strategicFronts } from './strategicMapData';

const expandedFrontIds = [
  'normandy-bocage', 'rhone-provence', 'norway-narvik', 'minsk-berezina', 'crimea-sevastopol', 'aegean-greece',
  'chindwin-burma', 'singapore-johor', 'lower-yangtze', 'korea-liberation', 'ryukyu-okinawa', 'philippine-resistance',
];

describe('expanded strategic fronts', () => {
  it('adds twelve separately commanded fronts', () => {
    expect(strategicFronts).toHaveLength(78);
    expect(expandedFrontIds.every((id) => strategicFronts.some((front) => front.id === id))).toBe(true);
  });

  it('anchors every new front to at least one calibrated map territory', () => {
    expandedFrontIds.forEach((frontId) => {
      expect(territories.some((territory) => territory.frontId === frontId), frontId).toBe(true);
    });
  });
});
