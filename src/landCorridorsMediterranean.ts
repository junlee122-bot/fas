import type { GeographicCoordinate } from './territoryGeography';

const point = (latitude: number, longitude: number): GeographicCoordinate => ({ latitude, longitude });
const reversed = (points: readonly GeographicCoordinate[]) => [...points].reverse();

/**
 * Approximate DISPLAY corridors through named cities and their inland approaches.
 * These do not change strategic adjacency, city anchors, land movement costs,
 * sovereignty or permissions. They are not surveyed roads, proof of a bridge,
 * or an assertion that a particular road/pass was usable in 1942.
 * Shoreline/lake audit: Natural Earth 1:10m physical vectors,
 * https://www.naturalearthdata.com/downloads/10m-physical-vectors/
 * Reproduce: node scripts/audit-land-route-geography.mjs --all --segments
 * Rivers and the Suez Canal remain abstract crossings; ports and sea routes
 * are deliberately NOT used as substitutes for inland city coordinates.
 */

// Shared Sinai approach, inland of Lake Bardawil and the Mediterranean coast.
// El Qantara is a canal crossing, not a claim of a 1942 permanent road bridge.
const qantaraToJerusalem = [
  point(30.85, 32.3), // El Qantara
  point(30.93, 32.62), point(31.02, 33.01), // Sinai interior / Bir el Abd
  point(31.08, 33.8), point(31.28, 34.24), // El Arish / Rafah inland approaches
  point(31.25, 34.79), point(31.53, 35.1), // Beersheba / Hebron
];
const cairoToJerusalem = [point(30.423, 31.563), point(30.58, 32.27), ...qantaraToJerusalem];
const suezToJerusalem = [
  point(30.03, 32.46), point(30.15, 32.27), point(30.33, 32.1), // west of the Bitter Lakes
  point(30.58, 32.15), point(30.58, 32.27), ...qantaraToJerusalem,
];
const jerusalem = point(31.778, 35.207);
const jerusalemToDamascus = [
  point(32.22, 35.26), point(32.46, 35.3), // Nablus / Jenin
  point(32.7, 35.3), point(32.97, 35.5), // Nazareth / Safed, west of Lake Tiberias
  point(33.1, 35.82), // Quneitra
];
const safedToBeirut = [
  point(33.28, 35.58), point(33.27, 35.26), // Metula / Tyre hinterland
  point(33.55, 35.45), point(33.73, 35.47), // Sidon / Damour hinterland
];
const ankaraToHoms = [
  point(39.85, 33.51), point(39.15, 34.16), // Kirikkale / Kirsehir: east of Lake Tuz
  point(38.73, 35.48), point(37.58, 36.93), // Kayseri / Kahramanmaras
  point(37.07, 37.38), point(36.236, 37.168), // Gaziantep / Aleppo
  point(35.13, 36.75), point(34.73, 36.71), // Hama / Homs
];

// Gulf of Sidra: identical inland bands to the already audited core corridor.
const agheilaToSirte = [point(30.1, 18.8), point(30.4, 17.5), point(31, 16.7)];
const sirte = point(31.21, 16.59);
const sirteToTripoli = [point(31.1, 16.5), point(31, 15.5), point(31.8, 14.8), point(32.45, 14.2), point(32.7, 13.18)];
const agheila = point(30.257, 19.2);
const agheilaToTobruk = [
  point(30.15, 19.45), point(30.35, 20.03), point(30.55, 20.18), // south of the Brega coastal bight
  point(30.76, 20.23), point(31.46, 20.94), // Ajdabiya / Msus
  point(32.16, 22.3), point(31.95, 23.96), // Mechili / Tobruk southern approach
];
const tobruk = point(32.083, 23.967);
const tobrukToAlamein = [
  point(31.95, 23.96), point(31.63, 25.01), point(31.52, 25.1), // Bardia / Sollum approaches
  point(31.28, 25.4), point(31.45, 25.8), // inland of the Gulf of Sollum
  point(31.55, 25.93), point(31.25, 27.1), // Sidi Barrani / Mersa Matruh hinterland
  point(31, 28.02), point(30.85, 28.4), // Fuka / El Dabaa hinterland
];
const alamein = point(30.817, 28.95);
const alameinToCairo = [point(30.75, 29.2), point(30.4, 30.1), point(30.15, 30.75)];
const sirteToCairo = [
  ...reversed(agheilaToSirte), agheila, ...agheilaToTobruk, tobruk,
  ...tobrukToAlamein, alamein, ...alameinToCairo,
];

// Around the northern Adriatic, never a Nis–Rome chord across the sea.
const nis = point(43.321, 21.896);
const belgrade = point(44.821, 20.466);
const belgradeToRome = [
  point(45.81, 15.98), point(46.05, 14.5), // Zagreb / Ljubljana
  point(45.78, 14.22), point(45.714, 13.874), // Postojna / Sezana
  point(45.81, 13.53), point(46.07, 13.23), // Monfalcone / Udine
  point(45.96, 12.66), point(45.67, 12.24), // Pordenone / Treviso, north of Venice Lagoon
  point(45.4, 11.88), point(44.49, 11.34), // Padua / Bologna
  point(43.77, 11.25), point(43.46, 11.88), point(42.72, 12.11), // Florence / Arezzo / Orvieto
];
const kilkis = point(40.99, 22.88);
const kilkisToAthens = [
  point(40.79, 22.41), point(40.52, 22.2), // Giannitsa / Veria, west of the Thermaic Gulf
  point(39.89, 22.19), point(39.64, 22.42), // Elassona / Larissa
  point(39.29, 22.38), point(38.92, 22.44), // Farsala / Lamia, west of the Maliakos Gulf
  point(38.32, 23.32), // Thebes
];
const nisToAthens = [
  point(41.998, 21.426), point(41.72, 21.77), point(41.14, 22.5), // Skopje / Veles / Gevgelija
  kilkis, ...kilkisToAthens,
];

