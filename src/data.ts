import type { Commander, CovertOperation, DiplomaticRelation, Division, ProductionLine, ResearchProject, Territory } from './types';
import { longHorizonResearchProjects } from './researchProgression';
import { buildStrategicTerritories } from './strategicMapData';

const legacyTerritories: Territory[] = [
  { id: 'britain', name: '영국 본토', region: '서유럽', x: 24, y: 25, controller: 'allies', ownerId: 'britain', value: 10, supply: 96, terrain: '도시', neighbors: ['channel', 'atlantic'], },
  { id: 'atlantic', name: '대서양 항로', region: '대서양', x: 11, y: 45, controller: 'allies', ownerId: 'britain', value: 4, supply: 70, terrain: '해양', neighbors: ['britain', 'morocco'], },
  { id: 'channel', name: '영불 해협', region: '서부 전선', x: 31, y: 35, controller: 'axis', ownerId: 'germany', value: 6, supply: 82, terrain: '해안', neighbors: ['britain', 'france'], },
  { id: 'france', name: '점령 프랑스', region: '서부 전선', x: 37, y: 42, controller: 'axis', ownerId: 'germany', value: 9, supply: 89, terrain: '평야', neighbors: ['channel', 'lowlands', 'alps', 'spain'], },
  { id: 'lowlands', name: '저지대', region: '서부 전선', x: 43, y: 29, controller: 'axis', ownerId: 'germany', value: 7, supply: 93, terrain: '평야', neighbors: ['france', 'germany'], },
  { id: 'germany', name: '독일 본토', region: '중부 유럽', x: 53, y: 33, controller: 'axis', ownerId: 'germany', value: 12, supply: 98, terrain: '도시', neighbors: ['lowlands', 'alps', 'poland', 'denmark'], },
  { id: 'denmark', name: '덴마크 해협', region: '북해', x: 52, y: 19, controller: 'axis', ownerId: 'germany', value: 4, supply: 78, terrain: '해안', neighbors: ['germany', 'norway'], },
  { id: 'norway', name: '노르웨이', region: '스칸디나비아', x: 57, y: 8, controller: 'axis', ownerId: 'germany', value: 5, supply: 62, terrain: '산악', neighbors: ['denmark', 'finland'], },
  { id: 'finland', name: '핀란드 전선', region: '스칸디나비아', x: 73, y: 13, controller: 'axis', value: 4, supply: 56, terrain: '삼림', neighbors: ['norway', 'baltic'], },
  { id: 'poland', name: '폴란드 총독부', region: '동부 전선', x: 66, y: 34, controller: 'axis', ownerId: 'germany', value: 8, supply: 77, terrain: '평야', neighbors: ['germany', 'baltic', 'ukraine', 'balkans'], },
  { id: 'baltic', name: '발트 전선', region: '동부 전선', x: 78, y: 26, controller: 'axis', value: 6, supply: 55, terrain: '삼림', neighbors: ['poland', 'finland', 'moscow'], },
  { id: 'moscow', name: '모스크바 방면', region: '동부 전선', x: 91, y: 31, controller: 'allies', ownerId: 'ussr', value: 12, supply: 75, terrain: '도시', neighbors: ['baltic', 'ukraine'], },
  { id: 'ukraine', name: '우크라이나 전선', region: '동부 전선', x: 80, y: 47, controller: 'axis', ownerId: 'germany', value: 9, supply: 63, terrain: '평야', neighbors: ['poland', 'moscow', 'caucasus', 'balkans'], },
  { id: 'caucasus', name: '캅카스 유전', region: '동부 전선', x: 90, y: 64, controller: 'allies', ownerId: 'ussr', value: 10, supply: 47, terrain: '산악', neighbors: ['ukraine', 'anatolia'], },
  { id: 'alps', name: '알프스 방면', region: '남부 유럽', x: 49, y: 50, controller: 'axis', value: 5, supply: 71, terrain: '산악', neighbors: ['france', 'germany', 'italy', 'balkans'], },
  { id: 'italy', name: '이탈리아 반도', region: '지중해', x: 55, y: 61, controller: 'axis', ownerId: 'italy', value: 8, supply: 76, terrain: '구릉', neighbors: ['alps', 'balkans', 'sicily'], },
  { id: 'balkans', name: '발칸 전선', region: '남부 유럽', x: 67, y: 56, controller: 'axis', value: 6, supply: 58, terrain: '구릉', neighbors: ['italy', 'alps', 'poland', 'ukraine', 'anatolia'], },
  { id: 'anatolia', name: '아나톨리아', region: '근동', x: 79, y: 68, controller: 'neutral', value: 5, supply: 61, terrain: '고원', neighbors: ['balkans', 'caucasus', 'levant'], },
  { id: 'spain', name: '이베리아 반도', region: '서유럽', x: 30, y: 62, controller: 'neutral', value: 5, supply: 68, terrain: '고원', neighbors: ['france', 'morocco'], },
  { id: 'morocco', name: '프랑스령 모로코', region: '북아프리카', x: 27, y: 78, controller: 'axis', value: 4, supply: 42, terrain: '사막', neighbors: ['spain', 'atlantic', 'algeria'], },
  { id: 'algeria', name: '알제리', region: '북아프리카', x: 43, y: 79, controller: 'axis', value: 4, supply: 45, terrain: '사막', neighbors: ['morocco', 'tunisia'], },
  { id: 'tunisia', name: '튀니지', region: '북아프리카', x: 55, y: 77, controller: 'axis', ownerId: 'italy', value: 6, supply: 54, terrain: '해안', neighbors: ['algeria', 'sicily', 'libya'], },
  { id: 'sicily', name: '시칠리아', region: '지중해', x: 57, y: 68, controller: 'axis', ownerId: 'italy', value: 5, supply: 71, terrain: '해안', neighbors: ['italy', 'tunisia', 'malta'], },
  { id: 'malta', name: '몰타', region: '지중해', x: 62, y: 74, controller: 'allies', ownerId: 'britain', value: 5, supply: 61, terrain: '요새', neighbors: ['sicily', 'libya'], },
  { id: 'libya', name: '리비아', region: '북아프리카', x: 69, y: 80, controller: 'axis', ownerId: 'italy', value: 5, supply: 35, terrain: '사막', neighbors: ['tunisia', 'malta', 'egypt'], },
  { id: 'egypt', name: '이집트', region: '북아프리카', x: 81, y: 80, controller: 'allies', ownerId: 'britain', value: 9, supply: 68, terrain: '사막', neighbors: ['libya', 'levant'], },
  { id: 'levant', name: '레반트', region: '근동', x: 88, y: 72, controller: 'allies', ownerId: 'freefrance', value: 5, supply: 64, terrain: '사막', neighbors: ['egypt', 'anatolia'], },
  { id: 'india', name: '인도 본토', region: '남아시아', x: 16, y: 54, controller: 'allies', ownerId: 'india', value: 11, supply: 77, terrain: '평야', neighbors: ['assam', 'ceylon', 'burma'], theater: 'asia' },
  { id: 'ceylon', name: '실론', region: '인도양', x: 22, y: 78, controller: 'allies', ownerId: 'britain', value: 5, supply: 68, terrain: '해안', neighbors: ['india', 'malaya'], theater: 'asia' },
  { id: 'assam', name: '아삼 국경', region: '남아시아', x: 29, y: 48, controller: 'allies', ownerId: 'india', value: 6, supply: 58, terrain: '정글', neighbors: ['india', 'burma', 'yunnan'], theater: 'asia' },
  { id: 'burma', name: '버마 전선', region: '동남아시아', x: 36, y: 61, controller: 'axis', ownerId: 'japan', value: 7, supply: 39, terrain: '정글', neighbors: ['india', 'assam', 'yunnan', 'malaya', 'indochina'], theater: 'asia' },
  { id: 'malaya', name: '말라야', region: '동남아시아', x: 44, y: 77, controller: 'axis', ownerId: 'japan', value: 6, supply: 54, terrain: '정글', neighbors: ['burma', 'singapore', 'ceylon', 'indochina'], theater: 'asia' },
  { id: 'singapore', name: '싱가포르', region: '동남아시아', x: 48, y: 85, controller: 'axis', ownerId: 'japan', value: 9, supply: 72, terrain: '요새', neighbors: ['malaya', 'dutch_east_indies'], theater: 'asia' },
  { id: 'mongolia', name: '몽골 고원', region: '내륙 아시아', x: 47, y: 23, controller: 'neutral', value: 4, supply: 41, terrain: '고원', neighbors: ['soviet_far_east', 'manchuria', 'north_china', 'china_interior'], theater: 'asia' },
  { id: 'china_interior', name: '중국 내륙', region: '중국 전선', x: 45, y: 43, controller: 'allies', ownerId: 'china', value: 10, supply: 52, terrain: '산악', neighbors: ['mongolia', 'north_china', 'central_china', 'yunnan'], theater: 'asia' },
  { id: 'yunnan', name: '윈난', region: '중국 전선', x: 43, y: 58, controller: 'allies', ownerId: 'china', value: 6, supply: 46, terrain: '산악', neighbors: ['china_interior', 'central_china', 'south_china', 'burma', 'assam'], theater: 'asia' },
  { id: 'north_china', name: '화북 전선', region: '중국 전선', x: 56, y: 35, controller: 'axis', ownerId: 'japan', value: 8, supply: 64, terrain: '평야', neighbors: ['manchuria', 'mongolia', 'china_interior', 'central_china'], theater: 'asia' },
  { id: 'central_china', name: '화중 전선', region: '중국 전선', x: 55, y: 49, controller: 'axis', ownerId: 'japan', value: 8, supply: 57, terrain: '강변', neighbors: ['north_china', 'china_interior', 'yunnan', 'south_china'], theater: 'asia' },
  { id: 'south_china', name: '화남 전선', region: '중국 전선', x: 57, y: 62, controller: 'allies', ownerId: 'china', value: 7, supply: 49, terrain: '구릉', neighbors: ['central_china', 'yunnan', 'indochina', 'philippines'], theater: 'asia' },
  { id: 'indochina', name: '인도차이나', region: '동남아시아', x: 53, y: 70, controller: 'axis', ownerId: 'japan', value: 6, supply: 61, terrain: '정글', neighbors: ['south_china', 'burma', 'malaya', 'philippines'], theater: 'asia' },
  { id: 'soviet_far_east', name: '소련 극동', region: '북동아시아', x: 68, y: 12, controller: 'allies', ownerId: 'ussr', value: 7, supply: 65, terrain: '삼림', neighbors: ['mongolia', 'manchuria'], theater: 'asia' },
  { id: 'manchuria', name: '만주', region: '북동아시아', x: 65, y: 24, controller: 'axis', ownerId: 'japan', value: 9, supply: 80, terrain: '평야', neighbors: ['soviet_far_east', 'mongolia', 'north_china', 'korea'], theater: 'asia' },
  { id: 'korea', name: '일제강점기 조선', region: '한반도', x: 70, y: 33, controller: 'axis', ownerId: 'japan', value: 9, supply: 76, terrain: '산악', neighbors: ['manchuria', 'north_china', 'japan_home'], theater: 'asia' },
  { id: 'japan_home', name: '일본 본토', region: '북서 태평양', x: 76, y: 40, controller: 'axis', ownerId: 'japan', value: 12, supply: 96, terrain: '도시', neighbors: ['korea', 'philippines', 'midway'], theater: 'asia' },
  { id: 'philippines', name: '필리핀', region: '서태평양', x: 69, y: 61, controller: 'axis', ownerId: 'japan', value: 9, supply: 66, terrain: '도서', neighbors: ['japan_home', 'south_china', 'indochina', 'dutch_east_indies', 'new_guinea'], theater: 'asia' },
  { id: 'dutch_east_indies', name: '네덜란드령 동인도', region: '남서 태평양', x: 59, y: 87, controller: 'axis', ownerId: 'japan', value: 10, supply: 74, terrain: '도서', neighbors: ['singapore', 'philippines', 'new_guinea'], theater: 'asia' },
  { id: 'new_guinea', name: '뉴기니', region: '남서 태평양', x: 74, y: 84, controller: 'axis', ownerId: 'japan', value: 6, supply: 35, terrain: '정글', neighbors: ['dutch_east_indies', 'philippines', 'coral_sea', 'solomons'], theater: 'asia' },
  { id: 'coral_sea', name: '산호해', region: '남서 태평양', x: 83, y: 86, controller: 'allies', ownerId: 'usa', value: 5, supply: 52, terrain: '해양', neighbors: ['new_guinea', 'solomons', 'hawaii'], theater: 'asia' },
  { id: 'solomons', name: '솔로몬 제도', region: '남태평양', x: 85, y: 72, controller: 'axis', ownerId: 'japan', value: 7, supply: 43, terrain: '도서', neighbors: ['new_guinea', 'coral_sea', 'midway'], theater: 'asia' },
  { id: 'midway', name: '미드웨이', region: '중부 태평양', x: 90, y: 44, controller: 'allies', ownerId: 'usa', value: 8, supply: 71, terrain: '해양', neighbors: ['japan_home', 'solomons', 'hawaii'], theater: 'asia' },
  { id: 'hawaii', name: '하와이', region: '중부 태평양', x: 96, y: 56, controller: 'allies', ownerId: 'usa', value: 11, supply: 94, terrain: '해군기지', neighbors: ['midway', 'coral_sea'], theater: 'asia' },
];

