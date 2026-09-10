import { describe, expect, it } from 'vitest';
import {
  CAMPAIGN_WEEK_MILLISECONDS,
  getCampaignDateForWeek,
  getCampaignWeekForDate,
  getCampaignWeekForYear,
  getCampaignYearForWeek,
} from './campaignCalendar';

describe('UTC campaign calendar', () => {
  it('starts on 1942-10-25 and changes year at the first January tick', () => {
    expect(getCampaignDateForWeek(0).toISOString()).toBe('1942-10-25T00:00:00.000Z');
    expect(getCampaignDateForWeek(-1).toISOString()).toBe('1942-10-18T00:00:00.000Z');
    expect(getCampaignDateForWeek(9).toISOString()).toBe('1942-12-27T00:00:00.000Z');
    expect(getCampaignDateForWeek(10).toISOString()).toBe('1943-01-03T00:00:00.000Z');
    expect(getCampaignYearForWeek(9)).toBe(1942);
    expect(getCampaignYearForWeek(10)).toBe(1943);
    expect(getCampaignYearForWeek(51)).toBe(1943);
    expect(getCampaignWeekForYear(1943)).toBe(10);
  });

  it('preserves seven-day ticks across leap days and century boundaries', () => {
    for (const year of [1944, 2000, 2024, 2060, 2100]) {
      const march = getCampaignWeekForDate(new Date(Date.UTC(year, 2, 1)));
      const before = getCampaignDateForWeek(march - 1);
      const after = getCampaignDateForWeek(march);
      expect(after.getTime() - before.getTime()).toBe(CAMPAIGN_WEEK_MILLISECONDS);
      expect(before.getUTCMonth()).toBe(1);
      expect(after.getUTCMonth()).toBe(2);
      expect(getCampaignWeekForDate(after)).toBe(march);
    }
    expect(getCampaignDateForWeek(6136).toISOString()).toBe('2060-05-30T00:00:00.000Z');
  });

  it('locates actual January boundaries throughout the campaign', () => {
    for (const year of [1944, 1950, 1989, 2000, 2020, 2060]) {
      const firstWeek = getCampaignWeekForYear(year);
      expect(getCampaignYearForWeek(firstWeek)).toBe(year);
      expect(getCampaignYearForWeek(firstWeek - 1)).toBe(year - 1);
    }
  });

  it('returns independent dates and bounds invalid or pre-campaign week inputs', () => {
    const date = getCampaignDateForWeek(0);
    date.setUTCFullYear(2000);
    expect(getCampaignYearForWeek(0)).toBe(1942);
    for (const week of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(getCampaignYearForWeek(week)).toBe(1942);
    }
    expect(getCampaignWeekForYear(1942)).toBe(0);
    expect(() => getCampaignWeekForDate(new Date(Number.NaN))).toThrow(RangeError);
  });
});
