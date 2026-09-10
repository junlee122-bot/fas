import type { HistoricalExpertProfile } from './historicalExperts';
import type { NationId, PersonnelDiscipline } from './types';
import { wikidataHistoricalFigureSeeds } from './wikidataHistoricalFigures.generated';
import { withJosa } from './koreanGrammar';

const nationalityByNation: Record<NationId, string> = {
  britain: '영국', usa: '미국', ussr: '소련', germany: '독일', japan: '일본', china: '중국', india: '인도',
  freefrance: '프랑스', italy: '이탈리아', korea: '한국·조선', vietnam: '베트남', indonesia: '인도네시아', philippines: '필리핀',
};

const appointmentByDiscipline: Record<PersonnelDiscipline, { title: string; effect: string }> = {
  military: { title: '군사 인물 조사·연락 대상', effect: '조사 완료 후 지휘·교리 효과 확정' },
  science: { title: '과학 인물 조사·연락 대상', effect: '조사 완료 후 연구 효과 확정' },
  engineering: { title: '공학 인물 조사·연락 대상', effect: '조사 완료 후 설계·생산 효과 확정' },
  medicine: { title: '의료 인물 조사·연락 대상', effect: '조사 완료 후 의료·방역 효과 확정' },
  economics: { title: '경제 인물 조사·연락 대상', effect: '조사 완료 후 재정·산업 효과 확정' },
  industry: { title: '산업 인물 조사·연락 대상', effect: '조사 완료 후 조달·생산 효과 확정' },
  intelligence: { title: '정보 인물 조사·연락 대상', effect: '조사 완료 후 첩보·방첩 효과 확정' },
  diplomacy: { title: '외교 인물 조사·연락 대상', effect: '조사 완료 후 협상·관계 효과 확정' },
  'social-science': { title: '정치·사회·문화 인물 조사 대상', effect: '조사 완료 후 정통성·선전·행정 효과 확정' },
};

function hash(value: string) {
  return [...value].reduce((total, character) => ((total * 33) ^ character.charCodeAt(0)) >>> 0, 5381);
}

export const massHistoricalExperts: HistoricalExpertProfile[] = wikidataHistoricalFigureSeeds.map((seed) => {
  const [qid, nationId, name, birthYear, occupation, discipline] = seed;
  const scoreSeed = hash(`${qid}:${nationId}`);
  const ability = 58 + (scoreSeed % 21);
  const potential = Math.min(94, ability + 8 + (scoreSeed % 10));
  const nationality = nationalityByNation[nationId];
  const appointment = appointmentByDiscipline[discipline];
  return {
    id: `wd-${qid.toLowerCase()}`,
    primaryNation: nationId,
    accessNations: [nationId],
    name,
    birthYear,
    nationality,
    department: ['science', 'engineering', 'medicine', 'industry', 'intelligence', 'military'].includes(discipline) ? 'science' : 'economy',
    discipline,
    appointmentTitle: appointment.title,
    office1942: `${occupation} · 1942년 활동·소속 정밀조사 필요`,
    affiliation: `${nationality} 인물·전문가 기록 풀`,
    wartimeLocation: `${nationality} 및 해외 활동권 · 1942년 소재 조사 필요`,
    summary: `${withJosa(name, '은/는')} Wikidata ${qid}에서 ${nationality} 국적, ${birthYear}년생으로 확인되는 실존 인물입니다. 전시 보직에 임명하려면 조사 단계에서 1942년 실제 활동과 소속을 추가 검증해야 합니다.`,
    historicalConstraint: '신원·국적·생년은 연결된 구조화 자료로 확인되지만 1942년 직책·정치적 입장·전시 소재는 심층조사 전까지 확정하지 않습니다.',
    expertise: [occupation, '인물 네트워크 조사', '전시 활용성 평가'],
    networks: [`${nationality} 공공 인물 기록망`, '전문 분야 연락망'],
    friction: '낮은 초기 정보도 · 실제 전시 소속과 정치적 신뢰성 검증 필요',
    appointmentEffect: appointment.effect,
    ability,
    potential,
    loyalty: 52 + ((scoreSeed >>> 4) % 36),
    influence: 42 + ((scoreSeed >>> 7) % 39),
    interest: 48 + ((scoreSeed >>> 10) % 43),
    availability: 'available',
    sourceLabel: `Wikidata ${qid} · ${name}`,
    sourceUrl: `https://www.wikidata.org/wiki/${qid}`,
  };
});
