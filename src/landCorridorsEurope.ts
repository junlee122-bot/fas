import type { GeographicCoordinate } from './territoryGeography';

const point = (latitude: number, longitude: number): GeographicCoordinate => ({ latitude, longitude });

/**
 * Approximate named mainland display corridors, checked against the map's
 * Natural Earth physical vectors. Not surveyed roads, documented 1942 travel,
 * bridge availability, border permissions, or land-engine movement geometry.
 * The Scotland anchor is on Hoy: no fictitious mainland corridor is authored.
 */
const brestToRennes = [point(48.577, -3.827), point(48.45, -2.8), point(48.112, -1.679)]; // Morlaix / Saint-Brieuc / Rennes
const rennesToCaen = [point(48.643, -1.212), point(49.116, -1.09)]; // Avranches / Saint-Lo hinterland
const exeter = point(50.724, -3.527);
const taunton = point(51.015, -3.103);

// Crimea uses the Perekop land isthmus, never a chord across the Black/Azov seas.
const crimeaToPerekop = [point(44.95, 34.1), point(45.71, 34.39), point(46.16, 33.69), point(46.36, 33.54)];
const perekopToMykolaiv = [point(46.635, 32.616), point(46.97, 32)];
const mykolaivToOdesa = [point(47.56, 31.34), point(47.2, 30.91)]; // Voznesensk: north of Dnieper-Bug estuary
const perekopToMariupol = [point(46.75, 33.48), point(47.15, 34.38), point(46.85, 35.36), point(47.25, 35.7), point(47.77, 37.5)]; // Nova Kakhovka / Melitopol / Tokmak / Volnovakha regions
const mariupolToRostov = [point(47.35, 38.0), point(47.45, 38.9), point(47.42, 39.5)]; // inland of Taganrog Bay

// Southern/western shores of Ladoga/Peipus; large lake diagonals are avoided.
const rigaToLeningrad = [
  point(57.54, 25.43), point(57.78, 26.03), point(57.84, 27.02), // Valmiera / Valga / Voru
  point(57.3, 27.6), point(57.8, 28.33), point(58.74, 29.85), // Pechory hinterland / Pskov / Luga
  point(59.57, 30.13), // Gatchina
];
const leningrad = point(59.934, 30.335);
const vyborgToTornio = [
  point(60.94, 27.54), point(60.87, 26.7), point(60.98, 25.66), // Luumaki / Kouvola / Lahti
  point(60.737, 24.772), point(60.814, 23.623), point(61.181, 22.692), point(61.803, 22.393), point(62.02, 23.03), // Riihimaki / Forssa / Huittinen / Kankaanpaa / Parkano, west of the Finnish lake district
  point(62.79, 22.84), point(63.55, 23.7), point(64.07, 24.53), point(64.22, 25.36), // Seinajoki / Kaustinen / Ylivieska / Haapavesi
  point(65.0, 25.47), point(65.32, 25.37), point(65.56, 25.78), point(65.7, 25.2), point(65.81, 24.54), point(65.85, 24.15), // Oulu / Ii / Oijarvi / Simo hinterland / Keminmaa / Tornio
];
const tornioToKiruna = [point(66.61, 23.89), point(67.21, 23.37), point(67.86, 20.23)]; // Pello / Pajala / Kiruna
const kirunaToNarvik = [
  point(68.1, 19.45), point(68.3, 18.85), point(68.32, 18.5), point(68.43, 18.08), // southern Abisko lake hinterland / Riksgransen
  point(68.42, 17.9), point(68.35, 17.75), point(68.3, 17.55), point(68.32, 17.4), // southern Rombaken hinterland
];
const tornioToOslo = [
  point(66.33, 22.84), point(65.83, 21.69), point(65.59, 19.18), point(63.18, 17.27), // Overkalix / Boden / Arvidsjaur / Solleftea
  point(62.75, 15.42), point(62.18, 14.94), point(62.04, 14.36), // Bracke / Ytterhogdal / Sveg
  point(60.68, 13.72), point(60.14, 13.0), point(60.19, 12.0), // Malung / Torsby / Kongsvinger
];
const kandalakshaToMurmansk = [point(67.2, 32.3), point(67.94, 32.93), point(68.88, 33.03)]; // Kandalaksha hinterland / Monchegorsk / Kola
const medvezhyegorskToKandalaksha = [
  point(63.74, 34.32), point(64.63, 33.15), point(65.04, 33.1), // Segezha / Kem hinterland
  point(65.4, 33.45), point(65.62, 33.1), point(65.9, 33.15), point(66.08, 33.04), // western Engozero hinterland / Loukhi, east of Topozero
  point(66.5, 32.45), point(66.75, 32.15), point(67.0, 32.15), // inland of Keret and Kandalaksha bays
];
const vyborgToMedvezhyegorsk = [
  leningrad, point(59.8, 31.8), point(59.92, 32.35), point(60.73, 33.55), // south of Ladoga: Volkhov / Lodeynoye Pole
  point(60.98, 32.97), point(61.8, 34.1), point(62.3, 33.9), // Olonets / Petrozavodsk hinterland
  point(62.47, 33.65), point(62.7, 33.4), point(62.85, 33.85), point(62.95, 34.43), // Girvas / west of Paleozero / Medvezhyegorsk hinterland
];
const archangelToKargopol = [point(63.8, 40.35), point(62.71, 40.29), point(61.51, 38.94)]; // Plesetsk / Kargopol inland of White Sea

