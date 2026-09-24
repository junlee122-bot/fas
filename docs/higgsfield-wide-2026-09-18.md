# Higgsfield 광범위 삽화 적용 — 2026-09-18

## 결과

새 삽화 **24종**을 Higgsfield로 생성해 **24개 화면 컴포넌트**의 문맥에 연결했다. 이전 3종 지휘실 및 6종 미디어·현장 삽화를 대체하지 않고 확장했다. 원래 데스크톱 UI, 게임 엔진, 저장 형식, 권한 판정, 명령·승인 흐름은 유지했다. 이번 작업은 로컬 반영이며 커밋·배포하지 않았다.

## 제작과 품질

- Higgsfield GPT Image 2.5, flare / high / 2k / 3:2 요청.
- 실제 출력 24종 모두 **2048×1360**. 확대·축소·잘라내기 없이 PNG 원본 보존.
- 게임용 WebP는 lossless 변환. 24개 모두 원본과 RGBA 픽셀 일치 검사 통과.
- 원본 합계 102,222,819 bytes, 런타임 WebP 합계 69,672,034 bytes. 파일당 3MB에 맞추기 위한 화질 저하는 하지 않았다.
- 크레딧 **208 → 136**, 실제 사용 **72**. 플랜 변경·추가 결제 없음.
- 10번 요청은 최초 제출 시 429로 job이 발급되지 않아 해당 요청만 재시도했다. 이미 접수된 작업은 중복 생성하지 않았다.
- 24개 결과 모두 직접 시각 검토했고, 정확히 해당 24개 job을 한 번의 갤러리로 표시했다.
- 읽을 수 있는 UI 문구·버튼은 HTML로 유지한다. 삽화는 역사적 증거, 실제 사건 사진, 인물 초상 또는 현재 도시 상태가 아니다.

프롬프트: [제작 명세](../design/higgsfield-wide-production.json)
job ID·SHA-256·해상도·파일 크기: [생성 기록](../design/higgsfield-wide-generation.json)

## 적용 위치

| 삽화 | 연결 |
|---|---|
| 참모 회의 | 참모 스쿼드, 면담·회의 |
| 인재 조사 기록 | 후보 시장, 국제 경력 제안·기회 |
| 외교 회의실 | 외교 지휘실 |
| 영토 행정 문서 | 거점 귀속 조약, 정부·행정 |
| 재정 장부 | 재무성 요약·정책·외환 |
| 시장과 기업 | 재무성 기업 투자 |
| 연구 작업대 | 국가 연구 상세, 장비 개발국 연구 |
| 장비 정비 도구 | 장비 개발국 |
| 생산 창고 | 생산선 상세 |
| 야전 지휘 도구 | 합동작전 |
| 항해 준비 | 해군 전력 관리 |
| 비행 준비 | 공군 전력 관리 |
| 헌정 회의장 | 헌법과 임명, 주권 권한 |
| 사법 기록실 | 사법 사건 |
| 투표소 | 선거 상황실 |
| 민간인의 작업대 | 민간인 커리어, 개인 생활 |
| 비밀 연락 | 정보국, 비밀 커리어의 담당관 데스크 |
| 왕실 의전 | 왕정일 때 왕조 관리 |
| 공동 계획 | 사회주의 세계 보드 |
| 독립운동 기록 | 한국 독립운동 시작 안내 |
| 공공 기반 모형 | 국정 데스크, 국가 발전 전략 |
| 구호 준비 | 보건 위기 |
| 후기 산업시대 업무실 | 1960–1999년 지휘 데스크 |
| 디지털 업무실 | 2000–2060년 지휘 데스크 |

24개 컴포넌트: OrganizationPanel, StaffMeetingRoom, CareerMarketCenter, IntelligenceDesk, ClandestineCareerCenter, EconomicMinistry, ResearchDesk, EquipmentLab, ProductionDesk, DiplomacyDesk, TerritorialTreatyBoard, PoliticalSettlementBoard, NationDesk, ConstitutionalJudiciaryBoard, JusticeDocketBoard, SovereignPowersBoard, ElectionSituationRoom, CivilianCareerPanel, SocialistWorldBoard, KoreaCampaignBrief, NationManagementPanel, JointOperationsBoard, PublicHealthCenter, CommandDesk.

## 표시 원칙과 안전장치

