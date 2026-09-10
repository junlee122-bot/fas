import { describe, expect, it } from 'vitest';
import { deleteManualSave, isCampaignSavePayload, normalizeManualSaves, upsertManualSave } from './save';
import type { CampaignSavePayload, ManualSaveSlot } from './save';

const payload: CampaignSavePayload = {
  version: 8,
  game: { week: 4, victoryScore: 51 },
  career: { nationId: 'britain', roleId: 'britain-tier2' },
};

const save: ManualSaveSlot = {
  slot: 1,
  savedAt: '2026-07-16T12:00:00.000Z',
  nationName: '영국',
  roleTitle: '전구사령관',
  week: 4,
  theaterName: '유럽·지중해',
  victoryScore: 51,
  payload,
};

describe('manual campaign saves', () => {
  it('validates imported campaign payloads', () => {
    expect(isCampaignSavePayload(payload)).toBe(true);
    expect(isCampaignSavePayload({ version: 8, game: {} })).toBe(false);
  });

  it('normalizes only the three supported slots', () => {
    expect(normalizeManualSaves([save, { ...save, slot: 4 }, { slot: 2 }])).toEqual([save]);
  });

  it('upserts and deletes slots without disturbing the others', () => {
    const second = { ...save, slot: 2, week: 7 };
    const replaced = { ...save, week: 9 };
    expect(upsertManualSave([save, second], replaced)).toEqual([replaced, second]);
    expect(deleteManualSave([save, second], 1)).toEqual([second]);
  });
});
