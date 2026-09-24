import type { GeographicCoordinate } from './territoryGeography';

const p = (latitude: number, longitude: number): GeographicCoordinate => ({ latitude, longitude });

/**
 * Geographic DISPLAY corridors, not a road database or an engine movement mesh.
 * Named inland approaches are checked against the bundled Natural Earth 1:10m
 * land/lake geometry. Their existence does not grant border access, bridges,
 * supply capacity, road quality, or historical troop travel times.
 * https://www.naturalearthdata.com/downloads/10m-physical-vectors/
 *
 * In particular New Guinea's mountain crossings must NOT be read as highways:
 * the Owen Stanley barrier was traversed by foot tracks. These schematic
 * connections preserve the game's existing land adjacency only.
 * https://www.awm.gov.au/articles/blog/mapping-kokoda
 * https://www.dva.gov.au/recognition-and-commemoration/memorials/memorials-asia-pacific/papua-new-guinea/kokoda-memorial
 */

// Independent common point sets avoid importing the merged parent catalog.
// The existing core corridors remain unchanged.
const hanoi = p(21.035, 105.848);
const guangzhou = p(23.125, 113.262);
const hanoiToGuangzhou = [p(21.85, 106.76), p(22.82, 108.32), p(23.48, 111.3), p(23.05, 112.47)];
const kowloonToGuangzhou = [
  p(22.38, 114.19), p(22.49, 114.14), // Sha Tin / Fanling: stay on the Kowloon mainland
  p(22.54, 114.06), p(23.02, 113.75), // Shenzhen / Dongguan, east of the Pearl estuary
];
const hanoiToSaigon = [
  p(17.97, 102.6), p(16.56, 104.75), p(15.12, 105.78), // Vientiane / Savannakhet / Pakse
  p(13.52, 105.97), p(12.49, 106.02), p(11.99, 105.46), // Stung Treng / Kratie / Kampong Cham
];

const northernBohai = [p(41.1, 121.1), p(40.75, 120.75), p(40.03, 119.75), p(39.63, 118.18)];
const dalianSouth = [
  p(41.27, 123.18), p(40.4, 122.35), p(39.5, 122.1), p(39.35, 122.15),
  p(39.1, 121.72), p(39.02, 121.65), p(38.98, 121.55), p(38.9, 121.55), p(38.9, 121.628),
];
const vladivostokNorth = [
  p(43.813, 131.947), // Ussuriysk
  p(43.353, 132.186), // Artyom: northern entrance to the Muravyov-Amursky peninsula
  p(43.323, 132.087), p(43.25, 132.05), p(43.19, 131.97),
];
const mudanjiangToVladivostok = [p(44.583, 129.6), p(44.412, 131.151), ...vladivostokNorth];

// Honshu inland belts; no diagonal across the Inland Sea, Ise Bay or Tokyo Bay.
const hiroshimaToOsaka = [
  p(34.42, 132.74), p(34.4, 133.08), p(34.48, 133.36), // Higashi-Hiroshima / Mihara / Fukuyama
  p(34.66, 133.92), p(34.83, 134.69), p(34.89, 135.23), // Okayama / Himeji / Sanda
];
const osaka = p(34.694, 135.502);
const osakaToNagoya = [
  p(34.89, 135.8), p(34.76, 136.14), p(34.86, 136.45), p(35.06, 136.68), // Uji / Iga / Kameyama / Kuwana
];
const nagoya = p(35.157, 136.913);
const yokosukaWest = [p(35.44, 139.61), p(35.36, 139.6), p(35.32, 139.62)];

// Arakan's estuaries are entered from inland; short river crossings remain
// abstract rather than being hidden as fictitious bridges or guaranteed roads.
const arakanToChittagong = [
  p(20.6, 93.19), p(20.82, 92.37), p(20.86, 92.3), // Mrauk-U / Maungdaw / Teknaf
  p(21.43, 91.98), p(21.76, 92.08), p(22, 92.1), p(22.08, 92.08), p(22.3, 91.98),
];
const arakanToPegu = [
  p(20.6, 93.19), p(19.87, 94.04), p(20.18, 94.88), // Mrauk-U / Ann / Minbu
  p(20.15, 94.94), p(18.82, 95.22), // Magwe / Pyay
];
const pegu = p(17.32, 96.515);
const peguToBangkok = [
  p(18, 96.8), p(17.8, 97), p(17.3, 97.05), // north of the Sittaung estuary
  p(16.93, 97.37), p(16.88, 97.64), p(16.55, 98.23), // Thaton / Hpa-An / Kawkareik
  p(16.71, 98.57), p(16.88, 99.13), p(15.7, 100.12), // Mae Sot / Tak / Nakhon Sawan
];