- GameIllustration과 카탈로그는 순수 표시 계층이다. 새 상태, effect, RNG, 저장 필드, 보상 또는 액션 콜백이 없다.
- 공통 삽화는 lazy loading / async decoding을 사용한다. HTML 크기는 실제 원본 크기를 선언한다.
- 각 업무의 제목·소개 옆에 배치한다. 검토·승인 영역, 긴급 비밀공작 사건, 중첩된 compact 제도 보드는 삽화를 생략해 주의 분산을 줄인다.
- PC 지원 슬롯은 화면 폭에 따라 132–224px이며 1920px에서는 약 180px, 2560px 이상에서는 224px이다. 원본 파일 해상도는 변하지 않는다.
- 실제 브라우저에서 발견한 기존 제목 CSS의 캡션 상속 충돌을 수정했다. 캡션은 11px, 밝은 국정 문서에는 어두운 색을 사용한다.
- 왕실 그림은 국적이 아니라 현재 정부 형태의 monarchy 값에 따른다.
- 기존 3종 전시 지휘실은 1936–1959년에만 사용한다. 후기 지휘실은 별도의 연도 범위를 검사하고, 2035년 이후는 미래의 상징적 표현이라는 설명을 추가한다.
- 한국 시작 안내는 실제 시작 연도 1942를 명시해 독립운동 삽화의 시대 gate를 통과한다.
- 전선 위치·국경·실존 인물 외모·승전·조약 성립·선거 결과·재건 완료를 생성 이미지로 대신 판단하지 않는다.

## 자동 검증

**24개 파일 / 935개 테스트 통과. 기존 테스트와 이번 추가 회귀를 함께 실행한 수치이며, 935개를 새로 작성했다는 의미는 아니다.**

- 공통 삽화·시대 지휘실·합동군·보건: 5개 파일, 200개.
- 조직·영입·정보·재정·연구·장비: 8개 파일, 241개.
- 외교·국정·헌정·사법·정부형태·한국: 11개 파일, 494개.
- unknown / prototype 키, 잘못된 연도와 경계 연도, 24개 고유 파일, 읽기 전용 표시, 실제 게임 상태·콜백 보존, compact 생략, 8종 정부 형태, 한국 보직 3개, 중첩 그림 방지 포함.
- 최종 npm run build 통과: 2,087 modules. 기존 대형 메인 JS 청크는 이번 작업의 개선 범위 밖이다.
- git diff --check 통과.

## 실제 브라우저 검증

별도 테스트 브라우저 세션에서 영국 최고 정치 보직으로 새 캠페인을 만들고, 튜토리얼을 건너뛴 후 메뉴를 이동했다. 사용자 저장 데이터와 분리된 테스트 세션이며 정책·영입·명령을 승인하지 않았다.

- 1920×1080: 참모, 후보 시장, 외교, 조약, 재정 요약, 공군, 생산, 연구, 장비, 국정 데스크.
- 2560×1440: 기업 투자, 정보국, 보건.
- 3840×2160: 해군.
- 확인한 모든 그림 naturalWidth 2048. 각 대표 조합에서 document.scrollWidth가 viewport 폭과 같아 가로 넘침 없음.
- 캡션 수정 후 실제 computed font-size 11px 확인. 국정 데스크 밝은 문서의 캡션 색은 rgb(76,93,104).
- 최종 브라우저 오류 목록 비어 있음.
- 이는 대표 화면·해상도 조합 검증이다. 모든 화면과 모든 시대·국가를 브라우저에서 교차 실행한 전수 검증은 아니다. 후기 시대, 왕정·사회주의·민간인 분기는 컴포넌트 테스트로 검증했다.

### 캡처

- [참모 · 1080p](higgsfield-wide-staff-1080.png)
- [외교 · 1080p](higgsfield-wide-diplomacy-1080.png)
- [조약 · 1080p](higgsfield-wide-treaty-1080.png)
- [기업 투자 · 1440p](higgsfield-wide-finance-1440.png)
- [보건 · 1440p](higgsfield-wide-health-1440.png)
- [해군 · 4K](higgsfield-wide-naval-4k.png)
- [생산 · 1080p](higgsfield-wide-production-1080.png)
- [장비 · 1080p](higgsfield-wide-equipment-1080.png)
- [국정 · 1080p](higgsfield-wide-nation-1080.png)

## 범위 밖

모든 실존 인물의 초상, 개별 역사 사건 전용 그림, 국가별·시대별 모든 문화권 사무실, 도시 파괴·재건의 상태별 쌍, 지도 지형, 영상·애니메이션을 전부 완성한 작업은 아니다. 해당 항목은 실제 데이터·사료·상태와의 연결을 별도로 설계해야 한다.

로컬 확인: http://127.0.0.1:4197/ (프시케의 4173 포트는 사용하지 않음).
