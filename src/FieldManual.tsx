import { useEffect, useMemo, useRef, useState } from 'react';
import { BookMarked, Check, ChevronRight, CircleHelp, Search, X } from 'lucide-react';
import type { GameTab } from './types';
import type { OnboardingStep } from './ux';

type ManualCategory = 'all' | 'start' | 'management' | 'combat' | 'politics';

interface ManualArticle {
  id: string;
  category: Exclude<ManualCategory, 'all'>;
  title: string;
  summary: string;
  body: string;
  tip: string;
  keywords: string[];
}

interface FieldManualProps {
  steps: OnboardingStep[];
  onNavigate: (tab: GameTab) => void;
  onRestartTutorial: () => void;
  onClose: () => void;
}

const categoryOptions: Array<{ id: ManualCategory; label: string }> = [
  { id: 'all', label: '전체' },
  { id: 'start', label: '시작' },
  { id: 'management', label: '운영' },
  { id: 'combat', label: '전투' },
  { id: 'politics', label: '정치·외교' },
];

const manualArticles: ManualArticle[] = [
  { id: 'command-dashboard', category: 'start', title: '지휘 본부에서 무엇을 봐야 합니까?', summary: '지도 대신 업무함·전황 요약·조직·생산·연구 예측으로 캠페인을 파악합니다.', body: '지휘 본부는 매주 결재가 필요한 사안과 최신 보고를 한 업무함에 모읍니다. 준비도 아래 다섯 지표는 종합 점수의 근거를 보여 주며 붉은 숫자는 먼저 보완할 영역입니다. 우측 전황 카드는 지도 없이도 통제 지역·준비 사단·보급·취약 전선을 보여 줍니다. 사이드 메뉴의 숫자 배지는 부서별 미처리 업무 수이며 붉은 배지는 긴급 업무가 있다는 뜻입니다. 관리 화면은 부서별로 마지막으로 보던 스크롤 위치를 기억합니다.', tip: '첫 진입에서는 긴급 결재, 취약 전선, 미사용 공장과 연구 슬롯 순서로 확인하면 됩니다.', keywords: ['지휘 본부', '대시보드', '업무함', '포털', '요약', '예측', '배지', '준비도', '스크롤'] },
  { id: 'weekly-loop', category: 'start', title: '한 주는 어떻게 진행됩니까?', summary: '결정하고, 명령하고, 다음 주에 결과와 원인을 확인하는 기본 순환입니다.', body: '먼저 지휘 본부 업무함에서 빈 슬롯과 대기 결정을 확인합니다. 생산·연구·보급·작전 명령을 조정한 뒤 다음 주를 진행하면 모든 시스템이 함께 계산되고 새 결과 보고가 업무함에 도착합니다. 상단의 진행 결과 분석실을 열면 매주 자동 생성된 지휘 결산과 각 사건을 볼 수 있습니다. 사건을 펼치면 진행·선택, 해결 조건, 확정 결과가 한 줄로 이어지고, 실제 계산 요소·즉시 바뀐 값·다음 주까지 남는 영향·권장 후속 조치가 분리되어 표시됩니다.', tip: '결과 숫자만 보지 말고 “왜 이 결과가 나왔나”와 다음 주까지 남는 영향을 확인한 뒤 다음 결정을 내리십시오.', keywords: ['턴', '다음 주', '시간', '행동 센터', '지휘 본부', '진행 결과', '원인', '결산'] },
  { id: 'map-layers', category: 'start', title: '전략 지도와 전구', summary: '219개 작전지역과 66개 전선군을 필요한 만큼만 펼쳐 읽습니다.', body: '지도는 처음에 수도·부대·선택 지역만 강조하는 핵심 표식으로 열립니다. 지역·표식에서 전구와 지역 작전도를 바꾸고 도시를 검색하거나, 작전·전체 표식으로 정보 밀도를 높일 수 있습니다. 정치·보급·기상·정보 레이어는 1–4, 표식 밀도는 L로 전환합니다. 마우스 휠이나 +·−로 최대 600%까지 확대하면 로컬 빌드에 포함된 원본 스캔의 철도·항로·인쇄 지명을 읽을 수 있습니다. 빈 지도를 드래그해 이동하며 0으로 현재 지역의 기본 위치에 복귀합니다. 전구 정보는 I로 열고 닫으며, F 집중 모드는 상단 자원바와 좌측 메뉴를 숨겨 지도 면적을 모두 사용합니다. 점선은 실제 작전 인접 경로이고 붉은 선은 서로 다른 진영이 직접 접촉한 전선입니다. 지역을 선택하면 연결 경로가 금색으로 강조되고 하단 카드에서 보급·전략 가치·주둔 사단·적 접촉 방면을 확인합니다.', tip: '핵심 표식으로 위험 전선을 찾고, 필요한 전선에서만 작전 표식을 켠 뒤 집중 모드로 공세축을 검토하십시오.', keywords: ['지도', '전구', '아시아', '유럽', '레이어', '표식', '집중 모드', '인접', '접촉선', '보급로', '단축키', '확대', '드래그', '도시', '전선 상황판'] },
  { id: 'historical-seat', category: 'start', title: '누구의 자리를 대체합니까?', summary: '선택한 보직마다 1942년의 실존 재직자와 실제 당시 직책이 지정됩니다.', body: '캠페인을 시작하면 사용자가 해당 인물의 권한을 대체합니다. 전임자는 사라지지 않고 보직에서 밀려난 고영향력 인사로 시장에 남아 포섭·복귀·경쟁 세력 이적의 대상이 됩니다. 게임 보직은 대체역사를 위한 재구성이며 표기된 역사상 직책이 기준점입니다.', tip: '전임자는 영향력이 높지만 사용자에게 밀려났기 때문에 초기 관계와 영입 관심이 낮습니다.', keywords: ['실존 인물', '전임자', '보직', '재직자', '대체'] },
  { id: 'staff-room', category: 'management', title: '참모진과 인재 영입', summary: 'FM처럼 실제 인물의 능력·잠재력·충성도·영향력을 보고 조직을 구성합니다.', body: '후보를 정밀 조사해 평가 오차를 좁히고 관심 명단으로 경쟁 기관의 접근을 늦추십시오. 비밀 접촉은 관계와 관심을 높이고 경쟁 제안을 낮춥니다. 정보 55% 뒤 조건을 제안하며 설득 72점이 필요합니다. 영입에 성공하면 같은 부서 전임자는 다시 시장으로 이동합니다. 조직에는 작전·군수·병기·인사·정무와 별도로 과학기술·전시경제 보직이 있으며, 권한을 위임하면 각각 연구와 재정에 주간 보너스를 줍니다.', tip: '합의율은 관심·관계·평판·관심 명단에서 오르고, 경쟁 제안과 적대·야권 상태에서 내려갑니다.', keywords: ['참모', '스카우트', '영입', '관심 명단', '포섭', '비밀 접촉', '경쟁 제안', '승급', '과학기술', '전시경제'] },
  { id: 'historical-experts', category: 'management', title: '과학자·경제학자는 어떻게 모델링됩니까?', summary: '1942년 직책·활동 지역·전문 분야·인맥·제약을 갖춘 실존 민간 전문가입니다.', body: '인재 시장에서 군사·과학·공학·의학·경제·산업·정보·외교·사회과학 분야를 검색할 수 있습니다. 조사 전에는 능력과 임명 효과 일부가 가려지고, 정보가 쌓이면 실제 전시 활동과 정치적·윤리적 제약, 협업 인맥, 기관 간 마찰이 공개됩니다. 각 카드의 사료 링크는 직책과 활동 근거를 확인하는 출발점입니다. 능력·충성도·관심도는 역사적 인물의 가치를 평가하는 사실이 아니라 게임 균형을 위한 수치입니다.', tip: '유명한 인물이 항상 최선은 아닙니다. 현재 전구의 필요, 소속기관 손실, 정권 노선과의 마찰, 영입 비용을 함께 비교하십시오.', keywords: ['아인슈타인', '튜링', '과학자', '경제학자', '의학', '공학', '사료', '역사적 제약', '인맥', '전문가'] },
  { id: 'later-era-figures', category: 'management', title: '호킹·가가린·마틴 루터 킹 같은 후대 인물은 언제 등장합니까?', summary: '캠페인 연도와 세계선 발전 범위에 따라 전후·냉전·20세기 후반·현대 인물 세대가 열립니다.', body: '13개 플레이 권역마다 1925~1984년생 실존 인물 40명씩, 총 520명의 후대 인물 풀이 있습니다. 인물은 어떤 세계선에서도 만 18세 이전에는 등장하지 않습니다. 이후 실제 출생연도와 공개 직업을 기준으로 만든 세대 개화 연도에 도달하면 인재 시장에 나타납니다. 세계 위기를 많이 해결해 제도·기술의 역사 범위가 앞서간 세계선에서는 성인이 된 인물을 통상 기준보다 일찍 발탁할 수 있습니다. 인재 시장의 “후대 인물” 필터와 파란 검증 띠가 이를 표시하며, 신원·출생·국적·공개 직업은 사료 정보, 접촉 경로·능력·충성·임명 효과는 대체역사 게임 수치로 분리됩니다.', tip: '조기 등장 표시는 시간여행이 아닙니다. 이미 성인이 된 실제 인물을 더 빨리 발견한 세계선이며, 출생 전·미성년 등장 규칙은 항상 차단됩니다.', keywords: ['후대 인물', '전후', '냉전', '호킹', '가가린', '마틴 루터 킹', '봉준호', '세대', '조기 발탁', '실존 인물'] },
  { id: 'intelligence-lineages', category: 'management', title: 'CIA와 비밀조직은 언제 등장합니까?', summary: '40개 실제 기관의 창설·승계·해체와 43명의 실존 인물이 세계선 연도에 맞춰 등장합니다.', body: '정보 화면과 대체지구 아틀라스에서 COI·OSS·SSU·CIG·CIA처럼 전신과 후신을 잇는 기관 계보를 확인할 수 있습니다. 전쟁기 암호기관, SOE·BCRA·광복군–OSS·필리핀 게릴라망, 전후 NSA·KGB·BND·DGSE·R&AW 같은 조직은 실제 창설 연도를 기준으로 하되 역사형·제도형·급진형 선택이 이름과 등장 시점, 장기 효과를 바꿉니다. 인물은 해당 기관이 활동 중이고 본인의 경력 시작 연도에 도달했을 때 인재시장에 나타납니다. 가해자로 분류된 인물은 영입되지 않으며 정치경찰·국가폭력 기관은 별도 위험 카드로 표시됩니다.', tip: '새 인물이 등장하면 바로 계약하지 말고 스카우트로 이중공작 가능성, 충성, 기존 기관과의 마찰을 확인하십시오. 후계기관을 급진적으로 강화하면 정보망은 빨리 커지지만 안정도와 권리 지표가 흔들릴 수 있습니다.', keywords: ['CIA', 'OSS', 'MI6', 'SOE', 'KGB', 'NSA', 'BND', 'DGSE', '모사드', '광복군', '레지스탕스', '비밀조직', '이중간첩', '정보기관'] },
  { id: 'war-finance', category: 'management', title: '재정은 어디서 벌고 어떻게 당깁니까?', summary: '세입·차입·지출을 분리하고 주간 수지와 한 달 예상을 동시에 확인합니다.', body: '전시 재무성의 경상세입은 소득세·급여 원천징수, 기업세·초과이윤세, 관세·무역결제, 경제고문 징세보정, 산업지분 배당으로 구성됩니다. 국민 저축채권·금융기관 국채·중앙은행 직접인수는 현금을 만들지만 수입이 아니라 부채입니다. 매주 원금이 국가부채에 더해지고 이자·물가·공공신뢰에 영향을 줍니다. 군수공장 운영비, 참모급여, 국채이자, 가격통제 행정비를 빼면 주간 순증감이 나오며 한 달 예상은 평균 4.345주를 곱해 표시합니다. 기업시장의 가격은 실제 일별 주가를 복원한 값이 아니라 1942년을 100으로 둔 대체역사 산업지수입니다. 전황·공장·해상통제·물가·신뢰·월간 기업사건이 지수를 움직이며 배당과 매각손익이 국고에 귀속됩니다.', tip: '흑자라도 국채 조달을 빼면 경상적자일 수 있습니다. 투자 전에 실질 경상수지, 다음 주 차입, 부채와 물가를 먼저 비교하십시오.', keywords: ['재정', '세금', '소득세', '기업세', '국채', '전쟁채권', '중앙은행', '부채', '이자', '인플레이션', '주식', '기업', '배당', '월간', '전시 재무성'] },
  { id: 'currency-exchange', category: 'management', title: '국가 화폐와 환전은 어떻게 작동합니까?', summary: '현재 국가·연도의 법정통화로 국고를 읽고 외환보유고와 태환 승인을 관리합니다.', body: '상단 국고와 모든 주요 계약비용은 국가별 법정통화의 억·조 단위로 표시되고, 재무성에서는 백만 단위의 정확한 명목액도 함께 볼 수 있습니다. 역사 자동전환을 유지하면 독일의 1948년 도이체마르크, 한국의 1953년 환과 1962년 원 같은 화폐개혁 연도에 명칭·기호·발권체계가 바뀝니다. 통화·외환 목록의 교차환율은 1942년 역사 앵커에서 출발해 국내 물가와 공공신뢰로 움직입니다. 외화를 매수하면 국고가 줄고 해당 통화가 외환보유고에 쌓이며, 매도하면 승인비용을 뺀 금액이 국고로 돌아옵니다. 상대 통화의 전시통제, 교전·제재 관계, 외교관계, 자국 통화의 신뢰가 나쁘면 상대 중앙은행이 거래를 거부합니다. 새 화폐 발행에서 이름·기호·발행 원칙을 정하면 역사 자동전환이 중지되며 언제든 해당 연도의 역사 통화로 복귀할 수 있습니다.', tip: '적성국 통화보다 우호국의 개방통화를 먼저 확보하고, 신 통화를 발행하기 전에는 물가와 공공신뢰를 안정시키십시오.', keywords: ['화폐', '통화', '환율', '환전', '외환', '외환보유고', '중앙은행', '태환', '거래 거부', '화폐개혁', '새 화폐', '이름', '원', '환', '도이체마르크'] },
  { id: 'industrial-investment', category: 'management', title: '산업 투자는 어떻게 읽고 매매합니까?', summary: '현금·주간 등락·위험·배당·내 손익을 비교한 뒤 정해진 금액으로 매수합니다.', body: '산업 투자 화면의 첫 네 칸은 투자 가능 현금, 원금, 아직 팔지 않은 손익, 이번 주 예상 배당을 보여 줍니다. 기업 목록에서는 산업지수의 이번 주 등락, 3단계 위험도, 현재 통화 정액 기준 예상 연 배당, 현재 보유가치와 손익을 같은 줄에서 비교할 수 있습니다. 세 개의 정액 매수 버튼은 국고와 기업별 한도가 충분할 때만 활성화됩니다. 보유 기업은 항상 목록 위에 오며 절반 또는 전량을 매각할 수 있습니다. 매각대금에는 2% 시장비용이 적용됩니다. 역사적 배경과 구체적인 손실 위험은 각 줄의 상세 보기를 펼치면 확인할 수 있습니다.', tip: '가격이 올랐다는 이유만으로 추격 매수하지 말고, 국고·위험도·배당·현재 산업 노출을 먼저 비교하십시오.', keywords: ['산업 투자', '주식', '매수', '매도', '배당', '보유가치', '손익', '위험', '산업지수', '포트폴리오'] },
  { id: 'industry-research', category: 'management', title: '생산과 연구의 기회비용', summary: '사용하지 않은 공장과 연구 슬롯은 다음 주로 이월되지 않습니다.', body: '공장 배정은 즉시 주간 생산량과 생산 효율 성장에 영향을 줍니다. 연구는 동시에 두 과제만 진행되므로 당장 필요한 전선 보너스와 장기 기술을 조합하십시오.', tip: '조달 포커스와 실제 생산 라인을 같은 장비에 맞추면 성장 속도가 빨라집니다.', keywords: ['공장', '생산', '연구', '장비', '조달'] },
  { id: 'equipment-evolution', category: 'management', title: '1942 장비에서 열린 미래까지', summary: '국가별 실장비를 출발점으로 연구·시제품·양산·사단 배치를 연결합니다.', body: '연구 화면의 통합 장비 개발국은 보병·포병·기갑·항공·해군·군수·감시·전략의 8개 계보를 제공합니다. 실물·문서 고증, 역사 발전 계보, 가상 실험 기술 표기를 구분해 보십시오. 계보를 연구한 뒤 최대 6개 모듈로 시제품을 만들고 제식 채택하면 생산 효율이 일시 하락하는 대신 성능과 생산량이 바뀝니다. 사단에 배치된 장비의 화력·방호·신뢰성·생산성은 실제 전력·조직·보급과 전투 계산에 반영됩니다.', tip: '최고 성능만 고르면 신뢰성과 생산성이 무너집니다. 장기전에서는 값싸고 정비하기 쉬운 장비가 더 강할 수 있습니다.', keywords: ['장비 계보', '시제품', '모듈', '양산', '제식', '고증', '미래 무기', '신뢰성'] },
  { id: 'supply', category: 'management', title: '보급과 회복', summary: '전투력보다 보급이 먼저 무너지면 강한 사단도 공세를 유지하지 못합니다.', body: '전선 우선·균형·예비대 보급 정책은 회복과 비축 속도를 바꿉니다. 핵심 편제와 조달 포커스를 지정해 중요한 사단에 장비가 먼저 도착하도록 만드십시오.', tip: '재편 중인 사단이 많다면 공격보다 보급 정책과 핵심 편제를 먼저 조정하십시오.', keywords: ['보급', '회복', '재편', '핵심 편제'] },
  { id: 'public-health', category: 'management', title: '감염병과 보건 위기는 어떻게 지휘합니까?', summary: '전쟁 압력과 보급이 발병 확률을 바꾸고, 대비·격리·의료·연구가 유행의 결과를 바꿉니다.', body: '상단 보건 감시 칩은 현재 다음 주 발병 확률이나 진행 중인 위기 코드를 표시합니다. 보건 위기 화면에서 사전 대비·감시·의료 수용력·공공 신뢰를 확인하고 영구 역량 사업을 승인하십시오. 확률 증감 근거는 전쟁·보급·장기전 위험과 대비·감시 보호 효과를 퍼센트포인트로 분해합니다. 유행이 포착되면 게임이 자동 일시 정지하며, 집단감염·지역 유행·대유행·회복 단계와 주간 사례, 유효 재생산지수 R, 병상 부하를 함께 봐야 합니다. 대응 태세별 다음 주 전망은 동일한 조건으로 예상 R·감염·사망·병상·비용을 비교하고 현재 병목에 맞는 참모 권고를 표시합니다. 추적·격리는 전파와 사회 비용을 절충하고, 의료 총동원은 사망과 병상 과부하에 강하며, 비상 억제령은 전파를 크게 낮추는 대신 재정·정치·보급 부담이 큽니다. SARS형과 COVID형은 후대의 실제 대응 사례를 역학적 기반으로 삼은 1940년대 가상 병원체이며 화면에서 대체역사로 구분됩니다.', tip: '권고를 그대로 따르기보다 예상 R·사망 감소와 주간 자원 비용을 함께 비교하십시오.', keywords: ['보건', '감염병', '코로나', 'COVID', 'SARS', '발진티푸스', '콜레라', '격리', '병상', '팬데믹', '발병 확률', 'R', '전망', '권고'] },
  { id: 'battle-flow', category: 'combat', title: '작전 계획실과 4단계 전투', summary: '승인 전에 태세별 승산과 손실을 비교하고, 정찰부터 돌파까지 결과를 이어갑니다.', body: '지도에서 공세 목표를 고르면 작전 계획실이 81개 전장 변수 조합으로 목표 확보 확률, 정보 신뢰 범위, 전력·조직력·보급 손실을 예측합니다. 선택한 신중·균형·총력 태세는 해당 명령에 고정되며, 실제 전투에서는 정찰 우세가 접근과 주력 교전의 모멘텀으로 이어집니다.', tip: '확률 하나만 보지 말고 정보 신뢰 범위와 공세 뒤 남을 조직력·보급을 함께 비교하십시오.', keywords: ['전투', '정찰', '공세', '태세', '돌파', '확률', '예측', '계획실'] },
  { id: 'commanders', category: 'combat', title: '지휘관 성장과 피로', summary: '전투 경험은 자동 능력치가 아니라 선택 가능한 지휘 특기로 전환됩니다.', body: '지휘관은 전투 경험으로 복무 레벨과 특기 점수를 얻습니다. 특기는 운용 방향을 영구적으로 정하며, 피로가 높으면 실제 전투 효율이 떨어집니다.', tip: '중요 공세 전에 지휘관 피로와 미사용 특기 점수를 함께 확인하십시오.', keywords: ['지휘관', '장군', '특기', '피로', '휴양'] },
  { id: 'alternate-history', category: 'politics', title: '대체역사는 어떻게 만들어집니까?', summary: '미래를 프롬프트로 작성하지 않고 실제 플레이 행동이 역사적 압력으로 누적됩니다.', body: '지휘 본부의 살아있는 역사 흐름은 군사, 산업·과학, 외교·연합, 시민·제도, 독립·자결, 정보·공작의 여섯 압력을 보여줍니다. 취임 지휘 철학에서 시작해 국가 원칙, 내각 의제, 부대 명령, 연구, 외교 협상, 첩보작전과 전후 예산이 해당 압력을 올립니다. 장기 사건은 캠페인 달력과 역사적 조건에 도달하면 실제 플레이 화면에서 선택하며, 그 결과는 확정 분기로 저장됩니다. 아직 오지 않은 사건은 누적 압력과 현재 세계지표를 바탕으로 가장 가능성 높은 경로만 전망하며 아틀라스에서 임의로 고르거나 재추첨할 수 없습니다.', tip: '원하는 방향이 있다면 결말을 먼저 고르지 말고 같은 성격의 정책·인사·작전·예산을 여러 주에 걸쳐 일관되게 실행하십시오. 반대 방향의 행동을 쌓으면 기존 흐름도 뒤집을 수 있습니다.', keywords: ['대체역사', '역사 흐름', '행동', '선택', '인과관계', '군사', '산업', '외교', '시민', '독립', '첩보', '세계선'] },
  { id: 'historical-endings', category: 'politics', title: '수많은 결말은 어떻게 결정됩니까?', summary: '세계질서·경제 결산·미래 경로의 조합을 실제 플레이 결과로 판정합니다.', body: '최종 결말은 미리 고르는 한 줄 문구가 아닙니다. 억지력·다극성·탈식민화·권리·번영·불안정 지표와 실제로 해결한 세계 위기, 국가 원칙, 전쟁 성과, 안정도, 산업, 정보망, 외교, 연구와 전후 국정의 누적 결과를 함께 채점합니다. 아틀라스의 FINAL OUTCOME MATRIX에서 현재 적합도, 세 가지 판정 이유, 실제 역사 자료, 장기 유산, 남은 위험과 가까운 대안 결말을 확인할 수 있습니다. 결말 도감의 다른 결과는 선택 버튼이 아니라 어떤 제도적 차이가 필요한지 비교하는 참고 자료입니다.', tip: '사건 하나를 아틀라스에서 바꾸는 방식은 없습니다. 실제 캠페인에서 같은 방향의 외교·경제·사회·과학 선택을 쌓아야 결말이 이동합니다.', keywords: ['결말', '엔딩', '최종 보고서', '세계질서', '경제', '미래', '적합도', '판정', '사료', '아틀라스', '도감', '인과관계'] },
  { id: 'resistance-career', category: 'politics', title: '첩보원·레지스탕스 커리어는 무엇이 다릅니까?', summary: '국가를 직접 지배하지 않고 점령지 정보망·포섭·침투로 독립 조건을 만듭니다.', body: '모든 진영에는 정보기관 책임자와 현장요원 보직이 있고, 한국·베트민·인도네시아·필리핀에는 점령지·망명정부 사정에 맞춘 레지스탕스 보직과 국가별 작전망이 있습니다. 현장요원은 초기 권한이 낮은 대신 정보망과 정치력 보너스를 받고 작전 비용이 낮습니다. 보직 카드의 활동 위장은 역사상 실제 인물의 직책과 구분되는 게임용 공작 설정입니다.', tip: '현장요원은 정면전보다 정보 작전, 인물 포섭, 외교 승인과 본토 거점 확보를 먼저 진행하십시오.', keywords: ['스파이', '첩보원', '레지스탕스', '한국', '조선', '식민지', '잠복', '정보 작전'] },
];

