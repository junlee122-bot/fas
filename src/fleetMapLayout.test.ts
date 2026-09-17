import { describe, expect, it } from 'vitest';
import { FLEET_MAP_CHIP_SIZE, layoutFleetMapChips, type FleetMapAnchor, type FleetMapObstacle } from './fleetMapLayout';

const viewport = { x: 0, y: 0, width: 1200, height: 760 };

describe('fleet map click-target collision layout', () => {
  it('retains an unobstructed ship at its exact point without unnecessary displacement', () => {
    expect(layoutFleetMapChips([{ id: 'solo', x: 600, y: 380 }], [], 1, viewport))
      .toEqual([{ id: 'solo', offsetX: 0, offsetY: 0 }]);
  });

  it.each([.25, .5, 1, 2, 4])('protects city and label targets with a full-size fleet chip at scale %s', (scale) => {
    const anchor = { id: 'scapa', x: 600 * scale, y: 380 * scale };
    const obstacles = [
      { x: anchor.x, y: anchor.y, width: 44, height: 44 },
      { x: anchor.x, y: anchor.y - 29 * scale, width: 170, height: 22 },
      { x: anchor.x + 38 * scale, y: anchor.y + 26 * scale, width: 47, height: 32 },
    ];
    const before = structuredClone({ anchor, obstacles });
    const [chip] = layoutFleetMapChips([anchor], obstacles, scale, { x: 0, y: 0, width: 1200 * scale, height: 760 * scale });
    expect(chip).toBeDefined();
    for (const obstacle of obstacles) {
      const dx = anchor.x / scale + chip.offsetX - obstacle.x / scale;
      const dy = anchor.y / scale + chip.offsetY - obstacle.y / scale;
      expect(Math.abs(dx) >= FLEET_MAP_CHIP_SIZE / 2 + obstacle.width / 2 + 6 - .0001
        || Math.abs(dy) >= FLEET_MAP_CHIP_SIZE / 2 + obstacle.height / 2 + 6 - .0001).toBe(true);
    }
    expect({ anchor, obstacles }).toEqual(before);
  });

  it('keeps twelve colocated and nearby fleets separately clickable and stable under input reordering', () => {
    const anchors: FleetMapAnchor[] = Array.from({ length: 12 }, (_, index) => ({ id: `fleet-${index}`, x: 600 + index % 3, y: 380 }));
    const obstacles = [{ x: 600, y: 380, width: 44, height: 44 }];
    const chips = layoutFleetMapChips(anchors, obstacles, 1, viewport);
    expect(chips).toHaveLength(12);
    expect(layoutFleetMapChips([...anchors].reverse(), obstacles, 1, viewport)).toEqual(chips);
    chips.forEach((chip, index) => {
      const anchor = anchors.find((item) => item.id === chip.id)!;
      for (const other of chips.slice(index + 1)) {
        const otherAnchor = anchors.find((item) => item.id === other.id)!;
        const dx = Math.abs(anchor.x + chip.offsetX - otherAnchor.x - other.offsetX);
        const dy = Math.abs(anchor.y + chip.offsetY - otherAnchor.y - other.offsetY);
        expect(dx >= FLEET_MAP_CHIP_SIZE + 6 - .0001 || dy >= FLEET_MAP_CHIP_SIZE + 6 - .0001).toBe(true);
      }
    });
  });

  it.each([[1, 1], [1199, 1], [1, 759], [1199, 759]])('keeps the entire target in the viewport near %s,%s without modifying its anchor', (x, y) => {
    const anchor = { id: 'edge', x, y };
    const [chip] = layoutFleetMapChips([anchor], [{ x, y, width: 44, height: 44 }], 1, viewport);
    expect(chip).toBeDefined();
    expect(x + chip.offsetX).toBeGreaterThanOrEqual(26);
    expect(x + chip.offsetX).toBeLessThanOrEqual(1174);
    expect(y + chip.offsetY).toBeGreaterThanOrEqual(26);
    expect(y + chip.offsetY).toBeLessThanOrEqual(734);
    expect(anchor).toEqual({ id: 'edge', x, y });
  });

  it('does not trade a blocked city for a smaller or overlapping fleet target when no slot exists', () => {
    expect(layoutFleetMapChips([{ id: 'tiny', x: 12, y: 12 }], [], 1, { x: 0, y: 0, width: 24, height: 24 })).toEqual([]);
    expect(layoutFleetMapChips([{ id: 'blocked', x: 600, y: 380 }], [{ x: 600, y: 380, width: 2400, height: 1520 }], 1, viewport)).toEqual([]);
  });

  it('ignores non-finite obstacles and invalid anchors instead of producing NaN positions', () => {
    const invalid: FleetMapObstacle[] = [{ x: NaN, y: 1, width: 44, height: 44 }, { x: 600, y: 380, width: -44, height: 44 }];
    expect(layoutFleetMapChips([{ id: 'valid', x: 600, y: 380 }, { id: 'invalid', x: Infinity, y: 0 }], invalid, NaN, viewport))
      .toEqual([{ id: 'valid', offsetX: 0, offsetY: 0 }]);
  });
});
