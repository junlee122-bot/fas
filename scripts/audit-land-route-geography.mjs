/** Read-only audit; node scripts/audit-land-route-geography.mjs [--all] [--compact] [--limit=20] [--pair=a:b] [--segments] [--check] */
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import { findLandGeographyRegressions } from './land-geography-regression.mjs';

const server = await createServer({ logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const [{ territories }, { deriveMapConnections }, { classifyMapRoute }, { getGeographicConnectionPath }, projection, { getTerritoryGeography }] = await Promise.all([
    server.ssrLoadModule('/src/data.ts'), server.ssrLoadModule('/src/mapPresentation.ts'),
    server.ssrLoadModule('/src/mapRoutes.ts'), server.ssrLoadModule('/src/geographicRoutes.ts'),
    server.ssrLoadModule('/src/geographicProjection.ts'), server.ssrLoadModule('/src/territoryGeography.ts'),
  ]);

  // The checked SVGs use M/L/Z closed polygons and even-odd filling. Index
  // ray-casting edges by projected y to avoid re-scanning whole continents.
  function polygonIndex(path) {
    const buckets = new Map();
    for (const section of path.split('M').slice(1)) {
      const values = section.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
      const points = Array.from({ length: values.length / 2 }, (_, index) => [values[index * 2], values[index * 2 + 1]]);
      for (let index = 0; index < points.length; index += 1) {
        const a = points[index], b = points[(index + 1) % points.length];
        if (a[1] === b[1]) continue;
        for (let y = Math.floor(Math.min(a[1], b[1])); y <= Math.floor(Math.max(a[1], b[1])); y += 1) {
          if (!buckets.has(y)) buckets.set(y, []);
          buckets.get(y).push([a[0], a[1], b[0], b[1]]);
        }
      }
    }
    return ({ x, y }) => {
      let inside = false;
      for (const [ax, ay, bx, by] of buckets.get(Math.floor(y)) ?? []) {
        if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
      }
      return inside;
    };
  }
  const models = {};
  const assets = {};
  for (const theater of ['europe', 'asia']) {
    const text = await readFile(new URL(`../public/assets/geography/${theater}-natural-earth-10m.svg`, import.meta.url), 'utf8');
    const paths = [...text.matchAll(/<path\s+d="([^"]*)"[^>]*>/g)].map((match) => match[1]);
    if (paths.length !== 5) throw new Error(`Unexpected SVG layers: ${theater}`);
    const land = polygonIndex(paths[0]), minorIslands = polygonIndex(paths[2]), lakes = polygonIndex(paths[3]);
    models[theater] = (point) => {
      const geo = projection.unprojectGeographicPoint(theater, point);
      if (!projection.isGeographicPointInBounds(theater, geo)) return 'outside';
      if (lakes(point)) return 'lake';
      return land(point) || minorIslands(point) ? 'land' : 'sea';
    };
    assets[theater] = { sha256: createHash('sha256').update(text).digest('hex') };
  }
  const maskControls = [
    ['europe', 'London', 51.5, -.12, 'land'], ['asia', 'Delhi', 28.672, 77.228, 'land'],
    ['asia', 'George Town island', 5.414, 100.329, 'land'], ['asia', 'Bay of Bengal', 18, 88, 'sea'],
    ['europe', 'Mediterranean', 35, 18, 'sea'], ['europe', 'Lake Ladoga', 61, 31.5, 'lake'],
  ].map(([theater, name, latitude, longitude, expected]) => {
    const actual = models[theater](projection.projectGeographicPoint(theater, { latitude, longitude }));
    if (actual !== expected) throw new Error(`SVG mask control failed: ${name}: ${actual} != ${expected}`);
    return { name, expected, actual };
  });
  const radians = (degrees) => degrees * Math.PI / 180;
  const distanceKm = (a, b) => {
    const q = Math.sin(radians(b.latitude - a.latitude) / 2) ** 2
      + Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(radians(b.longitude - a.longitude) / 2) ** 2;
    return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, q))));
  };
  const allConnections = deriveMapConnections(territories);
  const counts = Object.fromEntries(['land', 'sea', 'sea-crossing'].map((kind) => [kind, allConnections.filter((connection) => connection.routeKind === kind).length]));
  const results = [];
  for (const connection of allConnections.filter((connection) => connection.routeKind === 'land')) {
    const { from, to } = connection;
    const theater = from.theater ?? 'europe';
    const geographicPath = getGeographicConnectionPath(theater, from, to, 'land');
    const anchors = [getTerritoryGeography(from.id), getTerritoryGeography(to.id)];
    const coincidentAnchor = !geographicPath && anchors.every(Boolean)
      && Math.abs(anchors[0].latitude - anchors[1].latitude) < 1e-7
      && Math.abs(anchors[0].longitude - anchors[1].longitude) < 1e-7;
    const geometryIssue = !anchors.every(Boolean) ? 'Missing geographic anchor'
      : !geographicPath && !coincidentAnchor ? 'Missing non-coincident route geometry'
      : geographicPath && /NaN|Infinity/.test(geographicPath.path) ? 'Non-finite route geometry' : undefined;
    const vertices = [...(geographicPath?.path ?? '').matchAll(/([ML])(-?[\d.]+),(-?[\d.]+)/g)]
      .map((match) => ({ command: match[1], x: Number(match[2]), y: Number(match[3]) }));
    const categoryKm = { land: 0, sea: 0, lake: 0, outside: 0 };
    const segments = [];
    let samples = 0, seaRunKm = 0, longestSeaRunKm = 0, longestSeaRunStart, longestSeaRunEnd, runStart;
    let lakeRunKm = 0, longestLakeRunKm = 0;
    for (let index = 1; index < vertices.length; index += 1) {
      if (vertices[index].command !== 'L') { seaRunKm = 0; lakeRunKm = 0; continue; }
      const a = vertices[index - 1], b = vertices[index];
      const start = projection.unprojectGeographicPoint(theater, a), end = projection.unprojectGeographicPoint(theater, b);
      const segmentKm = distanceKm(start, end);
      const segmentCategories = { land: 0, sea: 0, lake: 0, outside: 0 };
      let segmentSeaRunKm = 0, segmentLongestSeaRunKm = 0, segmentRunStart, segmentSeaStart, segmentSeaEnd;
      const steps = Math.max(1, Math.ceil(segmentKm / 2));
      const stepKm = segmentKm / steps;
      for (let step = 0; step < steps; step += 1) {
        const fraction = (step + .5) / steps;
        const point = { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction };
        const category = models[theater](point);
        categoryKm[category] += stepKm;
        segmentCategories[category] += stepKm;
        samples += 1;
        lakeRunKm = category === 'lake' ? lakeRunKm + stepKm : 0;
        longestLakeRunKm = Math.max(longestLakeRunKm, lakeRunKm);
        if (category !== 'sea') { seaRunKm = 0; segmentSeaRunKm = 0; continue; }
        const geo = projection.unprojectGeographicPoint(theater, point);
        if (segmentSeaRunKm === 0) segmentRunStart = geo;
        segmentSeaRunKm += stepKm;
        if (segmentSeaRunKm > segmentLongestSeaRunKm) { segmentLongestSeaRunKm = segmentSeaRunKm; segmentSeaStart = segmentRunStart; segmentSeaEnd = geo; }
        if (seaRunKm === 0) runStart = geo;
        seaRunKm += stepKm;
        if (seaRunKm > longestSeaRunKm) { longestSeaRunKm = seaRunKm; longestSeaRunStart = runStart; longestSeaRunEnd = geo; }
      }
      if (process.argv.includes('--segments') && (segmentCategories.sea > 0 || segmentCategories.lake > 0 || segmentCategories.outside > 0)) {
        const roundedPoint = (point) => point ? { latitude: +point.latitude.toFixed(5), longitude: +point.longitude.toFixed(5) } : undefined;
        segments.push({ index, from: roundedPoint(start), to: roundedPoint(end),
          ...Object.fromEntries(Object.entries(segmentCategories).map(([key, value]) => [`${key}Km`, +value.toFixed(2)])),
          longestSeaRunKm: +segmentLongestSeaRunKm.toFixed(2), seaStart: roundedPoint(segmentSeaStart), seaEnd: roundedPoint(segmentSeaEnd) });
      }
    }
    const round = (value) => Math.round(value * 100) / 100;
    const coords = (point) => point ? { latitude: +point.latitude.toFixed(5), longitude: +point.longitude.toFixed(5) } : undefined;
    results.push({ pair: [from.id, to.id], names: [from.name, to.name], theater,
      classification: classifyMapRoute(from, to).basis, anchors,
      vertices: vertices.length, samples, distanceKm: round(Object.values(categoryKm).reduce((sum, value) => sum + value, 0)),
      ...Object.fromEntries(Object.entries(categoryKm).map(([key, value]) => [`${key}Km`, round(value)])),
      longestSeaRunKm: round(longestSeaRunKm), longestSeaRunStart: coords(longestSeaRunStart), longestSeaRunEnd: coords(longestSeaRunEnd),
      longestLakeRunKm: round(longestLakeRunKm), coincidentAnchor,
      ...(geometryIssue ? { geometryIssue } : {}),
      ...(process.argv.includes('--segments') ? { segments } : {}),
    });
  }
  results.sort((a, b) => b.longestSeaRunKm - a.longestSeaRunKm);
  const regressions = findLandGeographyRegressions(results);
  const suspicious = results.filter((result) => result.seaKm > 0 || result.lakeKm > 0 || result.outsideKm > 0 || result.coincidentAnchor || result.geometryIssue);
  const limit = Number(process.argv.find((arg) => arg.startsWith('--limit='))?.slice(8) ?? Infinity);
  const pairFilter = process.argv.find((arg) => arg.startsWith('--pair='))?.slice(7).split(':').sort().join(':');
  const selected = (process.argv.includes('--all') ? results : suspicious)
    .filter((result) => !pairFilter || [...result.pair].sort().join(':') === pairFilter).slice(0, limit);
  const output = process.argv.includes('--compact') ? selected.map(({ pair, classification, vertices, seaKm, lakeKm, longestSeaRunKm, longestLakeRunKm, longestSeaRunStart, longestSeaRunEnd, coincidentAnchor, geometryIssue, segments }) =>
    ({ pair: pair.join(':'), classification, vertices, seaKm, lakeKm, longestSeaRunKm, longestLakeRunKm, longestSeaRunStart, longestSeaRunEnd, coincidentAnchor, ...(geometryIssue ? { geometryIssue } : {}), ...(segments ? { segments } : {}) })) : selected;
  console.log(JSON.stringify({ sampledOn: new Date().toISOString(), method: 'SVG even-odd land + minor islands; lakes separate; midpoint sample spacing <= 2 km; display geometry, not engine movement',
    limitations: 'Modern generalized physical data, not 1942 shorelines or navigational precision. A sea hit may require a mainland detour, not necessarily maritime reclassification. River bridges are not represented.',
    assets, maskControls, totalConnections: allConnections.length, counts, totalSamples: results.reduce((sum, item) => sum + item.samples, 0),
    routesWithSeaSamples: results.filter((item) => item.seaKm > 0).length,
    routesWithSeaRunOver10Km: results.filter((item) => item.longestSeaRunKm > 10).length,
    routesWithLakeRunOver10Km: results.filter((item) => item.longestLakeRunKm > 10).length,
    regressionCheck: { passed: regressions.length === 0, maxWaterRunKm: 10, checkedRoutes: results.length, failures: regressions },
    results: output }, null, 2));
  // Filters only shorten the displayed details; --check always checks ALL routes.
  if (process.argv.includes('--check') && regressions.length) process.exitCode = 1;
} finally {
  await server.close();
}
