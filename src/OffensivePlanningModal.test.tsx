import { renderToStaticMarkup } from 'react-dom/server';
import type { KeyboardEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { handleOffensivePlanningKeyDown, OffensivePlanningModal, restoreOffensivePlanningFocus } from './OffensivePlanningModal';
import { forecastOperationBattle } from './operations';
import { commanders, initialDivisions, territories } from './data';

const division = initialDivisions[0];
const commander = commanders.find((item) => item.id === division.commanderId) ?? commanders[0];
const origin = territories.find((item) => item.id === division.territoryId)!;
const target = territories.find((item) => item.controller === 'axis')!;
const forecast = forecastOperationBattle({ week: 0, division, commander, target, stance: 'balanced', enemyPressure: 55, intelNetwork: 65, doctrineBonus: 7, policyAttackBonus: 0, priorityBonus: 0 }, 'attrition');

describe('offensive planning modal keyboard and action semantics', () => {
  it('separates return-to-target from explicit draft discard and labels first-engagement costs', () => {
    const onCancel = vi.fn(); const onDiscard = vi.fn(); const onConfirm = vi.fn();
    const html = renderToStaticMarkup(<OffensivePlanningModal division={division} commander={commander} origin={origin} target={target} stance="balanced" forecasts={{ cautious: forecast, balanced: forecast, aggressive: forecast }} commandPoints={5} intelNetwork={65} onCancel={onCancel} onDiscard={onDiscard} onConfirm={onConfirm} onStanceChange={vi.fn()} />);
    expect(html).toContain('목표 다시 선택');
    expect(html).toContain('초안 취소');
    expect(html).toContain('X·Esc는 목표 재선택');
    expect(html).toContain('첫 교전 전력 소모');
    expect(html).toContain('작전 전체 손실이 아닙니다');
    expect(onCancel).not.toHaveBeenCalled(); expect(onDiscard).not.toHaveBeenCalled(); expect(onConfirm).not.toHaveBeenCalled();
  });

  it('consumes Escape locally and returns one step without approving or discarding', () => {
    const onBack = vi.fn(); const preventDefault = vi.fn(); const stopPropagation = vi.fn();
    handleOffensivePlanningKeyDown({ key: 'Escape', preventDefault, stopPropagation } as unknown as KeyboardEvent<HTMLElement>, onBack);
    expect(onBack).toHaveBeenCalledOnce(); expect(preventDefault).toHaveBeenCalledOnce(); expect(stopPropagation).toHaveBeenCalledOnce();
  });

  it.each([false, true])('wraps Tab focus within the dialog (reverse=%s)', (shiftKey) => {
    const first = { focus: vi.fn() }; const last = { focus: vi.fn() }; const preventDefault = vi.fn();
    const dialog = { querySelectorAll: () => [first, last], ownerDocument: { activeElement: shiftKey ? first : last }, contains: () => true };
    handleOffensivePlanningKeyDown({ key: 'Tab', shiftKey, currentTarget: dialog, preventDefault } as unknown as KeyboardEvent<HTMLElement>, vi.fn());
    expect(shiftKey ? last.focus : first.focus).toHaveBeenCalledOnce(); expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('recovers focus when no button is available', () => {
    const dialog = { querySelectorAll: () => [], ownerDocument: { activeElement: null }, focus: vi.fn() }; const preventDefault = vi.fn();
    handleOffensivePlanningKeyDown({ key: 'Tab', currentTarget: dialog, preventDefault } as unknown as KeyboardEvent<HTMLElement>, vi.fn());
    expect(dialog.focus).toHaveBeenCalledOnce(); expect(preventDefault).toHaveBeenCalledOnce();
  });

  it('restores focus to the original connected control, including an SVG territory', () => {
    const previous = { isConnected: true, closest: () => null, focus: vi.fn() };
    const document = { body: {}, querySelector: () => null };
    restoreOffensivePlanningFocus(previous as unknown as Element, document as unknown as Document);
    expect(previous.focus).toHaveBeenCalledOnce();
  });

  it('falls back to the selected territory if inert made the browser focus the body', () => {
    const marker = { isConnected: true, closest: () => null, focus: vi.fn() }; const body = { isConnected: true, focus: vi.fn() };
    const document = { body, querySelector: (selector: string) => selector.startsWith('.territory-marker') ? marker : null };
    restoreOffensivePlanningFocus(body as unknown as Element, document as unknown as Document);
    expect(marker.focus).toHaveBeenCalledOnce(); expect(body.focus).not.toHaveBeenCalled();
  });

  it('never steals focus from a subsequent modal', () => {
    const previous = { isConnected: true, closest: () => null, focus: vi.fn() };
    const document = { body: {}, querySelector: () => ({}) };
    restoreOffensivePlanningFocus(previous as unknown as Element, document as unknown as Document);
    expect(previous.focus).not.toHaveBeenCalled();
  });
});
