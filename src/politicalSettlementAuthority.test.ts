import { describe, expect, it } from 'vitest';
import { careerRoles, createCareerState, getRole, nations } from './campaign';
import { createCivilianCareerState, getCivilianRoleId, getCivilianSyntheticRole } from './civilianCareer';
import type { CareerAffiliationStatus } from './careerMarket';
import type { CareerRole, CareerState } from './types';
import { getPoliticalSettlementAuthority } from './politicalSettlementAuthority';
import type { PoliticalSettlementAuthority } from './politicalSettlementAuthority';

const topRole = () => getRole('korea-tier1', 'korea');
const servingCareer = (role: CareerRole) => createCareerState(role.nationId, role.id);
const expectDenied = (result: PoliticalSettlementAuthority) => {
  expect(result).toMatchObject({ canDeclare: false, canNegotiate: false, canAdminister: false });
  expect(result.reason.trim()).not.toBe('');
  expect(result.reason).not.toContain('인사권');
};

describe('political settlement formal-office authority matrix', () => {
  it('covers all 13 nations and their political, military and intelligence offices', () => {
    expect(nations).toHaveLength(13);
    for (const nation of nations) {
      const roles = careerRoles.filter((role) => role.nationId === nation.id);
      expect(roles.filter((role) => role.branch === 'politics').map((role) => role.tier)).toEqual([1, 2, 3, 4, 5]);
      expect(roles.some((role) => role.branch === 'military')).toBe(true);
      expect(roles.some((role) => role.branch === 'intelligence')).toBe(true);
    }
  });

  it.each(careerRoles)('$id uses its actual political office, not generic authority score', (role) => {
    const result = getPoliticalSettlementAuthority(servingCareer(role), role, 'serving');
    const political = role.branch === 'politics';
    expect(result).toMatchObject({
      canDeclare: political && role.tier === 1,
      canNegotiate: political && role.tier <= 2,
      canAdminister: political && role.tier <= 2,
    });
    expect(result.reason.trim()).not.toBe('');
    expect(result.reason).not.toContain('인사권');
  });

  it.each(nations)('$id civilian has no official political authority before appointment', (nation) => {
    const roleId = getCivilianRoleId(nation.id, 'intellectual');
    const role = getCivilianSyntheticRole(roleId, nation.id)!;
    const career = { ...servingCareer(role), civilian: createCivilianCareerState('intellectual', 'university-network') };
    expect(career.startMode).toBe('civilian');
    expectDenied(getPoliticalSettlementAuthority(career, role, 'serving'));
  });

  it.each(nations)('$id can acquire authority after an actual civilian-to-office appointment', (nation) => {
    const role = getRole(`${nation.id}-political-minister`, nation.id);
    const career: CareerState = {
      ...servingCareer(role), startMode: 'civilian',
      civilian: { ...createCivilianCareerState('intellectual', 'university-network'), enteredOfficeRoleId: role.id },
    };
    expect(getPoliticalSettlementAuthority(career, role, 'serving')).toMatchObject({ canDeclare: false, canNegotiate: true, canAdminister: true });
  });

  it.each(['serving', 'exile', 'defector', 'double-agent', undefined] as const)('accepts a matching formal office with affiliation %s', (affiliation) => {
    const role = topRole();
    expect(getPoliticalSettlementAuthority(servingCareer(role), role, affiliation)).toMatchObject({ canDeclare: true, canNegotiate: true, canAdminister: true });
  });

  it.each(['dismissed', 'unattached'] as const)('rejects %s even when the previous title and nation still match', (affiliation) => {
    const role = topRole();
    expectDenied(getPoliticalSettlementAuthority(servingCareer(role), role, affiliation));
  });

  it.each(['exile', 'defector', 'double-agent'] as const)('does not let %s bypass the actual nation and office identity', (affiliation) => {
    const role = topRole();
    expectDenied(getPoliticalSettlementAuthority({ ...servingCareer(role), nationId: 'japan' }, role, affiliation));
    expectDenied(getPoliticalSettlementAuthority({ ...servingCareer(role), roleId: 'korea-political-minister' }, role, affiliation));
  });

  it('allows a political head-of-state declaration independently of the tier-1 exception', () => {
    const role = { ...getRole('korea-political-bureau', 'korea'), archetype: 'head-of-state' as const };
    expect(getPoliticalSettlementAuthority(servingCareer(role), role)).toMatchObject({ canDeclare: true, canNegotiate: false, canAdminister: false });
  });

  it('allows a political tier-1 declaration independently of the head-of-state archetype', () => {
    const role = { ...topRole(), archetype: 'cabinet-minister' as const };
    expect(getPoliticalSettlementAuthority(servingCareer(role), role)).toMatchObject({ canDeclare: true, canNegotiate: true, canAdminister: true });
  });

  it.each(['military', 'intelligence'] as const)('never grants political authority to a %s role via head-of-state or tier-1 labels', (branch) => {
    const role = { ...topRole(), branch, authority: 100 };
    expectDenied(getPoliticalSettlementAuthority(servingCareer(role), role));
  });

  it('does not infer authority from personal reputation, trust, experience or office authority points', () => {
    const role = { ...getRole('korea-political-bureau', 'korea'), authority: 100 };
    const career = { ...servingCareer(role), reputation: 100, councilTrust: 100, experience: 100, legacy: 100 };
    expectDenied(getPoliticalSettlementAuthority(career, role));
  });

  it('does not accept a general tab delegation or overreach argument', () => {
    const role = getRole('korea-tier2', 'korea');
    const delegation = { delegatedTabs: ['diplomacy', 'governance'], overreach: true };
    // @ts-expect-error General role-command permissions are intentionally outside this contract.
    const result = getPoliticalSettlementAuthority(servingCareer(role), role, 'serving', delegation);
    expectDenied(result);
  });

  it('preserves older office-start saves with no startMode or affiliation field', () => {
    const role = topRole();
    const career = servingCareer(role);
    delete career.startMode;
    expect(getPoliticalSettlementAuthority(career, role)).toMatchObject({ canDeclare: true, canNegotiate: true, canAdminister: true });
  });

  it('keeps the original civilian appointment record valid after promotion to a different current office', () => {
    const role = topRole();
    const career: CareerState = {
      ...servingCareer(role), startMode: 'civilian',
      civilian: { ...createCivilianCareerState('intellectual', 'university-network'), enteredOfficeRoleId: 'korea-political-bureau' },
    };
    expect(getPoliticalSettlementAuthority(career, role)).toMatchObject({ canDeclare: true, canNegotiate: true, canAdminister: true });
  });

  it('returns a detached result without changing career, office or civilian records', () => {
    const role = { ...topRole() };
    const career = servingCareer(role);
    const before = structuredClone({ career, role });
    const first = getPoliticalSettlementAuthority(career, role, 'exile');
    first.canDeclare = false;
    expect(getPoliticalSettlementAuthority(career, role, 'exile').canDeclare).toBe(true);
    expect({ career, role }).toEqual(before);
  });
});

