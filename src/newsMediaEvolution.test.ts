import { describe, expect, it } from 'vitest';
import { getCampaignYearForWeek, getNewsMediaEra, getNewsMediaEraForWeek, getNewsMediaTimeline } from './newsMediaEvolution';

describe('news media evolution', () => {
  it('moves through distinct historical media formats instead of keeping one newspaper forever', () => {
    expect(getNewsMediaEra(1942).id).toBe('wartime-press');
    expect(getNewsMediaEra(1954).id).toBe('radio-wire');
    expect(getNewsMediaEra(1968).id).toBe('television-bulletin');
    expect(getNewsMediaEra(1989).id).toBe('satellite-network');
    expect(getNewsMediaEra(2005).id).toBe('web-edition');
    expect(getNewsMediaEra(2016).id).toBe('live-feed');
    expect(getNewsMediaEra(2060).id).toBe('civic-network');
    expect(new Set(getNewsMediaTimeline().map((era) => era.masthead)).size).toBe(7);
  });

  it('derives the medium from the actual campaign week', () => {
    expect(getCampaignYearForWeek(0)).toBe(1942);
    const weeksTo1989 = Math.ceil((Date.UTC(1989, 0, 1) - Date.UTC(1942, 9, 25)) / (7 * 24 * 60 * 60 * 1000));
    expect(getNewsMediaEraForWeek(weeksTo1989).id).toBe('satellite-network');
  });
});