const kokoda = p(-8.884, 147.731);
const popondetta = p(-8.77, 148.24);
const laeToWau = [p(-6.7, 146.7), p(-7.06, 146.68), p(-7.35, 146.72)];

// Lower Yangtze / Poyang / Taihu: go around broad lake surfaces, while leaving
// river crossings and their wartime transport constraints explicitly abstract.
const nanjing = p(32.052, 118.778);
const nanjingToShanghai = [
  p(32.2, 119.43), p(31.78, 119.97), p(31.57, 120.3), // Zhenjiang / Changzhou / Wuxi
  p(31.3, 120.59), p(31.38, 120.98), // Suzhou / Kunshan: north/east of Taihu
];
const wuhanNorth = [p(30.88, 114.38), p(31.29, 114.62)]; // Huangpi / Hong'an
const wuhanToNanjing = [
  ...wuhanNorth, p(31.68, 115.93), p(31.75, 116.51), p(31.82, 117.23), p(32.31, 118.31), // Jinzhai / Lu'an / Hefei / Chuzhou
];
const wuhanSouth = [p(30.31, 114.08), p(29.71, 113.88)]; // Hannan / Chibi, west of Tangxun/Liangzi lakes
const nanjingToJinan = [
  p(32.31, 118.31), p(32.92, 117.39), p(33.64, 116.99), p(34.27, 117.19), // Chuzhou / Bengbu / Suzhou / Xuzhou
  p(34.43, 117.45), p(34.59, 117.52), p(34.86, 117.56), // Jiawang / Hanzhuang / old Zaozhuang: east of Weishan lake
  p(35.08, 117.2), p(35.6, 116.98), p(36.2, 117.09), // Tengzhou / Qufu / Tai'an, east of the remaining Nansi lakes
];

