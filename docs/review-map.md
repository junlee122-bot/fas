# 확장 브랜치 리뷰 지도

기준: `0b477e65cc55570bbc757dea4a11a7a1d3580030`의 v0.22.0. [PR #1](https://github.com/junlee122-bot/fas/pull/1)은 여러 시스템을 함께 확장한 draft입니다. 아래는 **의존성 순서로 읽을 논리적 범위**이며, 독립 커밋이나 그대로 cherry-pick할 수 있는 분할이 아닙니다. 공통 타입, 저장 스키마, `App.tsx` 배선이 교차하므로 실제 분할에는 별도 구현·검증이 필요합니다. [개발 상태](development-status.md)에서 구현·병합·CI·배포의 증거를 구분합니다.

각 범위에서는 타입/데이터 → 순수 엔진 → 집중 테스트 → App 연결 → PC 화면 순서로 읽습니다. 아래 경로는 저장소 루트 기준입니다. 집중 테스트는 `npm test -- --maxWorkers=1 <테스트 경로들>`로 실행하며, 전체 `npm run ci`를 대체하지 않습니다. 표의 검토 항목은 검토 지침이지 검토 완료 주장이나 새 플레이테스트 결과가 아닙니다.

## 1. CI와 배포 경계

경로: `package.json`, `.github/workflows/validate.yml`, `.github/workflows/deploy-pages.yml`.

Node 22 / `npm ci` / fail-fast `npm run ci`가 로컬과 원격에서 같은 순서인지 확인합니다. `lint`는 `typecheck` 별칭입니다. draft PR도 검사하고, 실패를 무시하는 설정은 없어야 합니다. 게시 브랜치 push는 재사용 검증을 거쳐야 하며 build는 검증 성공과 정확한 게시 ref를 모두 요구합니다. deploy는 build에 의존합니다. 게시 ref의 `pages` concurrency와 다른 ref의 격리가 중요합니다. 수동 실행으로 이 경계를 시험하려고 실제 배포를 시작하지 않습니다. 게이트 활성화에는 승인된 병합이 필요하며 이 문서는 보호 규칙 변경을 제안하지 않습니다.

## 2. 캠페인·저장·시간: 모든 시스템의 기반

경로: `src/types.ts`, `src/campaign.ts`, `src/campaignCalendar.ts`, `src/save.ts`, `src/timeCadence.ts`, `src/strategicContinuity.ts`, `src/TimeCommandCenter.tsx`, `src/SaveCenter.tsx`.

집중 테스트: `src/campaign.test.ts`, `src/campaignCalendar.test.ts`, `src/save.test.ts`, `src/timeCadence.test.ts`, `src/strategicContinuity.test.ts`, `src/TimeCommandCenter.test.tsx`.

국가/보직/주차 식별자, 과거 저장의 기본값과 신규 데이터 병합, 자동·수동 저장의 일관성을 먼저 확인합니다. 한 주 정산은 한 번만 일어나야 하며 위기와 결재는 자동 시간을 멈춰야 합니다. 전쟁→국가 단계 전환과 복원에서도 같은 인물·자원·영토·시간을 이어야 합니다. 아래 모든 범위는 이 계약에 의존합니다.

## 3. 지리·지도·경로

경로: `src/territoryGeography.ts`, `src/geographicProjection.ts`, `src/geographicRoutes.ts`, `src/mapRoutes.ts`, `src/mapRegions.ts`, `src/landCorridors.ts`, `src/landCorridorsAsia.ts`, `src/landCorridorsEurope.ts`, `src/landCorridorsMediterranean.ts`, `src/straitCrossings.ts`, `src/strategicMapData.ts`, `src/GeographicBasemap.tsx`.

집중 테스트: `src/territoryGeography.test.ts`, `src/geographicRoutes.test.ts`, `src/mapRoutes.test.ts`, `src/landCorridors.test.ts`, `src/straitCrossings.test.ts`; 별도로 `npm run test:land-geography`, `npm run audit:land-geography`.

캠페인 영토 ID와 투영 좌표, 실제 육상 연결·해협 규칙을 일치시킵니다. 지도 표시선이 통행 허가나 실제 이동 가능성의 증거로 둔갑하면 안 됩니다. 육상 전투, 재배치, 해상 항로, 외교 접근권이 이 지리 기반을 함께 사용합니다.

## 4. 외교·접근권: 작전의 공통 선행 조건

경로: `src/diplomacy.ts`, `src/militaryAccess.ts`, `src/territorialConsent.ts`, `src/territorialTreaties.ts`, `src/territorialTreatyIntegration.ts`, `src/DiplomacyDesk.tsx`, `src/MilitaryAccessBoard.tsx`.

집중 테스트: `src/diplomacy.test.ts`, `src/militaryAccess.test.ts`, `src/territorialConsent.test.ts`, `src/territorialTreaties.test.ts`, `src/territorialTreatyIntegration.test.ts`.

2–3번의 국가/영토/시간을 사용합니다. 소유권·통제권·통과권·주둔권을 구분하고, 승인 시점뿐 아니라 실행 주차의 권한·만료·철회를 확인합니다. 외교 행동의 비용과 영토 변경은 한 번만 정산되어야 합니다. 육해공 이동과 정치적 정착이 이 계약을 소비합니다.

## 5. 육상 전투·명령·AI

경로: `src/engine.ts`, `src/combat.ts`, `src/operations.ts`, `src/landOperations.ts`, `src/landRedeployment.ts`, `src/landPositionRecovery.ts`, `src/enemyStrategy.ts`, `src/OffensivePlanningModal.tsx`, `src/LandRedeploymentPlanner.tsx`.

집중 테스트: `src/combat.test.ts`, `src/landOperations.test.ts`, `src/landRedeployment.test.ts`, `src/landPositionRecovery.test.ts`, `src/enemyStrategy.test.ts`, `src/offensiveWorkflow.test.ts`, `src/operationForecast.test.ts`.

2–4번 위에서 승인 시 태세·목표를 명령에 고정하고, 실행 시 병력 위치·접촉선·보급·권한을 재검사합니다. 예측과 실제 전투는 같은 입력 계약을 사용해야 합니다. 중복 승인, 취소/재시도, 중단 영수증, 이동 중인 부대의 중복 투입, AI의 불가능한 경로를 확인합니다. 7번의 장비·경제 보정도 함께 검토합니다.

## 6. 해군·공군·수송

경로: `src/jointOperations.ts`, `src/navalNavigation.ts`, `src/navalCorridors.ts`, `src/seaTransport.ts`, `src/seaTransportPlanning.ts`, `src/seaTransportIntegration.ts`, `src/enemyMaritime.ts`, `src/SeaTransportBoard.tsx`, `src/EnemyMaritimeBoard.tsx`.

집중 테스트: `src/jointOperations.test.ts`, `src/navalNavigation.test.ts`, `src/navalRouteContinuity.test.ts`, `src/navalRouteGeometry.test.ts`, `src/seaTransport.test.ts`, `src/seaTransportIntegration.test.ts`, `src/enemyMaritime.test.ts`, `src/maritimeCampaign.test.ts`.

2–5번의 시간·지리·접근권·육상 위치 계약에 의존합니다. 함대/항공대/승선 부대의 예약과 가용 상태가 중복되지 않아야 합니다. 승선 중 육상 전투 제외, 실제 해안 위치에 따른 적 상륙, 호위·구조·귀항·상륙 정산, 경로 단절과 접근권 철회를 확인합니다. 저장 복원 시 예약을 재조정하고 평시 전환 때 작전을 정리하는 App 순서까지 읽습니다.

## 7. 경제·장비·생산·물류

경로: `src/economy.ts`, `src/equipment.ts`, `src/unitEquipmentIssue.ts`, `src/regionalIndustry.ts`, `src/regionalIndustrySettlement.ts`, `src/postwarIndustry.ts`, `src/postwarIndustrySettlement.ts`, `src/staffDeliveryPledges.ts`, `src/deliveryGoalTrace.ts`, `src/ProductionDesk.tsx`, `src/UnitEquipmentIssuePanel.tsx`.

집중 테스트: `src/economy.test.ts`, `src/equipment.test.ts`, `src/unitEquipmentIssue.test.ts`, `src/regionalIndustrySettlement.test.ts`, `src/postwarIndustrySettlement.test.ts`, `src/staffDeliveryPledges.test.ts`, `src/deliveryGoalTrace.test.ts`, `src/RegionalLogisticsNavigation.test.tsx`.

2번의 주간 정산을 기반으로 4–6번의 접근권·운송 결과를 소비합니다. 생산→예약→배송→재고→부대 지급의 수량 보존, 중복 차감/중복 지급 방지, 취소 시 예약 반환, 승인 비용과 유지비를 확인합니다. 경제/장비 보정은 5–6번 전투 입력에 되먹임되므로 UI 표시와 실제 정산을 함께 대조합니다.

## 8. 정치·제도·국가 운영

경로: `src/nationManagement.ts`, `src/nationalSimulation.ts`, `src/politicalCrisis.ts`, `src/politicalSettlement.ts`, `src/politicalSettlementAuthority.ts`, `src/constitutionalJudiciary.ts`, `src/electoralPolitics.ts`, `src/justiceSystem.ts`, `src/sovereignPowers.ts`.

집중 테스트: `src/nationManagement.test.ts`, `src/nationalSimulation.test.ts`, `src/politicalCrisis.test.ts`, `src/politicalSettlementAuthority.test.ts`, `src/constitutionalJudiciary.test.ts`, `src/electoralPolitics.test.ts`, `src/justiceSystem.test.ts`.

2·4·7번의 캠페인·권한·재정과 연결됩니다. 보직별 권한, 정책 비용과 민생 영향, 쿠데타·선거·사법 결정의 확정/예측 구분을 확인합니다. 위기 모달 동안 시간은 멈추고 정권 교체나 전후 전환이 저장·국경·재정의 연속성을 끊지 않아야 합니다.

## 9. 인물·조직·커리어

경로: `src/historicalPersonnel.ts`, `src/recruitment.ts`, `src/personnelActions.ts`, `src/staffManagement.ts`, `src/staffOrganization.ts`, `src/staffWorkReport.ts`, `src/careerMarket.ts`, `src/laterEraFigures.ts`, `src/intelligenceHistory.ts`, `src/OrganizationPanel.tsx`.

집중 테스트: `src/personnelActions.test.ts`, `src/recruitment.test.ts`, `src/staffManagement.test.ts`, `src/staffOrganization.test.ts`, `src/staffWorkReport.test.ts`, `src/careerMarket.test.ts`, `src/laterEraFigures.test.ts`, `src/intelligenceHistory.test.ts`.

2·7·8번의 달력·급여·인사권에 의존합니다. 실제 인물 ID, 성인 이전 등장 차단, 기관 활동 연도, 조사와 확정 정보 구분, 임명 검토/재승인과 비용의 단일 적용을 확인합니다. 계약·약속·충성·업무 결과는 저장과 주간 결산에 모두 연결되어야 합니다. 사료상의 사실과 가상 능력치를 혼동하지 않습니다.

## 10. 역사·세계선·장기 연속성

경로: `src/worldHistory.ts`, `src/emergentHistory.ts`, `src/historicalEndings.ts`, `src/livingWorld.ts`, `src/strategicArmsDiplomacy.ts`, `src/centuryPlaytest.ts`, `src/WorldHistoryAtlas.tsx`.

집중 테스트: `src/worldHistory.test.ts`, `src/emergentHistory.test.ts`, `src/historicalEndings.test.ts`, `src/livingWorld.test.ts`, `src/strategicArmsDiplomacy.test.ts`, `src/centuryPlaytest.test.ts`, `src/longHorizonPlaytest.test.ts`.

2·4–9번의 실제 결정·성과가 원인입니다. 전망을 확정 분기로 저장하지 않는지, 세계 위기 중 시간이 멈추는지, 재접속으로 이미 확정된 결과를 재추첨하지 않는지 확인합니다. 역사 출처와 가상 분기·결말을 분리하고 장기 캠페인에서도 인물·기관·장비의 연도 제약을 유지합니다.

## 11. 테스트·증거·자산

경로: `src/possibilityRemediationArtifacts.test.ts`, `src/armsDiplomacyArtifacts.test.ts`, `scripts/`, `docs/`, `src/assets/`, `public/`.

집중 테스트: 위 artifact 테스트 두 개와 `src/armsDiplomacyPlaytest.test.ts`, `src/possibilityMatrixPlaytest.test.ts`, `src/GameIllustration.test.tsx`, `src/historicalMaps.test.ts`.

다음은 보존이 필요한 테스트 입력입니다. 단순히 큰 보고서라는 이유로 삭제하지 않습니다.

- `docs/possibility-matrix-3000-2060-summary.json`
- `docs/possibility-matrix-weekly-anchor-13-2060-summary.json`
- `docs/arms-diplomacy-stage-1000-2060-summary.json`
- `docs/arms-diplomacy-stage-1000-2060-nations/` 아래 각 국가의 `*-1000-per-stage.md`, `*-1000-per-stage-summary.json`, `*-1000-per-stage-data.json.gz`

artifact 테스트는 기존 39,000/65,000-session 자료의 계약을 검사합니다. 통과가 그 시뮬레이션 전체를 방금 재실행했다는 뜻은 아닙니다. 스크린샷도 촬영 당시의 증거입니다. 자산 출처·참조 경로와 Pages `/fas/` 경로를 확인하고, 기존 큰 chunk 경고와 새로운 실패를 구분합니다.

## 12. App 연결과 PC 통합

경로: `src/App.tsx`, `src/CommandDashboard.tsx`, `src/CommandDesk.tsx`, `src/WeeklyBriefingDialog.tsx`, `src/TimeCommandCenter.tsx`, `src/SaveCenter.tsx`, `src/styles.css`, `src/design-system.css`.

집중 테스트: `src/headquartersActionGuard.test.ts`, `src/CommandDesk.test.tsx`, `src/WeeklyBriefingDialog.test.tsx`, `src/TimeCommandCenter.test.tsx`, `src/MaritimeDesktop.test.tsx`, `src/ux.test.ts`.

1–11번을 통합하는 최종 범위입니다. `App.tsx`는 파일 전체를 하나의 기능으로 승인하지 말고 아래 연결을 각 시스템과 왕복해서 읽습니다.

- **imports / 타입:** 엔진·뷰·lazy 화면이 어떤 공통 타입과 컨텍스트를 공유하는가.
- **state / refs:** React state와 즉시 갱신 ref의 소유권, 초기화와 중복 행동 방지 키가 일치하는가.
- **handlers:** 승인 직전 최신 자원·권한·예약 상태를 검사하고 비용·영수증을 한 번만 적용하는가.
- **주간 정산:** `advanceWeek`의 중복 방지 → 해상/적 해상 위치와 예약 처리 → 전쟁/국가 분기 → 육상·생산·국가 공급 정산의 순서와 데이터 전달을 추적한다. 보너스나 차감이 별도 분기에서 반복되지 않는가.
- **normalization:** 복원된 주문·인사·접근권·수송·함대 예약을 각 normalize/reconcile 함수로 일관되게 정리하는가.
- **save/load:** 자동 저장 payload, 수동 슬롯, 불러오기와 새 캠페인 초기화가 같은 필드를 처리하는가.
- **props:** 각 화면의 onApprove/onCancel류 콜백, 비활성 사유와 미리보기 값이 실제 실행 컨텍스트를 반영하는가. 단순 렌더링 테스트가 실조작 검증을 대신하지 않음을 기록한다.

### 후속 PC 실조작 체크리스트

아래는 실행 전인 검토 항목입니다. 수행하면 viewport, 브라우저, head SHA와 결과를 별도 기록합니다.

- [ ] 동일 승인 버튼을 연속 입력해 비용·명령·재고가 한 번만 적용되는지 확인한다.
- [ ] 승인/운송/지급을 취소한 뒤 재시도해 예약과 비활성 사유가 회복되는지 확인한다.
- [ ] 수동 저장·자동 저장·새로고침·복원 후 진행 중 명령과 예약을 대조한다.
- [ ] 위기·결재·기간 진행 중 일시정지, Space/Esc, 모달 닫기/재열기로 원치 않는 주차 진행이 없는지 확인한다.
- [ ] 승선→운송→상륙, 호위/구조/귀항과 권한 만료를 확인하고 같은 부대가 육상에 중복 참여하지 않는지 확인한다.
- [ ] 전쟁→국가 운영 전환 후 자원·국경·인물·부대 위치·미완료 운송·저장이 이어지는지 확인한다.
- [ ] PC 큰 화면에서 마우스·키보드 탐색, 긴 목록, 지도 확대/이동, 가독성과 패널 겹침을 확인한다. 모바일 점검은 이번 우선순위에 포함하지 않는다.
