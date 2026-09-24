export interface CampaignSavePayload {
  version: number;
  game: { week: number; victoryScore: number };
  career: { nationId: string; roleId: string };
  [key: string]: unknown;
}

export interface ManualSaveSlot {
  slot: number;
  savedAt: string;
  nationName: string;
  roleTitle: string;
  week: number;
  theaterName: string;
  victoryScore: number;
  payload: CampaignSavePayload;
}

export function isCampaignSavePayload(value: unknown): value is CampaignSavePayload {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<CampaignSavePayload>;
  return typeof candidate.version === 'number'
    && Boolean(candidate.game && typeof candidate.game.week === 'number' && typeof candidate.game.victoryScore === 'number')
    && Boolean(candidate.career && typeof candidate.career.nationId === 'string' && typeof candidate.career.roleId === 'string');
}

export function normalizeManualSaves(value: unknown): ManualSaveSlot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is ManualSaveSlot => {
    if (!item || typeof item !== 'object') return false;
    const candidate = item as Partial<ManualSaveSlot>;
    return Number.isInteger(candidate.slot)
      && Number(candidate.slot) >= 1
      && Number(candidate.slot) <= 3
      && typeof candidate.savedAt === 'string'
      && typeof candidate.nationName === 'string'
      && typeof candidate.roleTitle === 'string'
      && typeof candidate.week === 'number'
      && typeof candidate.theaterName === 'string'
      && typeof candidate.victoryScore === 'number'
      && isCampaignSavePayload(candidate.payload);
  }).sort((a, b) => a.slot - b.slot).slice(0, 3);
}

export function upsertManualSave(saves: ManualSaveSlot[], nextSave: ManualSaveSlot): ManualSaveSlot[] {
  return [...saves.filter((save) => save.slot !== nextSave.slot), nextSave].sort((a, b) => a.slot - b.slot).slice(0, 3);
}

export function deleteManualSave(saves: ManualSaveSlot[], slot: number): ManualSaveSlot[] {
  return saves.filter((save) => save.slot !== slot);
}
