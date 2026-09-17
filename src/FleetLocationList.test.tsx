import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { FleetLocationList, FleetLocationListView } from './FleetLocationList';
import { createJointForcesState, type NavalTaskForce } from './jointOperations';
import type { FleetNavigationMode } from './navalNavigation';

function fleet(id: string, mode: FleetNavigationMode = 'in-port', latitude = 50, longitude = -4): NavalTaskForce {
  const source = structuredClone(createJointForcesState('britain').fleets.find((item) => item.navigation)!);
  source.id = id; source.name = `${id} 함대`;
  source.navigation!.mode = mode;
  source.navigation!.position = { id: `position-${id}`, name: `${id} 실제 위치`, latitude, longitude, basin: 'test' };
  source.navigation!.distanceNm = mode === 'in-port' ? 0 : 2000;
  source.navigation!.traveledNm = mode === 'in-port' ? 0 : 500;
  return source;
}

function elements(node: ReactNode): ReactElement<Record<string, unknown>>[] {
  const result: ReactElement<Record<string, unknown>>[] = [];
  Children.forEach(node, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    result.push(child);
    result.push(...elements(child.props.children as ReactNode));
  });
  return result;
}

function tree(fleets: NavalTaskForce[], extras: Partial<Parameters<typeof FleetLocationListView>[0]> = {}) {
  return FleetLocationListView({ fleets, theater: 'europe', isOpen: true, onOpenChange: vi.fn(), onSelect: vi.fn(), ...extras });
}

describe('map fleet location discovery', () => {
  it('starts closed with a compact, explicit count rather than exposing the entire roster', () => {
    const onSelect = vi.fn();
    const html = renderToStaticMarkup(<FleetLocationList fleets={[fleet('port'), fleet('sea', 'outbound')]} theater="europe" onSelect={onSelect} />);
    expect(html).toContain('함대 위치');
    expect(html).toContain('<strong>2</strong>');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('id="map-fleet-location-toggle"');
    expect(html).not.toContain('fleet-location-popover');
    expect(html).not.toContain('port 실제 위치');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('retains fleets outside the current theater with explicit scope and real coordinates', () => {
    const html = renderToStaticMarkup(tree([fleet('europe'), fleet('pacific', 'outbound', 24, -178)]));
    expect(html).toContain('현재 전구 밖 1개');
    expect(html).toContain('data-theater-presence="inside"');
    expect(html).toContain('data-fleet-location-id="pacific" data-theater-presence="outside"');
    expect(html).toContain('24.00°N · 178.00°W');
    expect(html).toContain('선택은 이동 명령이 아닙니다');
    expect(html).toContain('aria-label="함대 위치 목록 닫기"');
  });

  it('sorts moving and delayed escort fleets ahead of ships waiting in port without mutating input', () => {
    const forces = [fleet('port'), fleet('return', 'returning'), fleet('escort', 'on-station'), fleet('refuel', 'refueling')];
    const before = structuredClone(forces);
    const rows = elements(tree(forces)).filter((item) => item.props['data-fleet-location-id']);
    expect(rows.map((item) => item.props['data-fleet-location-id'])).toEqual(['return', 'escort', 'refuel', 'port']);
    expect(renderToStaticMarkup(tree(forces))).toContain('선단 추적·합류 중');
    expect(forces).toEqual(before);
  });

  it('excludes sunk and unlocated or malformed records without inventing locations or leaking unsupplied opponents', () => {
    const missing = fleet('missing'); missing.navigation = undefined;
    const invalid = fleet('invalid', 'outbound', NaN, 0);
    const invalidLongitude = fleet('invalid-longitude', 'outbound', 30, 222);
    const sunk = fleet('sunk'); sunk.ships = 0;
    const supplied = fleet('player');
    const html = renderToStaticMarkup(tree([missing, invalid, invalidLongitude, sunk, supplied], { selectedFleetId: 'enemy-secret' }));
    expect(html.match(/data-fleet-location-id=/g)).toHaveLength(1);
    expect(html).toContain('data-fleet-location-id="player"');
    expect(html).not.toContain('enemy-secret');
    expect(html).not.toContain('NaN');
    expect(renderToStaticMarkup(tree([missing, sunk]))).toContain('좌표가 확인된 생존 함대가 없습니다');
  });

  it('selects an outside-theater fleet for inspection and closes the list without commands or mutation', () => {
    const force = fleet('outside', 'outbound', 21, -158);
    const before = structuredClone(force);
    const onSelect = vi.fn(); const onOpenChange = vi.fn();
    const list = tree([force], { onSelect, onOpenChange });
    const row = elements(list).find((item) => item.props['data-fleet-location-id'] === 'outside')!;
    (row.props.onClick as () => void)();
    expect(onSelect).toHaveBeenCalledExactlyOnceWith('outside');
    expect(onOpenChange).toHaveBeenCalledExactlyOnceWith(false);
    expect(force).toEqual(before);
  });

  it('opens/closes explicitly and isolates pointer, wheel and keyboard events from the map', () => {
    const onSelect = vi.fn(); const onOpenChange = vi.fn();
    const list = tree([fleet('player')], { onSelect, onOpenChange });
    const root = list.props;
    for (const eventName of ['onPointerDown', 'onMouseDown', 'onClick', 'onDoubleClick', 'onWheel', 'onKeyUp'] as const) {
      const stopPropagation = vi.fn();
      (root[eventName] as (event: unknown) => void)({ stopPropagation });
      expect(stopPropagation).toHaveBeenCalledOnce();
    }
    const preventDefault = vi.fn(); const stopPropagation = vi.fn();
    root.onKeyDown({ key: 'Escape', preventDefault, stopPropagation } as never);
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(preventDefault).toHaveBeenCalledOnce();
    expect(stopPropagation).toHaveBeenCalledOnce();
    const close = elements(list).find((item) => item.props['aria-label'] === '함대 위치 목록 닫기')!;
    (close.props.onClick as () => void)();
    expect(onOpenChange).toHaveBeenCalledTimes(2);
    const closed = tree([fleet('player')], { isOpen: false, onSelect, onOpenChange });
    const trigger = elements(closed).find((item) => item.props.className === 'fleet-location-trigger')!;
    (trigger.props.onClick as () => void)();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(onSelect).not.toHaveBeenCalled();
  });
});
