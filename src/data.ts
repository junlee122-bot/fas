import type { Commander, CovertOperation, DiplomaticRelation, Division, ProductionLine, ResearchProject, Territory } from './types';

export const territories: Territory[] = [
  { id: 'britain', name: '영국 본토', region: '서유럽', x: 24, y: 25, controller: 'allies', value: 10, supply: 96, terrain: '도시', neighbors: ['channel', 'atlantic'], },
  { id: 'atlantic', name: '대서양 항로', region: '대서양', x: 11, y: 45, controller: 'allies', value: 4, supply: 70, terrain: '해양', neighbors: ['britain', 'morocco'], },
  { id: 'channel', name: '영불 해협', region: '서부 전선', x: 31, y: 35, controller: 'axis', value: 6, supply: 82, terrain: '해안', neighbors: ['britain', 'france'], },
  { id: 'france', name: '점령 프랑스', region: '서부 전선', x: 37, y: 42, controller: 'axis', value: 9, supply: 89, terrain: '평야', neighbors: ['channel', 'lowlands', 'alps', 'spain'], },
  { id: 'lowlands', name: '저지대', region: '서부 전선', x: 43, y: 29, controller: 'axis', value: 7, supply: 93, terrain: '평야', neighbors: ['france', 'germany'], },
  { id: 'germany', name: '독일 본토', region: '중부 유럽', x: 53, y: 33, controller: 'axis', value: 12, supply: 98, terrain: '도시', neighbors: ['lowlands', 'alps', 'poland', 'denmark'], },
  { id: 'denmark', name: '덴마크 해협', region: '북해', x: 52, y: 19, controller: 'axis', value: 4, supply: 78, terrain: '해안', neighbors: ['germany', 'norway'], },
  { id: 'norway', name: '노르웨이', region: '스칸디나비아', x: 57, y: 8, controller: 'axis', value: 5, supply: 62, terrain: '산악', neighbors: ['denmark', 'finland'], },
  { id: 'finland', name: '핀란드 전선', region: '스칸디나비아', x: 73, y: 13, controller: 'axis', value: 4, supply: 56, terrain: '삼림', neighbors: ['norway', 'baltic'], },
  { id: 'poland', name: '폴란드 총독부', region: '동부 전선', x: 66, y: 34, controller: 'axis', value: 8, supply: 77, terrain: '평야', neighbors: ['germany', 'baltic', 'ukraine', 'balkans'], },
  { id: 'baltic', name: '발트 전선', region: '동부 전선', x: 78, y: 26, controller: 'axis', value: 6, supply: 55, terrain: '삼림', neighbors: ['poland', 'finland', 'moscow'], },
  { id: 'moscow', name: '모스크바 방면', region: '동부 전선', x: 91, y: 31, controller: 'allies', value: 12, supply: 75, terrain: '도시', neighbors: ['baltic', 'ukraine'], },
  { id: 'ukraine', name: '우크라이나 전선', region: '동부 전선', x: 80, y: 47, controller: 'axis', value: 9, supply: 63, terrain: '평야', neighbors: ['poland', 'moscow', 'caucasus', 'balkans'], },
  { id: 'caucasus', name: '캅카스 유전', region: '동부 전선', x: 90, y: 64, controller: 'allies', value: 10, supply: 47, terrain: '산악', neighbors: ['ukraine', 'anatolia'], },
  { id: 'alps', name: '알프스 방면', region: '남부 유럽', x: 49, y: 50, controller: 'axis', value: 5, supply: 71, terrain: '산악', neighbors: ['france', 'germany', 'italy', 'balkans'], },
  { id: 'italy', name: '이탈리아 반도', region: '지중해', x: 55, y: 61, controller: 'axis', value: 8, supply: 76, terrain: '구릉', neighbors: ['alps', 'balkans', 'sicily'], },
  { id: 'balkans', name: '발칸 전선', region: '남부 유럽', x: 67, y: 56, controller: 'axis', value: 6, supply: 58, terrain: '구릉', neighbors: ['italy', 'alps', 'poland', 'ukraine', 'anatolia'], },
  { id: 'anatolia', name: '아나톨리아', region: '근동', x: 79, y: 68, controller: 'neutral', value: 5, supply: 61, terrain: '고원', neighbors: ['balkans', 'caucasus', 'levant'], },
  { id: 'spain', name: '이베리아 반도', region: '서유럽', x: 30, y: 62, controller: 'neutral', value: 5, supply: 68, terrain: '고원', neighbors: ['france', 'morocco'], },
  { id: 'morocco', name: '프랑스령 모로코', region: '북아프리카', x: 27, y: 78, controller: 'axis', value: 4, supply: 42, terrain: '사막', neighbors: ['spain', 'atlantic', 'algeria'], },
  { id: 'algeria', name: '알제리', region: '북아프리카', x: 43, y: 79, controller: 'axis', value: 4, supply: 45, terrain: '사막', neighbors: ['morocco', 'tunisia'], },
  { id: 'tunisia', name: '튀니지', region: '북아프리카', x: 55, y: 77, controller: 'axis', value: 6, supply: 54, terrain: '해안', neighbors: ['algeria', 'sicily', 'libya'], },
  { id: 'sicily', name: '시칠리아', region: '지중해', x: 57, y: 68, controller: 'axis', value: 5, supply: 71, terrain: '해안', neighbors: ['italy', 'tunisia', 'malta'], },
  { id: 'malta', name: '몰타', region: '지중해', x: 62, y: 74, controller: 'allies', value: 5, supply: 61, terrain: '요새', neighbors: ['sicily', 'libya'], },
  { id: 'libya', name: '리비아', region: '북아프리카', x: 69, y: 80, controller: 'axis', value: 5, supply: 35, terrain: '사막', neighbors: ['tunisia', 'malta', 'egypt'], },
  { id: 'egypt', name: '이집트', region: '북아프리카', x: 81, y: 80, controller: 'allies', value: 9, supply: 68, terrain: '사막', neighbors: ['libya', 'levant'], },
  { id: 'levant', name: '레반트', region: '근동', x: 88, y: 72, controller: 'allies', value: 5, supply: 64, terrain: '사막', neighbors: ['egypt', 'anatolia'], },
];

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
  { id: 'radar', name: '센티미터파 레이더', branch: '전자전', description: '공중 탐지와 야간 요격 효율 +15%', progress: 68, duration: 100, active: true, complete: false, icon: '⌁' },
  { id: 'tank', name: '차세대 순항전차', branch: '기갑', description: '기갑사단 공격력과 돌파력 +12%', progress: 34, duration: 120, active: true, complete: false, icon: '▰' },
  { id: 'logistics', name: '기계화 군수 교리', branch: '교리', description: '보급 소모 -10%, 이동 회복 +20%', progress: 0, duration: 90, active: false, complete: false, icon: '⌬' },
  { id: 'code', name: '울트라 해독 체계', branch: '정보', description: '적 작전 탐지 확률 +25%', progress: 0, duration: 130, active: false, complete: false, icon: '◈' },
  { id: 'landing', name: '합동 상륙 교리', branch: '해군', description: '해안 공격 불이익 절반 감소', progress: 0, duration: 110, active: false, complete: false, icon: '≋' },
  { id: 'penicillin', name: '페니실린 대량 생산', branch: '산업', description: '전투 손실 회복률 +18%', progress: 0, duration: 80, active: false, complete: false, icon: '✚' },
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