export const mediterraneanLandCorridors: Readonly<Record<string, readonly GeographicCoordinate[]>> = {
  'beirut|suez': reversed([...suezToJerusalem, jerusalem, ...jerusalemToDamascus.slice(0, 4), ...safedToBeirut]),
  'anatolia|beirut': [...ankaraToHoms, point(34.006, 36.204), point(33.85, 35.9)], // Baalbek / Zahle
  'anatolia|levant': ankaraToHoms,
  'egypt|levant': [...cairoToJerusalem, jerusalem, ...jerusalemToDamascus],
  'cairo|levant': [...cairoToJerusalem, jerusalem, ...jerusalemToDamascus],
  'levant|suez': reversed([...suezToJerusalem, jerusalem, ...jerusalemToDamascus]),
  'cairo|jerusalem': cairoToJerusalem,
  'libya|tobruk': [...reversed(agheilaToSirte), agheila, ...agheilaToTobruk],
  'egypt|libya': reversed(sirteToCairo),
  'el_agheila|tripoli': [...agheilaToSirte, sirte, ...sirteToTripoli],
  'libya|tripoli': sirteToTripoli,
  'el_agheila|libya': agheilaToSirte,
  'el_agheila|tobruk': agheilaToTobruk,
  'egypt|tobruk': reversed([...tobrukToAlamein, alamein, ...alameinToCairo]),
  'el_alamein|tobruk': reversed(tobrukToAlamein),
  'alexandria|el_alamein': [
    point(31.05, 29.8), point(30.91, 29.55), point(30.85, 29.39), // Amiriya / Borg el Arab / El Hammam
    point(30.75, 29.2), // south of the coastal indentation east of El Alamein
  ],
  'casablanca|oran': [
    point(33.9, -6.75), point(33.89, -5.55), point(34.03, -5), // Rabat hinterland / Meknes / Fes
    point(34.21, -4.01), point(34.22, -3.35), point(34.68, -1.91), // Taza / Guercif / Oujda
    point(34.89, -1.32), point(35.19, -0.64), point(35.55, -0.6), // Tlemcen / Sidi Bel Abbes / southern Oran
  ],
  'algiers|oran': [
    point(36.483, 2.833), point(36.264, 1.966), point(36.17, 1.33), // Blida / Ain Defla / Chlef
    point(35.74, 0.556), point(35.589, 0.065), point(35.55, -0.6), // Relizane / Mohammadia / southern Oran
  ],
  'balkans|italy': [belgrade, ...belgradeToRome],
  'balkans|greece': nisToAthens,
  'belgrade|greece': [nis, ...nisToAthens],
  'greece|sofia': reversed([
    point(42.02, 23.1), point(41.57, 23.28), point(41.24, 23.39), // Blagoevgrad / Sandanski / Sidirokastro
    kilkis, ...kilkisToAthens,
  ]),
  'greece|sarajevo': reversed([
    point(43.78, 19.29), point(43.85, 19.84), point(43.72, 20.69), // Visegrad / Uzice / Kraljevo
    nis, ...nisToAthens,
  ]),
  'messina|sicily': [
    point(38.1, 15.21), point(38.1, 14.96), point(38.12, 14.83), // Barcellona / Patti / Brolo hinterland
    point(38.059, 14.639), point(38.018, 14.436), // Sant'Agata / Caronia inland approaches
    point(37.933, 14.086), point(37.93, 13.66), point(37.92, 13.57), // Castelbuono / Caccamo / Ventimiglia di Sicilia
    point(38.08, 13.44), point(38.1, 13.35), // Villabate / Palermo southern approach
  ],
  'italy|naples': [point(41.64, 13.35), point(41.49, 13.83), point(41.07, 14.33)], // Frosinone / Cassino / Caserta
  'caucasus|tehran': [
    point(43.02, 44.68), point(42.66, 44.64), point(41.72, 44.79), // Vladikavkaz / Kazbegi / Tbilisi
    point(40.68, 46.36), point(40.38, 47.13), point(39.45, 48.55), // Ganja / Barda / Bilasuvar
    point(38.75, 48.7), point(38.43, 48.75), // Lankaran / Astara hinterland
    point(37.8, 48.85), point(37.36, 49.12), point(37.28, 49.59), point(36.27, 50), // Talesh / Masal / Rasht / Qazvin
  ],
  'caucasus|ukraine': [
    point(45.04, 41.97), point(47.25, 39.72), // Stavropol / Rostov
    point(47.56, 38.87), point(48, 37.8), // Matveev Kurgan / Donetsk, north of the Sea of Azov
    point(49.59, 34.55), point(50.24, 32.52), point(50.51, 30.8), // Poltava / Pyryatyn / Brovary
  ],
  'baghdad|basra': [
    point(32.48, 44.43), point(31.99, 44.93), point(31.31, 45.28), // Hilla / Diwaniyah / Samawah
    point(31.04, 46.26), point(30.89, 46.45), // Nasiriyah / Suq al-Shuyukh
    point(30.65, 46.5), point(30.45, 47), point(30.45, 47.6), // south of Hammar marsh / Az Zubayr approach
  ],
};
