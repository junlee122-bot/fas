import type { WarEvent } from './types';

export type JournalFilter = 'all' | 'operations' | 'domestic' | 'diplomacy';

const diplomacyKeywords = ['외교', '동맹', '협상', '조약', '관계 개선', '대사', '국제', '지원 요청'];
const domesticKeywords = ['국내', '내각', '정치', '생산', '연구', '훈련', '승진', '휴양', '의제', '원칙', '참모', '영입', '재정', '채권', '산업', '취임'];

export function categorizeWarEvent(event: WarEvent): Exclude<JournalFilter, 'all'> {
  const text = `${event.title} ${event.detail}`;
  if (diplomacyKeywords.some((keyword) => text.includes(keyword))) return 'diplomacy';
  if (domesticKeywords.some((keyword) => text.includes(keyword))) return 'domestic';
  return 'operations';
}

export function filterWarEvents(events: WarEvent[], filter: JournalFilter, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
  return events.filter((event) => {
    const categoryMatches = filter === 'all' || categorizeWarEvent(event) === filter;
    const queryMatches = normalizedQuery.length === 0
      || `${event.title} ${event.detail}`.toLocaleLowerCase('ko-KR').includes(normalizedQuery);
    return categoryMatches && queryMatches;
  });
}
