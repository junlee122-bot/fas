/** Campaign dates are UTC Sundays, beginning on 25 October 1942. */
export const CAMPAIGN_START_TIMESTAMP = Date.UTC(1942, 9, 25);
export const CAMPAIGN_WEEK_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

export function getCampaignDateForWeek(week: number): Date {
  // Negative offsets are useful for the opening paper's preceding seven-day range.
  const normalizedWeek = Number.isFinite(week) ? Math.floor(week) : 0;
  return new Date(CAMPAIGN_START_TIMESTAMP + normalizedWeek * CAMPAIGN_WEEK_MILLISECONDS);
}

export function getCampaignYearForWeek(week: number): number {
  return getCampaignDateForWeek(Math.max(0, week)).getUTCFullYear();
}

/** First campaign tick on or after the supplied UTC date. */
export function getCampaignWeekForDate(date: Date): number {
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) throw new RangeError('Campaign date must be valid');
  return Math.max(0, Math.ceil((timestamp - CAMPAIGN_START_TIMESTAMP) / CAMPAIGN_WEEK_MILLISECONDS));
}

/** First campaign tick in a calendar year, not an elapsed 52-week anniversary. */
export function getCampaignWeekForYear(year: number): number {
  if (!Number.isInteger(year)) throw new RangeError('Campaign year must be an integer');
  const date = new Date(CAMPAIGN_START_TIMESTAMP);
  date.setUTCFullYear(year, 0, 1);
  return getCampaignWeekForDate(date);
}