export const territories: Territory[] = buildStrategicTerritories(legacyTerritories);

export const commanders: Commander[] = [
  { id: 'montgomery', name: '버나드 몽고메리', rank: '육군 원수', initials: 'BM', color: '#b59b72', command: 92, attack: 84, defense: 94, logistics: 91, trait: '치밀한 준비', specialty: '사막전 · 조직력', fatigue: 22, loyalty: 97 },
  { id: 'alexander', name: '해럴드 알렉산더', rank: '대장', initials: 'HA', color: '#728b8d', command: 86, attack: 78, defense: 88, logistics: 84, trait: '연합 지휘관', specialty: '다국적군 · 방어', fatigue: 31, loyalty: 95 },
  { id: 'patton', name: '조지 S. 패튼', rank: '중장', initials: 'GP', color: '#a88b5d', command: 90, attack: 97, defense: 71, logistics: 79, trait: '기갑 돌파', specialty: '속도 · 충격', fatigue: 18, loyalty: 88 },
  { id: 'eisenhower', name: '드와이트 아이젠하워', rank: '대장', initials: 'DE', color: '#7d8970', command: 95, attack: 80, defense: 85, logistics: 96, trait: '대연합', specialty: '정치 · 보급', fatigue: 27, loyalty: 99 },
  { id: 'slim', name: '윌리엄 슬림', rank: '중장', initials: 'WS', color: '#8b765c', command: 88, attack: 86, defense: 86, logistics: 93, trait: '회복 탄력성', specialty: '정글전 · 사기', fatigue: 14, loyalty: 96 },
  { id: 'freyberg', name: '버나드 프레이버그', rank: '중장', initials: 'BF', color: '#6f8580', command: 82, attack: 85, defense: 80, logistics: 76, trait: '상륙전 전문가', specialty: '해안 · 특수작전', fatigue: 39, loyalty: 94 },
];

