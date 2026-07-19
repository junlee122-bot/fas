import type { WorldHistoryEvent, WorldHistoryVariant, WorldMetric } from './worldHistory';

type Citation = readonly [label: string, url: string];
type IntelligencePattern = 'wartime' | 'continuity' | 'alliance' | 'centralization' | 'security-state' | 'oversight' | 'digital';

const sources = {
  oss: ['미국 국립문서기록관리청 · OSS 기록과 연혁', 'https://www.archives.gov/research/military/ww2/oss'] as Citation,
  cia: ['미국 국립문서기록관리청 · CIA와 선행기관', 'https://www.archives.gov/research/intelligence/cia'] as Citation,
  ukusa: ['GCHQ · UKUSA 협정의 역사', 'https://www.gchq.gov.uk/information/brief-history-of-ukusa'] as Citation,
  mi5: ['MI5 · 제2차 세계대전과 Double Cross', 'https://www.mi5.gov.uk/history/world-war-ii'] as Citation,
  bnd: ['독일 연방문서보관소 · 게엘렌 조직과 BND', 'https://www.bundesarchiv.de/themen-entdecken/online-entdecken/podcast/der-fruehe-bundesnachrichtendienst-und-die-ddr/'] as Citation,
  stasi: ['독일 연방문서보관소 · 동서독 정보전', 'https://www.bundesarchiv.de/assets/bundesarchiv/de/Bildungsmaterialien/Themenmappe_4_einseitig_BArch_BA.pdf'] as Citation,
  nsa: ['NSA · 암호기관 중앙화 연표', 'https://www.nsa.gov/History/Cryptologic-History/Historical-Events/Historical-Events-List/'] as Citation,
  mossad: ['모사드 · 기관 창설사', 'https://mossad.gov.il/en/history'] as Citation,
  dgse: ['DGSE · BCRA에서 DGSE까지', 'https://www.dgse.gouv.fr/fr/nous-connaitre/notre-heritage'] as Citation,
  china: ['중국 국방부 · 군통·중통과 정보조직사', 'https://www.mod.gov.cn/gfbw/gfjy_index/4806820.html'] as Citation,
  korea: ['국사편찬위원회 · 한국광복군과 OSS 독수리작전', 'https://db.history.go.kr/item/level.do?levelId=ij_013_%241exp'] as Citation,
  church: ['미국 상원 · Church Committee 기록', 'https://www.senate.gov/about/powers-procedures/investigations/church-committee.htm'] as Citation,
  digital: ['미국 국가정보국 · 정보공동체 역사', 'https://www.dni.gov/index.php/who-we-are/history'] as Citation,
} as const;

const deltas: Record<IntelligencePattern, [Partial<Record<WorldMetric, number>>, Partial<Record<WorldMetric, number>>, Partial<Record<WorldMetric, number>>]> = {
  wartime: [{ deterrence: 4, instability: 3 }, { multipolarity: 4, rights: 2, instability: -2 }, { deterrence: 6, rights: -5, instability: 8 }],
  continuity: [{ deterrence: 5, rights: -2 }, { multipolarity: 4, rights: 5, instability: -3 }, { deterrence: 7, rights: -7, instability: 7 }],
  alliance: [{ deterrence: 6, multipolarity: -3 }, { multipolarity: 6, prosperity: 3, instability: -4 }, { deterrence: 8, rights: -5, instability: 6 }],
  centralization: [{ deterrence: 7, prosperity: 2 }, { rights: 5, multipolarity: 3, instability: -3 }, { deterrence: 9, rights: -8, instability: 9 }],
  'security-state': [{ deterrence: 6, rights: -6, instability: 4 }, { rights: 6, multipolarity: 4, instability: -3 }, { deterrence: 8, rights: -12, instability: 11 }],
  oversight: [{ rights: 8, deterrence: -2, instability: -3 }, { rights: 11, multipolarity: 4, instability: -5 }, { deterrence: 6, rights: -9, instability: 8 }],
  digital: [{ prosperity: 5, deterrence: 6, rights: -4 }, { prosperity: 6, rights: 7, multipolarity: 4, instability: -3 }, { deterrence: 9, rights: -11, instability: 10 }],
};

function v(id: string, title: string, summary: string, consequence: string, metricDelta: Partial<Record<WorldMetric, number>>): WorldHistoryVariant {
  return { id, title, summary, consequence, metricDelta };
}

function intelligenceEvent(
  id: string,
  title: string,
  historicalYear: number,
  era: WorldHistoryEvent['era'],
  historicalBasis: string,
  citation: Citation,
  pattern: IntelligencePattern,
  outcomes: [string, string, string],
): WorldHistoryEvent {
  const [historical, institutional, transformative] = outcomes;
  return {
    id,
    title,
    historicalYear,
    era,
    category: 'intelligence',
    historicalBasis,
    sourceLabel: citation[0],
    sourceUrl: citation[1],
    variants: [
      v('historical', historical, '실제 역사에 가까운 국가별 정보기관과 작전권한을 유지합니다.', `${historical}의 성과와 권한 남용 위험이 다음 정보체계에 계승됩니다.`, deltas[pattern][0]),
      v('institutional', institutional, '의회·사법·동맹 공동감독과 정보 공유 규칙을 창설 단계부터 제도화합니다.', `${institutional}이 기관 경쟁과 비밀권력의 자의성을 줄이지만 대응 속도는 느려집니다.`, deltas[pattern][1]),
      v('transformative', transformative, '정보기관이 정규군·정당·기업망을 넘나드는 독립 권력으로 팽창합니다.', `${transformative}이 단기 침투력과 장기 정치불안을 함께 키웁니다.`, deltas[pattern][2]),
    ],
  };
}

