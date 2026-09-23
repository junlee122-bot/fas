import portrait0 from './assets/portraits/churchill.webp';
import portrait1 from './assets/portraits/roosevelt.webp';
import portrait2 from './assets/portraits/stalin.webp';
import portrait4 from './assets/portraits/tojo.webp';
import portrait5 from './assets/portraits/chiang.webp';
import portrait7 from './assets/portraits/de-gaulle.webp';
import portrait8 from './assets/portraits/mussolini.webp';
import portrait9 from './assets/portraits/kim-gu.webp';
import portrait10 from './assets/portraits/ho-chi-minh.webp';
import portrait11 from './assets/portraits/sukarno.webp';
import portrait12 from './assets/portraits/quezon.webp';
import portrait13 from './assets/portraits/montgomery.webp';
import portrait14 from './assets/portraits/brooke.webp';
import portrait15 from './assets/portraits/turing.webp';
import portrait16 from './assets/portraits/keynes.webp';
import portrait17 from './assets/portraits/eisenhower.webp';
import portrait18 from './assets/portraits/einstein.webp';
import portrait19 from './assets/portraits/oppenheimer.webp';
import portrait20 from './assets/portraits/kim-won-bong.webp';
import portrait21 from './assets/portraits/ji-cheong-cheon.webp';
import portrait22 from './assets/portraits/lee-beom-seok.webp';
import portrait23 from './assets/portraits/mao.webp';

export interface HistoricalPortrait {
  id: string;
  name: string;
  personIds: readonly string[];
  names: readonly string[];
  src: string;
  referenceEra: string;
}