export const initialDivisions: Division[] = [
  { id: '7arm', name: '제7 기갑사단 “사막의 쥐”', type: 'armor', strength: 88, organization: 91, experience: 78, supply: 82, territoryId: 'egypt', commanderId: 'montgomery', status: 'ready' },
  { id: '8army', name: '영국 제8군', type: 'infantry', strength: 94, organization: 86, experience: 72, supply: 88, territoryId: 'egypt', commanderId: 'alexander', status: 'ready' },
  { id: '1arm', name: '미 제1 기갑사단', type: 'armor', strength: 81, organization: 74, experience: 52, supply: 76, territoryId: 'atlantic', commanderId: 'patton', status: 'ready' },
  { id: '1inf', name: '미 제1 보병사단', type: 'infantry', strength: 90, organization: 79, experience: 60, supply: 80, territoryId: 'atlantic', commanderId: 'eisenhower', status: 'ready' },
  { id: '2nz', name: '뉴질랜드 제2사단', type: 'infantry', strength: 84, organization: 88, experience: 81, supply: 79, territoryId: 'malta', commanderId: 'freyberg', status: 'ready' },
  { id: '1air', name: '영국 제1 공수사단', type: 'airborne', strength: 76, organization: 83, experience: 66, supply: 72, territoryId: 'britain', commanderId: 'slim', status: 'ready' },
];