/** One authored orientation per strategic pair; root accessor returns copies. */
export const europeanLandCorridors: Readonly<Record<string, readonly GeographicCoordinate[]>> = {
  'bordeaux|brittany': [point(45.65, 0.16), point(46.58, 0.34), point(47.22, -1.55), point(48.112, -1.679), ...brestToRennes.slice(0, -1).reverse()],
  'brittany|cherbourg': [...brestToRennes, ...rennesToCaen, point(49.31, -1.32), point(49.5, -1.55)],
  'brittany|normandy': [...brestToRennes, ...rennesToCaen],
  'calais|normandy': [point(50.29, 2.78), point(49.9, 2.3), point(49.44, 1.1), point(49.02, 1.15), point(49.14, 0.23)], // Arras / Amiens / Rouen / Evreux / Lisieux
  'cherbourg|normandy': [point(49.5, -1.55), point(49.31, -1.32), point(49.116, -1.09)],
  'plymouth|portsmouth': [exeter, point(50.95, -2.7), point(50.98, -1.5), point(51.06, -1.31), point(50.91, -1.08)], // Crewkerne / Romsey / Winchester / Havant hinterland
  'britain|plymouth': [point(51.45, -0.98), point(51.07, -1.8), taunton, exeter, point(50.55, -3.82)], // Reading / Salisbury / Dartmoor
  'liverpool|plymouth': [point(53.39, -2.59), point(53.19, -2.52), point(52.71, -2.75), point(52.19, -2.22), point(51.46, -2.58), taunton, exeter, point(50.55, -3.82)], // Warrington / north of Chester / Shrewsbury / Worcester / Bristol
  'marseille|spain': [point(43.53, 5.45), point(43.64, 5.1), point(43.84, 4.36), point(43.61, 3.88), point(43.34, 3.21), point(42.7, 2.9), point(42.42, 2.87), point(41.98, 2.82), point(41.62, 0.62), point(41.65, -0.89)], // Aix / Salon / Nimes / Montpellier / Beziers / Perpignan / La Jonquera / Girona / Lleida / Zaragoza
  'po_valley|vienna': [point(45.44, 10.99), point(46.5, 11.35), point(47.0, 11.5), point(47.28, 11.41), point(47.8, 13.05), point(48.31, 14.29)], // Verona / Bolzano / Brenner / Innsbruck / Salzburg / Linz
  'alps|france': [point(47.24, 10.74), point(47.14, 10.57), point(47.24, 9.6), point(47.42, 9.37), point(47.5, 8.72), point(47.56, 7.59), point(47.75, 7.34), point(48.69, 6.18)], // Imst / Landeck / Feldkirch / St Gallen / Winterthur / Basel / Mulhouse / Nancy
  'baltic|east_prussia': [point(56.65, 23.73), point(55.93, 23.32), point(54.9, 23.9), point(54.59, 22.2)], // Jelgava / Siauliai / Kaunas / Gusev
  'east_prussia|germany': [point(54.08, 21.38), point(53.78, 20.48), point(53.01, 18.61), point(52.41, 16.93)], // Ketrzyn / Olsztyn / Torun / Poznan
  'baltic|leningrad': rigaToLeningrad,
  'baltic|finland': [...rigaToLeningrad, leningrad],
  'finland|narvik': [...vyborgToTornio, ...tornioToKiruna, ...kirunaToNarvik],
  'finland|norway': [...vyborgToTornio, ...tornioToOslo],
  'narvik|norway': [...kirunaToNarvik].reverse().concat([point(67.86, 20.23), point(67.14, 20.66), point(66.61, 19.84)], tornioToOslo.slice(2)), // Gallivare / Jokkmokk, through Swedish inland
  'murmansk|narvik': [...kandalakshaToMurmansk].reverse().concat([point(67.2, 32.2), point(66.83, 28.67), point(66.5, 25.73), point(67.35, 23.83), point(67.86, 20.23)], kirunaToNarvik), // Salla / Rovaniemi / Kolari
  'finland|murmansk': [...vyborgToMedvezhyegorsk, ...medvezhyegorskToKandalaksha, ...kandalakshaToMurmansk],
  'archangel|murmansk': [...archangelToKargopol, point(61.8, 36.53), point(62.2, 36.7), point(62.8, 35.8), point(63.05, 34.9), point(63.05, 34.46), ...medvezhyegorskToKandalaksha, ...kandalakshaToMurmansk], // Pudozh / east and north of Onega / Povenets hinterland
  'archangel|leningrad': [...archangelToKargopol, point(61.0, 36.45), point(60.5, 35.4), point(60.5, 34.7), point(60.73, 33.55), point(59.92, 32.35), point(59.8, 31.8)], // Vytegra / south of Svir reservoir / Lodeynoye Pole / Volkhov
  'crimea|odessa': [...crimeaToPerekop, ...perekopToMykolaiv, ...mykolaivToOdesa],
  'crimea|nikolaev': [...crimeaToPerekop, ...perekopToMykolaiv],
  'crimea|mariupol': [...crimeaToPerekop, ...perekopToMariupol],
  'crimea|rostov': [...crimeaToPerekop, ...perekopToMariupol, ...mariupolToRostov],
  'crimea|ukraine': [...crimeaToPerekop, ...perekopToMykolaiv, point(47.56, 31.34), point(48.51, 32.26), point(48.75, 30.22)], // Voznesensk / Kropyvnytskyi / Uman, west of Dnieper reservoirs
  'crimea|kharkov': [...crimeaToPerekop, ...perekopToMariupol.slice(0, 3), point(47.84, 35.14), point(48.45, 35.14), point(49.38, 35.45)], // Zaporizhia / eastern Dnipro / Krasnohrad
  'mariupol|rostov': mariupolToRostov,
  'nikolaev|odessa': mykolaivToOdesa,
  'bucharest|odessa': [point(45.43, 28.05), point(45.68, 28.62), point(46.19, 29.15), point(46.83, 29.48), point(46.8, 30.1)], // Danube hinterland / Bender, north of Dniester estuary
};