/** These are illustrated reference-era likenesses, not archival photographs or living status. */
export const historicalPortraits: readonly HistoricalPortrait[] = [
  { id: "churchill", name: "윈스턴 처칠", personIds: ["britain-churchill"], names: ["윈스턴 처칠","Winston Churchill"], src: portrait0, referenceEra: '1940년대 참고 외형' },
  { id: "roosevelt", name: "프랭클린 D. 루스벨트", personIds: ["usa-roosevelt"], names: ["프랭클린 D. 루스벨트","Franklin D. Roosevelt","프랭클린 루스벨트"], src: portrait1, referenceEra: '1940년대 참고 외형' },
  { id: "stalin", name: "이오시프 스탈린", personIds: ["ussr-stalin"], names: ["이오시프 스탈린","Joseph Stalin"], src: portrait2, referenceEra: '1940년대 참고 외형' },
  { id: "tojo", name: "도조 히데키", personIds: ["japan-tojo"], names: ["도조 히데키","Hideki Tojo"], src: portrait4, referenceEra: '1940년대 참고 외형' },
  { id: "chiang", name: "장제스", personIds: ["china-chiang"], names: ["장제스","Chiang Kai-shek"], src: portrait5, referenceEra: '1940년대 참고 외형' },
  { id: "de-gaulle", name: "샤를 드골", personIds: ["freefrance-de-gaulle","w40-fr-charles-de-gaulle"], names: ["샤를 드골","Charles de Gaulle","샤를 드 골"], src: portrait7, referenceEra: '1940년대 참고 외형' },
  { id: "mussolini", name: "베니토 무솔리니", personIds: ["italy-mussolini"], names: ["베니토 무솔리니","Benito Mussolini"], src: portrait8, referenceEra: '1940년대 참고 외형' },
  { id: "kim-gu", name: "김구", personIds: ["korea-kim-gu","w40-kr-kim-gu"], names: ["김구","Kim Gu"], src: portrait9, referenceEra: '1940년대 참고 외형' },
  { id: "ho-chi-minh", name: "호찌민", personIds: ["vietnam-ho-chi-minh","w40-vn-ho-chi-minh"], names: ["호찌민","Ho Chi Minh","호치민"], src: portrait10, referenceEra: '1940년대 참고 외형' },
  { id: "sukarno", name: "수카르노", personIds: ["indonesia-sukarno","w40-id-sukarno"], names: ["수카르노","Sukarno"], src: portrait11, referenceEra: '1940년대 참고 외형' },
  { id: "quezon", name: "마누엘 케손", personIds: ["philippines-manuel-quezon","ph-manuel-quezon","w40-ph-manuel-quezon"], names: ["마누엘 케손","Manuel L. Quezon","마누엘 L. 케손","Manuel Quezon"], src: portrait12, referenceEra: '1940년대 참고 외형' },
  { id: "montgomery", name: "버나드 몽고메리", personIds: ["britain-montgomery"], names: ["버나드 몽고메리","Bernard Montgomery"], src: portrait13, referenceEra: '1940년대 참고 외형' },
  { id: "brooke", name: "앨런 브룩", personIds: ["britain-brooke"], names: ["앨런 브룩","Alan Brooke","앨런 브루크"], src: portrait14, referenceEra: '1940년대 참고 외형' },
  { id: "turing", name: "앨런 튜링", personIds: ["uk-alan-turing"], names: ["앨런 튜링","Alan Turing"], src: portrait15, referenceEra: '1940년대 참고 외형' },
  { id: "keynes", name: "존 메이너드 케인스", personIds: ["uk-john-maynard-keynes"], names: ["존 메이너드 케인스","John Maynard Keynes"], src: portrait16, referenceEra: '1940년대 참고 외형' },
  { id: "eisenhower", name: "드와이트 D. 아이젠하워", personIds: ["usa-eisenhower"], names: ["드와이트 D. 아이젠하워","Dwight D. Eisenhower"], src: portrait17, referenceEra: '1940년대 참고 외형' },
  { id: "einstein", name: "알베르트 아인슈타인", personIds: ["us-albert-einstein"], names: ["알베르트 아인슈타인","Albert Einstein","알버트 아인슈타인"], src: portrait18, referenceEra: '1940년대 참고 외형' },
  { id: "oppenheimer", name: "J. 로버트 오펜하이머", personIds: ["us-oppenheimer"], names: ["J. 로버트 오펜하이머","J. Robert Oppenheimer","로버트 오펜하이머"], src: portrait19, referenceEra: '1940년대 참고 외형' },
  { id: "kim-won-bong", name: "김원봉", personIds: ["korea-kim-won-bong","w40-kr-kim-won-bong"], names: ["김원봉","Kim Won-bong"], src: portrait20, referenceEra: '1940년대 참고 외형' },
  { id: "ji-cheong-cheon", name: "지청천", personIds: ["korea-ji-cheong-cheon","w40-kr-ji-cheong-cheon"], names: ["지청천","Ji Cheong-cheon","Ji Cheong Cheon"], src: portrait21, referenceEra: '1940년대 참고 외형' },
  { id: "lee-beom-seok", name: "이범석", personIds: ["korea-lee-beom-seok","w40-kr-lee-beom-seok"], names: ["이범석","Yi Beom-seok","Lee Beom-seok"], src: portrait22, referenceEra: '1940년대 참고 외형' },
  { id: "mao", name: "마오쩌둥", personIds: ["mao"], names: ["마오쩌둥","Mao Zedong"], src: portrait23, referenceEra: '1940년대 참고 외형' },
];

const normalizeName = (name: string) => name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
const byId = new Map(historicalPortraits.flatMap((portrait) => portrait.personIds.map((id) => [id, portrait] as const)));
const byName = new Map(historicalPortraits.flatMap((portrait) => portrait.names.map((name) => [normalizeName(name), portrait] as const)));

/** Fail closed: a supplied unknown/conflicting identity never inherits a named face. */
export function resolveHistoricalPortrait({ personId, name, player = false }: { personId?: string; name: string; player?: boolean }): HistoricalPortrait | null {
  if (player || personId === 'player' || !name.trim()) return null;
  const nameMatch = byName.get(normalizeName(name));
  if (personId !== undefined) {
    const idMatch = byId.get(personId);
    return idMatch && idMatch === nameMatch ? idMatch : null;
  }
  return nameMatch ?? null;
}