export const initialResearch: ResearchProject[] = [
  { id: 'radar', name: '센티미터파 레이더', branch: '전자전', description: '공중 탐지와 야간 요격 효율 +15%', progress: 68, duration: 100, active: true, complete: false, icon: '⌁', minimumYear: 1942, prerequisites: [], era: 'wartime', historicalBasis: '공동 마그네트론 연구와 전시 레이더망', outcomeTags: ['air-defense', 'electronics'] },
  { id: 'tank', name: '차세대 순항전차', branch: '기갑', description: '기갑사단 공격력과 돌파력 +12%', progress: 34, duration: 120, active: true, complete: false, icon: '▰', minimumYear: 1942, prerequisites: [], era: 'wartime', historicalBasis: '1942년 중형·순항전차 개발 경쟁', outcomeTags: ['armor', 'industry'] },
  { id: 'logistics', name: '기계화 군수 교리', branch: '교리', description: '보급 소모 -10%, 이동 회복 +20%', progress: 0, duration: 90, active: false, complete: false, icon: '⌬', minimumYear: 1942, prerequisites: [], era: 'wartime', historicalBasis: '연합군 차량화 보급과 추축군 철도·차량 보급 경험', outcomeTags: ['logistics', 'command'] },
  { id: 'code', name: '울트라 해독 체계', branch: '정보', description: '적 작전 탐지 확률 +25%', progress: 0, duration: 130, active: false, complete: false, icon: '◈', minimumYear: 1942, prerequisites: [], era: 'wartime', historicalBasis: '블레츨리 파크와 각국 신호정보 조직', outcomeTags: ['intelligence', 'computing'] },
  { id: 'landing', name: '합동 상륙 교리', branch: '해군', description: '해안 공격 불이익 절반 감소', progress: 0, duration: 110, active: false, complete: false, icon: '≋', minimumYear: 1942, prerequisites: [], era: 'wartime', historicalBasis: '연합군 합동 상륙작전 교리', outcomeTags: ['naval', 'command'] },
  { id: 'penicillin', name: '페니실린 대량 생산', branch: '산업', description: '전투 손실 회복률 +18%', progress: 0, duration: 80, active: false, complete: false, icon: '✚', minimumYear: 1942, prerequisites: [], era: 'wartime', historicalBasis: '전시 페니실린 발효·대량생산 사업', outcomeTags: ['health', 'industry'] },
  ...longHorizonResearchProjects,
];

