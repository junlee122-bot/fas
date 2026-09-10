import { describe, expect, it } from 'vitest';
import appSource from './App.tsx?raw';

function sourceBetween(start: string, end: string) {
  const startIndex = appSource.indexOf(start);
  const endIndex = appSource.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`Could not inspect ${start} → ${end}`);
  return appSource.slice(startIndex, endIndex);
}

describe('persistent offensive command UX', () => {
  it('never mutates approved orders when the player inspects a map territory', () => {
    const selectionHandler = sourceBetween('const selectTerritory =', 'const issueOffensive =');
    expect(selectionHandler).not.toContain('setOrders(');
  });

  it.each([
    ['regional map navigation', 'const switchMapRegion =', 'const focusMapTerritory ='],
    ['theater navigation', 'const switchTheater =', 'const meetStaff ='],
    ['action-center navigation', 'const navigateFromActionCenter =', 'const toggleUXPreference ='],
    ['primary tab navigation', 'const openGameTab =', 'const commandPaletteItems:'],
  ])('preserves the targeting draft during %s', (_label, start, end) => {
    const navigationHandler = sourceBetween(start, end);
    expect(navigationHandler).not.toContain('setPlanningMode(false)');
    expect(navigationHandler).not.toContain('setPendingOffensivePlan(null)');
  });

  it('keeps an always-visible approved-order tracker on the map', () => {
    expect(appSource).toContain('active-operation-dock');
    expect(appSource).toContain('지도 선택과 무관하게 유지');
    expect(appSource).toContain('focusOperationalOrder(order)');
  });
});
