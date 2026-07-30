# IRON DOMINION 게임 구조·역사 조사와 구현 근거

조사일: 2026-07-29

대상 빌드: 1942–2060 장기 캠페인 / 13개 플레이 국가

## 이번 보강의 목표

기존의 많은 사건을 단순히 더 쌓는 대신, 플레이어가 선택한 노선이 매주 비용과 이익을 만들고, 정해진 검토 시점에 제도·조직·외교 관계로 굳어지는 구조를 추가했다. 한 번의 선택창으로 대체역사를 선언하지 않고 다음 네 단계가 반복되게 한다.

1. 국가별 세 장기 프로그램 가운데 하나를 채택한다.
2. 4주 주기로 선택한 노선의 이익과 반작용을 함께 받는다.
3. 6·13·26주 이정표에서 집행 결과를 검증한다.
4. 장기 노선을 유지하거나 정치 비용을 내고 전환하며, 이전 노선은 역사 기록에 남긴다.

13개 국가에 개혁·집중·연대 노선을 하나씩 배치해 총 39개 국가 프로그램을 구성했다. 같은 국가로 시작해도 장교단, 경제, 외교, 공중보건, 선거, 미래 우선순위와 결합되는 경우의 수가 달라진다.

## 유사 게임에서 참고한 구조

### Football Manager: 영입이 아닌 ‘계획-관찰-검토’의 루프

Football Manager의 공식 Recruitment Revamp는 Squad Planner, Recruitment Focus, 주기적인 채용 회의를 한 흐름으로 연결한다. FM26의 공식 소개도 목표 설정, 필요한 역할, 참모 추천을 Recruitment Hub에서 함께 다루는다고 설명한다.