export const intelligenceWorldHistoryEvents: WorldHistoryEvent[] = [
  intelligenceEvent('wartime-secret-war', '총력전의 비밀전 조직화', 1942, 'war-end', 'COI가 OSS로 전환되고 SOE·SIS·MI5·GC&CS, BCRA, NKVD, 아브베어와 각국 저항망이 첩보·파괴·기만전을 제도화했다.', sources.oss, 'wartime', ['OSS·SOE식 통합 비밀전', '연합국 공동특수작전위원회', '무제한 정치전 총국']),
  intelligenceEvent('secret-service-demobilization', '전시 비밀기관의 해체와 승계', 1945, 'reconstruction', 'OSS 해체 뒤 기록·요원·해외거점은 국무부와 SSU로 나뉘었고, 여러 국가에서 저항조직과 전시기관의 후계권 경쟁이 벌어졌다.', sources.cia, 'continuity', ['전시기관 해체와 선별 승계', '의회 인가형 평시 정보처', '비밀전 인력의 독립 네트워크화']),
  intelligenceEvent('ukusa-signals-order', 'UKUSA 신호정보 동맹', 1946, 'reconstruction', '1946년 UKUSA 협정은 영미 암호·통신정보 협력을 제도화했고 이후 캐나다·호주·뉴질랜드가 참여했다.', sources.ukusa, 'alliance', ['영미 중심 UKUSA 체제', '다자 암호정보 공동체', '경쟁 감청권과 암호블록']),
  intelligenceEvent('cia-national-security-act', 'CIA와 국가안보체제의 창설', 1947, 'early-rivalry', '미국 국가안보법은 CIG를 CIA로 전환하고 국가 수준의 정보 조정·평가 체계를 만들었다.', sources.cia, 'centralization', ['CIA 중심 정보조정', '의회감독 국가정보위원회', '초국경 비밀행동청']),
  intelligenceEvent('postcolonial-intelligence-services', '독립국가 정보기관의 창설', 1949, 'early-rivalry', '신생국들은 식민지 경찰·지하운동·군 정보망을 재편해 모사드·NICA와 각국 국내외 정보기관을 세웠다.', sources.mossad, 'continuity', ['국가별 독립 정보기관', '지역 공동정보평의회', '혁명·반혁명 초국경 공작망']),
  intelligenceEvent('stasi-security-ministry', '동독 국가보안부와 정보경찰국가', 1950, 'early-rivalry', '동독 국가보안부는 1950년 창설되어 국내감시와 해외정보를 당·국가 안보체계에 결합했다.', sources.stasi, 'security-state', ['국가보안부 중심 체제', '동서독 상호 방첩협약', '전사회 감시국가']),
  intelligenceEvent('nsa-cryptologic-centralization', 'NSA와 암호정보 중앙화', 1952, 'high-rivalry', '미국은 분산된 군 암호기관을 AFSA로 묶은 뒤 1952년 NSA를 창설해 신호정보와 통신보안을 중앙화했다.', sources.nsa, 'centralization', ['NSA식 국가 암호기관', '국제 암호공공국', '전지구 자동감청망']),
  intelligenceEvent('kgb-state-security-reform', 'KGB와 소련 국가보안 재편', 1954, 'high-rivalry', '스탈린 사후 소련의 국가보안기구는 1954년 국가보안위원회 체계로 재편되어 해외정보·방첩·국경보안을 결합했다.', sources.stasi, 'security-state', ['KGB 위원회 체제', '사회주의권 공동감독 보안청', '당 초월 국가보안제국']),
  intelligenceEvent('gehlen-bnd-foundation', '게엘렌 조직에서 BND로', 1956, 'high-rivalry', '미국 지원 아래 1946년 출범한 게엘렌 조직은 1956년 서독 연방정보부가 되었으나 나치 경력자 승계와 침투 문제가 남았다.', sources.bnd, 'continuity', ['BND 창설과 인력 승계', '탈나치 검증형 연방정보원', '민간 준군사 반공망']),
  intelligenceEvent('asian-intelligence-state', '아시아 냉전 정보국가의 성장', 1961, 'high-rivalry', '분단·탈식민화·내전 속에서 동아시아와 남아시아의 정보기관은 정권안보·대외공작·게릴라전을 함께 담당했다.', sources.korea, 'security-state', ['국가별 중앙정보부', '비동맹 공동정보기구', '군정·정당 비밀권력']),
  intelligenceEvent('intelligence-oversight-crisis', '비밀공작 폭로와 민주적 감독', 1975, 'detente', '미국 상원 Church Committee 등은 암살계획·국내감시·권한 남용을 조사하며 정보기관 감독의 기준을 만들었다.', sources.church, 'oversight', ['의회 정보위원회와 제한적 개혁', '국제 비밀공작 감독협약', '감독 거부와 심층국가 반격']),
  intelligenceEvent('sdece-dgse-reform', '전시 저항정보에서 현대 해외정보로', 1982, 'transformation', '자유프랑스 BCRA의 계보는 DGER·SDECE를 거쳐 1982년 DGSE로 개편되며 임무와 지휘체계를 재정의했다.', sources.dgse, 'continuity', ['DGSE식 해외정보 개편', '유럽 공동외부정보국', '비공식 저항망의 상설화']),
  intelligenceEvent('digital-surveillance-order', '대량감청 폭로와 디지털 정보질서', 2013, 'connected-world', '인터넷·위성·대규모 데이터 분석은 정보역량을 바꿨고, 대량감청 폭로는 안보·사생활·동맹 신뢰 논쟁을 세계화했다.', sources.digital, 'digital', ['법률 아래 국가 디지털정보', '검증 가능한 국제 디지털감독', 'AI 대량감시 블록']),
];
