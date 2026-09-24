import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { territories } from './data';
import { getMapRouteChoices, MapRoutePanel } from './MapRoutePanel';

describe('map route guidance', () => {
  it('explains the Bosphorus without advertising inland cities as embarkation ports', () => {
    const origin = territories.find((territory) => territory.id === 'anatolia')!;
    const choices = getMapRouteChoices(origin, territories, 'allies');
    for (const id of ['balkans', 'sofia']) expect(choices.find((choice) => choice.target.id === id)?.route.kind).toBe('sea-crossing');
    const html = renderToStaticMarkup(<MapRoutePanel origin={origin} territories={territories} playerFaction="allies" planning alternatives={[]}
      onSelect={() => {}} onInspect={() => {}} onOpenJoint={() => {}} onOpenTransport={() => {}} onChangeDivision={() => {}} />);
    expect(html).toContain('보스포루스 해협 · 항구 경유 필요');
    expect(html).toContain('내륙 도시 간 직접 승선은 불가합니다');
    expect(html.match(/수송실 열기/g)).toHaveLength(2);
  });
  it('does not advertise the English Channel as a land offensive', () => {
    const origin = territories.find((territory) => territory.id === 'britain')!;
    const choices = getMapRouteChoices(origin, territories, 'allies');
    expect(choices.find((choice) => choice.target.id === 'channel')?.validation.code).toBe('sea-target');
    expect(choices.filter((choice) => choice.validation.allowed)).toHaveLength(0);
  });
  it('explains an empty frontier and offers real alternative tasks', () => {
    const origin = territories.find((territory) => territory.id === 'britain')!;
    const html = renderToStaticMarkup(<MapRoutePanel origin={origin} territories={territories} playerFaction="allies" planning divisionName="본토 예비대" alternatives={[]} onSelect={() => {}} onInspect={() => {}} onOpenJoint={() => {}} onChangeDivision={() => {}} />);
    expect(html).toContain('현재 출발선에는 육상 공세 목표가 없습니다');
    expect(html).toContain('해공군 엄호');
    expect(html).not.toContain('>목표 검토');
    expect(html).toContain('병력 이동은 수송실에서 별도 승인');
  });
  it('offers an approval review for a connected hostile land target', () => {
    const origin = territories.find((territory) => territory.id === 'egypt')!;
    const html = renderToStaticMarkup(<MapRoutePanel origin={origin} territories={territories} playerFaction="allies" planning alternatives={[]} onSelect={() => {}} onInspect={() => {}} onOpenJoint={() => {}} onChangeDivision={() => {}} />);
    expect(html).toContain('목표 검토');
    expect(html).toContain('육상 경로 연결 · 적 통제');
  });
});