export const initialProduction: ProductionLine[] = [
  { id: 'sherman', name: 'M4 셔먼', category: '중형전차', assigned: 8, efficiency: 76, output: 118, icon: '▰' },
  { id: 'spitfire', name: '스핏파이어 Mk.IX', category: '전투기', assigned: 10, efficiency: 88, output: 204, icon: '✦' },
  { id: 'rifle', name: '리-엔필드 & 지원화기', category: '보병 장비', assigned: 7, efficiency: 94, output: 6840, icon: '╂' },
  { id: 'convoy', name: '리버티 수송선', category: '수송선', assigned: 5, efficiency: 62, output: 12, icon: '≋' },
];

export const worldNews = [
  '스탈린그라드에서 소련군의 저항이 계속되고 있습니다.',
  '대서양 호송선단이 유보트 늑대떼의 공격을 받았습니다.',
  '워싱턴 회담에서 제2전선 개설 논의가 격화되었습니다.',
  '몰타 항공대가 추축국 보급선을 다시 공격했습니다.',
  '북아프리카의 모래폭풍이 양측 작전을 지연시켰습니다.',
  '레지스탕스가 프랑스 철도망에 대한 파괴 공작을 수행했습니다.',
  '버마 국경의 도로와 비행장이 몬순으로 심각한 피해를 입었습니다.',
  '남중국해에서 대규모 수송선단이 진로를 바꾸었다는 보고가 들어왔습니다.',
  '중국 내륙의 지역군 지도자들이 공동 지휘회의에 대표를 파견했습니다.',
  '인도 전시의회에서 참전과 독립을 연계하자는 결의안이 논의되고 있습니다.',
  '솔로몬 제도의 비행장 건설을 둘러싸고 양측 정찰대가 충돌했습니다.',
  '소련 극동군의 이동이 만주 국경 정보망에 포착되었습니다.',
];

export const initialRelations: DiplomaticRelation[] = [
  { id: 'usa', name: '미합중국', code: 'US', value: 92, status: '주요 동맹', color: '#667d93' },
  { id: 'ussr', name: '소비에트 연방', code: 'SU', value: 61, status: '공동 교전국', color: '#965d56' },
  { id: 'freefrance', name: '자유 프랑스', code: 'FR', value: 84, status: '망명 동맹', color: '#6e7f99' },
  { id: 'turkey', name: '튀르키예', code: 'TR', value: 43, status: '중립', color: '#887456' },
  { id: 'spain', name: '스페인국', code: 'ES', value: 27, status: '경계 중립', color: '#8f6b59' },
];

export const initialOperations: CovertOperation[] = [
  { id: 'resistance', name: '프랑스 레지스탕스 지원', region: '점령 프랑스', risk: 28, progress: 72, active: true, icon: 'radio' },
  { id: 'mincemeat', name: '민스미트 기만 작전', region: '지중해', risk: 46, progress: 34, active: true, icon: 'eye' },
  { id: 'desert', name: '사막 장거리 정찰', region: '리비아', risk: 18, progress: 88, active: true, icon: 'crosshair' },
];
