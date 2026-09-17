/** A display-geometry gate, not proof of roads, bridge access or transit rights. */
export function findLandGeographyRegressions(results, { maxWaterRunKm = 10 } = {}) {
  if (!Number.isFinite(maxWaterRunKm) || maxWaterRunKm < 0) throw new RangeError('Invalid water-run budget');
  const failures = [];
  for (const result of results) {
    const pair = Array.isArray(result.pair) ? result.pair.join(':') : result.pair;
    const reasons = [];
    for (const field of ['vertices', 'samples', 'distanceKm', 'longestSeaRunKm', 'longestLakeRunKm', 'outsideKm']) {
      if (!Number.isFinite(result[field]) || result[field] < 0) reasons.push(`Invalid ${field}`);
    }
    if (result.geometryIssue) reasons.push(result.geometryIssue);
    if (!result.coincidentAnchor && (result.vertices < 2 || result.samples === 0)) reasons.push('Missing sampled geometry');
    if (result.longestSeaRunKm > maxWaterRunKm) reasons.push(`Sea chord ${result.longestSeaRunKm} km > ${maxWaterRunKm} km`);
    if (result.longestLakeRunKm > maxWaterRunKm) reasons.push(`Lake chord ${result.longestLakeRunKm} km > ${maxWaterRunKm} km`);
    if (result.outsideKm > 0) reasons.push(`Outside map bounds: ${result.outsideKm} km`);
    if (reasons.length) failures.push({ pair, reasons });
  }
  return failures;
}
