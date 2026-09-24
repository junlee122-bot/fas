import { test } from 'node:test';
// Named separately from *.test.* so Vitest does not collect this Node harness.
import assert from 'node:assert/strict';
import { findLandGeographyRegressions } from './land-geography-regression.mjs';

const route = { pair: ['a', 'b'], vertices: 3, samples: 10, distanceKm: 20,
  longestSeaRunKm: 0, longestLakeRunKm: 0, outsideKm: 0, coincidentAnchor: false };
test('valid land geometry and explicitly verified coincident anchors pass', () => {
  assert.deepEqual(findLandGeographyRegressions([route, { ...route, vertices: 0, samples: 0, distanceKm: 0, coincidentAnchor: true }]), []);
});
test('sea and lake chords, missing geometry and off-map paths fail independently', () => {
  for (const changes of [{ longestSeaRunKm: 10.01 }, { longestLakeRunKm: 10.01 },
    { vertices: 0, samples: 0 }, { outsideKm: .01 }, { geometryIssue: 'Missing anchor' },
    { distanceKm: NaN }, { samples: -1 }, { longestLakeRunKm: undefined }, { vertices: undefined }]) {
    assert.equal(findLandGeographyRegressions([{ ...route, ...changes }]).length, 1, JSON.stringify(changes));
  }
});
test('the budget is inclusive, configurable and does not ignore a missing anchor as coincident', () => {
  assert.deepEqual(findLandGeographyRegressions([{ ...route, longestSeaRunKm: 10 }]), []);
  assert.equal(findLandGeographyRegressions([{ ...route, longestSeaRunKm: 10 }], { maxWaterRunKm: 5 }).length, 1);
  assert.equal(findLandGeographyRegressions([{ ...route, coincidentAnchor: true, geometryIssue: 'Missing anchor' }]).length, 1);
  assert.throws(() => findLandGeographyRegressions([route], { maxWaterRunKm: NaN }), RangeError);
});