describe('political settlement authority fails closed for malformed office context', () => {
  const invalidRoles: { name: string; patch: Record<string, unknown> }[] = [
    { name: 'missing id', patch: { id: undefined } },
    { name: 'empty id', patch: { id: '  ' } },
    { name: 'non-string id', patch: { id: 12 } },
    { name: 'unknown nation', patch: { nationId: 'invented' } },
    { name: 'unknown branch', patch: { branch: 'civilian' } },
    { name: 'missing branch', patch: { branch: undefined } },
    { name: 'unknown archetype', patch: { archetype: 'supreme-power' } },
    { name: 'missing archetype', patch: { archetype: undefined } },
    { name: 'zero tier', patch: { tier: 0 } },
    { name: 'negative tier', patch: { tier: -1 } },
    { name: 'tier above five', patch: { tier: 6 } },
    { name: 'fractional tier', patch: { tier: 1.5 } },
    { name: 'string tier', patch: { tier: '1' } },
    { name: 'NaN tier', patch: { tier: NaN } },
    { name: 'infinite tier', patch: { tier: Infinity } },
    { name: 'missing authority', patch: { authority: undefined } },
    { name: 'negative authority', patch: { authority: -1 } },
    { name: 'authority above 100', patch: { authority: 101 } },
    { name: 'NaN authority', patch: { authority: NaN } },
    { name: 'infinite authority', patch: { authority: Infinity } },
  ];
  it.each(invalidRoles)('rejects $name even if career identifiers repeat the malformed values', ({ patch }) => {
    const role = { ...topRole(), ...patch } as CareerRole;
    const career = { ...servingCareer(topRole()), roleId: role.id, nationId: role.nationId };
    expectDenied(getPoliticalSettlementAuthority(career, role, 'serving'));
  });

  it.each([null, false, 0, 'office', []])('rejects missing/non-object career or role %j', (value) => {
    const role = topRole();
    expectDenied(getPoliticalSettlementAuthority(value as unknown as CareerState, role));
    expectDenied(getPoliticalSettlementAuthority(servingCareer(role), value as unknown as CareerRole));
  });

  it.each(['invented', '', null, 1])('rejects unknown affiliation %j', (affiliation) => {
    const role = topRole();
    expectDenied(getPoliticalSettlementAuthority(servingCareer(role), role, affiliation as CareerAffiliationStatus));
  });

  it('rejects unknown startMode and missing civilian appointment data despite a matching highest office', () => {
    const role = topRole();
    const career = servingCareer(role);
    expectDenied(getPoliticalSettlementAuthority({ ...career, startMode: 'invented' as CareerState['startMode'] }, role));
    expectDenied(getPoliticalSettlementAuthority({ ...career, startMode: 'civilian' }, role));
  });

  it.each([null, undefined, '', '  ', 123, true])('rejects unconfirmed or malformed civilian appointment %j', (enteredOfficeRoleId) => {
    const role = topRole();
    const career = {
      ...servingCareer(role), startMode: 'civilian',
      civilian: { ...createCivilianCareerState('intellectual', 'university-network'), enteredOfficeRoleId },
    } as CareerState;
    expectDenied(getPoliticalSettlementAuthority(career, role, 'serving'));
  });
});