export const asianLandCorridors: Readonly<Record<string, readonly GeographicCoordinate[]>> = {
  'bombay|karachi': [
    p(19.01, 72.85), p(19.04, 72.87), p(19.2, 72.97), p(19.4, 72.87), // Dadar / Sion / Thane / Vasai
    p(20.61, 72.93), p(21.17, 72.83), p(22.31, 73.18), p(23.02, 72.57), // Valsad / Surat / Vadodara / Ahmedabad
    p(24.17, 72.44), p(25.75, 71.4), p(25.36, 69.73), p(25.39, 68.37), // Palanpur / Barmer / Umerkot / Hyderabad (Sindh)
  ],
  'dutch_east_indies|surabaya': [
    p(-6.91, 107.6), p(-7.33, 108.22), p(-7.42, 109.24), // Bandung / Tasikmalaya / Purwokerto
    p(-7.8, 110.37), p(-7.56, 110.82), p(-7.63, 111.53), p(-7.47, 112.44), // Yogyakarta / Surakarta / Madiun / Mojokerto
  ],
  'indochina|saigon': hanoiToSaigon,
  'lae|new_guinea': [...laeToWau, p(-8.2, 146.9), kokoda, popondetta],
  'hong_kong|indochina': [...kowloonToGuangzhou, guangzhou, ...[...hanoiToGuangzhou].reverse()],
  'haiphong|south_china': [hanoi, ...hanoiToGuangzhou],
  'hiroshima|osaka_kure': hiroshimaToOsaka,
  'sinuiju|dalian': [p(40.13, 124.4), p(40.45, 124.07), p(41.805, 123.432), ...dalianSouth],
  'arakan|burma': [...arakanToPegu, pegu],
  'pegu|bangkok': peguToBangkok,
  'calcutta|chittagong': [p(23.16, 89.21), p(23.71, 90.41), p(23.46, 91.18)], // Jessore / Dhaka / Comilla, north of the Meghna estuary
  'arakan|pegu': arakanToPegu,
  'milne_bay|new_guinea': [
    p(-10.22, 150.1), p(-10.1, 149.8), p(-9.8, 149.4), p(-9.5, 149), // inland of Milne and Goodenough bays
    p(-9.15, 148.55), popondetta, // Managalas foothills / Popondetta
  ],
  'pyongyang|sinuiju': [p(39.62, 125.66)],
  'bataan|philippines': [
    p(14.58, 120.53), p(14.84, 120.54), p(14.94, 120.63), // Balanga / Dinalupihan / Lubao: north around Manila Bay
    p(15.03, 120.68), p(14.96, 120.9), p(14.84, 120.96), p(14.71, 120.99), // San Fernando / Baliuag / Bocaue / Valenzuela
  ],
  'manchuria|tianjin': northernBohai,
  'north_china|shanghai': [
    p(39.12, 117.2), p(37.45, 116.3), p(36.677, 116.993), // Tianjin / Dezhou / Jinan
    ...[...nanjingToJinan].reverse(), nanjing, ...nanjingToShanghai,
  ],
  'nagoya|yokosuka': [
    p(34.77, 137.39), p(34.82, 137.55), p(34.85, 137.73), // Toyohashi / Mikkabi / north of Hamana lake
    p(34.84, 138.18), p(35, 138.38), p(35.22, 138.62), // Shimada / Shizuoka / Fujinomiya
    p(35.31, 138.93), p(35.26, 139.15), p(35.44, 139.37), ...yokosukaWest, // Gotemba / Odawara / Atsugi
  ],
  'lae|port_moresby': [...laeToWau, p(-8.2, 146.9), p(-9.1, 147.15)],
  'india|madras': [
    p(21.15, 79.09), p(17.38, 78.49), p(13.63, 79.42), p(13.44, 79.55), p(13.14, 79.91), // Nagpur / Hyderabad / Tirupati / Puttur / Tiruvallur
  ],
  'burma|indochina': [pegu, p(18.94, 96.43), p(21.98, 96.08), p(21.29, 99.61), p(19.88, 102.14)], // Toungoo / Mandalay / Kengtung / Luang Prabang
  'hiroshima|nagoya': [...hiroshimaToOsaka, osaka, ...osakaToNagoya],
  'hong_kong|south_china': kowloonToGuangzhou,
  'japan_home|osaka_kure': [p(35.66, 138.57), p(35.51, 137.82), p(35.49, 137.5), nagoya, ...[...osakaToNagoya].reverse()], // Kofu / Iida / Nakatsugawa
  'manchuria|soviet_far_east': [p(43.83, 126.55), ...mudanjiangToVladivostok],
  'arakan|chittagong': arakanToChittagong,
  'mongolia|soviet_far_east': [
    p(48.07, 114.5), p(47.16, 115.53), p(47.18, 119.94), // Choibalsan / Matad / Arxan: south of Buir lake
    p(47.35, 123.9), p(45.752, 126.648), ...mudanjiangToVladivostok, // Qiqihar / Harbin
  ],
  'japan_home|yokosuka': [p(35.55, 139.68), ...yokosukaWest],
  'harbin|soviet_far_east': mudanjiangToVladivostok,
  'hollandia|new_guinea': [p(-4.1, 138.9), p(-6.08, 145.38), kokoda, popondetta], // Wamena / Goroka / Kokoda / Popondetta; not a continuous road
  'arakan|chindwin': [p(20.6, 93.19), p(21.38, 93.96), p(21.33, 95.1)], // Mrauk-U / Mindat / Pakokku

  'central_china|nanchang': [...wuhanSouth, p(29.6, 114.48), p(29.03, 114.56), p(28.69, 115.39)], // Tongshan / Xiushui / Fengxin
  'central_china|nanjing': wuhanToNanjing,
  'central_china|shanghai': [...wuhanToNanjing, nanjing, ...nanjingToShanghai],
  'central_china|south_china': [...wuhanSouth, p(28.23, 112.94), p(26.9, 112.57), p(25.77, 113.03), p(24.8, 113.59)], // Changsha / Hengyang / Chenzhou / Shaoguan
  'nanjing|shandong': nanjingToJinan,
  'nanjing|shanghai': nanjingToShanghai,
  'nanchang|nanjing': [
    p(29.03, 115.82), p(29.31, 115.76), p(29.68, 115.68), p(30.08, 115.94), // Yongxiu / De'an / Ruichang / Huangmei, west of Poyang
    p(30.45, 116.3), p(30.63, 116.57), p(31.05, 116.97), p(31.82, 117.23), p(32.31, 118.31), // Taihu county / Qianshan / Tongcheng / Hefei / Chuzhou
  ],
};
