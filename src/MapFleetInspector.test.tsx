import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { MapFleetInspector } from './MapFleetInspector';
import type { NavalTaskForce } from './jointOperations';
import { createJointForcesState } from './jointOperations';

function fleet(): NavalTaskForce {
  const result = structuredClone(createJointForcesState('britain').fleets.find((item) => item.navigation)!);
  result.name = '검증 함대';
  result.navigation!.mode = 'outbound';
  result.navigation!.distanceNm = 2400;
  result.navigation!.traveledNm = 900;
  result.navigation!.rangeNm = 8000;
  result.navigation!.remainingRangeNm = 7100;
  result.navigation!.cruiseKnots = 10;
  result.navigation!.position = { id: 'real-position', name: '비스케이만 항해 중', latitude: 45.3, longitude: -8.2, basin: 'biscay' };
  result.navigation!.destination = { id: 'destination', name: '지브롤터 합류점', latitude: 35.9, longitude: -5.7, basin: 'gibraltar' };
  return result;
}

function markup(force: NavalTaskForce) {
  return renderToStaticMarkup(<MapFleetInspector fleet={force} onClose={() => {}} onOpenNaval={() => {}} />);
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

describe('read-only map fleet inspector', () => {
  it('shows recorded location, home port, destination, remaining distance and a conditional ETA', () => {
    const force = fleet();
    const html = markup(force);
    expect(html).toContain('비스케이만 항해 중');
    expect(html).toContain('45.30°N · 8.20°W');
    expect(html).toContain(force.navigation!.homePort.name);
    expect(html).toContain('지브롤터 합류점');
    expect(html).toContain('900해리 / 2,400해리');
    expect(html).toContain('1,500해리');
    expect(html).toContain('현재 목적지까지 약 2주');
    expect(html).toContain('7,100해리 / 8,000해리');
    expect(html).toContain('aria-valuenow="38"');
    expect(html).toContain('초안이나 명령은 바뀌지 않습니다');
  });

  it('labels unfinished on-station convoy following as pursuit, not completed escort arrival', () => {
    const force = fleet(); force.navigation!.mode = 'on-station';
    const html = markup(force);
    expect(html).toContain('선단 추적·합류 중');
    expect(html).toContain('현재 합류점까지 약 2주');
    expect(html).toContain('합류가 끝난 것은 아닙니다');
    expect(html).toContain('선단이 이동하면 목적지와 도착 시점이 달라집니다');
    force.navigation!.remainingRangeNm = 100;
    expect(markup(force)).toContain('항속 부족 · 도착 추정 불가');
    expect(markup(force)).not.toContain('현재 합류점까지 약');
  });

  it('does not manufacture a home-port coordinate or trip when navigation is missing', () => {
    const force = fleet(); force.navigation = undefined;
    const html = markup(force);
    expect(html).toContain('항해 기록 없음');
    expect(html).toContain('추정해서 표시하지 않습니다');
    expect(html).not.toContain('°');
    expect(html).not.toContain('role="progressbar"');
  });

  it('explains off-theater positions and lists the recorded itinerary without rebuilding its path', () => {
    const force = fleet();
    const nav = force.navigation!;
    nav.position = { id: 'panama', name: '파나마 태평양 입구', latitude: 8.9, longitude: -79.5, basin: 'panamapacific' };
    nav.route = [nav.homePort,
      { id: 'corridor-v3:test:0', name: '세부 해안 우회', latitude: 20, longitude: -70, basin: 'caribbean' },
      nav.position, nav.destination!];
    const before = JSON.stringify(force);
    const html = renderToStaticMarkup(<MapFleetInspector fleet={force} theater="europe" onClose={() => {}} onOpenNaval={() => {}} />);
    expect(html).toContain('현재 전구 밖에 있습니다');
    expect(html).toContain('8.90°N · 79.50°W');
    expect(html).toContain('주요 경유지 3곳');
    expect(html).toContain('실제 항로는 4개 좌표');
    expect(html).toContain('전구 밖 구간은 지도에 표시되지 않지만');
    expect(html).toContain('79.50°W · 전구 밖');
    expect(html).not.toContain('<strong>세부 해안 우회</strong>');
    expect(JSON.stringify(force)).toBe(before);
  });

  it('does not show a misleading itinerary when one recorded waypoint is invalid', () => {
    const force = fleet();
    force.navigation!.route = [force.navigation!.homePort, { ...force.navigation!.position, latitude: Infinity }];
    const html = markup(force);
    expect(html).toContain('경유지 좌표 기록을 점검해야 합니다');
    expect(html).not.toContain('<ol>');
    expect(html).not.toContain('Infinity');
  });

  it('fails closed for corrupt coordinates, distance, speed or range rather than displaying NaN or a false ETA', () => {
    const force = fleet();
    force.navigation!.position.latitude = NaN;
    force.navigation!.traveledNm = 9000;
    force.navigation!.remainingRangeNm = Infinity;
    force.navigation!.cruiseKnots = 0;
    const html = markup(force);
    expect(html).toContain('좌표 기록 점검 필요');
    expect(html).toContain('거리 기록 점검 필요');
    expect(html).toContain('항속 기록 점검 필요');
    expect(html).toContain('항해 기록 점검 필요');
    expect(html).not.toContain('NaN');
    expect(html).not.toContain('Infinity');
    expect(html).not.toContain('role="progressbar"');
    const unknownPosition = fleet(); unknownPosition.navigation!.position.latitude = NaN;
    expect(markup(unknownPosition)).toContain('항해 기록 점검 필요');
    expect(markup(unknownPosition)).not.toContain('현재 목적지까지 약');
  });

  it('isolates map input and only calls navigation/close callbacks without mutating the fleet', () => {
    const force = fleet(); const before = JSON.stringify(force);
    const onClose = vi.fn(); const onOpenNaval = vi.fn();
    const tree = MapFleetInspector({ fleet: force, onClose, onOpenNaval });
    const root = tree.props;
    for (const eventName of ['onPointerDown', 'onMouseDown', 'onClick', 'onDoubleClick', 'onWheel', 'onKeyUp'] as const) {
      const stopPropagation = vi.fn();
      (root[eventName] as (event: unknown) => void)({ stopPropagation });
      expect(stopPropagation).toHaveBeenCalledOnce();
    }
    const stopPropagation = vi.fn(); const preventDefault = vi.fn();
    root.onKeyDown({ key: 'Escape', stopPropagation, preventDefault } as never);
    expect(onClose).toHaveBeenCalledOnce();
    const buttons = elements(tree).filter((element) => element.type === 'button');
    const open = buttons.find((element) => renderToStaticMarkup(element).includes('해군 운영에서 확인'))!;
    (open.props.onClick as () => void)();
    expect(onOpenNaval).toHaveBeenCalledOnce();
    expect(JSON.stringify(force)).toBe(before);
  });
});