- 참고: [Football Manager Recruitment Revamp](https://www.footballmanager.com/features/recruitment-revamp)
- 참고: [FM26 Recruitment Revamp](https://www.footballmanager.com/fm26/features/powered-transferroom-fm26s-recruitment-revamp)
- 참고: [FM26 Reimagined User Interface](https://www.footballmanager.com/fm26/features/fm26s-reimagined-user-interface)

구현에 반영한 점:

- 국가 프로그램 카드에서 목표, 주기 효과, 상충 비용, 다음 검토 시점을 한 화면에 표시한다.
- 완료 결과를 별도 메뉴에서 찾게 하지 않고 주간 진행 결과와 역사 일지에 함께 남긴다.
- 세 후보를 동시에 비교하고 현재 채택 노선과 전환 비용을 즉시 알 수 있게 한다.

### Civilization VII: 점증하는 이정표와 위기

Civilization VII의 공식 Ages 설명은 과학·군사·문화·경제의 Legacy Path를 단계별 마일스톤으로 운영하고, 진행할수록 보상이 커지며 시대 말에는 위기가 누적된다고 설명한다.

- 참고: [Civilization VII Ages Explained](https://civilization.2k.com/it-IT/civ-vii/game-guide/gameplay/ages-explanation/)

구현에 반영한 점:

- 국가 프로그램은 6주 착수 검증, 13주 제도화, 26주 상설화의 세 단계로 진행한다.
- 최종 보상만 기다리는 구조가 아니라 각 단계에서 다른 자원과 새 사건의 기반을 얻는다.
- 집중 노선은 빠른 지휘·생산 이익과 안정도 하락을 함께 누적해 성공한 선택에도 후속 위기가 생긴다.

### Victoria 3: 장기간 살아 있는 저널

Victoria 3의 공식 개발일지는 Journal Entry와 Event가 장기간 유지되며, 플레이 상황에 따라 다른 시점에 관련 사건을 표면화하는 구조를 설명한다.

- 참고: [Victoria 3 Dev Diary #40 – Opium Wars](https://www.paradoxinteractive.com/games/victoria-3/news/dev-diary-40-opium-wars)

구현에 반영한 점:

- 국가 프로그램은 즉시 끝나는 결재가 아니라 26주 동안 살아 있는 저널이다.
- 이정표마다 선택 원인, 누적 요인, 확정 효과, 계속되는 영향, 다음 행동을 구조화해 기록한다.
- 노선을 바꿔도 이전 성과를 삭제하지 않고 종료 주차와 함께 세계선 기록에 남긴다.

### Hearts of Iron IV: 교리·장교단·보급과 국가 노선의 결합

No Step Back의 공식 설명은 대체역사 국가 중점, 장교단·Army Spirit, 보급 체계, 전차 설계를 하나의 군사 운영 구조로 묶는다.

- 참고: [Hearts of Iron IV: No Step Back](https://www.paradoxinteractive.com/games/hearts-of-iron-iv/add-ons/hearts-of-iron-iv-no-step-back)

구현에 반영한 점:

- 국가 프로그램은 별도 수집 요소가 아니라 기존 지휘 점수, 연료, 강철, 정보망, 대외 관계에 직접 작용한다.
- 집중 노선의 효율은 실제 작전 수행 자원과 연결되지만 사회적 반작용도 함께 계산한다.

## 역사 자료에서 참고한 제도 패턴

### 1942년부터 시작된 전후 사회계약

영국 의회 자료에 따르면 1942년 Beveridge Report는 전후 영국 사회정책의 청사진이 되었고, 빈곤·질병·무지·열악한 주거·실업을 포괄적으로 다루었다.

- 참고: [UK Parliament – 1942 Beveridge Report](https://www.parliament.uk/about/living-heritage/transformingsociety/livinglearning/coll-9-health1/coll-9-health/)

설계 적용: 영국·미국 등 개혁 노선은 전시 중에도 비용을 먼저 지불하고, 안정·정통성·전후 제도 보상을 늦게 받는다.

### 전쟁 중 준비된 브레턴우즈 질서

미 국무부 역사자료는 미국과 영국이 1942년부터 전후 경제 안정안을 준비했고, 1944년 44개국 회의에서 IMF와 IBRD 창설로 이어졌다고 설명한다.

- 참고: [U.S. Office of the Historian – Bretton Woods-GATT, 1941–1947](https://history.state.gov/milestones/1937-1945/bretton-woods)

설계 적용: 국제 노선은 단순 우호도 상승이 아니라 실무 채널, 공동 기구, 상호의존 질서의 세 단계로 발전한다. 국고와 정보망을 얻는 대신 다른 국가의 이해관계를 계속 관리해야 한다.

### 반둥과 비동맹의 제3 경로

유엔 자료는 1955년 반둥회의가 비동맹운동의 씨앗이 되었으며 인권, 국가 간 평등, 평화적 분쟁 해결, 국제협력을 강조했다고 정리한다.

- 참고: [United Nations – Non-Aligned Movement and Bandung](https://www.un.org/sg/en/content/former-secretary-general/statements/2011-05-25/secretary-generals-message-the-xvi-ministerial-conference-of-the-non-aligned-movement)

설계 적용: 인도·인도네시아·중국을 비롯한 아시아 플레이 국가는 미·소 진영 선택에 종속되지 않고 지역 개발금융, 반식민 연대, 전략적 자율성으로 이어지는 국제 노선을 가진다.

### 헌정 전환은 한 번의 이벤트가 아닌 법·선거·행정의 연쇄

일본 국립국회도서관 자료는 1946년 새 헌법 원칙과 국민주권·보통선거·재정 통제를 기록하며, 시행 과정에서 국회법·내각법·법원조직법·지방자치법 등 여러 제도가 함께 바뀌었다고 설명한다.

- 참고: [National Diet Library – Basic Principles for a New Japanese Constitution](https://www.ndl.go.jp/constitution/e/shiryo/04/120/120tx.html)
- 참고: [National Diet Library – Enactment of the Constitution](https://www.ndl.go.jp/constitution/e/outline/05outline.html)

설계 적용: 개혁 노선은 즉시 안정도만 받지 않는다. 첫 합의, 예산·인사 편입, 독립 기관의 상설화로 나뉘며 장기 캠페인의 선거·정부 형태·지방 제도와 결합할 여지를 남긴다.

## 구현 범위

- `src/campaign.ts`: 13개 국가 × 3개 국가 프로그램
- `src/nationalPrograms.ts`: 4주 주기 효과, 6·13·26주 이정표, 전환 기록
- `src/NationalProgramBoard.tsx`: 세 노선 비교, 진척, 다음 검토, 비용·반작용 표시
- `src/App.tsx`: 실제 주간 엔진 자원·관계·결과 일지에 프로그램 효과 연결
- `src/centuryScenario.ts`: 장기 시나리오 조합 공간을 4,320개에서 12,960개로 확장
- `src/possibilityMatrixPlaytest.ts`: 프로그램 노선을 1942–2060 결과 지표와 결말 문장에 반영
- `src/assets/national-program-era-panorama.png`: 1942년 작전실에서 전후 재건·냉전·2060년 인프라로 이어지는 신규 원본 미디어 아트

## 검증 기준

- 각 국가는 개혁·집중·연대 세 노선을 정확히 하나씩 가진다.
- 모든 프로그램은 6·13·26주 이정표를 가지며 같은 이정표 보상이 중복 지급되지 않는다.
- 국가별 2,000회, 총 26,000회에서 조합키가 중복되지 않아야 한다.
- 각 국가의 세 프로그램이 모두 표본에 포함되어야 한다.
- 장기 결과에서 프로그램 선택이 권리·안보·번영·지속가능성·다극성·정통성·불안 지표에 식별 가능한 차이를 만들어야 한다.
- 빌드, 단위 테스트, 로컬 브라우저, GitHub Pages 공개 주소를 모두 검증한다.

## 미디어 아트 원칙

신규 파노라마는 텍스트나 실제 국기·극단주의 상징을 이미지에 직접 새기지 않았다. 1940년대 장비는 전경에 두고, 전후·냉전·미래의 변화는 도시와 통신·수송·과학 인프라로 표현했다. 중앙부는 의도적으로 어둡게 구성하고 CSS에서 추가 차광을 적용해, 분위기보다 정보 가독성이 항상 앞서도록 했다.

## 최종 26,000회 결과

국가별 2,000회, 13개국 총 26,000회의 1942–2060 경력을 실행했다. 전체 실행은 5,538,000개의 역사·미래 사건 선택을 처리했다.

- 고유 정책 조합: 26,000 / 26,000
- 고유 미래 경로 지문: 26,000 / 26,000
- 미래 경로 충돌률: 0%
- 결말 분류 충돌률: 11.8%
- 생존 가능한 국가 경력: 91.4%
- 국가 평균 결과 격차: 11.7점
- 모든 국가의 국가 프로그램 선택지 수: 3
- 선택 결과 민감도 1.5점 미만인 국가·선택 축: 0

첫 실행에서는 자유 프랑스의 `worldVariant` 축이 다른 조합과 상쇄돼 장기 민감도 기준을 넘지 못했다. 세계 환경을 안보 블록화, 권리 중심 국제주의, 기술 경쟁의 세 구조로 다시 정의하고 번영·지속가능성·불안 압력까지 연결한 뒤 전체 26,000회를 다시 실행했다. 재실행에서는 모든 국가의 모든 주요 선택 축이 적어도 하나의 장기 결과에서 1.5점 이상의 차이를 만들었다.

산출물:

- `docs/national-programs-2000-2060.md`
- `docs/national-programs-2000-2060-summary.json`
- `docs/national-programs-2000-2060-nations/<nation-id>/`

## 2026-07-30 후속 보완: 장기 운영과 결과 분포

초기 26,000회 결과는 조합 고유성과 선택 민감도는 충분했지만, 26주 이후 프로그램이 같은 주기 보너스만 반복되고 영국·미국의 생존율이 사실상 확정적이며 결말 분류가 11.8% 중복되는 약점이 있었다. 이를 다음처럼 실제 엔진과 UI에 반영했다.

1. 국가 프로그램은 26주 제도화 뒤 13주 정기감사 체계로 전환된다. 개혁은 접근성 감사 비용, 강경은 동원 피로, 국제 노선은 동맹 분담 재협상을 계속 감당한다.
2. 취약국에는 고정 보너스 대신 개혁·협상·투자·연대 선택이 만드는 제도적 회복 능력을 부여했다.
3. 강국에는 공격전·수정주의·시장 집중·강경 노선이 만드는 과잉확장 위기를 추가해 성공이 자동 생존을 보장하지 않게 했다.
4. 결말 분류에 권리 정착, 발전 수준, 생태 부채, 회복국가/과잉확장국가의 제도 기억을 포함했다.
5. 13개 국가별 국가 점수 10·90분위와 생존율 허용 범위를 코드로 고정해 이후 콘텐츠 추가가 국가별 난이도를 무너뜨리면 보고서에서 P1로 표시한다.
6. 진행 결과 분석실에 세계선 코드·결말 ID·국가 프로그램·지배/차순위 역사동력·분기 횟수를 노출해, 같은 결과 화면에서 선택과 장기 결과를 연결한다.

재실행한 국가별 2,000회, 총 26,000회 결과는 고유 조합과 미래 경로 26,000개, 미래 경로 충돌 0%, 결말 충돌 1.9%, 생존 가능한 경력 89.8%, 국가 평균 결과 격차 8.8점이다. 모든 국가의 10·90분위·생존 범위와 모든 선택 축의 1.5점 민감도 기준이 통과됐다.
