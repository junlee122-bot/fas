import { describe, expect, it } from 'vitest';
import { getRole } from './campaign';
import { getRoleTabMandates } from './roleMandate';

describe('role mandate', () => {
  it('keeps a field military role out of constitutional and fiscal controls', () => {
    const role = getRole('britain-field-command', 'britain');
    const mandates = getRoleTabMandates(role);
    expect(mandates.army.mode).toBe('direct');
    expect(mandates.map.mode).toBe('direct');
    expect(mandates.governance.mode).not.toBe('direct');
    expect(mandates.economy.mode).not.toBe('direct');
  });

  it('gives a civilian only their own activity room', () => {
    const role = getRole('britain-field-command', 'britain');
    const mandates = getRoleTabMandates(role, 'civilian');
    expect(mandates.command.mode).toBe('direct');
    expect(mandates.command.label).toBe('개인 활동');
    expect(mandates.command.authorityRoute).toContain('권한은 없습니다');
    expect(mandates.command.reason).not.toContain('공식 임무');
    expect(mandates.organization.mode).toBe('locked');
  });

  it('keeps political and intelligence careers on different desks', () => {
    const political = getRole('britain-political-bureau', 'britain');
    const intelligence = getRole('britain-intelligence-director', 'britain');
    const politicalMandates = getRoleTabMandates(political);
    const intelligenceMandates = getRoleTabMandates(intelligence);
    expect(politicalMandates.governance.mode).toBe('direct');
    expect(politicalMandates.economy.mode).toBe('request');
    expect(politicalMandates.army.mode).toBe('report');
    expect(intelligenceMandates.intelligence.mode).toBe('direct');
    expect(intelligenceMandates.map.mode).toBe('request');
    expect(intelligenceMandates.army.mode).toBe('report');
  });

  it('lets the head of state directly command every portfolio', () => {
    const head = getRole('britain-tier1', 'britain');
    expect(Object.values(getRoleTabMandates(head)).every((mandate) => mandate.mode === 'direct')).toBe(true);
  });
});