export function FieldManual({ steps, onNavigate, onRestartTutorial, onClose }: FieldManualProps) {
  const [category, setCategory] = useState<ManualCategory>('all');
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const completedCount = steps.filter((step) => step.complete).length;
  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('ko-KR');
    return manualArticles.filter((article) => {
      const categoryMatches = category === 'all' || article.category === category;
      const queryMatches = !normalizedQuery || [article.title, article.summary, article.body, ...article.keywords].join(' ').toLocaleLowerCase('ko-KR').includes(normalizedQuery);
      return categoryMatches && queryMatches;
    });
  }, [category, query]);

  useEffect(() => {
    searchRef.current?.focus();
  }, []);

  return (
    <div className="ux-backdrop field-manual-backdrop" onClick={onClose}>
      <section className="field-manual" role="dialog" aria-modal="true" aria-labelledby="field-manual-title" onClick={(event) => event.stopPropagation()}>
        <header>
          <div className="field-manual-mark"><CircleHelp size={22} /></div>
          <div><span>FIELD MANUAL · LIVE CAMPAIGN GUIDE</span><h2 id="field-manual-title">야전 교범</h2><small>현재 캠페인 진행 상황과 게임 시스템 설명을 한곳에서 확인합니다.</small></div>
          <button onClick={onClose} aria-label="야전 교범 닫기"><X size={18} /></button>
        </header>

        <div className="field-manual-body">
          <aside className="first-week-guide">
            <div className="manual-section-heading"><span>FIRST WEEK</span><strong>첫 주 지휘 체크리스트</strong><small>{completedCount}/{steps.length} 완료</small></div>
            <div className="first-week-progress" aria-label={`첫 주 체크리스트 ${completedCount}/${steps.length} 완료`}><i style={{ width: `${completedCount / Math.max(1, steps.length) * 100}%` }} /></div>
            <p>아래 다섯 항목을 마치면 생산·연구·정책·전투의 기본 순환이 완성됩니다.</p>
            <div className="first-week-steps">
              {steps.map((step, index) => (
                <button key={step.id} className={step.complete ? 'complete' : ''} aria-label={`${step.title} · ${step.complete ? '완료' : '미완료'} · ${step.detail}`} onClick={() => onNavigate(step.tab)}>
                  <i>{step.complete ? <Check size={14} /> : index + 1}</i>
                  <span><strong>{step.title}</strong><small>{step.detail}</small></span>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </aside>

          <main className="manual-library">
            <label className="manual-search"><Search size={16} /><input ref={searchRef} type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="전투, 보급, 영입, 대체역사 검색" aria-label="야전 교범 검색" />{query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기"><X size={14} /></button>}</label>
            <div className="manual-categories" role="group" aria-label="교범 분류">
              {categoryOptions.map((option) => <button key={option.id} className={category === option.id ? 'active' : ''} aria-pressed={category === option.id} onClick={() => setCategory(option.id)}>{option.label}</button>)}
            </div>
            <div className="manual-results" aria-live="polite">
              {results.length > 0 ? results.map((article) => (
                <details key={article.id}>
                  <summary><BookMarked size={16} /><span><strong>{article.title}</strong><small>{article.summary}</small></span><ChevronRight size={15} /></summary>
                  <div><p>{article.body}</p><em>현장 조언 · {article.tip}</em></div>
                </details>
              )) : <div className="manual-empty"><Search size={27} /><strong>일치하는 교범 항목이 없습니다.</strong><span>검색어를 줄이거나 다른 분류를 선택하십시오.</span></div>}
            </div>
          </main>
        </div>

        <footer><button onClick={onRestartTutorial}><CircleHelp size={14} /> 첫 지휘 튜토리얼 다시 보기</button><span><kbd>?</kbd> 교범 열기</span><span><kbd>Ctrl K</kbd> 빠른 이동</span><span><kbd>Esc</kbd> 닫기</span></footer>
      </section>
    </div>
  );
}
